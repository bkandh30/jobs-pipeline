"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/auth";
import { db } from "../db";
import { boards, columns, jobApplications } from "../db/schema";
import { eq, and, asc, max } from "drizzle-orm";
import { toBoard, type Board } from "@/lib/types";


// Get the user's board
export async function getUserBoard(): Promise<Board | null> {
    const session = await getSession();

    if (!session?.user) {
        return null;
    }

    const board = await db.query.boards.findFirst({
        where: eq(boards.userId, session.user.id),
        with: {
            columns: {
                orderBy: [asc(columns.order)],
                with: {
                    jobApplications: {
                        orderBy: [asc(jobApplications.order)],
                    }
                }
            }
        }
    });

    if (!board)
        return null;

    return toBoard(board, board.columns);
}

// Create a new job application
interface JobApplicationData {
    company: string;
    position: string;
    location?: string;
    notes?: string;
    salary?: string;
    jobUrl?: string;
    columnId: string;
    boardId: string;
    tags?: string[];
    description?: string;
}

export async function createJobApplication(data: JobApplicationData) {
    const session = await getSession();

    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const {
        company,
        position,
        location,
        notes,
        salary,
        jobUrl,
        columnId,
        boardId,
        tags,
        description,
    } = data;
    
    if (!company || !position || !columnId || !boardId) {
        return { error: "Missing required fields" };
    }

    const board = await db.query.boards.findFirst({
        where: and(eq(boards.id, boardId), eq(boards.userId, session.user.id)),
    });

    if (!board) {
        return { error: "Board not found" };
    }

    const column = await db.query.columns.findFirst({
        where: and(eq(columns.id, columnId), eq(columns.boardId, boardId)),
    });

    if (!column) {
        return { error: "Column not found" };
    }

    const [maxOrderResult] = await db.select({ maxOrder: max(jobApplications.order) })
        .from(jobApplications)
        .where(eq(jobApplications.columnId, columnId));

    const newOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

    const [jobApplication] = await db.insert(jobApplications).values({
        company,
        position,
        location,
        notes,
        salary,
        jobUrl,
        columnId,
        boardId,
        userId: session.user.id,
        tags: tags || [],
        description,
        status: "applied",
        order: newOrder,
    }).returning();

    revalidatePath("/dashboard");
    
    return {
        data: jobApplication,
    };
}

// Update a job application
export async function updateJobApplication(id: string, updates: {
    company?: string;
    position?: string;
    location?: string;
    notes?: string;
    salary?: string;
    jobUrl?: string;
    columnId?: string;
    order?: number;
    tags?: string[];
    description?: string;
}) {
    const session = await getSession();

    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const jobApplication = await db.query.jobApplications.findFirst({
        where: eq(jobApplications.id, id),
    });

    if (!jobApplication) {
        return { error: "Job application not found" };
    }

    if (jobApplication.userId !== session.user.id) {
        return { error: "Unauthorized" };
    }

    const { columnId, order, ...otherUpdates } = updates;

    const updatesToApply: Record<string, unknown> = { ...otherUpdates };

    const currentColumnId = jobApplication.columnId;
    const newColumnId = columnId;

    const isMovingToDifferentColumn = newColumnId && newColumnId !== currentColumnId;

    if (isMovingToDifferentColumn) {
        const jobsInTargetColumn = await db.query.jobApplications.findMany({
            where: and(
                eq(jobApplications.columnId, newColumnId),
                eq(jobApplications.userId, session.user.id),
            ),
            orderBy: [asc(jobApplications.order)],
        });

        let newOrderValue: number;

        if (order !== undefined && order != null) {
            newOrderValue = order * 100;

            const jobsThatNeedToShift = jobsInTargetColumn.slice(order);

            for (const job of jobsThatNeedToShift) {
                await db
                    .update(jobApplications)
                    .set({ order: job.order + 100 })
                    .where(eq(jobApplications.id, job.id));
            }
        } else {
            if (jobsInTargetColumn.length > 0) {
                const lastJobOrder = jobsInTargetColumn[jobsInTargetColumn.length - 1].order || 0;
                newOrderValue = lastJobOrder + 100;
            } else {
                newOrderValue = 0;
            }
        }

        updatesToApply.columnId = newColumnId;
        updatesToApply.order = newOrderValue;
    } else if (order !== undefined && order !== null) {
        const otherJobsInColumn = await db.query.jobApplications.findMany({
            where: and(
                eq(jobApplications.columnId, currentColumnId),
                eq(jobApplications.userId, session.user.id)
            ),
            orderBy: [asc(jobApplications.order)],
        });

        const filteredJobs = otherJobsInColumn.filter((job) => job.id !== id);
        const currentJobOrder = jobApplication.order || 0;
        const currentPositionIndex = filteredJobs.findIndex((job) => job.order > currentJobOrder);
        const oldPositionIndex = currentPositionIndex === -1 ? filteredJobs.length : currentPositionIndex;

        const newOrderValue = order * 100;

        if (order < oldPositionIndex) {
            const jobsToShiftDown = filteredJobs.slice(order, oldPositionIndex);
            for (const job of jobsToShiftDown) {
                await db.update(jobApplications).set({
                    order: job.order + 100
                }).where(eq(jobApplications.id, job.id));
            }
        } else if (order > oldPositionIndex) {
            const jobsToShiftUp = filteredJobs.slice(oldPositionIndex, order);
            for (const job of jobsToShiftUp) {
                const newOrder = Math.max(0, job.order - 100);
                await db.update(jobApplications).set({
                    order: newOrder
                }).where(eq(jobApplications.id, job.id));
            }
        }

        updatesToApply.order = newOrderValue;
    }

    const [updated] =  await db.update(jobApplications).set({
        ...updatesToApply,
        updatedAt: new Date(),
    })
    .where(eq(jobApplications.id, id))
    .returning();

    revalidatePath("/dashboard");

    return {
        data: updated,
    }
}

// Delete a job application
export async function deleteJobApplication(id: string) {
    const session = await getSession();

    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const jobApplication = await db.query.jobApplications.findFirst({
        where: eq(jobApplications.id, id),
    });

    if (!jobApplication) {
        return { error: "Job application not found" };
    }

    if (jobApplication.userId !== session.user.id) {
        return { error: "Unauthorized" };
    }

    await db.delete(jobApplications).where(eq(jobApplications.id, id));

    revalidatePath("/dashboard");

    return {
        success: true
    };
}
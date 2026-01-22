import type { Board as DrizzleBoard, Column as DrizzleColumn, JobApplication as DrizzleJobApplication } from "@/lib/db/schema";

export interface JobApplication {
    id: string;
    company: string;
    position: string;
    location?: string | null;
    status: string;
    notes?: string | null;
    salary?: string | null;
    jobUrl?: string | null;
    order: number;
    columnId?: string;
    tags?: string[] | null;
    description?: string | null;
}

export interface Column {
    id: string;
    name: string;
    order: number;
    jobApplications: JobApplication[];
}

export interface Board {
    id: string;
    name: string;
    columns: Column[];
}

export function toJobApplication(job: DrizzleJobApplication): JobApplication {
    return {
        id: job.id,
        company: job.company,
        position: job.position,
        status: job.status,
        notes: job.notes,
        salary: job.salary,
        jobUrl: job.jobUrl,
        order: job.order,
        columnId: job.columnId,
        tags: job.tags,
        description: job.description,
    };
}

export function toColumn(col: DrizzleColumn, jobs: DrizzleJobApplication[]): Column {
    return {
        id: col.id,
        name: col.name,
        order: col.order,
        jobApplications: jobs.map(toJobApplication),
    };
}

export function toBoard(board: DrizzleBoard, columns: Array<DrizzleColumn & { jobApplications: DrizzleJobApplication[] }>): Board {
    return {
        id: board.id,
        name: board.name,
        columns: columns.map((col) => toColumn(col, col.jobApplications || [])),
    };
}
import { db } from "./db";
import { boards, columns } from "./db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_COLUMNS = [
    { name: "Wish List", order: 0 },
    { name: "Applied", order: 1 },
    { name: "Interviewing", order: 2 },
    { name: "Offer", order: 3 },
    { name: "Rejected", order: 4 },
];

export async function initUserBoard(userId: string) {
    const existingBoard = await db.query.boards.findFirst({
        where: eq(boards.userId, userId),
    });

    if (existingBoard) {
        return existingBoard;
    }
    
    const [board] = await db.insert(boards).values({
        userId,
        name: "Job Hunt",
    }).returning();

    await db.insert(columns).values(DEFAULT_COLUMNS.map((col) => ({
        boardId: board.id,
        name: col.name,
        order: col.order,
    })));

    return board;
}
import { relations } from "drizzle-orm";
import { pgTable, text, boolean, timestamp, uuid, integer } from "drizzle-orm/pg-core";

// Authentication Tables
export const users = pgTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull().unique(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verificationTokens = pgTable("verification_tokens", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Job Application Tables
export const boards = pgTable("boards", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Job Hunt"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const columns = pgTable("columns", {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    boardId: uuid("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
    columnId: uuid("column_id").notNull().references(() => columns.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    position: text("position").notNull(),
    location: text("location"),
    description: text("description"),
    jobUrl: text("job_url"),
    salary: text("salary"),
    notes: text("notes"),
    tags: text("tags").array(),
    status: text("status").notNull().default("applied"),
    order: integer("order").notNull().default(0),
    appliedDate: timestamp("applied_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
    boards: many(boards),
    jobApplications: many(jobApplications),
    sessions: many(sessions),
    accounts: many(accounts),
}));

export const boardRelations = relations(boards, ({ one, many }) => ({
    user: one(users, {
        fields: [boards.userId],
        references: [users.id],
    }),
    columns: many(columns),
    jobApplications: many(jobApplications),
}));

export const columnRelations = relations(columns, ({ one, many }) => ({
    board: one(boards, {
        fields: [columns.boardId],
        references: [boards.id],
    }),
    jobApplications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
    user: one(users, {
        fields: [jobApplications.userId],
        references: [users.id],
    }),
    board: one(boards, {
        fields: [jobApplications.boardId],
        references: [boards.id],
    }),
    column: one(columns, {
        fields: [jobApplications.columnId],
        references: [columns.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type Column = typeof columns.$inferSelect;
export type NewColumn = typeof columns.$inferInsert;

export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;
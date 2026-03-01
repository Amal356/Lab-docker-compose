import { pgTable, text, serial, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("todo"), // e.g., 'todo', 'in_progress', 'done'
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;
export type TaskResponse = Task;
export type TasksListResponse = Task[];

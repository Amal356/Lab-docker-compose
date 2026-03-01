import { z } from "zod";
import { insertTaskSchema, tasks } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  tasks: {
    list: {
      method: "GET" as const,
      path: "/api/tasks" as const,
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/tasks/:id" as const,
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/tasks" as const,
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/tasks/:id" as const,
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/tasks/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  health: {
    check: {
      method: "GET" as const,
      path: "/health" as const,
      responses: {
        200: z.object({
          status: z.string(),
        }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type TaskInput = z.infer<typeof api.tasks.create.input>;
export type TaskResponse = z.infer<typeof api.tasks.create.responses[201]>;
export type TaskUpdateInput = z.infer<typeof api.tasks.update.input>;
export type TasksListResponse = z.infer<typeof api.tasks.list.responses[200]>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;

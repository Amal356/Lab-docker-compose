import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.health.check.path, (req, res) => {
    res.json({ status: "ok" });
  });

  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.get(api.tasks.get.path, async (req, res) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put(api.tasks.update.path, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), input);
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.tasks.delete.path, async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).end();
  });

  // Seed data for the UI with retry logic
  const seedTasks = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const existingTasks = await storage.getTasks();
        if (existingTasks.length === 0) {
          await storage.createTask({
            title: "Configurer Docker",
            description: "Créer les Dockerfiles et le docker-compose.yml",
            status: "in_progress",
          });
          await storage.createTask({
            title: "Créer le frontend React",
            description: "Implémenter la liste des tâches avec Shadcn UI",
            status: "todo",
          });
          await storage.createTask({
            title: "Créer le backend Express",
            description: "Implémenter l'API REST",
            status: "done",
          });
          log("Tasks seeded successfully");
        }
        return; // Success
      } catch (error) {
        log(`Seed attempt ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    console.error("All seed attempts failed");
  };

  seedTasks();

  return httpServer;
}

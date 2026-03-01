import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasks } from "@/hooks/use-tasks";
import type { Task } from "@shared/schema";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/task-form";
import { Button } from "@/components/ui/button";
import { Plus, ListTodo, Layers, CheckSquare, Loader2, Sparkles } from "lucide-react";

export default function Home() {
  const { data: tasks, isLoading, error } = useTasks();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<"todo" | "in_progress" | "done">("todo");

  const openForm = (task: Task | null = null, status: "todo" | "in_progress" | "done" = "todo") => {
    setEditingTask(task);
    setDefaultStatus(status);
    setFormOpen(true);
  };

  const groupedTasks = useMemo(() => {
    if (!tasks) return { todo: [], in_progress: [], done: [] };
    return {
      todo: tasks.filter(t => t.status === "todo"),
      in_progress: tasks.filter(t => t.status === "in_progress"),
      done: tasks.filter(t => t.status === "done"),
    };
  }, [tasks]);

  const columns = [
    { id: "todo" as const, title: "À faire", icon: ListTodo, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-200" },
    { id: "in_progress" as const, title: "En cours", icon: Layers, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200" },
    { id: "done" as const, title: "Terminé", icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-200" },
  ];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md w-full glass-panel p-8 rounded-3xl">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display">Oups ! Quelque chose s'est mal passé</h2>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : "Échec du chargement des tâches"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
      >
        <div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-foreground">
            Gestionnaire de <span className="text-primary">Tâches</span>
          </h1>
        </div>
        
        <Button 
          onClick={() => openForm(null, "todo")}
          className="rounded-xl px-6 py-6 h-auto text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all bg-gradient-to-r from-primary to-primary/90"
        >
          <Plus className="mr-2 w-5 h-5" />
          Nouvelle Tâche
        </Button>
      </motion.header>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-muted-foreground space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-medium animate-pulse">Loading your tasks...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {columns.map((column) => (
            <motion.div 
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col h-full max-h-[calc(100vh-12rem)]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${column.bg} ${column.color}`}>
                    <column.icon className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-lg font-display">{column.title}</h2>
                </div>
                <div className="bg-muted px-2.5 py-1 rounded-full text-sm font-semibold text-muted-foreground">
                  {groupedTasks[column.id].length}
                </div>
              </div>

              {/* Column Content */}
              <div className={`flex-1 glass-panel rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto column-scroll ${column.border}`}>
                <AnimatePresence mode="popLayout">
                  {groupedTasks[column.id].length > 0 ? (
                    groupedTasks[column.id].map((task) => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onEdit={(t) => openForm(t, column.id)} 
                      />
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-32 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-border/50 rounded-2xl"
                    >
                      <p className="text-muted-foreground text-sm font-medium">Aucune tâche ici</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Add Button per column */}
                <Button 
                  variant="ghost" 
                  className="w-full mt-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50 border-dashed transition-all"
                  onClick={() => openForm(null, column.id)}
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Ajouter à {column.title}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        task={editingTask}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}

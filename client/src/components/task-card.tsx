import { useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, Edit2, Trash2, ArrowRightCircle, CheckCircle2, Clock, Circle } from "lucide-react";
import type { Task } from "@shared/schema";
import { useDeleteTask, useUpdateTask } from "@/hooks/use-tasks";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { toast } = useToast();
  const deleteMutation = useDeleteTask();
  const updateMutation = useUpdateTask();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const statusConfig = {
    todo: { 
      label: "À faire", 
      icon: Circle, 
      color: "text-slate-500", 
      bg: "bg-slate-100 dark:bg-slate-800",
      border: "border-slate-200 dark:border-slate-700" 
    },
    in_progress: { 
      label: "En cours", 
      icon: Clock, 
      color: "text-blue-500", 
      bg: "bg-blue-50 dark:bg-blue-900/30",
      border: "border-blue-200 dark:border-blue-800" 
    },
    done: { 
      label: "Terminé", 
      icon: CheckCircle2, 
      color: "text-emerald-500", 
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      border: "border-emerald-200 dark:border-emerald-800" 
    },
  };

  const currentStatus = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;
  const StatusIcon = currentStatus.icon;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(task.id);
      toast({ title: "Tâche supprimée" });
      setShowDeleteAlert(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Échec de la suppression de la tâche" });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === task.status) return;
    try {
      await updateMutation.mutateAsync({ id: task.id, status: newStatus });
      toast({ title: "Statut mis à jour" });
    } catch (error) {
      toast({ variant: "destructive", title: "Échec de la mise à jour du statut" });
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -4 }}
        className="group relative"
      >
        <Card className={`rounded-2xl border ${currentStatus.border} shadow-sm overflow-hidden bg-card transition-all duration-300 hover:shadow-lg`}>
          <div className={`absolute top-0 left-0 w-1 h-full ${currentStatus.bg}`} />
          
          <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
            <div className="space-y-1 pr-4">
              <h3 className="font-semibold leading-tight text-foreground/90 font-display text-lg">
                {task.title}
              </h3>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] rounded-xl">
                <DropdownMenuItem onClick={() => onEdit(task)} className="rounded-lg cursor-pointer">
                  <Edit2 className="mr-2 h-4 w-4" /> Modifier
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Déplacer vers
                </div>
                
                {task.status !== "todo" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("todo")} className="rounded-lg cursor-pointer">
                    <Circle className="mr-2 h-4 w-4 text-slate-500" /> À faire
                  </DropdownMenuItem>
                )}
                {task.status !== "in_progress" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("in_progress")} className="rounded-lg cursor-pointer">
                    <Clock className="mr-2 h-4 w-4 text-blue-500" /> En cours
                  </DropdownMenuItem>
                )}
                {task.status !== "done" && (
                  <DropdownMenuItem onClick={() => handleStatusChange("done")} className="rounded-lg cursor-pointer">
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Terminé
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => setShowDeleteAlert(true)} 
                  className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          
          {task.description && (
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {task.description}
              </p>
            </CardContent>
          )}
          
          <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-border/40 bg-muted/10">
            <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 border-transparent ${currentStatus.bg} ${currentStatus.color} font-medium text-xs flex items-center gap-1.5`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {currentStatus.label}
            </Badge>
          </CardFooter>
        </Card>
      </motion.div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="rounded-2xl border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl">Supprimer la tâche</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{task.title}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import type { Task } from "../types/task";

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggle: (taskId: string) => void;
};

export function TaskCard({ task, onEdit, onDelete, onToggle }: TaskCardProps) {
  const isCompleted = task.status === "COMPLETED";

  return (
    <article className="task-card">
      <div className="task-card-top">
        <div>
          <span className={`status-pill ${isCompleted ? "done" : "pending"}`}>
            {isCompleted ? "Completed" : "Pending"}
          </span>
          <h3>{task.title}</h3>
        </div>
        <button className="ghost-button" type="button" onClick={() => onToggle(task.id)}>
          Toggle
        </button>
      </div>

      <p className="task-description">{task.description || "No description provided."}</p>

      <div className="task-meta">
        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
        <div className="task-actions">
          <button className="secondary-button" type="button" onClick={() => onEdit(task)}>
            Edit
          </button>
          <button className="danger-button" type="button" onClick={() => onDelete(task.id)}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

import { useEffect, useState } from "react";

import type { Task, TaskStatus } from "../types/task";

type TaskFormProps = {
  initialTask?: Task | null;
  onSubmit: (payload: { title: string; description?: string; status: TaskStatus }) => Promise<void>;
  onCancel?: () => void;
};

export function TaskForm({ initialTask, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("PENDING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(initialTask?.title ?? "");
    setDescription(initialTask?.description ?? "");
    setStatus(initialTask?.status ?? "PENDING");
  }, [initialTask]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description: description || undefined,
        status,
      });

      if (!initialTask) {
        setTitle("");
        setDescription("");
        setStatus("PENDING");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form-grid">
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
        </label>

        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span>Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Add a short description"
        />
      </label>

      <div className="task-form-actions">
        {onCancel ? (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialTask ? "Update Task" : "Add Task"}
        </button>
      </div>
    </form>
  );
}

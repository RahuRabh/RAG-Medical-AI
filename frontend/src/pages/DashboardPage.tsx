import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  createTaskRequest,
  deleteTaskRequest,
  getTasks,
  type TaskFilters,
  toggleTaskRequest,
  updateTaskRequest,
} from "../api/tasks";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import { useAuth } from "../features/auth/useAuth";
import type { Task, TaskStatus } from "../types/task";

const PAGE_SIZE = 6;

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, user } = useAuth();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: PAGE_SIZE,
    status: "ALL",
    search: "",
  });

  const queryKey = useMemo(() => ["tasks", filters], [filters]);

  const tasksQuery = useQuery({
    queryKey,
    queryFn: () => getTasks(filters),
  });

  const createMutation = useMutation({
    mutationFn: createTaskRequest,
    onSuccess: () => {
      toast.success("Task created");
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: { title?: string; description?: string; status?: TaskStatus };
    }) => updateTaskRequest(taskId, payload),
    onSuccess: () => {
      toast.success("Task updated");
      setEditingTask(null);
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaskRequest,
    onSuccess: () => {
      toast.success("Task deleted");
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleTaskRequest,
    onSuccess: () => {
      toast.success("Task status updated");
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return (
    <main className="dashboard-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Task Dashboard</p>
          <h1>Keep work moving without losing the thread.</h1>
          <p className="hero-copy">
            Signed in as <strong>{user?.email}</strong>. Search quickly, filter by status, and keep your tasks tidy.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={async () => {
            await logout();
            toast.success("Logged out successfully");
            navigate("/login");
          }}
        >
          Log Out
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Create Task</p>
            <h2>{editingTask ? "Edit task" : "Add a new task"}</h2>
          </div>
        </div>
        <TaskForm
          initialTask={editingTask}
          onCancel={editingTask ? () => setEditingTask(null) : undefined}
          onSubmit={async (payload) => {
            if (editingTask) {
              await updateMutation.mutateAsync({
                taskId: editingTask.id,
                payload,
              });
              return;
            }

            await createMutation.mutateAsync(payload);
          }}
        />
      </section>

      <section className="panel">
        <div className="panel-header panel-header-stack">
          <div>
            <p className="eyebrow">Your Tasks</p>
            <h2>Search, filter, and manage</h2>
          </div>

          <div className="filter-bar">
            <input
              className="search-input"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                  page: 1,
                }))
              }
              placeholder="Search by title"
            />

            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as TaskFilters["status"],
                  page: 1,
                }))
              }
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {tasksQuery.isLoading ? <p>Loading tasks...</p> : null}

        {tasksQuery.data?.items.length ? (
          <>
            <div className="task-grid">
              {tasksQuery.data.items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={setEditingTask}
                  onDelete={async (taskId) => {
                    await deleteMutation.mutateAsync(taskId);
                  }}
                  onToggle={async (taskId) => {
                    await toggleMutation.mutateAsync(taskId);
                  }}
                />
              ))}
            </div>

            <div className="pagination-bar">
              <button
                type="button"
                className="secondary-button"
                disabled={filters.page === 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
              >
                Previous
              </button>
              <span>
                Page {tasksQuery.data.pagination.page} of {tasksQuery.data.pagination.totalPages}
              </span>
              <button
                type="button"
                className="secondary-button"
                disabled={filters.page >= tasksQuery.data.pagination.totalPages}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                Next
              </button>
            </div>
          </>
        ) : null}

        {!tasksQuery.isLoading && !tasksQuery.data?.items.length ? (
          <div className="empty-state">
            <h3>No tasks found</h3>
            <p>Try another search, switch the filter, or create your first task above.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

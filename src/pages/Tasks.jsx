import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { tasksApi } from "../services/api";
import { Button, Badge, Avatar, EmptyState, Skeleton } from "../components/UI";
import { TaskForm } from "../components/TaskForm";
import { priorityConfig, getDueDateLabel } from "../utils/helpers";
import { useToast } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import "./Tasks.css";

const STATUS_CONFIG = {
  pending: { label: "Open", color: "blue", bg: "bg-blue-100" },
  open: { label: "Open", color: "blue", bg: "bg-blue-100" },
  in_progress: { label: "In Progress", color: "purple", bg: "bg-purple-100" },
  completed: { label: "Completed", color: "green", bg: "bg-green-100" },
  closed: { label: "Completed", color: "green", bg: "bg-green-100" },
};

const normalizeStatus = (status) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (!normalized) return "pending";
  if (normalized === "open") return "pending";
  if (normalized === "closed") return "completed";
  return normalized;
};

const routeStatusFilter = (pathname) => {
  if (pathname === "/tasks/open") return "pending";
  if (pathname === "/tasks/in-progress") return "in_progress";
  if (pathname === "/tasks/completed") return "completed";
  return "";
};

export const TasksPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: "", priority: "" });
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    in_progress: 0,
    completed: 0,
  });

  const forcedStatus = routeStatusFilter(location.pathname);

  useEffect(() => {
    if (forcedStatus) {
      setFilters((prev) => ({ ...prev, status: forcedStatus }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [forcedStatus]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const listParams = {
        page: pagination.page,
        limit: 15,
        status: forcedStatus || filters.status || undefined,
        priority: filters.priority || undefined,
        assigned_to: user?.id || undefined,
      };

      const summaryParams = {
        page: 1,
        limit: 1000,
        assigned_to: user?.id || undefined,
      };

      const [res, summaryRes] = await Promise.all([
        tasksApi.list(listParams),
        tasksApi.list(summaryParams),
      ]);

      const taskList = res?.data || [];
      const summaryTasks = summaryRes?.data || [];

      setTasks(taskList);
      setPagination(res?.pagination || { page: 1, pages: 1, total: 0 });
      setStatusCounts({
        pending: summaryTasks.filter((t) => normalizeStatus(t.status) === "pending").length,
        in_progress: summaryTasks.filter((t) => normalizeStatus(t.status) === "in_progress").length,
        completed: summaryTasks.filter((t) => normalizeStatus(t.status) === "completed").length,
      });
    } catch (err) {
      toastRef.current(err.message || "Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, forcedStatus, filters.status, filters.priority, user?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return task.title?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q);
    });
  }, [tasks, search]);

  const totalCount = Math.max(pagination.total || 0, tasks.length);

  const handleFilterChange = (key, value) => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilters({ status: forcedStatus || "", priority: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreate = async (data) => {
    try {
      await tasksApi.create(data);
      toast("Task created", "success");
      setShowForm(false);
      loadTasks();
    } catch (err) {
      toast(err.message || "Failed to create task", "error");
    }
  };

  const handleUpdate = async (data) => {
    try {
      await tasksApi.update(editTask.id, data);
      toast("Task updated", "success");
      setEditTask(null);
      loadTasks();
    } catch {
      toast("Update failed", "error");
    }
  };

  const handleComplete = async (id) => {
    try {
      await tasksApi.complete(id);
      toast("Task completed", "success");
      loadTasks();
    } catch {
      toast("Failed to complete task", "error");
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await tasksApi.delete(task.id);
      toast("Task deleted", "info");
      loadTasks();
    } catch {
      toast("Delete failed", "error");
    }
  };

  return (
    <div className="tasks-page max-w-7xl mx-auto p-6">
      <div className="tasks-shell">
        <div className="tasks-topbar">
          <div>
            <h1 className="tasks-title">Tasks</h1>
            <p className="tasks-subtitle">
              {search || filters.status || filters.priority ? `${filteredTasks.length} of ${totalCount} tasks` : `${totalCount} tasks`}
            </p>
          </div>

          <Button variant="primary" onClick={() => setShowForm(true)}>
            New Task
          </Button>
        </div>

        <div className="tasks-stats-grid">
          <div className="tasks-stat-card">
            <span className="tasks-stat-label">Open</span>
            <strong className="tasks-stat-value">{statusCounts.pending}</strong>
          </div>
          <div className="tasks-stat-card">
            <span className="tasks-stat-label">In Progress</span>
            <strong className="tasks-stat-value">{statusCounts.in_progress}</strong>
          </div>
          <div className="tasks-stat-card">
            <span className="tasks-stat-label">Completed</span>
            <strong className="tasks-stat-value">{statusCounts.completed}</strong>
          </div>
        </div>

        <div className="tasks-panel">
          <div className="tasks-filter-bar">
            <div className="tasks-search-wrap">
              <input
                type="text"
                placeholder="Search by title or description"
                className="tasks-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="tasks-search-clear">
                  x
                </button>
              )}
            </div>

            <select
              className="tasks-select"
              value={forcedStatus || filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              disabled={!!forcedStatus}
            >
              <option value="">All Status</option>
              <option value="pending">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select
              className="tasks-select"
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
            >
              <option value="">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {(search || filters.priority || (!forcedStatus && filters.status)) && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>

          {loading ? (
            <div className="p-8">{[...Array(5)].map((_, i) => <Skeleton key={i} height={64} className="mb-3" />)}</div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              title="No tasks found"
              description="Try adjusting filters or create a new task"
              action={<Button variant="primary" onClick={() => setShowForm(true)}>Create Task</Button>}
            />
          ) : (
            <>
              <div className="tasks-table-wrap">
                <table className="tasks-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Assignee</th>
                      <th>Due</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => {
                      const normalizedStatus = normalizeStatus(task.status);
                      const status = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;
                      const priority = priorityConfig[task.priority] || priorityConfig.medium;
                      const due = getDueDateLabel(task.due_date);
                      const pendingSubtasks = Number(task.pending_subtasks || 0);
                      const hasSubtasks = pendingSubtasks > 0;

                      return (
                        <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`)}>
                          <td>
                            <div className="task-cell">
                              <div className="task-cell-title">{task.title}</div>
                              {task.description && (
                                <p className="task-cell-desc">
                                  {task.description.slice(0, 110)}
                                  {task.description.length > 110 ? "..." : ""}
                                </p>
                              )}
                              {hasSubtasks && (
                                <p className="task-cell-desc">{pendingSubtasks} pending subtask{pendingSubtasks !== 1 ? "s" : ""}</p>
                              )}
                            </div>
                          </td>

                          <td>
                            <Badge color={status.color} bg={status.bg} label={status.label} />
                          </td>

                          <td>
                            <Badge color={priority.color} bg={priority.bg} label={priority.label} />
                          </td>

                          <td>
                            {task.assigned_to_name ? (
                              <div className="assign-cell">
                                <Avatar name={task.assigned_to_name} size={28} />
                                {task.assigned_to_name}
                              </div>
                            ) : (
                              <span className="unassigned">Unassigned</span>
                            )}
                          </td>

                          <td>
                            {due ? (
                              <span className={`due-cell ${due.overdue ? "overdue" : due.urgent ? "urgent" : ""}`}>{due.label}</span>
                            ) : (
                              <span className="due-cell">-</span>
                            )}
                          </td>

                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="tasks-row-actions">
                              {normalizedStatus !== "completed" && (
                                <button type="button" className="tasks-action tasks-action-complete" onClick={() => handleComplete(task.id)}>
                                  Complete
                                </button>
                              )}
                              <button type="button" className="tasks-action tasks-action-edit" onClick={() => setEditTask(task)}>
                                Edit
                              </button>
                              <button type="button" className="tasks-action tasks-action-delete" onClick={() => handleDelete(task)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="tasks-pagination">
                  <div className="tasks-pagination-text">
                    Showing {(pagination.page - 1) * 15 + 1} to {Math.min(pagination.page * 15, totalCount)} of {totalCount}
                  </div>

                  <div className="tasks-pagination-actions">
                    <Button size="sm" disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>
                      Previous
                    </Button>

                    <Button size="sm" disabled={pagination.page === pagination.pages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <TaskForm open={showForm} onClose={() => setShowForm(false)} onSave={handleCreate} />
      <TaskForm open={!!editTask} task={editTask} onClose={() => setEditTask(null)} onSave={handleUpdate} />
    </div>
  );
};

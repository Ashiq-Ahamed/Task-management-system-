import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tasksApi } from "../services/api";
import { Button, Badge, Avatar, Skeleton, EmptyState } from "../components/UI";
import { TaskForm } from "../components/TaskForm";
import { priorityConfig, getDueDateLabel } from "../utils/helpers";
import { useToast } from "../components/Layout";
import "./TaskDetail.css";

const STATUS_CONFIG = {
  pending: { label: "Open", color: "blue", bg: "bg-blue-100" },
  in_progress: { label: "In Progress", color: "purple", bg: "bg-purple-100" },
  completed: { label: "Completed", color: "green", bg: "bg-green-100" },
};

export const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  const loadTask = useCallback(async () => {
    if (!token || !id) return;

    setLoading(true);
    try {
      const res = await tasksApi.get(token, id);
      setTask(res?.data || null);
    } catch (err) {
      toastRef.current(err?.message || "Task not found", "error");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  }, [token, id, navigate]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      await tasksApi.createComment(token, id, { content: newComment.trim() });
      setNewComment("");
      toast("Comment added", "success");
      loadTask();
    } catch {
      toast("Failed to add comment", "error");
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;

    try {
      await tasksApi.createSubtask(token, id, { title: newSubtask.trim() });
      setNewSubtask("");
      toast("Subtask added", "success");
      loadTask();
    } catch {
      toast("Failed to add subtask", "error");
    }
  };

  const completeAllSubtasks = async () => {
    try {
      await tasksApi.completeAllSubtasks(token, id);
      toast("All subtasks completed", "success");
      loadTask();
    } catch {
      toast("Failed to complete subtasks", "error");
    }
  };

  const deleteSubtask = async (subId) => {
    if (!window.confirm("Delete this subtask?")) return;

    try {
      await tasksApi.deleteSubtask(token, id, subId);
      toast("Subtask deleted", "info");
      loadTask();
    } catch {
      toast("Delete failed", "error");
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      await tasksApi.deleteComment(token, id, commentId);
      toast("Comment deleted", "info");
      loadTask();
    } catch {
      toast("Delete failed", "error");
    }
  };

  if (loading) {
    return (
      <div className="task-detail-page task-detail-loading">
        <div className="task-detail-shell">
          <Skeleton height={420} />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-page">
        <div className="task-detail-shell">
          <EmptyState
            title="Task not found"
            action={<Button onClick={() => navigate("/tasks")}>Back to Tasks</Button>}
          />
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const due = getDueDateLabel(task.due_date);

  return (
    <div className="task-detail-page">
      <div className="task-detail-shell">
        <div className="task-detail-panel">
          <div className="task-detail-header">
            <div>
              <h1 className="task-detail-title">{task.title}</h1>
              <div className="task-detail-meta">
                <Badge color={status.color} bg={status.bg} label={status.label} />
                <Badge color={priority.color} bg={priority.bg} label={priority.label} />
                {due && (
                  <span
                    className={`task-due-chip ${
                      due.overdue ? "overdue" : due.urgent ? "urgent" : "normal"
                    }`}
                  >
                    Due {due.label}
                  </span>
                )}
              </div>
            </div>
            <div className="task-detail-actions">
              <Button variant="primary" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="ghost" onClick={() => navigate("/tasks")}>
                Back
              </Button>
            </div>
          </div>

          {task.description && (
            <div className="task-section">
              <h3>Description</h3>
              <div className="task-description-box">{task.description}</div>
            </div>
          )}

          <div className="task-section task-section-divider">
            <h3>Subtasks ({task.subtasks?.length || 0})</h3>
            <div className="task-inline-form">
              <input
                type="text"
                className="task-text-input"
                placeholder="New subtask title"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
              />
              <Button onClick={addSubtask}>Add</Button>
              <Button variant="secondary" onClick={completeAllSubtasks}>
                Complete All
              </Button>
            </div>
            <div className="task-list-block">
              {task.subtasks?.map((sub) => (
                <div key={sub.id} className="task-list-row">
                  <input type="checkbox" checked={sub.status === "completed"} readOnly />
                  <span className={sub.status === "completed" ? "done" : ""}>{sub.title}</span>
                  {sub.assigned_to_name && <span className="sub-assignee">{sub.assigned_to_name}</span>}
                  <Button variant="ghost" size="sm" onClick={() => deleteSubtask(sub.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="task-section task-section-divider">
            <h3>Comments ({task.comments?.length || 0})</h3>
            <div className="task-comment-form">
              <textarea
                className="task-comment-input"
                rows="3"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button onClick={addComment} disabled={!newComment.trim()}>
                Post
              </Button>
            </div>
            <div className="task-comments-list">
              {task.comments?.map((comment) => (
                <div key={comment.id} className="task-comment-item">
                  <Avatar name={comment.user_name} size={36} />
                  <div className="comment-content-wrap">
                    <div className="comment-head">
                      <span className="comment-user">{comment.user_name}</span>
                      <span className="comment-time">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                    <Button variant="ghost" size="sm" onClick={() => deleteComment(comment.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <TaskForm
          open={editing}
          task={task}
          onClose={() => setEditing(false)}
          onSave={async (data) => {
            await tasksApi.update(token, id, data);
            toast("Task updated", "success");
            setEditing(false);
            loadTask();
          }}
        />
      </div>
    </div>
  );
};

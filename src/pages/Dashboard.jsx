import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tasksApi, usersApi } from "../services/api";
import { StatCard, Badge, Avatar, Skeleton, ProgressBar } from "../components/UI";
import {
  priorityConfig,
  statusConfig,
  getDueDateLabel,
  taskProgress,
} from "../utils/helpers";
import "./Dashboard.css";

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const [tasksRes, usersRes] = await Promise.allSettled([
          tasksApi.list({ assigned_to: user.id }),
          usersApi.list(),
        ]);

        if (tasksRes.status === "fulfilled") {
          const allTasks = tasksRes.value?.data || tasksRes.value || [];
          setTasks(Array.isArray(allTasks) ? allTasks : []);
        }

        if (usersRes.status === "fulfilled") {
          const allUsers = usersRes.value?.data || usersRes.value || [];
          setUsers(Array.isArray(allUsers) ? allUsers : []);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  /* =====================================
     Stats
  ====================================== */
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const closed = tasks.filter((t) => t.status === "completed");
  const overdue = tasks.filter(
    (t) => t.due_date && t.status !== "completed" && new Date(t.due_date) < new Date()
  );

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>
          {greeting}, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <button className="dashboard-logout-btn" onClick={handleLogout} type="button" aria-label="Logout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </header>

      {error && <div className="dashboard-alert error">{error}</div>}

      {/* Stats Grid */}
      <div className="stats-grid">
        {loading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} height={110} />)
        ) : (
          <>
            <StatCard label="Total Tasks" value={tasks.length} color="var(--accent-bright)" />
            <StatCard label="In Progress" value={inProgress.length} color="var(--warning)" />
            <StatCard label="Completed" value={closed.length} color="var(--success)" />
            <StatCard label="Overdue" value={overdue.length} color={overdue.length > 0 ? 'var(--danger)' : 'var(--text-secondary)'} />
          </>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Tasks */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recent Tasks</h2>
            <button className="section-link" onClick={() => navigate("/tasks")}>
              View all →
            </button>
          </div>

          <div className="recent-tasks">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} height={72} />)
            ) : recentTasks.length === 0 ? (
              <div className="empty-mini">No tasks yet. Create your first task!</div>
            ) : (
              recentTasks.map((task) => {
                const prog = taskProgress(task);
                const due = getDueDateLabel(task.due_date);
                const pc = priorityConfig[task.priority] || priorityConfig.medium;
                const sc = statusConfig[task.status] || statusConfig.open;

                return (
                  <div
                    key={task.id || task._id}
                    className="task-row"
                    onClick={() => navigate(`/tasks/${task.id || task._id}`)}
                  >
                    <div className="task-row-main">
                      <div className="task-row-top">
                        <span className="task-row-title">{task.title}</span>
                        <Badge color={pc.color} bg={pc.bg} label={pc.label} />
                      </div>
                      <div className="task-row-meta">
                        <Badge color={sc.color} bg={sc.bg} label={sc.label} dot />
                        {due && (
                          <span className={`due-label ${due.overdue ? "overdue" : due.urgent ? "urgent" : ""}`}>
                            {due.label}
                          </span>
                        )}
                      </div>
                      {prog && <ProgressBar value={prog.done} max={prog.total} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Team Members */}
        <aside className="dashboard-aside">
          <div className="dashboard-widget">
            <div className="widget-header">
              <h3>Team Members</h3>
              <button className="section-link" onClick={() => navigate("/users")}>Manage</button>
            </div>
            <div className="team-list">
              {loading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} height={40} />)
              ) : users.length === 0 ? (
                <div className="empty-mini">No users found</div>
              ) : (
                users.slice(0, 5).map((u) => (
                  <div key={u.id || u._id} className="team-member">
                    <Avatar name={u.name} size={34} />
                    <div className="team-member-info">
                      <span className="team-name">{u.name}</span>
                      <span className="team-email">{u.email}</span>
                    </div>
                    <span className={`status-dot ${u.status}`} />
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

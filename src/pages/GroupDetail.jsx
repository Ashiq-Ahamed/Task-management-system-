import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { groupsApi, tasksApi } from '../services/api';
import { Badge, Button, EmptyState, Skeleton } from '../components/UI';
import { useToast } from '../components/Layout';
import { formatDate } from '../utils/helpers';
import './UsersGroups.css';

const normalizeStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized || normalized === 'open') return 'pending';
  if (normalized === 'closed') return 'completed';
  return normalized;
};

const STATUS_LABELS = {
  pending: 'Open',
  in_progress: 'In Progress',
  completed: 'Completed'
};

const STATUS_STYLES = {
  pending: { color: 'var(--accent-bright)', bg: 'var(--accent-dim)' },
  in_progress: { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
  completed: { color: 'var(--success)', bg: 'var(--success-dim)' }
};

export const GroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGroupData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsRes, tasksRes] = await Promise.all([
        groupsApi.list(),
        tasksApi.list({ page: 1, limit: 1000 })
      ]);

      const allGroups = Array.isArray(groupsRes) ? groupsRes : [];
      const allTasks = tasksRes?.data || tasksRes || [];
      const currentGroup = allGroups.find((g) => Number(g.id) === Number(id)) || null;

      setGroup(currentGroup);
      setTasks(
        allTasks.filter((task) => Number(task.group_id) === Number(id))
      );
    } catch (err) {
      toastRef.current(err.message || 'Failed to load group details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const stats = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const status = normalizeStatus(task.status);
      if (status === 'in_progress') acc.in_progress += 1;
      else if (status === 'completed') acc.completed += 1;
      else acc.pending += 1;
      return acc;
    }, { pending: 0, in_progress: 0, completed: 0 });
  }, [tasks]);

  return (
    <div className="mgmt-page">
      <div className="page-header">
        <div className="page-title-group">
          <Button variant="ghost" size="sm" onClick={() => navigate('/groups')}>Back to Groups</Button>
          <h1 className="page-title">{group ? group.name : 'Group Details'}</h1>
          {!loading && group && (
            <p className="page-subtitle">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} in this group
            </p>
          )}
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ padding: 20 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={68} />)}
          </div>
        ) : !group ? (
          <EmptyState
            title="Group not found"
            description="This group may have been removed"
            action={<Button variant="primary" onClick={() => navigate('/groups')}>Go to Groups</Button>}
          />
        ) : (
          <>
            <div className="group-stats-grid">
              <div className="group-stat-card">
                <span className="group-stat-label">Open</span>
                <strong className="group-stat-value">{stats.pending}</strong>
              </div>
              <div className="group-stat-card">
                <span className="group-stat-label">In Progress</span>
                <strong className="group-stat-value">{stats.in_progress}</strong>
              </div>
              <div className="group-stat-card">
                <span className="group-stat-label">Completed</span>
                <strong className="group-stat-value">{stats.completed}</strong>
              </div>
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks in this group"
                description="Assign tasks to this group to see them here"
              />
            ) : (
              <div className="group-tasks-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const status = normalizeStatus(task.status);
                      const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;

                      return (
                        <tr key={task.id} className="group-task-row" onClick={() => navigate(`/tasks/${task.id}`)}>
                          <td>
                            <div className="group-task-title">{task.title}</div>
                            {task.description && (
                              <p className="group-task-description">
                                {task.description.length > 120
                                  ? `${task.description.slice(0, 120)}...`
                                  : task.description}
                              </p>
                            )}
                          </td>
                          <td>
                            <Badge
                              color={statusStyle.color}
                              bg={statusStyle.bg}
                              label={STATUS_LABELS[status] || STATUS_LABELS.pending}
                            />
                          </td>
                          <td>{task.priority || '-'}</td>
                          <td>{task.due_date ? formatDate(task.due_date) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

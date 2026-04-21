import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { tasksApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export const ToastContext = React.createContext(null);

const normalizeStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'pending';
  if (normalized === 'open') return 'pending';
  if (normalized === 'closed') return 'completed';
  return normalized;
};

export const Layout = () => {
  const { token, user } = useAuth();
  const [taskCounts, setTaskCounts] = useState({});
  const [toasts, setToasts] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchCounts = useCallback(async () => {
    if (!token) return;
    try {
      const all = await tasksApi.list({
        assigned_to: user?.id,
        limit: 1000,
      });
      const tasks = all?.data || all || [];
      const counts = {
        total: tasks.length,
        open: tasks.filter(t => normalizeStatus(t.status) === 'pending').length,
        in_progress: tasks.filter(t => normalizeStatus(t.status) === 'in_progress').length,
        completed: tasks.filter(t => normalizeStatus(t.status) === 'completed').length,
      };
      setTaskCounts(counts);
    } catch {
      // ignore counter fetch errors
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (!token) {
      setTaskCounts({});
      return;
    }

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 10000);
    const onFocus = () => fetchCounts();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [token, fetchCounts]);

  const toastIcons = {
    success: 'OK',
    error: 'X',
    warning: '!',
    info: 'i',
  };

  return (
    <ToastContext.Provider value={showToast}>
      <div className="app-layout">
        <Sidebar
          taskCounts={taskCounts}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        />
        <main className={`main-content ${sidebarCollapsed ? 'main-content-collapsed' : ''}`}>
          <Outlet />
        </main>

        <div className="notifications-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span className="toast-icon">{toastIcons[t.type]}</span>
              <span>{t.message}</span>
              <button className="toast-close" onClick={() => removeToast(t.id)}>x</button>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = React.useContext(ToastContext);
  return ctx || (() => {});
};

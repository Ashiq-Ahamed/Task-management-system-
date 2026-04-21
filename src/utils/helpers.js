import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch { return '—'; }
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  try {
    return format(new Date(date), 'MMM d, yyyy · h:mm a');
  } catch { return '—'; }
};

export const formatRelative = (date) => {
  if (!date) return '—';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch { return '—'; }
};

export const getDueDateLabel = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isToday(d)) return { label: 'Due today', urgent: true };
  if (isTomorrow(d)) return { label: 'Due tomorrow', urgent: true };
  if (isPast(d)) return { label: 'Overdue', overdue: true };
  return { label: `Due ${formatDate(date)}` };
};

export const priorityConfig = {
  high: { label: 'High', color: 'var(--priority-high)', bg: 'rgba(248, 113, 113, 0.12)' },
  medium: { label: 'Medium', color: 'var(--priority-medium)', bg: 'rgba(251, 191, 36, 0.12)' },
  low: { label: 'Low', color: 'var(--priority-low)', bg: 'rgba(52, 211, 153, 0.12)' },
};

export const statusConfig = {
  open: { label: 'Open', color: 'var(--info)', bg: 'var(--info-dim)' },
  in_progress: { label: 'In Progress', color: 'var(--warning)', bg: 'var(--warning-dim)' },
  closed: { label: 'Closed', color: 'var(--success)', bg: 'var(--success-dim)' },
};

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

export const avatarColors = [
  '#7c6fe0', '#60a5fa', '#34d399', '#fbbf24', '#f87171',
  '#a78bfa', '#38bdf8', '#4ade80', '#fb923c', '#f472b6',
];

export const getAvatarColor = (str = '') => {
  const idx = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColors[idx % avatarColors.length];
};

export const taskProgress = (task) => {
  if (!task.sub_tasks?.length) return null;
  const done = task.sub_tasks.filter(s => s.status === 'closed').length;
  return { done, total: task.sub_tasks.length, pct: Math.round((done / task.sub_tasks.length) * 100) };
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage, RegisterPage } from './pages/Auth';
import { DashboardPage } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { TaskDetail } from './pages/TaskDetail';
import { UsersPage } from './pages/Users';
import { GroupsPage } from './pages/Groups';
import { GroupDetailPage } from './pages/GroupDetail';
import { EntitiesPage } from './pages/Entities';
import { EntityDetailPage } from './pages/EntityDetail';
import { Spinner } from './components/UI';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--accent)' }}>
      <Spinner size={36} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

    <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/tasks/open" element={<TasksPage />} />
      <Route path="/tasks/in-progress" element={<TasksPage />} />
      <Route path="/tasks/completed" element={<TasksPage />} />
      <Route path="/tasks/:id" element={<TaskDetail />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:id" element={<GroupDetailPage />} />
      <Route path="/entities" element={<EntitiesPage />} />
      <Route path="/entities/:id" element={<EntityDetailPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

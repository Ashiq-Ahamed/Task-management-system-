import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usersApi } from '../services/api';
import { Button, Badge, Avatar, EmptyState, Modal, Input, Select, Skeleton } from '../components/UI';
import { useToast } from '../components/Layout';
import { formatDate } from '../utils/helpers';
import './UsersGroups.css';

/* =========================================
   USER FORM
========================================= */

const UserForm = ({ open, onClose, onSave, user }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    contact: '',
    status: 'active',
    password: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        contact: user.contact || '',
        status: user.status || 'active',
        password: ''
      });
    } else if (open) {
      setForm({
        name: '',
        email: '',
        contact: '',
        status: 'active',
        password: ''
      });
    }
  }, [open, user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  const statusOpts = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  return (
    <Modal open={open} onClose={onClose} title={user ? 'Edit User' : 'Add User'} size="md">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} required />
        <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
        <Input
          label={user ? 'New Password (leave empty to keep)' : 'Password *'}
          type="password"
          value={form.password}
          onChange={e => set('password', e.target.value)}
          required={!user}
        />
        <Input label="Contact" value={form.contact} onChange={e => set('contact', e.target.value)} />
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)} options={statusOpts} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>
            {user ? 'Save Changes' : 'Add User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/* =========================================
   USERS PAGE
========================================= */

export const UsersPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleting, setDeleting] = useState(null);

  /* =========================================
     LOAD USERS
  ========================================= */

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page: 1, limit: 100 });
      setUsers(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      toastRef.current(e.message || 'Failed to load users', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* =========================================
     FILTER
  ========================================= */

  const getCurrentAuthUser = () => {
    try {
      const raw = localStorage.getItem('auth');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.user || null;
    } catch (_err) {
      return null;
    }
  };

  const isSameUser = (a, b) => {
    if (!a || !b) return false;

    if (a.id != null && b.id != null && Number(a.id) === Number(b.id)) {
      return true;
    }

    const emailA = (a.email || '').toLowerCase().trim();
    const emailB = (b.email || '').toLowerCase().trim();
    return !!emailA && emailA === emailB;
  };

  const currentAuthUser = getCurrentAuthUser();

  const getPresenceStatus = (user) => {
    if (isSameUser(user, currentAuthUser)) return 'active';

    const online = Number(user?.is_online) === 1;
    return online ? 'active' : 'inactive';
  };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      (u.name || '').toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s);

    const matchStatus = !statusFilter || getPresenceStatus(u) === statusFilter;

    return matchSearch && matchStatus;
  });

  /* =========================================
     CREATE
  ========================================= */

  const handleCreate = async (data) => {
    try {
      await usersApi.create(data); // ✅ FIXED
      toastRef.current('User created!', 'success');
      setShowForm(false);
      load();
    } catch (e) {
      toastRef.current(e.message || 'Failed to create user', 'error');
    }
  };

  /* =========================================
     UPDATE
  ========================================= */

  const handleUpdate = async (data) => {
    try {
      await usersApi.update(editUser.id || editUser._id, data); // ✅ FIXED
      toastRef.current('User updated!', 'success');
      setEditUser(null);
      load();
    } catch (e) {
      toastRef.current(e.message || 'Failed to update user', 'error');
    }
  };

  /* =========================================
     DELETE
  ========================================= */

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name}?`)) return;

    const id = u.id || u._id;
    setDeleting(id);

    try {
      await usersApi.delete(id); // ✅ FIXED
      toastRef.current('User deleted', 'info');
      load();
    } catch (e) {
      toastRef.current(e.message || 'Failed to delete', 'error');
    }

    setDeleting(null);
  };

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="mgmt-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p>{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          Add User
        </Button>
      </div>

      <div className="page-body">
        <div className="filters-bar" style={{ marginBottom: 20 }}>
          <input
            className="search-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            style={{ minWidth: 160 }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 20 }}>
            {[1,2,3].map(i => <Skeleton key={i} height={60} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No users found"
            action={<Button onClick={() => setShowForm(true)}>Add User</Button>}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id || u._id}>
                  <td>
                    <Avatar name={u.name} size={36} />
                    {u.name}
                    <br />
                    <small>{u.email}</small>
                  </td>
                  <td>{u.contact || '—'}</td>
                  <td>
                    {(() => {
                      const presence = getPresenceStatus(u);
                      const isActive = presence === 'active';
                      return (
                    <Badge
                      label={isActive ? 'Active' : 'Inactive'}
                      color={isActive ? 'var(--success)' : 'var(--text-tertiary)'}
                      bg={isActive ? 'var(--success-dim)' : 'var(--bg-elevated)'}
                      dot
                    />
                      );
                    })()}
                  </td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <div className="user-row-actions">
                      <button className="user-action-btn edit" onClick={() => setEditUser(u)}>
                        Edit
                      </button>
                      <button
                        className="user-action-btn delete"
                        onClick={() => handleDelete(u)}
                        disabled={deleting === (u.id || u._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <UserForm open={showForm} onClose={() => setShowForm(false)} onSave={handleCreate} />
      <UserForm open={!!editUser} onClose={() => setEditUser(null)} onSave={handleUpdate} user={editUser} />
    </div>
  );
};

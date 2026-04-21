import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsApi } from '../services/api'; // uses updated API helper
import { Button, Badge, EmptyState, Modal, Input, Select, Skeleton } from '../components/UI';
import { useToast } from '../components/Layout';
import { formatDate } from '../utils/helpers';
import './UsersGroups.css';

const GroupForm = ({ open, onClose, onSave, group }) => {
  const [form, setForm] = useState({ name: '', status: 'active' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && group) setForm({ name: group.name || '', status: group.status || 'active' });
    else if (open) setForm({ name: '', status: 'active' });
  }, [open, group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  };

  const statusOpts = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  return (
    <Modal open={open} onClose={onClose} title={group ? 'Edit Group' : 'New Group'} size="sm">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Group Name *"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Engineering, Design"
          required
        />
        <Select
          label="Status"
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          options={statusOpts}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>{group ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export const GroupsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await groupsApi.list();
      setGroups(res || []);
    } catch (err) {
      console.error(err);
      toastRef.current(err.message || 'Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const filteredGroups = groups.filter(g => !search || g.name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (data) => {
    try {
      await groupsApi.create(data);
      toast('Group created!', 'success');
      setShowForm(false);
      loadGroups();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to create group', 'error');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await groupsApi.update(editGroup.id, data);
      toast('Group updated!', 'success');
      setEditGroup(null);
      loadGroups();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to update group', 'error');
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Delete "${group.name}"?`)) return;
    try {
      await groupsApi.delete(group.id);
      toast('Group deleted', 'info');
      loadGroups();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to delete group', 'error');
    }
  };

  const groupIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>
    </svg>
  );

  return (
    <div className="mgmt-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Groups</h1>
          <p className="page-subtitle">{filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" onClick={() => setShowForm(true)}>New Group</Button>
        </div>
      </div>

      <div className="page-body">
        <div className="filters-bar" style={{ marginBottom: 20 }}>
          <input
            className="search-input"
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="cards-grid">{[1,2,3,4].map(i => <Skeleton key={i} height={120} />)}</div>
        ) : filteredGroups.length === 0 ? (
          <EmptyState
            icon={groupIcon}
            title="No groups found"
            description="Groups help organize users and tasks by team or department"
            action={<Button variant="primary" onClick={() => setShowForm(true)}>Create Group</Button>}
          />
        ) : (
          <div className="cards-grid">
            {filteredGroups.map(g => (
              <div
                key={g.id}
                className="entity-card entity-card-clickable"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/groups/${g.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/groups/${g.id}`);
                  }
                }}
              >
                <div className="entity-card-header">
                  <div className="entity-icon">{groupIcon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="entity-card-title">{g.name}</div>
                  </div>
                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="card-action-btn edit" onClick={() => setEditGroup(g)}>Edit</button>
                    <button className="card-action-btn delete" onClick={() => handleDelete(g)}>Delete</button>
                  </div>
                </div>
                <div className="entity-card-meta">
                  <Badge
                    color={g.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)'}
                    bg={g.status === 'active' ? 'var(--success-dim)' : 'var(--bg-elevated)'}
                    label={g.status === 'active' ? 'Active' : 'Inactive'}
                    dot
                  />
                  <span className="entity-card-date">{formatDate(g.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <GroupForm open={showForm} onClose={() => setShowForm(false)} onSave={handleCreate} />
      <GroupForm open={!!editGroup} onClose={() => setEditGroup(null)} onSave={handleUpdate} group={editGroup} />
    </div>
  );
};

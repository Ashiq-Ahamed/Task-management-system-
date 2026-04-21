import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { entitiesApi } from '../services/api';
import { Button, Badge, EmptyState, Modal, Input, Select, Skeleton } from '../components/UI';
import { useToast } from '../components/Layout';
import { formatDate } from '../utils/helpers';
import './UsersGroups.css';

const EntityForm = ({ open, onClose, onSave, entity }) => {
  const [form, setForm] = useState({ name: '', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && entity) setForm({ name: entity.name || '', status: entity.status || 'active' });
    else if (open) setForm({ name: '', status: 'active' });
    setError('');
  }, [open, entity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave(form, entity || null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save entity');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <Modal open={open} onClose={onClose} title={entity ? 'Edit Entity' : 'New Entity'} size="sm">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Entity Name *"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Acme Corp"
          required
        />
        <Select
          label="Status"
          value={form.status}
          onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          options={statusOptions}
        />
        {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading}>{entity ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export const EntitiesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editEntity, setEditEntity] = useState(null);

  const loadEntities = useCallback(async (showErrorToast = true) => {
    setLoading(true);
    try {
      const data = await entitiesApi.list();
      setEntities(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      if (showErrorToast) {
        toastRef.current(err.message || 'Failed to load entities', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntities(true);
  }, [loadEntities]);

  const filteredEntities = entities.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (data) => {
    const res = await entitiesApi.create(data);
    if (!res?.success) throw new Error(res?.message || 'Failed to create entity');
    toastRef.current('Entity created!', 'success');
    loadEntities(false);
  };

  const handleUpdate = async (data, entityRef = null) => {
    const entityId = entityRef?.id || entityRef?._id || editEntity?.id || editEntity?._id;
    if (!entityId) {
      throw new Error('Missing entity id for update');
    }

    const res = await entitiesApi.update(entityId, data);
    if (!res?.success) throw new Error(res?.message || 'Failed to update entity');
    toastRef.current('Entity updated!', 'success');
    setEditEntity(null);
    loadEntities(false);
  };

  const handleDelete = async (entity) => {
    if (!window.confirm(`Delete "${entity.name}"?`)) return;
    try {
      const entityId = entity?.id || entity?._id;
      if (!entityId) throw new Error('Missing entity id for delete');

      const res = await entitiesApi.delete(entityId);
      if (!res?.success) throw new Error(res?.message || 'Failed to delete entity');
      toastRef.current('Entity deleted', 'info');
      loadEntities(false);
    } catch (err) {
      toastRef.current(err.message || 'Failed to delete entity', 'error');
    }
  };

  const entityIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );

  return (
    <div className="mgmt-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Entities</h1>
          <p className="page-subtitle">{filteredEntities.length} entit{filteredEntities.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <div className="page-actions">
          <Button variant="primary" onClick={() => setShowForm(true)}>New Entity</Button>
        </div>
      </div>

      <div className="page-body">
        <div className="filters-bar" style={{ marginBottom: 20 }}>
          <div className="search-input-wrap">
            <span className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </span>
            <input
              className="search-input"
              placeholder="Search entities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="cards-grid">{[1, 2, 3].map(i => <Skeleton key={i} height={120} />)}</div>
        ) : filteredEntities.length === 0 ? (
          <EmptyState
            icon={entityIcon}
            title="No entities found"
            description="Entities represent departments, clients, or organizational units"
            action={<Button variant="primary" onClick={() => setShowForm(true)}>Create Entity</Button>}
          />
        ) : (
          <div className="cards-grid">
            {filteredEntities.map(entity => {
              const entityId = entity.id || entity._id;

              return (
                <div
                  key={entityId}
                  className="entity-card entity-card-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/entities/${entityId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/entities/${entityId}`);
                    }
                  }}
                >
                  <div className="entity-card-header">
                    <div className="entity-icon">{entityIcon}</div>
                    <div style={{ flex: 1 }}><div className="entity-card-title">{entity.name}</div></div>
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="card-action-btn edit" onClick={() => setEditEntity(entity)}>Edit</button>
                      <button className="card-action-btn delete" onClick={() => handleDelete(entity)}>Delete</button>
                    </div>
                  </div>
                  <div className="entity-card-meta">
                    <Badge
                      color={entity.status === 'active' ? 'var(--success)' : 'var(--text-tertiary)'}
                      bg={entity.status === 'active' ? 'var(--success-dim)' : 'var(--bg-elevated)'}
                      label={entity.status === 'active' ? 'Active' : 'Inactive'}
                      dot
                    />
                    <span className="entity-card-date">{formatDate(entity.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EntityForm open={showForm} onClose={() => setShowForm(false)} onSave={handleCreate} />
      <EntityForm open={!!editEntity} onClose={() => setEditEntity(null)} onSave={handleUpdate} entity={editEntity} />
    </div>
  );
};

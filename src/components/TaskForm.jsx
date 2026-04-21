import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Textarea, Select, Toggle } from "./UI";
import { usersApi, groupsApi, entitiesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./TaskForm.css";

const defaultTask = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  assigned_to: "",
  entity_id: "",
  group_id: "",
  start_date: "",
  due_date: "",
  reminder: {
    enabled: false,
    date_time: "",
    notify_before: 30,
  },
};

export const TaskForm = ({ open, onClose, onSave, task = null }) => {
  const { token } = useAuth();

  const [form, setForm] = useState(defaultTask);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("basic");

  useEffect(() => {
    if (!open) {
      setForm(defaultTask);
      setTab("basic");
      return;
    }

    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "pending",
        priority: task.priority || "medium",
        assigned_to: task.assigned_to || "",
        entity_id: task.entity_id || "",
        group_id: task.group_id || "",
        start_date: task.start_date ? task.start_date.slice(0, 10) : "",
        due_date: task.due_date ? task.due_date.slice(0, 10) : "",
        reminder: task.reminder || {
          enabled: false,
          date_time: "",
          notify_before: 30,
        },
      });
    } else {
      setForm(defaultTask);
    }
  }, [open, task]);

  useEffect(() => {
    if (!open || !token) return;

    const load = async () => {
      const [usersRes, groupsRes, entitiesRes] = await Promise.allSettled([
        usersApi.list(token),
        groupsApi.list(token),
        entitiesApi.list(token),
      ]);

      if (usersRes.status === "fulfilled") {
        const u = usersRes.value;
        setUsers(u?.data || u || []);
      } else {
        setUsers([]);
        console.error("Users load failed:", usersRes.reason?.message || usersRes.reason);
      }

      if (groupsRes.status === "fulfilled") {
        const g = groupsRes.value;
        setGroups(g?.data || g || []);
      } else {
        setGroups([]);
        console.error("Groups load failed:", groupsRes.reason?.message || groupsRes.reason);
      }

      if (entitiesRes.status === "fulfilled") {
        const e = entitiesRes.value;
        setEntities(e?.data || e || []);
      } else {
        setEntities([]);
        console.error("Entities load failed:", entitiesRes.reason?.message || entitiesRes.reason);
      }
    };

    load();
  }, [open, token]);

  const set = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
        assigned_to: form.assigned_to || null,
        entity_id: form.entity_id || null,
        group_id: form.group_id || null,
        reminder: form.reminder.enabled ? form.reminder : null,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Save failed:", err.message);
    }

    setLoading(false);
  };

  const statusOpts = [
    { value: "pending", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  const priorityOpts = [
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const userOpts = [
    { value: "", label: "Unassigned" },
    ...users.map((u) => ({
      value: u.id || u._id,
      label: u.name,
    })),
  ];

  const groupOpts = [
    { value: "", label: "None" },
    ...groups.map((g) => ({
      value: g.id || g._id,
      label: g.name,
    })),
  ];

  const entityOpts = [
    { value: "", label: "None" },
    ...entities.map((e) => ({
      value: e.id || e._id,
      label: e.name,
    })),
  ];

  const tabs = ["basic", "assignment", "scheduling", "reminder"];

  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit Task" : "New Task"} size="lg">
      <div className="task-form-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {tab === "basic" && (
          <div className="form-section">
            <Input label="Task Title *" value={form.title} onChange={(e) => set("title", e.target.value)} required />

            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
            />

            <div className="form-row-2">
              <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={statusOpts} />

              <Select
                label="Priority"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                options={priorityOpts}
              />
            </div>
          </div>
        )}

        {tab === "assignment" && (
          <div className="form-section">
            <Select
              label="Assign To"
              value={form.assigned_to}
              onChange={(e) => set("assigned_to", e.target.value)}
              options={userOpts}
            />

            <Select label="Group" value={form.group_id} onChange={(e) => set("group_id", e.target.value)} options={groupOpts} />

            <Select
              label="Entity"
              value={form.entity_id}
              onChange={(e) => set("entity_id", e.target.value)}
              options={entityOpts}
            />
          </div>
        )}

        {tab === "scheduling" && (
          <div className="form-section">
            <Input label="Start Date" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />

            <Input label="Due Date" type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </div>
        )}

        {tab === "reminder" && (
          <div className="form-section">
            <Toggle
              checked={form.reminder.enabled}
              onChange={(val) =>
                set("reminder", {
                  ...form.reminder,
                  enabled: val,
                })
              }
              label="Enable reminder"
            />

            {form.reminder.enabled && (
              <>
                <Input
                  label="Reminder Date & Time"
                  type="datetime-local"
                  value={form.reminder.date_time ? form.reminder.date_time.slice(0, 16) : ""}
                  onChange={(e) =>
                    set("reminder", {
                      ...form.reminder,
                      date_time: e.target.value,
                    })
                  }
                />

                <Input
                  label="Notify Before (minutes)"
                  type="number"
                  min="1"
                  value={form.reminder.notify_before}
                  onChange={(e) =>
                    set("reminder", {
                      ...form.reminder,
                      notify_before: Number(e.target.value),
                    })
                  }
                />
              </>
            )}
          </div>
        )}

        <div className="form-actions-row">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" variant="primary" loading={loading}>
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

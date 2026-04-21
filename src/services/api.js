// src/services/api.js

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* =========================================
   CUSTOM ERROR CLASS
========================================= */
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const isTokenLike = (value) =>
  typeof value === "string" && value.split(".").length === 3;

const stripTokenQuotes = (value) => {
  if (typeof value !== "string") return null;

  let token = value.trim();
  if (!token) return null;

  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }

  if (token.startsWith('"')) {
    try {
      const parsed = JSON.parse(token);
      if (typeof parsed === "string") token = parsed.trim();
    } catch (_err) {
      // Ignore malformed JSON and keep best-effort token value.
    }
  }

  return token || null;
};

/* =========================================
   AUTH STORAGE
========================================= */
const getAuth = () => {
  try {
    const stored = localStorage.getItem("auth");
    if (!stored) return null;

    const trimmed = stored.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== "object") return null;

      const token = stripTokenQuotes(parsed.token);
      if (!token) return null;

      return { ...parsed, token };
    }

    const token = stripTokenQuotes(trimmed);
    return token ? { token, user: null } : null;
  } catch {
    return null;
  }
};

const getToken = () => {
  const auth = getAuth();
  return auth?.token || null;
};

const removeAuth = () => {
  localStorage.removeItem("auth");
};

/* =========================================
   HEADERS
========================================= */
const getHeaders = (withAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (withAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

/* =========================================
   HANDLE RESPONSE
========================================= */
const handleResponse = async (res, withAuth = true) => {
  let data = {};

  try {
    data = await res.json();
  } catch (_err) {
    if (res.status === 200 || res.status === 201) {
      const text = await res.text();
      return { success: true, token: text };
    }
    data = {};
  }

  if (!res.ok) {
    if (res.status === 401 && withAuth) {
      removeAuth();
      window.location.href = "/login";
    }
    const validationMessage =
      Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors[0]?.msg || data.errors[0]?.message
        : null;
    throw new ApiError(
      validationMessage || data?.message || data?.error || "Request failed",
      res.status
    );
  }

  return data;
};

/* =========================================
   GENERIC REQUEST HELPER
========================================= */
const request = (url, options = {}, withAuth = true) => {
  return fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: getHeaders(withAuth),
    credentials: "include",
  })
    .then((res) => handleResponse(res, withAuth))
    .catch((err) => {
      if (err instanceof ApiError) throw err;

      const message =
        err?.name === "TypeError"
          ? `Network error: cannot reach API at ${BASE_URL}`
          : err?.message || "Network request failed";

      throw new ApiError(message, 0);
    });
};

/* =========================================
   AUTH API
========================================= */
export const authApi = {
  login: async (data) =>
    request(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    ),

  register: async (data) =>
    request(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    ),

  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST" }, true);
    } catch (_err) {
      // Ignore logout API failure and clear local session anyway.
    } finally {
      removeAuth();
    }
  },
};

const parseCrudArgs = {
  list: (arg1, arg2) => {
    if (isTokenLike(arg1)) return arg2 || {};
    return arg1 || {};
  },
  get: (arg1, arg2) => (isTokenLike(arg1) ? arg2 : arg1),
  create: (arg1, arg2) => (isTokenLike(arg1) ? arg2 : arg1),
  update: (arg1, arg2, arg3) =>
    isTokenLike(arg1) ? { id: arg2, data: arg3 } : { id: arg1, data: arg2 },
  delete: (arg1, arg2) => (isTokenLike(arg1) ? arg2 : arg1),
};

const toQueryString = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      return true;
    })
  );

  return new URLSearchParams(clean).toString();
};

/* =========================================
   GENERIC CRUD FACTORY
========================================= */
const createCrudApi = (base) => ({
  list: (arg1 = {}, arg2 = {}) => {
    const params = parseCrudArgs.list(arg1, arg2);
    const query = toQueryString(params);
    return request(`${base}${query ? `?${query}` : ""}`);
  },
  get: (arg1, arg2) => {
    const id = parseCrudArgs.get(arg1, arg2);
    return request(`${base}/${id}`);
  },
  create: (arg1, arg2) => {
    const data = parseCrudArgs.create(arg1, arg2);
    return request(base, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: (arg1, arg2, arg3) => {
    const { id, data } = parseCrudArgs.update(arg1, arg2, arg3);
    return request(`${base}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: (arg1, arg2) => {
    const id = parseCrudArgs.delete(arg1, arg2);
    return request(`${base}/${id}`, {
      method: "DELETE",
    });
  },
});

/* =========================================
   API MODULES
========================================= */
export const usersApi = createCrudApi("/users");
export const groupsApi = createCrudApi("/groups");

/* =========================================
   TASKS API
========================================= */
export const tasksApi = {
  list: (arg1 = {}, arg2 = {}) => {
    const params = parseCrudArgs.list(arg1, arg2);
    const query = toQueryString(params);
    return request(`/tasks${query ? `?${query}` : ""}`);
  },

  get: (arg1, arg2) => {
    const id = parseCrudArgs.get(arg1, arg2);
    return request(`/tasks/${id}`);
  },

  create: (arg1, arg2) => {
    const data = parseCrudArgs.create(arg1, arg2);
    return request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: (arg1, arg2, arg3) => {
    const { id, data } = parseCrudArgs.update(arg1, arg2, arg3);
    return request(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: (arg1, arg2) => {
    const id = parseCrudArgs.delete(arg1, arg2);
    return request(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

  complete: (arg1, arg2) => {
    const id = parseCrudArgs.get(arg1, arg2);
    return request(`/tasks/${id}/complete`, {
      method: "PUT",
    });
  },

  createSubtask: (arg1, arg2, arg3) => {
    const taskId = isTokenLike(arg1) ? arg2 : arg1;
    const data = isTokenLike(arg1) ? arg3 : arg2;
    return request(`/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateSubtask: (arg1, arg2, arg3, arg4) => {
    const taskId = isTokenLike(arg1) ? arg2 : arg1;
    const subId = isTokenLike(arg1) ? arg3 : arg2;
    const data = isTokenLike(arg1) ? arg4 : arg3;

    if (data && data._delete) {
      return request(`/tasks/${taskId}/subtasks/${subId}`, {
        method: "DELETE",
      });
    }

    return request(`/tasks/${taskId}/subtasks/${subId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteSubtask: (arg1, arg2, arg3) => {
    const taskId = isTokenLike(arg1) ? arg2 : arg1;
    const subId = isTokenLike(arg1) ? arg3 : arg2;
    return request(`/tasks/${taskId}/subtasks/${subId}`, {
      method: "DELETE",
    });
  },

  completeAllSubtasks: (arg1, arg2) => {
    const taskId = isTokenLike(arg1) ? arg2 : arg1;
    return request(`/tasks/${taskId}/subtasks/complete-all`, {
      method: "PUT",
    });
  },

  createComment: (arg1, arg2, arg3) => {
    const taskId = isTokenLike(arg1) ? arg2 : arg1;
    const data = isTokenLike(arg1) ? arg3 : arg2;
    return request(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteComment: (arg1, arg2, arg3) => {
    const taskId = isTokenLike(arg1) ? arg2 : arg1;
    const commentId = isTokenLike(arg1) ? arg3 : arg2;
    return request(`/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
    });
  },

  listPermissions: (arg1, arg2) => {
    const taskId = parseCrudArgs.get(arg1, arg2);
    return request(`/tasks/${taskId}/permissions`);
  },

  grantPermission: (arg1, arg2, arg3) => {
    const taskId = isTokenLike(arg1) ? arg2 : arg1;
    const data = isTokenLike(arg1) ? arg3 : arg2;
    return request(`/tasks/${taskId}/permissions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  revokePermission: (arg1, arg2, arg3) => {
    const taskId = isTokenLike(arg1) ? arg2 : arg1;
    const permissionId = isTokenLike(arg1) ? arg3 : arg2;
    return request(`/tasks/${taskId}/permissions/${permissionId}`, {
      method: "DELETE",
    });
  },

  // Backward-compatible aliases
  addSubTask: (arg1, arg2, arg3) =>
    tasksApi.createSubtask(arg1, arg2, arg3),
  updateSubTask: (arg1, arg2, arg3, arg4) =>
    tasksApi.updateSubtask(arg1, arg2, arg3, arg4),
};

/* =========================================
   ENTITIES API
========================================= */
export const entitiesApi = createCrudApi("/entities");

/* =========================================
   EXPORT ERROR CLASS
========================================= */
export { ApiError };

/**
 * API Service - HTTP client for SQLite backend API
 */

const API_BASE = '/api';

function getAuthHeader() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(response) {
    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.reload();
        }
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }
    return response.json();
}

export const apiService = {
    // ============ Generic Methods ============
    async post(endpoint, data, options = {}) {
        // Handle endpoints that start with /api/ or just /
        const path = endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint;
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(data),
            ...options
        });
        return handleResponse(response);
    },

    async get(endpoint, options = {}) {
        const path = endpoint.startsWith('/api/') ? endpoint.slice(4) : endpoint;
        const response = await fetch(`${API_BASE}${path}`, {
            headers: getAuthHeader(),
            ...options
        });
        return handleResponse(response);
    },
};

export const api = {
    // ============ Auth ============
    async login(username, password) {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        return handleResponse(response);
    },

    async verifyToken() {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    // ============ Notebooks ============
    async getNotebooks() {
        const response = await fetch(`${API_BASE}/notebooks`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async getNotebook(id) {
        const response = await fetch(`${API_BASE}/notebooks/${id}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async createNotebook(notebook) {
        const response = await fetch(`${API_BASE}/notebooks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(notebook),
        });
        return handleResponse(response);
    },

    async updateNotebook(id, updates) {
        const response = await fetch(`${API_BASE}/notebooks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates),
        });
        return handleResponse(response);
    },

    async deleteNotebook(id) {
        const response = await fetch(`${API_BASE}/notebooks/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    // ============ Notes ============
    async getNotes(notebookId = null) {
        const url = notebookId
            ? `${API_BASE}/notes?notebookId=${notebookId}`
            : `${API_BASE}/notes`;
        const response = await fetch(url, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async getNote(id) {
        const response = await fetch(`${API_BASE}/notes/${id}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async createNote(note) {
        const response = await fetch(`${API_BASE}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(note),
        });
        return handleResponse(response);
    },

    async updateNote(id, updates) {
        const response = await fetch(`${API_BASE}/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates),
        });
        return handleResponse(response);
    },

    async deleteNote(id) {
        const response = await fetch(`${API_BASE}/notes/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    // ============ Chats ============
    async getChats(noteId = null) {
        const url = noteId
            ? `${API_BASE}/chats?noteId=${noteId}`
            : `${API_BASE}/chats`;
        const response = await fetch(url, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    async createChat(chat) {
        const response = await fetch(`${API_BASE}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(chat),
        });
        return handleResponse(response);
    },

    async updateChat(id, updates) {
        const response = await fetch(`${API_BASE}/chats/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(updates),
        });
        return handleResponse(response);
    },

    // ============ Note Versions ============
    async getNoteVersions(noteId) {
        const response = await fetch(`${API_BASE}/notes/${noteId}/versions`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    // ============ File Upload ============
    async uploadFiles(formData) {
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: formData,
        });
        return handleResponse(response);
    },

    async createNoteVersion(noteId, content, title) {
        // Generate ID client-side
        const response = await fetch(`${API_BASE}/notes/${noteId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify({
                id: crypto.randomUUID(),
                content,
                title
            }),
        });
        return handleResponse(response);
    },
};

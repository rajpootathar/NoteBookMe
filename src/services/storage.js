import { api } from './apiService';

export const storage = {
  async getAllNotebooks() {
    return api.getNotebooks();
  },

  async getNotebook(id) {
    return api.getNotebook(id);
  },

  async createNotebook(notebook) {
    // Generate ID client-side if needed, or let server handle it
    // The server expects ID to be passed or generates it. 
    // Existing code passes { name, emoji }
    // Let's ensure we generate an ID if the server endpoint expects it to claim responsibility 
    // or if the UI relies on optimistic updates with an ID.
    // The previous IDB implementation generated UUIDs client-side.
    // Let's keep generating UUIDs client-side for consistency or rely on server response.
    // Server implementation: accepts ID or generates it.
    const newNotebook = {
      id: crypto.randomUUID(),
      ...notebook
    };
    return api.createNotebook(newNotebook);
  },

  async updateNotebook(id, updates) {
    return api.updateNotebook(id, updates);
  },

  async deleteNotebook(id) {
    // Also delete associated notes
    await api.deleteNotebook(id);
  },

  async getAllNotes(notebookId = null) {
    return api.getNotes(notebookId);
  },

  async getNote(id) {
    return api.getNote(id);
  },

  async createNote(note) {
    const newNote = {
      id: crypto.randomUUID(),
      ...note
    };
    return api.createNote(newNote);
  },

  async updateNote(id, updates) {
    return api.updateNote(id, updates);
  },

  async deleteNote(id) {
    return api.deleteNote(id);
  },

  async searchNotes(query) {
    // Perform client-side search on all notes for now, 
    // or implement server-side search.
    // Given the current server implementation doesn't have a search endpoint,
    // we'll fetch all notes and filter client-side.
    const notes = await this.getAllNotes();
    const lowerQuery = query.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  async getChats(noteId) {
    return api.getChats(noteId);
  },

  async saveChat(chat) {
    const newChat = {
      id: crypto.randomUUID(),
      ...chat
    };
    return api.createChat(newChat);
  },

  async updateChat(id, updates) {
    return api.updateChat(id, updates);
  },

  async toggleFavorite(noteId) {
    const note = await this.getNote(noteId);
    if (note) {
      const updated = await this.updateNote(noteId, { favorite: !note.favorite });
      return updated;
    }
    return null;
  },

  async getFavoriteNotes() {
    // Fetch all and filter
    const notes = await this.getAllNotes();
    return notes.filter(note => note.favorite).sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async createVersion(noteId, content, title) {
    return api.createNoteVersion(noteId, content, title);
  },

  async getVersions(noteId) {
    return api.getNoteVersions(noteId);
  }
};


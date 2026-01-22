import { reactive, computed } from 'vue';
import { storage } from '../services/storage';

const state = reactive({
  notebooks: [],
  notes: [],
  currentNotebook: null,
  currentNote: null,
  isLoading: false,
  searchQuery: ''
});

export const useStore = () => {
  const filteredNotes = computed(() => {
    if (!state.searchQuery) return state.notes;
    const query = state.searchQuery.toLowerCase();
    return state.notes.filter(note =>
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const notebookNotes = computed(() => {
    if (!state.currentNotebook) return state.notes;
    return state.notes.filter(note => note.notebookId === state.currentNotebook.id);
  });

  async function loadNotebooks() {
    state.isLoading = true;
    try {
      state.notebooks = await storage.getAllNotebooks();
    } catch (error) {
      console.error('Failed to load notebooks:', error);
    } finally {
      state.isLoading = false;
    }
  }

  async function loadNotes(notebookId = null) {
    state.isLoading = true;
    try {
      state.notes = await storage.getAllNotes(notebookId);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      state.isLoading = false;
    }
  }

  async function createNotebook(name, emoji = '📓') {
    try {
      const notebook = await storage.createNotebook({ name, emoji });
      state.notebooks.push(notebook);
      return notebook;
    } catch (error) {
      console.error('Failed to create notebook:', error);
      throw error;
    }
  }

  async function updateNotebook(id, updates) {
    try {
      const updated = await storage.updateNotebook(id, updates);
      const index = state.notebooks.findIndex(n => n.id === id);
      if (index !== -1) {
        state.notebooks[index] = updated;
      }
      if (state.currentNotebook?.id === id) {
        state.currentNotebook = updated;
      }
      return updated;
    } catch (error) {
      console.error('Failed to update notebook:', error);
      throw error;
    }
  }

  async function deleteNotebook(id) {
    try {
      await storage.deleteNotebook(id);
      state.notebooks = state.notebooks.filter(n => n.id !== id);
      if (state.currentNotebook?.id === id) {
        state.currentNotebook = null;
        await loadNotes();
      }
    } catch (error) {
      console.error('Failed to delete notebook:', error);
      throw error;
    }
  }

  async function createNote(noteData) {
    try {
      // Accept either object or legacy arguments
      const data = typeof noteData === 'object' ? noteData : {
        notebookId: noteData,
        title: arguments[1] || 'Untitled',
        content: arguments[2] || ''
      };
      const note = await storage.createNote(data);
      state.notes.push(note);
      return note;
    } catch (error) {
      console.error('Failed to create note:', error);
      throw error;
    }
  }

  async function updateNote(id, updates) {
    try {
      const updated = await storage.updateNote(id, updates);
      const index = state.notes.findIndex(n => n.id === id);
      if (index !== -1) {
        state.notes[index] = updated;
      }
      if (state.currentNote?.id === id) {
        state.currentNote = updated;
      }
      return updated;
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  }

  async function deleteNote(id) {
    try {
      await storage.deleteNote(id);
      state.notes = state.notes.filter(n => n.id !== id);
      if (state.currentNote?.id === id) {
        state.currentNote = null;
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  async function searchNotes(query) {
    state.searchQuery = query;
    if (query) {
      state.isLoading = true;
      try {
        const results = await storage.searchNotes(query);
        return results;
      } catch (error) {
        console.error('Failed to search notes:', error);
        return [];
      } finally {
        state.isLoading = false;
      }
    }
    return state.notes;
  }

  function setCurrentNotebook(notebook) {
    state.currentNotebook = notebook;
  }

  function setCurrentNote(note) {
    state.currentNote = note;
  }

  async function toggleFavorite(noteId) {
    const note = await storage.toggleFavorite(noteId);
    if (note) {
      const index = state.notes.findIndex(n => n.id === noteId);
      if (index !== -1) {
        state.notes[index] = note;
      }
      if (state.currentNote?.id === noteId) {
        state.currentNote = note;
      }
    }
    return note;
  }

  async function loadFavoriteNotes() {
    return await storage.getFavoriteNotes();
  }

  return {
    state,
    filteredNotes,
    notebookNotes,
    loadNotebooks,
    loadNotes,
    createNotebook,
    updateNotebook,
    deleteNotebook,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    setCurrentNotebook,
    setCurrentNote,
    toggleFavorite,
    loadFavoriteNotes
  };
};

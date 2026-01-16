<script setup>
import { ref, onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import NotebookList from './components/views/NotebookList.vue';
import NoteEditor from './components/views/NoteEditor.vue';
import QuickCapture from './components/QuickCapture.vue';
import LoginPage from './components/LoginPage.vue';
import { authService } from './services/authService';

const currentNoteId = ref(null);
const currentNotebookId = ref(null);
const quickCaptureRef = ref(null);
const mobileMenuOpen = ref(false);
const isAuthenticated = ref(false);
const isCheckingAuth = ref(true);

onMounted(async () => {
  isAuthenticated.value = authService.isAuthenticated();
  isCheckingAuth.value = false;
});

function handleLoginSuccess() {
  isAuthenticated.value = true;
}

function handleLogout() {
  authService.logout();
  isAuthenticated.value = false;
}

function openNote(noteId) {
  currentNoteId.value = noteId;
  mobileMenuOpen.value = false;
}

function selectNotebook(notebookId) {
  currentNotebookId.value = notebookId;
  currentNoteId.value = null;
  mobileMenuOpen.value = false;
}

function goBack() {
  currentNoteId.value = null;
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function onNoteCreated(note) {
  openNote(note.id);
}

// Expose quick capture to window for easy access
if (typeof window !== 'undefined') {
  window.openQuickCapture = () => {
    quickCaptureRef.value?.open();
  };
}
</script>

<template>
  <!-- Loading state -->
  <div v-if="isCheckingAuth" class="auth-loading">
    <div class="loading-spinner-large"></div>
  </div>
  
  <!-- Login page if not authenticated -->
  <LoginPage v-else-if="!isAuthenticated" @loginSuccess="handleLoginSuccess" />
  
  <!-- Main app when authenticated -->
  <div v-else id="app" :class="{ 'mobile-menu-open': mobileMenuOpen }">
    <!-- Sync status indicator -->
    <div class="sync-indicator" :class="syncStatus">
      <span v-if="syncStatus === 'syncing'" class="sync-spinner"></span>
      <span v-else-if="syncStatus === 'success'">✓</span>
      <span v-else-if="syncStatus === 'error'">!</span>
    </div>
    
    <!-- Logout button -->
    <button class="logout-btn" @click="handleLogout" title="Sign out">
      ⏻
    </button>
    
    <Sidebar @selectNotebook="selectNotebook" :class="{ 'mobile-visible': mobileMenuOpen }" />
    <button class="mobile-menu-toggle" @click="toggleMobileMenu" v-if="!currentNoteId">
      <span v-if="!mobileMenuOpen">☰</span>
      <span v-else>×</span>
    </button>
    <div class="mobile-overlay" v-if="mobileMenuOpen" @click="mobileMenuOpen = false"></div>
    <main class="main-content">
      <NoteEditor
        v-if="currentNoteId"
        :noteId="currentNoteId"
        @goBack="goBack"
      />
      <NotebookList
        v-else
        :notebookId="currentNotebookId"
        @openNote="openNote"
      />
    </main>
    <QuickCapture ref="quickCaptureRef" @noteCreated="onNoteCreated" />
  </div>
</template>

<style>
/* ===============================================
   NOTEBOOKME - Premium Design System
   Inspired by NotebookLM + Obsidian aesthetics
   =============================================== */

:root {
  /* Core brand colors - warm, sophisticated palette */
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;
  --color-primary-subtle: #eef2ff;

  /* Accent colors */
  --color-accent: #f59e0b;
  --color-accent-light: #fbbf24;
  --color-success: #10b981;
  --color-danger: #ef4444;

  /* Neutral palette - clean modern grays */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  --color-bg-elevated: #ffffff;

  /* Text hierarchy - slate tones */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94a3b8;
  --color-text-inverse: #ffffff;

  /* Borders and dividers - clean slate */
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;
  --color-border-focus: var(--color-primary);

  /* Shadows - layered depth */
  --shadow-xs: 0 1px 2px rgba(28, 25, 23, 0.04);
  --shadow-sm: 0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04);
  --shadow-md: 0 4px 6px -1px rgba(28, 25, 23, 0.08), 0 2px 4px -1px rgba(28, 25, 23, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -2px rgba(28, 25, 23, 0.04);
  --shadow-xl: 0 20px 25px -5px rgba(28, 25, 23, 0.1), 0 10px 10px -5px rgba(28, 25, 23, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(28, 25, 23, 0.2);
  --shadow-focus: 0 0 0 3px rgba(99, 102, 241, 0.15);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  /* Border radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-bounce: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
}

body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  line-height: 1.6;
}

#app {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-primary);
}

.main-content {
  flex: 1 1 0%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background:
    radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
    var(--color-bg-secondary);
}

/* Keyboard shortcut hints - refined */
kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 7px;
  font-size: 11px;
  font-family: var(--font-sans);
  font-weight: 500;
  line-height: 1;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-xs), inset 0 -1px 0 rgba(0,0,0,0.06);
}

/* Mobile menu toggle - elevated design */
.mobile-menu-toggle {
  display: none;
  position: fixed;
  top: var(--space-4);
  left: var(--space-4);
  z-index: 1001;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  font-size: 20px;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  color: var(--color-text-primary);
}

.mobile-menu-toggle:hover {
  background: var(--color-bg-secondary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-xl);
}

.mobile-menu-toggle:active {
  transform: translateY(0);
  box-shadow: var(--shadow-md);
}

/* Mobile overlay with blur */
.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(28, 25, 23, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 999;
  animation: overlayFadeIn var(--transition-slow) ease;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(4px);
  }
}

/* Button base styles */
button {
  font-family: var(--font-sans);
}

/* Input base styles */
input, textarea, select {
  font-family: var(--font-sans);
}

/* Selection styling */
::selection {
  background: var(--color-primary-subtle);
  color: var(--color-primary-dark);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px 0;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--color-border) 0%, rgba(148, 163, 184, 0.4) 100%);
  border-radius: var(--radius-full);
  border: 3px solid transparent;
  background-clip: padding-box;
  transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, var(--color-text-tertiary) 0%, rgba(99, 102, 241, 0.3) 100%);
  border: 3px solid transparent;
  background-clip: padding-box;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

/* Firefox scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

/* Focus visible for accessibility */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Improved input focus states */
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), var(--shadow-sm) !important;
}

/* Button focus states */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  #app {
    flex-direction: column;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .mobile-overlay {
    display: block;
  }

  #app .sidebar {
    position: fixed;
    left: -100%;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transition: left var(--transition-slow) ease;
    box-shadow: var(--shadow-2xl);
  }

  #app .sidebar.mobile-visible {
    left: 0;
  }

  .main-content {
    width: 100%;
    padding-top: 0;
  }
}

/* Utility animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>

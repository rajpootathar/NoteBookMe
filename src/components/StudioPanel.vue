<template>
  <div class="studio-panel">
    <div class="studio-header">
      <h2>Studio</h2>
      <p class="studio-subtitle">Create from your sources</p>
    </div>

    <div class="studio-grid">
      <button class="studio-tile audio" @click="$emit('generateAudio')">
        <div class="tile-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="22"/>
          </svg>
        </div>
        <span class="tile-label">Audio Overview</span>
        <span class="tile-badge">AI</span>
      </button>

      <button class="studio-tile video" @click="$emit('generateVideo')">
        <div class="tile-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M10 9l5 3-5 3V9z"/>
          </svg>
        </div>
        <span class="tile-label">Video Overview</span>
        <span class="tile-badge new">New</span>
      </button>

      <button class="studio-tile mindmap" @click="$emit('generateMindmap')">
        <div class="tile-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="4" cy="6" r="2"/>
            <circle cx="20" cy="6" r="2"/>
            <circle cx="4" cy="18" r="2"/>
            <circle cx="20" cy="18" r="2"/>
            <path d="M9.5 10.5L6 8M14.5 10.5L18 8M9.5 13.5L6 16M14.5 13.5L18 16"/>
          </svg>
        </div>
        <span class="tile-label">Mind Map</span>
      </button>

      <button class="studio-tile reports" @click="showReports = !showReports">
        <div class="tile-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <span class="tile-label">Reports</span>
        <svg class="tile-chevron" :class="{ rotated: showReports }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
    </div>

    <div v-if="showReports" class="reports-submenu">
      <button class="report-item" @click="$emit('generateReport', 'briefing')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <path d="M14 2v6h6"/>
        </svg>
        <span>Briefing Doc</span>
      </button>
      <button class="report-item" @click="$emit('generateReport', 'study')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span>Study Guide</span>
      </button>
      <button class="report-item" @click="$emit('generateReport', 'faq')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>FAQ</span>
      </button>
      <button class="report-item" @click="$emit('generateReport', 'timeline')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="2" x2="12" y2="22"/>
          <circle cx="12" cy="6" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="18" r="2"/>
          <path d="M14 6h4M14 12h6M14 18h4"/>
        </svg>
        <span>Timeline</span>
      </button>
    </div>

    <div class="studio-divider"></div>

    <div class="studio-section">
      <h3>Generated Content</h3>
      <div v-if="generatedContent.length === 0" class="empty-content">
        <p>No content generated yet</p>
        <span>Select an option above to get started</span>
      </div>
      <div v-else class="content-list">
        <div v-for="item in generatedContent" :key="item.id" class="content-item" @click="$emit('openContent', item)">
          <div class="content-icon" :class="item.type">
            <svg v-if="item.type === 'audio'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
            </svg>
            <svg v-else-if="item.type === 'document'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            </svg>
          </div>
          <div class="content-info">
            <span class="content-title">{{ item.title }}</span>
            <span class="content-date">{{ formatDate(item.createdAt) }}</span>
          </div>
          <button class="content-menu" @click.stop>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  generatedContent: {
    type: Array,
    default: () => []
  }
});

defineEmits(['generateAudio', 'generateVideo', 'generateMindmap', 'generateReport', 'openContent']);

const showReports = ref(false);

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
.studio-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border-light);
  overflow-y: auto;
}

.studio-header {
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.studio-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.studio-subtitle {
  margin: var(--space-1) 0 0;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.studio-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  padding: var(--space-4);
}

.studio-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.studio-tile:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.tile-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.studio-tile.audio .tile-icon {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  color: #6366f1;
}

.studio-tile.video .tile-icon {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%);
  color: #ef4444;
}

.studio-tile.mindmap .tile-icon {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%);
  color: #10b981;
}

.studio-tile.reports .tile-icon {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.15) 100%);
  color: #f59e0b;
}

.tile-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.tile-badge {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  padding: 2px 6px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: var(--radius-full);
}

.tile-badge.new {
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
}

.tile-chevron {
  position: absolute;
  bottom: var(--space-2);
  right: var(--space-2);
  color: var(--color-text-tertiary);
  transition: transform 0.2s ease;
}

.tile-chevron.rotated {
  transform: rotate(180deg);
}

.reports-submenu {
  display: flex;
  flex-direction: column;
  padding: 0 var(--space-4) var(--space-4);
  gap: var(--space-1);
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.report-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
}

.report-item:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-primary-light);
  color: var(--color-primary);
  transform: translateX(4px);
}

.report-item svg {
  flex-shrink: 0;
}

.studio-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--space-2) var(--space-4);
}

.studio-section {
  flex: 1;
  padding: var(--space-4);
}

.studio-section h3 {
  margin: 0 0 var(--space-3);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary);
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.empty-content p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.empty-content span {
  margin-top: var(--space-1);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.content-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.content-item:hover {
  background: var(--color-bg-elevated);
  border-color: var(--color-border);
}

.content-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.content-icon.audio {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.content-icon.document {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.content-info {
  flex: 1;
  min-width: 0;
}

.content-title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-date {
  display: block;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.content-menu {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-tertiary);
  opacity: 0;
  transition: all 0.15s ease;
}

.content-item:hover .content-menu {
  opacity: 1;
}

.content-menu:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}
</style>

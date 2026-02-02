<template>
  <div class="help-container">
    <!-- Floating Help Button -->
    <button
      class="help-button"
      @click="showHelp = !showHelp"
      title="Writing shortcuts & commands"
    >
      <svg v-if="!showHelp" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <!-- Help Overlay -->
    <Transition name="help">
      <div v-if="showHelp" class="help-overlay" @click.self="showHelp = false">
        <div class="help-panel">
          <div class="help-header">
            <h3>Writing Shortcuts</h3>
            <button class="close-btn" @click="showHelp = false">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="help-content">
            <!-- Slash Commands -->
            <section class="help-section">
              <h4>Slash Commands</h4>
              <p class="section-intro">Type <kbd>/</kbd> to open the command menu</p>
              <div class="shortcut-grid">
                <div class="shortcut-item">
                  <kbd>/h1</kbd> <kbd>/h2</kbd> <kbd>/h3</kbd>
                  <span>Headings</span>
                </div>
                <div class="shortcut-item">
                  <kbd>/bullet</kbd>
                  <span>Bullet list</span>
                </div>
                <div class="shortcut-item">
                  <kbd>/numbered</kbd>
                  <span>Numbered list</span>
                </div>
                <div class="shortcut-item">
                  <kbd>/todo</kbd>
                  <span>Checkbox</span>
                </div>
                <div class="shortcut-item">
                  <kbd>/quote</kbd>
                  <span>Blockquote</span>
                </div>
                <div class="shortcut-item">
                  <kbd>/code</kbd>
                  <span>Code block</span>
                </div>
                <div class="shortcut-item">
                  <kbd>/divider</kbd>
                  <span>Horizontal line</span>
                </div>
                <div class="shortcut-item">
                  <kbd>/table</kbd>
                  <span>Insert table</span>
                </div>
                <div class="shortcut-item">
                  <kbd>/link</kbd>
                  <span>Insert link</span>
                </div>
              </div>
            </section>

            <!-- Markdown Prefixes -->
            <section class="help-section">
              <h4>Line Prefixes</h4>
              <p class="section-intro">Type at the start of a line</p>
              <div class="shortcut-grid">
                <div class="shortcut-item">
                  <kbd>#</kbd> <kbd>##</kbd> <kbd>###</kbd>
                  <span>Headings</span>
                </div>
                <div class="shortcut-item">
                  <kbd>-</kbd> or <kbd>*</kbd>
                  <span>Bullet point</span>
                </div>
                <div class="shortcut-item">
                  <kbd>1.</kbd>
                  <span>Numbered item</span>
                </div>
                <div class="shortcut-item">
                  <kbd>></kbd>
                  <span>Quote</span>
                </div>
                <div class="shortcut-item">
                  <kbd>- [ ]</kbd>
                  <span>Checkbox</span>
                </div>
              </div>
            </section>

            <!-- Text Formatting -->
            <section class="help-section">
              <h4>Text Formatting</h4>
              <p class="section-intro">Wrap text or type around selection</p>
              <div class="shortcut-grid">
                <div class="shortcut-item">
                  <kbd>**text**</kbd>
                  <span><strong>Bold</strong></span>
                </div>
                <div class="shortcut-item">
                  <kbd>_text_</kbd>
                  <span><em>Italic</em></span>
                </div>
                <div class="shortcut-item">
                  <kbd>`text`</kbd>
                  <span><code>Code</code></span>
                </div>
                <div class="shortcut-item">
                  <kbd>~~text~~</kbd>
                  <span><s>Strikethrough</s></span>
                </div>
              </div>
            </section>

            <!-- AI Suggestions -->
            <section class="help-section">
              <h4>AI Suggestions</h4>
              <p class="section-intro">Enable in Settings to use</p>
              <div class="shortcut-grid">
                <div class="shortcut-item">
                  <kbd>Tab</kbd>
                  <span>Accept full suggestion</span>
                </div>
                <div class="shortcut-item">
                  <kbd>→</kbd>
                  <span>Accept word by word</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Esc</kbd>
                  <span>Dismiss suggestion</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl+Space</kbd>
                  <span>Request suggestion</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const showHelp = ref(false);
</script>

<style scoped>
.help-container {
  position: relative;
}

.help-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  cursor: pointer;
  color: var(--color-text-secondary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.help-button:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
}

.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.help-panel {
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.help-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-tertiary);
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-5);
}

.help-section {
  margin-bottom: var(--space-5);
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h4 {
  margin: 0 0 var(--space-1) 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-intro {
  margin: 0 0 var(--space-3) 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space-2);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.shortcut-item kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 2px 6px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.shortcut-item span {
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.shortcut-item code {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  padding: 1px 4px;
  border-radius: var(--radius-sm);
  font-size: 11px;
}

/* Transitions */
.help-enter-active,
.help-leave-active {
  transition: opacity 0.2s ease;
}

.help-enter-active .help-panel,
.help-leave-active .help-panel {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.help-enter-from,
.help-leave-to {
  opacity: 0;
}

.help-enter-from .help-panel,
.help-leave-to .help-panel {
  transform: scale(0.95);
  opacity: 0;
}

@media (max-width: 640px) {
  .help-button {
    bottom: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
  }

  .shortcut-grid {
    grid-template-columns: 1fr;
  }
}
</style>

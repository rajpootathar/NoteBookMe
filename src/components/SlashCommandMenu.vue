<template>
  <div
    v-if="visible"
    class="slash-menu"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
    @keydown.stop
  >
    <div class="slash-menu-header">
      <span class="slash-filter">/{{ filter }}</span>
      <span class="slash-hint">Type to filter</span>
    </div>
    <div class="slash-menu-list" ref="listRef">
      <button
        v-for="(cmd, index) in filteredCommands"
        :key="cmd.name"
        :class="['slash-menu-item', { active: index === selectedIndex }]"
        @click="selectCommand(cmd)"
        @mouseenter="selectedIndex = index"
      >
        <span class="cmd-icon">{{ cmd.icon }}</span>
        <div class="cmd-info">
          <span class="cmd-name">/{{ cmd.name }}</span>
          <span class="cmd-desc">{{ cmd.description }}</span>
        </div>
      </button>
      <div v-if="filteredCommands.length === 0" class="slash-menu-empty">
        No commands match "{{ filter }}"
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Object,
    default: () => ({ top: 0, left: 0 })
  },
  filter: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select', 'close']);

const selectedIndex = ref(0);
const listRef = ref(null);

const commands = [
  { name: 'h1', icon: 'H1', description: 'Large heading', insert: '# ', cursorOffset: 2 },
  { name: 'h2', icon: 'H2', description: 'Medium heading', insert: '## ', cursorOffset: 3 },
  { name: 'h3', icon: 'H3', description: 'Small heading', insert: '### ', cursorOffset: 4 },
  { name: 'bullet', icon: '•', description: 'Bullet list', insert: '- ', cursorOffset: 2 },
  { name: 'numbered', icon: '1.', description: 'Numbered list', insert: '1. ', cursorOffset: 3 },
  { name: 'todo', icon: '☐', description: 'Checkbox item', insert: '- [ ] ', cursorOffset: 6 },
  { name: 'quote', icon: '"', description: 'Blockquote', insert: '> ', cursorOffset: 2 },
  { name: 'code', icon: '<>', description: 'Code block', insert: '```\n\n```', cursorOffset: 4 },
  { name: 'divider', icon: '—', description: 'Horizontal rule', insert: '\n---\n', cursorOffset: 5 },
  { name: 'table', icon: '⊞', description: '2x2 table', insert: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n| Cell 3   | Cell 4   |', cursorOffset: 2 },
  { name: 'link', icon: '🔗', description: 'Insert link', insert: '[text](url)', cursorOffset: 1 }
];

const filteredCommands = computed(() => {
  if (!props.filter) return commands;
  const f = props.filter.toLowerCase();
  return commands.filter(cmd =>
    cmd.name.toLowerCase().includes(f) ||
    cmd.description.toLowerCase().includes(f)
  );
});

watch(() => props.filter, () => {
  selectedIndex.value = 0;
});

watch(() => props.visible, (visible) => {
  if (visible) {
    selectedIndex.value = 0;
  }
});

function selectCommand(cmd) {
  emit('select', cmd);
}

function handleKeydown(e) {
  if (!props.visible) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1);
    scrollToSelected();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
    scrollToSelected();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (filteredCommands.value.length > 0) {
      selectCommand(filteredCommands.value[selectedIndex.value]);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    emit('close');
  }
}

function scrollToSelected() {
  nextTick(() => {
    const list = listRef.value;
    if (!list) return;
    const item = list.children[selectedIndex.value];
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

defineExpose({ handleKeydown });
</script>

<style scoped>
.slash-menu {
  position: fixed;
  z-index: 1000;
  min-width: 240px;
  max-width: 320px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideIn 0.15s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slash-menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
}

.slash-filter {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
}

.slash-hint {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.slash-menu-list {
  max-height: 280px;
  overflow-y: auto;
  padding: var(--space-1);
}

.slash-menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  transition: all 0.1s ease;
}

.slash-menu-item:hover,
.slash-menu-item.active {
  background: var(--color-primary-subtle);
}

.slash-menu-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
}

.cmd-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.slash-menu-item.active .cmd-icon {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.cmd-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cmd-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.cmd-desc {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.slash-menu-empty {
  padding: var(--space-4);
  text-align: center;
  font-size: 13px;
  color: var(--color-text-tertiary);
}
</style>

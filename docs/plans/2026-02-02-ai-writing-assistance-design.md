# AI Writing Assistance & Markdown Editor Enhancement

**Date:** 2026-02-02
**Status:** Approved

## Overview

Add intelligent writing assistance to the note editor with inline AI suggestions (like GitHub Copilot) and enhanced markdown editing features. Designed for regular users, not power writers - assistive, not generative.

## Goals

- Help users complete thoughts with short AI suggestions
- Make markdown accessible without memorizing syntax
- Minimize token usage through smart context and user control
- Keep features opt-in and configurable

---

## Feature 1: AI Inline Suggestions

### User Experience

1. User types in the editor
2. Based on settings, AI generates short completions
3. Suggestion appears as **dimmed gray italic** ghost text after cursor
4. User accepts, partially accepts, or dismisses

### Trigger Modes (User Configurable)

| Mode | Behavior |
|------|----------|
| **Manual** | Press `Ctrl+Space` to request suggestion |
| **Smart** | Suggestions after 1-2 second pause at sentence end |
| **Full automatic** | Suggestions on every pause with debouncing |

### Suggestion Length (User Configurable)

| Length | Behavior |
|--------|----------|
| **Minimal** | Few words to complete current thought |
| **Balanced** | Complete the sentence |
| **Generous** | Next sentence (triggers after `.` or paragraph end) |

### Keybindings

| Key | Action |
|-----|--------|
| `Tab` | Accept full suggestion |
| `→` (Right arrow) | Accept word by word |
| `Esc` | Dismiss suggestion |
| Keep typing | Dismiss and continue |

### Context Strategy (Token Optimization)

Send minimal context to AI:
- Current paragraph (~100-200 tokens)
- Nearby headings and key points (~50-100 tokens)
- Total: ~200-300 tokens per request

Response limited to:
- Minimal: ~10 tokens
- Balanced: ~20 tokens
- Generous: ~30-50 tokens

---

## Feature 2: Markdown Auto-Formatting

### Prefix Auto-Detect

When user types at line start and presses Space:

| Input | Result |
|-------|--------|
| `# ` | H1 heading |
| `## ` | H2 heading |
| `### ` | H3 heading |
| `- ` or `* ` | Bullet point |
| `1. ` | Numbered list |
| `> ` | Blockquote |
| `- [ ] ` | Checkbox/todo |

**Visual behavior:** Prefix shrinks and fades to gray, content displays styled. Clicking the line reveals full markdown again.

### Wrapper Shortcuts

| Input | Result |
|-------|--------|
| `**text**` | **Bold** |
| `_text_` or `__text__` | *Italic* |
| `` `text` `` | `Inline code` |
| `~~text~~` | ~~Strikethrough~~ |

Works on selection: select text, type opening wrapper, auto-wraps.

---

## Feature 3: Slash Commands

Type `/` anywhere to trigger dropdown picker.

### Available Commands

| Command | Inserts |
|---------|---------|
| `/h1` | `# ` - Heading 1 |
| `/h2` | `## ` - Heading 2 |
| `/h3` | `### ` - Heading 3 |
| `/bullet` | `- ` - Bullet list item |
| `/numbered` | `1. ` - Numbered list item |
| `/quote` | `> ` - Blockquote |
| `/code` | Code block with language prompt |
| `/divider` | `---` - Horizontal rule |
| `/todo` | `- [ ] ` - Checkbox item |
| `/table` | Simple 2x2 table template |
| `/link` | `[text](url)` - Link template |

### Dropdown Behavior

- Opens on `/` keypress
- Filters as user types (e.g., `/he` shows only headings)
- Arrow keys to navigate
- Enter to select
- Esc to dismiss

---

## Feature 4: Help Panel

### Floating Help Button

- Small `?` icon in bottom-right corner of editor
- Click opens overlay modal

### Help Content

- Slash commands list with descriptions
- Markdown shortcuts cheat sheet
- AI suggestion keybindings
- Dismissable via X button or click outside

---

## Feature 5: Settings

### Location

New section in existing Settings modal.

### Structure

```
AI Writing Assistance
├── [Toggle] Enable inline suggestions (default: OFF)
├── [Dropdown] Trigger mode
│   ├── Manual (Ctrl+Space)
│   ├── Smart (on pause) [default]
│   └── Full automatic
└── [Dropdown] Suggestion length
    ├── Minimal (few words)
    ├── Balanced (sentence) [default]
    └── Generous (next sentence)
```

### Defaults

- **Enabled:** OFF (opt-in to avoid surprise token usage)
- **Trigger mode:** Smart
- **Suggestion length:** Balanced

---

## Technical Implementation

### Component Changes

**`MarkdownEditor.vue`:**
- Ghost text rendering layer (positioned after cursor)
- Keydown handlers for Tab, →, Esc, Ctrl+Space
- Debounced suggestion trigger logic
- Prefix/wrapper detection and auto-formatting
- Slash command integration

### New Components

| Component | Purpose |
|-----------|---------|
| `SlashCommandMenu.vue` | Floating dropdown for `/` commands |
| `HelpPanel.vue` | Floating `?` overlay with shortcuts |
| `InlineSuggestion.vue` | Ghost text display and positioning |

### New Service

**`suggestionService.js`:**
- `getSuggestion(context, options)` - Calls AI with minimal context
- `buildContext(content, cursorPos)` - Extracts paragraph + headings
- Debounce and request cancellation logic

### API Endpoint

**`POST /api/ai/suggest`**

Request:
```json
{
  "context": "Current paragraph text...",
  "headings": ["Nearby heading 1", "Nearby heading 2"],
  "length": "balanced"
}
```

Response:
```json
{
  "suggestion": "completion text here"
}
```

### Settings Storage

Add to settings store:
```js
aiSuggestions: {
  enabled: false,
  triggerMode: 'smart',    // 'manual' | 'smart' | 'full'
  length: 'balanced'       // 'minimal' | 'balanced' | 'generous'
}
```

---

## Implementation Order

1. **Markdown helpers** (no AI, low risk)
   - Prefix auto-formatting with fade effect
   - Wrapper shortcuts
   - Slash command dropdown

2. **Help panel**
   - Floating ? button
   - Shortcuts overlay

3. **Settings UI**
   - Add AI Writing Assistance section
   - Wire up to settings store

4. **AI suggestions**
   - Backend endpoint
   - Suggestion service
   - Ghost text rendering
   - Trigger modes
   - Accept/dismiss keybindings

---

## Out of Scope (Future)

- RAG-enhanced suggestions (using other notes for context)
- Custom slash commands
- Suggestion history/analytics
- Multi-language support for suggestions

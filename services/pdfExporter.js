import { marked } from 'marked';

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    line-height: 1.7;
    color: #1a1a2e;
    max-width: 800px;
    margin: 0 auto;
    padding: 48px 40px;
    background: #fff;
  }
  h1 { font-size: 28px; margin-bottom: 8px; color: #0f0f23; }
  h2 { font-size: 22px; margin-top: 32px; margin-bottom: 12px; color: #16213e; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; }
  h3 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; color: #1a1a2e; }
  p { margin-bottom: 14px; }
  ul, ol { margin-bottom: 14px; padding-left: 28px; }
  li { margin-bottom: 4px; }
  code { background: #f4f4f8; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; font-family: 'Menlo', 'Consolas', monospace; }
  pre { background: #f4f4f8; padding: 16px; border-radius: 6px; overflow-x: auto; margin-bottom: 16px; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #6c63ff; padding-left: 16px; margin: 16px 0; color: #555; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f4f4f8; font-weight: 600; }
  img { max-width: 100%; }
  hr { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
  .note-separator { page-break-before: always; border-top: 2px solid #6c63ff; margin: 48px 0 32px; padding-top: 32px; }
  .note-meta { color: #888; font-size: 13px; margin-bottom: 20px; }
  .note-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
  .note-tag { background: #eef; color: #6c63ff; padding: 2px 10px; border-radius: 12px; font-size: 12px; }
  .export-header { text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #6c63ff; }
  .export-header h1 { font-size: 32px; margin-bottom: 8px; }
  .export-header .date { color: #888; font-size: 14px; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none; }
  }
`;

function renderTags(tags) {
  if (!tags || tags.length === 0) return '';
  return `<div class="note-tags">${tags.map(t => `<span class="note-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

/**
 * Generate a styled HTML page for a single note (print-ready).
 */
export function noteToPrintHtml(note) {
  const htmlContent = marked(note.content || '');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(note.title || 'Untitled')}</title>
  <style>${CSS}</style>
</head>
<body>
  <h1>${escapeHtml(note.title || 'Untitled')}</h1>
  ${renderTags(note.tags)}
  <div class="note-meta">${formatDate(note.updatedAt || note.createdAt)}</div>
  <div class="note-body">${htmlContent}</div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;
}

/**
 * Generate a styled HTML page for an entire notebook (print-ready).
 */
export function notebookToPrintHtml(notes, notebookName) {
  const noteBlocks = notes.map((note, i) => {
    const htmlContent = marked(note.content || '');
    const separator = i > 0 ? 'note-separator' : '';
    return `
      <div class="${separator}">
        <h2>${escapeHtml(note.title || 'Untitled')}</h2>
        ${renderTags(note.tags)}
        <div class="note-meta">${formatDate(note.updatedAt || note.createdAt)}</div>
        <div class="note-body">${htmlContent}</div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(notebookName)} - Export</title>
  <style>${CSS}</style>
</head>
<body>
  <div class="export-header">
    <h1>${escapeHtml(notebookName)}</h1>
    <div class="date">Exported on ${formatDate(Date.now())} &middot; ${notes.length} note${notes.length !== 1 ? 's' : ''}</div>
  </div>
  ${noteBlocks}
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;
}

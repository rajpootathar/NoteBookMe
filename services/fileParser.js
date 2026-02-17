import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.csv', '.json', '.html', '.xml', '.yaml', '.yml'
]);

/**
 * Clean up raw PDF text into readable markdown.
 * Handles broken lines, page artifacts, detects headings/lists.
 */
function cleanPdfText(raw) {
  // 0. Normalize multi-space runs within lines (PDF often double-spaces words)
  let text = raw.replace(/  +/g, ' ');

  // Strip "Page N" prefixes glued to content (e.g., "Page 1Title...")
  text = text.replace(/^Page\s*\d+/gim, '');

  let lines = text.split('\n');

  // 1. Strip common page artifacts
  lines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true; // keep blank lines for paragraph detection
    // Standalone page numbers
    if (/^\d{1,4}$/.test(trimmed)) return false;
    // "Page X of Y" or "Page X" patterns
    if (/^page\s+\d+\s*(of\s+\d+)?$/i.test(trimmed)) return false;
    // Repeated dashes/underscores (visual separators)
    if (/^[-_=]{10,}$/.test(trimmed)) return false;
    return true;
  });

  // 2. Merge broken lines (lines that end mid-sentence)
  const merged = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      merged.push('');
      continue;
    }

    const prev = merged.length > 0 ? merged[merged.length - 1] : '';
    const prevTrimmed = prev.trim();

    // Merge if previous line doesn't end a sentence and current starts lowercase
    if (
      prevTrimmed &&
      !prevTrimmed.match(/[.!?:;]\s*$/) &&
      trimmed.match(/^[a-z]/) &&
      !isHeadingCandidate(prevTrimmed) &&
      !isListItem(trimmed) &&
      !isListItem(prevTrimmed)
    ) {
      if (prevTrimmed.endsWith('-')) {
        merged[merged.length - 1] = prevTrimmed.slice(0, -1) + trimmed;
      } else {
        merged[merged.length - 1] = prevTrimmed + ' ' + trimmed;
      }
    } else {
      merged.push(trimmed);
    }
  }

  // 3. Convert to markdown structure
  const result = [];
  for (const line of merged) {
    if (!line) {
      result.push('');
      continue;
    }

    // ALL CAPS headings → markdown heading
    if (isHeadingCandidate(line)) {
      result.push('');
      result.push(`## ${toTitleCase(line)}`);
      result.push('');
      continue;
    }

    // Unicode bullets → markdown list
    const listMatch = line.match(/^[•●○▪▸►→‣⁃]\s*(.*)/);
    if (listMatch) {
      result.push(`- ${listMatch[1]}`);
      continue;
    }

    result.push(line);
  }

  // 4. Clean up excessive blank lines
  let output = result.join('\n');
  output = output.replace(/\n{3,}/g, '\n\n');
  return output.trim();
}

function isHeadingCandidate(line) {
  if (line.length > 80) return false;
  if (line.length < 3) return false;
  if (isListItem(line)) return false;

  // Only treat ALL CAPS short lines as headings — high confidence
  if (isAllCaps(line) && line.length < 60 && !line.match(/[,;.]$/)) {
    return true;
  }

  return false;
}

function isAllCaps(str) {
  const letters = str.replace(/[^a-zA-Z]/g, '');
  return letters.length > 2 && letters === letters.toUpperCase();
}

function isListItem(line) {
  return /^[•●○▪▸►→‣⁃\-*]\s/.test(line.trim()) || /^\d+[.)]\s/.test(line.trim());
}

function toTitleCase(str) {
  // Only convert if ALL CAPS, otherwise leave as-is
  if (!isAllCaps(str)) return str;
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Extract text content from an uploaded file buffer.
 * Returns { title, content, tags } ready for note creation.
 */
export async function parseFile(buffer, filename, mimetype) {
  const ext = ('.' + filename.split('.').pop()).toLowerCase();
  const title = filename.replace(/\.[^/.]+$/, '');

  // PDF
  if (ext === '.pdf' || mimetype === 'application/pdf') {
    const result = await pdfParse(Buffer.from(buffer));
    return {
      title,
      content: cleanPdfText(result.text || ''),
      tags: ['imported', 'pdf']
    };
  }

  // DOCX
  if (ext === '.docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.convertToMarkdown({ buffer: Buffer.from(buffer) });
    return {
      title,
      content: result.value.trim(),
      tags: ['imported', 'docx']
    };
  }

  // DOC (older format) — mammoth supports .doc too
  if (ext === '.doc' || mimetype === 'application/msword') {
    try {
      const result = await mammoth.convertToMarkdown({ buffer: Buffer.from(buffer) });
      return {
        title,
        content: result.value.trim(),
        tags: ['imported', 'doc']
      };
    } catch {
      return {
        title,
        content: Buffer.from(buffer).toString('utf-8'),
        tags: ['imported', 'doc']
      };
    }
  }

  // Plain text-based files
  if (TEXT_EXTENSIONS.has(ext) || (mimetype && mimetype.startsWith('text/'))) {
    const content = Buffer.from(buffer).toString('utf-8');
    const typeTag = ext.replace('.', '');
    return {
      title,
      content,
      tags: ['imported', typeTag]
    };
  }

  // Fallback: try to read as text
  return {
    title,
    content: Buffer.from(buffer).toString('utf-8'),
    tags: ['imported', 'file']
  };
}

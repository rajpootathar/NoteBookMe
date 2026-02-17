import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.csv', '.json', '.html', '.xml', '.yaml', '.yml'
]);

/**
 * Clean up raw PDF text into readable markdown.
 * Handles broken lines, page artifacts, detects headings/lists.
 */
function cleanPdfText(raw) {
  let lines = raw.split('\n');

  // 1. Strip common page artifacts (page numbers, headers/footers)
  lines = lines.filter(line => {
    const trimmed = line.trim();
    // Standalone page numbers
    if (/^\d{1,4}$/.test(trimmed)) return false;
    // "Page X of Y" patterns
    if (/^page\s+\d+\s*(of\s+\d+)?$/i.test(trimmed)) return false;
    // Repeated dashes/underscores (visual separators)
    if (/^[-_=]{10,}$/.test(trimmed)) return false;
    return true;
  });

  // 2. Merge broken lines (lines that end mid-sentence)
  const merged = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      merged.push('');
      continue;
    }

    // Check if this line should merge with the next
    const prev = merged.length > 0 ? merged[merged.length - 1] : '';

    // A line likely continues the previous if:
    // - Previous line doesn't end with sentence-ending punctuation
    // - Previous line isn't empty
    // - Current line starts with lowercase
    // - Previous line isn't a heading candidate
    const prevTrimmed = prev.trim();
    if (
      prevTrimmed &&
      !prevTrimmed.match(/[.!?:;]\s*$/) &&
      !prevTrimmed.match(/^\s*$/) &&
      trimmed.match(/^[a-z]/) &&
      !isHeadingCandidate(prevTrimmed) &&
      !isListItem(trimmed) &&
      !isListItem(prevTrimmed)
    ) {
      // Merge with previous: handle hyphenation
      if (prevTrimmed.endsWith('-')) {
        merged[merged.length - 1] = prevTrimmed.slice(0, -1) + trimmed;
      } else {
        merged[merged.length - 1] = prevTrimmed + ' ' + trimmed;
      }
    } else {
      merged.push(line);
    }
  }

  // 3. Convert to markdown structure
  const result = [];
  for (const line of merged) {
    const trimmed = line.trim();

    if (!trimmed) {
      result.push('');
      continue;
    }

    // Detect headings: short lines, all caps, or ending with no punctuation
    if (isHeadingCandidate(trimmed)) {
      // Determine heading level based on context
      const level = isAllCaps(trimmed) && trimmed.length < 40 ? '##' : '###';
      result.push('');
      result.push(`${level} ${toTitleCase(trimmed)}`);
      result.push('');
      continue;
    }

    // Detect bullet-like patterns and normalize
    const listMatch = trimmed.match(/^[•●○▪▸►→‣⁃]\s*(.*)/);
    if (listMatch) {
      result.push(`- ${listMatch[1]}`);
      continue;
    }

    // Detect numbered lists: "1." or "1)" patterns
    const numListMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
    if (numListMatch) {
      result.push(`${numListMatch[1]}. ${numListMatch[2]}`);
      continue;
    }

    result.push(trimmed);
  }

  // 4. Clean up excessive blank lines (max 2 consecutive)
  let output = result.join('\n');
  output = output.replace(/\n{4,}/g, '\n\n\n');
  return output.trim();
}

function isHeadingCandidate(line) {
  // Short line (likely a title), doesn't end with comma or common sentence enders
  // that suggest mid-paragraph, and isn't a list item
  if (line.length > 80) return false;
  if (line.length < 3) return false;
  if (isListItem(line)) return false;
  if (line.match(/[,;]$/)) return false;

  // All caps short line = almost certainly a heading
  if (isAllCaps(line) && line.length < 60) return true;

  // Short line not ending in period, with significant words
  if (line.length < 50 && !line.match(/[.!?,;:]$/) && line.split(/\s+/).length <= 8) {
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
    const parser = new PDFParse({ data: Buffer.from(buffer) });
    const result = await parser.getText();
    const rawText = result.text || result.pages?.map(p => p.text).join('\n\n') || '';
    await parser.destroy();
    return {
      title,
      content: cleanPdfText(rawText),
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

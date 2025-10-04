import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param dirty - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'span', 'div',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'sup', 'sub'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'src', 'alt', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitizes CSS to prevent malicious styling
 * @param css - The CSS string to sanitize
 * @returns Sanitized CSS string
 */
export function sanitizeCSS(css: string): string {
  return DOMPurify.sanitize(css, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

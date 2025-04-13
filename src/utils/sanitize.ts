/**
 * Sanitizes user input to prevent XSS attacks
 * 
 * @param input The user input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Replace HTML tags with their entity equivalents
  let sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remove any potential script tags (extra precaution)
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Limit length to prevent DoS attacks
  const MAX_LENGTH = 10000; // 10K characters should be more than enough
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

/**
 * Sanitizes markdown content to prevent XSS attacks while preserving markdown formatting
 * 
 * @param markdown The markdown content to sanitize
 * @returns Sanitized markdown string
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  // Replace HTML tags with their entity equivalents, but preserve markdown syntax
  let sanitized = markdown
    .replace(/<(?!\/?code>|\/?pre>|\/?strong>|\/?em>|\/?blockquote>|\/?[uo]l>|\/?li>|\/?p>|br\/?>|\/?\w+\s?\/?>)/gi, '&lt;')
    .replace(/(?<!\&lt;)>/g, '&gt;')
    .replace(/(?<!\\)&(?![a-z]+;)/g, '&amp;')
    .replace(/(?<!\\)"/g, '&quot;')
    .replace(/(?<!\\)'/g, '&#x27;');
  
  // Remove any potential script tags or event handlers
  sanitized = sanitized.replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, 'data-blocked=');
  
  // Limit length to prevent DoS attacks
  const MAX_LENGTH = 50000; // 50K characters for markdown (which might be longer)
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}

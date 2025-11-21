/**
 * Markdown Renderer Component
 * Renders markdown content with proper styling
 */

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    if (!text) return '';
    
    let html = text;
    
    // Code blocks first (before other processing)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, (match, lang, code) => {
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre class="bg-surface-muted border border-subtle rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono text-secondary">${escapedCode}</code></pre>`;
    });
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-primary mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-primary mt-8 mb-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-primary mt-10 mb-5">$1</h1>');
    
    // Bold and italic (bold first to avoid conflicts)
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-primary">$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic text-secondary">$1</em>');
    
    // Inline code (after bold/italic)
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-surface-muted px-1.5 py-0.5 rounded text-sm font-mono text-brand">$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-accent hover:text-brand-primary-hover underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Process lists - need to handle multiline
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
      
      if (listMatch) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(`<li class="mb-1 text-secondary">${listMatch[3]}</li>`);
      } else {
        if (inList) {
          processedLines.push(`<ul class="list-disc ml-6 mb-4 space-y-1">${listItems.join('')}</ul>`);
          listItems = [];
          inList = false;
        }
        processedLines.push(line);
      }
    }
    
    if (inList && listItems.length > 0) {
      processedLines.push(`<ul class="list-disc ml-6 mb-4 space-y-1">${listItems.join('')}</ul>`);
    }
    
    html = processedLines.join('\n');
    
    // Paragraphs (split by double newlines, but preserve existing HTML)
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(para => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<') || trimmed.match(/^<[h|u|o|p|d|s]/)) {
        return trimmed;
      }
      return `<p class="mb-4 text-secondary leading-relaxed">${trimmed.replace(/\n/g, '<br />')}</p>`;
    }).filter(p => p).join('');
    
    return html;
  };

  return (
    <div 
      className="markdown-content prose prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}


import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string | Record<string, unknown> | null;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const markdownText = normalizeMarkdownContent(content);

  return (
    <div className="markdown-content prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdownText}
      </ReactMarkdown>
    </div>
  );
}

function normalizeMarkdownContent(input: string | Record<string, unknown> | null): string {
  if (!input) {
    return '';
  }

  if (typeof input === 'string') {
    return input;
  }

  if (input && typeof input === 'object') {
    if ('markdownContent' in input && typeof input.markdownContent === 'string') {
      return input.markdownContent;
    }

    if ('content' in input && typeof input.content === 'string') {
      return input.content;
    }

    if ('mechanics' in input) {
      return stringifyMarkdownField((input as any).mechanics);
    }

    return Object.values(input)
      .map((value) => stringifyMarkdownField(value))
      .filter(Boolean)
      .join('\n\n');
  }

  return stringifyMarkdownField(input);
}

function stringifyMarkdownField(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}


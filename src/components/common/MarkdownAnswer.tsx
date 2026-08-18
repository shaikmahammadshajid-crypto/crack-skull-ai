import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

export const MarkdownAnswer: React.FC<{ content: string }> = ({ content }) => {
  const normalizedContent = useMemo(() => normalizeMathMarkdown(content), [content]);

  return (
    <div className="ai-markdown font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        skipHtml
        components={markdownComponents}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

const markdownComponents = {
  pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
    return (
      <pre className="ai-code-block" {...props}>
        {children}
      </pre>
    );
  },
  code({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
    const language = className?.match(/language-(\w+)/)?.[1];

    return (
      <code className={className} {...props}>
        {language && <span className="ai-code-language">{language}</span>}
        {children}
      </code>
    );
  },
  table({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
    return (
      <div className="ai-table-wrap">
        <table {...props}>{children}</table>
      </div>
    );
  },
};

function normalizeMathMarkdown(content: string): string {
  return content
    .replace(/\r\n/g, '\n')
    .split(/(```[\s\S]*?```)/g)
    .map(part => (part.startsWith('```') ? part : normalizeMathOutsideCode(part)))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeMathOutsideCode(content: string): string {
  let normalized = content
    .replace(/\\\[/g, () => '\n$$\n')
    .replace(/\\\]/g, () => '\n$$\n')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');

  normalized = normalized.replace(
    /(^|\n)(\\begin\{([a-z*]+)\}[\s\S]*?\\end\{\3\})(?=\n|$)/g,
    (_match, prefix: string, environment: string) => `${prefix}$$\n${environment}\n$$`
  );

  const lines = normalized.split('\n');
  let insideDisplayMath = false;

  return lines
    .map(line => {
      const trimmed = line.trim();
      if (trimmed === '$$') {
        insideDisplayMath = !insideDisplayMath;
        return line;
      }

      if (insideDisplayMath) {
        return line;
      }

      return normalizeBareLatexLine(line);
    })
    .join('\n');
}

function normalizeBareLatexLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed.includes('$') || /^#{1,6}\s/.test(trimmed) || /^\|/.test(trimmed)) {
    return line;
  }

  const containsLatexCommand = /\\(?:frac|sqrt|sum|int|lim|partial|nabla|vec|overline|hat|dot|ddot|bar|tilde|boxed|begin|Omega|omega|alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|infty|times|cdot|leq|geq|neq|approx)/.test(trimmed);
  const looksLikeEquation = /(?:=|\\to|\\Rightarrow|\\left|\\right|\^|_)/.test(trimmed);

  if (containsLatexCommand && looksLikeEquation && !/^\s*[-*]\s+\D{8,}/.test(line)) {
    const indent = line.match(/^\s*/)?.[0] || '';
    return `${indent}$$\n${trimmed}\n${indent}$$`;
  }

  return line;
}

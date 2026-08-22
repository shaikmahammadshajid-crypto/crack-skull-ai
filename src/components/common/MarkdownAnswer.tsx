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
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore', errorColor: 'inherit' }]]}
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
    .replace(/(^|[^\\])\\\(\s*(\\begin\{([a-zA-Z*]+)\}[\s\S]*?\\end\{\3\})\s*\\\)/g, (_match, prefix: string, environment: string, name: string) => (
      isDisplayEnvironment(name) ? `${prefix}\n$$\n${environment}\n$$\n` : _match
    ))
    .replace(/(^|[^\\])\\\[/g, (_match, prefix: string) => `${prefix}\n$$\n`)
    .replace(/(^|[^\\])\\\]/g, (_match, prefix: string) => `${prefix}\n$$\n`)
    .replace(/(^|[^\\])\\\(/g, (_match, prefix: string) => `${prefix}$`)
    .replace(/(^|[^\\])\\\)/g, (_match, prefix: string) => `${prefix}$`);

  const lines = normalized.split('\n');
  let insideDisplayMath = false;
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed === '$$') {
      insideDisplayMath = !insideDisplayMath;
      output.push(line);
      continue;
    }

    if (insideDisplayMath) {
      output.push(line);
      continue;
    }

    if (startsBareDisplayMathBlock(line)) {
      const block = collectBareDisplayMathBlock(lines, index);
      output.push(`${block.indent}$$`, block.text, `${block.indent}$$`);
      index = block.endIndex;
      continue;
    }

    output.push(normalizeBareLatexLine(line));
  }

  return output.join('\n');
}

function normalizeBareLatexLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed.includes('$') || /^#{1,6}\s/.test(trimmed) || /^\|/.test(trimmed)) {
    return line;
  }

  const containsLatexCommand = /\\(?:frac|sqrt|sum|int|lim|partial|nabla|vec|overline|hat|dot|ddot|bar|tilde|boxed|begin|end|Omega|omega|alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|infty|times|cdot|leq|geq|neq|approx)/.test(trimmed);
  const looksLikeEquation = /(?:=|\\to|\\Rightarrow|\\left|\\right|\^|_)/.test(trimmed);
  const looksLikeStandaloneMath = containsLatexCommand && /^[\\A-Za-z0-9\s{}\[\]_^&+\-*/=().,|<>:;]+$/.test(trimmed);

  if (((containsLatexCommand && looksLikeEquation) || looksLikeStandaloneMath) && !/^\s*[-*]\s+\D{8,}/.test(line)) {
    const indent = line.match(/^\s*/)?.[0] || '';
    return `${indent}$$\n${trimmed}\n${indent}$$`;
  }

  return wrapBareLatexSegments(line);
}

const displayEnvironments = new Set([
  'align',
  'align*',
  'aligned',
  'alignedat',
  'bmatrix',
  'Bmatrix',
  'cases',
  'matrix',
  'pmatrix',
  'split',
  'vmatrix',
  'Vmatrix',
]);

function isDisplayEnvironment(name: string): boolean {
  return displayEnvironments.has(name);
}

function startsBareDisplayMathBlock(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.includes('$') || /^#{1,6}\s/.test(trimmed) || /^\|/.test(trimmed)) {
    return false;
  }

  if (/^\\boxed\s*\{/.test(trimmed)) {
    return true;
  }

  const environmentMatch = trimmed.match(/\\begin\{([a-zA-Z*]+)\}/);
  if (!environmentMatch || !isDisplayEnvironment(environmentMatch[1])) {
    return false;
  }

  return /^[\\A-Za-z0-9\s{}\[\]_^&+\-*/=().,|<>:;]+$/.test(trimmed);
}

function collectBareDisplayMathBlock(lines: string[], startIndex: number): { text: string; endIndex: number; indent: string } {
  const indent = lines[startIndex].match(/^\s*/)?.[0] || '';
  const collected: string[] = [];
  let braceDepth = 0;
  const environmentStack: string[] = [];
  let sawBoxed = false;
  let sawEnvironment = false;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (index > startIndex && (trimmed === '$$' || /^#{1,6}\s/.test(trimmed))) {
      return { text: collected.join('\n').trim(), endIndex: index - 1, indent };
    }

    collected.push(line);
    const scanStart = index === startIndex ? Math.max(0, line.indexOf('\\boxed')) : 0;
    const scanText = line.slice(scanStart);

    if (scanText.includes('\\boxed')) {
      sawBoxed = true;
    }

    for (const match of scanText.matchAll(/\\(?:begin|end)\{([a-zA-Z*]+)\}/g)) {
      if (!isDisplayEnvironment(match[1])) continue;
      sawEnvironment = true;
      if (match[0].startsWith('\\begin')) {
        environmentStack.push(match[1]);
      } else {
        const previousIndex = environmentStack.lastIndexOf(match[1]);
        if (previousIndex !== -1) {
          environmentStack.splice(previousIndex, 1);
        }
      }
    }

    if (sawBoxed) {
      braceDepth += countUnescaped(scanText, '{') - countUnescaped(scanText, '}');
    }

    const isBalancedBoxed = !sawBoxed || braceDepth <= 0;
    const isBalancedEnvironment = !sawEnvironment || environmentStack.length === 0;
    if (isBalancedBoxed && isBalancedEnvironment) {
      return { text: collected.join('\n').trim(), endIndex: index, indent };
    }

    if (index > startIndex && trimmed === '') {
      return { text: collected.join('\n').trim(), endIndex: index, indent };
    }
  }

  return { text: collected.join('\n').trim(), endIndex: lines.length - 1, indent };
}

function countUnescaped(text: string, character: '{' | '}'): number {
  let count = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === character && text[index - 1] !== '\\') {
      count += 1;
    }
  }
  return count;
}

function wrapBareLatexSegments(line: string): string {
  let output = '';
  let index = 0;

  while (index < line.length) {
    const commandMatch = line.slice(index).match(/\\(?:boxed|frac|sqrt|sum|int|lim|partial|nabla|vec|overline|hat|dot|ddot|bar|tilde|Omega|omega|alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|infty|times|cdot|leq|geq|neq|approx)\b/);
    if (!commandMatch || commandMatch.index === undefined) {
      output += line.slice(index);
      break;
    }

    const commandStart = index + commandMatch.index;
    output += line.slice(index, commandStart);

    const segment = readLatexSegment(line, commandStart);
    if (!segment) {
      output += line[commandStart];
      index = commandStart + 1;
      continue;
    }

    output += `$${segment.text}$`;
    index = segment.end;
  }

  return output;
}

function readLatexSegment(line: string, commandStart: number): { text: string; end: number } | null {
  const command = line.slice(commandStart).match(/^\\([A-Za-z]+)/)?.[1];
  if (!command) return null;

  let end = commandStart + command.length + 1;
  const requiredGroups = command === 'frac' ? 2 : ['boxed', 'sqrt', 'vec', 'overline', 'hat', 'dot', 'ddot', 'bar', 'tilde'].includes(command) ? 1 : 0;

  for (let groupIndex = 0; groupIndex < requiredGroups; groupIndex += 1) {
    while (line[end] === ' ') end += 1;
    if (line[end] !== '{') return null;
    const groupEnd = findBalancedBraceEnd(line, end);
    if (groupEnd === -1) return null;
    end = groupEnd + 1;
  }

  return {
    text: line.slice(commandStart, end),
    end,
  };
}

function findBalancedBraceEnd(text: string, openIndex: number): number {
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

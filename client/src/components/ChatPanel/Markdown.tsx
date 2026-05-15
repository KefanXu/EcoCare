import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EntityMentionChip } from './EntityMentionChip';

interface MarkdownProps {
  children: string;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText(
      (node as { props: { children?: React.ReactNode } }).props.children,
    );
  }
  return '';
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <div className="markdown-body text-sm text-slate-700 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-semibold text-slate-800 mt-3 mb-1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-slate-800 mt-3 mb-1 uppercase tracking-wider">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-semibold text-slate-800 mt-2.5 mb-1">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[12px] font-semibold text-slate-800 mt-2 mb-0.5">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="my-1.5 whitespace-pre-wrap">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-800">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-sky-700 underline underline-offset-2 hover:text-sky-900"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-stone-300 pl-3 my-2 text-slate-600 italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.startsWith('language-');
            if (isBlock) {
              return (
                <pre className="bg-stone-100 border border-stone-200 rounded-md p-2 my-2 text-[12px] overflow-x-auto">
                  <code>{children}</code>
                </pre>
              );
            }
            const text = extractText(children).trim();
            const fallback = (
              <code className="bg-stone-100 border border-stone-200 rounded px-1 py-0.5 text-[12px]">
                {children}
              </code>
            );
            if (!text) return fallback;
            return <EntityMentionChip text={text} fallback={fallback} />;
          },
          hr: () => <hr className="my-3 border-stone-200" />,
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-stone-200 px-2 py-1 bg-stone-50 text-left font-semibold text-slate-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-stone-200 px-2 py-1 align-top text-slate-700">
              {children}
            </td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewProps {
  source: string;
  className?: string;
}

/**
 * Renderiza Markdown (GFM) com tipografia consistente entre o preview do
 * admin e a página pública do artigo. Links externos abrem em nova aba.
 */
export function MarkdownView({ source, className = "" }: MarkdownViewProps) {
  return (
    <div
      className={`prose prose-lg max-w-none
        prose-headings:font-display prose-headings:text-primary
        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
        prose-p:text-foreground prose-p:leading-relaxed
        prose-a:text-secondary hover:prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground
        prose-blockquote:border-secondary prose-blockquote:text-foreground/80 prose-blockquote:not-italic
        prose-img:rounded-xl prose-img:shadow-soft
        prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-muted prose-pre:text-foreground prose-pre:border
        prose-li:text-foreground
        prose-hr:border-border
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => {
            const href = props.href ?? "";
            const isExternal = /^https?:\/\//.test(href);
            return (
              <a
                {...props}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer noopener" : undefined}
              />
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

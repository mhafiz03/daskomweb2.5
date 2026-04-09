import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

SyntaxHighlighter.registerLanguage('c', c);

const Mermaid = ({ chart }) => {
    const ref = useRef(null);
    useEffect(() => {
        mermaid.initialize({ startOnLoad: false, theme: 'dark' });

        const renderChart = async () => {
            if (ref.current) {
                try {
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, chart);
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                    }
                } catch (error) {
                    console.error("Mermaid parsing error", error);
                    if (ref.current) {
                        ref.current.innerHTML = `<div class="text-red-500 text-sm border border-red-500 p-2 rounded">Failed to render Mermaid diagram</div>`;
                    }
                }
            }
        };
        renderChart();
    }, [chart]);
    return <div ref={ref} className="flex justify-center my-4 overflow-x-auto" />;
};


export default function MarkdownRenderer({ content, className = '' }) {
    const processedContent = content;

    return (
        <div className={`prose prose-invert max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");

                        if (!inline && match && match[1] === 'mermaid') {
                            return <Mermaid chart={codeString} />;
                        }

                        return !inline ? (
                            <div className="relative my-4">
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match ? match[1] : "c"}
                                    PreTag="div"
                                    className="rounded-depth-md shadow-depth-md"
                                    {...props}
                                >
                                    {codeString}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className="bg-depth-card px-1.5 py-0.5 rounded text-sm border border-depth" {...props}>
                                {children}
                            </code>
                        );
                    },
                    p: ({ children }) => <div className="mb-2 whitespace-pre-wrap">{children}</div>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                    table: ({ children }) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-depth border border-depth">{children}</table></div>,
                    th: ({ children }) => <th className="px-4 py-2 bg-depth-interactive text-left font-bold">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-2 border-t border-depth">{children}</td>,
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}

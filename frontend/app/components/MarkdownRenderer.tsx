"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Box } from '@mui/material';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Clean up any source tags that might appear inside LaTeX equations
  const cleanContent = content
    // Remove source tags from inside display math ($$...$$)
    .replace(/\$\$([\s\S]*?)\$\$/g, (match, equation) => {
      const cleaned = equation
        .replace(/📘\s*\[THESIS\]\s*/g, '')
        .replace(/📄\s*\[[^\]]+\]\s*/g, '')
        .replace(/\[Source:\s*[^\]]+\]\s*/g, '');
      return `$$${cleaned}$$`;
    })
    // Remove source tags from inside inline math ($...$)
    .replace(/\$([^\$]+)\$/g, (match, equation) => {
      const cleaned = equation
        .replace(/📘\s*\[THESIS\]\s*/g, '')
        .replace(/📄\s*\[[^\]]+\]\s*/g, '')
        .replace(/\[Source:\s*[^\]]+\]\s*/g, '');
      return `$${cleaned}$`;
    });

  return (
    <Box
      sx={{
        '& p': {
          marginBottom: '0.75rem',
          fontSize: '1.1rem',
          lineHeight: 1.7,
          '@media (max-width: 600px)': {
            fontSize: '0.9rem',
            lineHeight: 1.5,
          },
          '@media (min-width: 600px) and (max-width: 960px)': {
            fontSize: '1rem',
            lineHeight: 1.6,
          },
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          marginTop: '1rem',
          marginBottom: '0.5rem',
          fontWeight: 'bold',
        },
        '& ul, & ol': {
          marginLeft: '1.5rem',
          marginBottom: '0.5rem',
        },
        '& li': {
          marginBottom: '0.25rem',
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          marginBottom: '1rem',
          marginTop: '1rem',
          fontSize: '1rem',
          display: 'block',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          '@media (max-width: 600px)': {
            fontSize: '0.75rem',
          },
          '@media (min-width: 600px) and (max-width: 960px)': {
            fontSize: '0.875rem',
          },
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          padding: '0.5rem',
          textAlign: 'left',
          '@media (max-width: 600px)': {
            padding: '0.25rem',
          },
          '@media (min-width: 600px) and (max-width: 960px)': {
            padding: '0.375rem',
          },
        },
        '& th': {
          backgroundColor: 'action.hover',
          fontWeight: 'bold',
        },
        '& code': {
          backgroundColor: 'action.hover',
          padding: '0.2rem 0.4rem',
          borderRadius: '0.25rem',
          fontSize: '0.9em',
          fontFamily: 'monospace',
        },
        '& pre': {
          backgroundColor: 'action.hover',
          padding: '1rem',
          borderRadius: '0.5rem',
          overflow: 'auto',
          marginBottom: '1rem',
        },
        '& pre code': {
          backgroundColor: 'transparent',
          padding: 0,
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          paddingLeft: '1rem',
          marginLeft: 0,
          marginRight: 0,
          fontStyle: 'italic',
          color: 'text.secondary',
        },
        '& .katex-display': {
          margin: '1rem 0',
          overflowX: 'auto',
          overflowY: 'hidden',
        },
        '& .katex': {
          fontSize: '1.15em',
        },
        '& .katex-display > .katex': {
          display: 'inline-block',
          textAlign: 'initial',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[
          [rehypeKatex, {
            strict: false,
            throwOnError: false,
            errorColor: 'transparent',
          }]
        ]}
      >
        {cleanContent}
      </ReactMarkdown>
    </Box>
  );
}

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
  return (
    <Box
      sx={{
        '& p': {
          marginBottom: '0.75rem',
          fontSize: '1.1rem',
          lineHeight: 1.7,
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
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          padding: '0.5rem',
          textAlign: 'left',
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
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}

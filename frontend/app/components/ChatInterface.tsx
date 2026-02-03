"use client";

import { Box, TextField, IconButton, Paper, Container, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useChat } from '../hooks/useChat';
import { ThinkingIndicator } from './ThinkingIndicator';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useColorMode } from '../theme-registry';
import { useEffect, useRef } from 'react';

export default function ChatInterface() {
  const { messages, input, setInput, isLoading, isStreaming, sendMessage } = useChat();
  const { mode, toggleColorMode } = useColorMode();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    // Use scrollTop instead of scrollIntoView to avoid affecting page scroll
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Container 
      maxWidth={false} 
      sx={{ 
        minHeight: { xs: '100dvh', sm: '100vh' }, // Use minHeight on mobile to allow natural scroll
        height: { xs: 'auto', sm: '100vh' }, // Auto height on mobile, fixed on desktop
        maxHeight: { xs: 'none', sm: '100vh' },
        display: 'flex', 
        flexDirection: 'column', 
        py: { xs: 1, sm: 2 }, 
        px: { xs: 1, sm: 2, md: 4 },
        maxWidth: { xs: '100%', sm: '95%', md: '90%' },
        overflow: { xs: 'visible', sm: 'hidden' }, // Allow scroll on mobile
        position: 'relative',
      }}
    >
      <Box sx={{ mb: { xs: 1, sm: 2 }, textAlign: 'center', position: 'relative' }}>
        <IconButton
          onClick={toggleColorMode}
          sx={{ position: 'absolute', right: 0, top: 0 }}
          color="inherit"
          size="small"
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
        >
          Quantum Computing Thesis Assistant
        </Typography>
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          sx={{ mb: 1, fontSize: { xs: '0.875rem', sm: '1rem' }, display: { xs: 'none', sm: 'block' } }}
        >
          AI-powered assistant for exploring quantum computing research and thesis documents
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            maxWidth: '1000px', 
            mx: 'auto',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            display: { xs: 'none', md: 'block' }
          }}
        >
          This chatbot uses Retrieval-Augmented Generation (RAG) to answer questions based on 
          research papers and thesis documents. It can discuss quantum computing concepts, 
          algorithms, and research findings from the ingested literature.
        </Typography>
      </Box>

      <Paper 
        ref={(el) => { messagesContainerRef.current = el as HTMLDivElement | null; }}
        elevation={3} 
        sx={{ 
          flex: { xs: '0 1 auto', sm: 1 }, // Don't grow on mobile
          mb: { xs: 1, sm: 2 }, 
          p: { xs: 1.5, sm: 2, md: 3 }, 
          overflowY: { xs: 'visible', sm: 'auto' }, // Visible on mobile, auto scroll on desktop
          overflowX: 'hidden',
          borderRadius: 2,
          minHeight: { xs: '300px', sm: '400px', md: '500px' }, // Minimum height for empty chat
          maxHeight: { xs: 'none', sm: '100%' }, // No max height on mobile
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: { xs: 1.5, sm: 2 },
              gap: { xs: 0.5, sm: 1 }
            }}
          >
            {msg.role === 'assistant' && (
              <Box 
                sx={{ 
                  width: { xs: 28, sm: 32 }, 
                  height: { xs: 28, sm: 32 }, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.5,
                  flexShrink: 0,
                }}
              >
                <SmartToyIcon sx={{ color: 'white', fontSize: { xs: 18, sm: 20 } }} />
              </Box>
            )}
            
            <Paper
              elevation={1}
              sx={{
                p: { xs: 1.5, sm: 2, md: 3 },
                maxWidth: { xs: '85%', sm: '75%', md: '65%' },
                borderRadius: 2,
                bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                color: msg.role === 'user' ? 'white' : 'text.primary',
                borderTopRightRadius: msg.role === 'user' ? 0 : 2,
                borderTopLeftRadius: msg.role === 'assistant' ? 0 : 2,
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                lineHeight: { xs: 1.5, sm: 1.6, md: 1.7 },
              }}
            >
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
              )}
            </Paper>

            {msg.role === 'user' && (
              <Box 
                sx={{ 
                  width: { xs: 28, sm: 32 }, 
                  height: { xs: 28, sm: 32 }, 
                  borderRadius: '50%', 
                  bgcolor: 'secondary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.5,
                  flexShrink: 0,
                }}
              >
                <PersonIcon sx={{ color: 'white', fontSize: { xs: 18, sm: 20 } }} />
              </Box>
            )}
          </Box>
        ))}
        
        {(isLoading || isStreaming) && messages[messages.length - 1]?.role === 'user' && (
           <ThinkingIndicator />
        )}
        
        <div ref={messagesEndRef} />
      </Paper>

      <Box 
        sx={{ 
          display: 'flex', 
          gap: { xs: 0.5, sm: 1 }, 
          alignItems: 'flex-end',
          flexShrink: 0, // Don't shrink the input area
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="outlined"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isStreaming}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
            },
          }}
        />
        <IconButton 
          color="primary" 
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            borderRadius: '50%', // Makes it circular
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            flexShrink: 0,
            '&:hover': { 
              bgcolor: 'primary.dark',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        >
          <SendIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </IconButton>
      </Box>
    </Container>
  );
}

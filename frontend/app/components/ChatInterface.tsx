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
        height: '100vh',
        maxHeight: '100vh',
        display: 'flex', 
        flexDirection: 'column', 
        py: 2, 
        px: 4,
        maxWidth: '90%',
        overflow: 'hidden', // Prevent container from causing page scroll
      }}
    >
      <Box sx={{ mb: 2, textAlign: 'center', position: 'relative' }}>
        <IconButton
          onClick={toggleColorMode}
          sx={{ position: 'absolute', right: 0, top: 0 }}
          color="inherit"
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Quantum Computing Thesis Assistant
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          AI-powered assistant for exploring quantum computing research and thesis documents
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '1000px', mx: 'auto' }}>
          This chatbot uses Retrieval-Augmented Generation (RAG) to answer questions based on 
          research papers and thesis documents. It can discuss quantum computing concepts, 
          algorithms, and research findings from the ingested literature.
        </Typography>
      </Box>

      <Paper 
        ref={(el) => { messagesContainerRef.current = el as HTMLDivElement | null; }}
        elevation={3} 
        sx={{ 
          flex: 1, 
          mb: 2, 
          p: 3, 
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRadius: 2,
          minHeight: 0, // Important for flex scrolling
          maxHeight: '100%', // Prevent expansion
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
              gap: 1
            }}
          >
            {msg.role === 'assistant' && (
              <Box 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.5
                }}
              >
                <SmartToyIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
            )}
            
            <Paper
              elevation={1}
              sx={{
                p: 3,
                maxWidth: '65%',
                borderRadius: 2,
                bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                color: msg.role === 'user' ? 'white' : 'text.primary',
                borderTopRightRadius: msg.role === 'user' ? 0 : 2,
                borderTopLeftRadius: msg.role === 'assistant' ? 0 : 2,
                fontSize: '1.1rem', // Larger text
                lineHeight: 1.7,
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
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  bgcolor: 'secondary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.5
                }}
              >
                <PersonIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
            )}
          </Box>
        ))}
        
        {(isLoading || isStreaming) && messages[messages.length - 1]?.role === 'user' && (
           <ThinkingIndicator />
        )}
        
        <div ref={messagesEndRef} />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1 }}>
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
        />
        <IconButton 
          color="primary" 
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            width: 56,
            height: 56,
            borderRadius: '50%', // Makes it circular
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': { 
              bgcolor: 'primary.dark',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Container>
  );
}

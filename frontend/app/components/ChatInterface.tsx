"use client";

import { Box, TextField, IconButton, Paper, Container, Typography, useTheme, alpha } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Better than SmartToy
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useChat } from '../hooks/useChat';
import { ThinkingIndicator } from './ThinkingIndicator';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useColorMode } from '../theme-registry';
import { useEffect, useRef } from 'react';

export default function ChatInterface() {
  const { messages, input, setInput, isLoading, isStreaming, sendMessage } = useChat();
  const { mode, toggleColorMode } = useColorMode();
  const theme = useTheme();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
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
        height: { xs: '100dvh', sm: '100vh' },
        maxHeight: { xs: '100dvh', sm: '100vh' },
        display: 'flex', 
        flexDirection: 'column', 
        py: { xs: 1, sm: 2 }, 
        px: { xs: 1, sm: 3, md: 6 },
        maxWidth: { xs: '100%', md: '1200px', lg: '1400px' }, // Wider on large screens
        overflow: { xs: 'visible', sm: 'hidden' },
        position: 'relative',
        mx: 'auto',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        mb: { xs: 1, sm: 2 }, 
        textAlign: 'center', 
        position: 'relative',
        py: 1,
      }}>
        <IconButton
          onClick={toggleColorMode}
          sx={{ 
            position: 'absolute', 
            right: 0, 
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'text.secondary',
            backdropFilter: 'blur(10px)',
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.8) }
          }}
          size="small"
        >
          {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 0.5 }}>
          <AutoAwesomeIcon sx={{ 
            color: 'primary.main', 
            fontSize: { xs: 24, sm: 32 },
            filter: mode === 'dark' ? 'drop-shadow(0 0 8px rgba(101, 31, 255, 0.5))' : 'none'
          }} />
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="800"
            sx={{ 
              fontSize: { xs: '1.25rem', sm: '1.75rem' },
              background: mode === 'dark' 
                ? 'linear-gradient(to right, #fff, #b388ff)' 
                : 'linear-gradient(to right, #1a1a1a, #651fff)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Quantum Thesis
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            maxWidth: '600px', 
            mx: 'auto',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            opacity: 0.8,
            display: { xs: 'none', sm: 'block' }
          }}
        >
          RAG-powered assistant for quantum computing research analysis
        </Typography>
      </Box>

      {/* Chat Area */}
      <Paper 
        ref={(el) => { messagesContainerRef.current = el as HTMLDivElement | null; }}
        elevation={0} 
        sx={{ 
          flex: { xs: '0 1 auto', sm: 1 },
          mb: { xs: 1, sm: 2 }, 
          p: { xs: 2, md: 4 }, 
          overflowY: { xs: 'visible', sm: 'auto' },
          overflowX: 'hidden',
          borderRadius: { xs: 2, sm: 4 },
          minHeight: { xs: '300px', sm: '400px', md: '500px' },
          maxHeight: { xs: 'none', sm: '100%' },
          WebkitOverflowScrolling: 'touch',
          bgcolor: alpha(theme.palette.background.paper, mode === 'dark' ? 0.4 : 0.6),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: mode === 'dark' 
            ? '0 4px 30px rgba(0, 0, 0, 0.3)' 
            : '0 4px 30px rgba(0, 0, 0, 0.05)',
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            opacity: 0.5,
            gap: 2
          }}>
            <AutoAwesomeIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            <Typography variant="body1" color="text.secondary">
              Start by asking a question about the thesis
            </Typography>
          </Box>
        )}

        {messages.map((msg, index) => (
          <Box
            key={index}
            className="message-enter"
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: { xs: 2, sm: 3 },
              gap: { xs: 1, sm: 2 },
              animationDelay: `${index * 0.05}s` // Staggered animation
            }}
          >
            {msg.role === 'assistant' && (
              <Box 
                sx={{ 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 }, 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #651fff 0%, #00e5ff 100%)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.5,
                  flexShrink: 0,
                  boxShadow: '0 2px 10px rgba(101, 31, 255, 0.3)',
                }}
              >
                <AutoAwesomeIcon sx={{ color: 'white', fontSize: { xs: 18, sm: 20 } }} />
              </Box>
            )}
            
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, md: 2.5 },
                maxWidth: { xs: '85%', sm: '75%', md: '70%' },
                borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                bgcolor: msg.role === 'user' 
                  ? alpha(theme.palette.primary.main, mode === 'dark' ? 0.9 : 1)
                  : alpha(theme.palette.background.paper, mode === 'dark' ? 0.6 : 0.8),
                color: msg.role === 'user' ? 'white' : 'text.primary',
                border: msg.role === 'assistant' ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                boxShadow: msg.role === 'user'
                  ? `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`
                  : 'none',
                fontSize: { xs: '0.95rem', sm: '1rem' },
                lineHeight: 1.6,
              }}
            >
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {msg.content}
                </Typography>
              )}
            </Paper>

            {msg.role === 'user' && (
              <Box 
                sx={{ 
                  width: { xs: 32, sm: 36 }, 
                  height: { xs: 32, sm: 36 }, 
                  borderRadius: '12px', 
                  bgcolor: alpha(theme.palette.text.primary, 0.1),
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mt: 0.5,
                  flexShrink: 0,
                }}
              >
                <PersonOutlineIcon sx={{ color: 'text.secondary', fontSize: { xs: 20, sm: 22 } }} />
              </Box>
            )}
          </Box>
        ))}
        
        {(isLoading || isStreaming) && messages[messages.length - 1]?.role === 'user' && (
           <Box sx={{ display: 'flex', gap: 2, ml: 1 }}>
             <Box sx={{ width: 36 }} /> {/* Spacer for alignment */}
             <ThinkingIndicator />
           </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Paper>

      {/* Input Area */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          alignItems: 'flex-end',
          flexShrink: 0,
          p: { xs: 1.5, sm: 2 },
          borderRadius: { xs: 3, sm: 4 },
          bgcolor: alpha(theme.palette.background.paper, mode === 'dark' ? 0.6 : 0.8),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          variant="standard"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isStreaming}
          InputProps={{
            disableUnderline: true,
            sx: { 
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              px: 1,
            }
          }}
          sx={{ py: 1 }}
        />
        <IconButton 
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
          sx={{ 
            bgcolor: input.trim() ? 'primary.main' : alpha(theme.palette.text.secondary, 0.1),
            color: input.trim() ? 'white' : 'text.disabled',
            width: { xs: 44, sm: 50 },
            height: { xs: 44, sm: 50 },
            borderRadius: '16px',
            boxShadow: input.trim() ? `0 4px 15px ${alpha(theme.palette.primary.main, 0.4)}` : 'none',
            flexShrink: 0,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': { 
              bgcolor: input.trim() ? 'primary.dark' : alpha(theme.palette.text.secondary, 0.1),
              transform: input.trim() ? 'scale(1.05)' : 'none',
            },
            '&.Mui-disabled': {
              bgcolor: alpha(theme.palette.text.secondary, 0.1),
              color: alpha(theme.palette.text.disabled, 0.5),
            }
          }}
        >
          <SendIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </IconButton>
      </Box>
    </Container>
  );
}

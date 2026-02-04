"use client";

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, alpha } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';

// Quantum Theming
const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#651fff', // Deep Purple A200
      light: '#b388ff',
      dark: '#0100ca',
    },
    secondary: {
      main: '#00e5ff', // Light Blue A400
      light: '#6effff',
      dark: '#00b2cc',
    },
    background: {
      default: mode === 'dark' ? '#050508' : '#f8f9fa',
      paper: mode === 'dark' ? '#0f111a' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#e2e2e2' : '#1a1a1a',
      secondary: mode === 'dark' ? '#a0a0a0' : '#666666',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    subtitle1: {
      letterSpacing: '-0.01em',
    },
    body1: {
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// Dark mode context
const ColorModeContext = React.createContext<{
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}>({
  toggleColorMode: () => {},
  mode: 'dark',
});

export const useColorMode = () => React.useContext(ColorModeContext);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme-mode');
    if (saved === 'light' || saved === 'dark') {
      setMode(saved);
    }
  }, []);
  
  React.useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
      // Colors are now handled by CSS variables in globals.css using the data-theme attribute
      // But we keep this for legacy inline style support if needed
      const theme = getTheme(mode);
      document.body.style.backgroundColor = theme.palette.background.default;
    }
  }, [mode, mounted]);
  
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme-mode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  const [{ cache, flush }] = React.useState(() => {
    const cache = createCache({ key: 'mui', prepend: true });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = '';
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return (
    <ColorModeContext.Provider value={colorMode}>
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </ColorModeContext.Provider>
  );
}

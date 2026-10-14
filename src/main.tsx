import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from '@/theme/ThemeContext';
import { StudentProfileProvider } from '@/students/StudentProfileContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <StudentProfileProvider>
        <App />
      </StudentProfileProvider>
    </ThemeProvider>
  </StrictMode>
);

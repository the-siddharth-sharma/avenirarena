import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from '@/theme/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { StudentProfileProvider } from '@/students/StudentProfileContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <StudentProfileProvider>
          <App />
        </StudentProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import { ThemeProvider } from '@/theme/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { StudentProfileProvider } from '@/students/StudentProfileContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "1026711910319-p2qmjc6nf4vu01uloio2ragu3c7iru1g.apps.googleusercontent.com"}>
      <ThemeProvider>
        <AuthProvider>
          <StudentProfileProvider>
            <App />
          </StudentProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);

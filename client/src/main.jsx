import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import './styles/components.css';
import './styles/layout.css';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

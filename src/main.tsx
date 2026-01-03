
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './providers/ThemeProvider.tsx'

// Initialize theme based on user preference
const initialTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.classList.add(initialTheme);

// Check if the app has been loaded before
const firstTimeVisit = localStorage.getItem('visited') === null;
if (firstTimeVisit) {
  // If it's the first visit, set the visited flag
  localStorage.setItem('visited', 'true');
  
  // Redirect to landing page by setting a flag (will be used in App.tsx)
  localStorage.setItem('shouldRedirectToLanding', 'true');
} else {
  // Not the first visit, but make sure there's no flag
  localStorage.removeItem('shouldRedirectToLanding');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)

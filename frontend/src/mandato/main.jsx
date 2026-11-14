import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './mandato.css';
import './mesa.css';
import './online.css';
import './art.css';
import './mesa2.css';
import './polish.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

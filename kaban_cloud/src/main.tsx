import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Web app entry point (production + `npm run dev`), loaded by `index.html`.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

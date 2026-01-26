import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Esto busca el archivo App.tsx que debe estar en src
import './index.css';   // Esto carga el CSS que ya tienes en src

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // IMPORT THIS

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* THIS WRAPPER IS REQUIRED FOR ROUTES TO WORK */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
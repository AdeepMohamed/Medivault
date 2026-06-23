import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f1f35',
            color: '#e2f0ef',
            border: '1px solid rgba(13, 148, 136, 0.3)',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#14b8a6', secondary: '#0f1f35' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0f1f35' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)

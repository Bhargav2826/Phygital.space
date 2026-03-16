import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '14px',
                    },
                    success: {
                        iconTheme: { primary: '#6366f1', secondary: '#ffffff' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
                    },
                }}
            />
        </BrowserRouter>
    </React.StrictMode>
)

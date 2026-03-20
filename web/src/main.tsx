import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Dashboard from './admin/Dashboard'
import Login from './admin/pages/Login'
import DownloadPage from './download/DownloadPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('appspaces_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/d/:appKey" element={<DownloadPage />} />
        <Route path="/d/:appKey/:versionId" element={<DownloadPage />} />
        <Route path="/admin" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/app/:appId" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ui/ProtectedRoute'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Download from './pages/Download'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/inbox" element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          } />
          <Route path="/download" element={<Download />} />
          <Route path="/download/:code" element={<Download />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

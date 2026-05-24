import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Rooms from './pages/Rooms'
import Schedule from './pages/Schedule'
import Devices from './pages/Devices'
import AccessLogs from './pages/AccessLogs'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users"     element={<Users />} />
        <Route path="/rooms"     element={<Rooms />} />
        <Route path="/schedule"  element={<Schedule />} />
        <Route path="/devices"   element={<Devices />} />
        <Route path="/logs" element={<AccessLogs />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
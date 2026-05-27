import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import LSP from '../assets/images/LSP.jpg'

const navItems = [
  { label: 'Home', icon: '🏠', path: '/dashboard' },
  { label: 'Users', icon: '👥', path: '/users' },
  { label: 'Rooms', icon: '🚪', path: '/rooms' },
  { label: 'Schedule', icon: '📅', path: '/schedule' },
  { label: 'Device Management', icon: '🖥️', path: '/devices' },
  { label: 'Access Logs', icon: '📋', path: '/logs' },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    setIsOpen(false)
  }

  const NavItems = () => (
    <>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <div
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={`flex items-center gap-3 px-6 py-3 cursor-pointer text-sm transition-all
              ${isActive
                ? 'bg-white/20 text-white font-semibold border-l-4 border-white'
                : 'text-blue-100 hover:bg-white/10 border-l-4 border-transparent'
              }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        )
      })}
    </>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-white/20">
        <img
          src={LSP}
          alt="Logo"
          className="w-16 h-16 rounded-full object-cover mb-2"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <p className="text-white font-bold text-sm text-center">
          Lyceum of San Pedro
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 pt-2">
        <NavItems />
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-white/20">
        <p className="text-white font-semibold text-sm capitalize">
          {user.username || 'Admin'}
        </p>
        <p className="text-blue-200 text-xs mb-3">Administrator</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors"
        >
          🚪 Log out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-w-[240px] h-screen bg-blue-700 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-blue-700 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src={LSP}
            alt="Logo"
            className="w-9 h-9 rounded-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <p className="text-white font-bold text-sm">Lyceum of San Pedro</p>
        </div>

        {/* Burger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-col justify-center items-center w-8 h-8 gap-1.5"
        >
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300
            ${isOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300
            ${isOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300
            ${isOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`md:hidden fixed top-0 left-0 h-screen w-60 bg-blue-700 z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </div>
    </>
  )
}

export default Sidebar
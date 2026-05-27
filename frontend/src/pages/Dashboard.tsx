import { useEffect, useState } from 'react'
import Sidebar   from '../components/Sidebar'
import StatCard  from '../components/StatCard'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AccessRow {
  _id:    string
  name:   string
  role:   string
  room:   string
  type:   string
  time:   string
  status: 'granted' | 'denied'
}

interface Stats {
  totalRooms:      number
  totalUsers:      number
  occupiedRooms:   number
  unoccupiedRooms: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', {
    year:   'numeric', month:  '2-digit', day:    '2-digit',
    hour:   '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })

// ─── Component ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats]               = useState<Stats | null>(null)
  const [recentAccess, setRecentAccess] = useState<AccessRow[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError(null)

        const [statsRes, accessRes] = await Promise.all([
          fetch(`${API}/api/dashboard/stats`),
          fetch(`${API}/api/dashboard/recent-access?limit=10`),
        ])

        if (!statsRes.ok || !accessRes.ok) throw new Error('Failed to fetch dashboard data')

        const [statsData, accessData] = await Promise.all([
          statsRes.json(),
          accessRes.json(),
        ])

        setStats(statsData)
        setRecentAccess(accessData)
      } catch (err: any) {
        setError(err.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()

    // Auto-refresh every 15 seconds (live RFID feel)
    const interval = setInterval(fetchDashboard, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Error Banner */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {loading || !stats ? (
              // Skeleton loaders
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              ))
            ) : (
              <>
                <StatCard value={stats.totalRooms}      label="Total Rooms"       />
                <StatCard value={stats.totalUsers}      label="Total Users"       />
                <StatCard value={stats.occupiedRooms}   label="Occupied Rooms"    />
                <StatCard value={stats.unoccupiedRooms} label="Unoccupied Rooms"  />
              </>
            )}
          </div>

          {/* Recent Access Table */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                Recent Access
              </span>
              {/* Live indicator */}
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live · refreshes every 15s
              </span>
            </div>

            {loading ? (
              // Table skeleton
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : recentAccess.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">No access logs found.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 text-left">
                        <th className="py-3 px-6 font-medium">Name</th>
                        <th className="py-3 px-6 font-medium">Role</th>
                        <th className="py-3 px-6 font-medium">Room</th>
                        <th className="py-3 px-6 font-medium">Type</th>
                        <th className="py-3 px-6 font-medium">Time</th>
                        <th className="py-3 px-6 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAccess.map((row) => (
                        <tr key={row._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-6 font-semibold text-gray-800">{row.name}</td>
                          <td className="py-3 px-6 text-gray-500">{row.role}</td>
                          <td className="py-3 px-6 text-gray-700">{row.room}</td>
                          <td className="py-3 px-6">
                            <span className="bg-gray-600 text-white px-2.5 py-1 rounded text-xs font-medium">
                              {row.type}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-gray-500">{formatTime(row.time)}</td>
                          <td className="py-3 px-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white
                              ${row.status === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {recentAccess.map((row) => (
                    <div key={row._id} className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-sm text-gray-800">{row.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white
                          ${row.status === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {row.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Role: {row.role} • Room: {row.room}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(row.time)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default Dashboard
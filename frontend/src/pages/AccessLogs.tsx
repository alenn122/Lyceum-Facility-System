import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Sidebar from '../components/Sidebar'

const hourlyData = [
  '12am','1am','2am','3am','4am','5am','6am','7am','8am','9am','10am','11am',
  '12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm','10pm','11pm'
].map(hour => ({ hour, taps: 0 }))

const mockLogs = [
  { id: 1,  name: 'Unknown (42193D05)', role: 'N/A',     room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:19:17', access: 'Entry', status: 'denied'  },
  { id: 2,  name: 'Unknown (42193D05)', role: 'N/A',     room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:19:03', access: 'Entry', status: 'denied'  },
  { id: 3,  name: 'Unknown (42193D05)', role: 'N/A',     room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:18:58', access: 'Entry', status: 'denied'  },
  { id: 4,  name: 'Kristel Ladot',      role: 'Student', room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:18:47', access: 'Entry', status: 'granted' },
  { id: 5,  name: 'Rey Vergel Abella',  role: 'Faculty', room: 'ROOM101', type: 'POWER', time: '2026-04-10 13:18:26', access: 'Entry', status: 'granted' },
  { id: 6,  name: 'Rey Vergel Abella',  role: 'Faculty', room: 'ROOM101', type: 'POWER', time: '2026-04-10 13:18:23', access: 'Exit',  status: 'granted' },
  { id: 7,  name: 'Rey Vergel Abella',  role: 'Faculty', room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:18:20', access: 'Exit',  status: 'denied'  },
  { id: 8,  name: 'Kristel Ladot',      role: 'Student', room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:17:55', access: 'Exit',  status: 'granted' },
  { id: 9,  name: 'Jonathan Mina',      role: 'Admin',   room: 'ROOM101', type: 'POWER', time: '2026-04-10 13:17:30', access: 'Entry', status: 'granted' },
  { id: 10, name: 'Unknown (42193D05)', role: 'N/A',     room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:17:10', access: 'Entry', status: 'denied'  },
]

const statCards = [
  { label: 'Total Taps (Today)', value: 0,      icon: '👆', bg: 'bg-blue-600'  },
  { label: 'Energy Saving Events', value: 0,    icon: '🌿', bg: 'bg-green-600' },
  { label: 'Unauthorized Attempts', value: 0,   icon: '🛡️', bg: 'bg-red-600'   },
  { label: 'Peak Room',            value: 'None', icon: '🏢', bg: 'bg-gray-800'  },
]

const AccessLogs = () => {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [roomFilter, setRoomFilter]   = useState('All Rooms')
  const [typeFilter, setTypeFilter]   = useState('All Access Type')

  const filtered = mockLogs.filter(log => {
    const matchSearch = search === '' ||
      log.name.toLowerCase().includes(search.toLowerCase()) ||
      log.room.toLowerCase().includes(search.toLowerCase()) ||
      log.role.toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === 'All Status' || log.status === statusFilter
    const matchRoom   = roomFilter   === 'All Rooms'  || log.room   === roomFilter
    const matchType   = typeFilter   === 'All Access Type' || log.type === typeFilter

    return matchSearch && matchStatus && matchRoom && matchType
  })

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Access Logs</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by Name, RFID, Room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(card => (
              <div key={card.label} className={`${card.bg} rounded-xl p-5 text-white flex items-center justify-between`}>
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <span className="text-4xl opacity-30">{card.icon}</span>
              </div>
            ))}
          </div>

          {/* 24-Hour Usage Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              📈 24-Hour Usage Trend
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="taps"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Status', 'granted', 'denied'].map(s => <option key={s}>{s}</option>)}
            </select>

            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Rooms', 'ROOM101', 'ROOM102'].map(r => <option key={r}>{r}</option>)}
            </select>

            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Access Type', 'DOOR', 'POWER'].map(t => <option key={t}>{t}</option>)}
            </select>

            <button className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
              🔽 Apply Filters
            </button>

            <button className="ml-auto bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
              🖨️ Print
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-800">Access Logs</h2>
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                {filtered.length} records
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-left">
                    <th className="py-3 px-6 font-medium">User Name</th>
                    <th className="py-3 px-6 font-medium">Role</th>
                    <th className="py-3 px-6 font-medium">Room</th>
                    <th className="py-3 px-6 font-medium">Access Type</th>
                    <th className="py-3 px-6 font-medium">Access Time</th>
                    <th className="py-3 px-6 font-medium">Access</th>
                    <th className="py-3 px-6 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400 text-sm">
                        No logs found.
                      </td>
                    </tr>
                  ) : filtered.map(log => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 font-semibold text-gray-800">{log.name}</td>
                      <td className="py-3 px-6 text-gray-500">{log.role}</td>
                      <td className="py-3 px-6 text-gray-700">{log.room}</td>
                      <td className="py-3 px-6">
                        <span className="bg-gray-600 text-white px-2.5 py-1 rounded text-xs font-medium">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-gray-500">{log.time}</td>
                      <td className="py-3 px-6 text-gray-700">{log.access}</td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white
                          ${log.status === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map(log => (
                <div key={log.id} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-gray-800">{log.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white
                      ${log.status === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Role: {log.role} • Room: {log.room}</p>
                  <p className="text-xs text-gray-500">Type: {log.type} • Access: {log.access}</p>
                  <p className="text-xs text-gray-400 mt-1">{log.time}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default AccessLogs
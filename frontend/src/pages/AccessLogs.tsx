import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Sidebar from '../components/Sidebar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Log {
  _id:         string
  name:        string
  role:        string
  rfid_tag:    string
  room:        string
  device_type: string
  access_time: string
  status:      'granted' | 'denied'
}
interface Stats {
  total:   number
  granted: number
  denied:  number
  today:   number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })

// Build 24-hour buckets for today from logs
const buildHourlyData = (logs: Log[]) => {
  const buckets = Array.from({ length: 24 }, (_, i) => ({
    hour: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`,
    taps: 0, granted: 0, denied: 0,
  }))
  const today = new Date().toDateString()
  logs.forEach(log => {
    const d = new Date(log.access_time)
    if (d.toDateString() === today) {
      buckets[d.getHours()].taps++
      if (log.status === 'granted') buckets[d.getHours()].granted++
      else buckets[d.getHours()].denied++
    }
  })
  return buckets
}

// Build 7-day buckets
const buildWeeklyData = (logs: Log[]) => {
  const days: Record<string, { day: string; taps: number; granted: number; denied: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toDateString()
    days[key] = {
      day: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      taps: 0, granted: 0, denied: 0,
    }
  }
  logs.forEach(log => {
    const key = new Date(log.access_time).toDateString()
    if (days[key]) {
      days[key].taps++
      if (log.status === 'granted') days[key].granted++
      else days[key].denied++
    }
  })
  return Object.values(days)
}

// Find peak room
const getPeakRoom = (logs: Log[]) => {
  const today = new Date().toDateString()
  const counts: Record<string, number> = {}
  logs.filter(l => new Date(l.access_time).toDateString() === today)
      .forEach(l => { counts[l.room] = (counts[l.room] || 0) + 1 })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? 'None'
}

// ─── Component ────────────────────────────────────────────────────────────────
const AccessLogs = () => {
  const [logs, setLogs]               = useState<Log[]>([])
  const [stats, setStats]             = useState<Stats | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [chartView, setChartView]     = useState<'today' | 'week'>('today')

  // Filters
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [roomFilter, setRoomFilter]     = useState('All Rooms')
  const [typeFilter, setTypeFilter]     = useState('All Access Type')
  const [page, setPage]                 = useState(1)
  const LIMIT = 50

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const params = new URLSearchParams({ limit: '500', page: '1' })
      if (statusFilter !== 'All Status')      params.set('status', statusFilter)
      if (roomFilter   !== 'All Rooms')        params.set('room_code', roomFilter)
      if (typeFilter   !== 'All Access Type')  params.set('device_type', typeFilter)

      const [logsRes, statsRes] = await Promise.all([
        fetch(`${API}/api/access-logs?${params}`),
        fetch(`${API}/api/access-logs/stats`),
      ])
      if (!logsRes.ok || !statsRes.ok) throw new Error('Failed to fetch access logs')
      const logsData  = await logsRes.json()
      const statsData = await statsRes.json()
      setLogs(logsData.logs ?? [])
      setStats(statsData)
      setPage(1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, roomFilter, typeFilter])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // ── Derived ────────────────────────────────────────────────────────────────
  const rooms        = ['All Rooms', ...Array.from(new Set(logs.map(l => l.room).filter(Boolean)))]
  const chartData    = chartView === 'today' ? buildHourlyData(logs) : buildWeeklyData(logs)
  const peakRoom     = getPeakRoom(logs)

  const filtered = logs.filter(log => {
    const q = search.toLowerCase()
    return !q ||
      log.name.toLowerCase().includes(q) ||
      log.room.toLowerCase().includes(q) ||
      log.role.toLowerCase().includes(q) ||
      log.rfid_tag.toLowerCase().includes(q)
  })

  const paginated  = filtered.slice((page - 1) * LIMIT, page * LIMIT)
  const totalPages = Math.ceil(filtered.length / LIMIT)

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const rows = filtered.map(log => `
      <tr>
        <td>${log.name}</td>
        <td>${log.role}</td>
        <td>${log.room}</td>
        <td>${log.device_type}</td>
        <td>${formatTime(log.access_time)}</td>
        <td style="color:${log.status === 'granted' ? 'green' : 'red'};font-weight:600">${log.status.toUpperCase()}</td>
      </tr>`).join('')

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Access Logs Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; font-size: 13px; }
        h1   { font-size: 20px; margin-bottom: 4px; }
        p    { color: #6b7280; margin-bottom: 16px; font-size: 12px; }
        table{ width: 100%; border-collapse: collapse; }
        th   { background: #1d4ed8; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
        td   { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        tr:nth-child(even) td { background: #f9fafb; }
        .summary { display: flex; gap: 24px; margin-bottom: 16px; }
        .stat    { background: #f3f4f6; padding: 10px 16px; border-radius: 8px; }
        .stat p  { margin: 0; color: #374151; font-weight: 600; font-size: 18px; }
        .stat span { font-size: 11px; color: #6b7280; font-weight: normal; }
      </style></head><body>
      <h1>Lyceum Facility System — Access Logs Report</h1>
      <p>Generated: ${new Date().toLocaleString('en-PH')} &nbsp;|&nbsp; Total records: ${filtered.length}</p>
      <div class="summary">
        <div class="stat"><p>${stats?.today ?? 0}</p><span>Today's Taps</span></div>
        <div class="stat"><p>${stats?.granted ?? 0}</p><span>Total Granted</span></div>
        <div class="stat"><p>${stats?.denied ?? 0}</p><span>Total Denied</span></div>
        <div class="stat"><p>${peakRoom}</p><span>Peak Room</span></div>
      </div>
      <table>
        <thead><tr>
          <th>User Name</th><th>Role</th><th>Room</th>
          <th>Device Type</th><th>Access Time</th><th>Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Access Logs</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Search by Name, RFID, Room..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24" />
            )) : [
              { label: 'Total Taps (Today)',      value: stats?.today   ?? 0,    icon: '👆', bg: 'bg-blue-600'  },
              { label: 'Total Granted',           value: stats?.granted ?? 0,    icon: '✅', bg: 'bg-green-600' },
              { label: 'Unauthorized Attempts',   value: stats?.denied  ?? 0,    icon: '🛡️', bg: 'bg-red-600'   },
              { label: 'Peak Room (Today)',        value: peakRoom,               icon: '🏢', bg: 'bg-gray-800'  },
            ].map(card => (
              <div key={card.label} className={`${card.bg} rounded-xl p-5 text-white flex items-center justify-between`}>
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <span className="text-4xl opacity-30">{card.icon}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                📈 Usage Trend
              </h2>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['today','week'] as const).map(v => (
                  <button key={v} onClick={() => setChartView(v)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                      ${chartView === v ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {v === 'today' ? 'Today (24h)' : 'This Week'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={chartView === 'today' ? 'hour' : 'day'}
                  tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Line type="monotone" dataKey="granted" stroke="#22c55e" strokeWidth={2}
                  dot={{ r: 2, fill: '#22c55e' }} activeDot={{ r: 4 }} name="Granted" />
                <Line type="monotone" dataKey="denied"  stroke="#ef4444" strokeWidth={2}
                  dot={{ r: 2, fill: '#ef4444' }} activeDot={{ r: 4 }} name="Denied" />
                <Line type="monotone" dataKey="taps"    stroke="#2563eb" strokeWidth={2}
                  dot={{ r: 2, fill: '#2563eb' }} activeDot={{ r: 4 }} name="Total" strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              {[['#2563eb','Total'],['#22c55e','Granted'],['#ef4444','Denied']].map(([color, label]) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-0.5 rounded" style={{ background: color, display: 'inline-block' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Status','granted','denied'].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {rooms.map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Access Type','DOOR','POWER'].map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={() => { setStatusFilter('All Status'); setRoomFilter('All Rooms'); setTypeFilter('All Access Type'); setSearch('') }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              ✕ Clear
            </button>
            <button onClick={handlePrint}
              className="ml-auto bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
              🖨️ Print Report
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-800">Access Logs</h2>
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                {filtered.length} records
              </span>
              {loading && <span className="text-xs text-gray-400 animate-pulse">Loading...</span>}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-left">
                    <th className="py-3 px-6 font-medium">User Name</th>
                    <th className="py-3 px-6 font-medium">Role</th>
                    <th className="py-3 px-6 font-medium">Room</th>
                    <th className="py-3 px-6 font-medium">Device Type</th>
                    <th className="py-3 px-6 font-medium">Access Time</th>
                    <th className="py-3 px-6 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="py-3 px-6"><div className="h-5 bg-gray-100 rounded animate-pulse" /></td></tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">No logs found.</td></tr>
                  ) : paginated.map(log => (
                    <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 font-semibold text-gray-800">{log.name}</td>
                      <td className="py-3 px-6 text-gray-500">{log.role}</td>
                      <td className="py-3 px-6 text-gray-700">{log.room}</td>
                      <td className="py-3 px-6">
                        <span className="bg-gray-600 text-white px-2.5 py-1 rounded text-xs font-medium">
                          {log.device_type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-gray-500">{formatTime(log.access_time)}</td>
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

            {/* Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {paginated.map(log => (
                <div key={log._id} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-gray-800">{log.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white
                      ${log.status === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Role: {log.role} • Room: {log.room}</p>
                  <p className="text-xs text-gray-500">Type: {log.device_type}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(log.access_time)}</p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    ← Prev
                  </button>
                  <span className="flex items-center text-sm text-gray-600 px-2">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AccessLogs
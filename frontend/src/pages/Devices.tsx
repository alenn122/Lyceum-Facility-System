import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Room   { _id: string; room_code: string }
interface Device {
  _id:         string
  mac_address: string
  device_type: 'DOOR' | 'POWER'
  room:        Room | null
  status:      'Online' | 'Offline'
  last_seen:   string | null
  is_archived?: boolean
}

const emptyForm = { mac_address: '', device_type: 'DOOR', room: '', status: 'Offline' }

const typeStyles: Record<string, string> = {
  DOOR:  'bg-cyan-400 text-white',
  POWER: 'bg-yellow-400 text-gray-800',
}
const typeIcons: Record<string, string> = {
  DOOR:  '🚪',
  POWER: '⚡',
}

// ─── Component ────────────────────────────────────────────────────────────────
const Devices = () => {
  const [devices, setDevices]           = useState<Device[]>([])
  const [rooms, setRooms]               = useState<Room[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [typeFilter, setTypeFilter]     = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')

  // Modals
  const [showAdd, setShowAdd]                     = useState(false)
  const [showEdit, setShowEdit]                   = useState(false)
  const [showArchive, setShowArchive]             = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleteTarget, setDeleteTarget]           = useState<Device | null>(null)
  const [editTarget, setEditTarget]               = useState<Device | null>(null)
  const [saving, setSaving]                       = useState(false)
  const [formError, setFormError]                 = useState<string | null>(null)
  const [form, setForm]                           = useState({ ...emptyForm })

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/devices`)
      if (!res.ok) throw new Error('Failed to fetch devices')
      setDevices(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/rooms`)
      if (res.ok) setRooms(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchDevices(); fetchRooms() }, [fetchDevices, fetchRooms])

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeDevices   = devices.filter(d => !d.is_archived)
  const archivedDevices = devices.filter(d => d.is_archived)

  const filtered = activeDevices.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      d.mac_address.toLowerCase().includes(q) ||
      (d.room?.room_code || '').toLowerCase().includes(q) ||
      d.device_type.toLowerCase().includes(q)
    const matchType   = typeFilter === 'All Types'   || d.device_type === typeFilter
    const matchStatus = statusFilter === 'All Status' || d.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const formatLastSeen = (iso: string | null) => {
    if (!iso) return 'Never'
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  }

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.mac_address) { setFormError('MAC address is required.'); return }
    try {
      setSaving(true); setFormError(null)
      const body: any = { ...form }
      if (!body.room) delete body.room
      const res = await fetch(`${API}/api/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      await fetchDevices()
      setShowAdd(false)
      setForm({ ...emptyForm })
    } catch (err: any) {
      setFormError(err.message)
    } finally { setSaving(false) }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEdit = (device: Device) => {
    setEditTarget(device)
    setForm({
      mac_address: device.mac_address,
      device_type: device.device_type,
      room:        device.room?._id ?? '',
      status:      device.status,
    })
    setFormError(null)
    setShowEdit(true)
  }

  const handleEdit = async () => {
    if (!editTarget) return
    if (!form.mac_address) { setFormError('MAC address is required.'); return }
    try {
      setSaving(true); setFormError(null)
      const body: any = { ...form }
      if (!body.room) delete body.room
      const res = await fetch(`${API}/api/devices/${editTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      await fetchDevices()
      setShowEdit(false)
      setEditTarget(null)
    } catch (err: any) {
      setFormError(err.message)
    } finally { setSaving(false) }
  }

  // ── Archive ────────────────────────────────────────────────────────────────
  const confirmArchive = (device: Device) => { setDeleteTarget(device); setShowConfirmDelete(true) }

  const handleArchive = async () => {
    if (!deleteTarget) return
    try {
      setSaving(true)
      await fetch(`${API}/api/devices/${deleteTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_archived: true }),
      })
      await fetchDevices()
      setShowConfirmDelete(false)
      setDeleteTarget(null)
    } finally { setSaving(false) }
  }

  // ── Restore ────────────────────────────────────────────────────────────────
  const handleRestore = async (device: Device) => {
    await fetch(`${API}/api/devices/${device._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: false }),
    })
    await fetchDevices()
  }

  // ── Form UI ────────────────────────────────────────────────────────────────
  const renderForm = () => (
    <div className="space-y-3">
      {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">MAC Address *</label>
        <input value={form.mac_address} onChange={e => setForm(p => ({ ...p, mac_address: e.target.value }))}
          placeholder="e.g. D4:E9:F4:65:F5:1C"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400 font-mono" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Device Type</label>
          <select value={form.device_type} onChange={e => setForm(p => ({ ...p, device_type: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none bg-white">
            <option value="DOOR">DOOR</option>
            <option value="POWER">POWER</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none bg-white">
            <option value="Offline">Offline</option>
            <option value="Online">Online</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Assigned Room</label>
        <select value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none bg-white">
          <option value="">-- Unassigned --</option>
          {rooms.map(r => <option key={r._id} value={r._id}>{r.room_code}</option>)}
        </select>
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Device Management</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Search Device or Room..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Devices', count: activeDevices.length,                                    icon: '📡', color: 'bg-blue-100 text-blue-600'   },
              { label: 'Online',        count: activeDevices.filter(d => d.status === 'Online').length,  icon: '🟢', color: 'bg-green-100 text-green-600'  },
              { label: 'Offline',       count: activeDevices.filter(d => d.status === 'Offline').length, icon: '⚫', color: 'bg-gray-100 text-gray-600'    },
              { label: 'Archived',      count: archivedDevices.length,                                   icon: '📦', color: 'bg-orange-100 text-orange-600' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${card.color}`}>{card.icon}</div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{card.count}</p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Types','DOOR','POWER'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Status','Online','Offline'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setTypeFilter('All Types'); setStatusFilter('All Status'); setSearch('') }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              ✕ Clear Filters
            </button>
            <div className="ml-auto flex gap-3">
              <button onClick={() => { setForm({ ...emptyForm }); setFormError(null); setShowAdd(true) }}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                + Add Device
              </button>
              <button onClick={() => setShowArchive(true)}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                📦 View Archive
                <span className="bg-white text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {archivedDevices.length}
                </span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-left">
                    <th className="py-4 px-6 font-medium">Device Type</th>
                    <th className="py-4 px-6 font-medium">MAC Address</th>
                    <th className="py-4 px-6 font-medium">Assigned Room</th>
                    <th className="py-4 px-6 font-medium">Status</th>
                    <th className="py-4 px-6 font-medium">Last Seen</th>
                    <th className="py-4 px-6 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="py-3 px-6"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">No devices found.</td></tr>
                  ) : filtered.map(device => (
                    <tr key={device._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${typeStyles[device.device_type]}`}>
                          {typeIcons[device.device_type]} {device.device_type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-600 text-xs">{device.mac_address}</td>
                      <td className="py-4 px-6">
                        <span className={device.room ? 'text-gray-700 font-medium' : 'text-gray-400 italic'}>
                          {device.room?.room_code ?? 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-2 text-sm">
                          <span className={`w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className={device.status === 'Online' ? 'text-green-600' : 'text-gray-500'}>{device.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500">{formatLastSeen(device.last_seen)}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(device)}
                            className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors" title="Edit">
                            ✏️
                          </button>
                          <button onClick={() => confirmArchive(device)}
                            className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors" title="Archive">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map(device => (
                <div key={device._id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${typeStyles[device.device_type]}`}>
                      {typeIcons[device.device_type]} {device.device_type}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {device.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-500 mb-1">{device.mac_address}</p>
                  <p className="text-xs text-gray-500">Room: {device.room?.room_code ?? 'Unassigned'}</p>
                  <p className="text-xs text-gray-400">Last seen: {formatLastSeen(device.last_seen)}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEdit(device)} className="bg-green-500 text-white text-xs px-3 py-1 rounded">Edit</button>
                    <button onClick={() => confirmArchive(device)} className="bg-red-500 text-white text-xs px-3 py-1 rounded">Archive</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Add Device Modal ──────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Add New Device</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6">{renderForm()}</div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowAdd(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Device'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Device Modal ─────────────────────────────────────────────── */}
      {showEdit && editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Edit Device</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6">{renderForm()}</div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowEdit(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Archive Modal ─────────────────────────────────────────── */}
      {showConfirmDelete && deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Archive Device?</h2>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-mono font-semibold text-gray-700">{deleteTarget.mac_address}</span> will be archived. You can restore it anytime.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowConfirmDelete(false)}
                  className="border border-gray-200 rounded-lg px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleArchive} disabled={saving}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Archiving...' : 'Yes, Archive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive Modal ─────────────────────────────────────────────────── */}
      {showArchive && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">📦 Archived Devices ({archivedDevices.length})</h2>
              <button onClick={() => setShowArchive(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {archivedDevices.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-12">No archived devices.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-left sticky top-0 bg-white">
                      <th className="py-3 px-6 font-medium">Type</th>
                      <th className="py-3 px-6 font-medium">MAC Address</th>
                      <th className="py-3 px-6 font-medium">Room</th>
                      <th className="py-3 px-6 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedDevices.map(device => (
                      <tr key={device._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeStyles[device.device_type]}`}>
                            {typeIcons[device.device_type]} {device.device_type}
                          </span>
                        </td>
                        <td className="py-3 px-6 font-mono text-xs text-gray-600">{device.mac_address}</td>
                        <td className="py-3 px-6 text-gray-500">{device.room?.room_code ?? 'Unassigned'}</td>
                        <td className="py-3 px-6">
                          <button onClick={() => handleRestore(device)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowArchive(false)}
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Devices
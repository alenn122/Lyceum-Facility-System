import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Room {
  _id: string
  room_code: string
  floor: string
  classroom_type: string | null
  capacity: number | null
  status: 'Occupied' | 'Unoccupied'
  grace_period: number
  allow_extension: boolean
  double_tap_exit: boolean
}

const emptyForm = {
  room_code: '', floor: '', classroom_type: '', capacity: '',
}

type FilterType = 'All Rooms' | 'Unoccupied' | 'Occupied'

const Rooms = () => {
  const [rooms, setRooms]       = useState<Room[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<FilterType>('All Rooms')

  // Add modal
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ ...emptyForm })
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)

  // Logic modal
  const [logicRoom, setLogicRoom]           = useState<Room | null>(null)
  const [logicForm, setLogicForm]           = useState({ grace_period: 0, allow_extension: true, double_tap_exit: true })
  const [logicSaving, setLogicSaving]       = useState(false)
  const [logicError, setLogicError]         = useState<string | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/rooms`)
      if (!res.ok) throw new Error('Failed to fetch rooms')
      setRooms(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = rooms.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.room_code.toLowerCase().includes(q) ||
      r.floor.toLowerCase().includes(q) ||
      (r.classroom_type ?? '').toLowerCase().includes(q)
    const matchFilter =
      filter === 'All Rooms'  ? true :
      filter === 'Unoccupied' ? r.status === 'Unoccupied' :
      r.status === 'Occupied'
    return matchSearch && matchFilter
  })

  // ── Add Room ───────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.room_code || !form.floor) {
      setFormError('Room Code and Floor are required.'); return
    }
    try {
      setSaving(true); setFormError(null)
      const body: any = { room_code: form.room_code, floor: form.floor }
      if (form.classroom_type) body.classroom_type = form.classroom_type
      if (form.capacity)       body.capacity = Number(form.capacity)
      const res = await fetch(`${API}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      await fetchRooms()
      setShowAdd(false)
      setForm({ ...emptyForm })
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete Room ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setSaving(true)
      await fetch(`${API}/api/rooms/${deleteTarget._id}`, { method: 'DELETE' })
      await fetchRooms()
      setDeleteTarget(null)
    } finally {
      setSaving(false)
    }
  }

  // ── Logic Config ───────────────────────────────────────────────────────────
  const openLogic = (room: Room) => {
    setLogicRoom(room)
    setLogicForm({
      grace_period:    room.grace_period,
      allow_extension: room.allow_extension,
      double_tap_exit: room.double_tap_exit,
    })
    setLogicError(null)
  }

  const handleSaveLogic = async () => {
    if (!logicRoom) return
    try {
      setLogicSaving(true); setLogicError(null)
      const res = await fetch(`${API}/api/rooms/${logicRoom._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logicForm),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      await fetchRooms()
      setLogicRoom(null)
    } catch (err: any) {
      setLogicError(err.message)
    } finally {
      setLogicSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Rooms</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Search Room..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Filter tabs + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              {(['All Rooms', 'Unoccupied', 'Occupied'] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${filter === f ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
                  {f === 'Unoccupied' && <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />}
                  {f === 'Occupied'   && <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />}
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => { setForm({ ...emptyForm }); setFormError(null); setShowAdd(true) }}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              + Add New Room
            </button>
          </div>

          {/* Room Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm h-48 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-20 text-sm">No rooms found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(room => (
                <div key={room._id}
                  className={`bg-white rounded-xl shadow-sm border-l-4 p-5 ${room.status === 'Unoccupied' ? 'border-green-500' : 'border-red-500'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-800">{room.room_code}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${room.status === 'Unoccupied' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {room.status}
                    </span>
                  </div>

                  <span className="inline-block bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-lg mb-4">
                    {room.floor}
                  </span>

                  <div className="space-y-1.5 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🏫</span>
                      <span>Type: <span className="font-medium text-gray-800">{room.classroom_type || 'N/A'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>⏱️</span>
                      <span>Grace: <span className="font-medium text-gray-800">{room.grace_period} min{room.grace_period !== 1 ? 's' : ''}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{room.allow_extension ? '✅' : '❌'}</span>
                      <span>Tap-to-Extend</span>
                      <span className="mx-1 text-gray-300">|</span>
                      <span>{room.double_tap_exit ? '✅' : '❌'}</span>
                      <span>Double-Tap Exit</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openLogic(room)}
                      className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      ⚙️ Logic
                    </button>
                    <button onClick={() => setDeleteTarget(room)}
                      className="bg-red-500 hover:bg-red-600 text-white w-9 h-9 rounded-lg flex items-center justify-center transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Add Room Modal ─────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Add New Room</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-3">
              {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Room Code *</label>
                <input value={form.room_code} onChange={e => setForm(p => ({ ...p, room_code: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" placeholder="e.g. ROOM101" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Floor *</label>
                <input value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" placeholder="e.g. 2nd Floor" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Type</label>
                <input value={form.classroom_type} onChange={e => setForm(p => ({ ...p, classroom_type: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" placeholder="e.g. CLASSROOM" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" placeholder="e.g. 40" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowAdd(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🗑️</div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Delete Room?</h2>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-semibold text-gray-700">{deleteTarget.room_code}</span> will be permanently deleted.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteTarget(null)}
                  className="border border-gray-200 rounded-lg px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} disabled={saving}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Logic Config Modal ─────────────────────────────────────────────── */}
      {logicRoom && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Logic Config</h2>
                <p className="text-xs text-blue-600 font-semibold">{logicRoom.room_code}</p>
              </div>
              <button onClick={() => setLogicRoom(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {logicError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{logicError}</p>}

              {/* Grace Period */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Grace Period (Minutes)</label>
                  <span className="text-lg font-bold text-blue-700 w-10 text-right">{logicForm.grace_period}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">How long power stays on after schedule ends.</p>
                <input
                  type="range" min={0} max={60} step={1}
                  value={logicForm.grace_period}
                  onChange={e => setLogicForm(p => ({ ...p, grace_period: Number(e.target.value) }))}
                  className="w-full accent-blue-700"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span><span>30</span><span>60</span>
                </div>
              </div>

              {/* Allow Tap-to-Extend */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Allow Tap-to-Extend</p>
                  <p className="text-xs text-gray-400 mt-0.5">Faculty can tap during the last minute to add 15 mins.</p>
                </div>
                <button
                  onClick={() => setLogicForm(p => ({ ...p, allow_extension: !p.allow_extension }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none
                    ${logicForm.allow_extension ? 'bg-blue-700' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5
                    ${logicForm.allow_extension ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Double-Tap Exit */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Enable Double-Tap Exit</p>
                  <p className="text-xs text-gray-400 mt-0.5">Distinguishes between "Extend" and "Exit" intents.</p>
                </div>
                <button
                  onClick={() => setLogicForm(p => ({ ...p, double_tap_exit: !p.double_tap_exit }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none
                    ${logicForm.double_tap_exit ? 'bg-blue-700' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5
                    ${logicForm.double_tap_exit ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setLogicRoom(null)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveLogic} disabled={logicSaving}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {logicSaving ? 'Saving...' : 'Save Config'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Rooms

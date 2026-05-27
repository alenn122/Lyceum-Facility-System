import { useState, useEffect, useCallback, useRef } from 'react'
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

const FLOOR_LEVELS = [
  { label: 'Level 4', key: '4th Floor',    rooms: ['ROOM401','ROOM402','ROOM403','ROOM404','LAB405','LAB406','LAB407'] },
  { label: 'Level 3', key: '3rd Floor',    rooms: ['ROOM301','ROOM302','ROOM303','ROOM304','ROOM305','ROOM306','ROOM307'] },
  { label: 'Level 2', key: '2nd Floor',    rooms: ['CSS LAB','COMPUTER LAB 1','COMPUTER LAB 2'] },
  { label: 'Level 1', key: 'Ground Floor', rooms: ['LOBBY'] },
]

const FLOOR_OPTIONS    = ['2nd Floor', '3rd Floor', '4th Floor', 'Ground Floor']
const TYPE_OPTIONS     = ['Classroom', 'Laboratory', 'Computer Lab', 'CSS Lab', 'Library', 'Lobby']
const ROOM_CODE_OPTIONS = [
  'CSS LAB','COMPUTER LAB 1','COMPUTER LAB 2',
  'ROOM301','ROOM302','ROOM303','ROOM304','ROOM305','ROOM306','ROOM307',
  'ROOM401','ROOM402','ROOM403','ROOM404','LAB405','LAB406','LAB407',
]

const Rooms = () => {
  const [rooms, setRooms]     = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Filters
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<FilterType>('All Rooms')
  const [floorFilter, setFloorFilter] = useState('All Floors')
  const [typeFilter, setTypeFilter]   = useState('All Types')

  // Add modal
  const [showAdd, setShowAdd]         = useState(false)
  const [form, setForm]               = useState({ ...emptyForm })
  const [formError, setFormError]     = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)

  // Logic modal
  const [logicRoom, setLogicRoom]     = useState<Room | null>(null)
  const [logicForm, setLogicForm]     = useState({ grace_period: 0, allow_extension: true, double_tap_exit: true })
  const [logicSaving, setLogicSaving] = useState(false)
  const [logicError, setLogicError]   = useState<string | null>(null)

  // Floor map modal
  const [showMap, setShowMap]         = useState(false)
  const pollRef                       = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const silentRefetch = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/rooms`)
      if (res.ok) setRooms(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  useEffect(() => {
    if (showMap) {
      pollRef.current = setInterval(silentRefetch, 10000)
    } else {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [showMap, silentRefetch])

  // ── Derived ────────────────────────────────────────────────────────────────
  // Unique floors and types from actual data for filter dropdowns
  const floorOptions = ['All Floors', ...Array.from(new Set(rooms.map(r => r.floor).filter(Boolean))).sort()]
  const typeOptions  = ['All Types',  ...Array.from(new Set(rooms.map(r => r.classroom_type).filter(Boolean) as string[])).sort()]

  const filtered = rooms.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.room_code.toLowerCase().includes(q) ||
      r.floor.toLowerCase().includes(q) ||
      (r.classroom_type ?? '').toLowerCase().includes(q)
    const matchStatus = filter === 'All Rooms' ? true : r.status === filter
    const matchFloor  = floorFilter === 'All Floors' || r.floor === floorFilter
    const matchType   = typeFilter  === 'All Types'  || r.classroom_type === typeFilter
    return matchSearch && matchStatus && matchFloor && matchType
  })

  const activeFiltersCount = [
    filter !== 'All Rooms',
    floorFilter !== 'All Floors',
    typeFilter !== 'All Types',
    search !== '',
  ].filter(Boolean).length

  const clearFilters = () => {
    setFilter('All Rooms')
    setFloorFilter('All Floors')
    setTypeFilter('All Types')
    setSearch('')
  }

  const roomByCode     = (code: string) => rooms.find(r => r.room_code.toLowerCase() === code.toLowerCase())
  const occupiedCount   = rooms.filter(r => r.status === 'Occupied').length
  const unoccupiedCount = rooms.filter(r => r.status === 'Unoccupied').length

  // ── Add Room ───────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.room_code || !form.floor) { setFormError('Room Code and Floor are required.'); return }
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
    } finally { setSaving(false) }
  }

  // ── Delete Room ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setSaving(true)
      await fetch(`${API}/api/rooms/${deleteTarget._id}`, { method: 'DELETE' })
      await fetchRooms()
      setDeleteTarget(null)
    } finally { setSaving(false) }
  }

  // ── Logic Config ───────────────────────────────────────────────────────────
  const openLogic = (room: Room) => {
    setLogicRoom(room)
    setLogicForm({ grace_period: room.grace_period, allow_extension: room.allow_extension, double_tap_exit: room.double_tap_exit })
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
    } finally { setLogicSaving(false) }
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

          {/* ── Filters Row ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">

              {/* Status tabs */}
              <div className="flex items-center gap-2">
                {(['All Rooms', 'Unoccupied', 'Occupied'] as FilterType[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${filter === f ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {f === 'Unoccupied' && <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />}
                    {f === 'Occupied'   && <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />}
                    {f}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-gray-200 hidden md:block" />

              {/* Floor filter */}
              <select value={floorFilter} onChange={e => setFloorFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 outline-none bg-white">
                {floorOptions.map(f => <option key={f}>{f}</option>)}
              </select>

              {/* Type filter */}
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 outline-none bg-white">
                {typeOptions.map(t => <option key={t}>{t}</option>)}
              </select>

              {/* Clear filters */}
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  ✕ Clear
                  <span className="bg-blue-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                </button>
              )}

              {/* Results count */}
              <span className="text-xs text-gray-400 ml-1">
                {filtered.length} of {rooms.length} room{rooms.length !== 1 ? 's' : ''}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setShowMap(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                  🗺️ Floor Map
                </button>
                <button onClick={() => { setForm({ ...emptyForm }); setFormError(null); setShowAdd(true) }}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                  + Add New Room
                </button>
              </div>
            </div>
          </div>

          {/* Room Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm h-48 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-20">
              <p className="text-4xl mb-3">🏫</p>
              <p className="text-sm">No rooms match your filters.</p>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="mt-3 text-blue-600 text-sm underline">Clear filters</button>
              )}
            </div>
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

                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-block bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-lg">
                      {room.floor}
                    </span>
                    {room.classroom_type && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-lg">
                        {room.classroom_type}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-5">
                    {room.capacity && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>👥</span>
                        <span>Capacity: <span className="font-medium text-gray-800">{room.capacity}</span></span>
                      </div>
                    )}
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

      {/* ── Floor Map Modal ───────────────────────────────────────────────────── */}
      {showMap && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-800">🗺️ Live Floor Map</h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                  <span className="text-xs text-gray-400">Live · updates every 10s</span>
                </div>
              </div>
              <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{occupiedCount}</p>
                  <p className="text-xs text-red-500 font-medium mt-0.5">Occupied</p>
                </div>
                <div className="flex-1 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{unoccupiedCount}</p>
                  <p className="text-xs text-green-500 font-medium mt-0.5">Unoccupied</p>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-gray-600">{rooms.length}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Total Rooms</p>
                </div>
              </div>

              <div className="space-y-4">
                {FLOOR_LEVELS.map(level => (
                  <div key={level.key} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{level.label}</span>
                      <span className="text-xs text-gray-400">
                        {level.rooms.filter(code => roomByCode(code)?.status === 'Occupied').length} occupied
                      </span>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2">
                      {level.rooms.map(code => {
                        const room       = roomByCode(code)
                        const isOccupied   = room?.status === 'Occupied'
                        const isUnoccupied = room?.status === 'Unoccupied'
                        const isUnknown    = !room
                        return (
                          <div key={code}
                            title={room ? `${room.room_code} — ${room.status}${room.classroom_type ? ` · ${room.classroom_type}` : ''}` : `${code} — Not in system`}
                            className={`relative flex flex-col items-center justify-center rounded-lg border-2 px-3 py-2 min-w-[80px] text-center transition-all duration-300 cursor-default
                              ${isOccupied   ? 'bg-red-100 border-red-400 text-red-800'     : ''}
                              ${isUnoccupied ? 'bg-green-100 border-green-400 text-green-800' : ''}
                              ${isUnknown    ? 'bg-gray-100 border-gray-300 text-gray-400'   : ''}`}>
                            {isOccupied && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                            <span className="text-xs font-bold leading-tight">{code}</span>
                            {room    && <span className="text-[10px] font-medium mt-0.5 opacity-70">{isOccupied ? 'OCCUPIED' : 'FREE'}</span>}
                            {isUnknown && <span className="text-[10px] mt-0.5 opacity-50">N/A</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Legend</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { color: 'bg-red-100 border-red-400',   label: 'Occupied — class in progress / faculty present' },
                    { color: 'bg-green-100 border-green-400', label: 'Unoccupied — empty, available' },
                    { color: 'bg-gray-100 border-gray-300',  label: 'Not in system' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 ${l.color}`} />
                      <span className="text-xs text-gray-600">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Room Modal ────────────────────────────────────────────────────── */}
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
                <select value={form.room_code} onChange={e => setForm(p => ({ ...p, room_code: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400 bg-white">
                  <option value="">Select Room Code</option>
                  {ROOM_CODE_OPTIONS.filter(code => !rooms.some(r => r.room_code === code)).map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Floor *</label>
                <select value={form.floor} onChange={e => setForm(p => ({ ...p, floor: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400 bg-white">
                  <option value="">Select Floor</option>
                  {FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Classroom Type</label>
                <select value={form.classroom_type} onChange={e => setForm(p => ({ ...p, classroom_type: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400 bg-white">
                  <option value="">Select Type</option>
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400"
                  placeholder="e.g. 40" />
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

      {/* ── Confirm Delete Modal ──────────────────────────────────────────────── */}
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
                <button onClick={() => setDeleteTarget(null)} className="border border-gray-200 rounded-lg px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} disabled={saving}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Logic Config Modal ────────────────────────────────────────────────── */}
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
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Grace Period (Minutes)</label>
                  <span className="text-lg font-bold text-blue-700 w-10 text-right">{logicForm.grace_period}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">How long power stays on after schedule ends.</p>
                <input type="range" min={0} max={60} step={1} value={logicForm.grace_period}
                  onChange={e => setLogicForm(p => ({ ...p, grace_period: Number(e.target.value) }))}
                  className="w-full accent-blue-700" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0</span><span>30</span><span>60</span>
                </div>
              </div>
              {[
                { key: 'allow_extension', label: 'Allow Tap-to-Extend',   desc: 'Faculty can tap during the last minute to add 15 mins.' },
                { key: 'double_tap_exit', label: 'Enable Double-Tap Exit', desc: 'Distinguishes between "Extend" and "Exit" intents.' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setLogicForm(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200
                      ${logicForm[key as keyof typeof logicForm] ? 'bg-blue-700' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5
                      ${logicForm[key as keyof typeof logicForm] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
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
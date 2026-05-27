import { useState, useEffect, useCallback, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import * as XLSX from 'xlsx'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Schedule {
  _id: string
  subject: { _id: string; code: string; description: string }
  room: { _id: string; room_code: string }
  faculty: { _id: string; first_name: string; last_name: string }
  day: string
  start_time: string
  end_time: string
  allowed_sections: { _id: string; name: string }[]
}
interface Subject       { _id: string; code: string; description: string }
interface Room          { _id: string; room_code: string }
interface Faculty       { _id: string; first_name: string; last_name: string; status: string }
interface CourseSection { _id: string; name: string }

const dayColors: Record<string, string> = {
  Mon: 'bg-cyan-400 text-white',
  Tue: 'bg-blue-400 text-white',
  Wed: 'bg-purple-400 text-white',
  Thu: 'bg-orange-400 text-white',
  Fri: 'bg-pink-400 text-white',
  Sat: 'bg-green-400 text-white',
}

const emptyForm = {
  subject: '', room: '', faculty: '', day: '',
  start_time: '', end_time: '', allowed_sections: [] as string[],
}

const SchedulePage = () => {
  const [schedules, setSchedules]         = useState<Schedule[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [showArchive, setShowArchive]     = useState(false)

  // Filters
  const [search, setSearch]               = useState('')
  const [sectionFilter, setSectionFilter] = useState('All Course Sections')
  const [dayFilter, setDayFilter]         = useState('All Days')
  const [facultyFilter, setFacultyFilter] = useState('All Faculty')
  const [roomFilter, setRoomFilter]       = useState('All Rooms')

  // Modals
  const [showImport, setShowImport]       = useState(false)
  const [showAdd, setShowAdd]             = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState<Schedule | null>(null)
  const [deleteError, setDeleteError]     = useState<string | null>(null)
  const [saving, setSaving]               = useState(false)
  const [importing, setImporting]         = useState(false)
  const [importResult, setImportResult]   = useState<{ type: 'success'|'error'; message: string } | null>(null)

  // Dropdowns
  const [subjects, setSubjects]           = useState<Subject[]>([])
  const [rooms, setRooms]                 = useState<Room[]>([])
  const [faculties, setFaculties]         = useState<Faculty[]>([])
  const [courseSections, setCourseSections] = useState<CourseSection[]>([])

  // Form
  const [form, setForm]                   = useState(emptyForm)
  const [formError, setFormError]         = useState<string | null>(null)
  const fileInputRef                      = useRef<HTMLInputElement>(null)

  // ── Fetch schedules ─────────────────────────────────────────────────────
  const fetchSchedules = useCallback(async (archived: boolean) => {
    try {
      setLoading(true)
      setError(null)
      const url = archived ? `${API}/api/schedule/archived` : `${API}/api/schedule`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch schedules')
      const data = await res.json()
      setSchedules(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSchedules(showArchive) }, [showArchive, fetchSchedules])

  // ── Fetch dropdowns — only active faculty ───────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, f, sec] = await Promise.all([
          fetch(`${API}/api/schedule/subjects`),
          fetch(`${API}/api/rooms`),
          fetch(`${API}/api/users?role=Faculty&status=Active`), // ← only active faculty
          fetch(`${API}/api/users/sections`),
        ])
        if (s.ok)   setSubjects(await s.json())
        if (r.ok)   setRooms(await r.json())
        if (f.ok)   setFaculties(await f.json())
        if (sec.ok) setCourseSections(await sec.json())
      } catch {}
    }
    load()
  }, [])

  // ── Filter options ──────────────────────────────────────────────────────
  const sectionOptions = ['All Course Sections', ...Array.from(new Set(
    schedules.flatMap(s => s.allowed_sections?.map(sec => sec?.name).filter(Boolean) || [])
  ))]
  const facultyOptions = ['All Faculty', ...Array.from(new Set(
    schedules.map(s => `${s.faculty?.first_name || ''} ${s.faculty?.last_name || ''}`.trim()).filter(Boolean)
  ))]
  const roomOptions    = ['All Rooms', ...Array.from(new Set(schedules.map(s => s.room?.room_code).filter(Boolean)))]
  const days           = ['All Days', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const filtered = schedules.filter(s => {
    if (!s.subject || !s.room) return false
    const facultyName  = s.faculty ? `${s.faculty.first_name} ${s.faculty.last_name}`.trim() : ""
    const sectionNames = s.allowed_sections?.map(sec => sec?.name || '').join(' ') || ''
    const q = search.toLowerCase()
    const matchSearch  = !q ||
      sectionNames.toLowerCase().includes(q) ||
      facultyName.toLowerCase().includes(q)  ||
      s.room.room_code.toLowerCase().includes(q) ||
      s.subject.code.toLowerCase().includes(q)   ||
      s.subject.description.toLowerCase().includes(q)
    const matchSection = sectionFilter === 'All Course Sections' || s.allowed_sections?.some(sec => sec?.name === sectionFilter)
    const matchDay     = dayFilter === 'All Days' || s.day === dayFilter
    const matchFaculty = facultyFilter === 'All Faculty' || facultyName === facultyFilter
    const matchRoom    = roomFilter === 'All Rooms' || s.room.room_code === roomFilter
    return matchSearch && matchSection && matchDay && matchFaculty && matchRoom
  })

  const grouped = filtered.reduce((acc, s) => {
    if (s.allowed_sections?.length > 0) {
      s.allowed_sections.forEach(sec => {
        if (sec?.name) {
          if (!acc[sec.name]) acc[sec.name] = []
          acc[sec.name].push(s)
        }
      })
    } else {
      if (!acc['No Section']) acc['No Section'] = []
      acc['No Section'].push(s)
    }
    return acc
  }, {} as Record<string, Schedule[]>)

  // ── Selected faculty info (for preview in form) ─────────────────────────
  const selectedFaculty = faculties.find(f => f._id === form.faculty) || null

  // ── Add schedule ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.subject || !form.room || !form.faculty || !form.day || !form.start_time || !form.end_time || form.allowed_sections.length === 0) {
      setFormError('All fields are required.'); return
    }
    try {
      setSaving(true); setFormError(null)
      const res = await fetch(`${API}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      await fetchSchedules(showArchive)
      setShowAdd(false)
      setForm(emptyForm)
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (id: string) =>
    setForm(p => ({
      ...p,
      allowed_sections: p.allowed_sections.includes(id)
        ? p.allowed_sections.filter(i => i !== id)
        : [...p.allowed_sections, id],
    }))

  // ── Delete / restore ────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setSaving(true)
      const res = await fetch(`${API}/api/schedule/${deleteTarget._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        setDeleteError(err.message)
        return
      }
      await fetchSchedules(showArchive)
      setDeleteTarget(null)
      setDeleteError(null)
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      setSaving(true)
      await fetch(`${API}/api/schedule/${id}/restore`, { method: 'PUT' })
      await fetchSchedules(showArchive)
    } finally { setSaving(false) }
  }

  // ── Download template ───────────────────────────────────────────────────
  const downloadTemplate = () => {
    const wb   = XLSX.utils.book_new()
    const data = [
      ['subject_code', 'description', 'course_section', 'day', 'start_time', 'end_time', 'room_code', 'faculty_name'],
      ['GE304',  'Science Technology Engineering',          'BSIT 1-11, BSCS 1-21', 'Mon', '08:00', '10:00', 'ROOM101', 'Rey Vergel Abella'],
      ['IT101',  'Introduction to Information Technology',  'BSIT 2-11',            'Tue', '10:00', '12:00', 'ROOM102', 'John Rey'],
      ['CS202',  'Data Structures',                         'BSCS 2-11',            'Wed', '13:00', '15:00', 'ROOM101', 'Jane Smith'],
    ]
    const ws   = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [14, 30, 24, 8, 12, 12, 12, 22].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws, 'Schedules')
    XLSX.writeFile(wb, 'schedule_import_template.xlsx')
  }

  // ── Import Excel ────────────────────────────────────────────────────────
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImporting(true)
      setImportResult(null)

      const data  = await file.arrayBuffer()
      const wb    = XLSX.read(data)

      const sheetName = wb.SheetNames.includes('Schedules') ? 'Schedules' : wb.SheetNames[0]
      const sheet     = wb.Sheets[sheetName]
      const rows      = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[]

      if (rows.length === 0) throw new Error('No data rows found in the file')

      const payload = rows
        .filter(r => r.subject_code)
        .map(r => ({
          code:           String(r.subject_code   || '').trim(),
          description:    String(r.description    || '').trim(),
          course_section: String(r.course_section || '').trim(),
          day:            String(r.day            || '').trim(),
          start_time:     String(r.start_time     || '').trim(),
          end_time:       String(r.end_time       || '').trim(),
          room_code:      String(r.room_code      || '').trim(),
          faculty_name:   String(r.faculty_name   || '').trim(),
        }))

      if (payload.length === 0) throw new Error('No valid rows found — make sure column headers match the template')

      const res    = await fetch(`${API}/api/schedule/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (result.failed > 0) {
        setImportResult({
          type: 'error',
          message: `${result.success} imported, ${result.failed} failed. Errors: ${result.errors.slice(0, 3).join(' | ')}${result.errors.length > 3 ? ` (+${result.errors.length - 3} more)` : ''}`,
        })
      } else {
        setImportResult({ type: 'success', message: `✓ ${result.success} schedules imported successfully!` })
      }

      await fetchSchedules(showArchive)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      setImportResult({ type: 'error', message: err.message })
    } finally {
      setImporting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Schedule Management</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Search by Course, Faculty, Room..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { value: sectionFilter, set: setSectionFilter, options: sectionOptions },
              { value: dayFilter,     set: setDayFilter,     options: days           },
              { value: facultyFilter, set: setFacultyFilter, options: facultyOptions },
              { value: roomFilter,    set: setRoomFilter,    options: roomOptions    },
            ].map((f, i) => (
              <select key={i} value={f.value} onChange={e => f.set(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
            <button onClick={() => { setSectionFilter('All Course Sections'); setDayFilter('All Days'); setFacultyFilter('All Faculty'); setRoomFilter('All Rooms'); setSearch('') }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              ✕ Clear Filters
            </button>
            <button onClick={() => { setShowAdd(true); setFormError(null); setForm(emptyForm) }}
              className="ml-auto bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              + Add Schedule
            </button>
          </div>

          {/* Archive & Import */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button onClick={() => setShowArchive(p => !p)}
              className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              📦 {showArchive ? 'View Active' : 'View Archive'}
            </button>
            <button onClick={() => { setShowImport(true); setImportResult(null) }}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              📊 Import Excel
            </button>
            <button onClick={downloadTemplate}
              className="border border-green-600 text-green-700 hover:bg-green-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              ⬇️ Download Template
            </button>
          </div>

          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Schedule Tables */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-32" />
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center text-gray-400 py-20 text-sm">No schedules found.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([section, list]) => (
                <div key={section} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800">{section}</h2>
                    <span className="bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {list.length} schedule{list.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 text-left">
                          <th className="py-3 px-6 font-medium">Code</th>
                          <th className="py-3 px-6 font-medium">Description</th>
                          <th className="py-3 px-6 font-medium">Day</th>
                          <th className="py-3 px-6 font-medium">Start</th>
                          <th className="py-3 px-6 font-medium">End</th>
                          <th className="py-3 px-6 font-medium">Room</th>
                          <th className="py-3 px-6 font-medium">Faculty</th>
                          <th className="py-3 px-6 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map(s => (
                          <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-6 font-semibold text-gray-800">{s.subject?.code || 'N/A'}</td>
                            <td className="py-3 px-6 text-gray-600">{s.subject?.description || 'N/A'}</td>
                            <td className="py-3 px-6">
                              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${dayColors[s.day] || 'bg-gray-200 text-gray-700'}`}>{s.day}</span>
                            </td>
                            <td className="py-3 px-6 text-gray-600">{s.start_time}</td>
                            <td className="py-3 px-6 text-gray-600">{s.end_time}</td>
                            <td className="py-3 px-6">
                              <span className="bg-gray-700 text-white px-2.5 py-1 rounded text-xs font-medium">{s.room?.room_code || 'N/A'}</span>
                            </td>
                            <td className="py-3 px-6 text-gray-600">{s.faculty?.first_name} {s.faculty?.last_name}</td>
                            <td className="py-3 px-6">
                              {showArchive ? (
                                <button onClick={() => handleRestore(s._id)} disabled={saving}
                                  className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded flex items-center justify-center disabled:opacity-50" title="Restore">↩️</button>
                              ) : (
                                <button
                                  onClick={() => { setDeleteTarget(s); setDeleteError(null) }}
                                  className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded flex items-center justify-center" title="Archive">🗑️</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {list.map(s => (
                      <div key={s._id} className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm text-gray-800">{s.subject?.code} — {s.subject?.description}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${dayColors[s.day] || 'bg-gray-200 text-gray-700'}`}>{s.day}</span>
                        </div>
                        <p className="text-xs text-gray-500">{s.start_time} - {s.end_time} • {s.room?.room_code}</p>
                        <p className="text-xs text-gray-500">Faculty: {s.faculty?.first_name} {s.faculty?.last_name}</p>
                        <div className="mt-2">
                          {showArchive
                            ? <button onClick={() => handleRestore(s._id)} className="bg-blue-500 text-white text-xs px-3 py-1 rounded">Restore</button>
                            : <button
                                onClick={() => { setDeleteTarget(s); setDeleteError(null) }}
                                className="bg-red-500 text-white text-xs px-3 py-1 rounded">Archive</button>
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Add Schedule Modal ────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-800">Add New Schedule</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subject *</label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400 bg-white">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.code} — {s.description}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Room *</label>
                <select value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400 bg-white">
                  <option value="">Select Room</option>
                  {rooms.map(r => <option key={r._id} value={r._id}>{r.room_code}</option>)}
                </select>
              </div>

              {/* Faculty dropdown + preview card */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Faculty *</label>
                <select value={form.faculty} onChange={e => setForm(p => ({ ...p, faculty: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400 bg-white">
                  <option value="">Select Faculty</option>
                  {faculties.map(f => (
                    <option key={f._id} value={f._id}>{f.first_name} {f.last_name}</option>
                  ))}
                </select>

                {/* Faculty preview card — shows when a faculty is selected */}
                {selectedFaculty && (
                  <div className="mt-2 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {selectedFaculty.first_name[0]}{selectedFaculty.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-blue-900 truncate">
                        {selectedFaculty.first_name} {selectedFaculty.last_name}
                      </p>
                      <p className="text-xs text-blue-600">
                        Faculty · <span className="text-green-600 font-medium">Active</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Day *</label>
                  <select value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400 bg-white">
                    <option value="">Day</option>
                    {['Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Time *</label>
                  <input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Time *</label>
                  <input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Course Sections * (check all that apply)</label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-44 overflow-y-auto">
                  {courseSections.length === 0
                    ? <p className="text-xs text-gray-400">No sections available</p>
                    : courseSections.map(sec => (
                      <label key={sec._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input type="checkbox" checked={form.allowed_sections.includes(sec._id)}
                          onChange={() => toggleSection(sec._id)} className="w-4 h-4 accent-blue-700" />
                        <span className="text-sm text-gray-700">{sec.name}</span>
                      </label>
                    ))
                  }
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowAdd(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={saving}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive Confirm Modal ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Archive Schedule?</h2>
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-semibold text-gray-700">{deleteTarget.subject?.code}</span> will be archived. You can restore it anytime.
              </p>

              {/* Error from backend — shown when faculty is still active */}
              {deleteError && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-left">
                  ⚠️ {deleteError}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
                  className="border border-gray-200 rounded-lg px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={saving}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Archiving...' : 'Yes, Archive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Excel Modal ────────────────────────────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">📊 Import Schedules from Excel</h2>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Required column headers:</p>
                <div className="grid grid-cols-2 gap-1">
                  {['subject_code','description','course_section','day','start_time','end_time','room_code','faculty_name'].map(col => (
                    <span key={col} className="font-mono text-xs bg-white border border-blue-200 rounded px-2 py-1 text-blue-800">{col}</span>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Multiple sections: separate with comma — <span className="font-mono">BSIT 1-11, BSCS 1-21</span>
                </p>
              </div>

              <button onClick={downloadTemplate}
                className="w-full border border-green-600 text-green-700 hover:bg-green-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                ⬇️ Download Template First
              </button>

              <div>
                <p className="text-sm text-gray-600 mb-2">Upload your filled template:</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
                  onChange={handleImportExcel} disabled={importing}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-white hover:file:bg-blue-800 file:cursor-pointer disabled:opacity-50" />
              </div>

              {importing && <p className="text-sm text-blue-600 animate-pulse">⏳ Importing schedules...</p>}

              {importResult && (
                <div className={`px-4 py-3 rounded-lg text-sm ${importResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {importResult.message}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <button onClick={() => setShowImport(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchedulePage
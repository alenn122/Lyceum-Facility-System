import { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import Sidebar from '../components/Sidebar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Section { _id: string; name: string }
interface User {
  _id:            string
  rfid_tag:       string
  first_name:     string
  last_name:      string
  role:           'Student' | 'Faculty' | 'Admin' | 'Cleaning' | 'Security'
  status:         'Active' | 'Inactive' | 'Archived'
  course_section: Section | null
  archived_date:  string | null
}

const emptyForm = {
  rfid_tag: '', first_name: '', last_name: '',
  role: 'Student', status: 'Active', course_section: '',
}

const roleColors: Record<string, string> = {
  Student:  'bg-gray-700 text-white',
  Admin:    'bg-violet-600 text-white',
  Cleaning: 'bg-green-600 text-white',
  Faculty:  'bg-blue-600 text-white',
  Security: 'bg-orange-500 text-white',
}

const ROLES = ['Student','Faculty','Admin','Cleaning','Security']
type TabType = 'All Users' | 'Students' | 'Faculty' | 'Staff'

interface ImportRow {
  rfid_tag: string
  first_name: string
  last_name: string
  role: string
  status: string
  course_section?: string
  _errors?: string[]
}

const Users = () => {
  const [users, setUsers]               = useState<User[]>([])
  const [sections, setSections]         = useState<Section[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [activeTab, setActiveTab]       = useState<TabType>('All Users')
  const [selected, setSelected]         = useState<string[]>([])

  const [showAdd, setShowAdd]           = useState(false)
  const [showEdit, setShowEdit]         = useState(false)
  const [showArchive, setShowArchive]   = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [showImport, setShowImport]     = useState(false)
  const [importRows, setImportRows]     = useState<ImportRow[]>([])
  const [importing, setImporting]       = useState(false)
  const [importDone, setImportDone]     = useState<{ success: number; failed: number } | null>(null)
  const [showConfirmBulk, setShowConfirmBulk] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm]                 = useState({ ...emptyForm })
  const [editUser, setEditUser]         = useState<User | null>(null)
  const [saving, setSaving]             = useState(false)
  const [formError, setFormError]       = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/api/users`)
      if (!res.ok) throw new Error('Failed to fetch users')
      setUsers(await res.json())
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/users/sections`)
      if (res.ok) setSections(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchUsers(); fetchSections() }, [fetchUsers, fetchSections])

  const activeUsers   = users.filter(u => u.status !== 'Archived')
  const archivedUsers = users.filter(u => u.status === 'Archived')

  const statCards = [
    { label: 'Students', count: activeUsers.filter(u => u.role === 'Student').length,  icon: '🎓', color: 'bg-purple-100 text-purple-600' },
    { label: 'Faculty',  count: activeUsers.filter(u => u.role === 'Faculty').length,  icon: '👨‍🏫', color: 'bg-blue-100 text-blue-600' },
    { label: 'Admins',   count: activeUsers.filter(u => u.role === 'Admin').length,    icon: '👤', color: 'bg-violet-100 text-violet-600' },
    { label: 'Cleaning', count: activeUsers.filter(u => u.role === 'Cleaning').length, icon: '🧹', color: 'bg-green-100 text-green-600' },
    { label: 'Security', count: activeUsers.filter(u => u.role === 'Security').length, icon: '🛡️', color: 'bg-orange-100 text-orange-600' },
    { label: 'Inactive', count: activeUsers.filter(u => u.status === 'Inactive').length, icon: '🚫', color: 'bg-red-100 text-red-500' },
  ]

  const tabs: { label: TabType; count: number }[] = [
    { label: 'All Users', count: activeUsers.length },
    { label: 'Students',  count: activeUsers.filter(u => u.role === 'Student').length },
    { label: 'Faculty',   count: activeUsers.filter(u => u.role === 'Faculty').length },
    { label: 'Staff',     count: activeUsers.filter(u => ['Cleaning','Security','Admin'].includes(u.role)).length },
  ]

  const filtered = activeUsers.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.rfid_tag.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    const matchRole   = roleFilter === 'All Roles' || u.role === roleFilter
    const matchStatus = statusFilter === 'All Status' || u.status === statusFilter
    const matchTab    = activeTab === 'All Users' ? true : activeTab === 'Students' ? u.role === 'Student' : activeTab === 'Faculty' ? u.role === 'Faculty' : ['Cleaning','Security','Admin'].includes(u.role)
    return matchSearch && matchRole && matchStatus && matchTab
  })

  const allSelected = filtered.length > 0 && filtered.every(u => selected.includes(u._id))
  const toggleSelect    = (id: string) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])
  const handleSelectAll = () => allSelected ? setSelected([]) : setSelected(filtered.map(u => u._id))

  const handleAdd = async () => {
    if (!form.rfid_tag || !form.first_name || !form.last_name) { setFormError('RFID, First Name, and Last Name are required.'); return }
    try {
      setSaving(true); setFormError(null)
      const body: any = { ...form }
      if (!body.course_section) delete body.course_section
      const res = await fetch(`${API}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      await fetchUsers(); setShowAdd(false); setForm({ ...emptyForm })
    } catch (err: any) { setFormError(err.message) }
    finally { setSaving(false) }
  }

  const openEdit = (user: User) => {
    setEditUser(user)
    setForm({ rfid_tag: user.rfid_tag, first_name: user.first_name, last_name: user.last_name, role: user.role, status: user.status, course_section: user.course_section?._id ?? '' })
    setFormError(null); setShowEdit(true)
  }

  const handleEdit = async () => {
    if (!editUser) return
    if (!form.rfid_tag || !form.first_name || !form.last_name) { setFormError('RFID, First Name, and Last Name are required.'); return }
    try {
      setSaving(true); setFormError(null)
      const body: any = { ...form }
      if (!body.course_section) delete body.course_section
      const res = await fetch(`${API}/api/users/${editUser._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      await fetchUsers(); setShowEdit(false); setEditUser(null)
    } catch (err: any) { setFormError(err.message) }
    finally { setSaving(false) }
  }

  const confirmDelete = (user: User) => { setDeleteTarget(user); setShowConfirmDelete(true) }

  const handleArchive = async () => {
    if (!deleteTarget) return
    try {
      setSaving(true)
      await fetch(`${API}/api/users/${deleteTarget._id}`, { method: 'DELETE' })
      await fetchUsers(); setShowConfirmDelete(false); setDeleteTarget(null)
    } finally { setSaving(false) }
  }

  const handleBulkArchive = async () => {
    try {
      setSaving(true)
      await Promise.all(selected.map(id => fetch(`${API}/api/users/${id}`, { method: 'DELETE' })))
      await fetchUsers(); setSelected([]); setShowConfirmBulk(false)
    } finally { setSaving(false) }
  }

  const handleRestore = async (user: User) => {
    await fetch(`${API}/api/users/${user._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Active', archived_date: null }) })
    await fetchUsers()
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['rfid_tag', 'first_name', 'last_name', 'role', 'status', 'course_section'],
      ['9DEDD106', 'Juan', 'Dela Cruz', 'Student', 'Active', 'BSIT 1-A'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Users')
    XLSX.writeFile(wb, 'users_import_template.xlsx')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const validated: ImportRow[] = raw.map(r => {
        const row: ImportRow = {
          rfid_tag: String(r.rfid_tag ?? '').trim(), first_name: String(r.first_name ?? '').trim(),
          last_name: String(r.last_name ?? '').trim(), role: String(r.role ?? '').trim(),
          status: String(r.status ?? 'Active').trim(), course_section: String(r.course_section ?? '').trim(), _errors: [],
        }
        if (!row.rfid_tag)   row._errors!.push('RFID required')
        if (!row.first_name) row._errors!.push('First name required')
        if (!row.last_name)  row._errors!.push('Last name required')
        if (!ROLES.includes(row.role)) row._errors!.push(`Invalid role "${row.role}"`)
        if (!['Active','Inactive'].includes(row.status)) row._errors!.push(`Invalid status "${row.status}"`)
        return row
      })
      setImportRows(validated); setImportDone(null)
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  const handleImport = async () => {
    const valid = importRows.filter(r => !r._errors?.length)
    if (!valid.length) return
    setImporting(true)
    let success = 0, failed = 0
    for (const row of valid) {
      try {
        const body: any = { ...row }; delete body._errors
        if (body.course_section) {
          const sec = sections.find(s => s.name.toLowerCase() === body.course_section.toLowerCase())
          if (sec) body.course_section = sec._id; else delete body.course_section
        } else { delete body.course_section }
        const res = await fetch(`${API}/api/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        res.ok ? success++ : failed++
      } catch { failed++ }
    }
    await fetchUsers(); setImporting(false); setImportDone({ success, failed })
  }

  const renderForm = () => (
    <div className="space-y-3">
      {formError && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">First Name *</label>
          <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" placeholder="First Name" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Last Name *</label>
          <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" placeholder="Last Name" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">RFID Tag *</label>
        <input value={form.rfid_tag} onChange={e => setForm(p => ({ ...p, rfid_tag: e.target.value }))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-blue-400" placeholder="e.g. 9DEDD106" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Role</label>
          <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none bg-white">
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none bg-white">
            <option>Active</option><option>Inactive</option>
          </select>
        </div>
      </div>
      {form.role === 'Student' && (
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Course Section</label>
          <select value={form.course_section} onChange={e => setForm(p => ({ ...p, course_section: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full outline-none bg-white">
            <option value="">-- Select Section --</option>
            {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">User Management</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input type="text" placeholder="Search by Name, RFID, Role..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-16" />) :
              statCards.map(card => (
                <div key={card.label} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${card.color}`}>{card.icon}</div>
                  <div><p className="text-xl font-bold text-gray-800">{card.count}</p><p className="text-xs text-gray-500">{card.label}</p></div>
                </div>
              ))
            }
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Roles','Student','Faculty','Admin','Cleaning','Security'].map(r => <option key={r}>{r}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {['All Status','Active','Inactive'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => { setRoleFilter('All Roles'); setStatusFilter('All Status'); setSearch('') }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">✕ Clear Filters</button>
            <div className="flex gap-3 ml-auto">
              <button onClick={() => { setImportRows([]); setImportDone(null); setShowImport(true) }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">📥 Import Excel</button>
              <button onClick={() => { setForm({ ...emptyForm }); setFormError(null); setShowAdd(true) }}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">👤 Add User</button>
              <button onClick={() => setShowArchive(true)}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                📦 View Archive
                <span className="bg-white text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{archivedUsers.length}</span>
              </button>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <span className="text-sm text-red-700 font-medium">{selected.length} user{selected.length > 1 ? 's' : ''} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setSelected([])} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">Deselect All</button>
                <button onClick={() => setShowConfirmBulk(true)} className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg font-medium">
                  🗑️ Archive Selected ({selected.length})
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 pt-4 pb-0">
              <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" checked={allSelected} onChange={handleSelectAll} className="w-4 h-4 accent-blue-700" />
                <span className="text-sm text-gray-600 font-medium">Select All Users</span>
              </div>
              <div className="flex gap-2 border-b border-gray-100">
                {tabs.map(tab => (
                  <button key={tab.label} onClick={() => setActiveTab(tab.label)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.label ? 'bg-blue-700 text-white' : 'text-blue-600 hover:bg-blue-50'}`}>
                    {tab.label}
                    <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold ${activeTab === tab.label ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-left">
                    <th className="py-3 px-6 font-medium w-10"></th>
                    <th className="py-3 px-6 font-medium">RFID</th>
                    <th className="py-3 px-6 font-medium">First Name</th>
                    <th className="py-3 px-6 font-medium">Last Name</th>
                    <th className="py-3 px-6 font-medium">Role</th>
                    <th className="py-3 px-6 font-medium">Course</th>
                    <th className="py-3 px-6 font-medium">Status</th>
                    <th className="py-3 px-6 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="py-3 px-6"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                  )) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-sm">No users found.</td></tr>
                  ) : filtered.map(user => (
                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6"><input type="checkbox" checked={selected.includes(user._id)} onChange={() => toggleSelect(user._id)} className="w-4 h-4 accent-blue-700" /></td>
                      <td className="py-3 px-6 text-gray-700 font-mono text-xs">{user.rfid_tag}</td>
                      <td className="py-3 px-6 font-medium text-gray-800">{user.first_name}</td>
                      <td className="py-3 px-6 text-gray-700">{user.last_name}</td>
                      <td className="py-3 px-6"><span className={`px-2.5 py-1 rounded text-xs font-medium ${roleColors[user.role] || 'bg-gray-200 text-gray-700'}`}>{user.role}</span></td>
                      <td className="py-3 px-6 text-gray-500">{user.course_section?.name ?? 'N/A'}</td>
                      <td className="py-3 px-6"><span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${user.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}>{user.status}</span></td>
                      <td className="py-3 px-6">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(user)} className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors" title="Edit">✏️</button>
                          <button onClick={() => confirmDelete(user)} className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors" title="Archive">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-100 px-4 py-2">
              {filtered.map(user => (
                <div key={user._id} className="py-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-gray-800">{user.first_name} {user.last_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${user.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}>{user.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">RFID: {user.rfid_tag}</p>
                  <p className="text-xs text-gray-500">Role: {user.role} • Course: {user.course_section?.name ?? 'N/A'}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEdit(user)} className="bg-green-500 text-white text-xs px-3 py-1 rounded">Edit</button>
                    <button onClick={() => confirmDelete(user)} className="bg-red-500 text-white text-xs px-3 py-1 rounded">Archive</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Import Excel Modal — styled like Schedule ─────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">📥 Import Users from Excel</h2>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Column reference — same style as Schedule */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Required column headers:</p>
                <div className="grid grid-cols-2 gap-1">
                  {['rfid_tag','first_name','last_name','role','status','course_section'].map(col => (
                    <span key={col} className="font-mono text-xs bg-white border border-blue-200 rounded px-2 py-1 text-blue-800">{col}</span>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Role must be one of: <span className="font-mono">Student, Faculty, Admin, Cleaning, Security</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  course_section is optional — only needed for Students
                </p>
              </div>

              {/* Download template — full width like Schedule */}
              <button onClick={downloadTemplate}
                className="w-full border border-green-600 text-green-700 hover:bg-green-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                ⬇️ Download Template First
              </button>

              {/* File upload */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Upload your filled template:</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls"
                  onChange={handleFileUpload} disabled={importing}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-white hover:file:bg-blue-800 file:cursor-pointer disabled:opacity-50" />
              </div>

              {/* Preview count after file selected */}
              {importRows.length > 0 && (
                <div className={`px-4 py-3 rounded-lg text-sm border ${importRows.filter(r => r._errors?.length).length > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  📋 <strong>{importRows.length}</strong> rows found —{' '}
                  <span className="font-semibold">{importRows.filter(r => !r._errors?.length).length} valid</span>,{' '}
                  <span className="font-semibold text-red-600">{importRows.filter(r => r._errors?.length).length} with errors</span>
                  {importRows.filter(r => r._errors?.length).length > 0 && (
                    <p className="text-xs mt-1 text-amber-700">Rows with errors will be skipped. Only valid rows will be imported.</p>
                  )}
                </div>
              )}

              {importing && <p className="text-sm text-blue-600 animate-pulse">⏳ Importing users...</p>}

              {/* Import result */}
              {importDone && (
                <div className={`px-4 py-3 rounded-lg text-sm border ${importDone.failed > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  ✓ Import complete — <span className="font-semibold">{importDone.success} added</span>
                  {importDone.failed > 0 && <span className="text-red-600 font-semibold">, {importDone.failed} failed</span>}
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowImport(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Close</button>
              <button onClick={handleImport}
                disabled={importing || !importRows.filter(r => !r._errors?.length).length}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {importing ? 'Importing...' : `Import ${importRows.filter(r => !r._errors?.length).length} Valid Users`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Add New User</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6">{renderForm()}</div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowAdd(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} disabled={saving} className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ────────────────────────────────────────────────── */}
      {showEdit && editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Edit User</h2>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6">{renderForm()}</div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setShowEdit(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Bulk Archive Modal ─────────────────────────────────────── */}
      {showConfirmBulk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Archive {selected.length} Users?</h2>
              <p className="text-sm text-gray-500 mb-6">All selected users will be moved to the archive. You can restore them anytime.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowConfirmBulk(false)} className="border border-gray-200 rounded-lg px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleBulkArchive} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Archiving...' : `Yes, Archive ${selected.length}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Archive Modal ──────────────────────────────────────────── */}
      {showConfirmDelete && deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Archive User?</h2>
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-semibold text-gray-700">{deleteTarget.first_name} {deleteTarget.last_name}</span> will be moved to the archive. You can restore them anytime.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowConfirmDelete(false)} className="border border-gray-200 rounded-lg px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleArchive} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-5 py-2 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Archiving...' : 'Yes, Archive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive Modal ──────────────────────────────────────────────────── */}
      {showArchive && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-800">📦 Archived Users ({archivedUsers.length})</h2>
              <button onClick={() => setShowArchive(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {archivedUsers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-12">No archived users.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 text-left sticky top-0 bg-white">
                      <th className="py-3 px-6 font-medium">Name</th>
                      <th className="py-3 px-6 font-medium">RFID</th>
                      <th className="py-3 px-6 font-medium">Role</th>
                      <th className="py-3 px-6 font-medium">Archived</th>
                      <th className="py-3 px-6 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedUsers.map(user => (
                      <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-6 font-medium text-gray-800">{user.first_name} {user.last_name}</td>
                        <td className="py-3 px-6 text-gray-500 font-mono text-xs">{user.rfid_tag}</td>
                        <td className="py-3 px-6"><span className={`px-2.5 py-1 rounded text-xs font-medium ${roleColors[user.role] || 'bg-gray-200 text-gray-700'}`}>{user.role}</span></td>
                        <td className="py-3 px-6 text-gray-400 text-xs">{user.archived_date ? new Date(user.archived_date).toLocaleDateString('en-PH') : '—'}</td>
                        <td className="py-3 px-6">
                          <button onClick={() => handleRestore(user)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">Restore</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowArchive(false)} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
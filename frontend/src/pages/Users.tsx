import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const mockUsers = [
  { id: 81, rfid: '32446565',   firstName: 'eya',  lastName: 'mi',  role: 'Student',  course: 'BSOA 1-21', status: 'Active' },
  { id: 79, rfid: 'RFID09805',  firstName: 'kris', lastName: 'tel', role: 'Admin',    course: 'N/A',       status: 'Active' },
  { id: 77, rfid: 'RFID076503', firstName: 'gio',  lastName: 'rge', role: 'Cleaning', course: 'N/A',       status: 'Active' },
  { id: 76, rfid: 'RFID45345002', firstName: 'john', lastName: 'rey', role: 'Faculty', course: 'N/A',      status: 'Active' },
  { id: 75, rfid: 'RFID12345',  firstName: 'anna', lastName: 'lee', role: 'Student',  course: 'BSIT 2-1', status: 'Inactive' },
  { id: 74, rfid: 'RFID99001',  firstName: 'mark', lastName: 'tan', role: 'Security', course: 'N/A',       status: 'Active' },
  { id: 73, rfid: 'RFID88002',  firstName: 'lisa', lastName: 'go',  role: 'Faculty',  course: 'N/A',       status: 'Active' },
]

const roleColors: Record<string, string> = {
  Student:  'bg-gray-700 text-white',
  Admin:    'bg-gray-700 text-white',
  Cleaning: 'bg-green-600 text-white',
  Faculty:  'bg-gray-700 text-white',
  Security: 'bg-orange-500 text-white',
}

const statCards = [
  { label: 'Students', count: 2,  icon: '🎓', color: 'bg-purple-100 text-purple-600' },
  { label: 'Faculty',  count: 3,  icon: '👨‍🏫', color: 'bg-blue-100 text-blue-600' },
  { label: 'Admins',   count: 3,  icon: '👤', color: 'bg-violet-100 text-violet-600' },
  { label: 'Cleaning', count: 3,  icon: '🧹', color: 'bg-green-100 text-green-600' },
  { label: 'Security', count: 2,  icon: '🛡️', color: 'bg-orange-100 text-orange-600' },
  { label: 'Inactive', count: 0,  icon: '🚫', color: 'bg-red-100 text-red-500' },
]

type TabType = 'All Users' | 'Students' | 'Faculty' | 'Staff'

const Users = () => {
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [activeTab, setActiveTab]   = useState<TabType>('All Users')
  const [selectAll, setSelectAll]   = useState(false)
  const [selected, setSelected]     = useState<number[]>([])

  const tabs: { label: TabType; count: number }[] = [
    { label: 'All Users', count: mockUsers.length },
    { label: 'Students',  count: mockUsers.filter(u => u.role === 'Student').length },
    { label: 'Faculty',   count: mockUsers.filter(u => u.role === 'Faculty').length },
    { label: 'Staff',     count: mockUsers.filter(u => ['Cleaning','Security','Admin'].includes(u.role)).length },
  ]

  const filtered = mockUsers.filter(u => {
    const matchSearch = search === '' ||
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.rfid.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())

    const matchRole = roleFilter === 'All Roles' || u.role === roleFilter
    const matchStatus = statusFilter === 'All Status' || u.status === statusFilter

    const matchTab =
      activeTab === 'All Users' ? true :
      activeTab === 'Students'  ? u.role === 'Student' :
      activeTab === 'Faculty'   ? u.role === 'Faculty' :
      ['Cleaning', 'Security', 'Admin'].includes(u.role)

    return matchSearch && matchRole && matchStatus && matchTab
  })

  const toggleSelect = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected([])
    } else {
      setSelected(filtered.map(u => u.id))
    }
    setSelectAll(!selectAll)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">User Management</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by Name, RFID, Role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Stat Cards */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${card.color}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{card.count}</p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white"
            >
              {['All Roles','Student','Faculty','Admin','Cleaning','Security'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white"
            >
              {['All Status','Active','Inactive'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => { setRoleFilter('All Roles'); setStatusFilter('All Status'); setSearch('') }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              ✕ Clear Filters
            </button>

            <div className="flex gap-3 ml-auto">
              <button className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                👤 Add User
              </button>
              <button className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                📦 View Archive
                <span className="bg-white text-blue-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
              </button>
            </div>
          </div>

          {/* Import Excel */}
          <div className="mb-4">
            <button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
              📊 Import Excel
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl shadow-sm">

            {/* Select All + Tabs */}
            <div className="px-6 pt-4 pb-0">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 accent-blue-700"
                />
                <span className="text-sm text-gray-600 font-medium">Select All Users</span>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-gray-100">
                {tabs.map(tab => (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                      ${activeTab === tab.label
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    {tab.label}
                    <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold
                      ${activeTab === tab.label ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-left">
                    <th className="py-3 px-6 font-medium w-10"></th>
                    <th className="py-3 px-6 font-medium">ID</th>
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-400 text-sm">
                        No users found.
                      </td>
                    </tr>
                  ) : filtered.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6">
                        <input
                          type="checkbox"
                          checked={selected.includes(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="w-4 h-4 accent-blue-700"
                        />
                      </td>
                      <td className="py-3 px-6 text-gray-700">{user.id}</td>
                      <td className="py-3 px-6 text-gray-700">{user.rfid}</td>
                      <td className="py-3 px-6 font-medium text-gray-800">{user.firstName}</td>
                      <td className="py-3 px-6 text-gray-700">{user.lastName}</td>
                      <td className="py-3 px-6">
                        <span className={`px-2.5 py-1 rounded text-xs font-medium ${roleColors[user.role] || 'bg-gray-200 text-gray-700'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-gray-500">{user.course}</td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white
                          ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex gap-2">
                          <button className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors">
                            ✏️
                          </button>
                          <button className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors">
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
            <div className="md:hidden divide-y divide-gray-100 px-4 py-2">
              {filtered.map((user) => (
                <div key={user.id} className="py-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-gray-800">{user.firstName} {user.lastName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white
                      ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {user.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">ID: {user.id} • RFID: {user.rfid}</p>
                  <p className="text-xs text-gray-500">Role: {user.role} • Course: {user.course}</p>
                  <div className="flex gap-2 mt-2">
                    <button className="bg-green-500 text-white text-xs px-3 py-1 rounded">Edit</button>
                    <button className="bg-red-500 text-white text-xs px-3 py-1 rounded">Delete</button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default Users
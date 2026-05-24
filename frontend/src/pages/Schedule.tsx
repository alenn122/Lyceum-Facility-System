import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const mockSchedules = [
  { id: 1, section: 'BSCS 1-21', code: 'GE304', description: 'Science Technology Engineering', day: 'Mon', start: '9:00 AM',  end: '12:00 PM', room: 'ROOM101', faculty: 'Jonathan Mina' },
  { id: 2, section: 'BSCS 2-11', code: 'GE304', description: 'Science Technology Engineering', day: 'Mon', start: '9:00 AM',  end: '12:00 PM', room: 'ROOM101', faculty: 'Jonathan Mina' },
  { id: 3, section: 'BSIS 1-31', code: 'GE304', description: 'Science Technology Engineering', day: 'Mon', start: '9:00 AM',  end: '12:00 PM', room: 'ROOM101', faculty: 'Jonathan Mina' },
  { id: 4, section: 'BSCS 1-21', code: 'IT101', description: 'Introduction to Computing',      day: 'Tue', start: '1:00 PM',  end: '3:00 PM',  room: 'ROOM102', faculty: 'Jonathan Mina' },
  { id: 5, section: 'BSIS 1-31', code: 'IT202', description: 'Data Structures and Algorithms',  day: 'Wed', start: '10:00 AM', end: '12:00 PM', room: 'ROOM102', faculty: 'Jonathan Mina' },
]

const dayColors: Record<string, string> = {
  Mon: 'bg-cyan-400 text-white',
  Tue: 'bg-blue-400 text-white',
  Wed: 'bg-purple-400 text-white',
  Thu: 'bg-orange-400 text-white',
  Fri: 'bg-pink-400 text-white',
  Sat: 'bg-green-400 text-white',
}

const Schedule = () => {
  const [search, setSearch]           = useState('')
  const [sectionFilter, setSectionFilter] = useState('All Course Sections')
  const [dayFilter, setDayFilter]     = useState('All Days')
  const [facultyFilter, setFacultyFilter] = useState('All Faculty')
  const [roomFilter, setRoomFilter]   = useState('All Rooms')

  const sections = ['All Course Sections', ...Array.from(new Set(mockSchedules.map(s => s.section)))]
  const days     = ['All Days', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const faculties = ['All Faculty', ...Array.from(new Set(mockSchedules.map(s => s.faculty)))]
  const rooms    = ['All Rooms', ...Array.from(new Set(mockSchedules.map(s => s.room)))]

  const clearFilters = () => {
    setSectionFilter('All Course Sections')
    setDayFilter('All Days')
    setFacultyFilter('All Faculty')
    setRoomFilter('All Rooms')
    setSearch('')
  }

  const filtered = mockSchedules.filter(s => {
    const matchSearch = search === '' ||
      s.section.toLowerCase().includes(search.toLowerCase()) ||
      s.faculty.toLowerCase().includes(search.toLowerCase()) ||
      s.room.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())

    const matchSection = sectionFilter === 'All Course Sections' || s.section === sectionFilter
    const matchDay     = dayFilter     === 'All Days'             || s.day     === dayFilter
    const matchFaculty = facultyFilter === 'All Faculty'          || s.faculty === facultyFilter
    const matchRoom    = roomFilter    === 'All Rooms'            || s.room    === roomFilter

    return matchSearch && matchSection && matchDay && matchFaculty && matchRoom
  })

  // Group by section
  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.section]) acc[s.section] = []
    acc[s.section].push(s)
    return acc
  }, {} as Record<string, typeof mockSchedules>)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Schedule Management</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by Course, Faculty, Room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {sections.map(s => <option key={s}>{s}</option>)}
            </select>

            <select value={dayFilter} onChange={e => setDayFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {days.map(d => <option key={d}>{d}</option>)}
            </select>

            <select value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {faculties.map(f => <option key={f}>{f}</option>)}
            </select>

            <select value={roomFilter} onChange={e => setRoomFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white">
              {rooms.map(r => <option key={r}>{r}</option>)}
            </select>

            <button onClick={clearFilters}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
              ✕ Clear Filters
            </button>

            <button className="ml-auto bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
              + Add Schedule
            </button>
          </div>

          {/* Archive & Import */}
          <div className="flex gap-3 mb-6">
            <button className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
              📦 View Archive
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
              📊 Import Excel
            </button>
          </div>

          {/* Grouped Schedule Tables */}
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center text-gray-400 py-20 text-sm">No schedules found.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([section, schedules]) => (
                <div key={section} className="bg-white rounded-xl shadow-sm overflow-hidden">

                  {/* Section header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-800">{section}</h2>
                    <span className="bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {schedules.length} schedule(s)
                    </span>
                  </div>

                  {/* Desktop table */}
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
                        {schedules.map(s => (
                          <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-6 font-semibold text-gray-800">{s.code}</td>
                            <td className="py-3 px-6 text-gray-600">{s.description}</td>
                            <td className="py-3 px-6">
                              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${dayColors[s.day] || 'bg-gray-200 text-gray-700'}`}>
                                {s.day}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-gray-600">{s.start}</td>
                            <td className="py-3 px-6 text-gray-600">{s.end}</td>
                            <td className="py-3 px-6">
                              <span className="bg-gray-700 text-white px-2.5 py-1 rounded text-xs font-medium">
                                {s.room}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-gray-600">{s.faculty}</td>
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
                  <div className="md:hidden divide-y divide-gray-100">
                    {schedules.map(s => (
                      <div key={s.id} className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm text-gray-800">{s.code} — {s.description}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${dayColors[s.day] || 'bg-gray-200 text-gray-700'}`}>
                            {s.day}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{s.start} - {s.end} • {s.room}</p>
                        <p className="text-xs text-gray-500">Faculty: {s.faculty}</p>
                        <div className="flex gap-2 mt-2">
                          <button className="bg-green-500 text-white text-xs px-3 py-1 rounded">Edit</button>
                          <button className="bg-red-500 text-white text-xs px-3 py-1 rounded">Delete</button>
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
    </div>
  )
}

export default Schedule
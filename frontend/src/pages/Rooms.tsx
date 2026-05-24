import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const mockRooms = [
  { id: 1, name: 'ROOM101', floor: '2ND Floor', type: 'CLASSROOM', grace: '15 mins', graceType: 'Global',  status: 'Unoccupied' },
  { id: 2, name: 'ROOM102', floor: '1st Floor', type: 'CLASSROOM', grace: '1 mins',  graceType: 'Custom',  status: 'Unoccupied' },
]

type FilterType = 'All Rooms' | 'Unoccupied' | 'Occupied'

const Rooms = () => {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState<FilterType>('All Rooms')

  const filtered = mockRooms.filter(room => {
    const matchSearch = search === '' ||
      room.name.toLowerCase().includes(search.toLowerCase()) ||
      room.floor.toLowerCase().includes(search.toLowerCase()) ||
      room.type.toLowerCase().includes(search.toLowerCase())

    const matchFilter =
      filter === 'All Rooms'  ? true :
      filter === 'Unoccupied' ? room.status === 'Unoccupied' :
      room.status === 'Occupied'

    return matchSearch && matchFilter
  })

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Rooms</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search Room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Filter tabs + Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              {(['All Rooms', 'Unoccupied', 'Occupied'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${filter === f
                      ? 'bg-blue-700 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                  {f === 'Unoccupied' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  )}
                  {f === 'Occupied' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  )}
                  {f}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button className="flex items-center gap-2 border border-blue-700 text-blue-700 hover:bg-blue-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                🌐 Global Logic
              </button>
              <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                + Add New Room
              </button>
            </div>
          </div>

          {/* Room Cards Grid */}
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-20 text-sm">No rooms found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(room => (
                <div
                  key={room.id}
                  className={`bg-white rounded-xl shadow-sm border-l-4 p-5
                    ${room.status === 'Unoccupied' ? 'border-green-500' : 'border-red-500'}`}
                >
                  {/* Room name + status */}
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-800">{room.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white
                      ${room.status === 'Unoccupied' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {room.status}
                    </span>
                  </div>

                  {/* Floor badge */}
                  <span className="inline-block bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-lg mb-4">
                    {room.floor}
                  </span>

                  {/* Details */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>🏫</span>
                      <span>Type: <span className="font-medium text-gray-800">{room.type}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span>🌐</span>
                      <span className={room.graceType === 'Custom' ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                        Grace: {room.grace} ({room.graceType})
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      ⚙️ Logic
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white w-9 h-9 rounded-lg flex items-center justify-center transition-colors">
                      🗑️
                    </button>
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

export default Rooms
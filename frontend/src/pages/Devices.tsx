import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const mockDevices = [
  { id: 2, type: 'Door',  mac: '70:B8:F6:28:30:84', room: 'ROOM101',    status: 'Offline', lastSeen: 'Apr 10, 01:19 PM' },
  { id: 1, type: 'Power', mac: 'D4:E9:F4:65:F5:1C', room: 'ROOM101',    status: 'Offline', lastSeen: 'Apr 10, 01:19 PM' },
  { id: 0, type: 'Door',  mac: 'AD:AD:AD:AD:AD:AD', room: 'Unassigned', status: 'Offline', lastSeen: 'Feb 02, 02:35 PM' },
]

const typeStyles: Record<string, string> = {
  Door:  'bg-cyan-400 text-white',
  Power: 'bg-yellow-400 text-gray-800',
}

const typeIcons: Record<string, string> = {
  Door:  '🚪',
  Power: '⚡',
}

const Devices = () => {
  const [search, setSearch] = useState('')

  const filtered = mockDevices.filter(d =>
    search === '' ||
    d.mac.toLowerCase().includes(search.toLowerCase()) ||
    d.room.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Device Management</h1>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search Device or Room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="outline-none text-sm w-full text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Add Device button */}
          <div className="flex justify-end mb-4">
            <button className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
              + Add Device
            </button>
          </div>

          {/* Desktop Table */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-left">
                    <th className="py-4 px-6 font-medium">ID</th>
                    <th className="py-4 px-6 font-medium">Device Type</th>
                    <th className="py-4 px-6 font-medium">MAC Address</th>
                    <th className="py-4 px-6 font-medium">Assigned Room</th>
                    <th className="py-4 px-6 font-medium">Device Status</th>
                    <th className="py-4 px-6 font-medium">Last Seen</th>
                    <th className="py-4 px-6 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400 text-sm">
                        No devices found.
                      </td>
                    </tr>
                  ) : filtered.map(device => (
                    <tr key={device.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-700">#{device.id}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${typeStyles[device.type]}`}>
                          {typeIcons[device.type]} {device.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-gray-600 text-xs">{device.mac}</td>
                      <td className="py-4 px-6">
                        <span className={device.room === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-700 font-medium'}>
                          {device.room}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-2 text-gray-500 text-sm">
                          <span className={`w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {device.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-500">{device.lastSeen}</td>
                      <td className="py-4 px-6">
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
              {filtered.map(device => (
                <div key={device.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-700">#{device.id}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${typeStyles[device.type]}`}>
                        {typeIcons[device.type]} {device.type}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${device.status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {device.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-500 mb-1">{device.mac}</p>
                  <p className="text-xs text-gray-500">Room: {device.room}</p>
                  <p className="text-xs text-gray-400">Last seen: {device.lastSeen}</p>
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

export default Devices
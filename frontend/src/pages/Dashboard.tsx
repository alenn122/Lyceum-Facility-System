import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'

const recentAccess = [
  { name: 'Unknown (42193D05)', role: 'null',    room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:19:03',  status: 'denied' },
  { name: 'Unknown (42193D05)', role: 'null',    room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:18:58',  status: 'denied' },
  { name: 'Unknown (42193D05)', role: 'null',    room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:18:55',  status: 'denied' },
  { name: 'Kristel Ladot',      role: 'Student', room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:18:47',  status: 'granted' },
  { name: 'Rey Vergel Abella',  role: 'Faculty', room: 'ROOM101', type: 'POWER', time: '2026-04-10 13:18:26',  status: 'granted' },
  { name: 'Rey Vergel Abella',  role: 'Faculty', room: 'ROOM101', type: 'POWER', time: '2026-04-10 13:18:23',  status: 'granted' },
  { name: 'Rey Vergel Abella',  role: 'Faculty', room: 'ROOM101', type: 'DOOR',  time: '2026-04-10 13:18:20',  status: 'denied' },
]

const Dashboard = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard value={2}  label="Total Rooms" />
            <StatCard value={17} label="Total Users" />
            <StatCard value={0}  label="Occupied Rooms" />
            <StatCard value={2}  label="Unoccupied Rooms" />
          </div>

          {/* Recent Access Table */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <span className="bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
                Recent Access
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 text-left">
                    <th className="py-3 px-6 font-medium">Name</th>
                    <th className="py-3 px-6 font-medium">Role</th>
                    <th className="py-3 px-6 font-medium">Room</th>
                    <th className="py-3 px-6 font-medium">Type</th>
                    <th className="py-3 px-6 font-medium">Time</th>
                    <th className="py-3 px-6 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAccess.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-6 font-semibold text-gray-800">{row.name}</td>
                      <td className="py-3 px-6 text-gray-500">{row.role}</td>
                      <td className="py-3 px-6 text-gray-700">{row.room}</td>
                      <td className="py-3 px-6">
                        <span className="bg-gray-600 text-white px-2.5 py-1 rounded text-xs font-medium">
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-gray-500">{row.time}</td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white
                          ${row.status === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {recentAccess.map((row, i) => (
                <div key={i} className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-gray-800">{row.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white
                      ${row.status === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}>
                      {row.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Role: {row.role} • Room: {row.room}</p>
                  <p className="text-xs text-gray-400 mt-1">{row.time}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

export default Dashboard
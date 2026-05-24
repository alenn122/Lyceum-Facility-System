interface StatCardProps {
  value: number | string
  label: string
}

const StatCard = ({ value, label }: StatCardProps) => {
  return (
    <div className="bg-blue-700 rounded-xl p-6 text-center text-white shadow-sm">
      <p className="text-4xl font-bold mb-1">{value}</p>
      <p className="text-sm text-blue-100">{label}</p>
    </div>
  )
}

export default StatCard
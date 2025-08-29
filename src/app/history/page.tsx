export default function HistoryPage() {
  return (
    <div className="min-h-screen pb-24 bg-white dark:bg-zinc-950">
      <div className="max-w-screen-sm mx-auto md:max-w-3xl p-4">
        {/* Header */}
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">History</h1>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Track your past activities</p>
        </div>
        
        {/* Placeholder content */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gray-100 dark:bg-gray-800">
            <span className="text-3xl">🕰️</span>
          </div>
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">History Feature</h3>
          <p className="text-base text-gray-600 dark:text-gray-400">This feature is under development</p>
        </div>
      </div>
    </div>
  )
}

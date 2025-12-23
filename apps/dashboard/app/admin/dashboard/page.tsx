import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const [
    publisherCount,
    appCount,
    adUnitCount,
    demandSourceCount,
    activeDemandSources
  ] = await Promise.all([
    prisma.publisher.count(),
    prisma.app.count(),
    prisma.adUnit.count(),
    prisma.demandSource.count(),
    prisma.demandSource.findMany({
      where: { isActive: true },
      include: {
        gamConfig: true,
        unityConfig: true,
        fyberConfig: true,
        ortbConfig: true,
      },
      orderBy: { priority: 'asc' },
    }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Publishers</h3>
          <p className="text-3xl font-bold">{publisherCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Apps</h3>
          <p className="text-3xl font-bold">{appCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Ad Units</h3>
          <p className="text-3xl font-bold">{adUnitCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Demand Sources</h3>
          <p className="text-3xl font-bold">{demandSourceCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Active Demand Sources</h2>
            <Link
              href="/admin/demand"
              className="text-sm text-blue-600 hover:underline"
            >
              Manage →
            </Link>
          </div>
          {activeDemandSources.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No active demand sources. Add your first demand source to start serving ads.
            </div>
          ) : (
            <div className="divide-y">
              {activeDemandSources.map((source) => (
                <div key={source.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{source.name}</h3>
                    <p className="text-sm text-gray-500">{source.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Priority: {source.priority}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href="/admin/demand/gam/new"
              className="block px-4 py-3 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <span className="font-medium">Add GAM/MCM Account</span>
              <p className="text-sm text-gray-500">Connect Google Ad Manager</p>
            </Link>
            <Link
              href="/admin/demand/unity/new"
              className="block px-4 py-3 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <span className="font-medium">Add Unity Ads</span>
              <p className="text-sm text-gray-500">Connect Unity Ads network</p>
            </Link>
            <Link
              href="/admin/demand/ortb/new"
              className="block px-4 py-3 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <span className="font-medium">Add OpenRTB DSP</span>
              <p className="text-sm text-gray-500">Connect any RTB endpoint</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

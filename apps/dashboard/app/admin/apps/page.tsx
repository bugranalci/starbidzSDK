import { prisma } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminAppsPage() {
  const apps = await prisma.app.findMany({
    include: {
      publisher: {
        include: {
          user: true,
        },
      },
      _count: {
        select: { adUnits: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">All Apps</h1>
        <span className="text-gray-400">{apps.length} total apps</span>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                App Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Publisher
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Platform
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Mediation
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Ad Units
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                App Key
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {apps.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  No apps registered yet
                </td>
              </tr>
            ) : (
              apps.map((app) => (
                <tr key={app.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{app.name}</div>
                      <div className="text-sm text-gray-400">{app.bundleId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/publishers/${app.publisher.id}`}
                      className="text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      {app.publisher.company || app.publisher.name || app.publisher.user.email}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      app.platform === 'ANDROID'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : app.platform === 'IOS'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {app.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{app.mediation}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/ad-units?appId=${app.id}`}
                      className="text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      {app._count.adUnits} units
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      app.isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {app.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-black/30 px-2 py-1 rounded text-gray-300">
                      {app.appKey.slice(0, 16)}...
                    </code>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function AdminAdUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ appId?: string }>
}) {
  const params = await searchParams
  const appId = params.appId

  const whereClause = appId ? { appId } : {}

  const [adUnits, app] = await Promise.all([
    prisma.adUnit.findMany({
      where: whereClause,
      include: {
        app: {
          include: {
            publisher: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    appId
      ? prisma.app.findUnique({
          where: { id: appId },
          select: { name: true },
        })
      : null,
  ])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {app ? `Ad Units - ${app.name}` : 'All Ad Units'}
          </h1>
          {appId && (
            <Link
              href="/admin/ad-units"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              ← View all ad units
            </Link>
          )}
        </div>
        <span className="text-gray-400">{adUnits.length} total ad units</span>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Ad Unit Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                App
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Publisher
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Format
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Floor Price
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Placement ID
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {adUnits.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  No ad units found
                </td>
              </tr>
            ) : (
              adUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{unit.name}</div>
                    {unit.format === 'BANNER' && unit.width && unit.height && (
                      <div className="text-sm text-gray-400">
                        {unit.width}x{unit.height}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/apps?appId=${unit.app.id}`}
                      className="text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      {unit.app.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/publishers/${unit.app.publisher.id}`}
                      className="text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      {unit.app.publisher.company || unit.app.publisher.name || unit.app.publisher.user.email}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      unit.format === 'BANNER'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : unit.format === 'INTERSTITIAL'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {unit.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    ${unit.floorPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      unit.isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {unit.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-black/30 px-2 py-1 rounded text-gray-300">
                      {unit.placementId.slice(0, 16)}...
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

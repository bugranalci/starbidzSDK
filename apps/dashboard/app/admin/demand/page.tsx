import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Prisma } from '@prisma/client'

type DemandSourceFull = Prisma.DemandSourceGetPayload<{
  include: { gamConfig: true; unityConfig: true; fyberConfig: true; ortbConfig: true; _count: { select: { adUnits: true } } }
}>

export default async function DemandSourcesPage() {
  const demandSources = await prisma.demandSource.findMany({
    include: {
      gamConfig: true,
      unityConfig: true,
      fyberConfig: true,
      ortbConfig: true,
      _count: { select: { adUnits: true } },
    },
    orderBy: { priority: 'asc' },
  })

  const typeColors: Record<string, string> = {
    GAM: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    UNITY: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    FYBER: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    ORTB: 'bg-green-500/20 text-green-300 border border-green-500/30',
  }

  // Calculate stats
  const totalSources = demandSources.length
  const activeSources = demandSources.filter(s => s.isActive).length
  const totalAdUnits = demandSources.reduce((acc, s) => acc + s._count.adUnits, 0)
  const typeCount = {
    GAM: demandSources.filter(s => s.type === 'GAM').length,
    UNITY: demandSources.filter(s => s.type === 'UNITY').length,
    FYBER: demandSources.filter(s => s.type === 'FYBER').length,
    ORTB: demandSources.filter(s => s.type === 'ORTB').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Demand Sources</h1>
          <p className="text-gray-400">Manage ad network integrations and DSP connections</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/demand/gam/new"
            className="px-4 py-2 bg-blue-600/80 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
          >
            + GAM
          </Link>
          <Link
            href="/admin/demand/unity/new"
            className="px-4 py-2 bg-purple-600/80 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
          >
            + Unity
          </Link>
          <Link
            href="/admin/demand/fyber/new"
            className="px-4 py-2 bg-orange-600/80 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
          >
            + Fyber
          </Link>
          <Link
            href="/admin/demand/ortb/new"
            className="px-4 py-2 bg-green-600/80 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
          >
            + OpenRTB
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Sources', value: totalSources },
          { label: 'Active Sources', value: activeSources },
          { label: 'Total Ad Units', value: totalAdUnits },
          { label: 'Source Types', value: Object.values(typeCount).filter(v => v > 0).length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {demandSources.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">No demand sources configured</h3>
          <p className="text-gray-400 mb-4">
            Add your first demand source to start receiving bids from ad networks.
          </p>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">All Demand Sources</h2>
            <p className="text-sm text-gray-400">View and manage all connected ad networks</p>
          </div>
          <table className="min-w-full divide-y divide-white/10">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Ad Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {demandSources.map((source: DemandSourceFull) => (
                <tr key={source.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-300">{source.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/demand/${source.type.toLowerCase()}/${source.id}`}
                      className="font-medium text-white hover:text-violet-400 transition-colors"
                    >
                      {source.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${typeColors[source.type]}`}>
                      {source.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {source.type === 'ORTB' ? 'N/A' : source._count.adUnits}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        source.isActive
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {source.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/demand/${source.type.toLowerCase()}/${source.id}`}
                      className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

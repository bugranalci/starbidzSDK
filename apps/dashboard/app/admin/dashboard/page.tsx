import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type DemandSourceWithConfigs = Prisma.DemandSourceGetPayload<{
  include: { gamConfig: true; unityConfig: true; fyberConfig: true; ortbConfig: true }
}>

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

  const stats = [
    { label: 'Publishers', value: publisherCount, href: '/admin/publishers', color: 'from-violet-500 to-purple-600' },
    { label: 'Apps', value: appCount, href: '/admin/apps', color: 'from-blue-500 to-cyan-600' },
    { label: 'Ad Units', value: adUnitCount, href: '/admin/ad-units', color: 'from-emerald-500 to-teal-600' },
    { label: 'Demand Sources', value: demandSourceCount, href: '/admin/demand', color: 'from-orange-500 to-amber-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          >
            <h3 className="text-sm font-medium text-gray-300">{stat.label}</h3>
            <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
              Click to view →
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Active Demand Sources</h2>
            <Link
              href="/admin/demand"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Manage →
            </Link>
          </div>
          {activeDemandSources.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No active demand sources. Add your first demand source to start serving ads.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {activeDemandSources.map((source: DemandSourceWithConfigs) => (
                <div key={source.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-white">{source.name}</h3>
                    <p className="text-sm text-gray-400">{source.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      Priority: {source.priority}
                    </span>
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="p-6 space-y-3">
            <Link
              href="/admin/demand/gam/new"
              className="block px-4 py-3 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
            >
              <span className="font-medium text-white">Add GAM/MCM Account</span>
              <p className="text-sm text-gray-400">Connect Google Ad Manager</p>
            </Link>
            <Link
              href="/admin/demand/unity/new"
              className="block px-4 py-3 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 border border-purple-500/20 transition-colors"
            >
              <span className="font-medium text-white">Add Unity Ads</span>
              <p className="text-sm text-gray-400">Connect Unity Ads network</p>
            </Link>
            <Link
              href="/admin/demand/ortb/new"
              className="block px-4 py-3 bg-green-500/10 rounded-lg hover:bg-green-500/20 border border-green-500/20 transition-colors"
            >
              <span className="font-medium text-white">Add OpenRTB DSP</span>
              <p className="text-sm text-gray-400">Connect any RTB endpoint</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

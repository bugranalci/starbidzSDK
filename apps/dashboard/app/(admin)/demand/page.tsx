import { prisma } from '@/lib/db'
import Link from 'next/link'

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
    GAM: 'bg-blue-100 text-blue-800',
    UNITY: 'bg-purple-100 text-purple-800',
    FYBER: 'bg-orange-100 text-orange-800',
    ORTB: 'bg-green-100 text-green-800',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Demand Sources</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/demand/gam/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            + GAM
          </Link>
          <Link
            href="/admin/demand/unity/new"
            className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
          >
            + Unity
          </Link>
          <Link
            href="/admin/demand/fyber/new"
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
          >
            + Fyber
          </Link>
          <Link
            href="/admin/demand/ortb/new"
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            + OpenRTB
          </Link>
        </div>
      </div>

      {demandSources.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No demand sources configured</h3>
          <p className="text-gray-500 mb-4">
            Add your first demand source to start receiving bids from ad networks.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ad Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {demandSources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">{source.priority}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/demand/${source.type.toLowerCase()}/${source.id}`}
                      className="font-medium hover:underline"
                    >
                      {source.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${typeColors[source.type]}`}>
                      {source.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {source.type === 'ORTB' ? 'N/A' : source._count.adUnits}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        source.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {source.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/demand/${source.type.toLowerCase()}/${source.id}`}
                      className="text-blue-600 hover:underline text-sm"
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

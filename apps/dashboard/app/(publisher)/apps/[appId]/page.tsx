import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ appId: string }>
}) {
  const { appId } = await params
  const user = await getOrCreateUser()

  if (!user?.publisher) {
    return <div>Loading...</div>
  }

  const app = await prisma.app.findFirst({
    where: {
      id: appId,
      publisherId: user.publisher.id,
    },
    include: {
      adUnits: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!app) {
    notFound()
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{app.name}</h1>
          <p className="text-gray-500">{app.bundleId}</p>
        </div>
        <span
          className={`px-3 py-1 rounded text-sm ${
            app.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {app.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">App Details</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Platform</dt>
              <dd>{app.platform}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Mediation</dt>
              <dd>{app.mediation}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Created</dt>
              <dd>{app.createdAt.toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Integration</h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-500 text-sm">App Key</span>
              <code className="block bg-gray-100 p-2 rounded text-sm mt-1 break-all">
                {app.appKey}
              </code>
            </div>
          </div>
          <Link
            href={`/apps/${app.id}/integrate`}
            className="text-primary hover:underline text-sm mt-4 inline-block"
          >
            View Integration Guide →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Ad Units</h2>
          <Link
            href={`/apps/${app.id}/units/new`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Add Ad Unit
          </Link>
        </div>

        {app.adUnits.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No ad units yet. Create your first ad unit to start serving ads.
          </div>
        ) : (
          <div className="divide-y">
            {app.adUnits.map((unit) => (
              <div key={unit.id} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{unit.name}</h3>
                    <p className="text-sm text-gray-500">
                      {unit.format}
                      {unit.width && unit.height && ` • ${unit.width}x${unit.height}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {unit.placementId}
                    </code>
                    <span
                      className={`ml-4 px-2 py-1 rounded text-xs ${
                        unit.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {unit.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

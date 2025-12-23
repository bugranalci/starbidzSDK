import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function AppsPage() {
  const user = await getOrCreateUser()

  if (!user?.publisher) {
    return <div>Loading...</div>
  }

  const apps = await prisma.app.findMany({
    where: { publisherId: user.publisher.id },
    include: { _count: { select: { adUnits: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Apps</h1>
        <Link
          href="/apps/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Add App
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="text-lg font-medium mb-2">No apps yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first app to start integrating Starbidz SDK
          </p>
          <Link
            href="/apps/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md inline-block"
          >
            Create App
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  App
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mediation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/apps/${app.id}`} className="hover:underline">
                      <div className="font-medium">{app.name}</div>
                      <div className="text-sm text-gray-500">{app.bundleId}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{app.platform}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{app.mediation}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{app._count.adUnits}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        app.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {app.isActive ? 'Active' : 'Inactive'}
                    </span>
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

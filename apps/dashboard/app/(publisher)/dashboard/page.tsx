import { getOrCreateUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getOrCreateUser()

  if (!user?.publisher) {
    return <div>Loading...</div>
  }

  const apps = await prisma.app.findMany({
    where: { publisherId: user.publisher.id },
    include: { _count: { select: { adUnits: true } } },
  })

  const totalAdUnits = apps.reduce((sum, app) => sum + app._count.adUnits, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Apps</h3>
          <p className="text-3xl font-bold">{apps.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Ad Units</h3>
          <p className="text-3xl font-bold">{totalAdUnits}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Today Revenue</h3>
          <p className="text-3xl font-bold">$0.00</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Apps</h2>
          <Link
            href="/apps/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Add App
          </Link>
        </div>
        {apps.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No apps yet. Create your first app to get started.
          </div>
        ) : (
          <div className="divide-y">
            {apps.map((app) => (
              <Link
                key={app.id}
                href={`/apps/${app.id}`}
                className="block px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{app.name}</h3>
                    <p className="text-sm text-gray-500">{app.bundleId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">
                      {app._count.adUnits} ad units
                    </span>
                    <span
                      className={`ml-4 px-2 py-1 rounded text-xs ${
                        app.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {app.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

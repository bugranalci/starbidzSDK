import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default async function PublisherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold">
                Starbidz
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Dashboard
                </Link>
                <Link
                  href="/apps"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Apps
                </Link>
                <Link
                  href="/reports"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Reports
                </Link>
                <Link
                  href="/settings"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

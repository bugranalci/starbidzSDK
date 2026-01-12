import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { prisma } from '@/lib/db'
import Image from 'next/image'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard') // Redirect non-admins to publisher dashboard
  }

  return (
    <div className="min-h-screen relative">
      {/* Clean dark background */}
      <div className="fixed inset-0 -z-10 bg-gray-950" />

      <nav className="bg-gray-900/80 backdrop-blur-sm text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex items-center">
                <Image
                  src="/starbidz-logos.svg"
                  alt="Starbidz"
                  width={400}
                  height={400}
                  className="h-40 w-40"
                  priority
                />
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/demand"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                >
                  Demand Sources
                </Link>
                <Link
                  href="/admin/publishers"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                >
                  Publishers
                </Link>
                <Link
                  href="/admin/reports"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                >
                  Reports
                </Link>
                <Link
                  href="/admin/system"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                >
                  System
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Publisher View
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        {children}
      </main>
    </div>
  )
}

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
      {/* Premium stripe background */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
        {/* Vertical stripe lines with glow */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 80px,
                rgba(139, 92, 246, 0.03) 80px,
                rgba(139, 92, 246, 0.03) 81px
              )
            `,
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-[140px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      <nav className="bg-gray-900/80 backdrop-blur-sm text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/dashboard" className="flex items-center">
                <Image
                  src="/starbidz-logo.svg"
                  alt="Starbidz"
                  width={140}
                  height={32}
                  className="h-8 w-auto"
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

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
      {/* Premium S-wave stripe background */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
        {/* S-shaped wave with horizontal stripes */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient from purple to violet/pink */}
            <linearGradient id="stripeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            {/* Clip path for S-wave shape */}
            <clipPath id="sWaveClip">
              <path d="
                M 350 0
                C 600 0, 700 150, 650 300
                C 600 450, 350 500, 350 650
                C 350 800, 500 900, 700 1000
                L 800 1000
                L 800 0
                Z
              " />
            </clipPath>
          </defs>
          {/* Generate horizontal stripes inside S-wave */}
          <g clipPath="url(#sWaveClip)">
            {Array.from({ length: 100 }).map((_, i) => (
              <rect
                key={i}
                x="0"
                y={i * 10}
                width="800"
                height="5"
                fill="url(#stripeGradient)"
                opacity={0.6 + (i % 3) * 0.1}
              />
            ))}
          </g>
        </svg>
        {/* Subtle ambient glow */}
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px]" />
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

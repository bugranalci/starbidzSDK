import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from './db'

export async function getOrCreateUser() {
  const { userId } = await auth()
  if (!userId) return null

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) return null

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { publisher: true }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
        publisher: {
          create: {}
        }
      },
      include: { publisher: true }
    })
  }

  return user
}

export async function requireAuth() {
  const user = await getOrCreateUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  return user
}

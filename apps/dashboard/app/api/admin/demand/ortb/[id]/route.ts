import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

async function isAdmin() {
  const { userId } = await auth()
  if (!userId) return false

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  return user?.role === 'ADMIN'
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.demandSource.delete({
      where: { id, type: 'ORTB' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete ORTB source error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

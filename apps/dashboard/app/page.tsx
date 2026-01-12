import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <Image
          src="/starbidz-logos.svg"
          alt="Starbidz"
          width={400}
          height={400}
          className="mx-auto mb-4"
          priority
        />
        <p className="text-muted-foreground mb-8">
          Starbidz SDK Dashboard For Publishers
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-input rounded-md hover:bg-accent"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}

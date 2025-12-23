import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Starbidz</h1>
        <p className="text-muted-foreground mb-8">
          Ad Mediation SDK Dashboard
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

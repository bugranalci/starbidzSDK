import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo and branding */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full scale-150" />
              <Image
                src="/starbidz-logos.svg"
                alt="Starbidz"
                width={200}
                height={200}
                className="relative mx-auto drop-shadow-2xl"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Starbidz SDK
            </h1>
            <p className="text-slate-400 text-lg">
              Publisher Dashboard
            </p>
          </div>

          {/* Login card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-400 text-sm">
                Sign in to manage your ad units and analytics
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/login"
                className="flex items-center justify-center w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Link>

              <Link
                href="/register"
                className="flex items-center justify-center w-full px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Create Account
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-slate-500 text-xs">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          {/* Features highlight */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:border-purple-500/30 transition-all duration-200">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-xs font-medium">Analytics</p>
            </div>
            <div className="group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all duration-200">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-400 text-xs font-medium">Revenue</p>
            </div>
            <div className="group">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-violet-500/20 group-hover:border-violet-500/30 transition-all duration-200">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-slate-400 text-xs font-medium">Fast SDK</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

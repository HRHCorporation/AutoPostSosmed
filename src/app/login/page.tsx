import { login, signup } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-20 mx-auto glass-card p-8">
      <div className="flex flex-col mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-primary-800 dark:text-primary-400">Welcome Back</h1>
        <p className="text-sm text-gray-500 mt-2">Sign in to manage your LinkedIn posts.</p>
      </div>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <label className="text-md text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-xl px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 mb-6 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-sans"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-xl px-4 py-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 mb-6 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-sans"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />

        <button
          formAction={login}
          className="bg-primary-600 hover:bg-primary-700 rounded-xl px-4 py-3 text-white font-medium mb-2 transition-colors shadow-lg shadow-primary-500/30"
        >
          Sign In
        </button>
        <button
          formAction={signup}
          className="bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl px-4 py-3 text-foreground font-medium mb-2 transition-colors"
        >
          Sign Up
        </button>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-center rounded-xl font-medium text-sm">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}

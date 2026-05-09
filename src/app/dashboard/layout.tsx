import Link from 'next/link'
import { LayoutDashboard, PenSquare, Clock, CheckCircle, Settings, LogOut } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Authentication disabled - direct access allowed

  return (
    <div className="min-h-screen flex text-foreground">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/20 dark:border-primary-900/30 flex flex-col fixed inset-y-0 z-10 shadow-2xl dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="p-6">
          <Link href="/dashboard" className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-neon-blue to-primary-600 animate-pulse-glow hover:animate-none transition-all drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]">
            AutomateIn
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/40 dark:hover:bg-primary-900/40 hover:shadow-[0_0_15px_rgba(10,102,194,0.3)] transition-all text-sm font-medium border border-transparent hover:border-white/50 dark:hover:border-primary-500/30 group">
            <LayoutDashboard size={20} className="text-gray-500 group-hover:text-primary-600 dark:group-hover:text-neon-blue transition-colors" />
            <span className="group-hover:text-primary-800 dark:group-hover:text-white transition-colors">Overview</span>
          </Link>
          <Link href="/dashboard/editor" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/40 dark:hover:bg-primary-900/40 hover:shadow-[0_0_15px_rgba(10,102,194,0.3)] transition-all text-sm font-medium border border-transparent hover:border-white/50 dark:hover:border-primary-500/30 group">
            <PenSquare size={20} className="text-gray-500 group-hover:text-primary-600 dark:group-hover:text-neon-blue transition-colors" />
            <span className="group-hover:text-primary-800 dark:group-hover:text-white transition-colors">Create Post</span>
          </Link>
          <Link href="/dashboard/posts?status=draft" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/40 dark:hover:bg-primary-900/40 hover:shadow-[0_0_15px_rgba(10,102,194,0.3)] transition-all text-sm font-medium border border-transparent hover:border-white/50 dark:hover:border-primary-500/30 group">
            <Clock size={20} className="text-gray-500 group-hover:text-primary-600 dark:group-hover:text-neon-blue transition-colors" />
            <span className="group-hover:text-primary-800 dark:group-hover:text-white transition-colors">Drafts & Scheduled</span>
          </Link>
          <Link href="/dashboard/posts?status=published" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/40 dark:hover:bg-primary-900/40 hover:shadow-[0_0_15px_rgba(10,102,194,0.3)] transition-all text-sm font-medium border border-transparent hover:border-white/50 dark:hover:border-primary-500/30 group">
            <CheckCircle size={20} className="text-gray-500 group-hover:text-primary-600 dark:group-hover:text-neon-blue transition-colors" />
            <span className="group-hover:text-primary-800 dark:group-hover:text-white transition-colors">Published</span>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/40 dark:hover:bg-primary-900/40 hover:shadow-[0_0_15px_rgba(10,102,194,0.3)] transition-all text-sm font-medium border border-transparent hover:border-white/50 dark:hover:border-primary-500/30 group">
            <Settings size={20} className="text-gray-500 group-hover:text-primary-600 dark:group-hover:text-neon-blue transition-colors" />
            <span className="group-hover:text-primary-800 dark:group-hover:text-white transition-colors">Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-primary-900/50 bg-white/30 dark:bg-black/20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-2 hover:bg-white/50 dark:hover:bg-primary-900/20 transition-colors cursor-default border border-transparent dark:hover:border-primary-500/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-neon-blue flex items-center justify-center text-white font-bold uppercase text-sm shadow-[0_0_10px_rgba(0,212,255,0.5)]">
              {user.email?.charAt(0)}
            </div>
            <div className="text-sm font-medium truncate max-w-[120px] dark:text-gray-300">{user.email}</div>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all text-sm font-medium border border-transparent hover:border-red-500/30">
              <LogOut size={20} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 animate-fade-in relative z-0">
        {children}
      </main>
    </div>
  )
}

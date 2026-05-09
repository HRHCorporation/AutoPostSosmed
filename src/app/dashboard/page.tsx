import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, BarChart3, Clock, CheckCircle2 } from 'lucide-react'
import { SINGLE_USER_ID } from '@/config/auth'

export default async function DashboardPage() {
  const supabase = createClient()

  // Using hardcoded user ID - no authentication required
  const userId = SINGLE_USER_ID

  // Fetch quick stats
  // In a real scenario we'd do aggregation queries
  const { count: draftCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft')
  const { count: scheduledCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'scheduled')
  const { count: publishedCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published')

  // Check if LinkedIn is connected
  const { data: accounts } = await supabase.from('social_accounts').select('id').eq('user_id', userId).limit(1)
  const isLinkedInConnected = accounts && accounts.length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-400">Welcome to your AutomateIn workspace.</p>
        </div>
        <Link href="/dashboard/editor" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2">
          <Plus size={18} />
          New Post
        </Link>
      </header>

      {!isLinkedInConnected && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-2xl flex items-start sm:items-center flex-col sm:flex-row justify-between gap-4">
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-500 text-lg">Connect your LinkedIn Account</h3>
            <p className="text-yellow-700 dark:text-yellow-400/80 text-sm mt-1">You need to connect your LinkedIn account to start scheduling and publishing posts.</p>
          </div>
          <Link href="/dashboard/settings" className="bg-yellow-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-yellow-600 transition-colors whitespace-nowrap">
            Connect Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-primary-600/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start relative z-10">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-neon-blue transition-colors">Drafts</span>
            <div className="p-2 bg-gray-100 dark:bg-gray-800/80 rounded-lg text-gray-600 dark:text-gray-400 group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 drop-shadow-sm relative z-10">{draftCount || 0}</div>
        </div>

        {/* Stat Card 2 */}
        <div className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start relative z-10">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-neon-blue transition-colors">Scheduled</span>
            <div className="p-2 bg-blue-100 dark:bg-primary-900/40 rounded-lg text-blue-600 dark:text-neon-blue group-hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all">
              <Clock size={18} />
            </div>
          </div>
          <div className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-400 dark:from-neon-blue dark:to-primary-500 drop-shadow-[0_0_8px_rgba(0,212,255,0.3)] relative z-10">{scheduledCount || 0}</div>
        </div>

        {/* Stat Card 3 */}
        <div className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start relative z-10">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-green-500 transition-colors">Published</span>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.3)] relative z-10">{publishedCount || 0}</div>
        </div>
      </div>

      {/* FEATURE SHOWCASE / ONBOARDING */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Explore AutomateIn
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Link href="/dashboard/editor" className="glass-card overflow-hidden group flex flex-col hover:border-neon-blue/50 transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] hover:-translate-y-2 duration-300 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1020] via-transparent to-transparent z-10"></div>
            <div className="h-48 relative overflow-hidden bg-black flex items-center justify-center p-4">
               <img 
                 src="/images/ai_writing_holo.png" 
                 alt="AI Brainstorming Hologram" 
                 className="object-contain h-full w-full opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 blur-[2px] group-hover:blur-0"
               />
               <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-transparent transition-colors mix-blend-overlay"></div>
            </div>
            <div className="p-6 relative z-20 flex-1 flex flex-col">
              <div className="w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center mb-4 border border-primary-500/30 group-hover:border-neon-blue transition-colors shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                <span className="text-neon-blue font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-neon-blue transition-colors">AI Content Generator</h3>
              <p className="text-gray-400 text-sm flex-1 leading-relaxed">
                Break through writer's block. Let the advanced AI module draft, brainstorm, and optimize your professional updates instantly.
              </p>
              <div className="mt-6 flex items-center gap-2 text-neon-blue font-semibold text-sm">
                Try Editor <span className="group-hover:translate-x-2 transition-transform">➔</span>
              </div>
            </div>
          </Link>

          {/* Feature 2 */}
          <Link href="/dashboard/posts" className="glass-card overflow-hidden group flex flex-col hover:border-purple-500/50 transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:-translate-y-2 duration-300 relative delay-75">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1020] via-transparent to-transparent z-10"></div>
            <div className="h-48 relative overflow-hidden bg-black flex items-center justify-center p-4">
               <img 
                 src="/images/schedule_holo.png" 
                 alt="Scheduling Hologram" 
                 className="object-contain h-full w-full opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 blur-[2px] group-hover:blur-0"
               />
               <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-transparent transition-colors mix-blend-overlay"></div>
            </div>
            <div className="p-6 relative z-20 flex-1 flex flex-col">
              <div className="w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center mb-4 border border-purple-500/30 group-hover:border-purple-400 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Precision Scheduling</h3>
              <p className="text-gray-400 text-sm flex-1 leading-relaxed">
                Set and forget. Organize your content library and align post delivery precisely when your network is most active.
              </p>
              <div className="mt-6 flex items-center gap-2 text-purple-400 font-semibold text-sm">
                View Planner <span className="group-hover:translate-x-2 transition-transform">➔</span>
              </div>
            </div>
          </Link>

          {/* Feature 3 */}
          <Link href="/dashboard/settings" className="glass-card overflow-hidden group flex flex-col hover:border-green-500/50 transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:-translate-y-2 duration-300 relative delay-150">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1020] via-transparent to-transparent z-10"></div>
            <div className="h-48 relative overflow-hidden bg-black flex items-center justify-center p-4">
               <img 
                 src="/images/publish_holo.png" 
                 alt="Direct Publishing Hologram" 
                 className="object-contain h-full w-full opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700 blur-[2px] group-hover:blur-0"
               />
               <div className="absolute inset-0 bg-green-500/10 group-hover:bg-transparent transition-colors mix-blend-overlay"></div>
            </div>
            <div className="p-6 relative z-20 flex-1 flex flex-col">
              <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center mb-4 border border-green-500/30 group-hover:border-green-400 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <span className="text-green-400 font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">Direct API Connect</h3>
              <p className="text-gray-400 text-sm flex-1 leading-relaxed">
                Send data straight to LinkedIn's core servers. Fully authenticated, zero-delay publishing with distinct privacy controls.
              </p>
              <div className="mt-6 flex items-center gap-2 text-green-400 font-semibold text-sm">
                Manage Link <span className="group-hover:translate-x-2 transition-transform">➔</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* FINAL CTA */}
      <div className="mt-12 text-center pb-8">
        <Link href="/dashboard/editor" className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-600 to-neon-blue hover:from-primary-500 hover:to-primary-400 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-[0_0_25px_rgba(0,212,255,0.4)] hover:shadow-[0_0_35px_rgba(0,212,255,0.6)] hover:-translate-y-1">
          <Plus size={24} />
          Create Your First Post Now
        </Link>
      </div>
    </div>
  )
}

import { createClient } from '@/utils/supabase/server'
import { CheckCircle2 } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const Linkedin = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
)

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'linkedin')
    .limit(1)

  const isLinkedInConnected = accounts && accounts.length > 0
  const linkedInAccount = isLinkedInConnected ? accounts[0] : null

  async function disconnectLinkedIn() {
    'use server'
    const supabaseClient = createClient()
    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) return

    await supabaseClient.from('social_accounts').delete().eq('user_id', user.id).eq('provider', 'linkedin')
    revalidatePath('/dashboard/settings')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 dark:text-gray-400">Manage your connected accounts and application preferences.</p>
      </header>

      <div className="glass-card p-8">
        <h2 className="text-lg font-semibold mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">Connections</h2>
        
        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            {linkedInAccount?.account_picture ? (
              <img src={linkedInAccount.account_picture} alt="Profile" className="w-12 h-12 rounded-full shadow-sm object-cover" />
            ) : (
              <div className={`p-3 rounded-lg ${isLinkedInConnected ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                <Linkedin size={24} />
              </div>
            )}
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                {linkedInAccount?.account_name || 'LinkedIn'}
                {isLinkedInConnected && <CheckCircle2 size={16} className="text-green-500" />}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isLinkedInConnected ? `Connected via OAuth` : 'Not connected'}
              </p>
            </div>
          </div>
          
          {isLinkedInConnected ? (
            <form action={disconnectLinkedIn}>
              <button type="submit" className="bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Disconnect
              </button>
            </form>
          ) : (
             <form action="/api/linkedin/auth" method="GET">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20">
                    Connect Account
                </button>
             </form>
          )}
        </div>
      </div>
    </div>
  )
}

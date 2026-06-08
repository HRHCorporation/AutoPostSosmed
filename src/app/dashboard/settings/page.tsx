import { createClient, SINGLE_USER_ID } from '@/lib/db'
import { CheckCircle2 } from 'lucide-react'
import { revalidatePath } from 'next/cache'

const InstagramIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

const Linkedin = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
)

const ThreadsIcon = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 192 192" fill="currentColor" className={className}>
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.368c-14.994 0-27.52 6.294-35.214 17.769l13.014 8.902c5.75-8.732 14.791-10.589 22.208-10.589h.25c8.582.054 15.068 2.555 19.285 7.432 3.058 3.527 5.105 8.405 6.103 14.574a100.427 100.427 0 0 0-12.86-.828c-18.405 0-30.876 9.765-31.665 24.863-.827 15.99 11.031 27.257 28.514 27.257 13.872 0 24.922-6.093 30.053-16.782 3.899-7.993 6.168-18.538 6.655-31.356zm-18.488 17.021c-.682 10.762-9.365 17.14-21.726 17.14-7.847 0-14.325-3.87-13.95-10.735.308-5.724 5.756-11.795 19.204-11.795 4.258 0 8.358.422 12.204 1.259-.612 1.543-1.057 2.795-1.057 2.795l5.325 1.336z"/>
  </svg>
)

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const db = createClient()

  const { data: accounts } = await db
    .from('social_accounts')
    .select('*')
    .eq('user_id', SINGLE_USER_ID)

  const linkedIn = (accounts as any[])?.find((a) => a.provider === 'linkedin') ?? null
  const threads = (accounts as any[])?.find((a) => a.provider === 'threads') ?? null
  const instagram = (accounts as any[])?.find((a) => a.provider === 'instagram') ?? null

  async function disconnectLinkedIn() {
    'use server'
    const client = createClient()
    await client.from('social_accounts').delete().eq('user_id', SINGLE_USER_ID).eq('provider', 'linkedin')
    revalidatePath('/dashboard/settings')
  }

  async function disconnectThreads() {
    'use server'
    const client = createClient()
    await client.from('social_accounts').delete().eq('user_id', SINGLE_USER_ID).eq('provider', 'threads')
    revalidatePath('/dashboard/settings')
  }

  async function disconnectInstagram() {
    'use server'
    const client = createClient()
    await client.from('social_accounts').delete().eq('user_id', SINGLE_USER_ID).eq('provider', 'instagram')
    revalidatePath('/dashboard/settings')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1 dark:text-gray-400">Manage your connected accounts and application preferences.</p>
      </header>

      <div className="glass-card p-8">
        <h2 className="text-lg font-semibold mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">Connections</h2>

        <div className="space-y-4">
          {/* LinkedIn */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              {linkedIn?.account_picture ? (
                <img src={linkedIn.account_picture} alt="Profile" className="w-12 h-12 rounded-full shadow-sm object-cover" />
              ) : (
                <div className={`p-3 rounded-lg ${linkedIn ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  <Linkedin size={24} />
                </div>
              )}
              <div>
                <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  {linkedIn?.account_name || 'LinkedIn'}
                  {linkedIn && <CheckCircle2 size={16} className="text-green-500" />}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {linkedIn ? 'Connected via OAuth' : 'Not connected'}
                </p>
              </div>
            </div>
            {linkedIn ? (
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

          {/* Threads */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              {threads?.account_picture ? (
                <img src={threads.account_picture} alt="Profile" className="w-12 h-12 rounded-full shadow-sm object-cover" />
              ) : (
                <div className={`p-3 rounded-lg ${threads ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  <ThreadsIcon size={24} />
                </div>
              )}
              <div>
                <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  {threads?.account_name ? `@${threads.account_name}` : 'Threads'}
                  {threads && <CheckCircle2 size={16} className="text-green-500" />}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {threads ? 'Connected via OAuth' : 'Not connected'}
                </p>
              </div>
            </div>
            {threads ? (
              <form action={disconnectThreads}>
                <button type="submit" className="bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Disconnect
                </button>
              </form>
            ) : (
              <form action="/api/threads/auth" method="GET">
                <button type="submit" className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg">
                  Connect Account
                </button>
              </form>
            )}
          </div>

          {/* Instagram */}
          <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-4">
              {instagram?.account_picture ? (
                <img src={instagram.account_picture} alt="Profile" className="w-12 h-12 rounded-full shadow-sm object-cover" />
              ) : (
                <div className={`p-3 rounded-lg ${instagram ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  <InstagramIcon size={24} />
                </div>
              )}
              <div>
                <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  {instagram?.account_name ? `@${instagram.account_name}` : 'Instagram'}
                  {instagram && <CheckCircle2 size={16} className="text-green-500" />}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {instagram ? 'Connected — comment automation enabled' : 'For comment-to-DM automation'}
                </p>
              </div>
            </div>
            {instagram ? (
              <form action={disconnectInstagram}>
                <button type="submit" className="bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Disconnect
                </button>
              </form>
            ) : (
              <form action="/api/instagram/auth" method="GET">
                <button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-pink-500/20">
                  Connect Account
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

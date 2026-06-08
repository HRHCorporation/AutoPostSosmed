import { getAutomations, createAutomation, toggleAutomation, deleteAutomation } from './actions'
import { createClient } from '@/lib/db'
import { SINGLE_USER_ID } from '@/lib/db'
import { Trash2, MessageCircle, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

const InstagramIcon = ({ size = 24, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

export default async function AutomationPage() {
  const automations = await getAutomations()

  const db = createClient()
  const { data: igAccount } = await db
    .from('social_accounts')
    .select('account_name, account_picture')
    .eq('user_id', SINGLE_USER_ID)
    .eq('provider', 'instagram')
    .single()

  const isConnected = !!igAccount

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Automation</h1>
        <p className="text-gray-500 mt-1 dark:text-gray-400">
          Auto-reply to Instagram comments via DM when a keyword is detected.
        </p>
      </header>

      {/* Instagram status banner */}
      {!isConnected && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300">
          <InstagramIcon size={20} />
          <span className="text-sm font-medium">
            Instagram not connected — go to{' '}
            <a href="/dashboard/settings" className="underline">Settings</a>{' '}
            to connect your account first.
          </span>
        </div>
      )}

      {/* Create new automation */}
      <div className="glass-card p-8">
        <h2 className="text-lg font-semibold mb-1">New Rule</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          When someone comments with the keyword, instantly send them a DM.
        </p>

        <form action={createAutomation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trigger Keyword
              </label>
              <input
                name="trigger_keyword"
                required
                placeholder='e.g. "info" or "mau"'
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                DM Message to Send
              </label>
              <input
                name="dm_message"
                required
                placeholder="Halo! Terima kasih sudah menghubungi..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-black/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-pink-500/20 transition-all"
          >
            <Zap size={16} />
            Create Automation
          </button>
        </form>
      </div>

      {/* Existing automations */}
      <div className="glass-card p-8">
        <h2 className="text-lg font-semibold mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">
          Active Rules
          <span className="ml-2 text-sm font-normal text-gray-400">({automations.length})</span>
        </h2>

        {automations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No automation rules yet. Create one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30">
                    <MessageCircle size={16} className="text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-gray-700 dark:text-gray-300">
                        keyword: {automation.trigger_keyword}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${automation.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                        {automation.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                      DM: {automation.dm_message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <form
                    action={async () => {
                      'use server'
                      await toggleAutomation(automation.id, !automation.is_active)
                    }}
                  >
                    <button
                      type="submit"
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        automation.is_active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {automation.is_active ? 'Pause' : 'Activate'}
                    </button>
                  </form>

                  <form
                    action={async () => {
                      'use server'
                      await deleteAutomation(automation.id)
                    }}
                  >
                    <button
                      type="submit"
                      className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook setup instructions */}
      <div className="glass-card p-8 border border-blue-200/50 dark:border-blue-900/30">
        <h2 className="text-lg font-semibold mb-4">Webhook Setup</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          To receive Instagram comment events, configure this webhook URL in your Meta App Dashboard:
        </p>
        <div className="font-mono text-sm bg-gray-100 dark:bg-gray-900 px-4 py-3 rounded-lg text-gray-800 dark:text-gray-200 break-all">
          {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/instagram
        </div>
        <ul className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-1.5 list-disc list-inside">
          <li>Subscription field: <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">comments</code></li>
          <li>Verify token: value from <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">WEBHOOK_VERIFY_TOKEN</code> in .env</li>
        </ul>
      </div>
    </div>
  )
}

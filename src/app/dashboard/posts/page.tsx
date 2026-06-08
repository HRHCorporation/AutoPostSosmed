import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import { deletePost } from './actions'

export const dynamic = 'force-dynamic'

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { status: string }
}) {
  const supabase = createClient()
  const status = searchParams.status || 'draft'

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto space-y-8 h-full">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight capitalize">{status} Posts</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-400">View and manage your {status} content.</p>
        </div>
        <Link href="/dashboard/editor" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary-500/20 flex items-center gap-2">
          <Plus size={18} />
          New Post
        </Link>
      </header>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-px">
        <Link 
          href="?status=draft" 
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${status === 'draft' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Drafts
        </Link>
        <Link 
          href="?status=scheduled" 
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${status === 'scheduled' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Scheduled
        </Link>
        <Link 
          href="?status=published" 
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${status === 'published' ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          Published
        </Link>
      </div>

      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post: any) => (
            <div key={post.id} className="glass-card p-6 flex flex-col md:flex-row gap-4 justify-between transition-all hover:bg-white/90 dark:hover:bg-[#1a1a24]/90 hover:shadow-2xl">
              <div className="flex-1 min-w-0">
                <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-2 text-gray-200" dangerouslySetInnerHTML={{ __html: post.content || '<em>Empty draft</em>' }} />
                <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-gray-400">
                  <span>Created {format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                  {post.scheduled_at && <span className="text-neon-blue drop-shadow-md">Scheduled for {format(new Date(post.scheduled_at), 'MMM d, yyyy HH:mm')}</span>}
                  {post.published_at && <span className="text-green-400 drop-shadow-md">Published on {format(new Date(post.published_at), 'MMM d, yyyy HH:mm')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/editor?id=${post.id}`} className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(10,102,194,0.4)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                  {status === 'published' ? 'View' : 'Edit'}
                </Link>
                <form action={async () => { 'use server'; await deletePost(post.id) }}>
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all"
                    title="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Plus size={24} />
            </div>
            <h3 className="font-semibold text-lg">No {status} posts found</h3>
            <p className="text-gray-500 mt-1 dark:text-gray-400 text-sm">Get started by creating a new post.</p>
            <Link href="/dashboard/editor" className="mt-6 bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Create New
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

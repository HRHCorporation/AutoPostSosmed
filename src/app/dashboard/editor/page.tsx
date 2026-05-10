'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Editor from '@/components/Editor'
import { Sparkles, Save, Send, CalendarIcon, Loader2, CheckCircle } from 'lucide-react'
import { savePostDraft, getPostDraft, publishPostNow } from './actions'

function EditorClient() {
  const searchParams = useSearchParams()
  const postId = searchParams.get('id')
  
  const [contentHtml, setContentHtml] = useState('')
  const [contentText, setContentText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!postId)
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  
  // Publishing States
  const [visibility, setVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>('PUBLIC')
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleHour, setScheduleHour] = useState('')

  useEffect(() => {
    async function loadDraft() {
      if (!postId) return
      setIsLoadingDraft(true)
      const data = await getPostDraft(postId)
      if (data.post) {
        setContentHtml(data.post.content || '')
        setContentText(data.post.content?.replace(/<[^>]+>/g, '') || '') // basic strip
        if (data.post.visibility) setVisibility(data.post.visibility)
        if (data.post.scheduled_at) {
          setIsScheduling(true)
          const d = new Date(data.post.scheduled_at)
          const isoString = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()
          setScheduleDate(isoString.split('T')[0])
          setScheduleHour(isoString.split('T')[1].slice(0, 5))
        }
      } else if (data.error) {
        setNotification({ type: 'error', message: data.error })
      }
      setIsLoadingDraft(false)
    }
    loadDraft()
  }, [postId])

  const handleAiAction = async (type: 'generate' | 'rewrite' | 'hashtags') => {
    if (!aiPrompt && type === 'generate') return
    if (!contentText && type !== 'generate') return

    setIsGenerating(true)
    setAiError(null)
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: type === 'generate' ? aiPrompt : contentText,
          type 
        }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to AI Service')
      }

      if (data.result) {
        if (type === 'generate' || type === 'rewrite') {
          setContentHtml(`<p>${data.result.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`)
        } else if (type === 'hashtags') {
          setContentHtml((prev) => prev + `<p>${data.result}</p>`)
        }
      }
    } catch (e: any) {
      setAiError(e.message)
      console.error(e)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!contentText.trim()) {
      setNotification({ type: 'error', message: 'Cannot save an empty draft' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    setIsSaving(true)
    setNotification(null)

    let finalScheduleTime = null
    if (isScheduling && scheduleDate && scheduleHour) {
      finalScheduleTime = `${scheduleDate}T${scheduleHour}:00`
    }

    const result = await savePostDraft(contentHtml, contentText, postId, visibility, finalScheduleTime)
    
    if (result.error) {
      setNotification({ type: 'error', message: result.error })
    } else {
      setNotification({ type: 'success', message: postId ? 'Draft updated successfully!' : 'Draft saved successfully!' })
      setTimeout(() => setNotification(null), 3000)
    }
    setIsSaving(false)
  }

  const handlePublishNow = async () => {
    setIsPublishing(true)
    setNotification(null)

    // Ensure we have a saved draft DB ID first, if not we pass null and let it create
    const result = await publishPostNow(contentHtml, contentText, visibility, postId)
    
    if (result.error) {
      setNotification({ type: 'error', message: result.error })
    } else {
      setNotification({ type: 'success', message: 'Hooray! Post published to LinkedIn successfully!' })
      // Optionally redirect to published posts page
    }
    
    setIsPublishing(false)
  }

  if (isLoadingDraft) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-80px)]">
      <header className="flex items-end justify-between mb-6 relative">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Post</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-400">Draft, optimize, and schedule your LinkedIn post.</p>
        </div>
        
        {/* Floating Notification */}
        {notification && (
          <div className={`absolute top-0 right-0 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-slide-up ${
            notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <Loader2 size={18} />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-6 h-full pb-10">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <Editor 
            content={contentHtml} 
            onChange={(html, text) => {
              setContentHtml(html)
              setContentText(text)
            }} 
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto pr-2 pb-6 custom-scrollbar">
          {/* AI Assistant */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4 font-semibold text-neon-blue drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">
              <Sparkles size={18} />
              AI Assistant
            </div>

            {aiError && (
              <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-lg relative overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                <p className="relative z-10 font-bold mb-1">Error:</p>
                <p className="relative z-10 text-xs">{aiError}</p>
                {aiError.toLowerCase().includes('key') && <p className="relative z-10 text-xs mt-2 font-medium">Please check your .env.local file to ensure GEMINI_API_KEY is configured correctly.</p>}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Generate from Prompt</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="What do you want to post about?"
                  className="w-full px-3 py-2 text-sm bg-black/40 border border-primary-900/50 text-gray-100 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue resize-none h-24 font-sans shadow-inner"
                />
                <button
                  onClick={() => handleAiAction('generate')}
                  disabled={isGenerating || !aiPrompt}
                  className="w-full mt-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-neon-blue text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(10,102,194,0.4)]"
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : 'Generate Post'}
                </button>
              </div>

              <div className="h-px bg-primary-900/40 w-full shadow-[0_0_5px_rgba(0,212,255,0.2)]" />

              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Optimize Current Content</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAiAction('rewrite')}
                    disabled={isGenerating || !contentText}
                    className="bg-primary-900/30 hover:bg-primary-800/50 border border-primary-500/30 text-primary-100 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 hover:shadow-[0_0_10px_rgba(10,102,194,0.3)]"
                  >
                    Rewrite
                  </button>
                  <button
                    onClick={() => handleAiAction('hashtags')}
                    disabled={isGenerating || !contentText}
                    className="bg-primary-900/30 hover:bg-primary-800/50 border border-primary-500/30 text-primary-100 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 hover:shadow-[0_0_10px_rgba(10,102,194,0.3)]"
                  >
                    Hashtags
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Publishing Controls */}
          <div className="glass-card p-5">
            <h3 className="font-bold mb-4 text-gray-100 drop-shadow-md border-b border-primary-900/50 pb-2">Publishing</h3>
            
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Who can see this?</label>
              <select 
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full bg-black/40 border border-primary-500/30 text-gray-100 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-neon-blue transition-colors outline-none"
              >
                <option value="PUBLIC">Anyone (Public)</option>
                <option value="CONNECTIONS">Connections Only</option>
              </select>
            </div>

            {isScheduling && (
              <div className="mb-4 animate-fade-in p-4 rounded-xl bg-black/20 border border-primary-900/30">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 block border-b border-primary-900/40 pb-2">Schedule Detail</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Date</label>
                    <input 
                      type="date" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full bg-black/50 border border-primary-500/30 text-gray-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neon-blue transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Time</label>
                    <input 
                      type="time" 
                      value={scheduleHour}
                      onChange={(e) => setScheduleHour(e.target.value)}
                      className="w-full bg-black/50 border border-primary-500/30 text-gray-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neon-blue transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="w-full flex items-center justify-between bg-black/40 hover:bg-black/60 border border-primary-500/30 text-gray-100 px-4 py-3 rounded-xl transition-all disabled:opacity-50 hover:border-primary-400 group"
              >
                <span className="text-sm font-bold flex items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin text-neon-blue" /> : <Save size={18} className="text-gray-400 group-hover:text-neon-blue transition-colors" />}
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </span>
              </button>
              
              {!isScheduling && (
                <button 
                  onClick={handlePublishNow} 
                  disabled={isPublishing}
                  className="w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-primary-600 hover:from-primary-500 hover:to-neon-blue text-white border border-transparent px-4 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(10,102,194,0.4)] disabled:opacity-50"
                >
                  <span className="text-sm font-bold flex items-center gap-2">
                    {isPublishing ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} />}
                    {isPublishing ? 'Publishing...' : 'Publish Now'}
                  </span>
                </button>
              )}

              <button 
                onClick={() => setIsScheduling(!isScheduling)} 
                className={`w-full flex items-center justify-between border px-4 py-3 rounded-xl transition-all ${isScheduling ? 'bg-primary-900/60 border-neon-blue text-white shadow-[0_0_15px_rgba(0,212,255,0.3)]' : 'bg-primary-900/40 hover:bg-primary-800/60 border-primary-500/20 text-primary-200 hover:shadow-[0_0_15px_rgba(10,102,194,0.2)]'}`}
              >
                <span className="text-sm font-bold flex items-center gap-2">
                  <CalendarIcon size={18} className={isScheduling ? 'text-neon-blue' : 'opacity-70'} />
                  {isScheduling ? 'Cancel Schedule' : 'Schedule'}
                </span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-10"><Loader2 className="animate-spin text-primary-500" /></div>}>
      <EditorClient />
    </Suspense>
  )
}

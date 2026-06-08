'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Editor from '@/components/Editor'
import { Sparkles, Save, Send, CalendarIcon, Loader2, CheckCircle, AlertTriangle, ImageIcon, Download, RefreshCw } from 'lucide-react'
import { savePostDraft, getPostDraft, publishPostNow, getConnectedPlatforms } from './actions'

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
)

const ThreadsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 192 192" fill="currentColor">
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.368c-14.994 0-27.52 6.294-35.214 17.769l13.014 8.902c5.75-8.732 14.791-10.589 22.208-10.589h.25c8.582.054 15.068 2.555 19.285 7.432 3.058 3.527 5.105 8.405 6.103 14.574a100.427 100.427 0 0 0-12.86-.828c-18.405 0-30.876 9.765-31.665 24.863-.827 15.99 11.031 27.257 28.514 27.257 13.872 0 24.922-6.093 30.053-16.782 3.899-7.993 6.168-18.538 6.655-31.356zm-18.488 17.021c-.682 10.762-9.365 17.14-21.726 17.14-7.847 0-14.325-3.87-13.95-10.735.308-5.724 5.756-11.795 19.204-11.795 4.258 0 8.358.422 12.204 1.259-.612 1.543-1.057 2.795-1.057 2.795l5.325 1.336z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)

function EditorClient() {
  const searchParams = useSearchParams()
  const postId = searchParams.get('id')

  const [contentHtml, setContentHtml] = useState('')
  const [contentText, setContentText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!postId)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)

  const [visibility, setVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>('PUBLIC')
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleHour, setScheduleHour] = useState('')

  // AI model selector
  const [aiModel, setAiModel] = useState<'gemini' | 'deepseek'>('gemini')

  // Platform selection
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  // Image generator
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [instagramImageUrl, setInstagramImageUrl] = useState('')

  useEffect(() => {
    getConnectedPlatforms().then(platforms => {
      setConnectedPlatforms(platforms)
      setSelectedPlatforms(platforms) // default: all connected
    })
  }, [])

  useEffect(() => {
    async function loadDraft() {
      if (!postId) return
      setIsLoadingDraft(true)
      const data = await getPostDraft(postId)
      if (data.post) {
        setContentHtml(data.post.content || '')
        setContentText(data.post.content?.replace(/<[^>]+>/g, '') || '')
        if (data.post.visibility) setVisibility(data.post.visibility)
        if (data.post.platforms) setSelectedPlatforms(data.post.platforms.split(','))
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

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    if (type !== 'error') setTimeout(() => setNotification(null), 4000)
  }

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    )
  }

  const handleAiAction = async (type: 'generate' | 'rewrite' | 'hashtags') => {
    if (!aiPrompt && type === 'generate') return
    if (!contentText && type !== 'generate') return
    setIsGenerating(true)
    setAiError(null)
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: type === 'generate' ? aiPrompt : contentText, type, model: aiModel }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to connect to AI Service')
      if (data.result) {
        if (type === 'generate' || type === 'rewrite') {
          setContentHtml(`<p>${data.result.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`)
        } else {
          setContentHtml(prev => prev + `<p>${data.result}</p>`)
        }
      }
    } catch (e: any) {
      setAiError(e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) return
    setImageError(null)
    setIsGeneratingImage(true)
    setGeneratedImageUrl('')
    const seed = Math.floor(Math.random() * 99999)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=576&seed=${seed}&nologo=true&model=flux`
    setGeneratedImageUrl(url)
  }

  const handleRegenerateImage = () => {
    if (!imagePrompt.trim()) return
    setIsGeneratingImage(true)
    setGeneratedImageUrl('')
    const seed = Math.floor(Math.random() * 99999)
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=576&seed=${seed}&nologo=true&model=flux`
    setGeneratedImageUrl(url)
  }

  const handleSaveDraft = async () => {
    if (!contentText.trim()) {
      showNotification('error', 'Cannot save an empty draft')
      return
    }
    setIsSaving(true)
    setNotification(null)
    const finalScheduleTime = isScheduling && scheduleDate && scheduleHour
      ? `${scheduleDate}T${scheduleHour}:00`
      : null
    const result = await savePostDraft(contentHtml, contentText, postId, visibility, finalScheduleTime, selectedPlatforms, instagramImageUrl || null)
    if (result.error) {
      showNotification('error', result.error)
    } else {
      showNotification('success', postId ? 'Draft updated successfully!' : 'Draft saved successfully!')
    }
    setIsSaving(false)
  }

  const handlePublishNow = async () => {
    if (selectedPlatforms.length === 0) {
      showNotification('error', 'Select at least one platform to publish to')
      return
    }
    setIsPublishing(true)
    setNotification(null)
    const result = await publishPostNow(contentHtml, contentText, visibility, selectedPlatforms, postId, instagramImageUrl || null)
    if (result.error) {
      showNotification('error', result.error)
    } else if ('warning' in result && result.warning) {
      showNotification('warning', result.warning)
    } else {
      showNotification('success', `Published to ${selectedPlatforms.join(' & ')} successfully!`)
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

  const notifColors = {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-80px)]">
      <header className="flex items-end justify-between mb-6 relative">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Post</h1>
          <p className="text-gray-500 mt-1 dark:text-gray-400">Draft, optimize, and schedule your post.</p>
        </div>
        {notification && (
          <div className={`absolute top-0 right-0 px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg animate-slide-up border ${notifColors[notification.type]}`}>
            {notification.type === 'success' && <CheckCircle size={18} />}
            {notification.type === 'warning' && <AlertTriangle size={18} />}
            {notification.type === 'error' && <Loader2 size={18} />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        )}
      </header>

      <div className="flex flex-col lg:flex-row gap-6 h-full pb-10">
        <div className="flex-1 flex flex-col min-h-0">
          <Editor
            content={contentHtml}
            onChange={(html, text) => { setContentHtml(html); setContentText(text) }}
          />
        </div>

        <div className="w-full lg:w-96 flex flex-col gap-6 overflow-y-auto pr-2 pb-6 custom-scrollbar">
          {/* AI Assistant */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4 font-semibold text-neon-blue drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]">
              <Sparkles size={18} />
              AI Assistant
            </div>
            {aiError && (
              <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-lg">
                <p className="font-bold mb-1">Error:</p>
                <p className="text-xs">{aiError}</p>
              </div>
            )}
            <div className="space-y-4">
              {/* Model Selector */}
              <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-primary-900/40">
                <button
                  onClick={() => setAiModel('gemini')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${aiModel === 'gemini' ? 'bg-gradient-to-r from-primary-600 to-neon-blue text-white shadow-[0_0_10px_rgba(0,212,255,0.3)]' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <span>✦</span> Gemini
                </button>
                <button
                  onClick={() => setAiModel('deepseek')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${aiModel === 'deepseek' ? 'bg-gradient-to-r from-blue-700 to-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <span>◈</span> DeepSeek
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Generate from Prompt</label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="What do you want to post about?"
                  className="w-full px-3 py-2 text-sm bg-black/40 border border-primary-900/50 text-gray-100 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-neon-blue resize-none h-24 font-sans shadow-inner"
                />
                <button
                  onClick={() => handleAiAction('generate')}
                  disabled={isGenerating || !aiPrompt}
                  className="w-full mt-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-neon-blue text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : 'Generate Post'}
                </button>
              </div>
              <div className="h-px bg-primary-900/40 w-full" />
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Optimize Current Content</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAiAction('rewrite')} disabled={isGenerating || !contentText} className="bg-primary-900/30 hover:bg-primary-800/50 border border-primary-500/30 text-primary-100 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50">Rewrite</button>
                  <button onClick={() => handleAiAction('hashtags')} disabled={isGenerating || !contentText} className="bg-primary-900/30 hover:bg-primary-800/50 border border-primary-500/30 text-primary-100 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50">Hashtags</button>
                </div>
              </div>
            </div>
          </div>

          {/* Image Generator */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4 font-semibold text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
              <ImageIcon size={18} />
              AI Image Generator
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Describe your image</label>
                <textarea
                  value={imagePrompt}
                  onChange={e => setImagePrompt(e.target.value)}
                  placeholder="e.g. professional workspace with laptop and coffee, minimalist style"
                  className="w-full px-3 py-2 text-sm bg-black/40 border border-purple-900/50 text-gray-100 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20 font-sans shadow-inner"
                />
                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  className="w-full mt-2 bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 text-white py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeneratingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                </button>
              </div>

              {imageError && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">{imageError}</p>
              )}

              {generatedImageUrl && (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden border border-purple-500/30 bg-black/40">
                    <img
                      src={generatedImageUrl}
                      alt="Generated"
                      className="w-full object-cover"
                      onLoad={() => setIsGeneratingImage(false)}
                      onError={() => { setIsGeneratingImage(false); setImageError('Failed to generate image. Try a different prompt.') }}
                    />
                    {isGeneratingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 size={28} className="animate-spin text-purple-400" />
                          <span className="text-xs text-gray-300">Generating image...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isGeneratingImage && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={handleRegenerateImage}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 text-purple-300 py-2 rounded-xl text-xs font-medium transition-all"
                        >
                          <RefreshCw size={13} /> Regenerate
                        </button>
                        <a
                          href={generatedImageUrl}
                          download="generated-image.jpg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-500/30 text-purple-300 py-2 rounded-xl text-xs font-medium transition-all"
                        >
                          <Download size={13} /> Download
                        </a>
                      </div>
                      {connectedPlatforms.includes('instagram') && (
                        <button
                          onClick={() => setInstagramImageUrl(generatedImageUrl)}
                          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all border ${instagramImageUrl === generatedImageUrl ? 'bg-pink-600/30 border-pink-400/50 text-pink-200' : 'bg-pink-900/20 hover:bg-pink-900/40 border-pink-500/30 text-pink-300'}`}
                        >
                          <InstagramIcon />
                          {instagramImageUrl === generatedImageUrl ? '✓ Set for Instagram' : 'Use for Instagram'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Publishing Controls */}
          <div className="glass-card p-5">
            <h3 className="font-bold mb-4 text-gray-100 border-b border-primary-900/50 pb-2">Publishing</h3>

            {/* Platform selector */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Post to</label>
              {connectedPlatforms.length === 0 ? (
                <p className="text-xs text-yellow-400/80 bg-yellow-900/20 border border-yellow-500/20 rounded-lg px-3 py-2">
                  No accounts connected. <a href="/dashboard/settings" className="underline">Connect in Settings →</a>
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {connectedPlatforms.includes('linkedin') && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes('linkedin')}
                        onChange={() => togglePlatform('linkedin')}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">
                        <LinkedInIcon /> LinkedIn
                      </span>
                    </label>
                  )}
                  {connectedPlatforms.includes('threads') && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes('threads')}
                        onChange={() => togglePlatform('threads')}
                        className="w-4 h-4 rounded accent-gray-300"
                      />
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                        <ThreadsIcon /> Threads
                      </span>
                    </label>
                  )}
                  {connectedPlatforms.includes('instagram') && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes('instagram')}
                        onChange={() => togglePlatform('instagram')}
                        className="w-4 h-4 rounded accent-pink-500"
                      />
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-200 group-hover:text-pink-400 transition-colors">
                        <InstagramIcon /> Instagram
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Instagram image URL (shown when Instagram is selected) */}
            {selectedPlatforms.includes('instagram') && (
              <div className="mb-4 p-3 rounded-xl bg-pink-900/10 border border-pink-500/20">
                <label className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2 block">
                  Instagram Image URL <span className="text-pink-500">*</span>
                </label>
                <input
                  type="url"
                  value={instagramImageUrl}
                  onChange={e => setInstagramImageUrl(e.target.value)}
                  placeholder="https://... (Instagram requires an image)"
                  className="w-full px-3 py-2 text-sm bg-black/40 border border-pink-900/50 text-gray-100 placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="text-xs text-gray-500 mt-1.5">Generate an image above then click &quot;Use for Instagram&quot;, or paste a public image URL.</p>
              </div>
            )}

            {/* Visibility */}
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">Who can see this?</label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as any)}
                className="w-full bg-black/40 border border-primary-500/30 text-gray-100 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-neon-blue transition-colors outline-none"
              >
                <option value="PUBLIC">Anyone (Public)</option>
                <option value="CONNECTIONS">Connections Only</option>
              </select>
            </div>

            {isScheduling && (
              <div className="mb-4 p-4 rounded-xl bg-black/20 border border-primary-900/30">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 block border-b border-primary-900/40 pb-2">Schedule Detail</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Date</label>
                    <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full bg-black/50 border border-primary-500/30 text-gray-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neon-blue [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Time</label>
                    <input type="time" value={scheduleHour} onChange={e => setScheduleHour(e.target.value)} className="w-full bg-black/50 border border-primary-500/30 text-gray-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-neon-blue [color-scheme:dark]" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button onClick={handleSaveDraft} disabled={isSaving} className="w-full flex items-center justify-between bg-black/40 hover:bg-black/60 border border-primary-500/30 text-gray-100 px-4 py-3 rounded-xl transition-all disabled:opacity-50 hover:border-primary-400 group">
                <span className="text-sm font-bold flex items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin text-neon-blue" /> : <Save size={18} className="text-gray-400 group-hover:text-neon-blue transition-colors" />}
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </span>
              </button>

              {!isScheduling && (
                <button onClick={handlePublishNow} disabled={isPublishing || selectedPlatforms.length === 0} className="w-full flex items-center justify-between bg-gradient-to-r from-blue-600 to-primary-600 hover:from-primary-500 hover:to-neon-blue text-white border border-transparent px-4 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(10,102,194,0.4)] disabled:opacity-50">
                  <span className="text-sm font-bold flex items-center gap-2">
                    {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {isPublishing ? 'Publishing...' : 'Publish Now'}
                  </span>
                </button>
              )}

              <button onClick={() => setIsScheduling(!isScheduling)} className={`w-full flex items-center justify-between border px-4 py-3 rounded-xl transition-all ${isScheduling ? 'bg-primary-900/60 border-neon-blue text-white shadow-[0_0_15px_rgba(0,212,255,0.3)]' : 'bg-primary-900/40 hover:bg-primary-800/60 border-primary-500/20 text-primary-200'}`}>
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

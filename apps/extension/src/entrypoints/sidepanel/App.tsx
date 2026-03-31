import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/entrypoints/background/helpers/supabaseAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LANGUAGE_NAMES } from '@/entrypoints/content/helpers/detectLanguage'
import { History, Bookmark, Settings, Check, ExternalLink } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

type TranslationHistoryItem = {
  concept: string
  translation: string
  sourceLanguage: string
  targetLanguage: string
  url: string
  timestamp: number
}

type SavedConcept = {
  id: number
  concept: string
  translation: string
  sourceLanguage: string
  targetLanguage: string
  createdAt: string
}

type Tab = 'history' | 'saved' | 'settings'

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('history')
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
    ) => {
      const hasAuthChange = Object.keys(changes).some((k) => k.includes('auth'))
      if (!hasAuthChange) return
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
      })
    }
    chrome.storage.local.onChanged.addListener(handleStorageChange)

    return () => {
      subscription.unsubscribe()
      chrome.storage.local.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'history', label: 'History', icon: <History className="h-3.5 w-3.5" /> },
    { id: 'saved', label: 'Saved', icon: <Bookmark className="h-3.5 w-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-3.5 w-3.5" /> },
  ]

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'saved' && <SavedTab session={session} />}
        {activeTab === 'settings' && <SettingsTab session={session} />}
      </div>
    </div>
  )
}

// --- History Tab ---

function HistoryTab() {
  const [history, setHistory] = useState<TranslationHistoryItem[]>([])

  const loadHistory = useCallback(() => {
    chrome.storage.session.get('translationHistory', (result) => {
      setHistory((result.translationHistory as TranslationHistoryItem[]) || [])
    })
  }, [])

  useEffect(() => {
    loadHistory()

    const handleChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName === 'session' && changes.translationHistory) {
        setHistory(
          (changes.translationHistory.newValue as TranslationHistoryItem[]) || [],
        )
      }
    }

    chrome.storage.onChanged.addListener(handleChange)
    return () => chrome.storage.onChanged.removeListener(handleChange)
  }, [loadHistory])

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <History className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No translations yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Select text on any page and translate it to see your history here.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {history.map((item, index) => (
        <TranslationCard key={`${item.timestamp}-${index}`} item={item} />
      ))}
    </div>
  )
}

function TranslationCard({ item }: { item: TranslationHistoryItem }) {
  const timeAgo = getTimeAgo(item.timestamp)
  const hostname = getHostname(item.url)

  return (
    <div className="px-3 py-2.5 hover:bg-secondary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-snug break-words">
          {item.concept}
        </p>
        <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
          {item.sourceLanguage}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-0.5 break-words">
        {item.translation}
      </p>
      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground/70">
        <span>{timeAgo}</span>
        {hostname && (
          <>
            <span>·</span>
            <span className="truncate max-w-[150px]">{hostname}</span>
          </>
        )}
      </div>
    </div>
  )
}

// --- Saved Tab ---

function SavedTab({ session }: { session: Session | null }) {
  const [savedConcepts, setSavedConcepts] = useState<SavedConcept[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return

    setIsLoading(true)
    setError(null)

    chrome.runtime.sendMessage(
      { action: 'fetchSavedConcepts', limit: 10 },
      (response) => {
        setIsLoading(false)
        if (response?.success) {
          setSavedConcepts(response.concepts || [])
        } else {
          setError(response?.error || 'Failed to load saved concepts')
        }
      },
    )
  }, [session])

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <Bookmark className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Sign in to see saved concepts</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Open the extension popup to sign in.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading saved concepts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            setIsLoading(true)
            setError(null)
            chrome.runtime.sendMessage(
              { action: 'fetchSavedConcepts', limit: 10 },
              (response) => {
                setIsLoading(false)
                if (response?.success) {
                  setSavedConcepts(response.concepts || [])
                } else {
                  setError(response?.error || 'Failed to load saved concepts')
                }
              },
            )
          }}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (savedConcepts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <Bookmark className="h-8 w-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No saved concepts yet</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Save translations to build your vocabulary.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {savedConcepts.map((concept) => (
        <SavedConceptCard key={concept.id} concept={concept} />
      ))}
    </div>
  )
}

function SavedConceptCard({ concept }: { concept: SavedConcept }) {
  return (
    <div className="px-3 py-2.5 hover:bg-secondary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground leading-snug break-words">
          {concept.concept}
        </p>
        <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
          {concept.sourceLanguage}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-0.5 break-words">
        {concept.translation}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-muted-foreground/70">
          {new Date(concept.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={() => {
            chrome.tabs.create({ url: `${DASHBOARD_URL}/vocabulary` })
          }}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View
        </button>
      </div>
    </div>
  )
}

// --- Settings Tab ---

function SettingsTab({ session }: { session: Session | null }) {
  const [targetLanguage, setTargetLanguage] = useState('English')
  const [personalContext, setPersonalContext] = useState('')
  const [isSaved, setIsSaved] = useState(false)

  const languages: Array<{ code: string; name: string }> = []
  for (const lang in LANGUAGE_NAMES) {
    languages.push({ code: lang, name: LANGUAGE_NAMES[lang] })
  }

  useEffect(() => {
    chrome.storage.sync.get(['targetLanguage', 'personalContext'], (result) => {
      if (result.targetLanguage)
        setTargetLanguage(result.targetLanguage as string)
      if (result.personalContext)
        setPersonalContext(result.personalContext as string)
    })
  }, [])

  useEffect(() => {
    if (!session) return
    chrome.runtime.sendMessage(
      { action: 'fetchUserSettings' },
      (response: {
        success: boolean
        settings?: {
          targetLanguage: string | null
          personalContext: string | null
        }
        error?: string
      }) => {
        if (response?.success && response.settings) {
          const { targetLanguage: apiTargetLang, personalContext: apiContext } =
            response.settings
          if (apiTargetLang) {
            setTargetLanguage(apiTargetLang)
            chrome.storage.sync.set({ targetLanguage: apiTargetLang })
          }
          if (apiContext) {
            setPersonalContext(apiContext)
            chrome.storage.sync.set({ personalContext: apiContext })
          }
        }
      },
    )
  }, [session])

  function handleSave() {
    chrome.storage.sync.set(
      { targetLanguage, personalContext },
      () => {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
      },
    )

    if (session) {
      chrome.runtime.sendMessage({
        action: 'saveUserSettings',
        settings: { targetLanguage, personalContext },
      })
    }
  }

  const maxChars = 150
  const remainingChars = maxChars - personalContext.length

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="language"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Target Language
        </Label>
        <select
          id="language"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          className="w-full h-9 rounded-lg bg-secondary px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.name}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="context"
          className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Personal Context
          <span className="text-muted-foreground font-normal text-xs ml-1 normal-case">
            (optional)
          </span>
        </Label>
        <Textarea
          id="context"
          value={personalContext}
          onChange={(e) => {
            if (e.target.value.length <= maxChars) {
              setPersonalContext(e.target.value)
            }
          }}
          placeholder="e.g., I'm a software engineer learning Spanish..."
          className="resize-none"
          rows={3}
          maxLength={maxChars}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Help improve translation relevance
          </p>
          <Badge
            variant={remainingChars < 20 ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {remainingChars} left
          </Badge>
        </div>
      </div>

      <Button onClick={handleSave} variant="default" className="w-full">
        {isSaved ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Saved!
          </>
        ) : (
          'Save Settings'
        )}
      </Button>

      {!session && (
        <p className="text-xs text-center text-muted-foreground">
          Sign in via the extension popup to sync settings across devices.
        </p>
      )}
    </div>
  )
}

// --- Helpers ---

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getHostname(url: string): string {
  if (!url) return ''
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

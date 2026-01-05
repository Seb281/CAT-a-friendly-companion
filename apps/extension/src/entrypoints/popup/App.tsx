import { useState, useEffect } from "react"
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/chrome-extension"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge.tsx"
import { Languages, Check } from "lucide-react"
import { LANGUAGE_NAMES } from "@/entrypoints/content/helpers/detectLanguage"
import { Separator } from "@/components/ui/separator"

export default function App() {
  const [targetLanguage, setTargetLanguage] = useState("English")
  const [personalContext, setPersonalContext] = useState("")
  const [isSaved, setIsSaved] = useState(false)

  const languages: Array<{ code: string; name: string }> = []

  for (const lang in LANGUAGE_NAMES) {
    languages.push({ code: lang, name: LANGUAGE_NAMES[lang] })
  }

  useEffect(() => {
    chrome.storage.sync.get(["targetLanguage", "personalContext"], (result) => {
      if (result.targetLanguage) setTargetLanguage(result.targetLanguage as string)
      if (result.personalContext) setPersonalContext(result.personalContext as string)
    })
  }, [])

  function handleSave() {
    chrome.storage.sync.set(
      {
        targetLanguage,
        personalContext,
      },
      () => {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 2000)
      }
    )
  }

  const maxChars = 150
  const remainingChars = maxChars - personalContext.length

  return (
    <div className="w-[420px]">
      <Card className="rounded-none border-0 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Context Translator</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Smart translations with context
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="language"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Target Language
            </Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {languages.map((lang) => (
                  <SelectItem
                    key={lang.code}
                    value={lang.name}
                    className="text-black"
                  >
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                variant={remainingChars < 20 ? "destructive" : "secondary"}
                className="text-xs"
              >
                {remainingChars} left
              </Badge>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            {isSaved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              "Save Settings"
            )}
          </Button>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              How to Use
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center p-0"
                >
                  1
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Select any text on a webpage
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center p-0"
                >
                  2
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Press{" "}
                  <kbd className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                    Ctrl+Shift+T
                  </kbd>
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Badge
                  variant="outline"
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center p-0"
                >
                  3
                </Badge>
                <p className="text-sm text-muted-foreground">
                  View context-aware translation
                </p>
              </div>
            </div>
          </div>
          <Separator />

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Signed in</span>
              <UserButton />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                chrome.tabs.create({ url: "http://localhost:5174" })
              }
            >
              Open Dashboard
            </Button>
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  )
}

import React from "react"
import { createRoot } from "react-dom/client"
import { ClerkProvider } from "@clerk/chrome-extension"
import App from "./App"
import "./popup.css"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable")
}

const root = createRoot(document.getElementById("root")!)
root.render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
)

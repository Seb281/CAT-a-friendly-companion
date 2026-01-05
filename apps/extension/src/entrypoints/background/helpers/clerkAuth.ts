import { createClerkClient } from "@clerk/chrome-extension/background"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export async function getClerkToken(): Promise<string | null> {
  if (!PUBLISHABLE_KEY) {
    console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY")
    return null
  }

  try {
    const clerk = await createClerkClient({
      publishableKey: PUBLISHABLE_KEY,
    })

    if (!clerk.session) {
      return null
    }

    const token = await clerk.session.getToken()
    return token
  } catch (error) {
    console.error("Failed to get Clerk token:", error)
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  if (!PUBLISHABLE_KEY) {
    return false
  }

  try {
    const clerk = await createClerkClient({
      publishableKey: PUBLISHABLE_KEY,
    })
    return !!clerk.session
  } catch (error) {
    console.error("Failed to check auth status:", error)
    return false
  }
}

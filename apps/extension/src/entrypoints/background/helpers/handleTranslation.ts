const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000"

export default async function handleTranslation(
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
  personalContext: string
): Promise<object> {
  return fetch(`${BASE_URL}/translation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      targetLanguage: targetLanguage || "English",
      sourceLanguage: sourceLanguage,
      personalContext: personalContext || "",
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Translation failed with status ${response.status}`)
      }
      return response.json()
    })
    .catch((error) => {
      console.error("Translation error:", error)
      throw new Error(
        error instanceof Error ? error.message : "Failed to translate text"
      )
    })
}

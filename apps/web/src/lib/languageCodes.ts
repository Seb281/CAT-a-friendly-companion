/**
 * Map of common language names to BCP-47 codes for Web Speech API.
 * Used to set the `lang` property on SpeechSynthesisUtterance so the
 * browser picks the correct voice / pronunciation engine.
 */
export const languageToBCP47: Record<string, string> = {
  Arabic: "ar",
  Bengali: "bn",
  Chinese: "zh",
  Czech: "cs",
  Danish: "da",
  Dutch: "nl",
  English: "en",
  Finnish: "fi",
  French: "fr",
  German: "de",
  Greek: "el",
  Hebrew: "he",
  Hindi: "hi",
  Hungarian: "hu",
  Indonesian: "id",
  Italian: "it",
  Japanese: "ja",
  Korean: "ko",
  Norwegian: "no",
  Polish: "pl",
  Portuguese: "pt",
  Romanian: "ro",
  Russian: "ru",
  Spanish: "es",
  Swedish: "sv",
  Thai: "th",
  Turkish: "tr",
  Ukrainian: "uk",
  Vietnamese: "vi",
};

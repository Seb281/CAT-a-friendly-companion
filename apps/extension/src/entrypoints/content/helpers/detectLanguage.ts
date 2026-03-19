import { franc } from "franc"

export default function detectPageLanguage() {
  const langCode = document.documentElement.lang
  if (langCode) {
    return getLanguageName(langCode)
  }

  const metaLang: HTMLMetaElement | null = document.querySelector(
    'meta[http-equiv="content-language"]'
  )
  if (metaLang?.content) {
    return getLanguageName(metaLang.content)
  }

  const ogLang: HTMLMetaElement | null = document.querySelector(
    'meta[property="og:locale"]'
  )
  if (ogLang?.content) {
    return getLanguageName(ogLang.content)
  }

  try {
    const bodyText = document.body.innerText || document.body.textContent

    if (bodyText && bodyText.length > 50) {
      const detectedCode = franc(bodyText)

      if (detectedCode !== "und") {
        return getLanguageName(detectedCode)
      }
    }
  } catch {
    // ignore
  }

  return "UNKNOWN"
}

function getLanguageName(code: string) {
  const normalized = normalizeLanguageCode(code)
  if (!normalized) return "UNKNOWN"

  const languageName = LANGUAGE_NAMES[normalized.base] || "UNKNOWN"

  if (normalized.region) return `${languageName} (${normalized.region})`
  else return languageName
}

type LangCode = { base: string; region: string | null }

function normalizeLanguageCode(code: string | null): LangCode | null {
  if (!code) return null

  const codeParts = code.split("-")
  const langCode: LangCode = {
    base: codeParts[0].toLowerCase(),
    region: codeParts[1]?.toUpperCase() ?? null,
  }

  if (langCode.base.length === 2) {
    return langCode
  }

  if (FRANC_TO_ISO[langCode.base]) {
    return { base: FRANC_TO_ISO[langCode.base], region: langCode.region }
  } else {
    return null
  }
}

// ISO 639-1 to human-readable language names
export const LANGUAGE_NAMES: { [key: string]: string } = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  pl: "Polish",
  tr: "Turkish",
  el: "Greek",
  he: "Hebrew",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  cs: "Czech",
  sk: "Slovak",
  hu: "Hungarian",
  ro: "Romanian",
  bg: "Bulgarian",
  uk: "Ukrainian",
  hr: "Croatian",
  sr: "Serbian",
  sl: "Slovenian",
  lt: "Lithuanian",
  lv: "Latvian",
  et: "Estonian",
  fa: "Persian",
  ur: "Urdu",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  si: "Sinhala",
  km: "Khmer",
  lo: "Lao",
  my: "Burmese",
  ka: "Georgian",
  am: "Amharic",
  ne: "Nepali",
  sw: "Swahili",
  af: "Afrikaans",
  sq: "Albanian",
  az: "Azerbaijani",
  eu: "Basque",
  be: "Belarusian",
  bs: "Bosnian",
  ca: "Catalan",
  cy: "Welsh",
  eo: "Esperanto",
  gl: "Galician",
  is: "Icelandic",
  ga: "Irish",
  mk: "Macedonian",
  mt: "Maltese",
  mn: "Mongolian",
  ps: "Pashto",
  pa: "Punjabi",
  sd: "Sindhi",
  so: "Somali",
  tl: "Tagalog",
  uz: "Uzbek",
  yi: "Yiddish",
  zu: "Zulu",
}

// franc uses ISO 639-3 codes, map common ones to ISO 639-1
const FRANC_TO_ISO: { [key: string]: string } = {
  eng: "en",
  spa: "es",
  fra: "fr",
  deu: "de",
  ita: "it",
  por: "pt",
  rus: "ru",
  jpn: "ja",
  cmn: "zh", // Mandarin Chinese
  kor: "ko",
  ara: "ar",
  hin: "hi",
  nld: "nl",
  swe: "sv",
  nor: "no",
  dan: "da",
  fin: "fi",
  pol: "pl",
  tur: "tr",
  ell: "el",
  heb: "he",
  tha: "th",
  vie: "vi",
  ind: "id",
  msa: "ms",
  ces: "cs",
  slk: "sk",
  hun: "hu",
  ron: "ro",
  bul: "bg",
  ukr: "uk",
  hrv: "hr",
  srp: "sr",
  slv: "sl",
  lit: "lt",
  lav: "lv",
  est: "et",
  fas: "fa",
  urd: "ur",
  ben: "bn",
  tam: "ta",
  tel: "te",
  mar: "mr",
  guj: "gu",
  kan: "kn",
  mal: "ml",
  sin: "si",
  khm: "km",
  lao: "lo",
  mya: "my",
  kat: "ka",
  amh: "am",
  nep: "ne",
  swa: "sw",
  afr: "af",
  sqi: "sq",
  aze: "az",
  eus: "eu",
  bel: "be",
  bos: "bs",
  cat: "ca",
  cym: "cy",
  epo: "eo",
  glg: "gl",
  isl: "is",
  gle: "ga",
  mkd: "mk",
  mlt: "mt",
  mon: "mn",
  pus: "ps",
  pan: "pa",
  snd: "sd",
  som: "so",
  tgl: "tl",
  uzb: "uz",
  yid: "yi",
  zul: "zu",
}

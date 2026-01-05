export function extractJSON(apiResponse: string): object {
  // Remove markdown code blocks if present
  const cleanedResponse = apiResponse.replace(/```json\n?|\n?```/g, '').trim()
  
  const match = cleanedResponse.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch (e) {
      console.error('Failed to parse JSON:', match[0], e)
      throw new Error('Invalid JSON format in response')
    }
  }
  throw new Error('No valid JSON found in response')
}

export function getSelectionLength(text: string): number {
  const match = text.match(/\[([^\]]+)\]/)
  const selection: string = match?.[1] ?? ''

  return selection.split(' ').length
}

export function promptBuilder(
  text: string,
  targetLanguage: string,
  sourceLanguage: string,
  personalContext: string
): string {
  let unknownSourceLang: boolean = false
  if (!sourceLanguage || sourceLanguage === 'UNKNOWN') {
    unknownSourceLang = true
  }

  const selectionLength: number = getSelectionLength(text)
  const textLengh: number = text.split(' ').length

  let promptAdjustment: Array<string>

  const instructionFixedExpression: string =
    '"fixedExpression": Value must be "no" or the fixed expression/concept name (e.g., "<fixed idiom/concept>") if the marked word is part of a larger fixed expression or recognized category used in this context.'
  const commonUssage: string =
    '"commonUssage": Give short context of how the word is commonly used. If the contextual meaning differs from the common ussage, explain the difference.'
  const instructionGrammar: string =
    '"grammarRules": Add brief grammar rules, limited to what is relevant for this item (e.g., agreement, part of speech behavior, irregularities).'
  const instructionCommonness: string =
    '"commonness": Indicate how common this selection is in everyday speech/texts. Up to 5 words.'

  if (selectionLength === 1) {
    if (textLengh === selectionLength) {
      promptAdjustment = [
        'do the following',
        '',
        'word',
        '',
        '',
        instructionCommonness,
      ]
    } else {
      promptAdjustment = [
        'do the following for the word marked with []',
        instructionFixedExpression,
        'word or expression',
        commonUssage,
        instructionGrammar,
        instructionCommonness,
      ]
    }
  } else if (selectionLength < 6) {
    if (textLengh === selectionLength) {
      promptAdjustment = [
        'do the following',
        '',
        'phrase',
        '',
        instructionGrammar,
        instructionCommonness,
      ]
    } else {
      promptAdjustment = [
        'do the following for the snippet marked with []',
        instructionFixedExpression,
        'phrase',
        commonUssage,
        instructionGrammar,
        instructionCommonness,
      ]
    }
  } else if (selectionLength >= 6) {
    promptAdjustment = ['do the following', '', 'text', '', '', '']
  } else {
    throw new Error('No selection identified')
  }

  const promptContents: string = `For the text I provide, ${promptAdjustment[0]}:
        
        Translate to ${targetLanguage ?? 'English'} and provide the output as a single JSON object with the given keys. Respond in ${targetLanguage}:
        
        "language": ${unknownSourceLang ? sourceLanguage : 'State the language that the provided text is in.'}
        ${promptAdjustment[1]}
        "contextualTranslation": Give the best English translation of the marked ${promptAdjustment[2]} as used in this specific context.
        "phoneticApproximation": Give an English-sound phonetic approximation of the ${promptAdjustment[2]}.
        ${promptAdjustment[3]}
        ${promptAdjustment[4]}
        ${promptAdjustment[5]}

        ${personalContext && `If it make sense, take into account this context about me: ${personalContext}.`}

        Don't forget that I want the response in ${targetLanguage}.

        Text: ${text}
        `

  return promptContents
}

import { useCallback, useEffect, useRef, useState } from 'react'

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined

const BLOCKED = 'Microphone access was blocked. Allow it in your browser settings and try again.'
const ERROR_MESSAGES = {
  'not-allowed': BLOCKED,
  'service-not-allowed': BLOCKED,
  'no-speech': "I didn't hear anything. Try again.",
  'audio-capture': 'No microphone found.',
  network: 'Speech recognition needs an internet connection.',
}

export function useSpeechRecognition({ lang = 'en-US', onTranscript }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const onTranscriptRef = useRef(onTranscript)

  // Always call the latest callback without restarting the recognizer
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  // Stop the mic if the component unmounts
  useEffect(() => () => recognitionRef.current?.abort(), [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) return
    setError('')

    const rec = new SpeechRecognitionAPI()
    rec.lang = lang
    rec.interimResults = true // show words while still speaking
    rec.continuous = false // stops after a natural pause

    rec.onstart = () => setListening(true)
    rec.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }
    rec.onerror = (e) => {
      if (e.error !== 'aborted') {
        setError(ERROR_MESSAGES[e.error] || 'Voice input failed. Please try again.')
      }
    }
    rec.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
      }
      onTranscriptRef.current(text.trim())
    }

    recognitionRef.current = rec
    rec.start()
  }, [lang])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { supported: Boolean(SpeechRecognitionAPI), listening, error, toggle, stop }
}
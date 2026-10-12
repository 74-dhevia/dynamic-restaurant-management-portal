import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Robust Web Speech Recognition Hook
 * Supports real-time interim speech display, Tamil/Indian English locale,
 * automatic error handling, and completion callbacks.
 */
export function useSpeechRecognition(options = {}) {
  const { onResult, onEnd, onError } = options;
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setSupported(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setSupported(false);
      if (optionsRef.current.onError) optionsRef.current.onError('not-supported');
      return;
    }

    // Abort any existing instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';

    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = 'en-IN'; // Optimal for Indian English and Tanglish accents

      rec.onstart = () => {
        setListening(true);
        setError(null);
      };

      rec.onresult = (e) => {
        let interim = '';
        let final = '';

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const item = e.results[i];
          if (item && item.isFinal) {
            final += item[0].transcript;
          } else if (item) {
            interim += item[0].transcript;
          }
        }

        if (final) {
          const combined = (finalTranscriptRef.current ? `${finalTranscriptRef.current} ` : '') + final;
          finalTranscriptRef.current = combined.trim();
          setTranscript(finalTranscriptRef.current);
          if (optionsRef.current.onResult) {
            optionsRef.current.onResult(finalTranscriptRef.current, true);
          }
        } else if (interim) {
          setInterimTranscript(interim);
          if (optionsRef.current.onResult) {
            optionsRef.current.onResult(interim, false);
          }
        }
      };

      rec.onerror = (e) => {
        const errType = e.error || 'unknown';
        console.warn('[Speech Recognition] Error event:', errType);
        setError(errType);
        setListening(false);
        if (optionsRef.current.onError) {
          optionsRef.current.onError(errType);
        }
      };

      rec.onend = () => {
        setListening(false);
        const captured = finalTranscriptRef.current.trim();
        if (optionsRef.current.onEnd) {
          optionsRef.current.onEnd(captured);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('[Speech Recognition] Failed to start:', err.message);
      setError('start-failed');
      setListening(false);
      if (optionsRef.current.onError) {
        optionsRef.current.onError('start-failed');
      }
    }
  }, []);

  return {
    transcript,
    interimTranscript,
    listening,
    supported,
    error,
    start,
    stop,
    setTranscript,
  };
}

export default useSpeechRecognition;

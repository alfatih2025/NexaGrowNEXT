import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceRecognitionOptions {
  lang?: string;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const { lang = 'id-ID', onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      if (onResult) {
        onResult(currentTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      const errorMessage =
        event.error === 'not-allowed'
          ? 'Izin mikrofon ditolak.'
          : event.error === 'no-speech'
          ? 'Tidak ada suara terdeteksi.'
          : `Error pengenalan suara: ${event.error}`;
      if (onError) {
        onError(errorMessage);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [lang, onResult, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    try {
      setTranscript('');
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Failed to stop recognition:', err);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const speakText = useCallback((text: string, voiceLang: string = 'id-ID') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceLang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    speakText,
    stopSpeaking,
  };
}

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useIntake } from "@/context/IntakeContext";

// Type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceAssistant() {
  const {
    isListening,
    setIsListening,
    setLiveTranscript,
    appendSpeech,
  } = useIntake();

  const recognitionRef = useRef<any>(null);
  const isContinuousActiveRef = useRef<boolean>(false);

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true; // Continuous listening stream
        recognition.interimResults = true; // Real-time word streaming
        recognition.lang = "en-IN"; // English + Hinglish recognition model
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalChunk = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const chunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalChunk += chunk + " ";
            } else {
              currentInterim += chunk;
            }
          }

          // Show real-time feedback
          const currentWords = (finalChunk + " " + currentInterim).trim();
          if (currentWords) {
            setLiveTranscript(currentWords);
          }

          // Append completed speech directly to the decoupled speech buffer
          if (finalChunk.trim()) {
            appendSpeech(finalChunk.trim());
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === "no-speech") return;
          console.warn("Voice stream notice:", event.error);
        };

        recognition.onend = () => {
          // If continuous mic is active, keep it alive
          if (isContinuousActiveRef.current) {
            try {
              recognition.start();
            } catch {
              setTimeout(() => {
                if (isContinuousActiveRef.current) {
                  try {
                    recognition.start();
                  } catch {
                    // Ignore restart collision
                  }
                }
              }, 200);
            }
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      isContinuousActiveRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [appendSpeech, setIsListening, setLiveTranscript]);

  // Master Mic On
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    isContinuousActiveRef.current = true;
    setLiveTranscript("");

    try {
      recognitionRef.current.start();
    } catch {
      try {
        recognitionRef.current.stop();
      } catch {}
      setTimeout(() => {
        if (isContinuousActiveRef.current) {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      }, 100);
    }
  }, [setLiveTranscript]);

  // Master Mic Off
  const stopListening = useCallback(() => {
    isContinuousActiveRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, [setIsListening]);

  return {
    startListening,
    stopListening,
    isListening,
    isSupported:
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
}

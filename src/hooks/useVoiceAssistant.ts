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
    formData,
    activeQuestionIndex,
    isMuted,
    isListening,
    setIsListening,
    setIsSpeaking,
    setIsProcessing,
    setLiveTranscript,
    applyExtractedDelta,
  } = useIntake();

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isContinuousActiveRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const transcriptBufferRef = useRef<string>("");

  // Refs to always have access to latest state inside speech callbacks
  const formDataRef = useRef(formData);
  formDataRef.current = formData;
  const activeQuestionIndexRef = useRef(activeQuestionIndex);
  activeQuestionIndexRef.current = activeQuestionIndex;

  // Text-To-Speech function
  const speak = useCallback(
    (text: string) => {
      if (isMuted || typeof window === "undefined" || !synthRef.current) return;

      try {
        synthRef.current.cancel(); // cancel previous utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.lang = "en-IN";

        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.includes("en-IN") ||
            v.name.includes("India") ||
            v.name.includes("Natural")
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
        };
        utterance.onend = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
        };
        utterance.onerror = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn("TTS speak error:", err);
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      }
    },
    [isMuted, setIsSpeaking]
  );

  // Send transcription to Gemini 2.5 Flash backend for real-time extraction
  const processTranscript = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) return;
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      setIsProcessing(true);

      try {
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: text.trim(),
            currentFormData: formDataRef.current,
            activeQuestionIndex: activeQuestionIndexRef.current,
          }),
        });

        const data = await response.json();

        if (data && data.extractedFields) {
          applyExtractedDelta(
            data.extractedFields,
            data.fieldsUpdated || [],
            data.doctorVoiceResponse,
            data.suggestedNextQuestion
          );

          // Clear transcript display after brief confirmation
          setTimeout(() => {
            setLiveTranscript("");
          }, 1500);

          if (data.doctorVoiceResponse && !isMuted) {
            speak(data.doctorVoiceResponse);
          }
        }
      } catch (err) {
        console.error("Extraction error:", err);
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    [applyExtractedDelta, isMuted, setIsProcessing, setLiveTranscript, speak]
  );

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true; // KEEP LISTENING CONTINUOUSLY!
        recognition.interimResults = true; // Stream interim results in real-time
        recognition.lang = "en-IN"; // Indian English + Hinglish model
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          // If assistant is currently speaking back TTS, ignore self-input to prevent echo
          if (isSpeakingRef.current) return;

          let currentInterim = "";
          let finalUtterance = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const chunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalUtterance += chunk + " ";
            } else {
              currentInterim += chunk;
            }
          }

          if (finalUtterance) {
            transcriptBufferRef.current += finalUtterance;
          }

          const display = (transcriptBufferRef.current + " " + currentInterim).trim();
          if (display) {
            setLiveTranscript(display);
          }

          // Debounce: when user pauses talking for 900ms, auto-process the speech!
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          silenceTimerRef.current = setTimeout(() => {
            const textToProcess = (transcriptBufferRef.current + " " + currentInterim).trim();
            if (textToProcess.length > 2 && !isProcessingRef.current) {
              transcriptBufferRef.current = "";
              processTranscript(textToProcess);
            }
          }, 900);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "no-speech") {
            // Ignore normal silence pauses in continuous mode
            return;
          }
        };

        recognition.onend = () => {
          // In Continuous Ambient mode, restart automatically if browser ended due to silence timeout
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
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [processTranscript, setIsListening, setLiveTranscript]);

  // Start continuous listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert(
        "Voice recognition is not supported in this browser. You can tap options directly or use Chrome / Safari."
      );
      return;
    }

    isContinuousActiveRef.current = true;
    transcriptBufferRef.current = "";
    setLiveTranscript("");

    try {
      recognitionRef.current.start();
    } catch {
      // If already started, stop and restart cleanly
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (isContinuousActiveRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // ignore
          }
        }
      }, 100);
    }
  }, [setLiveTranscript]);

  // Stop continuous listening
  const stopListening = useCallback(() => {
    isContinuousActiveRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);

    // If there was any pending speech left, process it
    if (transcriptBufferRef.current.trim().length > 2) {
      const remaining = transcriptBufferRef.current.trim();
      transcriptBufferRef.current = "";
      processTranscript(remaining);
    }
  }, [processTranscript, setIsListening]);

  return {
    startListening,
    stopListening,
    speak,
    processTranscript,
    isListening,
    isSupported:
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
}

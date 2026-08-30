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
    setIsListening,
    setIsSpeaking,
    setIsProcessing,
    setLiveTranscript,
    applyExtractedDelta,
  } = useIntake();

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize SpeechSynthesis and SpeechRecognition on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN"; // Indian English + Hinglish model
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentInterim += transcriptChunk;
            } else {
              currentInterim += transcriptChunk;
            }
          }
          setLiveTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
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
  }, [setIsListening, setLiveTranscript]);

  // Text-To-Speech function
  const speak = useCallback(
    (text: string) => {
      if (isMuted || typeof window === "undefined" || !synthRef.current) return;

      try {
        synthRef.current.cancel(); // cancel any active speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = "en-IN";

        // Try to pick an Indian English voice if available
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

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn("TTS speak error:", err);
        setIsSpeaking(false);
      }
    },
    [isMuted, setIsSpeaking]
  );

  // Send transcription to Gemini 2.5 Flash backend for parsing
  const processTranscript = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) return;

      setIsProcessing(true);
      try {
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: text,
            currentFormData: formData,
            activeQuestionIndex,
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

          if (data.doctorVoiceResponse) {
            speak(data.doctorVoiceResponse);
          }
        }
      } catch (err) {
        console.error("Extraction error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [formData, activeQuestionIndex, applyExtractedDelta, setIsProcessing, speak]
  );

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      alert(
        "Voice recognition is not supported on this browser. You can tap options directly or use Chrome / Safari."
      );
      return;
    }

    if (synthRef.current) {
      synthRef.current.cancel(); // Stop talking before listening
    }

    setLiveTranscript("");
    try {
      recognitionRef.current.start();
    } catch {
      // If already started, restart
      recognitionRef.current.stop();
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch {
          // ignore
        }
      }, 100);
    }
  }, [setLiveTranscript]);

  // Stop listening & immediately process
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  return {
    startListening,
    stopListening,
    speak,
    processTranscript,
    isSupported: typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  };
}

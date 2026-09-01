"use client";

import { useEffect, useRef, useCallback } from "react";
import { useIntake, getFormUnfilledStatus } from "@/context/IntakeContext";

// Configuration for word threshold and periodic interval
const WORD_THRESHOLD = 12; // Process when ~12 new words have arrived
const HEARTBEAT_INTERVAL_MS = 1000; // Or every 1 second if any new speech arrived

export function useAutoFormFiller() {
  const {
    formData,
    activeQuestionIndex,
    speechBuffer,
    clearProcessedSpeech,
    applyExtractedDelta,
    isFormFillerActive,
    setIsFormFillerActive,
  } = useIntake();

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  const activeQuestionIndexRef = useRef(activeQuestionIndex);
  activeQuestionIndexRef.current = activeQuestionIndex;

  const isRunningRef = useRef(false);
  const lastProcessedLengthRef = useRef(0);

  // Core function that passes the FULL speech context to the intelligent LLM extractor
  const processFullSpeech = useCallback(
    async (fullTranscript: string) => {
      console.log("[AutoFiller] Attempting to process:", { fullTranscript, isRunning: isRunningRef.current });
      if (!fullTranscript || fullTranscript.trim().length < 2) return;
      if (isRunningRef.current) return;

      isRunningRef.current = true;
      setIsFormFillerActive(true);

      console.log("[AutoFiller] Sending to backend...");

      try {
        const { alreadyFilled, unfilled } = getFormUnfilledStatus(formDataRef.current);

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: fullTranscript.trim(),
            alreadyFilledFields: alreadyFilled,
            unfilledFields: unfilled,
            currentFormData: formDataRef.current,
            activeQuestionIndex: activeQuestionIndexRef.current,
          }),
        });

        const data = await response.json();
        console.log("[AutoFiller] Backend response:", data);

        if (data && data.extractedFields && Object.keys(data.extractedFields).length > 0) {
          applyExtractedDelta(
            data.extractedFields,
            data.fieldsUpdated || [],
            data.doctorVoiceResponse,
            data.suggestedNextQuestion
          );
          
          // Clear the portion of the transcript we just successfully consumed!
          clearProcessedSpeech(fullTranscript.length);
          lastProcessedLengthRef.current = 0;
        }
      } catch (err) {
        console.error("[AutoFiller] Fetch error:", err);
      } finally {
        isRunningRef.current = false;
        setIsFormFillerActive(false);
      }
    },
    [applyExtractedDelta, setIsFormFillerActive]
  );

  // Word-count trigger: checks if new words exceeded WORD_THRESHOLD
  useEffect(() => {
    if (!speechBuffer) return;

    // If the buffer was externally cleared (e.g. form reset), reset our tracking pointer
    if (speechBuffer.length < lastProcessedLengthRef.current) {
      lastProcessedLengthRef.current = 0;
    }

    const unprocessed = speechBuffer.slice(lastProcessedLengthRef.current).trim();
    const wordCount = unprocessed ? unprocessed.split(/\s+/).length : 0;
    
    console.log("[AutoFiller] Buffer updated. Total Buffer:", speechBuffer);
    console.log("[AutoFiller] Unprocessed words:", wordCount);

    if (wordCount >= WORD_THRESHOLD && !isRunningRef.current) {
      console.log("[AutoFiller] Threshold hit! Triggering...");
      lastProcessedLengthRef.current = speechBuffer.length;
      processFullSpeech(speechBuffer);
    }
  }, [speechBuffer, processFullSpeech]);

  // Periodic Heartbeat trigger: checks every 3 seconds if any new words arrived
  useEffect(() => {
    const timer = setInterval(() => {
      if (!speechBuffer || isRunningRef.current) return;

      // If the buffer was externally cleared (e.g. form reset), reset our tracking pointer
      if (speechBuffer.length < lastProcessedLengthRef.current) {
        lastProcessedLengthRef.current = 0;
      }

      const unprocessed = speechBuffer.slice(lastProcessedLengthRef.current).trim();
      const wordCount = unprocessed ? unprocessed.split(/\s+/).length : 0;

      if (wordCount >= 1) {
        // At least 1 new word arrived and user paused, so trigger
        lastProcessedLengthRef.current = speechBuffer.length;
        processFullSpeech(speechBuffer);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [speechBuffer, processFullSpeech]);

  const speechBufferRef = useRef(speechBuffer);
  speechBufferRef.current = speechBuffer;

  // Flush remaining speech when user finishes or stops
  const flushRemaining = useCallback(() => {
    const currentBuffer = speechBufferRef.current;
    if (!currentBuffer) return;
    const unprocessed = currentBuffer.slice(lastProcessedLengthRef.current).trim();
    
    if (unprocessed.length > 1) {
      if (isRunningRef.current) {
        // If API is currently busy, wait and try again
        setTimeout(flushRemaining, 500);
        return;
      }
      lastProcessedLengthRef.current = currentBuffer.length;
      processFullSpeech(currentBuffer);
    }
  }, [processFullSpeech]);

  // Auto-flush immediately when the microphone is turned off
  const { isListening } = useIntake();
  useEffect(() => {
    if (!isListening) {
      // Small delay to allow the final 'onresult' from the Web Speech API to append to the buffer
      const timer = setTimeout(() => {
        flushRemaining();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, flushRemaining]);

  const resetFiller = useCallback(() => {
    lastProcessedLengthRef.current = 0;
    clearProcessedSpeech();
  }, [clearProcessedSpeech]);

  return {
    isFormFillerActive,
    flushRemaining,
    resetFiller,
  };
}

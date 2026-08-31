"use client";

import { useEffect, useRef, useCallback } from "react";
import { useIntake, getFormUnfilledStatus } from "@/context/IntakeContext";

// Configuration for word threshold and periodic interval
const WORD_THRESHOLD = 12; // Process when ~12 new words have arrived
const HEARTBEAT_INTERVAL_MS = 3000; // Or every 3 seconds if any new speech arrived

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
      if (!fullTranscript || fullTranscript.trim().length < 3) return;
      if (isRunningRef.current) return;

      isRunningRef.current = true;
      setIsFormFillerActive(true);

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

        if (data && data.extractedFields && Object.keys(data.extractedFields).length > 0) {
          applyExtractedDelta(
            data.extractedFields,
            data.fieldsUpdated || [],
            data.doctorVoiceResponse,
            data.suggestedNextQuestion
          );
        }
      } catch (err) {
        console.error("Auto Form Filler error:", err);
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

    const unprocessed = speechBuffer.slice(lastProcessedLengthRef.current).trim();
    const wordCount = unprocessed ? unprocessed.split(/\s+/).length : 0;

    if (wordCount >= WORD_THRESHOLD && !isRunningRef.current) {
      lastProcessedLengthRef.current = speechBuffer.length;
      processFullSpeech(speechBuffer);
    }
  }, [speechBuffer, processFullSpeech]);

  // Periodic Heartbeat trigger: checks every 3 seconds if any new words arrived
  useEffect(() => {
    const timer = setInterval(() => {
      if (!speechBuffer || isRunningRef.current) return;

      const unprocessed = speechBuffer.slice(lastProcessedLengthRef.current).trim();
      const wordCount = unprocessed ? unprocessed.split(/\s+/).length : 0;

      if (wordCount >= 3) {
        // At least 3 new words have arrived and user hasn't hit threshold yet
        lastProcessedLengthRef.current = speechBuffer.length;
        processFullSpeech(speechBuffer);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [speechBuffer, processFullSpeech]);

  // Flush remaining speech when user finishes or stops
  const flushRemaining = useCallback(() => {
    if (!speechBuffer) return;
    const unprocessed = speechBuffer.slice(lastProcessedLengthRef.current).trim();
    if (unprocessed.length > 2 && !isRunningRef.current) {
      lastProcessedLengthRef.current = speechBuffer.length;
      processFullSpeech(speechBuffer);
    }
  }, [speechBuffer, processFullSpeech]);

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

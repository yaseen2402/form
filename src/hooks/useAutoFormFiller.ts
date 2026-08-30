"use client";

import { useEffect, useRef, useCallback } from "react";
import { useIntake, getFormUnfilledStatus } from "@/context/IntakeContext";

// Configuration for word threshold and periodic interval
const WORD_THRESHOLD = 8; // Process every ~8 new words
const HEARTBEAT_INTERVAL_MS = 3000; // Or every 3 seconds if new speech arrived

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
  const lastProcessedIndexRef = useRef(0);

  // Core function that passes new speech to the intelligent LLM extractor
  const processNewSpeech = useCallback(
    async (chunk: string) => {
      if (!chunk || chunk.trim().length < 3) return;
      if (isRunningRef.current) return;

      isRunningRef.current = true;
      setIsFormFillerActive(true);

      try {
        const { alreadyFilled, unfilled } = getFormUnfilledStatus(formDataRef.current);

        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: chunk.trim(),
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

    const unprocessed = speechBuffer.slice(lastProcessedIndexRef.current).trim();
    const wordCount = unprocessed ? unprocessed.split(/\s+/).length : 0;

    if (wordCount >= WORD_THRESHOLD && !isRunningRef.current) {
      const chunkToProcess = unprocessed;
      lastProcessedIndexRef.current = speechBuffer.length;
      processNewSpeech(chunkToProcess);
    }
  }, [speechBuffer, processNewSpeech]);

  // Periodic Heartbeat trigger: checks every 3 seconds if any new words arrived
  useEffect(() => {
    const timer = setInterval(() => {
      if (!speechBuffer || isRunningRef.current) return;

      const unprocessed = speechBuffer.slice(lastProcessedIndexRef.current).trim();
      const wordCount = unprocessed ? unprocessed.split(/\s+/).length : 0;

      if (wordCount >= 3) {
        // At least 3 new words have arrived and user hasn't hit threshold yet
        const chunkToProcess = unprocessed;
        lastProcessedIndexRef.current = speechBuffer.length;
        processNewSpeech(chunkToProcess);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [speechBuffer, processNewSpeech]);

  // Flush remaining speech when user finishes or stops
  const flushRemaining = useCallback(() => {
    if (!speechBuffer) return;
    const unprocessed = speechBuffer.slice(lastProcessedIndexRef.current).trim();
    if (unprocessed.length > 2 && !isRunningRef.current) {
      lastProcessedIndexRef.current = speechBuffer.length;
      processNewSpeech(unprocessed);
    }
  }, [speechBuffer, processNewSpeech]);

  const resetFiller = useCallback(() => {
    lastProcessedIndexRef.current = 0;
    clearProcessedSpeech();
  }, [clearProcessedSpeech]);

  return {
    isFormFillerActive,
    flushRemaining,
    resetFiller,
  };
}

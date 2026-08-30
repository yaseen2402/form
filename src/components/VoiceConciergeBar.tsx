"use client";

import React, { useState } from "react";
import { useIntake } from "@/context/IntakeContext";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { QUESTIONS_METADATA } from "@/lib/constants";
import { Mic, MicOff, Loader2, Send, Check } from "lucide-react";

export function VoiceConciergeBar() {
  const {
    activeQuestionIndex,
    isListening,
    isProcessing,
    liveTranscript,
    lastAgentReply,
    recentFieldUpdates,
  } = useIntake();

  const { startListening, stopListening, processTranscript } = useVoiceAssistant();
  const [manualText, setManualText] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const activeMeta = QUESTIONS_METADATA.find((q) => q.n === activeQuestionIndex);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      if (liveTranscript) {
        processTranscript(liveTranscript);
      }
    } else {
      startListening();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      processTranscript(manualText.trim());
      setManualText("");
      setShowManualInput(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-4">
      {/* Auto-filled notification: simple black/white toast */}
      {recentFieldUpdates.length > 0 && (
        <div className="mb-3 p-2.5 bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
            <span>Captured: {recentFieldUpdates.join(", ")}</span>
          </div>
        </div>
      )}

      {/* Main Voice Bar: Stark monochrome card */}
      <div className="bg-white border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status & Assistant Voice Feedback */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-zinc-950 animate-ping" : "bg-zinc-400"}`} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                {isProcessing ? "Processing response..." : isListening ? "Listening..." : "Voice Input"}
              </span>
            </div>
            <p className="text-xs text-zinc-700 leading-relaxed font-serif italic">
              &ldquo;{lastAgentReply}&rdquo;
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleMicToggle}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition ${
                isListening
                  ? "bg-zinc-950 text-white animate-pulse"
                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speak</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-900 px-2 py-1.5 transition"
            >
              {showManualInput ? "Close" : "Type"}
            </button>
          </div>
        </div>

        {/* Live Transcript */}
        {isListening && (
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span className="font-mono text-zinc-900">
              {liveTranscript || "Speak in English or Hinglish..."}
            </span>
            {liveTranscript && (
              <button
                onClick={() => {
                  stopListening();
                  processTranscript(liveTranscript);
                }}
                className="text-[11px] font-mono px-2 py-0.5 bg-zinc-950 text-white"
              >
                Done
              </button>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Analyzing clinical cues with Gemini 2.5 Flash...</span>
          </div>
        )}

        {/* Manual text input fallback */}
        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Type your response in English or Hinglish..."
              className="flex-1 text-xs px-3 py-2 border border-zinc-300 focus:outline-none focus:border-zinc-950 text-zinc-900 placeholder-zinc-400 font-mono"
            />
            <button
              type="submit"
              disabled={!manualText.trim() || isProcessing}
              className="bg-zinc-950 text-white text-xs px-3 py-2 disabled:opacity-30 transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Suggestion chip */}
        {activeMeta?.hinglishExample && !showManualInput && !isListening && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-100 flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="font-mono uppercase text-[10px] text-zinc-400 shrink-0">Try saying:</span>
            <button
              onClick={() => {
                const cleaned = activeMeta.hinglishExample?.replace(/^e\.g\.,\s*['"]|['"]$/g, "") || "";
                processTranscript(cleaned);
              }}
              className="text-zinc-600 hover:text-zinc-950 underline text-left truncate transition"
              title="Click to simulate speaking this utterance"
            >
              {activeMeta.hinglishExample}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

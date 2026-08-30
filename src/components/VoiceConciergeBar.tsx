"use client";

import React, { useState } from "react";
import { useIntake } from "@/context/IntakeContext";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { QUESTIONS_METADATA } from "@/lib/constants";
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Send,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

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

  const handleSuggestionClick = (text: string) => {
    processTranscript(text);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3">
      {/* Toast Alert for recently auto-filled fields */}
      {recentFieldUpdates.length > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="font-semibold">Auto-Filled & Confirmed:</strong>{" "}
            {recentFieldUpdates.join(" · ")}
          </span>
        </div>
      )}

      <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800">
        {/* Assistant status header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-emerald-400 relative" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              AI Clinic Voice Concierge
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-xs text-slate-400 hover:text-slate-200 underline transition"
            >
              {showManualInput ? "Use Voice" : "Type instead"}
            </button>
          </div>
        </div>

        {/* Spoken reply bubble */}
        <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 mb-3 text-xs sm:text-sm text-slate-200 flex items-start gap-2.5">
          <MessageSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="leading-relaxed font-normal">{lastAgentReply}</p>
          </div>
        </div>

        {/* Live Transcript or Recording state */}
        {isListening && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm animate-pulse flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>{liveTranscript || "Listening... speak naturally in English or Hinglish..."}</span>
            </div>
            {liveTranscript && (
              <button
                onClick={() => {
                  stopListening();
                  processTranscript(liveTranscript);
                }}
                className="text-xs px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
              >
                Done
              </button>
            )}
          </div>
        )}

        {isProcessing && (
          <div className="mb-3 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 text-xs sm:text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Processing with Gemini 2.5 Flash... Extracting & checking clinical conditions</span>
          </div>
        )}

        {/* Interactive Bar: Big Mic + Suggestions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Action Button */}
          <button
            onClick={handleMicToggle}
            disabled={isProcessing}
            className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-md active:scale-98 ${
              isListening
                ? "bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/30 animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/20"
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                <span>Tap to Finish Speaking</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Tap to Speak (Voice Fill)</span>
              </>
            )}
          </button>

          {/* Quick Hinglish Prompt Suggestion Chip */}
          {activeMeta && activeMeta.hinglishExample && !showManualInput && (
            <div className="flex-1 w-full text-xs flex items-center gap-2 overflow-x-auto py-1">
              <span className="text-slate-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick test:
              </span>
              <button
                onClick={() => {
                  const cleaned = activeMeta.hinglishExample?.replace(/^e\.g\.,\s*['"]|['"]$/g, "") || "";
                  handleSuggestionClick(cleaned);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-2.5 py-1.5 rounded-lg text-left truncate transition max-w-[280px] sm:max-w-none"
                title="Click to simulate speaking this sentence"
              >
                {activeMeta.hinglishExample}
              </button>
            </div>
          )}

          {/* Manual Text Form fallback */}
          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="flex-1 w-full flex items-center gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type your response in English or Hinglish..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!manualText.trim() || isProcessing}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

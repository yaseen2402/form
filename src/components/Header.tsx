"use client";

import React from "react";
import { useIntake } from "@/context/IntakeContext";
import { Volume2, VolumeX, RotateCcw, Camera } from "lucide-react";

export function Header() {
  const {
    viewMode,
    setViewMode,
    isMuted,
    setIsMuted,
    resetForm,
    setPrescriptionModalOpen,
  } = useIntake();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-nowrap">
        {/* Brand: Just clean GENOROOT without secondary labels */}
        <div className="shrink-0">
          <span className="font-mono text-xs font-bold tracking-widest text-zinc-950 uppercase select-none">
            GENOROOT
          </span>
        </div>

        {/* Actions: Strict single line, no wrapping */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
          {/* Upload Rx */}
          <button
            onClick={() => setPrescriptionModalOpen(true)}
            className="flex items-center gap-1 text-xs font-mono px-2.5 py-1.5 border border-zinc-200 hover:border-zinc-950 text-zinc-800 transition whitespace-nowrap shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Rx</span>
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 border border-zinc-200 hover:border-zinc-950 text-zinc-600 hover:text-zinc-950 transition shrink-0"
            title={isMuted ? "Audio Muted" : "Audio Active"}
            aria-label="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              if (confirm("Reset intake form?")) resetForm();
            }}
            className="p-1.5 border border-zinc-200 hover:border-zinc-950 text-zinc-600 hover:text-zinc-950 transition shrink-0"
            title="Reset"
            aria-label="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Mode Switch */}
          <button
            onClick={() => setViewMode(viewMode === "patient" ? "doctor_summary" : "patient")}
            className="text-xs font-mono font-semibold px-2.5 sm:px-3 py-1.5 bg-zinc-950 text-white hover:bg-zinc-800 transition whitespace-nowrap shrink-0"
          >
            {viewMode === "patient" ? "Doctor Brief →" : "← Patient"}
          </button>
        </div>
      </div>
    </header>
  );
}

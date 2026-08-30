"use client";

import React from "react";
import { useIntake } from "@/context/IntakeContext";
import { DEMO_PERSONAS } from "@/lib/constants";
import { Volume2, VolumeX, RotateCcw, Camera } from "lucide-react";

export function Header() {
  const {
    completionPercentage,
    answeredCount,
    totalQuestions,
    viewMode,
    setViewMode,
    isMuted,
    setIsMuted,
    resetForm,
    loadPersona,
    setPrescriptionModalOpen,
  } = useIntake();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-xs font-bold tracking-widest text-zinc-950 uppercase">
            GenoRoot
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            Intake
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Scan Rx */}
          <button
            onClick={() => setPrescriptionModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 border border-zinc-200 hover:border-zinc-950 text-zinc-700 hover:text-zinc-950 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Rx</span>
          </button>

          {/* Test Persona Selector */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                loadPersona(e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="text-xs font-mono bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-2 py-1.5 cursor-pointer outline-none transition"
            aria-label="Simulate Persona"
          >
            <option value="" disabled>
              Persona...
            </option>
            {DEMO_PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 border border-zinc-200 hover:border-zinc-950 text-zinc-600 hover:text-zinc-950 transition"
            title={isMuted ? "Voice is Muted" : "Voice is Active"}
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Reset */}
          <button
            onClick={() => {
              if (confirm("Reset form?")) resetForm();
            }}
            className="p-1.5 border border-zinc-200 hover:border-zinc-950 text-zinc-600 hover:text-zinc-950 transition"
            title="Reset"
            aria-label="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Mode Switch */}
          <button
            onClick={() => setViewMode(viewMode === "patient" ? "doctor_summary" : "patient")}
            className="text-xs font-mono font-semibold px-3 py-1.5 bg-zinc-950 text-white hover:bg-zinc-800 transition"
          >
            {viewMode === "patient" ? "Doctor Brief →" : "← Patient View"}
          </button>
        </div>
      </div>

      {/* Ultra-minimalist 1px Progress Bar */}
      <div className="w-full bg-zinc-100 h-0.5 relative">
        <div
          className="bg-zinc-950 h-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-1 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <span>{answeredCount} of {totalQuestions} answered</span>
        <span>{completionPercentage}%</span>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import { useIntake } from "@/context/IntakeContext";
import { DEMO_PERSONAS } from "@/lib/constants";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Stethoscope,
  UserCheck,
  FileText,
  Camera,
} from "lucide-react";

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 shadow-sm transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Logo & Clinic Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                GenoRoot
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Clinic Concierge
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Intelligent Hair & Scalp Pre-Consultation Intake
            </p>
          </div>
        </div>

        {/* Right Actions: Persona, Mute, View Mode */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Upload Rx Button */}
          <button
            onClick={() => setPrescriptionModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            title="Scan past prescription or report"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Scan Rx</span>
          </button>

          {/* Quick Demo Persona Dropdown for Reviewer */}
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  loadPersona(e.target.value);
                  e.target.value = "";
                }
              }}
              defaultValue=""
              className="text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg px-2 py-1.5 cursor-pointer outline-none transition"
              aria-label="Simulate Patient Persona"
            >
              <option value="" disabled>
                ⚡ Test Persona...
              </option>
              {DEMO_PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mute/Voice Output Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isMuted
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
            title={isMuted ? "Voice is Muted (Click to Unmute)" : "Voice is Active (Click to Mute)"}
            aria-label="Toggle Voice Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset button */}
          <button
            onClick={() => {
              if (confirm("Reset the intake form?")) {
                resetForm();
              }
            }}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Reset Form"
            aria-label="Reset Form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Switch View Mode: Patient vs Doctor Page 2 */}
          <button
            onClick={() =>
              setViewMode(viewMode === "patient" ? "doctor_summary" : "patient")
            }
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm ${
              viewMode === "doctor_summary"
                ? "bg-slate-900 text-white"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {viewMode === "patient" ? (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>Doctor Brief</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>Patient Flow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            {answeredCount} of {totalQuestions} completed
          </span>
          <span className="text-slate-400">({completionPercentage}%)</span>
        </div>
        <div className="w-36 sm:w-56 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </header>
  );
}

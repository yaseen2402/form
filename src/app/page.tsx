"use client";

import React from "react";
import { useIntake } from "@/context/IntakeContext";
import { Header } from "@/components/Header";
import { VoiceConciergeBar } from "@/components/VoiceConciergeBar";
import { QuestionCard } from "@/components/QuestionCard";
import { DoctorSummaryPage } from "@/components/DoctorSummaryPage";
import { PrescriptionUploadModal } from "@/components/PrescriptionUploadModal";
import { Shield } from "lucide-react";

export default function Home() {
  const { viewMode } = useIntake();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {viewMode === "doctor_summary" ? (
        <main className="flex-1">
          <DoctorSummaryPage />
        </main>
      ) : (
        <main className="flex-1 flex flex-col">
          {/* Top Voice Concierge Controller */}
          <VoiceConciergeBar />

          {/* Active Question Area */}
          <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6">
            <QuestionCard />
          </div>
        </main>
      )}

      <PrescriptionUploadModal />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>GenoRoot Clinic · Fully filled structured intake engine</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by Browser Web Speech API + Gemini 2.5 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

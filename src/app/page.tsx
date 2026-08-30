"use client";

import React from "react";
import { useIntake } from "@/context/IntakeContext";
import { Header } from "@/components/Header";
import { QuestionCard } from "@/components/QuestionCard";
import { DoctorSummaryPage } from "@/components/DoctorSummaryPage";
import { PrescriptionUploadModal } from "@/components/PrescriptionUploadModal";

export default function Home() {
  const { viewMode } = useIntake();

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-950 font-sans selection:bg-zinc-950 selection:text-white">
      <Header />

      {viewMode === "doctor_summary" ? (
        <main className="flex-1">
          <DoctorSummaryPage />
        </main>
      ) : (
        <main className="flex-1 flex flex-col justify-center">
          {/* Active Question Card */}
          <div className="max-w-2xl w-full mx-auto px-4 py-6 sm:py-10">
            <QuestionCard />
          </div>
        </main>
      )}

      <PrescriptionUploadModal />

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 py-3 px-4 text-[11px] font-mono text-zinc-400 mt-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span>GenoRoot · Intake Engine</span>
          <span>16 Questions · Voice & Direct Tap</span>
        </div>
      </footer>
    </div>
  );
}

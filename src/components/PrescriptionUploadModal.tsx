"use client";

import React, { useState } from "react";
import { useIntake } from "@/context/IntakeContext";
import { X, Upload, FileText, Loader2, Check } from "lucide-react";

const SAMPLE_RX_1 = `Dr. Anita Sen, MD Dermatology & Trichology
Rx:
1. Topical Minoxidil 5% Solution - 1ml at night on scalp (Duration: 6 months)
2. Ketoconazole 2% Medicated Shampoo - 3 times a week (Duration: 3 months)
3. Follihair Multi-vitamin / Biotin 10mg - 1 tablet daily (Duration: 3 months)
Notes: Patient reports good initial regrowth with minoxidil, no major scalp erythema.`;

const SAMPLE_RX_2 = `Metropolis Diagnostic Lab Report
Patient: Sunita Rao (Female, 34)
Test: Serum Ferritin: 14 ng/mL (Low - Anemia)
Thyroid Profile: TSH 7.8 uIU/mL (High - Hypothyroidism)
USG Pelvis: Bilateral polycystic ovaries pattern (PCOS).`;

export function PrescriptionUploadModal() {
  const {
    prescriptionModalOpen,
    setPrescriptionModalOpen,
    applyExtractedDelta,
    formData,
  } = useIntake();

  const [rxText, setRxText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!prescriptionModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleProcess = async (textToProcess: string, fileToSend?: File | null) => {
    setIsProcessing(true);
    setSuccessMsg(null);

    try {
      let imagePayload: { base64Data: string; mimeType: string } | null = null;

      if (fileToSend) {
        const reader = new FileReader();
        const base64Promise = new Promise<{ base64Data: string; mimeType: string }>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            resolve({ base64Data, mimeType: fileToSend.type || "image/jpeg" });
          };
          reader.readAsDataURL(fileToSend);
        });
        imagePayload = await base64Promise;
      }

      const promptText = textToProcess
        ? `Medical Document Content:\n${textToProcess}`
        : "Extract hair clinic medications, products, durations, and diagnosed conditions from this uploaded document.";

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: promptText,
          image: imagePayload,
          currentFormData: formData,
          activeQuestionIndex: 12,
        }),
      });

      const data = await res.json();

      if (data && data.extractedFields) {
        applyExtractedDelta(
          data.extractedFields,
          data.fieldsUpdated || ["Prescription Auto-Fill"],
          data.doctorVoiceResponse || "Prescription scanned and medications populated."
        );
        setSuccessMsg(`Extracted ${data.fieldsUpdated?.length || "multiple"} fields.`);
        setTimeout(() => {
          setPrescriptionModalOpen(false);
        }, 1000);
      }
    } catch (err) {
      console.error("Rx scan error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white border border-zinc-300 max-w-md w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setPrescriptionModalOpen(false)}
          className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-950 transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1">
          Optical Analysis
        </div>
        <h3 className="text-base font-bold text-zinc-950 mb-1">
          Upload Medical Document
        </h3>
        <p className="text-xs text-zinc-500 mb-4">
          Upload a prescription photo or lab report to auto-fill products & conditions.
        </p>

        {/* Upload Box */}
        <div className="mb-4">
          <label className="border border-dashed border-zinc-300 hover:border-zinc-950 p-4 flex flex-col items-center justify-center cursor-pointer transition bg-zinc-50 hover:bg-zinc-100/50">
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="max-h-28 object-contain mb-2 border border-zinc-200"
                />
                <span className="text-xs font-mono text-zinc-900 underline">
                  Replace image
                </span>
              </div>
            ) : (
              <>
                <FileText className="w-6 h-6 text-zinc-400 mb-1.5" />
                <span className="text-xs font-medium text-zinc-800">
                  Select image file (PNG / JPG)
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Text area fallback */}
        <div className="mb-4">
          <label className="block text-xs font-mono text-zinc-600 uppercase mb-1">
            Or paste text:
          </label>
          <textarea
            rows={3}
            value={rxText}
            onChange={(e) => setRxText(e.target.value)}
            placeholder="e.g. Minoxidil 5% topical solution for 6 months..."
            className="w-full text-xs p-2.5 border border-zinc-300 focus:outline-none focus:border-zinc-950 text-zinc-900 font-mono"
          />
        </div>

        {/* Sample presets */}
        <div className="mb-4 border-t border-zinc-100 pt-3">
          <span className="text-[11px] font-mono text-zinc-400 block mb-1.5 uppercase">
            Test Samples:
          </span>
          <div className="space-y-1.5">
            <button
              onClick={() => setRxText(SAMPLE_RX_1)}
              className="w-full text-left p-2 border border-zinc-200 hover:border-zinc-950 text-xs font-mono text-zinc-800 transition"
            >
              Rx Sample: Minoxidil 5% + Ketoconazole + Biotin
            </button>
            <button
              onClick={() => setRxText(SAMPLE_RX_2)}
              className="w-full text-left p-2 border border-zinc-200 hover:border-zinc-950 text-xs font-mono text-zinc-800 transition"
            >
              Lab Sample: Low Ferritin (Anemia) + TSH + PCOS
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-3 p-2 bg-zinc-100 border border-zinc-300 text-zinc-950 text-xs font-mono flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {successMsg}
          </div>
        )}

        <button
          onClick={() => handleProcess(rxText, selectedFile)}
          disabled={isProcessing || (!rxText && !selectedFile)}
          className="w-full py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-30 text-white font-mono text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Document...</span>
            </>
          ) : (
            <span>Extract & Auto-Fill</span>
          )}
        </button>
      </div>
    </div>
  );
}

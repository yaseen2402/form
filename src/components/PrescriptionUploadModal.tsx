"use client";

import React, { useState } from "react";
import { useIntake } from "@/context/IntakeContext";
import { X, Upload, FileText, Sparkles, Loader2, Check } from "lucide-react";

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
        // Convert file to base64
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
        ? `Medical Document / Prescription Content:\n${textToProcess}`
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
          data.doctorVoiceResponse || "Prescription successfully scanned and medications populated."
        );
        setSuccessMsg(`Extracted ${data.fieldsUpdated?.length || "multiple"} fields successfully!`);
        setTimeout(() => {
          setPrescriptionModalOpen(false);
        }, 1200);
      }
    } catch (err) {
      console.error("Rx scan error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setPrescriptionModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Scan Prescription or Blood Report
            </h3>
            <p className="text-xs text-slate-500">
              AI extracts products, dosages, and conditions automatically
            </p>
          </div>
        </div>

        {/* Upload Box */}
        <div className="my-4">
          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/40">
            {previewUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Prescription preview"
                  className="max-h-36 rounded-lg object-contain shadow-sm mb-2"
                />
                <span className="text-xs text-emerald-700 font-medium">
                  Change selected photo
                </span>
              </div>
            ) : (
              <>
                <FileText className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">
                  Tap to upload prescription or report photo
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports PNG, JPG, JPEG
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

        {/* Or Text Area */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Or paste prescription text:
          </label>
          <textarea
            rows={3}
            value={rxText}
            onChange={(e) => setRxText(e.target.value)}
            placeholder="e.g. Minoxidil 5% topical solution, Biotin 10mg daily for 6 months..."
            className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        {/* Quick Sample Prescriptions for Reviewer */}
        <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
          <div className="flex items-center gap-1 font-semibold text-slate-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Test Samples (Click to load):</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setRxText(SAMPLE_RX_1)}
              className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition text-slate-700"
            >
              <strong className="text-emerald-800">Sample 1:</strong> Minoxidil 5% + Ketoconazole + Biotin
            </button>
            <button
              onClick={() => setRxText(SAMPLE_RX_2)}
              className="text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition text-slate-700"
            >
              <strong className="text-emerald-800">Sample 2:</strong> Lab Report: Low Ferritin (Anemia) + TSH + PCOS
            </button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => handleProcess(rxText, selectedFile)}
          disabled={isProcessing || (!rxText && !selectedFile)}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-md"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Document with Gemini 2.5 Flash...</span>
            </>
          ) : (
            <span>Extract & Auto-Fill Form</span>
          )}
        </button>
      </div>
    </div>
  );
}

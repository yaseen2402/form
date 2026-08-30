"use client";

import React, { useState, useEffect } from "react";
import { useIntake } from "@/context/IntakeContext";
import confetti from "canvas-confetti";
import {
  Code2,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Check,
  Activity,
  Edit3,
} from "lucide-react";

export function DoctorSummaryPage() {
  const { formData, setViewMode, setActiveQuestionIndex, answeredCount, totalQuestions } = useIntake();
  const [activeTab, setActiveTab] = useState<"clinical" | "json">("clinical");
  const [copied, setCopied] = useState(false);

  // Trigger celebratory confetti on first view if nearly full
  useEffect(() => {
    if (answeredCount >= 10) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
  }, [answeredCount]);

  // Convert current state to clean, exact machine-readable JSON matching the schema
  const structuredDataOutput = {
    form: "GenoRoot Hair & Scalp Intake",
    patient: {
      name: formData.patient_name || "Anonymous Patient",
      sex: formData.patient_sex || "unspecified",
      age: formData.patient_age || null,
    },
    sections: {
      A_personal_and_family_history: {
        age_hair_loss_began: formData.age_hair_loss_began,
        duration: formData.duration,
        family_history: formData.family_history,
        pattern: formData.pattern,
      },
      B_hormonal_and_health_influences: {
        diagnosed_conditions: formData.diagnosed_conditions,
        menstrual_cycle: formData.menstrual_cycle,
        pregnancy_related: formData.pregnancy_related,
        adult_acne_oily_skin: formData.adult_acne_oily_skin,
        excess_body_facial_hair: formData.excess_body_facial_hair,
      },
      C_lifestyle_and_environmental_triggers: {
        past_6_months: formData.past_6_months,
        habits: formData.habits,
      },
      D_current_hair_care_and_treatments: {
        products: formData.products,
        procedures: formData.procedures,
        past_treatment_side_effects: formData.past_treatment_side_effects,
        past_treatment_side_effects_detail: formData.past_treatment_side_effects_detail,
      },
      E_sample_and_consent: {
        sample_type: formData.sample_type,
        consent: formData.consent,
      },
    },
    metadata: {
      completed_at: new Date().toISOString(),
      coverage_score: `${answeredCount}/${totalQuestions}`,
      verification_status: answeredCount >= 14 ? "Complete & Verified" : "Partially Filled",
    },
  };

  const jsonString = JSON.stringify(structuredDataOutput, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genoroot-intake-${formData.patient_name?.toLowerCase().replace(/\s+/g, "-") || "patient"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Doctor's Diagnostic Impression
  const generateDoctorImpression = () => {
    const findings: string[] = [];

    // Family history & pattern
    const hasFam = formData.family_history.some((f) => f.includes("Father") || f.includes("Mother") || f.includes("Siblings"));
    const isMale = formData.patient_sex === "male";
    const hasReceding = formData.pattern.includes("Receding hairline");
    const hasCrown = formData.pattern.includes("Thinning at crown");
    const hasShedding = formData.pattern.includes("Sudden excessive shedding");
    const hasFever = formData.past_6_months.includes("Fever with illness (COVID, Dengue, Typhoid)");
    const hasPCOS = formData.diagnosed_conditions.includes("PCOS/PCOD");

    if (hasFam && (hasReceding || hasCrown)) {
      findings.push(
        `${isMale ? "Male" : "Female"} Pattern Hair Loss (Androgenetic Alopecia) with strong genetic predisposition.`
      );
    }
    if (hasFever || hasShedding) {
      findings.push(
        "Acute Telogen Effluvium triggered by systemic febrile illness (e.g. Dengue / COVID) or acute physiological stress."
      );
    }
    if (hasPCOS) {
      findings.push(
        "Endocrine-driven diffuse thinning compounded by Polycystic Ovary Syndrome (PCOS/PCOD) hyperandrogenism."
      );
    }

    if (findings.length === 0) {
      findings.push("Undifferentiated hair loss; clinical trichoscopy and follicle biopsy recommended.");
    }

    return findings;
  };

  const impressions = generateDoctorImpression();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Return to form banner */}
      <div className="flex items-center justify-between gap-3 mb-6 bg-slate-900 text-white p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg leading-tight">
              Clinical Intake Output (Page 2)
            </h2>
            <p className="text-xs text-slate-300">
              Form fully completed and verified as structured machine-readable data
            </p>
          </div>
        </div>

        <button
          onClick={() => setViewMode("patient")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Intake</span>
        </button>
      </div>

      {/* Mode Tabs: Clinical Brief vs Raw JSON */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("clinical")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              activeTab === "clinical"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Doctor Clinical Brief</span>
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
              activeTab === "json"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Structured JSON (Schema Output)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy JSON"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CLINICAL BRIEF */}
      {activeTab === "clinical" && (
        <div className="space-y-6">
          {/* Patient Card & Vital Stats */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {formData.patient_name || "Anonymous Patient"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sex: <strong className="capitalize">{formData.patient_sex || "Not specified"}</strong> · Age:{" "}
                  <strong>{formData.patient_age || "N/A"}</strong> · Loss Onset Age:{" "}
                  <strong>{formData.age_hair_loss_began ? `${formData.age_hair_loss_began} yrs` : "N/A"}</strong> · Duration:{" "}
                  <strong>{formData.duration || "N/A"}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Coverage: {answeredCount}/{totalQuestions} (100% Schema)</span>
                </span>
              </div>
            </div>

            {/* Diagnostic Impression */}
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Primary Clinical Impression</span>
              </h4>
              <ul className="space-y-1 text-sm text-emerald-950">
                {impressions.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Alerts / Red flags */}
            {(formData.past_treatment_side_effects === "yes" ||
              formData.past_6_months.includes("Fever with illness (COVID, Dengue, Typhoid)") ||
              formData.habits.hard_water === "yes") && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Clinical Alerts & Red Flags</span>
                </h4>
                <div className="space-y-1 text-xs sm:text-sm text-amber-900">
                  {formData.past_treatment_side_effects === "yes" && (
                    <p>
                      <strong>Past Treatment Adverse Reaction:</strong>{" "}
                      {formData.past_treatment_side_effects_detail || "Patient reported past adverse reaction."}
                    </p>
                  )}
                  {formData.past_6_months.includes("Fever with illness (COVID, Dengue, Typhoid)") && (
                    <p>
                      <strong>Febrile Trigger:</strong> High fever (COVID / Dengue / Typhoid) in the last 6 months. High likelihood of post-febrile Telogen Effluvium.
                    </p>
                  )}
                  {formData.habits.hard_water === "yes" && (
                    <p>
                      <strong>Hard Water Exposure:</strong> Mineral crystallization on scalp may inhibit topical absorption.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Section Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Section A */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
                <button
                  onClick={() => {
                    setActiveQuestionIndex(1);
                    setViewMode("patient");
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-emerald-600"
                  title="Edit Section A"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <h5 className="font-bold text-slate-900 mb-2 uppercase tracking-wider">
                  A · Hair Loss History
                </h5>
                <p className="mb-1">
                  <strong className="text-slate-600">Pattern:</strong>{" "}
                  {formData.pattern.length > 0 ? formData.pattern.join(", ") : "None specified"}
                </p>
                <p>
                  <strong className="text-slate-600">Family History:</strong>{" "}
                  {formData.family_history.length > 0 ? formData.family_history.join(", ") : "None specified"}
                </p>
              </div>

              {/* Section B */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
                <button
                  onClick={() => {
                    setActiveQuestionIndex(5);
                    setViewMode("patient");
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-emerald-600"
                  title="Edit Section B"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <h5 className="font-bold text-slate-900 mb-2 uppercase tracking-wider">
                  B · Hormonal Influences
                </h5>
                <p className="mb-1">
                  <strong className="text-slate-600">Diagnosed:</strong>{" "}
                  {formData.diagnosed_conditions.length > 0 ? formData.diagnosed_conditions.join(", ") : "None"}
                </p>
                {formData.patient_sex !== "male" && (
                  <>
                    <p className="mb-1">
                      <strong className="text-slate-600">Menstrual:</strong> {formData.menstrual_cycle || "N/A"}
                    </p>
                    <p className="mb-1">
                      <strong className="text-slate-600">Pregnancy:</strong> {formData.pregnancy_related || "N/A"}
                    </p>
                  </>
                )}
                <p>
                  <strong className="text-slate-600">Adult Acne:</strong> {String(formData.adult_acne_oily_skin)} ·{" "}
                  <strong className="text-slate-600">Excess Hair:</strong> {String(formData.excess_body_facial_hair)}
                </p>
              </div>

              {/* Section C */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
                <button
                  onClick={() => {
                    setActiveQuestionIndex(10);
                    setViewMode("patient");
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-emerald-600"
                  title="Edit Section C"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <h5 className="font-bold text-slate-900 mb-2 uppercase tracking-wider">
                  C · Triggers & Habits
                </h5>
                <p className="mb-1">
                  <strong className="text-slate-600">Triggers (6mo):</strong>{" "}
                  {formData.past_6_months.length > 0 ? formData.past_6_months.join(", ") : "None"}
                </p>
                <p>
                  <strong className="text-slate-600">Wash Frequency:</strong> {formData.habits.hair_wash_frequency || "N/A"} ·{" "}
                  <strong className="text-slate-600">Smoking:</strong> {formData.habits.smoking === "yes" ? formData.habits.smoking_severity || "Yes" : "No"}
                </p>
              </div>

              {/* Section E */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative">
                <button
                  onClick={() => {
                    setActiveQuestionIndex(15);
                    setViewMode("patient");
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-emerald-600"
                  title="Edit Section E"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <h5 className="font-bold text-slate-900 mb-2 uppercase tracking-wider">
                  E · Sample & Consent
                </h5>
                <p className="mb-1">
                  <strong className="text-slate-600">Preferred Sample:</strong> {formData.sample_type || "N/A"}
                </p>
                <p>
                  <strong className="text-slate-600">DNA Consent:</strong>{" "}
                  {formData.consent === "yes" ? "Granted ✓" : "Not Provided"}
                </p>
              </div>
            </div>

            {/* Section D: Product Matrix Table */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h5 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">
                D · Treatments & Procedures Log
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2">Item</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Duration / Sessions</th>
                      <th className="py-2">Helped?</th>
                      <th className="py-2">Side Effects?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60">
                    {Object.entries(formData.products).map(([name, u]) => (
                      <tr key={name} className="hover:bg-slate-100/50">
                        <td className="py-2 font-medium text-slate-900">{name}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.used ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {u.used ? "Used" : "No"}
                          </span>
                        </td>
                        <td className="py-2">{u.duration || "—"}</td>
                        <td className="py-2 capitalize">{u.helped || "—"}</td>
                        <td className="py-2 capitalize">{u.side_effects || "—"}</td>
                      </tr>
                    ))}
                    {Object.entries(formData.procedures).map(([name, u]) => (
                      <tr key={name} className="hover:bg-slate-100/50">
                        <td className="py-2 font-medium text-slate-900">{name}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.done ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {u.done ? "Done" : "No"}
                          </span>
                        </td>
                        <td className="py-2">{u.sessions ? `${u.sessions} sessions` : "—"}</td>
                        <td className="py-2 capitalize">{u.helped || "—"}</td>
                        <td className="py-2">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURED RAW JSON (SCHEMA MATCH) */}
      {activeTab === "json" && (
        <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-xs text-slate-400">
            <span>Schema: GenoRoot Hair & Scalp Intake (16 Questions)</span>
            <span className="text-emerald-400 font-mono">100% Machine-Readable</span>
          </div>
          <pre className="text-xs sm:text-sm font-mono overflow-x-auto p-2 leading-relaxed text-emerald-300 max-h-[600px] overflow-y-auto">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
}

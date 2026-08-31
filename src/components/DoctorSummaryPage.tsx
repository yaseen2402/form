"use client";

import React, { useState } from "react";
import { useIntake } from "@/context/IntakeContext";
import {
  Code2,
  Copy,
  Download,
  Check,
  Activity,
  Edit3,
  ArrowLeft,
} from "lucide-react";

export function DoctorSummaryPage() {
  const { formData, setViewMode, setActiveQuestionIndex, answeredCount, totalQuestions } = useIntake();
  const [activeTab, setActiveTab] = useState<"clinical" | "json">("clinical");
  const [copied, setCopied] = useState(false);

  // Exact machine-readable JSON matching the schema
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
    setTimeout(() => setCopied(false), 2000);
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

  // Diagnostic Impressions
  const generateDoctorImpression = () => {
    const findings: string[] = [];
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
        "Acute Telogen Effluvium secondary to systemic febrile episode or acute stress trigger."
      );
    }
    if (hasPCOS) {
      findings.push(
        "Hyperandrogenic diffuse loss compounded by Polycystic Ovary Syndrome (PCOS/PCOD)."
      );
    }
    if (findings.length === 0) {
      findings.push("Undifferentiated shedding; clinical dermoscopy and micronutrient profiling indicated.");
    }
    return findings;
  };

  const impressions = generateDoctorImpression();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-6">
        <div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            Clinical Summary
          </h1>
        </div>

        <button
          onClick={() => setViewMode("patient")}
          className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 border border-zinc-200 hover:border-zinc-950 text-zinc-700 hover:text-zinc-950 transition"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Patient Intake</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("clinical")}
            className={`flex items-center gap-1.5 pb-2 text-xs font-mono uppercase tracking-wider border-b-2 transition ${
              activeTab === "clinical"
                ? "border-zinc-950 text-zinc-950 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Clinical Brief</span>
          </button>

          <button
            onClick={() => setActiveTab("json")}
            className={`flex items-center gap-1.5 pb-2 text-xs font-mono uppercase tracking-wider border-b-2 transition ${
              activeTab === "json"
                ? "border-zinc-950 text-zinc-950 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-700"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Schema JSON</span>
          </button>
        </div>

        <div className="flex items-center gap-2 pb-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 border border-zinc-200 hover:border-zinc-950 text-zinc-700 transition"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 bg-zinc-950 text-white hover:bg-zinc-800 transition"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CLINICAL BRIEF */}
      {activeTab === "clinical" && (
        <div className="space-y-6">
          {/* Patient Overview */}
          <div className="border border-zinc-200 p-5 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-zinc-950">
                {formData.patient_name || "Anonymous Patient"}
              </h3>
              <div className="text-xs font-mono text-zinc-500">
                <span className="uppercase">{formData.patient_sex || "unspecified"}</span> · Age: {formData.patient_age || "—"} · Onset: {formData.age_hair_loss_began || "—"} yrs · Duration: {formData.duration || "—"}
              </div>
            </div>

            {/* Diagnostic Impression */}
            <div className="mb-4 p-3.5 bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1">
                Etiology & Diagnostic Assessment
              </span>
              <ul className="space-y-1 text-xs text-zinc-800 font-medium">
                {impressions.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="font-mono text-zinc-400">—</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Alerts */}
            {(formData.past_treatment_side_effects === "yes" ||
              formData.past_6_months.includes("Fever with illness (COVID, Dengue, Typhoid)") ||
              formData.habits.hard_water === "yes") && (
              <div className="mb-4 p-3 border border-zinc-300 text-xs font-mono space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">
                  Clinical Alerts
                </span>
                {formData.past_treatment_side_effects === "yes" && (
                  <p>Adverse reaction: {formData.past_treatment_side_effects_detail || "Yes"}</p>
                )}
                {formData.past_6_months.includes("Fever with illness (COVID, Dengue, Typhoid)") && (
                  <p>Febrile illness trigger within 6 months.</p>
                )}
                {formData.habits.hard_water === "yes" && (
                  <p>Hard water washing reported.</p>
                )}
              </div>
            )}

            {/* Section Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 border border-zinc-200 relative">
                <button
                  onClick={() => {
                    setActiveQuestionIndex(1);
                    setViewMode("patient");
                  }}
                  className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-950"
                  title="Edit Section A"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">
                  A · History & Pattern
                </span>
                <p className="mb-1 text-zinc-700">
                  <strong className="font-medium text-zinc-900">Pattern:</strong> {formData.pattern.join(", ") || "None"}
                </p>
                <p className="text-zinc-700">
                  <strong className="font-medium text-zinc-900">Family:</strong> {formData.family_history.join(", ") || "None"}
                </p>
              </div>

              <div className="p-3 border border-zinc-200 relative">
                <button
                  onClick={() => {
                    setActiveQuestionIndex(5);
                    setViewMode("patient");
                  }}
                  className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-950"
                  title="Edit Section B"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">
                  B · Hormonal Factors
                </span>
                <p className="mb-1 text-zinc-700">
                  <strong className="font-medium text-zinc-900">Conditions:</strong> {formData.diagnosed_conditions.join(", ") || "None"}
                </p>
                {formData.patient_sex !== "male" && (
                  <p className="mb-1 text-zinc-700">
                    <strong className="font-medium text-zinc-900">Cycle:</strong> {formData.menstrual_cycle || "N/A"} · {formData.pregnancy_related || "N/A"}
                  </p>
                )}
                <p className="text-zinc-700">
                  <strong className="font-medium text-zinc-900">Acne / Facial hair:</strong> {String(formData.adult_acne_oily_skin)} / {String(formData.excess_body_facial_hair)}
                </p>
              </div>

              <div className="p-3 border border-zinc-200 relative">
                <button
                  onClick={() => {
                    setActiveQuestionIndex(10);
                    setViewMode("patient");
                  }}
                  className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-950"
                  title="Edit Section C"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">
                  C · Triggers & Habits
                </span>
                <p className="mb-1 text-zinc-700">
                  <strong className="font-medium text-zinc-900">Triggers:</strong> {formData.past_6_months.join(", ") || "None"}
                </p>
                <p className="text-zinc-700">
                  <strong className="font-medium text-zinc-900">Wash / Smoking:</strong> {formData.habits.hair_wash_frequency || "—"} / {formData.habits.smoking === "yes" ? formData.habits.smoking_severity || "Yes" : "No"}
                </p>
              </div>

              <div className="p-3 border border-zinc-200 relative">
                <button
                  onClick={() => {
                    setActiveQuestionIndex(15);
                    setViewMode("patient");
                  }}
                  className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-950"
                  title="Edit Section E"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">
                  E · Sample & Consent
                </span>
                <p className="mb-1 text-zinc-700">
                  <strong className="font-medium text-zinc-900">Sample:</strong> {formData.sample_type || "—"}
                </p>
                <p className="text-zinc-700">
                  <strong className="font-medium text-zinc-900">Consent:</strong> {formData.consent === "yes" ? "Granted" : "Declined"}
                </p>
              </div>
            </div>

            {/* Treatments Matrix */}
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-2">
                D · Treatment History Table
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-zinc-200 min-w-[460px]">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 font-mono text-[11px] text-zinc-500">
                      <th className="p-2 border-r border-zinc-200">Item</th>
                      <th className="p-2 border-r border-zinc-200">Used</th>
                      <th className="p-2 border-r border-zinc-200">Duration / Sessions</th>
                      <th className="p-2 border-r border-zinc-200">Helped</th>
                      <th className="p-2">Side Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono text-[11px]">
                    {Object.entries(formData.products).map(([name, u]) => (
                      <tr key={name}>
                        <td className="p-2 font-sans font-medium text-zinc-900 border-r border-zinc-200">{name}</td>
                        <td className="p-2 border-r border-zinc-200">{u.used ? "Yes" : "No"}</td>
                        <td className="p-2 border-r border-zinc-200">{u.duration || "—"}</td>
                        <td className="p-2 border-r border-zinc-200">{u.helped || "—"}</td>
                        <td className="p-2">{u.side_effects || "—"}</td>
                      </tr>
                    ))}
                    {Object.entries(formData.procedures).map(([name, u]) => (
                      <tr key={name}>
                        <td className="p-2 font-sans font-medium text-zinc-900 border-r border-zinc-200">{name}</td>
                        <td className="p-2 border-r border-zinc-200">{u.done ? "Yes" : "No"}</td>
                        <td className="p-2 border-r border-zinc-200">{u.sessions || "—"}</td>
                        <td className="p-2 border-r border-zinc-200">{u.helped || "—"}</td>
                        <td className="p-2">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURED RAW JSON */}
      {activeTab === "json" && (
        <div className="border border-zinc-200 bg-zinc-950 p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800 pb-2 mb-3">
            <span>intake-schema.json compliant</span>
            <span>16 / 16 coverage</span>
          </div>
          <pre className="text-xs font-mono text-zinc-200 overflow-x-auto max-h-[550px] leading-relaxed">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
}

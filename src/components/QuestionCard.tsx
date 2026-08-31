"use client";

import React from "react";
import { useIntake } from "@/context/IntakeContext";
import { QUESTIONS_METADATA, PRODUCT_KEYS, PROCEDURE_KEYS } from "@/lib/constants";
import {
  DurationOption,
  FamilyHistoryOption,
  PatternOption,
  DiagnosedConditionOption,
  MenstrualCycleOption,
  PregnancyRelatedOption,
  Past6MonthsOption,
  SmokingSeverity,
  HairWashFrequency,
  SampleTypeOption,
  IntakeFormData,
  HabitsData,
  ProductUsage,
  ProcedureUsage,
} from "@/types/intake";
import { Check, ArrowRight, ArrowLeft, Mic, MicOff, Loader2 } from "lucide-react";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useAutoFormFiller } from "@/hooks/useAutoFormFiller";
import { motion, AnimatePresence } from "framer-motion";

export function QuestionCard() {
  const {
    formData,
    activeQuestionIndex,
    setActiveQuestionIndex,
    updateField,
    updateHabit,
    updateProduct,
    updateProcedure,
    nextStep,
    prevStep,
    setViewMode,
    liveTranscript,
    recentFieldUpdates,
  } = useIntake();

  const { startListening, stopListening, isListening } = useVoiceAssistant();
  const { isFormFillerActive, flushRemaining } = useAutoFormFiller();

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      flushRemaining();
    } else {
      startListening();
    }
  };

  // Intro / Demographics Screen (Index 0)
  if (activeQuestionIndex === 0) {
    return (
      <div className="bg-white border border-zinc-200 p-4 sm:p-8 max-w-xl mx-auto">
        <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
          Clinical Intake · Step 00
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 mb-2">
          Patient Intake Assessment
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mb-6 leading-relaxed">
          Provide your hair & scalp clinical background. Tap the &ldquo;Speak Answer&rdquo; button on any question to answer by voice, or tap options directly.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-600 uppercase tracking-wider mb-1">
              Patient Name
            </label>
            <input
              type="text"
              value={formData.patient_name || ""}
              onChange={(e) => updateField("patient_name", e.target.value)}
              placeholder="Full name"
              className="w-full text-sm px-3 py-2 border border-zinc-300 focus:outline-none focus:border-zinc-950 font-medium text-zinc-900 placeholder-zinc-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase tracking-wider mb-1">
                Sex
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateField("patient_sex", "male")}
                  className={`py-2 px-3 border text-xs font-semibold transition ${
                    formData.patient_sex === "male"
                      ? "bg-zinc-950 border-zinc-950 text-white"
                      : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => updateField("patient_sex", "female")}
                  className={`py-2 px-3 border text-xs font-semibold transition ${
                    formData.patient_sex === "female"
                      ? "bg-zinc-950 border-zinc-950 text-white"
                      : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-600 uppercase tracking-wider mb-1">
                Age
              </label>
              <input
                type="number"
                value={formData.patient_age || ""}
                onChange={(e) =>
                  updateField(
                    "patient_age",
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                placeholder="Age"
                min={10}
                max={99}
                className="w-full text-sm px-3 py-2 border border-zinc-300 focus:outline-none focus:border-zinc-950 font-medium text-zinc-900 placeholder-zinc-400"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleMicToggle}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border text-xs font-mono transition ${
                isListening
                  ? "bg-zinc-950 text-white border-zinc-950 animate-pulse"
                  : "bg-white border-zinc-300 hover:border-zinc-950 text-zinc-800"
              }`}
              title="Start hands-free continuous voice"
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Speak</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveQuestionIndex(1)}
              className="flex-1 py-2.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition flex items-center justify-center gap-2"
            >
              <span>Begin Intake</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const meta = QUESTIONS_METADATA.find((q) => q.n === activeQuestionIndex);
  if (!meta) return null;

  const formattedNum = String(meta.n).padStart(2, "0");

  return (
    <motion.div 
      layout
      className="bg-white border border-zinc-200 p-4 sm:p-8 max-w-2xl mx-auto overflow-hidden"
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-3 border-b border-zinc-100 pb-2">
        <span>Section {meta.sectionId} · {meta.sectionTitle}</span>
        <span className="font-semibold text-zinc-950">{formattedNum} / 16</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeQuestionIndex}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-lg sm:text-xl font-bold text-zinc-950 mb-1.5">
            {meta.title}
          </h2>
          <p className="text-xs text-zinc-500 mb-6">
            {meta.description}
          </p>

          {/* Question Options dispatcher */}
          <div className="mb-6">
            {renderQuestionContent(meta.n, formData, updateField, updateHabit, updateProduct, updateProcedure)}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Inline Live Voice & Intelligent Form Filler Status */}
      {(isListening || liveTranscript || isFormFillerActive) && (
        <div className="mb-4 p-2.5 bg-zinc-50 border border-zinc-200 text-xs font-mono flex items-center justify-between text-zinc-900">
          <div className="flex items-center gap-2 overflow-hidden">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isFormFillerActive
                  ? "bg-zinc-950 animate-bounce"
                  : isListening
                  ? "bg-zinc-950 animate-ping"
                  : "bg-zinc-400"
              }`}
            />
            <span className="truncate">
              {isFormFillerActive
                ? "AI Form Filler evaluating clinical fields..."
                : liveTranscript || "Mic live · Speak answers in any order"}
            </span>
          </div>
          {isListening && (
            <button
              onClick={handleMicToggle}
              className="text-[10px] font-mono px-2 py-0.5 border border-zinc-300 hover:border-zinc-950 text-zinc-700 hover:text-zinc-950 shrink-0 ml-2"
              title="Stop continuous listening"
            >
              Stop
            </button>
          )}
        </div>
      )}

      {recentFieldUpdates.length > 0 && (
        <div className="mb-4 p-2 bg-zinc-100 border border-zinc-300 text-xs font-mono text-zinc-950 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 shrink-0 text-zinc-950" />
          <span>Filled: {recentFieldUpdates.join(", ")}</span>
        </div>
      )}

      {/* Navigation Footer with Voice Button in the same row */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 gap-1 sm:gap-2 flex-nowrap">
        <button
          onClick={prevStep}
          className="flex items-center gap-1 text-xs font-mono text-zinc-600 hover:text-zinc-950 px-2 py-1.5 transition whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Prev</span>
        </button>

        {/* Continuous Hands-Free Voice Button */}
        <button
          onClick={handleMicToggle}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-mono border transition whitespace-nowrap shrink-0 ${
            isListening
              ? "bg-zinc-950 text-white border-zinc-950 animate-pulse"
              : "bg-white border-zinc-300 hover:border-zinc-950 text-zinc-800"
          }`}
          title={isListening ? "Microphone is streaming speech. Tap to stop." : "Tap once to speak answers"}
        >
          {isFormFillerActive ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span className="whitespace-nowrap">AI Filling...</span>
            </>
          ) : isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap font-medium">
                Mic Live <span className="hidden sm:inline">(Listening)</span>
              </span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                Start <span className="hidden sm:inline">Voice</span>
              </span>
            </>
          )}
        </button>

        <div className="shrink-0">
          {activeQuestionIndex < 16 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1 text-xs font-semibold px-3 sm:px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white transition whitespace-nowrap shrink-0"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : (
            <button
              onClick={() => setViewMode("doctor_summary")}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 sm:px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white transition whitespace-nowrap shrink-0"
            >
              <span>Summary</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Question body dispatcher with pure monochrome UI
function renderQuestionContent(
  n: number,
  formData: IntakeFormData,
  updateField: (key: any, val: any) => void,
  updateHabit: (key: keyof HabitsData, val: any) => void,
  updateProduct: (product: any, patch: Partial<ProductUsage>) => void,
  updateProcedure: (procedure: any, patch: Partial<ProcedureUsage>) => void
) {
  switch (n) {
    // Q1: Age hair loss began
    case 1: {
      const age = formData.age_hair_loss_began;
      const presets = [18, 22, 25, 30, 35, 40, 45, 50];
      return (
        <div className="space-y-4">
          <div className="max-w-xs">
            <label className="block text-xs font-mono text-zinc-500 mb-1">
              Enter age:
            </label>
            <input
              type="number"
              value={age ?? ""}
              onChange={(e) =>
                updateField(
                  "age_hair_loss_began",
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
              placeholder="e.g. 28"
              min={10}
              max={99}
              className="w-full text-base font-mono p-2.5 border border-zinc-300 focus:outline-none focus:border-zinc-950 text-zinc-900"
            />
          </div>
          <div>
            <span className="text-[11px] font-mono text-zinc-400 block mb-2">
              Common presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => updateField("age_hair_loss_began", p)}
                  className={`px-3 py-1.5 text-xs font-mono border transition ${
                    age === p
                      ? "bg-zinc-950 border-zinc-950 text-white"
                      : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {p} yrs
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Q2: Duration
    case 2: {
      const options: DurationOption[] = [
        "Less than 6 months",
        "6-12 months",
        "Over a year",
      ];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {options.map((opt) => {
            const selected = formData.duration === opt;
            return (
              <button
                key={opt}
                onClick={() => updateField("duration", opt)}
                className={`p-3.5 border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-medium">{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q3: Family history
    case 3: {
      const options: FamilyHistoryOption[] = [
        "Father had hair loss",
        "Mother had hair loss",
        "Siblings with thinning or baldness",
        "No known family history",
      ];
      const selectedList: FamilyHistoryOption[] = formData.family_history || [];

      const toggle = (opt: FamilyHistoryOption) => {
        if (opt === "No known family history") {
          updateField("family_history", [opt]);
          return;
        }
        let updated = selectedList.filter((x) => x !== "No known family history");
        if (updated.includes(opt)) {
          updated = updated.filter((x) => x !== opt);
        } else {
          updated.push(opt);
        }
        updateField("family_history", updated);
      };

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const selected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`p-3.5 border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-medium">{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q4: Pattern
    case 4: {
      const options: PatternOption[] = [
        "Receding hairline",
        "Thinning at crown",
        "Widening part line",
        "Diffuse thinning",
        "Patchy loss",
        "Sudden excessive shedding",
      ];
      const selectedList: PatternOption[] = formData.pattern || [];

      const toggle = (opt: PatternOption) => {
        let updated = [...selectedList];
        if (updated.includes(opt)) {
          updated = updated.filter((x) => x !== opt);
        } else {
          updated.push(opt);
        }
        updateField("pattern", updated);
      };

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const selected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`p-3.5 border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-medium">{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q5: Diagnosed conditions
    case 5: {
      const options: DiagnosedConditionOption[] = [
        "PCOS/PCOD",
        "Thyroid disorder",
        "Diabetes",
        "Autoimmune disease",
        "Anemia",
        "None",
      ];
      const selectedList: DiagnosedConditionOption[] = formData.diagnosed_conditions || [];

      const toggle = (opt: DiagnosedConditionOption) => {
        if (opt === "None") {
          updateField("diagnosed_conditions", ["None"]);
          return;
        }
        let updated = selectedList.filter((x) => x !== "None");
        if (updated.includes(opt)) {
          updated = updated.filter((x) => x !== opt);
        } else {
          updated.push(opt);
          if (opt === "PCOS/PCOD") {
            updateField("patient_sex", "female");
          }
        }
        updateField("diagnosed_conditions", updated);
      };

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const selected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`p-3.5 border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-medium">{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q6: Menstrual cycle
    case 6: {
      const options: MenstrualCycleOption[] = [
        "Regular",
        "Irregular",
        "Menopausal",
        "Not applicable",
      ];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const selected = formData.menstrual_cycle === opt;
            return (
              <button
                key={opt}
                onClick={() => updateField("menstrual_cycle", opt)}
                className={`p-3.5 border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-medium">{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q7: Pregnancy-related
    case 7: {
      const options: PregnancyRelatedOption[] = [
        "Currently pregnant",
        "Postpartum <1 year",
        "Not applicable",
      ];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {options.map((opt) => {
            const selected = formData.pregnancy_related === opt;
            return (
              <button
                key={opt}
                onClick={() => updateField("pregnancy_related", opt)}
                className={`p-3.5 border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-medium">{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q8: Adult acne
    case 8: {
      const val = formData.adult_acne_oily_skin;
      return (
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <button
            onClick={() => updateField("adult_acne_oily_skin", "yes")}
            className={`py-3 px-4 border text-center text-xs font-semibold transition ${
              val === "yes" || val === true
                ? "bg-zinc-950 border-zinc-950 text-white"
                : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField("adult_acne_oily_skin", "no")}
            className={`py-3 px-4 border text-center text-xs font-semibold transition ${
              val === "no" || val === false
                ? "bg-zinc-950 border-zinc-950 text-white"
                : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
            }`}
          >
            No
          </button>
        </div>
      );
    }

    // Q9: Excess body / facial hair
    case 9: {
      const val = formData.excess_body_facial_hair;
      return (
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <button
            onClick={() => updateField("excess_body_facial_hair", "yes")}
            className={`py-3 px-4 border text-center text-xs font-semibold transition ${
              val === "yes" || val === true
                ? "bg-zinc-950 border-zinc-950 text-white"
                : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField("excess_body_facial_hair", "no")}
            className={`py-3 px-4 border text-center text-xs font-semibold transition ${
              val === "no" || val === false
                ? "bg-zinc-950 border-zinc-950 text-white"
                : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
            }`}
          >
            No
          </button>
        </div>
      );
    }

    // Q10: Past 6 months triggers
    case 10: {
      const options: Past6MonthsOption[] = [
        "Crash dieting or major weight loss",
        "High stress or emotional trauma",
        "Fever with illness (COVID, Dengue, Typhoid)",
        "Recent surgery",
        "Change in location/water/air quality",
      ];
      const selectedList: Past6MonthsOption[] = formData.past_6_months || [];

      const toggle = (opt: Past6MonthsOption) => {
        let updated = [...selectedList];
        if (updated.includes(opt)) {
          updated = updated.filter((x) => x !== opt);
        } else {
          updated.push(opt);
        }
        updateField("past_6_months", updated);
      };

      return (
        <div className="space-y-1.5">
          {options.map((opt) => {
            const selected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`w-full p-3 border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-medium">{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q11: Habits
    case 11: {
      const h = formData.habits || {};
      return (
        <div className="space-y-3">
          {/* Smoking */}
          <div className="p-3 border border-zinc-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-900">Smoking</span>
              <div className="flex gap-1">
                <button
                  onClick={() => updateHabit("smoking", "no")}
                  className={`px-2.5 py-1 text-xs border ${
                    h.smoking === "no" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => updateHabit("smoking", "yes")}
                  className={`px-2.5 py-1 text-xs border ${
                    h.smoking === "yes" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
            {h.smoking === "yes" && (
              <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400">Severity:</span>
                {(["Mild <5/day", "Moderate 5-10/day", "Severe >10/day"] as SmokingSeverity[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateHabit("smoking_severity", s)}
                    className={`px-2 py-0.5 text-[11px] font-mono border ${
                      h.smoking_severity === s ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hard water */}
          <div className="p-3 border border-zinc-200 bg-white flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-900">Hard water used for hair wash?</span>
            <div className="flex gap-1">
              <button
                onClick={() => updateHabit("hard_water", "no")}
                className={`px-2.5 py-1 text-xs border ${
                  h.hard_water === "no" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                }`}
              >
                No
              </button>
              <button
                onClick={() => updateHabit("hard_water", "yes")}
                className={`px-2.5 py-1 text-xs border ${
                  h.hard_water === "yes" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {/* Wash frequency */}
          <div className="p-3 border border-zinc-200 bg-white">
            <span className="text-xs font-medium text-zinc-900 block mb-2">Wash frequency:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(["Daily", "Alternate Days", "Weekly"] as HairWashFrequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => updateHabit("hair_wash_frequency", f)}
                  className={`py-1.5 text-xs font-medium border text-center ${
                    h.hair_wash_frequency === f ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Styling & Salon */}
          <div className="p-3 border border-zinc-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-900">Heat tools / styling chemicals?</span>
              <div className="flex gap-1">
                <button
                  onClick={() => updateHabit("heating_tools_styling_chemicals", "no")}
                  className={`px-2.5 py-1 text-xs border ${
                    h.heating_tools_styling_chemicals === "no" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => updateHabit("heating_tools_styling_chemicals", "yes")}
                  className={`px-2.5 py-1 text-xs border ${
                    h.heating_tools_styling_chemicals === "yes" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
              <span className="text-xs font-medium text-zinc-900">Salon treatments (keratin, etc.)?</span>
              <div className="flex gap-1">
                <button
                  onClick={() => updateHabit("salon_treatments", "no")}
                  className={`px-2.5 py-1 text-xs border ${
                    h.salon_treatments === "no" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => updateHabit("salon_treatments", "yes")}
                  className={`px-2.5 py-1 text-xs border ${
                    h.salon_treatments === "yes" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
            {h.salon_treatments === "yes" && (
              <input
                type="text"
                value={h.salon_treatment_detail || ""}
                onChange={(e) => updateHabit("salon_treatment_detail", e.target.value)}
                placeholder="Specify treatment (e.g. Keratin 6mo ago)"
                className="w-full text-xs p-2 border border-zinc-300 font-mono"
              />
            )}
          </div>
        </div>
      );
    }

    // Q12: Products (Progressive Disclosure)
    case 12: {
      return (
        <div className="space-y-2">
          {PRODUCT_KEYS.map((key) => {
            const usage = formData.products[key] || { used: false };
            return (
              <div
                key={key}
                className={`p-3 border transition ${
                  usage.used ? "bg-zinc-50 border-zinc-950" : "bg-white border-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-900">{key}</span>
                  <button
                    onClick={() => updateProduct(key, { used: !usage.used })}
                    className={`px-2.5 py-1 text-xs font-mono border transition ${
                      usage.used
                        ? "bg-zinc-950 text-white border-zinc-950"
                        : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    {usage.used ? "Used ✓" : "Never Used"}
                  </button>
                </div>

                {usage.used && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2 text-xs">
                    {/* Duration */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-zinc-500 font-mono text-[11px]">Duration:</span>
                      <div className="flex gap-1 flex-wrap">
                        {(["<3mo", "3-6mo", ">6mo"] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => updateProduct(key, { duration: d })}
                            className={`px-2 py-0.5 text-xs font-mono border ${
                              usage.duration === d
                                ? "bg-zinc-950 text-white border-zinc-950"
                                : "bg-white border-zinc-200 text-zinc-700"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Helped */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-zinc-500 font-mono text-[11px]">Helped:</span>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => updateProduct(key, { helped: "yes" })}
                          className={`px-2 py-0.5 text-xs font-mono border ${
                            usage.helped === "yes" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateProduct(key, { helped: "no" })}
                          className={`px-2 py-0.5 text-xs font-mono border ${
                            usage.helped === "no" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {/* Side effects */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-zinc-500 font-mono text-[11px]">Side effects:</span>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => updateProduct(key, { side_effects: "yes" })}
                          className={`px-2 py-0.5 text-xs font-mono border ${
                            usage.side_effects === "yes" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateProduct(key, { side_effects: "no" })}
                          className={`px-2 py-0.5 text-xs font-mono border ${
                            usage.side_effects === "no" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Q13: In-clinic Procedures
    case 13: {
      return (
        <div className="space-y-2">
          {PROCEDURE_KEYS.map((proc) => {
            const usage = formData.procedures[proc] || { done: false };
            return (
              <div
                key={proc}
                className={`p-3 border transition ${
                  usage.done ? "bg-zinc-50 border-zinc-950" : "bg-white border-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-900">{proc}</span>
                  <button
                    onClick={() => updateProcedure(proc, { done: !usage.done })}
                    className={`px-2.5 py-1 text-xs font-mono border transition ${
                      usage.done
                        ? "bg-zinc-950 text-white border-zinc-950"
                        : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    {usage.done ? "Done ✓" : "Never Done"}
                  </button>
                </div>

                {usage.done && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-zinc-500 font-mono text-[11px]">Sessions:</span>
                      <div className="flex gap-1 flex-wrap">
                        {(["1-3", "4-6", ">6"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateProcedure(proc, { sessions: s })}
                            className={`px-2 py-0.5 text-xs font-mono border ${
                              usage.sessions === s
                                ? "bg-zinc-950 text-white border-zinc-950"
                                : "bg-white border-zinc-200 text-zinc-700"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-zinc-500 font-mono text-[11px]">Helped:</span>
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => updateProcedure(proc, { helped: "yes" })}
                          className={`px-2 py-0.5 text-xs font-mono border ${
                            usage.helped === "yes" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateProcedure(proc, { helped: "no" })}
                          className={`px-2 py-0.5 text-xs font-mono border ${
                            usage.helped === "no" ? "bg-zinc-950 text-white border-zinc-950" : "bg-white text-zinc-700 border-zinc-200"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Q14: Past side effects
    case 14: {
      const val = formData.past_treatment_side_effects;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <button
              onClick={() => updateField("past_treatment_side_effects", "yes")}
              className={`py-3 px-4 border text-center text-xs font-semibold transition ${
                val === "yes" || val === true
                  ? "bg-zinc-950 border-zinc-950 text-white"
                  : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => updateField("past_treatment_side_effects", "no")}
              className={`py-3 px-4 border text-center text-xs font-semibold transition ${
                val === "no" || val === false
                  ? "bg-zinc-950 border-zinc-950 text-white"
                  : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
              }`}
            >
              No
            </button>
          </div>

          {(val === "yes" || val === true) && (
            <div className="pt-2">
              <label className="block text-xs font-mono text-zinc-500 mb-1">
                Describe reaction:
              </label>
              <textarea
                rows={2}
                value={formData.past_treatment_side_effects_detail || ""}
                onChange={(e) =>
                  updateField("past_treatment_side_effects_detail", e.target.value)
                }
                placeholder="e.g. Scalp dermatitis or irritation with minoxidil"
                className="w-full text-xs p-2.5 border border-zinc-300 focus:border-zinc-950 text-zinc-900"
              />
            </div>
          )}
        </div>
      );
    }

    // Q15: Sample type
    case 15: {
      const options: SampleTypeOption[] = ["Saliva", "Blood", "Either"];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {options.map((opt) => {
            const selected = formData.sample_type === opt;
            return (
              <button
                key={opt}
                onClick={() => updateField("sample_type", opt)}
                className={`p-3.5 border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-zinc-950 border-zinc-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
                }`}
              >
                <span className="text-xs font-medium">{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q16: Consent
    case 16: {
      const val = formData.consent;
      return (
        <div className="space-y-4">
          <p className="p-3 border border-zinc-200 bg-zinc-50 text-xs text-zinc-600 leading-relaxed font-mono">
            I hereby consent to hair and scalp sample collection (saliva or blood) and relevant trichological biomarker analysis for clinical evaluation.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <button
              onClick={() => updateField("consent", "yes")}
              className={`py-3 px-4 border text-center text-xs font-semibold transition ${
                val === "yes" || val === true
                  ? "bg-zinc-950 border-zinc-950 text-white"
                  : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
              }`}
            >
              Consent
            </button>
            <button
              onClick={() => updateField("consent", "no")}
              className={`py-3 px-4 border text-center text-xs font-semibold transition ${
                val === "no" || val === false
                  ? "bg-zinc-950 border-zinc-950 text-white"
                  : "bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400"
              }`}
            >
              Decline
            </button>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

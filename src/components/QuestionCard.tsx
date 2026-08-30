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
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Info,
  Calendar,
} from "lucide-react";

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
  } = useIntake();

  // Intro / Demographics Screen (Index 0)
  if (activeQuestionIndex === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-200">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-4 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Patient Concierge</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Welcome to GenoRoot Clinic
        </h2>
        <p className="text-slate-600 text-sm sm:text-base mb-6 leading-relaxed">
          Before your doctor consultation, we will build your complete hair & scalp clinical picture.
          You can simply tap the voice mic to speak, or tap the options below.
        </p>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name (or Preferred Name)
            </label>
            <input
              type="text"
              value={formData.patient_name || ""}
              onChange={(e) => updateField("patient_name", e.target.value)}
              placeholder="e.g., Ramesh Sharma"
              className="w-full text-base px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Biological Sex
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField("patient_sex", "male")}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition ${
                    formData.patient_sex === "male"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => updateField("patient_sex", "female")}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition ${
                    formData.patient_sex === "female"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Female
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Age
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
                placeholder="e.g., 45"
                min={10}
                max={99}
                className="w-full text-base px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {formData.patient_sex === "male" && (
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Female-specific hormonal questions (menstrual & pregnancy) will be automatically bypassed.
              </span>
            </p>
          )}

          <button
            onClick={() => setActiveQuestionIndex(1)}
            className="w-full mt-4 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base transition flex items-center justify-center gap-2 shadow-md"
          >
            <span>Start Hair Assessment</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const meta = QUESTIONS_METADATA.find((q) => q.n === activeQuestionIndex);
  if (!meta) return null;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-200">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          Section {meta.sectionId} · Question {meta.n} of 16
        </span>
        <span className="text-xs text-slate-400 font-medium">
          {meta.sectionTitle}
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 leading-snug">
        {meta.title}
      </h2>
      <p className="text-slate-600 text-xs sm:text-sm mb-6">
        {meta.description}
      </p>

      {/* Render Question Content */}
      <div className="mb-8">
        {renderQuestionContent(meta.n, formData, updateField, updateHabit, updateProduct, updateProcedure)}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-5 border-t border-slate-100 gap-3">
        <button
          onClick={prevStep}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {activeQuestionIndex < 16 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setViewMode("doctor_summary")}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition shadow-md"
            >
              <span>Complete & View Doctor Brief</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Question body dispatcher
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Enter exact age:
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
              placeholder="e.g. 26"
              min={10}
              max={99}
              className="w-full text-xl font-bold p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-2 font-medium">
              Or tap a common onset age:
            </span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => updateField("age_hair_loss_began", p)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition ${
                    age === p
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Age {p}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((opt) => {
            const selected = formData.duration === opt;
            return (
              <button
                key={opt}
                onClick={() => updateField("duration", opt)}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between min-h-[90px] ${
                  selected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Calendar className={`w-5 h-5 ${selected ? "text-emerald-600" : "text-slate-400"}`} />
                  {selected && <Check className="w-5 h-5 text-emerald-600" />}
                </div>
                <span className="font-bold text-sm sm:text-base">{opt}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const selected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="font-medium text-sm sm:text-base">{opt}</span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                    selected
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected && <Check className="w-4 h-4" />}
                </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const selected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div>
                  <span className="font-semibold text-sm sm:text-base block">{opt}</span>
                  <span className="text-xs text-slate-500">
                    {opt === "Receding hairline" && "Frontal forehead temples"}
                    {opt === "Thinning at crown" && "Vertex top of head"}
                    {opt === "Widening part line" && "Middle partition line"}
                    {opt === "Diffuse thinning" && "Overall loss across scalp"}
                    {opt === "Patchy loss" && "Distinct circular patches"}
                    {opt === "Sudden excessive shedding" && "Clumps in shower/comb"}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition ${
                    selected
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected && <Check className="w-4 h-4" />}
                </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const selected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div>
                  <span className="font-semibold text-sm sm:text-base block">{opt}</span>
                  <span className="text-xs text-slate-500">
                    {opt === "PCOS/PCOD" && "Polycystic ovary syndrome"}
                    {opt === "Thyroid disorder" && "Hypo / Hyperthyroidism"}
                    {opt === "Anemia" && "Low iron / ferritin"}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition ${
                    selected
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected && <Check className="w-4 h-4" />}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // Q6: Menstrual cycle (female only)
    case 6: {
      const options: MenstrualCycleOption[] = [
        "Regular",
        "Irregular",
        "Menopausal",
        "Not applicable",
      ];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((opt) => {
            const selected = formData.menstrual_cycle === opt;
            return (
              <button
                key={opt}
                onClick={() => updateField("menstrual_cycle", opt)}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="font-semibold text-sm sm:text-base">{opt}</span>
                {selected && <Check className="w-5 h-5 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q7: Pregnancy-related (female only)
    case 7: {
      const options: PregnancyRelatedOption[] = [
        "Currently pregnant",
        "Postpartum <1 year",
        "Not applicable",
      ];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((opt) => {
            const selected = formData.pregnancy_related === opt;
            return (
              <button
                key={opt}
                onClick={() => updateField("pregnancy_related", opt)}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between min-h-[90px] ${
                  selected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="font-semibold text-sm sm:text-base">{opt}</span>
                {selected && <Check className="w-5 h-5 text-emerald-600 self-end" />}
              </button>
            );
          })}
        </div>
      );
    }

    // Q8: Adult acne / oily skin
    case 8: {
      const val = formData.adult_acne_oily_skin;
      return (
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <button
            onClick={() => updateField("adult_acne_oily_skin", "yes")}
            className={`py-4 px-6 rounded-xl border text-center font-bold text-base transition ${
              val === "yes" || val === true
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField("adult_acne_oily_skin", "no")}
            className={`py-4 px-6 rounded-xl border text-center font-bold text-base transition ${
              val === "no" || val === false
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
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
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <button
            onClick={() => updateField("excess_body_facial_hair", "yes")}
            className={`py-4 px-6 rounded-xl border text-center font-bold text-base transition ${
              val === "yes" || val === true
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => updateField("excess_body_facial_hair", "no")}
            className={`py-4 px-6 rounded-xl border text-center font-bold text-base transition ${
              val === "no" || val === false
                ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
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
        <div className="space-y-2.5">
          {options.map((opt) => {
            const selected = selectedList.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between ${
                  selected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="font-semibold text-sm sm:text-base">{opt}</span>
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition ${
                    selected
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected && <Check className="w-4 h-4" />}
                </div>
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
        <div className="space-y-4">
          {/* Smoking */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-800">Do you smoke?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateHabit("smoking", "no")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                    h.smoking === "no" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => updateHabit("smoking", "yes")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                    h.smoking === "yes" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
            {h.smoking === "yes" && (
              <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                <span className="text-xs text-slate-600">Severity:</span>
                {(["Mild <5/day", "Moderate 5-10/day", "Severe >10/day"] as SmokingSeverity[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateHabit("smoking_severity", s)}
                    className={`px-2.5 py-1 text-xs rounded-lg border ${
                      h.smoking_severity === s ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hard water */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Hard water used for hair wash?</span>
            <div className="flex gap-2">
              <button
                onClick={() => updateHabit("hard_water", "no")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                  h.hard_water === "no" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white text-slate-700"
                }`}
              >
                No
              </button>
              <button
                onClick={() => updateHabit("hard_water", "yes")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                  h.hard_water === "yes" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white text-slate-700"
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {/* Wash frequency */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-sm font-semibold text-slate-800 block mb-2">Hair wash frequency:</span>
            <div className="grid grid-cols-3 gap-2">
              {(["Daily", "Alternate Days", "Weekly"] as HairWashFrequency[]).map((f) => (
                <button
                  key={f}
                  onClick={() => updateHabit("hair_wash_frequency", f)}
                  className={`py-2 text-xs font-semibold rounded-lg border text-center ${
                    h.hair_wash_frequency === f ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Styling & Salon */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">Heating tools / styling chemicals?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateHabit("heating_tools_styling_chemicals", "no")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                    h.heating_tools_styling_chemicals === "no" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => updateHabit("heating_tools_styling_chemicals", "yes")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                    h.heating_tools_styling_chemicals === "yes" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-800">Salon treatments (keratin, rebonding)?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateHabit("salon_treatments", "no")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                    h.salon_treatments === "no" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => updateHabit("salon_treatments", "yes")}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                    h.salon_treatments === "yes" ? "bg-emerald-600 text-white" : "bg-white text-slate-700"
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
                placeholder="Which salon treatment? (e.g. Keratin 6 months ago)"
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            )}
          </div>
        </div>
      );
    }

    // Q12: Products (Progressive Disclosure)
    case 12: {
      return (
        <div className="space-y-3">
          {PRODUCT_KEYS.map((key) => {
            const usage = formData.products[key] || { used: false };
            return (
              <div
                key={key}
                className={`p-3.5 rounded-xl border transition ${
                  usage.used ? "bg-emerald-50/60 border-emerald-400" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm sm:text-base text-slate-900">{key}</span>
                  <button
                    onClick={() => updateProduct(key, { used: !usage.used })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      usage.used
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {usage.used ? "Used ✓" : "Never Used"}
                  </button>
                </div>

                {usage.used && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2.5 text-xs animate-fade-in">
                    {/* Duration */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Duration:</span>
                      <div className="flex gap-1.5">
                        {(["<3mo", "3-6mo", ">6mo"] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => updateProduct(key, { duration: d })}
                            className={`px-2.5 py-1 rounded-md border ${
                              usage.duration === d
                                ? "bg-emerald-700 text-white border-emerald-700 font-bold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Helped */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Did it help?</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateProduct(key, { helped: "yes" })}
                          className={`px-3 py-1 rounded-md border ${
                            usage.helped === "yes" ? "bg-emerald-700 text-white font-bold" : "bg-white text-slate-700"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateProduct(key, { helped: "no" })}
                          className={`px-3 py-1 rounded-md border ${
                            usage.helped === "no" ? "bg-slate-700 text-white font-bold" : "bg-white text-slate-700"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {/* Side effects */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Any side effects?</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateProduct(key, { side_effects: "yes" })}
                          className={`px-3 py-1 rounded-md border ${
                            usage.side_effects === "yes" ? "bg-rose-600 text-white font-bold" : "bg-white text-slate-700"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateProduct(key, { side_effects: "no" })}
                          className={`px-3 py-1 rounded-md border ${
                            usage.side_effects === "no" ? "bg-emerald-700 text-white font-bold" : "bg-white text-slate-700"
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
        <div className="space-y-3">
          {PROCEDURE_KEYS.map((proc) => {
            const usage = formData.procedures[proc] || { done: false };
            return (
              <div
                key={proc}
                className={`p-3.5 rounded-xl border transition ${
                  usage.done ? "bg-emerald-50/60 border-emerald-400" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm sm:text-base text-slate-900">{proc}</span>
                  <button
                    onClick={() => updateProcedure(proc, { done: !usage.done })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                      usage.done
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {usage.done ? "Done ✓" : "Never Done"}
                  </button>
                </div>

                {usage.done && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2.5 text-xs animate-fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Sessions done:</span>
                      <div className="flex gap-1.5">
                        {(["1-3", "4-6", ">6"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateProcedure(proc, { sessions: s })}
                            className={`px-2.5 py-1 rounded-md border ${
                              usage.sessions === s
                                ? "bg-emerald-700 text-white border-emerald-700 font-bold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 font-medium">Did it help?</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateProcedure(proc, { helped: "yes" })}
                          className={`px-3 py-1 rounded-md border ${
                            usage.helped === "yes" ? "bg-emerald-700 text-white font-bold" : "bg-white text-slate-700"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => updateProcedure(proc, { helped: "no" })}
                          className={`px-3 py-1 rounded-md border ${
                            usage.helped === "no" ? "bg-slate-700 text-white font-bold" : "bg-white text-slate-700"
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
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <button
              onClick={() => updateField("past_treatment_side_effects", "yes")}
              className={`py-4 px-6 rounded-xl border text-center font-bold text-base transition ${
                val === "yes" || val === true
                  ? "bg-rose-600 border-rose-600 text-white shadow-md"
                  : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => updateField("past_treatment_side_effects", "no")}
              className={`py-4 px-6 rounded-xl border text-center font-bold text-base transition ${
                val === "no" || val === false
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
              }`}
            >
              No
            </button>
          </div>

          {(val === "yes" || val === true) && (
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Please describe the side effect or reaction:
              </label>
              <textarea
                rows={2}
                value={formData.past_treatment_side_effects_detail || ""}
                onChange={(e) =>
                  updateField("past_treatment_side_effects_detail", e.target.value)
                }
                placeholder="e.g. Scalp rash, itching with minoxidil, or dizziness..."
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-slate-800"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((opt) => {
            const selected = formData.sample_type === opt;
            return (
              <button
                key={opt}
                onClick={() => updateField("sample_type", opt)}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between min-h-[90px] ${
                  selected
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span className="font-bold text-base sm:text-lg">{opt}</span>
                <span className="text-xs text-slate-500">
                  {opt === "Saliva" && "Simple cheek swab"}
                  {opt === "Blood" && "Micronutrient serum panel"}
                  {opt === "Either" && "Clinic choice"}
                </span>
                {selected && <Check className="w-5 h-5 text-emerald-600 self-end mt-1" />}
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            I hereby consent to hair and scalp sample collection (saliva or blood) and relevant trichological genetic / biochemical biomarker analysis for clinical evaluation and formulation of my personalized treatment plan.
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <button
              onClick={() => updateField("consent", "yes")}
              className={`py-4 px-6 rounded-xl border text-center font-bold text-base transition ${
                val === "yes" || val === true
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                  : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
              }`}
            >
              I Agree & Consent
            </button>
            <button
              onClick={() => updateField("consent", "no")}
              className={`py-4 px-6 rounded-xl border text-center font-bold text-base transition ${
                val === "no" || val === false
                  ? "bg-slate-800 border-slate-800 text-white shadow-md"
                  : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
              }`}
            >
              Do Not Consent
            </button>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

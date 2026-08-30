"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  IntakeFormData,
  ProductRowKey,
  ProcedureRowKey,
  ProductUsage,
  ProcedureUsage,
  HabitsData,
} from "@/types/intake";
import { INITIAL_FORM_DATA, DEMO_PERSONAS } from "@/lib/constants";

// Helper function to inspect what is filled vs what is still empty
export function getFormUnfilledStatus(data: IntakeFormData): {
  alreadyFilled: string[];
  unfilled: string[];
} {
  const alreadyFilled: string[] = [];
  const unfilled: string[] = [];
  const isMale = data.patient_sex === "male";

  // Demographics
  if (data.patient_name) alreadyFilled.push("patient_name");
  else unfilled.push("patient_name");

  if (data.patient_sex) alreadyFilled.push("patient_sex");
  else unfilled.push("patient_sex");

  if (data.patient_age !== null) alreadyFilled.push("patient_age");
  else unfilled.push("patient_age");

  // Q1
  if (data.age_hair_loss_began !== null) alreadyFilled.push("age_hair_loss_began (Q1)");
  else unfilled.push("age_hair_loss_began (Q1)");

  // Q2
  if (data.duration !== null) alreadyFilled.push("duration (Q2)");
  else unfilled.push("duration (Q2)");

  // Q3
  if (data.family_history && data.family_history.length > 0) alreadyFilled.push("family_history (Q3)");
  else unfilled.push("family_history (Q3)");

  // Q4
  if (data.pattern && data.pattern.length > 0) alreadyFilled.push("pattern (Q4)");
  else unfilled.push("pattern (Q4)");

  // Q5
  if (data.diagnosed_conditions && data.diagnosed_conditions.length > 0) alreadyFilled.push("diagnosed_conditions (Q5)");
  else unfilled.push("diagnosed_conditions (Q5)");

  // Q6
  if (isMale) alreadyFilled.push("menstrual_cycle (Q6: Not applicable for male)");
  else if (data.menstrual_cycle) alreadyFilled.push("menstrual_cycle (Q6)");
  else unfilled.push("menstrual_cycle (Q6)");

  // Q7
  if (isMale) alreadyFilled.push("pregnancy_related (Q7: Not applicable for male)");
  else if (data.pregnancy_related) alreadyFilled.push("pregnancy_related (Q7)");
  else unfilled.push("pregnancy_related (Q7)");

  // Q8
  if (data.adult_acne_oily_skin !== null) alreadyFilled.push("adult_acne_oily_skin (Q8)");
  else unfilled.push("adult_acne_oily_skin (Q8)");

  // Q9
  if (data.excess_body_facial_hair !== null) alreadyFilled.push("excess_body_facial_hair (Q9)");
  else unfilled.push("excess_body_facial_hair (Q9)");

  // Q10
  if (data.past_6_months && data.past_6_months.length > 0) alreadyFilled.push("past_6_months (Q10)");
  else unfilled.push("past_6_months (Q10)");

  // Q11
  if (
    data.habits.hair_wash_frequency !== null ||
    data.habits.smoking !== null ||
    data.habits.hard_water !== null
  ) {
    alreadyFilled.push("habits (Q11 wash/smoke/water)");
  } else {
    unfilled.push("habits (Q11 wash/smoke/water)");
  }

  // Q12
  if (Object.values(data.products).some((p) => p.used)) {
    alreadyFilled.push("products (Q12 medications)");
  } else {
    unfilled.push("products (Q12 medications)");
  }

  // Q13
  if (Object.values(data.procedures).some((p) => p.done)) {
    alreadyFilled.push("procedures (Q13 in-clinic)");
  } else {
    unfilled.push("procedures (Q13 in-clinic)");
  }

  // Q14
  if (data.past_treatment_side_effects !== null) alreadyFilled.push("past_treatment_side_effects (Q14)");
  else unfilled.push("past_treatment_side_effects (Q14)");

  // Q15
  if (data.sample_type !== null) alreadyFilled.push("sample_type (Q15)");
  else unfilled.push("sample_type (Q15)");

  // Q16
  if (data.consent !== null) alreadyFilled.push("consent (Q16)");
  else unfilled.push("consent (Q16)");

  return { alreadyFilled, unfilled };
}

interface IntakeContextType {
  formData: IntakeFormData;
  activeQuestionIndex: number;
  viewMode: "patient" | "doctor_summary";
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isMuted: boolean;
  liveTranscript: string;
  lastAgentReply: string;
  recentFieldUpdates: string[];
  prescriptionModalOpen: boolean;

  // Form Filler decoupling
  speechBuffer: string;
  isFormFillerActive: boolean;
  appendSpeech: (text: string) => void;
  clearProcessedSpeech: () => void;
  setIsFormFillerActive: (val: boolean) => void;

  // Setters & Actions
  setViewMode: (mode: "patient" | "doctor_summary") => void;
  setActiveQuestionIndex: (index: number) => void;
  setIsListening: (val: boolean) => void;
  setIsSpeaking: (val: boolean) => void;
  setIsProcessing: (val: boolean) => void;
  setIsMuted: (val: boolean) => void;
  setLiveTranscript: (val: string) => void;
  setLastAgentReply: (val: string) => void;
  setPrescriptionModalOpen: (val: boolean) => void;

  updateField: <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => void;
  updateHabit: <K extends keyof HabitsData>(key: K, value: HabitsData[K]) => void;
  updateProduct: (product: ProductRowKey, patch: Partial<ProductUsage>) => void;
  updateProcedure: (procedure: ProcedureRowKey, patch: Partial<ProcedureUsage>) => void;

  applyExtractedDelta: (
    delta: Partial<IntakeFormData>,
    fieldsUpdated: string[],
    agentReply?: string,
    suggestedNextQuestion?: number
  ) => void;

  loadPersona: (personaId: string) => void;
  resetForm: () => void;
  nextStep: () => void;
  prevStep: () => void;

  // Helper stats
  completionPercentage: number;
  answeredCount: number;
  totalQuestions: number;
}

const IntakeContext = createContext<IntakeContextType | null>(null);

const STORAGE_KEY = "genoroot_hair_intake_v1";

export function IntakeProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<IntakeFormData>(INITIAL_FORM_DATA);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"patient" | "doctor_summary">("patient");

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastAgentReply, setLastAgentReply] = useState("Ready for intake.");
  const [recentFieldUpdates, setRecentFieldUpdates] = useState<string[]>([]);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);

  // Decoupled speech buffer for Auto Form Filler
  const [speechBuffer, setSpeechBuffer] = useState("");
  const [isFormFillerActive, setIsFormFillerActive] = useState(false);

  const appendSpeech = useCallback((text: string) => {
    if (!text) return;
    setSpeechBuffer((prev) => (prev ? prev + " " + text : text));
  }, []);

  const clearProcessedSpeech = useCallback(() => {
    setSpeechBuffer("");
  }, []);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      console.warn("Error hydrating intake from localStorage", e);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.warn("Error persisting intake", e);
    }
  }, [formData]);

  const updateField = useCallback(
    <K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => {
      setFormData((prev) => {
        const updated = { ...prev, [key]: value };
        if (key === "patient_sex" && value === "male") {
          updated.menstrual_cycle = "Not applicable";
          updated.pregnancy_related = "Not applicable";
        }
        return updated;
      });
    },
    []
  );

  const updateHabit = useCallback(
    <K extends keyof HabitsData>(key: K, value: HabitsData[K]) => {
      setFormData((prev) => ({
        ...prev,
        habits: {
          ...prev.habits,
          [key]: value,
        },
      }));
    },
    []
  );

  const updateProduct = useCallback(
    (product: ProductRowKey, patch: Partial<ProductUsage>) => {
      setFormData((prev) => ({
        ...prev,
        products: {
          ...prev.products,
          [product]: {
            ...prev.products[product],
            ...patch,
          },
        },
      }));
    },
    []
  );

  const updateProcedure = useCallback(
    (procedure: ProcedureRowKey, patch: Partial<ProcedureUsage>) => {
      setFormData((prev) => ({
        ...prev,
        procedures: {
          ...prev.procedures,
          [procedure]: {
            ...prev.procedures[procedure],
            ...patch,
          },
        },
      }));
    },
    []
  );

  // Check whether a question index is answered
  const checkQuestionAnswered = (idx: number, data: IntakeFormData): boolean => {
    const isMale = data.patient_sex === "male";
    switch (idx) {
      case 0:
        return !!data.patient_name && !!data.patient_sex && data.patient_age !== null;
      case 1:
        return data.age_hair_loss_began !== null;
      case 2:
        return data.duration !== null;
      case 3:
        return !!data.family_history && data.family_history.length > 0;
      case 4:
        return !!data.pattern && data.pattern.length > 0;
      case 5:
        return !!data.diagnosed_conditions && data.diagnosed_conditions.length > 0;
      case 6:
        return isMale || data.menstrual_cycle !== null;
      case 7:
        return isMale || data.pregnancy_related !== null;
      case 8:
        return data.adult_acne_oily_skin !== null;
      case 9:
        return data.excess_body_facial_hair !== null;
      case 10:
        return !!data.past_6_months && data.past_6_months.length > 0;
      case 11:
        return (
          data.habits.hair_wash_frequency !== null ||
          data.habits.smoking !== null ||
          data.habits.hard_water !== null
        );
      case 12:
        return Object.values(data.products).some((p) => p.used);
      case 13:
        return Object.values(data.procedures).some((p) => p.done);
      case 14:
        return data.past_treatment_side_effects !== null;
      case 15:
        return data.sample_type !== null;
      case 16:
        return data.consent !== null;
      default:
        return false;
    }
  };

  const applyExtractedDelta = useCallback(
    (
      delta: Partial<IntakeFormData>,
      fieldsUpdated: string[],
      agentReply?: string,
      suggestedNextQuestion?: number
    ) => {
      let nextState: IntakeFormData | null = null;

      setFormData((prev) => {
        const next = { ...prev };

        for (const [k, v] of Object.entries(delta)) {
          if (v === undefined || v === null) continue;
          if (k === "habits") {
            next.habits = { ...next.habits, ...(v as HabitsData) };
          } else if (k === "products") {
            next.products = { ...next.products, ...(v as Record<ProductRowKey, ProductUsage>) };
          } else if (k === "procedures") {
            next.procedures = { ...next.procedures, ...(v as Record<ProcedureRowKey, ProcedureUsage>) };
          } else {
            (next as any)[k] = v;
          }
        }

        if (next.patient_sex === "male") {
          next.menstrual_cycle = "Not applicable";
          next.pregnancy_related = "Not applicable";
        }

        nextState = next;
        return next;
      });

      if (fieldsUpdated.length > 0) {
        setRecentFieldUpdates(fieldsUpdated);
        setTimeout(() => setRecentFieldUpdates([]), 4500);
      }

      if (agentReply) {
        setLastAgentReply(agentReply);
      }

      // Auto-advancement when active question is answered
      if (nextState) {
        const state = nextState as IntakeFormData;
        const isMale = state.patient_sex === "male";
        const currentAnswered = checkQuestionAnswered(activeQuestionIndex, state);

        if (currentAnswered) {
          let nextUnanswered = activeQuestionIndex + 1;
          while (nextUnanswered <= 16) {
            if (isMale && (nextUnanswered === 6 || nextUnanswered === 7)) {
              nextUnanswered++;
              continue;
            }
            if (!checkQuestionAnswered(nextUnanswered, state)) {
              break;
            }
            nextUnanswered++;
          }

          if (nextUnanswered > activeQuestionIndex && nextUnanswered <= 16) {
            setTimeout(() => {
              setActiveQuestionIndex(nextUnanswered);
            }, 600);
          }
        } else if (suggestedNextQuestion && suggestedNextQuestion > activeQuestionIndex && suggestedNextQuestion <= 16) {
          if (isMale && (suggestedNextQuestion === 6 || suggestedNextQuestion === 7)) {
            setActiveQuestionIndex(8);
          } else {
            setActiveQuestionIndex(suggestedNextQuestion);
          }
        }
      }
    },
    [activeQuestionIndex]
  );

  const loadPersona = useCallback((personaId: string) => {
    const found = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (found) {
      setFormData(found.data);
      setLastAgentReply(`Loaded simulated profile for ${found.name}. All 16 fields mapped!`);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setActiveQuestionIndex(0);
    setViewMode("patient");
    setSpeechBuffer("");
    setLastAgentReply("Form reset.");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const nextStep = useCallback(() => {
    if (activeQuestionIndex >= 16) return;
    let nextIdx = activeQuestionIndex + 1;
    if (formData.patient_sex === "male" && (nextIdx === 6 || nextIdx === 7)) {
      nextIdx = 8;
    }
    setActiveQuestionIndex(nextIdx);
  }, [activeQuestionIndex, formData.patient_sex]);

  const prevStep = useCallback(() => {
    if (activeQuestionIndex <= 0) return;
    let prevIdx = activeQuestionIndex - 1;
    if (formData.patient_sex === "male" && (prevIdx === 6 || prevIdx === 7)) {
      prevIdx = 5;
    }
    setActiveQuestionIndex(prevIdx);
  }, [activeQuestionIndex, formData.patient_sex]);

  // Compute coverage & completion
  const computeStats = () => {
    let answered = 0;
    const total = 16;

    if (formData.age_hair_loss_began !== null) answered++;
    if (formData.duration !== null) answered++;
    if (formData.family_history && formData.family_history.length > 0) answered++;
    if (formData.pattern && formData.pattern.length > 0) answered++;
    if (formData.diagnosed_conditions && formData.diagnosed_conditions.length > 0) answered++;

    if (formData.patient_sex === "male" || formData.menstrual_cycle !== null) answered++;
    if (formData.patient_sex === "male" || formData.pregnancy_related !== null) answered++;

    if (formData.adult_acne_oily_skin !== null) answered++;
    if (formData.excess_body_facial_hair !== null) answered++;
    if (formData.past_6_months && formData.past_6_months.length > 0) answered++;

    if (formData.habits.hair_wash_frequency !== null || formData.habits.smoking !== null || formData.habits.hard_water !== null) answered++;

    const hasProductAnswer = Object.values(formData.products).some((p) => p.used);
    if (hasProductAnswer) answered++;

    const hasProcedureAnswer = Object.values(formData.procedures).some((p) => p.done);
    if (hasProcedureAnswer || formData.past_treatment_side_effects !== null) answered++;

    if (formData.past_treatment_side_effects !== null) answered++;
    if (formData.sample_type !== null) answered++;
    if (formData.consent !== null) answered++;

    const percent = Math.min(100, Math.round((answered / total) * 100));
    return { answered, total, percent };
  };

  const stats = computeStats();

  return (
    <IntakeContext.Provider
      value={{
        formData,
        activeQuestionIndex,
        viewMode,
        isListening,
        isSpeaking,
        isProcessing,
        isMuted,
        liveTranscript,
        lastAgentReply,
        recentFieldUpdates,
        prescriptionModalOpen,

        speechBuffer,
        isFormFillerActive,
        appendSpeech,
        clearProcessedSpeech,
        setIsFormFillerActive,

        setViewMode,
        setActiveQuestionIndex,
        setIsListening,
        setIsSpeaking,
        setIsProcessing,
        setIsMuted,
        setLiveTranscript,
        setLastAgentReply,
        setPrescriptionModalOpen,

        updateField,
        updateHabit,
        updateProduct,
        updateProcedure,
        applyExtractedDelta,
        loadPersona,
        resetForm,
        nextStep,
        prevStep,

        completionPercentage: stats.percent,
        answeredCount: stats.answered,
        totalQuestions: stats.total,
      }}
    >
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) {
    throw new Error("useIntake must be used within an IntakeProvider");
  }
  return context;
}

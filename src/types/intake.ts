/**
 * GenoRoot Hair & Scalp Intake Types
 * Strictly aligned with haikustudio.ai/hiring/intake-schema.json
 */

export type YesNo = "yes" | "no" | boolean | null;

export type DurationOption = "Less than 6 months" | "6-12 months" | "Over a year";

export type FamilyHistoryOption =
  | "Father had hair loss"
  | "Mother had hair loss"
  | "Siblings with thinning or baldness"
  | "No known family history";

export type PatternOption =
  | "Receding hairline"
  | "Thinning at crown"
  | "Widening part line"
  | "Diffuse thinning"
  | "Patchy loss"
  | "Sudden excessive shedding";

export type DiagnosedConditionOption =
  | "PCOS/PCOD"
  | "Thyroid disorder"
  | "Diabetes"
  | "Autoimmune disease"
  | "Anemia"
  | "None";

export type MenstrualCycleOption = "Regular" | "Irregular" | "Menopausal" | "Not applicable";

export type PregnancyRelatedOption = "Currently pregnant" | "Postpartum <1 year" | "Not applicable";

export type Past6MonthsOption =
  | "Crash dieting or major weight loss"
  | "High stress or emotional trauma"
  | "Fever with illness (COVID, Dengue, Typhoid)"
  | "Recent surgery"
  | "Change in location/water/air quality";

export type SmokingSeverity = "Mild <5/day" | "Moderate 5-10/day" | "Severe >10/day";
export type HairWashFrequency = "Daily" | "Alternate Days" | "Weekly";

export interface HabitsData {
  smoking: YesNo;
  smoking_severity?: SmokingSeverity | null;
  alcohol: YesNo;
  hard_water: YesNo;
  hair_wash_frequency: HairWashFrequency | null;
  heating_tools_styling_chemicals: YesNo;
  salon_treatments: YesNo;
  salon_treatment_detail?: string | null;
}

export type ProductRowKey =
  | "OTC/Medicated Shampoos"
  | "Hair Oils/Serums"
  | "Topical Minoxidil"
  | "Oral Minoxidil"
  | "Supplements";

export type ProductDuration = "<3mo" | "3-6mo" | ">6mo";

export interface ProductUsage {
  used: boolean;
  duration?: ProductDuration | null;
  helped?: YesNo;
  side_effects?: YesNo;
}

export type ProcedureRowKey =
  | "PRP/GFC/iPRF"
  | "Stem Cells/Exosomes"
  | "Hair Transplant"
  | "Other";

export type ProcedureSessions = "1-3" | "4-6" | ">6";

export interface ProcedureUsage {
  done: boolean;
  sessions?: ProcedureSessions | null;
  helped?: YesNo;
}

export type SampleTypeOption = "Saliva" | "Blood" | "Either";

/**
 * The full 16-question schema data object
 */
export interface IntakeFormData {
  // Demographics (used to greet & infer sex-based questions)
  patient_name?: string;
  patient_sex?: "male" | "female" | "other" | null;
  patient_age?: number | null;

  // Section A: Personal & Family Hair Loss History
  age_hair_loss_began: number | null; // Q1
  duration: DurationOption | null; // Q2
  family_history: FamilyHistoryOption[]; // Q3
  pattern: PatternOption[]; // Q4

  // Section B: Hormonal & Health Influences
  diagnosed_conditions: DiagnosedConditionOption[]; // Q5
  menstrual_cycle: MenstrualCycleOption | null; // Q6 (femaleOnly)
  pregnancy_related: PregnancyRelatedOption | null; // Q7 (femaleOnly)
  adult_acne_oily_skin: YesNo; // Q8
  excess_body_facial_hair: YesNo; // Q9

  // Section C: Lifestyle & Environmental Triggers
  past_6_months: Past6MonthsOption[]; // Q10
  habits: HabitsData; // Q11

  // Section D: Current Hair Care & Treatments
  products: Record<ProductRowKey, ProductUsage>; // Q12
  procedures: Record<ProcedureRowKey, ProcedureUsage>; // Q13
  past_treatment_side_effects: YesNo; // Q14
  past_treatment_side_effects_detail?: string | null;

  // Section E: Sample Collection & Consent
  sample_type: SampleTypeOption | null; // Q15
  consent: YesNo; // Q16
}

export interface QuestionMetadata {
  n: number;
  sectionId: "A" | "B" | "C" | "D" | "E";
  sectionTitle: string;
  key: string;
  title: string;
  description: string;
  hintPrompt: string; // Warm clinical conversational question for TTS
  hinglishExample?: string;
  femaleOnly?: boolean;
}

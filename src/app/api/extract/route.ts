import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { IntakeFormData, HabitsData, ProductRowKey, ProductUsage } from "@/types/intake";

// In-depth heuristic extractor fallback for when no GEMINI_API_KEY is configured
function heuristicExtractor(text: string, currentData: Partial<IntakeFormData> = {}): {
  extractedFields: Partial<IntakeFormData>;
  fieldsUpdated: string[];
  doctorVoiceResponse: string;
  suggestedNextQuestion: number;
} {
  const lower = text.toLowerCase();
  const delta: Partial<IntakeFormData> = {};
  const updated: string[] = [];

  // Age extraction
  const ageMatch = lower.match(/(?:i am|i'm|age is|umar|saal ka|saal ki)\s*(\d{1,2})/i) ||
                   lower.match(/(\d{1,2})\s*(?:years old|saal)/i);
  if (ageMatch) {
    const age = parseInt(ageMatch[1], 10);
    if (age >= 10 && age <= 99) {
      delta.patient_age = age;
      updated.push("Patient Age");
    }
  }

  // Age hair loss began
  const beganMatch = lower.match(/(?:started at|began at|shuru hua|noticed at)\s*(\d{1,2})/i) ||
                     lower.match(/(\d{1,2})\s*(?:ki umar|saal me shuru)/i);
  if (beganMatch) {
    delta.age_hair_loss_began = parseInt(beganMatch[1], 10);
    updated.push("Age Hair Loss Began (Q1)");
  }

  // Duration
  if (lower.includes("less than 6 month") || lower.includes("under 6 month") || lower.includes("kuch mahine") || lower.includes("few months") || lower.includes("2-3 months") || lower.includes("3-4 months")) {
    delta.duration = "Less than 6 months";
    updated.push("Duration (Q2)");
  } else if (lower.includes("6-12 month") || lower.includes("6 to 12") || lower.includes("saal bhar se kam") || lower.includes("ek saal se")) {
    delta.duration = "6-12 months";
    updated.push("Duration (Q2)");
  } else if (lower.includes("over a year") || lower.includes("more than a year") || lower.includes("do saal") || lower.includes("2 year") || lower.includes("3 year") || lower.includes("many years") || lower.includes("kaafi saal")) {
    delta.duration = "Over a year";
    updated.push("Duration (Q2)");
  }

  // Family history
  const fam: ("Father had hair loss" | "Mother had hair loss" | "Siblings with thinning or baldness" | "No known family history")[] = [...(currentData.family_history || [])];
  if (lower.includes("father") || lower.includes("papa") || lower.includes("dad") || lower.includes("pitaji")) {
    if (!fam.includes("Father had hair loss")) fam.push("Father had hair loss");
    updated.push("Family History: Father (Q3)");
  }
  if (lower.includes("mother") || lower.includes("mummy") || lower.includes("mom") || lower.includes("mataji")) {
    if (!fam.includes("Mother had hair loss")) fam.push("Mother had hair loss");
    updated.push("Family History: Mother (Q3)");
  }
  if (lower.includes("brother") || lower.includes("sister") || lower.includes("sibling") || lower.includes("bhai") || lower.includes("behen")) {
    if (!fam.includes("Siblings with thinning or baldness")) fam.push("Siblings with thinning or baldness");
    updated.push("Family History: Siblings (Q3)");
  }
  if (lower.includes("no family history") || lower.includes("kisi ko nahi") || lower.includes("no one in family")) {
    delta.family_history = ["No known family history"];
    updated.push("Family History: None (Q3)");
  } else if (fam.length > 0) {
    delta.family_history = fam;
  }

  // Pattern
  const pat = [...(currentData.pattern || [])];
  if (lower.includes("receding") || lower.includes("hairline") || lower.includes("aage se") || lower.includes("front") || lower.includes("temples")) {
    if (!pat.includes("Receding hairline")) pat.push("Receding hairline");
    updated.push("Pattern: Receding hairline (Q4)");
  }
  if (lower.includes("crown") || lower.includes("top of head") || lower.includes("upar se") || lower.includes("vertex") || lower.includes("taal")) {
    if (!pat.includes("Thinning at crown")) pat.push("Thinning at crown");
    updated.push("Pattern: Thinning at crown (Q4)");
  }
  if (lower.includes("part line") || lower.includes("maang") || lower.includes("center part") || lower.includes("widening")) {
    if (!pat.includes("Widening part line")) pat.push("Widening part line");
    updated.push("Pattern: Widening part line (Q4)");
  }
  if (lower.includes("diffuse") || lower.includes("all over") || lower.includes("har jagah se")) {
    if (!pat.includes("Diffuse thinning")) pat.push("Diffuse thinning");
    updated.push("Pattern: Diffuse thinning (Q4)");
  }
  if (lower.includes("patch") || lower.includes("round spot") || lower.includes("areata") || lower.includes("guccha")) {
    if (!pat.includes("Patchy loss")) pat.push("Patchy loss");
    updated.push("Pattern: Patchy loss (Q4)");
  }
  if (lower.includes("sudden") || lower.includes("shedding") || lower.includes("clumps") || lower.includes("bunch") || lower.includes("bohot tezi se") || lower.includes("jhad")) {
    if (!pat.includes("Sudden excessive shedding")) pat.push("Sudden excessive shedding");
    updated.push("Pattern: Sudden excessive shedding (Q4)");
  }
  if (pat.length > 0) delta.pattern = pat;

  // Conditions
  const cond = [...(currentData.diagnosed_conditions || [])];
  if (lower.includes("pcos") || lower.includes("pcod")) {
    if (!cond.includes("PCOS/PCOD")) cond.push("PCOS/PCOD");
    delta.patient_sex = "female";
    updated.push("Condition: PCOS/PCOD (Q5)");
  }
  if (lower.includes("thyroid") || lower.includes("hypothyroid") || lower.includes("hyperthyroid")) {
    if (!cond.includes("Thyroid disorder")) cond.push("Thyroid disorder");
    updated.push("Condition: Thyroid disorder (Q5)");
  }
  if (lower.includes("diabetes") || lower.includes("sugar")) {
    if (!cond.includes("Diabetes")) cond.push("Diabetes");
    updated.push("Condition: Diabetes (Q5)");
  }
  if (lower.includes("autoimmune") || lower.includes("alopecia areata")) {
    if (!cond.includes("Autoimmune disease")) cond.push("Autoimmune disease");
    updated.push("Condition: Autoimmune disease (Q5)");
  }
  if (lower.includes("anemia") || lower.includes("low hemoglobin") || lower.includes("iron deficiency") || lower.includes("khoon ki kami")) {
    if (!cond.includes("Anemia")) cond.push("Anemia");
    updated.push("Condition: Anemia (Q5)");
  }
  if (cond.length > 0) delta.diagnosed_conditions = cond;

  // Triggers (Q10)
  const triggers = [...(currentData.past_6_months || [])];
  if (lower.includes("dengue") || lower.includes("covid") || lower.includes("typhoid") || lower.includes("high fever") || lower.includes("bukhar")) {
    if (!triggers.includes("Fever with illness (COVID, Dengue, Typhoid)")) {
      triggers.push("Fever with illness (COVID, Dengue, Typhoid)");
      // Automatically infer sudden shedding if fever trigger noted!
      if (!pat.includes("Sudden excessive shedding")) {
        pat.push("Sudden excessive shedding");
        delta.pattern = pat;
      }
    }
    updated.push("Trigger: Fever with illness (Q10)");
  }
  if (lower.includes("stress") || lower.includes("trauma") || lower.includes("tension") || lower.includes("depression")) {
    if (!triggers.includes("High stress or emotional trauma")) triggers.push("High stress or emotional trauma");
    updated.push("Trigger: High stress (Q10)");
  }
  if (lower.includes("diet") || lower.includes("weight loss") || lower.includes("vajan kam")) {
    if (!triggers.includes("Crash dieting or major weight loss")) triggers.push("Crash dieting or major weight loss");
    updated.push("Trigger: Weight loss (Q10)");
  }
  if (lower.includes("surgery") || lower.includes("operation")) {
    if (!triggers.includes("Recent surgery")) triggers.push("Recent surgery");
    updated.push("Trigger: Surgery (Q10)");
  }
  if (lower.includes("location") || lower.includes("water quality") || lower.includes("shifted") || lower.includes("bangalore water") || lower.includes("air quality")) {
    if (!triggers.includes("Change in location/water/air quality")) triggers.push("Change in location/water/air quality");
    updated.push("Trigger: Location/Water change (Q10)");
  }
  if (triggers.length > 0) delta.past_6_months = triggers;

  // Habits (Q11)
  const habits = { ...(currentData.habits || {}) };
  if (lower.includes("smoke") || lower.includes("cigarette") || lower.includes("beedi")) {
    habits.smoking = "yes";
    if (lower.includes("mild") || lower.includes("less than 5") || lower.includes("under 5") || lower.includes("2-3")) {
      habits.smoking_severity = "Mild <5/day";
    } else if (lower.includes("moderate") || lower.includes("5-10") || lower.includes("pack")) {
      habits.smoking_severity = "Moderate 5-10/day";
    } else if (lower.includes("severe") || lower.includes("more than 10") || lower.includes("heavy")) {
      habits.smoking_severity = "Severe >10/day";
    }
    updated.push("Habits: Smoking (Q11)");
  }
  if (lower.includes("hard water") || lower.includes("borewell")) {
    habits.hard_water = "yes";
    updated.push("Habits: Hard water (Q11)");
  }
  if (lower.includes("daily wash") || lower.includes("everyday") || lower.includes("roz")) {
    habits.hair_wash_frequency = "Daily";
    updated.push("Habits: Wash Daily (Q11)");
  } else if (lower.includes("alternate") || lower.includes("ek din chhod ke") || lower.includes("alternate days")) {
    habits.hair_wash_frequency = "Alternate Days";
    updated.push("Habits: Wash Alternate Days (Q11)");
  } else if (lower.includes("weekly") || lower.includes("hafte me ek") || lower.includes("once a week")) {
    habits.hair_wash_frequency = "Weekly";
    updated.push("Habits: Wash Weekly (Q11)");
  }
  delta.habits = habits as HabitsData;

  // Products (Q12)
  const products = { ...(currentData.products || {}) };
  if (lower.includes("minoxidil") || lower.includes("mintop") || lower.includes("morr") || lower.includes("tugain")) {
    products["Topical Minoxidil"] = {
      used: true,
      duration: lower.includes(">6") || lower.includes("over 6") || lower.includes("saal") ? ">6mo" : "3-6mo",
      helped: lower.includes("helped") || lower.includes("result accha") || lower.includes("fayda") ? "yes" : "no",
      side_effects: lower.includes("itch") || lower.includes("rash") || lower.includes("allergy") ? "yes" : "no",
    };
    updated.push("Products: Topical Minoxidil (Q12)");
  }
  if (lower.includes("biotin") || lower.includes("supplement") || lower.includes("vitamin") || lower.includes("follihair")) {
    products["Supplements"] = {
      used: true,
      duration: "3-6mo",
      helped: "yes",
      side_effects: "no",
    };
    updated.push("Products: Supplements (Q12)");
  }
  if (lower.includes("shampoo") || lower.includes("ketoconazole") || lower.includes("scalpe") || lower.includes("nizoral") || lower.includes("anti dandruff")) {
    products["OTC/Medicated Shampoos"] = {
      used: true,
      duration: ">6mo",
      helped: "yes",
      side_effects: "no",
    };
    updated.push("Products: Medicated Shampoos (Q12)");
  }
  delta.products = products as Record<ProductRowKey, ProductUsage>;

  // Consent & Sample
  if (lower.includes("consent") || lower.includes("agree") || lower.includes("yes i accept") || lower.includes("haan chalega")) {
    delta.consent = "yes";
    updated.push("Consent (Q16)");
  }
  if (lower.includes("saliva") || lower.includes("swab")) {
    delta.sample_type = "Saliva";
    updated.push("Sample: Saliva (Q15)");
  } else if (lower.includes("blood") || lower.includes("khoon")) {
    delta.sample_type = "Blood";
    updated.push("Sample: Blood (Q15)");
  } else if (lower.includes("either") || lower.includes("dono chalega") || lower.includes("any")) {
    delta.sample_type = "Either";
    updated.push("Sample: Either (Q15)");
  }

  // Response generation
  let doctorVoiceResponse = "Thank you. I have recorded your answers.";
  if (updated.length > 0) {
    doctorVoiceResponse = `I noted down ${updated.slice(0, 3).join(", ")}. Let's continue to the next step.`;
  }

  return {
    extractedFields: delta,
    fieldsUpdated: updated,
    doctorVoiceResponse,
    suggestedNextQuestion: Math.min(16, (currentData.age_hair_loss_began ? 3 : 2)),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, image, currentFormData, activeQuestionIndex } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key is provided, use the high-fidelity heuristic parser
    if (!apiKey) {
      console.log("No GEMINI_API_KEY found. Using smart heuristic clinic parser fallback.");
      const result = heuristicExtractor(transcript || "", currentFormData || {});
      return NextResponse.json(result);
    }

    // Call Gemini 2.5 Flash via official SDK
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are the AI Clinical Intake Concierge for GenoRoot Hair & Scalp Clinic.
Your job is to listen to the patient's spoken statements (which may be in English, Hindi, or Hinglish) or read their uploaded medical prescription / lab report, and extract structured answers for the official 16-question clinic intake.

Official Intake Schema fields:
1. age_hair_loss_began (number)
2. duration ("Less than 6 months" | "6-12 months" | "Over a year")
3. family_history (array of: "Father had hair loss", "Mother had hair loss", "Siblings with thinning or baldness", "No known family history")
4. pattern (array of: "Receding hairline", "Thinning at crown", "Widening part line", "Diffuse thinning", "Patchy loss", "Sudden excessive shedding")
5. diagnosed_conditions (array of: "PCOS/PCOD", "Thyroid disorder", "Diabetes", "Autoimmune disease", "Anemia", "None")
6. menstrual_cycle ("Regular" | "Irregular" | "Menopausal" | "Not applicable" - female only)
7. pregnancy_related ("Currently pregnant" | "Postpartum <1 year" | "Not applicable" - female only)
8. adult_acne_oily_skin ("yes" | "no")
9. excess_body_facial_hair ("yes" | "no")
10. past_6_months (array of: "Crash dieting or major weight loss", "High stress or emotional trauma", "Fever with illness (COVID, Dengue, Typhoid)", "Recent surgery", "Change in location/water/air quality")
11. habits (object with keys: smoking ("yes"|"no"), smoking_severity ("Mild <5/day"|"Moderate 5-10/day"|"Severe >10/day"), alcohol ("yes"|"no"), hard_water ("yes"|"no"), hair_wash_frequency ("Daily"|"Alternate Days"|"Weekly"), heating_tools_styling_chemicals ("yes"|"no"), salon_treatments ("yes"|"no"), salon_treatment_detail (string))
12. products (object mapping product name to { used: boolean, duration?: "<3mo"|"3-6mo"|">6mo", helped?: "yes"|"no", side_effects?: "yes"|"no" })
    Product names: "OTC/Medicated Shampoos", "Hair Oils/Serums", "Topical Minoxidil", "Oral Minoxidil", "Supplements"
13. procedures (object mapping procedure to { done: boolean, sessions?: "1-3"|"4-6"|">6", helped?: "yes"|"no" })
    Procedures: "PRP/GFC/iPRF", "Stem Cells/Exosomes", "Hair Transplant", "Other"
14. past_treatment_side_effects ("yes" | "no", followup detail if yes)
15. sample_type ("Saliva" | "Blood" | "Either")
16. consent ("yes" | "no")

Patient Demographics:
patient_name (string), patient_sex ("male" | "female" | "other"), patient_age (number)

Inference & Clinic Rules:
- If patient mentions COVID, Dengue, Typhoid or high fever in the past months, infer both "Fever with illness (COVID, Dengue, Typhoid)" in Q10 AND "Sudden excessive shedding" (Telogen Effluvium) in Q4!
- If patient is male (e.g. mentions "I am a 50 year old man" or "Mr." or masculine Hindi grammar "karta hoon"), set menstrual_cycle to "Not applicable" and pregnancy_related to "Not applicable".
- If patient mentions PCOS or PCOD, set patient_sex to "female", and look for signs of adult acne or excess facial hair.
- For Hinglish:
  - "aage se baal kam": Receding hairline
  - "upar se patle ho rahe": Thinning at crown
  - "maang chaudi ho rahi": Widening part line
  - "guccha nikal raha hai" / "tezi se jhad rahe": Sudden excessive shedding
  - "kharab paani / borewell ka paani": hard_water = "yes"
  - "papa ke baal nahi the": Father had hair loss

Return ONLY a valid JSON object matching this TypeScript structure:
{
  "extractedFields": Partial<IntakeFormData>,
  "fieldsUpdated": string[], // names of fields that were updated or inferred
  "doctorVoiceResponse": string, // warm, empathetic, 1-2 sentence spoken reply to confirm what was recorded and encourage next step
  "suggestedNextQuestion": number // 1 to 16
}
`;

    const userPrompt = `
Current Intake State: ${JSON.stringify(currentFormData || {})}
Active Question Index: ${activeQuestionIndex || 1}
Patient Spoken Input / Transcription: "${transcript || ""}"
${image ? "Patient also provided an image (prescription or lab report)." : ""}

Analyze the patient's utterance, extract all relevant fields across the 16 questions, apply clinical inferences, and return valid JSON.`;

    const contents: Array<Record<string, unknown>> = [];
    if (image) {
      // Base64 image attachment
      contents.push({
        role: "user",
        parts: [
          { text: userPrompt },
          {
            inlineData: {
              mimeType: image.mimeType || "image/jpeg",
              data: image.base64Data,
            },
          },
        ],
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: userPrompt }],
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents as any,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Gemini API error in /api/extract:", error);
    // Fallback gracefully so frontend always gets a valid response
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fallback = heuristicExtractor(errorMessage, {});
    return NextResponse.json(fallback);
  }
}

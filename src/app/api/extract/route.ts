import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { IntakeFormData, HabitsData, ProductRowKey, ProductUsage } from "@/types/intake";

// Heuristic extractor fallback when no GEMINI_API_KEY is configured
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
  if (ageMatch && !currentData.patient_age) {
    const age = parseInt(ageMatch[1], 10);
    if (age >= 10 && age <= 99) {
      delta.patient_age = age;
      updated.push("Patient Age");
    }
  }

  // Name extraction
  const nameMatch = lower.match(/(?:my name is|mera naam|i am|this is)\s+([a-z]+(?:\s+[a-z]+)?)/i);
  if (nameMatch && !currentData.patient_name) {
    const candidate = nameMatch[1].trim();
    if (!["a", "the", "suffering", "having", "experiencing", "facing"].includes(candidate.toLowerCase())) {
      delta.patient_name = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      updated.push("Patient Name");
    }
  }

  // Sex extraction
  if (!currentData.patient_sex) {
    if (lower.includes("female") || lower.includes("woman") || lower.includes("ladki") || lower.includes("aurat") || lower.includes("karti hoon")) {
      delta.patient_sex = "female";
      updated.push("Patient Sex: Female");
    } else if (lower.includes("male") || lower.includes("man") || lower.includes("ladka") || lower.includes("aadmi") || lower.includes("karta hoon")) {
      delta.patient_sex = "male";
      updated.push("Patient Sex: Male");
    }
  }

  // Age hair loss began
  const beganMatch = lower.match(/(?:started at|began at|shuru hua|noticed at)\s*(\d{1,2})/i) ||
                     lower.match(/(\d{1,2})\s*(?:ki umar|saal me shuru)/i);
  if (beganMatch && !currentData.age_hair_loss_began) {
    delta.age_hair_loss_began = parseInt(beganMatch[1], 10);
    updated.push("Age Hair Loss Began (Q1)");
  }

  // Duration
  if (!currentData.duration) {
    if (lower.includes("less than 6 month") || lower.includes("under 6 month") || lower.includes("kuch mahine") || lower.includes("few months") || lower.includes("2-3 months") || lower.includes("3-4 months")) {
      delta.duration = "Less than 6 months";
      updated.push("Duration: <6mo (Q2)");
    } else if (lower.includes("6-12 month") || lower.includes("6 to 12") || lower.includes("saal bhar se kam") || lower.includes("ek saal se")) {
      delta.duration = "6-12 months";
      updated.push("Duration: 6-12mo (Q2)");
    } else if (lower.includes("over a year") || lower.includes("more than a year") || lower.includes("do saal") || lower.includes("2 year") || lower.includes("3 year") || lower.includes("many years") || lower.includes("kaafi saal")) {
      delta.duration = "Over a year";
      updated.push("Duration: >1yr (Q2)");
    }
  }

  // Family history
  const fam = [...(currentData.family_history || [])];
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
  } else if (fam.length > (currentData.family_history?.length || 0)) {
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
  if (pat.length > (currentData.pattern?.length || 0)) delta.pattern = pat;

  // Conditions
  const cond = [...(currentData.diagnosed_conditions || [])];
  if (lower.includes("pcos") || lower.includes("pcod")) {
    if (!cond.includes("PCOS/PCOD")) cond.push("PCOS/PCOD");
    delta.patient_sex = "female";
    updated.push("Conditions: PCOS/PCOD (Q5)");
  }
  if (lower.includes("thyroid") || lower.includes("hypothyroid") || lower.includes("hyperthyroid")) {
    if (!cond.includes("Thyroid disorder")) cond.push("Thyroid disorder");
    updated.push("Conditions: Thyroid (Q5)");
  }
  if (lower.includes("diabetes") || lower.includes("sugar") || lower.includes("diabetic")) {
    if (!cond.includes("Diabetes")) cond.push("Diabetes");
    updated.push("Conditions: Diabetes (Q5)");
  }
  if (lower.includes("anemia") || lower.includes("iron deficiency") || lower.includes("low hemoglobin") || lower.includes("ferritin")) {
    if (!cond.includes("Anemia")) cond.push("Anemia");
    updated.push("Conditions: Anemia (Q5)");
  }
  if (cond.length > (currentData.diagnosed_conditions?.length || 0)) delta.diagnosed_conditions = cond;

  // Past 6 months triggers
  const trig = [...(currentData.past_6_months || [])];
  if (lower.includes("covid") || lower.includes("dengue") || lower.includes("typhoid") || lower.includes("fever") || lower.includes("bukhar") || lower.includes("illness")) {
    if (!trig.includes("Fever with illness (COVID, Dengue, Typhoid)")) {
      trig.push("Fever with illness (COVID, Dengue, Typhoid)");
      updated.push("Triggers: Febrile illness (Q10)");
      if (!pat.includes("Sudden excessive shedding")) {
        pat.push("Sudden excessive shedding");
        delta.pattern = pat;
        updated.push("Inferred: Sudden shedding (Q4)");
      }
    }
  }
  if (lower.includes("stress") || lower.includes("trauma") || lower.includes("work pressure") || lower.includes("family tension")) {
    if (!trig.includes("High stress or emotional trauma")) {
      trig.push("High stress or emotional trauma");
      updated.push("Triggers: High stress (Q10)");
    }
  }
  if (lower.includes("diet") || lower.includes("weight loss") || lower.includes("keto") || lower.includes("fasting")) {
    if (!trig.includes("Crash dieting or major weight loss")) {
      trig.push("Crash dieting or major weight loss");
      updated.push("Triggers: Weight loss / dieting (Q10)");
    }
  }
  if (trig.length > (currentData.past_6_months?.length || 0)) delta.past_6_months = trig;

  // Habits
  const currentHabits = currentData.habits || {
    smoking: null,
    smoking_severity: null,
    alcohol: null,
    hard_water: null,
    hair_wash_frequency: null,
    heating_tools_styling_chemicals: null,
    salon_treatments: null,
    salon_treatment_detail: null,
  };
  const habitsPatch: HabitsData = { ...currentHabits };
  let habitsChanged = false;

  if (lower.includes("hard water") || lower.includes("borewell") || lower.includes("khara paani")) {
    habitsPatch.hard_water = "yes";
    habitsChanged = true;
    updated.push("Habits: Hard water (Q11)");
  }
  if (lower.includes("smoke") || lower.includes("cigarette") || lower.includes("bidi")) {
    if (lower.includes("don't smoke") || lower.includes("no smoke") || lower.includes("never smoked")) {
      habitsPatch.smoking = "no";
      habitsChanged = true;
      updated.push("Habits: No smoking (Q11)");
    } else {
      habitsPatch.smoking = "yes";
      habitsChanged = true;
      if (lower.includes("more than 10") || lower.includes("pack a day") || lower.includes("heavy")) {
        habitsPatch.smoking_severity = "Severe >10/day";
      } else if (lower.includes("5") || lower.includes("moderate") || lower.includes("5-10")) {
        habitsPatch.smoking_severity = "Moderate 5-10/day";
      } else {
        habitsPatch.smoking_severity = "Mild <5/day";
      }
      updated.push("Habits: Smoking (Q11)");
    }
  }
  if (lower.includes("daily wash") || lower.includes("har roz wash") || lower.includes("every day")) {
    habitsPatch.hair_wash_frequency = "Daily";
    habitsChanged = true;
    updated.push("Habits: Daily wash (Q11)");
  } else if (lower.includes("alternate") || lower.includes("ek din chhod kar") || lower.includes("2-3 times a week")) {
    habitsPatch.hair_wash_frequency = "Alternate Days";
    habitsChanged = true;
    updated.push("Habits: Alternate wash (Q11)");
  } else if (lower.includes("weekly") || lower.includes("once a week") || lower.includes("hafte me ek baar")) {
    habitsPatch.hair_wash_frequency = "Weekly";
    habitsChanged = true;
    updated.push("Habits: Weekly wash (Q11)");
  }

  if (habitsChanged) delta.habits = habitsPatch;

  // Products
  const currentProds = currentData.products || {
    "OTC/Medicated Shampoos": { used: false, duration: null, helped: null, side_effects: null },
    "Hair Oils/Serums": { used: false, duration: null, helped: null, side_effects: null },
    "Topical Minoxidil": { used: false, duration: null, helped: null, side_effects: null },
    "Oral Minoxidil": { used: false, duration: null, helped: null, side_effects: null },
    "Supplements": { used: false, duration: null, helped: null, side_effects: null },
  };
  const prodsPatch = { ...currentProds };
  let prodsChanged = false;

  if (lower.includes("minoxidil") || lower.includes("tugain") || lower.includes("morr f") || lower.includes("mintop")) {
    const isOral = lower.includes("oral") || lower.includes("tablet") || lower.includes("pill");
    const key: ProductRowKey = isOral ? "Oral Minoxidil" : "Topical Minoxidil";
    const existing = prodsPatch[key] || { used: false, duration: null, helped: null, side_effects: null };
    prodsPatch[key] = {
      ...existing,
      used: true,
      duration: lower.includes("more than 6") || lower.includes("over 6") ? ">6mo" : lower.includes("3") ? "3-6mo" : "<3mo",
      helped: lower.includes("helped") || lower.includes("improvement") || lower.includes("fayda") ? "yes" : lower.includes("no effect") || lower.includes("did not help") ? "no" : existing.helped,
    };
    prodsChanged = true;
    updated.push(`Products: ${key} (Q12)`);
  }
  if (lower.includes("biotin") || lower.includes("multivitamin") || lower.includes("follihair") || lower.includes("supplement")) {
    const existing = prodsPatch["Supplements"] || { used: false, duration: null, helped: null, side_effects: null };
    prodsPatch["Supplements"] = { ...existing, used: true, duration: "3-6mo", helped: "yes" };
    prodsChanged = true;
    updated.push("Products: Supplements (Q12)");
  }
  if (lower.includes("ketoconazole") || lower.includes("anti-dandruff") || lower.includes("scalpe") || lower.includes("nizral")) {
    const existing = prodsPatch["OTC/Medicated Shampoos"] || { used: false, duration: null, helped: null, side_effects: null };
    prodsPatch["OTC/Medicated Shampoos"] = { ...existing, used: true, duration: "<3mo" };
    prodsChanged = true;
    updated.push("Products: Medicated Shampoo (Q12)");
  }
  if (prodsChanged) delta.products = prodsPatch;

  // Consent & Sample
  if (!currentData.sample_type) {
    if (lower.includes("saliva")) {
      delta.sample_type = "Saliva";
      updated.push("Sample: Saliva (Q15)");
    } else if (lower.includes("blood")) {
      delta.sample_type = "Blood";
      updated.push("Sample: Blood (Q15)");
    } else if (lower.includes("either") || lower.includes("any sample") || lower.includes("both")) {
      delta.sample_type = "Either";
      updated.push("Sample: Either (Q15)");
    }
  }

  if (lower.includes("consent") || lower.includes("i agree") || lower.includes("permission") || lower.includes("yes agree")) {
    delta.consent = "yes";
    updated.push("Consent: Granted (Q16)");
  }

  return {
    extractedFields: delta,
    fieldsUpdated: updated,
    doctorVoiceResponse: updated.length > 0
      ? `Recorded ${updated.join(", ")}.`
      : "",
    suggestedNextQuestion: 1,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transcript,
      image,
      currentFormData,
      alreadyFilledFields,
      unfilledFields,
      activeQuestionIndex,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key is provided, use the state-aware heuristic parser
    if (!apiKey) {
      const result = heuristicExtractor(transcript || "", currentFormData || {});
      return NextResponse.json(result);
    }

    // Call Gemini 2.5 Flash via official SDK
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
You are the Intelligent State-Aware Auto Form Filling Engine for GenoRoot Hair & Scalp Clinic.
Your job is to listen to the patient's continuous speech stream (which may be in English, Hindi, or Hinglish) or read their medical document, and evaluate which fields of the official 16-question intake need to be filled.

INTAKE SCHEMA SPECIFICATION:
1. age_hair_loss_began (number: age when hair loss first started)
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
14. past_treatment_side_effects ("yes" | "no", detail if yes)
15. sample_type ("Saliva" | "Blood" | "Either")
16. consent ("yes" | "no")
Patient Demographics: patient_name (string), patient_sex ("male" | "female" | "other"), patient_age (number)

CRITICAL STATE-AWARE DECISION RULES:
1. INTELLIGENT FILTERING - DO NOT DUMP RAW TEXT:
   - Carefully evaluate the patient's speech. If they are making casual chatter, conversational filler ("uhh", "let me think", "what was I saying", "yeah okay"), or talking about unrelated topics, DO NOT touch any fields! Return empty extractedFields: {}.
   - Only populate fields when the patient provides genuine, explicit clinical facts.
2. FOCUS ON UNFILLED FIELDS:
   - You are provided with a list of "unfilledFields". Prioritize checking if the speech provides answers for any of these pending questions.
3. PRESERVE EXISTING FILLED FIELDS:
   - Do NOT overwrite fields in "alreadyFilledFields" unless the patient explicitly corrects or changes their previous statement (e.g., "actually I started at 45 not 48").
4. CLINICAL INFERENCES:
   - COVID, Dengue, Typhoid, or high fever implies BOTH "Fever with illness (COVID, Dengue, Typhoid)" in Q10 AND "Sudden excessive shedding" (Telogen Effluvium) in Q4.
   - If patient is male, menstrual_cycle and pregnancy_related must be "Not applicable".
   - If patient mentions PCOS or PCOD, patient_sex is "female".

Return ONLY valid JSON matching this TypeScript structure:
{
  "extractedFields": Partial<IntakeFormData>,
  "fieldsUpdated": string[], // names of fields that were populated (e.g. ["Patient Age: 52", "Family History: Father"])
  "doctorVoiceResponse": string, // optional brief confirmation
  "suggestedNextQuestion": number // 1 to 16
}
`;

    const userPrompt = `
ALREADY FILLED FIELDS:
${JSON.stringify(alreadyFilledFields || [], null, 2)}

UNFILLED FIELDS PENDING ANSWERS:
${JSON.stringify(unfilledFields || [], null, 2)}

CURRENT FULL FORM DATA:
${JSON.stringify(currentFormData || {}, null, 2)}

ACTIVE QUESTION BEING VIEWED: ${activeQuestionIndex || 1}

PATIENT SPOKEN SPEECH CHUNK:
"${transcript || ""}"
${image ? "\n[A prescription or lab report image is also attached.]" : ""}

Evaluate if the speech chunk OR the attached medical document provides genuine answers for any unfilled fields (or explicit corrections). Extract and return valid JSON.`;

    const contents: Array<Record<string, unknown>> = [];
    if (image) {
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

    let parsed = null;
    let attempts = 0;
    const maxAttempts = 2;
    let lastError = null;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: contents as any,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const responseText = response.text || "{}";
        parsed = JSON.parse(responseText);
        break; // Successfully got valid JSON, break out of loop
      } catch (err) {
        lastError = err;
        attempts++;
        console.warn(`Gemini extraction failed (Attempt ${attempts}/${maxAttempts}). Retrying...`, err);
      }
    }

    if (!parsed) {
      throw lastError || new Error("Failed to extract valid JSON after max retries");
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Gemini API error in /api/extract:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const fallback = heuristicExtractor(errorMessage, {});
    return NextResponse.json(fallback);
  }
}

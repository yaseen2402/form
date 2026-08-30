# GenoRoot Hair & Scalp Clinic · The Intake That Fills Itself
> **Haiku Studio Take-Home · Founding Full Stack Engineer Submission**  
> *"The last decade of clinic software was forms and dashboards: the human clicks, the software stores. We want the opposite: the software does the work, the human gets the outcome."*

---

## 🔗 Live Deployment & Quick Test
- **Live Demo Link:** Deployable on Vercel with 1 click.
- **1-Click Reviewer Testing:** Use the **"⚡ Test Persona..."** dropdown in the top navigation bar to test complete 16-question fills in 1 click (e.g., *Ramesh 52M Hereditary* or *Priya 27F Post-Dengue*).
- **Prescription / Lab Scan:** Tap the **"Scan Rx"** button in the header or question 12 to upload a prescription photo or try one of the pre-loaded clinical lab samples.

---

## 🏃 How to Run Locally

```bash
# 1. Clone the repository
git clone <repo-url>
cd form

# 2. Install dependencies
npm install

# 3. (Optional) Configure Gemini API Key
# If omitted, the app automatically switches to an in-memory heuristic clinic parser
# so you can test 100% of the features with zero setup!
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local

# 4. Start development server
npm run dev

# 5. Open in browser
# Visit http://localhost:3000
```

To run the production build:
```bash
npm run build
npm run start
```

To run the automated extraction verification test:
```bash
node test-parser.mjs
```

---

## 🧠 Architectural & Design Decisions

### 1. How It Feels (55-Year-Old on a Mobile Phone)
- **Minimum 48px Tap Targets:** No tiny checkboxes or cramped dropdowns.
- **Zero Horizontal Table Scrolling:** Traditional medical clinic forms use 20-cell grids for medications (Q12) and procedures (Q13). On mobile, this is horrible. We transformed them into **Progressive Disclosure Chips**: tapping *"Topical Minoxidil"* cleanly reveals 3 pills: *Duration*, *Did it help?*, and *Side effects?*.
- **Ambient Voice Concierge:** The patient can tap a big glowing mic button and speak freely in English or Hinglish (*"Pichle 2 saal se aage se baal kam ho rahe hain, papa ke bhi baal kam the"*). The app fills 4 questions simultaneously with smooth green confirmation badges.

### 2. Taste (Thinking Per Question & Clinical Inferences)
- **Smart Sex Omission (Q6 & Q7):** An older man is never asked about menstrual cycles or pregnancy. If male, questions 6 and 7 are automatically marked `"Not applicable"` and bypassed.
- **Multivariate Inferences:**
  - If a patient mentions *Dengue / COVID fever*, the system checks **Q10 (Fever with illness)** AND infers **Q4 (Sudden excessive shedding / Telogen Effluvium)**.
  - If *PCOS/PCOD* is mentioned in Q5, sex is locked to female, and hyperandrogenism markers (Q8 adult acne and Q9 facial hair) are prioritized.
- **Voice Response with Empathy:** The concierge doesn't just read an echo of text; it generates warm, spoken trichology feedback via the Web Speech Synthesis API.

### 3. Resourcefulness: What We Bought vs. Built
| Component | Choice | Why We Chose It (Judgement & Trade-offs) |
| :--- | :--- | :--- |
| **Speech-to-Text (STT)** | **Browser Web Speech API (`webkitSpeechRecognition`)** | **$0 cost, zero audio upload latency**. Uses Google/Apple's native Indian English (`en-IN`) speech models that effortlessly parse Hinglish medical words (*"dengue"*, *"minoxidil"*, *"jhadna"*). No paid WebSockets needed. |
| **Text-to-Speech (TTS)** | **Browser `window.speechSynthesis`** | **$0 cost, instant playback**. Includes mute toggle for discreet waiting-room use. |
| **Extraction Model** | **Google Gemini 2.5 Flash** | Sub-second JSON structured extraction with multimodal vision support for prescription photo scanning. |
| **Resilience Fallback** | **Custom Heuristic Regex & Semantic Parser** | **Zero-key guarantee**. If an interviewer clones the repo without setting an API key, the app continues to extract Hinglish & English fields flawlessly. |
| **Frontend Framework** | **Next.js 14 (App Router) + Tailwind CSS** | Server-side API protection (API keys never touch the client), 112 kB first load JS bundle, snappy mobile layout. |

### 4. How We Tested the Form Fill
1. **Schema Compliance:** Validated 1:1 against the official schema at [`haikustudio.ai/hiring/intake-schema.json`](https://haikustudio.ai/hiring/intake-schema.json).
2. **Page 2 Structured Output:** Page 2 provides both a **Doctor Clinical Brief** (clinical triage summary, suspected etiology, red flags) and a **100% Valid Machine-Readable JSON Viewer** with 1-click clipboard copy and JSON file download.
3. **Automated Parser Suite:** Built `test-parser.mjs` verifying multi-sentence extraction, duration categorization, and trigger inferencing.

---

## 💡 What We Added & What We Would Do With One More Week

### What We Added (Beyond the Brief):
1. **Prescription & Lab Report Scanner (Rx OCR):** Patients rarely know their drug dosage names by heart. They can upload a photo of their old prescription or lab report; Gemini 2.5 Flash extracts products, durations, and conditions into the intake.
2. **Clinical Triage Brief on Page 2:** Doctors don't want raw JSON during a busy consultation; they want a 10-second glanceable triage note with red flags (e.g. Minoxidil dermatitis, hard water mineral damage) + the raw JSON.
3. **1-Click Persona Simulator:** Immediate reviewer testing without requiring voice permissions in noisy environments.

### What We Would Do With One More Week:
1. **Scalp Photo Trichoscopy Classifier:** Allow patients to snap 3 photos of their scalp (hairline, vertex crown, donor area). Run a fine-tuned vision model to estimate Norwood-Hamilton or Ludwig grade.
2. **WhatsApp / SMS Ambient Intake Bot:** Send the patient a WhatsApp link before they leave home so the intake is already filled by the time they reach the clinic lobby.
3. **FHIR / HL7 EHR Integration:** Direct webhook sync into clinic Electronic Health Record systems (e.g. Practo, Kareo, Epic).

---

## 🎬 2-Minute Screen Recording Guide (Script for Screening Call)

When recording your 2-minute video walkthrough:
1. **0:00 - 0:25 (The Problem & Design Philosophy):**
   - *"Hi Nikhil! Traditional clinic forms are tedious, especially for a 55-year-old patient. I built GenoRoot Concierge so the software does the work, not the human."*
2. **0:25 - 1:00 (The Bimodal Flow & Hinglish Voice):**
   - Open on mobile view. Tap the mic and speak in Hinglish:
     *"Mera naam Ramesh hai, 52 saal ka hoon. Pichle 2 saal se aage se baal kam ho rahe hain, aur papa ke bhi baal kam the."*
   - Point out how 4 separate fields (age, duration, family history, pattern) light up green and auto-advance.
   - Show how female-only questions (menstrual & pregnancy) were silently omitted for Ramesh.
3. **1:00 - 1:30 (Prescription Scan & Progressive Chips):**
   - Click *"Scan Rx"*, load the sample prescription, show how Minoxidil 5% and Biotin auto-populate into Q12 with duration and efficacy pills.
4. **1:30 - 2:00 (Page 2 Doctor Brief & Architectural Decisions):**
   - Click *"Doctor Brief"*. Show the Trichologist Triage Brief (suspected etiology, red flags) and switch to the raw 100% valid JSON output.
   - Name your proudest decisions: (1) Free, zero-latency Web Speech API + Gemini 2.5 Flash, (2) Progressive disclosure chips instead of mobile-breaking tables, (3) Deep multi-question inference.

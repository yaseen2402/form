# GenoRoot Hair & Scalp Clinic · Intelligent Intake


## Core Features
- **Continuous Ambient Voice:** Tap "Speak" once. An intelligent background worker transcribes continuously, extracting answers in real-time and auto-advancing questions.
- **Phonetic STT Auto-Correction:** Aggressive fuzzy matching maps microphone mishears (e.g., "receiving airline") directly to clinical schema options ("Receding hairline").
- **Rx / Lab Report Scanner:** Upload a prescription photo; the multimodal AI extracts medications, dosages, and conditions directly into the intake.

---

## Quick Start

```bash
git clone <repo-url>
cd form
npm install

# Add your Gemini API Key. 

echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env.local

npm run dev
# Visit http://localhost:3000
```

---

## Architecture & Decisions

### 1. Minimalist Clinical Aesthetic
Pure monochrome (`zinc-950`). Zero horizontal distortion, progressive disclosure cards, and touch-friendly mobile targets.

### 2. State-Aware Voice Engine
- **Decoupled Pipe:** Browser Web Speech API (`en-IN`) streams locally with 0 latency.
- **Smart Form Filler (Gemini 3.5 Flash Lite):** A background worker triggers every ~1 second of silence. It evaluates the **current form snapshot** against the new speech, filtering out casual chatter and extracting only genuine facts.
- **Contextual Healing:** Buffer dynamically clears processed speech to keep the LLM context short, lightning-fast, and hallucination-free.

### 3. Clinical Logic Inferences
- **Dynamic Bypassing:** Male patients automatically bypass menstrual/pregnancy questions.
- **Multivariate Triggers:** Mentioning "Dengue" maps to Q10 (Fever) AND infers Q4 (Sudden excessive shedding).

### 4. Tech Stack
| Component | Choice | Why |
| :--- | :--- | :--- |
| **STT** | **Web Speech API** | Free, native `en-IN` parsing, zero upload latency. |
| **AI Engine** | **Gemini 3.5 Flash Lite** | Sub-second JSON extraction, native multimodal PDF/image support. |
| **Frontend** | **Next.js 14 + Tailwind** | Server-side API protection, lightweight static optimization. |

---

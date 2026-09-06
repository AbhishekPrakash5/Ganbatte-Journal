# Ganbatte Journal — Empathetic Diary & Environmental Mood Synthesizer

![Ganbatte Journal Dashboard Preview](./public/ganbatte_preview.svg)

> **"Ganbatte" (頑張って)** — A warm Japanese expression of encouragement, resilience, and mindful presence. 

**Ganbatte Journal** is a secure, full-stack, user-authenticated diary and mindfulness application designed with a **Naruto sunset orange and warm amber parchment** aesthetic. It integrates **Firebase Authentication (Google Sign-In)**, **Cloud Firestore**, and server-side **Gemini API** intelligence on **Google Cloud Run**.

The application accompanies users through daily reflections, engages in an empathetic dialogue by asking single focused emotional clarifying questions, maps emotional vitality to physical environments, synthesizes historical location-mood patterns, and seals each reflection with handcrafted animated anime & Ghibli-inspired stickers.

---

## Table of Contents

1. [End-to-End System Workflow](#1-end-to-end-system-workflow)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Security & Privacy Features](#3-security--privacy-features)
4. [Cloud Firestore & Database Configuration](#4-cloud-firestore--database-configuration)
5. [Server-Side Gemini API Engine](#5-server-side-gemini-api-engine)
6. [Animated Anime Stickers & Reflection Seals](#6-animated-anime-stickers--reflection-seals)
7. [Geolocation Context & Reverse Geocoding](#7-geolocation-context--reverse-geocoding)
8. [Location-Mood Patterns & Correlation Engine](#8-location-mood-patterns--correlation-engine)
9. [Crisis Safety Protocol & Helplines](#9-crisis-safety-protocol--helplines)
10. [Google Cloud Secret Manager Setup](#10-google-cloud-secret-manager-setup)
11. [Google Cloud Run Deployment Flow](#11-google-cloud-run-deployment-flow)
12. [Verification & Walkthrough Checklist](#12-verification--walkthrough-checklist)

---

## 1. End-to-End System Workflow

```
[User Browser]
       │
       ├─► 1. Detect Geolocation (HTML5 GPS + OpenStreetMap Reverse Geocoding)
       │
       ├─► 2. Draft Reflection Scroll ("Today's training was tough but rewarding...")
       │
       ├─► 3. Stage 1: Clarifying Dialogue (/api/journal/clarify)
       │         │
       │         ▼
       │      [Express Server + Gemini 3.6 Flash Fallback Ladder]
       │         │  Validates input length & safety
       │         │  Generates empathetic reflection & ONE clarifying question
       │         ▼
       │      [User answers clarifying question in the scroll]
       │
       ├─► 4. Stage 2: Synthesis & Tailored Steps (/api/journal/analyze)
       │         │
       │         ▼
       │      [Express Server + Gemini 3.6 Flash Fallback Ladder]
       │         │  Calculates Mood Vitality Score (1–10)
       │         │  Determines primary emotion & sentiment tag
       │         │  Generates 2–3 actionable steps tailored to the physical environment
       │         │  Synthesizes location-mood history pattern note
       │         │  Assigns best matching animated anime seal sticker (e.g. Ichiraku Ramen)
       │         ▼
       ├─► 5. Secure Persistence (Cloud Firestore)
       │         │  Writes to isolated path: /users/{userId}/entries/{entryId}
       │         │  Guaranteed rule check: request.auth.uid == userId
       │         │  Offline/guest fallback: localStorage cache
       │
       ├─► 6. Interactive Geospatial Mood Map (Leaflet)
       │         │  Pins entries with chakra orange markers colored by vitality
       │         ▼
       └─► 7. Aggregate Pattern Synthesis
                 Correlates emotional vitality across physical venues (Parks vs Cafes vs Home)
```

### Detailed Lifecycle:
1. **Context Ingestion**: The app requests browser geolocation (optional) or allows selecting preset environment tags (*Cafe / Eatery*, *Park / Outdoors*, *Home Sanctuary*, *Transit / Commute*, *Office / Studio*). Coordinates are translated into human-readable place names and categorized.
2. **First-Stage Dialogue**: The user enters their thoughts. The frontend calls `/api/journal/clarify`. Gemini acts as the **Ganbatte Journal Guide**, offering warm, sincere validation and asking one gentle, focused clarifying question about the core emotion experienced.
3. **Deep Synthesis & Seal Assignment**: The user answers the question. The frontend submits both texts along with spatial metadata to `/api/journal/analyze`. Gemini generates:
   - Mood Vitality score on a 1–10 scale.
   - 2–3 environmental action steps tailored to the exact physical venue.
   - Historical location-mood pattern note.
   - Matching animated anime seal (e.g. *Ichiraku Ramen* for deep comfort and recovery).
4. **Owner-Bound Storage**: The completed reflection document is saved to Cloud Firestore under the authenticated user's isolated subcollection.
5. **Geospatial & Historical Exploration**: The user explores reflections chronologically in **"My Journey"**, geospatially on the **"Places Map"**, or analytically in **"Location Moods"**.

---

## 2. High-Level Architecture

| Layer | Technologies | Responsibilities |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion | Responsive single-page interface, parchment styling, interactive animated SVG seals, form state management, real-time Firestore listeners. |
| **Geospatial** | Leaflet, OpenStreetMap Nominatim, HTML5 Geolocation | Interactive map visualization, coordinate capture, reverse geocoding, custom chakra marker pins. |
| **Backend Service** | Node.js, Express, tsx, esbuild | API proxy routing, request sanitization, crisis keyword interception, prompt construction, Gemini SDK execution. |
| **AI Intelligence** | Google Gen AI SDK (`@google/genai`) | Server-side LLM inference with automated 4-tier model fallback ladder (`gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, `gemini-3.7-flash`). |
| **Authentication** | Firebase Auth (Google Identity Services popup) | User identity verification, token issuance, session persistence. |
| **Database** | Cloud Firestore (`ai-studio-cozyjournal-...`) | Real-time NoSQL persistence with owner-bound subcollection isolation. |
| **Security & Secrets** | Google Cloud Secret Manager, Cloud Run IAM | Zero-hardcoding storage and injection of `GEMINI_API_KEY`. |
| **Container Hosting** | Google Cloud Run (Managed) | Containerized full-stack hosting on port 3000 behind reverse proxy. |

---

## 3. Security & Privacy Features

### The 5 Threat Zones Model

| Threat Zone | Potential Vulnerability | Implemented Mitigation |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious script injection, oversized payloads, NoSQL injection. | Strict input clamping (10,000 chars for journal text, 5,000 for emotional responses), defensive null-safe destructuring, and sanitization before processing. |
| **2. Planning & Reasoning** | Prompt injection attempting to alter the companion's tone, jailbreak instructions, or extract system secrets. | Inputs are strictly quarantined inside `<JournalEntry>` and `<UserLocation>` XML demarcation tags. Enforced `responseMimeType: 'application/json'` prevents raw text leakage. |
| **3. Tool Execution & SSRF** | Unauthorized API calls, arbitrary external requests. | No dynamic code execution or uncontrolled webhooks. Geocoding coordinates are strictly validated floating-point bounds. |
| **4. Memory & State** | Cross-user reflection reads, unauthorized document updates, session hijacking. | Owner-bound Firestore subcollection path (`/users/{userId}/entries/{entryId}`). Strict rule enforcement: `request.auth.uid == userId`. Wildcard deny-all on root documents. |
| **5. Inter-System Communication** | Accidental leakage of Gemini API keys or service account tokens to the client browser. | `GEMINI_API_KEY` is loaded strictly server-side in `server.ts` via container environment / Secret Manager. Zero `VITE_` public exposure. |

### Privacy & Data Ownership
- **Strict User Isolation**: Your personal diary entries are inaccessible to other users. Only your authenticated Google account can read or write to your `/users/{userId}/entries` path.
- **Client-Side Token Handling**: Google OAuth tokens are acquired strictly on the client using Firebase Auth popups. Client secrets are never handled by the backend server.
- **Offline Guest Fallback**: If unauthenticated or offline, entries are cached in the browser's local storage under `ganbatte_journal_local_entries_v1` without transmitting sensitive data across the wire.

---

## 4. Cloud Firestore & Database Configuration

### Database Instance
- **Database ID**: `ai-studio-cozyjournal-1a4c4119-f2a2-4fdb-a145-390d0901a984`
- **Region**: Cloud-managed Firestore Enterprise / Native mode.

### Master Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Zero insecure defaults: Deny all wildcard access
    match /{document=**} {
      allow read, write: if false;
    }

    // 2. Owner-isolated reflection subcollections
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Robust Client Error Handling (`FirestoreErrorInfo`)
All Firestore mutations in `src/lib/firebase.ts` capture runtime exceptions and format them according to the `FirestoreErrorInfo` schema to diagnose security rule and quota issues:
```typescript
interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}
```

---

## 5. Server-Side Gemini API Engine

### Resilient Model Fallback Ladder
In accordance with production resiliency directives, the backend does not rely on a single model string. Instead, all generation calls pass through `generateContentWithFallback`:

```
┌─────────────────────────┐
│ Primary:                │
│ "gemini-3.6-flash"      │
└────────────┬────────────┘
             │ (On 503, 429, 404, 500)
             ▼
┌─────────────────────────┐
│ High-Availability:      │
│ "gemini-3.1-flash-lite" │
└────────────┬────────────┘
             │ (On 503, 429, 404, 500)
             ▼
┌─────────────────────────┐
│ Dynamic Alias:          │
│ "gemini-flash-latest"   │
└────────────┬────────────┘
             │ (On 503, 429, 404, 500)
             ▼
┌─────────────────────────┐
│ Deep Reasoning Fallback:│
│ "gemini-3.7-flash"      │
└─────────────────────────┘
```

### Two-Stage Conversational Prompt Architecture:
- **Stage 1 (`/api/journal/clarify`)**: Evaluates the user's reflection and environmental context. Generates an empathetic acknowledgment and ONE clarifying question focused on the core emotion experienced.
- **Stage 2 (`/api/journal/analyze`)**: Analyzes the reflection, emotional response, geotagged venue, and past user history. Outputs structured JSON containing:
  - `sentiment`: High-level emotional label.
  - `moodScore`: Numeric vitality rating (1 to 10).
  - `primaryEmotion`: Standardized enum (`joyful`, `calm`, `reflective`, `anxious`, `fatigued`, `overwhelmed`, `grateful`, `restless`).
  - `emotionalSummary`: Empathetic connection between daily events and feelings.
  - `suggestions`: 2–3 gentle, actionable environmental steps.
  - `locationPatternNote`: Correlation note based on past history.
  - `stickerId`: Automated anime sticker seal match.

---

## 6. Animated Anime Stickers & Reflection Seals

Every reflection is stamped with a handcrafted animated vector seal celebrating Japanese anime and Studio Ghibli artistry:

| Sticker ID | Seal Name | Japanese Name | Core Meaning & Emotional Alignment | Animation Effect |
| :--- | :--- | :--- | :--- | :--- |
| **`ramen`** | **Ichiraku Ramen** | 一楽ラーメン | Deep comfort, nourishing warmth & joyful recovery. | Gently rising broth steam curls & chopstick bounce. |
| **`calcifer`** | **Calcifer Hearth Spirit** | カルシファーの炎 | Bright vitality, creative spark & playful warmth. | Dancing flame tongues with rising ember sparks. |
| **`leaf`** | **Konoha Whimsical Leaf** | 木の葉の意志 | Serene grounding, natural stillness & resilient spirit. | Swaying green leaf with swirling wind chakra trails. |
| **`sootsprite`** | **Susuwatari Star Sprite** | ススワタリと金平糖 | Gentle wonder, quiet hope & tender self-care. | Floating soot puff holding pastel star candy. |
| **`kitsune`** | **Kurama Nine-Tails Fox** | おやすみ九尾 | Peaceful restorative sleep, safety & deep rest. | Sleeping curled fox with swaying tails & floating 'Zzz'. |
| **`totoro`** | **Forest Guardian** | 森の守り神 | Deep shelter, mindful presence & soothing sanctuary. | Gentle umbrella tilt with falling raindrop ripples. |
| **`origami`** | **Shikigami Sky Bird** | 式神の折り鶴 | Clarity, release of burdens & soaring focus. | Gliding paper crane with floating talisman slips. |
| **`dango`** | **Hanami Sweet Dango** | 花見だんご | Savoring the present, sweetness & simple gratitude. | Three-color dango skewer with drifting sakura petals. |

*Users can also manually switch their reflection seal at any time from the confirmation screen or timeline view.*

---

## 7. Geolocation Context & Reverse Geocoding

- **HTML5 Geolocation API**: Captures latitude and longitude with high precision upon user consent.
- **Reverse Geocoding**: Queries OpenStreetMap Nominatim to resolve coordinates into:
  - `placeName` (e.g. *Ichiraku Ramen Stand*, *Central Park*, *Blue Bottle Cafe*)
  - `neighborhood` & `city`
  - `placeCategory` (*cafe*, *park*, *home*, *transit*, *office*, *general*)
- **Manual Overrides**: Users can click preset environment pills if GPS is unavailable or if they prefer not to share exact coordinates.
- **Leaf Village Interactive Map**: Powered by Leaflet with custom chakra orange marker pins colored dynamically by vitality:
  - **Emerald Green**: Mood Vitality &ge; 8.0
  - **Warm Amber**: Mood Vitality 5.0 – 7.9
  - **Coral Rose**: Mood Vitality &le; 4.9

---

## 8. Location-Mood Patterns & Correlation Engine

Ganbatte Journal automatically analyzes historical records to identify where you feel most grounded:
- **Vitality Breakdown by Environment**: Aggregates average mood scores across parks, cafes, home, transit, and workspaces.
- **Correlation Synthesis**: Identifies positive triggers (e.g. *"Your mood vitality averages +1.8 points higher when journaling near parks or green spaces"*).
- **Sensory Sanctuaries**: Provides tailored environmental tips (e.g. adjusting lighting, bringing indoor plants, or scheduling outdoor walking breaks).

---

## 9. Crisis Safety Protocol & Helplines

The application implements an acute distress intercept:
- **Automated Keyword Scanner**: Scans entries and responses for acute crisis indicators (e.g., self-harm, severe despair).
- **Safety Intercept Modal**: Instantly surfaces immediate, confidential resources:
  - **988 Suicide & Crisis Lifeline**: Direct call `tel:988` (Free, 24/7, confidential).
  - **Crisis Text Line**: Direct SMS `sms:741741?body=HOME`.
  - **The Trevor Project**: `tel:1-866-488-7386`.
- **Manual Trigger**: Users can access the **Crisis Helplines (988)** dialog at any time via the quick-action button in the header or footer.

---

## 10. Google Cloud Secret Manager Setup

Store the Gemini API key securely in Google Cloud Secret Manager and grant read permissions to the Cloud Run runtime service account:

```bash
# 1. Enable required Google Cloud APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com

# 2. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Secret Accessor permissions to the Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 11. Google Cloud Run Deployment Flow

Deploy the application directly from source:

```bash
# 1. Deploy the full-stack container to Cloud Run
gcloud run deploy ganbatte-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000

# 2. Apply mandatory campaign labeling for verification
gcloud run services update ganbatte-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

### Local Development:
```bash
# Install dependencies
npm install

# Start unified dev server (Express backend + Vite frontend on port 3000)
npm run dev

# Compile production bundle
npm run build

# Run production server
npm start
```

---

## 12. Verification & Walkthrough Checklist

| Step | Action | Expected Outcome |
| :--- | :--- | :--- |
| **1. UI Branding** | Open application in browser. | Header displays **Ganbatte Journal** beside the 🍥 emblem, with the **Ichiraku Ramen** mode pill active. |
| **2. Authentication** | Click **Sign in with Google**. | Google popup opens; upon sign-in, user avatar and email are displayed, and Firestore sync activates. |
| **3. Geolocation** | Click **Detect GPS** or select *Cafe / Eatery*. | Pill bar updates with resolved neighborhood name and venue category. |
| **4. Stage 1 Dialogue** | Enter journal text and click **Analyze & Clarify with Gemini**. | Gemini returns empathetic validation and ONE clarifying question regarding the core emotion. |
| **5. Stage 2 Synthesis** | Answer clarifying question and click **Complete & Save Reflection**. | Gemini calculates Vitality Score, generates 3 environmental steps, assigns the **Ichiraku Ramen** seal, and persists to Firestore. |
| **6. Seal Switching** | Click **Change Seal** on confirmation. | Sticker drawer opens allowing switching between all 8 animated seals. |
| **7. Journey Timeline** | Open **My Journey** tab. | Saved entries display with animated seals, mood badges, and search/filter controls. |
| **8. Geospatial Map** | Open **Places Map** tab. | Chakra orange pins appear on Leaflet map; clicking pins displays reflection popup. |
| **9. Mood Patterns** | Open **Location Moods** tab. | Aggregate score breakdown across physical spaces renders with environmental insights. |
| **10. Crisis Safety** | Click **Crisis Helplines (988)** in header. | Modal displays 988 Lifeline and Crisis Text Line direct dial/SMS links. |

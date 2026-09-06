# Ganbatte Journal — Empathetic Diary & Environmental Mood Synthesizer

A secure, full-stack user-authenticated web application powered by **Firebase Authentication (Google Sign-In)**, **Cloud Firestore**, and the **Gemini API** on **Google Cloud Run**.

Ganbatte Journal captures daily reflections alongside geotagged context, engages with users as an empathetic guide asking core emotional clarifying questions, maps emotional vitality to physical environments, and extracts historical location-mood patterns while safeguarding user data under owner-isolated database paths.

---

## Architecture & Security Highlights

1. **User Identity & Data Isolation**:
   - Federated authentication via **Google Sign-In** with Firebase Auth.
   - User reflections are stored strictly under `/users/{userId}/entries/{entryId}`.
   - Zero insecure defaults in Firestore rules — enforced with `request.auth.uid == userId`.
2. **Gemini API & Server-Side Security**:
   - `GEMINI_API_KEY` is kept strictly server-side inside Cloud Secret Manager / Cloud Run container environment variables.
   - Resilient multi-model fallback ladder: `gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash` with automatic status recovery (`503`, `429`, `404`, `500`).
3. **Environmental Context & Mood Synthesis**:
   - Captures browser coordinates with reverse geocoding to categorize physical spaces (Parks, Cafes, Home, Transit, etc.).
   - Tailors 2–3 actionable, calming steps to the specific physical environment.
   - Detects acute crisis signals and surfaces immediate confidential support resources (988 Lifeline, Crisis Text Line).

---

## 1. Cloud Firestore Security Rules

Deploy the following owner-isolated rules via the Firebase Console or Firebase CLI:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Zero insecure defaults
    match /{document=**} {
      allow read, write: if false;
    }

    // User-isolated reflection subcollections
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 2. Google Cloud Secret Manager Configuration

Store the Gemini API key securely in Google Cloud Secret Manager and grant access to the Cloud Run service account:

```bash
# 1. Enable required APIs
gcloud services enable run.googleapis.com secretmanager.googleapis.com firestore.googleapis.com

# 2. Create the Gemini API secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Secret Accessor permissions to your Cloud Run runtime service account
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Google Cloud Run Deployment Flow

Deploy the application to Google Cloud Run directly from source:

```bash
# Deploy service to Cloud Run
gcloud run deploy ganbatte-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000

# Apply required campaign labeling for challenge verification
gcloud run services update ganbatte-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 4. Local Development

```bash
# Install dependencies
npm install

# Run unified full-stack dev server
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```

---

## 5. Functional Walkthrough & Verification Steps

1. **Google Sign-In & User Identity**:
   - Click **Sign in with Google** in the top navigation.
   - Complete Google authentication; observe your avatar, name, and personal entry count display in the header.
2. **Geolocation Detection**:
   - Click **Detect GPS** or choose a custom environment tag (e.g., *Park / Outdoors*, *Cafe / Eatery*, *Home Sanctuary*).
   - Verify coordinates and neighborhood details resolve in the location pill bar.
3. **Empathetic Guide Interaction (Stage 1)**:
   - Enter a daily journal reflection into the text area.
   - Click **Reflect with Gemini Guide**.
   - Confirm that Gemini acknowledges your reflection and poses a single, focused clarifying question regarding your primary emotion.
4. **Emotional Analysis & Tailored Suggestions (Stage 2)**:
   - Respond to the clarifying question.
   - Click **Analyze & Save to Firestore**.
   - Verify that Gemini generates:
     - Primary tone & sentiment badge
     - Mood Vitality Score (1–10)
     - 2–3 actionable mood-boosting steps tailored to your current environment
     - Historical location-mood pattern note
5. **Timeline & Reflection History**:
   - Switch to the **Timeline & Reflections** tab.
   - Search by keyword or filter by emotion tag (*joyful*, *calm*, *reflective*, *anxious*, *fatigued*).
   - Expand an entry to view the full dialogue and environmental steps.
6. **Geotagged Mood Map**:
   - Switch to the **Geotagged Mood Map** tab.
   - View markers colored by mood score (Emerald &ge; 8, Amber 5–7, Coral &le; 4).
   - Click any pin to open the interactive reflection preview popup or select an entry from the side list to pan to it.
7. **Location & Mood Patterns**:
   - Switch to **Location & Mood Patterns**.
   - Review the aggregate breakdown across environments (Parks vs Home vs Cafes) and read the automated correlation synthesis.
8. **Crisis Safety Trigger**:
   - Enter distressing reflection keywords (or click **Support Helplines (988)** in the header).
   - Confirm the immediate appearance of the crisis support modal with direct call links for the 988 Lifeline and Crisis Text Line.

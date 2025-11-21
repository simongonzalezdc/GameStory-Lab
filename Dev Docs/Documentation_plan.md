This is a significant architectural upgrade. The previous plan was a "find and replace" strategy; this new plan is a **Generative Agentic Pipeline**.

To execute this with 100% success, we must move beyond simple "prompting" to **Structured Context Injection** and **Dependency-Aware Generation** (e.g., The *Roadmap* must know the *Tech Stack* defined in the *Technical Spec*).


# 🚀 Master Plan: Agentic Documentation Pipeline (MiniMax M2)

## 1. Critical Architecture Analysis
**The Flaw in the Old Plan:** It treated documents as isolated islands. If the "Technical Spec" chose PostgreSQL, the "Launch Checklist" might randomly hallucinate MongoDB because they weren't talking to each other.
**The Fix:** A **Cascading Context Pipeline**. We generate the foundational documents first (Tech Spec, Mechanics), then feed those *as context* into the downstream documents (Roadmap, Checklist).

## 2. The "MiniMax M2" Strategy
MiniMax M2 has a massive context window and high reasoning capabilities. We will leverage this for **"Whole-Project Coherence."**
*   **Input:** Raw Interview Data + Mechanics/Lore JSON.
*   **Process:** Chain-of-Thought Reasoning (force the model to "think" before writing markdown).
*   **Output:** Strict Markdown within XML tags for fail-safe parsing.

---

## Phase 1: The "Context Engine" (Data Preparation)
**File:** `packages/backend/src/services/architect/context-builder.ts` (New)

We need to serialize the messy interview data into a clean "Project Bible" string that the AI can read easily.

**Logic:**
1.  **Flatten** the interview Q&A into a narrative format.
2.  **Inject** derived data (Mechanics, Lore, Art Style).
3.  **Sanitize** JSON to reduce token usage (remove empty fields).

**Objective:** Create a `buildPromptContext(projectId)` function that returns a single, highly structured string containing the "Truth" of the project.

---

## Phase 2: The Prompt Engineering (Strict Schema)
**File:** `packages/backend/src/services/architect/prompts/document-prompts.ts`

We will not use simple text prompts. We use **System Instructions** with **One-Shot Examples**.

### 2.1 The Base System Prompt (Shared)
```typescript
export const DOCUMENT_GENERATOR_SYSTEM_PROMPT = `
You are the Lead Solutions Architect for a serious game studio.
Your goal is to write production-ready documentation.

RULES:
1. NO placeholders. If data is missing, infer reasonable defaults based on the genre/scope.
2. PROFESSIONAL TONE. Concise, active voice. No fluff.
3. STRICT FORMATTING. Use Markdown.
4. CONSISTENCY. Adhere strictly to the provided Project Context.

OUTPUT FORMAT:
You must wrap your content in XML tags like this:
<document_content>
# Document Title
... content ...
</document_content>
`;
```

### 2.2 Dependency-Aware Prompts
**Example: Technical Specification**
```typescript
export const TECH_SPEC_PROMPT = (context: string) => `
${DOCUMENT_GENERATOR_SYSTEM_PROMPT}

CONTEXT:
${context}

TASK:
Write the Technical Specification.
Focus on:
- Scalable Architecture (Monorepo, Microservices vs Monolith)
- Database Schema (Entities for the specific game mechanics mentioned)
- API Strategy (REST vs GraphQL)

CRITICAL REASONING:
Before writing, analyze the 'Game Mechanics' in the context.
If the game is Multiplayer, you MUST include WebSocket architecture.
If the game is Single Player, focus on local state persistence.
`;
```

**Example: Development Roadmap (Depends on Tech Spec)**
```typescript
export const ROADMAP_PROMPT = (context: string, techSpecSummary: string) => `
${DOCUMENT_GENERATOR_SYSTEM_PROMPT}

CONTEXT:
${context}

TECHNICAL CONSTRAINTS:
${techSpecSummary}

TASK:
Create a Phased Roadmap.
Phase 1 must implement the "Core Loop" defined in the context.
Phase 2 must implement the "Meta-Game".
Ensure the timeline accounts for the complexity of the stack defined in Technical Constraints.
`;
```

---

## Phase 3: The "AI Document Generator" Service
**File:** `packages/backend/src/services/architect/ai-document-generator.ts`

This service orchestrates the API calls. It must handle the **Schema Mismatch** issues we saw earlier by using robust regex extraction.

**Key Methods:**
1.  `generateSingleDocument(type, context)`: Calls MiniMax.
2.  `generateAllDocuments(projectId)`: Orchestrates the cascade (Tech Spec first -> then others).
3.  `parseOutput(rawString)`: Extracts text between `<document_content>` tags.

**Robust Parsing Logic (Crucial for 100% Success):**
```typescript
private parseDocumentContent(rawResponse: string): string {
    // 1. Try extracting XML block
    const match = rawResponse.match(/<document_content>([\s\S]*?)<\/document_content>/);
    if (match && match[1]) return match[1].trim();

    // 2. Fallback: Strip markdown code fences if the model wrapped it in ```markdown
    const codeBlock = rawResponse.match(/```(?:markdown)?([\s\S]*?)```/);
    if (codeBlock && codeBlock[1]) return codeBlock[1].trim();

    // 3. Last resort: Return raw (cleaned)
    return rawResponse.replace(/```/g, '').trim();
}
```

---

## Phase 4: Integration & Persistence
**File:** `packages/backend/src/services/architect/architect-service.ts`

Update the service to use the new generator.

**Refined Logic:**
1.  **Status Updates:** Since generating 5 documents via LLM takes time (30s+), we cannot block the HTTP request.
    *   *Strategy:* The initial request returns `202 Accepted`.
    *   *Background:* The server processes the list.
    *   *Persistence:* Save documents to DB with `status: 'generating'` -> `status: 'completed'`.
2.  **Fallback Mechanism:** If MiniMax fails (500 Error), we catch it and log it, but do *not* revert to templates (templates are useless for this). Instead, mark the document as `status: 'failed'` so the user can click "Retry".

---

## Phase 5: Frontend Polish (The "Preview")
**File:** `packages/frontend/src/pages/ProjectArchitectPage.tsx`

To fix the visual issues mentioned in previous logs:
1.  **Markdown Rendering:** Use `react-markdown` with the `remark-gfm` plugin to support tables and checklists.
2.  **Loading States:** When `status === 'generating'`, show a skeleton loader or the "Sparkles" animation.
3.  **Styling:** Ensure the `.markdown-body` class has correct dark-mode overrides (headers shouldn't be black on dark gray).

---

## Execution Checklist

### Step 1: Setup Prompts
- [ ] Create `prompts/document-prompts.ts`.
- [ ] Define `DOCUMENT_TYPES` enum (ExecutiveSummary, TechSpec, Roadmap, etc.).
- [ ] Implement the "Cascading Context" logic (ensure Roadmap prompt accepts Tech inputs).

### Step 2: Build Service
- [ ] Create `AIDocumentGenerator` class.
- [ ] Implement `buildContext(projectId)`.
- [ ] Implement `callMiniMax(prompt)` with retry logic (3 retries with exponential backoff).
- [ ] Implement `parseDocumentContent` with the XML regex approach.

### Step 3: Integrate Backend
- [ ] Modify `ArchitectService.generateDocumentation`.
- [ ] Add `isGenerating` flag to the Project entity (or a separate `DocumentGenerationJob` table if you want to be fancy, but a flag is fine for now).

### Step 4: Frontend Update
- [ ] Update `ProjectArchitectPage` to poll for document status if the list is empty but `project.isGeneratingDocs` is true.
- [ ] Verify `ReactMarkdown` rendering for complex tables and code blocks.


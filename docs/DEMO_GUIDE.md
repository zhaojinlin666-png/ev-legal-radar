# EV Legal Radar — Demo Guide

## 30-second introduction

> I am a law student exploring how AI can support regulatory intelligence and preliminary compliance review without replacing legal judgment. I built EV Legal Radar to connect a regulatory update with impact assessment, a concrete review task, and document review. The AI output is deliberately separated into exact document evidence, locally verified legal authority, preliminary analysis, and next steps. The backend validates both evidence and citations, and every AI finding remains subject to human legal review.

## Demo Flow

This walkthrough is designed for approximately 3–5 minutes.

### 1. Open the regulatory workflow

- **Click:** `Regulatory Update Radar` in the top navigation.
- **System:** Displays locally defined regulatory change events with jurisdiction, dates, impact level, verification status, and a visible `Demo change event` label.
- **Explain:** “This is an on-demand, single-source workflow prototype. Demo events are deliberately labelled so source metadata is not confused with a legally reviewed alert.”

#### Optional official-source fetch demonstration

- **Click:** `获取最新监管动态`.
- **System:** The local backend retrieves the current first-page listing metadata from the configured China National Internet Information Office source, filters titles with a visible keyword list, and adds new cards marked `Source detected`.
- **Explain:** “These cards show official-source metadata only. They have not been legally verified or given an impact level. Re-fetching does not duplicate a card during the current browser session.”
- **Click:** `Start Legal Review` on one detected card.
- **System:** Creates an `Unreviewed` review event with `Unclassified` change type, no impact level, no affected activities, no suggested documents, and no generated tasks.
- **Explain:** “This transition makes the trust boundary visible: source detection starts a human workflow but does not fabricate legal analysis.”

### 2. Select the China automotive-data scenario

- **Click:** `汽车数据安全管理若干规定（试行）`.
- **System:** Opens the regulatory-change detail with the five-stage workflow, impact summary, affected activities, suggested documents, and tasks.
- **Explain:** “The project translates a regulatory research record into practical questions and documents for review. The impact level is a prioritisation signal, not a legal conclusion.”

### 3. Inspect the impact assessment

- **Click:** No action required; briefly scroll through `What Changed`, `Potentially Affected Activities`, and `Documents / Evidence to Review`.
- **System:** Shows only locally stored demo content and existing source metadata.
- **Explain:** “This layer identifies where a legal reviewer might start. It does not claim that any real company performs these activities or has a compliance gap.”

### 4. Open a privacy-notice review task

- **Click:** Expand the task whose suggested documents include `用户隐私政策`.
- **System:** Shows review questions, suggested documents, the related demo event, legal topic, priority, and workflow source reference. Questions and task status can be updated in local React state.
- **Explain:** “The task turns a general regulatory issue into facts and documents a junior legal reviewer can investigate. This state is not saved to a database.”

### 5. Enter Document Review

- **Click:** `Review Document`.
- **System:** Opens `Upload Your Document` and carries over the related regulation, event, task, topic, suggested document, and risk level.
- **Explain:** “This Review Context is navigation metadata only. It is explicitly excluded from document evidence and verified legal authority.”

### 6. Select a document

- **Click:** `Select TXT document`, then choose a non-empty `.txt` privacy notice or automotive-data notice.
- **System:** Uses the browser's `FileReader` to show name, size, type, character count, and full preview.
- **Explain:** “File reading and preview stay in the browser. Rule-based review is also local. The text is sent externally only if I explicitly run AI-assisted review.”

### 7. Show the two review modes

- **Click:** Briefly compare `Rule-based Review` and `AI-assisted Review`.
- **System:** Rule-based mode immediately runs eight keyword/text-pattern checks. AI-assisted mode waits for an explicit request.
- **Explain:** “The rule-based mode is transparent but shallow. The AI mode adds semantic analysis while keeping the same controlled review rules and result categories.”

### 8. Run AI-assisted Review

- **Click:** `AI-assisted Review`, then `Run AI-assisted Review`.
- **System:** Sends document text, canonical rules, and verified source metadata to the local backend. The backend supplies rule-specific authority records to OpenAI and validates the structured response.
- **Explain:** “The API key remains server-side. The model cannot freely choose legal citations; it can return only the authority IDs allowlisted for that review rule.”

### 9. Inspect a finding

- **Click:** No action required; scroll through one or two result cards.
- **System:** Separates issue summary, exact document evidence, verified Legal Authority cards, AI analysis, risk explanation, suggested revision, next step, confidence, and human-review status.
- **Explain:** “Document evidence answers ‘what does this file say?’ Legal authority answers ‘what verified source is relevant?’ AI analysis compares the two. Keeping them separate makes the result easier to audit.”

### 10. Return to the task

- **Click:** `Back to originating regulatory review task`.
- **System:** Returns to the regulatory event and highlights the originating task.
- **Explain:** “This closes the workflow loop: the AI review is part of a legal task, not a standalone chatbot conversation.”

## Three Things to Highlight

### 1. End-to-end legal workflow rather than a standalone chatbot

The project links regulatory research, impact triage, tasks, documents, findings, and human review. AI is one controlled stage inside the workflow.

### 2. Separation of evidence, authority, and analysis

Uploaded-document quotations are validated against the document. Legal authority is reconstructed from a verified local allowlist. The model's preliminary analysis and recommendation appear separately.

### 3. Human-in-the-loop and anti-hallucination design

The server checks rule identity, structured output, citation IDs, exact evidence, and prohibited definitive conclusions. Unsupported legal mappings display `LEGAL_SOURCE_NOT_VERIFIED`. These controls reduce specific hallucination risks but do not replace professional legal verification.

## Questions an Interviewer May Ask

### 1. Why did you build this?

Regulatory updates and document review are often treated as separate tasks. I wanted to explore how a structured workflow could help a junior legal reviewer move from a regulatory issue to concrete questions, documents, evidence, and a reviewable preliminary finding.

### 2. Why not just use ChatGPT directly?

A generic chat interface does not automatically enforce the source and evidence boundaries I wanted. This prototype supplies canonical rules, restricts legal citations to a local verified allowlist, requires exact document evidence, validates structured output on the server, and keeps the human reviewer in control.

### 3. How do you reduce hallucination risk?

The model receives only rule-specific verified authority records. It returns authority IDs rather than creating citations. The server rejects unapproved IDs and evidence that cannot be found verbatim in the uploaded text. Unsupported mappings remain `LEGAL_SOURCE_NOT_VERIFIED`.

### 4. Does the AI decide whether a company violated the law?

No. The permitted statuses are `Found`, `Potential Gap`, and `Further Review Required`. The prompt and validation reject definitive legal conclusions, and the UI identifies the work as preliminary and subject to human review.

### 5. Where do the legal provisions come from?

They are maintained as local provision records with official source URLs and `verified` status. The current knowledge base contains 14 provision records from the PRC Personal Information Protection Law and the Provisions on the Management of Automotive Data Security (Trial).

### 6. Why is human review still required?

A document rarely contains the complete business facts needed for a legal conclusion. Applicability, data classification, actual system behaviour, other laws, and missing documents may all change the analysis. Confidence in text analysis is not confidence in legal compliance.

### 7. What would you build next?

I would expand the verified knowledge base, connect controlled official-source ingestion, support more document formats, and add an auditable reviewer history. I would keep the same separation between source evidence, model analysis, and human approval.

### 8. What did you personally learn from building this as a law student?

I learned that the important design question is not only whether an AI can produce an answer, but whether a legal reviewer can trace the answer to the document, identify the authority used, understand uncertainty, and know what to verify next. Translating legal reasoning into explicit data structures and validation rules was central to the project.

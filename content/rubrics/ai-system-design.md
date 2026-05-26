# AI System Design Interview — Evaluation Rubric

## DASME Framework Dimensions

Score each dimension 1–5. Use the descriptors below.

---

### D — Data Strategy (max 5)

**What we're evaluating:**
- Clarity on what data the system needs to train, fine-tune, or run inference
- Identification of data sources (user data, third-party, synthetic)
- Data quality, freshness, and labelling requirements
- Privacy and compliance implications of data choices

**Score descriptors:**
- 5 = Named specific datasets, addressed labelling pipeline, flagged privacy constraints
- 4 = Clear on data sources and quality; minor gaps in privacy or labelling
- 3 = Identified data needs but vague on sourcing or quality
- 2 = Mentioned data is needed without specifics
- 1 = No data discussion

---

### A — Architecture (max 5)

**What we're evaluating:**
- Model choice rationale (LLM vs fine-tuned vs rules-based)
- System components and how they connect (pipeline, APIs, databases)
- Trade-offs: latency vs accuracy, cost vs quality, build vs buy
- Handling of edge cases and failure states

**Score descriptors:**
- 5 = Specific model choices with trade-off reasoning; clear component diagram; failure modes addressed
- 4 = Good component breakdown; model choice justified; minor gaps in failure handling
- 3 = Reasonable architecture but model choice unexplained or trade-offs surface-level
- 2 = High-level components only; no model reasoning
- 1 = No architecture discussion

---

### S — Success Metrics (max 5)

**What we're evaluating:**
- Model metrics (precision, recall, F1, latency, cost/inference)
- User/product metrics (engagement, task completion, error rate)
- Business metrics (revenue impact, cost savings)
- How metrics inform iteration

**Score descriptors:**
- 5 = Three-layer metrics (model + user + business); explained how each informs product decisions
- 4 = Two layers covered; clear connection to iteration
- 3 = Mixed model and product metrics; one layer missing
- 2 = Only business metrics; no model-layer metrics
- 1 = No metrics discussion

---

### M — Model Selection & Trade-offs (max 5)

**What we're evaluating:**
- Reasoning for LLM vs ML vs rule-based choice
- Fine-tuning vs RAG vs in-context learning trade-offs
- Latency, cost, accuracy balance
- Model versioning and drift

**Score descriptors:**
- 5 = Specific model family named; fine-tune vs RAG reasoning; latency/cost quantified; drift handling mentioned
- 4 = Model family named; trade-offs discussed; drift not addressed
- 3 = Generic "use an LLM" without specifics; some trade-off awareness
- 2 = Model mentioned without reasoning
- 1 = No model discussion

---

### E — Evaluation & Safety (max 5)

**What we're evaluating:**
- Offline eval strategy (holdout sets, human evals, automated scoring)
- Online eval (A/B tests, shadow mode, canary deploys)
- Safety, bias, and hallucination mitigation
- Monitoring and alerting in production

**Score descriptors:**
- 5 = Both offline and online eval strategies; explicit safety and bias mitigations; production monitoring
- 4 = Strong offline eval; light on online or safety
- 3 = Eval mentioned but strategy unclear; safety not addressed
- 2 = Mentioned testing without specifics
- 1 = No evaluation discussion

---

## Scoring Guide

| Total | Band | Interpretation |
|-------|------|---------------|
| 23–25 | Exceptional | Ready for Anthropic / OpenAI system design loop |
| 18–22 | Strong | Would pass most AI PM system design rounds |
| 13–17 | Developing | Core structure present; depth gaps in 2–3 dimensions |
| 8–12 | Early | Surface-level; needs framework and ML depth |
| 5–7 | Not ready | Restart with DASME framework before next attempt |

---

## Mandatory Dimensions Checklist

Before closing evaluation, verify the candidate addressed ALL of:
- [ ] Who the primary user is and what their goal is
- [ ] At least one model choice with rationale
- [ ] At least one trade-off with reasoning (e.g. RAG vs fine-tune, accuracy vs latency)
- [ ] At least one success metric with model-layer specificity
- [ ] At least one safety or failure-mode consideration

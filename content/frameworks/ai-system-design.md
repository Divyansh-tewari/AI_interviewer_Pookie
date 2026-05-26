# AI System Design — Interview Framework (DASME)

## How to Approach Any AI System Design Question

Use the DASME framework as your spine. Touch all 5 dimensions in every answer.

---

## Step 1: Clarify (2–3 minutes)

Before designing anything, clarify:
1. **Who is the user?** (Consumer vs enterprise, technical vs non-technical)
2. **What is the primary job-to-be-done?** (Not the feature — the outcome)
3. **What scale?** (DAUs, QPS, latency expectations)
4. **What constraints?** (Cost, latency, privacy, regulation)
5. **What does success look like?** (Force the conversation to metrics early)

Do NOT dive into architecture before clarifying. Real interviewers will penalise you for skipping this.

---

## Step 2: Data Strategy (D)

Structure your answer around:

**Sources:**
- User-generated data (what users do in the product)
- Labelled data (how you get ground truth)
- Synthetic data (when real data is insufficient or privacy-sensitive)
- Third-party data (what you buy or license)

**Key questions to answer:**
- How much labelled data do you need for the chosen model approach?
- Who labels it and how do you maintain quality?
- Is there a cold-start problem? How do you solve it?
- What PII or regulatory constraints apply?

**Common trade-off to name:** Real data (high quality, limited volume) vs synthetic data (scalable, distribution shift risk)

---

## Step 3: Architecture (A)

**Model choice decision tree:**
- Is the task well-defined with sufficient labelled data? → Fine-tuned model or classical ML
- Is the task open-ended, semantic, or language-heavy? → LLM (with RAG or in-context learning)
- Is the task deterministic and rule-expressible? → Rules + ML hybrid
- Is real-time inference required? → Smaller model or distilled model

**Pipeline components to mention:**
- Ingestion layer (how data enters)
- Feature store or embedding store (what gets pre-computed)
- Model serving (synchronous API vs async job)
- Caching layer (for expensive inference)
- Feedback loop (how user signals improve the model)

**Common trade-off to name:** Accuracy vs latency (larger model = better results, slower response)

---

## Step 4: Success Metrics (S)

Always give three layers:

**Model metrics** (what the ML team watches):
- Classification: precision, recall, F1, AUC-ROC
- Generation: BLEU/ROUGE, BERTScore, human eval score
- Retrieval: hit rate, MRR, NDCG
- Latency: p50, p95, p99 response time
- Cost: cost per inference

**User/product metrics** (what the PM watches):
- Task completion rate
- User satisfaction (thumbs up/down, CSAT, NPS)
- Error rate / fallback rate
- Feature adoption

**Business metrics** (what the CEO watches):
- Revenue impact
- Cost savings
- Retention lift

---

## Step 5: Model Selection & Trade-offs (M)

**Fine-tuning vs RAG vs In-context learning:**

| | Fine-tuning | RAG | In-context |
|-|-------------|-----|------------|
| Best for | Narrow domain, style transfer | Knowledge-heavy, frequently updated content | General tasks, low data volume |
| Cost | High (training) | Medium (retrieval infra) | Low |
| Latency | Low | Medium (retrieval hop) | Low |
| Hallucination risk | Low (domain-specific) | Medium (retrieval errors) | High (no grounding) |
| Update speed | Slow (retrain cycle) | Fast (update vector store) | Immediate |

**When to fine-tune:** You have 1000+ labelled examples, the task is narrow, and you need consistent output format.

**When to RAG:** Your knowledge base changes frequently or is too large for context windows.

---

## Step 6: Evaluation & Safety (E)

**Offline evaluation:**
- Hold-out test set (20% of data, never trained on)
- Human evaluation for subjective quality
- Automated LLM-as-judge for scalable assessment
- Red-teaming for safety (adversarial prompts)

**Online evaluation:**
- Shadow mode (run new model alongside old, compare outputs, no user impact)
- Canary deploy (route 1–5% of traffic to new model)
- A/B test (measure user-facing metrics with statistical significance)

**Safety checklist:**
- Hallucination mitigation (grounding, citations, confidence thresholds)
- Bias testing (demographic parity, fairness metrics)
- PII leakage prevention (output filtering, training data scrubbing)
- Graceful degradation (what happens when the model fails?)

---

## Common Interview Mistakes

1. **Jumping to model before clarifying the problem** — Interviewers penalise this heavily
2. **Only mentioning business metrics** — No model-layer metrics = weak AI PM signal
3. **"Use an LLM" without justification** — Always explain why LLM over fine-tuned model
4. **Ignoring cold-start** — Every AI product has a cold-start problem
5. **No safety mention** — At Anthropic especially, this is table stakes
6. **Perfect system with no trade-offs** — Real systems have constraints; naming trade-offs shows maturity

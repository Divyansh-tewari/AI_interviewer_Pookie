# AI System Design — Sample Answer Reference

## Example Question: Design an AI content moderation system for a social media platform

---

### Clarification (2 min)

"Before I design, let me clarify a few things.

Who is this for — a consumer UGC platform like Instagram, or a B2B community tool? I'll assume consumer with 50M DAU. 

What types of content? Text, images, video? I'll scope to text + images for now.

What's the latency requirement? Real-time pre-post (block before publish) or near-real-time (flag within seconds)? I'll assume pre-post for high-risk content, near-real-time for nuanced cases.

What regulatory environment? EU DSA applies — we need explainability and appeal mechanisms.

Success for this system: >99% recall on high-severity content (CSAM, credible threats) and <0.5% false positive rate on normal content."

---

### Data Strategy

"For training data, I'd use three sources:

**Labelled violation data** — historical content our trust and safety team has already reviewed and actioned. This is our highest quality signal. Likely 10–50M labelled examples for a platform at scale.

**Synthetic adversarial data** — generated examples that probe edge cases (subtle hate speech, coded language). Essential because bad actors evolve faster than organic violation data accumulates.

**Third-party signals** — PhotoDNA hash database for CSAM, known-terrorist-content hashes from GIFCT. These are rule-based catches that don't require ML.

Cold-start problem: For a new platform, I'd use a foundation model pre-trained on Common Crawl and fine-tune on a licensed violation dataset from a data provider before we have proprietary data."

---

### Architecture

"I'd build a tiered pipeline:

**Tier 1 — Hash matching (synchronous, <10ms):** Check against known-bad hash databases. Zero ML cost, zero false positives on known content. Blocks obvious violations before they reach the queue.

**Tier 2 — Fast classifier (synchronous, <200ms):** Fine-tuned DistilBERT for text, fine-tuned EfficientNet for images. Binary decision: definitely safe, definitely harmful, or uncertain. Handles 90% of cases.

**Tier 3 — Heavy model (async, <2s):** GPT-4o or Claude Haiku via API for ambiguous cases from Tier 2. Provides reasoning and confidence score. Feeds human review queue.

**Tier 4 — Human review:** Tier 3 outputs with confidence < 0.8 go to human reviewers. Their decisions become training data for Tier 2 retraining.

Trade-off I'm making: Tier 2 is a smaller model for latency; Tier 3 is a large LLM for accuracy. Cost per moderation decision goes from $0.0001 (Tier 2) to $0.01 (Tier 3) — so I want Tier 3 to handle <5% of volume."

---

### Success Metrics

"Three layers:

**Model metrics:**
- Recall on high-severity categories: >99.9% (missing CSAM is unacceptable)
- Precision on normal content: >99.5% (false positives destroy creator trust)
- p95 latency for Tier 1+2: <500ms
- Cost per moderation decision: <$0.001 blended

**Product metrics:**
- False positive appeal rate (creators appealing wrongful removals) — target <0.1%
- Time-to-moderation for urgent content (credible threats) — target <60 seconds
- Moderator throughput for Tier 4 review queue — steady state, no backlog

**Business metrics:**
- Regulatory compliance score (DSA transparency reports)
- Advertiser brand safety score
- Creator retention rate among non-violating accounts"

---

### Model Selection Trade-offs

"Why fine-tuned models over pure LLM for Tiers 1–2:

Fine-tuned DistilBERT processes 10,000 items/second at <$5/hr on GPU. A comparable LLM API call costs 100x more and is 20x slower. For a platform with 50M DAU generating 5M posts/day, that cost difference is the difference between a viable product and bankruptcy.

Why LLM for Tier 3:
Nuanced hate speech, context-dependent content (satire vs. genuine threat), multi-lingual edge cases — these require reasoning, not pattern matching. LLMs handle this class of problem far better than fine-tuned classifiers at <5% of total volume.

Fine-tuning vs RAG here: Fine-tuning wins. Our violation taxonomy is stable (updates quarterly), we have millions of labelled examples, and we need consistent structured output (category + severity + confidence). RAG would introduce retrieval latency and retrieval errors for no benefit."

---

### Evaluation & Safety

"Offline evaluation:
- 20% holdout set stratified by content category and severity
- Quarterly red-team exercises: dedicated team generates adversarial content to probe model weaknesses
- Human eval panel rates 1,000 random decisions monthly for calibration

Online evaluation:
- Shadow mode for every Tier 2 model update: run new model in parallel for 72 hours before cutover
- 1% canary deploy with statistical significance gate before full rollout
- Automated recall monitoring — if recall on any severity tier drops >0.5%, auto-rollback triggers

Safety considerations:
- Model explainability: every removal decision includes a policy category and confidence score (required for DSA)
- Appeal mechanism: all automated removals are appealable to human review within 24 hours
- Moderator wellbeing: Tier 4 human reviewers are shown <100 pieces of graphic content per day; rotation policy enforced
- Data governance: training data with PII is scrubbed; violation data retained for minimum required period only"

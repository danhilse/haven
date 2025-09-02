ok, good clarity. here’s how i’d freeze the mvp spec given your answers:

⸻

mvp spec: nonprofit prompt library

core concept
	•	flat prompt library (all ~365 templates available)
	•	two entry points:
	1.	search/semantic query (“we need a donor letter”)
	2.	browse by category → subcategory → prompt
	•	execution: run chosen prompt w/ injected org profile + user’s “situation” text → get gpt-5 output (markdown/plaintext first, gdocs export roadmap).

⸻

prompts & metadata
	•	source: raw md files, unedited.
	•	collapsed variants: “high/medium/low” merged into one prompt, selectable via “complexity” slider or dropdown.
	•	metadata to add:
	•	category/subcategory (from folder tree)
	•	tags (audience, content type, channel)
	•	complexity level
	•	org profile: one-time inputs (name, mission, tone, region) stored and always injected.

⸻

search strategy
	•	baseline: index prompt titles + auto-gen short description.
	•	stretch: add embeddings (cheap e5-small-v2) into convex if keyword search feels weak.
	•	retrieval = keyword filter → optional embeddings rerank → top N prompts returned.

⸻

inference
	•	model: gpt-5 (server-side via vercel sdk).
	•	output: markdown. gdocs export stubbed but not active.
	•	inputs per run: org profile + freeform “situation” textbox + optional extra fields (later).
	•	rate-limiting: ip-level cap.

⸻

ux
	•	minimal, “formspark flow” style.
	•	start screen: [search box] OR [browse categories].
	•	category view: breadcrumb nav → list of prompts.
	•	prompt view: details + fields → run → output page.
	•	no multi-pane tree.
	•	extras: favorites + history postponed.

⸻

backend / data model (convex)
	•	collections:
	•	prompts (id, title, text, category, tags, complexity)
	•	org_profiles (user_id, fields)
	•	runs (id, prompt_id, org_profile_id, user_input, output, timestamp)
	•	embeddings (prompt_id, vector) [optional]
	•	no auth: private link + ip filter.

⸻

roadmap (not mvp)
	•	gdocs export
	•	localization
	•	analytics/feedback
	•	multi-tenant / roles
	•	playbooks (multi-step prompt flows)
	•	auto-fill org data from uploaded docs
	•	style memory

⸻
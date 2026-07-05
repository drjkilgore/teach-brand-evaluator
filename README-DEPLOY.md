# #TEACH Brand Evaluator — Deployment Guide (no command line needed)

Upload any marketing piece (image or PDF) → scored against the #TEACH brand standards and
format-specific effectiveness criteria from the Marketing Collateral Review → prioritized
fix list to reach 9–10, with a projected score.

## Repo structure (upload exactly this to GitHub via the web UI)

```
/index.html
/netlify.toml
/netlify/functions/evaluate.js
```

## Step 1 — GitHub
1. Create a new repository (e.g. `teach-brand-evaluator`).
2. "Add file → Upload files" and upload `index.html` and `netlify.toml` to the root.
3. Create the function file via "Add file → Create new file", name it
   `netlify/functions/evaluate.js` (typing the slashes creates the folders), and paste
   the contents of evaluate.js.

## Step 2 — Netlify
1. "Add new site → Import an existing project" → pick the repo. Build settings: none needed
   (no build command; publish directory = repo root).
2. Site settings → Environment variables → add:
   - Key: `ANTHROPIC_API_KEY`  Value: your Anthropic API key
3. Deploy. The app is live; the function runs at `/.netlify/functions/evaluate`.

## Step 3 — Supabase (optional: evaluation history)
Skip this entirely and the app still works — history just stays hidden.

1. In Supabase → SQL Editor, run:

```sql
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  piece_name text,
  piece_type text,
  brand_score numeric,
  effectiveness_score numeric,
  composite numeric,
  verdict text,
  fixes jsonb,
  checklist jsonb
);

alter table public.evaluations enable row level security;

create policy "anon can insert evaluations"
  on public.evaluations for insert to anon with check (true);

create policy "anon can read evaluations"
  on public.evaluations for select to anon using (true);
```

2. In `index.html`, near the top of the `<script>` block, set:
   - `SUPABASE_URL` = your project URL (Settings → API)
   - `SUPABASE_ANON_KEY` = the anon public key
3. Commit the edit on GitHub; Netlify redeploys automatically.

Note: history is intentionally metadata-only (names, types, scores, verdict, fixes) — uploaded
artwork is never stored, so there's nothing sensitive at rest.

## What the evaluator knows
The serverless function carries the full review rubric: the exact palette (#8B0000, #002E5D,
#12A7E6, #F5F5F5, #C5C5C5), the two approved logo lockups, the Inter typography rule and the
no-script-fonts tip, the classroom photography direction, the high-contrast tip, per-format
effectiveness criteria (candidate flyers vs. B2B vs. banners vs. cards vs. program documents
vs. presentations), the template-placeholder policy, and calibration anchors from the actual
scored pieces (Flyer 1 = 8.5/9.0, business card = 8.5/9.0, hybrid = 9.0/9.0, the 4.0-range
failures) so scores line up with the review rather than drifting.

## Costs & limits
- Each evaluation is one Claude API call (Sonnet, vision). Images are resized client-side to
  ≤1568px before upload; PDFs capped at 4 MB.
- The API key lives only in Netlify env vars — never in the page.

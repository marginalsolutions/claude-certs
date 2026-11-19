# Claude Cert Academy

An open-source study platform for Anthropic's four Claude certification exams.
Learn each concept with worked examples and diagrams, then test yourself with
flashcards, true/false statements, practice quizzes and timed exam simulations
that follow the official blueprints.

| Exam | Code | Items | Fee | Domains |
|---|---|---|---|---|
| Claude Certified Associate – Foundations | CCAO-F | 60 | $99 | 7 |
| Claude Certified Developer – Foundations | CCDV-F | 53 | $125 | 8 |
| Claude Certified Architect – Foundations | CCAR-F | 60 (scenario based) | $125 | 5 |
| Claude Certified Architect – Professional | CCAR-P | 63 | $175 | 7 |

All four are 120 minutes, proctored through Pearson VUE, scored 100–1,000 with a
720 cut score, and valid for 12 months. Blueprints and objectives are transcribed
from the official exam guides (v1.0, July 2026). Anthropic has announced updated
guides for 17 November 2026 and updated exam content from 7 December 2026; check
the [Partner Academy](https://anthropic-partners.skilljar.com/) for the latest.

## What's inside

- **Concepts.** Each concept has 3–5 teaching sections, several worked examples
  (including a realistic mistake and its fix), key points, and links to the
  official docs. Concepts are tagged to every exam domain they support, so one
  lesson counts toward several certifications.
- **Diagrams.** Twenty inline SVG diagrams (agentic loop, prompt caching, MCP
  architecture, CLAUDE.md hierarchy, layered guardrails, RAG pipeline, and more)
  that adapt to light and dark themes.
- **Flashcards.** Leitner spaced repetition with five boxes. Missed cards come
  back the next day; known cards spread out to 1, 3, 7 and 21 days.
- **Statements.** Fast true/false drills with plausible false claims, written
  the way exam distractors are.
- **Quiz and exam simulation.** Practice mode explains every answer. Exam mode
  runs the official time limit, draws questions in blueprint proportions, hides
  feedback until the end, and reports a per-domain breakdown plus an estimated
  scaled score.
- **Progress.** Stored only in the browser. Per-exam, per-domain and per-card
  tracking, with a history of attempts and the weakest domain highlighted.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Build a static site into `dist/` (deployable anywhere, including GitHub Pages):

```bash
npm run build
```

Validate all content against the schema and depth targets:

```bash
npm run validate
```

## Deploy to GitHub Pages

The repository ships a workflow in `.github/workflows/deploy.yml`. In the GitHub
repository settings, under Pages, set the source to **GitHub Actions**. Every
push to `main` then validates, builds and deploys the site. The app uses a hash
router and a relative base path, so it works under any repository name.

## Project layout

```
src/
  content/
    types.ts            # the Concept schema
    certifications.ts   # official blueprints for the four exams
    concepts/           # one file per concept, grouped by exam
  diagrams/             # SVG diagram components and registry
  components/           # flashcard deck, quiz runner, statement drill, UI bits
  pages/                # routes
  lib/                  # content queries, progress storage, exam builder
scripts/validate-content.ts
docs/content-style-guide.md   # how to write accurate, exam-aligned content
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The short version: copy an existing
concept file, follow the style guide, run `npm run validate`, open a pull
request. Never contribute real exam questions.

## Disclaimer

Community material. Not affiliated with or endorsed by Anthropic. Claude is a
trademark of Anthropic, PBC. Exam structure and objectives are summarized from
Anthropic's publicly distributed exam guides; all teaching content, examples and
questions are original.

## License

MIT.

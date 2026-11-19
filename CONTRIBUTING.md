# Contributing

Thanks for helping people pass the Claude certifications. Content contributions
are the most valuable thing you can add.

## Add a concept

1. Pick the exam and domain it serves. Domain ids are in
   `src/content/certifications.ts` (for example `ccdv-f-5`).
2. Copy `src/content/concepts/ccdv-f/prompt-caching.ts` to
   `src/content/concepts/<cert>/<your-id>.ts` and rewrite it. Read
   `docs/content-style-guide.md` for the depth targets and the current platform
   facts.
3. Register it in the barrel file for its group (the `_*.ts` file in the same
   folder) or directly in `src/content/concepts/index.ts`.
4. Run the checks:

```bash
npm run validate
```

```bash
npm run build
```

5. Open a pull request. CI runs the same two commands.

## Add a diagram

Diagrams are inline SVG React components in `src/diagrams/set*.tsx` built from
the primitives in `src/diagrams/primitives.tsx`. Register the component with a
title and caption in `src/diagrams/index.tsx`, then reference its id from
`Concept.diagram`. Use the `d-box-*`, `d-text*` and `d-line*` classes so the
diagram adapts to light and dark themes.

## Accuracy

The exams are about Claude as it exists now. When the API or a product changes,
update the concept and the facts table in `docs/content-style-guide.md` in the
same pull request. Prefer official documentation links in `resources`.

## What not to contribute

Do not add real exam questions. Every candidate signs a non-disclosure agreement
and reproducing live items would get them banned. Write original scenario
questions in the official style instead.

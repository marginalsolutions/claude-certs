/**
 * Content schema for Claude Cert Academy.
 *
 * Everything a learner sees is built from these types. To add content, create a
 * new file in src/content/concepts/<cert>/ that exports a Concept (or an array of
 * Concepts) and register it in src/content/concepts/index.ts.
 */

export type CertId = 'ccao-f' | 'ccdv-f' | 'ccar-f' | 'ccar-p';

export interface Skill {
  /** Skill name as printed in the official exam guide. */
  name: string;
  /** Share of the overall exam, in percent (Developer exam only). */
  weight?: number;
  description: string;
}

export interface Domain {
  /** Stable id, e.g. "ccdv-f-2". */
  id: string;
  number: number;
  name: string;
  /** Percent of scored items drawn from this domain. */
  weight: number;
  /** Objectives / task statements as printed in the official exam guide. */
  objectives: string[];
  /** Developer exam lists weighted skills instead of plain objectives. */
  skills?: Skill[];
}

export interface Scenario {
  title: string;
  description: string;
  primaryDomains: string[];
}

export interface Certification {
  id: CertId;
  code: string;
  name: string;
  shortName: string;
  level: 'Foundations' | 'Professional';
  role: 'Associate' | 'Developer' | 'Architect';
  tagline: string;
  description: string;
  audience: string;
  items: number;
  minutes: number;
  passingScore: number;
  priceUsd: number;
  validityMonths: number;
  /** Architect Foundations is scenario-based. */
  scenarios?: Scenario[];
  domains: Domain[];
  recommendedExperience: string[];
}

export interface Section {
  heading: string;
  /** Markdown. Keep paragraphs short; use lists and tables freely. */
  body: string;
}

export interface Example {
  title: string;
  /** Markdown. The situation and why it matters. */
  description: string;
  /** Optional code or config. */
  code?: string;
  language?: 'python' | 'typescript' | 'json' | 'bash' | 'yaml' | 'markdown' | 'text';
  /** One sentence: the lesson the example teaches. */
  takeaway: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Indices into options. One index for multiple-choice, several for multiple-response. */
  correct: number[];
  explanation: string;
}

export interface Statement {
  /** A short claim the learner marks true or false. */
  text: string;
  isTrue: boolean;
  explanation: string;
}

export interface Resource {
  label: string;
  url: string;
}

export interface Concept {
  /** URL-safe, globally unique, e.g. "prompt-caching". */
  id: string;
  title: string;
  /** One or two sentences shown in lists. */
  summary: string;
  certs: CertId[];
  /** Domain ids this concept supports, e.g. ["ccdv-f-5", "ccar-p-2"]. */
  domains: string[];
  tags: string[];
  difficulty: 'foundations' | 'intermediate' | 'advanced';
  /** Optional id of a diagram registered in src/diagrams/index.tsx. */
  diagram?: string;
  sections: Section[];
  examples: Example[];
  keyPoints: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  statements: Statement[];
  resources: Resource[];
}

import { Link } from 'react-router-dom';
import { certifications, conceptsForCert, totals } from '../lib/content';
import { useProgress } from '../lib/progress';
import { Chip, ProgressBar } from '../components/ui';

export function HomePage() {
  const t = totals();
  const [p] = useProgress();
  return (
    <>
      <section className="hero">
        <div className="eyebrow">Open-source exam prep</div>
        <h1>Learn everything Claude. Prove it on all four certifications.</h1>
        <p className="lead">
          Lessons with worked examples, visual diagrams, flashcards, true/false drills and exam-style quizzes, organized
          around the official blueprints for the Associate, Developer and Architect exams.
        </p>
        <div className="row" style={{ marginTop: '1rem' }}>
          <Link className="btn btn-primary btn-lg" to="/cert/ccdv-f">
            Start with the Developer exam
          </Link>
          <Link className="btn btn-lg" to="/quiz">
            Take a practice quiz
          </Link>
        </div>
        <div className="row" style={{ marginTop: '1.4rem', gap: '1.6rem' }}>
          <div className="stat">
            <b>{t.concepts}</b>
            <span className="small muted">concepts</span>
          </div>
          <div className="stat">
            <b>{t.examples}</b>
            <span className="small muted">worked examples</span>
          </div>
          <div className="stat">
            <b>{t.flashcards}</b>
            <span className="small muted">flashcards</span>
          </div>
          <div className="stat">
            <b>{t.questions}</b>
            <span className="small muted">quiz questions</span>
          </div>
          <div className="stat">
            <b>{t.statements}</b>
            <span className="small muted">true/false statements</span>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ marginTop: '1rem' }}>The four exams</h2>
        <p className="muted">
          Each exam is 120 minutes, proctored through Pearson VUE, scored 100–1,000 with a 720 cut score, and valid for 12
          months. Pick a path or mix and match: many concepts count toward several exams.
        </p>
        <div className="grid-2">
          {certifications.map((c) => {
            const list = conceptsForCert(c.id);
            const read = list.filter((x) => p.readConcepts[x.id]).length;
            return (
              <Link key={c.id} to={`/cert/${c.id}`} className="card card-link">
                <div className="row spread" style={{ marginBottom: '0.4rem' }}>
                  <Chip tone="accent">{c.code}</Chip>
                  <Chip>{c.level}</Chip>
                </div>
                <h3>{c.name}</h3>
                <p className="muted small">{c.tagline}</p>
                <div className="row small faint" style={{ marginBottom: '0.6rem' }}>
                  <span>{c.items} items</span>
                  <span>·</span>
                  <span>{c.domains.length} domains</span>
                  <span>·</span>
                  <span>${c.priceUsd}</span>
                  <span>·</span>
                  <span>{list.length} concepts</span>
                </div>
                <ProgressBar value={read} max={list.length || 1} />
              </Link>
            );
          })}
        </div>
      </section>

      <section style={{ marginTop: '2.5rem' }}>
        <h2>How to study here</h2>
        <div className="grid">
          <div className="card">
            <h3>1. Learn</h3>
            <p className="muted small">
              Each concept teaches the mechanism, the tradeoffs and the exam angle, with several worked examples including a
              realistic mistake and its fix.
            </p>
          </div>
          <div className="card">
            <h3>2. See it</h3>
            <p className="muted small">
              Diagrams show the moving parts: the agentic loop, prompt caching, MCP architecture, the CLAUDE.md hierarchy,
              layered guardrails and more.
            </p>
          </div>
          <div className="card">
            <h3>3. Drill</h3>
            <p className="muted small">
              Flashcards use a Leitner schedule so cards you miss come back sooner. Statements are quick true/false checks.
            </p>
          </div>
          <div className="card">
            <h3>4. Simulate</h3>
            <p className="muted small">
              Exam mode draws questions in blueprint proportions, runs a timer and reports a per-domain breakdown like the
              real score report.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

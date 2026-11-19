import { Link, useParams } from 'react-router-dom';
import { certById, conceptsForCert } from '../lib/content';
import type { CertId } from '../content/types';
import { Chip, DomainCoverage, DomainWeights, EmptyState } from '../components/ui';
import { useProgress } from '../lib/progress';

export function CertPage() {
  const { certId } = useParams();
  const cert = certById(certId ?? '');
  const [p] = useProgress();
  if (!cert) return <EmptyState title="Unknown certification" />;
  const list = conceptsForCert(cert.id as CertId);
  const read = list.filter((c) => p.readConcepts[c.id]).length;
  const lastExam = p.attempts.find((a) => a.mode === 'exam' && a.certId === cert.id);

  return (
    <>
      <div className="eyebrow">
        <Link to="/">Home</Link> / {cert.code}
      </div>
      <div className="row spread" style={{ alignItems: 'flex-start' }}>
        <div style={{ maxWidth: 720 }}>
          <h1>{cert.name}</h1>
          <p className="lead">{cert.description}</p>
        </div>
      </div>
      <div className="row" style={{ margin: '0.5rem 0 1.5rem' }}>
        <Chip tone="accent">{cert.code}</Chip>
        <Chip>{cert.items} items</Chip>
        <Chip>{cert.minutes} minutes</Chip>
        <Chip>Pass: {cert.passingScore} / 1,000</Chip>
        <Chip>${cert.priceUsd} USD</Chip>
        <Chip>Valid {cert.validityMonths} months</Chip>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2>Blueprint</h2>
          <p className="small muted">Share of scored items per domain. Click a domain to study it.</p>
          <DomainWeights cert={cert} />
        </div>
        <div className="stack">
          <div className="card">
            <h2>Your progress</h2>
            <p className="small muted">
              {read} of {list.length} concepts read
              {lastExam ? ` · last exam simulation: ${lastExam.scaled} / 1,000` : ''}
            </p>
            <div className="row">
              <Link className="btn btn-primary" to={`/quiz?cert=${cert.id}&mode=exam`}>
                Exam simulation
              </Link>
              <Link className="btn" to={`/flashcards?cert=${cert.id}`}>
                Flashcards
              </Link>
              <Link className="btn" to={`/statements?cert=${cert.id}`}>
                Statements
              </Link>
              <Link className="btn" to={`/quiz?cert=${cert.id}`}>
                Practice quiz
              </Link>
            </div>
          </div>
          <div className="card">
            <h3>Who it is for</h3>
            <p className="small muted">{cert.audience}</p>
            <h3 style={{ marginTop: '0.8rem' }}>Recommended experience</h3>
            <ul className="small muted" style={{ paddingLeft: '1.1rem', margin: 0 }}>
              {cert.recommendedExperience.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {cert.scenarios && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Exam scenarios</h2>
          <p className="muted">
            Every question on this exam is framed by one of six production scenarios. Four are drawn at random per sitting.
          </p>
          <div className="grid">
            {cert.scenarios.map((s, i) => (
              <div className="card" key={s.title}>
                <div className="eyebrow">Scenario {i + 1}</div>
                <h3>{s.title}</h3>
                <p className="small muted">{s.description}</p>
                <div className="row">
                  {s.primaryDomains.map((d) => {
                    const dom = cert.domains.find((x) => x.id === d);
                    return (
                      <Link key={d} to={`/cert/${cert.id}/domain/${d}`} className="chip chip-info">
                        D{dom?.number} {dom?.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: '2rem' }}>
        <h2>Domains</h2>
        <div className="grid">
          {cert.domains.map((d) => (
            <DomainCoverage key={d.id} domain={d} certId={cert.id} />
          ))}
        </div>
      </section>
    </>
  );
}

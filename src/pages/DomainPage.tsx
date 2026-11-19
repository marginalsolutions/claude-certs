import { Link, useParams } from 'react-router-dom';
import { certById, conceptsForDomain } from '../lib/content';
import { Chip, ConceptCard, EmptyState } from '../components/ui';
import { useProgress } from '../lib/progress';

export function DomainPage() {
  const { certId, domainId } = useParams();
  const cert = certById(certId ?? '');
  const domain = cert?.domains.find((d) => d.id === domainId);
  const [p] = useProgress();
  if (!cert || !domain) return <EmptyState title="Unknown domain" />;
  const list = conceptsForDomain(domain.id);
  const read = list.filter((c) => p.readConcepts[c.id]).length;

  return (
    <>
      <div className="eyebrow">
        <Link to="/">Home</Link> / <Link to={`/cert/${cert.id}`}>{cert.code}</Link> / Domain {domain.number}
      </div>
      <h1>{domain.name}</h1>
      <div className="row" style={{ margin: '0.4rem 0 1.2rem' }}>
        <Chip tone="accent">{domain.weight}% of the exam</Chip>
        <Chip>≈ {Math.round((domain.weight / 100) * cert.items)} questions</Chip>
        <Chip>
          {read} / {list.length} concepts read
        </Chip>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2>Official objectives</h2>
          <p className="small muted">As listed in the Anthropic exam guide. Items are written against these.</p>
          <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
            {domain.objectives.map((o) => (
              <li key={o} style={{ marginBottom: '0.35rem' }}>
                {o}
              </li>
            ))}
          </ul>
        </div>
        <div className="stack">
          {domain.skills && (
            <div className="card">
              <h2>Weighted skills</h2>
              <p className="small muted">The Developer exam breaks each domain into skills with their own weight.</p>
              <table>
                <tbody>
                  {domain.skills.map((s) => (
                    <tr key={s.name}>
                      <td>
                        <b>{s.name}</b>
                        <div className="small muted">{s.description}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{s.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="card">
            <h3>Drill this domain</h3>
            <div className="row">
              <Link className="btn btn-primary" to={`/quiz?cert=${cert.id}&domain=${domain.id}`}>
                Quiz
              </Link>
              <Link className="btn" to={`/flashcards?cert=${cert.id}&domain=${domain.id}`}>
                Flashcards
              </Link>
              <Link className="btn" to={`/statements?cert=${cert.id}&domain=${domain.id}`}>
                Statements
              </Link>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Concepts</h2>
      {list.length === 0 ? (
        <EmptyState title="No concepts yet for this domain">
          Content for this domain is still being written. See the contributing guide in the repository to add some.
        </EmptyState>
      ) : (
        <div className="grid">
          {list.map((c) => (
            <ConceptCard key={c.id} c={c} certId={cert.id} />
          ))}
        </div>
      )}
    </>
  );
}

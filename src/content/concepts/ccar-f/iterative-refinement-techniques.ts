import type { Concept } from '../../types';

export const iterativeRefinementTechniques: Concept = {
  id: 'iterative-refinement-techniques',
  title: 'Iterative Refinement Techniques',
  summary:
    'Progressively improve Claude Code output with concrete input/output examples, test-driven iteration, the interview pattern, and the right batching of fixes: all interacting issues in one message, independent issues one at a time.',
  certs: ['ccar-f', 'ccdv-f', 'ccar-p'],
  domains: ['ccar-f-3', 'ccdv-f-6', 'ccdv-f-3', 'ccar-p-7'],
  tags: ['claude-code', 'prompting', 'workflow', 'testing'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Concrete examples beat prose when prose is misread',
      body: `A natural-language description of a transformation is interpreted. "Normalise phone numbers" might mean strip spaces, add a country code, or convert to E.164, and two sessions may pick different readings. When output is inconsistent across attempts, the fix is rarely more adjectives. It is **two or three concrete input/output pairs**:

\`\`\`text
"(415) 555-0100"      -> "+14155550100"
"+44 20 7946 0958"    -> "+442079460958"
"555-0100"            -> null   # no area code: cannot be normalised
\`\`\`

Examples pin down the ambiguous cases (what happens with missing information, what format the output takes) in a way prose does not. Pick examples that cover the edges you care about, not three variations of the easy case. This is the same principle as few-shot prompting in the API, applied to a coding conversation.`,
    },
    {
      heading: 'Test-driven iteration',
      body: `Writing the tests first turns a vague request into an executable specification. The workflow:

1. Ask Claude Code to write a test suite covering expected behaviour, edge cases and any performance requirement, *before* implementing.
2. Review the tests. They are far easier to review than an implementation, and gaps show up immediately.
3. Ask for the implementation, then run the tests.
4. Share the **failures** (the assertion messages, not "it doesn't work") and iterate.

Each failing test is a precise, unambiguous piece of feedback. "Edge case handling is wrong" invites guessing; "test_null_email_is_skipped fails: expected 0 rows inserted, got 1" does not. When a specific edge case is mishandled, add a test with the exact input and expected output rather than describing the case in words. The exam guide's example is null values in a migration script: supply a fixture row with nulls and the expected result.`,
    },
    {
      heading: 'The interview pattern',
      body: `When you ask for an implementation in a domain you know only partly, you will under-specify it, and Claude will fill the gaps with reasonable defaults that may not be yours. The interview pattern inverts the flow: before implementing, ask Claude to **ask you questions** about requirements, constraints and failure modes.

For a caching layer, for example, the questions surface cache invalidation strategy, TTL versus event-driven expiry, what happens on a backend failure, consistency expectations, and memory bounds. You may not have thought of half of these. Answering them before any code exists is cheaper than discovering them in review or production.

Use the interview pattern when the domain is unfamiliar, the requirements are implicit, or the cost of a wrong default is high. Skip it for routine tasks where the defaults are fine.`,
    },
    {
      heading: 'Batching fixes: interacting vs independent issues',
      body: `After a review you often have several issues to feed back. The order and grouping matter:

- **Interacting issues go in one detailed message.** If fixing issue A changes how issue B should be fixed (a data-model change and a validation that depends on it, a retry policy and the idempotency it requires), fixing them sequentially produces churn: the second fix undoes or fights the first. Describe all of them together so one coherent change addresses them.
- **Independent issues can go sequentially.** A typo in a log message, an off-by-one in pagination and a missing docstring do not interact. Handling them one at a time keeps each change small, reviewable and easy to verify. Sequential iteration also lets you stop early if the first fix reveals something new.

A useful question: "would fixing these in either order produce the same result?" If yes, they are independent. If the right fix for one depends on the other, batch them.`,
    },
  ],
  examples: [
    {
      title: 'Fixing inconsistent output with three examples',
      description:
        'A data team asked Claude Code to "convert the legacy address records into the new schema". Three runs produced three different handling strategies for missing postcodes and multi-line street fields. Instead of rewording the prose, they added three input/output pairs covering a complete record, a record with no postcode, and a record with a two-line street. The next run matched all three and generalised correctly to the rest.',
      language: 'text',
      code: `Input:  {"street": "12 High St\\nFlat 3", "city": "Leeds", "postcode": ""}
Output: {"line1": "12 High St", "line2": "Flat 3", "city": "Leeds", "postcode": null}

Input:  {"street": "1 Main Rd", "city": "York", "postcode": "YO1 7HH"}
Output: {"line1": "1 Main Rd", "line2": null, "city": "York", "postcode": "YO1 7HH"}`,
      takeaway: 'When prose produces inconsistent results, show the transformation instead of describing it.',
    },
    {
      title: 'Test-first for a rate limiter',
      description:
        'An engineer needed a token-bucket rate limiter with a hard requirement of under 50 microseconds per check. They asked Claude Code for the test suite first: steady-state throughput, burst handling, clock skew, concurrent access, and a performance test with the latency bound. Reviewing the tests revealed a missing case (bucket refill after long idle). Implementation followed; two tests failed; the failures were pasted back verbatim and the second iteration passed.',
      language: 'python',
      code: `def test_refill_after_long_idle(limiter, clock):
    limiter.try_acquire()            # drain one token
    clock.advance(seconds=3600)      # idle for an hour
    assert limiter.available() == limiter.capacity  # must not exceed capacity

def test_check_latency_under_50us(limiter, benchmark):
    result = benchmark(limiter.try_acquire)
    assert result.stats.mean < 50e-6`,
      takeaway: 'Tests written first are a reviewable specification, and failures are precise feedback.',
    },
    {
      title: 'The mistake: sequential fixes to interacting problems',
      description:
        'A review found that an order-processing change (1) stored amounts as floats and (2) compared totals with exact equality. A developer asked for fix 1 alone; Claude switched to a Decimal type. Then they asked for fix 2; Claude added an epsilon comparison, which is wrong for Decimals and reintroduced imprecision. Both issues were about the same thing: money representation. Sending them together produced one coherent change: Decimal storage with exact comparison.',
      takeaway: 'If the right fix for one issue depends on another, describe both in a single message.',
    },
    {
      title: 'Interviewing before building a cache',
      description:
        'A backend developer unfamiliar with caching asked Claude Code to "add caching to the product catalogue endpoint". Before implementing, they asked Claude to interview them. Questions covered invalidation on price updates, acceptable staleness, behaviour when the cache is unavailable, memory limits, and whether personalised results must bypass the cache. Two of those (personalisation and price updates) would have caused production bugs under the default design.',
      takeaway: 'In unfamiliar domains, let Claude surface the questions before it makes assumptions.',
    },
  ],
  keyPoints: [
    'When prose descriptions are interpreted inconsistently, provide 2 to 3 concrete input/output examples covering the edge cases.',
    'Test-driven iteration: write tests for expected behaviour, edge cases and performance first, then iterate by sharing exact failures.',
    'To fix a mishandled edge case (such as nulls in a migration), give a specific test case with input and expected output.',
    'The interview pattern has Claude ask questions before implementing, surfacing considerations like cache invalidation and failure modes.',
    'Interacting issues belong in one detailed message so a single coherent change addresses them.',
    'Independent issues can be fixed sequentially, keeping each change small and verifiable.',
    'Ask "would fixing these in either order give the same result?" to tell independent from interacting issues.',
  ],
  flashcards: [
    { front: 'What is the most effective fix when a prose description yields inconsistent transformations?', back: 'Provide 2 to 3 concrete input/output examples, including the edge cases.' },
    { front: 'Describe test-driven iteration with Claude Code.', back: 'Write the test suite first (behaviour, edge cases, performance), implement, then share the exact test failures to guide each iteration.' },
    { front: 'How should you report a mishandled edge case such as null values?', back: 'With a specific test case: the exact input and the expected output.' },
    { front: 'What is the interview pattern?', back: 'Asking Claude to question you about requirements, constraints and failure modes before it implements.' },
    { front: 'When is the interview pattern most valuable?', back: 'In unfamiliar domains or when requirements are implicit and wrong defaults are costly.' },
    { front: 'How should interacting issues be fed back?', back: 'Together, in a single detailed message, so one coherent change resolves them.' },
    { front: 'How should independent issues be fed back?', back: 'Sequentially, one at a time, keeping each change small and reviewable.' },
    { front: 'What test tells you whether two issues are independent?', back: 'Whether fixing them in either order produces the same result.' },
  ],
  quiz: [
    {
      question:
        'A team asked Claude Code to "normalise customer names" and got different casing and whitespace handling on each run. Which change is MOST likely to produce consistent results?',
      options: [
        'Add "be very precise and consistent" to the prompt.',
        'Provide two or three input/output examples covering mixed case, extra whitespace and empty values.',
        'Switch to a larger model.',
        'Ask Claude to explain its reasoning before each run.',
      ],
      correct: [1],
      explanation:
        'Concrete examples pin down the ambiguous choices that prose leaves open. Adjectives, a bigger model, or explanations do not remove the ambiguity.',
    },
    {
      question:
        'A migration script generated by Claude Code mishandles rows with null email addresses. What is the BEST way to fix this?',
      options: [
        'Tell Claude "handle nulls properly".',
        'Provide a test case with a fixture row containing a null email and the expected result.',
        'Rewrite the migration by hand.',
        'Add a CLAUDE.md rule saying "always handle nulls".',
      ],
      correct: [1],
      explanation:
        'A specific test with input and expected output is unambiguous and verifiable. "Properly" is open to interpretation, rewriting by hand abandons the workflow, and a generic rule does not define the expected behaviour for this case.',
    },
    {
      question:
        'A review of a payment change found that (a) amounts are stored as floats and (b) totals are compared with exact equality. How should these be sent to Claude Code?',
      options: [
        'Fix (a) first, verify, then send (b) in a separate message.',
        'Send both in one detailed message because the right fix for (b) depends on how (a) is resolved.',
        'Send (b) first because comparisons are easier to change.',
        'Send only (a); (b) will resolve itself.',
      ],
      correct: [1],
      explanation:
        'These issues interact: the correct comparison depends on the chosen numeric representation. Sequential fixes risk a second change that conflicts with the first, and ignoring (b) leaves a bug.',
    },
    {
      question: 'Which TWO are appropriate uses of the interview pattern? (Select two)',
      options: [
        'Before implementing a caching layer in a domain the developer knows only partly.',
        'Before fixing a typo in a comment.',
        'Before designing retry behaviour for a payment integration where wrong defaults are costly.',
        'After the implementation is merged, to document what was built.',
      ],
      correct: [0, 2],
      explanation:
        'The interview pattern surfaces hidden requirements before implementation in unfamiliar or high-stakes domains. A typo fix has no hidden requirements, and post-merge documentation is a different activity.',
    },
    {
      question:
        'After implementing a feature, Claude Code\'s output fails three unrelated tests: a log format, a pagination off-by-one, and a missing docstring. What is a reasonable approach?',
      options: [
        'Fix them one at a time, verifying each, since they are independent.',
        'Refuse to proceed until all three are described in one message.',
        'Discard the implementation and start over in plan mode.',
        'Fix only the pagination bug; the others are not real failures.',
      ],
      correct: [0],
      explanation:
        'Independent issues can be handled sequentially, keeping each change small. Batching is for interacting issues; restarting is disproportionate; all three are real failures.',
    },
  ],
  statements: [
    { text: 'Two or three concrete input/output examples are usually more effective than longer prose when a transformation is being interpreted inconsistently.', isTrue: true, explanation: 'Examples resolve the ambiguities that prose leaves open, especially for edge cases.' },
    { text: 'In test-driven iteration, the implementation should be written before the tests so the tests match real behaviour.', isTrue: false, explanation: 'Tests come first; they are the specification. Writing them after the implementation lets the implementation define correctness.' },
    { text: 'The interview pattern means Claude asks the developer questions before implementing.', isTrue: true, explanation: 'It surfaces considerations such as invalidation strategy and failure modes the developer may not have anticipated.' },
    { text: 'Interacting issues should be fixed sequentially so each fix can be verified in isolation.', isTrue: false, explanation: 'Interacting fixes depend on each other; sequential fixes cause churn. Describe them together in one message.' },
    { text: 'Independent issues can reasonably be addressed one at a time.', isTrue: true, explanation: 'Sequential iteration keeps each change small and reviewable when the fixes do not affect one another.' },
    { text: 'Sharing the exact test failure output is less useful than describing the problem in your own words.', isTrue: false, explanation: 'Exact failures are precise, unambiguous feedback; paraphrases invite guessing.' },
  ],
  resources: [
    { label: 'Claude Code best practices', url: 'https://code.claude.com/docs/en/best-practices' },
    { label: 'Claude Code common workflows', url: 'https://code.claude.com/docs/en/common-workflows' },
  ],
};

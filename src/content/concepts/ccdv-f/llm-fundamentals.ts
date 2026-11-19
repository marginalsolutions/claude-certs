import type { Concept } from '../../types';

export const llmFundamentals: Concept = {
  id: 'llm-fundamentals',
  title: 'LLM Fundamentals: Tokens, Context and Generation',
  summary:
    'How Claude turns text into tokens, what the context window holds, how next-token generation and sampling make outputs vary, and why knowledge cutoff and hallucination follow from the way models work.',
  certs: ['ccdv-f', 'ccao-f', 'ccar-p'],
  domains: ['ccdv-f-5', 'ccao-f-3', 'ccao-f-2', 'ccar-p-2'],
  tags: ['tokens', 'context-window', 'sampling', 'fundamentals'],
  difficulty: 'foundations',
  diagram: 'context-window',
  sections: [
    {
      heading: 'Tokens and tokenization',
      body: `Models do not read characters or words; they read **tokens**, chunks produced by a tokenizer that splits text into frequent pieces. In English prose a token is roughly three to four characters, so 100 tokens is about 75 words. Code, JSON, non-English text and rare words split into more tokens per character, and images and PDFs are converted to token-equivalents too.

Everything is priced and limited in tokens: input tokens (what you send), output tokens (what Claude writes, including thinking), and cached tokens. Tokenizers are **model specific**. Sonnet 5 and Haiku 5.5 introduced a newer tokenizer that counts the same text as roughly 30% more tokens than their predecessors, which is why a model upgrade can raise costs with an unchanged prompt. Do not estimate Claude tokens with another vendor's tokenizer; use \`client.messages.count_tokens(model=..., messages=...)\` with the model you will call.`,
    },
    {
      heading: 'The context window',
      body: `The **context window** is the total number of tokens the model can attend to in one request: system prompt, tool definitions, the whole conversation so far, documents, tool results, thinking, and the response being generated. Current Claude models (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.x) have a **1M-token** window and up to **128K output tokens**; Haiku 4.5 is the older exception at 200K.

A large window is not free memory. Every token in the window is processed on every request, so cost and time-to-first-token grow with it, and quality can degrade when the relevant facts are buried in a very long context. The model has no memory between requests: a "conversation" exists only because your code resends the history each turn. That is why context management techniques exist: prompt caching to avoid re-paying for a stable prefix, compaction to summarise old turns, context editing to drop stale tool results, and subagents to keep noisy work out of the main window. If the request exceeds the window you get a 400 error, not a silent truncation, so size \`max_tokens\` so that input plus output fits.`,
    },
    {
      heading: 'Next-token generation, sampling and non-determinism',
      body: `Claude generates a response one token at a time. At each step the model computes a probability distribution over all possible next tokens, given everything in the context plus what it has produced so far, then **samples** one token and repeats until it emits a stop token, hits \`max_tokens\`, or a stop sequence appears. Because each step samples from a distribution rather than always taking the top token, the same prompt can produce different outputs on different runs. Numerical differences in distributed hardware add further variation.

Historically developers tuned this with \`temperature\`, \`top_p\` and \`top_k\`. On current Claude models these parameters are **removed** (a 400 on Opus 5.5, Opus 5, Fable 5.x, Opus 4.7+), and on API version \`2026-10-21\` they are rejected for every model. Anthropic's current models manage sampling internally; you control behaviour through the prompt, structured outputs and effort, not sampling knobs.

Consequences for engineering: never assume two calls will match; validate outputs against a schema; write evals that measure rates, not single runs; and design agent loops to tolerate a step that is phrased differently each time. Non-determinism is a property of generation, not a bug to be configured away.`,
    },
    {
      heading: 'Knowledge cutoff and hallucination',
      body: `A model's parameters encode patterns learned from training data up to a **knowledge cutoff**. Anything after that date, anything private to your company, and anything too rare to have been learned well is simply not in the weights. Ask about it and the model will still produce fluent text, because producing the most plausible next token is what it does. That is **hallucination**: confident output that is not grounded in fact. It is a property of generation, not an occasional malfunction, so it has to be engineered around rather than wished away.

Mitigations that work:

- **Put the facts in the context**: retrieval, documents, tool results. The model is far more reliable at reading than at recalling.
- **Give it permission to say "I don't know"** and ask for citations to the provided material.
- **Constrain the output** with schemas and enums so invented values are impossible or detectable.
- **Verify downstream**: validate ids against your database, run generated code, cross-check numbers.
- **Use web search or tools for current information** instead of relying on the cutoff.

The Associate exam frames this as "identify hallucinations and decide when human review is needed"; the Developer exam frames it as grounding, validation and skepticism toward confident output. Both rest on the same mechanism.`,
    },
  ],
  examples: [
    {
      title: 'Counting tokens before sending',
      description:
        'A team pastes whole PDFs into prompts and sometimes gets 400 errors. Counting tokens first lets them decide whether to chunk or summarise, and to size max_tokens so the total fits.',
      language: 'python',
      code: `import anthropic
client = anthropic.Anthropic()

count = client.messages.count_tokens(
    model="claude-opus-5-5",
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": document_text}],
)
print(count.input_tokens)
if count.input_tokens + 8_000 > 1_000_000:   # leave room for the answer
    document_text = chunk_and_summarize(document_text)`,
      takeaway: 'Token counts are model-specific; measure with count_tokens on the model you will call and leave headroom for output.',
    },
    {
      title: 'Mistake: trying to make output deterministic with temperature',
      description:
        'A developer migrating from an older model set temperature=0 "for reproducible JSON" and every call to claude-opus-5-5 failed with 400. Sampling parameters are gone on current models; the reliable route to consistent structure is a schema, and the reliable route to consistent decisions is validation and evals.',
      language: 'python',
      code: `# Before: 400 invalid_request_error on current models
# resp = client.messages.create(model="claude-opus-5-5", temperature=0, ...)

# After: constrain the shape instead of the sampling
resp = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    output_config={"format": {"type": "json_schema", "schema": DECISION_SCHEMA}},
    messages=[{"role": "user", "content": ticket}],
)`,
      takeaway: 'You cannot switch non-determinism off; design for it with schemas, validation and rate-based evals.',
    },
    {
      title: 'A hallucinated API in generated code',
      description:
        'Claude wrote code calling `client.messages.summarize()`, a method that does not exist. The model had seen many SDKs with similar helpers and produced the plausible continuation. The team fixed it by putting the SDK reference in context and running the generated code in a test before accepting it.',
      takeaway: 'Plausible is not the same as true; ground the model with reference material and verify outputs mechanically.',
    },
    {
      title: 'Context window as working memory',
      description:
        'A customer-support bot "forgot" a user\'s order number after 40 turns. Nothing was wrong with the model: the application was trimming old messages to save cost and dropped the turn with the number. Moving critical facts into a short structured summary that is always resent fixed it.',
      takeaway: 'The model only knows what is in the current request; your code decides what that is.',
    },
  ],
  keyPoints: [
    'Tokens are the unit of input, output, pricing and limits; roughly 3-4 English characters each, more for code and non-English.',
    'Tokenizers differ by model; newer tokenizers (Sonnet 5, Haiku 5.5) count ~30% more tokens for the same text. Use count_tokens, never another vendor\'s tokenizer.',
    'Current models have a 1M-token context window and up to 128K output tokens (Haiku 4.5: 200K). Exceeding it is a 400.',
    'The model is stateless; conversation exists because you resend history. Big windows cost money and can hurt focus.',
    'Generation is token-by-token sampling from a probability distribution, so identical prompts can yield different outputs.',
    'temperature, top_p and top_k are removed on current models and rejected on API version 2026-10-21; steer with prompts, schemas and effort.',
    'Knowledge cutoff bounds what is in the weights; hallucination is fluent, ungrounded output and is inherent to generation.',
    'Mitigate hallucination by putting facts in context, allowing "I don\'t know", constraining outputs, and verifying downstream.',
  ],
  flashcards: [
    { front: 'Roughly how many characters is one token in English prose?', back: 'About 3-4 characters; 100 tokens is roughly 75 words.' },
    { front: 'Why can a model upgrade raise token costs with the same prompt?', back: 'Tokenizers are model specific; e.g. Sonnet 5 / Haiku 5.5 count about 30% more tokens for the same text.' },
    { front: 'Context window of current Claude models?', back: '1M tokens, with up to 128K output tokens. Haiku 4.5 is 200K.' },
    { front: 'What happens if a request exceeds the context window?', back: 'A 400 error; the input is not silently truncated.' },
    { front: 'What does the model actually compute at each generation step?', back: 'A probability distribution over possible next tokens, from which one is sampled.' },
    { front: 'Status of temperature / top_p / top_k on current models?', back: 'Removed; sending them returns 400 on Opus 5.5, Opus 5, Fable 5.x, Opus 4.7+, and on API version 2026-10-21 for every model.' },
    { front: 'How do you count tokens accurately for Claude?', back: 'client.messages.count_tokens(model=..., system=..., messages=..., tools=...) with the same model you will call.' },
    { front: 'Define hallucination in one sentence.', back: 'Fluent, confident output that is not grounded in the context or in facts, produced because the model always emits the most plausible next token.' },
    { front: 'Does Claude remember previous API requests?', back: 'No. Each request is stateless; the application resends the history to create a conversation.' },
  ],
  quiz: [
    {
      question:
        'A team moves an unchanged prompt from claude-sonnet-4-6 to claude-sonnet-5-5 and sees input token counts rise about 30%. What is the MOST likely explanation?',
      options: [
        'The new model adds hidden system instructions to every request.',
        'The new model uses a different tokenizer that splits the same text into more tokens.',
        'The context window shrank, so tokens are counted twice.',
        'Prompt caching was disabled by the upgrade.',
      ],
      correct: [1],
      explanation:
        'Tokenization is model specific and the newer tokenizer counts more tokens. Hidden instructions are not billed to you, the context window did not shrink, and caching affects price, not the count of input tokens.',
    },
    {
      question:
        'An engineer wants identical JSON for identical inputs and sets temperature=0 on claude-opus-5-5. What happens, and what should they do instead?',
      options: [
        'It works; temperature 0 makes output deterministic.',
        'The request returns 400; use structured outputs with a JSON schema and validate the result.',
        'The request succeeds but is slower; add top_k=1 as well.',
        'The request returns 429; wait and retry.',
      ],
      correct: [1],
      explanation:
        'Sampling parameters are removed on current models. Structured outputs constrain the shape; validation catches the rest. Non-determinism cannot be fully eliminated.',
    },
    {
      question:
        'A chatbot confidently cites a company policy that does not exist. Which TWO changes most directly reduce this? (Select two)',
      options: [
        'Provide the actual policy text in the context and instruct the model to answer only from it.',
        'Increase max_tokens so the model can explain more.',
        'Allow the model to say it does not know and require citations to the provided text.',
        'Switch to a model with a larger context window.',
      ],
      correct: [0, 2],
      explanation:
        'Grounding plus permission to abstain and cite attacks the mechanism of hallucination. Longer outputs and a bigger window do nothing if the facts are not supplied.',
    },
    {
      question: 'Which statement about the context window is correct?',
      options: [
        'It only counts the user messages, not tool results or system prompts.',
        'It persists between API requests so the model remembers past conversations.',
        'It includes system prompt, tools, history, tool results, thinking and the generated response.',
        'Exceeding it silently drops the oldest messages.',
      ],
      correct: [2],
      explanation:
        'Everything in the request counts. The API is stateless, and overflow produces a 400 rather than silent truncation.',
    },
    {
      question:
        'Why should evals report pass rates over many runs rather than a single run per case?',
      options: [
        'Because the API caches results and a single run may be stale.',
        'Because generation samples from a distribution, so a single run can pass or fail by chance.',
        'Because single runs are not billed.',
        'Because the tokenizer changes between runs.',
      ],
      correct: [1],
      explanation:
        'Non-determinism means one sample is weak evidence. Caching does not return stale answers, every run is billed, and tokenizers are fixed per model.',
    },
  ],
  statements: [
    { text: 'A token corresponds to exactly one word.', isTrue: false, explanation: 'Tokens are sub-word pieces; roughly 3-4 characters in English, more pieces for code and non-English text.' },
    { text: 'Current Claude models have a 1M-token context window.', isTrue: true, explanation: 'Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.x; Haiku 4.5 is 200K.' },
    { text: 'Setting temperature to 0 is the recommended way to get reproducible output on claude-opus-5-5.', isTrue: false, explanation: 'Sampling parameters are removed on current models and return 400; use structured outputs and validation.' },
    { text: 'The model generates text one token at a time by sampling from a probability distribution.', isTrue: true, explanation: 'This is why outputs vary between runs.' },
    { text: 'Hallucination only occurs when the prompt is ambiguous.', isTrue: false, explanation: 'It is inherent to generation: the model produces plausible text whenever the facts are not available, ambiguous prompt or not.' },
    { text: 'Token counts for the same text can differ between Claude models.', isTrue: true, explanation: 'Tokenizers are model specific; always count with the target model.' },
    { text: 'The Claude API keeps conversation state server side between normal Messages requests.', isTrue: false, explanation: 'Requests are stateless; the client resends history each turn (message threads and compaction are separate opt-in features).' },
  ],
  resources: [
    { label: 'Context windows', url: 'https://platform.claude.com/docs/en/build-with-claude/context-windows' },
    { label: 'Token counting', url: 'https://platform.claude.com/docs/en/build-with-claude/token-counting' },
    { label: 'Reduce hallucinations', url: 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations' },
  ],
};

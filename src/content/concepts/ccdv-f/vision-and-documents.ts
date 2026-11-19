import type { Concept } from '../../types';

export const visionAndDocuments: Concept = {
  id: 'vision-and-documents',
  title: 'Vision and Documents',
  summary:
    'Sending images and PDFs to Claude: base64, URL and Files API sources, document blocks with citations, size and page limits, and how to design multi-format input.',
  certs: ['ccdv-f', 'ccar-p'],
  domains: ['ccdv-f-2', 'ccdv-f-5', 'ccar-p-3'],
  tags: ['vision', 'pdf', 'files-api', 'citations', 'multimodal'],
  difficulty: 'intermediate',
  sections: [
    {
      heading: 'Image input',
      body: `Images are ordinary content blocks in a user message. The \`source\` decides where the bytes come from:

| source.type | Fields | Use when |
|---|---|---|
| \`base64\` | \`media_type\`, \`data\` | The file is local; simplest and private |
| \`url\` | \`url\` | The image is publicly fetchable; saves upload bandwidth |
| \`file\` | \`file_id\` | You uploaded it once with the Files API and reuse it |

Supported formats are JPEG, PNG, GIF and WebP. Place the image block **before** the text that asks about it; the order of blocks matters for how the model reads the turn. You can send many images in one request (up to 100 through the API) and refer to them by position ("the second image").

Cost scales with pixel area, not with how interesting the picture is. Very large images are downscaled server side anyway, so pre-resize to what the task needs (a 1280x720 image lands near 1,200 tokens). Each image through the API is limited to a few megabytes, and the whole request must stay within the request-size limit, so compress before you base64 encode.`,
    },
    {
      heading: 'PDF and text documents',
      body: `A \`document\` block carries a PDF (\`media_type: "application/pdf"\`) or plain text. For PDFs the platform extracts both the text and an image of every page, so Claude can read tables, charts and scanned layouts, not just the text layer. That also means each page costs text tokens plus image tokens; a text-heavy page is a few thousand tokens.

Limits to remember: a request may be at most **32 MB**, and a single request can contain up to **100 pages** of PDF in total. Longer documents must be split into chunks, summarised in stages, or uploaded through the Files API and queried per section. Optional fields on a document block: \`title\` and \`context\` (metadata the model sees) and \`citations: {enabled: true}\`.

On API version \`2026-10-21\` a \`document\` block may not appear directly in an assistant message, and a user text block may not carry a non-empty \`citations\` array. If you copy Claude's cited answer into a later user turn, send its text without the citations.`,
    },
    {
      heading: 'Files API',
      body: `The Files API (\`client.files\`, out of beta) lets you upload a file once and reference it by \`file_id\` in any number of requests, instead of re-sending megabytes of base64 every call.

- Upload with \`client.files.upload(file=...)\`; list, retrieve metadata and delete are available. Operations are free; file content is billed as input tokens when used in a message.
- Reference with \`source: {type: "file", file_id: "..."}\` on an \`image\` or \`document\` block.
- Limits: 500 MB per file and 100 GB per organisation; files persist until you delete them.
- Only files produced by the code execution tool or Skills can be downloaded; user uploads cannot be read back.
- Availability: first-party API, Claude Platform on AWS and Microsoft Foundry (Anthropic-hosted deployments). Not on Amazon Bedrock or Vertex AI.

Use it whenever the same document will be asked about more than once, or when request bodies are getting close to the size limit. Combined with prompt caching on the document block, repeated questions about one file become cheap and fast.`,
    },
    {
      heading: 'Citations',
      body: `Set \`citations: {enabled: true}\` on a document block and Claude's answer comes back as text blocks that each carry a \`citations\` array pointing at the exact source: character ranges for plain text, page numbers for PDFs, block indices for custom content documents. Citations are the right way to build "show me where it says that" features, and they are much more reliable than asking the model to quote page numbers in prose because the locations are produced by the platform, not invented in text.

Design notes: citations are only available for content supplied as documents (or \`search_result\` blocks from RAG), not for images; and citing increases output tokens slightly. For regulated use cases (legal, medical, financial summaries) citations turn an unverifiable answer into one a reviewer can check in seconds.`,
    },
    {
      heading: 'Designing multi-format input',
      body: `Exam scenarios about "multi-format input" are really about choosing the right block and source for the job:

- One-off screenshot from a user → base64 image block, resized first.
- Public product image → URL source, no upload cost.
- A 300-page contract queried many times → split or upload with the Files API, enable citations, cache the document block, ask one question per request.
- Scanned invoices at scale → PDF documents (page images give OCR-like reading); consider the Batches API for volume.
- Mixed content (text plus several images) → one user message with several blocks, images before the question, labelled in text if order matters.

Validate uploads before they reach the API (file type, size, page count) so you return a friendly error instead of a 400 or 413, and strip EXIF or redact PII from images when privacy rules require it.`,
    },
  ],
  examples: [
    {
      title: 'Upload once, ask many questions',
      description:
        'A compliance team asks 15 questions about the same 60-page policy PDF. Re-sending the PDF each time wasted bandwidth and blew up request size. They upload once and reference the file_id with citations enabled.',
      language: 'python',
      code: `uploaded = client.files.upload(file=Path("policy.pdf"))

def ask(question: str):
    return client.messages.create(
        model="claude-opus-5-5",
        max_tokens=2048,
        messages=[{"role": "user", "content": [
            {"type": "document",
             "source": {"type": "file", "file_id": uploaded.id},
             "title": "Data retention policy",
             "citations": {"enabled": True},
             "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": question},
        ]}],
    )`,
      takeaway: 'Files API plus citations plus a cache breakpoint is the standard pattern for repeated document Q&A.',
    },
    {
      title: 'Reading a screenshot with a base64 image block',
      description:
        'A bug-reporting bot accepts a screenshot and asks Claude to describe the visible error. The image is resized to 1280px wide before encoding to keep token cost predictable.',
      language: 'typescript',
      code: `import fs from "node:fs";

const data = fs.readFileSync("screenshot.png").toString("base64");
const res = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/png", data } },
      { type: "text", text: "What error is shown and which component is likely at fault?" },
    ],
  }],
});`,
      takeaway: 'Image block first, question second; resize before encoding.',
    },
    {
      title: 'Mistake: a 240-page PDF in one request',
      description:
        'An analyst pasted a full annual report as one base64 document and got a 400 about page limits. The fix was to split the PDF into chunks under 100 pages (or by section), run a map step per chunk, and then a reduce step over the chunk summaries. For recurring reports they moved to the Files API and the Batches API.',
      language: 'text',
      code: `Before: one document block, 240 pages  -> 400 (page limit) / 413 (size)

After:
  chunks = split_pdf("report.pdf", max_pages=90)
  summaries = [summarise(c) for c in chunks]     # map
  answer = synthesise(summaries, question)       # reduce`,
      takeaway: 'Respect the 100-page and 32 MB limits by chunking and map-reduce, not by hoping.',
    },
  ],
  keyPoints: [
    'Image sources: base64, url, or file (Files API). Formats: JPEG, PNG, GIF, WebP.',
    'Put image/document blocks before the text that asks about them.',
    'Image cost scales with pixel area; resize before sending. Large images are downscaled anyway.',
    'PDFs: the platform extracts text and a page image, so each page costs both. Limits: 32 MB per request, 100 pages per request.',
    'Files API: client.files.upload once, reference by file_id; 500 MB per file, 100 GB per org; not on Bedrock or Vertex.',
    'citations: {enabled: true} on a document block returns platform-generated source locations in the answer.',
    'On API version 2026-10-21, no document blocks in assistant messages and no citations on user text blocks.',
    'Validate type, size and page count before calling the API; chunk and map-reduce long documents.',
  ],
  flashcards: [
    { front: 'Three source types for an image block?', back: 'base64, url, file (Files API file_id).' },
    { front: 'Maximum PDF pages per request?', back: '100 pages in total across all document blocks.' },
    { front: 'Maximum request size when sending documents?', back: '32 MB.' },
    { front: 'How is a PDF page processed?', back: 'Both the text layer and a rendered image of the page are given to the model, so each page costs text plus image tokens.' },
    { front: 'How do you enable citations on a document?', back: 'Add citations: {enabled: true} to the document block; answer text blocks then carry a citations array.' },
    { front: 'Files API size limits?', back: '500 MB per file, 100 GB per organisation.' },
    { front: 'Which third-party platforms lack the Files API?', back: 'Amazon Bedrock and Google Cloud Vertex AI.' },
    { front: 'Which files can be downloaded from the Files API?', back: 'Only files created by code execution or Skills, not user uploads.' },
    { front: 'Supported image formats?', back: 'JPEG, PNG, GIF, WebP.' },
    { front: 'Why resize images before sending?', back: 'Token cost scales with pixel area; oversized images are downscaled anyway, so you pay bandwidth for nothing.' },
  ],
  quiz: [
    {
      question:
        'A legal team must answer dozens of questions per day about the same 80-page contract and needs each answer to point to the exact clause. Which design best fits?',
      options: [
        'Base64-encode the PDF on every request and ask Claude to mention page numbers in its prose.',
        'Upload the PDF once with the Files API, reference it by file_id with citations enabled, and cache the document block.',
        'Convert the PDF to a single image and send it as an image block.',
        'Paste the extracted text into the system prompt and disable citations to save tokens.',
      ],
      correct: [1],
      explanation:
        'The Files API avoids re-uploading, citations give verifiable locations, and caching cuts cost. Prose page numbers are unreliable, a single image loses detail and exceeds size limits, and the system prompt is for instructions rather than large per-document data.',
    },
    {
      question: 'A request with a 150-page PDF fails. What is the most likely cause?',
      options: [
        'PDFs must be sent through the Batches API.',
        'The request exceeds the 100-page limit per request.',
        'PDF input requires a beta header.',
        'The model does not support vision.',
      ],
      correct: [1],
      explanation:
        'Requests are limited to 100 PDF pages in total; chunk the document. PDFs work on the synchronous API without a beta header, and current models support vision.',
    },
    {
      question: 'Which TWO statements about the Files API are correct? (Select two)',
      options: [
        'Uploaded files are referenced in messages with source type "file" and a file_id.',
        'Any uploaded file can be downloaded again through the API.',
        'It is available on Amazon Bedrock and Vertex AI.',
        'File operations are free; file content is billed as input tokens when used in a message.',
      ],
      correct: [0, 3],
      explanation:
        'Files are referenced by file_id and only billed when used. Downloads are limited to files produced by code execution or Skills, and Bedrock and Vertex do not offer the Files API.',
    },
    {
      question: 'A mobile app sends 12-megapixel photos directly to the API and costs are higher than expected. What is the best fix?',
      options: [
        'Switch to the url source type to avoid base64 overhead.',
        'Resize images to the resolution the task needs before sending; cost scales with pixel area.',
        'Lower max_tokens.',
        'Send the photos as PDF documents instead.',
      ],
      correct: [1],
      explanation:
        'Image tokens depend on pixel area and oversized images are downscaled anyway. The url source changes transport, not tokens; max_tokens affects output; PDFs add page-image cost.',
    },
    {
      question: 'When sending an image and a question in the same user message, how should the blocks be ordered?',
      options: ['Question first, then the image', 'Image first, then the question', 'Order does not matter', 'The image must be in the system prompt'],
      correct: [1],
      explanation:
        'The documented best practice is image (or document) before the text that refers to it. Images cannot be placed in the system prompt.',
    },
  ],
  statements: [
    { text: 'A PDF page is given to the model as both extracted text and a rendered image.', isTrue: true, explanation: 'That is why tables and charts are readable, and why each page costs text plus image tokens.' },
    { text: 'The Files API is available on Amazon Bedrock.', isTrue: false, explanation: 'It is available on the first-party API, Claude Platform on AWS and Foundry (Anthropic-hosted), not on Bedrock or Vertex.' },
    { text: 'Citations are generated by the platform with exact source locations rather than written by the model as prose.', isTrue: true, explanation: 'Text blocks carry a citations array with character ranges, page numbers or block indices.' },
    { text: 'You can send up to 500 PDF pages in a single Messages request.', isTrue: false, explanation: 'The limit is 100 pages per request; chunk longer documents.' },
    { text: 'Citations can be enabled on image blocks.', isTrue: false, explanation: 'Citations apply to document blocks and search_result blocks, not images.' },
    { text: 'Uploading a file with the Files API costs nothing until the file is used in a message.', isTrue: true, explanation: 'Upload, list and delete are free; content is billed as input tokens when referenced.' },
  ],
  resources: [
    { label: 'Vision', url: 'https://platform.claude.com/docs/en/build-with-claude/vision' },
    { label: 'PDF support', url: 'https://platform.claude.com/docs/en/build-with-claude/pdf-support' },
    { label: 'Files API', url: 'https://platform.claude.com/docs/en/build-with-claude/files' },
    { label: 'Citations', url: 'https://platform.claude.com/docs/en/build-with-claude/citations' },
  ],
};

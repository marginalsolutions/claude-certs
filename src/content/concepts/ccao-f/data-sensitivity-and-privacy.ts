import type { Concept } from '../../types';

export const dataSensitivityAndPrivacy: Concept = {
  id: 'data-sensitivity-and-privacy',
  title: 'Data Sensitivity and Privacy',
  summary:
    'Recognize regulated and confidential data, anonymize before uploading when policy requires it, understand retention and training settings, know how enterprise plans differ from consumer plans, and know what never to paste.',
  certs: ['ccao-f', 'ccar-p'],
  domains: ['ccao-f-6', 'ccao-f-5', 'ccar-p-5'],
  tags: ['privacy', 'data-sensitivity', 'compliance', 'anonymization'],
  difficulty: 'foundations',
  sections: [
    {
      heading: 'Kinds of sensitive data',
      body: `Before you paste or upload anything, classify it. Common categories your organization's policy will name:

- **Regulated personal data**: names combined with identifiers (account numbers, national ID, date of birth), health information, financial records, children's data, biometric data. Laws such as GDPR, HIPAA and sector regulations govern how it is handled, and the rules do not relax because the use is internal.
- **Confidential business information**: unreleased financials, M&A plans, pricing strategy, source code, security details, legal matters.
- **Third-party confidential data**: customer or partner material covered by contracts and NDAs.
- **Credentials and secrets**: passwords, API keys, access tokens. These should never appear in any prompt, anywhere.
- **Personal data about colleagues**: performance notes, health or leave details, salary.

The question is not "can Claude handle this?" but "am I allowed to put this here, and what is the least data that still gets the job done?" Minimization (use only what you need) is both a legal principle and good practice.`,
    },
    {
      heading: 'Anonymize before you upload',
      body: `The official sample item: a project manager wants to upload a spreadsheet containing customer names and account numbers so Claude can analyze trends, and organizational policy restricts sharing regulated personal data. The correct action is to **remove or anonymize the personal identifiers before uploading**, consistent with policy. Uploading as-is violates policy; instructing Claude not to retain the data does not satisfy the control; and skipping the analysis is unnecessary when anonymization enables it.

Practical anonymization for an Associate:

- **Drop columns you do not need** for the analysis (names, emails, account numbers, addresses).
- **Replace identifiers with codes** (Customer 001, 002) and keep the mapping in a secure place outside the tool, if you need to re-identify later.
- **Generalize** fields that are not needed at full precision: age bands instead of birth dates, region instead of postcode.
- **Aggregate** where possible: totals per segment rather than row-level records.
- **Check free-text fields**: comments and notes often contain names and details that the obvious columns do not.

Anonymization is not perfect; combinations of fields can re-identify people. When data is highly sensitive or the policy is strict, ask the data owner or privacy team rather than deciding alone. Trend analysis almost never needs identity.`,
    },
    {
      heading: 'Retention, training and plan differences',
      body: `Where your data goes after you submit it depends on the plan and settings. Associates should know the shape of this, not every detail, and should check the current terms and their administrators' guidance.

- **Consumer plans (Free, Pro, Max)** have user-controllable privacy settings, including whether conversations may be used to improve models, and retention periods that depend on those choices. They are personal accounts and are generally not the place for organizational data.
- **Team and Enterprise plans** are governed by commercial terms: by default, customer data is not used to train models, administrators control features, connectors, and retention settings, and additional compliance options and audit capabilities are available. This is why organizational policies require work data to be processed only in the organization's workspace.
- **Deleting a conversation** removes it from your view and starts the deletion process, subject to the plan's retention rules and legal holds. It does not retroactively undo an upload that violated policy.
- **Memory and Project knowledge** persist by design; be deliberate about what you store in them, and use incognito chats for sensitive one-offs.
- **Connectors** extend Claude's reach to whatever you can access in the connected tool; sensitive folders deserve thought before you connect.

"Enterprise plan" is not a license to ignore data classification. It is the environment in which your organization's policy applies.`,
    },
    {
      heading: 'What not to paste, and what to do instead',
      body: `| Never paste | Do instead |
|---|---|
| Passwords, API keys, tokens | Nothing; credentials belong in secure systems only |
| Full customer records with identifiers | Anonymize or aggregate first; confirm the use is permitted |
| Health, financial or children's personal data | Use only within approved, compliant workflows; usually anonymize |
| Unreleased financial results or deal details | Confirm classification and approved workspace; often restricted to named people |
| Colleagues' performance or health details | Decisions about people need human handling; avoid unless policy explicitly allows |
| Content under NDA | Check the contract; many NDAs restrict third-party processing |

Also think about outputs: an anonymized analysis can still reveal a person if the segment is tiny ("the one employee in the Lisbon office"). Review outputs for re-identification before sharing.

Exam angle: the right answer anonymizes or minimizes data so the work can proceed within policy, uses the organization's approved workspace, and escalates to the data owner or privacy team when unsure. Distractors include "it is internal", "I told Claude not to retain it", "delete the chat afterwards", and abandoning useful work that anonymization would have enabled.`,
    },
  ],
  examples: [
    {
      title: 'The customer spreadsheet (official sample item)',
      description:
        'A project manager wants to upload a spreadsheet containing customer names and account numbers so Claude can analyze trends. Policy restricts sharing regulated personal data. The appropriate action is to remove or anonymize the personal identifiers before uploading. Uploading as-is violates policy even for internal analysis; telling Claude not to retain the data is not a policy control; skipping the analysis forgoes value that anonymization makes available.',
      language: 'text',
      code: `Before (restricted):
name, email, account_no, region, plan, monthly_spend, churned
After (anonymized for trend analysis):
customer_code, region, plan, monthly_spend, churned
(mapping of code → account kept in the secure CRM, not uploaded)`,
      takeaway: 'Trend analysis does not need identity; strip or code identifiers and keep the mapping outside the tool.',
    },
    {
      title: 'A mistake: the free-text column',
      description:
        'An HR analyst removed the name and employee ID columns from an engagement survey export before uploading, but left the open-comment column. Several comments named managers and colleagues and described health situations. A reviewer caught it before the summary circulated. The team now scans free-text fields for names and sensitive details, and asks Claude to flag any personal details it encounters in comments so they can be redacted.',
      takeaway: 'Anonymization must include free-text fields, which often hold the most identifying content.',
    },
    {
      title: 'Choosing the right workspace',
      description:
        'A marketing contractor started using a personal Pro account to draft campaign copy from the client\'s unreleased product roadmap. The client\'s policy required all work data to stay in its Enterprise workspace, where training is off by default and administrators control retention. The contractor was given a workspace seat, moved the Project there, and deleted the personal-account conversations, noting that deletion does not undo the earlier exposure.',
      takeaway: 'Use the organization\'s governed workspace for work data; personal accounts are the wrong environment regardless of intent.',
    },
  ],
  keyPoints: [
    'Classify before you paste: regulated personal data, confidential business data, third-party data under NDA, credentials, and colleagues\' personal details each carry rules.',
    'Official sample: anonymize or remove identifiers before uploading a customer spreadsheet; uploading as-is, instructing Claude not to retain, or abandoning the analysis are wrong.',
    'Anonymize by dropping unneeded columns, coding identifiers with the mapping stored securely elsewhere, generalizing, aggregating and scanning free-text fields.',
    'Minimization: use the least data that still gets the job done; trend analysis almost never needs identity.',
    'Team and Enterprise plans do not train on customer data by default and give administrators control over features, connectors and retention; consumer plans have user-controlled settings and are not for organizational data.',
    'Deleting a chat does not undo a policy violation; memory and Project knowledge persist by design.',
    'Never paste credentials; review outputs for re-identification in tiny segments; escalate to the data owner or privacy team when unsure.',
  ],
  flashcards: [
    { front: 'Official sample: customer names and account numbers in a spreadsheet, policy restricts regulated personal data. Correct action?', back: 'Remove or anonymize the personal identifiers before uploading, consistent with policy.' },
    { front: 'Why is "instruct Claude not to retain the data" a wrong answer?', back: 'A prompt instruction is not a policy control; the data has already been shared.' },
    { front: 'Five anonymization techniques', back: 'Drop unneeded columns, replace identifiers with codes (mapping stored securely elsewhere), generalize (age bands, regions), aggregate, scan and redact free-text fields.' },
    { front: 'What is data minimization?', back: 'Using only the data needed for the task; a legal principle and good practice.' },
    { front: 'Key differences of Team and Enterprise plans for data handling', back: 'Customer data is not used for training by default; administrators control features, connectors and retention; compliance and audit options are available.' },
    { front: 'Does deleting a conversation undo a policy violation?', back: 'No. It starts deletion subject to retention rules, but the upload already happened.' },
    { front: 'Types of data that should never be pasted into any prompt', back: 'Passwords, API keys, access tokens and other credentials.' },
    { front: 'Why check outputs for re-identification?', back: 'Anonymized analysis can still reveal a person when a segment is tiny (one employee in an office).' },
    { front: 'Where should a contractor process a client\'s confidential roadmap?', back: 'In the client\'s governed workspace (Team or Enterprise), not a personal account.' },
    { front: 'Which field type is most often missed during anonymization?', back: 'Free-text comments and notes, which frequently contain names and sensitive details.' },
  ],
  quiz: [
    {
      question:
        'A project manager wants to upload a spreadsheet containing customer names and account numbers so Claude can analyze trends. Organizational policy restricts sharing regulated personal data. What is the MOST appropriate action?',
      options: [
        'Upload the file as-is, since the analysis is internal.',
        'Remove or anonymize the personal identifiers before uploading, consistent with policy.',
        'Upload the file but instruct Claude not to retain it.',
        'Skip the analysis entirely.',
      ],
      correct: [1],
      explanation:
        'Anonymizing lets the analysis proceed without exposing protected data. Internal use (A) does not exempt the data; an instruction to the model (C) is not a policy control; abandoning the task (D) is unnecessary.',
    },
    {
      question: 'An HR analyst removed name and ID columns from a survey export but left the open-comment field, which contains names and health details. What is the correct assessment?',
      options: [
        'The data is anonymized because identifier columns were removed.',
        'The data is not adequately anonymized; free-text fields must be scanned and redacted too.',
        'Comments are opinions, not personal data.',
        'Claude will automatically ignore names in comments.',
      ],
      correct: [1],
      explanation:
        'Free text frequently carries identifying and sensitive content. Removing structured identifiers alone (A) is insufficient; comments can be personal data (C); Claude does not filter them automatically (D).',
    },
    {
      question: 'Which TWO statements about plans and data handling are correct? (Select two)',
      options: [
        'Team and Enterprise plans do not use customer data for model training by default.',
        'A personal Pro account is an appropriate place to process a client\'s confidential roadmap if the contractor is careful.',
        'Administrators on Enterprise plans can control which connectors and features are available.',
        'Deleting a conversation retroactively undoes any policy violation from the upload.',
      ],
      correct: [0, 2],
      explanation:
        'Commercial plans are governed by terms that exclude training by default and provide admin controls. Personal accounts (B) are the wrong environment for work data; deletion (D) does not undo exposure.',
    },
    {
      question: 'A colleague is about to paste a system password into a prompt so Claude can "help write the login instructions". What should you advise?',
      options: [
        'Paste it; Claude will not store it.',
        'Never paste credentials into any prompt; write the instructions with a placeholder and keep the password in the secure system.',
        'Paste it in an incognito chat.',
        'Paste half of it for safety.',
      ],
      correct: [1],
      explanation:
        'Credentials never belong in prompts. Incognito (C) and partial pasting (D) do not make exposure acceptable; option A is false reassurance.',
    },
    {
      question: 'An anonymized analysis produces the statement "the single employee in the Lisbon office reported burnout". What should happen before sharing?',
      options: [
        'Share it; the data was anonymized.',
        'Review for re-identification and aggregate or remove the statement, since a segment of one identifies a person.',
        'Ask Claude to confirm the data is anonymous.',
        'Add the employee\'s name for clarity.',
      ],
      correct: [1],
      explanation:
        'Tiny segments re-identify people even without names. Options A and C skip the check; D makes the problem worse.',
    },
  ],
  statements: [
    { text: 'Instructing Claude not to retain uploaded data satisfies a policy restricting regulated personal data.', isTrue: false, explanation: 'Prompt instructions are not policy controls; anonymize before upload.' },
    { text: 'Trend analysis usually does not require customer identities.', isTrue: true, explanation: 'Coded or aggregated data supports the analysis while protecting identity.' },
    { text: 'Removing name and ID columns is always sufficient anonymization.', isTrue: false, explanation: 'Free-text fields and combinations of other fields can still identify people.' },
    { text: 'Team and Enterprise plans do not use customer data to train models by default.', isTrue: true, explanation: 'Commercial terms govern these plans, and administrators control settings.' },
    { text: 'Deleting a chat undoes an upload that violated policy.', isTrue: false, explanation: 'Deletion starts a process subject to retention rules; the exposure already occurred.' },
    { text: 'Credentials such as passwords and API keys should never be included in any prompt.', isTrue: true, explanation: 'They belong only in secure systems.' },
    { text: 'Because the use is internal, data classification rules do not apply.', isTrue: false, explanation: 'Regulated data rules apply regardless of audience.' },
    { text: 'When unsure whether data may be used, asking the data owner or privacy team is the right step.', isTrue: true, explanation: 'Escalation beats guessing on sensitive data.' },
  ],
  resources: [
    { label: 'Anthropic Privacy Center', url: 'https://privacy.claude.com/' },
    { label: 'Anthropic Usage Policy', url: 'https://www.anthropic.com/legal/aup' },
    { label: 'Anthropic Trust Center', url: 'https://trust.anthropic.com/' },
  ],
};

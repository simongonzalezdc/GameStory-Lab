# Privacy

**Last updated: October 2026**

## What leaves your machine, and when

GameStory Lab is a **local-first** application. The backend, database, and
your concepts stay on your machine. Network traffic only occurs when you
choose to use a cloud AI provider.

### Sent to third parties

| Recipient          | When                                                            | What is sent                                                                  |
| ------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **MiniMax**        | You configure `MINIMAX_API_KEY` and the orchestrator selects it | Your prompt text (the concept/mechanics/lore you asked to generate or refine) |
| **GLM / Zhipu AI** | You configure `GLM_API_KEY` and it is selected                  | Your prompt text                                                              |
| **OpenRouter**     | You configure `OPENROUTER_API_KEY` and it is selected           | Your prompt text                                                              |
| **Google Gemini**  | You configure `GOOGLE_API_KEY` and it is selected               | Your prompt text                                                              |

The specific recipient for any request is visible in the app's health page
(`/health`) and the AI Orchestrator's logs. If you set **no** cloud keys and
run only Ollama locally, **no prompt data ever leaves your machine**.

### Never collected

- No analytics, telemetry, crash reporting, or usage tracking
- No account, sign-up, or identity requirement
- No cookies set by the application itself

## What is stored locally

- `packages/backend/prisma` (or your configured PostgreSQL) — projects,
  versions, concepts, AI generation logs, validation results
- `.env` — your API keys. Gitignored. Never commit it.

Be aware that concepts can be sensitive or commercially confidential. Treat
your local database as you would any other project data, and prefer local
Ollama for confidential work.

## Deleting your data

Stop the app, then remove your PostgreSQL instance. There is no remote
component to contact.

## Contact

For privacy questions, open a
[private security advisory](https://github.com/simongonzalezdc/GameStory-Lab/security/advisories/new).

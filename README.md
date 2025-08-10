# Archy Brain

Middle layer between Architect-1 (UI) and FlashVault (memory).

## Setup
1. Import this repo into a new Replit (Node.js template).
2. In Replit Secrets, set:
   - `LLM_PROVIDER` = `openai` (or `ollama`)
   - `OPENAI_API_KEY` = your OpenAI key (only if using openai)
   - `VAULT_URL` = your FlashVault URL (e.g. https://flashvault-username.repl.co)
   - `OLLAMA_HOST` = your Ollama server URL (if using Ollama)
3. Run Replit — should say `Archy Brain on :8787`.

## Test
```bash
curl -s -X POST https://<your-repl>.repl.co/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}]}'

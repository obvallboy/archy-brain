import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors({ origin: "*" })); // allow Architect-1 to call this

// --- ENV ---
const PORT = process.env.PORT || 8787;
const LLM_PROVIDER = process.env.LLM_PROVIDER || "openai"; // "openai" or "ollama"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const VAULT_URL = process.env.VAULT_URL || ""; // FlashVault URL

// --- LLM call ---
async function callLLM(messages) {
  if (LLM_PROVIDER === "openai") {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing");
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages
      })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || "OpenAI error");
    return j.choices?.[0]?.message?.content || "";
  } else {
    const r = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3.1", messages })
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Ollama error");
    return j.message?.content || j.messages?.at(-1)?.content || "";
  }
}

// --- FlashVault store ---
async function vaultStore(role, text) {
  if (!VAULT_URL) return;
  try {
    await fetch(`${VAULT_URL}/encode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${role}] ${text}`,
        title: `Archy chat (${role})`,
        tags: ["chat", "archy"],
        when: new Date().toISOString()
      })
    });
  } catch (_) {}
}

// Health check
app.get("/", (_req, res) => res.send("Archy Brain is running ✅"));

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const reply = await callLLM(messages);

    // Store both last user message + assistant reply
    const last = messages[messages.length - 1];
    if (last?.content) vaultStore(last.role || "user", last.content);
    vaultStore("assistant", reply);

    res.json({ text: reply, actions: [] });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => console.log(`Archy Brain on :${PORT}`));

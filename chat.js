const ENDPOINT = process.env.AI_ENDPOINT || "https://apis.keithsite.lol/ai/copilot";
const TIMEOUT = Number(process.env.AI_TIMEOUT_MS) || 25000;
const LIMIT = Number(process.env.RATE_LIMIT_PER_MIN) || 20;
const MAX_LEN = 2000;

// Best-effort per-instance rate limit. Serverless instances do not share memory,
// so for strict limits use Vercel Firewall rate limiting or an external store.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > 60_000) { hits.set(ip, { start: now, n: 1 }); return false; }
  rec.n++;
  if (hits.size > 5000) hits.clear();
  return rec.n > LIMIT;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (limited(ip)) return res.status(429).json({ ok: false, error: "Too many requests. Wait a minute and try again." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return res.status(400).json({ ok: false, error: "Message cannot be empty." });
  if (message.length > MAX_LEN) return res.status(400).json({ ok: false, error: `Message is too long (max ${MAX_LEN} characters).` });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const url = new URL(ENDPOINT);
    url.searchParams.set("q", message);
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) return res.status(502).json({ ok: false, error: `The AI service returned status ${r.status}.` });
    const data = await r.json();
    // Verified schema: { status: true, creator, result: "<answer>" }
    const answer = typeof data?.result === "string" ? data.result.trim() : "";
    if (data?.status === false || !answer) return res.status(502).json({ ok: false, error: "The AI service sent an empty or invalid response." });
    return res.status(200).json({ ok: true, reply: answer });
  } catch (e) {
    const timedOut = e.name === "AbortError";
    return res.status(timedOut ? 504 : 502).json({ ok: false, error: timedOut ? "The AI service took too long to respond." : "Could not reach the AI service." });
  } finally {
    clearTimeout(timer);
  }
}

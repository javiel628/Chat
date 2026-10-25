# 𝐒𝚳𝚰𝐋𝚵 𝐂𝚮𝚨𝐓 𝐁𝚯𝐓
AI chat app by 𝐒𝚳𝚰𝐋𝚵 𝚳𝚯𝐃𝐙. Static frontend in `public/`, and a Vercel serverless function (`api/chat.js`) that proxies `https://apis.keithsite.lol/ai/copilot?q=...`.

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: Add New > Project > import the repo. Leave Framework Preset as "Other"; no build command or output directory needed (Vercel serves `public/` and `api/` automatically).
3. Deploy. Environment variables are optional (see `.env.example`).

Or with the CLI: `npm i -g vercel` then `vercel --prod` in this folder.

## Run locally
Node.js 18+:
```
npm install
npm run dev     # http://localhost:3000
```
(`vercel dev` also works if you have the CLI.)

## Notes
- API response schema (verified): `{ "status": true, "creator": "...", "result": "<answer>" }`.
- The endpoint takes only `q`, so each message is answered independently; the bot has no memory of earlier messages.
- Rate limiting in `api/chat.js` is per serverless instance, so it is best-effort. For stricter limits, enable Vercel Firewall rate limiting.
- Chat history is stored in the user's browser (localStorage) only.

// Local development only. On Vercel, /api/chat runs as a serverless function.
import express from "express";
import handler from "./api/chat.js";
const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));
app.post("/api/chat", handler);
app.use((err, _req, res, _next) => res.status(400).json({ ok: false, error: "Invalid request." }));
app.listen(process.env.PORT || 3000, () => console.log("http://localhost:" + (process.env.PORT || 3000)));

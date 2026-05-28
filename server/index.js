import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import memosRouter from "./routes/memos.js";

import 'dsmhs-screener';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use("/memos", memosRouter);


app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/hello", (req, res) => res.send("Hello, routing!"));

app.get("/hello/:name", (req, res) => {
  res.send(`안녕하세요, ${req.params.name}님`);
});

app.get("/time", (req, res) => res.json({ time: new Date().toISOString() }));

app.get("/random", (req, res) => {
  const n = Math.floor(Math.random() * 100) + 1;
  res.send(`랜덤 숫자: ${n}`);
});

initDb((err) => {
  if (err) {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`Server is running on ${PORT}`));
});

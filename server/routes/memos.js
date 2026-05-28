import express from "express";
import {
  createMemo,
  deleteMemoById,
  getMemoById,
  getMemosWithOptions,
  toggleMemoPinById,
  updateMemoById,
} from "../db.js";

const router = express.Router();

const sendSuccess = (res, data, status = 200) => {
  res.status(status).json({ success: true, data });
};

const sendError = (res, message, status = 400) => {
  res.status(status).json({ success: false, message });
};

router.get("/", (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
  const sort = req.query.sort === "asc" ? "ASC" : "DESC";
  const q = typeof req.query.q === "string" ? req.query.q : "";

  getMemosWithOptions({ limit, sort, q }, (err, rows) => {
    if (err) return sendError(res, "db error", 500);
    return sendSuccess(res, rows);
  });
});

router.post("/", (req, res) => {
  const title = req.body?.title?.trim();
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  const image_url =
    typeof req.body?.image_url === "string" && req.body.image_url.trim()
      ? req.body.image_url.trim()
      : null;

  if (!title) {
    return sendError(res, "title is required", 400);
  }

  createMemo(title, content, image_url, (err, id) => {
    if (err) return sendError(res, "db error", 500);
    return sendSuccess(res, { id }, 201);
  });
});

router.get("/:index", (req, res) => {
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || index <= 0) {
    return sendError(res, "invalid index", 400);
  }

  getMemoById(index, (err, row) => {
    if (err) return sendError(res, "db error", 500);
    if (!row) return sendError(res, "memo not found", 404);
    return sendSuccess(res, row);
  });
});

router.put("/:index", (req, res) => {
  const index = Number(req.params.index);
  const title = req.body?.title?.trim();
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  const pinned = Boolean(req.body?.pinned);
  const image_url =
    typeof req.body?.image_url === "string" && req.body.image_url.trim()
      ? req.body.image_url.trim()
      : null;

  if (!Number.isInteger(index) || index <= 0) {
    return sendError(res, "invalid index", 400);
  }

  if (!title) {
    return sendError(res, "title is required", 400);
  }

  updateMemoById(index, { title, content, pinned, image_url }, (err, changes) => {
    if (err) return sendError(res, "db error", 500);
    if (changes === 0) return sendError(res, "memo not found", 404);
    return sendSuccess(res, { id: index, updated: changes });
  });
});

router.patch("/:index/pin", (req, res) => {
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || index <= 0) {
    return sendError(res, "invalid index", 400);
  }

  toggleMemoPinById(index, (err, changes) => {
    if (err) return sendError(res, "db error", 500);
    if (changes === 0) return sendError(res, "memo not found", 404);
    return sendSuccess(res, { id: index, updated: changes });
  });
});

router.delete("/:index", (req, res) => {
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || index <= 0) {
    return sendError(res, "invalid index", 400);
  }

  deleteMemoById(index, (err, changes) => {
    if (err) return sendError(res, "db error", 500);
    if (changes === 0) return sendError(res, "memo not found", 404);
    return sendSuccess(res, { deleted: changes });
  });
});

export default router;

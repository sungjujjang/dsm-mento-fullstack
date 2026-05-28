const statusEl = document.getElementById("status");
const listEl = document.getElementById("memo-list");
const formEl = document.getElementById("memo-form");
const formTitleEl = document.getElementById("form-title");
const submitButtonEl = document.getElementById("submit-button");
const cancelEditEl = document.getElementById("cancel-edit");
const searchInputEl = document.getElementById("search-input");

let editingId = null;
let allMemos = [];

function setStatus(message) {
  statusEl.textContent = message || "";
}

function setBusy(isBusy) {
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = isBusy;
  });
}

async function apiRequest(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.message || res.statusText || "요청 실패");
  }

  if (json.success === false) {
    throw new Error(json.message || "요청 실패");
  }

  return json;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applySearchFilter() {
  const keyword = searchInputEl.value.trim().toLowerCase();
  const filtered = keyword
    ? allMemos.filter((memo) => {
        const title = String(memo.title || "").toLowerCase();
        const content = String(memo.content || "").toLowerCase();
        return title.includes(keyword) || content.includes(keyword);
      })
    : allMemos;

  renderMemoList(filtered);
}

async function loadMemos() {
  try {
    setStatus("목록 불러오는 중...");
    const result = await apiRequest("/memos?limit=100");
    allMemos = result.data || [];
    applySearchFilter();
    setStatus("");
  } catch (err) {
    setStatus(err.message);
  }
}

function renderMemoList(memos) {
  listEl.innerHTML = "";

  if (memos.length === 0) {
    listEl.innerHTML = '<li class="empty">아직 메모가 없습니다.</li>';
    return;
  }

  for (const memo of memos) {
    const item = document.createElement("li");
    item.className = `memo-card${memo.pinned ? " memo-card--pinned" : ""}`;
    item.innerHTML = `
      <div class="memo-card__body">
        <div class="memo-card__title-row">
          <strong>${escapeHtml(memo.title)}</strong>
          ${memo.pinned ? '<span class="pin-badge">고정</span>' : ""}
        </div>
        <p>${escapeHtml(memo.content || "")}</p>
        ${
          memo.image_url
            ? `<img class="memo-image" src="${escapeHtml(memo.image_url)}" alt="" />`
            : ""
        }
      </div>
      <div class="memo-actions">
        <button type="button" data-action="edit" data-id="${memo.id}">수정</button>
        <button type="button" data-action="pin" data-id="${memo.id}">
          ${memo.pinned ? "핀 해제" : "핀"}
        </button>
        <button type="button" data-action="delete" data-id="${memo.id}">삭제</button>
      </div>
    `;
    listEl.appendChild(item);
  }
}

function resetEditMode() {
  editingId = null;
  formTitleEl.textContent = "새 메모";
  submitButtonEl.textContent = "저장";
  cancelEditEl.hidden = true;
}

async function startEdit(id) {
  try {
    const result = await apiRequest(`/memos/${id}`);
    const memo = result.data;

    editingId = memo.id;
    formEl.elements.title.value = memo.title;
    formEl.elements.content.value = memo.content || "";
    formEl.elements.image_url.value = memo.image_url || "";

    formTitleEl.textContent = "메모 수정";
    submitButtonEl.textContent = "수정 저장";
    cancelEditEl.hidden = false;
    formEl.elements.title.focus();
  } catch (err) {
    setStatus(err.message);
  }
}

async function createMemo({ title, content, image_url }) {
  await apiRequest("/memos", {
    method: "POST",
    body: JSON.stringify({ title, content, image_url }),
  });
}

async function updateMemo(id, { title, content, image_url }) {
  const current = await apiRequest(`/memos/${id}`);

  await apiRequest(`/memos/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title,
      content,
      pinned: Boolean(current.data.pinned),
      image_url,
    }),
  });
}

async function deleteMemo(id) {
  if (!confirm("정말 삭제할까요?")) return;

  try {
    setBusy(true);
    setStatus("삭제 중...");
    await apiRequest(`/memos/${id}`, { method: "DELETE" });
    if (editingId === id) {
      resetEditMode();
      formEl.reset();
    }
    await loadMemos();
    setStatus("삭제했습니다.");
  } catch (err) {
    setStatus(err.message);
  } finally {
    setBusy(false);
  }
}

async function togglePin(id) {
  try {
    setBusy(true);
    setStatus("고정 상태 변경 중...");
    await apiRequest(`/memos/${id}/pin`, { method: "PATCH" });
    await loadMemos();
    setStatus("고정 상태를 변경했습니다.");
  } catch (err) {
    setStatus(err.message);
  } finally {
    setBusy(false);
  }
}

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(formEl);
  const title = formData.get("title").trim();
  const content = formData.get("content").trim();
  const imageUrl = formData.get("image_url").trim();

  if (!title) {
    setStatus("제목은 필수입니다.");
    return;
  }

  try {
    setBusy(true);
    setStatus(editingId ? "수정 중..." : "저장 중...");
    const payload = { title, content, image_url: imageUrl || null };

    if (editingId) {
      await updateMemo(editingId, payload);
      setStatus("수정했습니다.");
    } else {
      await createMemo(payload);
      setStatus("저장했습니다.");
    }

    resetEditMode();
    formEl.reset();
    await loadMemos();
  } catch (err) {
    setStatus(err.message);
  } finally {
    setBusy(false);
  }
});

cancelEditEl.addEventListener("click", () => {
  resetEditMode();
  formEl.reset();
  setStatus("수정을 취소했습니다.");
});

listEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === "edit") await startEdit(id);
  if (action === "delete") await deleteMemo(id);
  if (action === "pin") await togglePin(id);
});

searchInputEl.addEventListener("input", applySearchFilter);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && editingId) {
    resetEditMode();
    formEl.reset();
    setStatus("수정을 취소했습니다.");
  }
});

loadMemos();

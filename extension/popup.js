// ContextDock popup logic
// IMPORTANT: this popup intentionally has NO "open tabs" / "launch" action.
// Recovery only happens by exporting JSON here and importing it on the
// ContextDock website. Do not add chrome.tabs.create() calls for restoring
// sessions from this file — that would bypass the website funnel by design.

function isRestorableTab(tab) {
  if (!tab.url) return false;
  return !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://");
}

async function getAllSessions() {
  const data = await chrome.storage.local.get("sessions");
  return data.sessions || [];
}

async function saveSessions(sessions) {
  await chrome.storage.local.set({ sessions });
}

function faviconFor(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

async function renderCurrentTabs() {
  const win = await chrome.windows.getCurrent({ populate: true });
  const tabs = win.tabs.filter(isRestorableTab);

  // Status line: proves auto-save is armed for THIS window, whatever its tab count.
  // No threshold — 1 tab or 100 tabs, closing this window will auto-save it.
  const statusEl = document.getElementById("autoSaveStatus");
  if (tabs.length > 0) {
    statusEl.textContent = `${tabs.length} tab${tabs.length === 1 ? "" : "s"} open — this window will auto-save when closed.`;
    statusEl.style.display = "block";
  } else {
    statusEl.style.display = "none";
  }

  const container = document.getElementById("currentTabs");
  container.innerHTML = "";
  if (tabs.length === 0) {
    container.innerHTML = `<div class="empty-state">No restorable tabs in this window.</div>`;
    return;
  }
  for (const tab of tabs) {
    const row = document.createElement("div");
    row.className = "tab-item";
    row.innerHTML = `<img src="${faviconFor(tab.url)}" onerror="this.style.display='none'"/><span>${tab.title || tab.url}</span>`;
    container.appendChild(row);
  }
}

async function renderAutoSaves() {
  const sessions = await getAllSessions();
  const autoSaves = sessions
    .filter(s => s.source === "auto")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  const container = document.getElementById("autoSaves");
  container.innerHTML = "";
  if (autoSaves.length === 0) {
    container.innerHTML = `<div class="empty-state">Nothing auto-saved yet. Close a window to see it appear here.</div>`;
    return;
  }

  for (const session of autoSaves) {
    const card = document.createElement("div");
    card.className = "session-card";
    const dateStr = new Date(session.createdAt).toLocaleString();
    card.innerHTML = `
      <div class="name">${session.name}</div>
      <div class="meta">${session.tabs.length} tabs &middot; ${dateStr}</div>
      <div class="actions">
        <button class="btn-secondary promote-btn" data-id="${session.id}">Promote</button>
        <button class="btn-discard discard-btn" data-id="${session.id}">Discard</button>
      </div>
    `;
    container.appendChild(card);
  }

  container.querySelectorAll(".promote-btn").forEach(btn => {
    btn.addEventListener("click", () => promoteSession(btn.dataset.id));
  });
  container.querySelectorAll(".discard-btn").forEach(btn => {
    btn.addEventListener("click", () => discardSession(btn.dataset.id));
  });
}

async function promoteSession(id) {
  const name = prompt("Name this workspace:");
  if (!name) return;
  const purpose = prompt("Purpose (optional):") || "";
  const sessions = await getAllSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return;
  sessions[idx] = { ...sessions[idx], name, purpose, source: "manual", tag: "manual" };
  await saveSessions(sessions);
  renderAutoSaves();
}

async function discardSession(id) {
  const sessions = await getAllSessions();
  const filtered = sessions.filter(s => s.id !== id);
  await saveSessions(filtered);
  renderAutoSaves();
}

async function saveNamedWorkspace() {
  const nameInput = document.getElementById("wsName");
  const purposeInput = document.getElementById("wsPurpose");
  const name = nameInput.value.trim();
  if (!name) {
    alert("Please enter a workspace name.");
    return;
  }
  const win = await chrome.windows.getCurrent({ populate: true });
  const tabs = win.tabs.filter(isRestorableTab).map(t => ({ title: t.title || t.url, url: t.url }));
  if (tabs.length === 0) {
    alert("No restorable tabs in this window to save.");
    return;
  }
  const sessions = await getAllSessions();
  const newSession = {
    id: `manual_${Date.now()}`,
    name,
    purpose: purposeInput.value.trim(),
    tag: "manual",
    source: "manual",
    tabs,
    createdAt: Date.now(),
    lastOpenedAt: null
  };
  await saveSessions([newSession, ...sessions]);
  nameInput.value = "";
  purposeInput.value = "";
  renderAutoSaves();
}

async function copyJsonToClipboard() {
  const sessions = await getAllSessions();
  if (sessions.length === 0) {
    alert("Nothing to copy yet.");
    return;
  }
  // Website's import box expects a raw JSON array of session objects,
  // not an object wrapper. Match that shape exactly.
  const json = JSON.stringify(sessions, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    const btn = document.getElementById("copyJsonBtn");
    const original = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => { btn.textContent = original; }, 1500);
  } catch (e) {
    alert("Couldn't copy automatically. Use Export JSON instead.");
  }
}

document.getElementById("saveNamedBtn").addEventListener("click", saveNamedWorkspace);
document.getElementById("copyJsonBtn").addEventListener("click", copyJsonToClipboard);

renderCurrentTabs();
renderAutoSaves();

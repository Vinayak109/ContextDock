// ContextDock background service worker
// Auto-saves every closed window, regardless of tab count (per product decision).
// No "launch/open tabs" capability lives here or in the popup — recovery only
// happens via Export JSON -> import on the ContextDock website. This is intentional:
// it keeps the free extension a capture tool, and makes the website the only place
// sessions can actually be restored, which is where paid plans are gated.

const MAX_AUTO_SAVES = 20; // prune beyond this to avoid unbounded storage growth
const PERIODIC_BACKUP_MINUTES = 15;

// Filter out internal chrome:// pages — these can't be meaningfully restored anyway
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

async function pruneAutoSaves(sessions) {
  const autoSaves = sessions.filter(s => s.source === "auto");
  const manual = sessions.filter(s => s.source !== "auto");
  if (autoSaves.length > MAX_AUTO_SAVES) {
    autoSaves.sort((a, b) => b.createdAt - a.createdAt);
    return [...manual, ...autoSaves.slice(0, MAX_AUTO_SAVES)];
  }
  return sessions;
}

// Track tabs per window so we know what was in a window right before it closes.
// chrome.windows.onRemoved does not give you the tabs that were in it, so we
// maintain our own map, updated on every tab event.
const windowTabsCache = {}; // windowId -> array of {title, url}

async function refreshWindowCache(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    windowTabsCache[windowId] = tabs
      .filter(isRestorableTab)
      .map(t => ({ title: t.title || t.url, url: t.url }));
  } catch (e) {
    // window may already be gone
  }
}

chrome.tabs.onCreated.addListener(tab => {
  if (tab.windowId !== undefined) refreshWindowCache(tab.windowId);
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.windowId !== undefined) {
    refreshWindowCache(tab.windowId);
  }
});
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (!removeInfo.isWindowClosing) {
    refreshWindowCache(removeInfo.windowId);
  }
  // if the window IS closing, onWindowRemoved below handles the snapshot
  // using the cache as it stood just before closure.
});
chrome.tabs.onAttached.addListener((tabId, attachInfo) => {
  refreshWindowCache(attachInfo.newWindowId);
});
chrome.tabs.onDetached.addListener((tabId, detachInfo) => {
  refreshWindowCache(detachInfo.oldWindowId);
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const tabs = windowTabsCache[windowId];
  delete windowTabsCache[windowId];

  // Auto-save ANY closed window with at least 1 restorable tab. No threshold.
  if (!tabs || tabs.length < 1) return;

  const sessions = await getAllSessions();
  const newSession = {
    id: `auto_${Date.now()}`,
    name: `Auto-Saved — ${new Date().toLocaleString()}`,
    purpose: "",
    tag: "auto",
    source: "auto",
    tabs,
    createdAt: Date.now(),
    lastOpenedAt: null
  };
  const updated = await pruneAutoSaves([newSession, ...sessions]);
  await saveSessions(updated);
});

// Populate the cache for all currently open windows on install/startup,
// so a window closed shortly after browser launch still has cached tabs.
async function primeCache() {
  const windows = await chrome.windows.getAll({ populate: false });
  for (const w of windows) {
    await refreshWindowCache(w.id);
  }
}
chrome.runtime.onInstalled.addListener(primeCache);
chrome.runtime.onStartup.addListener(primeCache);

// Periodic full-state backup (covers crashes / force-quits, not just clean closes)
chrome.alarms.create("contextdock_periodic_backup", { periodInMinutes: PERIODIC_BACKUP_MINUTES });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "contextdock_periodic_backup") return;
  const windows = await chrome.windows.getAll({ populate: true });
  const allTabs = [];
  for (const w of windows) {
    for (const t of w.tabs) {
      if (isRestorableTab(t)) allTabs.push({ title: t.title || t.url, url: t.url });
    }
  }
  if (allTabs.length < 1) return;

  const sessions = await getAllSessions();
  const filtered = sessions.filter(s => s.id !== "last_known_state");
  const backupSession = {
    id: "last_known_state",
    name: "Last Known State (Auto-Backup)",
    purpose: "",
    tag: "auto",
    source: "auto",
    tabs: allTabs,
    createdAt: Date.now(),
    lastOpenedAt: null
  };
  await saveSessions([backupSession, ...filtered]);
});

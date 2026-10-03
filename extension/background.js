// Cache of current windows and their tabs to ensure we know what tabs existed 
// right before a window closes. 
// Service workers can sleep, so we use chrome.storage.session to keep it alive in memory.

async function refreshWindowCache() {
  try {
    const windows = await chrome.windows.getAll({ populate: true });
    const cache = {};
    for (const win of windows) {
      if (win.type === 'normal' || win.type === 'popup') {
        // Filter out chrome:// and other internal URLs
        const validTabs = win.tabs.filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'));
        if (validTabs.length > 0) {
          cache[win.id] = validTabs.map(t => ({ title: t.title || t.url, url: t.url, id: t.id }));
        }
      }
    }
    // Use chrome.storage.local instead of session so it survives browser quit
    await chrome.storage.local.set({ windowCache: cache });
  } catch (e) {
    console.error("Error refreshing window cache", e);
  }
}

// Initial populate and recovery
chrome.runtime.onStartup.addListener(async () => {
  await handleStartupRecovery();
  refreshWindowCache();
});
chrome.runtime.onInstalled.addListener(refreshWindowCache);

// Keep cache updated when tabs change
chrome.tabs.onUpdated.addListener(refreshWindowCache);
chrome.tabs.onCreated.addListener(refreshWindowCache);
chrome.tabs.onAttached.addListener(refreshWindowCache);
chrome.tabs.onDetached.addListener(refreshWindowCache);
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (!removeInfo.isWindowClosing) {
    refreshWindowCache();
  }
});

// Auto-snapshot when a window is closed
chrome.windows.onRemoved.addListener(async (windowId) => {
  const { windowCache } = await chrome.storage.local.get('windowCache');
  if (!windowCache || !windowCache[windowId]) return;

  const tabs = windowCache[windowId];
  
  // Clean up cache
  delete windowCache[windowId];
  await chrome.storage.local.set({ windowCache });
  
  // Edge Case: A window with only one tab closing shouldn't necessarily spam an "Auto-Saved Session" 
  // if it's just a stray tab. We set a minimum threshold of 2+ tabs before auto-snapshotting.
  if (tabs.length < 2) return;

  const sessionName = `Auto-Saved — ${new Date().toLocaleString()}`;
  await createAutoSaveSession(sessionName, tabs);
});

async function createAutoSaveSession(name, tabs) {
  const newWorkspace = {
    id: 'ws_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    name: name,
    purpose: '',
    tag: 'Auto-Saved',
    color: '#9CA3AF', // Gray for auto-saved
    tabs: tabs.map(t => ({ id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), title: t.title, url: t.url })),
    createdAt: new Date().toISOString(),
    source: 'auto',
    lastOpenedAt: null
  };

  const { workspaces = [] } = await chrome.storage.local.get('workspaces');
  
  // Storage limit handling: prune old auto-saved sessions if we have too many
  // Let's cap auto-saved sessions at 20.
  const autoSaved = workspaces.filter(w => w.source === 'auto');
  if (autoSaved.length >= 20) {
    // Sort oldest first and remove the oldest one
    autoSaved.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const toRemove = autoSaved[0];
    const index = workspaces.findIndex(w => w.id === toRemove.id);
    if (index !== -1) workspaces.splice(index, 1);
  }

  workspaces.push(newWorkspace);
  await chrome.storage.local.set({ workspaces });
}

// Recover closed windows from previous session if the browser was quit (e.g. Red X)
async function handleStartupRecovery() {
  const { windowCache } = await chrome.storage.local.get('windowCache');
  if (!windowCache) return;
  
  // Check which windows from the cache are no longer open
  // When browser restarts, windows get new IDs, so all old windows will be saved
  const currentWindows = await chrome.windows.getAll();
  const currentWindowIds = new Set(currentWindows.map(w => w.id.toString()));

  let recovered = false;
  for (const [winId, tabs] of Object.entries(windowCache)) {
    // If we have a window in cache that isn't open now, it was closed during exit
    if (!currentWindowIds.has(winId) && tabs.length >= 2) {
      const sessionName = `Recovered — ${new Date().toLocaleString()}`;
      await createAutoSaveSession(sessionName, tabs);
      recovered = true;
    }
  }
  
  if (recovered) {
    // Clear old cache after recovery to avoid duplicates
    await chrome.storage.local.set({ windowCache: {} });
  }
}

// Periodic auto-snapshot (every 15 minutes) of all current windows 
// into a rolling "Last Known State" backup
chrome.alarms.create("periodicBackup", { periodInMinutes: 15 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "periodicBackup") {
    const { windowCache } = await chrome.storage.local.get('windowCache');
    if (!windowCache) return;
    
    // Flatten all current valid tabs across all windows
    let allTabs = [];
    for (const winId in windowCache) {
      allTabs = allTabs.concat(windowCache[winId]);
    }
    
    if (allTabs.length === 0) return;

    const backupWorkspace = {
      id: 'ws_backup_rolling',
      name: `Last Known State (Auto-Backup)`,
      purpose: 'Rolling backup of all open tabs to prevent data loss from crashes',
      tag: 'Backup',
      color: '#F59E0B',
      tabs: allTabs.map(t => ({ id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), title: t.title, url: t.url })),
      createdAt: new Date().toISOString(),
      source: 'auto_backup',
      lastOpenedAt: null
    };

    const { workspaces = [] } = await chrome.storage.local.get('workspaces');
    
    // Replace existing rolling backup if exists
    const existingIndex = workspaces.findIndex(w => w.id === 'ws_backup_rolling');
    if (existingIndex !== -1) {
      workspaces[existingIndex] = backupWorkspace;
    } else {
      workspaces.push(backupWorkspace);
    }
    
    await chrome.storage.local.set({ workspaces });
  }
});

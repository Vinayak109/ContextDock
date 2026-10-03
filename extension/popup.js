document.addEventListener('DOMContentLoaded', async () => {
  const currentTabsList = document.getElementById('current-tabs-list');
  const currentTabCount = document.getElementById('current-tab-count');
  
  const saveForm = document.getElementById('save-form');
  const startSaveBtn = document.getElementById('start-save-btn');
  const cancelSaveBtn = document.getElementById('cancel-save-btn');
  const confirmSaveBtn = document.getElementById('confirm-save-btn');
  const workspaceNameInput = document.getElementById('workspace-name');
  const workspacePurposeInput = document.getElementById('workspace-purpose');
  
  const autoSavedList = document.getElementById('auto-saved-list');
  const namedWorkspacesList = document.getElementById('named-workspaces-list');
  const exportBtn = document.getElementById('export-btn');

  let currentTabs = [];

  // --- 1. Load Current Window Tabs ---
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    // Filter out internal chrome pages
    currentTabs = tabs.filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'));
    
    currentTabCount.textContent = `${currentTabs.length} tabs`;
    
    if (currentTabs.length === 0) {
      currentTabsList.innerHTML = '<div class="p-3 text-xs text-gray-500 text-center">No valid tabs found in this window.</div>';
      startSaveBtn.style.display = 'none';
    } else {
      currentTabsList.innerHTML = currentTabs.map(t => {
        let domain = '';
        try { domain = new URL(t.url).hostname; } catch(e) {}
        
        return `
          <div class="p-2 flex items-center gap-2 overflow-hidden">
            <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" class="w-4 h-4 shrink-0" onerror="this.style.display='none'">
            <div class="text-xs text-gray-700 truncate font-medium flex-1" title="${t.title}">${t.title}</div>
          </div>
        `;
      }).join('');
    }
  });

  // --- 2. Save Current Window Form ---
  startSaveBtn.addEventListener('click', () => {
    startSaveBtn.classList.add('hidden');
    saveForm.classList.remove('hidden');
    workspaceNameInput.focus();
  });

  cancelSaveBtn.addEventListener('click', () => {
    saveForm.classList.add('hidden');
    startSaveBtn.classList.remove('hidden');
    workspaceNameInput.value = '';
    workspacePurposeInput.value = '';
  });

  confirmSaveBtn.addEventListener('click', async () => {
    const name = workspaceNameInput.value.trim();
    if (!name) return alert("Please provide a workspace name.");
    
    const newWorkspace = {
      id: 'ws_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: name,
      purpose: workspacePurposeInput.value.trim(),
      tag: 'Manual',
      color: '#4F46E5', // Indigo for manual/named
      tabs: currentTabs.map(t => ({ id: 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), title: t.title, url: t.url })),
      createdAt: new Date().toISOString(),
      source: 'manual',
      lastOpenedAt: null
    };

    const { workspaces = [] } = await chrome.storage.local.get('workspaces');
    workspaces.push(newWorkspace);
    await chrome.storage.local.set({ workspaces });
    
    cancelSaveBtn.click();
    loadWorkspaces();
  });

  // --- 3. Load Auto-Saved and Named Workspaces ---
  async function loadWorkspaces() {
    const { workspaces = [] } = await chrome.storage.local.get('workspaces');
    
    const autoSaves = workspaces.filter(w => w.source === 'auto' || w.source === 'auto_backup').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const named = workspaces.filter(w => w.source !== 'auto' && w.source !== 'auto_backup').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Render Auto-Saves
    if (autoSaves.length === 0) {
      autoSavedList.innerHTML = '<div class="text-xs text-gray-400 italic">No auto-saved sessions yet. Close a window to trigger one.</div>';
    } else {
      autoSavedList.innerHTML = autoSaves.slice(0, 5).map(w => `
        <div class="p-3 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-2">
          <div class="flex justify-between items-start">
            <div>
              <div class="text-xs font-bold text-gray-700 truncate" title="${w.name}">${w.name}</div>
              <div class="text-[10px] text-gray-500">${w.tabs.length} tabs</div>
            </div>
            <div class="flex gap-1">
              <button data-action="promote" data-id="${w.id}" class="px-2 py-1 bg-white border border-gray-200 hover:border-indigo-300 text-indigo-600 text-[10px] font-bold rounded shadow-sm transition-colors">Promote</button>
              <button data-action="discard" data-id="${w.id}" class="px-2 py-1 bg-white border border-gray-200 hover:border-red-300 text-red-500 text-[10px] font-bold rounded shadow-sm transition-colors">X</button>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    // Render Named
    if (named.length === 0) {
      namedWorkspacesList.innerHTML = '<div class="text-xs text-gray-400 italic">No named workspaces.</div>';
    } else {
      namedWorkspacesList.innerHTML = named.slice(0, 5).map(w => `
        <div class="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between group">
          <div>
            <div class="text-xs font-bold text-indigo-900 truncate">${w.name}</div>
            <div class="text-[10px] text-indigo-500">${w.tabs.length} tabs</div>
          </div>
          <button data-action="launch" data-id="${w.id}" class="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all">Launch</button>
        </div>
      `).join('');
    }
    
    attachWorkspaceListeners();
  }
  
  function attachWorkspaceListeners() {
    document.querySelectorAll('#auto-saved-list button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const action = e.target.getAttribute('data-action');
        const { workspaces = [] } = await chrome.storage.local.get('workspaces');
        
        if (action === 'discard') {
          const updated = workspaces.filter(w => w.id !== id);
          await chrome.storage.local.set({ workspaces: updated });
          loadWorkspaces();
        } else if (action === 'promote') {
          const index = workspaces.findIndex(w => w.id === id);
          if (index !== -1) {
            const newName = prompt("Name this workspace:", workspaces[index].name) || workspaces[index].name;
            workspaces[index].name = newName;
            workspaces[index].source = 'manual';
            workspaces[index].color = '#4F46E5'; // Indigo
            await chrome.storage.local.set({ workspaces });
            loadWorkspaces();
          }
        }
      });
    });
    
    document.querySelectorAll('#named-workspaces-list button').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const { workspaces = [] } = await chrome.storage.local.get('workspaces');
        const ws = workspaces.find(w => w.id === id);
        if (ws) {
          // Launch all tabs in a new window
          chrome.windows.create({
            url: ws.tabs.map(t => t.url)
          });
        }
      });
    });
  }

  // --- 4. Export JSON for Web Dashboard Bridge ---
  exportBtn.addEventListener('click', async () => {
    const { workspaces = [] } = await chrome.storage.local.get('workspaces');
    const json = JSON.stringify(workspaces, null, 2);
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(json);
        const originalText = exportBtn.innerText;
        exportBtn.innerText = "Copied!";
        setTimeout(() => exportBtn.innerText = originalText, 2000);
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch (e) {
      // Fallback
      prompt("Copy the JSON below:", json);
    }
  });

  loadWorkspaces();
});

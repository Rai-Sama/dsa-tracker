// Inject Network Interceptor
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(script);

// Listen for Success Signal from Network
window.addEventListener('message', function(event) {
  if (event.source !== window) return;
  if (event.data && event.data.type === 'DSA_SUCCESS') {
    setTimeout(showLogModal, 500);
  }
});

// Fallback: NeetCode Specific DOM Watcher
if (window.location.hostname.includes('neetcode')) {
  document.addEventListener('click', (e) => {
    let target = e.target.closest('button');
    if (target && target.innerText.toLowerCase().includes('submit')) {
      // Button was clicked, watch the page for 15 seconds
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        const html = document.body.innerHTML;
        // Look for the specific green accepted text
        if (html.includes('Accepted') && (html.includes('text-green') || html.includes('text-success'))) {
          clearInterval(interval);
          setTimeout(showLogModal, 500);
        }
        if (checks > 30) clearInterval(interval); // Timeout after 15s
      }, 500);
    }
  });
}

// Ensure modal only opens once per success
let modalOpen = false;

// Render Modal
function showLogModal() {
  if (modalOpen || document.getElementById("dsa-tracker-overlay")) return;
  modalOpen = true;

  const pathParts = window.location.pathname.split('/');
  const rawName = pathParts[pathParts.indexOf('problems') + 1] || 'Unknown Problem';
  const problemTitle = rawName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const platform = window.location.hostname.includes('leetcode') ? 'LeetCode' : 'NeetCode';

  const overlay = document.createElement("div");
  overlay.id = "dsa-tracker-overlay";
  
  overlay.innerHTML = `
    <div id="dsa-tracker-modal" style="background:#1e293b; color:#f8fafc; width:400px; padding:24px; border-radius:8px; border:1px solid #334155; font-family:sans-serif;">
      <h2 style="color:#38bdf8; margin-top:0;">🎉 Accepted! Log it?</h2>
      
      <label style="font-size:12px; color:#94a3b8; display:block; margin:10px 0 4px;">Problem</label>
      <input type="text" id="dsa-title" value="${problemTitle}" readonly style="width:100%; box-sizing:border-box; background:#0f172a; color:#cbd5e1; border:1px solid #334155; padding:8px; border-radius:4px;">
      
      <label style="font-size:12px; color:#94a3b8; display:block; margin:10px 0 4px;">Topics (comma separated)</label>
      <input type="text" id="dsa-topics" placeholder="e.g. Hash Map, Array" style="width:100%; box-sizing:border-box; background:#0f172a; color:#f8fafc; border:1px solid #334155; padding:8px; border-radius:4px;">
      
      <label style="font-size:12px; color:#94a3b8; display:block; margin:10px 0 4px;">Difficulty / Assistance</label>
      <select id="dsa-status" style="width:100%; box-sizing:border-box; background:#0f172a; color:#f8fafc; border:1px solid #334155; padding:8px; border-radius:4px;">
        <option value="solved">Solved Solitary / Optimal</option>
        <option value="hint">Needed Hint / Partial Help</option>
        <option value="failed">Heavy Help / Revisit Later</option>
      </select>
      
      <label style="font-size:12px; color:#94a3b8; display:block; margin:10px 0 4px;">Notes & Takeaways</label>
      <textarea id="dsa-notes" style="width:100%; box-sizing:border-box; background:#0f172a; color:#f8fafc; border:1px solid #334155; padding:8px; border-radius:4px; min-height:80px;"></textarea>
      
      <div style="display:flex; gap:10px; margin-top:20px;">
        <button id="dsa-btn-cancel" style="flex:1; padding:10px; border:none; border-radius:4px; background:#334155; color:#f8fafc; cursor:pointer; font-weight:bold;">Skip</button>
        <button id="dsa-btn-save" style="flex:1; padding:10px; border:none; border-radius:4px; background:#38bdf8; color:#0f172a; cursor:pointer; font-weight:bold;">Save Entry</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("dsa-btn-cancel").onclick = () => {
    overlay.remove();
    modalOpen = false;
  };
  
  document.getElementById("dsa-btn-save").onclick = () => {
    const newEntry = {
      title: problemTitle,
      platform: platform,
      url: window.location.href.split('/description')[0].split('/submissions')[0], 
      topics: document.getElementById('dsa-topics').value.split(',').map(t => t.trim()).filter(Boolean),
      status: document.getElementById('dsa-status').value,
      notes: document.getElementById('dsa-notes').value,
      date: new Date().toISOString().split('T')[0]
    };

    chrome.storage.local.get({ dsa_problems: [] }, (result) => {
      const updatedList = [newEntry, ...result.dsa_problems];
      chrome.storage.local.set({ dsa_problems: updatedList }, () => {
        overlay.remove();
        modalOpen = false;
      });
    });
  };
}

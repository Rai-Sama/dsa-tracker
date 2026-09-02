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

// 🧠 NEW: "Memory Scraper" - Stores topics if they are EVER visible during the session
let memorizedTopics = new Set();

function huntForTopics() {
  try {
    if (window.location.hostname.includes('leetcode')) {
      // LeetCode: Look for explicit tag links in the Description tab
      document.querySelectorAll('a[href*="/tag/"]').forEach(el => {
        const text = el.innerText.trim();
        if (text) memorizedTopics.add(text);
      });
    } else if (window.location.hostname.includes('neetcode')) {
      // NeetCode: Look for active sidebar categories or expanded topic tags
      document.querySelectorAll('.text-white.font-semibold, a[href*="/practice"]').forEach(el => {
         const text = el.innerText.trim();
         if (text && text.length > 2 && !text.includes('NeetCode') && !text.includes('150')) {
            memorizedTopics.add(text);
         }
      });
      // Look for the expanded topic pills directly under the title
      document.querySelectorAll('div > span.text-xs.font-semibold.text-white').forEach(el => {
         const text = el.innerText.trim();
         if (text) memorizedTopics.add(text);
      });
    }
  } catch (e) {}
}

// Silently watch for topics every 2 seconds while the user codes
setInterval(huntForTopics, 2000);

// Fallback & Trigger: Watch for Submit Clicks
document.addEventListener('click', (e) => {
  let target = e.target.closest('button');
  if (target && target.innerText.toLowerCase().includes('submit')) {
    
    // 🧠 The exact millisecond they hit Submit, aggressively scrape the topics
    // BEFORE LeetCode has a chance to switch to the Submissions tab!
    huntForTopics(); 

    if (window.location.hostname.includes('neetcode')) {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        const html = document.body.innerHTML;
        if (html.includes('Accepted') && (html.includes('text-green') || html.includes('text-success'))) {
          clearInterval(interval);
          setTimeout(showLogModal, 500);
        }
        if (checks > 30) clearInterval(interval); 
      }, 500);
    }
  }
});

let modalOpen = false;

function showLogModal() {
  if (modalOpen || document.getElementById("dsa-tracker-overlay")) return;
  modalOpen = true;

  const pathParts = window.location.pathname.split('/');
  const rawName = pathParts[pathParts.indexOf('problems') + 1] || 'Unknown Problem';
  const problemTitle = rawName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const platform = window.location.hostname.includes('leetcode') ? 'LeetCode' : 'NeetCode';
  
  // 🧠 Inject the memorized topics
  const prefilledTopics = Array.from(memorizedTopics).join(', ');

  const bg = document.createElement("div");
  bg.id = "dsa-tracker-bg";
  bg.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 999998;";

  const overlay = document.createElement("div");
  overlay.id = "dsa-tracker-overlay";
  overlay.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background:#1e293b; color:#f8fafc; width:400px; max-width: 95vw; max-height: 95vh; overflow-y: auto; padding:24px; border-radius:8px; border:1px solid #334155; font-family:-apple-system, sans-serif; z-index: 999999; box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: stretch; gap: 12px; box-sizing: border-box; text-align: left;";
  
  overlay.innerHTML = `
    <h2 style="color:#38bdf8; margin:0 0 4px 0; font-size: 20px; line-height: 1.2; display: block;">🎉 Accepted! Log it?</h2>
    
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <label style="font-size:12px; color:#94a3b8; display:block; margin:0;">Problem</label>
      <input type="text" id="dsa-title" value="${problemTitle}" style="width:100%; box-sizing:border-box; background:#0f172a; color:#cbd5e1; border:1px solid #334155; padding:8px; border-radius:4px; display: block; margin:0; font-size: 14px; line-height: 1.4;">
    </div>

    <div style="display: flex; flex-direction: column; gap: 4px;">
      <label style="font-size:12px; color:#94a3b8; display:block; margin:0;">Topics (comma separated)</label>
      <input type="text" id="dsa-topics" value="${prefilledTopics}" placeholder="e.g. Hash Map, Array" style="width:100%; box-sizing:border-box; background:#0f172a; color:#f8fafc; border:1px solid #334155; padding:8px; border-radius:4px; display: block; margin:0; font-size: 14px; line-height: 1.4;">
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <label style="font-size:12px; color:#94a3b8; display:block; margin:0;">Difficulty / Assistance</label>
      <select id="dsa-status" style="width:100%; box-sizing:border-box; background:#0f172a; color:#f8fafc; border:1px solid #334155; padding:8px; border-radius:4px; display: block; margin:0; font-size: 14px; line-height: 1.4;">
        <option value="solved">Solved Solitary / Optimal</option>
        <option value="hint">Needed Hint / Partial Help</option>
        <option value="failed">Heavy Help / Revisit Later</option>
      </select>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <label style="font-size:12px; color:#94a3b8; display:block; margin:0;">Notes & Takeaways</label>
      <textarea id="dsa-notes" style="width:100%; box-sizing:border-box; background:#0f172a; color:#f8fafc; border:1px solid #334155; padding:8px; border-radius:4px; min-height:80px; display: block; margin:0; font-size: 14px; line-height: 1.4; resize: vertical;"></textarea>
    </div>
    
    <label style="font-size:13px; font-weight:bold; color:#eab308; display:flex; align-items:center; gap:8px; margin:4px 0; cursor:pointer;">
      <input type="checkbox" id="dsa-important" style="width:16px; height:16px; cursor:pointer; margin:0;">
      ⭐ Mark as Important / Needs Review
    </label>

    <div style="display:flex; gap:10px; margin-top:8px;">
      <button id="dsa-btn-cancel" style="flex:1; padding:10px; border:none; border-radius:4px; background:#334155; color:#f8fafc; cursor:pointer; font-weight:bold; font-size:14px;">Skip</button>
      <button id="dsa-btn-save" style="flex:1; padding:10px; border:none; border-radius:4px; background:#38bdf8; color:#0f172a; cursor:pointer; font-weight:bold; font-size:14px;">Save Entry</button>
    </div>
  `;

  document.body.appendChild(bg);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById("dsa-btn-cancel").addEventListener("click", (e) => {
    e.preventDefault();
    overlay.remove(); bg.remove();
    modalOpen = false;
    memorizedTopics.clear(); // Reset for next problem
  });
  
  document.getElementById("dsa-btn-save").addEventListener("click", (e) => {
    e.preventDefault();

    if (typeof chrome === 'undefined' || !chrome.storage) {
      alert("Extension connection lost! Please refresh this page (F5) and try again.");
      return;
    }

    const saveBtn = document.getElementById("dsa-btn-save");
    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
      const now = new Date();
      const newEntry = {
        title: document.getElementById('dsa-title').value,
        platform: platform,
        url: window.location.href.split('/description')[0].split('/submissions')[0], 
        topics: document.getElementById('dsa-topics').value.split(',').map(t => t.trim()).filter(Boolean),
        status: document.getElementById('dsa-status').value,
        notes: document.getElementById('dsa-notes').value,
        date: now.toISOString().split('T')[0],
        timestamp: now.toISOString(), 
        isImportant: document.getElementById('dsa-important').checked 
      };

      chrome.storage.local.get({ dsa_problems: [] }, (result) => {
        const updatedList = [newEntry, ...result.dsa_problems];
        chrome.storage.local.set({ dsa_problems: updatedList }, () => {
          overlay.remove(); bg.remove();
          modalOpen = false;
          memorizedTopics.clear(); // Reset for next problem
        });
      });
    } catch (err) {
      console.error("DSA Tracker Save Error:", err);
      saveBtn.innerText = "Error Saving";
    }
  });
}

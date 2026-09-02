let problems = [];
let activeTopicFilters = new Set(); // Stores our multi-select topics

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('dsaForm').addEventListener('submit', saveProblem);
  document.getElementById('cancelBtn').addEventListener('click', resetForm);
  
  // Searching & Toggles
  document.getElementById('search').addEventListener('input', render);
  document.getElementById('filterStatus').addEventListener('change', render);
  document.getElementById('filterImportant').addEventListener('change', render);
  
  // 🧠 Add Topic to Active Filters when selected from Dropdown
  document.getElementById('filterTopic').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val !== '') {
      activeTopicFilters.add(val);
      e.target.value = ''; // Reset dropdown instantly
      render();
    }
  });
  
  // Import/Export
  document.getElementById('exportBtn').addEventListener('click', exportJSON);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('fileInput').click());
  document.getElementById('fileInput').addEventListener('change', importJSON);

  // Global Click Events (Delegation)
  document.addEventListener('click', (e) => {
    // Edit & Delete
    if (e.target.classList.contains('edit-btn')) {
      editProblem(parseInt(e.target.dataset.index));
    } else if (e.target.classList.contains('delete-btn')) {
      deleteProblem(parseInt(e.target.dataset.index));
    } 
    // Toggle Star
    else if (e.target.closest('.star-btn')) {
      const btn = e.target.closest('.star-btn');
      toggleImportant(parseInt(btn.dataset.index));
    }
    // 🧠 Click a tag on a card to instantly add it to filters
    else if (e.target.classList.contains('tag')) {
      activeTopicFilters.add(e.target.innerText);
      render();
    }
    // 🧠 Click the 'x' on an active filter pill to remove it
    else if (e.target.closest('.remove-topic-btn')) {
      const btn = e.target.closest('.remove-topic-btn');
      activeTopicFilters.delete(btn.dataset.topic);
      render();
    }
  });

  loadData();
});

function loadData() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get({ dsa_problems: [] }, (result) => {
      problems = result.dsa_problems || [];
      render();
    });
  }
}

function saveToStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ dsa_problems: problems }, () => render());
  }
}

function saveProblem(e) {
  e.preventDefault();
  const index = parseInt(document.getElementById('editIndex').value);
  const now = new Date();
  
  const entry = {
    title: document.getElementById('title').value,
    platform: document.getElementById('platform').value,
    url: document.getElementById('url').value,
    topics: document.getElementById('topics').value.split(',').map(t => t.trim()).filter(Boolean),
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    isImportant: document.getElementById('isImportant').checked,
    date: index >= 0 ? problems[index].date : now.toISOString().split('T')[0],
    timestamp: index >= 0 && problems[index].timestamp ? problems[index].timestamp : now.toISOString()
  };

  if (index >= 0) problems[index] = entry;
  else problems.unshift(entry);

  saveToStorage();
  resetForm();
}

function editProblem(index) {
  const p = problems[index];
  document.getElementById('editIndex').value = index;
  document.getElementById('title').value = p.title;
  document.getElementById('platform').value = p.platform;
  document.getElementById('url').value = p.url;
  document.getElementById('topics').value = (p.topics || []).join(', ');
  document.getElementById('status').value = p.status;
  document.getElementById('notes').value = p.notes;
  document.getElementById('isImportant').checked = !!p.isImportant;
  
  document.getElementById('formTitle').innerText = 'Edit Entry';
  document.getElementById('submitBtn').innerText = 'Update Entry';
  document.getElementById('cancelBtn').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProblem(index) {
  if (confirm('Delete this entry?')) { problems.splice(index, 1); saveToStorage(); }
}

function toggleImportant(index) {
  problems[index].isImportant = !problems[index].isImportant;
  saveToStorage();
}

function resetForm() {
  document.getElementById('dsaForm').reset();
  document.getElementById('editIndex').value = -1;
  document.getElementById('formTitle').innerText = 'Log Problem Manually';
  document.getElementById('submitBtn').innerText = 'Save Entry';
  document.getElementById('cancelBtn').style.display = 'none';
}

// 🧠 Update Topic Dropdown, hiding topics we already have active
function updateTopicDropdown() {
  const select = document.getElementById('filterTopic');
  const topicSet = new Set();
  
  // Extract all unique topics
  problems.forEach(p => (p.topics || []).forEach(t => topicSet.add(t)));
  
  let optionsHTML = '<option value="">+ Add Topic Filter...</option>';
  [...topicSet].sort().forEach(t => {
    // Only show topics in dropdown if they aren't currently active
    if (!activeTopicFilters.has(t)) {
      optionsHTML += `<option value="${t}">${t}</option>`;
    }
  });
  
  select.innerHTML = optionsHTML;
}

function renderActiveTopicPills() {
  const container = document.getElementById('activeTopicFilters');
  if (activeTopicFilters.size === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = [...activeTopicFilters].map(t => `
    <div class="filter-pill">
      ${t} 
      <button class="remove-topic-btn" data-topic="${t}" title="Remove Filter">&times;</button>
    </div>
  `).join('');
}

function formatDateTime(p) {
  if (p.timestamp) {
    const d = new Date(p.timestamp);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  return p.date; 
}

function getBadgeClass(s) { return s === 'solved' ? 'badge-solved' : s === 'hint' ? 'badge-hint' : 'badge-failed'; }
function getStatusLabel(s) { return s === 'solved' ? 'Solved' : s === 'hint' ? 'Needed Hint' : 'Revisit Needed'; }

function render() {
  updateTopicDropdown();
  renderActiveTopicPills();

  const listEl = document.getElementById('problemsList');
  const search = document.getElementById('search').value.toLowerCase();
  const filterStatus = document.getElementById('filterStatus').value;
  const filterImportant = document.getElementById('filterImportant').checked;

  const filtered = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search) || (p.notes && p.notes.toLowerCase().includes(search));
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesImportant = !filterImportant || p.isImportant;
    
    // 🧠 MULTI-SELECT LOGIC (AND): Problem must have ALL selected topics to show up
    const matchesTopics = activeTopicFilters.size === 0 || [...activeTopicFilters].every(activeTag => p.topics && p.topics.includes(activeTag));
    
    return matchesSearch && matchesStatus && matchesImportant && matchesTopics;
  });

  if (!filtered.length) { 
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px 0;">No matching entries found.</div>`; 
    return; 
  }

  listEl.innerHTML = filtered.map(p => {
    const idx = problems.indexOf(p);
    const starClass = p.isImportant ? 'active' : '';
    const starIcon = p.isImportant ? '⭐' : '☆';
    
    return `
      <div class="problem-card ${p.isImportant ? 'is-important' : ''}">
        <div class="problem-header">
          <div class="problem-title-group">
            <button class="star-btn ${starClass}" data-index="${idx}" title="Mark for review">${starIcon}</button>
            <div class="problem-title">${p.url ? `<a href="${p.url}" target="_blank">${p.title}</a>` : p.title}</div>
          </div>
          <span class="badge ${getBadgeClass(p.status)}">${getStatusLabel(p.status)}</span>
        </div>
        
        <div class="meta-info">
          <span><strong>Platform:</strong> ${p.platform}</span>
          <span><strong>Time:</strong> ${formatDateTime(p)}</span>
        </div>
        
        ${p.topics && p.topics.length ? `<div class="tags-list">${p.topics.map(t => `<span class="tag" title="Add to filters">${t}</span>`).join('')}</div>` : ''}
        ${p.notes ? `<div class="notes">${p.notes}</div>` : ''}
        
        <div class="card-actions">
          <button class="btn-small edit-btn" data-index="${idx}">Edit</button>
          <button class="btn-small btn-danger delete-btn" data-index="${idx}">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function exportJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(problems, null, 2));
  const a = document.createElement('a'); 
  a.href = dataStr; 
  a.download = `dsa_log_${new Date().toISOString().split('T')[0]}.json`; 
  a.click();
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try { 
      problems = JSON.parse(e.target.result); 
      saveToStorage(); 
      alert('Imported successfully!'); 
      document.getElementById('fileInput').value = ''; 
    } 
    catch (err) { alert('Invalid JSON.'); }
  };
  reader.readAsText(file);
}

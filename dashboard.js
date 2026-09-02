let problems = [];

// Wait for the DOM to load before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('dsaForm').addEventListener('submit', saveProblem);
  document.getElementById('cancelBtn').addEventListener('click', resetForm);
  document.getElementById('search').addEventListener('input', render);
  document.getElementById('filterStatus').addEventListener('change', render);
  document.getElementById('exportBtn').addEventListener('click', exportJSON);
  
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
  document.getElementById('fileInput').addEventListener('change', importJSON);

  // Event Delegation for dynamically created Edit/Delete buttons
  document.getElementById('problemsList').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
      editProblem(parseInt(e.target.dataset.index));
    } else if (e.target.classList.contains('delete-btn')) {
      deleteProblem(parseInt(e.target.dataset.index));
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
  const entry = {
    title: document.getElementById('title').value,
    platform: document.getElementById('platform').value,
    url: document.getElementById('url').value,
    topics: document.getElementById('topics').value.split(',').map(t => t.trim()).filter(Boolean),
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value,
    date: index >= 0 ? problems[index].date : new Date().toISOString().split('T')[0]
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
  document.getElementById('topics').value = p.topics.join(', ');
  document.getElementById('status').value = p.status;
  document.getElementById('notes').value = p.notes;
  document.getElementById('formTitle').innerText = 'Edit Entry';
  document.getElementById('submitBtn').innerText = 'Update Entry';
  document.getElementById('cancelBtn').style.display = 'block';
}

function deleteProblem(index) {
  if (confirm('Delete this entry?')) { 
    problems.splice(index, 1); 
    saveToStorage(); 
  }
}

function resetForm() {
  document.getElementById('dsaForm').reset();
  document.getElementById('editIndex').value = -1;
  document.getElementById('formTitle').innerText = 'Log Problem';
  document.getElementById('submitBtn').innerText = 'Save Entry';
  document.getElementById('cancelBtn').style.display = 'none';
}

function getBadgeClass(s) { return s === 'solved' ? 'badge-solved' : s === 'hint' ? 'badge-hint' : 'badge-failed'; }
function getStatusLabel(s) { return s === 'solved' ? 'Solved' : s === 'hint' ? 'Needed Hint' : 'Revisit Needed'; }

function render() {
  const listEl = document.getElementById('problemsList');
  const search = document.getElementById('search').value.toLowerCase();
  const filter = document.getElementById('filterStatus').value;

  const filtered = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search) || p.topics.some(t => t.toLowerCase().includes(search)) || p.notes.toLowerCase().includes(search);
    const matchesStatus = filter === 'all' || p.status === filter;
    return matchesSearch && matchesStatus;
  });

  if (!filtered.length) { 
    listEl.innerHTML = `<div style="text-align: center; padding: 40px 0;">No entries found.</div>`; 
    return; 
  }

  listEl.innerHTML = filtered.map(p => {
    const idx = problems.indexOf(p);
    return `
      <div class="problem-card">
        <div class="problem-header">
          <div class="problem-title">${p.url ? `<a href="${p.url}" target="_blank">${p.title}</a>` : p.title}</div>
          <span class="badge ${getBadgeClass(p.status)}">${getStatusLabel(p.status)}</span>
        </div>
        <div class="meta-info"><span>Platform: ${p.platform}</span><span>Date: ${p.date}</span></div>
        ${p.topics.length ? `<div class="tags-list">${p.topics.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
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
  a.download = `dsa_log.json`; 
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
      document.getElementById('fileInput').value = ''; // Reset input
    } 
    catch (err) { alert('Invalid JSON.'); }
  };
  reader.readAsText(file);
}

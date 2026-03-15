// LitePost Frontend Application

// State
let requests = [];
let currentRequestId = null;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Sync URL input
    document.getElementById('urlInput').addEventListener('input', (e) => {
        document.getElementById('editorUrl').value = e.target.value;
    });
    
    // Sync method select
    document.getElementById('methodSelect').addEventListener('change', (e) => {
        document.getElementById('editorMethod').value = e.target.value;
    });
    
    // Sync editor fields to header
    document.getElementById('editorUrl').addEventListener('input', (e) => {
        document.getElementById('urlInput').value = e.target.value;
    });
    
    document.getElementById('editorMethod').addEventListener('change', (e) => {
        document.getElementById('methodSelect').value = e.target.value;
    });
}

// Load requests from API
async function loadRequests() {
    try {
        const response = await fetch('/api/requests');
        requests = await response.json();
        renderRequests();
        updateBulkRequestSelect();
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

// Render requests list in sidebar
function renderRequests() {
    const container = document.getElementById('requestsList');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8 text-sm">
                No requests yet. Click "Add Request" to create one.
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="request-item p-3 rounded cursor-pointer ${currentRequestId === req.id ? 'active' : ''}"
             onclick="selectRequest(${req.id})">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-mono bg-gray-600 px-2 py-1 rounded">${req.method}</span>
                    <span class="text-sm font-medium truncate flex-1">${escapeHtml(req.name)}</span>
                </div>
                <span class="text-xs text-gray-500">${formatDate(req.created_at)}</span>
            </div>
        </div>
    `).join('');
}

// Select a request
function selectRequest(id) {
    currentRequestId = id;
    renderRequests();
    loadRequestDetails(id);
}

// Load request details
async function loadRequestDetails(id) {
    try {
        const response = await fetch(`/api/requests?id=${id}`);
        const data = await response.json();
        
        // API returns array, get first element
        const request = Array.isArray(data) ? data[0] : data;
        
        if (request) {
            document.getElementById('methodSelect').value = request.method;
            document.getElementById('editorMethod').value = request.method;
            document.getElementById('urlInput').value = request.url;
            document.getElementById('editorUrl').value = request.url;
            document.getElementById('headersInput').value = request.headers || '';
            document.getElementById('bodyInput').value = request.body || '';
        }
    } catch (error) {
        console.error('Error loading request details:', error);
    }
}

// Create new request
function createRequest() {
    const name = document.getElementById('requestName').value.trim();
    if (!name) {
        alert('Please enter a request name');
        return;
    }
    
    const method = document.getElementById('methodSelect').value;
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, method, url })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('requestName').value = '';
        loadRequests();
        selectRequest(data.id);
    })
    .catch(err => {
        console.error('Error creating request:', err);
        alert('Failed to create request');
    });
}

// Update request
function updateRequest() {
    if (!currentRequestId) return;
    
    const name = document.getElementById('requestName').value.trim();
    const method = document.getElementById('methodSelect').value;
    const url = document.getElementById('urlInput').value.trim();
    const headers = document.getElementById('headersInput').value;
    const body = document.getElementById('bodyInput').value;
    
    fetch(`/api/requests/${currentRequestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, method, url, headers, body })
    })
    .then(res => res.json())
    .then(data => {
        loadRequests();
        selectRequest(currentRequestId);
    })
    .catch(err => {
        console.error('Error updating request:', err);
        alert('Failed to update request');
    });
}

// Delete request
function deleteRequest(id) {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    fetch(`/api/requests/${id}`, { method: 'DELETE' })
    .then(() => {
        loadRequests();
        if (currentRequestId === id) {
            currentRequestId = null;
            document.getElementById('urlInput').value = '';
            document.getElementById('editorUrl').value = '';
            document.getElementById('methodSelect').value = 'GET';
            document.getElementById('editorMethod').value = 'GET';
            document.getElementById('headersInput').value = '';
            document.getElementById('bodyInput').value = '';
        }
    })
    .catch(err => {
        console.error('Error deleting request:', err);
        alert('Failed to delete request');
    });
}

// Add delete button to request items
function renderRequests() {
    const container = document.getElementById('requestsList');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8 text-sm">
                No requests yet. Click "Add Request" to create one.
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(req => `
        <div class="request-item p-3 rounded cursor-pointer ${currentRequestId === req.id ? 'active' : ''}"
             onclick="selectRequest(${req.id})">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-mono bg-gray-600 px-2 py-1 rounded">${req.method}</span>
                    <span class="text-sm font-medium truncate flex-1">${escapeHtml(req.name)}</span>
                </div>
                <button onclick="event.stopPropagation(); deleteRequest(${req.id})"
                        class="text-gray-500 hover:text-red-400 p-1">
                    ×
                </button>
            </div>
        </div>
    `).join('');
}

// Show tab
function showTab(tabName) {
    // Hide all tabs
    ['editor', 'headers', 'body'].forEach(t => {
        document.getElementById(t + 'Tab').classList.add('hidden');
        const btn = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
        btn.classList.remove('border-blue-400', 'text-blue-400');
        btn.classList.add('border-transparent', 'text-gray-400');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    const btn = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    btn.classList.add('border-blue-400', 'text-blue-400');
    btn.classList.remove('border-transparent', 'text-gray-400');
}

// Show runner tab
function showRunnerTab() {
    updateBulkRequestSelect();
}

// Update bulk run request select
function updateBulkRequestSelect() {
    const select = document.getElementById('bulkRequestId');
    select.innerHTML = requests.map(req => `
        <option value="${req.id}">${req.name} (${req.method})</option>
    `).join('');
}

// Execute single request
async function executeRequest() {
    if (!currentRequestId) {
        alert('Please select a request or enter URL and method');
        return;
    }
    
    const method = document.getElementById('methodSelect').value;
    const url = document.getElementById('urlInput').value.trim();
    const headers = document.getElementById('headersInput').value;
    const body = document.getElementById('bodyInput').value;
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    // Clear previous results
    document.getElementById('responseStatus').innerHTML = '';
    document.getElementById('responseData').innerHTML = '';
    document.getElementById('responseConsole').innerHTML = '';
    
    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: currentRequestId, method, url, headers, body })
        });
        
        const result = await response.json();
        
        // Display response
        const statusEl = document.getElementById('responseStatus');
        statusEl.innerHTML = `<span class="text-sm">${result.status} ${result.statusText || ''}</span>`;
        
        const dataEl = document.getElementById('responseData');
        dataEl.textContent = JSON.stringify(result.data, null, 2);
        
        // Log to console
        const consoleEl = document.getElementById('responseConsole');
        consoleEl.innerHTML = `
            <div class="mb-2">
                <span class="text-blue-400">Request:</span> ${method} ${url}
            </div>
            ${headers ? `<div class="mb-2"><span class="text-purple-400">Headers:</span> ${JSON.stringify(headers)}</div>` : ''}
            ${body ? `<div class="mb-2"><span class="text-green-400">Body:</span> ${JSON.stringify(body)}</div>` : ''}
            <div class="mb-2">
                <span class="text-yellow-400">Response:</span> ${result.status} ${result.statusText || ''}
            </div>
        `;
    } catch (error) {
        document.getElementById('responseStatus').innerHTML = `<span class="text-red-400">Error: ${error.message}</span>`;
        document.getElementById('responseData').innerHTML = '';
        document.getElementById('responseConsole').innerHTML = `
            <div class="text-red-400">Error: ${error.message}</div>
        `;
    }
}

// Show CSV modal
function closeCsvModal() {
    document.getElementById('csvModal').classList.add('hidden');
    document.getElementById('csvModal').classList.remove('flex');
    document.getElementById('csvFile').value = '';
}

// Open CSV modal
function openCsvModal() {
    document.getElementById('csvModal').classList.remove('hidden');
    document.getElementById('csvModal').classList.add('flex');
}

// Run bulk requests
async function runBulk() {
    const requestId = document.getElementById('bulkRequestId').value;
    const fileInput = document.getElementById('csvFile');
    
    if (!requestId) {
        alert('Please select a request');
        return;
    }
    
    if (!fileInput.files.length) {
        alert('Please upload a CSV file');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('csv', file);
    formData.append('requestId', requestId);
    
    try {
        document.getElementById('responseStatus').innerHTML = '<span class="text-yellow-400">Running bulk requests...</span>';
        document.getElementById('responseData').innerHTML = '';
        
        const response = await fetch('/api/bulk-run', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        // Display results
        const statusEl = document.getElementById('responseStatus');
        statusEl.innerHTML = `<span class="text-green-400">Completed: ${result.successful} successful, ${result.failed} failed</span>`;
        
        const dataEl = document.getElementById('responseData');
        dataEl.innerHTML = `
            <div class="text-sm mb-2">
                <span class="text-blue-400">Total:</span> ${result.total}
            </div>
            <div class="text-sm mb-2">
                <span class="text-green-400">Successful:</span> ${result.successful}
            </div>
            <div class="text-sm mb-2">
                <span class="text-red-400">Failed:</span> ${result.failed}
            </div>
        `;
        
        // Log results
        const consoleEl = document.getElementById('responseConsole');
        consoleEl.innerHTML = `
            <div class="mb-2">
                <span class="text-blue-400">Bulk Run Results:</span>
            </div>
            ${result.results.map(r => `
                <div class="mb-1">
                    <span class="text-green-400">✓</span> ${r.url} - Status: ${r.status}
                </div>
            `).join('')}
            ${result.errors.map(e => `
                <div class="mb-1">
                    <span class="text-red-400">✗</span> ${e.url} - ${e.error}
                </div>
            `).join('')}
        `;
        
        closeCsvModal();
    } catch (error) {
        document.getElementById('responseStatus').innerHTML = `<span class="text-red-400">Error: ${error.message}</span>`;
        document.getElementById('responseConsole').innerHTML = `
            <div class="text-red-400">Error: ${error.message}</div>
        `;
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

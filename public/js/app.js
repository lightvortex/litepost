// LitePost Frontend Application

// State
let requests = [];
let currentRequestId = null;

// Resize state management
const resizeState = {
    active: null,
    startY: 0,
    startHeight: 0,
    handleType: null,
    container: null,
    isDragging: false
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    setupEventListeners();
    setupMainTabListeners();
    setupSubTabListeners();
    setupResizeHandles();
    setupCollapseExpand();
    setupSmoothTransitions();
    showMainTab('requests'); // Show Requests tab by default
});

// Setup event listeners
function setupEventListeners() {
    // URL input listener - sync when user types
    const urlInput = document.getElementById('editorUrl');
    if (urlInput) {
        urlInput.addEventListener('input', (e) => {
            urlInput.value = e.target.value;
        });
    }

    // Method select listener - sync when user changes
    const methodSelect = document.getElementById('editorMethod');
    if (methodSelect) {
        methodSelect.addEventListener('change', (e) => {
            methodSelect.value = e.target.value;
        });
    }
}

// Setup main tab event listeners
function setupMainTabListeners() {
    // Requests tab
    document.getElementById('mainTabRequests').addEventListener('click', () => {
        showMainTab('requests');
        showSubTab('editor'); // Default to editor sub-tab
    });
    
    // Runner tab
    document.getElementById('mainTabRunner').addEventListener('click', () => {
        showMainTab('runner');
        showRunnerTab();
    });
    
    // Settings tab
    document.getElementById('mainTabSettings').addEventListener('click', () => {
        showMainTab('settings');
    });
}

// Setup sub-tab event listeners (within Requests tab)
function setupSubTabListeners() {
    // Editor sub-tab
    document.getElementById('subTabEditor').addEventListener('click', () => {
        showSubTab('editor');
    });
    
    // Headers sub-tab
    document.getElementById('subTabHeaders').addEventListener('click', () => {
        showSubTab('headers');
    });
    
    // Body sub-tab
    document.getElementById('subTabBody').addEventListener('click', () => {
        showSubTab('body');
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
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-text">No requests yet. Click "Add Request" to create one.</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map((req, index) => `
        <div class="request-item p-3 rounded cursor-pointer ${currentRequestId === req.id ? 'active' : ''}"
             onclick="selectRequest(${req.id})"
             style="animation-delay: ${index * 0.05}s">
            <div class="request-info">
                <span class="method-badge">${req.method}</span>
                <span class="request-name">${escapeHtml(req.name)}</span>
            </div>
            <span class="request-time">${formatDate(req.created_at)}</span>
            <button onclick="event.stopPropagation(); deleteRequest(${req.id})"
                    class="delete-btn"
                    title="Delete request">
                ×
            </button>
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
            document.getElementById('editorMethod').value = request.method;
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
    
    const method = document.getElementById('editorMethod').value;
    const url = document.getElementById('editorUrl').value.trim();
    
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
        document.getElementById('editorUrl').value = '';
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
    const method = document.getElementById('editorMethod').value;
    const url = document.getElementById('editorUrl').value.trim();
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
            document.getElementById('editorUrl').value = '';
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

// Show main tab
function showMainTab(tabName) {
    // Hide all main tabs
    ['requests', 'runner', 'settings'].forEach(t => {
        document.getElementById(t + 'TabContent').classList.add('hidden');
        const btn = document.getElementById('mainTab' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) {
            btn.classList.remove('text-blue-400', 'bg-blue-500/10');
            btn.classList.add('text-gray-400');
        }
    });
    
    // Show selected tab
    document.getElementById(tabName + 'TabContent').classList.remove('hidden');
    const btn = document.getElementById('mainTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (btn) {
        btn.classList.add('text-blue-400', 'bg-blue-500/10');
        btn.classList.remove('text-gray-400');
    }
}

// Show sub-tab (within Requests tab)
function showSubTab(tabName) {
    // Hide all sub-tabs
    ['editor', 'headers', 'body'].forEach(t => {
        document.getElementById('subTab' + t.charAt(0).toUpperCase() + t.slice(1) + 'Content').classList.add('hidden');
        const btn = document.getElementById('subTab' + t.charAt(0).toUpperCase() + t.slice(1));
        if (btn) {
            btn.classList.remove('text-blue-400', 'bg-blue-500/10');
            btn.classList.add('text-gray-400');
        }
    });
    
    // Show selected sub-tab
    document.getElementById('subTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Content').classList.remove('hidden');
    const btn = document.getElementById('subTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (btn) {
        btn.classList.add('text-blue-400', 'bg-blue-500/10');
        btn.classList.remove('text-gray-400');
    }
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
// Runner mode functions

// Execution log storage
let executionLog = [];

// Show runner tab and update request select
function showRunnerTab() {
    updateBulkRequestSelect();
    updateRunnerRequestSelects();
}

// Update runner request selects
function updateRunnerRequestSelects() {
    const csvSelect = document.getElementById('runnerCsvRequestSelect');
    const repeatSelect = document.getElementById('runnerRepeatRequestSelect');
    
    if (csvSelect) {
        csvSelect.innerHTML = requests.map(req =>
            `<option value="${req.id}">${req.name} (${req.method})</option>`
        ).join('');
    }
    
    if (repeatSelect) {
        repeatSelect.innerHTML = requests.map(req =>
            `<option value="${req.id}">${req.name} (${req.method})</option>`
        ).join('');
    }
}

// Run CSV mode
async function runCsvMode() {
    const requestId = document.getElementById('runnerCsvRequestSelect').value;
    const fileInput = document.getElementById('runnerCsvFile');
    
    if (!requestId) {
        alert('Please select a request');
        return;
    }
    
    if (!fileInput.files.length) {
        alert('Please upload a CSV file');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            alert('CSV file must have at least a header row and one data row');
            return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim());
        const dataRows = lines.slice(1);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < dataRows.length; i++) {
            const values = dataRows[i].split(',').map(v => v.trim());
            const logEntry = {
                id: Date.now() + i,
                timestamp: new Date().toISOString(),
                requestName: requests.find(r => r.id == requestId)?.name || 'Unknown',
                method: requests.find(r => r.id == requestId)?.method || 'GET',
                url: '',
                status: null,
                statusText: null,
                duration: null,
                success: false,
                error: null,
                variables: {}
            };
            
            // Map CSV values to variables
            headers.forEach((header, idx) => {
                logEntry.variables[header] = values[idx] || '';
            });
            
            // Build URL with variable replacement
            const method = requests.find(r => r.id == requestId)?.method || 'GET';
            const baseUrl = requests.find(r => r.id == requestId)?.url || '';
            let url = baseUrl.replace(new RegExp('{{\\(' + headers.join('|') + '\\)}}', 'g'), (match) => {
                const varName = match.replace('{{(', '').replace(')}}', '');
                return logEntry.variables[varName] || match;
            });
            
            logEntry.url = url;
            
            try {
                const response = await fetch('/api/proxy', {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId, method, url, headers: {}, body: '' })
                });
                
                const result = await response.json();
                logEntry.status = result.status;
                logEntry.statusText = result.statusText || '';
                logEntry.duration = result.duration;
                logEntry.success = true;
                successCount++;
            } catch (error) {
                logEntry.status = null;
                logEntry.statusText = null;
                logEntry.duration = null;
                logEntry.success = false;
                logEntry.error = error.message;
                errorCount++;
            }
            
            executionLog.push(logEntry);
            renderExecutionLog();
        }
        
        fileInput.value = '';
        alert(`CSV execution complete! Success: ${successCount}, Errors: ${errorCount}`);
    };
    
    reader.onerror = () => {
        alert('Error reading CSV file');
    };
    
    reader.readAsText(file);
}

// Run repeat mode
async function runRepeatMode() {
    const requestId = document.getElementById('runnerRepeatRequestSelect').value;
    const count = parseInt(document.getElementById('runnerRepeatCount').value);
    
    if (!requestId) {
        alert('Please select a request');
        return;
    }
    
    if (count < 1 || count > 1000) {
        alert('Please enter a valid count between 1 and 1000');
        return;
    }
    
    const method = requests.find(r => r.id == requestId)?.method || 'GET';
    const url = requests.find(r => r.id == requestId)?.url || '';
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < count; i++) {
        const logEntry = {
            id: Date.now() + i,
            timestamp: new Date().toISOString(),
            requestName: requests.find(r => r.id == requestId)?.name || 'Unknown',
            method: method,
            url: url,
            status: null,
            statusText: null,
            duration: null,
            success: false,
            error: null
        };
        
        try {
            const response = await fetch('/api/proxy', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, method, url, headers: {}, body: '' })
            });
            
            const result = await response.json();
            logEntry.status = result.status;
            logEntry.statusText = result.statusText || '';
            logEntry.duration = result.duration;
            logEntry.success = true;
            successCount++;
        } catch (error) {
            logEntry.status = null;
            logEntry.statusText = null;
            logEntry.duration = null;
            logEntry.success = false;
            logEntry.error = error.message;
            errorCount++;
        }
        
        executionLog.push(logEntry);
        renderExecutionLog();
    }
    
    alert(`Repeat execution complete! Success: ${successCount}, Errors: ${errorCount}`);
}

// Clear execution log
function clearExecutionLog() {
    executionLog = [];
    renderExecutionLog();
}

// Render execution log
function renderExecutionLog() {
    const logContainer = document.getElementById('executionLog');
    
    if (!executionLog.length) {
        logContainer.innerHTML = '<p class="text-sm text-gray-500">No executions yet...</p>';
        return;
    }
    
    const logItems = executionLog.map(entry => {
        const statusClass = entry.success ? 'success' : 'error';
        const statusText = entry.success
            ? `${entry.status} ${entry.statusText || ''}`
            : `Error: ${entry.error || 'Unknown error'}`;
        
        return `
            <div class="execution-log-item animate-fade-in">
                <div class="log-header">
                    <span class="log-status ${statusClass}">${statusText}</span>
                    <span class="log-time">${new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <div class="log-details">
                    <span class="label text-blue-400">${entry.method}</span> ${entry.url}
                    ${entry.duration ? `<span class="text-gray-500 text-xs ml-2">(${entry.duration}ms)</span>` : ''}
                </div>
                ${entry.variables && Object.keys(entry.variables).length > 0 ? `
                    <div class="log-variables mt-2">
                        <span class="text-xs text-gray-500">Variables:</span>
                        <span class="text-xs">${JSON.stringify(entry.variables)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    logContainer.innerHTML = logItems;
}

// Execute single request
async function executeRequest() {
    if (!currentRequestId) {
        alert('Please select a request or enter URL and method');
        return;
    }
    
    const method = document.getElementById('editorMethod').value;
    const url = document.getElementById('editorUrl').value.trim();
    const headers = document.getElementById('headersInput').value;
    const body = document.getElementById('bodyInput').value;
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    // Clear previous results with animation
    const responseStatus = document.getElementById('responseStatus');
    const responseData = document.getElementById('responseData');
    const responseConsole = document.getElementById('responseConsole');
    
    responseStatus.innerHTML = '';
    responseData.innerHTML = '';
    responseConsole.innerHTML = '';
    
    try {
        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: currentRequestId, method, url, headers, body })
        });
        
        const result = await response.json();
        
        // Display response
        responseStatus.innerHTML = `<span class="status-success text-sm">${result.status} ${result.statusText || ''}</span>`;
        
        const dataEl = document.getElementById('responseData');
        dataEl.textContent = JSON.stringify(result.data, null, 2);
        
        // Log to console
        responseConsole.innerHTML = `
            <div class="animate-fade-in">
                <span class="label text-blue-400">Request:</span> ${method} ${url}
            </div>
            ${headers ? `<div class="animate-fade-in"><span class="label text-purple-400">Headers:</span> ${JSON.stringify(headers)}</div>` : ''}
            ${body ? `<div class="animate-fade-in"><span class="label text-green-400">Body:</span> ${JSON.stringify(body)}</div>` : ''}
            <div class="animate-fade-in">
                <span class="label text-yellow-400">Response:</span> ${result.status} ${result.statusText || ''}
            </div>
        `;
    } catch (error) {
        responseStatus.innerHTML = `<span class="status-error text-sm">Error: ${error.message}</span>`;
        responseData.innerHTML = '';
        responseConsole.innerHTML = `
            <div class="animate-fade-in text-red-400">Error: ${error.message}</div>
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
        document.getElementById('responseStatus').innerHTML = '<span class="status-warning text-sm">Running bulk requests...</span>';
        document.getElementById('responseData').innerHTML = '';
        
        const response = await fetch('/api/bulk-run', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        // Display results
        document.getElementById('responseStatus').innerHTML = `<span class="status-success text-sm">Completed: ${result.successful} successful, ${result.failed} failed</span>`;
        
        document.getElementById('responseData').innerHTML = `
            <div class="text-sm mb-2 animate-fade-in">
                <span class="label text-blue-400">Total:</span> ${result.total}
            </div>
            <div class="text-sm mb-2 animate-fade-in">
                <span class="label text-green-400">Successful:</span> ${result.successful}
            </div>
            <div class="text-sm mb-2 animate-fade-in">
                <span class="label text-red-400">Failed:</span> ${result.failed}
            </div>
        `;
        
        // Log results
        document.getElementById('responseConsole').innerHTML = `
            <div class="mb-2 animate-fade-in">
                <span class="label text-blue-400">Bulk Run Results:</span>
            </div>
            ${result.results.map(r => `
                <div class="animate-fade-in">
                    <span class="label text-green-400">✓</span> ${r.url} - Status: ${r.status}
                </div>
            `).join('')}
            ${result.errors.map(e => `
                <div class="animate-fade-in">
                    <span class="label text-red-400">✗</span> ${e.url} - ${e.error}
                </div>
            `).join('')}
        `;
        
        closeCsvModal();
    } catch (error) {
        document.getElementById('responseStatus').innerHTML = `<span class="status-error text-sm">Error: ${error.message}</span>`;
        document.getElementById('responseConsole').innerHTML = `
            <div class="animate-fade-in text-red-400">Error: ${error.message}</div>
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

// ============================================
// Smooth Transitions Setup
// ============================================
function setupSmoothTransitions() {
    // Add smooth transition to all resizeable elements
    const resizeableElements = [
        document.getElementById('editorContainer'),
        document.getElementById('responsePanel'),
        document.getElementById('consolePanel')
    ];
    
    resizeableElements.forEach(el => {
        if (el) {
            el.style.transition = 'height 0.15s ease-out';
        }
    });
}

// ============================================
// Resize Handles Setup
// ============================================
function setupResizeHandles() {
    // Resize handle between editor and response list
    const editorResizeHandle = document.getElementById('editorResizeHandle');
    const editorContainer = document.getElementById('editorContainer');
    const responseListView = document.getElementById('responseListView');
    
    if (editorResizeHandle && editorContainer && responseListView) {
        editorResizeHandle.addEventListener('mousedown', (e) => {
            resizeState.active = 'editor';
            resizeState.handleType = 'editor';
            resizeState.container = editorContainer;
            resizeState.isDragging = true;
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
            e.stopPropagation();
            
            resizeState.startY = e.clientY;
            resizeState.startHeight = editorContainer.offsetHeight;
        });
    }
    
    // Resize handle for Response Panel (between response and console)
    const responsePanelResizeHandle = document.getElementById('responsePanelResizeHandle');
    const responsePanel = document.getElementById('responsePanel');
    const consolePanel = document.getElementById('consolePanel');
    
    if (responsePanelResizeHandle && responsePanel && consolePanel) {
        responsePanelResizeHandle.addEventListener('mousedown', (e) => {
            resizeState.active = 'responsePanel';
            resizeState.handleType = 'responsePanel';
            resizeState.container = responsePanel;
            resizeState.isDragging = true;
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
            e.stopPropagation();
            
            resizeState.startY = e.clientY;
            resizeState.startHeight = responsePanel.offsetHeight;
        });
    }
    
    // Resize handle for Console Panel (between console and editor)
    const consolePanelResizeHandle = document.getElementById('consolePanelResizeHandle');
    
    if (consolePanelResizeHandle && consolePanel) {
        consolePanelResizeHandle.addEventListener('mousedown', (e) => {
            resizeState.active = 'consolePanel';
            resizeState.handleType = 'consolePanel';
            resizeState.container = consolePanel;
            resizeState.isDragging = true;
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
            e.stopPropagation();
            
            resizeState.startY = e.clientY;
            resizeState.startHeight = consolePanel.offsetHeight;
        });
    }
    
    // Resize handle within response panel (between status and data)
    const responseResizeHandle = document.getElementById('responseResizeHandle');
    const responseStatus = document.getElementById('responseStatus');
    const responseData = document.getElementById('responseData');
    
    if (responseResizeHandle && responseStatus && responseData) {
        responseResizeHandle.addEventListener('mousedown', (e) => {
            resizeState.active = 'response';
            resizeState.handleType = 'response';
            resizeState.container = responseStatus;
            resizeState.isDragging = true;
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
            e.stopPropagation();
            
            resizeState.startY = e.clientY;
            resizeState.startHeight = responseStatus.offsetHeight;
        });
    }
    
    // Global mousemove handler
    document.addEventListener('mousemove', (e) => {
        if (!resizeState.active || !resizeState.isDragging) return;
        
        const deltaY = e.clientY - resizeState.startY;
        let newHeight = resizeState.startHeight + deltaY;
        
        // Apply minimum and maximum constraints based on handle type
        if (resizeState.handleType === 'editor') {
            const minHeight = 200;
            const maxHeight = window.innerHeight - 250;
            newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
            resizeState.container.style.height = `${newHeight}px`;
        } else if (resizeState.handleType === 'responsePanel') {
            const minHeight = 100;
            const consoleMinHeight = 100;
            const totalAvailable = window.innerHeight - 150;
            newHeight = Math.max(minHeight, Math.min(totalAvailable - consoleMinHeight, newHeight));
            resizeState.container.style.height = `${newHeight}px`;
            consolePanel.style.height = `${totalAvailable - newHeight}px`;
        } else if (resizeState.handleType === 'consolePanel') {
            const minHeight = 100;
            const responseMinHeight = 100;
            const totalAvailable = window.innerHeight - 150;
            newHeight = Math.max(minHeight, Math.min(totalAvailable - responseMinHeight, newHeight));
            consolePanel.style.height = `${newHeight}px`;
            resizeState.container.style.height = `${totalAvailable - newHeight}px`;
        } else if (resizeState.handleType === 'list') {
            const minHeight = 100;
            const consoleMinHeight = 100;
            const totalAvailable = window.innerHeight - 150;
            newHeight = Math.max(minHeight, Math.min(totalAvailable - consoleMinHeight, newHeight));
            resizeState.container.style.height = `${newHeight}px`;
            consolePanel.style.height = `${totalAvailable - newHeight}px`;
        } else if (resizeState.handleType === 'response') {
            const minHeight = 20;
            const maxHeight = 300;
            newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
            resizeState.container.style.height = `${newHeight}px`;
            responseData.style.height = `${300 - newHeight}px`;
        }
    });
    
    // Global mouseup handler
    document.addEventListener('mouseup', () => {
        if (resizeState.active) {
            resizeState.active = null;
            resizeState.handleType = null;
            resizeState.container = null;
            resizeState.isDragging = false;
            document.body.style.cursor = '';
        }
    });
}

// ============================================
// Collapse/Expand Setup
// ============================================
function setupCollapseExpand() {
    // Collapse/Expand Response Panel
    const collapseResponseBtn = document.getElementById('collapseResponseBtn');
    const expandResponseBtn = document.getElementById('expandResponseBtn');
    const responsePanel = document.getElementById('responsePanel');
    
    if (collapseResponseBtn && expandResponseBtn && responsePanel) {
        collapseResponseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            responsePanel.classList.add('collapsed');
            collapseResponseBtn.classList.add('hidden');
            expandResponseBtn.classList.remove('hidden');
        });
        
        expandResponseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            responsePanel.classList.remove('collapsed');
            collapseResponseBtn.classList.remove('hidden');
            expandResponseBtn.classList.add('hidden');
        });
    }
    
    // Collapse/Expand Console Panel
    const collapseConsoleBtn = document.getElementById('collapseConsoleBtn');
    const expandConsoleBtn = document.getElementById('expandConsoleBtn');
    const consolePanel = document.getElementById('consolePanel');
    
    if (collapseConsoleBtn && expandConsoleBtn && consolePanel) {
        collapseConsoleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            consolePanel.classList.add('collapsed');
            collapseConsoleBtn.classList.add('hidden');
            expandConsoleBtn.classList.remove('hidden');
        });
        
        expandConsoleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            consolePanel.classList.remove('collapsed');
            collapseConsoleBtn.classList.remove('hidden');
            expandConsoleBtn.classList.add('hidden');
        });
    }
}

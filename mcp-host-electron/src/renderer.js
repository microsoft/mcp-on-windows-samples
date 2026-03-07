// State management
let currentServers = [];
let currentTools = [];
let selectedServer = null;
let selectedTool = null;

// DOM Elements
const elements = {
    fetchServersBtn: document.getElementById('fetchServersBtn'),
    serverList: document.getElementById('serverList'),
    serverError: document.getElementById('serverError'),
    serverSection: document.getElementById('serverSection'),
    toolsSection: document.getElementById('toolsSection'),
    toolsList: document.getElementById('toolsList'),
    toolsError: document.getElementById('toolsError'),
    parametersSection: document.getElementById('parametersSection'),
    parametersForm: document.getElementById('parametersForm'),
    parametersContainer: document.getElementById('parametersContainer'),
    selectedToolName: document.getElementById('selectedToolName'),
    selectedToolDesc: document.getElementById('selectedToolDesc'),
    cancelToolBtn: document.getElementById('cancelToolBtn'),
    resultsSection: document.getElementById('resultsSection'),
    resultsContainer: document.getElementById('resultsContainer'),
    clearResultsBtn: document.getElementById('clearResultsBtn'),
    statusBar: document.getElementById('statusBar'),
    statusText: document.getElementById('statusText'),
    disconnectBtn: document.getElementById('disconnectBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText')
};

// Utility Functions
function showLoading(message = 'Loading...') {
    elements.loadingText.textContent = message;
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 5000);
}

function updateStatus(text, isConnected = false) {
    elements.statusText.textContent = text;
    elements.disconnectBtn.style.display = isConnected ? 'inline-block' : 'none';
}

// Server Management
async function fetchServers() {
    showLoading('Fetching servers...');
    elements.serverError.classList.remove('show');
    
    try {
        const response = await window.mcpAPI.fetchServers();
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        currentServers = response.servers;
        displayServers(response.servers);
        
    } catch (error) {
        showError(elements.serverError, `Failed to fetch servers: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function displayServers(servers) {
    elements.serverList.innerHTML = '';
    
    if (servers.length === 0) {
        elements.serverList.innerHTML = '<p style="color: #666; padding: 1rem;">No servers found.</p>';
        return;
    }
    
    servers.forEach((server, index) => {
        const serverItem = document.createElement('div');
        serverItem.className = 'server-item';
        serverItem.innerHTML = `
            <div class="server-name">${server.server?.name || '(no name)'}</div>
            <div class="server-id">ID: ${server.server?.packages?.[0]?.identifier || 'N/A'}</div>
        `;
        
        serverItem.addEventListener('click', () => selectServerItem(server, serverItem));
        elements.serverList.appendChild(serverItem);
    });
}

async function selectServerItem(server, element) {
    // Visual selection
    document.querySelectorAll('.server-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    selectedServer = server;
    
    // Provision agent user, then connect to server
    showLoading('Provisioning agent user (this may take some time)...');
    
    try {
        const provisionResponse = await window.mcpAPI.provisionAgentUser(server);
        
        if (!provisionResponse.success) {
            throw new Error(provisionResponse.error);
        }
        
        showLoading('Connecting to server...');
        const response = await window.mcpAPI.connectToServer(server);
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        updateStatus(`Connected to: ${response.serverName}`, true);
        
        // Fetch tools
        await fetchTools();
        
    } catch (error) {
        showError(elements.serverError, `Failed to connect: ${error.message}`);
        updateStatus('Connection failed', false);
    } finally {
        hideLoading();
    }
}

// Tools Management
async function fetchTools() {
    showLoading('Fetching tools...');
    elements.toolsError.classList.remove('show');
    
    try {
        const response = await window.mcpAPI.listTools();
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        currentTools = response.tools;
        displayTools(response.tools);
        elements.toolsSection.style.display = 'block';
        
    } catch (error) {
        showError(elements.toolsError, `Failed to fetch tools: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function displayTools(tools) {
    elements.toolsList.innerHTML = '';
    
    if (tools.length === 0) {
        elements.toolsList.innerHTML = '<p style="color: #666; padding: 1rem;">No tools available.</p>';
        return;
    }
    
    tools.forEach(tool => {
        const toolCard = document.createElement('div');
        toolCard.className = 'tool-card';
        
        const params = tool.inputSchema?.properties ? Object.keys(tool.inputSchema.properties) : [];
        const paramsText = params.length > 0 ? `Parameters: ${params.join(', ')}` : 'No parameters';
        
        toolCard.innerHTML = `
            <div class="tool-name">${tool.name}</div>
            ${tool.description ? `<div class="tool-description">${tool.description}</div>` : ''}
            <div class="tool-params">${paramsText}</div>
        `;
        
        toolCard.addEventListener('click', () => selectTool(tool));
        elements.toolsList.appendChild(toolCard);
    });
}

function selectTool(tool) {
    selectedTool = tool;
    
    elements.selectedToolName.textContent = tool.name;
    elements.selectedToolDesc.textContent = tool.description || 'No description available';
    
    // Build parameter form
    buildParameterForm(tool.inputSchema);
    
    elements.parametersSection.style.display = 'block';
    elements.parametersSection.scrollIntoView({ behavior: 'smooth' });
}

function buildParameterForm(schema) {
    elements.parametersContainer.innerHTML = '';
    
    if (!schema || !schema.properties) {
        elements.parametersContainer.innerHTML = '<p style="color: #666;">This tool requires no parameters.</p>';
        return;
    }
    
    const properties = schema.properties;
    const required = schema.required || [];
    
    for (const [paramName, paramSchema] of Object.entries(properties)) {
        const isRequired = required.includes(paramName);
        const paramGroup = document.createElement('div');
        paramGroup.className = 'param-group';
        
        const typeInfo = paramSchema.type || 'string';
        const description = paramSchema.description || '';
        
        let inputHTML = '';
        
        if (typeInfo === 'boolean') {
            inputHTML = `
                <select name="${paramName}" ${isRequired ? 'required' : ''}>
                    <option value="">Select...</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            `;
        } else if (typeInfo === 'object' || typeInfo === 'array') {
            inputHTML = `
                <textarea name="${paramName}" placeholder="Enter JSON" ${isRequired ? 'required' : ''}></textarea>
            `;
        } else if (typeInfo === 'number' || typeInfo === 'integer') {
            inputHTML = `
                <input type="number" name="${paramName}" ${isRequired ? 'required' : ''} />
            `;
        } else {
            inputHTML = `
                <input type="text" name="${paramName}" ${isRequired ? 'required' : ''} />
            `;
        }
        
        paramGroup.innerHTML = `
            <label>
                ${paramName}
                ${isRequired ? '<span class="param-label-required">*</span>' : ''}
            </label>
            <div class="param-meta">Type: ${typeInfo}${description ? ` - ${description}` : ''}</div>
            ${inputHTML}
        `;
        
        elements.parametersContainer.appendChild(paramGroup);
    }
}

// Tool Calling
elements.parametersForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedTool) return;
    
    const formData = new FormData(e.target);
    const parameters = {};
    
    // Build parameters object
    for (const [key, value] of formData.entries()) {
        if (value === '') continue; // Skip empty optional fields
        
        const paramSchema = selectedTool.inputSchema?.properties?.[key];
        const type = paramSchema?.type || 'string';
        
        try {
            if (type === 'object' || type === 'array') {
                parameters[key] = JSON.parse(value);
            } else if (type === 'number' || type === 'integer') {
                parameters[key] = Number(value);
            } else if (type === 'boolean') {
                parameters[key] = value === 'true';
            } else {
                parameters[key] = value;
            }
        } catch (error) {
            alert(`Invalid JSON for parameter "${key}"`);
            return;
        }
    }
    
    await callTool(selectedTool.name, parameters);
});

async function callTool(toolName, parameters) {
    showLoading('Calling tool...');
    
    try {
        const response = await window.mcpAPI.callTool(toolName, parameters);
        
        if (!response.success) {
            throw new Error(response.error);
        }
        
        displayResult(toolName, parameters, response.result);
        
        // Show results section and scroll to it
        elements.resultsSection.style.display = 'block';
        elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        alert(`Failed to call tool: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function displayResult(toolName, parameters, result) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    const timestamp = new Date().toLocaleTimeString();
    
    let contentHTML = '';
    
    if (result.content && Array.isArray(result.content)) {
        result.content.forEach(item => {
            if (item.type === 'text') {
                contentHTML += `<div class="result-text">${escapeHtml(item.text)}</div>`;
            } else if (item.type === 'image') {
                contentHTML += `<div class="result-meta">[Image: ${item.mimeType || 'unknown'}]</div>`;
            } else if (item.type === 'resource') {
                contentHTML += `<div class="result-meta">[Resource: ${item.resource?.uri || 'unknown'}]</div>`;
            } else {
                contentHTML += `<pre>${JSON.stringify(item, null, 2)}</pre>`;
            }
        });
    } else {
        contentHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
    }
    
    resultItem.innerHTML = `
        <strong>Tool:</strong> ${toolName} <span style="color: #999; font-size: 0.85rem;">(${timestamp})</span>
        <div style="margin-top: 0.5rem;">${contentHTML}</div>
    `;
    
    elements.resultsContainer.insertBefore(resultItem, elements.resultsContainer.firstChild);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
elements.fetchServersBtn.addEventListener('click', fetchServers);

elements.cancelToolBtn.addEventListener('click', () => {
    elements.parametersSection.style.display = 'none';
    selectedTool = null;
});

elements.clearResultsBtn.addEventListener('click', () => {
    elements.resultsContainer.innerHTML = '';
});

elements.disconnectBtn.addEventListener('click', async () => {
    showLoading('Disconnecting...');
    
    try {
        await window.mcpAPI.disconnect();
        
        // Reset UI
        updateStatus('Disconnected', false);
        elements.toolsSection.style.display = 'none';
        elements.parametersSection.style.display = 'none';
        selectedServer = null;
        selectedTool = null;
        currentTools = [];
        
        // Clear selections
        document.querySelectorAll('.server-item').forEach(el => el.classList.remove('selected'));
        
    } catch (error) {
        alert(`Failed to disconnect: ${error.message}`);
    } finally {
        hideLoading();
    }
});

// Initialize
console.log('MCP Electron Client initialized');

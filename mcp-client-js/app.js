const { execFile } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const execFileAsync = promisify(execFile);

// Readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Promisified readline question
 */
function askQuestion(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

/**
 * Fetch list of MCP servers from odr.exe
 */
async function fetchServerList() {
    console.log('Running odr.exe list...\n');
    
    const { stdout, stderr } = await execFileAsync('odr.exe', ['list']);
    
    if (stderr) {
        console.error('Warning:', stderr);
    }
    
    const servers = JSON.parse(stdout);
    
    if (!Array.isArray(servers.structuredContent?.servers)) {
        throw new Error(`Expected an array of servers, but got: ${typeof servers}`);
    }
    
    return servers.structuredContent.servers;
}

/**
 * Display servers and prompt user to select one
 */
async function selectServer(servers) {
    if (servers.length === 0) {
        console.log('No MCP servers found.');
        return null;
    }
    
    console.log(`Found ${servers.length} MCP server(s):\n`);
    
    servers.forEach((server, index) => {
        const name = server.server?.name || '(no name)';
        console.log(`${index + 1}. Name: ${name}`);
    });
    console.log('Q. Quit');
    
    console.log('');
    
    const answer = await askQuestion('Which server would you like to run? (Enter number or Q to quit): ');
    
    if (answer.trim().toLowerCase() === 'q') {
        console.log('Exiting...');
        return null;
    }
    
    const choice = parseInt(answer, 10);
    
    if (isNaN(choice) || choice < 1 || choice > servers.length) {
        throw new Error('Invalid selection.');
    }
    
    return servers[choice - 1];
}

/**
 * Provision the agent user via odr.exe before connecting to an MCP server
 */
async function provisionAgentUser(server) {
    const identifier = server.server.packages?.[0]?.identifier;
    if (!identifier) {
        throw new Error('Server configuration missing identifier.');
    }

    console.log(`Provisioning agent user for ${identifier}...\n(This may take some time)\n`);

    const { stdout, stderr } = await execFileAsync('odr.exe', [
        'mcp',
        'provision-agent-user'
    ]);

    if (stderr) {
        console.error('Warning:', stderr);
    }

    console.log('Agent user provisioned successfully.\n');
    return stdout;
}

/**
 * Connect to MCP server and list available tools
 */
async function connectAndListTools(server) {
    const identifier = server.server?.packages?.[0]?.identifier;
    const command = "odr.exe";
    const args = ["mcp", "run", "--proxy", identifier];

    console.log();
    if (!identifier) {
        throw new Error('Server configuration missing identifier.');
    }
    
    console.log(`Running server: ${command} ${args.join(' ')}\n`);
    
    // Create MCP client with stdio transport
    // Set stderr to 'ignore' to silence server info logs
    const transport = new StdioClientTransport({
        command: command,
        args: args,
        stderr: 'ignore'
    });
    
    const client = new Client({
        name: 'mcp-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    });
    
    try {
        // Connect to the server
        await client.connect(transport);
        
        // List available tools
        const toolsResponse = await client.listTools();
        const tools = toolsResponse.tools || [];
        
        displayTools(tools);
        
        // Prompt user to call a tool
        const selectedTool = await selectTool(tools);
        
        if (selectedTool) {
            await callTool(client, selectedTool);
        }
        
    } finally {
        // Clean up
        try {
            await client.close();
        } catch (err) {
            // Ignore close errors
        }
        
        // Force process exit after a brief delay to ensure cleanup
        setTimeout(() => {
            process.exit(0);
        }, 100);
    }
}

/**
 * Display tools in a formatted list
 */
function displayTools(tools) {
    console.log(`Available Tools (${tools.length}):\n`);
    
    if (tools.length === 0) {
        console.log('No tools available.');
        return;
    }
    
    tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}`);
        if (tool.description) {
            console.log(`   Description: ${tool.description}`);
        }
        if (tool.inputSchema) {
            console.log(`   Parameters: ${Object.keys(tool.inputSchema.properties || {}).join(', ') || 'none'}`);
        }
        console.log('');
    });
}

/**
 * Prompt user to select a tool to call
 */
async function selectTool(tools) {
    if (tools.length === 0) {
        return null;
    }
    
    const answer = await askQuestion('Which tool would you like to call? (Enter number or 0 to skip): ');
    const choice = parseInt(answer, 10);
    
    if (choice === 0) {
        console.log('Skipping tool call.');
        return null;
    }
    
    if (isNaN(choice) || choice < 1 || choice > tools.length) {
        throw new Error('Invalid selection.');
    }
    
    return tools[choice - 1];
}

/**
 * Gather parameters for a tool based on its input schema
 */
async function gatherToolParameters(tool) {
    const schema = tool.inputSchema;
    const parameters = {};
    
    if (!schema || !schema.properties) {
        return parameters;
    }
    
    console.log(`\nTool: ${tool.name}`);
    console.log('Please provide parameters:\n');
    
    for (const [paramName, paramSchema] of Object.entries(schema.properties)) {
        const isRequired = schema.required?.includes(paramName);
        const typeInfo = paramSchema.type || 'any';
        const description = paramSchema.description || '';
        
        const prompt = `${paramName} (${typeInfo})${isRequired ? ' [required]' : ' [optional]'}${description ? ` - ${description}` : ''}\nValue: `;
        const value = await askQuestion(prompt);
        
        if (value.trim() === '' && !isRequired) {
            continue; // Skip optional empty parameters
        }
        
        if (value.trim() === '' && isRequired) {
            throw new Error(`Required parameter '${paramName}' cannot be empty.`);
        }
        
        // Try to parse JSON values for objects/arrays
        if (typeInfo === 'object' || typeInfo === 'array') {
            try {
                parameters[paramName] = JSON.parse(value);
            } catch (e) {
                parameters[paramName] = value;
            }
        } else if (typeInfo === 'number' || typeInfo === 'integer') {
            parameters[paramName] = Number(value);
        } else if (typeInfo === 'boolean') {
            parameters[paramName] = value.toLowerCase() === 'true' || value === '1';
        } else {
            parameters[paramName] = value;
        }
    }
    
    return parameters;
}

/**
 * Call a tool with gathered parameters
 */
async function callTool(client, tool) {
    console.log(`\n--- Calling Tool: ${tool.name} ---\n`);
    
    const parameters = await gatherToolParameters(tool);
    
    console.log('\nCalling tool with parameters:');
    console.log(JSON.stringify(parameters, null, 2));
    console.log('');
    
    try {
        const result = await client.callTool({
            name: tool.name,
            arguments: parameters
        });
        
        console.log('\n--- Tool Result ---\n');
        
        if (result.content && Array.isArray(result.content)) {
            result.content.forEach((item, index) => {
                if (item.type === 'text') {
                    console.log(item.text);
                } else if (item.type === 'image') {
                    console.log(`[Image: ${item.mimeType || 'unknown'}]`);
                } else if (item.type === 'resource') {
                    console.log(`[Resource: ${item.resource?.uri || 'unknown'}]`);
                } else {
                    console.log(JSON.stringify(item, null, 2));
                }
                
                if (index < result.content.length - 1) {
                    console.log('');
                }
            });
        } else {
            console.log(JSON.stringify(result, null, 2));
        }
        
        console.log('\n--- End Result ---\n');
        
    } catch (error) {
        console.error('\nError calling tool:', error.message || error);
    }
}

/**
 * Main application entry point
 */
async function main() {
    try {
        // Step 1: Fetch server list
        const servers = await fetchServerList();
        
        // Step 2: Let user select a server
        const selectedServer = await selectServer(servers);
        
        if (!selectedServer) {
            rl.close();
            return;
        }
        
        // Step 3: Provision agent user for the selected server
        await provisionAgentUser(selectedServer);

        // Step 4: Connect to server and list tools
        await connectAndListTools(selectedServer);
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('Error: odr.exe not found. Make sure it is in your PATH or in the current directory.');
        } else if (error.message && error.message.includes('JSON')) {
            console.error('Error: Failed to parse JSON output from odr.exe');
        } else {
            console.error('Error:', error.message || error);
        }
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Run the application
main();

const { execFile } = require('child_process');
const { promisify } = require('util');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

const execFileAsync = promisify(execFile);

/**
 * MCP Service - Handles all MCP server operations
 */
class MCPService {
    constructor() {
        this.client = null;
        this.transport = null;
    }

    /**
     * Fetch list of MCP servers from odr.exe
     */
    async fetchServerList() {
        console.log('Running odr.exe list...');
        
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
     * Provision the agent user via odr.exe before connecting to an MCP server
     */
    async provisionAgentUser(server) {
        const identifier = server.server?.packages?.[0]?.identifier;
        if (!identifier) {
            throw new Error('Server configuration missing identifier.');
        }

        console.log(`Provisioning agent user for ${identifier}... (This may take some time)`);

        const { stdout, stderr } = await execFileAsync('odr.exe', [
            'mcp',
            'provision-agent-user'
        ]);

        if (stderr) {
            console.error('Warning:', stderr);
        }

        console.log('Agent user provisioned successfully.');
        return stdout;
    }

    /**
     * Connect to an MCP server
     */
    async connectToServer(server) {
        const identifier = server.server?.packages?.[0]?.identifier;
        const command = "odr.exe";
        const args = ["mcp", "run", "--proxy", identifier];

        if (!identifier) {
            throw new Error('Server configuration missing identifier.');
        }
        
        console.log(`Connecting to: ${server.server.name}`);
        console.log(`Running server: ${command} ${args.join(' ')}`);
        
        // Create MCP client with stdio transport
        // Set stderr to 'ignore' to silence server info logs
        this.transport = new StdioClientTransport({
            command: command,
            args: args,
            stderr: 'ignore'
        });
        
        this.client = new Client({
            name: 'mcp-electron-client',
            version: '2.0.0'
        }, {
            capabilities: {}
        });
        
        await this.client.connect(this.transport);
        
        return {
            success: true,
            serverName: server.server.name || identifier
        };
    }

    /**
     * List available tools from connected server
     */
    async listTools() {
        if (!this.client) {
            throw new Error('Not connected to any server. Call connectToServer first.');
        }
        
        const toolsResponse = await this.client.listTools();
        return toolsResponse.tools || [];
    }

    /**
     * Call a tool with given parameters
     */
    async callTool(toolName, parameters) {
        if (!this.client) {
            throw new Error('Not connected to any server. Call connectToServer first.');
        }
        
        console.log(`Calling tool: ${toolName}`);
        console.log('Parameters:', JSON.stringify(parameters, null, 2));
        
        const result = await this.client.callTool({
            name: toolName,
            arguments: parameters
        });
        
        return result;
    }

    /**
     * Disconnect from current server
     */
    async disconnect() {
        if (this.client) {
            try {
                await this.client.close();
            } catch (err) {
                console.error('Error closing client:', err);
            }
            this.client = null;
            this.transport = null;
        }
    }

    /**
     * Check if currently connected to a server
     */
    isConnected() {
        return this.client !== null;
    }
}

module.exports = { MCPService };

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;
using System.ComponentModel;
using System.Net.Sockets;
using System.Text;

var builder = Host.CreateApplicationBuilder(args);
builder.Logging.AddConsole(consoleLogOptions =>
{
    // Configure all logs to go to stderr
    consoleLogOptions.LogToStandardErrorThreshold = LogLevel.Trace;
});
builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();
await builder.Build().RunAsync();

[McpServerToolType]
public static class ConnectionTools
{
    [McpServerTool, Description("Connects to the main app running on port 8000 to verify it's running.")]
    public static string Connect()
    {
        try
        {
            using var client = new TcpClient();
            
            // Try to connect with a timeout
            var connectTask = client.ConnectAsync("127.0.0.1", 8000);
            if (!connectTask.Wait(TimeSpan.FromSeconds(5)))
            {
                return "Error: Connection timeout. The main app may not be running on port 8000.";
            }

            // Send a test message
            using var stream = client.GetStream();
            var message = Encoding.UTF8.GetBytes("MCP Server Test Connection");
            stream.Write(message, 0, message.Length);

            // Read response
            var buffer = new byte[1024];
            var bytesRead = stream.Read(buffer, 0, buffer.Length);
            var response = Encoding.UTF8.GetString(buffer, 0, bytesRead);

            return $"Successfully connected to main app on port 8000. Response: {response}";
        }
        catch (SocketException ex)
        {
            return $"Error: Could not connect to port 8000. Make sure the main app is running. Details: {ex.Message}";
        }
        catch (Exception ex)
        {
            return $"Error: {ex.Message}";
        }
    }
}

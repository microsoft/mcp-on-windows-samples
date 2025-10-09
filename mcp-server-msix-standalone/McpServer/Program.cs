using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;
using System.ComponentModel;
using SharedLibrary;

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
public static class ApiTools
{
    [McpServerTool, Description("Gets a random inspirational quote from an online API.")]
    public static async Task<string> GetRandomQuote()
    {
        return await ApiService.GetRandomQuoteAsync();
    }

    [McpServerTool, Description("Gets current weather information for a specified city.")]
    public static async Task<string> GetWeather(string city = "London")
    {
        return await ApiService.GetWeatherAsync(city);
    }

    [McpServerTool, Description("Gets a random interesting fact from an online API.")]
    public static async Task<string> GetRandomFact()
    {
        return await ApiService.GetRandomFactAsync();
    }
}

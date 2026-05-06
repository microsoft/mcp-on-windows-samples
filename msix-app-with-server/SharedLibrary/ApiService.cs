using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace SharedLibrary
{
    public class ApiService
    {
        private static readonly HttpClient _httpClient = new HttpClient();
        
        static ApiService()
        {
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "MCP-Server-App/1.0");
        }

        /// <summary>
        /// Fetches a random inspirational quote from an online API
        /// </summary>
        /// <returns>A formatted quote string or error message</returns>
        public static async Task<string> GetRandomQuoteAsync()
        {
            try
            {
                // Using quotable.io API - a free quotes API
                var response = await _httpClient.GetAsync("http://api.quotable.io/random?minLength=50&maxLength=200");
                
                if (!response.IsSuccessStatusCode)
                {
                    return $"API Error: {response.StatusCode} - {response.ReasonPhrase}";
                }

                var json = await response.Content.ReadAsStringAsync();
                
                // Extract content and author from the response
                var root = JsonDocument.Parse(json).RootElement;
                var content = root.GetProperty("content").GetString();
                var author = root.GetProperty("author").GetString();
                
                return $"\"{content}\"\n\n— {author}";
            }
            catch (HttpRequestException ex)
            {
                return $"Network Error: {ex.Message}";
            }
            catch (TaskCanceledException ex)
            {
                return $"Request Timeout: {ex.Message}";
            }
            catch (JsonException ex)
            {
                return $"JSON Parse Error: {ex.Message}";
            }
            catch (Exception ex)
            {
                return $"Unexpected Error: {ex.Message}";
            }
        }

        /// <summary>
        /// Gets weather information for a specified city (using a weather API)
        /// </summary>
        /// <param name="city">The city name</param>
        /// <returns>Weather information or error message</returns>
        public static async Task<string> GetWeatherAsync(string city = "London")
        {
            try
            {
                // Using wttr.in API - a simple weather API that returns plain text
                var response = await _httpClient.GetAsync($"https://wttr.in/{Uri.EscapeDataString(city)}?format=%C+%t+in+%l");
                
                if (!response.IsSuccessStatusCode)
                {
                    return $"Weather API Error: {response.StatusCode} - {response.ReasonPhrase}";
                }

                var weatherInfo = await response.Content.ReadAsStringAsync();
                return $"Weather in {city}: {weatherInfo.Trim()}";
            }
            catch (HttpRequestException ex)
            {
                return $"Network Error: {ex.Message}";
            }
            catch (TaskCanceledException ex)
            {
                return $"Request Timeout: {ex.Message}";
            }
            catch (Exception ex)
            {
                return $"Unexpected Error: {ex.Message}";
            }
        }

        /// <summary>
        /// Gets a random interesting fact
        /// </summary>
        /// <returns>A random fact or error message</returns>
        public static async Task<string> GetRandomFactAsync()
        {
            try
            {
                // Using uselessfacts.jsph.pl API - a free facts API
                var response = await _httpClient.GetAsync("https://uselessfacts.jsph.pl/api/v2/facts/random");
                
                if (!response.IsSuccessStatusCode)
                {
                    return $"Facts API Error: {response.StatusCode} - {response.ReasonPhrase}";
                }

                var json = await response.Content.ReadAsStringAsync();
                var root = JsonDocument.Parse(json).RootElement;
                var factText = root.GetProperty("text").GetString();
                
                return $"Random Fact: {factText}";
            }
            catch (HttpRequestException ex)
            {
                return $"Network Error: {ex.Message}";
            }
            catch (TaskCanceledException ex)
            {
                return $"Request Timeout: {ex.Message}";
            }
            catch (JsonException ex)
            {
                return $"JSON Parse Error: {ex.Message}";
            }
            catch (Exception ex)
            {
                return $"Unexpected Error: {ex.Message}";
            }
        }
    }
}
using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using SharedLibrary;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace mcp_server_msix
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            LogMessage("API Demo Application started. Click buttons to fetch data from online APIs.");
        }

        private async void QuoteButton_Click(object sender, RoutedEventArgs e)
        {
            QuoteButton.IsEnabled = false;
            LogMessage("Fetching random quote...");
            
            try
            {
                var quote = await ApiService.GetRandomQuoteAsync();
                LogMessage($"Quote received:\n{quote}");
            }
            catch (Exception ex)
            {
                LogMessage($"Error getting quote: {ex.Message}");
            }
            finally
            {
                QuoteButton.IsEnabled = true;
            }
        }

        private async void WeatherButton_Click(object sender, RoutedEventArgs e)
        {
            WeatherButton.IsEnabled = false;
            LogMessage("Fetching weather information...");
            
            try
            {
                var weather = await ApiService.GetWeatherAsync("London");
                LogMessage($"Weather info: {weather}");
            }
            catch (Exception ex)
            {
                LogMessage($"Error getting weather: {ex.Message}");
            }
            finally
            {
                WeatherButton.IsEnabled = true;
            }
        }

        private async void FactButton_Click(object sender, RoutedEventArgs e)
        {
            FactButton.IsEnabled = false;
            LogMessage("Fetching random fact...");
            
            try
            {
                var fact = await ApiService.GetRandomFactAsync();
                LogMessage(fact);
            }
            catch (Exception ex)
            {
                LogMessage($"Error getting fact: {ex.Message}");
            }
            finally
            {
                FactButton.IsEnabled = true;
            }
        }

        private void LogMessage(string message)
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                var timestamp = DateTime.Now.ToString("HH:mm:ss.fff");
                var logEntry = $"[{timestamp}] {message}";
                Console.WriteLine(logEntry);
                LogTextBox.Text += logEntry + Environment.NewLine;
                LogScrollViewer.ChangeView(null, LogScrollViewer.ScrollableHeight, null);
            });
        }
    }
}

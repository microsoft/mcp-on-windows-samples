using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Controls.Primitives;
using Microsoft.UI.Xaml.Data;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Navigation;
using Windows.Foundation;
using Windows.Foundation.Collections;

// To learn more about WinUI, the WinUI project structure,
// and more about our project templates, see: http://aka.ms/winui-project-info.

namespace mcp_server_msix
{
    /// <summary>
    /// An empty window that can be used on its own or navigated to within a Frame.
    /// </summary>
    public sealed partial class MainWindow : Window
    {
        private TcpListener? _listener;
        private CancellationTokenSource? _cts;
        private Task? _listenerTask;

        public MainWindow()
        {
            InitializeComponent();
            this.Closed += MainWindow_Closed;
            StartServerAsync();
        }

        private async void StartServerAsync()
        {
            try
            {
                _cts = new CancellationTokenSource();
                _listener = new TcpListener(IPAddress.Any, 8000);
                _listener.Start();
                
                LogMessage("Server started on port 8000. Press any key to exit...");

                _listenerTask = Task.Run(async () =>
                {
                    while (!_cts.Token.IsCancellationRequested)
                    {
                        try
                        {
                            var client = await _listener.AcceptTcpClientAsync(_cts.Token);
                            _ = Task.Run(async () => await HandleClientAsync(client, _cts.Token));
                        }
                        catch (OperationCanceledException)
                        {
                            break;
                        }
                        catch (Exception ex)
                        {
                            if (!_cts.Token.IsCancellationRequested)
                            {
                                LogMessage($"Error accepting client: {ex.Message}");
                            }
                        }
                    }
                }, _cts.Token);
            }
            catch (Exception ex)
            {
                LogMessage($"Failed to start server: {ex.Message}");
            }
        }

        private async Task HandleClientAsync(TcpClient client, CancellationToken cancellationToken)
        {
            try
            {
                using (client)
                {
                    var endpoint = client.Client.RemoteEndPoint?.ToString() ?? "unknown";
                    LogMessage($"Client connected from: {endpoint}");

                    using var stream = client.GetStream();
                    var buffer = new byte[1024];
                    
                    while (!cancellationToken.IsCancellationRequested && client.Connected)
                    {
                        var bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length, cancellationToken);
                        if (bytesRead == 0) break;

                        var message = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                        LogMessage($"Received from {endpoint}: {message}");
                        
                        // Send a response
                        var response = Encoding.UTF8.GetBytes($"Server received: {message}");
                        await stream.WriteAsync(response, 0, response.Length, cancellationToken);
                    }
                    
                    LogMessage($"Client disconnected: {endpoint}");
                }
            }
            catch (Exception ex)
            {
                if (!cancellationToken.IsCancellationRequested)
                {
                    LogMessage($"Error handling client: {ex.Message}");
                }
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

        private void MainWindow_Closed(object sender, WindowEventArgs args)
        {
            StopServer();
        }

        private void StopServer()
        {
            _cts?.Cancel();
            _listener?.Stop();
            _listenerTask?.Wait(1000);
            _cts?.Dispose();
        }
    }
}

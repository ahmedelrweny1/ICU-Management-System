using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Shefaa_ICU.Services
{
    public interface IEmailSender
    {
        Task<bool> SendAsync(string toEmail, string subject, string body);
    }

    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmtpEmailSender> _logger;

        public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendAsync(string toEmail, string subject, string body)
        {
            var host = _configuration["Smtp:Host"];
            var port = _configuration.GetValue<int?>("Smtp:Port") ?? 587;
            var user = _configuration["Smtp:User"];
            var pass = _configuration["Smtp:Password"];
            var from = _configuration["Smtp:From"] ?? user;

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(user) || string.IsNullOrWhiteSpace(pass) || string.IsNullOrWhiteSpace(from))
            {
                _logger.LogWarning("SMTP settings are not fully configured. Email will not be sent.");
                return false;
            }

            try
            {
                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(user, pass)
                };

                using var message = new MailMessage(from, toEmail, subject, body)
                {
                    IsBodyHtml = false
                };

                await client.SendMailAsync(message);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                return false;
            }
        }
    }
}



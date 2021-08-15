using System;
using System.IO;
using System.Net.Mail;

namespace BystronicSalesService
{
    public class LogUtil
    {
        public static string BystronicServiceLogFileName = "BystronicDataService";

        public static int LOG_MAX_DAYS_BACK = 10;
        private const int MAX_LOG_SIZE = 1024 * 1024; // 1 Mbyte

        private static readonly object _lock = new object();

        public static void Trace(Exception e)
        {
            Trace("Exception: " + e.Message + "\n" + e.StackTrace);
        }

        public static void Trace(string message)
        {
            Trace(message, null);
        }
        public static void Trace(string message, string user)
        {
            try
            {
                DateTime time = DateTime.Now;
                var trace = String.Format("{0:MM/dd/yy hh:mm:ss tt}", time) + " | " + message;
                if (user != null) trace += " received from " + user + ".";

                Console.WriteLine(trace);
                var logFile = $"{BystronicServiceLogFileName}.log";

                lock (_lock)
                {
                    StreamWriter logWriter = null;
                    if (File.Exists(logFile))
                    {
                        FileInfo info = new FileInfo(logFile);
                        if (info.Length > MAX_LOG_SIZE)
                        {
                            var creationDateString = string.Format("{0:yyyyMMdd}", info.LastAccessTime);
                            var oldLogFile = $"{BystronicServiceLogFileName}_{creationDateString}.log";
                            File.Move(logFile, oldLogFile);
                            logWriter = File.CreateText(logFile);
                        }
                        else
                            logWriter = File.AppendText(logFile);
                    }
                    else
                        logWriter = File.CreateText(logFile);

                    logWriter.WriteLine(trace);
                    logWriter.Flush();
                    logWriter.Close();
                }
            }
            catch { }
        }

        public static void NotifyAboutServiceIssue(string mailServer, string username, string password, string emailTo, Exception e)
        {
            SmtpClient client = new SmtpClient(mailServer);
            client.Credentials = new System.Net.NetworkCredential(username, password);

            emailTo = emailTo.Replace(";", ",");
            if (emailTo.StartsWith(",")) emailTo = emailTo.Remove(0);
            if (emailTo.EndsWith(",")) emailTo = emailTo.Remove(emailTo.Length - 1);

            MailMessage email = new MailMessage("Bystronic", emailTo);

            email.Body = String.Format("{0:MM/dd/yy hh:mm:ss tt}", DateTime.Now) + ": Bystronic Service Exception: " + e.Message + "\n" + e.StackTrace;

            email.IsBodyHtml = false;
            email.Subject = $"Bystronic Service Exeption: {e.Message}";
            email.Priority = MailPriority.High;
            client.Send(email);
        }
    }
}

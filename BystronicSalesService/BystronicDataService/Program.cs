using System;
using System.ComponentModel;
using System.Configuration.Install;
using System.ServiceProcess;

namespace BystronicSalesService
{
    static class Program
    {
        static void Main(string[] args)
        {
            if (args.Length == 1 && args[0].ToLower() == "/console")
            {
                //Console.WriteLine("Starting...");
                var service = new BystronicDataService();
                service.StartImpl();
                Console.WriteLine("Bystronic Sales Service. Copyright (c) Bystronic, Inc.\n");

                //Console.WriteLine("Press Enter to close.");
                Console.ReadLine();
                service.StopImpl();
            }
            else
            {
                ServiceBase.Run(new BystronicDataService());
            }
        }
    }

    [RunInstaller(true)]
    public class MyProjectInstaller : Installer
    {
        private ServiceInstaller serviceInstaller;
        private ServiceProcessInstaller processInstaller;

        public MyProjectInstaller()
        {
            processInstaller = new ServiceProcessInstaller();
            serviceInstaller = new ServiceInstaller();

            processInstaller.Account = ServiceAccount.LocalSystem;

            serviceInstaller.StartType = ServiceStartMode.Automatic;

            // ServiceName must equal those on ServiceBase derived classes.
            serviceInstaller.ServiceName = "Bystronic Data Service";
            serviceInstaller.Description = "Provides Bystronic Sale Data";

            // Add installers to collection. Order is not important.
            Installers.Add(serviceInstaller);
            Installers.Add(processInstaller);
        }
    }
}
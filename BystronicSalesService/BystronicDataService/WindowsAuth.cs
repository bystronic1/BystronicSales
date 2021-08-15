using System.Collections.Generic;
using System.Linq;
using System.DirectoryServices.AccountManagement;

namespace BystronicSalesService
{
    public class WindowsAuth
    {
        PrincipalContext AD = new PrincipalContext(ContextType.Domain);
        
        public bool IsAuthenicated(string username, string password)
        {
            return AD.ValidateCredentials(username, password);
            
        }

        public List<string> GetUserGroups(string username)
        {
            UserPrincipal u = UserPrincipal.FindByIdentity(AD, username);
            //var groups = from gps in u.GetAuthorizationGroups().AsQueryable() select gps.Name;

            var groups = u.GetAuthorizationGroups().Select(g => g.Name);

            return groups.ToList();
        }

        public User GetUser(string username, string country)
        {
            if (country == Config.Country_CA)
                return GetUserCanada(username);
            return GetUser(username);
        }

        public User GetUser(string username)
        {
            var role = "";
            var userGroups = GetUserGroups(username);
            if (userGroups.Contains("Editors") || userGroups.Contains("Modifiers") || userGroups.Contains("Approvers") || userGroups.Contains("Payers"))
                role = User.ROLE_ADMINISTRATOR;
            else if (userGroups.Contains("PM"))
                role = User.ROLE_PRODUCT_MANAGER;
            else if (userGroups.Contains("RSM"))
                role = User.ROLE_REGIONAL_MANAGER;
            else if (userGroups.Contains("RSMDSE"))
                role = User.ROLE_REGIONAL_MANAGER_DSE;
            else if (userGroups.Contains("Dealers"))
                role = User.ROLE_REGIONAL_MANAGER;
            else if (userGroups.Contains("DSE"))
                role = User.ROLE_DSE;
            else
                return null;
            UserPrincipal u = UserPrincipal.FindByIdentity(AD, username);
            return new User(username, u.Name, role, "");
        }

        public User GetUserCanada(string username)
        {
            var role = "";
            var userGroups = GetUserGroups(username);
            if (userGroups.Contains("EditorsCAN") || userGroups.Contains("ModifiersCAN") || userGroups.Contains("ApproversCAN") || userGroups.Contains("PayersCAN"))
                role = User.ROLE_ADMINISTRATOR;
            else if (userGroups.Contains("PM"))
                role = User.ROLE_PRODUCT_MANAGER;
            else if (userGroups.Contains("RSM"))
                role = User.ROLE_REGIONAL_MANAGER;
            else if (userGroups.Contains("RSMDSE"))
                role = User.ROLE_REGIONAL_MANAGER_DSE;
            else if (userGroups.Contains("Dealers"))
                role = User.ROLE_REGIONAL_MANAGER;
            else if (userGroups.Contains("DSE"))
                role = User.ROLE_DSE;
            else
                return null;
            UserPrincipal u = UserPrincipal.FindByIdentity(AD, username);
            return new User(username, u.Name, role, "");
        }
    }
}

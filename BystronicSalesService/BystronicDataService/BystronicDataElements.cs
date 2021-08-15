using System;
using System.Collections.Generic;
using System.Threading;

namespace BystronicSalesService
{
    public class BystronicData
    {
        private static object _bystronicDataLock = new object();
        private static BystronicData _bystronicData;
        private static BystronicData _tmpBystronicData;

        public static BystronicData GetData(DataSource dataSource)
        {
            lock(_bystronicDataLock)
            {
                if(_bystronicData == null) 
                    _bystronicData = new BystronicData(dataSource);
                return _bystronicData;
            }
        }

        public static void UpdateData(DataSource dataSource)
        {
            //if (_tmpBystronicData == null)
                _tmpBystronicData = new BystronicData(dataSource);
           // else
            //    _tmpBystronicData.ReadData(dataSource);
            lock (_bystronicDataLock)
            {
                _bystronicData = _tmpBystronicData;
                //LogUtil.Trace("* Bystronic data reloaded");
            }
        }

        public List<Customer> customers;
        public List<Product> products;
        public List<ProductCategory> productCategories;
        public List<Region> regions;
        public List<RegionalManager> regionalManagers;
        public List<Payment> payments;
        public List<Order> orders;
        public List<View> views;

        public string serializedData;

        private DataSource _dataSource;

        public BystronicData(DataSource dataSource)
        {
            _dataSource = dataSource;
            ReadData(dataSource);
        }

        public void ReadData(DataSource dataSource)
        {
            try
            {
                ReadInfo(dataSource);
                ReadOrders(dataSource);

                serializedData = serializeResponse(null);
            }
            catch(Exception e)
            {
                LogUtil.Trace($"Service could not load the database.\n{e.StackTrace}" );
            }
        }

        public void ReadInfo(DataSource dataSource)
        {
            customers = dataSource.GetCustomers();
            products = dataSource.GetProducts();
            productCategories = dataSource.GetProductCategories();
            regions = dataSource.GetRegions();
            regionalManagers = dataSource.GetRegionalManagers();
            payments = dataSource.GetPayments();
        }

        public void ReadOrders(DataSource dataSource)
        {
            orders = dataSource.GetOrders();
        }

        public void AddOrder(Order order)
        {
            lock (_bystronicDataLock)
            {
                orders.Add(order);
            }
            new Thread(() => serializedData = serializeResponse(null)).Start();
        }

        public void UpdateOrder(Order order, int index)
        {
            lock (_bystronicDataLock)
            {
                orders[index] = order;
            }
            new Thread(() => serializedData = serializeResponse(null)).Start();
        }

        public void DeleteOrder(int orderId, out string equipmentNumber)
        {
            lock (_bystronicDataLock)
            {
                var order = orders.Find(o => o.Id == orderId);
                equipmentNumber = order.EquipmentNumber;
                orders.Remove(order);
            }
            new Thread(() => serializedData = serializeResponse(null)).Start();
        }


        public void UpdateInfo()
        {
            lock (_bystronicDataLock)
            {
                ReadInfo(BystronicDataService.DataSource);
            }
            new Thread(() => serializedData = serializeResponse(null)).Start();
        }

        public Dictionary<string,object> ToDictionary(User user)
        {
            if (user != null)
            {
                orders = _dataSource.GetOrdersFor(orders, user);
            }
            return new Dictionary<string, object> { 
                { "Customers", customers }, { "Products", products }, { "ProductCategories", productCategories }, 
                { "Regions", regions }, { "RegionalManagers", regionalManagers }, { "Payments", payments }, { "Orders", orders } };
        }

        public string serializeResponse(User user)
        {
            lock (_bystronicDataLock)
            {
                var responseString = BystronicDataService.serialize(new ResponseMessage { Status = true, Query = "getdata", Data = ToDictionary(user) });
                return responseString;
            }
        }

        public ResponseMessage serializeResponseMessage(User user)
        {
            return new ResponseMessage { Status = true, Query = "getdata", Data = ToDictionary(user) };
        }
    }

    public class User
    {
        public const string ROLE_DEALER = "Dealer";
        public const string ROLE_DSE = "DSE";
        public const string ROLE_REGIONAL_MANAGER = "RSM";
        public const string ROLE_REGIONAL_MANAGER_DSE = "RSMDSE";
        public const string ROLE_PRODUCT_MANAGER = "PM";
        public const string ROLE_APPROVER = "Approver";
        public const string ROLE_ADMINISTRATOR = "Administrator";

        public const int StartYear = 2018;

        public string ID { get; private set; }
        public string Name { get; private set; }
        public string Role { get; private set; }
        public string Region { get; private set; }
        public string CostCenter { get; private set; }
        public double YtdSale { get; private set; }

        public List<double> Sales { get; private set; } = new List<double>();

        public User(string id, string name, string role, string region, string costCenter = "", double ytdSale = 0.0, string salesGoalsString = null)
        {
            ID = id;
            Name = name;
            Role = role;
            Region = region;
            CostCenter = costCenter;
            YtdSale = ytdSale;
        }

        public User(Dictionary<string, object> data)
        {
            ID = data["ID"] as string;
            Name = data["Name"] as string;
            Role = data["Role"] as string;
            Region = data["Region"] as string;
            if (data.ContainsKey("CostCenter"))
                CostCenter = data["CostCenter"] as string;
            if (data.ContainsKey("YtdSale"))
                YtdSale = Convert.ToDouble(data["YtdSale"]);
        }
    }

    public class View
    {
        public string Name { get; private set; }
        public string Columns { get; private set; }

        public View (string name, string columns)
        {
            Name = name;
            Columns = columns;
        }
    }

    public class Permissions
    {
        public bool CanCreateOrder { get; private set; }
        public bool CanEditOrder { get; private set; }
        public bool CanApproveOrder { get; private set; }
        public bool CanReleaseOrder { get; private set; }
        public bool CanPayOrder { get; private set; }
        public string UserGroupString { get { return string.Join(",", _userGroups);  }  }

        private List<string> _userGroups;

        public Permissions() : this (new List<string>())
        {
        }

        public Permissions(List<string> userGroups) : this(userGroups, Config.Country_US)
        {
        }

        public Permissions(List<string> userGroups, string country)
        {
            _userGroups = userGroups;
            if (country == Config.Country_CA)
                CheckPermissionsCanada();
            else
                CheckPermissions();
        }

        private void CheckPermissions()
        {
            CanCreateOrder = _userGroups.Contains("Editors");
            CanEditOrder = _userGroups.Contains("Modifiers");
            CanApproveOrder = _userGroups.Contains("Approvers");
            CanReleaseOrder = _userGroups.Contains("Releasers");
            CanPayOrder = _userGroups.Contains("Payers");
        }

        private void CheckPermissionsCanada()
        {
            CanCreateOrder = _userGroups.Contains("EditorsCAN");
            CanEditOrder = _userGroups.Contains("ModifiersCAN");
            CanApproveOrder = _userGroups.Contains("ApproversCAN");
            CanReleaseOrder = _userGroups.Contains("ReleasersCAN");
            CanPayOrder = _userGroups.Contains("PayersCAN");
        }
    }

    public class Customer
    {
        public readonly int Id;
        public readonly int? RegionalManagerId;
        public readonly string Name;
        public readonly string SapNumber;
        public readonly string City;
        public readonly string State;
        public readonly string Status;
        public readonly DateTime? DateJoined;

        public Customer(int id, int? regionalManagerId, string name, string sapNumber, string city, string state, DateTime? dateJoined, string status)
        {
            Id = id;
            RegionalManagerId = regionalManagerId;
            Name = name;
            SapNumber = sapNumber;
            City = city;
            State = state;
            DateJoined = dateJoined;
            Status = status;
        }

        public Customer (Dictionary<string, object> data)
        {
            if (data.ContainsKey("Id"))
                Id = int.Parse(data["Id"].ToString());
            RegionalManagerId = (int)data["RegionalManagerId"];
            Name = data["Name"] as string;
            SapNumber = data["SapNumber"] as string;
            City = data["City"] as string;
            State = data["State"] as string;
            var dateJoinedString = data["DateJoined"] as string;
            DateTime dateJoined;
            if (dateJoinedString != null)
            {
                DateTime.TryParse(dateJoinedString, out dateJoined);
                DateJoined = dateJoined;
            }
            Status = data["Status"] as string;
        }
    }

    public class Product
    {
        public readonly int Id;
        public readonly int? CategoryId;
        public readonly string Name;
        public readonly string Status;

        public Product(int id, int? categoryId, string name, string status)
        {
            Id = id;
            CategoryId = categoryId;
            Name = name;
            Status = status;
        }

        public Product(Dictionary<string, object> data)
        {
            if (data.ContainsKey("Id"))
                Id = int.Parse(data["Id"].ToString());
            CategoryId = int.Parse(data["CategoryId"].ToString());
            Name = data["Name"] as string;
            Status = data["Status"] as string;
        }
    }

    public class ProductCategory
    {
        public readonly int Id;
        public readonly int TypeId;
        public readonly string Name;
        public readonly string Status;

        public ProductCategory(int id, int typeId, string name, string status)
        {
            Id = id;
            TypeId = typeId;
            Name = name;
            Status = status;
        }

        public ProductCategory(Dictionary<string, object> data)
        {
            if (data.ContainsKey("Id"))
                Id = int.Parse(data["Id"].ToString());
            TypeId = int.Parse(data["TypeId"].ToString());
            Name = data["Name"] as string;
            Status = data["Status"] as string;
        }
    }

    public class Region
    {
        public readonly int Id;
        public readonly string Name;

        public Region(int id, string name)
        {
            Id = id;
            Name = name;
        }

        public Region(Dictionary<string, object> data)
        {
            if (data.ContainsKey("Id"))
                Id = int.Parse(data["Id"].ToString());
            Name = data["Name"] as string;
        }
    }

    public class RegionalManager
    {
        public readonly int Id;
        public readonly int? RegionId;
        public readonly string Name;

        public RegionalManager(int id, int? regionId, string name)
        {
            Id = id;
            RegionId = regionId;
            Name = name;
        }
        public RegionalManager(Dictionary<string, object> data)
        {
            if (data.ContainsKey("Id"))
                Id = int.Parse(data["Id"].ToString());
            Name = data["Name"] as string;
        }
    }

    public class Payment
    {
        public readonly int Id;
        public readonly int OrderId;
        public readonly DateTime? FirstInstallDate;
        public readonly decimal? FirstInstallAmount;
        public readonly DateTime? SecondInstallDate;
        public readonly decimal? SecondInstallAmount;
        public readonly DateTime? FinalInstallDate;
        public readonly decimal? FinalInstallAmount;
        public readonly string Term;
        public readonly string Note;

        public Payment(
            int id, int orderId, 
            DateTime? firstInstallDate, decimal? firstInstallAmount,
            DateTime? secondInstallDate, decimal? secondInstallAmount,
            DateTime? finalInstallDate, decimal? finalInstallAmount,
            string term, string note
        )
        {
            Id = id;
            OrderId = orderId;
            FirstInstallDate = firstInstallDate;
            FirstInstallAmount = firstInstallAmount;
            SecondInstallDate = secondInstallDate;
            SecondInstallAmount = secondInstallAmount;
            FinalInstallDate = finalInstallDate;
            FinalInstallAmount = finalInstallAmount;
            Term = term;
            Note = note;
        }

        public Payment(Dictionary<string, object> data)
        {
            DateTime date;

            if (data.ContainsKey("Id"))
                Id = int.Parse(data["Id"].ToString());
            OrderId = int.Parse(data["OrderId"].ToString());
            if (DateTime.TryParse(data["FirstInstallDate"] as string, out date)) FirstInstallDate = date;
            if (data["FirstInstallAmount"] != null)
                FirstInstallAmount = (decimal)data["FirstInstallAmount"];
            if (DateTime.TryParse(data["SecondInstallDate"] as string, out date)) SecondInstallDate = date;
            if (data["SecondInstallAmount"] != null)
                SecondInstallAmount = (decimal)data["SecondInstallAmount"];
            if (DateTime.TryParse(data["FinalInstallDate"] as string, out date)) FinalInstallDate = date;
            if (data["FinalInstallAmount"] != null)
                FinalInstallAmount = (decimal)data["FinalInstallAmount"];
            Term = data["Term"] as string;
            Note = data["Note"] as string;
        }
    }

    public class Training
    {
        public int Id { get; set; }
        public string CourseNumber { get; set; }
        public string CourseName { get; set; }
        public DateTime? CourseDate { get; set; }
        public int? SeatsPurchased { get; set; }
        public int? SeatsUsed { get; set; }
    }

    public class Order
    {
        public int Id { get; set; }
        public string EquipmentNumber { get; set; }
        public int CustomerId { get; set; }
        public int ProductId { get; set; }
        public string SapNumber { get; set; }
        public DateTime? DateAdded { get; set; }
        public string SaleOrderNumber { get; set; }
        public string ProductName { get; set; }
        public string Category { get; set; }
        public decimal? SaleAmount { get; set; }
        public string PONumber { get; set; }
        public string Port { get; set; }
        public string ForwarderNumber { get; set; }
        public string KNumber { get; set; }
        public DateTime? PortDate { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public DateTime? InstallDate { get; set; }
        public DateTime? MfgDate { get; set; }
        public string Shipped { get; set; }
        public DateTime? ShipDate { get; set; }
        public string ProductionWeek { get; set; }
        public string Comments { get; set; }
        public string Options { get; set; }

        public string Status { get; set; }

        public DateTime? FirstInstallDate { get; set; }
        public decimal? FirstInstallAmount { get; set; }
        public DateTime? SecondInstallDate { get; set; }
        public decimal? SecondInstallAmount { get; set; }
        public DateTime? FinalInstallDate { get; set; }
        public decimal? FinalInstallAmount { get; set; }
        public string InstallmentTerm { get; set; }
        public string InstallmentNote { get; set; }

        public static Order CreateOrder()
        {
            return new Order()
            {
                Id = GenerateNewID()
            };
        }

        private static int GenerateNewID()
        {
            return 0;
        }

        public Order() { }

        public Order(Dictionary<string, object> data)
        {
            DateTime date;
            if(data.ContainsKey("Id"))
                Id = int.Parse(data["Id"].ToString());
            EquipmentNumber = data["EquipmentNumber"] as string;
            SapNumber = data["SapNumber"] as string;
            CustomerId = (int)data["CustomerId"];
            ProductId = (int)data["ProductId"];
            KNumber = data["KNumber"] as string;
            if (DateTime.TryParse(data["DateAdded"] as string, out date)) DateAdded = date;
            ProductName = data["ProductName"] as string;
            EquipmentNumber = data["EquipmentNumber"] as string;
            Category = data["Category"] as string;
            if (data["SaleAmount"] != null)
                SaleAmount = decimal.Parse(data["SaleAmount"].ToString());
            PONumber = data["PONumber"] as string;
            Port = data["Port"] as string;
            ForwarderNumber = data["ForwarderNumber"] as string;
            if (DateTime.TryParse(data["MfgDate"] as string, out date)) MfgDate = date;
            if (DateTime.TryParse(data["PortDate"] as string, out date)) PortDate = date;
            if (DateTime.TryParse(data["DeliveryDate"] as string, out date)) DeliveryDate = date;
            if (DateTime.TryParse(data["InstallDate"] as string, out date)) InstallDate = date;
            Shipped = data["Shipped"] as string;
            if (DateTime.TryParse(data["ShipDate"] as string, out date)) ShipDate = date;
            ProductionWeek = data["ProductionWeek"] as string;
            Comments = data["Comments"] as string;
            Options = data["Options"] as string;
            Status = data["Status"] as string;

            if (DateTime.TryParse(data["FirstInstallDate"] as string, out date)) FirstInstallDate = date;
            if (data["FirstInstallAmount"] != null)
                FirstInstallAmount = (decimal)data["FirstInstallAmount"];
            if (DateTime.TryParse(data["SecondInstallDate"] as string, out date)) SecondInstallDate = date;
            if (data["SecondInstallAmount"] != null)
                SecondInstallAmount = (decimal)data["SecondInstallAmount"];
            if (DateTime.TryParse(data["FinalInstallDate"] as string, out date)) FinalInstallDate = date;
            if (data["FinalInstallAmount"] != null)
                FinalInstallAmount = (decimal)data["FinalInstallAmount"];
            InstallmentTerm = data["InstallmentTerm"] as string;
            InstallmentNote = data["InstallmentNote"] as string;
        }

        public List<string> GetChangedFields(Order otherOrder)
        {
            var changedFields = new List<string>();

            if (PONumber != otherOrder.PONumber) changedFields.Add("PONumber");
            if (DateAdded != otherOrder.DateAdded) changedFields.Add("DateAdded");
            if (SaleOrderNumber != otherOrder.SaleOrderNumber) changedFields.Add("SaleOrderNumber");
            if (ProductName != otherOrder.ProductName) changedFields.Add("ProductName");
            if (EquipmentNumber != otherOrder.EquipmentNumber) changedFields.Add("EquipmentNumber");
            if (Category != otherOrder.Category) changedFields.Add("Category");
            if (SaleAmount != otherOrder.SaleAmount) changedFields.Add("SaleAmount");
            if (PortDate != otherOrder.PortDate) changedFields.Add("PortDate");
            if (DeliveryDate != otherOrder.DeliveryDate) changedFields.Add("DeliveryDate");
            if (InstallDate != otherOrder.InstallDate) changedFields.Add("InstallDate");
            if (Shipped != otherOrder.Shipped) changedFields.Add("Shipped");
            if (ShipDate != otherOrder.ShipDate) changedFields.Add("ShipDate");
            if (ProductionWeek != otherOrder.ProductionWeek) changedFields.Add("ProductionWeek");
            if (Options != otherOrder.Options) changedFields.Add("Options");
            if (Status != otherOrder.Status) changedFields.Add("Status");
            return changedFields;
        }
    }
}

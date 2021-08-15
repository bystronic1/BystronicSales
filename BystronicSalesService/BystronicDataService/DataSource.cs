using System.Collections.Generic;

namespace BystronicSalesService
{
    abstract public class DataSource
    {
        abstract public List<Order> GetOrders();
        abstract public bool AddOrder(Order order);
        abstract public bool UpdateOrder(Order order);
        abstract public bool DeleteOrder(int orderId);

        abstract public List<Customer> GetCustomers();
        abstract public bool AddCustomer(Customer customer);
        abstract public bool UpdateCustomer(Customer customer);
        abstract public bool DeleteCustomer(Customer customer);

        abstract public List<Product> GetProducts();
        abstract public bool AddProduct(Product product);
        abstract public bool UpdateProduct(Product product);
        abstract public bool DeleteProduct(Product product);

        abstract public List<ProductCategory> GetProductCategories();
        abstract public bool AddProductCategory(ProductCategory product);
        abstract public bool UpdateProductCategory(ProductCategory product);

        abstract public List<Region> GetRegions();
        abstract public bool AddRegion(Region region);
        abstract public bool UpdateRegion(Region region);

        abstract public List<RegionalManager> GetRegionalManagers();
        abstract public bool AddRegionalManager(RegionalManager regionalManager);
        abstract public bool UpdateRegionalManager(RegionalManager regionalManager);

        abstract public List<Payment> GetPayments();
        abstract public bool AddPayment(Payment payment);
        abstract public bool UpdatePayment(Payment payment);

        abstract public List<View> GetViews(string username);
        abstract public void SaveViews(string username, List<View> views);
        abstract public string GetColumns(string username, string gridname = "Default");
        abstract public void SaveColumns(string username, string gridname, string newgridname, string columns);
        abstract public void DeleteColumns(string username, string gridname);

        abstract public bool IsReady();

        public List<Order> GetOrdersFor(List<Order> orders, User user)
        {
            var ordersForUser = orders;
            return ordersForUser;
        }

        public void OrderChanged(Order order)
        {
            var index = BystronicData.GetData(this).orders.FindIndex(x => x.Id == order.Id);
            if (index >= 0)
            {
                UpdateOrder(order);
                BystronicData.GetData(this).UpdateOrder(order, index);
            }
            else
            {
                AddOrder(order);
                BystronicData.GetData(this).AddOrder(order);
            }
        }

        public void OrderDeleted(int orderID, out string equipmentNumber)
        {
            DeleteOrder(orderID);
            BystronicData.GetData(this).DeleteOrder(orderID, out equipmentNumber);
        }

    }
}


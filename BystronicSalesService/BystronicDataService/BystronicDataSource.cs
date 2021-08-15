using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace BystronicSalesService
{
    class BystronicDataSource : DataSource
    {
        BystronicDataDataContext bd = new BystronicDataDataContext();

        public override bool IsReady() => true;

        // PRODUCTS ////////////////////////////////////////////////////////////////////////////////////////////////

        public override List<Product> GetProducts() =>
           bd.ProductLists.Select(p => new Product(p.Id, p.CategoryID, p.ProductName, p.Status)).ToList();

        public override bool AddProduct(Product product)
        {
            bd.AddProduct(product.Name, product.CategoryId, product.Status);
            bd.SubmitChanges();
            return true;
        }

        public override bool UpdateProduct(Product product)
        {
            bd.UpdateProduct(product.Id, product.Name, product.CategoryId, product.Status);
            bd.SubmitChanges();
            return true;
        }

        public override bool DeleteProduct(Product product)
        {
            //delete product only if there arent orders with this product
            var result = bd.DeleteProduct(product.Id).FirstOrDefault();
            //returns true if deleted, returns false if orders with customer id already exists
            return result.Column1.Value;
        }


        // PRODUCT CATEGORIES ////////////////////////////////////////////////////////////////////////////////////////////////

        public override List<ProductCategory> GetProductCategories() =>
            bd.ProductCategoryLists.Select(c => new ProductCategory(c.Id, c.CategoryTypeId, c.Category, c.Status)).ToList();

        public override bool AddProductCategory(ProductCategory productCategory)
        {
            bd.AddProductCategory(productCategory.TypeId, productCategory.Name, productCategory.Status);
            bd.SubmitChanges();
            return true;
        }

        public override bool UpdateProductCategory(ProductCategory productCategory)
        {
            bd.UpdateProductCategory(productCategory.Id , productCategory.TypeId, productCategory.Name, productCategory.Status);
            bd.SubmitChanges();
            return true;
        }

        // CUSTOMERS ////////////////////////////////////////////////////////////////////////////////////////////////

        public override List<Customer> GetCustomers() =>
            bd.CustomerLists.Select(c => new Customer(c.Id, c.ReginalManagerID, c.Name, c.SAPNumber, c.City, c.State, c.DateJoined, c.Status)).ToList();

        public override bool AddCustomer(Customer customer)
        {
            bd.AddCustomer(customer.SapNumber, customer.Name, customer.City, customer.State, customer.RegionalManagerId, customer.DateJoined, customer.Status);
            return true;
        }

        public override bool UpdateCustomer(Customer customer)
        {
            bd.UpdateCustomer(customer.Id, customer.SapNumber, customer.Name, customer.City, customer.State, customer.RegionalManagerId, customer.DateJoined, customer.Status);
            return true;
        }

        public override bool DeleteCustomer(Customer customer)
        {
            //delete customer only if there are no orders for this customer otherwise we need to delete orders. Maybe a message to use "Please delete orders for this customer before deleting customer";
            var result = bd.DeleteCustomer(customer.Id).FirstOrDefault();
            //returns true if deleted, returns false if orders with customer id already exists
            return result.Column1.Value;
        }


        // REGIONS ////////////////////////////////////////////////////////////////////////////////////////////////

        public override List<Region> GetRegions() =>
            bd.RegionLists.Select(r => new Region(r.Id, r.RegionName)).ToList();

        public override bool AddRegion(Region region)
        {
            bd.AddRegion(region.Name);
            return true;
        }

        public override bool UpdateRegion(Region region)
        {
            bd.UpdateRegion(region.Id, region.Name);
            return true;
        }

        // REGIONAL MANAGERS ////////////////////////////////////////////////////////////////////////////////////////////////

        public override List<RegionalManager> GetRegionalManagers() =>
            bd.RegionalManagerLists.Select(r => new RegionalManager(r.Id, r.RegionID, r.RegionalManagerName)).ToList();

        public override bool AddRegionalManager(RegionalManager regionalManager)
        {
            bd.AddRegionalManager(regionalManager.Name, regionalManager.RegionId);
            return true;
        }

        public override bool UpdateRegionalManager(RegionalManager regionalManager)
        {
            bd.UpdateRegionalManager(regionalManager.Id, regionalManager.Name, regionalManager.RegionId);
            return true;
        }

        // PAYMENTS ////////////////////////////////////////////////////////////////////////////////////////////////

        public override List<Payment> GetPayments() =>
            bd.PaymentLists.Select(p => new Payment(p.Id, p.OrderID, p.FinalInstallDate, p.FirstInstallAmount, p.SecondInstallDate, p.SecondInstallAmount, p.FinalInstallDate, p.FinalInstallAmount, p.Term, p.Note)).ToList();

        public override bool AddPayment(Payment payment)
        {
            bd.AddPayment(payment.OrderId, payment.FirstInstallDate, payment.FirstInstallAmount, payment.SecondInstallDate, payment.SecondInstallAmount, payment.FinalInstallDate, payment.FinalInstallAmount, payment.Term, payment.Note);
            return true;
        }

        public override bool UpdatePayment(Payment payment)
        {
            bd.UpdatePayment(payment.Id, payment.OrderId, payment.FirstInstallDate, payment.FirstInstallAmount, payment.SecondInstallDate, payment.SecondInstallAmount, payment.FinalInstallDate, payment.FinalInstallAmount, payment.Term, payment.Note);
            return true;
        }


        public override List<Order> GetOrders()
        {
            List<Order> orders = new List<Order>();
            BystronicDataDataContext bd = new BystronicDataDataContext();

            foreach (OrderList p in bd.OrderLists.AsEnumerable())
            {
                orders.Add(new Order()
                {
                    Id = p.Id,
                    EquipmentNumber = p.EquipmentNumber,
                    CustomerId = p.CustomerID,
                    ProductId = p.ProductID,
                    SapNumber = p.SAPNumber,
                    DateAdded = p.DateAdded,
                    SaleOrderNumber = p.SaleOrderNumber,
                    SaleAmount = p.SaleAmount,
                    PONumber = p.PONumber,
                    Port = p.Port,
                    ForwarderNumber = p.ForwarderNumber,
                    PortDate = p.PortDate,
                    MfgDate = p.MfgDate,
                    DeliveryDate = p.DeliveryDate,
                    InstallDate = p.InstallDate,
                    Shipped = p.Shipped,
                    ShipDate = p.ShipDate,
                    ProductionWeek = p.ProductionWeek,
                    Comments = p.Comments,
                    Options = p.Options,
                    Status = p.Status,
                    FirstInstallDate = p.FirstInstallDate,
                    FirstInstallAmount = p.FirstInstallAmount,
                    SecondInstallDate = p.SecondInstallDate,
                    SecondInstallAmount = p.SecondInstallAmount,
                    FinalInstallDate = p.FinalInstallDate,
                    FinalInstallAmount = p.FinalInstallAmount,
                    InstallmentTerm = p.InstallmentTerm,
                    InstallmentNote = p.InstallmentNote
                });
            }

            return orders;
        }

        public override bool AddOrder(Order order)
        {
            //add new order: ignore order.ID
            BystronicDataDataContext bd = new BystronicDataDataContext();
            order.Id = bd.AddOrder(
                  order.EquipmentNumber
                , order.CustomerId
                , order.ProductId
                , order.SaleAmount
                , order.SapNumber
                , order.PONumber
                , order.KNumber
                , order.PortDate
                , order.Port
                , order.ForwarderNumber
                , order.DeliveryDate
                , order.MfgDate
                , order.InstallDate
                , order.Shipped
                , order.ShipDate
                , order.ProductionWeek
                , order.SaleOrderNumber
                , order.Comments
                , order.Options
                , order.Status
                , order.FirstInstallDate
                , order.FirstInstallAmount
                , order.SecondInstallDate
                , order.SecondInstallAmount
                , order.FinalInstallDate
                , order.FinalInstallAmount
                , order.InstallmentTerm
                , order.InstallmentNote
            );
            
            bd.SubmitChanges();

            return true;
        }

        public override bool UpdateOrder(Order order)
        {
            //update order in the database with the order.ID with given order
            BystronicDataDataContext bd = new BystronicDataDataContext();
            bd.UpdateOrder(
               //order.orderID  I need order id
                  order.Id
                , order.EquipmentNumber
                , order.CustomerId
                , order.ProductId
                , order.SaleAmount
                , order.SapNumber
                , order.PONumber
                , order.KNumber
                , order.PortDate
                , order.Port
                , order.ForwarderNumber
                , order.DeliveryDate
                , order.MfgDate
                , order.InstallDate
                , order.Shipped
                , order.ShipDate
                , order.ProductionWeek
                , order.SaleOrderNumber
                , order.Comments
                , order.Options
                , order.Status
                , order.FirstInstallDate
                , order.FirstInstallAmount
                , order.SecondInstallDate
                , order.SecondInstallAmount
                , order.FinalInstallDate
                , order.FinalInstallAmount
                , order.InstallmentTerm
                , order.InstallmentNote
            );

            //should we update or delete and reinsert?
            bd.SubmitChanges();
            return true;
        }

        public override bool DeleteOrder(int orderID)
        {
            bd.DeleteOrder(orderID);
            return true;
        }

        // COLUMNS ///////////////////////////////////////////////////////////////////////////////

        public override string GetColumns(string username, string gridname)
        {
            GetGridcolumnsByUserResult result = bd.GetGridcolumnsByUser(username, gridname).FirstOrDefault();
            return result != null ? result.gridcolumns : string.Empty;
        }

        public override List<View> GetViews(string username)
        {
            var views = from view in bd.GetViewsByUser(username) select new View(view.gridname.Trim(), view.gridcolumns.Trim());
            return views.ToList();
        }

        public override void SaveViews(string username, List<View> views)
        {
            bd.DeleteAllGridsByUser(username);
            foreach (var view in views)
            {
                bd.AddUpdateUsersGridColumns(username, view.Name, view.Name, view.Columns);
            }
        }

        public override void SaveColumns(string username, string gridname, string newgridname, string columns) =>
            bd.AddUpdateUsersGridColumns(username, gridname, newgridname, columns);

        public override void DeleteColumns(string username, string gridname) =>
            bd.DeleteGridByUserAndGridName(username, gridname);
    }
}

using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.ServiceProcess;
using System.Text;
using System.Threading;
using System.Web;
using System.Web.Script.Serialization;
using System.Linq;

namespace BystronicSalesService
{
    public delegate void ServiceFunction(object[] args);
    public delegate void RunTaskCallback(object[] args);

    public partial class BystronicDataService : ServiceBase
    {
        static Config _config;

        static Queue<ServiceFunctionInfo> ServiceQueue = new Queue<ServiceFunctionInfo>();
        static object _serviceQueueLock = new object();

        public static JavaScriptSerializer _serializer = new JavaScriptSerializer();

        // Sercice Data Source: BystronicDataSource - DB data; TestDataSource - hardcoded data
        //public static DataSource DataSource = new TestDataSource();
        public static DataSource DataSource = new BystronicDataSource();

        public static string DBConnectionString => _config.DBConnectionString;

            //Data Source=lchpid1;Initial Catalog = BystronicCanada; Integrated Security = True

        private const int _dbReconnectPeriod = 30; // seconds
        private const int _dbReconnectAttempts = 5;

        public BystronicDataService()
        {
        }

        public void StartImpl()
        {
            new Thread(MainThread).Start();
        }

        public void StopImpl()
        {
            Environment.Exit(0); // or maybe: App.Current.Shutdown(0);
        }

        protected override void OnStart(string[] args)
        {
            StartImpl();
        }

        protected override void OnStop()
        {
            StopImpl();
        }

        static void MainThread()
        {
            Environment.CurrentDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            HttpListener listener = null;
            try
            {
                _config = new Config();

                for (var reconnectAttempt = 0; reconnectAttempt <= _dbReconnectAttempts; reconnectAttempt++)
                {
                    if (DataSource.IsReady()) break;
                    if(reconnectAttempt == _dbReconnectAttempts)
                    {
                        LogUtil.Trace("Database is not accessible. Service stops.");
                        Environment.Exit(0);
                    }
                    LogUtil.Trace($"Database is not accessible. Waiting {_dbReconnectPeriod} seconds...");
                    Thread.Sleep(TimeSpan.FromSeconds(_dbReconnectPeriod));
                }

                AppDomain currentDomain = AppDomain.CurrentDomain;
                currentDomain.UnhandledException += new UnhandledExceptionEventHandler(UnhandledExceptionHandler);

                var prefix = "http://*:" + 80 + "/bystronicsales/";
                var prefixSecure = "https://+:" + 443 + "/bystronicsales/";

                listener = new HttpListener();
                listener.Prefixes.Add(prefix);
                listener.Prefixes.Add(prefixSecure);

                listener.Start();
                LogUtil.Trace("Listening to client requests at " + prefix.Replace("*", Dns.GetHostEntry("").HostName) + "...");
            }
            catch (Exception e)
            {
                LogUtil.Trace(e);
                return;
            }

            //ThreadStart workerThread = () =>
            //{
            //    for (;;)
            //    {
            //        var function = Dequeue();
            //        if (function != null)
            //            function.Run();
            //        else
            //            Thread.Sleep(TimeSpan.FromMilliseconds(100));
            //    }
            //};
            //new Thread(workerThread) { IsBackground = false }.Start();

            ThreadStart dataReader = () =>
            {
                //for (; ;) // update just once for now
                //{
                    BystronicData.UpdateData(DataSource);
                //    Thread.Sleep(TimeSpan.FromSeconds(300));
                //}
            };

            new Thread(dataReader) { IsBackground = true }.Start();

            for (;;)
            {
                var context = listener.GetContext();
                new Thread(() => Serve(context), 1024 * 20).Start();
            }
        }

        static void UnhandledExceptionHandler(object sender, UnhandledExceptionEventArgs args)
        {
            Exception e = (Exception)args.ExceptionObject;
            LogUtil.Trace(e);
        }

        static void Serve(HttpListenerContext context)
        {
            HttpListenerRequest request = context.Request;
            var response = context.Response;

            response.Headers.Add("Cache-control", "no-cache, no-store, must-revalidate");
            response.Headers.Add("Expires", "0");
            response.Headers.Add("Pragma", "no-cache");
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Headers", "cache-control, origin, X-Requested-With, url, authorization, host, connection, Pragma, Expires");
            response.Headers.Add("Access-Control-Allow-Method", "GET, POST, PUT, OPTIONS");

            RequestMessage requestMessage = null;
            HttpListenerBasicIdentity identity = null;
            try
            {
                var authentication = request.Headers["Authorization"];
                identity = authentication != null ? GetBasicIdentity(request) : null;

                // CORS support
                if (request.HttpMethod == "OPTIONS")
                {
                    context.Response.ContentType = "text/plain";
                    context.Response.StatusCode = (int)HttpStatusCode.OK;
                    context.Response.ContentEncoding = Encoding.UTF8;
                    response.Close();
                }
                else
                {
                    if (identity == null)
                    {
                        throw new HttpException((int)HttpStatusCode.Unauthorized, "Unauthorized");
                    }
                    using (StreamReader reader = new StreamReader(request.InputStream))
                    {
                        requestMessage = deserealize<RequestMessage>(reader.ReadToEnd());
                    }

                    if (string.IsNullOrEmpty(requestMessage.Query)) Invoke(HandleUnknownRequestException, new object[] { context, requestMessage.Query });

                    switch (requestMessage.Query)
                    {
                        case "getconfiguration":
                            Invoke(HandleGetConfiguration, new object[] { context, identity });
                            break;
                        case "login":
                            Invoke(HandleLoginTest,          new object[] { context, identity });
                            break;
                        case "getdata":
                            Invoke(HandleGetDataGZip,        new object[] { context, requestMessage.Data });
                            break;
                        case "createorder":
                            Invoke(HandleCreateOrder, new object[] { context, requestMessage.Data });
                            break;
                        case "saveorder":
                            Invoke(HandleSaveOrder,      new object[] { context, requestMessage.Data });
                            break;
                        case "deleteorder":
                            Invoke(HandleDeleteOrder, new object[] { context, requestMessage.Data });
                            break;
                        case "addcustomer":
                            Invoke(HandleAddCustomer, new object[] { context, requestMessage.Data });
                            break;
                        case "updatecustomer":
                            Invoke(HandleUpdateCustomer, new object[] { context, requestMessage.Data });
                            break;
                        case "deletecustomer":
                            Invoke(HandleDeleteCustomer, new object[] { context, requestMessage.Data });
                            break;
                        case "addproduct":
                            Invoke(HandleAddProduct, new object[] { context, requestMessage.Data });
                            break;
                        case "updateproduct":
                            Invoke(HandleUpdateProduct, new object[] { context, requestMessage.Data });
                            break;
                        case "deleteproduct":
                            Invoke(HandleDeleteProduct, new object[] { context, requestMessage.Data });
                            break;
                        case "addproductcategory":
                            Invoke(HandleAddProductCategory, new object[] { context, requestMessage.Data });
                            break;
                        case "updateproductcategory":
                            Invoke(HandleUpdateProductCategory, new object[] { context, requestMessage.Data });
                            break;
                        case "addregion":
                            Invoke(HandleAddRegion, new object[] { context, requestMessage.Data });
                            break;
                        case "updateregion":
                            Invoke(HandleUpdateRegion, new object[] { context, requestMessage.Data });
                            break;
                        case "addregionalmanager":
                            Invoke(HandleAddRegionalManager, new object[] { context, requestMessage.Data });
                            break;
                        case "updateregionalmanager":
                            Invoke(HandleUpdateRegionalManager, new object[] { context, requestMessage.Data });
                            break;
                        case "addpayment":
                            Invoke(HandleAddPayment, new object[] { context, requestMessage.Data });
                            break;
                        case "updatepayment":
                            Invoke(HandleUpdatePayment, new object[] { context, requestMessage.Data });
                            break;
                        case "getviews":
                            Invoke(HandleGetViews, new object[] { context, requestMessage.Data });
                            break;
                        case "saveviews":
                            Invoke(HandleSaveViews, new object[] { context, requestMessage.Data });
                            break;
                        case "getcolumns":
                            Invoke(HandleGetColumns, new object[] { context, requestMessage.Data });
                            break;
                        case "savecolumns":
                            Invoke(HandleSaveColumns, new object[] { context, requestMessage.Data });
                            break;
                        case "deleteview":
                            Invoke(HandleDeleteView, new object[] { context, requestMessage.Data });
                            break;
                        //case "runtask":
                        //    Enqueue(HandleRunTaskNew, new object[] { context, identity, task });
                        //    break;
                        default:
                            Invoke(HandleUnknownRequestException, new object[] { context, requestMessage.Query });
                            break;
                    }
                }

            }
            catch (HttpException e)
            {
                SendError(context, requestMessage?.Query, e.GetHttpCode(), e.Message, e.StackTrace);
                LogUtil.Trace(e);
            }

            catch (Exception e)
            {
                SendError(context, requestMessage?.Query, 400, e.Message, e.StackTrace);
                LogUtil.Trace(e);
            }
        }

        public static HttpListenerBasicIdentity GetBasicIdentity(HttpListenerRequest req)
        {
            try
            {
                var auth = req.Headers["Authorization"];
                if (auth == null) return null;

                auth = auth.Trim();
                if (!auth.StartsWith("Basic") || auth.Length < 6 || !Char.IsWhiteSpace(auth[5])) return null;

                var base64 = auth.Substring(6).TrimStart();

                var userAndPass = Encoding.ASCII.GetString(Convert.FromBase64String(base64));

                int colon = userAndPass.IndexOf(':');
                if (colon < 0) return null;

                return new HttpListenerBasicIdentity(userAndPass.Substring(0, colon), userAndPass.Substring(colon + 1));
            }
            catch
            {
                return null;
            }
        }

        static void HandleLogin(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var identity = args[1] as HttpListenerBasicIdentity;
            LogUtil.Trace("Processing request \"Login\"", identity.Name);

            var windowsAuthentication = new WindowsAuth();

            Permissions permissions = null;
            User user = null;
            if (windowsAuthentication.IsAuthenicated(identity.Name, identity.Password))
            {
                permissions = new Permissions(windowsAuthentication.GetUserGroups(identity.Name), _config.Country);
                user = windowsAuthentication.GetUser(identity.Name, _config.Country);
            }
            else
            {
                SendError(context, "login", 101, "Invalid username or password.", null);
                return;
            }

            if(user == null)
            {
                SendError(context, "login", 101, "User is not authorized to use the application.", null);
                return;
            }

            if (user.Role == User.ROLE_DEALER || user.Role == User.ROLE_DSE || user.Role == User.ROLE_REGIONAL_MANAGER || user.Role == User.ROLE_REGIONAL_MANAGER_DSE)
            {
                // user is Dealer, DSE, or RSM, we need  to fill in the region => we look him up in the SalesPerson database
                //user = DataSource.GetAllSalesmen().Find(x => x.ID.Equals(identity.Name, StringComparison.InvariantCultureIgnoreCase));
            }

            var views = DataSource.GetViews(user.ID);
            var columns = DataSource.GetColumns(user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;

                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "login", Data = new Dictionary<string, object> { { "Service Info", GetVersionInfo() }, { "User", user }, { "Permissions", permissions }, { "Views", views }, { "Columns", columns } } }));
                    writer.Flush();
                }
            }
        }

        static void HandleLoginTest(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var identity = args[1] as HttpListenerBasicIdentity;
            LogUtil.Trace("Processing request \"Login\"", identity.Name);

            //  var windowsAuthentication = new WindowsAuth();

            var isAuthenticated = identity.Password.Equals("test", StringComparison.InvariantCultureIgnoreCase);
            
            Permissions permissions = null;

            if (isAuthenticated)
            {
                //permissions = new Permissions(windowsAuthentication.UserGroups(identity.Name));
            }
            else
            {
                SendError(context, "login", 101, "Invalid username or password.", null);
                return;
            }

            //User user = null; // windowsAuthentication.GetUser(identity.Name); // user is PM or Administrator

            User user = null; // DataSource.GetAllSalesmen().Find(x => x.ID.Equals(identity.Name, StringComparison.InvariantCultureIgnoreCase));
            if (user != null)
            {
                permissions = new Permissions();
            }
            else
            {
                // user not found
                //SendError(context, "login", 101, "Invalid username or password.", null);
                //return;

                user = new User(identity.Name.ToLower(), identity.Name, User.ROLE_ADMINISTRATOR, "Midwest");
                permissions = new Permissions();
            }

            var views = DataSource.GetViews(user.ID);

            var columns = DataSource.GetColumns(user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "application/json";
                response.ContentEncoding = Encoding.UTF8;

                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "login", Data = new Dictionary<string, object> { { "Service Info", GetVersionInfo() }, { "User", user }, { "Permissions", permissions }, { "Columns", columns }, { "Views", views } } }));
                    writer.Flush();
                }
            }
        }

        static void HandleGetConfiguration(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "getconfiguration", Data = new Dictionary<string, object> { { "Configuration", _config } } }));
                    writer.Flush();
                }
            }
        }

        static void HandleGetData(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);

            LogUtil.Trace("Processing request \"GetData\"", user.ID);

           // var timeStamp2 = DateTime.Now;
           // Console.WriteLine("Time to get data from the database: " + (timeStamp2-timeStamp1).TotalMilliseconds + " ms.");

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    var bystronicData = BystronicData.GetData(DataSource);
                    var responseString = user.Role == User.ROLE_ADMINISTRATOR ? bystronicData.serializedData : bystronicData.serializeResponse(user);
                    writer.Write(responseString);
                    writer.Flush();
                }
           //     Console.WriteLine("Time to send data to the client: " + (DateTime.Now - timeStamp2).TotalMilliseconds + " ms.");
            }
        }

        static void HandleGetDataGZip(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);

            LogUtil.Trace("Processing request \"GetData GZip\"", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "gzip";
                response.ContentEncoding = Encoding.UTF8;
                using (var outputStream = new MemoryStream())
                {
                    var bystronicData = BystronicData.GetData(DataSource);
                    var responseString = user.Role == User.ROLE_ADMINISTRATOR ? bystronicData.serializedData : bystronicData.serializeResponse(user);
                    //new BinaryFormatter().Serialize(outputStream, responseString);
                    //var outputData = outputStream.ToArray();
                    try
                    {
                        using (var writer = new StreamWriter(response.OutputStream))
                        {
                            var compressedString = CompressString(responseString);
                            Console.WriteLine($"Compress string: in - {responseString.Length}; out - {compressedString.Length}");
                            writer.Write(compressedString);
                            writer.Flush();
                        }
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine(e.StackTrace);
                    };
                }
            }
        }

        public static string CompressString(string text)
        {
            byte[] buffer = Encoding.UTF8.GetBytes(text);
            var memoryStream = new MemoryStream();
            using (var gZipStream = new GZipStream(memoryStream, CompressionMode.Compress, true))
            {
                gZipStream.Write(buffer, 0, buffer.Length);
            }
            return Convert.ToBase64String(memoryStream.ToArray());
        }

        static void HandleCreateOrder(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);

            LogUtil.Trace("Processing request \"CreateOrder\"", user.ID);

            var order = Order.CreateOrder();

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "createorder", Data = new Dictionary<string, object> { { "Order", order } } }));
                    writer.Flush();
                }
            }
        }


        static void HandleSaveOrder(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var orderData = data["order"] as Dictionary<string, object>;
            var order = new Order(orderData);

            var existingOrder = BystronicData.GetData(DataSource).orders.Find(x => x.Id == order.Id);

            if (existingOrder == null)
                LogUtil.Trace($"Processing request \"AddOrder\" ID: {order.Id}; JN: {order.EquipmentNumber}", user.ID);
            else
            {
                LogUtil.Trace($"Processing request \"UpdateOrder\" ID: {order.Id}; JN: {order.EquipmentNumber} ", user.ID);
                var changedFields = order.GetChangedFields(existingOrder);
                if(changedFields.Count > 0)
                    LogUtil.Trace($"Changed fields: {string.Join(",", changedFields)}");
            }

            DataSource.OrderChanged(order);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "saveorder", Data = new Dictionary<string, object> { { "Order", order } } }));
                    writer.Flush();
                }
            }
        }

        static void HandleDeleteOrder(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var orderID = Convert.ToInt32(data["id"]);

            DataSource.OrderDeleted(orderID, out string equipmentNumber);

            LogUtil.Trace($"Processing request \"DeleteOrder\" ID: {orderID}; JN: {equipmentNumber} ", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "deleteorder", Data = new Dictionary<string, object> { { "ID", orderID } } }));
                    writer.Flush();
                }
            }
        }


        static void HandleAddCustomer(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var customer = new Customer(data["customer"] as Dictionary<string, object>);

            if(!DataSource.AddCustomer(customer))
            {
                SendError(context, "addcustomer", 101, "Cannot add customer.", null);
                return;
            }
            var customers = DataSource.GetCustomers();

            LogUtil.Trace($"Processing request \"AddCustomer\" ID: {customer.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "addcustomer", Data = new Dictionary<string, object> { { "Customers", customers } } }));
                    writer.Flush();
                }
            }
            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleUpdateCustomer(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var customer = new Customer(data["customer"] as Dictionary<string, object>);

            if (!DataSource.UpdateCustomer(customer))
            {
                SendError(context, "updatecustomer", 101, "Cannot update customer information.", null);
                return;
            }
            var customers = DataSource.GetCustomers();

            LogUtil.Trace($"Processing request \"UpdateCustomer\" ID: {customer.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "updatecustomer", Data = new Dictionary<string, object> { { "Customers", customers } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleDeleteCustomer(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var customer = new Customer(data["customer"] as Dictionary<string, object>);

            if (!DataSource.DeleteCustomer(customer))
            {
                SendError(context, "deletecustomer", 101, "Cannot delete customer.", null);
                return;
            }
            var customers = DataSource.GetCustomers();

            LogUtil.Trace($"Processing request \"DeleteCustomer\" ID: {customer.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "deletecustomer", Data = new Dictionary<string, object> { { "Customers", customers } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleAddProduct(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var product = new Product(data["product"] as Dictionary<string, object>);

            if (!DataSource.AddProduct(product))
            {
                SendError(context, "addproduct", 101, "Cannot add product.", null);
                return;
            }
            var products = DataSource.GetProducts();

            LogUtil.Trace($"Processing request \"AddProduct\" ID: {product.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "addproduct", Data = new Dictionary<string, object> { { "Products", products } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleUpdateProduct(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var product = new Product(data["product"] as Dictionary<string, object>);

            if (!DataSource.UpdateProduct(product))
            {
                SendError(context, "updateproduct", 101, "Cannot update product.", null);
                return;
            }
            var products = DataSource.GetProducts();

            LogUtil.Trace($"Processing request \"UpdateProduct\" ID: {product.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "updateproduct", Data = new Dictionary<string, object> { { "Products", products } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleDeleteProduct(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var product = new Product(data["product"] as Dictionary<string, object>);

            if (!DataSource.DeleteProduct(product))
            {
                SendError(context, "deleteproduct", 101, "Cannot delete product.", null);
                return;
            }
            var products = DataSource.GetProducts();

            LogUtil.Trace($"Processing request \"DeleteProduct\" ID: {product.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "deletecustomer", Data = new Dictionary<string, object> { { "Products", products } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleAddProductCategory(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var productCategory = new ProductCategory(data["productCategory"] as Dictionary<string, object>);

            if (!DataSource.AddProductCategory(productCategory))
            {
                SendError(context, "addproductcategory", 101, "Cannot add product category.", null);
                return;
            }
            var productCategories = DataSource.GetProductCategories();

            LogUtil.Trace($"Processing request \"AddProductCategory\" ID: {productCategory.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "addproductcategories", Data = new Dictionary<string, object> { { "ProductCategories", productCategories } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleUpdateProductCategory(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var productCategory = new ProductCategory(data["productCategory"] as Dictionary<string, object>);

            if (!DataSource.UpdateProductCategory(productCategory))
            {
                SendError(context, "updateproductcategory", 101, "Cannot update product category.", null);
                return;
            }
            var productCategories = DataSource.GetProductCategories();

            LogUtil.Trace($"Processing request \"UpdateProductCategory\" ID: {productCategory.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "updateproductcategory", Data = new Dictionary<string, object> { { "ProductCategories", productCategories } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleAddRegion(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var region = new Region(data["region"] as Dictionary<string, object>);

            if (!DataSource.AddRegion(region))
            {
                SendError(context, "addregion", 101, "Cannot add region.", null);
                return;
            }
            var regions = DataSource.GetRegions();

            LogUtil.Trace($"Processing request \"AddRegion\" ID: {region.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "addregion", Data = new Dictionary<string, object> { { "Regions", regions } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleUpdateRegion(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var region = new Region(data["region"] as Dictionary<string, object>);

            if (!DataSource.UpdateRegion(region))
            {
                SendError(context, "updateregion", 101, "Cannot update region.", null);
                return;
            }
            var regions = DataSource.GetRegions();

            LogUtil.Trace($"Processing request \"UpdateRegion\" ID: {region.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "updateregion", Data = new Dictionary<string, object> { { "Regions", regions } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleAddRegionalManager(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var regionalManager = new RegionalManager(data["regionalManager"] as Dictionary<string, object>);

            if (!DataSource.AddRegionalManager(regionalManager))
            {
                SendError(context, "addregionalmanager", 101, "Cannot add regional manager.", null);
                return;
            }
            var regionalManagers = DataSource.GetRegionalManagers();

            LogUtil.Trace($"Processing request \"AddRegionalManager\" ID: {regionalManager.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "addregionalmanager", Data = new Dictionary<string, object> { { "RegionalManagers", regionalManagers } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleUpdateRegionalManager(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var regionalManager = new RegionalManager(data["regionalManager"] as Dictionary<string, object>);

            if (!DataSource.UpdateRegionalManager(regionalManager))
            {
                SendError(context, "updateregionalmanager", 101, "Cannot update regional manager.", null);
                return;
            }
            var regionalManagers = DataSource.GetRegionalManagers();

            LogUtil.Trace($"Processing request \"UpdateRegionalManager\" ID: {regionalManager.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "updateregionalmanager", Data = new Dictionary<string, object> { { "RegionalManagers", regionalManagers } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleAddPayment(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var payment = new Payment(data["payment"] as Dictionary<string, object>);

            if (!DataSource.AddPayment(payment))
            {
                SendError(context, "addpayment", 101, "Cannot add payment.", null);
                return;
            }
            var payments = DataSource.GetPayments();

            LogUtil.Trace($"Processing request \"AddPayment\" ID: {payment.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "addpayment", Data = new Dictionary<string, object> { { "Payments", payments } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleUpdatePayment(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var payment = new Payment(data["payment"] as Dictionary<string, object>);

            if (!DataSource.UpdatePayment(payment))
            {
                SendError(context, "updatepayment", 101, "Cannot update payment.", null);
                return;
            }
            var payments = DataSource.GetPayments();

            LogUtil.Trace($"Processing request \"UpdatePayment\" ID: {payment.Id}", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "updatepayment", Data = new Dictionary<string, object> { { "Payments", payments } } }));
                    writer.Flush();
                }
            }

            BystronicData.GetData(DataSource).UpdateInfo();
        }

        static void HandleGetViews(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);

            LogUtil.Trace("Processing request \"GetColumns\"", user.ID);

            var views = DataSource.GetViews(user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "getviews", Data = new Dictionary<string, object> { { "Views", views } } }));
                    writer.Flush();
                }
            }
        }

        static void HandleSaveViews(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var viewStr = data["views"] as string;

            if (string.IsNullOrEmpty(viewStr))
            {
                return;
            }

            var views = DataSource.GetViews(user.ID);
            var viewNames = viewStr.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            var reorderedViews = new List<View>();

            foreach (var viewName in viewNames)
            {
                reorderedViews.Add(views.Single(v => v.Name == viewName));
            }

            DataSource.SaveViews(user.ID, reorderedViews);

            LogUtil.Trace("Processing request \"SaveViews\"", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "saveviews", Data = new Dictionary<string, object> { { "Views", reorderedViews } } }));
                    writer.Flush();
                }
            }
        }

        static void HandleGetColumns(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var gridName = data["gridname"] as string;

            LogUtil.Trace("Processing request \"GetColumns\"", user.ID);

            var columns = DataSource.GetColumns(user.ID, gridName);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "getcolumns", Data = new Dictionary<string, object> { { "Columns", columns } } }));
                    writer.Flush();
                }
            }
        }

        static void HandleSaveColumns(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var gridName = data["gridname"] as string;
            var newGridName = data["newgridname"] as string;
            var columns = data["columns"] as string;

            DataSource.SaveColumns(user.ID, gridName, newGridName, columns);

            LogUtil.Trace("Processing request \"SaveColumns\"", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "savecolumns", Data = new Dictionary<string, object> { { "Columns", columns } } }));
                    writer.Flush();
                }
            }
        }

        static void HandleDeleteView(object[] args)
        {
            var context = args[0] as HttpListenerContext;
            var data = args[1] as Dictionary<string, object>;
            var user = new User(data["user"] as Dictionary<string, object>);
            var gridName = data["gridname"] as string;

            DataSource.DeleteColumns(user.ID, gridName);

            LogUtil.Trace($"Processing request \"DeleteView: {gridName}\"", user.ID);

            using (HttpListenerResponse response = context.Response)
            {
                response.ContentType = "text/json";
                response.ContentEncoding = Encoding.UTF8;
                using (var writer = new StreamWriter(response.OutputStream))
                {
                    writer.Write(serialize(new ResponseMessage { Status = true, Query = "deleteview", Data = new Dictionary<string, object>() }));
                    writer.Flush();
                }
            }
        }
        public static string GetVersionInfo()
        {
            return "Bystronic Data Service v." + typeof(BystronicDataService).Assembly.GetName().Version;
        }

        static void HandleUnknownRequestException(object[] args)
        {
            SendError(args[0] as HttpListenerContext, args[1] as string, 110, "Unknown request: " + args[1] as string, null);
        }

        static void SendError(HttpListenerContext context, string query, int errorCode, string message, string details)
        {
            try
            {
                if (errorCode == (int)HttpStatusCode.Unauthorized)
                {
                    context.Response.StatusCode = errorCode;
                    context.Response.AddHeader("WWW-Authenticate", "Basic realm=\"Bystronic, Inc.\"");
                }
                else
                    LogUtil.Trace(message);

                using (HttpListenerResponse response = context.Response)
                {
                    response.ContentType = "text/json";
                    response.ContentEncoding = Encoding.UTF8;
                    using (var writer = new StreamWriter(response.OutputStream))
                    {
                        var error = new Error() { Code = errorCode, Message = message, Details = details };
                        writer.Write(serialize(new ResponseMessage { Status = false, Query = query, Data = new Dictionary<string, object> { { "Error", error } } }));
                        writer.Flush();
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Service cannot send error message because the following exception:\n{e.StackTrace}");
            }
        }

        //// C# 7 feature
        //private static (int Max, int Min) Range(IEnumerable<int> numbers)
        //{
        //    int min = int.MaxValue;
        //    int max = int.MinValue;
        //    foreach (var n in numbers)
        //    {
        //        min = (n < min) ? n : min;
        //        max = (n > max) ? n : max;
        //    }
        //    return (max, min);
        //}
        

        public static void Enqueue(ServiceFunction function, object[] args)
        {
            lock (_serviceQueueLock)
            {
                ServiceQueue.Enqueue(new ServiceFunctionInfo(function, args));
            }
        }

        static ServiceFunctionInfo Dequeue()
        {
            lock (_serviceQueueLock)
            {
                return ServiceQueue.Count > 0 ? ServiceQueue.Dequeue() : null;
            }
        }

        static void Invoke(ServiceFunction function, object[] args)
        {
            function(args);
        }

        public static string serialize(object obj)
        {
            return _serializer.Serialize(obj);
        }
        public static T deserealize<T>(string str)
        {
            return _serializer.Deserialize<T>(str);
        }

        //public static void ValidateCommissionCalculation()
        //{
        //    try
        //    {
        //        var path = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "Calc.dll");
        //        var assembly = Assembly.LoadFile(path);
        //        var type = assembly.GetType("Calc.CommissionCalculation", true);
        //        var CommissionCalculation = Activator.CreateInstance(type) as ICommissionCalculation;
        //        if(!CommissionCalculation.ValidateCommissionCalculation())
        //            throw new Exception();
        //    }
        //    catch(Exception)
        //    {
        //        throw new InvalidOperationException("Commission Calculation Exception");
        //    }
        //}
    }

    public class RequestMessage
    {
        public string Query { get; set; }
        public object Data { get; set; }
    }

    public class ResponseMessage
    {
        public bool Status { get; set; }
        public string Query { get; set; }
        public object Data { get; set; }
    }

    public class Error
    {
        public int Code { get; set; }
        public object Message { get; set; }
        public object Details { get; set; }

    }

    class ServiceFunctionInfo
    {
        private ServiceFunction _function;
        private object[] _arguments;

        public ServiceFunctionInfo(ServiceFunction f, object[] args)
        {
            _function = f;
            _arguments = args;
        }

        public void Run()
        {
            _function(_arguments);
        }
    }

    class Config
    {
        public const string Country_US = "US";
        public const string Country_CA = "CA";

        private const string ConfigFileName = "BystronicServiceConfig.txt";

        public string DBConnectionString { get; private set; }
        public int MajorVersion { get; private set; }
        public int MinorVersion { get; private set; }
        public int BuildNumber { get; private set; }
        public string Country { get; private set; }

        public Config()
        {
            DBConnectionString = Properties.Settings.Default.BystronicConnectionString;
            Country = Country_US;
            using (StreamReader reader = File.OpenText(ConfigFileName))
            {
                string item = null; 
                while ((item = reader.ReadLine()) != null)
                {
                    var data = item.Split(':');
                    if (data.Length != 2) continue;
                    if (data[0].Trim() == "Country") Country = data[1].Trim();
                    else if (data[0].Trim() == "MajorVersion") MajorVersion = int.Parse(data[1].Trim());
                    else if (data[0].Trim() == "MinorVersion") MinorVersion = int.Parse(data[1].Trim());
                    else if (data[0].Trim() == "BuildNumber") BuildNumber = int.Parse(data[1].Trim());
                    else if (data[0].Trim() == "DBConnectionString") DBConnectionString = data[1].Trim();
                }
            }
        }
    }
}

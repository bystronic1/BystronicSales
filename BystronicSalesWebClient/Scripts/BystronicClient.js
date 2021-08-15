var app = angular.module("BystronicClientModule", ['ngCookies', 'connection', 'ui.toggle']);
app.controller("MainController", ['$scope', '$http', '$cookies', '$timeout', '$interval', 'ConnectionService', function ($scope, $http, $cookies, $timeout, $interval, Connection) {
    $scope.init = function () {
        FastClick.attach(document.body);

        if (!sessionStorage || !sessionStorage.length) {
            $scope.logOut(); //  do not let client access the main page before login        
            return;
        }

        $scope.version = getVersion();
        $scope.MajorVersion = getVersionInfo().MajorVersion;
        $scope.IsCanadianVersion = getVersionInfo().Country === 'CA';
        $scope.IsDemoVersion = isDemoVersion();

        CE($scope);

        $scope.saleTypes = ['Dealer Sale', 'Direct Sale'];
        $scope.categoryTypes = ['Press Brake', 'Laser', 'Automation', 'Waterjet', 'Welding Cell'];
        $scope.regions = ['Central', 'Midwest', 'West', 'Southwest', 'East', 'North', 'South', 'Canada'];
        $scope.roles = { dealer: 'Dealer', dse: 'DSE', rsm: 'RSM', rsmdse: 'RSMDSE', pm: 'PM', approver: 'Approver', administrator: 'Administrator' };
        $scope.salesmenRoles = [$scope.roles.dealer, $scope.roles.dse, $scope.roles.rsmdse, $scope.roles.rsm];

        $scope.statuses = { pending: 'pending', approved: 'approved', released: 'released', paid: 'paid' };

        $scope.firstAvailableYear = 2018;
        $scope.lastAvailableYear = 2030;
        $scope.years = [];
        for (i = $scope.firstAvailableYear; i <= $scope.lastAvailableYear; i++) $scope.years.push(i);
        $scope.selectedYear = $scope.year = new Date().getFullYear();
        $scope.availableYears = [];
        for (i = $scope.firstAvailableYear; i <= $scope.year; i++) $scope.availableYears.push(i);

        $scope.clearOrderFilters();

        $scope.service_url = $cookies.get("bystronic_service_url");

        var settings = $cookies.get("bystronic_client_settings");
        if (settings)
            $scope.settings = JSON.parse(settings);
        else
            $scope.settings = { IdleTimeout: 5 };

        $scope.user = JSON.parse(sessionStorage.user);
        $scope.permissions = JSON.parse(sessionStorage.permissions);

        Connection.init($scope.user);

        $scope.orderGrid = new OrderGrid($scope, '#order_grid', onOrderDoubleClicked);
        jQuery("#order_grid").jqGrid('bindKeys');

        $scope.orderInputDataGridWithoutTooling = new OrderInputDataGrid($scope, '#order_input_data_grid', false, $scope.editOrderProducts);
        jQuery("#order_input_data_grid").jqGrid('bindKeys');

        $scope.orderInputDataGridWithTooling = new OrderInputDataGrid($scope, '#order_input_data_grid_with_tooling', true, $scope.editOrderProducts);
        jQuery("#order_input_data_grid_with_tooling").jqGrid('bindKeys');

        $scope.orderOutputDataGrid = new OrderOutputDataGrid($scope, '#order_output_data_grid');
        jQuery("#order_output_data_grid").jqGrid('bindKeys');

        $scope.orderFootnoteDataGrid = new OrderFootnoteDataGrid($scope, '#order_footnote_data_grid');
        jQuery("#order_footnote_data_grid").jqGrid('bindKeys');

        $scope.productGridWithoutTooling = new ProductGrid($scope, '#product_grid', false, onProductSelected);
        jQuery("#product_grid").jqGrid('bindKeys');

        $scope.productGridWithTooling = new ProductGrid($scope, '#product_grid_with_tooling', true, onProductSelected);
        jQuery("#product_grid_with_tooling").jqGrid('bindKeys');

        $scope.productTotalGrid = new ProductTotalGrid($scope, '#product_total_grid');
        jQuery("#product_total_grid").jqGrid('bindKeys');

        $scope.productSellPriceGrid = new ProductSellPriceGrid($scope, '#product_sellprice_grid');
        jQuery("#product_sellprice_grid").jqGrid('bindKeys');

        $scope.customerListGrid = new CustomerListGrid($scope, '#customerlist_grid');
        jQuery("#customerlist_grid").jqGrid('bindKeys');

        $scope.salesmenListGrid = new SalesmenListGrid($scope, '#salesmenlist_grid');
        jQuery("#salesmenlist_grid").jqGrid('bindKeys');

        $scope.salesListGrid = new SalesListGrid($scope, '#saleslist_grid');
        jQuery("#saleslist_grid").jqGrid('bindKeys');

        $scope.productListGrid = new ProductListGrid($scope, '#productlist_grid');
        jQuery("#productlist_grid").jqGrid('bindKeys');

        $scope.productCategoryListGrid = new ProductCategoryListGrid($scope, '#productcategorylist_grid');
        jQuery("#productcategorylist_grid").jqGrid('bindKeys');

        $scope.columnList = new ColumnList($scope, '#column_grid');
        jQuery("#column_grid").jqGrid('bindKeys');

        hideTableHeader("#order_output_data_grid");
        hideTableHeader("#order_footnote_data_grid");
        hideTableHeader("#product_total_grid");
        hideTableHeader("#product_sellprice_grid");

        $("#product_grid").parents('div.ui-jqgrid-bdiv').css("max-height", "200px");
        $("#product_grid_with_tooling").parents('div.ui-jqgrid-bdiv').css("max-height", "200px");

        $("#product_grid").parents('div.ui-jqgrid-bdiv').css("overflow-y", "scroll");
        $("#product_grid_with_tooling").parents('div.ui-jqgrid-bdiv').css("overflow-y", "scroll");

        $("#column_grid").parents('div.ui-jqgrid-bdiv').css("overflow-y", "scroll");

        $('#order_grid').setGridWidth($('#order_grid_wrapper').width()/* * .99*/);

        $scope.calendarNavigation = new DayPilot.Navigator("calendarnavigation");
        $scope.calendarNavigation.showMonths = 2;
        $scope.calendarNavigation.selectMode = "month";
        $scope.calendarNavigation.onTimeRangeSelected = function (args) {
            $scope.dp.startDate = args.start;
            $scope.dp.update();
            $("#calendarmonth").html(args.day.toString("MMMM yyyy"));
        };
        $scope.calendarNavigation.init();

        $scope.dp = new DayPilot.Month("calendarscreen");

        let today = new Date();
        $scope.dp.startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0).toISOString();

        //// event creating
        //dp.onTimeRangeSelected = function (args) {
        //    var name = prompt("New event name:", "Event");
        //    dp.clearSelection();
        //    if (!name) return;
        //    var e = new DayPilot.Event({
        //        start: args.start,
        //        end: args.end,
        //        id: DayPilot.guid(),
        //        text: name
        //    });
        //    dp.events.add(e);
        //};

        //dp.onEventClicked = function (args) {
        //    alert("clicked: " + args.e.id());
        //};

        $scope.events = [];

        $scope.dp.init();
        $("#calendarmonth").html(new DayPilot.Date().toString("MMMM yyyy"));

        $scope.views = $scope.getViews();
        $scope.currentView = $cookies.get("bystronic_current_view");
        if (!_.find($scope.views, function (v) { return v.Name == $scope.currentView; })) {
            $scope.currentView = $scopeViews[0].Name;
        }
        $scope.columns = getViewByName($scope.currentView).Columns.split(',');

        onOrderGridStructureChanged();

        reloadData();

        $scope.lastAccessTime = new Date();
        $scope.interval = $interval(function () {
            if (new Date() - $scope.lastAccessTime >= $scope.settings.IdleTimeout * 60 * 1000) $scope.logOut();
        }, 15000);

        $scope.isFilterPanelExpanded = false;

//        $("#view-list").sortable({
//            stop: function (event, ui) {
//                let sortedViewIds = $("#view-list").sortable("toArray").join(',');
////                alert(sortedIDs);
//                Connection.saveViews($scope.user, sortedViewIds,
//                    function (response) {
//                        $scope.views = response.Data.Views;
//                    },
//                    function (errorMessage) {
//                        showError(errorMessage);
//                    }
//                );
//            }
//        });
//        $("#view-list").disableSelection();

    };

    $('#filterPanel').on('hide.bs.collapse', function () {
        $scope.isFilterPanelExpanded = false;
        layoutOrderGrid();
    });

    $('#filterPanel').on('shown.bs.collapse', function () {
        $scope.isFilterPanelExpanded = true;
        layoutOrderGrid();
    });

    $('body').on("click mousemove keyup", function () {
        $scope.lastAccessTime = new Date(); // wake up from idle state
    });

    $('.date').datepicker({
        allowDeselection: false,
        keyboardNavigation: true,
        forceParse: false,
        calendarWeeks: true,
        format: "mm/dd/yy",
        todayBtn: false,
        autoclose: true,
        todayHighlight: true
    });

    $('.currency').inputmask("numeric", {
        radixPoint: ".",
        groupSeparator: ",",
        digits: 2,
        autoGroup: true,
        prefix: '$', //No Space, this will truncate the first character
        rightAlign: false,
        autoUnmask: true,
        oncleared: function () { self.Value(''); }
    });

    $('.percent').inputmask("numeric", {
        radixPoint: ".",
        groupSeparator: ",",
        digits: 2,
        autoGroup: true,
        suffix: '%', //No Space, this will truncate the first character
        rightAlign: false,
        autoUnmask: true,
        oncleared: function () { self.Value(''); }
    });

    $('.dropdown-submenu a').click(function (e) {
        e.stopPropagation();
    });

    reloadData = function () {
        $scope.loaded = false;

        Connection.getData($scope.user,
            function (response) {
                //response = unzipData(response);

                if (response.Status == true) {
                    $scope.customers = response.Data.Customers;

                    $scope.products = response.Data.Products;
                    $scope.productCategories = response.Data.ProductCategories;
                    $scope.payments = response.Data.Payments;
                    $scope.regionalManagers = response.Data.RegionalManagers;
                    $scope.orders = response.Data.Orders;

                    $.each($scope.orders, function (index, order) {
                        normalizeOrder(order);
                    });
                    $.each($scope.customers, function (index, customer) {
                        normalizeCustomer(customer);
                    });

                    markDatesInCalendar();

                    layoutOrderGrid();
                    $scope.orderGrid.updateData($scope.orders, $scope.filter);
                    $scope.loaded = true;
                }
                else {
                    showError(response.Data.Error);
                    $scope.loaded = true;
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

    markDatesInCalendar = function () {
        for (let event of $scope.events) {
            $scope.dp.events.remove(event);
        }
        $scope.events = [];
        
        for (let order of $scope.orders) {
            markDateInCalendar(`${order.EquipmentNumber}: Delivery Date`, order.DeliveryDate);
            markDateInCalendar(`${order.EquipmentNumber}: Ship Date`, order.ShipDate);
            markDateInCalendar(`${order.EquipmentNumber}: Port Date`, order.PortDate);
            markDateInCalendar(`${order.EquipmentNumber}: Mfg Date`, order.MfgDate);
            markDateInCalendar(`${order.EquipmentNumber}: Install Date`, order.InstallDate);
            markDateInCalendar(`${order.EquipmentNumber}: 1st Installment Date`, order.FirstInstallDate);
            markDateInCalendar(`${order.EquipmentNumber}: 2nd Installment Date`, order.SecondInstallDate);
            markDateInCalendar(`${order.EquipmentNumber}: Final Installment Date`, order.FinalInstallDate);
        }
    }

    markDateInCalendar = function (name, date) {
        if (!name || !date)
            return;
        let event = new DayPilot.Event({
            start: new DayPilot.Date(date),
            end: new DayPilot.Date(date),
            id: DayPilot.guid(),
            text: name
        });
        $scope.dp.events.add(event);
        $scope.events.push(event);
    }

    $(window).bind('resize', function () {
        $('#order_grid').setGridWidth($('#order_grid_wrapper').width()/* * .99*/);
        $('#order_grid').trigger("reloadGrid");
    });

    showError = function (error) {
        if (typeof error === "string")
            $scope.error = { Message: error };
        else
            $scope.error = { Message: error.Message, Details: error.Details };
        $("#error").modal({ 'backdrop': 'static' });
        $("#error").draggable({ handle: ".modal-dialog", cursor: "move" });
        $timeout(function () { $scope.$apply(); });
    };

    layoutOrderGrid = function () {
        let gridHeight = $scope.isFilterPanelExpanded ? "45vh" : "65vh";
        $("#order_grid").parents('div.ui-jqgrid-bdiv').css("max-height", gridHeight);
    };

/////////////////////////////    O R D E R S    ////////////////////////////////////////////////////////////////////////////////

    onOrderDoubleClicked = function (orderId) {
        $scope.order = findOrderFor(orderId);
        $scope.editOrder();
    };

    $scope.newOrder = function () {
        Connection.createOrder($scope.user, 
            function (response) {
                if (response.Status == true) {
                    $scope.order = normalizeOrder(response.Data.Order);
                    $scope.editOrder(true);
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

    $scope.editOrder = function (isNewOrder) {
        $scope.isNewOrder = isNewOrder === true;
        $scope.tmpOrder = $.extend(true, {}, $scope.order); // deep copy

        $scope.tmpOrder.DateAddedString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.DateAdded);
        $('#dateadded').datepicker('setDate', $scope.tmpOrder.DateAddedString);
        $scope.tmpOrder.DateJoinedString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.DateJoined);
        $('#datejoined').datepicker('setDate', $scope.tmpOrder.DateJoinedString);
        $scope.tmpOrder.PortDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.PortDate);
        $('#portdate').datepicker('setDate', $scope.tmpOrder.PortDateString);
        $scope.tmpOrder.DeliveryDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.DeliveryDate);
        $('#deliverydate').datepicker('setDate', $scope.tmpOrder.DeliveryDateString);
        $scope.tmpOrder.InstallDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.InstallDate);
        $('#installdate').datepicker('setDate', $scope.tmpOrder.InstallDateString);
        $scope.tmpOrder.CourseDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.CourseDate);
        $('#coursedate').datepicker('setDate', $scope.tmpOrder.CourseDateString);
        $scope.tmpOrder.MfgDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.MfgDate);
        $('#mfgdate').datepicker('setDate', $scope.tmpOrder.MfgDateString);
        $scope.tmpOrder.ShipDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.ShipDate);
        $('#shipdate').datepicker('setDate', $scope.tmpOrder.ShipDateString);

        $scope.tmpOrder.FirstInstallDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.FirstInstallDate);
        $('#firstinstalldate').datepicker('setDate', $scope.tmpOrder.FirstInstallDateString);
        $scope.tmpOrder.SecondInstallDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.SecondInstallDate);
        $('#secondinstalldate').datepicker('setDate', $scope.tmpOrder.SeconsInstallDateString);
        $scope.tmpOrder.FinalInstallDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.FinalInstallDate);
        $('#finalinstalldate').datepicker('setDate', $scope.tmpOrder.FinalInstallDateString);

        $("#orderContent").modal({ 'backdrop': 'static' });
        $("#orderContent").draggable({ handle: ".modal-header", cursor: "move" });

        let product = _.find($scope.products, function (p) { return p.Id == $scope.tmpOrder.ProductId; });
        $scope.tmpOrder.CategoryId = _.find($scope.productCategories, function (p) { return p.Id == product.CategoryId; }).Id;

        $timeout(function () { $scope.$apply(); });
    }

    $scope.payRSMCommissionToggled = function () {
        $scope.orderOutputDataGrid.updateData($scope.tmpOrder);
    }

    $scope.saveOrderOrComment = function () {
        if ($scope.canSaveOrder())
            $scope.saveOrder();
        else
            $scope.saveOrderComment();
    }

    $scope.saveOrder = function () {
        $scope.orderOutputDataGrid.stopEdit();

        if ($scope.tmpOrder.CustomerID == -1) {
            showError("Please select a Customer.")
            return;
        }
        if ($scope.tmpOrder.ProductID == -1) {
            showError("Please select a Customer.")
            return;
        }

        if (!$scope.tmpOrder.EquipmentNumber) {
            showError("Please enter Equipment Number.")
            return;
        }
        else {
            // check if order with the same PO Number exists
            if (_.findIndex($scope.orders, function (order) { return order.EquipmentNumber == $scope.tmpOrder.EquipmentNumber && order.Id != $scope.tmpOrder.Id; }) != -1) {
                showError("Order with the Equipment Number " + $scope.tmpOrder.EquipmentNumber + " already exists. Please enter a different value.")
                return;
            }
        }

        $scope.tmpOrder.DateAdded = $scope.tmpOrder.DateAddedString;// =$scope.order.OrderDate instanceof Date ? $.datepicker.formatDate('mm/dd/y', $scope.order.OrderDate) : $scope.order.OrderDate;
        $scope.tmpOrder.DateJoined = $scope.tmpOrder.DateJoinedString;
        $scope.tmpOrder.PortDate = $scope.tmpOrder.PortDateString;

        $scope.tmpOrder.DeliveryDate = $scope.tmpOrder.DeliveryDateString;
        $scope.tmpOrder.InstallDate = $scope.tmpOrder.InstallDateString;
        $scope.tmpOrder.CourseDate = $scope.tmpOrder.CourseDateString;
        $scope.tmpOrder.MfgDate = $scope.tmpOrder.MfgDateString;
        $scope.tmpOrder.ShipDate = $scope.tmpOrder.ShipDateString;

        $("#orderContent").modal('hide');

        Connection.saveOrder($scope.user, $scope.tmpOrder,
            function (response) {
                if (response.Status == true) {
                   //$("#orderContent").modal('hide');
                    $scope.order = normalizeOrder(response.Data.Order);
                    var index = _.findIndex($scope.orders, function (order) { return order.Id == $scope.order.Id; });
                    if(index >= 0)
                        $scope.orders[index] = $scope.order;
                    else {
                        $scope.orders.push($scope.order);
                    }

                    $scope.orderGrid.updateData($scope.orders, $scope.filter);
                    $('#order_grid').setGridWidth($('#order_grid_wrapper').width()/* * 0.99*/);
                    layoutOrderGrid();
                    markDatesInCalendar();
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

    $scope.saveOrderComment = function () {
        Connection.saveOrder($scope.user, $scope.tmpOrder,
            function (response) {
                if (response.Status == true) {
                    $("#orderContent").modal('hide');
                    $scope.order = normalizeOrder(response.Data.Order);
                    var index = _.findIndex($scope.orders, function (order) { return order.Id == $scope.order.Id; });
                    $scope.orders[index] = $scope.order;
                    $scope.orderGrid.updateData($scope.orders, $scope.filter);
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

    $scope.deleteOrder = function (order) {
        Connection.deleteOrder($scope.user, order,
            function (response) {
                if (response.Status == true) {
                    var index = _.findIndex($scope.orders, function (o) { return o.Id == order.Id; });
                    $scope.orders.splice(index, 1);
                    $scope.order = index < $scope.orders.length ? $scope.orders[index] : null;
                    $scope.orderGrid.updateData($scope.orders, $scope.filter);
                    $('#order_grid').setGridWidth($('#order_grid_wrapper').width()/* * 0.99*/);
                    layoutOrderGrid();
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

    updateOrderData = function (order, notify) {
        $scope.tmpOrder = order;
        $scope.tmpOrder.OrderDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.OrderDate);
        $scope.tmpOrder.EstimatedShipDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.EstimatedShipDate);
        $scope.tmpOrder.FinalPaymentDateString = $.datepicker.formatDate('mm/dd/y', $scope.tmpOrder.FinalPaymentDate);
        $scope.orderInputDataGrid.updateData(order);
        $scope.orderOutputDataGrid.updateData(order);
        $timeout(function () { $scope.$apply(); });
    }

    onProductSelected = function (orderItems) {
        $scope.productTotalGrid.updateData(orderItems);
    }

    findOrderFor = function (orderId) {
        return _.find($scope.orders, function (o) { return o.Id == orderId; });
    }

    isNewOrder = function (order) {
        return _.find($scope.orders, function (o) { return o.Id == order.Id; }) == null;
    }

    $scope.isAdministrator = function () {
        return $scope.user.Role == $scope.roles.administrator;
    }

    $scope.canEditOrder = function () {
        if (!$scope.tmpOrder) return false;
        return true; //($scope.permissions.CanEditOrder || $scope.permissions.CanApproveOrder) && $scope.tmpOrder.Status == $scope.statuses.pending;
    }

    $scope.canApproveOrder = function () {
        if (!$scope.tmpOrder) return false;
        return $scope.permissions.CanApproveOrder && $scope.tmpOrder.Status == $scope.statuses.pending && !isNewOrder($scope.tmpOrder);
    }

    $scope.canEditCommissions = function () {
        if (!$scope.tmpOrder) return false;
        return $scope.permissions.CanEditOrder && $scope.tmpOrder.Status == $scope.statuses.pending;
    }

    $scope.canUndoApproveOrder = function () {
        if (!$scope.tmpOrder) return false;
        return $scope.tmpOrder.Status == $scope.statuses.approved && (($scope.permissions.CanApproveOrder && $scope.tmpOrder.ApprovedBy == $scope.user.Name) || $scope.permissions.CanEditOrder);
    }

    $scope.canReleaseOrder = function () {
        if (!$scope.tmpOrder) return false;
        return $scope.permissions.CanReleaseOrder && $scope.tmpOrder.Status == $scope.statuses.approved && $scope.tmpOrder.ApprovedBy != $scope.user.Name;
    }

    $scope.canUndoReleaseOrder = function () {
        if (!$scope.tmpOrder) return false;
        return $scope.tmpOrder.Status == $scope.statuses.released && (($scope.permissions.CanReleaseOrder &&  $scope.tmpOrder.ReleasedBy == $scope.user.Name) || $scope.permissions.CanEditOrder);
    }

    $scope.canMarkPaidOrder = function () {
        if (!$scope.tmpOrder) return false;
        return $scope.permissions.CanPayOrder && $scope.tmpOrder.Status == $scope.statuses.released;
    }

    $scope.canUndoMarkPaidOrder = function () {
        if (!$scope.tmpOrder) return false;
        return $scope.permissions.CanPayOrder && $scope.tmpOrder.Status == $scope.statuses.paid;
    }

    $scope.canSaveOrder = function () {
        if (!$scope.tmpOrder) return false;
        return $scope.canEditOrder();
    }

    $scope.showSalesmenList = function () {
        $scope.salesmenListGrid.updateData($scope.salesmen);
        $("#salesmenList").modal({ 'backdrop': 'static' });
        $("#salesmenList").draggable({ handle: ".modal-header", cursor: "move" });
    }

    $scope.showSalesList = function () {
        $scope.salesListGrid.updateData($scope.salesmen, $scope.selectedYear);
        $("#salesList").modal({ 'backdrop': 'static' });
        $("#salesList").draggable({ handle: ".modal-header", cursor: "move" });
    }

    $scope.showCustomerList = function () {
        $scope.customerListGrid.updateData($scope.customers);
        $("#customerList").modal({ 'backdrop': 'static' });
        //$("#customerList").position({ my: "center bottom", at: "center bottom", of: window });
        $("#customerList").draggable({ handle: ".modal-header", cursor: "move" });
    }

    $scope.showProductList = function () {
        $scope.productListGrid.updateData($scope.products);
        $("#productList").modal({ 'backdrop': 'static' });
        $("#productList").draggable({ handle: ".modal-header", cursor: "move" });
    }

    $scope.showProductCategoryList = function () {
        $scope.productCategoryListGrid.updateData($scope.productCategories);
        $("#productCategoryList").modal({ 'backdrop': 'static' });
        $("#productCategoryList").draggable({ handle: ".modal-header", cursor: "move" });
    }

    $scope.showSettings = function () {
        $scope.tmpSettings = $.extend(true, {}, $scope.settings);
        $("#settingsDialog").modal({ 'backdrop': 'static' });
        $("#settingsDialog").draggable({ handle: ".modal-header", cursor: "move" });
    }

    $scope.saveSettings = function () {
        if (isNaN($scope.tmpSettings.IdleTimeout) || $scope.tmpSettings.IdleTimeout < 1 || $scope.tmpSettings.IdleTimeout > 60) {
            showError('Please enter valid timeout interval.');
            return;
        }
        $("#settingsDialog").modal('hide');
        saveCookie($cookies, "bystronic_client_settings", JSON.stringify($scope.settings = $scope.tmpSettings));
    }

    $scope.logOut = function () {
        window.location.replace("login.html");
    }
    $scope.clearOrderFilters = function () {
        $scope.filter = { Region: null, Product: null, StartDeliveryDate: null, EndDeliveryDate: null, StartShipDate: null, EndShipDate: null, StartMfgDate: null, EndMfgDate: null, StartInstallDate: null, EndInstallDate: null };
        $timeout(function () { $scope.$apply(); });
    }

    $scope.clearOrderFilter = function (field) {
        if (field == 'region') {
            $scope.filter.Region = null;
            $scope.filteredSalesmen = $scope.salesmen;
        }
        else if (field == 'product')
            $scope.filter.Product = null;
        else if (field == 'daterange') {
            $scope.filter.StartDeliveryDate = null;
            $scope.filter.EndDeliveryDate = null;
            $scope.filter.StartShipDate = null;
            $scope.filter.EndShipDate = null;

            $scope.filter.StartMfgDate = null;
            $scope.filter.EndMfgDate = null;
            $scope.filter.StartInstallDate = null;
            $scope.filter.EndInstallDate = null;
        }
        else
            $scope.clearOrderFilters();
        $scope.filterChanged();
    }

    //$scope.regionFilterChanged = function () {
    //    $scope.filteredSalesmen = _.filter($scope.salesmen, function (s) {
    //        if ($scope.filter.Region) {
    //            var isFound = false;
    //            $.each($scope.filter.Region, function (index, region) {
    //                if (s.Region == region) {
    //                    isFound = true;
    //                    return;
    //                }
    //            });
    //            return isFound;
    //        }
    //        else 
    //            return true;
    //    });
    //    $scope.filterChanged();
    //}

    $scope.filterChanged = function () {
        $scope.orderGrid.updateData($scope.orders, $scope.filter);
        $('#order_grid').setGridWidth($('#order_grid_wrapper').width()/* * 0.99*/);
        $("#order_grid").parents('div.ui-jqgrid-bdiv').css("max-height", '45vh');
    };

    $scope.getRegion = function (order) {
        let regionalManagerId = _.find($scope.customers, function (c) { return c.Id == order.CustomerId; }).RegionalManagerId;
        return $scope.regions[regionalManagerId - 1];
    };

    $scope.getProductCategoryType = function (order) {
        let product = _.find($scope.products, function (p) { return p.Id == order.ProductId; });
        let categoryTypeId = _.find($scope.productCategories, function (p) { return p.Id == product.CategoryId; }).TypeId;
        return $scope.categoryTypes[categoryTypeId - 1];
    };

    //$scope.salesmanSelectionChanged = function () {
    //    if ($scope.tmpOrder.Salesman == $scope.tmpOrder.Salesman2) {
    //        showError("Dealer / DSE cannot split order with himself.")
    //        return;
    //    }
    //    if ($scope.tmpOrder.TotalListPrice > 0)
    //        $scope.calculateOrder($scope.tmpOrder, updateOrderData);
    //};

    //$scope.customerSelectionChanged = function () {
    //    if (!$scope.tmpOrder) return;
    //    if ($scope.tmpOrder.CustomerID == 999) { // Add customer
    //        $scope.editCustomerDialog({ RegionalManagerId: 0, Name: '', City: '', State: '', SapNumber: '', Status: 'Active', isNew: true });
    //    }
    //    else {
    //        $scope.tmpOrder.TrackingNumber = _.find($scope.customers, function (c) { return c.ID == $scope.tmpOrder.CustomerID; }).SapNumber;
    //    }
    //};


 /////////////////////////////    G R I D  C O L U M N S   /////////////////////////////////////////////////////////////////////////

    $scope.changeOrderView = function (view) {
        if (view.Name === $scope.currentView)
            return;

        if (view.Type === 'Calendar') {
            $scope.currentView = view.Name;
            saveCookie($cookies, "bystronic_current_view", $scope.currentView);
        }
        else if (view.Type === 'Training') {
            $scope.currentView = view.Name;
            saveCookie($cookies, "bystronic_current_view", $scope.currentView);
        }
        else
        {
            $scope.currentView = view.Name;
            $scope.columns = view.Columns.split(',');
            saveCookie($cookies, "bystronic_current_view", $scope.currentView);
            $timeout(function () { $scope.$apply(); onOrderGridStructureChanged(); });
        }
    };

    $scope.deleteOrderView = function (view) {
        showYesNoMessage('View', 'Do you want to delete view ' + $scope.currentView + '?',
            function () {
                Connection.deleteView($scope.user, $scope.currentView,
                    function (response) {
                        if (response.Status == true) {
                            deleteViewByName($scope.currentView);
                            $scope.changeOrderView(getDefaultView());
                        }
                        else {
                            showError(response.Data.Error);
                        }
                    },
                    function (errorMessage) {
                        showError(errorMessage);
                    }
                );
            }
        );
        if (view.Name !== $scope.currentView) {
            $scope.currentView = view.Name;
            $scope.columns = view.Columns.split(',');
            onOrderGridStructureChanged();
        }
    };

    onOrderGridStructureChanged = function () {
        if (getCurrentView().Type == 'Order') {
            // reload order table
            $("#order_grid").GridUnload();
            $scope.orderGrid = new OrderGrid($scope, '#order_grid', onOrderDoubleClicked);
            jQuery("#order_grid").jqGrid('bindKeys');

            $('#order_grid').setGridWidth($('#order_grid_wrapper').width()/* * 0.99*/);
            layoutOrderGrid();
            $scope.orderGrid.updateData($scope.orders, $scope.filter);
        }
    };

    getViewByName = (name) => _.find($scope.views, function (v) { return v.Name == name; });

    getDefaultView = () => getViewByName('Default');

    getCurrentView = () => getViewByName($scope.currentView);

    viewExists = (name) => getViewByName(name) != null;

    deleteViewByName = (name) => {
        let view = getViewByName(name);
        if (view) $scope.views = _.without($scope.views, view);
    };

    $scope.getDefaultColumns = () => ['EquipmentNumber', 'PONumber', 'ProductName', 'CustomerName', 'Category', 'SaleAmount', 'SaleOrderNumber'];

    $scope.getViews = () => [
        { Name: 'Calendar', Columns: '', Type: 'Calendar' },
        { Name: 'Equipment Number', Columns: 'EquipmentNumber,CustomerName,SapNumber,PONumber,DeliveryDate,Options,PortDate', Type: 'Order' },
        { Name: 'Stock Forecast', Columns: 'EquipmentNumber,CustomerName,ProductName,MfgDate,ProductionWeek,PortDate,DeliveryDate,Status', Type: 'Order' },
        { Name: 'Schedule', Columns: 'EquipmentNumber,CustomerName,SaleOrderNumber,ProductName,PortDate,DeliveryDate,InstallDate,Comments', Type: 'Order' },
        { Name: 'Freight', Columns: 'EquipmentNumber,CustomerName,ForwarderNumber,Port,PortDate,KNumber,ProductName', Type: 'Order' },
        { Name: 'Machine 2nd Payment', Columns: 'EquipmentNumber,CustomerName,SaleOrderNumber,SaleAmount,DeliveryDate,FirstInstallment,SecondInstallment,FinalInstallment,InstallmentTerm,InstallmentNote', Type: 'Order' },
        { Name: 'Backlog', Columns: 'DeliveryDate,EquipmentNumber,CustomerName,Category,ProductName,SaleAmount,SaleOrderNumber', Type: 'Order' },
        { Name: 'Training', Columns: '', Type: 'Training'}
    ];

    $scope.getAllAvailableColumns = () => _.pluck($scope.availableColumns, 'ID');

    $scope.availableColumns = [
        { ID: 'PONumber', Name: 'PO Number' },
        { ID: 'CustomerName', Name: 'Customer Name' },
        { ID: 'SapNumber', Name: 'SAP Number' },
        { ID: 'DateAdded', Name: 'Date Added' },
        //{ ID: 'CourseNumber', Name: 'Course Number' },
        //{ ID: 'CourseName', Name: 'Course Name' },
        //{ ID: 'CourseDate', Name: 'Course Date' },
        //{ ID: 'SeatsPurchased', Name: 'Seats Purchased' },
        //{ ID: 'SeatsUsed', Name: 'Seats Used' },
        { ID: 'ProductName', Name: 'Product Name' },
        { ID: 'EquipmentNumber', Name: 'Equipment #' },
        { ID: 'Category', Name: 'Category' },
        { ID: 'SaleAmount', Name: 'Sale Amount' },
        { ID: 'SaleOrderNumber', Name: 'Sale Order #' },
        { ID: 'PortDate', Name: 'Port Date' },
        { ID: 'DeliveryDate', Name: 'Delivery Date' },
        { ID: 'InstallDate', Name: 'Install Date' },
        { ID: 'Shipped', Name: 'Shipped' },
        { ID: 'ShipDate', Name: 'Ship Date' },
        { ID: 'ProductionWeek', Name: 'Production Week' },
        { ID: 'Port', Name: 'Port' },
        { ID: 'MfgDate', Name: 'MFG Date' },
        { ID: 'ForwarderNumber', Name: 'Forwarder #' },
        { ID: 'KNumber', Name: 'K #' },
        { ID: 'Comments', Name: 'Comments' },
        { ID: 'Options', Name: 'Options' },
        { ID: 'Status', Name: 'Status' },
        { ID: 'FirstInstallment', Name: '1st Installment Amount & Date' },
        { ID: 'SecondInstallment', Name: '2nd Installment Amount & Date' },
        { ID: 'FinalInstallment', Name: 'Final Installment Amount & Date' },
        { ID: 'InstallmentTerm', Name: 'Installment Term' },
        { ID: 'InstallmentNote', Name: 'Installment Note' },
    ];

    $scope.getColumnHeaderFor = function (columnID) {
        return _.find($scope.availableColumns, function (c) { return c.ID == columnID; }).Name;
    };

    $scope.getColumnNameFor = function (columnHeader) {
        return _.find($scope.availableColumns, function (c) { return c.Name == columnHeader; }).ID;
    };

    $scope.editColumnsDialog = function () {
        $scope.columnList.updateData($scope.columns);
        $scope.newView = $scope.currentView;
        $("#columnList").modal({ 'backdrop': 'static' });
        $("#columnList").draggable({ handle: ".modal-header", cursor: "move" });
        $timeout(function () { $scope.$apply(); });
    }

    $scope.saveColumns = function () {
        $scope.columns = $scope.columnList.getSelectedColumns();
        var columnsAsString = $scope.columns.join(',');
        Connection.saveColumns($scope.user, $scope.currentView, $scope.newView, columnsAsString,
            function (response) {
                if (response.Status == true) {
                    if (viewExists($scope.newView)) {
                        getViewByName($scope.newView).Columns = columnsAsString;
                    }
                    else {
                        $scope.views.push({ Name: $scope.newView, Columns: columnsAsString });
                    }
                    $scope.currentView = $scope.newView;
                    $("#columnList").modal('hide');
                    onOrderGridStructureChanged();
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    };

    $scope.saveColumnsAfterDragAndDrop = function () {
        var columnsAsString = $scope.columns.join(',');
        Connection.saveColumns($scope.user, $scope.currentView, $scope.currentView, columnsAsString,
            function (response) {
                if (response.Status == true) {
                    getCurrentView().Columns = columnsAsString;
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

 /////////////////////////////    S A L E S M E N   ////////////////////////////////////////////////////////////////////////////////

    $scope.editSalesmanDialog = function (salesman) {
        $scope.newSalesman = salesman ? salesman : { ID: '', Name: '', Role: '', Region: '', isNew: true };
        $scope.salesmanID = $scope.newSalesman.ID;

        $("#addSalesman").modal({ 'backdrop': 'static' });
        $("#addSalesman").draggable({ handle: ".modal-header", cursor: "move" });
        $timeout(function () {
            $scope.salesGoalSelectionChanged($scope.newSalesman.ID);
            $scope.$apply();
        });
    }

    $scope.addSalesman = function () {
        $scope.updateSalesman($scope.newSalesman);
    }

    $scope.updateSalesman = function (salesman) {
        if (!salesman.ID) {
            showError("Please enter Dealer / DSE Login.")
            return;
        }
        if (!salesman.Name) {
            showError("Please enter Dealer / DSE Name.")
            return;
        }
        if (!salesman.Role) {
            showError("Please select Dealer / DSE Role.")
            return;
        }
        if (!salesman.Region) {
            showError("Please select Dealer / DSE Region.")
            return;
        }

        if (salesman.isNew) {
            if (_.find($scope.salesmen, function (s) { return s.ID == $scope.newSalesman.ID; }) != null) {
                showError("Deale / DSE with login " + $scope.newSalesman.ID + " already exists.")
                return;
            }
            if (_.find($scope.salesmen, function (s) { return s.Name == $scope.newSalesman.Name; }) != null) {
                showError("Deale / DSE with name " + $scope.newSalesman.Name + " already exists.")
                return;
            }
            Connection.addSalesman($scope.user, salesman,
                function (response) {
                    if (response.Status == true) {
                        $scope.salesmen = response.Data.Salesmen;
                        $scope.Salesman2_NA = { ID: "NA", Name: " N/A", Role: "RSM" };
                        $scope.salesmen2 = $.merge($.merge([], [$scope.Salesman2_NA]), $scope.salesmen);
                        $scope.filteredSalesmen = _.filter($scope.salesmen, function (s) { return s.Region == $scope.filter.Region; });
                        $scope.salesmenListGrid.updateData($scope.salesmen);
                        $("#addSalesman").modal('hide');
                    }
                    else {
                        showError(response.Data.Error);
                    }
                },
                function (errorMessage) {
                    showError(errorMessage);
                }
            );
        }
        else {
            Connection.updateSalesman($scope.user, $scope.salesmanID, salesman,
                function (response) {
                    if (response.Status == true) {
                        $scope.salesmen = response.Data.Salesmen;
                        $scope.Salesman2_NA = { ID: "NA", Name: " N/A", Role: "RSM" };
                        $scope.salesmen2 = $.merge($.merge([], [$scope.Salesman2_NA]), $scope.salesmen);
                        $scope.filteredSalesmen = _.filter($scope.salesmen, function (s) { return s.Region == $scope.filter.Region; });
                        $scope.salesmenListGrid.updateData($scope.salesmen);
                        $("#addSalesman").modal('hide');
                    }
                    else {
                        showError(response.Data.Error);
                    }
                },
                function (errorMessage) {
                    showError(errorMessage);
                }
            );
        }
    }

    $scope.deleteSalesman = function (salesman) {
        if (_.find($scope.orders, function (o) { return o.Salesman == salesman.ID || o.Salesman2 == salesman.ID; }) != null) {
            showError("Cannot delete " + salesman.Name + ", because orders for this Dealer / DSE exist.");
            return;
        }
        Connection.deleteSalesman($scope.user, salesman,
            function (response) {
                if (response.Status == true) {
                    $scope.salesmen = response.Data.Salesmen;
                    $scope.Salesman2_NA = { ID: "NA", Name: " N/A", Role: "RSM" };
                    $scope.salesmen2 = $.merge($.merge([], [$scope.Salesman2_NA]), $scope.salesmen);
                    $scope.filteredSalesmen = _.filter($scope.salesmen, function (s) { return s.Region == $scope.filter.Region; });
                    $scope.salesmenListGrid.updateData($scope.salesmen);
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

 /////////////////////////////    C U S T O M E R S   ////////////////////////////////////////////////////////////////////////////////

    $scope.editCustomerDialog = function (customer) {
        $scope.newCustomer = customer ? customer : { RegionalManagerId: 0, Name: '', City: '', State: '', DateJoinedString: '', SapNumber: '', Status: 'Active', isNew: true };
        $scope.newCustomer.DateJoinedString = $.datepicker.formatDate('mm/dd/y', $scope.newCustomer.DateJoined);

        $("#addCustomer").modal({ 'backdrop': 'static' });
        $("#addCustomer").draggable({ handle: ".modal-header", cursor: "move" });
        $timeout(function () { $scope.$apply(); });
    }

    $scope.addCustomer = function () {
        $scope.updateCustomer($scope.newCustomer);
    }

    $scope.updateCustomer = function (customer) {
        if (!customer.RegionalManager) {
            showError("Please enter Regional Manager.")
            return;
        }
        if (!customer.Name) {
            showError("Please enter Customer Name.")
            return;
        }
        if (!customer.SapNumber) {
            showError("Please enter Customer SAP Number.")
            return;
        }
        if (!customer.City) {
            showError("Please enter Customer City.")
            return;
        }
        if (!customer.State) {
            showError("Please enter Customer State/Province.")
            return;
        }
        if (!customer.DateJoinedString) {
            showError("Please enter Customer Join Date.")
            return;
        }
        if (!customer.Status) {
            showError("Please enter Customer Status.")
            return;
        }

        if (customer.isNew) {
            if (_.find($scope.customers, function (c) { return c.Name == $scope.newCustomer.Name; }) != null) {
                showError("Customer " + $scope.newCustomer.Name + " already exists.")
                return;
            }
            if (_.find($scope.customers, function (c) { return c.SapNumber == $scope.newCustomer.SapNumber; }) != null) {
                showError("Customer with SAP Number " + $scope.newCustomer.SapNumber + " already exists.")
                return;
            }
            customer.DateJoined = customer.DateJoinedString;
            customer.RegionalManagerId = _.findIndex($scope.regions, function (region) { return region == customer.RegionalManager; }) + 1; 

            Connection.addCustomer($scope.user, customer,
                function (response) {
                    if (response.Status == true) {
                        $scope.customers = response.Data.Customers;
                        $.each($scope.customers, function (index, customer) {
                            normalizeCustomer(customer);
                        });
                        $scope.tmpCustomers = _.sortBy($.extend(true, [], $scope.customers), 'Name');
                        $scope.customerListGrid.updateData($scope.customers);
                        $("#addCustomer").modal('hide');
                    }
                    else {
                        showError(response.Data.Error);
                    }
                },
                function (errorMessage) {
                    showError(errorMessage);
                }
            );
        }
        else {
            Connection.updateCustomer($scope.user, customer,
                function (response) {
                    if (response.Status == true) {
                        $scope.customers = response.Data.Customers;
                        $.each($scope.customers, function (index, customer) {
                            normalizeCustomer(customer);
                        });
                        $scope.tmpCustomers = _.sortBy($.extend(true, [], $scope.customers), 'Name');
                        $scope.customerListGrid.updateData($scope.customers);
                        $("#addCustomer").modal('hide');
                    }
                    else {
                        showError(response.Data.Error);
                    }
                },
                function (errorMessage) {
                    showError(errorMessage);
                }
            );
        }
    }

    $scope.deleteCustomer = function (customer) {
        if (_.find($scope.orders, function (o) { return o.CustomerID == customer.Id; }) != null) {
            showError("Cannot delete " + customer.Name + ", because orders for this customer exist.");
            return;
        }
        Connection.deleteCustomer($scope.user, customer,
            function (response) {
                if (response.Status == true) {
                    $scope.customers = response.Data.Customers;
                    $scope.customerListGrid.updateData($scope.customers);
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

 /////////////////////////////    P R O D U C T S   ////////////////////////////////////////////////////////////////////////////////

    $scope.addProductDialog = function () {
        $scope.editProductDialog({ Name: '', Type: 0, Value: 0.00, ProductTypeID: $scope.tmpOrder.TemplateID, isNew: true, addInline: true });
    }
    
    $scope.editProductDialog = function (product) {
        $scope.newProduct = product ? product : { Name: '', EquipmentNumber: '', CategoryId: 0, Status: 'Active', isNew: true };
        $("#addProduct").modal({ 'backdrop': 'static' });
        $("#addProduct").draggable({ handle: ".modal-header", cursor: "move" });
        $timeout(function () { $scope.$apply(); });
    }

    $scope.addProduct = function () {
        $scope.updateProduct($scope.newProduct);
    }

    $scope.updateProduct = function (product) {
        if (!product.Name) {
            showError("Please enter Product Name.")
            return;
        }
        if (product.ProductTypeID == -1) {
            showError("Please select Product Type.")
            return;
        }

        if (product.isNew) {
            if (_.find($scope.products, function (p) { return p.Name == $scope.newProduct.Name; }) != null) {
                showError("product " + $scope.newProduct.Name + " already exists.")
                return;
            }
            Connection.addProduct($scope.user, product,
                function (response) {
                    if (response.Status == true) {
                        $scope.products = response.Data.Products;
                        if (product.addInline) {
                            $scope.productGrid = $scope.productGridWithoutTooling;
                            $scope.productGrid.updateData(product);
                            $scope.productTotalGrid.updateData();
                        }
                        else
                            $scope.productListGrid.updateData($scope.products);

                        $("#addProduct").modal('hide');
                    }
                    else {
                        showError(response.Data.Error);
                    }
                },
                function (errorMessage) {
                    showError(errorMessage);
                }
            );
        }
        else {
            Connection.updateProduct($scope.user, product,
                function (response) {
                    if (response.Status == true) {
                        $scope.products = response.Data.Products;
                        $scope.productListGrid.updateData($scope.products);
                        $("#addProduct").modal('hide');
                    }
                    else {
                        showError(response.Data.Error);
                    }
                },
                function (errorMessage) {
                    showError(errorMessage);
                }
            );
        }
    }

    $scope.deleteProduct = function (product) {
        if (_.find($scope.orders, function (o) { return orderContainsProduct(o, product); }) != null) {
            showError("Cannot delete " + product.Name + ", because orders with this product exist.");
            return;
        }
        Connection.deleteProduct($scope.user, product,
            function (response) {
                if (response.Status == true) {
                    $scope.products = response.Data.Products;
                    $scope.productListGrid.updateData($scope.products);
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

    orderContainsProduct = function (order, product) {
        return _.find(order.OrderItems, function (o) { return o.ProductID == product.ID; }) != null;
    }

    $scope.addProductCategoryDialog = function () {
        $.each($scope.productCategories, function (index, productCategory) {
            productCategory.Type = $scope.categoryTypes[productCategory.TypeId - 1];
        });
        $scope.editProductCategoryDialog({ Name: '', TypeId: 0, Status: 'Active', isNew: true, addInline: true });
    }

    $scope.editProductCategoryDialog = function (productCategory) {
        $.each($scope.productCategories, function (index, productCategory) {
            productCategory.Type = $scope.categoryTypes[productCategory.TypeId - 1];
        });
        $scope.newProductCategory = productCategory ? productCategory : { Name: '', TypeId: 0, Status: 'Active', isNew: true };
        $("#addProductCategory").modal({ 'backdrop': 'static' });
        $("#addProductCategory").draggable({ handle: ".modal-header", cursor: "move" });
        $timeout(function () { $scope.$apply(); });
    }

    $scope.addProductCategory = function () {
        $scope.updateProductCategory($scope.newProductCategory);
    }

    $scope.updateProductCategory = function (productCategory) {
        if (!productCategory.Name) {
            showError("Please enter Product Category Name.")
            return;
        }
        if (productCategory.CategoryTypeId == -1) {
            showError("Please select Product Category Type.")
            return;
        }

        if (product.isNew) {
            if (_.find($scope.productCategories, function (p) { return p.Name == $scope.newProductCategory.Name; }) != null) {
                showError("product category " + $scope.newProductCategory.Name + " already exists.")
                return;
            }
            Connection.addProductCategory($scope.user, productCategory,
                function (response) {
                    if (response.Status == true) {
                        $scope.productCategories = response.Data.ProductCategories;
                        $scope.productCategoryListGrid.updateData($scope.productCategories);

                        $("#addProductCategory").modal('hide');
                    }
                    else {
                        showError(response.Data.Error);
                    }
                },
                function (errorMessage) {
                    showError(errorMessage);
                }
            );
        }
        else {
            Connection.updateProductCategory($scope.user, productCategory,
                function (response) {
                    if (response.Status == true) {
                        $scope.productCategories = response.Data.ProductCategories;
                        $scope.productCategoryListGrid.updateData($scope.productCategories);
                        $("#addProductCategory").modal('hide');
                    }
                    else {
                        showError(response.Data.Error);
                    }
                },
                function (errorMessage) {
                    showError(errorMessage);
                }
            );
        }
    }

    $scope.deleteProductCategory = function (productCategory) {
        //if (_.find($scope.orders, function (o) { return orderContainsProduct(o, product); }) != null) {
        //    showError("Cannot delete " + product.Name + ", because orders with this product exist.");
        //    return;
        //}
        Connection.deleteProduct($scope.user, productCategories,
            function (response) {
                if (response.Status == true) {
                    $scope.productCategories = response.Data.ProductCategories;
                    $scope.productListGrid.updateData($scope.products);
                }
                else {
                    showError(response.Data.Error);
                }
            },
            function (errorMessage) {
                showError(errorMessage);
            }
        );
    }

    normalizeOrder = function (order) {
        if (order.DateAdded) order.DateAdded = parseJsonDate(order.DateAdded);
        if (order.DateJoined) order.DateJoined = parseJsonDate(order.DateJoined);
        if (order.PortDate) order.PortDate = parseJsonDate(order.PortDate);
        if (order.DeliveryDate) order.DeliveryDate = parseJsonDate(order.DeliveryDate);
        if (order.InstallDate) order.InstallDate = parseJsonDate(order.InstallDate);
        if (order.CourseDate) order.CourseDate = parseJsonDate(order.CourseDate);
        if (order.MfgDate) order.MfgDate = parseJsonDate(order.MfgDate);
        if (order.ShipDate) order.ShipDate = parseJsonDate(order.ShipDate);
        if (order.FirstInstallDate) order.FirstInstallDate = parseJsonDate(order.FirstInstallDate);
        if (order.SecondInstallDate) order.SecondInstallDate = parseJsonDate(order.SecondInstallDate);
        if (order.FinalInstallDate) order.FinalInstallDate = parseJsonDate(order.FinalInstallDate);
        return order;
    }

    normalizeCustomer = function (customer) {
        if (customer.DateJoined)
            customer.DateJoined = parseJsonDate(customer.DateJoined);
        return customer;
    }

    $scope.exportToCSV = function () {
        $scope.orderGrid.export('csv');
    }

    $scope.exportToPDF = function () {
        $scope.orderGrid.export('pdf');
    }

    $scope.exportOrderToPDF = function (isFullInfo) {
        orderToPDF($scope, isFullInfo);
    }
}]);

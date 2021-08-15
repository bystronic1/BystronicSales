function OrderGrid(scope, gridID, onGridRowDouldClicked) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;

    var selectedRowIndex = 0;

    getColumnNames = function () {
        var columnNames = [''];

        $.each(self.scope.columns, function (index, column) {
            columnNames.push(self.scope.getColumnHeaderFor(column));
        });

        return columnNames;
    };

    getColumnFor = function (columnName) {
        switch (columnName) {
            case 'PONumber':
                return { name: 'PONumber', align: 'center', width: 75, editable: false, autoResizing: { minColWidth: 50 }, searchoptions: { clearSearch: true } };
            case 'SaleOrderNumber':
                return { name: 'SaleOrderNumber', align: 'center', width: 70, editable: false, autoResizing: { minColWidth: 50 }, searchoptions: { clearSearch: true } };
            case 'SapNumber':
                return { name: 'SapNumber', width: 90, editable: false, autoResizing: { minColWidth: 70 }, searchoptions: { clearSearch: true } };
            case 'CustomerName':
                return { name: 'CustomerName', width: 140, editable: false, autoResizing: { minColWidth: 100 }, searchoptions: { clearSearch: true } };
            case 'DateAdded':
                return { name: 'DateAdded', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', sorttype: 'date', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, search: false };
            case 'PortDate':
                return { name: 'PortDate', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', sorttype: 'date', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, search: false };
            case 'DeliveryDate':
                return { name: 'DeliveryDate', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', sorttype: 'date', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, search: false };
            case 'InstallDate':
                return { name: 'InstallDate', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', sorttype: 'date', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, search: false };
            case 'ProductName':
                return { name: 'ProductName', width: 140, editable: false, autoResizing: { minColWidth: 100 }, searchoptions: { clearSearch: true } };
            case 'EquipmentNumber':
                return { name: 'EquipmentNumber', width: 140, editable: false, autoResizing: { minColWidth: 100 }, searchoptions: { clearSearch: true } };
            case 'Category':
                return { name: 'Category', width: 140, editable: false, autoResizing: { minColWidth: 100 }, searchoptions: { clearSearch: true } };
            case 'SaleAmount':
                return {
                    name: 'SaleAmount', width: 120, editable: false, align: 'right', autoResizing: { minColWidth: 100 }, sorttype: 'float', formatter: 'currency', search: false,
                    formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
                };
            //case 'CourseNumber':
            //    return { name: 'CourseNumber', align: 'center', width: 80, editable: false, autoResizing: { minColWidth: 50 }, searchoptions: { clearSearch: true } };
            //case 'CourseName':
            //    return { name: 'CourseName', align: 'center', width: 80, editable: false, autoResizing: { minColWidth: 50 }, searchoptions: { clearSearch: true } };
            //case 'CourseDate':
            //    return { name: 'CourseDate', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', sorttype: 'date', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, search: false };
            //case 'SeatsPurchased':
            //    return { name: 'SeatsPurchased', align: 'center', width: 80, editable: false, autoResizing: { minColWidth: 50 }, searchoptions: { clearSearch: true } };
            //case 'SeatsUsed':
            //    return { name: 'SeatsUsed', align: 'center', width: 80, editable: false, autoResizing: { minColWidth: 50 }, searchoptions: { clearSearch: true } };
            case 'Shipped':
                return { name: 'Shipped', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', sorttype: 'date', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, search: false };
            case 'ShipDate':
                return { name: 'ShipDate', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', sorttype: 'date', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, search: false };
            case 'ProductionWeek':
                return { name: 'ProductionWeek', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center' };
            case 'Port':
                return { name: 'Port', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center' };
            case 'MfgDate':
                return { name: 'MfgDate', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', sorttype: 'date', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, search: false };
            case 'ForwarderNumber':
                return { name: 'ForwarderNumber', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', searchoptions: { clearSearch: true } };
            case 'KNumber':
                return { name: 'KNumber', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center' };
            case 'FirstInstallment':
                return { name: 'FirstInstallment', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', search: false };
            case 'SecondInstallment':
                return { name: 'SecondInstallment', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', search: false };
            case 'FinalInstallment':
                return { name: 'FinalInstallment', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', search: false };
            case 'InstallmentTerm':
                return { name: 'FinalInstallmentTerm', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', search: false };
            case 'InstallmentNote':
                return { name: 'InstallmentNote', width: 80, editable: false, autoResizing: { minColWidth: 50 }, align: 'center', search: false };
            default:
                return '';
        }
    };

    getColumns = function () {
        var columnNames =
        [
            {
                name: 'ID', width: 16, fixed: true, sortable: false, search: false, hidden: !self.scope.permissions.CanCreateOrder, align: 'center',
                formatter: function (cellvalue, options, rowObject) {
                    var color = rowObject.Status == 'pending' ? 'color: #677fa2' : 'color: transparent';
                    return "<span style='" + color + "' class='glyphicon glyphicon-remove'></span>"
                },
                cellattr: function (rowId, cellValue, rowObject) {
                    return 'title="Delete Order"';
                }
            }
        ];

        $.each(self.scope.columns, function (index, column) {
            columnNames.push(getColumnFor(column));
        });

        return columnNames;
    };

    //scope.$watch("showActiveTasksOnly", function (newValue, oldValue) {
    //    self.updateSelectedTask(scope.tasks, scope.task);
    //});

    $(this.gridID).jqGrid({
        colNames: getColumnNames(),
        colModel: getColumns(),
        data: self.data,
        datatype: "local",
        height: "auto",
        //shrinkToFit: true,
        //autowidth: false,
        //width: 900,
        width: $(document).width(),
        rowNum: 1000,
        rownumbers: true,
        hoverrows: true,
        viewrecords: true,
        caption: null,
        hidegrid: false,
        sortname: 'OrderDate',
        sortorder: "desc",
        multiselect: false,
        cmTemplate: { title: false },
        footerrow: true,
        userDataOnFooter: true,
        headertitles:true,
        sortable: {
            options: { // let reorder all columns, except with names ID, ID.
                items: ">th:not(:has(#jqgh_order_grid_cb,#jqgh_order_grid_ID,#jqgh_order_grid_rn,#jqgh_order_grid_subgrid),:hidden)"
            },
            update: function (relativeColumnOrder) {
                var columnNames = $(self.gridID).jqGrid("getGridParam", "colNames");
                var columns = [];
                $.each(columnNames, function (index, columnName) {
                    if (columnName)
                        columns.push(self.scope.getColumnNameFor(columnName));
                });
                self.scope.columns = columns;
                self.scope.saveColumnsAfterDragAndDrop();
            }
        },
        loadComplete: function () {
            var rowIds = $(this).jqGrid('getDataIDs');
            //if (rowIds.length === 0) return;
            if (rowIds.length > selectedRowIndex) 
                $(this).setSelection(rowIds[selectedRowIndex]);
        },
        ondblClickRow: function (rowId) {
            $(this).setSelection(rowId);
            var order = $(this).jqGrid("getLocalRow", rowId);
            onGridRowDouldClicked(order.Id);
        },
        beforeSelectRow: function (rowId, e) {
            var idArray = $(this).jqGrid('getDataIDs');
            var selectedRowID = $(this).jqGrid("getGridParam", "selrow");
            var iCol = $.jgrid.getCellIndex($(e.target).closest("td")[0]);

            var order = $(this).jqGrid("getLocalRow", rowId);
            if (iCol == 1) {
                showYesNoMessage('Orders', 'Do you want to delete order ' + order.Template + ' / ' + order.EquipmentNumber + '?',
                    function () {
                        self.scope.deleteOrder(order);
                    }
                );
            }

            if (selectedRowID == rowId) {
                return false;
            }

            selectedRowID = rowId;
            selectedRowIndex = _.findIndex(idArray, function (id) { return id == selectedRowID; });
            return true;
        }
    });

    jQuery(this.gridID).jqGrid('filterToolbar', { searchOnEnter: false, stringResult: true, defaultSearch:'cn' });

    this.filterData = function (data, filter) {
        var filteredData = [];

        $.each(data, function (index, order) {
            var customerName = _.find(self.scope.customers, function (c) { return c.Id == order.CustomerId; }).Name;
            var product = _.find(self.scope.products, function (p) { return p.Id == order.ProductId; });
            var category = _.find(self.scope.productCategories, function (p) { return p.Id == product.CategoryId; }).Name;

            var _order = jQuery.extend(true, {}, order); // deep copy
            _order.CustomerName = customerName;
            _order.ProductName = product.Name;
            _order.Category = category;

            var dateFormatter = new Intl.DateTimeFormat("en-US");

            _order.FirstInstallment = (order.FirstInstallAmount ? order.FirstInstallAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '')
                + '<br>' + (order.FirstInstallDate ? dateFormatter.format(order.FirstInstallDate) : '');
            _order.SecondInstallment = (order.SecondInstallAmount ? order.SecondInstallAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '')
                + '<br>' + (order.SecondInstallDate ? dateFormatter.format(order.SecondInstallDate) : '');
            _order.FinalInstallment = (order.FinalInstallAmount ? order.FinalInstallAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '')
                + '<br>' + (order.FinalInstallDate ? dateFormatter.format(order.FinalInstallDate) : '');

            if (self.matchOrder(_order, filter)) {
                filteredData.push(_order);
            }
        });
        return {
            tableData: filteredData 
        };
    }

    this.formatCurrency = function (value) {
        return '$' + value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
    }

    this.matchOrder = function (order, filter) {
        var matches = true;
        if (filter) {
            if (filter.Region) {
                let isFound = false;
                $.each(filter.Region, function (index, region) {
                    if (self.scope.getRegion(order) == region) {
                        isFound = true;
                        return;
                    }
                });
                matches &= isFound;
            }
            if (filter.Product) {
                let isFound = false;
                $.each(filter.Product, function (index, product) {
                    if (self.scope.getProductCategoryType(order) == product) {
                        isFound = true;
                        return;
                    }
                });
                matches &= isFound;
            }
            // date range filter
            if (filter.StartDeliveryDate)
                matches &= order.DeliveryDate >= new Date(filter.StartDeliveryDate);
            if (filter.EndDeliveryDate)
                matches &= order.DeliveryDate <= new Date(filter.EndDeliveryDate);

            if (filter.StartShipDate)
                matches &= order.ShipDate >= new Date(filter.StartShipDate);
            if (filter.EndShipDate)
                matches &= order.ShipDate <= new Date(filter.EndShipDate);

            if (filter.StartMfgDate)
                matches &= order.MfgDate >= new Date(filter.SatrtMfgDate);
            if (filter.EndMfgDate)
                matches &= order.MfgDate <= new Date(filter.EndMfgDate);

            if (filter.StartInstallDate)
                matches &= order.InstallDate >= new Date(filter.StartInstallDate);
            if (filter.EndInstallDate)
                matches &= order.InstallDate <= new Date(filter.EndInstallDate);
        }

        return matches;
    }

    this.updateData = function (orders, filter) {
        var data = this.filterData(orders, filter);
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', {
            data: data.tableData//,
            //userData: {
            //    'Customer': 'Total', 'TotalListPrice': this.totalListPrice, 'SalePrice': this.totalSellingPrice, 'DiscountAmount': this.totalDiscount,
            //    'DealerCommissionInfo': this.formatCurrency(this.totalDealerCommission), 'RegionalManagerCommission': this.totalRegionalManagerCommission, 'ProductManagerCommission': this.totalProductManagerCommission
            //}
        });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }

    this.export = function (format) {
        var data = $(gridID).jqGrid('getRowData');
        var totalData = $(gridID).jqGrid('footerData', 'get');
        var columnNames = $(gridID).jqGrid('getGridParam', 'colNames');
        $.each(data, function (index, row) {
            delete row['ID'];
        });
        if (format == 'csv')
            CSVExport(columnNames, data, (self.scope.IsDemoVersion ? '' : 'Bystronic') + 'Orders.csv');
        else
            orderTableToPDF(self.scope, columnNames, data, totalData, (self.scope.IsDemoVersion ? '' : 'Bystronic') + 'Orders.pdf');
    }
}

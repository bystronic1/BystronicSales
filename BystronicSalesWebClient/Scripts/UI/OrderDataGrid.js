function OrderInputDataGrid(scope, gridID, hasTooling, onGridRowDoubleClicked) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;

    self.IsDealerCommissionShown = false;
    self.IsRegionalManagerCommissionShown = false;
    self.IsProductManagerCommissionShown = false;
    
    $(this.gridID).jqGrid({
        colNames: (hasTooling ? ['Machines and Options', 'List Price', 'Tooling Price'] : ['Machines and Options', 'List Price']),
        colModel: (hasTooling ?
        [
            { name: 'Name', width: 545, sorttype: "string", editable: false, autoResizing: { minColWidth: 200 } },
            {
                name: 'Value', width: 100, editable: false, align: "right", autoResizing: { minColWidth: 100 }, formatter: 'currency',
                formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
            },
            {
                name: 'ToolingValue', width: 100, editable: false, align: "right", autoResizing: { minColWidth: 100 }, formatter: 'currency',
                formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
            } 
        ] :
        [
            { name: 'Name', width: 545, sorttype: "string", editable: false, autoResizing: { minColWidth: 200 } },
            {
                name: 'Value', width: 200, editable: false, align: "right", autoResizing: { minColWidth: 100 }, formatter: 'currency',
                formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
            },
        ]),
        data: self.data,
        datatype: "local",
        cellEdit:false,
        autowidth: false,
        shrinkToFit: false,
        width: 765,
        rowNum: 30,
        //height: (self.scope.order.OrderItems.length > 10 ? 250 : "auto"),
        rownumbers: false,
        hoverrows:false,
        viewrecords: true,
        caption: null,
        hidegrid: false,
        //sortname: 'ID',
        //sortorder: "asc",
        multiselect: false,
        cmTemplate: { title: false, sortable: false, resizable: false },

        beforeSelectRow: function (rowId, e) {
            //$(this).setSelection(rowId);
            return false;
        },
        ondblClickRow: function (rowid) {
            if (self.scope.canEditOrder())
                onGridRowDoubleClicked();
        }
    });

    this.getOrderData = function (order) {
        tableData = [];
        $.each(order.OrderItems, function (index, orderItem) { 
            orderItem.Name = _.find(self.scope.products, function (p) { return p.ID == orderItem.ProductID; }).Name;
            tableData.push(orderItem);
        });

        if (order.OrderItems.length < 3)
            for (i = 0; i < 3 - order.OrderItems.length; i++)  // add blank rows at the end
                tableData.push({}); 

        return tableData;
    }

    this.updateData = function (order) {
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: this.getOrderData(order) });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }
}

function OrderOutputDataGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;
    var currentCell;

    var isCommissionOverriden = scope.tmpOrder ? scope.tmpOrder.IsDealerCommissionOverriden || scope.tmpOrder.IsRSMCommissionOverriden || scope.tmpOrder.IsPMCommissionOverriden : false;

    $(this.gridID).jqGrid({
        colNames: ['', '', ''],
        colModel: [
            { name: 'Name', width: 540, editable: false, autoResizing: { minColWidth: 200 } },
            {
                name: 'Value', width: 120, editable: true, align: "right", autoResizing: { minColWidth: 100 }, formatter: currencyValueFormatter, unformat: unformatCurrencyValue,
                formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' },
                cellattr: function (rowid, val, rowObject, cm, rdata) {
                    var rowIds = jQuery(self.gridID).jqGrid('getDataIDs');
                    var style = val < 0 ? 'class = "ui-state-error-text"' : ' class = "ui-state-default-text"';
                    //var tooltip = self.getToolTip(rowObject.Name);
                    return style/* + tooltip*/;
                }
            },
            {
                name: 'CalculatedValue', width: 80,  editable: false, align: "right", autoResizing: { minColWidth: 50 }, formatter: 'currency',
                formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
            }
        ],
        data: self.data,
        datatype: "local",
        cellEdit: true,
        autowidth: false,
        shrinkToFit: false,
        width: 765,
        rowNum: 5,
        rownumbers: false,
        hoverrows: false,
        viewrecords: true,
        hidegrid: false,
        multiselect: false,
        cmTemplate: { title: false, sortable: false, resizable: false },

        loadComplete: function () {
            var rowIds = jQuery(self.gridID).jqGrid('getDataIDs');
            $.each(self.data, function (i, orderItem) {
                //if (!self.scope.canEditCommissions() || self.scope.tmpOrder.TotalListPrice == 0 || i <= 3) {
                if (!self.scope.canEditCommissions() || self.scope.tmpOrder.TotalListPrice == 0 || !self.data[i].Name.endsWith('Commission')) {
                    jQuery(self.gridID).setCell(rowIds[i], 'Value', '', { 'background-color': '#eeeeee' });
                    jQuery(self.gridID).setCell(rowIds[i], 'Value', '', 'not-editable-cell');
                }
                jQuery(self.gridID).setCell(rowIds[i], 'CalculatedValue', '', { 'background-color': '#eeeeee' });
            });
            if (self.scope.tmpOrder) {
                // highlight overriden commission values
                if (self.scope.tmpOrder.IsDealerCommissionOverriden && self.scope.tmpOrder.DealerCommission && self.IsDealerCommissionShown) {
                    jQuery(self.gridID).setCell(rowIds[4], 'Value', '', { 'background-color': '#ddeedd' });
                    //jQuery(self.gridID).attr('title', self.scope.tmpOrder.CalculatedDealerCommission);
                }
                if (self.scope.tmpOrder.IsRSMCommissionOverriden && self.scope.tmpOrder.RegionalManagerCommission && self.IsRegionalManagerCommissionShown)
                    jQuery(self.gridID).setCell(rowIds[self.IsDealerCommissionShown ? 5 : 4], 'Value', '', { 'background-color': '#ddeedd' });
                if (self.scope.tmpOrder.IsPMCommissionOverriden && self.scope.tmpOrder.ProductManagerCommission)
                    jQuery(self.gridID).setCell(rowIds[self.IsDealerCommissionShown && self.IsRegionalManagerCommissionShown ? 6 : 5], 'Value', '', { 'background-color': '#ddeedd' });
            }
        },
        beforeSelectRow: function (rowId, e) {
            //$(this).setSelection(rowId);
            return false;
        },
        beforeEditCell: function (rowid, cellname, value, iRow, iCol) {
            currentCell = {
                rowid: rowid, cellname: cellname, value: value, iRow: iRow, iCol: iCol
            }
        },
        beforeSubmitCell: function (rowid, cellname, value, iRow, iCol) {
            if (iRow == 5) {
                if (self.IsDealerCommissionShown) {
                    self.scope.tmpOrder.DealerCommission = value;
                }
                else if (self.IsRegionalManagerCommissionShown) {
                    self.scope.tmpOrder.RegionalManagerCommission = value;
                }
                else if (self.IsProductManagerCommissionShown)
                    self.scope.tmpOrder.ProductManagerCommission = value;
            }
            else if (iRow == 6) {
                if (self.IsRegionalManagerCommissionShown && self.IsDealerCommissionShown) {
                    self.scope.tmpOrder.RegionalManagerCommission = value;
                }
                else if (self.IsProductManagerCommissionShown)
                    self.scope.tmpOrder.ProductManagerCommission = value;
            }
            else if (iRow == 7) {
                self.scope.tmpOrder.ProductManagerCommission = value;
            }
        }
    });

    //this.getToolTip = function (name) {
    //    if (self.scope.MajorVersion > 1) {
    //        if (self.scope.tmpOrder.IsDealerCommissionOverriden && (name.startsWith('Dealer') || name.startsWith('DSE')))
    //            return ' title = "Calculated\nDealer/DSE\nCommission:\n$' + self.scope.tmpOrder.CalculatedDealerCommission + '"';
    //        else if (self.scope.tmpOrder.IsRSMCommissionOverriden && name.startsWith('Regional'))
    //            return ' title = "Calculated\nRSM/DSE\nCommission:\n$' + self.scope.tmpOrder.CalculatedRegionalManagerCommission + '"';
    //        else if (self.scope.tmpOrder.IsPMCommissionOverriden && name.startsWith('Product'))
    //            return ' title = "Calculated\nProduct Manager/DSE\nCommission:\n$' + self.scope.tmpOrder.CalculatedProductManagerCommission + '"';
    //    }
    //    return '';
    //};

    this.getOrderData = function (order) {
        tableData = [];

        self.IsDealerCommissionShown = false;
        self.IsRegionalManagerCommissionShown = false;
        self.IsProductManagerCommissionShown = false;

        tableData.push({ Name: 'Total List Price of Equipment', Value: order.TotalListPrice });
        tableData.push({ Name: 'Selling Price According to Order Confirmation', Value: order.SalePrice });
        tableData.push({ Name: 'Discount Amount', Value: order.DiscountAmount });
        tableData.push({ Name: 'Discount %', Value: order.DiscountPercent });

        var calculatedDealerCommission = order.IsDealerCommissionOverriden ? order.CalculatedDealerCommission : '';
        var calculatedRegionalManagerCommission = order.IsRSMCommissionOverriden ? order.CalculatedRegionalManagerCommission : '';
        var calculatedProductManagerCommission = order.IsPMCommissionOverriden ? order.CalculatedProductManagerCommission : '';
        
        var salesman = order.Salesman ? _.find(self.scope.salesmen, function (s) { return s.ID.toLowerCase() == order.Salesman.toLowerCase(); }) : null;
        var split = rmSplit = '';
        if (order.Salesman && order.Salesman2 && order.Salesman2 != 'NA') {
            var salesman2 = _.find(self.scope.salesmen, function (s) { return s.ID.toLowerCase() == order.Salesman2.toLowerCase(); });
            split = ' (Split 50/50 between ' + salesman.Name + ' and ' + salesman2.Name + ')';
            rmSplit = ' (Split 50/50)';
        }
        if ((!salesman || salesman.Role != this.scope.roles.rsmdse) && (this.scope.user.Role == this.scope.roles.dealer || this.scope.user.Role == this.scope.roles.dse || this.scope.user.Role == this.scope.roles.rsm || this.scope.user.Role == this.scope.roles.approver || this.scope.user.Role == this.scope.roles.administrator)) {
            tableData.push({ Name: (order.TypeOfSale == 0 ? 'Dealer\'s Commission' : 'DSE Commission') + split, Value: order.DealerCommission, CalculatedValue: calculatedDealerCommission });
            self.IsDealerCommissionShown = true;
        }
        if (!this.scope.IsCanadianVersion && order.PayRSMCommission) {
            if (this.scope.user.Role == this.scope.roles.rsm || this.scope.user.Role == this.scope.roles.approver || this.scope.user.Role == this.scope.roles.administrator) {
                tableData.push({ Name: 'Regional Sales Manager Commission' + rmSplit, Value: '' + order.RegionalManagerCommission, CalculatedValue: calculatedRegionalManagerCommission });
                self.IsRegionalManagerCommissionShown = true;
            }
        }
        var template = _.find(self.scope.templates, function (t) { return t.ID == order.TemplateID; });
        if (template && template.ProductManager && (this.scope.user.Role == this.scope.roles.pm || this.scope.user.Role == this.scope.roles.approver || this.scope.user.Role == this.scope.roles.administrator)) {
            tableData.push({ Name: 'Product Manager Commission', Value: order.ProductManagerCommission, CalculatedValue: calculatedProductManagerCommission });
            self.IsProductManagerCommissionShown = true;
        }

        if (self.scope.MajorVersion > 1) {
            tableData.push({ Name: 'Effective DSE/Dealer Commission Rate', Value: order.DSECommissionRate });

            let saleGoal = 0;
            let orderYear = order.OrderDate ? order.OrderDate.getFullYear() : new Date().getFullYear();
            if (salesman) {
                let goal = _.find(salesman.SalesGoals, function (s) { return s.Year === orderYear; });
                saleGoal = goal ? goal.Target : 0;
            }
            tableData.push({ Name: 'Year-To-Date Sale (prior to this order)', Value: order.YtdSaleBeforeThisOrder });
            tableData.push({ Name: 'Year-To-Date Sale (with this order)', Value: order.YtdSaleBeforeThisOrder + order.SalePrice });
            tableData.push({ Name: 'Sale Goal', Value: saleGoal });
        }

        return tableData;
    }

    this.updateData = function (order) {
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: this.getOrderData(order) });
        jQuery(this.gridID).trigger('reloadGrid');

        let commissionOverriden = order.IsDealerCommissionOverriden || order.IsRSMCommissionOverriden || order.IsPMCommissionOverriden;
        jQuery(this.gridID).jqGrid(commissionOverriden ? 'showCol' : 'hideCol', ['CalculatedValue']);
        //jQuery(this.gridID).jqGrid('resizeColumn', 'Value', commissionOverriden ? 120 : 200);
        $('#order_output_data_grid_Value, #order_output_data_grid tr.jqgfirstrow td:nth-child(2)').width(commissionOverriden ? 120 : 200);
        //$('#[grid_id]_[column_name], #[grid_id] tr.jqgfirstrow td:nth-child([column_index])').width([new_width])

    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }

    this.getSellingPrice = function () {
        return this.getData()[1]["Value"];
    }

    this.stopEdit = function () {
        if (currentCell)
            jQuery(this.gridID).jqGrid("saveCell", currentCell.iRow, currentCell.iCol);
    }
}

function OrderFootnoteDataGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;
    var currentCell;

    $(this.gridID).jqGrid({
        colNames: ['', '', 'Date'],
        colModel: [
            { name: 'Label', width: 265, editable: false, autoResizing: { minColWidth: 200 } },
            { name: 'Value', width: 280, align: "right", editable: true, autoResizing: { minColWidth: 200 } },
            { name: 'Date', width: 200, editable: true, align: "right", autoResizing: { minColWidth: 100 }, formatter: 'date', formatoptions: { newformat: 'm/d/y' } }
        ],
        data: self.data,
        datatype: "local",
        cellEdit: true,
        autowidth: false,
        shrinkToFit: false,
        width: 765,
        rowNum: 5,
        rownumbers: false,
        hoverrows: false,
        viewrecords: true,
        hidegrid: false,
        multiselect: false,
        cmTemplate: { title: false, sortable: false, resizable: false },

        beforeSelectRow: function (rowId, e) {
            //$(this).setSelection(rowId);
            return false;

        },
        beforeEditCell: function (rowid, cellname, value, iRow, iCol) {
            currentCell = {
                rowid: rowid, cellname: cellname, value: value, iRow: iRow, iCol: iCol
            }
        },
    });

    this.getOrderData = function (order) {
        return [
            { "Label": "Approved By",                "Value": order.ApprovedBy,      "Date": order.ApprovedDate },
            { "Label": "Released By",                "Value": order.ReleasedBy,      "Date": order.ReleasedDate },
            //{ "Label": "Bystronic Regional Manager", "Value": order.RegionalManager, "Date": order.RegionalManagerDate },
            { "Label": "Marked as Paid By", "Value": order.PaidBy, "Date": order.PayDate },
            { "Label": "Payroll Date", "Value": "", "Date": order.PayrollDate }
        ];
    }

    this.updateData = function (order) {
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: this.getOrderData(order) });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }

    this.getSellingPrice = function () {
        return this.getData()[1]["Value"];
    }

    this.stopEdit = function () {
        if (currentCell) jQuery(this.gridID).jqGrid("saveCell", currentCell.iRow, currentCell.iCol);
    }
}
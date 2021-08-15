function ProductGrid(scope, gridID, hasTooling, onProductSelected) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    this.hasTooling = hasTooling;
    var self = this;
    var currentCell;

    $(this.gridID).jqGrid({
        colNames: (hasTooling ? ['', '', 'Machines and Options', 'List Price', 'Tooling Price'] : ['', '', 'Machines and Options', 'List Price']),
        colModel: (hasTooling ?
            [
                { name: 'Selected', width: 50, align: "center", autoResizing: false, editable: true, edittype: 'checkbox', editoptions: { value: "True:False" }, formatter: "checkbox", formatoptions: { disabled: false } },

                { name: 'ID', width: 1, sorttype: "string", editable: false, autoResizing: false, hidden: true },
                { name: 'Name', width: 390, sorttype: "string", editable: false, autoResizing: false },
                {
                    name: 'Value', width: 100, editable: true, autoResizing: false, align: 'right', formatter: currencyValueFormatter, unformat: unformatCurrencyValue,
                    formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
                },
                {
                    name: 'ToolingValue', width: 100, editable: true, autoResizing: false, align: 'right', formatter: currencyValueFormatter, unformat: unformatCurrencyValue,
                    formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
                }
            ] :
            [
                { name: 'Selected', width: 50, align: "center", autoResizing: false, editable: true, edittype: 'checkbox', editoptions: { value: "True:False" }, formatter: "checkbox", formatoptions: { disabled: false } },
                { name: 'ID', width: 1, sorttype: "string", editable: false, autoResizing: false, hidden: true },
                { name: 'Name', width: 390, sorttype: "string", editable: false, autoResizing: false },
                {
                    name: 'Value', width: 200, editable: true, autoResizing: false, align: 'right', formatter: currencyValueFormatter, unformat: unformatCurrencyValue,
                    formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
                }
            ]),
        data: self.data,
        datatype: "local",
        autowidth: false,
        shrinkToFit: false,
        width: 657,
        cellEdit: true,
        rowNum: 100,
        rownumbers: false,
        hoverrows: false,
        viewrecords: true,
        caption: null,
        hidegrid: false,
        multiselect: false,
        cmTemplate: { title: false, resizable: false },
        loadComplete: function () {
            var rowIds = jQuery(self.gridID).jqGrid('getDataIDs');
            $.each(self.data, function (i, orderItem) {
                if (!orderItem.HasTooling) {
                    jQuery(self.gridID).setCell(rowIds[i], 'ToolingValue', '', { 'background-color': '#cccccc' });
                    jQuery(self.gridID).setCell(rowIds[i], 'ToolingValue', '', 'not-editable-cell');
                }
            });
        },
        beforeSelectRow: function (rowId, e) {
            var iCol = $.jgrid.getCellIndex($(e.target).closest("td")[0]);

            var orderItemID = parseInt($(this).jqGrid('getRowData', rowId).ID);
            var orderItem = _.find(self.orderItems, function (orderItem) { return orderItem.ID == orderItemID; });
            cm = $(this).jqGrid("getGridParam", "colModel");
            if (cm[iCol].name == "Selected" && e.target.tagName.toUpperCase() == "INPUT") {
                orderItem.Selected = $(e.target).is(":checked") ? true : false;
                self.updateToolingPrice();
                onProductSelected(self.orderItems);
            }
            return false;
        },
        beforeEditCell: function (rowId, cellname, value, iRow, iCol) {
            currentCell = {
                rowid: rowId, cellname: cellname, value: value, iRow: iRow, iCol: iCol
            }
  
        },
        afterSaveCell: function (rowid, cellname, value, iRow, iCol) {
            if(iCol == 3)
                self.updatePrice();
            else if (iCol == 4)
                self.updateToolingPrice();
            onProductSelected(self.orderItems);
        }
    });

    this.updatePrice = function () {
        var data = jQuery(this.gridID).jqGrid('getGridParam', 'data');
        if (this.orderItems) {
            $.each(this.orderItems, function (index, product) {
                product.Value = parseFloat(data[index].Value);
            });
        }
    }

    this.updateToolingPrice = function () {
        var data = jQuery(this.gridID).jqGrid('getGridParam', 'data');
        if (this.hasTooling && this.orderItems) {
            $.each(this.orderItems, function (index, product) {
                product.ToolingValue = parseFloat(data[index].ToolingValue);
            });
        }
    }

    this.getProductData = function () {
        tableData = [];
        this.orderItems = jQuery.extend(true, {}, _.filter(this.scope.products, function (p) { return p.ProductTypeID == 4 || p.ProductTypeID == 5 || p.ProductTypeID == self.scope.tmpOrder.TemplateID; })); // deep copy
        $.each(this.orderItems, function (index, product) {
            product.Selected = self.isProductSelected(product);
            product.ToolingValue = 0;
            if (product.Selected) { // product is in order -> get OrderItem price
                var orderItem = _.find(self.scope.tmpOrder.OrderItems, function (o) { return o.ProductID == product.ID; });
                if (orderItem) {
                    product.Value = orderItem.Value;
                    if (product.HasTooling)
                        product.ToolingValue = orderItem.ToolingValue;
                }
            }
            tableData.push(product);
        }); 

        //for (i = 0; i < 25 - tableData.length; i++)  // add blank rows at the end
        //    tableData.push({}); 

        return tableData;
    }

    this.getSelectedProducts = function () {
        var selectedProducts = _.filter(this.orderItems, function (p) { return p.Selected == true; });
        $.each(selectedProducts, function (index, product) {
            product.ProductID = product.ID;
        });
        return selectedProducts;
    }

    this.isProductSelected = function (product) {
        return _.find(self.scope.tmpOrder.OrderItems, function (o) { return o.ProductID == product.ID; }) != undefined;
    }

    this.updateData = function (product) {
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: this.getProductData() });
        jQuery(this.gridID).trigger('reloadGrid');
        if (product) {
            var idArray = jQuery(this.gridID).jqGrid('getDataIDs');
            if (idArray.length > 0)
                jQuery(this.gridID).setSelection(idArray[idArray.length - 1]);
        }
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }

    this.stopEdit = function () {
        if (currentCell) jQuery(this.gridID).jqGrid("saveCell", currentCell.iRow, currentCell.iCol);
    }
}

function ProductTotalGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;
    $(this.gridID).jqGrid({
        colNames: ['', '', ''],
        colModel: [
            { name: 'Index', width: 50, sorttype: "string", editable: false, autoResizing: false },

            { name: 'Name', width: 390, sorttype: "string", editable: false, autoResizing: false },
            {
                name: 'Value', width: 200, editable: false, autoResizing: false, align: 'right', formatter: 'currency',
                formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
            },
        ],
        data: self.data,
        datatype: "local",
        autowidth: true,
        shrinkToFit: false,
        rowNum: 1,
        rownumbers: false,
        hoverrows: false,
        viewrecords: true,
        hidegrid: false,
        multiselect: false,
        cmTemplate: { title: false, resizable: false },
        beforeSelectRow: function (rowid, e) {
            return false;
        },
    });

    this.getTotalPrice = function(orderItems) {
        var totalPrice = 0;
        $.each(orderItems, function (index, item) {
            if (item.Selected) { 
                totalPrice += item.Value;
                if(item.ToolingValue)
                    totalPrice += item.ToolingValue;
            }
        });
        return totalPrice;
    }

    this.updateData = function (orderItems) {
        var data = [{ Index: "", Name: "Total List Price of Equipment", Value: orderItems ? this.getTotalPrice(orderItems) : 0.00 }];
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: data });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }
}

function ProductSellPriceGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;
    var currentCell;

    $(this.gridID).jqGrid({
        colNames: ['', '', ''],
        colModel: [
            { name: 'Index', width: 50, sorttype: "string", editable: false, autoResizing: false },

            { name: 'Name', width: 390, sorttype: "string", editable: false, autoResizing: false },
            {
                name: 'Value', width: 200, editable: true, autoResizing: false, align: 'right', formatter: currencyValueFormatter, unformat: unformatCurrencyValue,
                formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }
            },
        ],
        data: self.data,
        datatype: "local",
        cellEdit: true,
        autowidth: true,
        shrinkToFit: false,
        rowNum: 1,
        rownumbers: false,
        hoverrows: false,
        viewrecords: true,
        hidegrid: false,
        multiselect: false,
        cmTemplate: { title: false, resizable: false },
        beforeSelectRow: function (rowid, e) {
            return false;
        },
        beforeEditCell: function (rowid, cellname, value, iRow, iCol) {
            currentCell = {
                rowid: rowid, cellname: cellname, value: value, iRow: iRow, iCol: iCol
            }
        } 
    });

    this.updateData = function (salePrice) {
        var data = [{ Index: "", Name: "Selling Price according to Order Confirmation", Value: salePrice }];
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: data });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }

    this.stopEdit = function() {
        if (currentCell) jQuery(this.gridID).jqGrid("saveCell", currentCell.iRow, currentCell.iCol);
    }
}
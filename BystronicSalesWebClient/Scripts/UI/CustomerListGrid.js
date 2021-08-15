function CustomerListGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;

    $(this.gridID).jqGrid({
        colNames: ['', 'Regional Manager', 'Name', 'SAP #', 'City', 'State', 'Join Date', 'Status'],
        colModel: [
            {
                name: 'delete', width: 30, sortable: false, search: false, align: 'center',
                formatter: function () {
                    return "<span style='color: #e42820' class='glyphicon glyphicon-remove'></span>"
                }
            },
            { name: 'RegionalManager', width: 130, autoResizing: { minColWidth: 120 }, align: 'center' },
            { name: 'Name', width: 200, autoResizing: { minColWidth: 120 } },
            { name: 'SapNumber', width: 100, autoResizing: { minColWidth: 80 }, align: 'center' },
            { name: 'City', width: 110,  autoResizing: { minColWidth: 80 } },
            { name: 'State', width: 70,  autoResizing: { minColWidth: 50 }, align: 'center' },
            { name: 'DateJoined', width: 100, autoResizing: { minColWidth: 50 }, align: 'center', formatter: 'date', formatoptions: { newformat: 'm/d/y' }, },
            { name: 'Status', width: 100, autoResizing: { minColWidth: 70 }, align: 'center' },
            
        ],
        data: self.data,
        datatype: "local",
        shrinkToFit: false,
        autowidth: false,
        width: 840,
        height: 300,
        rowNum: 1000,
        rownumbers: false,
        hoverrows:false,
        viewrecords: true,
        caption: null,
        hidegrid: false,
        sortname: 'Name',
        sortorder: "asc",
        multiselect: false,
        cmTemplate: { title: false },

        loadComplete: function () {
            var idArray = $(this).jqGrid('getDataIDs');
            if (idArray.length > 0)
                $(this).setSelection(idArray[0]);
        },
        ondblClickRow: function (rowId) {
            $(this).setSelection(rowId);
            var customer = $(this).jqGrid("getLocalRow", rowId);
            self.scope.editCustomerDialog(customer);
        },
        beforeSelectRow: function (rowId, e) {
            var retCode = true;
            var selRowId = $(this).jqGrid("getGridParam", "selrow");
            if (selRowId == rowId) {
                retCode = false;
            }
            var iCol = $.jgrid.getCellIndex($(e.target).closest("td")[0]);
            if (iCol == 0) {
                var customer = $(this).jqGrid("getLocalRow", rowId);
                showYesNoMessage('Customers', 'Do you want to delete customer ' + customer.Name + '?',
                    function () {
                        self.scope.deleteCustomer(customer);
                    }
                ); 
            }
            return retCode;
        },
    });

    this.updateData = function (customers) {
        $.each(customers, function (index, customer) {
            customer.RegionalManager = self.scope.regions[customer.RegionalManagerId-1];
        });
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: customers });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }
}

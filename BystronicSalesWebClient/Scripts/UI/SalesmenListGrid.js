function SalesmenListGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;

    $(this.gridID).jqGrid({
        colNames: ['', 'Login', 'Full Name', 'Role', 'Region', 'Cost Center'],
        colModel: [
            {
                name: 'delete', width: 24, sortable: false, search: false,
                formatter: function () {
                    return "<span style='color: #677fa2' class='glyphicon glyphicon-remove'></span>"
                }
            },
            { name: 'ID', width: 100, autoResizing: { minColWidth: 80 } },
            { name: 'Name', width: 140, autoResizing: { minColWidth: 100 } },
            { name: 'Role', width: 75, autoResizing: { minColWidth: 60 } },
            { name: 'Region', width: 75, autoResizing: { minColWidth: 60 } },
            { name: 'CostCenter', width: 90, autoResizing: { minColWidth: 60 } }
        ],
        data: self.data,
        datatype: "local",
        shrinkToFit: false,
        autowidth: false,
        width: 520,
        height: 300,
        rowNum: 1000,
        rownumbers: false,
        hoverrows:false,
        viewrecords: true,
        caption: null,
        hidegrid: false,
        sortname: 'ID',
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
            var salesman = $(this).jqGrid("getLocalRow", rowId);
            self.scope.editSalesmanDialog(salesman);
        },
        beforeSelectRow: function (rowId, e) {
            var retCode = true;
            var selRowId = $(this).jqGrid("getGridParam", "selrow");
            if (selRowId == rowId) {
                retCode = false;
            }
            var iCol = $.jgrid.getCellIndex($(e.target).closest("td")[0]);
            if (iCol == 0) {
                var salesman = $(this).jqGrid("getLocalRow", rowId);
                showYesNoMessage('Dealers / DSE', 'Do you want to delete ' + salesman.Name + '?',
                    function () {
                        self.scope.deleteSalesman(salesman);
                    }
                ); 
            }
            return retCode;
        },
    });

    this.updateData = function (salesmen) {
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: salesmen });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }
}

function SalesListGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;

    $(this.gridID).jqGrid({
        colNames: ['Full Name', 'Role', 'Region', 'Sale', '' + 'Goal'],
        colModel: [
            { name: 'Name', width: 150, autoResizing: { minColWidth: 100 } },
            { name: 'Role', width: 70, autoResizing: { minColWidth: 60 } },
            { name: 'Region', width: 75, autoResizing: { minColWidth: 60 } },
            {
                name: 'SelectedYearSale', width: 90, autoResizing: { minColWidth: 60 }, align: 'right', formatter: 'currency', formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }, sorttype: "number" },
            { name: 'SelectedYearSalesGoal', width: 90, autoResizing: { minColWidth: 60 }, align: 'right', formatter: 'currency', formatoptions: { prefix: '$', suffix: '', thousandsSeparator: ',', decimalPlaces: 2, defaultValue: '' }, sorttype: "number" }
        ],
        data: self.data,
        datatype: "local",
        shrinkToFit: false,
        autowidth: false,
        width: 500,
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
        }
    });

    this.updateData = function (salesmen, selectedYear) {
        if(!selectedYear) selectedYear = new Date().getFullYear();
        $.each(salesmen, function (index, salesman) {
            salesman.SelectedYearSale = salesman.Sales[selectedYear - self.scope.firstAvailableYear];
            salesGoal = _.find(salesman.SalesGoals, function (s) { return s.Year === selectedYear; });
            salesman.SelectedYearSalesGoal = salesGoal ? salesGoal.Target : 0;
        });
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: salesmen });
        jQuery(this.gridID).trigger('reloadGrid');
    };

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    };
}

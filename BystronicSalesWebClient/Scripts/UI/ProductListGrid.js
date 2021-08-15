function ProductListGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;

    $(this.gridID).jqGrid({
        colNames: ['', 'Product Name', 'Category', 'Status'],
        colModel: [
            {
                name: 'delete', width: 30, sortable: false, search: false, align: 'center',
                formatter: function () {
                    return "<span style='color: #e42820' class='glyphicon glyphicon-remove'></span>"
                }
            },
            { name: 'Name', width: 270, autoResizing: { minColWidth: 120 } },
            { name: 'Category', width: 150, autoResizing: { minColWidth: 80 }, align: 'center' },
            { name: 'Status', width: 90, autoResizing: { minColWidth: 70 } },
        ],
        data: self.data,
        datatype: "local",
        shrinkToFit: false,
        autowidth: false,
        width: 540,
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
            var product = $(this).jqGrid("getLocalRow", rowId);
            self.scope.editProductDialog(product);
        },
        beforeSelectRow: function (rowId, e) {
            var retCode = true;
            var selRowId = $(this).jqGrid("getGridParam", "selrow");
            if (selRowId == rowId) {
                retCode = false;
            }
            var iCol = $.jgrid.getCellIndex($(e.target).closest("td")[0]);
            if (iCol == 0) {
                var product = $(this).jqGrid("getLocalRow", rowId);
                showYesNoMessage('Products', 'Do you want to delete product ' + product.Name + '?',
                    function () {
                        self.scope.deleteProduct(product);
                    }
                ); 
            }
            return retCode;
        },
    });

    this.updateData = function (products) {
        $.each(products, function (index, product) {
            product.Category = _.find(self.scope.productCategories, function (p) { return p.Id == product.CategoryId; }).Name;
        });
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: products });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }
}

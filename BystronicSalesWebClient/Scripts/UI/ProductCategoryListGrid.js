function ProductCategoryListGrid(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    this.data = [];
    var self = this;

    $(this.gridID).jqGrid({
        colNames: ['Category', 'Type', 'Status'],
        colModel: [
            { name: 'Name', width: 290, autoResizing: { minColWidth: 200 } },
            { name: 'Type', width: 150, autoResizing: { minColWidth: 80 }, align: 'center' },
            { name: 'Status', width: 100, autoResizing: { minColWidth: 70 } },
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
        sortname: 'Type',
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
            var productCategory = $(this).jqGrid("getLocalRow", rowId);
            self.scope.editProductCategoryDialog(productCategory);
        },
        beforeSelectRow: function (rowId, e) {
            var retCode = true;
            var selRowId = $(this).jqGrid("getGridParam", "selrow");
            if (selRowId == rowId) {
                retCode = false;
            }
            var iCol = $.jgrid.getCellIndex($(e.target).closest("td")[0]);
            //if (iCol == 0) {
            //    var productCategory = $(this).jqGrid("getLocalRow", rowId);
            //    showYesNoMessage('Product Categories', `Do you want to delete product category ${productCategory.Name}?`,
            //        function () {
            //            self.scope.deleteProductCategory(productCategory);
            //        }
            //    ); 
            //}
            return retCode;
        },
    });

    this.updateData = function (productsCategories) {
        $.each(productsCategories, function (index, productCategory) {
            productCategory.Type = self.scope.categoryTypes[productCategory.TypeId-1];
        });
        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: productsCategories });
        jQuery(this.gridID).trigger('reloadGrid');
    }

    this.getData = function () {
        return jQuery(this.gridID).jqGrid('getGridParam', 'data');
    }

    //this.categoryTypes = ['Press Brake', 'Laser', 'Automation', 'Waterjet', 'Welding Cell'];
}

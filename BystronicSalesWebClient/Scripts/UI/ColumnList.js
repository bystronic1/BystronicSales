function ColumnList(scope, gridID) {
    this.scope = scope;
    this.gridID = gridID;
    var self = this;

    var data = [];
    $.each(scope.columns, function (index, column) {
        data.push({ selected: true, name: column, header: scope.getColumnHeaderFor(column) });
    });

    $.each(this.scope.getAllAvailableColumns(), function (index, column) {
        if (!_.contains(scope.columns, column))
            data.push({ selected: false, name: column, header: scope.getColumnHeaderFor(column) });
    });

    $(this.gridID).jqGrid({
        datatype:"local",
        data: data,
        colNames:['', 'Column','ID'],
        colModel:[
            { name: 'selected', index: 'selected', width: 40, align: "center", editable: true, edittype: 'checkbox', editoptions: { value: "True:False" }, formatter: "checkbox", formatoptions: { disabled: false } },
            { name: 'header', index: 'header', width: 300, sorttype: "string", editable: false, cellattr: null },
            { name: 'name', index: 'name', width: 300, sorttype: "string", editable: false, cellattr: null, hidden: true }
        ],
        autowidth:false,
        height: 300,
        width: 535,
//        sortname: 'selected',
//        sortorder: "desc",
        viewrecords: false,
        caption: null,
        altRows: false,
        hoverrows: false,
        rowNum: 1000,
        rownumbers: false,
        hidegrid: true,
        shrinktofit: false,
        cmTemplate: { editable: true },

        afterInsertRow: function (rowid, rowdata) {
           // $(this).jqGrid('setRowData', rowid, false, 'task');
        }
    });

    //jQuery("#sortrows").jqGrid("sortableRows", { items: ".jqgrow:not(.unsortable)" });

    jQuery(this.gridID).jqGrid('sortableRows'); // let client reorder rows

   // jQuery(this.gridID).jqGrid('gridDnD');

    this.updateData = function (columns) {
        var data = [];
        $.each(columns, function (index, column) {
            data.push({ selected: true, name: column, header: self.scope.getColumnHeaderFor(column) });
        });

        $.each(this.scope.getAllAvailableColumns(), function (index, column) {
            if (!_.contains(columns, column))
                data.push({ selected: false, name: column, header: self.scope.getColumnHeaderFor(column) });
        });

        jQuery(this.gridID).jqGrid('clearGridData');
        jQuery(this.gridID).jqGrid('setGridParam', { data: data });
        jQuery(this.gridID).trigger('reloadGrid');

        jQuery(this.gridID).jqGrid('setSelection', 1);
    }

    this.getSelectedColumns = function() {
        var selectedColumns = [];
        var data = jQuery(this.gridID).jqGrid('getRowData');
        $.each(data, function (index, column) {
            if (column.selected == "True") {
                selectedColumns.push(column.name);
            }
        });

        return selectedColumns;
    }
}

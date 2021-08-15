orderTableToPDF = function (scope, columnNames, JSONData, JSONTotalData, filename) {
    var body = [];
    var headers = [];
    var totals = [];
    columnNames = columnNames.filter(item => item.trim() !== '');
    var pageSize = 'A4';
    if (columnNames.length > 10) pageSize = 'A3';
    if (columnNames.length > 16) pageSize = 'A2';
    if (columnNames.length > 23) pageSize = 'A1';
    $.each(columnNames, function (index, column) {
        headers.push({ text: column, style: 'tableHeader' });
    });
    body.push(headers);

    var csvData = JSONData,
        csvHeaders,
        csvEncoding = 'data:text/csv;charset=utf-8,',
        csvOutput = "",
        csvRows = [],
        BREAK = '\r\n',
        DELIMITER = ',',
        FILENAME = filename;

    csvHeaders = Object.keys(csvData[0]);

    var csvTotalData = JSONTotalData;

    csvTotalHeaders = [];
    $.each(Object.keys(csvTotalData), function (index, item) {
        if (item === "TotalListPrice") csvTotalHeaders.push("List Price");
        else if (item === "SalePrice") csvTotalHeaders.push("Sale Price");
        else if (item === "DiscountAmount") csvTotalHeaders.push("Discount Amount");
        else if (item === "DealerCommissionInfo") csvTotalHeaders.push("Dealer/DSE Commission");
        else if (item === "RegionalManagerCommission") csvTotalHeaders.push("RSM Commission");
        else if (item === "ProductManagerCommission") csvTotalHeaders.push("PM Commission");
    });

    for (var i = 0; i < csvData.length; i++) {
        var rowElements = [];
        for (var k = 0; k < csvHeaders.length; k++) {
            var a = csvData[i];
            rowElements.push(csvData[i][csvHeaders[k]].replace(/,/g, "").replace(/<br>/g, "; ").replace(/---/g, ""));
        } // Write the row array based on the headers
        body.push(rowElements);
    }

    totals.push(csvTotalHeaders);
    totals.push(Object.values(csvTotalData));

    var docDefinition = {
        pageOrientation: 'landscape',
        pageSize: pageSize,
        header: function (currentPage, pageCount, pageSize) {
            return [
                {
                    columns: [
                        scope.IsDemoVersion ?
                        { text: '', style: 'header' } : 
                        {
                            image: 'data:image/png;base64,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',
                            width: 60, height: 30,
                        },
                        { text: 'Order List', style: 'header' },
                    ],
                    margin: [40, 5, 0, 40]
                }
            ]
        },
        footer: function (currentPage, pageCount, pageSize) {
            return [
                { text: 'Created on ' + $.datepicker.formatDate('mm/dd/yy', new Date()) + ', \u00A9 ' + (scope.IsDemoVersion ? 'Company' : 'Bystronic, Inc.'), style: 'small' },
            ]
        },    
        content: [
            {
                style: 'table',
                table: {
                    headerRows: 1,
                    body: body,
                    minHeight: 100
                },
                layout: 'lightHorizontalLines'
            },
            { text: 'Total', style: 'header'},
            {
                style: 'table',
                table: {
                    headerRows: 1,
                    body: totals,
                    minHeight: 20
                },
                layout: 'lightHorizontalLines'
            },
        ],
        styles: {
            header: {
                fontSize: 14,
                bold: true,
                margin: [10, 8, 0, 10]
            },
            subheader: {
                fontSize: 12,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            table: {
                margin: [0, 5, 0, 15],
                fontSize: 11,
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
                color: 'darkblue'
            },
            small: {
                italics: true,
                fontSize: 8,
                alignment: 'center',
                margin: [0, 5, 0, 5]
            }
        },
        defaultStyle: {
            alignment: 'justify'
        }
    }
    
    pdfMake.createPdf(docDefinition).download(filename);
}

orderToPDF = function (scope, isFullInfo) {
    var order = scope.tmpOrder;
    var template = _.find(scope.templates, function (t) { return t.ID == order.TemplateID; });
    var customer = _.find(scope.customers, function (c) { return c.ID == order.CustomerID; }).Name;

    var orderItems = [];
    orderItems.push([{ text: 'Machines and Options', style: 'tableHeader', alignment: 'center' }, { text: 'List Price', style: 'tableHeader', alignment: 'center' }]);
    $.each(order.OrderItems, function (index, orderItem) {
        var name = _.find(scope.products, function (p) { return p.ID == orderItem.ProductID; }).Name;
        orderItems.push([{ text: name, style: 'table', alignment: 'left' }, { text: formatter.format(orderItem.Value), style: 'table', alignment: 'right' }]);
    });
    if (order.OrderItems.length < 10) {
        for (var i = order.OrderItems.length; i < 10; i++) {
            orderItems.push([{ text: '', style: 'table' }, { text: '', style: 'table' }]);
        }
    }

    var calculation = [
        [{ text: 'Total List Price of Equipment', style: 'table', alignment: 'right' }, { text: formatter.format(order.TotalListPrice), style: 'table', alignment: 'right' }],
        [{ text: 'Selling Price According to Order Confirmation', style: 'table', alignment: 'right' }, { text: formatter.format(order.SalePrice), style: 'table', alignment: 'right' }],
        [{ text: 'Discount Amount', style: 'table', alignment: 'right' }, { text: formatter.format(order.DiscountAmount), style: 'table', alignment: 'right' }],
        [{ text: 'Discount %', style: 'table', alignment: 'right' }, { text: order.DiscountPercent + '%', style: 'table', alignment: 'right' }]
    ];

    var salesman = order.Salesman ? _.find(scope.salesmen, function (s) { return s.ID.toLowerCase() == order.Salesman.toLowerCase(); }) : null;
    var rsm = order.RSM ? _.find(scope.salesmen, function (s) { return s.ID.toLowerCase() == order.RSM.toLowerCase(); }) : null;

    var split = rmSplit = '';
    if (order.Salesman && order.Salesman2 && order.Salesman2 != 'NA') {
        var salesman2 = _.find(scope.salesmen, function (s) { return s.ID.toLowerCase() == order.Salesman2.toLowerCase(); });
        split = ' (Split 50/50 between ' + salesman.Name + ' and ' + salesman2.Name + ')';
        rmSplit = ' (Split 50/50)';
    }
    else {
        split = '(' + salesman.Name + ')';
        rmSplit = rsm ? '(' + rsm.Name + ')' : '';
    }

    if ((!salesman || salesman.Role != scope.roles.rsmdse) && (scope.user.Role == scope.roles.dealer || scope.user.Role == scope.roles.dse || scope.user.Role == scope.roles.rsm || scope.user.Role == scope.roles.approver || scope.user.Role == scope.roles.administrator)) {
        calculation.push([{ text: (order.TypeOfSale == 0 ? 'Dealer\'s Commission' : 'DSE Commission') + split, style: 'table', alignment: 'right' }, { text: formatter.format(order.DealerCommission), style: 'table', alignment: 'right' }]);
    }
    if (isFullInfo) {
        if (order.PayRSMCommission) {
            if (scope.user.Role == scope.roles.rsm || scope.user.Role == scope.roles.approver || scope.user.Role == scope.roles.administrator) {
                calculation.push([{ text: 'Regional Sales Manager Commission' + rmSplit, style: 'table', alignment: 'right' }, { text: formatter.format(order.RegionalManagerCommission), style: 'table', alignment: 'right' }]);
            }
        }
        if (template && template.ProductManager && (scope.user.Role == scope.roles.pm || scope.user.Role == scope.roles.approver || scope.user.Role == scope.roles.administrator)) {
            let pm = _.find(scope.salesmen, function (s) { return s.ID.toLowerCase() == template.ProductManager.toLowerCase(); });
            let pmString = pm ? '(' + pm + ')' : '';
            calculation.push([{ text: 'Product Manager Commission' + pmString, style: 'table', alignment: 'right' }, { text: formatter.format(order.ProductManagerCommission), style: 'table', alignment: 'right' }]);
        }
    }

    calculation.push([{ text: 'Effective DSE/Dealer Commission Rate', style: 'table', alignment: 'right' }, { text: order.DSECommissionRate + '%', style: 'table', alignment: 'right' }]);

    var ytdSale = order.YtdSaleBeforeThisOrder;
    var saleGoal = salesman ? salesman.CurrentYearSalesGoal : 0;

    calculation.push([{ text: 'Year-To-Date Sale (prior to this order)', style: 'table', alignment: 'right' }, { text: formatter.format(ytdSale), style: 'table', alignment: 'right' }]);
    calculation.push([{ text: 'Year-To-Date Sale (with this order)', style: 'table', alignment: 'right' }, { text: formatter.format(ytdSale + order.SalePrice), style: 'table', alignment: 'right' }]);
    calculation.push([{ text: 'Sale Goal', style: 'table', alignment: 'right' }, { text: formatter.format(saleGoal), style: 'table', alignment: 'right' }]);

    var approvedDate = order.ApprovedDate ? $.datepicker.formatDate('mm/dd/y', order.ApprovedDate) : null;
    var releasedDate = order.ReleasedDate ? $.datepicker.formatDate('mm/dd/y', order.ReleasedDate) : null;
    var payDate = order.PayDate ? $.datepicker.formatDate('mm/dd/y', order.PayDate) : null;

    var docDefinition = {
        header: function (currentPage, pageCount, pageSize) {
            return [
                {
                    columns: [
                        scope.IsDemoVersion ?
                        { text: '', style: 'header' } :
                        {
                            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJcAAAA9CAYAAACgGPvxAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAArkSURBVHhe7Zw9rBRVFMcHbbQRsNdgLwETCxOJYKtR0UqiRuyImogVaiM2Riu1MNIYNBqJFWoiiSYGSTBamKBijx+NUgjYUa37ezN/OZx3zuwMO/vem+X+kpvdN/dj7tz7n3POvTP7Nk22VpOqUFgANzSfhcLgFHFtBA4drqrNW5o/locirvXm9m1VdeCFqrp3T3NgeSgx13ohS3XpYv2dzyWjiGu9OHWm/tx9V/25hBS3uF78+lOdPPv218JbghisiGst2b6zql5/q/7+3DN18iC4775dCjdZ3OJa8tO5OoBHVMc+aA42HDhYH1ui2KtYrrVALo746s3XVgsLV4hFk1WzYO1G6iKL5Vo0iOOLk1X1yourRWXJLBfW7s/fquqh+5sD46GIa9Fgld49WlVnp7GUXxlyHKLYSyBOoP7IKOJaFIgKsEYP7F0dpBN72e2IP6bWSVCXjdWHp9ZqxDFYibkWAWLCKpH4fuKzKyIhfsIFIibEQ7LCgu07avGRLNSlzZHEYMVyDY0mnjgLvPXBWuHqjrxdx2EWa+EQlhedrB1uFMFucIrlGhLcmbYbZJW8WzvyTn3s2IfNgQbqfnz8iiitsBAsiWN3bB2FsKCIaygQlFzWR1ORICAJC0t17kItIGKwnXesDtDZPKU84rPQHoKT6EZEEdcQ8MoMwsBd8fnUo01Gw6FXa5EgPkQo0YFiM8SG6Px2BWVH+qioxFzzgjCYZMTh3aC2EXBnWB6skhUP9agPfteeuohSgo2gzL6nV8duG4RcXP/00ByDx0Yfn6dPrb77NhpYjzunE8Pk7Npd97ttr6kNiQsBIC65O9q2Qb11g1ga6hDUW3FZFLsxlj4PS0ndTHRtZPN666bmy4AgrjDNw8ULk8kTe+N21zPdt7Pum+f0ybh8W3p2/2Ty3lv1dz5p2+cLvuv4ti2TyS9n6uOfHL26DumhPfUn7X15vC5v89VuVJc6vrxPGVHZOdMwliuDO/b0dGm9Udi1Jw6MWf73ebzClgErO/BbClgknhFy7VhHkCXHYmGN6APfsWZ2115uMrJWiquwVpnl6vKoaA0tV39xMRGW26aDxYBFsGR+0gW3Q4LriYJZJi1yGUOJi3PSDtet1R3n5G89fOb8duddG6s8uIYHH6kFpHygLhustGXjN50P7HGhcZCYuR7rhoeAa4vmuc14WDN2VcqIyuIWMrI83NOObXF7mPwI2qIO+ZF7s/x+bjJ543Dt8voiNxkhl4/L8m3TP+vycGGUi1D/6SftyM3RZ7k2XKSgvOqoDJ/ZONDuywevjKlShi9Hws12GWuuOag/jLjsIFg4KYPAhUZoQG1CPBEarD4waUOLC7LBVozEp79miY66beNhYyZELKivNqyIaU8pwo9xhi2ja+iDrd+k+cWFGHShHl1YJj5QAKuUicEGyF0Z2nJpgr047MRyzRGUoV0/VrQlcfCdfCaXcc0EY6FMNv5q1y4oMpTPubP2MjReLs0Xc+Hjo5gHfNygeMJj450sJloJXi/V+z4e8k58fiXmoT/8TOuBaUzDIxbOr1iBbYfoJ1zEPfZxzMrf06A6GgPas9dMWeIu9pvoB28zKN+W5TttslVDf4i51BfFR8ROoFhV2xycI4p3ZkG7tMmnFg6zAnoWKsSHEVwDffvj9/rvzZvrstkiwqvt/3StcPdFvp47InMH2raI8jlGXaxQhOIwf74oZW0kd94KnF8WwILb0HFtQ3irRV3V91sVUXkLeVxX5J50XjvOlI3GT6hcBnn0MUMWVe3YlIz/Yva56Ig1xUqZe2RQMrcntzkr3qINJoJy0USS+ojLDjQTbSeO85DPBINuDv1toV7WHyarLbbJ+gvR+NIPzsf1eFQmg7zsfFxXJqyW1F9cdEAJqxFdiGBSfLvU6QplVY+L6xMLUNZPajZ4kbgioQhdF+1LWCRgclVXnz6utMmPH/2mHjeJvRltf/huJ5t+MFYcI8+WFSqbQV4m9Gh8OqRhVov2Lvb4gWUArBXIoIy/W/ibic3OFWEF1kdcWIY2MVvhk+ibII/+q34fcQHHmGgvLtol8d22ofHMrD+obAZ5UV+Avqh+jzTMWxEEjH5zVfgAmqDw+Q7P8ShDWQt/s/HIO00sFtiQ5Ly+nCVaBGQQfBNE80nwHQXRXCvn8+9j2YUICxeCXAXo2tyMYBPabqTSPmN29ufmQAN9IrgnaZGgT97CYGGjJwHXCouNCPqjc/VgGHFx4rYB9LCry2BkkDfrsRH5bx6uVynRqyqiy6Dc0pTR5JEgqotgEDciEJTTTj1CQXz2prIrSAsi1AqX9uxLgNw0tCXh8Uk5tUM/eNxDX6k7xJsRmYHgnNw80TW0EZmzlZRhYy7SLDeFW8Jl2BUFxzKXE7lDEi6COrgF4hzbntxlhHV51s14tPLCtaht4a9P7ZE4L/2iDwqoLZyf+hzn/CTK+f5SRmPCJ/XoE/XUhkUukLK2Pxld8zPXCPSBfnNuroP+KQRQfZMWs1oUmti2SfVQ1velbxsWiYaEaLqgflskIoj6xI3GsSjuYQL8pElwYANpe7wNzoVI/Y2Y0TWfMfJC7oLqm7Q4cTFguvC2QNNCOd8PJQayLxKJTUy0B9H4CaVsBnmybvQZ4al9HRNtE8U5rWj5RLCqT35Wn/Gw51TK6JpP4traLFiEXTg1aVhxMThMnj8Rd3UbXEjQuasSFqgrTEqbUOmjnbTIUlCOiY/yNPnROWRNyOMctGGx59V3bkTqMX4cYyz4299Q5NEfynmLpZTRNd8mrsFa1TaC+csf//Aopgs26MwgaCXA9asvH7R2Qf2KVqG8Z96nPdryj7AIjvlbCwS+a9UneNRDIM3K1S4kOMZqkzZYzQL94rp5TEI9VsEExwTvrHbVVz3qAcaFhYrOrfMRtFOPNkkR2bxpgTQrP4N6/vUqrvPfaT+Surm4rlcYRCYfcfhBQyDa+mDSGVyLF5cEQFmtthCkbirgGPUQqbYzbF0mk1UhUIeV8Ugov/7xICgE4IWFQHioqzdQrbBWrEsjEB44W3GAtY58WmEhKB7q6+1VW3fWr4o2OMVy9QEBsHlqhYVl0c+7EJbdq0J0+gUPVo+f6dv9KIlLVtC+8iw36a3giCjimgUTT6xhReNBCFgnLwJ+CIuAvHBAQsWK8R3R2br62T/HaNcKeiQUtzgLgmnE40E0HOcTy4R4vHWRlfK/okZM7M7bOEx1sVZykQh6pMKCGw/fXE0deyHlm6+q6vinq4Vz8KVaIOf/rqoff2gOTkEsX39fVZcv1zEY1sk/VqHOY4/X4rHPKHGd7x+rqrvvqaqbbqpFd/6vJnN8FLc4DwriLQgOy4MYeQZpkQVENMRqCuwFwsSakTdiiyWKuPqCQGb9qlzxlBUH8RNxFCAcuxq1rhDBITIvvBFSxNWXTFwcj4J6kJVCRODrKvDX5umSUAL6vuDS2qyWB0Hp1Rjq2bqIDhAkwlrkD4jXgSKueZFAEF1ktTLkJrF4uE8sVte6I6GIax54VIRV0vM6Kw7Eg6vDUkUvM5JH6vOS5cgoMde8sDr0b9VizbBKPEj3MRSiA6yVfVa5hBRxLYpoxQgE72D/ScmSUsQ1JFilWY+KCOz55Tcx2pJTxDUkvDHBe2Z+85TYCkvmnx8uOSWgHxK2EvwDasBaKV1HFMu1Vmif6zqiiGuRdHlUtMQUt7hIlngPqwvFchUWRrFchYVRxFVYEFX1H5KiXgd2XIHyAAAAAElFTkSuQmCC',
                            width: 50, height: 24,
                        },
                        { text: 'Order ' + order.EquipmentNumber + ' - ' + template.Name, style: 'header' },
                    ],
                    margin: [40, 5, 0, 40],
                }
            ]
        },
        footer: function (currentPage, pageCount, pageSize) {
            return [
                { text: 'Created on ' + $.datepicker.formatDate('mm/dd/yy', new Date()) + ', \u00A9 ' + (scope.IsDemoVersion ? 'Company' : 'Bystronic, Inc.'), style: 'small' },
            ]
        },
        content: [
//            { text: 'Order ' + order.PONumber + ' - ' + template.Name, style: 'header' },
            {
                style: 'table', // Order Header
                table: {
                    widths: [100, '*'],
                    headerRows: 0,
                    body: [
                        [{ text: 'Customer:', style: 'table', alignment: 'left' }, { text: customer, style: 'table', alignment: 'left' }],
                        [{ text: 'Order Date:', style: 'table', alignment: 'left' }, { text: order.OrderDateString, style: 'table', alignment: 'left' }],
                        [{ text: 'Equipment Number:', style: 'table', alignment: 'left' }, { text: order.EquipmentNumber, style: 'table', alignment: 'left' }],
                    ]
                }
            },
            {
                style: 'table', // Order items
                table: {
                    widths: ['*', 100],
                    headerRows: 1,
                    heights:13,
                    body: orderItems,
                }
            },
            {
                style: 'table', // Order totals & commissions
                table: {
                    widths: ['*', 100],
                    headerRows: 0,
                    body: calculation,
                }
            },
            {
                style: 'table', // Approved/Released/Paid
                table: {
                    widths: [100, '*', 100],
                    headerRows: 0,
                    body: [
                        [{ text: 'Approved By:', style: 'table', alignment: 'left' }, { text: order.ApprovedBy, style: 'table', alignment: 'right' }, { text: approvedDate, style: 'table', alignment: 'right' }],
                        [{ text: 'Released By:', style: 'table', alignment: 'left' }, { text: order.ReleasedBy, style: 'table', alignment: 'right' }, { text: releasedDate, style: 'table', alignment: 'right' }],
                        [{ text: 'Paid By:', style: 'table', alignment: 'left' }, { text: order.PaidBy, style: 'table', alignment: 'right' }, { text: payDate, style: 'table', alignment: 'right' }],
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 12,
                bold: true,
                margin: [10, 6, 0, 20],
            },
            subheader: {
                fontSize: 12,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            table: {
                margin: [0, 0, 0, 0],
                fontSize: 11,
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
                color: 'black'
            },
            small: {
                italics: true,
                fontSize: 8,
                alignment: 'center',
                margin: [0, 5, 0, 5]
            }
        },
        defaultStyle: {
            alignment: 'justify'
        }
    };

    pdfMake.createPdf(docDefinition).download('Order_' + order.EquipmentNumber + (isFullInfo  ? '_management' :'_employee') + '.pdf');
}

dseReportToPDF = function (scope, dse) {
    orders = scope.orders.filter(order => order.Salesman == dse.ID || order.Salesman2 == dse.ID);
    var docDefinition = {
        content: [
            { text: dse.Name, style: 'header' },
            {
                style: 'table', // Order Header
                table: {
                    widths: [100, '*'],
                    headerRows: 0,
                    body: [
                        [{ text: 'Customer:', style: 'table', alignment: 'left' }, { text: customer, style: 'table', alignment: 'left' }],
                        [{ text: 'Order Date:', style: 'table', alignment: 'left' }, { text: order.OrderDateString, style: 'table', alignment: 'left' }],
                        [{ text: 'Equipment Number:', style: 'table', alignment: 'left' }, { text: order.EquipmentNumber, style: 'table', alignment: 'left' }],
                    ]
                }
            },
            {
                style: 'table', // Order items
                table: {
                    widths: ['*', 100],
                    headerRows: 1,
                    heights: 13,
                    body: orderItems,
                }
            },
            {
                style: 'table', // Order totals & commissions
                table: {
                    widths: ['*', 100],
                    headerRows: 0,
                    body: calculation,
                }
            },
            {
                style: 'table', // Approved/Released/Paid
                table: {
                    widths: [100, '*', 100],
                    headerRows: 0,
                    body: [
                        [{ text: 'Approved By:', style: 'table', alignment: 'left' }, { text: order.ApprovedBy, style: 'table', alignment: 'right' }, { text: approvedDate, style: 'table', alignment: 'right' }],
                        [{ text: 'Released By:', style: 'table', alignment: 'left' }, { text: order.ReleasedBy, style: 'table', alignment: 'right' }, { text: releasedDate, style: 'table', alignment: 'right' }],
                        [{ text: 'Paid By:', style: 'table', alignment: 'left' }, { text: order.PaidBy, style: 'table', alignment: 'right' }, { text: payDate, style: 'table', alignment: 'right' }],
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 16,
                bold: true,
                margin: [0, 0, 0, 20],
                alignment: 'left'
            },
            subheader: {
                fontSize: 12,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            table: {
                margin: [0, 0, 0, 0],
                fontSize: 11,
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
                color: 'black'
            }
        },
        defaultStyle: {
            alignment: 'justify'
        }
    };

    pdfMake.createPdf(docDefinition).download(dse.Name + '_report.pdf');
}

dseReportToPDF = function (scope, dealer) {
    pdfMake.createPdf(docDefinition).download(dealer.Name + '_report.pdf');
}

// currency formatter
var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
});
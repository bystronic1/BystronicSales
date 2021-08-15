var BystronicAccentColor = '#677fa2'; // '#677fa2'


notify = function (message, type, delay, title) {
    if (!delay) delay = 2000;
    var n =
        $.notify(
            { title: title, message: message },
            {
                placement: { from: "top", align: "center" },
                delay: delay,
                type: type,
                z_index: 3000,
                animate: {
                    enter: 'animated fadeInDown',
                    exit: 'animated fadeOutUp'
                }
            });
    return n;
}

notifyInfo = function (message, delay, title) {
    return notify(message, 'info', delay, title);
}
notifySuccess = function (message, delay, title) {
    return notify(message, 'success', delay, title);
}
notifyWarning = function (message, delay, title) {
    return notify(message, 'warning', delay, title);
}
notifyError = function (message, delay, title) {
    return notify(message, 'danger', delay, title);
}

cursor_wait = function () {
    // switch to cursor wait for the current element over
    var elements = $(':hover');
    if (elements.length) {
        // get the last element which is the one on top
        elements.last().addClass('cursor-wait');
    }
    // use .off() and a unique event name to avoid duplicates
    $('html').
    off('mouseover.cursorwait').
    on('mouseover.cursorwait', function (e) {
        // switch to cursor wait for all elements you'll be over
        $(e.target).addClass('cursor-wait');
    });
}

remove_cursor_wait = function () {
    $('html').off('mouseover.cursorwait'); // remove event handler
    $('.cursor-wait').removeClass('cursor-wait'); // get back to default
}

hideTableHeader = function (tableID) {
    $(tableID).parents("div.ui-jqgrid-view").children("div.ui-jqgrid-hdiv").hide();
}

function unformatCurrencyValue(cellvalue, options) {
    return cellvalue.replace("$", "").replace(/,/g, "").replace("(", "").replace(")", "").replace("%", "").replace("NaN", "");
}

function currencyValueFormatter(cellvalue, options, rowObject) {
    var formatoptions = options.colModel.formatoptions || {};

    var format = function (value) {
        // Ceil the number value if any decimal numbers are present

        formatoptions = options.colModel.formatoptions || {};

        //if (!value) return '';

        if (isNaN(value)) return 'NaN';

        if (rowObject.Name == 'Discount %' || rowObject.Name == 'Effective DSE/Dealer Commission Rate') {
            return value.toFixed(2) + "%";
        }

        var isNegative = value < 0;

        var decimals = (Math.abs(value - Math.trunc(value)) * 100).toFixed(0);
        value = Math.trunc(value).toString();

        // Regular expression to find thousand delimiter
        var reg = /(\d+)(\d{3})/g;

        // Loop through all thousands and add a space
        while (reg.test(value))
            value = value.replace(reg, "$1" + formatoptions.thousandsSeparator + "$2");

        // Add the decimal numbers
        if (formatoptions.decimalPlaces > 0) {
            value += ".";
            var decimalStr = decimals >= 10 ? decimals.toString() : '0' + decimals.toString();
            value += decimalStr;
        }

        // Add the suffix         
        return (isNegative ? '(' : '')  + formatoptions.prefix + value + formatoptions.suffix + (isNegative ? ')' : '');
    }

    if (cellvalue === undefined || cellvalue === '') {
        if (formatoptions.defaultValue != undefined)
            return format(formatoptions.defaultValue);
        else
            return format(0);
    }
    else {
        return format(cellvalue);
    }
}

showAlertMessage = function (title, message, details) {
    var detailsHidden = details ? '' : 'display:none';
    var message = $('<div style="font-family:Arial;font-size:14px;font-weight:bold;margin-top:5px;margin-bottom:15px"> ' + message + '</div> <div style="font-family:Consolas;white-space:pre-wrap;margin-bottom:10px;overflow:auto;max-height:200px;' + detailsHidden + '">' + details + '</div>');
   
    BootstrapDialog.show({
        type: BootstrapDialog.TYPE_DANGER,
        title: title ? title : 'Error',
        message: message,
        draggable: true,
        animate: true,
        buttons: [
            {
                label: 'OK',
                action: function (dialogItself) {
                    dialogItself.close();
                }
            }
        ]
    });
}

showYesNoMessage = function (title, message, onYes, onNo) {
    var message = $('<div style="font-family:Arial;font-size:14px;font-weight:bold;margin-top:5px;margin-bottom:15px"> ' + message + '</div>');

    BootstrapDialog.show({
        type: BootstrapDialog.TYPE_WARNING,
        title: title,
        message: message,
        draggable: true,
        animate: true,
        buttons: [
            {
                label: 'Yes',
                action: function (dialogItself) {
                    dialogItself.close();
                    if (onYes) onYes();
                }
            },
            {
                label: 'No',
                action: function (dialogItself) {
                    dialogItself.close();
                    if (onNo) onNo();
                }
            }

        ]
    });
}

// Global variables:
var _strTitle = 'GLOS Plotting Tool'
var _objBuoys = {};

var _arrParamOrder = ['WSPD', 'GST', 'WDIR', 'WTMP', 'WVHT', 'WPRD', 'MWD', 'APD', 'ATMP', 'PRES', 'DEWP', 'PH', 'DISOXY', 'DIOSAT', 'SPCOND', 'COND', 'YCHLOR', 'YBGALG', 'YTURBI'];
var _arrParamExcl = ['DPD', 'TIDE', 'VIS', 'PTDY', 'DEPTH', 'OTMP', 'CHILL', 'HEAT', 'ICE', 'WSPD10', 'WSPD20'];


// Display preloader during page load:
$('.preloader').show();
 

// jQuery "ready" function:
$(function () {

    // Hide preloader after page is loaded:
    $(window).on('load', function () {
        $('.preloader').fadeOut("slow");
    });

    // jQuery UI datepicker:
    $('input.date').each(function () {
        $(this).datepicker({ dateFormat: 'mm/dd/yy' });
    });


    //==================================================================================
    // Custom Javascript Functions:
    //==================================================================================



    //==================================================================================
    // AJAX to Pull Buoy IDs & Names:
    //==================================================================================
    var data_file = "http://34.211.180.62/BuoyALP/buoymeta_english/all";

    $.getJSON(data_file, function (arrBuoyMeta) {
        $('#lst-buoys').empty();
        _objBuoys = {};

        // Get buoy ID from URL:
        var strPath = window.location.pathname;
        var arr = strPath.split('/');
        var strLoc = arr[1];

        $.each(arrBuoyMeta, function (index, objBuoy) {
            var strBuoy = objBuoy.id + ': ' + objBuoy.longName;
            var strChk = '';
            if (objBuoy.id === strLoc) {
                strChk = 'checked'
            };

            var strHTML = '<label class="multiselect"><input type="checkbox" class="multiselect buoy" id="' + objBuoy.id + '" ' + strChk + ' />' + strBuoy + '</label>'

            if (objBuoy.id === strLoc) {
                $('#lst-buoys').prepend(strHTML);
            } else {
                $('#lst-buoys').append(strHTML);
            };

            _objBuoys[objBuoy.id] = objBuoy;
        });

        // Build parameter list:
        updateParams();
    });

    // Populate start/end dates in dialog:
    setDateRange();
    $('#date-start, #date-end').prop('disabled', true);

    //==================================================================================
    // Events/Functions to Update Parameter List:
    //==================================================================================

    // Select event for buoy list:
    $(document).on('change','#lst-buoys input[type="checkbox"]', function (e) {

        updateParams();
    });

    function updateParams() {

        // Create array of selected buoy IDs
        var $selBuoys = $('#lst-buoys input:checked');
        var arrBuoys = [];

        $.each($selBuoys, function (idx, elem) {
            arrBuoys.push($(this).attr('id'));
        })

        // Populate unique list of parameters for selected buoys:
        var objParams = getUniqueParams(arrBuoys);

        var $selParams = $('#lst-params input:checked');
        $('#lst-params').empty();
        var param1 = '';

        for (i = 0; i < _arrParamOrder.length; i++) {
            param_id = _arrParamOrder[i];
            if (i === 0) { param1 = param_id };

            if (param_id in objParams) {
                var strChk = '';
                if ($($selParams).filter('#' + param_id).length > 0) { strChk = 'checked' };

                var strHTML = '<label class="multiselect"><input type="checkbox" class="multiselect param" id="' + param_id + '" ' + strChk + ' />' + objParams[param_id] + '</label>'
                $('#lst-params').append(strHTML);
            };
        }

        // If nothing selected, select first parameter:
        var $selParams = $('#lst-params input:checked');
        if ($selParams.length === 0) {
            $('#lst-params input').first().prop('checked', true);            
        }
    }


    function getUniqueParams(arrBuoys) {

        objParams = {};

        if (arrBuoys.length > 0) {
            $.each(arrBuoys, function (idx) {
                var objBuoy = _objBuoys[arrBuoys[idx]];

                for (var p = 0; p < objBuoy.obsID.length; p++) {
                    var param_id = objBuoy.obsID[p];

                    if (!(param_id in objParams)) {
                        objParams[param_id] = objBuoy.obsLongName[p];
                    }
                }
            });
        }

        return objParams;
    }

    // Select event for time period:
    $('#sel-period').on('change', function (e) {
        $('#date-start, #date-end').prop('disabled', $(this).val() !== 'custom');

        if ($(this).val() !== 'custom') {
            setDateRange();
        }

    });


    //==================================================================================
    // Initialize "multiselect" controls:
    //==================================================================================
    $.fn.multiselect = function () {
        $(this).each(function () {
            var checkboxes = $(this).find("input:checkbox");
            checkboxes.each(function () {
                var checkbox = $(this);
                // Highlight pre-selected checkboxes
                if (checkbox.prop("checked"))
                    checkbox.parent().addClass("multiselect-on");

                // Highlight checkboxes that the user selects
                checkbox.click(function () {
                    if (checkbox.prop("checked"))
                        checkbox.parent().addClass("multiselect-on");
                    else
                        checkbox.parent().removeClass("multiselect-on");
                });
            });
        });
    };

    $(".multiselect").multiselect();

    // Function for retrieving CSRF token:
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });

    // High Chart:
    $('#cht-buoy-tool').tooltip();

    //$.getJSON('https://www.highcharts.com/samples/data/jsonp.php?filename=usdeur.json&callback=?', function (data) {    });

    // Initialize Highchart:
    $('#cht-buoy-tool').highcharts({
        chart: {
            zoomType: 'x',
        },
        credits: {
            enabled: false
        },
        title: {
            text: 'Buoy Test Plot'
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'datetime',
            labels: {
                format: '{value:%e-%b-%Y %H:%m}'
            },            //dateTimeLabelFormats: 'day'
        },
        yAxis: {},
        legend: {
            enabled: true
        },
        plotOptions: {
        },

        series: []
    });

    // jQuery UI dialog:
    $("#dlg-msg").dialog({
        autoOpen: false,
        resizable: true,
        width: 400,
        height: 200,
        modal: true,

        open: function () {

        },
        buttons: {
            "Close": function () {
                $(this).dialog("close");
            },
        },

        show: {
            effect: "fade",
            duration: 500
        },
        hide: {
            effect: "fade",
            duration: 500
        }
    });

    // jQuery UI dialog:
    $("#dlg-tool").dialog({
        autoOpen: false,
        resizable: false,  // true,
        width: 800,
        height: 825,
        modal: true,

        open: function () {
            resizeBuoyChart();
            //$('.ui-dialog-titlebar-close').hide();
        },
        resizeStop: function () {
            resizeBuoyChart();
        },
        buttons: {
            "Update Plot": function () {
                queryData();
            },
            "Export Data": function () {
                showMessage(_strTitle, 'This option is under development and not yet available.');
            },
            "Close": function () {
                $(this).dialog("close");
            },
        },
        //position: 'center',
        show: {
            effect: "fade",
            duration: 500
        },
        hide: {
            effect: "fade",
            duration: 500
        }
    });

    // Event for button click:
    $('#btn-show-tool').on('click', function (evt) {

        var prepend = '';

        if (document.location.href.includes('/buoy/')) {
            prepend = '../../';
        } else {
            prepend = '../';
        }

        document.location.href = prepend + 'plotter';

        // Get data:
        //queryData()

        // Show dialog:
        //$('#dlg-tool').dialog('open');    
    });


    function queryData() {

        // Acquire user selections:
        var buoy_arr = [];
        $.each($('#lst-buoys input:checked'), function (idx, elem) {
            buoy_arr.push($(this).attr('id'));
        })
        
        var param_arr = [];
        $.each($('#lst-params input:checked'), function (idx, elem) {
            param_arr.push($(this).attr('id'));
        })

        date_start = $('#date-start').val();
        date_end = $('#date-end').val();
        avg_ivld = -999;

        // Error handling:
        if (date_start >= date_end) {
            showMessage(_strTitle, 'The selected end date must be later than the start date.');
            return;
        }

        if (buoy_arr.length === 0 || param_arr.length === 0) {
            var hChart = $('#cht-buoy-tool').highcharts();
            removeAllSeries(hChart);
            showMessage(_strTitle, 'At least one buoy and one parameter must be selected for plotting.');
            return;
        }

        // Show preloader:
        $('.preloader').show();

        // AJAX call to Python CGI-enabled script: 
        $.ajax({
            url: '/ajax/getBuoyData',
            type: 'POST',
            data: {
                'buoy_arr': buoy_arr,
                'param_arr': param_arr,
                'date_start': date_start,
                'date_end': date_end,
                'avg_ivld': avg_ivld,       // Averaging interval (in seconds)
            },
            dataType: 'json',
            success: function (objData) {

                // Plot data:
                plotData(objData);

                // Hide preloader:
                $('.preloader').fadeOut("slow");

                // Show dialog:
                $('#dlg-tool').dialog('open');        

                //$('#dlg-tool').dialog('option', 'position', 'center');
            }
        });
    }

    function plotData(objData) {

        var ichk = 0;

        // Reinitialize chart:
        var hChart = $('#cht-buoy-tool').highcharts();
        removeAllSeries(hChart);

        // Create chart series:
        var buoy_ct = 0;
        var arrBuoys = [];

        for (buoy_id in objData) {
            var objBuoy = objData[buoy_id];
            arrBuoys.push(buoy_id);
            buoy_ct += 1;

            // Remove all Y axes:
            for (var i = (hChart.yAxis.length-1); i >= 0; i--) {
                hChart.yAxis[i].remove()
            }

            // Add axis for each parameter:
            axes_ct = -1;

            for (param_id in objBuoy.params) {
                var objParam = objBuoy.params[param_id];

                var seriesName = objParam.desc;

                var series_data = [];

                for (var t = 0; t < objBuoy.dattim.length; t++) {
                    var dt = Date.parse(objBuoy.dattim[t].replace('T', ' '));
                    series_data.push([dt, objParam.values[t]]);

                    //series_data.push([objBuoy.dattim[t], objParam.values[t]]);
                }

                // Add new Y-axis:
                if (buoy_ct === 1) {
                    axes_ct += 1;

                    hChart.addAxis({            // New yAxis
                        id: param_id,
                        title: {
                            text: objParam.desc + ' (' + objParam.units + ')'
                        },
                        lineWidth: 0.5,
                        lineColor: 'black'
                    });
                }

                // Add the new series:
                hChart.addSeries({
                    yAxis: param_id,
                    type: 'line',
                    name: seriesName,
                    //color: 'blue',
                    data: series_data
                })
            }
        }

        // Update chart title:
        hChart.setTitle({ text: 'Buoy Site(s): ' + arrBuoys.join(', ') });
    }

    function removeAllSeries(cht) {

        for (var i = cht.series.length - 1; i > -1; i--) {
            cht.series[i].remove();
        }
    }

    function resizeBuoyChart() {

        var cht = $('#cht-buoy-tool').highcharts();
        if (cht) { cht.reflow() };
    }


//        if (objData.hasOwnProperty(buoy_id)) {
 //       }

/*
        $.each(objData, function (buoy_id, objBuoy) {
            $.each(objBuoy.params, function (param_id, objParam) {

            });
        });

    }
*/

    function setDateRange() {
    // Returns array of start/end date
        var arr = $('#sel-period').val().split('_');

        var intTime = parseInt(arr[0]);
        var strTUnit = arr[1];

        var d_end = new Date();
        var d_start = new Date();

        if (strTUnit.slice(0, 1) === 'd' || strTUnit.slice(0, 1) == 'M') {
            d_start.setDate(d_start.getDate() - (intTime - 1));
        }
        d_end.setDate(d_end.getDate() + 1);

        $('#date-start').val(formatDate(d_start, 'mm/dd/yyyy'));
        $('#date-end').val(formatDate(d_end, 'mm/dd/yyyy'));
    }

    function formatDate(date, fmt) {
        var d = new Date(date),
            month_1d = '' + (d.getMonth() + 1),
            day_1d = '' + d.getDate(),
            year = d.getFullYear();

        var month_2d = month_1d, day_2d = day_1d;

        if (month_2d.length < 2) month_2d = '0' + month_2d;
        if (day_2d.length < 2) day_2d = '0' + day_2d;

        switch (fmt.toLowerCase()) {
            case ('m/d/yyyy'): return [month_1d, day_1d, year].join('/');
            case ('mm/dd/yyyy'): return [month_2d, day_2d, year].join('/');
            case ('m-d-yyyy'): return [month_1d, day_1d, year].join('-');
            case ('mm-dd-yyyy'): return [month_2d, day_2d, year].join('-');
            case ('yyyy-mm-dd'): return [year, month_2d, day_2d].join('-');
            default: return [month_1d, day_1d, year].join('/');
        }
    }

    function formatDateTime(dateVal) {

        var d = new Date();

        hour = "" + d.getHours(); if (hour.length == 1) { hour = "0" + hour; }
        minute = "" + d.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
        second = "" + d.getSeconds(); if (second.length == 1) { second = "0" + second; }

        dformat = [d.getMonth() + 1,
        d.getDate(),
        d.getFullYear()].join('/') + ' ' +
            [hour, minute, second].join(':');
        return dformat;
    }

    Date.daysBetween = function (date1, date2) {
        //Get 1 day in milliseconds
        var one_day = 1000 * 60 * 60 * 24;

        // Convert both dates to milliseconds
        var date1_ms = date1.getTime();
        var date2_ms = date2.getTime();

        // Calculate the difference in milliseconds
        var difference_ms = date2_ms - date1_ms;

        // Convert back to days and return
        return Math.round(difference_ms / one_day);
    };

    // Polyfill for Internet Explorer (added-2016/07/08):
    Number.isInteger = Number.isInteger || function (value) {
        return typeof value === "number" &&
            isFinite(value) &&
            Math.floor(value) === value;
    };


    // Function to display jQuery UI dialog for general messages:
    function showMessage(strTitle, strMsg, fadeOut, arrSize) {

        if (arrSize === undefined) { arrSize = [600, 300] };
        if (strTitle === '') { strTitle = 'CWMP Data Entry' };

        // Compute height and then apply min/max limits (200/500px):
        var hdim = (0.378 * strMsg.length + 59 + 160);
        arrSize[1] = Math.max(hdim, 200);
        arrSize[1] = Math.min(arrSize[1], 500);

        // Adjust width if this is a really short message:
        if (strMsg.length < 200) {
            arrSize[0] = 400;
        }

        var strHTML = strMsg;
        if (!strHTML.startsWith('<')) { strHTML = '<p>' + strMsg + '</p>' };

        $('#dlg-msg').dialog('option', 'title', strTitle);
        $('#dlg-msg').dialog('option', 'width', arrSize[0]);
        $('#dlg-msg').dialog('option', 'height', arrSize[1]);
        $('#dlg-msg').html(strHTML);

        //$('#dlg-msg').position({ my: 'center', of: 'center', collison: 'fit' });
        //$('#dlg-msg').dialog('option', 'position', 'center');
        $("#dlg-msg").dialog("open");

        if (fadeOut) {
            var $dlg = $('#dlg-msg');
            setTimeout(function () { $dlg.dialog("close") }, 1500);
        }
    }

});
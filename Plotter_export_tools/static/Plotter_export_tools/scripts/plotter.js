var _objPlotSeries = {};

// jQuery "ready" function:
$(function () {

    //==================================================================================
    // Plotter-specific Events:
    //==================================================================================

    // Button events:
    $('#btn-plot-update').on('click', function (evt) {
        evt.preventDefault();
        // GTM! - "Update Plot"
        updateTracker('Tool Options', 'Update Plot', '');

        queryData();
    });

    $('#btn-export-menu').on('click', function (evt) {
        evt.preventDefault();
        // GTM! - "GoTo Export"
        updateTracker('Tool Options', 'GoTo Export', '');

        window.location.href = '/tools/export';
        return false;
    });

    $('#btn-plot-table').on('click', function (evt) {
        evt.preventDefault();
        // GTM! - "View Table"
        updateTracker('Tool Options', 'View Table', '');

        if (!$.isEmptyObject(_objPlotSeries)) {

            var strHTML = '<p style="font-weight:bold;font-style:italic;">Location: ' + _objPlotSeries.loc_id + '</p>';
            
            strHTML += '<table id="tbl-pdata" class="">';

            // Top header row:
            strHTML += '<thead><tr>';
            strHTML += '<th class="dattim">' + 'Date/Time (UTC)' + '</th>';

            $.each(_objPlotSeries.params, function (param_id, objSeries) {
                var strParamDesc;
                try {
                    strParamDesc = objSeries.desc.replace('_', ' ');
                } catch(err) {
                    strParamDesc = objSeries.desc;
                } 

                strHTML += '<th>' + strParamDesc + '</th>';
            });
            strHTML += '</tr></thead>';

            // Body of table:
            strHTML += '<tbody>';

            var dattim = _objPlotSeries.dattim;

            for (var t = 0; t < dattim.length; t++) {
                strHTML += '<tr>';

                // Date/time:
                strHTML += '<td class="center dattim">';
                //var dt = Date.parse(dattim[t].replace('T', ' ') + ' UTC');  // Append "UTC" to avoid assumption of local time
                var split = dattim[t].split(/[^0-9]/);
                var isplit = [];
                split.forEach(function (elem) { isplit.push(+elem); }); // string to integer
                //console.log(isplit);
                var cdate = new Date(Date.UTC(isplit[0], isplit[1] - 1, isplit[2], isplit[3], isplit[4], isplit[5], 0, 0)); //changed for Safari
                var dt = cdate.getTime();
                strHTML += formatDateTime(dt);
                strHTML += '</td>';

                $.each(_objPlotSeries.params, function (param_id, objSeries) {
                    strHTML += '<td class="center">' + formatValue(objSeries.values[t]) + '</td>';
                });

                strHTML += '</tr>';
            }
            strHTML += '</tbody>';
            strHTML += '</table>';

            // Open dialog:
            $('#dlg-ptable').dialog('option', 'title', 'Plot Data Table (first location only)');
            $('#dlg-ptable').html(strHTML);
            /*
            $('#dlg-ptable').dialog('option', 'width', arrSize[0]);
            $('#dlg-ptable').dialog('option', 'height', arrSize[1]);
            */

            $('#dlg-ptable').dialog('open');
        }

    });

    //==================================================================================
    // HighCharts Initialization:
    //==================================================================================

    // High Chart:
    $('#cht-tool').tooltip();

    //$.getJSON('https://www.highcharts.com/samples/data/jsonp.php?filename=usdeur.json&callback=?', function (data) {    });

    // Initialize Highchart:
    $('#cht-tool').highcharts({
        boost: {
            enabled: false,
        },
        chart: {
            zoomType: 'x',
        },
        credits: {
            enabled: false
        },
        title: {
            text: ''
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'datetime',
            title: {
                text: 'Date/Time (UTC)'
            },
            labels: {
                format: '{value:%e-%b-%Y %H:%m}'
            },            //dateTimeLabelFormats: 'day'
        },
        yAxis: {},
        legend: {
            enabled: true,
        },
        plotOptions: {
            series: {
                turboThreshold: 10000//set it to a larger threshold, it is by default to 1000
            },
            line: {
                marker: {
                    enabled: false
                }
            }
        },

        series: [],

        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: [
                        // Print chart:
                        {
                            text: 'Print Chart',
                            onclick: function () {
                                // GTM! - "Print Chart"
                                updateTracker('Plotter Menu', 'Print Chart', '');
                                this.print();
                            }
                        },
                        'separator',
                        // PNG export:
                        {
                            text: 'Download PNG image',
                            onclick: function () {
                                // GTM! - "Download: PNG"
                                updateTracker('Plotter Menu', 'Download', 'PNG');
                                this.exportChart({ type: 'image/png', filename: 'chart' });
                            }
                        },
                        // JPEG export:
                        {
                            text: 'Download JPEG image',
                            onclick: function () {
                                // GTM! - "Download: JPEG"
                                updateTracker('Plotter Menu', 'Download', 'JPEG');
                                this.exportChart({ type: 'image/jpeg', filename: 'chart' });
                            }
                        },
                        // PDF export:
                        {
                            text: 'Download PDF document',
                            onclick: function () {
                                // GTM! - "Download: PDF"
                                updateTracker('Plotter Menu', 'Download', 'PDF');
                                this.exportChart({ type: 'application/pdf', filename: 'chart' });
                            }
                        },
                        // SVG export:
                        {
                            text: 'Download SVG vector image',
                            onclick: function () {
                                // GTM! - "Download: SVG"
                                updateTracker('Plotter Menu', 'Download', 'SVG');
                                this.exportChart({ type: 'image/svg+xml', filename: 'chart' });
                            }
                        },
                        'separator',
                        // CSV download:
                        {
                            text: 'Download CSV',
                            onclick: function () {
                                // GTM! - "Download: CSV"
                                updateTracker('Plotter Menu', 'Download', 'CSV');
                                this.downloadCSV();
                            }
                        },
                        // XLS download:
                        {
                            text: 'Download XLS',
                            onclick: function () {
                                // GTM! - "Download: XLS"
                                updateTracker('Plotter Menu', 'Download', 'XLS');
                                this.downloadXLS();
                            }
                        }
                    ]
                }
            }
        }
    });


    // Event to hide:
    $('.highcharts-menu, .highcharts-menu-item').on('click', function (e) {

        alert('toggled!');
    });

    //Hide html table from export module
    if (Highcharts.getOptions().exporting) {
        Highcharts.getOptions().exporting.buttons.contextButton.menuItems.pop();
    }

});     // end jQuery "ready"


//==================================================================================
// Query data from server:
//==================================================================================
queryData = function () {

    // Acquire user selections:
    var loc_arr = [], owners = {};
    if (_flagLocChkbox) {
        $.each($('#lst-locs input:checked'), function (idx, elem) {
            loc_arr.push($(this).attr('id'));
        });

    } else {
        $.each($('select.sel-loc'), function (idx, elem) {
            var loc_id = $(this).val();
            if (loc_id !== '' && $.inArray(loc_id, loc_arr) === -1) {
                loc_arr.push(loc_id);

                var objLoc = _objLocs[loc_id];
                owners[loc_id] = objLoc.buoyOwners;
            }
        });
    }

    var param_arr = [];

    if (_flagParChkbox) {
        $.each($('#lst-params input:checked'), function (idx, elem) {
            param_arr.push($(this).attr('id'));
        });
    } else {
        $.each($('select.sel-param'), function (idx, elem) {
            var param_id = $(this).val();
            if (param_id !== '' && $.inArray(param_id, param_arr) === -1) {
                param_arr.push(param_id);
            }
        });
    }

    date_start = $('#date-start').val();
    date_end = $('#date-end').val();
    avg_ivld = $('#sel-tavg').val();

    var d1 = new Date(date_start);
    var d2 = new Date(date_end);
    // Error handling:
    if (d1 >= d2) {
        showMessage(_strTitle, 'The selected end date must be later than the start date.');
        return;
    } else if (date_end.year !== date_end.year) {
        showMessage(_strTitle, 'The start and end date must occur within the same calendar year.');
        return;
    }

    if (loc_arr.length === 0 || param_arr.length === 0) {
        var hChart = $('#cht-tool').highcharts();
        removeAllSeries(hChart);
        showMessage(_strTitle, 'At least one location and one parameter must be selected for plotting.');
        return;
    }

    // Show preloader:
    $('.preloader').show();

    // AJAX call to Python CGI-enabled script: 
    $.ajax({
        url: '/ajax/getTSData',
        type: 'POST',
        data: {
            'data_type': $('#sel-datatype').val(),
            'locs': loc_arr.join('|'),
            'owners': JSON.stringify(owners),
            'params': param_arr.join('|'),
            'tperiod': $('#sel-tperiod').val(),
            'date_start': formatDate(date_start, "yyyy-mm-dd"),
            'date_end': formatDate(date_end, "yyyy-mm-dd"),
            'avg_ivld': avg_ivld,       // Averaging interval (in seconds)
        },
        dataType: 'json',
        success: function (objData) {

            // Plot data:
            if (objData.status !== 'abort') {
                plotData(objData);

            }

            // Error message reporting:
            if (objData.err_flag) {
                if (objData.message) {
                    showMessage(_strTitle, objData.message);
                }
            }

            // Hide preloader:
            $('.preloader').fadeOut("slow");

            // Show dialog:
            $('#dlg-tool').dialog('open');

            //$('#dlg-tool').dialog('option', 'position', 'center');
        },
        fail: function () {
            alert('failed');
        }
    });
};

//==================================================================================
// Update Chart Data & Configuration:
//==================================================================================
plotData = function (objData) {

    var ichk = 0;

    // Reinitialize chart:
    var hChart = $('#cht-tool').highcharts();
    _objPlotSeries = {};

    // Remove all series and Y axes:
    removeYAxes(hChart);
    axes_ct = -1;

    // Check if there are any data to plot (if not, show message):
    var point_ct = 0;
    var objLoc = {};

    for (loc_id in objData.locations) {
        objLoc = objData.locations[loc_id];
        point_ct += objLoc.dattim.length;
    }

    if (point_ct === 0) {
        showMessage(_strTitle, 'No data were found for this date range for the selected location(s) and parameter(s). ' +
            'Please note that this viewer does not support NOAA NDBC buoys that are not directly supported in the GLOS DMAC.');
    }

    // Create chart series:
    var loc_ct = 0;
    var arrLocs = [];
    var seriesCt = 0;

    for (loc_id in objData.locations) {
        objLoc = objData.locations[loc_id];

        if (objLoc.dattim.length > 0) {
            arrLocs.push(loc_id);
            loc_ct += 1;

            // Initialize stored data (first loc only!):
            if (loc_ct === 1) {
                _objPlotSeries.loc_id = loc_id;
                _objPlotSeries.dattim = objLoc.dattim;
                _objPlotSeries.params = {};
            }

            //Count parameters for an station
            var objLocParam = 0;

            // Add axis for each parameter:
            for (param_id in objLoc.params) {
                var objParam = objLoc.params[param_id];

                var seriesName = loc_id + ': ' + objParam.desc;

                // Add depth for thermistor depth:
                if (param_id.startsWith('Thermistor_String_at_')) {
                    var arr = param_id.split('_at_');
                    seriesName += ' (' + arr[1] + ')';
                }

                objLocParam += 1;
                var series_data = [];
                var unit = [];
                var val_arr = [];
                var split, isplit = [];
                var t, cdate, dt;

                if ($('#sel-units').val() === 'met') {
                    unit = objLoc.params[param_id].units;
                    for (t = 0; t < objLoc.dattim.length; t++) {

                        //var dt = Date.parse(objLoc.dattim[t].replace('T',' ') + ' UTC');  // Append "UTC" to avoid assumption of local time
                        split = objLoc.dattim[t].split(/[^0-9]/);
                        isplit = [];
                        split.forEach(function (elem) { isplit.push(+elem); }); // string to integer
                        //console.log(isplit);
                        cdate = new Date(Date.UTC(isplit[0], isplit[1] - 1, isplit[2], isplit[3], isplit[4], isplit[5], 0, 0)); //changed for Safari
                        dt = cdate.getTime();

                        var tsval = objParam.values[t];
                        if (parseFloat(tsval) === -9999.0) { tsval = null; }
                        series_data.push([dt, tsval]);
                        val_arr.push(tsval);
                    }
                } else {
                    for (t = 0; t < objLoc.dattim.length; t++) {
                        //var dt = Date.parse(objLoc.dattim[t].replace('T', ' ') + ' UTC');  // Append "UTC" to avoid assumption of local time
                        split = objLoc.dattim[t].split(/[^0-9]/);
                        isplit = [];
                        split.forEach(function (elem) { isplit.push(+elem); }); // string to integer
                        //console.log(isplit);
                        cdate = new Date(Date.UTC(isplit[0], isplit[1] - 1, isplit[2], isplit[3], isplit[4], isplit[5], 0, 0)); //changed for Safari
                        dt = cdate.getTime();

                        tsval = objParam.values[t];
                        if (parseFloat(tsval) === -9999.0) {
                            series_data.push([dt, null]);
                            val_arr.push(null);
                        } else {
                            [tsval, unit] = unitConversion(objParam.values[t], objParam.units);
                            series_data.push([dt, tsval]);
                            val_arr.push(tsval);
                        }
                    }
                }

                //Determine if the parameters have the same description.
                var sameDesc = false;
                if (seriesCt === 0) {
                    sameDesc = false;
                    var paramDesc = objParam.desc;
                }
                else {
                    if (paramDesc === objParam.desc) { sameDesc = true; }
                    else { paramDesc = objParam.desc; }
                }

                // Add to series object:
                seriesCt += 1;
                _objPlotSeries[seriesCt - 1] = {};
                _objPlotSeries[seriesCt - 1].name = seriesName;
                _objPlotSeries[seriesCt - 1].data = series_data;

                // Add new Y-axis:
                if (loc_ct === 1) {
                    axes_ct += 1;

                    hChart.addAxis({            // New yAxis
                        id: param_id,
                        title: {
                            //text: objParam.desc + ' (' + objParam.units + ')'
                            text: objParam.desc + ' (' + unit + ')'
                        },
                        lineWidth: 0.5,
                        lineColor: 'black'
                    });

                    // Add parameter data to object:
                    _objPlotSeries.params[param_id] = {};
                    _objPlotSeries.params[param_id].id = param_id;
                    _objPlotSeries.params[param_id].desc = objParam.desc + ' (' + unit + ')';
                    _objPlotSeries.params[param_id].values = val_arr;
                }

                // Add the new series:
                // Only if the parameter description between a single station is different OR there are multiple stations with a new unique parameter then add series with yAxis
                if ((series_data.length > 0 && !sameDesc) || (series_data.length > 0 && loc_ct > 1 && objLocParam === 1)) {
                    hChart.addSeries({
                        yAxis: param_id,
                        type: 'line',
                        name: seriesName,
                        //color: 'blue',
                        data: series_data
                    });
                }
                //If a station has multiple parameters of the sameDesc then do not addSeries yAxis and hide the yAxis labels and title on chart for particular series
                else if (series_data.length > 0 && sameDesc && axes_ct > 0) {
                    hChart.addSeries({
                        type: 'line',
                        name: seriesName,
                        data: series_data
                    });
                    hChart.yAxis[axes_ct].update({
                        labels: { enabled: false },
                        title: { text: null }
                    });
                }
            }
        }
    }
    // Update chart title:
    hChart.setTitle({ text: 'Site(s): ' + arrLocs.join(', ') });
};

//==================================================================================
// Chart Utility Functions:
//==================================================================================

function removeAllSeries(cht) {
    // Remove all series from a HighChart

    for (var i = cht.series.length - 1; i > -1; i--) {
        cht.series[i].remove();
    }
}

function removeYAxes(cht) {
    // Remove all Y axes from a HighChart

    removeAllSeries(cht);

    for (var i = (cht.yAxis.length - 1); i >= 0; i--) {
        cht.yAxis[i].remove();
    }
}

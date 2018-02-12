// Global variables:
var _strTitle = 'GLOS Data Exporting Tool'
var _objLocs = {};

var _arrParamOrder = ['WSPD', 'GST', 'WDIR', 'WTMP', 'WVHT', 'WPRD', 'MWD', 'APD', 'ATMP', 'PRES', 'DEWP', 'PH', 'DISOXY', 'DIOSAT', 'SPCOND', 'COND', 'YCHLOR', 'YBGALG', 'YTURBI'];
var _arrParamExcl = ['DPD', 'TIDE', 'VIS', 'PTDY', 'DEPTH', 'OTMP', 'CHILL', 'HEAT', 'ICE', 'WSPD10', 'WSPD20'];

var _flagMultiSelect = false;
var _flagParaMultSelect = true;

// Display preloader during page load:
$('.preloader').show();


// jQuery "ready" function:
$(function () {

    // Hide preloader after page is loaded:
    $(window).on('load', function () {
        if ($.isEmptyObject(objGET)) {
            $('.preloader').fadeOut("slow");
        }
    });

    // Show/hide
    $('#ul-locs').toggle(!_flagMultiSelect);
    $('#lst-locs').toggle(_flagMultiSelect);

    $('#ul-params').toggle(!_flagParaMultSelect);
    $('#lst-params').toggle(_flagParaMultSelect);

    //==================================================================================
    // IE Polyfills:
    //==================================================================================
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.substr(position, searchString.length) === searchString;
        };
    }

    //==================================================================================
    // AJAX Security Configuration:
    //==================================================================================

    // Function for retrieving CSRF token:
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
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


    //==================================================================================
    // AJAX to Pull Location IDs & Names (** currently hardcoded for buoys **)
    //==================================================================================
    var data_file = "http://34.211.180.62/BuoyALP/buoymeta_english/all";

    $.getJSON(data_file, function (arrLocMeta) {

        if (_flagMultiSelect) {
            $('#lst-locs').empty();
        } else {
            $('.sel-loc').empty();
            $('.sel-loc').append('<option value="">' + '-------' + '</option>')
        }

        _objLocs = {};

        // Get location ID from URL:
        var strPath = window.location.pathname;
        var arr = strPath.split('/');
        var strLoc = arr[1];

        $.each(arrLocMeta, function (index, objLoc) {
            //Notify users data from NDBC or Env CA is not available. 
            if (objLoc.buoyOwners == 'NOAA-NDBC' || objLoc.buoyOwners == "Env CA") {
                var strLoc = objLoc.id + ': ' + objLoc.longName + ' (Not Available)';
            } else {
                var strLoc = objLoc.id + ': ' + objLoc.longName;
            }

            var strChk = '', strSel = '';

            if (objLoc.id === strLoc) {
                strChk = 'checked';
                strSel = 'selected';
            };
            var strHTML = '';

            if (_flagMultiSelect) {
                strHTML = '<label class="multiselect"><input type="checkbox" class="multiselect loc" id="' + objLoc.id + '" ' + strChk + ' />' + strLoc + '</label>'

                if (objLoc.id === strLoc) {
                    $('#lst-locs').prepend(strHTML);
                } else {
                    $('#lst-locs').append(strHTML);
                };

            } else {
                strHTML = '<option value="' + objLoc.id + '">' + strLoc + '</option>';
                $('.sel-loc').append(strHTML);
            }

            _objLocs[objLoc.id] = objLoc;

            // Debugging:
            if (objLoc.buoyOwners === 'NOAA-NDBC') {
                //console.log(objLoc.id)
            }

        });

        // Load request or build parameter list:
        if ($.isEmptyObject(objGET)) {
            updateParams();
        } else {
            loadRequest();
        }
    });

    // Populate start/end dates in dialog:
    setDateRange();
    $('#date-start, #date-end').prop('disabled', true);

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

    //==================================================================================
    // jQuery UI Widget Initialization:
    //==================================================================================
    // Datepicker:
    $('input.date').each(function () {
        $(this).datepicker({ dateFormat: 'mm/dd/yy' });
    });

    // Dialogs:
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

    $("#dlg-export").dialog({
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

    // Dialog to retrieve permalink for current view:
    $("#dlg-plink").dialog({
        autoOpen: false,
        resizable: true,
        width: 500,
        height: 325,
        modal: true,

        open: function () {

        },
        buttons: {
            /*
                        "Copy Link": function () {
                            $(this).dialog("close");
                        },
                        "Close": function () {
                            $(this).dialog("close");
                        },
            */
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

    //==================================================================================
    // Events/Functions to Update Parameter List:
    //==================================================================================
    if (_flagMultiSelect) {

        // Select event for location list:
        $(document).on('change', '#lst-locs input[type="checkbox"]', function (e) {
            updateParams();
        });

    } else {
        // Select event for location select:
        $('.sel-loc').on('change', function (evt) {
            updateParams();
        });

    }

    function updateParams() {

        // Create array of selected location IDs
        var arrLocs = [];

        if (_flagMultiSelect) {
            var $selLocs = $('#lst-locs input:checked');

            $.each($selLocs, function (idx, elem) {
                var loc_id = $(this).attr('id');
                arrLocs.push(loc_id);
            })

        } else {
            $.each($('.sel-loc'), function (idx, elem) {
                var loc_id = $(this).val();
                if (loc_id !== '' && $.inArray(loc_id, arrLocs) === -1) {
                    arrLocs.push(loc_id);
                }
            });
        }

        // Populate unique list of parameters for selected locations:
        var objParams = getUniqueParams(arrLocs);
        var arrSelParams = [];
        var $selParams;

        if (_flagParaMultSelect) {
            $selParams = $('#lst-params input:checked');
            $('#lst-params').empty();

        } else {
            $.each($('.sel-param'), function (idx, objElem) { arrSelParams.push($(this).val()) });
            $('.sel-param').empty();
            $('.sel-param').append('<option value="">' + '-------' + '</option>');
        }

        var param1 = '';

        for (i = 0; i < _arrParamOrder.length; i++) {
            param_id = _arrParamOrder[i];
            if (i === 0) { param1 = param_id };
            var strHTML = '';

            // Multiselect:
            if (param_id in objParams) {
                if (_flagParaMultSelect) {
                    var strChk = '';
                    if ($($selParams).filter('#' + param_id).length > 0) { strChk = 'checked' };

                    strHTML = '<label class="multiselect"><input type="checkbox" class="multiselect param" id="' + param_id + '" ' + strChk + ' />' + objParams[param_id] + '</label>'
                    $('#lst-params').append(strHTML);

                } else {
                    strHTML = '<option value="' + param_id + '">' + objParams[param_id] + '</option>';
                    $('.sel-param').append(strHTML);
                }

            };
        }

        // If nothing selected, select first parameter:
        if (_flagParaMultSelect) {
            $selParams = $('#lst-params input:checked');
            if ($selParams.length === 0) {
                $('#lst-params input').first().prop('checked', true);
            }
        } else {
            $.each($('.sel-param'), function (idx, objElem) {
                if ($(this).find('option[value="' + arrSelParams[idx] + '"]').length > 0) {
                    $(this).val(arrSelParams[idx]);
                }
            });
        };

    }


    function getUniqueParams(arrLocs) {

        objParams = {};

        if (arrLocs.length > 0) {
            $.each(arrLocs, function (idx) {
                var objLoc = _objLocs[arrLocs[idx]];
                if (objLoc.obsID) {

                    for (var p = 0; p < objLoc.obsID.length; p++) {
                        var param_id = objLoc.obsID[p];

                        if (!(param_id in objParams)) {
                            objParams[param_id] = objLoc.obsLongName[p];
                        }
                    }
                }

            });
        }

        return objParams;
    }

    //==================================================================================
    // Events Related to User Selections:
    //==================================================================================
    // Event to filter by Great Lake:
    $('#sel-lake').on('change', function (e) {

        var arrSelLocs = [];
        $.each($('.sel-loc'), function (idx, objLoc) { arrSelLocs.push($(this).val()) });

        $('.sel-loc').empty();
        $('.sel-loc').append('<option value="" selected>' + '-------' + '</option>')

        var strLake = $(this).val();

        $.each(_objLocs, function (key, objLoc) {
            if (strLake === 'ALL' || objLoc.lake === strLake) {
                var strLoc = objLoc.id + ': ' + objLoc.longName;
                var strHTML = '<option value="' + objLoc.id + '">' + strLoc + '</option>';
                $('.sel-loc').append(strHTML);
            }
        });

        // Re-select previous selections, if available:
        $.each($('.sel-loc'), function (idx, objLoc) {
            if ($(this).find('option[value="' + arrSelLocs[idx] + '"]').length > 0) {
                $(this).val(arrSelLocs[idx]);
            }
        });

    });

    // Select event for time period:
    $('#sel-tperiod').on('change', function (e) {
        $('#date-start, #date-end').prop('disabled', $(this).val() !== 'custom');

        if ($(this).val() !== 'custom') {
            setDateRange();
        }

    });

    // Time-averaging interval:
    $('#sel-tavg').on('change', function (e) {
        $(this).val() === 'none';       // TMR!!! - force to "none"
    });

    // Permalink generation:
    var clipboard = new Clipboard('#btn-copy-plink');

    clipboard.on('success', function (e) {
        showMessage(_strTitle, 'The permalink has been copied to the clipboard and can now be pasted elsewhere.');
    });

    $('#btn-download').on('click', function (evt) {
        // download csv/excel file
        downloadData();
    });

    //==================================================================================
    // Data Retrieval & Plotting:
    //==================================================================================
    function loadRequest() {

        // Loads chart data based on user GET request including location and parameter lists and start/end date

        if ($.isEmptyObject(objGET)) { return };
        var errDate = false;

        // Select data type (only "buoy" is currently available):
        var $datatype = $('#sel-datatype');
        var strDataType = 'buoy';               // default

        if (objGET.hasOwnProperty('datatype')) {
            if ($datatype.find('option[value="' + objGET.data_type + '"]').length > 0) {
                strDataType = objGET.data_type;
            }
        };
        $datatype.val(strDataType);

        // Select locations & load parameter set:
        var loc_arr = [], loc_ct = 0;

        if (objGET.hasOwnProperty('locs')) {
            loc_arr = objGET.locs.split('|');

            $.each(loc_arr, function (idx, loc_id) {
                var $loc = $('#sel-loc' + (idx + 1).toString());
                if ($loc.find('option[value="' + loc_id + '"]').length > 0) {
                    $loc.val(loc_id);
                    loc_ct += 1;
                }
            });
        }

        // Populate & select parameters:
        if (loc_ct > 0) {
            updateParams();

            if (objGET.hasOwnProperty('locs')) {
                var param_arr = objGET.params.split('|');
                var param_ct = 0;

                $.each(param_arr, function (idx, param_id) {
                    var $par = $('#sel-param' + (idx + 1).toString());
                    if ($par.find('option[value="' + param_id + '"]').length > 0) {
                        $par.val(param_id);
                        param_ct += 1;
                    }
                });
            };
        }

        // Determine time period & date range (if necessary):
        var $tperiod = $('#sel-tperiod');
        var strTPeriod = '5_day';       //default

        if (objGET.hasOwnProperty('tperiod')) {
            if ($tperiod.find('option[value="' + objGET.tperiod + '"]').length > 0) {
                strTPeriod = objGET.tperiod;
            }
        };

        $tperiod.val(strTPeriod);
        if (strTPeriod !== 'custom') { setDateRange() }

        // Select custom date range (offset of 6 hours hardcoded to maintain input dates):
        var tzOffset;

        if (strTPeriod === 'custom') {
            try {
                date_start = Date.parse(objGET.date_start);
                tzOffset = (6 * 60) * 60000 //date_start.getTimezoneOffset() * 60000;
                $('#date-start').val(formatDate(date_start + tzOffset, 'mm/dd/yyyy'));
            } catch (err) {
                errDate = true;
            }

            try {
                date_end = Date.parse(objGET.date_end);
                tzOffset = (6 * 60) * 60000 //date_end.getTimezoneOffset() * 60000;
                $('#date-end').val(formatDate(date_end + tzOffset, 'mm/dd/yyyy'));
            } catch (err) {
                errDate = true;
            }
        };

        // Averaging interval:
        var $tavg = $('#sel-tavg');
        var strTAvg = 'none';           // default

        if (objGET.hasOwnProperty('tavg')) {
            if ($tavg.find('option[value="' + objGET.tavg + '"]').length > 0) {
                strTAvg = objGET.tavg;
            }
        };

        $tavg.val(strTAvg);

        // Specify units:
        var $units = $('#sel-units');
        var strUnits = 'met';           // default

        if (objGET.hasOwnProperty('units')) {
            if ($units.find('option[value="' + objGET.units + '"]').length > 0) {
                strUnits = objGET.units;
            }
        };

        $units.val(strUnits);

        //--------------------------------------------
        // Query data & update chart:
        //--------------------------------------------
        if (loc_ct > 0 && param_ct > 0 && !errDate) {
            queryData();
        }

    }

    // can't use ajax to open the file download prompt, a known issue ?
    // use: 
    // window.location = "download.action?para1=value1...."
    //https://stackoverflow.com/questions/4545311/download-a-file-by-jquery-ajax

    function downloadData() {

        // Acquire user selections:
        var loc_arr = [], owners = {};
        if (_flagMultiSelect) {
            $.each($('#lst-locs input:checked'), function (idx, elem) {
                loc_arr.push($(this).attr('id'));
            })

        } else {
            $.each($('select.sel-loc'), function (idx, elem) {
                var loc_id = $(this).val();
                if (loc_id !== '' && $.inArray(loc_id, loc_arr) === -1) {
                    loc_arr.push(loc_id);
                    owners[loc_id] = _objLocs[loc_id].buoyOwners;
                }
            })
        }

        var param_arr = [];

        if (_flagParaMultSelect) {
            $.each($('#lst-params input:checked'), function (idx, elem) {
                param_arr.push($(this).attr('id'));
            })
        } else {
            $.each($('select.sel-param'), function (idx, elem) {
                var param_id = $(this).val();
                if (param_id !== '' && $.inArray(param_id, param_arr) === -1) {
                    param_arr.push(param_id);
                }
            })
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
            showMessage(_strTitle, 'At least one location and one parameter must be selected for plotting.');
            return;
        }

        var file_type = $('#sel-filetype').val();
        var loc = loc_arr[0];
        var param = param_arr.join("|");
        var sdate = date_start;
        var edate = date_end;
        var owner = owners[0];
        var data_type = $('#sel-datatype').val();
        var unit_type = $('#sel-units').val();

        window.location = "download_data" +
            "?ftype=" + file_type +
            "&utype=" + unit_type +
            "&data_type=" + data_type +
            "&loc=" + loc +
            "&param_arr=" + param +
            "&date_start=" + sdate +
            "&date_end=" + edate +
            "&owner=" + owner +
            "&avg_ivld=" + avg_ivld;
        return;

    }

    function queryData() {

        // Acquire user selections:
        var loc_arr = [], owners = {};
        if (_flagMultiSelect) {
            $.each($('#lst-locs input:checked'), function (idx, elem) {
                loc_arr.push($(this).attr('id'));
            })

        } else {
            $.each($('select.sel-loc'), function (idx, elem) {
                var loc_id = $(this).val();
                if (loc_id !== '' && $.inArray(loc_id, loc_arr) === -1) {
                    loc_arr.push(loc_id);
                    owners[loc_id] = _objLocs[loc_id].buoyOwners;
                }
            })
        }

        var param_arr = [];

        if (_flagParaMultSelect) {
            $.each($('#lst-params input:checked'), function (idx, elem) {
                param_arr.push($(this).attr('id'));
            })
        } else {
            $.each($('select.sel-param'), function (idx, elem) {
                var param_id = $(this).val();
                if (param_id !== '' && $.inArray(param_id, param_arr) === -1) {
                    param_arr.push(param_id);
                }
            })
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
                'loc_arr': loc_arr,
                'owners': JSON.stringify(owners),
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


    //==================================================================================
    // Supporting Functions:
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


    function setDateRange() {
        // Returns array of start/end date (for non-custom dates)

        if ($('#sel-tperiod').val() === 'custom') { return };
        var arr = $('#sel-tperiod').val().split('_');

        var intTime = parseInt(arr[0]);
        var strTUnit = arr[1];

        var d_end = new Date();
        var d_start = new Date();

        if (strTUnit.slice(0, 1) === 'd' || strTUnit.slice(0, 1) === 'M') {
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

        hour = "" + d.getHours(); if (hour.length === 1) { hour = "0" + hour; }
        minute = "" + d.getMinutes(); if (minute.length === 1) { minute = "0" + minute; }
        second = "" + d.getSeconds(); if (second.length === 1) { second = "0" + second; }

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

    function getPermalink() {

        var arr = document.location.href.split('?');
        var strLink = arr[0] + '?';

        // Monitoring/data type:
        strLink += 'data_type=' + $('#sel-datatype').val();

        // Monitoring/data type:
        strLink += '&units=' + $('#sel-units').val();

        // Locations and parameters:
        strLink += '&locs=' + getSelections('sel-loc', '|');
        strLink += '&params=' + getSelections('sel-param', '|');

        // Time period:
        strTPeriod = $('#sel-tperiod').val();
        strLink += '&tperiod=' + strTPeriod;

        // Custom dates:
        if (strTPeriod === 'custom') {
            var date_start = Date.parse($('#date-start').val());
            var date_end = Date.parse($('#date-end').val());

            strLink += '&date_start=' + formatDate(date_start, "yyyy-mm-dd");
            strLink += '&date_end=' + formatDate(date_end, "yyyy-mm-dd");
        };

        // Time aggregation:
        strLink += '&tavg=' + $('#sel-tavg').val();


        return strLink;
    };


    function getSelections(strClass, strDelim) {
        var arrVals = [];

        $.each($('select.' + strClass), function (idx, elem) {
            var strID = $(this).val();
            if (strID !== '' && $.inArray(strID, arrVals) === -1) {
                arrVals.push(strID);
            }
        })

        if (strDelim !== undefined && strDelim !== '') {
            return arrVals;
        } else {
            return arrVals.join(strDelim);
        }

    }

});         // end jQuery ready function
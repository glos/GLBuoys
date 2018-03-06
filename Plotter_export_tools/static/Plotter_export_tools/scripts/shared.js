//==================================================================================
// Global Variables - Declaration & Initialization:
//==================================================================================

var _strTitle = '';
var _isExport = false, _isPlotter = false;
var _objLocs = {};
var _metaJSON = '../static/Buoy_tool/data/meta_english.json';
//var _metaJSON = 'http://34.209.199.227/static/Buoy_tool/data/meta_english.json';

var _arrParamOrder = ['WSPD', 'GST', 'WDIR', 'WTMP', 'WVHT', 'WPRD', 'MWD', 'APD', 'ATMP', 'PRES', 'DEWP', 'PH', 'DISOXY', 'DIOSAT', 'SPCOND', 'COND', 'YCHLOR', 'YBGALG', 'YTURBI'];
var _arrParamExcl = ['DPD', 'TIDE', 'VIS', 'PTDY', 'DEPTH', 'OTMP', 'CHILL', 'HEAT', 'ICE', 'WSPD10', 'WSPD20'];

var _objParamNames = {
    "WVHT": "Significant Wave Height",
    "MWDIR": "Mean Wave Direction",
    "WPRD": "Wave Period",
    "ATMP": "Air Temperature",
    "RH": "Relative Humidity",
    "DEWP": "Dew Point",
    "PRES": "Air Pressure",
    "WDIR": "Wind Direction",
    "WSPD": "Wind Speed",
    "GST": "Wind Gust",
    "WTMP": "Water Temperature",
    "SRAD": "Solar Radiation",
    "VBAT": "Battery Voltage",
    "DISOXY": "Dissolved Oxygen",
    "DIOSAT": "Dissolved Oxygen at Saturation",
    "SPCOND": "Specific Conductivity",
    "PH": "PH",
    "YTURBI": "Turbidity",
    "YCHLOR": "Chlorophyll",
    "YBGALG": "Blue-Green-Algae"
}

var _flagLocChkbox = false;
var _flagParChkbox = true;

//==================================================================================
// jQuery "ready" function:
//==================================================================================
$(function () {

    // Hide preloader after page load:
    $('.preloader').hide();

    // Hide preloader after page is loaded:
    $(window).on('load', function () {
        if ($.isEmptyObject(objGET)) {
            $('.preloader').fadeOut("slow");
        }
    });

    // Set page-specific parameters:
    var arrParts = window.location.href.split('/');
    var strPage = arrParts[arrParts.length - 1]; 
    _isExport = (strPage.startsWith('export'));
    _isPlotter = (strPage.startsWith('plotter'));

    if (_isExport) {
        _strTitle = "Data Export";
        _flagLocChkbox = false;
        _flagParChkbox = true;
    } else {
        _strTitle = "Data Plotter";
        _flagLocChkbox = false;
        _flagParChkbox = false;
    }
    
    // Show/hide
    $('#ul-locs').toggle(!_flagLocChkbox);
    $('#lst-locs').toggle(_flagLocChkbox);

    $('#ul-params').toggle(!_flagParChkbox);
    $('#lst-params').toggle(_flagParChkbox);

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
    $.getJSON(_metaJSON, function (arrLocMeta) {

        if (_flagLocChkbox) {
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
            var naFlag = (objLoc.buoyOwners == 'NOAA-NDBC' || objLoc.buoyOwners == "Env CA");

            if (naFlag) {
                var strLoc = objLoc.id + ': ' + objLoc.longName + ' (Not Available)';
            } else {
                var strLoc = objLoc.id + ': ' + objLoc.longName;

                var strChk = '', strSel = '';

                if (objLoc.id === strLoc) {
                    strChk = 'checked';
                    strSel = 'selected';
                };
                var strHTML = '';

                if (_flagLocChkbox) {
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

            }

            // Debugging:
            if (objLoc.buoyOwners === 'NOAA-NDBC') {
                //console.log(objLoc.id)
            }

        });

        // Load request or build parameter list:
        var loadFlag = true;
        if (objGET === undefined) {
            loadFlag = false;
        } else {
            loadFlag = (!$.isEmptyObject(objGET));
        }

        if (!loadFlag) {
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

    $("#dlg-map").dialog({
        autoOpen: false,
        resizable: true,
        width: 840,
        height: 760,
        modal: true,

        open: function () {

        },
        buttons: {
            "Full Size": function () {
                //$(this).dialog("close");
                window.open('../static/Plotter_export_tools/img/BuoyMap.jpg');
            },
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
    if (_flagLocChkbox) {

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

        if (_flagLocChkbox) {
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

        if (_flagParChkbox) {
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
                if (_flagParChkbox) {
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
        if (_flagParChkbox) {
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
                var arrParamID = [];

                if (objLoc.obsID) {
                    arrParamID = objLoc.obsID;
                } else if (objLoc.staticObs) {
                    arrParamID = objLoc.staticObs;
                } else {
                    return objParams;
                }

                for (var p = 0; p < arrParamID.length; p++) {
                    var param_id = arrParamID[p];

                    if (!(param_id in objParams)) {
                        if (_objParamNames[param_id]) {
                            objParams[param_id] = _objParamNames[param_id];
                        } else {
                            objParams[param_id] = param_id;
                        }
                        //objParams[param_id] = objLoc.obsLongName[p];
                    }
                }
            });
        }

        return objParams;
    }

    //==================================================================================
    // Events Related to User Selections (shared across plotter & export pages):
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

    $('#btn-get-link').on('click', function (evt) {
        evt.preventDefault();
        // Create & populate permalink:
        $('#txt-plink').val(getPermalink());

        // Show dialog:
        $('#dlg-plink').dialog('open');
    });

    $('#btn-copy-plink').on('click', function (evt) {
        evt.preventDefault();
        // Copy permalink to OS clipboard
    });

    $('#btn-close-plink').on('click', function (evt) {
        evt.preventDefault();
        // Close permalink dialog
        $('#dlg-plink').dialog('close');
    });

    // Show buoy map:
    $('a#view-map').on('click', function (evt) {
        evt.preventDefault();
        // Show dialog:
        $('#dlg-map').dialog('open');
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

        if (objGET.hasOwnProperty('data_type')) {
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

            if (objGET.hasOwnProperty('params')) {
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

        if (objGET.hasOwnProperty('avg_ivld')) {
            if ($tavg.find('option[value="' + objGET.avg_ivld + '"]').length > 0) {
                strTAvg = objGET.avg_ivld;
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
        if (_isPlotter && loc_ct > 0 && param_ct > 0 && !errDate) {
            queryData();
        }

    }

    // Parameter select/clear all events:
    $('.btn-param').on('click', function (e) {
        var strID = $(this).attr('id');
        var bChk = false;
        if (strID === 'btn-selParam') { bChk = true };

        $('#lst-params input').prop('checked', bChk);
    });

});         // end jQuery ready function


//==================================================================================
// Supporting Functions:
//==================================================================================

setDateRange = function () {
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

formatDate = function (date, fmt) {
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

formatDateTime = function (dateVal) {

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
showMessage = function (strTitle, strMsg, fadeOut, arrSize) {

    if (arrSize === undefined) { arrSize = [600, 300] };
    if (strTitle === '') { strTitle = 'GLOS Tool' };

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

getPermalink = function () {

    var arr = document.location.href.split('?');
    var strLink = arr[0] + '?';
    strLink = strLink.replace('/export?', '/download_data?');

    // File type, data type, units:
    if (_isExport) {
        strLink += 'ftype=' + getReqParam('ftype') + '&';
    }

    strLink += 'data_type=' + getReqParam('data_type');
    strLink += '&units=' + getReqParam('units');

    // Locations and parameters:
    strLink += '&locs=' + getReqParam('locs');
    strLink += '&params=' + getReqParam('params');

    // Time period:
    var tperiod = getReqParam('tperiod');
    strLink += '&tperiod=' + tperiod;

    // Start/end dates (only include for "custom" time period):
    if (tperiod === 'custom') {
        strLink += '&date_start=' + getReqParam('date_start');
        strLink += '&date_end=' + getReqParam('date_end');
    }

    // Time aggregation:
    strLink += '&avg_ivld=' + getReqParam('avg_ivld');

    return strLink;
};


getReqParam = function (reqParam) {
    var strVal = '';

    switch (reqParam) {
        // File/data type, units:
        case ('ftype'):
            strVal = $('#sel-filetype').val();
            break;
        case ('data_type'):
            strVal = $('#sel-datatype').val();
            break;
        case ('units'):
            strVal = $('#sel-units').val();
            break;
        // Locations / owners:
        case ('locs'):
        case ('owners'):
            strVal = getSelections('sel-loc', 'lst-locs', '|');
            //TMR!!! - handle owners
            break;
        case ('params'):
            strVal = getSelections('sel-param', 'lst-params', '|');
            break;
        // Temporal components:
        case ('tperiod'):
            strVal = $('#sel-tperiod').val();
            break;
        case ('date_start'):
        case ('date_end'):
            var dateVal = Date.parse($('#' + reqParam.replace('_', '-')).val());
            strVal = formatDate(dateVal, "yyyy-mm-dd");
            break;
        case ('avg_ivld'):
            strVal = $('#sel-tavg').val();
            break;
    }
    // Return string:
    return strVal;
}

getSelections = function (strSelClass, strLstID, strDelim) {
    var arrVals = [];

    var multiFlag = ($('#' + strLstID).css('display') !== 'none');

    if (multiFlag) {
        $.each($('#' + strLstID + ' input:checked'), function (idx, elem) {
            arrVals.push($(this).attr('id'));
        });
    }
    else {
        $.each($('select.' + strSelClass), function (idx, elem) {
            var strID = $(this).val();
            if (strID !== '' && $.inArray(strID, arrVals) === -1) {
                arrVals.push(strID);
            }
        });
    }

    if (strDelim !== undefined && strDelim !== '') {
        return arrVals.join(strDelim);
    } else {
        return arrVals;
    }
}           // end "getSelections" function...

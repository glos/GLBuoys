//==================================================================================
// Global Variables - Declaration & Initialization:
//==================================================================================

var _strTitle = '';
var _isExport = false, _isPlotter = false;
var _toolType = '';
var _objLocs = {};
var _metaJSON = '../../static/Buoy_tool/data/meta_english.json';
//var _metaJSON = 'http://34.209.199.227/static/Buoy_tool/data/meta_english.json';

var _arrParamOrder = ['Wind_Speed', 'Wind_Gust', 'Wind_from_Direction', 'Water_Temperature_at_Surface', 'Significant_Wave_Height', 'max_wave_height', 'Significant_Wave_Period', 'significant_wave_from_direction', 'Air_Temperature', 'Air_Pressure', 'Dew_Point', 'Relative_Humidity', 'Solar_Radiation', 'dissolved_oxygen', 'dissolved_oxygen_saturation', 'water_conductivity', 'ysi_chlorophyll', 'ysi_blue_green_algae', 'ysi_turbidity','ph'];

var _objParamNames = {
    "Significant_Wave_Height": "Significant Wave Height",
    "max_wave_height": "Maximum Wave Height",
    "significant_wave_from_direction": "Mean Wave Direction",
    "Significant_Wave_Period": "Wave Period",
    "Air_Temperature": "Air Temperature",
    "Relative_Humidity":"Relative Humidity",
    "Dew_Point": "Dew Point",
    "Air_Pressure": "Air Pressure",
    "Wind_from_Direction": "Wind Direction",
    "Wind_Speed": "Wind Speed",
    "Wind_Gust": "Wind Gust",
    "Water_Temperature_at_Surface": "Water Temperature",
    "Solar_Radiation": "Solar Radiation",
    "battery_voltage": "Battery Voltage",
    "dissolved_oxygen": "Dissolved Oxygen",
    "dissolved_oxygen_saturation": "Dissolved Oxygen at Saturation",
    "water_conductivity": "Specific Conductivity",
    "ph": "PH",
    "ysi_turbidity": "Turbidity",
    "ysi_chlorophyll": "Chlorophyll",
    "ysi_blue_green_algae": "Blue-Green-Algae"
}

var _flagLocChkbox = false;
var _flagParChkbox = true;

//==================================================================================
// jQuery "ready" function:
//==================================================================================
$(function () {

    //Check if user is using Internet explorer
    detectIE();

    // Hide preloader after page load:
    $('.preloader').hide();

    // Hide preloader after page is loaded:
    $(window).on('load', function () {
        if ($.isEmptyObject(objGET)) {
            $('.preloader').fadeOut("slow");
        }
    });

    // Append thermistor string options to end of param order list:
    for (var itmp = 1; itmp < 40; itmp++) {
        _arrParamOrder.push('Thermistor_String_at_' + itmp.toString() + 'm');
    }

    // Set page-specific parameters:
    var arrParts = window.location.href.split('/');
    var strPage = arrParts[arrParts.length - 1]; 
    _isExport = (strPage.startsWith('export'));
    console.log(_isExport, _isPlotter);
    _isPlotter = (strPage.startsWith('plotter'));
    if (_isExport) { _toolType = 'exporter' } else { _toolType = 'plotter' };

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
            var loc_id = objLoc.id;

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
                    strHTML = '<label class="multiselect"><input type="checkbox" class="multiselect loc" id="' + loc_id + '" ' + strChk + ' />' + strLoc + '</label>'

                    if (objLoc.id === strLoc) {
                        $('#lst-locs').prepend(strHTML);
                    } else {
                        $('#lst-locs').append(strHTML);
                    };

                } else {
                    strHTML = '<option value="' + loc_id + '">' + strLoc + '</option>';
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

    // Dialog for plot table:
    $("#dlg-ptable").dialog({
        autoOpen: false,
        resizable: true,
        width: 700,
        height: 650,
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


    //==================================================================================
    // Events/Functions to Update Parameter List:
    //==================================================================================
    if (_flagLocChkbox) {

        // Select event for location list:
        $(document).on('change', '#lst-locs input[type="checkbox"]', function (e) {
            // GTM! - "Locations"
            if ($(this).is(':checked')) {
                updateTracker('Data Selections', 'Locations', $(this).attr('id'));
            }
            updateParams();
        });

    } else {
        // Select event for location select:
        $('.sel-loc').on('change', function (evt) {
            // GTM! - "Locations"
            updateTracker('Data Selections', 'Locations', $(this).val());

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
        var param_name = '';

        for (i = 0; i < _arrParamOrder.length; i++) {
            param_id = _arrParamOrder[i];
            if (i === 0) { param1 = param_id };
            var strHTML = '';

            // Multiselect:
            if (param_id in objParams) {
                param_name = objParams[param_id];

                if (_flagParChkbox) {
                    var strChk = '';
                    if ($($selParams).filter('#' + param_id).length > 0) { strChk = 'checked' };

                    strHTML = '<label class="multiselect"><input type="checkbox" class="multiselect param" id="' + param_id + '" ' + strChk + ' />' + param_name + '</label>'
                    $('#lst-params').append(strHTML);

                } else {
                    strHTML = '<option value="' + param_id + '">' + param_name + '</option>';
                    $('.sel-param').append(strHTML);
                }

            };
        }

        // Add thermistor string entries at end of list:
        /*
        for (param_id in objParams) {
            if (param_id.startsWith('Thermistor_String_at_')) {
                param_name = objParams[param_id];

                if (_flagParChkbox) {
                    var strChk = '';
                    if ($($selParams).filter('#' + param_id).length > 0) { strChk = 'checked' };

                    strHTML = '<label class="multiselect"><input type="checkbox" class="multiselect param" id="' + param_id + '" ' + strChk + ' />' + param_name + '</label>'
                    $('#lst-params').append(strHTML);

                } else {
                    strHTML = '<option value="' + param_id + '">' + param_name + '</option>';
                    $('.sel-param').append(strHTML);
                }
            }
        }
        */

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

    // Parameter selection tracking:
    if (_flagParChkbox) {
        $(document).on('change', '#lst-params input[type="checkbox"]', function (e) {
            // GTM! - "Parameters"
            if ($(this).is(':checked')) {
                updateTracker('Data Selections', 'Parameters', $(this).attr('id'));
            }
        });

    } else {
        $('.sel-param').on('change', function (e) {
            // GTM! - "Parameters"
            updateTracker('Data Selections', 'Parameters', $(this).val());
        });
    }


    function getUniqueParams(arrLocs) {

        objParams = {};

        if (arrLocs.length > 0) {
            $.each(arrLocs, function (idx) {
                var loc_id = arrLocs[idx]
                var objLoc = _objLocs[loc_id];

                if (objLoc === undefined) {
                    loc_id = loc_id.slice(0, -2);
                    objLoc = _objLocs[loc_id];
                }

                var arrParamID = [];

                arrParamID = objLoc.staticObs;

                for (var p = 0; p < arrParamID.length; p++) {
                    var param_id = arrParamID[p];

                    if (!(param_id in objParams)) {
                        if (_objParamNames[param_id]) {
                            objParams[param_id] = _objParamNames[param_id];

                        } else {            // Not in the lookup list
                            if (param_id.startsWith('Thermistor_String_at_')) {
                                var arr = param_id.split('_at_');
                                objParams[param_id] = 'Water Temperature at ' + arr[1] + '';

                            } else {
                                objParams[param_id] = param_id;
                            }
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
    // Event to filter by monitoring data type (*disabled* - placeholder for now)
    $('#sel-datatype').on('change', function (e) {
        e.preventDefault();
        // GTM! - "Monitoring Type"
        updateTracker('Data Selections', 'Monitoring Type', $(this).val());
    });

    $('#sel-filetype').on('change', function (e) {
        e.preventDefault();
        // GTM! - "File Format"
        updateTracker('Tool Options', 'File Format', $(this).val());
    });

    // Event to filter by Great Lake:
    $('#sel-lake').on('change', function (e) {
        e.preventDefault();
        // GTM! - "Lake"
        updateTracker('Data Selections', 'Lake', $(this).val());

        var arrSelLocs = [];
        $.each($('.sel-loc'), function (idx, objLoc) { arrSelLocs.push($(this).val()) });

        if (_flagLocChkbox) {
            $('#lst-locs').empty();
        } else {
            $('.sel-loc').empty();
            $('.sel-loc').append('<option value="">' + '-------' + '</option>')
        }

        var strLake = $(this).val();
        var strHTML = '';

        $.each(_objLocs, function (key, objLoc) {
            if (strLake === 'ALL' || objLoc.lake === strLake) {
                var loc_id = objLoc.id;
                var strLoc = loc_id + ': ' + objLoc.longName;

                // Populate multi-checkbox or selects:
                if (_flagLocChkbox) {
                    strHTML = '<label class="multiselect"><input type="checkbox" class="multiselect loc" id="' + loc_id + '" ' + strChk + ' />' + strLoc + '</label>'
                    $('#lst-locs').append(strHTML);
                } else {
                    strHTML = '<option value="' + loc_id + '">' + strLoc + '</option>';
                    $('.sel-loc').append(strHTML);
                }

            }
        });

        // Re-select previous selections, if available:
        $.each($('.sel-loc'), function (idx, objLoc) {
            if ($(this).find('option[value="' + arrSelLocs[idx] + '"]').length > 0) {
                $(this).val(arrSelLocs[idx]);
            }
        });

    });

    // Select units:
    $('#sel-units').on('change', function (e) {
        // GTM! - "Units"
        updateTracker('Data Selections', 'Units', $(this).val());
    });

    // Select event for time period:
    $('#sel-tperiod').on('change', function (e) {
        // GTM! - "Time Period"
        updateTracker('Data Selections', 'Time Period', $(this).val());

        $('#date-start, #date-end').prop('disabled', $(this).val() !== 'custom');

        if ($(this).val() !== 'custom') {
            setDateRange();
        }

    });

    // Time-averaging interval:
    $('#sel-tavg').on('change', function (e) {
        // GTM! - "Avg Interval"
        updateTracker('Data Selections', 'Avg Interval', $(this).val());

        //$(this).val() === 'none';       // TMR!!! - force to "none"
    });

    // Permalink generation:
    var clipboard = new Clipboard('#btn-copy-plink');

    clipboard.on('success', function (e) {
        showMessage(_strTitle, 'The permalink has been copied to the clipboard and can now be pasted elsewhere.');
    });

    $('#btn-get-link').on('click', function (evt) {
        evt.preventDefault();
        // GTM! - "Get Permalink"
        updateTracker('Tool Options', 'Get Permalink', '');

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
        // GTM! - "View Map"
        updateTracker('Tool Options', 'View Map', '');

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

                // Make sure no parameters are selected:
                $('.sel-param').val('');
                $('#lst-params input').prop('checked', false);

                // Select parameters in UI:
                $.each(param_arr, function (idx, param_id) {
                    if (_flagParChkbox) {
                        var $chkPar = $('#lst-params input').filter('#' + param_id);
                        if ($chkPar.length > 0) {
                            $chkPar.prop('checked', true);
                            param_ct += 1;
                        }

                    } else {
                        var $par = $('#sel-param' + (idx + 1).toString());
                        if ($par.find('option[value="' + param_id + '"]').length > 0) {
                            $par.val(param_id);
                            param_ct += 1;
                        }
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
        if (loc_ct > 0 && param_ct > 0 && !errDate) {
            if (_isPlotter) {
                queryData();

            } else if (_isExport) {
                // GTM! - "Download File"
                updateTracker('Tool Options', 'Download File', '');
                downloadData();         // download csv/xls file
            }
        }

    }

    // Parameter select/clear all events:
    $('.btn-param').on('click', function (e) {
        var strID = $(this).attr('id');
        var bChk = false;
        if (strID === 'btn-selParam') { bChk = true };

        $('#lst-params input').prop('checked', bChk);
    });

    // Modify "end date" default when start date is updated:
    $('#date-start').on('change', function (e) {
        var sDate = new Date($(this).val());
        var eDate = new Date();
        var os_days = 1;
        eDate.setTime(sDate.getTime() + os_days * 86400000);

        $('#date-end').val(formatDate(eDate, 'mm/ dd / yyyy'));
        $('#date-end').datepicker('option', 'defaultDate', eDate);
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
};

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
};

formatDateTime = function (dateVal) {
    // Returns formatted date/time based on UTC

    var d = new Date(dateVal);

    hour = "" + d.getUTCHours(); if (hour.length === 1) { hour = "0" + hour; }
    minute = "" + d.getUTCMinutes(); if (minute.length === 1) { minute = "0" + minute; }
    second = "" + d.getUTCSeconds(); if (second.length === 1) { second = "0" + second; }

    dformat = [d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCFullYear()].join('/') + ' ' +
        [hour, minute, second].join(':');
    return dformat;
};

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

formatValue = function (val) {

    if (isNaN(val)) {
        return val;
    } else {
        absVal = Math.abs(val);

        if (absVal === 0.0) {
            return val.toFixed(0);
        } else if (absVal <= 0.001) {
            return val.toExponential(3);
        } else if (absVal <= 0.01) {
            return val.toFixed(6);
        } else if (absVal <= 0.1) {
            return val.toFixed(5);
        } else if (absVal <= 1.0) {
            return val.toFixed(4);
        } else if (absVal <= 10.0) {
            return val.toFixed(3);
        } else if (absVal <= 100.0) {
            return val.toFixed(2);
        } else if (absVal <= 1000.0) {
            return val.toFixed(1);
        } else if (absVal >= 1000000.0) {
            return val.toExponential(3);
        } else {
            return val.toFixed(0);
        }
    }
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
    //strLink = strLink.replace('/export?', '/download_data?');

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
            var $date = $('#' + reqParam.replace('_', '-'));

            if ($date.val() !== '') {
                var dateVal = Date.parse($date.val());
                strVal = formatDate(dateVal, "yyyy-mm-dd");
            }
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


// Update Google Tracking array:
updateTracker = function (strCategory, strAction, strLabel) {

    // Event key/value:
    var evt_key = 'event';
    var evt_val = _toolType + 'Event';
    // Category, Action, Label keys:
    var cat_key = _toolType + 'Category';
    var act_key = _toolType + 'Action';
    var lab_key = _toolType + 'Label';

    var objGTM = {};
    objGTM[evt_key] = evt_val;
    objGTM[cat_key] = strCategory;
    objGTM[act_key] = strAction;
    objGTM[lab_key] = strLabel;

    dataLayer.push(objGTM);
}           // end "updateTracker" function

// Check if user is using Internet Explorer. If so alert user that it is not supported. 
function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        alert('This tool does not support Internet Explorer. Please use another browser.');
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        alert('This tool does not support Internet Explorer. Please use another browser.');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    //var edge = ua.indexOf('Edge/');
    //if (edge > 0) {
    //    // Edge (IE 12+) => return version number
    //    alert('This tool does not support Internet Explorer. Please use another browser.');
    //    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    //}

    // other browser
    return false;
}
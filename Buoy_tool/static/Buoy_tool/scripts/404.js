function loadMetaJSON(callback) {
    var data_file = '../static/Buoy_tool/data/meta_english.json';
    $.getJSON(data_file, function (json) {
        var ichk = 0;
        callback(json);
    });
}

function w3_open() {
    document.getElementById("mySidenav").style.display = "block";
    dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'nav menu', 'glbuoysLabel': 'open', 'glbuoysAction': 'expand' });
}
function w3_close() {
    document.getElementById("mySidenav").style.display = "none";
    var x = document.getElementById("ErieAcc");
    var y = document.getElementById("MichiganAcc");
    var z = document.getElementById("SuperiorAcc");
    var aa = document.getElementById("HuronAcc");
    var ab = document.getElementById("OntarioAcc");
    x.className = x.className.replace(" w3-show", "");
    x.previousElementSibling.className =
        x.previousElementSibling.className.replace("w3-theme-d4", "");
    y.className = x.className.replace(" w3-show", "");
    y.previousElementSibling.className =
        y.previousElementSibling.className.replace("w3-theme-d4", "");
    z.className = x.className.replace(" w3-show", "");
    z.previousElementSibling.className =
        z.previousElementSibling.className.replace("w3-theme-d4", "");
    aa.className = x.className.replace(" w3-show", "");
    aa.previousElementSibling.className =
        aa.previousElementSibling.className.replace("w3-theme-d4", "");
    ab.className = x.className.replace(" w3-show", "");
    ab.previousElementSibling.className =
        ab.previousElementSibling.className.replace("w3-theme-d4", "");
    dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'nav menu', 'glbuoysLabel': 'close', 'glbuoysAction': 'collapse' });
}
function myAccFunc() {
    var x = document.getElementById("MichiganAcc");
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
        x.previousElementSibling.className += "w3-theme-d4";
    } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
            x.previousElementSibling.className.replace("w3-theme-d4", "");
    }

}
function myAccFunc2() {
    var x = document.getElementById("SuperiorAcc");
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
        x.previousElementSibling.className += "w3-theme-d4";
    } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
            x.previousElementSibling.className.replace("w3-theme-d4", "");
    }
}
function myAccFunc3() {
    var x = document.getElementById("ErieAcc");
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
        x.previousElementSibling.className += "w3-theme-d4";
    } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
            x.previousElementSibling.className.replace("w3-theme-d4", "");
    }
}
function myAccFunc4() {
    var x = document.getElementById("HuronAcc");
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
        x.previousElementSibling.className += "w3-theme-d4";
    } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
            x.previousElementSibling.className.replace("w3-theme-d4", "");
    }
}
function myAccFunc5() {
    var x = document.getElementById("OntarioAcc");
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
        x.previousElementSibling.className += "w3-theme-d4";
    } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
            x.previousElementSibling.className.replace("w3-theme-d4", "");
    }
}

$(document).ready(function () {
    url = document.URL;
    var url = window.location.href;
    var arr = url.split("/");
    var ID = arr[3]; 

    var station;
    i = url.lastIndexOf('=');
    if (i == -1) {
        i = url.lastIndexOf("/");
    }
    if (i >= 0 && i < url.length)
         station = url.substr(i + 1);

    var text;
    /**if (url == "http://glbuoys.glos.us/" + station) {
        text = '<p align="left">We\'re not completely sure why you landed here, but we\'re guessing ';
        text += 'that you\'re trying to get to the station page for ' + station + '. ';
        text += 'It\'s possible that you have a typo in the station ID; check the ';
        text += 'station map and list on the <a href=http://glbuoys.glos.us>Buoy Portal home page</a>.</p>';
    } else if (station != '') {
        text = '<p align="left">We\'re guessing ';
        text += 'that you\'re trying to get to the station page for ' + ID + ', so ';
        text += 'please try the link <a href=http://glbuoys.glos.us/' + station + '>';
        text += 'http://glbuoys.glos.us/' + station + '</a>. If you end up on this page ';
        text += 'again, it\'s possible that you have a typo in the station ID; check the ';
        text += 'station map and list on the <a href=http://glbuoys.glos.us>Buoy Portal home page</a>.</p>';**/
    //}else {
        text = '<p align="left">We\'re not sure why you landed here, but we hope you\'re looking for observations ';
        text += 'from one or more of the buoys on our site. If so, check the station list on the right or visit the station map and list ';
        text += 'on the <a href=http://glbuoys.glos.us>Buoy Portal home page</a>.</p>';
    //}
    $(text).appendTo($('#mainText'));

    dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': '404 Error', 'glbuoysLabel': '' + ID + '', 'glbuoysAction': '0' });
    
    loadMetaJSON(function (jsonObj) {
        $.each(jsonObj, function (i, option) {
            if (!option.WqOnly) {
                if (option.lake == "ER") {
                    $('#ErieAcc').append($('<a>').click(function () { PassStation(option.id, option.lat, option.lon); dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'nav menu', 'glbuoysLabel': option.id, 'glbuoysAction': 'click_internal_url' }); }).text(option.id).attr("style", 'cursor:pointer'));
                }
                else if (option.lake == "MI") {
                    $('#MichiganAcc').append($('<a>').click(function () { PassStation(option.id, option.lat, option.lon); dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'nav menu', 'glbuoysLabel': option.id, 'glbuoysAction': 'click_internal_url' }); }).text(option.id).attr("style", 'cursor:pointer'));
                }
                else if (option.lake == "HU") {
                    $('#HuronAcc').append($('<a>').click(function () { PassStation(option.id, option.lat, option.lon); dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'nav menu', 'glbuoysLabel': option.id, 'glbuoysAction': 'click_internal_url' }); }).text(option.id).attr("style", 'cursor:pointer'));
                }
                else if (option.lake == "SUP") {
                    $('#SuperiorAcc').append($('<a>').click(function () { PassStation(option.id, option.lat, option.lon); dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'nav menu', 'glbuoysLabel': option.id, 'glbuoysAction': 'click_internal_url' }); }).text(option.id).attr("style", 'cursor:pointer'));
                }
                else if (option.lake == "ON") {
                    $('#OntarioAcc').append($('<a>').click(function () { PassStation(option.id, option.lat, option.lon); dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'nav menu', 'glbuoysLabel': option.id, 'glbuoysAction': 'click_internal_url' }); }).text(option.id).attr("style", 'cursor:pointer'));
                }
            }
        });
    });
});
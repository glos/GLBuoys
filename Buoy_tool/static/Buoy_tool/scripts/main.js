function loadMetaJSON(callback) {
    //var data_file = "/json/Meta_example.json";
    var data_file = "http://34.209.199.227//BuoyALP/buoymeta/all";
		var http_request = new XMLHttpRequest();
			http_request.overrideMimeType("application/json");
		http_request.open('GET', data_file, true);
    http_request.onreadystatechange = function () {
        if (http_request.readyState === 4 && http_request.status === 200) {
					callback(http_request.responseText);
        }	
    };
    http_request.send(null);
}

function initialize() {

    var locations = [];
    $.each(stations, function (i, option) {
            if (option.ndbcHandler !== null) {
                locations.push([option.ndbcHandler, option.lat, option.lon]);
            }
        });
        
    var map = new google.maps.Map(document.getElementById("map_canvas"), {
        zoom: 10,
        center: new google.maps.LatLng(41.55016, -81.6528),
        mapTypeControl: true,
        mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
        navigationControl: true,
        navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow = new google.maps.InfoWindow();

    var marker, i;
        
    for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i][1], locations[i][2]),
            title: locations[i][0],
            map: map
        });

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function () {
                var div = document.createElement('div');
                div.innerHTML = locations[i][0];
                var contentString = '<div id="content" style="cursor: pointer;" onclick="loadbuoyinfo(\'' + locations[i][0] + '\')">' + locations[i][0] + '</div>';
                map.setCenter({
                    lat: locations[i][1],
                    lng: locations[i][2]
                });
                infowindow.setContent(contentString);
                infowindow.open(map, marker);
            };
        })(marker, i));
        
    }
    
}
function w3_open() {
        document.getElementById("mySidenav").style.display = "block";
    }
function w3_close() {
        document.getElementById("mySidenav").style.display = "none";
        var x = document.getElementById("ErieAcc");
        var y = document.getElementById("MichiganAcc");
        var z = document.getElementById("SuperiorAcc");
        x.firstElementChild.className.replace("w3-theme-l4", "");
        y.firstElementChild.className.replace("w3-theme-l4", "");
        z.firstElementChild.className.replace("w3-theme-l4", "");

    }
function myAccFunc() {
        var x = document.getElementById("ErieAcc");
        if (x.className.indexOf("w3-show") === -1) {
            x.className += " w3-show";
            x.previousElementSibling.className += "w3-theme-l4";
        } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
        x.previousElementSibling.className.replace("w3-theme-l4", "");
        }

    }
function myAccFunc2() {
        var x = document.getElementById("MichiganAcc");
        if (x.className.indexOf("w3-show") === -1) {
            x.className += " w3-show";
            x.previousElementSibling.className += "w3-theme-l4";
        } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
        x.previousElementSibling.className.replace("w3-theme-l4", "");
        }
    }
function myAccFunc3() {
        var x = document.getElementById("SuperiorAcc");
        if (x.className.indexOf("w3-show") === -1) {
            x.className += " w3-show";
            x.previousElementSibling.className += "w3-theme-l4";
        } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
        x.previousElementSibling.className.replace("w3-theme-l4", "");
        }
    }
function myAccFunc4() {
    var x = document.getElementById("HuronAcc");
    if (x.className.indexOf("w3-show") === -1) {
        x.className += " w3-show";
        x.previousElementSibling.className += "w3-theme-l4";
    } else {
        x.className = x.className.replace(" w3-show", "");
        x.previousElementSibling.className =
        x.previousElementSibling.className.replace("w3-theme-l4", "");
    }
}
$(document).ready(function () {
    loadMetaJSON(function (response) {
        var jsonObj = JSON.parse(response);
        $.each(jsonObj, function (i, option) {
            if (option.lake === "ER") {
                //$('#ErieAcc').append($('<a>').attr("href", '#').click(function () { loadbuoyinfo(option.id); initialize(option.lat,option.lon) }).text(option.id));
                $('#ErieAcc').append($('<a>')./**attr("href", '#').**/click(function () { PassStation(option.id, option.lat, option.lon); }).text(option.id));	//Remove when using one buoy.html
            }
            else if (option.lake === "MI") {
                //$('#MichiganAcc').append($('<a>').attr("href", '#').click(function(){ loadbuoyinfo(option.id); initialize(option.lat,option.lon) }).text(option.id));
                $('#MichiganAcc').append($('<a>')./**attr("href", '#').**/click(function () { PassStation(option.id, option.lat, option.lon); }).text(option.id)); //Remove when using one buoy.html
            }
            else if (option.lake === "HU") {
                $('#HuronAcc').append($('<a>')./**attr("href", '#').**/click(function () { PassStation(option.id, option.lat, option.lon); }).text(option.id));
            }
            else if (option.lake === "SUP") {
                $('#SuperiorAcc').append($('<a>')./**attr("href", '#').**/click(function () { PassStation(option.id, option.lat, option.lon); }).text(option.id));
            }
            //$('a[href$="#"]').click(function (e) { e.preventDefault(); });
        });
    });
    //Use for reading in Gwuans objects array
    function loadbuoyinfo(ID) {

        var data_file = "/ALP/json/StationMeta.json";
        var http_request = new XMLHttpRequest();

        try {
            // Opera 8.0+, Firefox, Chrome, Safari
            http_request = new XMLHttpRequest();
        } catch (e) {
            // Internet Explorer Browsers
            try {
                http_request = new ActiveXObject("Msxml2.XMLHTTP");

            } catch (e) {

                try {
                    http_request = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {
                    // Something went wrong
                    alert("Your browser broke!");
                    return false;
                }

            }
        }

        http_request.onreadystatechange = function () {
            if (http_request.readyState === 4) {
                // Javascript function JSON.parse to parse JSON data
                var jsonObj = JSON.parse(http_request.responseText);

                // jsonObj variable now contains the data structure and can
                // be accessed as jsonObj.name and jsonObj.country.
                for (i = 0; i < jsonObj.length; i++) {
                    if (jsonObj[i].ndbcHandler === ID) {
                        document.getElementById("stationID").innerHTML = jsonObj[i].ndbcHandler;
                        document.getElementById("stationTime").innerHTML = jsonObj[i].lastDataUpdate;
                    }
                }
            }
        };

        http_request.open("Get", data_file, true);
        http_request.send();
    }

    function highchartGrab(variableName) {
        var data_file = "/ALP/json/45164.json";
        var http_request = new XMLHttpRequest();

        try {
            // Opera 8.0+, Firefox, Chrome, Safari
            http_request = new XMLHttpRequest();
        } catch (e) {
            // Internet Explorer Browsers
            try {
                http_request = new ActiveXObject("Msxml2.XMLHTTP");

            } catch (e) {

                try {
                    http_request = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e) {
                    // Something went wrong
                    alert("Your browser broke!");
                    return false;
                }

            }
        }
        var Date = [];
        var Data = [];

        http_request.onreadystatechange = function () {
            if (http_request.readyState === 4) {
                // Javascript function JSON.parse to parse JSON data
                var jsonObj = JSON.parse(http_request.responseText);
                // jsonObj variable now contains the data structure and can
                // be accessed as jsonObj.name and jsonObj.country.
                $.each(jsonObj[variableName], function (i, ob) {
                    $.each(ob, function (key, value) {
                        if (key === 'Date') {
                            Date.push(value);
                        } else if (key === 'data') {
                            Data.push(value);
                        }
                    });
                });
                highchartgraph(variableName, Date, Data);
            }
        };
        http_request.open("Get", data_file, true);
        http_request.send();
    }

});      // End jQuery "ready"
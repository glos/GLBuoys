var prePath = '../static/Buoy_tool/';
var units = 'english' //global variables
var speedUnits = 'kts';
var depthUnits = 'ft';
var depthUnitsLng = 'feet';
var tempUnits = '°F';
var url = window.location.href;
var arr = url.split("/");
var ID = arr[3]; 


function loadMetaJSON(callback) {
    var data_file = '../static/Buoy_tool/data/meta_' + units + '.json';
    $.getJSON(data_file, function (json) {
        var ichk = 0;
        callback(json);
    });
}

function ifOffline(time){
				var currentTime = moment();
				var dateNum = moment(time);
				var hourDiff = moment.duration(currentTime.diff(dateNum)).asHours();
				if (hourDiff > 6) {
					return true;
				}else{
					return false;
				} 
}


//--------------------------Load Banner News and Buoy alerts if available-----------------------------
google.charts.load('current', {
  callback: getBannerNews,
  packages: ['corechart']
});
google.charts.load('current', {
  callback: getBuoyAlerts,
  packages: ['corechart']
});
var buoyAlert;
var bannerNews;
function getBannerNews(){
	var query = new google.visualization.Query('https://docs.google.com/spreadsheets/d/1pNrNz0BWd_ckJfBmTJbl4Vf8CdGq2rlWLL_1vRAqqco/edit#gid=0/gviz/tq?tq=');
	query.setQuery('select B where A = "bannerNews"');
	query.send(BannerNewsResponse);
}
function BannerNewsResponse(response) {
    if (response.isError()) {
        console.log('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
        return;
    }
    var data = response.getDataTable();
		try {
			bannerNews = data.getValue(0,0);
		}
		catch(err){
			console.log("No Banner News");
		}
		if (bannerNews){
				$('#bannerNews').addClass('w3-panel w3-pale-green w3-small');
				$('#bannerNews').attr('style','max-width:600px; margin: 0 auto;');
				$('#bannerNews').append('<p>'+bannerNews+'</p>');
				$('#main').attr('style','margin-top:70px')
			}
}

function getBuoyAlerts(){
	var query = new google.visualization.Query('https://docs.google.com/spreadsheets/d/1pNrNz0BWd_ckJfBmTJbl4Vf8CdGq2rlWLL_1vRAqqco/edit#gid=0/gviz/tq?tq=');
	var ID;
	var url = window.location.href;
	var arr = url.split("/");
	ID = arr[3];
	query.setQuery('select B where A = "'+ID+'"');
	query.send(BuoyAlertsResponse);
}
function BuoyAlertsResponse(response) {
    if (response.isError()) {
        console.log('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
        return;
    }
    var data = response.getDataTable();
		try {
			buoyAlert = data.getValue(0,0);
		}
		catch(err){
			console.log("No buoy alerts");
		}
		if (buoyAlert){
						$('#buoyAlert').addClass('w3-panel w3-center w3-pale-red w3-medium');
						$('#buoyAlert').attr("style", 'max-width:800px; margin: 0 auto;');
						$('#buoyAlert').append('<p style="font-size:14px">' + buoyAlert + '</p>');
					}
}
//----------------------------------------------------------------------------------------
			
function initialize(jsonObj) {
	
		var stations = [];
		var	lats = [];
		var lons = [];
		var obs = [];
		var Wq = [];
		var offline = [];
		var recovered = [];

			for (i = 0; i < jsonObj.length; i++) {
				stations[i] = jsonObj[i].id;
				lats[i] = jsonObj[i].lat;
				lons[i] = jsonObj[i].lon;
				obs[i] = jsonObj[i].obsValues;
				Wq[i] = jsonObj[i].WqOnly;
				offline[i] = ifOffline(jsonObj[i].updateTime);
				recovered[i] = jsonObj[i].recovered;

				if (ID == stations[i]){
					lat = jsonObj[i].lat;
					lon = jsonObj[i].lon;
				}
			}
			if (lat) {
				map = new google.maps.Map(document.getElementById("map_canvas"), {
					zoom: 8,
					center: new google.maps.LatLng(lat,lon),
					mapTypeControl: true,
					mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
					navigationControl: true,
					navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
					mapTypeId: google.maps.MapTypeId.ROADMAP
				});
			}else {
				map = new google.maps.Map(document.getElementById("map_canvas"), {
					zoom: 8,
					center: new google.maps.LatLng(44.0,-84.5),
					mapTypeControl: true,
					mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
					navigationControl: true,
					navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
					mapTypeId: google.maps.MapTypeId.ROADMAP
				});
			}
			
			var infowindow = new google.maps.InfoWindow();
			
			var marker, i;  
			
			for (i = 0; i < stations.length; i++) {
				if(!Wq[i]){
					if (stations[i]==ID){
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
							title:stations[i],
							map: map,
							optimized: false,
							zIndex:4,
							icon: prePath + 'img/ActiveBuoyIcon.png',
						});
					}else if (obs[i] && !offline[i]){
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
							title:stations[i],
							map: map,
							zIndex:3,
                            icon: prePath + 'img/BuoyOnlineIcon.png',
						});
					}else if (offline[i] && obs[i]){
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
							title:stations[i],
							map: map,
							zIndex:2,
                            icon: prePath + 'img/OldDataBuoyIcon.png',
						});	
					}else if (!obs[i]) {
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
							title:stations[i],
							map: map,
							zIndex:1,
							opacity:0.7,
                            icon: prePath + 'img/RecoveredBuoyIcon.png',
						});
					}
					google.maps.event.addListener(marker, 'click', (function (marker, i) {
						return function () {
                var div = document.createElement('div');
                div.innerHTML = stations[i];
                var contentString = '<div id="content" style="cursor: pointer;font-family: Inconsolata,Verdana; margin-right:5px; font-size:15px; color:#333;font-weight:700" onclick="PassStation(\'' + stations[i] +'\',\'' + lats[i] +'\',\'' + lons[i] + '\');dataLayer.push({\'event\':\'glbuoysEvent\',\'glbuoysCategory\':\'map\',\'glbuoysLabel\':\''+stations[i]+'\',\'glbuoysAction\':\'click_internal_url\'});">' + stations[i] + '</div>';
                map.setCenter({
                    lat: lats[i],
                    lng: lons[i]
                })
                infowindow.setContent(contentString);
                infowindow.open(map, marker);
						}
					})(marker, i));
					
					google.maps.event.addListener(map, 'zoom_changed',(function (marker, i){
						var showInfoWindow = 0;
						var div = document.createElement('div');
						div.innerHTML = stations[i];
						var contentString = '<div id="content" style="cursor: pointer;font-family: Inconsolata,Verdana; margin-right:5px; font-size:15px; color:#333;font-weight:700" onclick="PassStation(\'' + stations[i] +'\',\'' + lats[i] +'\',\'' + lons[i] + '\');dataLayer.push({\'event\':\'glbuoysEvent\',\'glbuoysCategory\':\'map\',\'glbuoysLabel\':\''+stations[i]+'\',\'glbuoysAction\':\'click_internal_url\'});">' + stations[i] + '</div>';
						var infowindow2 = new google.maps.InfoWindow({
							position: new google.maps.LatLng(lats[i],lons[i]),
							content: contentString,
							disableAutoPan: true,
						});
						return function () {
							if (map.getZoom() > 8 && showInfoWindow == 0){
								showInfoWindow = 1;
								infowindow2.open(map, marker);
							}
							if (map.getZoom() <= 8){
								showInfoWindow = 0;
								infowindow2.close();
							}
						}
					})(marker, i));
				}
			}
			$('#buoyLocation').append('<div id="googleMapLegend"></div>');
			map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('googleMapLegend'));
			var legend = document.getElementById('googleMapLegend');
			var icons = {
				selected: {
					name: ID,
                    icon: prePath + 'img/ActiveBuoyIcon.png'
				},
				online: {
					name: 'Online',
                    icon: prePath + 'img/BuoyOnlineIcon.png'
				},
				NotCurrent: {
					name: 'Not Current',
                    icon: prePath + 'img/OldDataBuoyIcon.png'
				},
				Recovered: {
					name: 'Recovered',
                    icon: prePath + 'img/RecoveredBuoyIcon.png'
				}
			};
			for (var key in icons) {
				var type = icons[key];
				var name = type.name;
				var icon = type.icon;
				var div = document.createElement('div');
				div.className='legendList';
				div.innerHTML = '<img style="padding-left:4px;" src="' + icon + '"> ' + name;
				legend.appendChild(div);
			}    
}
function w3_open() {
        document.getElementById("mySidenav").style.display = "block";
				dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':'open','glbuoysAction':'expand'});
}
function w3_close() {
        document.getElementById("mySidenav").style.display = "none";
        var x = document.getElementById("ErieAcc");
        var y = document.getElementById("MichiganAcc");
        var z = document.getElementById("SuperiorAcc");
        var aa = document.getElementById("HuronAcc");
				var ab = document.getElementById("OntarioAcc");
        x.className = x.className.replace(" w3-show","");
				x.previousElementSibling.className =
        x.previousElementSibling.className.replace("w3-theme-d4", "");
				y.className = x.className.replace(" w3-show","");
				y.previousElementSibling.className =
        y.previousElementSibling.className.replace("w3-theme-d4", "");
				z.className = x.className.replace(" w3-show","");
				z.previousElementSibling.className =
        z.previousElementSibling.className.replace("w3-theme-d4", "");
				aa.className = x.className.replace(" w3-show","");
				aa.previousElementSibling.className =
        aa.previousElementSibling.className.replace("w3-theme-d4", "");
				ab.className = x.className.replace(" w3-show","");
				ab.previousElementSibling.className =
        ab.previousElementSibling.className.replace("w3-theme-d4", "");
				dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':'close','glbuoysAction':'collapse'});
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

function unitConversion() {
	dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':$('button#units').text(),'glbuoysAction':'click_internal_url'});
	if($('button#units').text() == 'To Metric'){
		units = 'metric'
		depthUnits = 'm';
		depthUnitsLng = 'meters';
		tempUnits = '°C';
		speedUnits = 'km/h';
		$('button#units').text('To English');
		reloadbuoyinfo();
	}else {
		units = 'english';
		depthUnits = 'ft';
		depthUnitsLng = 'feet';
		tempUnits = '°F';
		speedUnits = 'kts';
		$('button#units').text('To Metric');
		reloadbuoyinfo();
	}
}

function DegreeToCardinal(value) {
	if (value >= 348.75 || value < 11.25){
		return "N";
	}else if (value >= 11.25 && value < 33.75){
		return "NNE";
	}else if (value >= 33.75 && value < 56.25){
		return "NE";
	}else if (value >= 56.25 && value < 78.75){
		return "ENE";
	}else if (value >= 78.75 && value < 101.25){
		return "E";
	}else if (value >= 101.25 && value < 123.75){
		return "ESE";
	}else if (value >= 123.75 && value < 146.25){
		return "SE";
	}else if (value >= 146.25 && value < 168.75){
		return "SSE";
	}else if (value >= 168.75 && value < 191.25){
		return "S";
	}else if (value >= 191.25 && value < 213.75){
		return "SSW";
	}else if (value >= 213.75 && value < 236.25){
		return "SW";
	}else if (value >= 236.25 && value < 258.75){
		return "WSW";
	}else if (value >= 258.75 && value < 281.25){
		return "W";
	}else if (value >= 281.25 && value < 303.75){
		return "WNW";
	}else if (value >= 303.75 && value < 326.25){
		return "NW";
	}else if (value >= 326.25 && value < 348.75){
		return "NNW";
	}else{
		return "°";
	}
}

$(document).ready(function () {

    // Event for buoy page click:
    $('#btn-show-plot').on('click', function (evt) {
        var prepend = '';

        if (document.location.href.includes('/buoy/')) {
            prepend = '../../';
        } else {
            prepend = '../';
        }

        document.location.href = prepend + 'tools/plotter/';  
    });
    $('#btn-show-export').on('click', function (evt) {
        var prepend = '';

        if (document.location.href.includes('/buoy/')) {
            prepend = '../../';
        } else {
            prepend = '../';
        }

        document.location.href = prepend + 'tools/export/';
    });

    loadMetaJSON(function (jsonObj) {
			loadbuoyinfo(ID, jsonObj);
			$.each(jsonObj, function (i, option) {
				if (!option.WqOnly){
					if (option.lake == "ER") {
						$('#ErieAcc').append($('<a>').click(function () { PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));
					}
					else if (option.lake == "MI") {
						$('#MichiganAcc').append($('<a>').click(function () { PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));
					}
					else if (option.lake == "HU") {
						$('#HuronAcc').append($('<a>').click(function () { PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));
					}
					else if (option.lake == "SUP") {
						$('#SuperiorAcc').append($('<a>').click(function () { PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));	
					}
					else if (option.lake == "ON") {
						$('#OntarioAcc').append($('<a>').click(function () { PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));
					}
				}
			});
    });
    var refresher = setInterval("reloadbuoyinfo();", 600000);
});


//----------------------Use for reading in JSON objects array, parse buoy ID, then parse keys to populate webpage.----------------------------
function loadbuoyinfo(ID, jsonObj) {
			
			// jsonObj variable now contains the data structure and can be accessed as jsonObj.keys
			for (i = 0; i < jsonObj.length; i++) {
				if (jsonObj[i].id == ID) {
					document.title = 'Buoy '+ID+ ' - Great Lakes Buoys';
					if (jsonObj[i].sponsors){
						$('#sponsorsBottom h5').append('Buoy Sponsors');
						$('#sponsorsBottom h5').addClass("glosBlue w3-center w3-padding");
                        for(a=0; a < jsonObj[i].sponsors.length; a++){

                            // Prepend path for sponsor logo/image (TMR-2017/09/22):
                            var strSpImg = prePath + jsonObj[i].sponsors[a];

							if (a == 0 || a == 1) {
								if (jsonObj[i].id == '45029' || jsonObj[i].id == '45168' && a == 0) {
									$('#sponsorsHeader').append($('<a>').attr("id",a).attr("href",jsonObj[i].sponsorsSrc[a]).click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'logo','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});}));	
                  $('#sponsorsHeader #' + a + '').append($('<img>').attr("id", a).attr("src", strSpImg).addClass("sponsors w3-margin-left w3-margin-right"));
									//$('#sponsorsHeader #'+a+'').on('click',function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'sponsors','glbuoysLabel':jsonObj[i].sponsorsSrc[a],'glbuoysAction':'click_external_url'});}));
								}else {
								$('#sponsorsHeader').append($('<a>').attr("id",a).attr("href",jsonObj[i].sponsorsSrc[a]).attr("target","_blank").click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'logo','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});}));	
								$('#sponsorsHeader #'+a+'').append($('<img>').attr("id",a).attr("src", strSpImg).addClass("sponsors w3-margin-left w3-margin-right"));
                $('#sponsorsBottom').append($('<a>').attr("id", a).attr("href", strSpImg).attr("target","_blank").click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'logo','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});}));
								$('#sponsorsBottom #'+a+'').append($('<img>').attr("id",a).attr("src", strSpImg).addClass("sponsors w3-margin-left w3-margin-right w3-margin-bottom"));
								//$('#sponsorsHeader #'+a+'').click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'sponsors','glbuoysLabel':sponsor,'glbuoysAction':'click_external_url'});});
								}
							}else {
								$('#sponsorsBottom').append($('<a>').attr("id",a).attr("href",jsonObj[i].sponsorsSrc[a]).attr("target","_blank").click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'logo','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});}));
                $('#sponsorsBottom #' + a + '').append($('<img>').attr("src", strSpImg).addClass("sponsors w3-margin-left w3-margin-right w3-margin-bottom"));
								$('#sponsorsBottom #'+a+'').on('click',function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'sponsors','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});});
							}
						}
					}
                    console.log(jsonObj[i]);
                    //Move inside obsUnits check after code checks
                    if (ID == "45026") {
                        console.log('true');
                        $('#ADCP').addClass("w3-center w3-panel w3-card-4 w3-padding");
                        $('#ADCP h4').append('Currents');
                        $('#ADCP h4').addClass("glosBlue w3-center");
                        $('#ADCP').append('<div id="ADCP_Chart" style="height: 500px"></div>');
                        ADCPfig(ID);
                    }

					if(jsonObj[i].obsUnits){
						$('#staticHeader h4').append('Most Recent Observations');
						document.getElementById("stationID").innerHTML = "" + jsonObj[i].longName + " (" + jsonObj[i].id + ")";
						moment.tz.setDefault(jsonObj[i].timeZone); //set time zone from metadata
						var tzAbbr = moment.tz(jsonObj[i].timeZone).format('z');	//define time zone abbreviation for station update time
						Highcharts.setOptions({
							global: {
								timezone: jsonObj[i].timeZone
							}
						});
						var currentTime = moment(); //Define current time using buoy time
						var dateNum = moment(jsonObj[i].updateTime);
						var hourDiff = moment.duration(currentTime.diff(dateNum)).asHours();
						if (hourDiff < 6) {  //assumes time from json is local. Checks if data is less than 1 hour old
							document.getElementById("stationTime").style.color = "#337ab7"
							document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" "+tzAbbr+"&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ ""
						}
						else if (hourDiff > 6 && hourDiff < 24) {  //assumes time from json is local. Checks if data is less than 6 hour old
							document.getElementById("stationTime").style.color = "#FFC900"
							document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" "+tzAbbr+"&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ " (>6 hours ago)"
						}
						else {
							document.getElementById("stationTime").style.color = "#f70000"
							document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" "+tzAbbr+"&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ " (>1 day ago)"
						}
						var columnSpan  = 1;
						if (jsonObj[i].thermistorValues.length>1 && !isNaN(jsonObj[i].thermistorValues[0])){ //Check to make sure there are multiple temperature nodes and first two depths are not missing
							columnSpan = 2;
							$('#Thermistor').addClass("w3-center w3-panel w3-card-4 w3-padding");
							$('#Thermistor h4').append('Water Temperature Profile');
							$('#Thermistor h4').addClass("glosBlue w3-center");
							$('#Thermistor').append("<img onclick=document.getElementById('id02').style.display='block';dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'temp_string','glbuoysAction':'popup'}); style='height:350px; width:100%; max-width:550px; cursor: pointer'/>");
							$('#Thermistor').append('<p style="margin-top:0px">(Click image for interactive graph.)</p>');
							$('#Thermistor').append('<div id="TempStringLineChart" style="min-width: 310px; height: 400px;"></div>');
							$('#Thermistor').append('<p style="margin-top:0px">(Click depths in legend to turn on/off depth.)</p>');
							TempStringGrab(ID);
						} else if(jsonObj[i].thermistorValues.length==1){		//Add if statement if buoy owners issues surface temp as 'tp001' and not 'wtmp'
							columnSpan = 2;
						}
					
						var parameterOrder = ['WSPD','GST','WDIR','WTMP','WVHT','WPRD','MWD','APD','ATMP','PRES','DEWP','PH','DISOXY','DIOSAT','SPCOND','COND','YCHLOR','YBGALG','YTURBI'];
						var excludedObs = ['DPD','TIDE','VIS','PTDY','DEPTH','OTMP','CHILL','HEAT','ICE','WSPD10','WSPD20'];
						for (g = 0; g < parameterOrder.length; g++){
							for (j = 0; j < jsonObj[i].obsLongName.length; j++) {
								if(excludedObs.indexOf(jsonObj[i].obsID[j])<0 && jsonObj[i].obsID[j]===parameterOrder[g] && jsonObj[i].obsValues[j]!=='NaN' && jsonObj[i].obsValues[j]!=='NULL'){
									var toFixedValue = [];
									if (jsonObj[i].obsValues[j]<1){toFixedValue = 2;}else{toFixedValue = 1;}	//Add an additional significant digit if value is less than 1. 
									if (jsonObj[i].obsUnits[j].charAt(0) !== '°') {
										var newRowContent = "<tr id='" + jsonObj[i].obsID[j] + "' onclick=PastForecastGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':$(this).closest('tr').attr('id'),'glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" +
																"<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																"<td class='long_name' align=left>" + jsonObj[i].obsLongName[j] + "</td>" +
																"<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.floor(jsonObj[i].obsValues[j]) + "</div></td>" +
																"<td class='float_value'><div align=left>" + (jsonObj[i].obsValues[j]-Math.floor(jsonObj[i].obsValues[j])).toFixed(toFixedValue).substring(1) + " " + jsonObj[i].obsUnits[j] + "</div></td>" +
																"</tr>";
									}else if(jsonObj[i].obsUnits[j] == '°') {
										var cardinalDir = DegreeToCardinal(jsonObj[i].obsValues[j]);
										var newRowContent = "<tr id='" + jsonObj[i].obsID[j] + "' onclick=PastForecastGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':$(this).closest('tr').attr('id'),'glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" +
																"<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																"<td class='long_name' align=left>" + jsonObj[i].obsLongName[j] + "</td>" +
																"<td colspan='2' style='text-align:center;'>" + cardinalDir + " (" + Math.round(jsonObj[i].obsValues[j]) + "°)</td>" +
																"</tr>";
									}else{
										var newRowContent = "<tr id='" + jsonObj[i].obsID[j] + "' onclick=PastForecastGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':$(this).closest('tr').attr('id'),'glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" +
																"<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																"<td class='long_name' align=left>" + jsonObj[i].obsLongName[j] + "</td>" +
																"<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.floor(jsonObj[i].obsValues[j]) + "</div></td>" +
																"<td class='float_value'><div align=left>" + (jsonObj[i].obsValues[j]-Math.floor(jsonObj[i].obsValues[j])).toFixed(toFixedValue).substring(1) + "" + jsonObj[i].obsUnits[j] + "</div></td>" +
																"</tr>";
									}		
                                    $(newRowContent).appendTo($("#realtime tbody"));
								}
							}
						}
					
						if (jsonObj[i].thermistorValues.length>0){
							for (k = 0; k < jsonObj[i].thermistorValues.length; k++) {
								if(!isNaN(jsonObj[i].thermistorValues[k])){		//Check if thermistor is 'NaN'. If so do not write out
									if (k == 0) {
										var newRowContent1 = "<tr id='tp0" + (k) + "'>" +
																		 "<td style='cursor:pointer; width:10px;'><div class='TAccord' align=right><i onclick=$('.TAccord').toggle();dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'temp_string','glbuoysLabel':'water_temp','glbuoysAction':'expand'}); class='material-icons'>remove</i></div>" +
																		 "<div class='TAccord' style='display:none' align=right><i onclick=$('.TAccord').toggle();dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'temp_string','glbuoysLabel':'water_temp','glbuoysAction':'collapse'}); class='material-icons'>add</i></div></td>" +
																		 "<td class='graph' width='10px' style='cursor: pointer;'><div align=right><i class='material-icons' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " "+depthUnits+"</td>" +
																		 "<td class='interger_value' style='padding:8px 0px;cursor: pointer;' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value' style='cursor: pointer;' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'><div align=left >"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "" +tempUnits+ "</div></td>" +
																		 "</tr>";
										$(newRowContent1).appendTo($("#realtime tbody"));
									}	else if (k == jsonObj[i].thermistorValues.length - 1) {
										var newRowContent2 = "<tr id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" + 
																		 "<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " "+depthUnits+"</td>" +
																		 "<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value'><div align=left>"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "" +tempUnits+ "</div></td>" +
																		 "</tr>";
										$(newRowContent2).appendTo($("#realtime tbody"));
									} else {
										var moreTemps = //"<tr class='TAccord' style='display:none' id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;''>" + 
																		"<tr class='TAccord' id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;''>" + 
																		"<td class='graph' width='15px' colspan='"+columnSpan+"'><div align=right><i class='material-icons' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');document.getElementById('id01').style.display='block' style='cursor: pointer;'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " "+depthUnits+"</td>" +
																		 "<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value'><div align=left>"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "" +tempUnits+ "</div></td>" +
																		 "</tr>";
											$(moreTemps).appendTo($("#realtime tbody"));
									}
								}
							}
                        }
                        
						//Check if buoy starts with a number, if so it is an NDBC buoy and can be text messaged
						$('#textBuoy').addClass('w3-panel w3-light-gray w3-small');
						if(!isNaN(ID.charAt(0))){
							$('#textBuoy').append('<p><i>SMS: &nbsp;Text '+jsonObj[i].id+' to <a  id="SMS" href="sms:1-734-418-7299">(734) 418-7299</a> for the latest observations.</i></p>');
							$('#textBuoy a#SMS').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'SMS','glbuoysLabel':ID,'glbuoysAction':'click_external_url'});});
						}
						$('#textBuoy').append('<p><i>GLOS <a id="Portal" href="http://portal.glos.us/" target="_blank">Data Portal</a>: &nbsp;Access more data, models, and create alerts.</i></p>');
						$('#textBuoy a#Portal').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'Data Portal','glbuoysLabel':'glos','glbuoysAction':'click_external_url'});});
						
						if (jsonObj[i].webcamSrc.length>0){
							$('#buoyCam').addClass("w3-center w3-panel w3-card-4 w3-padding");
							$('#BuoyCamTitle h4').append('Buoy Cam');
							$('#BuoyCamTitle h4').addClass("glosBlue w3-center");
							$('#BuoyCamPic').append('<video id="my-video" class="video-js vjs-default-skin vjs-fluid" controls preload="none" poster='+jsonObj[i].webcamSrc+' data-setup="{}">');
							$('#BuoyCamPic video').append($('<source>').attr("src", jsonObj[i].webcamSrc[0].slice(0,-10)+".mp4").attr("type","video/mp4"));
							$('#BuoyCamPic video').append('<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that<a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p>');
							$('#BuoyCamPic').append('</video>');
							$('body').append('<script src="http://vjs.zencdn.net/6.2.7/video.js"></script>');
							$('#buoyCam p').append('Click <a id="archive" href='+jsonObj[i].webcamLink+' target="_blank">here</a> to access archived buoy images and video from a third party.');
							$('#my-video').on('loadeddata', function (e) {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'buoycam','glbuoysLabel':ID,'glbuoysAction':'play_buoycam'});});
							$(window).bind("fullscreen-on", function(e) {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'buoycam','glbuoysLabel':ID,'glbuoysAction':'fullscreen'});});
							$('a#archive').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'buoycam','glbuoysLabel':ID,'glbuoysAction':'click_external_url'});});
						}
					}else{
						$('#recovered').addClass('w3-panel w3-center w3-pale-red w3-small').append('<h6>' + jsonObj[i].longName + ' (' + ID + ') is currently unavailable.</h6>');
					}
					
					if (jsonObj[i].NWSForecast){
						if (jsonObj[i].NWSForecast.hazardName){
							for (a = 0; a < jsonObj[i].NWSForecast.hazardName.length; a++){
								var MarineHazard = "<p><a id="+a+" href=" + jsonObj[i].NWSForecast.hazardLink[a].replace(/amp;/g,'') + "' target='_blank'>" + jsonObj[i].NWSForecast.hazardName[a] + "</a></p>";
								$('#MarineForecast #MarineHazard').addClass("w3-panel w3-red");
								$('#MarineForecast #MarineHazard').append(MarineHazard);
								$('#MarineForecast #MarineHazard a#'+ a +'').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'hazard','glbuoysLabel':'NWS','glbuoysAction':'click_external_url'});});
							}
						}
						
						for (k = 0; k < 4; k++){		//Only use first two days for forecast
							if (k == 0){
								var newRowContent1 = "<tr><th>"+jsonObj[i].NWSForecast.startPeriodName[k]+"<th>";
								var newRowContent2 = "<tr><td><img class='nwsIcon w3-round' src='http://forecast.weather.gov"+jsonObj[i].NWSForecast.iconLink[k]+"'/><td>";
								var newRowContent3 = "<tr><td class='NWSIconSubtext'>"+jsonObj[i].NWSForecast.windspeed[k]+"<td>";
								var newRowContent4 = "<tr><td class='NWSIconSubtext'>"+jsonObj[i].NWSForecast.waveheight[k]+"<td>";
								var newRowContent5 = "<tr><td class='NWSIconSubtext'><b>"+jsonObj[i].NWSForecast.tempLabel[k]+"</b>: "+jsonObj[i].NWSForecast.temperature[k]+ "°F<td>";
								var newRowContent6 = "<p><b>"+jsonObj[i].NWSForecast.startPeriodName[k]+"</b>: "+jsonObj[i].NWSForecast.forecastText[k]+ "</p>";
							}else {
								newRowContent1 += "<th>"+jsonObj[i].NWSForecast.startPeriodName[k]+"<th>";
								newRowContent2 += "<td><img class='nwsIcon w3-round' src='http://forecast.weather.gov"+jsonObj[i].NWSForecast.iconLink[k]+"'/><td>";
								newRowContent3 += "<td class='NWSIconSubtext'>"+jsonObj[i].NWSForecast.windspeed[k]+"<td>";
								newRowContent4 += "<td class='NWSIconSubtext'>"+jsonObj[i].NWSForecast.waveheight[k]+"<td>";
								newRowContent5 += "<td class='NWSIconSubtext'><b>"+jsonObj[i].NWSForecast.tempLabel[k]+"</b>: "+jsonObj[i].NWSForecast.temperature[k]+ "°F<td>";
								newRowContent6 += "<p><b>"+jsonObj[i].NWSForecast.startPeriodName[k]+"</b>: "+jsonObj[i].NWSForecast.forecastText[k]+"<p>";
							}
						}
						newRowContent1 += "</tr>";
						newRowContent2 += "</tr>";
						newRowContent3 += "</tr>";
						newRowContent4 += "</tr>";
						newRowContent5 += "</tr>";
						newRowContent6 += "</tr>";
						var newRowContent7 = "</br><p>Click <a href='http://marine.weather.gov/MapClick.php?lon=" + jsonObj[i].lon + "&lat=" + jsonObj[i].lat + "' target='_blank'> here</a> to visit the full National Weather Service forecast page for the " + jsonObj[i].longName + " buoy location.</p>";
						$('#MarineForecast').addClass("w3-panel w3-card-4 w3-padding");
						$('#MarineForecast h4').append('National Weather Service Forecast');
						$('#MarineForecast h4').addClass("glosBlue w3-center");
						$('#MarineForecast h4').append($('<img>').attr("src", prePath + "img/NOAA_logo.png").attr("style", 'width:47px;padding-left:10px'));
						$('#MarineForecast h4').append($('<img>').attr("src", prePath + "img/NWS_logo.png").attr("style", 'width:40px'));
						$('#MarineForecast #NWSForecast').addClass('w3-centered w3-table w3-small').attr("style",'align:center');
						$(newRowContent1).appendTo($("#NWSForecast tbody"));
						$(newRowContent2).appendTo($("#NWSForecast tbody"));
						$(newRowContent3).appendTo($("#NWSForecast tbody"));
						$(newRowContent4).appendTo($("#NWSForecast tbody"));
						$(newRowContent5).appendTo($("#NWSForecast tbody"));
						$(newRowContent6).appendTo($("#MarineForecast #MarineForecastText"));
						$('#MarineForecast #MarineForecastText').append(newRowContent7);
						$('#MarineForecast #MarineForecastText').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'Forecast','glbuoysLabel':'NWS','glbuoysAction':'click_external_url'});});
					}
					
					$('#buoyLocation').addClass("w3-center w3-panel w3-card-4 w3-padding");
					$('#buoyLocation h4').append('Buoy Location');
					$('#buoyLocation h4').addClass("glosBlue w3-center");
					if (jsonObj[i].lat && jsonObj[i].lon){
						$('#buoyLocation p').append('<b>' + Math.floor(jsonObj[i].lat) + '° ' + ((jsonObj[i].lat-Math.floor(jsonObj[i].lat))*60).toFixed(4) + '&ensp;'  + Math.ceil(jsonObj[i].lon) + '° ' + ((jsonObj[i].lon-Math.ceil(jsonObj[i].lon))*-60).toFixed(4) + '</b>');
					}
					
					$('#stationMeta').addClass("w3-panel w3-card-4 w3-padding");
					$('#stationMeta h4').append('Additional Buoy Information');
					$('#stationMeta h4').addClass("glosBlue w3-center");
					if (jsonObj[i].buoyInfo){
						$('#stationMeta p#buoyInfo').append(jsonObj[i].buoyInfo);
					}
					if (jsonObj[i].metaGLOS){
						$('#stationMeta p#metaGLOS').append("View <a id='metadata' target='_blank' href=" + jsonObj[i].metaGLOS + ">metadata for this buoy</a> stored in the <a id='catalog' target='_blank' href='http://data.glos.us/metadata/'>Great Lakes Observing System Metadata Catalog</a>.");
					  $('#stationMeta a#catalog').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'metadata catalog','glbuoysLabel':'glos','glbuoysAction':'click_external_url'});});
						$('#stationMeta a#metadata').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'View metadata for buoy','glbuoysLabel':ID,'glbuoysAction':'click_external_url'});});
					}
					if (jsonObj[i].uglosLink){
						$('#stationMeta p#uglosLink').append("The legacy webpage for buoy " +jsonObj[i].id+ " can be viewed at <a id='uglos' target='_blank' href= http://uglos.mtu.edu/station_page.php?station="+ jsonObj[i].id +">uglos.mtu.edu</a>.");
						$('#stationMeta a#uglos').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'legacy webpage for buoy','glbuoysLabel':ID,'glbuoysAction':'click_external_url'});});
					}
        }
      }
	callfooterInfo(ID);
	initialize(jsonObj);
}

function reloadbuoyinfo() {
    var url = window.location.href;
    var arr = url.split("/");
    var ID = arr[3]; 

	//$('#stationTime').empty();
	//$('#realtime tbody').empty();
	//$('#Thermistor img').remove();
	//$('#TempStringLineChart').remove();
	//$('#Thermistor p').remove();
	//$('#BuoyCamPic').empty();
	
    var currentTime = moment();
    loadMetaJSON(function (jsonObj) {
		// jsonObj variable now contains the data structure and can be accessed as jsonObj.keys
        for (i = 0; i < jsonObj.length; i++) {
				if (jsonObj[i].id == ID) {
					console.log(jsonObj[i]);
					if(jsonObj[i].obsUnits){
						var dateNum = moment(jsonObj[i].updateTime);
                        var hourDiff = moment.duration(currentTime.diff(dateNum)).asHours();
                        var tzAbbr = moment.tz(jsonObj[i].timeZone).format('z');	//define time zone abbreviation for station update time
						if (hourDiff < 6) {  //assumes time from json is local. Checks if data is less than 1 hour old
							//document.getElementById("stationTime").style.color = "#337ab7"
                            //document.getElementById("stationTime").innerHTML = "" + dateNum.format("LT") + " EDT&nbsp;&nbsp;" + dateNum.format("ddd, MMM D") + ""
                            var stationDateTime = "" + dateNum.format("LT") + " " + tzAbbr + "&nbsp;&nbsp;" + dateNum.format("ddd, MMM D") + "";
                            $("#stationTime").html(stationDateTime);
                            $("#stationTime").css('color', '#337ab7');
						}
						else if (hourDiff > 6 && hourDiff < 24) {  //assumes time from json is local. Checks if data is less than 6 hour old
							//document.getElementById("stationTime").style.color = "#FFC900"
                            //document.getElementById("stationTime").innerHTML = "" + dateNum.format("LT") + " EDT&nbsp;&nbsp;" + dateNum.format("ddd, MMM D") + " (>6 hours ago)"
                            var stationDateTime = "" + dateNum.format("LT") + " " + tzAbbr + "&nbsp;&nbsp;" + dateNum.format("ddd, MMM D") + " (>6 hours ago)";
                            $("#stationTime").html(stationDateTime);
                            $("#stationTime").css('color', '#FFC900');
						}
						else {
							//document.getElementById("stationTime").style.color = "#f70000"
                            //document.getElementById("stationTime").innerHTML = "" + dateNum.format("LT") + " EDT&nbsp;&nbsp;" + dateNum.format("ddd, MMM D") + " (>1 day ago)"
                            var stationDateTime = "" + dateNum.format("LT") + " " + tzAbbr + "&nbsp;&nbsp;" + dateNum.format("ddd, MMM D") + " (>1 day ago)";
                            $("#stationTime").html(stationDateTime);
                            $("#stationTime").css('color', '#f70000');
						}
						var columnSpan  = 1;
						if (jsonObj[i].thermistorValues.length>1 && !isNaN(jsonObj[i].thermistorValues[0])){ //Check to make sure there are multiple temperature nodes and first two depths are not missing
							columnSpan = 2;
                            //$('#Thermistor').append("<img onclick=document.getElementById('id02').style.display='block';dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'temp_string','glbuoysAction':'popup'}); style='height:350px; width:100%; max-width:550px; cursor: pointer'/>");
							//$('#Thermistor').append('<p style="margin-top:0px">(Click image for interactive graph.)</p>');
							//$('#Thermistor').append('<div id="TempStringLineChart" style="min-width: 310px; height: 400px;"></div>');
							//$('#Thermistor').append('<p style="margin-top:0px">(Click depths in legend to turn on/off depth.)</p>');
							TempStringGrab(ID);
						} else if(jsonObj[i].thermistorValues.length==1){		//Add if statement if buoy owners issues surface temp as 'tp001' and not 'wtmp'
							columnSpan = 2;
						}
						var parameterOrder = ['WSPD','GST','WDIR','WTMP','WVHT','WPRD','MWD','APD','ATMP','PRES','DEWP','PH','DISOXY','DIOSAT','SPCOND','COND','YCHLOR','YBGALG','YTURBI'];
						for (g = 0; g < parameterOrder.length; g++){
							for (j = 0; j < jsonObj[i].obsLongName.length; j++) {
								if(jsonObj[i].obsID[j]===parameterOrder[g] && jsonObj[i].obsValues[j]!=='NaN' && jsonObj[i].obsValues[j]!=='NULL'){
									var toFixedValue = [];
									if (jsonObj[i].obsValues[j]<1){toFixedValue = 2;}else{toFixedValue = 1;}	//Add an additional significant digit if value is less than 1. 
									if (jsonObj[i].obsUnits[j].charAt(0) !== '°') {
										var newRowContent = "<tr id='" + jsonObj[i].obsID[j] + "' onclick=PastForecastGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':$(this).closest('tr').attr('id'),'glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" +
																"<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																"<td class='long_name' align=left>" + jsonObj[i].obsLongName[j] + "</td>" +
																"<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.floor(jsonObj[i].obsValues[j]) + "</div></td>" +
																"<td class='float_value'><div align=left>" + (jsonObj[i].obsValues[j]-Math.floor(jsonObj[i].obsValues[j])).toFixed(toFixedValue).substring(1) + " " + jsonObj[i].obsUnits[j] + "</div></td>" +
																"</tr>";
									}else if(jsonObj[i].obsUnits[j] == '°') {
										var cardinalDir = DegreeToCardinal(jsonObj[i].obsValues[j]);
										var newRowContent = "<tr id='" + jsonObj[i].obsID[j] + "' onclick=PastForecastGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':$(this).closest('tr').attr('id'),'glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" +
																"<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																"<td class='long_name' align=left>" + jsonObj[i].obsLongName[j] + "</td>" +
																"<td colspan='2' style='text-align:center;'>" + cardinalDir + " (" + Math.round(jsonObj[i].obsValues[j]) + "°)</td>" +
																"</tr>";
									}else{
										var newRowContent = "<tr id='" + jsonObj[i].obsID[j] + "' onclick=PastForecastGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':$(this).closest('tr').attr('id'),'glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" +
																"<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																"<td class='long_name' align=left>" + jsonObj[i].obsLongName[j] + "</td>" +
																"<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.floor(jsonObj[i].obsValues[j]) + "</div></td>" +
																"<td class='float_value'><div align=left>" + (jsonObj[i].obsValues[j]-Math.floor(jsonObj[i].obsValues[j])).toFixed(toFixedValue).substring(1) + "" + jsonObj[i].obsUnits[j] + "</div></td>" +
																"</tr>";
                                    }
                                    $('tr#' + jsonObj[i].obsID[j]).replaceWith(newRowContent);
                                    //$(newRowContent).replaceWith($("#realtime tbody"));
								}
							}
						}
					
						if (jsonObj[i].thermistorValues.length>0){
							for (k = 0; k < jsonObj[i].thermistorValues.length; k++) {
								if(!isNaN(jsonObj[i].thermistorValues[k])){		//Check if thermistor is 'NaN'. If so do not write out
									if (k == 0) {
										var newRowContent1 = "<tr id='tp0" + (k) + "'>" +
																		 "<td style='cursor:pointer; width:10px;'><div class='TAccord' align=right><i onclick=$('.TAccord').toggle();dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'temp_string','glbuoysLabel':'water_temp','glbuoysAction':'expand'}); class='material-icons'>remove</i></div>" +
																		 "<div class='TAccord' style='display:none' align=right><i onclick=$('.TAccord').toggle();dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'temp_string','glbuoysLabel':'water_temp','glbuoysAction':'collapse'}); class='material-icons'>add</i></div></td>" +
																		 "<td class='graph' width='10px' style='cursor: pointer;'><div align=right><i class='material-icons' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " "+depthUnits+"</td>" +
																		 "<td class='interger_value' style='padding:8px 0px;cursor: pointer;' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value' style='cursor: pointer;' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'><div align=left >"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "" +tempUnits+ "</div></td>" +
																		 "</tr>";
										//$(newRowContent1).appendTo($("#realtime tbody"));
                                        $('tr#tp0'+k).replaceWith(newRowContent1);
									}	else if (k == jsonObj[i].thermistorValues.length - 1) {
										var newRowContent2 = "<tr id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" + 
																		 "<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " "+depthUnits+"</td>" +
																		 "<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value'><div align=left>"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "" +tempUnits+ "</div></td>" +
																		 "</tr>";
                                        //$(newRowContent2).appendTo($("#realtime tbody"));
                                        $('tr#tp0' + k).replaceWith(newRowContent2);
									} else {
										var moreTemps = //"<tr class='TAccord' style='display:none' id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;''>" + 
																		"<tr class='TAccord' id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;''>" + 
																		"<td class='graph' width='15px' colspan='"+columnSpan+"'><div align=right><i class='material-icons' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');document.getElementById('id01').style.display='block' style='cursor: pointer;'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " "+depthUnits+"</td>" +
																		 "<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value'><div align=left>"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "" +tempUnits+ "</div></td>" +
																		 "</tr>";
                                        //$(moreTemps).appendTo($("#realtime tbody"));
                                        $('tr#TAccord').replaceWith(moreTemps);
									}
								}
							}
						}
					
                        if (jsonObj[i].webcamSrc.length > 0) {
                            $('#BuoyCamPic').replaceWith('<video id="my-video" class="video-js vjs-default-skin vjs-fluid" controls preload="none" poster=' + jsonObj[i].webcamSrc + ' data-setup="{}">');
                            $('#BuoyCamPic video').replaceWith($('<source>').attr("src", jsonObj[i].webcamSrc[0].slice(0,-10)+".mp4").attr("type","video/mp4"));
                            $('#BuoyCamPic video').replaceWith('<p class="vjs-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that<a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a></p>');
                            $('#BuoyCamPic').replaceWith('</video>');
                            $('body').replaceWith('<script src="http://vjs.zencdn.net/6.2.7/video.js"></script>');
							$('#my-video').on('loadeddata', function (e) {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'buoycam','glbuoysLabel':ID,'glbuoysAction':'play_buoycam'});});
						}
					}
				}	
      }
    });
}

function callfooterInfo(ID){
	$('footer p').append('<p>Please click <a id="comments" href="https://docs.google.com/forms/d/e/1FAIpQLSdYV4V0Dw6CpZHZRzZRgEyoRJb8erSdoSBQgLCtlXc-jLN9kQ/viewform?usp=pp_url&entry.1512652591&entry.578184834&entry.1388061372&entry.1336006565='+ID+'" target="_blank">here</a> for assistance or to provide suggestions for improvement.</p>');
	$('a#comments').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'feedback','glbuoysLabel':'mailto:dmac@glos.us','glbuoysAction':'click_external_url'});});
	var googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdYV4V0Dw6CpZHZRzZRgEyoRJb8erSdoSBQgLCtlXc-jLN9kQ/viewform?usp=pp_url&entry.1512652591&entry.578184834&entry.1388061372&entry.1336006565='+ID+'';
	$('a#navFooter').click(function() {window.open(googleFormUrl,'_blank')});
	$('a#navFooter').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':'mailto:dmac@glos.us','glbuoysAction':'click_external_url'});});
}

function PassStation(stationID,lat,lon) {																 
		document.location.href = '../' + stationID;
}

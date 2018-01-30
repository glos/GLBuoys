function loadMetaJSON(callback) {
    var data_file = "http://34.209.199.227//BuoyALP/buoymeta/all";
		var http_request = new XMLHttpRequest();
			http_request.overrideMimeType("application/json");
		http_request.open('GET', data_file, true);
    http_request.onreadystatechange = function () {
        if (http_request.readyState == 4 && http_request.status == 200) {
					callback(http_request.responseText);
        }	
    };
    http_request.send(null);
}

Highcharts.setOptions({
    global: {
        timezone: 'America/New_York'
    }
});

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
			
function initialize(jsonObj) {
		lat = sessionStorage.getItem("lat");	//Remove when using one buoy.html
		lon = sessionStorage.getItem("lon");	//Remove when using one buoy.html
		var ID;
		
		if (sessionStorage.getItem("station")!= null){
			var ID = sessionStorage.getItem("station");
		}
		else {
			var url = window.location.href;
			var arr = url.split("/");
			//var ID = arr[3];
			var ID = '45026';		//For GTM_Test 
			loadbuoyinfo(ID);
    }
		var stations = [];
		var	lats = [];
		var lons = [];
		var obs = [];
		var Wq = [];
		var offline = [];
		var recovered = [];
		
		loadMetaJSON(function(response){
			var jsonObj = JSON.parse(response);

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
							icon: 'img/ActiveBuoyIcon.png',
						});
					}else if (obs[i] && !offline[i]){
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
							title:stations[i],
							map: map,
							zIndex:3,
							icon: 'img/BuoyOnlineIcon.png',
						});
					}else if (offline[i] && obs[i]){
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
							title:stations[i],
							map: map,
							zIndex:2,
							icon: 'img/OldDataBuoyIcon.png',
						});	
					}else if (!obs[i]) {
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
							title:stations[i],
							map: map,
							zIndex:1,
							opacity:0.7,
							icon: 'img/RecoveredBuoyIcon.png',
						});
					}
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
			}
			$('#buoyLocation').append('<div id="googleMapLegend"></div>');
			map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('googleMapLegend'));
			var legend = document.getElementById('googleMapLegend');
			var icons = {
				selected: {
					name: ID,
					icon: 'img/ActiveBuoyIcon.png'
				},
				online: {
					name: 'Online',
					icon: 'img/BuoyOnlineIcon.png'
				},
				NotCurrent: {
					name: 'Not Current',
					icon: 'img/OldDataBuoyIcon.png'
				},
				Recovered: {
					name: 'Recovered',
					icon: 'img/RecoveredBuoyIcon.png'
				}
			};
			var div = document.createElement('div');
			for (var key in icons) {
				var type = icons[key];
				var name = type.name;
				var icon = type.icon;
				div.innerHTML += '<img style="padding-left:4px" src="' + icon + '"> ' + name;
				legend.appendChild(div);
			}
		});
    
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
		
		//If buoy page is accessed from the homepage, read in station ID from session storage. If the buoy page is accessed via
		//url then read the station from the url.
    var ID;
		if (sessionStorage.getItem("station")!= null){
			var ID = sessionStorage.getItem("station");
			loadbuoyinfo(ID);
			sessionStorage.clear();
		}
		else {
			var url = window.location.href;
			var arr = url.split("/");
			var ID = arr[3];
    }

    loadMetaJSON(function(response){
			var jsonObj = JSON.parse(response);
			loadbuoyinfo(ID, jsonObj);
			$.each(jsonObj, function (i, option) {
				if (!option.WqOnly){
					if (option.lake == "ER") {
						$('#ErieAcc').append($('<a>')./**attr("href", '#').**/click(function () { PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));	//Remove when using one buoy.html
					}
					else if (option.lake == "MI") {
						$('#MichiganAcc').append($('<a>')./**attr("href", '#').**/click(function() { PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer')); //Remove when using one buoy.html
					}
					else if (option.lake == "HU") {
						$('#HuronAcc').append($('<a>')./**attr("href", '#').**/click(function(){ PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));
					}
					else if (option.lake == "SUP") {
						$('#SuperiorAcc').append($('<a>')./**attr("href", '#').**/click(function (){ PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));
					}
					else if (option.lake == "ON") {
						$('#OntarioAcc').append($('<a>')./**attr("href", '#').**/click(function (){ PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click_internal_url'}); }).text(option.id).attr("style",'cursor:pointer'));
					}
				}
			});
    });
		var refresher = setInterval("reloadbuoyinfo("+ID+");",600000); // refresh content every 10 minutes
});

//Use for reading in JSON objects array
function loadbuoyinfo(ID, jsonObj) {
    var currentTime = moment();
    loadMetaJSON(function(response){
			var jsonObj = JSON.parse(response);
			// jsonObj variable now contains the data structure and can be accessed as jsonObj.keys
			for (i = 0; i < jsonObj.length; i++) {
				if (jsonObj[i].id == ID) {
					document.title = 'Buoy '+ID+ ' - Great Lakes Buoys';
					if (jsonObj[i].sponsors){
						$('#sponsorsBottom h5').append('Buoy Sponsors');
						$('#sponsorsBottom h5').addClass("glosBlue w3-center w3-padding");
						for(a=0; a < jsonObj[i].sponsors.length; a++){
							if (a == 0 || a == 1) {
								if (jsonObj[i].id == '45029' || jsonObj[i].id == '45168' && a == 0) {
									$('#sponsorsHeader').append($('<a>').attr("id",a).attr("href",jsonObj[i].sponsorsSrc[a]).click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'logo','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});}));	
									$('#sponsorsHeader #'+a+'').append($('<img>').attr("id",a).attr("src", jsonObj[i].sponsors[a]).addClass("sponsors w3-margin-left w3-margin-right"));
									//$('#sponsorsHeader #'+a+'').on('click',function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'sponsors','glbuoysLabel':jsonObj[i].sponsorsSrc[a],'glbuoysAction':'click_external_url'});}));
								}else {
								$('#sponsorsHeader').append($('<a>').attr("id",a).attr("href",jsonObj[i].sponsorsSrc[a]).attr("target","_blank").click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'logo','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});}));	
								$('#sponsorsHeader #'+a+'').append($('<img>').attr("id",a).attr("src", jsonObj[i].sponsors[a]).addClass("sponsors w3-margin-left w3-margin-right"));
								$('#sponsorsBottom').append($('<a>').attr("id",a).attr("href",jsonObj[i].sponsorsSrc[a]).attr("target","_blank").click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'logo','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});}));
								$('#sponsorsBottom #'+a+'').append($('<img>').attr("id",a).attr("src", jsonObj[i].sponsors[a]).addClass("sponsors w3-margin-left w3-margin-right w3-margin-bottom"));
								//$('#sponsorsHeader #'+a+'').click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'sponsors','glbuoysLabel':sponsor,'glbuoysAction':'click_external_url'});});
								}
							}else {
								$('#sponsorsBottom').append($('<a>').attr("id",a).attr("href",jsonObj[i].sponsorsSrc[a]).attr("target","_blank").click(function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'logo','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});}));
								$('#sponsorsBottom #'+a+'').append($('<img>').attr("src", jsonObj[i].sponsors[a]).addClass("sponsors w3-margin-left w3-margin-right w3-margin-bottom"));
								$('#sponsorsBottom #'+a+'').on('click',function(){dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'sponsors','glbuoysLabel':$(this).closest('a').attr('href'),'glbuoysAction':'click_external_url'});});
							}
						}
					}
					console.log(jsonObj[i]);
					if(jsonObj[i].obsUnits){
						$('#staticHeader h4').append('Most Recent Observations');
						document.getElementById("stationID").innerHTML = "" + jsonObj[i].longName + " (" + jsonObj[i].id + ")";
						var dateNum = moment(jsonObj[i].updateTime);
						var hourDiff = moment.duration(currentTime.diff(dateNum)).asHours();
						if (hourDiff < 6) {  //assumes time from json is local. Checks if data is less than 1 hour old
							document.getElementById("stationTime").style.color = "#337ab7"
							document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" EDT&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ ""
						}
						else if (hourDiff > 6 && hourDiff < 24) {  //assumes time from json is local. Checks if data is less than 6 hour old
							document.getElementById("stationTime").style.color = "#FFC900"
							document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" EDT&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ " (>6 hours ago)"
						}
						else {
							document.getElementById("stationTime").style.color = "#f70000"
							document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" EDT&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ " (>1 day ago)"
						}
						var columnSpan  = 1;
						if (jsonObj[i].thermistorValues.length>1 && !isNaN(jsonObj[i].thermistorValues[0])){ //Check to make sure there are multiple temperature nodes and first two depths are not missing
							columnSpan = 2;
							$('#Thermistor').addClass("w3-center w3-panel w3-card-4 w3-padding");
							$('#Thermistor h4').append('Water Temperature Profile');
							$('#Thermistor h4').addClass("glosBlue w3-center");
							$('#Thermistor').append("<img onclick=document.getElementById('id02').style.display='block';dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'temp_string','glbuoysAction':'popup'}); style='height:350px; width:100%; max-width:550px; cursor: pointer'/>");// src='img/tempstring.jpg'/>");
							$('#Thermistor').append('<p>(Click image for interactive graph.)</p>');
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
																		 "<td class='long_name' align=left onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " ft</td>" +
																		 "<td class='interger_value' style='padding:8px 0px;cursor: pointer;' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value' style='cursor: pointer;' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'><div align=left >"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "°F</div></td>" +
																		 "</tr>";
										$(newRowContent1).appendTo($("#realtime tbody"));
									}	else if (k == jsonObj[i].thermistorValues.length - 1) {
										var newRowContent2 = "<tr id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" + 
																		 "<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " ft</td>" +
																		 "<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value'><div align=left>"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "°F</div></td>" +
																		 "</tr>";
										$(newRowContent2).appendTo($("#realtime tbody"));
									} else {
										var moreTemps = //"<tr class='TAccord' style='display:none' id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;''>" + 
																		"<tr class='TAccord' id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;''>" + 
																		"<td class='graph' width='15px' colspan='"+columnSpan+"'><div align=right><i class='material-icons' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');document.getElementById('id01').style.display='block' style='cursor: pointer;'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " ft</td>" +
																		 "<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value'><div align=left>"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "°F</div></td>" +
																		 "</tr>";
											$(moreTemps).appendTo($("#realtime tbody"));
									}
								}
							}
						}
					
						$('#textBuoy').addClass('w3-panel w3-light-gray w3-small');
						$('#textBuoy').append('<p><i>SMS: &nbsp;Text '+jsonObj[i].id+' to <a  id="SMS" href="sms:1-734-418-7299">(734) 418-7299</a> for the latest observations.</i></p>');
						$('#textBuoy').append('<p><i>GLOS <a id="Portal" href="http://portal.glos.us/" target="_blank">Data Portal</a>: &nbsp;Access more data, models, and create alerts.</i></p>');
						$('#textBuoy a#SMS').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'SMS','glbuoysLabel':ID,'glbuoysAction':'click_external_url'});});
						$('#textBuoy a#Portal').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'Data Portal','glbuoysLabel':'glos','glbuoysAction':'click_external_url'});});
						
						if (jsonObj[i].webcamSrc.length>0){
							$('#buoyCam').addClass("w3-center w3-panel w3-card-4 w3-padding");
							$('#BuoyCamTitle h4').append('Buoy Cam');
							$('#BuoyCamTitle h4').addClass("glosBlue w3-center");
							$('#BuoyCamPic').append($('<a>').attr("href",jsonObj[i].webcamLink).attr("target","_blank"));
							$('#BuoyCamPic a').append($('<img>').attr("src", jsonObj[i].webcamSrc).attr("style", 'width:100%;max-width:500px'));
							$('#BuoyCamPic a').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'buoycam','glbuoysLabel':ID,'glbuoysAction':'click_external_url'});});
							$('#BuoyCamPic').append('<p>(Click image to view video clip)<p>');
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
						$('#MarineForecast h4').append($('<img>').attr("src", "img/NOAA_logo").attr("style", 'width:47px;padding-left:10px'));
						$('#MarineForecast h4').append($('<img>').attr("src", "img/NWS_logo").attr("style", 'width:40px'));
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
			callfooterInfo();
    });
}
function reloadbuoyinfo(ID) {
	$('#stationTime').empty();
	$('#realtime tbody').empty();
	$('#Thermistor img').remove();
	$('#BuoyCamPic').empty();
	
    var currentTime = moment();
    //var currentTime = d.getTime();  //Current milliseconds since epoch
    loadMetaJSON(function(response){
			var jsonObj = JSON.parse(response);
			// jsonObj variable now contains the data structure and can be accessed as jsonObj.keys
			for (i = 0; i < jsonObj.length; i++) {
				if (jsonObj[i].id == ID) {
					console.log(jsonObj[i]);
					if(jsonObj[i].obsUnits){
						var dateNum = moment(jsonObj[i].updateTime);
						var hourDiff = moment.duration(currentTime.diff(dateNum)).asHours();
						if (hourDiff < 6) {  //assumes time from json is local. Checks if data is less than 1 hour old
							document.getElementById("stationTime").style.color = "#337ab7"
							document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" EDT&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ ""
						}
						else if (hourDiff > 6 && hourDiff < 24) {  //assumes time from json is local. Checks if data is less than 6 hour old
							document.getElementById("stationTime").style.color = "#FFC900"
							document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" EDT&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ " (>6 hours ago)"
						}else {
							document.getElementById("stationTime").style.color = "#f70000"
						  document.getElementById("stationTime").innerHTML = ""+dateNum.format("LT")+" EDT&nbsp;&nbsp;"+dateNum.format("ddd, MMM D")+ " (>1 day ago)"
						}
						var columnSpan  = 1;
						if (jsonObj[i].thermistorValues.length>1 && !isNaN(jsonObj[i].thermistorValues[0])){ //Check to make sure there are multiple temperature nodes and first two depths are not missing
							columnSpan = 2;
							$('#Thermistor').append("<img onclick=document.getElementById('id02').style.display='block'; style='height:350px; width:100%; max-width:550px; cursor: pointer'/>");// src='img/tempstring.jpg'/>");
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
																		 "<td class='long_name' align=left onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " ft</td>" +
																		 "<td class='interger_value' style='padding:8px 0px;cursor: pointer;' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value' style='cursor: pointer;' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"','glbuoysAction':'popup'});document.getElementById('id01').style.display='block'><div align=left >"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "°F</div></td>" +
																		 "</tr>";
										$(newRowContent1).appendTo($("#realtime tbody"));
									}	else if (k == jsonObj[i].thermistorValues.length - 1) {
										var newRowContent2 = "<tr id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;'>" + 
																		 "<td class='graph' width='20px' colspan='"+columnSpan+"'><div align=right><i class='material-icons'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " ft</td>" +
																		 "<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value'><div align=left>"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "°F</div></td>" +
																		 "</tr>";
										$(newRowContent2).appendTo($("#realtime tbody"));
									} else {
										var moreTemps = //"<tr class='TAccord' style='display:none' id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;''>" + 
																		"<tr class='TAccord' id='tp0" + (k) + "'onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'graph','glbuoysLabel':'water_temp@"+jsonObj[i].thermistorDepths[k].toFixed(0)+"feet','glbuoysAction':'popup'});document.getElementById('id01').style.display='block' style='cursor: pointer;''>" + 
																		"<td class='graph' width='15px' colspan='"+columnSpan+"'><div align=right><i class='material-icons' onclick=PastTempGrab($(this).closest('tr').attr('id'),'"+ID+"');document.getElementById('id01').style.display='block' style='cursor: pointer;'>timeline</i></div></td>" +
																		 "<td class='long_name' align=left>Water Temp. @ " + jsonObj[i].thermistorDepths[k].toFixed(0) + " ft</td>" +
																		 "<td class='interger_value 'style='padding:8px 0px'><div align=right>" + Math.round(jsonObj[i].thermistorValues[k]) + "</div></td>" +
																		 "<td class='float_value'><div align=left>"+ (jsonObj[i].thermistorValues[k]-Math.floor(jsonObj[i].thermistorValues[k])).toFixed(1).substring(1) + "°F</div></td>" +
																		 "</tr>";
											$(moreTemps).appendTo($("#realtime tbody"));
									}
								}
							}
						}
					
						if (jsonObj[i].webcamSrc.length>0){	
							$('#BuoyCamPic').append($('<a>').attr("href",jsonObj[i].webcamLink).attr("target","_blank"));
							$('#BuoyCamPic a').append($('<img>').attr("src", jsonObj[i].webcamSrc).attr("style", 'width:100%;max-width:500px'));
							$('#BuoyCamPic').append('<p>(Click image to view video clip)<p>');
							$('#BuoyCamPic a').click(function() {dataLayer.push({'glbuoysCategory':'buoycam','glbuoysLabel':jsonObj[i].id,'glbuoysAction':'click_external_url'});});
						}
					}
				}	
      }
    });
}

function callfooterInfo(){
	$('footer p').append('<p>Please send comments about the Great Lakes Buoys website to <a href="https://goo.gl/forms/9a3v1XZCUA56loOp1" target="_blank">dmac@glos.us</a></p>');
}

function PassStation(stationID,lat,lon) {
		sessionStorage.setItem("station", stationID);
		sessionStorage.setItem("lat", lat);
		sessionStorage.setItem("lon", lon);
		document.location.href = stationID;
}
const _mapType = 'ol';

var loadLocal = false;
var prePath = '../static/Buoy_tool/';
var units = 'english' //global variables
var speedUnits = 'kts';
var depthUnits = 'ft';
var depthUnitsLng = 'feet';
var tempUnits = '°F';
var url = window.location.href;
var arr = url.split("/");
var ID = arr[3];

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

//--------------------------Load Banner News if available-----------------------------
google.charts.load('current', {
    callback: getBannerNews,
    packages: ['corechart']
});

var bannerNews;

function getBannerNews() {
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
        bannerNews = data.getValue(0, 0);
    }
    catch (err) {
        console.log("No Banner News");
    }
    if (bannerNews) {
        $('#bannerNews').addClass('w3-panel w3-pale-green w3-small');
				$('#bannerNews').attr('style','max-width:550px; margin: 0 auto;');
				$('#bannerNews').append('<p>'+bannerNews+'</p>');
				$('#main').attr('style','margin-top:70px')
    }
}
//------------------------------------------------------------------------------------------------

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
		return "NA";
	}
}
				
$(document).ready(function () {
    $('button#feedback').click(function () {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSdYV4V0Dw6CpZHZRzZRgEyoRJb8erSdoSBQgLCtlXc-jLN9kQ/viewform?usp=pp_url&entry.1512652591&entry.578184834&entry.1388061372&entry.1336006565=all', '_blank')
    });
    $('button#feedback').click(function () { dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'nav menu', 'glbuoysLabel': 'mailto:dmac@glos.us', 'glbuoysAction': 'click_external_url' }); });
	loadBuoySummary();
	var refresher = setInterval(loadBuoySummary,600000); // refresh content every 10 minutes 
});

var reloadCount = 0;

function loadBuoySummary(){
	var jsonObj;
    loadbuoyinfo_home(function (jsonObj) {
			//Empty content before second load
			if (reloadCount > 0){
				$('#buoySummary tbody').empty();
                $('#buoySummary thead').empty();
                $('#buoySummary tbody').empty();
                $('#buoySummary thead').empty();
                $('#ErieAcc').empty();
                $('#MichiganAcc').empty();
                $('#HuronAcc').empty();
                $('#SuperiorAcc').empty();
                $('#OntarioAcc').empty();
                $('#otherAcc').empty();
			}
			reloadCount += 1;
			var ErieRows;
			var MichiganRows;
			var SuperiorRows;
			var HuronRows;
			var OntarioRows
			$.each(jsonObj, function (i, option) {
				function checkMissing(value){
					if(value==null){
						return 'NA'
					}else{
						return value.toFixed(1)
					}
				}
				
				function checkAltID(option){
					if(!option.altID){
						return option.id;
					}else{

						return option.altID;
					}
				}
				
				moment.tz.setDefault('America/New_York'); //set time zone to eastern
				
				if (option.WqOnly || option.WqAndWx) {
					$('#ErieAcc').append($('<a>').click(function () { PassStation(option.id,option.lat,option.lon);dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav menu','glbuoysLabel':option.id,'glbuoysAction':'click internal url'});}).text(option.id).attr("style",'cursor:pointer'));	//Remove when using one buoy.html
					try{
						if(!option.recovered || option.obsUnits){
							if(!ifOffline(moment(option.updateTime))){
								ErieRows += '<tr id="'+option.id+'" onclick=PassStation("'+option.id+'",'+option.lat+','+option.lon+');dataLayer.push({"event":"glbuoysEvent","glbuoysCategory":"buoy_obs_list","glbuoysLabel":"'+option.id+'","glbuoysAction":"click_internal_url"}); style=cursor:pointer;>'+
								'<td>'+checkAltID(option)+'</td>'+
								'<td>'+option.longName+'</td>'+
								'<td style="text-align:right;">'+moment(option.updateTime).format("LT") + '</td>'+
								'<td style="text-align:right;width:45px;padding-right:10px">'+checkMissing(option.obsValues[option.obsID.indexOf('WTMP')])+'</td>'+
								'<td style="text-align:right;width:45px;padding-right:10px">'+checkMissing(option.obsValues[option.obsID.indexOf('YBGALG')])+'</td>'+
								'<td style="text-align:right;width:45px;padding-right:10px">'+checkMissing(option.obsValues[option.obsID.indexOf('YCHLOR')])+'</td>'+
								'<td style="text-align:right;width:45px;padding-right:10px">'+checkMissing(option.obsValues[option.obsID.indexOf('DISOXY')])+'</td>'+
								'<td style="text-align:right;width:45px;padding-right:10px">'+checkMissing(option.obsValues[option.obsID.indexOf('PH')])+'</td></tr>';
							}else{
								ErieRows += '<tr id="'+option.id+'" onclick=PassStation("'+option.id+'",'+option.lat+','+option.lon+');dataLayer.push({"event":"glbuoysEvent","glbuoysCategory":"buoy_obs_list","glbuoysLabel":"'+option.id+'","glbuoysAction":"click_internal_url"}); style=cursor:pointer;><td>'+checkAltID(option)+'</td><td>'+option.longName+'</td><td class=w3-center colspan=6><i>Data older than 6 hours</i></td></tr>';
							}
						}else{
							ErieRows += '<tr id="'+option.id+'" onclick=PassStation("'+option.id+'",'+option.lat+','+option.lon+');dataLayer.push({"event":"glbuoysEvent","glbuoysCategory":"buoy_obs_list","glbuoysLabel":"'+option.id+'","glbuoysAction":"click_internal_url"}); style=cursor:pointer;><td>'+checkAltID(option)+'</td><td>'+option.longName+'</td><td class=w3-center colspan=6><i>Currently unavailable</i></td></tr>';
						}
					} catch (err) {
						ErieRows += '<tr id="'+option.id+'" onclick=PassStation("'+option.id+'",'+option.lat+','+option.lon+');dataLayer.push({"event":"glbuoysEvent","glbuoysCategory":"buoy_obs_list","glbuoysLabel":"'+option.id+'","glbuoysAction":"click_internal_url"}); style=cursor:pointer;><td>'+checkAltID(option)+'</td><td>'+option.longName+'</td><td class=w3-center colspan=6><i>Currently unavailable</i></td></tr>';
					}
				}
			});
			$('#buoySummary tbody').append(ErieRows);
			$('#buoySummary thead').append('<tr id="tableHeader">' +
															'<td>ID</td>' +
															'<td>Location</td>' +
															'<td>Time (EDT)</td>' +
															'<td>Water (&degF)</td>' +
															'<td>BGA (RFU)</td>' +
															'<td>CHYL (RFU)</td>' +
															'<td>DO (mg/L)</td>'+
															'<td>PH</td>'+
														'</tr>)');        
		});
		if (reloadCount == 0){
				callAboutGLBuoys();
				initialize();
		}
}

function callAboutGLBuoys(){		
			$('#aboutBuoyPortal').addClass("w3-container w3-center w3-padding-24");
			$('#aboutBuoyPortal h5').append('About the Great Lakes Buoy Portal');
			$('#aboutBuoyPortal h5').addClass("glosBlue");
			$('#bannerNews').addClass('w3-panel w3-pale-green w3-small');
			$('#aboutBuoyPortal p').append("The <a id='glos' href='http://www.glos.us/' target='_blank'>Great Lakes Observing System</a>’s <a id='glbuoys' href='http://glbuoys.glos.us/' target='_blank'>Great Lakes Buoy Portal</a> provides users with near real-time weather, wave, and water quality conditions observed in the Great Lakes.  "+
																	 " The portal also allows users to check weather and wave forecasts, and to view hazard information from the National Weather Service. "+
																	 " Observations come from both privately- and publicly-owned buoys."+
																	 " Forecasts are from NOAA’s <a id='glerl' href='https://www.glerl.noaa.gov/' target='_blank'> Great Lakes Environmental Research Laboratory</a>'s <a id='glcfs' href='https://www.glerl.noaa.gov/res/glcfs/' target='_blank'> Great Lakes Coastal Forecasting System</a> and the <a id='NWS' href='http://www.weather.gov/' target='_blank'>National Weather Service</a> are used.");
			$('footer p').append('<p>Please click <a id="comments" href="https://docs.google.com/forms/d/e/1FAIpQLSdYV4V0Dw6CpZHZRzZRgEyoRJb8erSdoSBQgLCtlXc-jLN9kQ/viewform?usp=pp_url&entry.1512652591&entry.578184834&entry.1388061372&entry.1336006565=erie" target="_blank">here</a> for assistance or to provide suggestions for improvement.</p>')
			$('#aboutBuoyPortal h5').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'nav memu','glbuoysLabel':'About the Great Lakes Buoy Portal','glbuoysAction':'click_internal_url'});});
			$('#aboutBuoyPortal a#glos').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'about_glbuoys','glbuoysLabel':'http://glbuoys.glos.us/','glbuoysAction':'click_external_url'});});
			$('#aboutBuoyPortal a#glbuoys').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'about_glbuoys','glbuoysLabel':'http://glos.us','glbuoysAction':'click_internal_url'});});
			$('#aboutBuoyPortal a#glerl').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'about_glbuoys','glbuoysLabel':'https://www.glerl.noaa.gov/','glbuoysAction':'click_external_url'});});
			$('#aboutBuoyPortal a#glcfs').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'about_glbuoys','glbuoysLabel':'https://www.glerl.noaa.gov/res/glcfs/','glbuoysAction':'click_external_url'});});
			$('#aboutBuoyPortal a#NWS').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'about_glbuoys','glbuoysLabel':'http://www.weather.gov/','glbuoysAction':'click_external_url'});});
			$('a#comments').click(function() {dataLayer.push({'event':'glbuoysEvent','glbuoysCategory':'about_glbuoys','glbuoysLabel':'mailto:dmac@glos.us','glbuoysAction':'click_external_url'});});
		};
		
		
function loadbuoyinfo_home(callback) {
    var data_file = '../static/Buoy_tool/data/meta_' + units + '.json';
    $.getJSON(data_file, function (json) {
        var ichk = 0;
        callback(json);
    });
}

function w3_open() {
    document.getElementById("mySidenav").style.display = "block";
}
function w3_close() {
    document.getElementById("mySidenav").style.display = "none";
    var x = document.getElementById("ErieAcc");
    x.className = x.className.replace("w3-show", "");
    x.previousElementSibling.className =
        x.previousElementSibling.className.replace("w3-theme-d4", "");

}
function myAccFunc3() {
    var x = document.getElementById("ErieAcc");
    if (x.className.indexOf("w3-hide") == -1) {
        x.className += " w3-hide";
        x.previousElementSibling.className += "w3-white";
    } else {
        x.className = x.className.replace("w3-hide", "");
        x.previousElementSibling.className =
            x.previousElementSibling.className.replace("w3-white", "");
    }
}

// HABs map overlay

var mapBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(41.275536, -83.683300),
    new google.maps.LatLng(43.031418, -78.615219));
var mapMinZoom = 6;
var mapMaxZoom = 12;
var maptiler = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) { if (zoom > mapMaxZoom) { zoom = mapMaxZoom};	 
        var proj = map.getProjection();
        var z2 = Math.pow(2, zoom);
        var tileXSize = 256 / z2;
        var tileYSize = 256 / z2;
        var tileBounds = new google.maps.LatLngBounds(
            proj.fromPointToLatLng(new google.maps.Point(coord.x * tileXSize, (coord.y + 1) * tileYSize)),
            proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * tileXSize, coord.y * tileYSize))
        );
        var y = coord.y;
        var x = coord.x >= 0 ? coord.x : z2 + coord.x
        if (mapBounds.intersects(tileBounds) && (mapMinZoom <= zoom) && (zoom <= mapMaxZoom))
            return "tiles/erie-test/" + zoom + "/" + x + "/" + y + ".png";
        else
            return "https://www.maptiler.com/img/none.png";
    },
    tileSize: new google.maps.Size(256, 256),
    isPng: true,

    opacity: 1.0
});
									 
function initialize() {

    var stations = [];
    var stationsLongName = [];
		var	lats = [];
		var lons = [];
		var obs = [];
		var WqOnly = [];
		var WqAndWx = [];
		var offline = [];
		var recovered = [];
		
        loadbuoyinfo_home(function (jsonObj) {

            // Initialize OL4 map:
            if (_mapType === 'ol') {
                initializeMapOL(jsonObj, '');
                return;
            }

			//var jsonObj = JSON.parse(response);
			for (i = 0; i < jsonObj.length; i++) {
                stations[i] = jsonObj[i].id;
                stationsLongName[i] = jsonObj[i].longName;
            lats[i] = jsonObj[i].lat;
            lons[i] = jsonObj[i].lon;
						obs[i] = jsonObj[i].obsValues;
						WqOnly[i] = jsonObj[i].WqOnly;
						WqAndWx[i] = jsonObj[i].WqAndWx;
						offline[i] = ifOffline(jsonObj[i].updateTime);
						recovered[i] = jsonObj[i].recovered;
      }
		
			map = new google.maps.Map(document.getElementById("map_canvas"), {
            zoom: 7,
            center: new google.maps.LatLng(42.0, -81.3),
            mapTypeControl: true,
            mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
            navigationControl: true,
            navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL},
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
			
			var infowindow = new google.maps.InfoWindow();
			
			var marker, i;  
			for (i = 0; i < stations.length; i++) {
				if(WqOnly[i] || WqAndWx[i]){
					if (obs[i] && !offline[i]){
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
                            title: stationsLongName[i],
							map: map,
							zIndex:3,
                            icon: prePath + 'img/BuoyOnlineIcon.png',
						});
					}else if (offline[i] && obs[i]){
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
                            title: stationsLongName[i],
							map: map,
							zIndex:2,
                            icon: prePath + 'img/OldDataBuoyIcon.png',
						});	
					}else if (!obs[i]) {
						marker = new google.maps.Marker({
							position: new google.maps.LatLng(lats[i], lons[i]),
                            title: stationsLongName[i],
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
                var contentString = '<div id="content" style="cursor:pointer;font-family: Inconsolata,Verdana; font-size:15px; color:#333;font-weight:700" onclick="PassStation(\'' + stations[i] + '\');dataLayer.push({\'event\':\'glbuoysEvent\',\'glbuoysCategory\':\'map\',\'glbuoysLabel\':\'' + stations[i] + '\',\'glbuoysAction\':\'click internal url\'});">' + stationsLongName[i] + '</div>';
                map.setCenter({
                    lat: lats[i],
                    lng: lons[i]
                })
                infowindow.setContent(contentString);
                infowindow.open(map, marker);
						}
					})(marker, i));
				}
			}
			$('#main').append('<div id="googleMapLegend"></div>');
			map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(document.getElementById('googleMapLegend'));
			var legend = document.getElementById('googleMapLegend');
				var icons = {
					online: {
					name: 'Current',
                    icon: prePath + 'img/BuoyOnlineIcon.png'
				},
				NotCurrent: {
					name: 'Delayed',
                    icon: prePath + 'img/OldDataBuoyIcon.png'
				},
				Recovered: {
					name: 'Out of Water',
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
$('#cbCI').change(function () {
            if ($(this).is(':checked')) {
              map.overlayMapTypes.insertAt(0, maptiler);
}
else {
              map.overlayMapTypes.clear();

}
            });


 //map.overlayMapTypes.insertAt(0, maptiler);
//alert(map.overlayMapTypes.length);

		});
}

onload=function(){
var e=document.getElementById("refreshed");
//alert(e.value);
if(e.value=="no")
  e.value="yes";
else {
  e.value="no";
  if ($('#cbCI').is(':checked')) {
              map.overlayMapTypes.insertAt(0, maptiler);
   }
  }
}


function PassStation(stationID) {
    //sessionStorage.setItem("station", stationID);
    document.location.href = '../' + stationID;
}															 
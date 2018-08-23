// Projection: WGS 84
var map;
const olProj = ol.proj.get('EPSG:3857');
const _strNavMsg = 'Click here to view the page for this buoy';
var featSelBuoy = {};       // selected buoy feature

var _objMarkers = {};
var _olPopup;

// jQuery "ready" function:
$(function () {


    // Anchor click event to open buoy page:
    $('#popup-content').on('click', 'a.nav-buoy', function (evt) {
        evt.preventDefault();
        document.location.href = '../' + $(this).attr('data-buoy');
    });

});          // end jQuery ready


var initializeMapOL = function (objBuoys, actBuoyID) {

    actBuoyID = actBuoyID || '';      // apply default if arg is missing

    $('#map_canvas').toggle(false);
    $('#map-container').toggle(true);

    //----------------------------------------------------------
    //- Create Map w/ Basemap Layer:
    //----------------------------------------------------------

    // Bing Roads basemap:
    var lyrBasemap = new ol.layer.Tile({
        visible: true,
        preload: Infinity,
        source: new ol.source.BingMaps({
            key: 'AlKEwMTryhkZabRaZoSSoURWL9JrVK7M2XiB7pAOfJ8IHl8YNlSFee0csXP8IVtp',
            imagerySet: 'Road'
            // use maxZoom 19 to see stretched tiles instead of the BingMaps
            // "no photos at this zoom level" tiles
            //maxZoom: 19
        })
    });

    // ESRI Oceans basemap:
    /*
    var urlOceans = 'https://services.arcgisonline.com/arcgis/rest/services/Ocean_Basemap/MapServer';

    var lyrBasemap = new ol.layer.Tile({
        visible: true,
        source: new ol.source.TileArcGISRest({
            attributions: 'Ocean Map Tiles &copy; <a href="' + urlOceans + '" target="_blank">ArcGIS</a>',
            url: urlOceans
        })
    });
    */

    // Create OL4 map:
    var olView = new ol.View({
        center: getCoords_WebMerc(-84.5, 45.0),
        //center: [-84.5, 45.0],
        projection: olProj,
        zoom: 5.0
    });

    map = new ol.Map({
        controls: ol.control.defaults().extend([
            new ol.control.FullScreen()
        ]),
        layers: [lyrBasemap],
        loadTilesWhileInteracting: true,
        target: document.getElementById('map'),
        view: olView,
        logo: false,
        maxResolution: 1920
    });


    //----------------------------------------------------------
    //- Construct & Add Buoy Layer:
    //----------------------------------------------------------

    // Create buoy features:
    var arrFeatures = [];
    featSelBuoy = undefined;

    $.each(objBuoys, function (idx, objBuoy) {
        arrCoords = getCoords_WebMerc(objBuoy.lon, objBuoy.lat);

        var feat = new ol.Feature({
            id: objBuoy.id,
            longName: objBuoy.longName,
            wqOnly: objBuoy.WqOnly,
            obs: objBuoy.obsValues,
            offline: ifOffline(objBuoy.updateTime),
            recovered: objBuoy.recovered,
            lon: objBuoy.lon,
            lat: objBuoy.lat,
            geometry: new ol.geom.Point(arrCoords)
        })

        // Define marker type (for styling):
        feat.set('markerType', getMarkerType(feat, actBuoyID));

        if (feat.get('markerType') === 'active') {
            featSelBuoy = feat;     // save active buoy
        }

        // Push to feature array:
        arrFeatures.push(feat);
    });

    // Buoy source data:
    var srcBuoy = new ol.source.Vector({});
    srcBuoy.addFeatures(arrFeatures);

    // Set buoy styles:
    setBuoyStyles();

    // Create buoy layer:
    var lyrBuoys = new ol.layer.Vector({
        source: srcBuoy,
        style: function (feature, resolution) {        // function to return point style
            return getBuoyStyle(feature);
        }
    });

    map.addLayer(lyrBuoys);

    //----------------------------------------------------------
    //- Configure map interactions:
    //----------------------------------------------------------

    // Add "hover" interaction:
    var hoverInteraction = new ol.interaction.Select({
        condition: ol.events.condition.pointerMove,
        layers: [lyrBuoys],
        style: function (feature, resolution) {
            return getBuoyStyle(feature);
        }
    });

    map.addInteraction(hoverInteraction);

    // "Select" interaction to handle user click:
    var selectInteraction = new ol.interaction.Select({
        layers: [lyrBuoys],
        style: function (feature, resolution) {
            return getBuoyStyle(feature);
        }
    });

    map.addInteraction(selectInteraction);
    _selFeatures = selectInteraction.getFeatures();

    //----------------------------------------------------------
    //- Configure overlay for popup:
    //----------------------------------------------------------

    _olPopup = new ol.Overlay({
        element: document.getElementById('popup'),
        positioning: 'top-center',
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    });
    map.addOverlay(_olPopup)

    //----------------------------------------------------------
    //- Define map events:
    //----------------------------------------------------------

    // Map - "singleclick" event handler:
    map.on('singleclick', function (evt) {

        // Attempt to find a feature in one of the visible vector layers
        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function (feature, layer) {
                return feature;
            });

        //Increase area around pixel that can be clicked. Geared towards mobile view. 
        var hitTolerance = 5;           

        // Create popup if buoy point was clicked:
        if (feature) {
            setTimeout(function () {
                centerToPoint(feature);
                var coord = feature.getGeometry().getCoordinates();
                displayPopup(feature, coord);
                //displayPopup(feature, evt.coordinate);
            }, 500);
        };
    });

    // Popup close button - click handler:
    $('#popup-closer').on('click', function (evt) {
        evt.preventDefault();       // prevent scroll to top of page caused by href="#"

        _olPopup.setPosition(undefined);
        $(this).blur();
    });

    // Mouse over event. By default show hand. Once dragging change hand to dragging.:
    map.on('pointermove', function (e) {
        if (e.dragging) {
            _olPopup.setPosition(undefined);
            map.getTarget().style.cursor = "-webkit-grabbing";
            return;
        } else {
            var pixel = map.getEventPixel(e.originalEvent);
            var hit = map.hasFeatureAtPixel(pixel);
            map.getTarget().style.cursor = hit ? 'pointer' : '-webkit-grab';
        }
    });

    //----------------------------------------------------------
    //- Add Map Legend:
    //----------------------------------------------------------
    objLegItems = {};

    if (actBuoyID === '') {       // GL map (all buoys shown)
        objLegItems = {
            'Online': prePath + 'img/BuoyOnlineIcon.png',
            'Not Current': prePath + 'img/OldDataBuoyIcon.png',
            'Recovered': prePath + 'img/RecoveredBuoyIcon.png',
        }
    } else {                    // Buoy selected (zoomed in view)
        objLegItems[actBuoyID] = prePath + 'img/ActiveBuoyIcon.png';
        objLegItems['Online'] = prePath + 'img/BuoyOnlineIcon.png';
        objLegItems['Not Current'] = prePath + 'img/OldDataBuoyIcon.png';
        objLegItems['Recovered'] = prePath + 'img/RecoveredBuoyIcon.png';
    }

    buildLegend(objLegItems, actBuoyID);

    //----------------------------------------------------------
    //- Zoom to Buoy (if buoy-specific view):
    //----------------------------------------------------------
    if (featSelBuoy !== undefined) {
        zoomToPoint(featSelBuoy);
    }

    //----------------------------------------------------------
    //- Create custom fullscreen icon
    //----------------------------------------------------------
    fullscreenPath = prePath + 'img/fullscreen_icon.png';
    fullscreenClosePath = prePath + 'img/fullscreenClose_icon.png';
    $('.ol-full-screen-false').attr('title', 'Enter Fullscreen Mode');
    $('.ol-full-screen-false').html('<img src="' + fullscreenPath + '"/>');

    if (document.addEventListener) {
        document.addEventListener('webkitfullscreenchange', fullscreenHandler, false);
        document.addEventListener('mozfullscreenchange', fullscreenHandler, false);
        document.addEventListener('fullscreenchange', fullscreenHandler, false);
        document.addEventListener('MSFullscreenChange', fullscreenHandler, false);
    }

    function fullscreenHandler() {
        if (document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement !== null) {
            $('.ol-full-screen-true').attr('title', 'Close Full Screen Mode');
            $('.ol-full-screen-true').html('<img src="' + fullscreenClosePath + '"/>');

            $('.ol-full-screen-false').attr('title', 'Enter Fullscreen Mode');
            $('.ol-full-screen-false').html('<img src="' + fullscreenPath + '"/>');
        }
    }
}

/*==============================================================*/
/*=  Map Supporting Functions:
/*==============================================================*/

function buildLegend(objLegItems, buoy_id) {

    $divLeg = $('<div class="map-legend"></div>');

    // Add items to legend:
    $.each(objLegItems, function (strTitle, imgFile) {
        $('<img src="' + imgFile + '" />').appendTo($divLeg);
        $('<span>' + strTitle + '</span>').appendTo($divLeg);
    });

    // Add legend as OL overlay:
    $divLeg.appendTo(
        $('.ol-overlaycontainer')
    );

    // Position legend:
    var w_leg = 0;

    if (buoy_id === '') {        // 3 items (map container width: 550px)
        w_leg = 260;
    } else {                    // 4 items (map container width: 400px)
        w_leg = 335;
    }

    var w_map = $('#map-container').width();
    var l_leg = (w_map - w_leg) / 2;

    $divLeg.width(w_leg);
    $divLeg.css('left', l_leg + 'px');
}

function centerToPoint(feat) {
    geom = feat.getGeometry();
    map.getView().setCenter(geom.getCoordinates());
}

function zoomToPoint(feat) {

    var geom = feat.getGeometry();
    var coord_pt = geom.getCoordinates();

    map.getView().setCenter(coord_pt);
    map.getView().setZoom(9);

    setTimeout(function () {
        displayPopup(feat, coord_pt);
    }, 500);

    return;
};

function displayPopup(feature, coordinate) {
    var $popContent = $('#popup-content');
    var $popCloser = $('#popup-closer');

    // Define popup content:
    var buoy_id = feature.get('id');
    var $anchorBuoy = $('<a href="#" class="nav-buoy" title="' + _strNavMsg + '">' + feature.get('longName') + ' (' + buoy_id + ')</a>');
    $anchorBuoy.attr('data-buoy', buoy_id);

    $popContent.html($anchorBuoy);

    // Set popup position:
    _olPopup.setPosition(coordinate);
}


function getCoords_WebMerc(lon, lat) {          // returns array of: [xcoord, ycoord]
    return ol.proj.transform([lon, lat], 'EPSG:4326', 'EPSG:3857');
}

function getMarkerType(f, buoy_id) {

    var mType = 'none';

    if (!f.get('wqOnly')) {
        if (buoy_id !== '' && f.get('id') === buoy_id) {
            mType = 'active';
        } else if (f.get('obs') && !f.get('offline')) {
            mType = 'online';
        } else if (f.get('obs') && f.get('offline')) {
            mType = 'offline';
        } else if (!f.get('obs')) {
            mType = 'recovered';
        }
    }
    return mType;
}

function getBuoyStyle(feature) {
    var markerType = feature.get('markerType');
    return _objMarkers[markerType].style;
}

function setBuoyStyles() {

    _objMarkers = {
        'active': { imgFile: 'ActiveBuoyIcon.png', zIndex: 4 },
        'online': { imgFile: 'BuoyOnlineIcon.png', zIndex: 3 },
        'offline': { imgFile: 'OldDataBuoyIcon.png', zIndex: 2 },
        'recovered': { imgFile: 'RecoveredBuoyIcon.png', zIndex: 1 }
    }

    $.each(_objMarkers, function (markerType, objMark) {
        var opacity = 1.0;
        if (markerType === 'offline' || markerType === 'recovered') {
            opacity = 0.5;
        }

        objMark.style = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1.0],
                src: prePath + 'img/' + objMark.imgFile,
                opacity: opacity
            }),
            zIndex: objMark.zIndex
        })
    });

    // Add transparent style:
    _objMarkers['none'] = {};
    _objMarkers['none'].style = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'transparent'
        }),

        fill: new ol.style.Fill({
            color: 'transparent'
        })
    });
}


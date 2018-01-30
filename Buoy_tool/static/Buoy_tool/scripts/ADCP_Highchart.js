function ADCPfig(stationID) {

	/*
	var data_file = "http://34.211.180.62/BuoyALP/buoydata_"+units+"/"+stationID+"";
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
        if (http_request.readyState == 4) {
            
    
            //Javascript function JSON.parse to parse JSON data**/

    $.getJSON('../static/app/json/45026_adcp.json', function (jsonObj) {
        var Dates = [];
        var Data = [];
        var Depth = [];

        // jsonObj variable now contains the data structure and can
        // be accessed as jsonObj.name and jsonObj.country.

        //Find out which strings have values and only save those depths and associated values.
        //for (h = 0; h < jsonObj.thermistorDepths.length; h++){
        //	if (!isNaN(jsonObj.thermistorValues[h][0])){
        //		Depth.push(Math.round(jsonObj.thermistorDepths[h]));
        //		Data.push(jsonObj.thermistorValues[h]);
        //	}
        //}
        $.each(jsonObj, function (key, value) {
            if (key == "obsDates") {
                Dates.push(value);
            }
        });

        var series = [];
        var valueFixed = [];
        var h = 0;
        var seriesLen = Dates[0].length;
        var depthCount = jsonObj.ADCP_Depths.length

        //Go through each depth for each date. Invert the depth assignment since UV001, VV001 would actually be bottom depth. 
        for (j = 0; j < Dates[0].length; j++) {
            for (i = 0; i < depthCount; i++) {
                if (i == 0 && j == 0) {
                    series[h] = [Date.parse(Dates[0][j]), jsonObj.ADCP_Depths[depthCount - 1], jsonObj.ADCP_Speed[j].toFixed(1), jsonObj.ADCP_Dir[j].toFixed(1)];
                    h += 1;
                }
                else if (j == 0) {
                    series[h] = [Date.parse(Dates[0][j]), jsonObj.ADCP_Depths[depthCount - i - 1], jsonObj.ADCP_Speed[i * seriesLen].toFixed(1), jsonObj.ADCP_Dir[i * seriesLen].toFixed(1)];
                    h += 1;
                }
                else if (i == 0) {
                    series[h] = [Date.parse(Dates[0][j]), jsonObj.ADCP_Depths[depthCount - 1], jsonObj.ADCP_Speed[(j)].toFixed(1), jsonObj.ADCP_Dir[j].toFixed(1)];
                    h += 1;
                }
                else {
                    series[h] = [Date.parse(Dates[0][j]), jsonObj.ADCP_Depths[depthCount - i - 1], jsonObj.ADCP_Speed[(i * seriesLen) + j].toFixed(1), jsonObj.ADCP_Dir[(i * seriesLen) + j].toFixed(1)];
                    h += 1;
                }
            }
        }

        ADCP_Highchart(series, Dates[0], jsonObj.ADCP_Depths)
    });

						
        //}
    //}
    
    //http_request.open("Get", data_file, true)
    //http_request.send()
}


function ADCP_Highchart(data, DateString, depths) {
    console.log(data);
    //console.log(DateString);
    //console.log(depths);
    var maxSpeed = String.valueOf(Math.max(data[2]));
    var minSpeed = String.valueOf(Math.min(data[2]));

    /**
    var H = Highcharts;
    H.seriesTypes['vector'].prototype.drawLegendSymbol = function (legend, item) {
        var options = legend.options,
            symbolHeight = legend.symbolHeight,
            square = options.squareSymbol,
            symbolWidth = square ? symbolHeight : legend.symbolWidth,
            path = this.arrow.call({
                lengthMax: 1,
                options: {
                    vectorLength: Math.abs(item.options.vectorLength)
                }
            }, {
                    length: 1
                });
        item.legendLine = this.chart.renderer.path(path)
            .addClass('highcharts-point')
            .attr({
                zIndex: 3,
                translateY: symbolWidth / 2,
                rotation: 270,
                'stroke-width': 1,
                'stroke': 'black'
            }).add(item.legendGroup);
    }**/

    var options = {

        chart: {
            renderTo: 'ADCP_Chart',
            type: 'vector',
            zoomType: 'x'
        },
				
        title: {
            text: 'Current Speed and Direction',
            style: { display: 'none'}
        },

        credits: {
            enabled: false
        },

        xAxis: {
            type: 'datetime',
            offset: 0,
            padding: 0,
            tickWidth: 1,
            //categories: DateString,
            labels: {
                formatter: function () {
					//return this.value
                    return Highcharts.dateFormat('%m/%d %H:%M', this.value);
                }
            },
            pointStart: Highcharts.dateFormat('%m/%d %H:%M', data[0][0]),
            tickInterval: 6 * 3600 * 1000,
        },
        yAxis: {
            //categories: depths,
            name: 'water depth ('+depthUnits+')',
            endOnTick: false,
            gridLineWidth: 1,
            offset: 0,
            reversed: true,
            title: {
                text: 'Water Depth ('+depthUnits+')'
            },
            labels: {
                formatter: function () {
				    return this.value
                }
            },
            min: depths[0],
            max: depths[depths.length - 1] + depths[0]
        },

        tooltip: {
            formatter: function () {
                var date = Highcharts.dateFormat('%m\\%d\\%y %H:%M', (this.point.x));
                var Depth = this.point.y.toFixed(1);
                try {
                    return 'Date: <b>' + date + '</b><br />Depth: <b>' + Depth + ' ' + depthUnits + '</b><br />Speed: <b>' + this.point.length + ' ' + speedUnits + '</b><br />Direction: <b>' + this.point.direction + '°</b>';
								} catch (err) {
                    return 'Date: <b>' + date + '</b><br />Depth: <b>' + Depth + ' ' + depthUnits + '</b><br />Speed: <b>NA</b><br />Direction: <b>NA';
								}
            }
        },

        series: [{
            name: 'Current speed and direction',
            color: Highcharts.getOptions().colors[1],
            data: data,
            showInLegend: true,
            vectorLength: -10,
            //tooltip: {
            //    pointFormat: 'Date: <b>{point.x}</b> <br />Depth: <b>{point.y}</b> <br />Speed: <b>{point.length}</b><br />Direction: <b>{point.direction}°</b>'
            //}
        }],
    };

	//options2.title.text = ('Water Temperature Profile');	
  var chart = new Highcharts.Chart(options);
}
function PastTempGrab(variableName,stationID) {
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
						var Dates = [];
						var Data = [];
						var Depths = [];
            // Javascript function JSON.parse to parse JSON data
            var jsonObj = JSON.parse(http_request.responseText);
						var tempNode = parseInt(variableName.slice(-2))
						var Depth = jsonObj.thermistorDepths[tempNode]; //Subtract one since array starts at 0
						
						//Determine what temperature node is being asked for and then start extracting data in large array at that node for the entire timeseries
						$.each(jsonObj, function (key, value) {
							if (key == "obsDates") {
                Dates.push(value);
							}
							if (key == "thermistorValues") {
                Data.push(value[tempNode]);
							}
						});
						Data[0].reverse(); 	//Place data in ascending order W.R.T dates for highcharts
						Dates[0].reverse();	//Place dates in ascending order
						PastTempNodeGraphic(Dates[0], Data[0], Depth);
        }
    }
    http_request.open("Get", data_file, true)
    http_request.send()
}

function PastTempNodeGraphic(DateTime, Data, Depth) {
    var options = {

        chart: {
            renderTo: 'container',
            type: 'series',
            alignTicks: false
        },

        title: {
            text: 'Water Temperature at ' + Depth.toFixed(0) + ' '+depthUnitsLng+''
        },
				
				legend: {
					enable: true
				},
				
        credits: {
            enabled: false
        },

        xAxis: {
            type: 'datetime',
            title: 'Date and Time',
            labels: {
                formatter: function () {
                    return Highcharts.dateFormat('%m/%d %H:%M', this.value);
                }
            },
            //tickInterval: 24 * 3600 * 1000 * 7,

        },
        yAxis: {
            title: {
							text: tempUnits
            },
        },
				tooltip: {
					valueDecimals: 1,
					xDateFormat: '%a %b, %e %Y %I:%M %p',
				},
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, Highcharts.getOptions().colors[0]],
                        [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                    ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },

        series: []

    };

    var buoyData = {
        name: 'Temperature',
        data: [],
				//pointStart: Date.parse(DateTime[0]),
        type: 'area', //'line'
        connectNulls: true,
				showInLegend: false,
				marker: {
                enabled: false
            },
        //tooltip: {
        //    valueSuffix: ' knots'
        //},
        lineWidth: 1,
        states: {
            hover: {
                lineWidth: 2
            }
        }
    };
    var i = -1;
    while (DateTime[++i]) {
        buoyData.data.push([Date.parse(DateTime[i]), Data[i]]); 
		}
		options.series.push(buoyData);
    
		var chart = new Highcharts.Chart(options);
}
function PastTempGrab(variableName,stationID) {

    $.getJSON('../static/Buoy_tool/data/' + ID + '_' + units + '_data.json', function (jsonObj) {
        var Dates = [];
        var Data = [];
        var Depths = [];
        var IDlongName = jsonObj.longName;
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
        PastTempNodeGraphic(Dates[0], Data[0], Depth, stationID, IDlongName);
    });

}

function PastTempNodeGraphic(DateTime, Data, Depth, stationID, IDlongName) {

    /**if (Highcharts.getOptions().exporting) {
        Highcharts.getOptions().exporting.buttons.contextButton.menuItems.pop();
    }

    var buttons = Highcharts.getOptions().exporting.buttons.contextButton.menuItems;
    buttons.push({
        text: "Buoy Alert",
        onclick: function () {
            document.getElementById("alertForm").style.display = "block";
            $("#parameters").val('Water Temp at ' + Depth.toFixed(0) + ' ' + depthUnits);
        }
    });**/

    var options = {

        chart: {
            renderTo: 'container',
            type: 'series',
            alignTicks: false,
            zoomType: 'x',
            spacing: [5, 1, 5, 0],
        },

        title: {
            text: 'Water Temperature at ' + Depth.toFixed(0) + ' feet'
        },
        subtitle: {
            text: IDlongName + ' (' + stationID + ')'
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
                text: 'Temperature '+ tempUnits+'',
                margin: 5,
            },
            labels: {
                format: '{value:.1f}',
                x: -5,
            },
            allowDecimals: false,
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
                threshold: null,
                animation: false
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
                enabled: true
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

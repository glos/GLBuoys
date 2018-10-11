function ForecastGrab(variableName,stationID, forUnits) {

    $.getJSON('../static/Buoy_tool/data/' + ID + '_' + units + '_data.json', function (jsonObj) {
        
        var ForecastDates = [];
        var ForecastData = [];
        var Depths = [];
        var IDlongName = jsonObj.longName;
        var longName;

        $.each(jsonObj.GLCFS, function (key, value) {
            if (key == "GlcfsDates") {
                ForecastDates.push(value);
            }
            if (key == variableName) {
                ForecastData.push(value);
            }
        });

        if (variableName === 'WVHGT') {
            longName = 'Wave Height';
        } else if (variableName === 'WDIR1') {
            longName = 'Wave Direction';
        } else if (variableName === 'DOMPD') {
            longName = 'Wave Period';
        } else if (variableName === 'IceFract') {
            longName = 'Ice Concentration';
        } else if (variableName === 'IceThick') {
            longName = 'Ice Thickness';
        }

        console.log(jsonObj);
        //var variableIndex = jsonObj.obsID.indexOf(variableName);
        //var longName = jsonObj.obsLongName[variableIndex];
        //var units = jsonObj.obsUnits[variableIndex];

        if (longName == 'Wave Direction') {
            ForecastPolar(longName, forUnits, ForecastDates[0], ForecastData[0], stationID, IDlongName);
        } else {
            ForecastGraphic(ID, longName, forUnits, ForecastDates[0], ForecastData[0], stationID, IDlongName);
        }

    });
}

function ForecastGraphic(ID, longName, units, ForecastDateTime, ForecastData, stationID, IDlongName) {
    
    /**if (Highcharts.getOptions().exporting) {
        Highcharts.getOptions().exporting.buttons.contextButton.menuItems.pop();
    }
    
    var buttons = Highcharts.getOptions().exporting.buttons.contextButton.menuItems;
    buttons.push({
        text: "Buoy Alert",
        onclick: function () {
            document.getElementById("alertForm").style.display = "block";
            $("#parameters").val(longName);
        }
    });**/
    
    dataMin = Math.min(...ForecastData);  //Determine minimum of data array


    var options = {

        chart: {
            renderTo: 'container',
            type: 'series',
            alignTicks: false,
            zoomType: 'x',
            spacing: [5,1,5,0]
        },

        title: {
            text: 'Forecasted ' + longName 
        },
        subtitle: {
            text: IDlongName + ' (' + stationID + ')' 
        },

				legend: {
					enable: true,
					//y: -35		//Uncomment if adding label under chart
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
                text: units,
                margin: 5,
            },
            labels: {
                format: '{value:.1f}',
                x: -5,
            },
            floor: dataMin,
        },

				tooltip: {
					valueDecimals: 1,
					xDateFormat: '%a %b, %e %Y %I:%M %p',
				},
				
        plotOptions: {
            series: {
                marker: {
                    enabled: true
                }
            },
            area: {
                marker: {
                    radius: 1.5,
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

		var GLCFSData = {
				name: longName,
        data: [],
				visible: true,
				showInLegend: true,
				//pointStart: Date.parse(ForecastDateTime[0]),
        type: 'area',
				fillOpacity: 0.2,
				zIndex: 1,
        connectNulls: true,
				color: '#FF0000',
        lineWidth: 1,
        states: {
            hover: {
                lineWidth: 2
            }
        }
		};
		
		var addFooter = {
			chart: {
        renderTo: 'container',
        type: 'series',
        alignTicks: false,
				events:{
					load: function () {
                var label = this.renderer.label("Forecasts are created by NOAA’s Great Lakes Environmental Research Laboratory Great Lakes Coastal Forecasting model.")
                .css({
                    fontSize: '9px',
										width: '325%',
                })
                .attr({
                    'stroke': 'silver',
                    'stroke-width': 1,
                    'r': 2,
                    'padding': 5,
                })
                .add();
                label.align(Highcharts.extend(label.getBBox(), {
                    align: 'center',
                    x: 0, // offset
                    verticalAlign: 'bottom',
                    y: 0 // offset
                }), null, 'spacingBox');
                
            }
				},
				marginBottom: 100
			}
		};
    var i = -1;

	if (ForecastData){
		var j = -1;
		while (ForecastDateTime[++j]) {
			GLCFSData.data.push([Date.parse(ForecastDateTime[j]), ForecastData[j]]);
		}
		options.series.push(GLCFSData);
		//options.chart = addFooter.chart;
		$("#id01_a").append('<div id="forecastFooter" class="w3-panel w3-center" style="padding-top:8px"><p style="font-size:10px;"></p></div>');
		$("#forecastFooter p").append("Forecasts are created by NOAA’s <a href='https://www.glerl.noaa.gov/' target='_blank'> Great Lakes Environmental Research Laboratory</a>'s <a href='https://www.glerl.noaa.gov/res/glcfs/' target='_blank'> Great Lakes Coastal Forecasting System</a> model.");
       }

    var chart = new Highcharts.Chart(options);
}

//Function to plot directional parameters


function ForecastPolar(longName, units, DateTime, Data, stationID, IDlongName) {

    if (Highcharts.getOptions().exporting) {
        Highcharts.getOptions().exporting.buttons.contextButton.menuItems.pop();
    }

    var buttons = Highcharts.getOptions().exporting.buttons.contextButton.menuItems;
    buttons.push({
        text: "Buoy Alert",
        onclick: function () {
            document.getElementById("alertForm").style.display = "block";
            $("#parameters").val(longName);
        }
    });

    var options = {

        chart: {
          renderTo: 'container',
          polar: true,
          spacing: [5, 1, 5, 0],
        },
				
				title: {
                    text: 'Forecasted ' + longName + '  (Next 48 hours)',
        },
                subtitle: {
                    text: IDlongName + ' (' + stationID + ')'
                },
				
				credits: {
            enabled: false
        },
				
				xAxis: {
					tickInterval: 30,
					min: 0,
					max: 360,
					labels: {
            formatter: function () {
                return this.value + '°';
            }
					}
				},
				tooltip: {
            formatter: function () {
                var date = Highcharts.dateFormat('%m\\%d\\%y %H:%M',(this.point.y));
                var windDir = this.point.x;//.toFixed(1);
                try {
									return 'Date: ' +  date + '<br> Wind Direciton: ' + windDir + '°';
								} catch (err) {
									return 'Date: ' +  date + '<br> Wind Direciton: ' + windDir + '°';
								}
            }
        },
				
				yAxis: {
            type: 'datetime',
            title: false,
            labels: {
                formatter: function () {
									if(this.isLast || this.isFirst)
                    return Highcharts.dateFormat('%m/%d %H:%M', this.value);
									else return null 
                },
            },
            tickInterval: 6 * 3600 * 1000, //Interval every 6 hours
        },
				plotOptions: {
					series: {
            pointStart: 0,
            pointInterval: 45
					},
					column: {
            pointPadding: 0,
            groupPadding: 0
					}
				},
				series: []
		};
		
		var buoyData = {
        name: longName,
				showInLegend: false,
				marker: {
					enabled: false
        },
        data: []
		}
		
		var len = DateTime.length-1;	//Determine length of array
		var d = new Date();
		d = d.getTime();
		pastDate = d-(1000*60*60*24); //Only display past 24 hours

		buoyData.data.push([null,null]);	//Assign first array as null so the first and last points will not connect
		while (Date.parse(DateTime[len--]) > pastDate) {
      buoyData.data.push([Data[len],Date.parse(DateTime[len])]); 
    }
		buoyData.data.push([null,null]); //Assign first array as null so the first and last points will not connect
		
		options.series.push(buoyData);
        $("#id01_a").append('<div id="forecastFooter" class="w3-panel w3-center" style="padding-top:8px"><p style="font-size:10px;"></p></div>');
        $("#forecastFooter p").append("Forecasts are created by NOAA’s <a href='https://www.glerl.noaa.gov/' target='_blank'> Great Lakes Environmental Research Laboratory</a>'s <a href='https://www.glerl.noaa.gov/res/glcfs/' target='_blank'> Great Lakes Coastal Forecasting System</a> model.");
		var chart = new Highcharts.Chart(options);
}

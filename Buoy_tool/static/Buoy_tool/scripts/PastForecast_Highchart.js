function PastForecastGrab(variableName,stationID) {

    $.getJSON('../static/Buoy_tool/data/' + ID + '_' + units + '_data.json', function (jsonObj) {
        
        var Dates = [];
        var ForecastDates = [];
        var Data = [];
        var ForecastData = [];
        var Depths = [];

        if (variableName !== 'CurSpd' && variableName !== 'CurDir') {

            // Javascript function JSON.parse to parse JSON data
            //var jsonObj = JSON.parse(http_request.responseText);

            $.each(jsonObj, function (key, value) {
                if (key == variableName) {
                    Data.push(value);
                }
                if (key == "obsDates") {
                    Dates.push(value);
                }
            });
            if (variableName === 'WVHT') {
                var variableName_GLCFS = 'WVHGT';
            }
            if (variableName === 'WPRD' || variableName === 'APD') {
                var variableName_GLCFS = 'DOMPD';
            }
            $.each(jsonObj.GLCFS, function (key, value) {
                if (key == variableName_GLCFS) {
                    ForecastData.push(value);
                }
                if (key == "GlcfsDates") {
                    ForecastDates.push(value);
                }
            });
            console.log(jsonObj);
            Data[0].reverse(); 	//Place data in ascending order W.R.T dates for highcharts
            Dates[0].reverse();	//Place dates in ascending order
            var variableIndex = jsonObj.obsID.indexOf(variableName);
            var longName = jsonObj.obsLongName[variableIndex];
            var units = jsonObj.obsUnits[variableIndex];
            if (variableName == 'PH') {
                units = 'PH';
            }
            if (variableName == 'WDIR' || variableName == 'MWD' || variableName == 'MWDIR') {
                PastForecastPolar(longName, units, Dates[0], Data[0]);
            } else {
                PastForecastGraphic(ID, longName, units, Dates[0], ForecastDates[0], Data[0], ForecastData[0]);
            }

        }else {

            jsonObj = jsonObj.ADCP
            dateLength = jsonObj.obsDates.length
            var i = 0    
            //Run if current speed
            if (variableName == 'CurSpd') {
                $.each(jsonObj, function (key, value) {
                    if (key == 'ADCP_Speed') {
                        Data.push(value);
                    }
                    if (key == "obsDates") {
                        Dates.push(value);
                    }
                    i++
                });

                Data[0].reverse(); 	//Place data in ascending order W.R.T dates for highcharts
                Dates[0].reverse();	//Place dates in ascending order
                var units = jsonObj.obsUnits[0];
                PastForecastGraphic(ID, 'Surface Current', units, Dates[0], ForecastDates[0], Data[0].slice(0, dateLength), ForecastData[0]);
            }
            //Run if current direction
            if (variableName == 'CurDir') {
                $.each(jsonObj, function (key, value) {
                    if (key == 'ADCP_Dir') {
                        Data.push(value);
                        console.log(value);
                    }
                    if (key == "obsDates") {
                        Dates.push(value);
                    }
                    console.log(i);
                    i++
                });

                Data[0].reverse(); 	//Place data in ascending order W.R.T dates for highcharts
                Dates[0].reverse();	//Place dates in ascending order
                var units = jsonObj.obsUnits[0];
                console.log('Current Direction', units, Dates[0], Data[0].slice(0, dateLength));
                PastForecastPolar('Current Direction', units, Dates[0], Data[0].slice(0, dateLength));
            }
        }
    });
}

function PastForecastGraphic(ID, longName, units, DateTime, ForecastDateTime, Data, ForecastData) {
    
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

    //dataMin = Math.min(...Data);  //Determine minimum of data array

    var options = {

        chart: {
            renderTo: 'container',
            type: 'series',
            alignTicks: false,
            zoomType: 'x',
            spacing: [5,1,5,0]
        },

        title: {
            text: longName 
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
            //floor: dataMin,
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

    var buoyData = {
        name: longName,
				showInLegend: false,
        data: [],
				//pointStart: Date.parse(DateTime[0]),
        type: 'area',
				fillOpacity: 0.5,
				zIndex: 2,
        connectNulls: false,
        lineWidth: 1,
        states: {
            hover: {
                lineWidth: 2
            }
        }
    };
		
		var GLCFSData = {
				name: 'Forecasted ' + longName,
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
    while (DateTime[++i]) {
        buoyData.data.push([Date.parse(DateTime[i]), Data[i]]); 
    }
		options.series.push(buoyData);
		if (ForecastData){
			var j = -1;
			while (ForecastDateTime[++j]) {
				GLCFSData.data.push([Date.parse(ForecastDateTime[j]), ForecastData[j]]);
			}
			buoyData.showInLegend = true;
			options.series.push(GLCFSData);
			//options.chart = addFooter.chart;
			$("#id01_a").append('<div id="forecastFooter" class="w3-panel w3-center" style="padding-top:8px"><p style="font-size:10px;"></p></div>');
			$("#forecastFooter p").append("Forecasts are created by NOAA’s <a href='https://www.glerl.noaa.gov/' target='_blank'> Great Lakes Environmental Research Laboratory</a>'s <a href='https://www.glerl.noaa.gov/res/glcfs/' target='_blank'> Great Lakes Coastal Forecasting System</a> model.");
        }

    var chart = new Highcharts.Chart(options);
}

//Function to plot directional parameters
function PastForecastPolar(longName, units, DateTime, Data) {

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
            text: longName + '  (Past 24 hours)',
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
		
		var chart = new Highcharts.Chart(options);
}
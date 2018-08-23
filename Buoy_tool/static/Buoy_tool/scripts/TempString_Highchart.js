function TempStringGrab(stationID) {

    var jsonObj = $.getJSON('../static/Buoy_tool/data/' + ID + '_' + units + '_data.json', function (jsonObj) {
        var Dates = [];
        var Data = [];
        var Depth = [];
        var IDlongName = jsonObj.longName;

        console.log(jsonObj);
        //Find out which strings have values and only save those depths and associated values.
        for (h = 0; h < jsonObj.thermistorDepths.length; h++) {
            if (jsonObj.thermistorValues[h][0]) {
                Depth.push(Math.round(jsonObj.thermistorDepths[h]));
                Data.push(jsonObj.thermistorValues[h]);
            }
        }
        $.each(jsonObj, function (key, value) {
            if (key == "obsDates") {
                Dates.push(value);
            }
        });

        //2 category axis: x and y. Then the index of x/y axis becomes the [x, y, value]. So, if your data starts on "2013-04-01" then it is your first index such that 
        //[ ["2013-04-01",0,-0.7], ["2013-04-02",0,-3.4], ["2013-04-03",0,-1.1] ] becomes: [ [0,0,-0.7], [1,0,-3.4], [2,0,-1.1] ]

        //////////////////////////////////////////////////////////////////////////
        //Read in data for interpolation graphs. Graphs don't use all data points/
        //////////////////////////////////////////////////////////////////////////
        var h = -1;
        var series = [];
        var valueFixed = [];
        if (screen.width > 800) {
            var timeStep = 3;
        } else {
            var timeStep = 6;
        }
        var timeStep;

        for (j = 0; j < Depth.length; j++) {
            var binTimeStep = 0;
            for (i = 0; i < Dates[0].length; i += timeStep) { //Only record every other temp for each depth
                /**Check if the value is an integer, if so fix value, if not pass the non-int value. 
                try {
                    valueFixed = ((Data[j][Data[j].length-[i+1]]));//.toFixed(1));
                } catch (err) {
                    valueFixed = Data[j][Data[j].length-[i+1]];
                }
                **/
                series[h + 1] = [binTimeStep, j, Data[j][Data[j].length - [i + 1]]];      //Increase bin step with binTimeStep since can't use i because of increment by 2
                h += 1;
                binTimeStep += 1;
            }
        }

        //Convert string date and time to unix 
        var i = -1;
        var DateTime = [];
        var DateString = [];
        while (Dates[0][i += timeStep]) {  //Only read in every other date corresponding to every over temperature
            DateTime.push(Date.parse(Dates[0][i]));
            DateString.push(moment(Dates[0][i]).format('M/D HH:mm'));
        }
        DateString.reverse();
        DateTime.reverse();
        TempStringHeatMap(Depth, DateString, DateTime, series, stationID, IDlongName);

        //////////////////////////////////////////////////////////////////////////
        //Read in data for line graphs. Graphs  use all data points             //
        //////////////////////////////////////////////////////////////////////////
        var h = -1;
        var seriesLine = [];

        for (j = 0; j < Depth.length; j++) {
            for (i = 0; i < Dates[0].length; i++) {
                seriesLine[h + 1] = [i, j, Data[j][Data[j].length - [i + 1]]];	//Read in values in reverse order
                h += 1;
            }
        }

        //Convert string date and time to unix 
        var i = -1;
        var DateTimeLine = [];
        var DateStringLine = [];
        while (Dates[0][++i]) {
            DateTimeLine.push(Date.parse(Dates[0][i]));
            DateStringLine.push(moment(Dates[0][i]).format('M/D HH:mm'));
        }
        DateStringLine.reverse();
        DateTimeLine.reverse();
        TempStringLineChart(Depth, DateStringLine, DateTimeLine, seriesLine, stationID, IDlongName);
    });

}

function TempStringHeatMap(Depths, DateString, DateTime, TStringdata, stationID, IDlongName) {

    /**Only display interpolated graph on non-phone devices.
    if (screen.width > 800) {
        var chartType = 'contour';
        var exporting = false;
    } else {
        var chartType = 'heatmap';
        var exporting = true;
    } **/

    var options2 = {

        chart: {
            renderTo: 'TempStringHighMap',
            type: 'contour',
            spacing: [7, 0, 0, 0]
        },
				
        exporting: {
            enabled: false,
			//url: 'http://export.highcharts.com/'
            chartOptions: {
                title: {
                    text: IDlongName + '('+ stationID + ') - Water Temperature'
                }
            }
		},
				
        legend: {
			align: 'center', 
            margin: 0,
            itemLarginTop: 0,
            itemMarginBottom: 0,
            padding: 4
        },

        title: {
            text: null
        },

        navigation: {
            buttonOptions: {
                verticalAlign: 'top',
                y: -10,
                symbolSize: 15,
            }
        },

        boost: {
            useGPUTranslations: true
        },

        credits: {
            enabled: false
        },

        xAxis: {
            type: 'datetime',
            offset: 0,
            padding: 0,
            tickWidth: 4,
            categories: DateString,
            labels: {
                formatter: function () {
										return this.value
                    //return Highcharts.dateFormat('%m/%d %H:%M', this.value);
                }
            },
            tickInterval: (DateString.length)/10,
        },
        yAxis: {
            lineWidth: 0,
            minorGridLineWidth: 0,
            gridLineColor: 'transparent',
            categories: Depths,
            name: 'water depth (' + depthUnits + ')',
			endOnTick: false,
            offset: 0,
            reversed: true,
            title: {
                text: 'Water Depth (' + depthUnits + ')',
                margin: 5,
            },
            labels: {
                formatter: function () {
				    return this.value
				    //var feet = this.value;
                    //return feet.toFixed(0);
                },
                x: -5,
            },
        },
				
        tooltip: {
					valueDecimals: 1,
					xDateFormat: '%a %b, %e %Y %I:%M %p',
				},
				
        colorAxis: {
            stops: [
                [0, '#004cff'],
                [0.5, '#fced00'],
                [0.9, '#f91500'],
                [1, '#f91500']
            ],
            step: 1,
            startOnTick: true,
            endOnTick: true,
            labels: {
                format: '{value} '+tempUnits+''
            }
        },

        tooltip: {
            formatter: function () {
                var date = this.series.xAxis.categories[this.point.x]; //Highcharts.dateFormat('%m\\%d\\%y %H:%M',(this.series.xAxis.categories[this.point.x]));
                var DepthFt = ((this.series.yAxis.categories[this.point.y]));//.toFixed(1);
                try {
									return 'Date: ' +  date + '<br> Depth: ' + DepthFt + ' '+depthUnits+'<br> Water Temp: ' + this.point.value.toFixed(1) + ' '+tempUnits+'';
								} catch (err) {
									return 'Date: ' +  date + '<br> Depth: ' + DepthFt + ' '+depthUnits+'<br> Water Temp: NA';
								}
            }
        },
        //plotOptions: {
        //    series: {
        //        boostThreshold: TStringdata.length
        //    }
        //},
        
        series: [{
            name: '',
            data: TStringdata,
            turboThreshold: 0,    //Disable 
        }],
    };
	
    //Enable to create static image from highchart server
    /**
    var obj = {};
    exportUrl = options2.exporting.url;
    obj.options = JSON.stringify(options2);
    obj.type = 'image/png';
    obj.async = true;
	obj.constr = 'Chart';

	$.ajax({
        type: 'post',
        url: exportUrl,
        data: obj,
        success: function (data) {
            $('#ThermistorHeat img').attr('src', exportUrl + data);
        }
    });**/

	//options2.title.text = ('Water Temperature Profile');	Enable if using static image

  var chart2 = new Highcharts.Chart(options2);
}


function TempStringLineChart(Depths, DateString, DateTime, TStringdata, stationID, IDlongName) {

    $('button#showAll').click(function () {
        dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'graph', 'glbuoysLabel': 'temp_string_lines', 'glbuoysAction': 'showAll' });
        for (i = 0; i < chart3.series.length; i++) {
            chart3.series[i].show();
        }
    });
    $('button#hideAll').click(function () {
        dataLayer.push({ 'event': 'glbuoysEvent', 'glbuoysCategory': 'graph', 'glbuoysLabel': 'temp_string_lines', 'glbuoysAction': 'hideAll' });
        for (i = 0; i < chart3.series.length; i++) {
            chart3.series[i].hide();
        }
    });

    var options3 = {

        chart: {
            renderTo: 'TempStringLineChart',
            type: 'series',
            alignTicks: false,
            spacing: [7, 0, 0, 0]
        },

        title: {
            text: null
        },
				
				legend: {
					enable: true,
				},
				
        credits: {
            enabled: false
                },

        exporting: {
            enabled: true,
            //url: 'http://export.highcharts.com/'
            chartOptions: {
                title: {
                    text: 'Water Temperature'
                },
                subtitle: {
                    text: IDlongName + ' (' + stationID + ')'
                }
            }
        },

        legend: {
            align: 'center', 
            marginBottom: 0,
            itemMarginBottom: 0,
            padding: 0
        },
        xAxis: {
            type: 'datetime',
            title: 'Date and Time',
            labels: {
                formatter: function () {
                    return Highcharts.dateFormat('%m/%d', this.value);
                }
            },
        },
				
        yAxis: {
            title: {
                text: 'Temperature ' + tempUnits + '',
                margin: 3,
            },
            floor: 0,
            offset: 0,
            labels: {
                format: '{value:.1f}',
                x: -5,
            }
        },

				
				tooltip: {
					valueDecimals: 1,
					xDateFormat: '%a %b, %e %Y %I:%M %p',
				},
				
        plotOptions: {
            series: {
							marker: {
								enabled: false
							}
						},
						area: {
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
	
	var count = 0;
	var tempData = [];
	var buoyData = [];
	var showInitial;
	
	//Extract each temp node and push each node to highchart
	for(i=0; i<Depths.length; i++){
		for(j=0; j<DateTime.length; j++){
			tempData[j] = [DateTime[j],parseFloat(TStringdata[count][2])];
			count++;
		}
		//Only show top and bottom temp node
		if(i==0 || i == Depths.length-1){
			showInitial = true;
		}else{
			showInitial = false;
		}
    buoyData[i] = {
        name: 'Temp @ ' + Depths[i] + ' '+depthUnits+'',
				showInLegend: true,
        data: tempData,
        type: 'line',
        connectNulls: true,
				visible: showInitial, 
				marker: {
                enabled: false
            },
        lineWidth: 1,
        states: {
            hover: {
                lineWidth: 2
            }
        }
    }; 
		options3.series.push(buoyData[i]);
		tempData = [];
	}
  var chart3 = new Highcharts.Chart(options3);  
}	

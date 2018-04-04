function TempStringGrab(stationID) {

    var jsonObj = $.getJSON('../static/Buoy_tool/data/' + ID + '_' + units + '_data.json', function (jsonObj) {
        var Dates = [];
        var Data = [];
        var Depth = [];

        console.log(jsonObj);
        //Find out which strings have values and only save those depths and associated values.
        for (h = 0; h < jsonObj.thermistorDepths.length; h++) {
            if (!isNaN(jsonObj.thermistorValues[h][0])) {
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
        var h = -1;
        var g = -1;
        var series = [];
        /**for (j = 0; j < Depth.length; j++) {
            for (i = 0; i < Dates.length; i++) {
                series[h + 1] = [i, j, Data[g + 1]];
                h += 1;
                g += 1;
            }
        }
                    **/
        var valueFixed = [];
        for (j = 0; j < Depth.length; j++) {
            for (i = 0; i < Dates[0].length; i++) {
                /**Check if the value is an integer, if so fix value, if not pass the non-int value. 
                try {
                    valueFixed = ((Data[j][Data[j].length-[i+1]]));//.toFixed(1));
                } catch (err) {
                    valueFixed = Data[j][Data[j].length-[i+1]];
                }
                **/
                series[h + 1] = [i, j, Data[j][Data[j].length - [i + 1]]];	//Read in values in reverse order
                h += 1;
            }
        }
        //Convert string date and time to unix 
        var i = -1;
        var DateTime = [];
        var DateString = [];
        while (Dates[0][++i]) {
            DateTime.push(Date.parse(Dates[0][i]));
            DateString.push(moment(Dates[0][i]).format('M/D HH:mm'));
        }
        DateString.reverse();
        DateTime.reverse();
        TempStringHeatMap(Depth, DateString, DateTime, series);
        TempStringLineChart(Depth, DateString, DateTime, series);

    });

}

function TempStringHeatMap(Depths, DateString, DateTime, TStringdata) {
	
    var options2 = {

        chart: {
            renderTo: 'TempStringHighMap',
            type: 'heatmap',
            //type: 'contour',
            //spacing: [0,5,0,5]
        },
				
        exporting: {
					enabled: false,
					url: 'http://export.highcharts.com/'
				},
				
        legend: {
						align: 'left',
            //verticalAlign: 'bottom',
						//enabled: true,
            margin: 0,
            itemLarginTop: 0,
            itemMarginBottom: 0,
            padding: 4
        },

        title: {
            text: null
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
            categories: Depths,
            name: 'water depth ('+depthUnits+')',
						endOnTick: false,
            offset: 0,
            reversed: true,
            title: {
                text: 'Water Depth ('+depthUnits+')'
            },
            labels: {
                formatter: function () {
										return this.value
										//var feet = this.value;
                    //return feet.toFixed(0);
                }
            },
        },
				
        tooltip: {
					valueDecimals: 1,
					xDateFormat: '%a %b, %e %Y %I:%M %p',
				},
				
        colorAxis: {
            stops: [
                [0, '#3060cf'],
                [0.5, '#fffbbc'],
                [0.9, '#c4463a'],
                [1, '#c4463a']
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
						$('#Thermistor img').attr('src', exportUrl + data);
        }
    });

	options2.title.text = ('Water Temperature Profile');	
  var chart2 = new Highcharts.Chart(options2);
}

function TempStringLineChart(Depths, DateString, DateTime, TStringdata) {
    var options3 = {

        chart: {
            renderTo: 'TempStringLineChart',
            type: 'series',
            alignTicks: false,
        },

        title: {
            text: false
        },
				
				legend: {
					enable: true,
				},
				
        credits: {
            enabled: false
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
							text: 'Temperature '+tempUnits+''
            },
						floor: 0
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
  var chart2 = new Highcharts.Chart(options3);  
}	

$(document).ready(function() {
			
			var options = {
				chart: {
					renderTo: 'container',
					type: 'series',
					alignTicks: false
				},
            	
				title: {
					text: 'Microcystin vs. BGA'
				},
				
				legend: {
					enabled: true
				},
				
				exporting: {
					enabled: true,
					contextButton: {
						menuItems: [{
							textKey: 'downloadPNG',
							onclick: function () {
								this.exportChart();
							}
						}, {
							textKey: 'downloadJPEG',
							onclick: function () {
								this.exportChart({
									type: 'image/jpeg'
								});
							}
						}, {
							text: Highcharts.getOptions().lang.downloadCSV || "Download CSV",
							onclick: function () {
								Highcharts.post('http://www.highcharts.com/studies/csv-export/csv.php', {
									csv: this.getCSV()
								});
							}
						}]
					},
					csv: {
						itemDelimiter: ','
					}
				},
				
				navigator: {
					series: {
						includeInCSVExport: false,
						type: 'line',
						lineWidth: 0,
						marker: {
							enabled: true
						}
					}
				},
				rangeSelector: {
					selected: 0,
					buttons: [{
						type: 'all',
						text: 'All'
					},{
						type: 'day',
						count: 1,
						text: 'Day'
					},{
						type:'week',
						count: 1,
						text:'Week'
					},{
						type: 'month',
						count: 1,
						text: 'Month'
					}, {
						type: 'month',
						count: 6,
						text: '6-Month'
					}, {
						type: 'year',
						count: 1,
						text: 'Year'
					}],
					buttonTheme: {
						width: 60
					}
				},
				credits: {
        			enabled: false
        		},
				
				xAxis: {
					type: 'datetime',
					title: 'Date', 
            		labels: {
            			formatter: function() {
            				return Highcharts.dateFormat('%m\\%e\\%Y', this.value);
            			}
            		},
                	//tickInterval: 24 * 3600 * 1000 * 7,
                	//min: [],
                	//max: [],
				},
				
				yAxis: [{
					title: {
						text: 'BGA (Unitless)'
					},
					min: 0,
					//max: 100,
					opposite: true
					//ceiling: 100,
					//floor: 0,
					//tickInterval: 10
				}, {
					title: {
						text: 'Microcystin (ug/L)'
					},
					min: 0,
					//max: 10,
					gridLineWidth: 0,
					//ceiling: 4,
					//floor: 0,
					opposite: false,		
				}],
				series: []
			};

	$.get('46165_VZN_YSITable.csv', function(data1) {
		
		$.get('CityofToledo.csv', function(data2) {	
		
			$.get('Crib VZN_YSITable.csv', function(data3) {	
			
				$.get('Low Service_YSITable.csv', function(data4) {		
					
				// Split the lines
				var lines = data1.split('\n');
				var lines2 = data2.split('\n');
				var lines3 = data3.split('\n');
				var lines4 = data4.split('\n');
				//document.write(lines2.length);

				var buoyRFU = {
					name: '45165 BGArfu',
					data: [],
					type: 'line',
					dataGrouping: {
						enabled: true
					},
					connectNulls: true,
					tooltip: { valueSuffix: ' Unitless'
					},
					visible: false,
					lineWidth: 1,
					states: {
                    	hover: {
                        	lineWidth: 2
                    	}
                	},
				};
				
				var CribRFU = {
					name: 'Crib BGArfu',
					data: [],
					dataGrouping: {
						enabled: true
					},
					type: 'line',
					connectNulls: true,
					tooltip: { valueSuffix: ' Unitless'
					},
					visible: false,
					lineWidth: 1,
					states: {
                    	hover: {
                        	lineWidth: 2
                    	}
                	},
				};
				
				var LSPRFU = {
					name: 'Low Service Pump BGArfu',
					data: [],
					dataGrouping: {
						enabled: true,
					},
					type: 'line',
					connectNulls: true,
					tooltip: { valueSuffix: ' Unitless'
					},
					visible: false,
					showCheckbox: false,
					lineWidth: 1,
					states: {
                    	hover: {
                        	lineWidth: 2
                    	}
                	},
				};
				
				seriesMicro = {
					name: 'Microcystin',
					data: [],
					dataGrouping: {
						enabled: true,
					},
					tooltip: { 
						valueSuffix: ' ug/L',						
					},
					showCheckbox: false,
					yAxis: 1,
					type: 'line',
					states: {
                    	hover: {
                        	lineWidth: 0,
                        	lineWidthPlus: 0
                    	}
                	},
					lineWidth: 0,
					visible: true,
					connectNulls: true,
					marker: {
						enabled: true,
						states: {
                        	hover: {
                            	enabled: false
                        	}
                    	}
					}	
				};
				
				//Iterate over the lines and add Microcystin series
				$.each(lines2, function(lineNo, line) {
					var items = line.split(',');			
					
					//No Header Line
					//Parse first line, retrieve date and push to min x axis
					if (lineNo ==0) {
						tokens = items[0].split('/');
						yyyy = parseInt(tokens[2]);
						mm = parseInt(tokens[0]-1);
						dd = parseInt(tokens[1]);
						formatDate = Date.UTC(yyyy, mm ,dd);
						//options.xAxis.min.push(formatDate);
						micro = parseFloat(items[1], 10);
					}
					
					//If last line, 
					else if (lineNo == lines2.length-2) { //Length of lines2 is increased by one because being the second get statement
						tokens = items[0].split('/');
						yyyy = parseInt(tokens[2]);
						mm = parseInt(tokens[0]-1);
						dd = parseInt(tokens[1]);
						formatDate = Date.UTC(yyyy, mm, dd);
						//options.xAxis.max.push(formatDate);
						micro = parseFloat(items[1], 10);
					}
					
					else {
						tokens = items[0].split('/');
						yyyy = parseInt(tokens[2]);
						mm = parseInt(tokens[0]-1);
						dd = parseInt(tokens[1]);
						formatDate = Date.UTC(yyyy, mm ,dd);
						micro = parseFloat(items[1], 10);
					}
					//Push extracted data to seriesMicro array 
					seriesMicro.data.push([formatDate, micro]);
					 
				 });
				
				//Iterate over the lines and add categories or series
				$.each(lines, function(lineNo, line) {
					var items = line.split(',');			
					
					//No Header Line
					if (lineNo >=0)  {
						//var momentDate = parseFloat(items[0]),
						if (moment(items[0]).isValid()) {
						  var momentDate = moment(items[0], "MM/DD/YY HH:mm:ss");
						  rfu = parseFloat(items[1], 10);
						}
						buoyRFU.data.push([momentDate, rfu]);
					 }
				 });
				 
				 //Iterate over the lines and add categories or series
				$.each(lines3, function(lineNo, line) {
					var items = line.split(',');			
					
					//No Header Line
					if (lineNo >=0)  {
						//var momentDate = parseFloat(items[0]),
						if (moment(items[0]).isValid()) {
						  var momentDate = moment(items[0], "MM/DD/YY HH:mm:ss");
						  rfu = parseFloat(items[1], 10);
						}
						CribRFU.data.push([momentDate, rfu]);
					 }
				 });
				 
				//Iterate over the lines and add categories or series
				$.each(lines4, function(lineNo, line) {
					var items = line.split(',');			
					
					//No Header Line
					if (lineNo >=0)  {
						//var momentDate = parseFloat(items[0]),
						if (moment(items[0]).isValid()) {
						  var momentDate = moment(items[0], "MM/DD/YY HH:mm:ss");
						  rfu = parseFloat(items[1], 10);
						}
						LSPRFU.data.push([momentDate, rfu]);
					 }
				 });
				
				//Plot to first show when loaded
				options.series.push(seriesMicro);
				options.series.push(LSPRFU);
				options.series.push(CribRFU);
				options.series.push(buoyRFU);
				var chart = new Highcharts.StockChart(options);
				
				/*chartfunc = function()
				{
					//var chart = $('#container').highcharts();
					//while(chart.length > 0) {
					//	chart[0].remove();
					//}
					chart.destroy();
					
					var micro = document.getElementById('Microcystin');
					var buoy = document.getElementById('buoyrfu');
					var crib = document.getElementById('cribrfu');
					var lsps = document.getElementById('lspsrfu');
					
					//if(micro.checked===false) {
					//	options.series.remove(seriesMicro);
					//	document.write(1);
					//}
					
					if(micro.checked){
							options.series.push(seriesMicro);
					}
						
					if(buoy.checked){
							options.series.push(buoyRFU);
					}	
						
					if(lsps.checked){
							options.series.push(LSPRFU);
					}
						
					if(crib.checked){
							options.series.push(CribRFU);
					}
					
						
				//Push variables to the chart series
				//options.series.push(buoyRFU);
				//options.series.push(CribRFU);
				//options.series.push(LSPRFU);
				//options.series.push(seriesMicro);
					
					var chart = new Highcharts.Chart(options);
					
				}*/
				
			});
							
		});
		
	});												
				
});

});
		

        		
        
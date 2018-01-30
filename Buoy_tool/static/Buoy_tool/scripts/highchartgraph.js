function highchartgraph(variableName, DateTime, data) {

    var options = {

        chart: {
            renderTo: 'container',
            type: 'series',
            alignTicks: false
        },

        title: {
            text: variableName
        },

        credits: {
            enabled: false
        },

        xAxis: {
            type: 'datetime',
            title: 'Date and Time',
            labels: {
                formatter: function () {
                    return Highcharts.dateFormat('%m\\%e\\%Y', this.value);
                }
            },
            //tickInterval: 24 * 3600 * 1000 * 7,

        },
        yAxis: {
            //title: {
                //text: ' knots'
            //},
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
        name: variableName,
        data: [],
        type: 'area', //'line'
        connectNulls: true,
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
        buoyData.data.push([Date.parse(DateTime[i]), data[i]]);
    }
    options.series.push(buoyData);
    var chart = new Highcharts.Chart(options);
    //series.push(dataSeries);
}
		

        		
        
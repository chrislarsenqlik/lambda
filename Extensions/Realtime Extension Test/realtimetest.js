var socketio_port = 33333;
var dataqueue=[];
var data=[];
var maxValueArr=[];
var maxValue=10;

require.config({
        paths: {
            socketio: 'http://localhost:'+socketio_port+'/socket.io/socket.io'
        }
});

var paintcount=0;
var maxHeight=10;

define(["jquery", "socketio", "qlik", "css!./css/realtimetest.css", "./js/d3.min","./js/plotly-latest.min"], function($, io, qlik, cssContent, d3, Plotly) {
    $("<style>").html(cssContent).appendTo("head");
    return {
        initialProperties: {
            version: 1.0,
            qHyperCubeDef: {
                qDimensions: [],
                qMeasures: [],
                qInitialDataFetch: [{
                    qWidth: 10,
                    qHeight: 50
                }]
            }
        },
            definition: {
                type: "items",
                component: "accordion",
                items: {
                    dimensions: {
                        uses: "dimensions",
                        min: 0,
                        max: 1
                    },
                    measures: {
                        uses: "measures",
                        min: 0,
                        max: 1
                    },
                    sorting: {
                        uses: "sorting"
                    },
                    settings: {
                        uses: "settings",
                        items: {
                            dateFormatDropDown: {
                                type: "string",
                                component: "dropdown",
                                label: "Date/Time Format",
                                ref: "dateformat",
                                options: [ 
                                    {label:"YYYY-MM-DDThh:mm:ss.msZ", value: "%Y-%m-%dT%H:%M:%S.%LZ"},
                                    {label:"YYYY-MM-DD hh:mm:ss", value:"%Y-%m-%d %H:%M:%S"},
                                    {label:"DD/MM/YYYY hh:mm:ss", value:"%d/%m/%Y %H:%M:%S"},
                                    {label:"DD-MM-YYYY hh:mm", value:"%d-%m-%Y %H:%M"},
                                    {label:"DD/MM/YYYY hh:mm", value:"%d/%m/%Y %H:%M"},
                                    {label:"DD/MM/YYYY", value:"%d/%m/%Y"},
                                    {label:"DD-MM-YYYY", value:"%d-%m-%Y"},
                                    {label:"YYYY-MMM", value:"%Y-%b"},
                                    {label:"MM/YYYY", value:"%m/%Y"},
                                    {label:"hh:mm", value:"%H:%M"},
                                    {label:"YYYY", value:"%Y"}],
                                defaultValue: "%Y-%m-%dT%H:%M:%S.%LZ"
                            },
                            lineStyleDropDown: {
                                type: "string",
                                component: "dropdown",
                                label: "Line Style",
                                ref: "lineStyle",
                                options: [
                                    {label:"Linear",value:"linear"},
                                    {label:"Spline",value:"basis"},
                                    {label:"Steps Before",value:"step-before"},
                                    {label:"Steps After",value:"step-after"},
                                    {label:"Tight Spline",value:"bundle"},
                                    {label:"Cubic Monotone",value:"monotone"},
                                    {label:"Cardinal",value:"cardinal-open"}],
                                defaultValue: "linear"
                            },
                            showDataPoints: { 
                                type: "boolean",
                                component: "switch",
                                label: "Show Data Points",
                                ref: "showDataPoints",
                                options: [{ value: false,   label: "No"}, { value: true,    label: "Yes"}],
                                defaultValue: false
                            },
                            padData: { 
                                type: "boolean",
                                component: "switch",
                                label: "Pad Dates",
                                ref: "padData",
                                options: [{ value: false,   label: "No"}, { value: true,    label: "Yes"}],
                                defaultValue: false
                            },
                            showValuesOnMouseOver: { 
                                type: "boolean",
                                component: "switch",
                                label: "MouseOver",
                                ref: "showValuesOnMouseOver",
                                options: [{ value: false,   label: "No"}, { value: true,    label: "Yes"}],
                                defaultValue: true
                            },
                            showFill: { 
                                type: "boolean",
                                component: "switch",
                                label: "Fill Area",
                                ref: "showFill",
                                options: [{ value: false,   label: "No"}, { value: true,    label: "Yes"}],
                                defaultValue: false
                            }

                        }
                    }
                }
            },
        snapshot: {
            canTakeSnapshot: true
        },
        paint: function($element, layout) {
                paintcount=paintcount+1

                if (paintcount===1) {
                    var dataqueue=[];
                    var chartdata={};

                    //console.log('plotly',Plotly)
                    var self = this;

                    var html="<div id='notifybar'></div>";
                    html+="<div class='graph'></div>";

                    $element.html(html);

                    // SOCKET.IO STUFF:

                    var socket = io.connect('http://localhost:'+socketio_port);

                    var socketstatus;

                    if (socket) {
                        socketstatus = 'Connected';
                    } else {
                        socketstatus = 'Not Connected';
                    }

                    socket.on( 'error', function(data) {
                            console.log('error on socket.io');
                            //console.log(data);
                            $("#notifybar")[0].innerText='Error on Socket.io'
                    });

                    socket.on( 'disconnect', function(data) {
                            console.log('disconnected from socket.io');
                            //console.log(data);
                            $("#notifybar")[0].innerText='Disconnected from Socket.io';
                    });

                    socket.on( 'Reconnected', function(data) {
                            console.log('Reconnected to socket.io');
                            $("#notifybar")[0].innerText='Reconnected to Socket.io';
                    });

                    socket.on( 'connect', function(err) {
                        console.log('connected to socket.io');

                        var limit = 60 * 1,
                            duration = 750,
                            now = new Date(Date.now() - duration)

                        var width = $element.width(),
                            height = $element.height()-100

                        var groups = {
                            current: {
                                value: 0,
                                color: 'orange',
                                data: d3.range(limit).map(function() {
                                    return 0
                                })
                            }
                            // ,target: {
                            //     value: 0,
                            //     color: 'green',
                            //     data: d3.range(limit).map(function() {
                            //         return 0
                            //     })
                            // },
                            // output: {
                            //     value: 0,
                            //     color: 'grey',
                            //     data: d3.range(limit).map(function() {
                            //         return 0
                            //     })
                            // }
                        }

                        var x = d3.time.scale()
                            .domain([now - (limit - 2), now - duration])
                            .range([0, width])

                        var currentMax

                        var y = d3.scale.linear()
                            .domain([0, maxValue])
                            .range([height, 0])

                        var line = d3.svg.line()
                            .interpolate('basis')
                            .x(function(d, i) {
                                return x(now - (limit - 1 - i) * duration)
                            })
                            .y(function(d) {
                                return y(d)
                            })

                        var svg = d3.select('.graph').append('svg')
                            .attr('class', 'chart')
                            .attr('width', width)
                            .attr('height', height + 50)

                        var xaxis = svg.append('g')
                            .attr('class', 'x axis')
                            .attr('transform', 'translate(0,' + height + ')')
                            .call(x.axis = d3.svg.axis().scale(x).orient('bottom'))

                        var yaxis = svg.append('g')
                            .attr('class', 'y axis')
                            .attr('transform', 'translate(0,' + height + ')')
                            .call(y.axis = d3.svg.axis().scale(y).orient('left').ticks(20))                            

                        var paths = svg.append('g')

                        for (var name in groups) {
                            var group = groups[name]
                            group.path = paths.append('path')
                                .data([group.data])
                                .attr('class', name + ' group')
                                .style('stroke', group.color)
                        }

                        function tick() {
                            now = new Date()

                            // Add new values
                            for (var name in groups) {
                                var group = groups[name]
                                group.data.push(chartdata.readvalue)
                                group.path.attr('d', line)
                            }

                            // Shift domain
                            x.domain([now - (limit - 2) * duration, now - duration])

                            // Slide x-axis left
                            xaxis.transition()
                                .duration(duration)
                                .ease('linear')
                                .call(x.axis)

                            yaxis.transition()
                                .duration(duration)
                                .ease('linear')
                                .call(y.axis)

                            // Slide paths left
                            paths.attr('transform', null)
                                .transition()
                                .duration(duration)
                                .ease('linear')
                                .each('end', tick)

                            // Remove oldest data point from each group
                            for (var name in groups) {
                                var group = groups[name]
                                group.data.shift()
                            }
                        }
                        //var received=0;
                        socket.on('bounceemit', function(sensordata) {
                            maxValueArr.push(sensordata.readvalue);
                            maxValue=Math.max(maxValueArr);
                            chartdata=sensordata;
                            tick()
                            
                            $("#notifybar")[0].innerHTML='<font size="14pt">readvalue: <b>'+JSON.stringify(sensordata.readvalue)+'</font></b>';
                            
                        });

                    });
                }
                
            },
            resize:function($el,layout){
                //this.paint($el,layout);
            }
    };
});
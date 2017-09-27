/*
* Lambda mashup
* @owner Chris Larsen
*/

var prefix = window.location.pathname.substr( 0, window.location.pathname.toLowerCase().lastIndexOf( "/extensions" ) + 1 );
//var prefix = "http://localhost:4848/extensions";
var config = {
	host: window.location.hostname,
	prefix: prefix,
	port: window.location.port,
	isSecure: window.location.protocol === "https:"
};
// //to avoid errors in workbench: you can remove this when you have added an app

require.config({
	baseUrl: (config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port : "" ) + config.prefix + "resources",
	paths: {
		socketio: "http://localhost:33333/socket.io/socket.io",
		d3: "http://d3js.org/d3.v3.min",
		qsocks: 'https://rawgit.com/mindspank/qsocks/master/qsocks.bundle'
	}
});

require( ["jquery", "js/qlik","socketio", "d3", "qsocks"], function ($, qlik, io, d3, qsocks ) {

	//console.log(qsocks)

	var socket = io.connect('http://localhost:33333');

	var control = false;

	qlik.setOnError( function ( error ) {
			return false;
			console.log('test error:',error)
		}, 
		function(warning){
			console.log(warning);
	}); 
	if ( $( 'ul#qbmlist li' ).length === 0 ) {
		$( '#qbmlist' ).append( "<li><a>No bookmarks available</a></li>" );
	}
	$( "body" ).css( "overflow: hidden;" );

	$('.collapse').on('shown.bs.collapse', function(){
	$(this).parent().find(".glyphicon-plus").removeClass("glyphicon-plus").addClass("glyphicon-minus");
	}).on('hidden.bs.collapse', function(){
	$(this).parent().find(".glyphicon-minus").removeClass("glyphicon-minus").addClass("glyphicon-plus");
	});
	
	function AppUi ( app ) {
		var me = this;
		this.app = app;
		app.global.isPersonalMode( function ( reply ) {
			me.isPersonalMode = reply.qReturn;
		} );
		app.getAppLayout( function ( layout ) {
			$( "#title" ).html( layout.qTitle );
			$( "#title" ).attr( "title", "Last reload:" + layout.qLastReloadTime.replace( /T/, ' ' ).replace( /Z/, ' ' ) );

		} );
		app.getList( 'SelectionObject', function ( reply ) {
			$( "[data-qcmd='back']" ).parent().toggleClass( 'disabled', reply.qSelectionObject.qBackCount < 1 );
			$( "[data-qcmd='forward']" ).parent().toggleClass( 'disabled', reply.qSelectionObject.qForwardCount < 1 );
		} );
	}

	var app = qlik.openApp('LambdaWindow1.qvf', config);
	var app2 = qlik.openApp('LambdaWindow2.qvf',config);
	var app3 = qlik.openApp('LambdaRealtime.qvf',config)


// app.visualization.create( 'table',
// 	[
// 		"Case Owner Group", {
// 			"qDef" : {
// 				"qDef" : "=[sensorposition]",
// 				"qLabel" : "Avg Case Duration Time"
// 				},
// 			},
// 		{
// 			"qDef" : {
// 				"qDef" : "=Sum( [readvalue] )",
// 				"qLabel" : "Open Cases"
// 			}
// 		}
// 	],
// 	{"title" : "Case Owner Group Case stats"}
// ).then( function ( visual ) {
// 	visual.show( 'TableBox1' );
// } );

	
	$( "#resetselections" ).click( function () {
			app.clearAll().then( function(){ 
				console.log('cleared all') 
			}).then(function() {
				app2.clearAll().then( function(){ 
					console.log('cleared all')  
				}).catch(function(err) { console.log(err) });
			}).catch(function(err) { console.log(err) });
	});		

	$( "#resetappdata" ).click( function () {

		app.clearAll().then( function(){ 
			app.doReload().then( function(){
			 	app.doSave().then( function(){
		  			console.log('cleared all')  
		  				app2.clearAll().then( function(){ 
							app2.doReload().then( function(){
							 	app2.doSave().then( function(){
						  			console.log('cleared all')  
						  		}).catch(function(err) { console.log(err) });
						  	}).catch(function(err) { console.log(err) });
						}).catch(function(err) { console.log(err) });
		  		}).catch(function(err) { console.log(err) });
		  	}).catch(function(err) { console.log(err) });
		}).catch(function(err) { console.log(err) });
	} );

		//get objects -- inserted here --
	app3.getObject('QV03','uXEp');
	
app.getObject('FilterBox1','LbjZCQu') // filterpane for Lambda1
	//app2.getObject('QV02','hpWsgQ'); //main vis for Lambda2
	app2.getObject('FilterBox2','aWLNNPa') // filterpane for Lambda2
	

	if ( app ) {
		new AppUi( app );
	}

    app.visualization.create( 'linechart',
		[//"read_id" 
		//,"Avg Readvalue"
		//,"=Avg(readvalue)"//,"=R.ScriptEval('library(\"TTR\");SMA(ts(.arg1), n=.arg2)',aggr(avg([readvalue]),read_id),10)"
		],
		{qHyperCubeDef: {
				qDimensions: [{
					qDef: {
						qFieldDefs: ["read_id"],
						qFieldLabels: ["read_id"],
						qSortCriterias: [{
							qSortByNumeric: -1
						}]
					}
				}],
				qMeasures: [
					{
						qDef: {
							qDef: "=if(statuscode='Critical',avg(failtest),if(statuscode='Fail', avg(failtest),avg(readvalue)))",
							qLabel: "avg Readvalue"
						}
					}
					,
					{
						qDef: {
							qDef: "=R.ScriptEval('library(\"TTR\");SMA(ts(q$avgread), n=4)', aggr(avg([readvalue]), read_id) as avgread)",
							qLabel: "SMA",
							"series" : { "type" : "marker",
										 axis: 0
									   } //try marker next
						}
					}
				]
			},
			"lineType": "area",
			"nullMode": "connect",
			"dataPoint": { "show": false, "showLabels": true },
			"showTitles": false
		}
	).then( function ( visual ) {
		visual.show( 'QV01' );
	} );

    app2.visualization.create( 'linechart',
		[//"read_id" 
		//,"Avg Readvalue"
		//,"=Avg(readvalue)"//,"=R.ScriptEval('library(\"TTR\");SMA(ts(.arg1), n=.arg2)',aggr(avg([readvalue]),read_id),10)"
		],
		{qHyperCubeDef: {
				qDimensions: [{
					qDef: {
						qFieldDefs: ["read_id"],
						qFieldLabels: ["read_id"],
						qSortCriterias: [{
							qSortByNumeric: -1
						}]
					}
				}],
				qMeasures: [
					{
						qDef: {
							qDef: "=avg(readvalue)",
							qLabel: "avg Readvalue"
						}
					}
					,
					{
						qDef: {
							qDef: "=R.ScriptEval('library(\"TTR\");SMA(ts(q$avgread), n=4)', aggr(avg([readvalue]), read_id) as avgread)",
							qLabel: "SMA",
							"series" : { "type" : "marker",
										 axis: 0
									   } //try marker next
						}
					}
				]
			},
			"lineType": "area",
			"nullMode": "connect",
			"dataPoint": { "show": false, "showLabels": true },
			"showTitles": false
		}
	).then( function ( visual ) {
		visual.show( 'QV02' );
	} );
});
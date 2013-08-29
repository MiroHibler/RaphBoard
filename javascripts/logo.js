/* Draw RaphBoard Logo in container */

function drawLogo ( container ) {

	var paper = Raphael( container );

	paper.setStart();
	// Tools
	paper.path( "m 25.56019,18.639598 -2.326,1.215 c 0.708,1.174 1.384,2.281 1.844,3.033 l 2.043,-1.066 c -0.382,-0.784 -0.954,-1.954 -1.561,-3.182 z" ).attr( { stroke: "none", fill: "30-#000-#cccccc-#000" } );
	paper.path( "m 20.34419,14.903598 c 0.445,0.84 1.342,2.367 2.274,3.926 l 2.414,-1.261 c -0.872,-1.769 -1.72,-3.458 -2.087,-4.122 -0.896,-1.621 -1.982,-3.108 -3.454,-5.4169998 -1.673,-2.625 -3.462,-5.492 -4.052,-4.947 -1.194,0.384 1.237,4.094 1.876,5.715 0.616,1.5649998 1.877,3.9299998 3.029,6.1059998 z" ).attr( { stroke: "none", fill: "40-#000-#b00-#000" } );
	paper.path( "m 27.65819,22.888598 -1.961,1.022 1.982,4.598 c 0,0 0.811,0.684 1.92,0.213 1.104,-0.469 0.81,-1.706 0.81,-1.706 l -2.751,-4.127 z" ).attr( { stroke: "none", fill: "40-#000-#eee8aa-#000" } );
	paper.path( "m 16.24919,10.360598 c 0,-0.9299998 -0.754,-1.6849998 -1.685,-1.6849998 -0.661,0 -1.231,0.381 -1.507,0.936 l 2.976,1.5719998 c 0.138,-0.243 0.216,-0.524 0.216,-0.823 z" ).attr( { stroke: "none", fill: "155-#999-#e6e6e6-#999" } );
	paper.path( "m 15.54419,12.275598 -3.188,-1.684 -1.535,2.636 3.197,1.689 1.526,-2.641 z" ).attr( { stroke: "none", fill: "153-#000-#cccccc-#000" } );
	paper.path( "m 4.3931898,27.101598 -0.384,1.108 v 0.299 l 0.298,-0.128 0.725,-0.896 2.997,-2.354 -3.137,-1.651 -0.499,3.622 z" ).attr( { stroke: "none", fill: "145-#000-#ffe4b5-#000" } );
	paper.path( "m 10.22119,14.259598 -4.7570002,8.17 3.23,1.706 4.7280002,-8.186 -3.201,-1.69 z" ).attr( { stroke: "none", fill: "145-#000-#ffcc00-#000" } );
	// Logo
	paper.path( "m 23.075964,24.021589 c 0.295893,-0.446372 0.453972,-0.969758 0.453972,-1.518985 0,-0.738212 -0.287279,-1.431838 -0.809652,-1.95269 l -3.501062,-3.501569 -0.0015,10e-4 c -0.499066,-0.500586 -1.190665,-0.810665 -1.951171,-0.810665 -0.761012,0 -1.451091,0.310079 -1.950664,0.810665 h -5.06e-4 l -3.501589,3.501572 c -0.522372,0.521359 -0.809652,1.214985 -0.809652,1.952691 0,0.738212 0.28728,1.431838 0.809652,1.952691 l 3.157036,3.156022 c 0.126666,0.142373 0.259413,0.275626 0.399759,0.397733 0.514773,0.486906 1.184585,0.754932 1.896451,0.754932 0.737706,0 1.431332,-0.286266 1.952691,-0.809652 l 3.406315,-3.407329 c 0.01064,-0.0096 0.01723,-0.01621 0.02584,-0.02584 l 0.07093,-0.06992 c 0.131734,-0.131733 0.246747,-0.273599 0.348587,-0.424586 0.002,-0.0041 0.0051,-0.0076 0.0071,-0.01064 l -0.0025,0.0046 z" ).attr( { stroke: "none", fill: "#000" } );
	paper.path( "m 22.509004,22.504124 c 0,0.34352 -0.09981,0.67184 -0.284239,0.952026 -0.11248,0.150986 -0.22648,0.283226 -0.34656,0.397226 l -0.0066,0.0081 c -0.559866,0.533012 -1.192692,0.683999 -1.729758,0.683999 -0.295893,0 -0.561893,-0.0456 -0.771652,-0.0988 -1.227145,-0.308053 -2.561704,-1.363945 -3.172236,-2.90421 0.328826,0.138827 0.690079,0.21584 1.069065,0.21584 1.424238,0 2.59869,-1.084772 2.743596,-2.47101 l 1.988158,1.988664 c 0.329333,0.3268 0.510212,0.763546 0.510212,1.228158 z" ).attr( { stroke: "none", fill: "#19aeff" } );
	paper.path( "m 17.267038,17.262158 c 0.957599,0 1.735838,0.779253 1.735838,1.736345 0,0.957598 -0.778239,1.736344 -1.735838,1.736344 -0.957092,0 -1.735838,-0.778746 -1.735838,-1.736344 0,-0.957092 0.778746,-1.736345 1.735838,-1.736345 z" ).attr( { stroke: "none", fill: "#fff" } );
	paper.path( "m 12.535792,23.734816 c -0.328827,-0.328319 -0.510213,-0.766079 -0.510213,-1.230692 0,-0.464612 0.18088,-0.901865 0.510213,-1.230185 l 1.345197,-1.345704 c -0.351119,1.195225 -0.502106,2.453276 -0.421039,3.658635 0.02888,0.432693 0.08867,0.849679 0.1748,1.246398 l -1.098958,-1.098452 z" ).attr( { stroke: "none", fill: "#ff4141" } );
	paper.path( "m 14.836055,20.298101 c 0.295386,2.31141 2.125464,4.593434 4.283861,5.139113 0.351119,0.09069 0.696665,0.134267 1.030052,0.134267 0.0051,0 0.01013,0 0.01368,0 l -1.666425,1.666424 c -0.328319,0.327306 -0.766079,0.509706 -1.230185,0.509706 -0.323253,0 -0.632319,-0.08968 -0.901359,-0.253333 l 5.07e-4,-0.001 c -0.105893,-0.07195 -0.20672,-0.149467 -0.30552,-0.233573 -0.0076,-0.0096 -0.01571,-0.01317 -0.02331,-0.02179 l -0.336933,-0.336426 c -0.692612,-0.793946 -1.128345,-1.977518 -1.222078,-3.379969 -0.07043,-1.062985 0.05725,-2.169037 0.357706,-3.223409" ).attr( { stroke: "none", fill: "#9ade00" } );

	var s = paper.setFinish();

	var BBox = s.getBBox();
	var width = $( "#" + container ).width();
	var height = $( "#" + container ).height();
	var wScale = width / BBox.width;
	var hScale = width / BBox.height;

	s.transform( "...t" + ( BBox.x > 0 ? "-" : "" ) + BBox.x + "," + ( BBox.y > 0 ? "-" : "" ) + BBox.y + "s" + wScale + "," + hScale + "," + BBox.x + "," + BBox.y );
}
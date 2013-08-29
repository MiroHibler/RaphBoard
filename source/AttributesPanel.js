	var _attributesPanel = {
		init: function ( RB, id ) {
			var self = this;

			self._board = RB;
			self._container = $( "#" + id )

			self._container.css( {
				position	: "relative",
				top			: "-" + self._board.height() + "px",
				width		: self._board.width() + "px",
				height		: self._board.height() + "px",
				"z-index"	: "9999",
				display		: "none"
			} );


			self._paper = Raphael( id, self._board.width(), self._board.height() );
			// Fix for half-pixel position ( "left: -0.5px" )
			var containerSVG = self._container.children( ":first" );
			if ( containerSVG.css( "position" ) == "relative" ) {
				containerSVG.css( "left", "" );
				containerSVG.css( "top", "" );
			}

			return self;   
 		},

 		// Properties
 		paper: function () {
 			return this._paper;
 		},

 		// Methods
		show: function () {
			var self = this;

			var colors = [ "#000", "#FFF", "#F00", "#0F0", "#00F", "#FF0" ];

			var x = 0;
			var y = 0;
			var w = self._board.width();
			var h = self._board.height();

			self._container.css( {
				top			: "-" + h + "px",
				width		: w + "px",
				height		: h + "px",
			} );

			self._panel = self._paper.set();
			self._panel.push( self._paper.rect( 0, 0, w, h ).attr( {
				fill	: "rgba(0,0,0,0.25)",
				stroke	: "none",
				cursor	: "auto"
			} ) );
			self._panel.push( self._paper.rect( ( w/2 ) - 110, ( h/2 ) - 110, 220, 220, 16 ).attr( {
				fill	: "rgba(0,0,0,0.5)",
				stroke	: "none"
			} ) );
			var picker = self._paper.circle( w/2, h/2, 90 ).attr( {
				"fill"			: self._board.options.fill,
				"stroke"		: self._board.options.stroke,
				"stroke-width"	: self._board.options.strokeWidth,
				"cursor"		: "pointer"
			} );
			self._panel.push( picker );

			// Fill Color Picker
			var fillPicker = self._paper.set();
			var i = 0;
			var angle = 0;

			while ( angle < 360 ) {
				var color = colors[ i ];
				( function ( t, c ) {
					fillPicker.push( self._paper.circle( w/2, ( h/2 ) + 40, 16 )
							.attr( {
								stroke		: c,
								fill		: c,
								transform	: t,
								cursor		: "pointer"
							})
							.click( function () {
								picker.attr( { fill: this.attr( "fill" ) } );
							})
					);
				} ) ( "r" + angle + " " + ( w/2 ) + " " + ( h/2 ), color );
				i++;
				angle += 60;
			}

			var s = self._paper.set();
			var fill_back = self._paper.circle( w/2, ( h/2 ), 16 ).attr( {
				fill	: "rgba(0,0,0,0)",
				stroke	: "none"
			} );
			s.push( fill_back );
			s.push( self._paper.path( "M11.478,17.568c-0.172-0.494-0.285-1.017-0.285-1.568c0-2.65,2.158-4.807,4.807-4.807c0.552,0,1.074,0.113,1.568,0.285l2.283-2.283C18.541,8.647,17.227,8.286,16,8.286C8.454,8.286,2.5,16,2.5,16s2.167,2.791,5.53,5.017L11.478,17.568zM23.518,11.185l-3.056,3.056c0.217,0.546,0.345,1.138,0.345,1.76c0,2.648-2.158,4.807-4.807,4.807c-0.622,0-1.213-0.128-1.76-0.345l-2.469,2.47c1.327,0.479,2.745,0.783,4.229,0.783c5.771,0,13.5-7.715,13.5-7.715S26.859,13.374,23.518,11.185zM25.542,4.917L4.855,25.604L6.27,27.02L26.956,6.332L25.542,4.917z" )
				.attr( {
					fill		: "#FFF",
					stroke		: "#000",
					transform	: "t" + ( ( w/2 ) - 16 ) + "," + ( ( h/2 ) - 16 )
				})
			);
			s.attr( { cursor: "pointer" } )
				.hover(
					function () {	// mouse_in
						fill_back.attr( { fill: "rgba(255,255,255,0.5)" } )
					},
					function () {	// mouse_out
						fill_back.attr( { fill: "rgba(0,0,0,0)" } )
					}
				)
				.click( function () {
					picker.attr( { fill: "none" } );
					if ( picker.attr( "stroke-width" ) == 0) picker.attr( { "stroke-width": 1 } );
				} );
			fillPicker.push( s );

			// Stroke Color Picker
			var i = 0;
			var angle = 105;

			while ( angle < 270 ) {
				var color = colors[ i ];
				( function ( t, c ) {
					self._panel.push( self._paper.circle( ( w/2 ), ( h/2 ) + 90, 16 )
							.attr( {
								stroke		: c,
								fill		: c,
								transform	: t,
								cursor		: "pointer"
							})
							.click( function () {
								picker.attr( { stroke: this.attr( "fill" ) } );
							}
						)
					);
				} ) ( "r" + angle + " " + ( w/2 ) + " " + ( h/2 ), color );
				i++;
				angle += 30;
			}

			// Stroke Width Picker
			var angle = 300;
			var width = 12;

			while ( angle <= 420 ) {
				var color = "#000";
				( function ( t, c, sw ) {
					var s = self._paper.set();
					var bg = self._paper.circle( ( w/2 ), ( h/2 ) + 90, 16 ).attr( {
						stroke	: "none",
						fill	: "#C0C0C0"
					} );
					s.push( bg );
					if ( sw > 0 ) {
						s.push( self._paper.circle( ( w/2 ), ( h/2 ) + 90, ( sw/2 ) ).attr( {
							stroke	: "none",
							fill	: c
						} ) );
					}
					s.attr( {
						stroke			: "rgba(0,0,0,0)",
						"stroke-width"	: sw == 0 ? 0 : ( sw/2 ),
						transform		: t,
						cursor			: "pointer"
					} );
					if ( sw == 0 ) {
						var bgBox = bg.getBBox( false );
						s.push( self._paper.path( "M11.478,17.568c-0.172-0.494-0.285-1.017-0.285-1.568c0-2.65,2.158-4.807,4.807-4.807c0.552,0,1.074,0.113,1.568,0.285l2.283-2.283C18.541,8.647,17.227,8.286,16,8.286C8.454,8.286,2.5,16,2.5,16s2.167,2.791,5.53,5.017L11.478,17.568zM23.518,11.185l-3.056,3.056c0.217,0.546,0.345,1.138,0.345,1.76c0,2.648-2.158,4.807-4.807,4.807c-0.622,0-1.213-0.128-1.76-0.345l-2.469,2.47c1.327,0.479,2.745,0.783,4.229,0.783c5.771,0,13.5-7.715,13.5-7.715S26.859,13.374,23.518,11.185zM25.542,4.917L4.855,25.604L6.27,27.02L26.956,6.332L25.542,4.917z" )
							.attr( {
								fill			: "#000",
								stroke			: "rgba(0,0,0,0)",
								"stroke-width"	: sw == 0 ? 0 : ( sw/2 ),
								transform		: "t" + bgBox.x + "," + bgBox.y
							})
						);
					}
					s.click( function () {
							sw = this.attr( "stroke-width" );
							if ( sw == 0 ) {
								if ( picker.attr( "fill" ) == "none" ) picker.attr( { fill: self._board.options.fill } );
							} else {
								sw = sw == 1 ? 1 : sw*2;
							}
							picker.attr( { "stroke-width": sw } );
						} );
					self._panel.push( s );
				} ) ( "r" + angle + " " + ( w/2 ) + " " + ( h/2 ), color, width );
				angle += 30;
				width -= 4;
				if ( width < 0 ) {
					width = 0;
				} else if ( width == 0 ) {
					width = 2;
				}
			} 
 
			// Cancel Button
			var cancel_back = self._paper.circle( ( w/2 ) - 90, ( h/2 ) + 90, 16 ).attr( {
				fill	: "rgba(0,0,0,0)",
				stroke	: "none"
			} );
			var s = self._paper.set();
			s.push( cancel_back );
			s.push( self._paper.path( "M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z" )
				.attr( {
					fill		: "#F00",
					stroke		: "none",
					transform	: "t" + ( ( w/2 ) - 90 - 16 ) + "," + ( ( h/2 ) + 90 - 16 )
				} )
			);
			s.attr( { cursor: "pointer" } )
				.hover(
					function () {	// mouse_in
						cancel_back.attr( { fill: "rgba(255,0,0,0.25)" } )
					},
					function () {	// mouse_out
						cancel_back.attr( { fill: "rgba(0,0,0,0)" } )
					}
				)
				.click( function () {
					self.hide();
					self._board.canvas._container.mousemove( InitBoardEvents( self._board.canvas._container ) );
					self._board.canvas._container.unbind( "mousemove" );
				} );
			self._panel.push( s );

			// OK Button
			var ok_back = self._paper.circle( ( w/2 ) + 90, ( h/2 ) + 90, 16 ).attr( {
				fill	: "rgba(0,0,0,0)",
				stroke	: "none"
			} );
			var s = self._paper.set();
			s.push( ok_back );
			s.push( self._paper.path( "M2.379,14.729 5.208,11.899 12.958,19.648 25.877,6.733 28.707,9.561 12.958,25.308z" )
				.attr( {
					fill		: "#0F0",
					stroke		: "none",
					transform	: "t" + ( ( w/2 ) + 90 - 16) + "," + ( ( h/2 ) + 90 - 16 )
				} ) );
			s.attr( { cursor: "pointer" } )
				.hover(
					function () {	// mouse_in
						ok_back.attr( { fill: "rgba(0,255,0,0.25)" } )
					},
					function () {	// mouse_out
						ok_back.attr( { fill: "rgba(0,0,0,0)" } )
					}
				)
				.click( function () {
					self._board.options.stroke		= picker.attr( "stroke" );
					self._board.options.fill		= picker.attr( "fill" );
					self._board.options.strokeWidth	= picker.attr( "stroke-width" );
					self.hide();
					self._board.canvas._container.mousemove( InitBoardEvents( self._board.canvas._container ) );
					self._board.canvas._container.unbind( "mousemove" );
				} );
			self._panel.push( s );
			self._panel.attr( { cursor: "pointer" } );

			$( self._container ).show();

			return self;
		},

		hide: function () {
			var self = this;

			$( self._container ).hide();
			self._paper.clear();

			return self;
		}
	};

	function AttributesPanel ( board, id ) {
		return Object.create( _attributesPanel ).init( board, id );
	}

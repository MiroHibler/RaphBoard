	var _canvas = {
		init: function ( RB, id ) {
			var self = this;

			self.container = $( "#" + id )

			self.container.css( {
				position	: "relative",
				width		: RB.width() + "px",
				height		: ( RB.height() - ( RB.options.showToolBar ? RB.toolBar.height : 0 ) ) + "px"
			});

			self.paper = Raphael( id, RB.width(), RB.height() - ( RB.options.showToolBar ? RB.toolBar.height : 0 ) );
			// Fix for half-pixel position ( "left: -0.5px" )
			var containerSVG = self.container.children( ":first" );
			if ( containerSVG.css( "position" ) == "relative" ) {
				containerSVG.css( "left", "" );
				containerSVG.css( "top", "" );
			}

			return self;
		} 
	};

	function Canvas ( board, id ) {
		return Object.create( _canvas ).init( board, id );
	}

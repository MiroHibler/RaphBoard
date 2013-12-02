	var _canvas = {
		init: function ( RB, id ) {
			var self = this;

			self._board = RB;
			self._container = $( "#" + id )

			self._container.css( {
				position	: "absolute",
				width		: self._board.width() + "px",
				height		: ( self._board.height() - ( self._board.options.showToolBar ? self._board.toolBar.height() : 0 ) ) + "px"
			});

			self._paper = Raphael( id, self._board.width(), self._board.height() - ( self._board.options.showToolBar ? self._board.toolBar.height() : 0 ) );
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
		}
	};

	function Canvas ( board, id ) {
		return Object.create( _canvas ).init( board, id );
	}

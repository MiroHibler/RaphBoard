	var _buttonIcon = {
		init: function ( button, path, attr ) {
			var self = this;

			self._button = button;
			self._path = button._toolBar._paper.path( path ).attr( attr );

			return self;
		},

		// Properties
		isGlowing: function () {
			return ( typeof this._path._glow === "object" );
		},

		isVisible: function () {
			return this._path.node.style.display !== "none";
		},

		// Methods
		glow: function ( state ) {
			var self = this;

			if ( state ) {
				self._path._glow = self._path.glow();
			} else {
				if ( self.isGlowing() ) {
					self._path._glow.remove();
				}
			}

			return self;
		},

		show: function () {
			var self = this;

			self._path.show();

			return self;
		},

		hide: function () {
			var self = this;

			self._path.hide();

			return self;
		}
	};

	function ButtonIcon ( button, path, attr ) {
		return Object.create( _buttonIcon ).init( button, path, attr );
	}

	var _buttonIcon = {
		init: function ( button, path, attr ) {
			var self = this;
			self.button = button;

			self.path = button.toolBar.paper.path( path ).attr( attr );

			return self;
		},

		show: function () {
			this.path.show();
		},

		isVisible: function () {
			return this.path.node.style.display !== "none";
		},

		hide: function () {
			this.path.hide();
		},

		isGlowing: function () {
			return ( typeof this.path.g === "object" );
		},

		glow: function ( state ) {
			var self = this;

			if ( state ) {
				self.path.g = self.path.glow();
			} else {
				if ( self.isGlowing() ) {
					self.path.g.remove();
				}
			}
		}
	};

	function ButtonIcon ( button, path, attr ) {
		return Object.create( _buttonIcon ).init( button, path, attr );
	}

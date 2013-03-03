	var _button = {
		init: function ( toolBar, name, attr ) {
			var self = this;

			self.icons = [];
			self.name = name;
			self.toolBar = toolBar;
			self.isEnabled = true;
			self.isSelected = false;

			var p = toolBar.paper;
			self.set = p.set();
			self.paths = p.set();
			self.set.push( self.paths );
			self.rect = p.rect( 0, 0, 0, 0 ).attr( attr );
			self.set.push( self.rect );

			return self;
		},

		addIcon: function ( path, attr ) {
			var self = this;

			var newIcon = ButtonIcon( self, path, attr );
			self.icons.push( newIcon );
			self.paths.push( newIcon.path );
			self.showIcon( self.icons.length - 1 );
			self.rect.toFront();

			return newIcon;
		},

		showIcon: function ( index ) {
			var self = this;

			for ( ndx in self.icons ) {
				self.icons[ndx].hide();
			};
			self.icons[index].show();
		},

		activeIcon: function () {
			var self = this;
			var activeIcon;

			for ( ndx in self.icons ) {
				if ( self.icons[ndx].isVisible ) {
					activeIcon = self.icons[ndx];
					break;
				}
			};

			return activeIcon;
		},

		removeIcon: function ( index ) {
			var self = this;

			self.icons[index].path.remove();
			self.icons.splice( index, 1 );
		},

		highlight: function ( state, glow  ) {
			var self = this;

			if ( state ) {
				self.activeIcon().glow( glow );
				self.activeIcon().path.attr( { fill: "90-#6B9DF4-#4575ED", stroke: "none" } );
			} else {
				self.activeIcon().glow( false );
				self.activeIcon().path.attr( { fill: "90-#888-#CCC", stroke: "none" } );
			}
		},

		hover: function ( mouseIn, mouseOut ) {
			var self = this;

			self.mouseIn = mouseIn;
			self.mouseOut = mouseOut;
			self.rect.hover( function () {
				if ( self.isEnabled ) self.mouseIn();
			}, function () {
				if ( self.isEnabled ) self.mouseOut();
			});
		},

		mouseDown: function ( mouseDown ) {
			var self = this;

			self.mouseDown = mouseDown;
			self.rect.mousedown( function () {
				if ( self.isEnabled ) self.mouseDown();
			});
		},

		mouseUp: function ( mouseUp ) {
			var self = this;

			self.mouseUp = mouseUp;
			self.rect.mouseup( function () {
				if ( self.isEnabled ) self.mouseUp();
			} );
		},

		select: function ( state ) {
			var self = this;

			self.isSelected = state;
			self.highlight( state, state );
		},

		enabled: function ( enable ) {
			this.isEnabled = enable;
		} 
	};

	function Button ( toolBar, name, attr ) {
		return Object.create( _button ).init( toolBar, name, attr );
	}

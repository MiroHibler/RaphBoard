	var _button = {
		init: function ( toolBar, name, attr ) {
			var self = this;

			self._toolBar = toolBar;
			self._name = name;
			self._icons = [];
			self._isEnabled = true;
			self._isSelected = false;

			var _p = toolBar._paper;
			self._set = _p.set();
			self._paths = _p.set();
			self._set.push( self._paths );
			self._rect = _p.rect( 0, 0, 0, 0 ).attr( attr );
			self._set.push( self._rect );

			return self;
		},

		// Properties
		isEnabled: function () {
			return this._isEnabled;
		},

		isVisible: function () {
			return this._isVisible;
		},

		isSelected: function () {
			return this._isSelected;
		},

		name: function ( newName ) {
			var self = this;

			if ( newName !== undefined ) {
				self._name = newName;
			}

			return self._name;
		},

		attr: function ( newAttr ) {
			var self = this;

			if ( typeof newAttr === "Object" ) {
				self._rect.attr( $.extend( {}, self._rect.attr(), newAttr ) );
			}

			return self._rect.attr();
		},

		activeIcon: function () {
			var self = this;
			var _activeIcon;

			for ( ndx in self._icons ) {
				if ( self._icons[ndx].isVisible() ) {
					_activeIcon = self._icons[ndx];
					break;
				}
			};

			return _activeIcon;
		},

		hover: function ( mouseIn, mouseOut ) {
			var self = this;

			self._mouseIn = mouseIn;
			self._mouseOut = mouseOut;
			self._rect.hover( function () {
				if ( self._isEnabled ) self._mouseIn();
			}, function () {
				if ( self._isEnabled ) self._mouseOut();
			});

			return self;
		},

		mouseDown: function ( mouseDown ) {
			var self = this;

			self._mouseDown = mouseDown;
			self._rect.mousedown( function () {
				if ( self._isEnabled ) self._mouseDown();
			});

			return self;
		},

		mouseUp: function ( mouseUp ) {
			var self = this;

			self._mouseUp = mouseUp;
			self._rect.mouseup( function () {
				if ( self._isEnabled ) self._mouseUp();
			} );

			return self;
		},

		// Methods
		addIcon: function ( icon ) {
			var self = this;

			self._icons.push( icon );
			self._paths.push( icon._path );
			self.showIcon( self._icons.length - 1 );
			self._rect.toFront();

			return self;
		},

		insertIcon: function ( index, icon ) {
			var self = this;

			self._icons.splice( index, 1, icon );

			return self;
		},

		removeIcon: function ( index ) {
			var self = this;

			self._icons[index]._path.remove();
			self._icons.splice( index, 1 );

			return self;
		},

		showIcon: function ( index ) {
			var self = this;

			for ( ndx in self._icons ) {
				self._icons[ndx].hide();
			};
			self._icons[index].show();

			return self;
		},

		highlight: function ( state, glow  ) {
			var self = this;

			if ( state ) {
				self.activeIcon().glow( glow );
				self.activeIcon()._path.attr( { fill: "90-#6B9DF4-#4575ED", stroke: "none" } );
			} else {
				self.activeIcon().glow( false );
				self.activeIcon()._path.attr( { fill: "90-#888-#CCC", stroke: "none" } );
			}

			return self;
		},

		enable: function () {
			var self = this;

			self._isEnabled = true;

			return self;
		},

		disable: function () {
			var self = this;

			self._isEnabled = false;

			return self;
		},

		select: function () {
			var self = this;

			self._isSelected = true;
			self.highlight( true, true );

			return self;
		},

		deselect: function () {
			var self = this;

			self._isSelected = false;
			self.highlight( false, false );

			return self;
		}
	};

	function Button ( toolBar, name, attr ) {
		return Object.create( _button ).init( toolBar, name, attr );
	}

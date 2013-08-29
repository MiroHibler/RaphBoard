	var toolBarContainer			= "r_b-toolbar";
	var canvasContainer				= "r_b-paper";
	var attributesPanelContainer	= "r_b-overlay";

	var Board = {
		init: function ( options, elem ) {
			var self = this;

			self._version = "<%= meta.version %>";
			self._UUID = Raphael.createUUID();

			self.elem = elem;
			self.$elem = $( elem );

			// Options
			if ( options ) {
				if ( options.strokeWidth ) {
					switch( options.strokeWidth ) {
						case "medium":
							options.strokeWidth = 4;
							break;
						case "big":
							options.strokeWidth = 8;
							break;
						case "huge":
							options.strokeWidth = 12;
							break;
						default:
							options.strokeWidth = 1;
					}
				}
			}
			self.options = $.extend( {}, $.fn.RaphBoard.options, options );

			// Events
			self.eventHandlers = {
				// Return false to prevent default execution
				before_mode_change		: null,		// called right before internal mode change procedure starts
				after_mode_change		: null,		// called right after internal mode change procedure completes
				before_start			: null,		// called right before internal drawing procedure starts
				after_start				: null,		// called right after internal drawing procedure completes
				before_change			: null,		// called right before internal drawing change procedure starts
				after_change			: null,		// called right after internal drawing change procedure completes
				before_end				: null,		// called right before internal drawing procedure starts
				after_end				: null,		// called right after internal drawing procedure completes
				before_cut				: null,		// called right before internal cut procedure starts
				after_cut				: null,		// called right after internal cut procedure completes
				before_undo				: null,		// called right before internal undo procedure starts
				after_undo				: null,		// called right after internal undo procedure completes
				before_redo				: null,		// called right before internal redo procedure starts
				after_redo				: null,		// called right after internal redo procedure completes
				before_clear			: null,		// called right before internal clearing procedure starts
				after_clear				: null		// called right after internal clearing procedure completes
			}

			// The Toolbar
			// TODO: Move to external DIV and CSS
			if ( self.options.showToolBar ) {
				self.$elem.append( "<div id='" + toolBarContainer + "'/>" );
				self.toolBar = ToolBar( self, toolBarContainer );
			}

			// The Canvas
			self.$elem.append( "<div id='" + canvasContainer + "'/>" );
			self.canvas = Canvas( self, canvasContainer );
			self.paper = self.canvas.paper();

			self.shapes = [];	// list of all drawn objects
			self.undoBuffer = [];	// undo buffer, contains all actions
			self.redoBuffer = [];	// redo buffer, contains all undone actions

			self.mode( "pen" );	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"

			// The Attributes Panel
			self.$elem.append( "<div id='" + attributesPanelContainer + "'/>" );
			self.attributesPanel = AttributesPanel( self, attributesPanelContainer );

			// Register Mouse Events
			self.mouseDownX = 0;
			self.mouseDownY = 0;

			self.canvas._container.mouseenter( OnMouseEnter );

			return self;
		},	// init:

		// Properties
		version: function () {
			return this._version;
		},

		UUID: function () {
			return this._UUID;
		},

		left: function () {
			return this.$elem.offset().left;
		},

		top: function () {
			return this.$elem.offset().top;
		},

		width: function () {
			return this.$elem.width();
		},

		height: function () {
			return this.$elem.height();
		},

		isEnabled: function () {
			return this.options.editable;
		},

		canUndo: function () {
			return ( this.undoBuffer.length > 0 );
		},

		canRedo: function () {
			return ( this.redoBuffer.length > 0 );
		},

		// Event handling methods
		on: function ( eventType, callback ) {
			self = this;

			$.each( self.eventHandlers, function ( k, v ) {
				if ( k = eventType ) {
					self.eventHandlers[ eventType ] = callback;
					return false;
				}
			});

			return self;
		},

		off: function ( eventType ) {
			self = this;

			$.each( self.eventHandlers, function ( k, v ) {
				if ( k = eventType ) {
					self.eventHandlers[ eventType ] = null;
					return false;
				}
			});

			return self;
		},

		// Editing methods
		enable: function () {
			var self = this;

			self.options.editable = true;
			if ( self.options.showToolBar ) {
				self.toolBar.enable();
			}

			return self;
		},

		disable: function () {
			var self = this;

			self.canvas._container.unbind( "mouseenter" );
			self.elem.removeClasses( "cursor-*" );
			self.options.editable = false;
			if ( self.options.showToolBar ) {
				self.toolBar.disable();
			}

			return self;
		},

		mode: function ( mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
			var self = this;

			if ( mode !== undefined ) {
				if ( EventHandler( self, "before_mode_change" ) ) {
					ResetModeEvents( self );
					self._mode = mode;
					if ( self.options.editable ) {
						if ( self.options.showToolBar ) {
							self.toolBar.deselectAll();
							self.toolBar.button( self._mode ).select();
						}
					}
					SetModeEvents( self );
				}
				EventHandler( self, "after_mode_change" );
			}

			return self._mode;
		},

		element: function ( id ) {
			var self = this;
			var shape;

			$.each( self.shapes, function( k, v ) {
				if ( v.id == id ) {
					shape = v;
					return false;
				}
			} );

			return shape;
		},

		move: function ( id, x, y ) {
			var self = this;
			var shape = self.element( id );
			var animation = self.options.animation;

			if ( shape ) {
				InitDragStart( shape );
				var dx = x - shape.ox;
				var dy = y - shape.oy;
				if ( animation ) {
					switch( shape.type ) {
						case "path":
							var animationParams = {
								transform: "t" + ( parseInt( shape.ox ) + parseInt( dx ) ) +
											"," + ( parseInt( shape.oy ) + parseInt( dy ) )
							}
							break;
						case "circle":
						case "ellipse":
							var animationParams = {
								cx: shape.ox + dx,
								cy: shape.oy + dy
							};
							break;
						default:
							var animationParams = {
								x: shape.ox + dx,
								y: shape.oy + dy
							};
					}
					shape.animate( Raphael.animation(
						$.extend( {}, animation.params, animationParams ),
						animation.ms,
						animation.easing
					));
				}
				UpdateDrag( self, shape, dx, dy );
				PushToBuffer( self, "move", shape );
			}

			return shape;
		},

		line: function ( x, y, dx, dy ) {
			var self = this;

			if ( !( dx == 0 && dy == 0 ) ) {
				var shape = StartLine( self, x, y );
				shape.attr( "path", "M" + x + "," + y +
									"L" + dx + "," + dy );
				self.shapes.push( shape );
				PushToBuffer( self, "line", shape );

				return shape;
			}

			return null;
		},

		arrow: function ( x, y, dx, dy ) {
			var self = this;

			if ( !( dx == 0 && dy == 0 ) ) {
				var shape = StartLine( self, x, y );
				shape.attr( "path", "M" + x + "," + y +
									"L" + dx + "," + dy );
				self.shapes.push( shape );
				PushToBuffer( self, "arrow", shape );

				return shape;
			}

			return null;
		},

		circle: function ( x, y, r ) {
			var self = this;

			if ( r != 0 ) {
				var shape = StartCircle( self, x, y );
				shape.attr( "r", r );
				self.shapes.push( shape );
				PushToBuffer( self, "circle", shape );

				return shape;
			}

			return null;
		},

		ellipse: function ( x, y, rx, ry ) {
			var self = this;

			if ( !( rx == 0 && ry == 0 ) ) {
				var shape = StartEllipse( self, x, y );
				shape.attr( "rx", rx )
					.attr( "ry", ry );
				self.shapes.push( shape );
				PushToBuffer( self, "ellipse", shape );

				return shape;
			}

			return null;
		},

		rect: function ( x, y, dx, dy ) {
			var self = this;

			if ( !( dx == 0 && dy == 0 ) ) {
				var shape = StartRectangle( self, x, y );
				shape.attr( "dx", dx )
					.attr( "dy", dy );
				self.shapes.push( shape );
				PushToBuffer( self, "rect", shape );

				return shape;
			}

			return null;
		},

		text: function ( x, y, text, size ) {
			var self = this;

			if ( text && text != "" ) {
				if ( size && !isNaN( size ) ) {
					var fontSize = Math.abs( parseInt( size ) );
					self.options.fontSize = ( fontSize == 0 ) ? 12 : fontSize;
				}
				var shape = DrawText( self, x, y, text );
				self.shapes.push( shape );
				PushToBuffer( self, "text", shape );

				/***********************************************************/
				// EXCEPTIONALLY IN THIS CASE WE'RE CALLING EVENT HANDLER! //
				/***********************************************************/
				EventHandler( self, "after_end" );
				return shape;
			}

			return null;
		},

		cut: function ( id ) {
			var self = this;
			var shapes = self.shapes;
			var isCut = false;

			if ( shapes.length > 0 ) {
				for ( var i=0;i<shapes.length;i++ ) {
					if ( shapes[i].id == id ) {
						PushToBuffer( self, "cut", shapes[i] );
						shapes[i].remove();
						shapes.splice( i, 1 );
						isCut = true;
						break;
					}
				}
			}

			return isCut;
		},

		toJSON: function ( id, callback ) {
			var data;
			var elements = [];
			var paper = this.paper;

			for ( var el=paper.bottom;el!=null;el=el.next ) {
				data = callback ? callback( el, new Object ) : new Object;

				if ( data ) elements.push({
					data		: data,
					type		: el.type,
					attrs		: el.attrs,
					transform	: el.matrix.toTransformString(),
					id			: el.id
				});
			}

			return JSON.stringify( elements );
		},

		fromJSON: function ( elements, callback ) {
			var self = this;
			var json;

			if ( typeof elements === "string" ) {
				json = JSON.parse( elements );
			} else {
				json = elements;
			}

			for ( var i in json ) {
				if ( json.hasOwnProperty( i ) ) {
					var shape = Draw( self, json[i].shape );

					if ( callback ) callback( shape );

					PushToBuffer( self, json[i].command, shape );
				}
			}
		},

		undo: function () {
			var self = this;

			if ( self.canUndo() ) {
				var shapes = self.shapes;
				var undoBuffer = self.undoBuffer;
				var paper = self.paper;
				var element = undoBuffer.pop();
				var mode = element.command;

				ResetModeEvents( self );
				switch( mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut|clear"
					case "move":
						var prev = null;
						for ( var i=undoBuffer.length-1;i>=0;i-- ) {
							prev = undoBuffer[i].shape;
							if ( prev.id == element.shape.id ) {
								var x, y;
								switch( prev.type ) {
									case 'path':
										var t = prev.transform.replace( "t", "" ).split( "," );
										x = t[0] ? t[0] : 0;
										y = t[1] ? t[1] : 0;
										break;
									case 'circle':
									case 'ellipse':
										x = prev.attrs.cx;
										y = prev.attrs.cy;
										break;
									default:
										x = prev.attrs.x;
										y = prev.attrs.y;
								}
								self.move( prev.id, x, y );
								// self.move() pushes shape to undo buffer,
								// so we fix that
								self.undoBuffer.pop();
								break;
							}
						}
						break;
					case "cut":
						Draw( self, element.shape );
						break;
					case "clear":
						for ( var i=0;i<element.shapes.length;i++ ) {
							Draw( self, element.shapes[i] );
						}
						break;
					default:	// undo draw shape
						shapes.pop().remove();
				}
				self.redoBuffer.push( element );
				switch( mode ) {
					case "undo":
					case "redo":
					case "clear":
						break;
					default:
						self.mode( mode );
						SetModeEvents( self );
				}
			}
			self.indicateUndoRedo();

			return self;
		},

		clearUndo: function () {
			var self = this;

			self.undoBuffer = [];
			self.indicateUndoRedo();

			return self;
		},

		redo: function () {
			var self = this;

			if ( self.canRedo() ) {
				var shapes = self.shapes;
				var redoBuffer = self.redoBuffer;
				var paper = self.paper;
				var element = redoBuffer.pop();
				var mode = element.command;
				var shape = element.shape;

				ResetModeEvents( self );
				switch( mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
					case "move":
						var x, y;
						switch( shape.type ) {
							case 'path':
								var t = shape.transform.replace( "t", "" ).split( "," );
								x = t[0] ? t[0] : 0;
								y = t[1] ? t[1] : 0;
								break;
							case 'circle':
							case 'ellipse':
								x = shape.attrs.cx;
								y = shape.attrs.cy;
								break;
							default:
								x = shape.attrs.x;
								y = shape.attrs.y;
						}
						self.move( shape.id, x, y );
						break;
					case "cut":
						self.cut( shape.id );
						break;
					case "clear":
						self.clear();
						break;
					default:	// undo draw shape
						Draw( self, shape );
						self.undoBuffer.push( element );
				}
				switch( mode ) {
					case "undo":
					case "redo":
					case "clear":
						break;
					default:
						self.mode( mode );
						SetModeEvents( self );
				}
			}
			self.indicateUndoRedo();

			return self;
		},

		clearRedo: function () {
			var self = this;

			self.redoBuffer = [];
			self.indicateUndoRedo();

			return self;
		},

		indicateUndoRedo: function () {
			var self = this;

			if ( self.options.showToolBar ) {
				var undoButton = self.toolBar.button( "undo" );
				var redoButton = self.toolBar.button( "redo" );

				if ( self.canUndo() ) {
					undoButton.activeIcon()._path.attr( { fill: "90-#BBF1B2-#5D9E54", stroke: "none" } );
					undoButton.enable();
				} else {
					undoButton.activeIcon()._path.attr( { fill: "90-#888-#CCC", stroke: "none" } );
					undoButton.disable();
				}

				if ( self.canRedo() ) {
					redoButton.activeIcon()._path.attr( { fill: "90-#BBF1B2-#5D9E54", stroke: "none" } );
					redoButton.enable();
				} else {
					redoButton.activeIcon()._path.attr( { fill: "90-#888-#CCC", stroke: "none" } );
					redoButton.disable();
				}
			}

			return self;
		},

		clear: function () {
			var self = this;

			if ( self.shapes.length > 0 ) {
				ResetModeEvents( self );
				var shapes = [];
				for ( var i=0;i<self.shapes.length;i++ ) {
					shapes.push( CloneShape( self.shapes[i] ) );
				}
				self.undoBuffer.push({
					command	: "clear",
					shapes	: shapes
				} );
				self.shapes = [];
				self.paper.clear();
			}
			self.clearRedo();

			return self;
		},

		flush: function () {
			self = this;

			ResetModeEvents( self );
			self.shapes = [];
			self.paper.clear();
			self.clearUndo();
			self.clearRedo();

			return self;
		}
	};

	$.fn.RaphBoard = function ( options, argument ) {
		var board = $( this ).data( "RaphBoard" );

		if ( board ) {
			if ( options !== undefined ) {
				if ( typeof options === "object" ) {
					// Set options
					board.options = $.extend( {}, $.fn.RaphBoard.options, options );
				} else if ( typeof options === "string" ) {
					// Set options
					board.options = $.extend( {}, $.fn.RaphBoard.options, { options: argument } );
				}

				return board;
			}
		} else {
			board = Object.create( Board );

			board.init( options, this );

			$.data( this.get( 0 ), "RaphBoard", board );
		}

		return board;
	};

	$.fn.RaphBoard.options = {
		/*
		// See http://raphaeljs.com/reference.html#Element.attr for more info
		*/
		editable		: true,										// allow editing
		showToolBar		: true,										// show/hide toolbar
		fill			: "#FFF",									// white
		stroke			: "#FFF",									// white
		strokeWidth		: 1,										// "small (1)|medium (4)|big (8)|huge (12)""
		lineCap			: "round",									// “butt|square|round”
		lineJoin		: "round",									// “bevel|round|miter”
		arrowEnd		: "classic-medium-medium",					// "classic|block|open|oval|diamond|none[-wide|narrow|midium[-long|short|midium]]"
		fontSize		: 12,
		textAnchor		: "start",									// "start|middle|right"
		animation		: { params: {}, ms: 100, easing: "<>" }		// Default animation to be applied to "move|undo|redo"
																	// set to null if no animation is desired
	};

	$.fn.removeClasses = function ( mask ) {
		return this.removeClass( function ( index, cls ) {
			var re = mask.replace( /\*/g, '\\S+' );
			return ( cls.match( new RegExp( '\\b' + re + '', 'g' )) || [] ).join( ' ' );
		});
	};

	// Editing Events Functions
	function SetModeEvents( self ) {
		if ( self.options.editable ) {
			var shapes = self.shapes;

			for ( var i=0;i<shapes.length;i++ ) {
				var shape = shapes[i];
				switch( self._mode ) {
					case "move":
						ResetShapeEvents( shape );
						shape.drag( OnDrag, OnDragStart, OnDragEnd );
						shape.attr( { cursor: "move" } );
						break;
					case "text":
						ResetShapeEvents( shape );
						shape.attr( { cursor: "text" } );
						break;
					case "cut":
						ResetShapeEvents( shape );
						shape.hover( OnCutIn, OnCutOut );
						shape.attr( { cursor: "pointer" } );
						break;
					case "pen":
					case "line":
					case "arrow":
					case "circle":
					case "ellipse":
					case "rect":
						ResetShapeEvents( shape );
						shape.attr( { cursor: "crosshair" } );
						break;
					default:
						// Ignore everything else
				}
			}
		}
	}

	function ResetShapeEvents( shape ) {
		shape.unhover( OnCutIn, OnCutOut );
		shape.undrag();
	}

	function ResetModeEvents( self ) {
		if ( self.options.editable ) {
			var shapes = self.shapes;

			for ( var i=0;i<shapes.length;i++ ) {
				var shape = shapes[i];
				ResetShapeEvents( shape );
				shape.attr( { cursor: "crosshair" } );
			}
		}
	}

	function OnCutIn() {
		var elem = $( this.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );

		this.mousedown( OnCut );

		SetCutAttributes( self, this );
	}

	function OnCut() {
		var elem = $( this.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );

		this.unmousedown( OnCut )
			.unhover( OnCutIn, OnCutOut );

		if ( EventHandler( self, "before_cut" ) ) {
			ResetCutAttributes( self, this );
			self.cut( this.id );
		}
		EventHandler( self, "after_cut" );
	}

	function OnCutOut() {
		var elem = $( this.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );

		this.unmousedown( OnCut );

		ResetCutAttributes( self, this );
	}

	function SetCutAttributes( self, element ) {
		self.cutStroke = element.attr( "stroke" );
		self.cutStrokeWidth = element.attr( "stroke-width" );
		self.cutStrokeDash = element.attr( "stroke-dasharray" );
		if ( element.type != "path" && element.attr( "fill" ) != "none" ) {
			self.cutFill = element.attr( "fill" );
			self.cutOpacity = element.attr( "fill-opacity" );
			element.attr( { "fill": "#F00", "fill-opacity": 1 } );
		}
		element.attr( {
			"stroke"			: "#F00",
			"stroke-width"		: self.cutStrokeWidth < 4 ? 4 : self.cutStrokeWidth,
			"stroke-dasharray"	: "-"
		});
		if ( element.type != "path" && element.attr( "fill" ) != "none" ) element.animate( { "fill-opacity": 0.5 }, 100 ); 
	}

	function ResetCutAttributes( self, element ) {
		if ( element.type != "path" && element.attr( "fill" ) != "none" ) {
			element.animate( { "fill-opacity": self.cutOpacity }, 100 ).attr( {
				"fill"			: self.cutFill,
				"fill-opacity"	: self.cutOpacity
			});
		}
		element.attr( {
			"stroke"			: self.cutStroke,
			"stroke-width"		: self.cutStrokeWidth,
			"stroke-dasharray"	: self.cutStrokeDash
		}); 
	}

	function OnDragStart( x, y, e ) {
		var elem = $( this.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );
		var shape = this;

		if ( EventHandler( self, "before_start" ) ) {
			InitDragStart( shape );
			self.dragStroke = shape.attr( "stroke" );
			self.dragOpacity = shape.attr( "fill-opacity" );
			self.dragStrokeWidth = shape.attr( "stroke-width" );
			self.dragStrokeDash = shape.attr( "stroke-dasharray" );
			shape.attr( {
				"stroke"			: "#FFF",
				"stroke-width"		: 1,
				"stroke-dasharray"	: "-"
			});
			shape.animate( { "fill-opacity": 0 }, 100 );
		}
		EventHandler( self, "after_start" ); 
	}

	function InitDragStart( shape ) {
		switch( shape.type ) {	// "path|circle|ellipse|rect|text"
			case "path":
				var t = shape.matrix.toTransformString().replace( "t", "" ).split( "," );
				shape.ox = t[0] ? t[0] : 0;
				shape.oy = t[1] ? t[1] : 0;
				break;
			case "circle":
			case "ellipse":
				shape.ox = shape.attr( "cx" );
				shape.oy = shape.attr( "cy" );
				break;
			default:
				shape.ox = shape.attr( "x" );
				shape.oy = shape.attr( "y" );
		}
	}

	function OnDrag( dx, dy, x, y, e ) {
		var elem = $( this.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );
		var shape = this;

		if ( EventHandler( self, "before_change" ) ) {
			UpdateDrag( self, shape, dx, dy );
		}
		EventHandler( self, "after_change" );
	}

	function UpdateDrag( self, shape, dx, dy ) {
		switch( shape.type ) {
			case "path":
				shape.transform( "t" +
					( parseInt( shape.ox ) + parseInt( dx ) ) + "," +
					( parseInt( shape.oy ) + parseInt( dy ) )
				);
				break;
			case "circle":
			case "ellipse":
				shape.attr( { cx: shape.ox + dx, cy: shape.oy + dy } );
				break;
			default:
				shape.attr( { x: shape.ox + dx, y: shape.oy + dy } );
		}
		self.paper.safari();
	}

	function OnDragEnd( e ) {
		var elem = $( this.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );
		var shape = this;

		if ( EventHandler( self, "before_end" ) ) {
			shape.animate( { "fill-opacity": self.dragOpacity }, 100 );
			shape.attr( {
				"stroke"			: self.dragStroke,
				"stroke-width"		: self.dragStrokeWidth,
				"stroke-dasharray"	: self.dragStrokeDash
			});
			PushToBuffer( self, "move", shape );
		}
		EventHandler( self, "after_end" ); 
	}

	function InitBoardEvents( elem ) {
		var self = elem.parent().data( "RaphBoard" );
		var shapes = self.shapes;

		switch( self._mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
			case "move":
			case "cut":
				// elem.attr( "style", "cursor: pointer;" );
				elem.css( { cursor: "pointer" } );
				break;
			case "text":
				// elem.attr( "style", "cursor: text;" );
				elem.css( { cursor: "text" } );
				break;
			default:
				// elem.attr( "style", "cursor: crosshair;" );
				elem.css( { cursor: "crosshair" } );
		}

		elem.unbind( "mouseenter" )
			.mouseleave( OnMouseLeave );
		if ( self._mode != "move" && self._mode != "cut" ) elem.mousedown( OnMouseDown );
	}

	function EventHandler( self, eventType ) {
		var handler = self.eventHandlers[ eventType ];

		if ( handler ) {
			return handler( self );
		} else {
			return true;
		}
	}

	function OnMouseEnter( e ) {
		var elem = $( e.delegateTarget );
		var self = elem.parent().data( "RaphBoard" );

		if ( self.options.editable ) {
			InitBoardEvents( elem );
		}
	}

	function OnMouseDown( e ) {
		// Prevent text edit cursor while dragging in webkit browsers
		e.originalEvent.preventDefault();
		var elem = $( e.delegateTarget );
		var self = elem.parent().data( "RaphBoard" );

		self.mouseDownX = e.pageX - self.left();
		self.mouseDownY = e.pageY - self.top() - ( self.options.showToolBar ? self.toolBar.height() : 0 );

		if ( EventHandler( self, "before_start" ) ) {
			var shapes = self.shapes;
			switch( self._mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
				case "pen":
					shapes.push( StartLine( self, self.mouseDownX, self.mouseDownY ) );
					break;
				case "line":
					shapes.push( StartLine( self, self.mouseDownX, self.mouseDownY ) );
					break;
				case "arrow":
					shapes.push( StartLine( self, self.mouseDownX, self.mouseDownY ).attr( { "arrow-end": self.options.arrowEnd } ) );
					break;
				case "circle":
					shapes.push( StartCircle( self, self.mouseDownX, self.mouseDownY ) );
					break;
				case "ellipse":
					shapes.push( StartEllipse( self, self.mouseDownX, self.mouseDownY ) );
					break;
				case "rect":
					shapes.push( StartRectangle( self, self.mouseDownX, self.mouseDownY ) );
					break;
				case "text":
					GetText( self, self.mouseDownX, self.mouseDownY );
					break;
				default: //	"move"
			}
		}

		EventHandler( self, "after_start" );

		if ( self._mode != "move" && self._mode != "text" && self._mode != "cut" ) {
			elem.mousemove( OnMouseMove )
				.mouseup( OnMouseUp );
		}
	}

	function OnMouseMove( e ) {
		var elem = $( e.delegateTarget );
		var self = elem.parent().data( "RaphBoard" );

		if ( EventHandler( self, "before_change" ) ) {
			var shape = self.shapes[ self.shapes.length - 1 ];

			var moveX = e.pageX - self.left();
			var moveY = e.pageY - self.top() - ( self.options.showToolBar ? self.toolBar.height() : 0 );

			var width = moveX - self.mouseDownX;
			var height = moveY - self.mouseDownY;

			switch( self._mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
				case "pen":
					shape.attr( "path", shape.attr( "path" ) + "L" + moveX + "," + moveY );
					break;
				case "line":
					shape.attr( "path", "M" + self.mouseDownX + " " + self.mouseDownY + "L" + moveX + "," + moveY );
					break;
				case "arrow":
					shape.attr( "path", "M" + self.mouseDownX + " " + self.mouseDownY + "L" + moveX + "," + moveY );
					break;
				case "circle":
					shape.attr( "r", Math.max( Math.abs( width ), Math.abs( height ) ) );
					break;
				case "ellipse":
					shape.attr( "rx", Math.abs( width ) )
						 .attr( "ry", Math.abs( height ) );
					break;
				case "rect":
					if ( width < 0 ) shape.attr( "x", moveX );
					if ( height < 0 ) shape.attr( "y", moveY );
					shape.attr( "width", Math.abs( width ) )
						 .attr( "height", Math.abs( height ) );
					break;
				case "text":
				  	// No resizing of text, just ignore the event
					break;
				default: //	"move"
					// Just moving the element
			}
		}
		EventHandler( self, "after_change" );
	}

	function OnMouseUp( e ) {
		var elem = $( e.delegateTarget );
		var self = elem.parent().data( "RaphBoard" );

		if ( EventHandler( self, "before_end" ) ) {
			if ( self._mode != "move" && self._mode != "text" && self._mode != "cut" ) {
				var shapes = self.shapes;
				elem.unbind( "mouseup" )
					.unbind( "mousemove" );
				shape = shapes.pop();
				var BBox = shape.getBBox();

				if ( BBox.width == 0 && BBox.height == 0 ) {
					shape.remove();
				} else {
					shapes.push( shape );
					PushToBuffer( self, self._mode, shape );
				}
			}
		}
		EventHandler( self, "after_end" );
	}

	function OnMouseLeave( e ) {
		var elem = $( e.delegateTarget );

		elem.unbind( "mouseleave" )
			.removeClass( "cursor-*" );
		var self = elem.parent().data( "RaphBoard" );
		if ( self._mode != "move" && self._mode != "cut" ) elem.unbind( "mousedown" );

		elem.mouseenter( OnMouseEnter );
	}

	function PushToBuffer( self, mode, shape ) {
		var element = {
			command		: mode,
			shape		: CloneShape( shape )
		};

		self.undoBuffer.push( element );
		if ( mode != "cut" && mode != "clear" && mode != "move" ) self.clearRedo();
	}

	function CloneShape( shape ) {
		return {
			id			: shape.id,
			type		: shape.type,
			attrs		: SerializeAttributes( shape ),
			transform	: shape.matrix.toTransformString()
		}
	}

	function SerializeAttributes( shape ) {
		var attrs = new Object;

		$.each( shape.attrs, function ( key, value ) {
			attrs[ key ] = value;
		});

		return attrs; 
	}

	function StartLine( self, x1, y1 ) {
		var shape = self.paper.path( "M" + x1 + " " + y1 );

		if ( self.options.strokeWidth == 0 ) {
			self.options.stroke = self.options.fill;
			self.options.strokeWidth = 1;
		}
		shape.attr({
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: self.options.lineJoin
		});

		return shape; 
	}

	function StartCircle( self, x, y ) {
		var shape = self.paper.circle( x, y, 0 );

		shape.attr({
			"fill"				: self.options.fill,
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: self.options.lineJoin
		});

		return shape; 
	}

	function StartEllipse( self, x, y ) {
		var shape = self.paper.ellipse( x, y, 0, 0 );

		shape.attr({
			"fill"				: self.options.fill,
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: self.options.lineJoin
		});

		return shape; 
	}

	function StartRectangle( self, x, y ) {
		var shape = self.paper.rect( x, y, 0, 0 );

		shape.attr({
			"fill"				: self.options.fill,
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: "miter"
		});

		return shape; 
	}

	function GetText( self, x, y ) {
		text = prompt(
			"Please enter text:\n" +
			"You can specify text size by prepending\n" +
			"text size as number enclosed in {}",
			"{" + self.options.fontSize + "}Write some text here..."
		);

		// Expects text in format "{fontSize}text"; "{fontSize}" is optional
		if ( text && text != "" ) {
			var subText = text;
			if ( text[0] == "{" ) {
				var size = text.substring( 1, text.indexOf( "}" ) );
				if ( size != "" && !isNaN( size ) ) {
					var fontSize = Math.abs( parseInt( size ) );
					self.options.fontSize = ( fontSize == 0 ) ? 12 : fontSize;
					subText = text.substring( text.indexOf( "}" ) + 1 );
				}
			}
			if ( subText != "" ) {
				var shape = DrawText( self, x, y, subText );
				self.shapes.push( shape );
				PushToBuffer( self, "text", shape );

				return shape;
			}
		}
	}

	function DrawText( self, x, y, text ) {
		var shape = self.paper.text( x, y, text );

		shape.attr({
			"fill"				: self.options.fill,
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: self.options.lineJoin,
			"font-size"			: self.options.fontSize,
			"text-anchor"		: self.options.textAnchor 
		});

		return shape; 
	}

	function Draw( self, element ) {
		var shape;

		switch( element.type ) {		// "pen|line|arrow|circle|ellipse|rect|text"
			case "circle":
				shape = self.paper.circle( 0, 0, 0 );
				break;
			case "ellipse":
				shape = self.paper.ellipse( 0, 0, 0, 0 );
				break;
			case "rect":
				shape = self.paper.rect( 0, 0, 0, 0 );
				break;
			case "text":
				shape = self.paper.text( 0, 0, "" );
				break;
			default:				// "pen|line|arrow" and other yet unknown
				shape = self.paper.path( "" );
		}
		shape.id = element.id;
		shape.attr( element.attrs );
		shape.transform( element.transform );

		var id;
		for ( var i=self.shapes.length-1;i>=0;i-- ) {
			if ( shape.id > self.shapes[i].id ) {
				id = self.shapes[i].id;
				break;
			}
		}
		if ( id ) {
			shape.insertAfter( self.paper.getById( id ) );
			self.shapes.splice( i + 1, 0, shape );
		} else {
			self.shapes.push( shape );
		}

		return shape;
	}

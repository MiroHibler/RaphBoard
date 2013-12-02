/*! ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ */
/*! │ RaphBoard v1.1.0 - Cross-browser drawing board based on Raphaël                             │ */
/*! ├─────────────────────────────────────────────────────────────────────────────────────────────┤ */
/*! │ Copyright © 2012-2013 Miroslav Hibler (http://MiroHibler.github.com/RaphBoard/)             │ */
/*! ├─────────────────────────────────────────────────────────────────────────────────────────────┤ */
/*! │ Licensed under the MIT license (http://opensource.org/licenses/mit-license.php).            │ */
/*! ├─────────────────────────────────────────────────────────────────────────────────────────────┤ */
/*! │ Requirements: jQuery  (http://jquery.com)                                                   │ */
/*! |               Raphaël (http://raphaeljs.com)                                                │ */
/*! │               Raphaël FreeTransform (http://alias.io/raphael/free_transform/)               │ */
/*! └─────────────────────────────────────────────────────────────────────────────────────────────┘ */

// Object Creation Utility
;if ( typeof Object.create !== "function" ) {
	Object.create = function ( obj ) {
		function F() {};
		F.prototype = obj;
		return new F();
	};
}

( function ( $, window, document, undefined ) {

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

	var Board = {
		init: function ( options, elem ) {
			var self = this;

			self._version = "1.1.0";
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
				after_start				: null,		// called right after internal drawing procedure starts
				before_change			: null,		// called right before internal drawing change procedure starts
				after_change			: null,		// called right after internal drawing change procedure completes
				before_end				: null,		// called right before internal drawing procedure completes
				after_end				: null,		// called right after internal drawing procedure completes
				before_select			: null,		// called right before internal select procedure starts
				after_select			: null,		// called right after internal select procedure completes
				before_deselect			: null,		// called right before internal deselect procedure starts
				after_deselect			: null,		// called right after internal deselect procedure completes
				before_show_handles		: null,		// called right before internal show_handles procedure starts
				after_show_handles		: null,		// called right after internal hide_handles procedure starts
				before_hide_handles		: null,		// called right before internal hide_handles procedure starts
				after_hide_handles		: null,		// called right after internal show_handles procedure starts
				before_move				: null,		// called right before internal move procedure starts
				after_move				: null,		// called right after internal move procedure completes
				before_cut				: null,		// called right before internal cut procedure starts
				after_cut				: null,		// called right after internal cut procedure completes
				before_undo				: null,		// called right before internal undo procedure starts
				after_undo				: null,		// called right after internal undo procedure completes
				before_redo				: null,		// called right before internal redo procedure starts
				after_redo				: null,		// called right after internal redo procedure completes
				before_clear			: null,		// called right before internal clearing procedure starts
				after_clear				: null,		// called right after internal clearing procedure completes
				updateUndoRedo			: null		// called upon each undo/redo operation to update GUI
			}

			// The Toolbar
			// Only if included!
			if ( typeof _toolBar !== 'undefined' && _toolBar != null ) {
				var toolBarContainer = "r_b-toolbar";
				self.$elem.append( "<div id='" + toolBarContainer + "'/>" );
				self.toolBar = ToolBar( self, toolBarContainer );

				// The Attributes Panel
				var attributesPanelContainer = "r_b-overlay";
				self.$elem.append( "<div id='" + attributesPanelContainer + "'/>" );
				self.attributesPanel = AttributesPanel( self, attributesPanelContainer );
			}

			// The Canvas
			var canvasContainer = "r_b-paper";
			self.$elem.append( "<div id='" + canvasContainer + "'/>" );
			self.canvas = Canvas( self, canvasContainer );
			self.paper = self.canvas.paper();

			// TODO: REMOVE self.elements ALTOGETHER!
			self.elements = [];		// list of all drawn objects
			self.undoBuffer = [];	// undo buffer, contains all actions
			self.redoBuffer = [];	// redo buffer, contains all undone actions

			self.mode( "pen" );	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"

			// Register Mouse Events
			self.mouseDownX = self.mouseDownY = self.mouseUpX = self.mouseUpY = 0;

			self.canvas._container.mouseenter( OnMouseEnter );

			return self;
		},	// init:

		// Properties
		container: function () {
			return this.elem;
		},

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

		// Attributes Methods
		getAttribute: function ( name ) {
			var o = this.options;

			if ( name == "align" ) {
				return o[ "textAnchor" ];
			} else {
				return o[ name ];
			}
		},

		toggleAttribute: function ( name ) {
			var o = this.options;

			switch( name ) {
				case "editable":
					o[ "editable" ] = !o[ "editable" ];
					break;
				case "bold":
					o[ 'fontWeight' ] = o[ 'fontWeight' ] == 'bold' ? 'normal' : 'bold';
					break;
				case "italic":
					o[ 'fontStyle' ] = o[ 'fontStyle' ] == 'italic' ? 'normal' : 'italic';
					break;
				case "underline":
					o[ 'textDecoration' ] = o[ 'textDecoration' ] == 'underline' ? 'none' : 'underline';
					break;
				case "strike":
					o[ 'textDecoration' ] = o[ 'textDecoration' ] == 'line-through' ? 'none' : 'line-through';
					break;
				default:
					// Ignore
			}

			return o[ name ];
		},

		setAttribute: function ( name, attribute ) {
			var o = this.options;

			if ( name == "align" ) {
				switch( attribute ) {
					case "left":
						o[ "textAnchor" ] = "start";
						break;
					case "center":
						o[ "textAnchor" ] = "middle";
						break;
					case "right":
						o[ "textAnchor" ] = "end";
						break;
					case "justify":
						// TODO: Implement Text Alignment: Justify
						o[ "textAnchor" ] = "middle";
						break;
					default:
						o[ "textAnchor" ] = "start";
				}
			} else {
				o[ name ] = attribute;
			}

			return o[ name ];
		},

		// Event handling methods
		on: function ( eventType, callback ) {
			var self = this;

			$.each( self.eventHandlers, function ( k, v ) {
				if ( k = eventType ) {
					self.eventHandlers[ eventType ] = callback;
					return false;
				}
			});

			return self;
		},

		off: function ( eventType ) {
			var self = this;

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
			if ( self.toolBar ) {
				self.toolBar.enable();
			}

			return self;
		},

		disable: function () {
			var self = this;

			self.canvas._container.unbind( "mouseenter" );
			self.elem.removeClasses( "cursor-*" );
			self.options.editable = false;
			if ( self.toolBar ) {
				self.toolBar.disable();
			}

			return self;
		},

		mode: function ( mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
			var self = this;

			if ( mode !== undefined ) {
				if ( EventHandler( self, "before_mode_change" ) ) {
					ClearModeEvents( self );
					self._mode = mode;
					if ( self.options.editable ) {
						if ( self.toolBar ) {
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
			var element;

			$.each( self.elements, function( k, v ) {
				if ( v.id == id ) {
					element = v;
					return false;	// We've reached the goal, exit $.each
				}
			});

			return element;
		},

		initMove: function ( id, hideHandles ) {
			var self = this;
			var element = self.element( id );

			if ( element && element.freeTransform ) {
				var ft = element.freeTransform;
			} else {
				var ft = InitMove( self, element );
			}
			if ( hideHandles ) {
				ft.hideHandles({ undrag: false });
			} else {
				ft.showHandles();
			}

			return element;
		},

		select: function ( id ) {
			var self = this;

			return self.initMove( id );
		},

		deselect: function ( id, noUnplug ) {
			var self = this;
			var element = self.element( id );

			if ( element ) {
				ClearElementEvents( element, noUnplug );
			}

			return element;
		},

		showHandles: function ( id ) {
			var self = this;
			var element = self.element( id );

			if ( element ) {
				return ShowHandles( self, element );
			}
		},

		hideHandles: function ( id ) {
			var self = this;
			var element = self.element( id );

			if ( element ) {
				return HideHandles( self, element );
			}
		},

		move: function ( id, x, y ) {
			// TODO: Rewrite to use freeTransform
			var self = this;
			var element = self.element( id );
			var animation = self.options.animation;

			if ( element ) {
				switch( element.type ) {	// "path|circle|ellipse|rect|text"
					case "path":
						var t = element.matrix.toTransformString().replace( "t", "" ).split( "," );
						element.ox = t[0] ? t[0] : 0;
						element.oy = t[1] ? t[1] : 0;
						break;
					case "circle":
					case "ellipse":
						element.ox = element.attr( "cx" );
						element.oy = element.attr( "cy" );
						break;
					default:
						element.ox = element.attr( "x" );
						element.oy = element.attr( "y" );
				}
				var dx = x - element.ox;
				var dy = y - element.oy;
				// if ( animation ) {
				// 	switch( element.type ) {
				// 		case "path":
				// 			var animationParams = {
				// 				transform: "t" + ( parseInt( element.ox ) + parseInt( dx ) ) +
				// 							"," + ( parseInt( element.oy ) + parseInt( dy ) )
				// 			}
				// 			break;
				// 		case "circle":
				// 		case "ellipse":
				// 			var animationParams = {
				// 				cx: element.ox + dx,
				// 				cy: element.oy + dy
				// 			};
				// 			break;
				// 		default:
				// 			var animationParams = {
				// 				x: element.ox + dx,
				// 				y: element.oy + dy
				// 			};
				// 	}
				// 	element.animate( Raphael.animation(
				// 		$.extend( {}, animation.params, animationParams ),
				// 		animation.delay,
				// 		animation.easing
				// 	));
				// }
				switch( element.type ) {
					case "path":
						element.transform( "t" +
							( parseInt( element.ox ) + parseInt( dx ) ) + "," +
							( parseInt( element.oy ) + parseInt( dy ) )
						);
						break;
					case "circle":
					case "ellipse":
						element.attr( { cx: element.ox + dx, cy: element.oy + dy } );
						break;
					default:
						element.attr( { x: element.ox + dx, y: element.oy + dy } );
				}
				self.paper.safari();
				PushToBuffer( self, "move", element );
			}

			return element;
		},

		modify: function ( id, attrs ) {
			var self = this;
			var element = self.element( id );
			var animation = self.options.animation;

			if ( element ) {
				if ( typeof attrs === "object" ) {

					element.attr( attrs );

					self.paper.safari();

					PushToBuffer( self, "modify", element );
				}
			}

			return element;
		},

		transform: function ( id, transform ) {
			var self = this;
			var animation = self.options.animation;
			var element = self.element( id );

			if ( element ) {
				if ( typeof transform === "string" ) {

					element.transform( transform );

					self.paper.safari();

					PushToBuffer( self, "transform", element );
				}
			}

			return element;
		},

		freeTransform: function ( id, attrs ) {
			var self = this;
			var element = self.element( id );

			if ( element ) {
				if ( typeof attrs === "object" ) {

					// var unplug = false;
					// var ft = element.freeTransform;
					// if ( !ft ) {
					// 	unplug = true;
					// 	ft = self.paper.freeTransform( element ).setOpts({
					// 		animate: self.options.animation
					// 	});
					// }

					// var attrs_ = JSON.parse( JSON.stringify( attrs ) );
					// var fa = ft.attrs;

					// for ( var attr in attrs_ ) {
					// 	switch ( attr ) {
					// 	case "cx":
					// 		fa.translate.x = attrs_[attr] - fa.center.x;
					// 		fa.center.x = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "cy":
					// 		fa.translate.y = attrs_[attr] - fa.center.y;
					// 		fa.center.y = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "rx":
					// 		fa.size.x = attrs_[attr] * 2;
					// 		delete attrs_[attr];
					// 		break;
					// 	case "ry":
					// 		fa.size.y = attrs_[attr] * 2;
					// 		delete attrs_[attr];
					// 		break;
					// 	case "sx":
					// 		fa.scale.x = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "sy":
					// 		fa.scale.y = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "width":
					// 		fa.size.x = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "height":
					// 		fa.size.y = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "x":
					// 		fa.translate.x = attrs_[attr] - fa.x;
					// 		fa.x = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "y":
					// 		fa.translate.y = attrs_[attr] - fa.y;
					// 		fa.y = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "r":
					// 		fa.size.x = attrs_[attr] * 2;
					// 		fa.size.y = attrs_[attr] * 2;
					// 		delete attrs_[attr];
					// 		break;
					// 	case "ratio":
					// 		fa.ratio = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	case "rotate":
					// 		fa.rotate = attrs_[attr];
					// 		delete attrs_[attr];
					// 		break;
					// 	default:
					// 		// Ignore
					// 	}
					// }

					// element.attr( attrs );

					// if ( data ) {
					// 	if ( data.ft && data.ft.attrs ) {
					// 		ft.attr( data.ft.attrs );
							SetFreeTransformAttrs( self, element, attrs )
					// 	}
					// }

					// ft.apply();

					// if ( unplug ) {
					// 	ft.unplug();
					// }

					// if ( !( JSON.stringify( attrs_ ) === "{}" ) ) {
					// 	element.attr( attrs_ );
					// }

					PushToBuffer( self, "move", element );
				} else {
					return GetFreeTransformAttrs( self, element )
				}
			}

			return element;
		},

		line: function ( x, y, dx, dy ) {
			var self = this;

			if ( !( dx == 0 && dy == 0 ) ) {
				var element = StartLine( self, x, y );
				element.attr( "path", "M" + x + "," + y +
									"L" + dx + "," + dy );
				self.elements.push( element );
				PushToBuffer( self, "line", element );

				return element;
			}

			return null;
		},

		arrow: function ( x, y, dx, dy ) {
			var self = this;

			if ( !( dx == 0 && dy == 0 ) ) {
				var element = StartLine( self, x, y );
				element.attr( "path", "M" + x + "," + y +
									"L" + dx + "," + dy );
				self.elements.push( element );
				PushToBuffer( self, "arrow", element );

				return element;
			}

			return null;
		},

		circle: function ( x, y, r ) {
			var self = this;

			if ( r != 0 ) {
				var element = StartCircle( self, x, y );
				element.attr( "r", r );
				self.elements.push( element );
				PushToBuffer( self, "circle", element );

				return element;
			}

			return null;
		},

		ellipse: function ( x, y, rx, ry ) {
			var self = this;

			if ( !( rx == 0 && ry == 0 ) ) {
				var element = StartEllipse( self, x, y );
				element.attr( "rx", rx )
					.attr( "ry", ry );
				self.elements.push( element );
				PushToBuffer( self, "ellipse", element );

				return element;
			}

			return null;
		},

		rect: function ( x, y, dx, dy ) {
			var self = this;

			if ( !( dx == 0 && dy == 0 ) ) {
				var element = StartRectangle( self, x, y );
				element.attr( "dx", dx )
					.attr( "dy", dy );
				self.elements.push( element );
				PushToBuffer( self, "rect", element );

				return element;
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
				var element = DrawText( self, x, y, text );
				self.elements.push( element );
				PushToBuffer( self, "text", element );

				/***********************************************************/
				// EXCEPTIONALLY IN THIS CASE WE'RE CALLING EVENT HANDLER! //
				/***********************************************************/
				EventHandler( self, "after_end" );
				return element;
			}

			return null;
		},

		cut: function ( id ) {
			var self = this;
			var elements = self.elements;
			var isCut = false;

			if ( elements.length > 0 ) {
				for ( var i=0;i<elements.length;i++ ) {
					if ( elements[i].id == id ) {
						PushToBuffer( self, "cut", elements[i] );
						elements[i].remove();
						elements.splice( i, 1 );
						isCut = true;
						break;
					}
				}
			}

			return isCut;
		},
		// TODO: Change toJSON to export self.elements not paper elements
		toJSON: function ( id, callback ) {
			// https://github.com/ElbertF/Raphael.JSON
			var self = this,
				elements = [],
				cache = [],
				paper = self.paper,
				prepareElement = function ( el ) {
					var data = callback ? callback( el, new Object ) : new Object;

					if ( data ) {
						data.ft = {
							attrs: GetFreeTransformAttrs( self, el )
						};
						elements.push({
							command : el.type,
							element : {
								data		: data,
								type		: el.type,
								attrs		: el.attrs,
								transform	: el.matrix.toTransformString(),
								id			: el.id
							}
						});
					}
				};

			if ( id ) {
				prepareElement( paper.getById( id ) );
			} else {
				paper.forEach(function( el ) {
					prepareElement( el );
				});
			}

			var o = JSON.stringify( elements, function ( key, value ) {
				// http://stackoverflow.com/a/11616993/400048
				if ( typeof value === 'object' && value != null ) {
					if ( cache.indexOf( value ) !== -1 ) {
						// Circular reference found, discard key
						return;
					}
					// Store value in our collection
					cache.push( value );
				}
				return value;
			});

			elements = cache = null;

			return o;
		},

		fromJSON: function ( elements, callback ) {
			// https://github.com/ElbertF/Raphael.JSON
			var self = this,
				json = [],
				_json;

			if ( typeof elements === "string" ) {
				_json = JSON.parse( elements );
			} else {
				_json = elements;
			}

			if ( !( _json instanceof Array ) ) {
				json.push( _json );
			} else {
				json = _json;
			}

			for ( var i in json ) {
				if ( json.hasOwnProperty( i ) ) {
					var element = Draw( self, json[i].element );
					var data = json[i].element.data;
					if ( data ) {
						if ( data.ft && data.ft.attrs ) {
							SetFreeTransformAttrs( self, element, data.ft.attrs );
						}
					}

					if ( callback ) callback( element );

					PushToBuffer( self, json[i].command, element );
				}
			}
		},

		undo: function () {
			var self = this;

			if ( self.canUndo() ) {
				if ( EventHandler( self, "before_undo" ) ) {
					var paper = self.paper;
					var elements = self.elements;
					var undoBuffer = self.undoBuffer;
					var shape = undoBuffer.pop();
					var mode = shape.command;

					ClearModeEvents( self );
					switch( mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut|clear"
						case "move":
							var prev = PreviousShapeInBuffer( undoBuffer, shape.element.id );
							if ( prev ) {
								// self.modify( prev.id, prev.attrs );
								// self.modify() pushes shape to undo buffer,
								// so we fix that
								// self.undoBuffer.pop();
								// self.transform( prev.id, prev.transform );
								// self.transform() pushes shape to undo buffer,
								// so we fix that
								// self.undoBuffer.pop();
								self.freeTransform( prev.id, prev.data.ft.attrs );
								// self.freeTransform() pushes shape to undo buffer,
								// so we fix that
								self.undoBuffer.pop();
							}
							break;
						case "modify":
							var prev = PreviousShapeInBuffer( undoBuffer, shape.element.id );
							if ( prev ) {
								self.modify( prev.id, prev.attrs );
								// self.modify() pushes shape to undo buffer,
								// so we fix that
								self.undoBuffer.pop();
								break;
							}
							break;
						case "transform":
							var prev = PreviousShapeInBuffer( undoBuffer, shape.element.id );
							if ( prev ) {
								self.transform( prev.id, prev.transform );
								// self.transform() pushes shape to undo buffer,
								// so we fix that
								self.undoBuffer.pop();
								break;
							}
							break;
						case "cut":
							Draw( self, shape.element );
							break;
						case "clear":
							shape.elements.map(function( element ) {
								Draw( self, element );
							});
							break;
						default:	// undo draw shape
							elements.pop().remove();
					}
					self.redoBuffer.push( shape );
					switch( mode ) {
						case "modify":
						case "transform":
						case "undo":
						case "redo":
						case "clear":
							break;
						default:
							self.mode( mode );
							SetModeEvents( self );
					}
				}
			}
			self.toggleUndoRedo();

			EventHandler( self, "after_undo" );

			return self;
		},

		clearUndo: function () {
			var self = this;

			self.undoBuffer = [];
			self.toggleUndoRedo();

			return self;
		},

		redo: function () {
			var self = this;

			if ( self.canRedo() ) {
				if ( EventHandler( self, "before_redo" ) ) {
					var elements = self.elements;
					var redoBuffer = self.redoBuffer;
					var paper = self.paper;
					var shape = redoBuffer.pop();
					var mode = shape.command;
					var element = shape.element;

					ClearModeEvents( self );
					switch( mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut|clear"
						case "move":
							// self.modify( element.id, element.attrs );
							// self.modify() pushes element to undo buffer,
							// so we fix that
							// self.undoBuffer.pop();
							// self.transform( element.id, element.transform );
							// self.transform() pushes element to undo buffer,
							// so we fix that
							// self.undoBuffer.pop();
							// self.undoBuffer.push( shape );
							self.freeTransform( element.id, shape.element.data.ft.attrs );
							// self.freeTransform() pushes element to undo buffer,
							// so we fix that
							self.undoBuffer.pop();
							self.undoBuffer.push( shape );
							break;
						case "modify":
							self.modify( element.id, element.attrs );
							break;
						case "transform":
							self.transform( element.id, element.transform );
							break;
						case "cut":
							self.cut( element.id );
							break;
						case "clear":
							self.clear();
							break;
						default:	// redo draw element
							Draw( self, element );
							self.undoBuffer.push( shape );
					}
					switch( mode ) {
						case "modify":
						case "transform":
						case "undo":
						case "redo":
						case "clear":
							break;
						default:
							self.mode( mode );
							SetModeEvents( self );
					}
				}
			}
			self.toggleUndoRedo();

			EventHandler( self, "after_redo" );

			return self;
		},

		clearRedo: function () {
			var self = this;

			self.redoBuffer = [];
			self.toggleUndoRedo();

			return self;
		},

		toggleUndoRedo: function () {
			var self = this;

			if ( self.toolBar ) {

				var handler = self.eventHandlers[ 'updateUndoRedo' ];

				if ( handler ) {
					handler( self );
				} else {
					self.toolBar.toggleUndoRedo();
				}
			}

			return self;
		},

		clear: function () {
			var self = this;

			if ( self.elements.length > 0 ) {
				if ( EventHandler( self, "before_clear" ) ) {
					ClearModeEvents( self );
					var elements = [];
					self.elements.map(function( element ) {
						elements.push( CloneElement( self, element ) );
					});
					self.undoBuffer.push({
						command	: "clear",
						elements: elements
					} );
					self.elements = [];
					self.paper.clear();
				}
			}
			self.clearRedo();

			EventHandler( self, "after_clear" );

			return self;
		},

		flush: function () {
			var self = this;

			ClearModeEvents( self );
			self.elements = [];
			self.paper.clear();
			self.clearUndo();
			self.clearRedo();

			return self;
		}
	};

	$.fn.RaphBoard = function ( options, argument ) {
		var board = $( this ).data( "RaphBoard" );

		if ( !board ) {
			board = Object.create( Board );

			board.init( options, this );

			$.data( this.get( 0 ), "RaphBoard", board );
		}

		if ( options !== undefined ) {
			if ( typeof options === "object" ) {
				// Set options
				board.options = $.extend( {}, $.fn.RaphBoard.options, options );
			} else if ( typeof options === "string" ) {
				// Set options
				board.options = $.extend( {}, $.fn.RaphBoard.options, { options: argument } );
			}
		}

		return board;
	};

	$.fn.RaphBoard.options = {
		/*
		// See http://raphaeljs.com/reference.html#Element.attr for more info
		*/
		editable		: true,										// allow editing
		stroke			: "#FFF",									// default: "#000"
		strokeWidth		: 1,										// default: 1 ("small (1)|medium (4)|big (8)|huge (12)")
		fill			: "#FFF",									// default: "#FFF"
		lineCap			: "round",									// default: "butt" (“butt|square|round”)
		lineJoin		: "round",									// default: "butt" (“bevel|round|miter”) ???
		arrowEnd		: "classic-medium-medium",					// default: "none" ("classic|block|open|oval|diamond|none[-wide|narrow|midium[-long|short|midium]]"
		fontSize		: 12,										// default: "10"
		font			: null,										// default: '10px "Arial"' (NOTE the apostrophes!)
		fontFamily		: null,										// default: '"Arial"' (NOTE the apostrophes!)
		fontStyle		: null,										// default: "normal" ("normal|italic|oblique|inherit")
		fontWeight		: null,										// default: 400 ("normal|bold|bolder|lighter|100|200|300|400|500|600|700|800|900|inherit")
		textAnchor		: "start",									// default: "middle" ("start|middle|end|inherit")
		// NOTE: text-decoration not (yet) implemented in Raphael?
		textDecoration	: null,										// default: "none" ("none|[underline||overline||line-through||blink]|inherit")
		animation		: {											// Default animation to be applied to freeTransform or "false" to disable
							delay: 100,
							easing: "<>"
						}											// set to null if no animation wanted
	};

	$.fn.removeClasses = function ( mask ) {
		return this.removeClass( function ( index, cls ) {
			var re = mask.replace( /\*/g, '\\S+' );
			return ( cls.match( new RegExp( '\\b' + re + '', 'g' )) || [] ).join( ' ' );
		});
	};

	// Editing Events Functions
	function SetModeEvents( self, ignoredElement ) {
		if ( self.options.editable ) {
			self.elements.map(function( element ) {
				if ( element.id !== ( ( ignoredElement ) ? ignoredElement.id : -1 ) ) {
					SetElementEvents( self, element, self._mode );
				}
			});
		}
	}

	function SetElementEvents( self, element, mode ) {
		switch ( mode ) {
		case "move":
			if ( element.freeTransform == null ) {
				self.initMove( element.id, true );
			}
			element.attr( { cursor: "pointer" } );
			break;
		case "text":
			element.attr( { cursor: "text" } );
			break;
		case "cut":
			element.hover( OnCutIn, OnCutOut );
			element.attr( { cursor: "pointer" } );
			break;
		case "pen":
		case "line":
		case "arrow":
		case "circle":
		case "ellipse":
		case "rect":
			element.attr( { cursor: "crosshair" } );
			break;
		default:
			// Ignore everything else
		}
	}

	function ClearModeEvents( self, ignoredElement ) {
		if ( self.options.editable ) {
			self.elements.map(function( element ) {
				if ( element.id !== ( ( ignoredElement ) ? ignoredElement.id : -1 ) ) {
					ClearElementEvents( element, true );	// keep freeTransform
				} else {
					ClearElementEvents( element );		// freeTransform.unplug()
				}
				switch( self._mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
					case "move":
					case "cut":
						element.attr( { cursor: "pointer" } );
						break;
					case "text":
						element.attr( { cursor: "text" } );
						break;
					default:
						element.attr( { cursor: "crosshair" } );
				}
			});
		}
	}

	function ClearElementEvents( element, noUnplug ) {
		if ( element.events ) {
			var eventsLength = element.events.length;
			for ( var i=0;i<eventsLength;i++ ) {
				switch ( element.events[i].f ) {
				// Remove only our events
				case OnCutIn:
				case OnCut:
				case OnCutOut:
				case OnMouseDown:
				case OnMouseMove:
				case OnMouseUp:
					element[ "un"+element.events[i].name ]( element.events[i].f );
					if ( element.events ) {
						eventsLength = element.events.length;
					} else {
						eventsLength = 0;
					}
					i--;
					break;
				default:
					// Ignore
				}
			}
		}
		if ( element.freeTransform && !noUnplug ) {
			element.freeTransform.unplug();
		}
	}

	function InitMove( self, element ) {
		var moved = false;
		return self.paper.freeTransform(
			element,
			{
				animate		: false,
				attrs: {	// Attributes for handles
					fill	: "#bada55",
					stroke	: "#000"
				},
				drag: [
					"center",
					"self"
				],
				draw		: ( element.type === "circle" ) ? [ "bbox" ] : [ "circle", "bbox" ],
				keepRatio	: ( element.type === "circle" ) ? true : false,
				rotate		: ( element.type === "circle" ) ? false : [ "axisX" ],
				scale		: [
					"bboxCorners",
					"bboxSides"
				],
				size: {
					axes		: 5,
					bboxCorners	: 5,
					bboxSides	: 5,
					center		: 5
				}
			},
			function( ft, events ) {
				switch ( events[0] ) {	// Single events only
				case "init":
					moved = false;
					break;
				case "drag start":
					ft.hideHandles({ undrag: false });
					element.attr({ cursor: "move" });
					break;
				case "drag end":
					ft.showHandles();
					element.attr({ cursor: "pointer" });
					break;
				case "rotate start":
					if ( ft.handles.center ) {
						ft.handles.center.disc.hide();
					}
					if ( ft.bbox ) {
						ft.bbox.hide();
						if ( ft.handles.bbox ) {
							ft.handles.bbox.map(function( handle ) {
								handle.element.hide();
							});
						}
					}
					element.attr({ cursor: "pointer" });
					break;
				case "rotate end":
					if ( ft.handles.center ) {
						ft.handles.center.disc.show();
					}
					if ( ft.bbox ) {
						ft.bbox.show();
						if ( ft.handles.bbox ) {
							ft.handles.bbox.map(function( handle ) {
								handle.element.show();
							});
						}
					}
					element.attr({ cursor: "pointer" });
					break;
				case "scale start":
					if ( ft.handles.center ) {
						ft.handles.center.disc.hide();
					}
					[ 'x', 'y' ].map(function(axis) {
						if ( ft.handles[axis] ) {
							ft.handles[axis].disc.hide();
							ft.handles[axis].line.hide();
						}
					});
					if ( ft.bbox ) {
						var selectedHandle;
						var cursor = "";

						self.paper.getElementsByPoint( ft.o.handlePos.cx, ft.o.handlePos.cy ).forEach(function( element ) {
							if ( element.type === "rect" ) {
								selectedHandle = element.id;
								return false;
							}
						});
						if ( ft.handles.bbox ) {
							ft.handles.bbox.map(function( handle ) {
								if ( selectedHandle !== handle.element.id ) {
									handle.element.hide();
								} else {
									// // Position of Handle
									// // x = -1	// "W"
									// // x = 0	// ""
									// // x = 1	// "E"
									// // y = -1	// "N"
									// // y = 0	// ""
									// // y = 1	// "S"
									// switch ( handle.y ) {
									// case -1:
									// 	cursor = "n";
									// 	break;
									// case 1:
									// 	cursor = "s";
									// 	break;
									// default:	// 0
									// 	// ""
									// }
									// switch ( handle.x ) {
									// case -1:
									// 	cursor += "w";
									// 	break;
									// case 1:
									// 	cursor += "e";
									// 	break;
									// default:	// 0
									// 	// ""
									// }
									// handle.element.attr({
									// 	// ne-resize
									// 	// nw-resize
									// 	// se-resize
									// 	// sw-resize
									// 	// e-resize
									// 	// n-resize
									// 	// s-resize
									// 	// w-resize
									// 	cursor: cursor += "-resize"
									// });
								}
							});
						}
					}
					if ( ft.circle ) {
						ft.circle.hide();
					}
					break;
				case "scale end":
					if ( ft.handles.center ) {
						ft.handles.center.disc.show();
					}
					[ 'x', 'y' ].map(function( axis ) {
						if ( ft.handles[axis] ) {
							ft.handles[axis].disc.show();
							ft.handles[axis].line.show();
						}
					});
					if ( ft.bbox ) {
						// ft.bbox.show();
						if ( ft.handles.bbox ) {
							ft.handles.bbox.map(function( handle ) {
								handle.element.show();
							});
						}
					}
					if ( ft.circle ) {
						ft.circle.show();
					}
					element.attr({ cursor: "pointer" });
					break;
				default:	// "drag|rotate|scale|apply..."
					moved = true;
				}
				switch ( events[0].split(" ")[1] ) {
				case "start":
					if ( EventHandler( self, "before_move" ) ) {
						HideAllHandles( self, element );
						PushToBuffer( self, self._mode, element );
					}
					break;
				case "end":
					var shape = self.undoBuffer.pop();
					if ( moved ) {
						// var a = shape.element.attrs;
						// var fa = ft.attrs;

						// switch( shape.element.type ) {	// "path|circle|ellipse|rect|text"
						// /* freeTransform attributes
						// 	ft.attrs.x
						// 	ft.attrs.y
						// 	ft.attrs.ratio (?)
						// 	ft.attrs.rotate
						// 	ft.attrs.center.x
						// 	ft.attrs.center.y
						// 	ft.attrs.scale.x
						// 	ft.attrs.scale.y
						// 	ft.attrs.size.x
						// 	ft.attrs.size.y
						// 	ft.attrs.translate.x
						// 	ft.attrs.translate.y
						// 	ft.items.length
						// */
						// case "circle":
						// 	a.cx = fa.center.x + fa.translate.x;
						// 	a.cy = fa.center.y + fa.translate.y;
						// 	a.r = ( fa.size.x / 2 );
						// 	break;
						// case "ellipse":
						// 	a.cx = fa.center.x + fa.translate.x;
						// 	a.cy = fa.center.y + fa.translate.y;
						// 	a.rx = fa.size.x * fa.scale.x;
						// 	a.ry = fa.size.y * fa.scale.y;
						// 	break;
						// case "text":
						// 	a.x = fa.center.x + fa.translate.x - ( fa.size.x / 2 );
						// 	a.y = fa.center.y + fa.translate.y - ( fa.size.y / 2 );	// !!!
						// 	break;
						// case "rect":
						// 	a.width = fa.size.x * fa.scale.x;
						// 	a.height = fa.size.y * fa.scale.y;
						// default:	// "path"
						// 	a.x = fa.center.x + fa.translate.x - ( fa.size.x / 2 );
						// 	a.y = fa.center.y + fa.translate.y - ( fa.size.y / 2 );
						// }
						// a.sx = fa.scale.x;
						// a.sy = fa.scale.y;
						// a.ratio = fa.ratio;
						// a.rotate = fa.rotate;

						shape.element.data.ft.attrs = GetFreeTransformAttrs( self, element );
						delete shape.element.attrs.cursor;

						self.undoBuffer.push( shape );
						self.clearRedo();

						moved = false;
					}
					EventHandler( self, "after_move" );
					break;
				default:
					// Ignore the rest
				}
			}
		);
	}

	function SelectAllElements( self, ignoredElement ) {
		self.elements.map(function( element ) {
			if ( element.id !== ( ( ignoredElement ) ? ignoredElement.id : -1 ) ) {
				SelectElement( self, element );
			}
		});

		return ignoredElement;
	}

	function SelectElement( self, element ) {
		if ( EventHandler( self, "before_select" ) ) {
			element.attr({ cursor: "move" });
			self.select( element.id );
		}

		EventHandler( self, "after_select" );

		return element;
	}

	function DeselectAllElements( self, ignoredElement ) {
		self.elements.map(function( element ) {
			if ( element.id !== ( ( ignoredElement ) ? ignoredElement.id : -1 ) ) {
				DeselectElement( self, element );
			}
		});

		return ignoredElement;
	}

	function DeselectElement( self, element ) {
		if ( EventHandler( self, "before_deselect" ) ) {
			self.deselect( element.id );
		}

		EventHandler( self, "after_deselect" );

		return element;
	}

	function ShowAllHandles( self, ignoredElement ) {
		var elements = self.elements;

		elements.map(function( element ) {
			if ( element.id !== ( ( ignoredElement ) ? ignoredElement.id : -1 ) ) {
				ShowHandles( self, element );
			}
		});

		return ignoredElement;
	}

	function ShowHandles( self, element ) {
		if ( EventHandler( self, "before_show_handles" ) ) {
			if ( element.freeTransform ) {
				var ft = element.freeTransform;

				if ( ft.handles.center ) {
					ft.handles.center.disc.show();
				}
				if ( ft.bbox ) {
					ft.bbox.show();
					if ( ft.handles.bbox ) {
						ft.handles.bbox.map(function( handle ) {
							handle.element.show();
						});
					}
				}
				[ 'x', 'y' ].map(function( axis ) {
					if ( ft.handles[axis] ) {
						ft.handles[axis].disc.show();
						ft.handles[axis].line.show();
					}
				});
				if ( ft.circle ) {
					ft.circle.show();
				}
			}
		}

		EventHandler( self, "after_show_handles" );

		return element;
	}

	function HideAllHandles( self, ignoredElement ) {
		var elements = self.elements;

		elements.map(function( element ) {
			if ( element.id !== ( ( ignoredElement ) ? ignoredElement.id : -1 ) ) {
				HideHandles( self, element );
			}
		});

		return ignoredElement;
	}

	function HideHandles( self, element ) {
		if ( EventHandler( self, "before_hide_handles" ) ) {
			if ( element.freeTransform ) {
				var ft = element.freeTransform;

				if ( ft.handles.center ) {
					ft.handles.center.disc.hide();
				}
				if ( ft.bbox ) {
					ft.bbox.hide();
					if ( ft.handles.bbox ) {
						ft.handles.bbox.map(function( handle ) {
							handle.element.hide();
						});
					}
				}
				[ 'x', 'y' ].map(function( axis ) {
					if ( ft.handles[axis] ) {
						ft.handles[axis].disc.hide();
						ft.handles[axis].line.hide();
					}
				});
				if ( ft.circle ) {
					ft.circle.hide();
				}
			}
		}

		EventHandler( self, "after_hide_handles" );

		return element;
	}

	function OnCutIn( e ) {
		// e.stopPropagation();
		var element = this;
		var elem = $( element.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );

		element.mousedown( OnCut );

		SetCutAttributes( self, element );
	}

	function OnCut( e ) {
		// e.stopPropagation();
		var element = this;
		var elem = $( element.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );

		if ( EventHandler( self, "before_cut" ) ) {
			ClearElementEvents( element );
			ResetCutAttributes( self, element );
			self.cut( element.id );
		}
		EventHandler( self, "after_cut" );
	}

	function OnCutOut( e ) {
		// e.stopPropagation();
		var element = this;
		var elem = $( element.node );
		var self = elem.parent().parent().parent().data( "RaphBoard" );

		element.unmousedown( OnCut );

		ResetCutAttributes( self, element );
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
			"stroke-width"		: 1,
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

	function InitBoardEvents( elem ) {
		var self = elem.parent().data( "RaphBoard" );

		switch( self._mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
			case "move":
			case "cut":
				elem.css( { cursor: "pointer" } );
				break;
			case "text":
				elem.css( { cursor: "text" } );
				break;
			default:
				elem.css( { cursor: "crosshair" } );
		}

		elem.unbind( "mouseenter" )
			.mouseleave( OnMouseLeave );
		if ( self._mode != "cut" ) elem.mousedown( OnMouseDown );
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
		self.mouseDownY = e.pageY - self.top() - ( self.toolBar ? self.toolBar.height() : 0 );

		if ( EventHandler( self, "before_start" ) ) {
			var elements = self.elements;
			switch( self._mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
			case "pen":
				elements.push( StartLine( self, self.mouseDownX, self.mouseDownY ) );
				break;
			case "line":
				elements.push( StartLine( self, self.mouseDownX, self.mouseDownY ) );
				break;
			case "arrow":
				elements.push(
					StartLine( self, self.mouseDownX, self.mouseDownY )
						.attr( { "arrow-end": self.options.arrowEnd } )
				);
				break;
			case "circle":
				elements.push( StartCircle( self, self.mouseDownX, self.mouseDownY ) );
				break;
			case "ellipse":
				elements.push( StartEllipse( self, self.mouseDownX, self.mouseDownY ) );
				break;
			case "rect":
				elements.push( StartRectangle( self, self.mouseDownX, self.mouseDownY ) );
				break;
			case "text":
				GetText( self, self.mouseDownX, self.mouseDownY );
				break;
			default: //	"move"
				var element = self.paper.getElementByPoint( e.pageX, e.pageY );
				if ( element == null ) {
					DeselectAllElements( self );
					self.multiSelect = StartRectangle( self, self.mouseDownX, self.mouseDownY );
					self.multiSelect.attr({
						"fill"				: "#bada55",
						"fill-opacity"		: .1,
						"stroke"			: "#bada55",
						"stroke-width"		: 1,
						"stroke-dasharray"	: "-"
					});
				}
			}

			if ( self._mode != "text" && self._mode != "cut" ) {
				if ( self._mode != "move" || self.multiSelect != null ) {
					elem.mousemove( OnMouseMove );
				}
				elem.mouseup( OnMouseUp );
			}
		}

		EventHandler( self, "after_start" );
	}

	function OnMouseMove( e ) {
		var elem = $( e.delegateTarget );
		var self = elem.parent().data( "RaphBoard" );

		if ( EventHandler( self, "before_change" ) ) {
			var element = self.elements[ self.elements.length - 1 ];

			var moveX = e.pageX - self.left();
			var moveY = e.pageY - self.top() - ( self.toolBar ? self.toolBar.height() : 0 );

			var width = moveX - self.mouseDownX;
			var height = moveY - self.mouseDownY;

			switch( self._mode ) {	// "move|pen|line|arrow|circle|ellipse|rect|text|cut"
				case "pen":
					element.attr( "path", element.attr( "path" ) + "L" + moveX + "," + moveY );
					break;
				case "line":
					element.attr( "path", "M" + self.mouseDownX + " " + self.mouseDownY + "L" + moveX + "," + moveY );
					break;
				case "arrow":
					element.attr( "path", "M" + self.mouseDownX + " " + self.mouseDownY + "L" + moveX + "," + moveY );
					break;
				case "circle":
					element.attr( "r", Math.max( Math.abs( width ), Math.abs( height ) ) );
					break;
				case "ellipse":
					element.attr( "rx", Math.abs( width ) )
						 .attr( "ry", Math.abs( height ) );
					break;
				case "rect":
					if ( width < 0 ) element.attr( "x", moveX );
					if ( height < 0 ) element.attr( "y", moveY );
					element.attr( "width", Math.abs( width ) )
						 .attr( "height", Math.abs( height ) );
					break;
				case "text":
				  	// No resizing of text, just ignore the event
					break;
				default: //	"move"
					if ( self.multiSelect ) {
						if ( width < 0 ) self.multiSelect.attr( "x", moveX );
						if ( height < 0 ) self.multiSelect.attr( "y", moveY );
						self.multiSelect.attr( "width", Math.abs( width ) )
							 			.attr( "height", Math.abs( height ) );
					}
			}
		}
		EventHandler( self, "after_change" );
	}

	function OnMouseUp( e ) {
		var elem = $( e.delegateTarget );
		var self = elem.parent().data( "RaphBoard" );

		self.mouseUpX = e.pageX - self.left();
		self.mouseUpY = e.pageY - self.top() - ( self.toolBar ? self.toolBar.height() : 0 );

		if ( EventHandler( self, "before_end" ) ) {
			switch ( self._mode ) {
			case "cut":
			case "text":
				break;
			case "move":
				if ( self.multiSelect ) {
					var BBox = self.multiSelect.getBBox();
					self.multiSelect.remove();
					self.multiSelect = null;

					if ( BBox.width !== 0 && BBox.height !== 0 ) {
						self.elements.map(function( element ) {
							if ( Raphael.isBBoxIntersect( BBox, element.getBBox() ) ) {
								SelectElement( self, element );
							}
						});
					}
				}
				SetModeEvents( self );
				break;
			default:
				var elements = self.elements;
				element = elements.pop();
				var BBox = element.getBBox();

				if ( BBox.width == 0 && BBox.height == 0 ) {
					element.remove();
				} else {
					elements.push( element );
					PushToBuffer( self, self._mode, element );
				}
			}

			if ( self._mode != "text" && self._mode != "cut" ) {
				elem.unbind( "mousemove" )
					.unbind( "mouseup" );
			}
		}

		EventHandler( self, "after_end" );
	}

	function OnMouseLeave( e ) {
		e.stopPropagation();
		var elem = $( e.delegateTarget );

		elem.unbind( "mouseleave" )
			.removeClass( "cursor-*" );
		var self = elem.parent().data( "RaphBoard" );
		if ( self._mode != "cut" ) elem.unbind( "mousedown" );

		elem.mouseenter( OnMouseEnter );
	}

	// Shape Drawing Functions
	function PreviousShapeInBuffer( buffer, id ) {
		for ( var i=buffer.length-1;i>=0;i-- ) {
			var prev = buffer[i].element;
			if ( prev.id == id ) {
				return prev;
			}
		}
		return null;
	}

	function PushToBuffer( self, mode, element ) {
		var element = {
			command		: mode,
			element		: CloneElement( self, element )
		};

		self.undoBuffer.push( element );

		switch ( mode ) {
		case "cut":
		case "clear":
		case "move":
		case "modify":
		case "transform":
			break;
		default:
			self.clearRedo();
		}
	}

	function SetFreeTransformAttrs( self, element, attrs ) {
		var unplug = false;

		var ft = element.freeTransform;
		if ( !ft ) {
			unplug = true;
			ft = self.paper.freeTransform( element ).setOpts({
				animate: self.options.animation
			});
		}

		ft.attrs = JSON.parse( JSON.stringify( attrs ) );
		ft.apply();

		if ( unplug ) {
			ft.unplug();
		}

		return element;
	}

	function GetFreeTransformAttrs( self, element ) {
		var attrs;
		var unplug = false;

		var ft = element.freeTransform;
		if ( !ft ) {
			unplug = true;
			ft = self.paper.freeTransform( element );
		}

		attrs = JSON.parse( JSON.stringify( ft.attrs ) );

		if ( unplug ) {
			ft.unplug();
		}

		return attrs;
	}

	function CloneElement( self, element ) {
		var clone = {
			data : {
				ft: {
					attrs: GetFreeTransformAttrs( self, element )
				}
			},
			id			: element.id,
			type		: element.type,
			attrs		: JSON.parse( JSON.stringify( element.attrs ) ),
			transform	: element.matrix.toTransformString()
		};

		// Prevent freeTransform errors
		delete clone.attrs.transform;

		return clone;
	}

	function StartLine( self, x1, y1 ) {
		var element = self.paper.path( "M" + x1 + " " + y1 );

		if ( self.options.strokeWidth == 0 ) {
			self.options.stroke = self.options.fill;
			self.options.strokeWidth = 1;
		}
		element.attr({
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: self.options.lineJoin
		});

		return element;
	}

	function StartCircle( self, x, y ) {
		var element = self.paper.circle( x, y, 0 );

		element.attr({
			"fill"				: self.options.fill,
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: self.options.lineJoin
		});

		return element;
	}

	function StartEllipse( self, x, y ) {
		var element = self.paper.ellipse( x, y, 0, 0 );

		element.attr({
			"fill"				: self.options.fill,
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: self.options.lineJoin
		});

		return element;
	}

	function StartRectangle( self, x, y ) {
		var element = self.paper.rect( x, y, 0, 0 );

		element.attr({
			"fill"				: self.options.fill,
			"stroke"			: self.options.stroke,
			"stroke-width"		: self.options.strokeWidth,
			"stroke-linecap"	: self.options.lineCap,
			"stroke-linejoin"	: "miter"
		});

		return element;
	}

	function GetText( self, x, y ) {
		var text = prompt(
			"Please enter text:\n" +
			"Optionally, you can specify text size by\n" +
			"prepending text size as number enclosed in {}",
			"{" + self.options.fontSize + "}Write some text here..."
		);

		// Expects text in format "{fontSize}text"; "{fontSize}" is optional
		if ( text && text != "" ) {
			var size = self.options.fontSize;
			if ( text[0] == "{" ) {
				size = text.substring( 1, text.indexOf( "}" ) );
				text = text.substring( text.indexOf( "}" ) + 1 );
			}
			return self.text( x, y, text, size );
		}
	}

	function DrawText( self, x, y, text ) {
		var element = self.paper.text( x, y, text );
		var o = self.options;

		element.attr({
			"fill"				: o.fill,
			"stroke"			: o.stroke,
			"stroke-width"		: o.strokeWidth,
			"stroke-linecap"	: o.lineCap,
			"stroke-linejoin"	: o.lineJoin,
			"font-size"			: o.fontSize
		});
		if ( o.font ) element.attr({ "font"							: '"' + o.fontSize + 'px "' + o.font + '"' });
		if ( o.fontFamily ) element.attr({ "font-family"			: o.fontFamily });
		if ( o.fontStyle ) element.attr({ "font-style"				: o.fontStyle });
		if ( o.fontWeight ) element.attr({ "font-weight"			: o.fontWeight });
		if ( o.textAnchor ) element.attr({ "text-anchor"			: o.textAnchor });
		if ( o.textDecoration ) element.attr({ "text-decoration"	: o.textDecoration });

		return element;
	}

	function Draw( self, element ) {
		var el;
		var id;
		var elements = self.elements;
		var a = element.attrs;

		switch( element.type ) {		// "pen|line|arrow|circle|ellipse|rect|text"
			case "circle":
				el = self.paper.circle( a.cx, a.cy, a.r );
				break;
			case "ellipse":
				el = self.paper.ellipse( a.cx, a.cy, a.rx, a.ry );
				break;
			case "rect":
				el = self.paper.rect( a.x, a.y, a.width, a.height );
				break;
			case "text":
				el = self.paper.text( a.x, a.y, a.text );
				break;
			default:				// "pen|line|arrow" and other yet unknown
				el = self.paper.path( "" );
		}
		el.id = element.id;
		// NOTE: Unfortunately, we need this hack as well!
		el.node.raphaelid = element.id;

		el.attr( a );
		el.transform( element.transform );

		for ( var i=elements.length-1;i>=0;i-- ) {
			if ( el.id > elements[i].id ) {
				id = elements[i].id;
				break;
			}
		}
		if ( id ) {
			el.insertAfter( self.paper.getById( id ) );
			elements.splice( i + 1, 0, el );
		} else {
			elements.push( el );
		}

		return el;
	}

})( jQuery, window, document );

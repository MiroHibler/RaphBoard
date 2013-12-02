/*! ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ */
/*! │ <%= meta.title %> v<%= meta.version %> - Cross-browser drawing board based on Raphaël                             │ */
/*! ├─────────────────────────────────────────────────────────────────────────────────────────────┤ */
/*! │ Copyright © <%= meta.copyright %> (<%= meta.homepage %>)             │ */
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

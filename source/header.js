// ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ <%= meta.title %> v<%= meta.version %> - Cross-browser online blackboard based on Raphaël                         │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © <%= meta.copyright %> (<%= meta.homepage %>)             │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT (<%= meta.homepage %>LICENSE.txt) license.        │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Requirements: Raphaël, jQuery                                                               │ \\
// └─────────────────────────────────────────────────────────────────────────────────────────────┘ \\

// Object Creation Utility
;if ( typeof Object.create !== "function" ) {
	Object.create = function ( obj ) {
		function F() {};
		F.prototype = obj;
		return new F();
	};
}

( function ( $, window, document, undefined ) {

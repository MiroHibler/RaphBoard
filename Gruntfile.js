
var _ = require('underscore');

module.exports = function(grunt) {

	// Load required NPM tasks.
	// You must first run `npm install` in the project's root directory to get these dependencies.
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch'); // Very useful for development. See README.


	// read config files, and combine into one "meta" object
	var packageConfig = grunt.file.readJSON('package.json');
	var componentConfig = grunt.file.readJSON('component.json');
	var pluginConfig = grunt.file.readJSON('jquery.raphboard.json');
	var meta = _.extend({}, packageConfig, componentConfig, pluginConfig);
	
	
	var config = {	// this will eventually get passed to grunt.initConfig
		meta: meta,	// do this primarily for templating (<%= %>)

		// initialize multitasks
		concat: {},
		uglify: {},
		copy: {},
		compress: {},
		clean: {},
		watch: {} // we will add watch tasks whenever we do concats, so files get re-concatenated upon save
	};


	// files that the demos might need in the distributable
	var depFiles = require('./build/deps.js');


	/* Important Top-Level Tasks
	----------------------------------------------------------------------------------------------------*/

	grunt.registerTask('default', 'dist'); // what will be run with a plain old "grunt" command

	grunt.registerTask('dist', 'Create a distributable ZIP file', [
		'clean:build',
		'submodules',
		'uglify',
		'copy:deps',
		'copy:demos',
		'copy:misc',
		'compress'
	]);

	grunt.registerTask('dev', 'Build necessary files for developing and debugging', 'submodules');

	grunt.registerTask('submodules', 'Build all RaphBoard submodules', [
		'main'
	]);


	/* Main Submodule
	----------------------------------------------------------------------------------------------------*/

	grunt.registerTask('main', 'Build the main RaphBoard submodule', [
		'concat:mainJs',
		'concat:mainCss'
	]);

	// JavaScript

	config.concat.mainJs = {
		options: {
			process: true	// replace template variables
		},
		src: [
			'source/header.js',
			'source/ButtonIcon.js',
			'source/Button.js',
			'source/ToolBar.js',
			'source/Canvas.js',
			'source/AttributesPanel.js',
			'source/main.js',
			'source/footer.js'
		],
		dest: 'build/out/RaphBoard/jquery.raphboard.js'
	};

	config.watch.mainJs = {
		files: config.concat.mainJs.src,
		tasks: 'concat:mainJs'
	};

	// CSS

	config.concat.mainCss = {
		options: {
			process: true	// replace template variables
		},
		src: [
			'source/common/RaphBoard.css'
		],
		dest: 'build/out/demos/css/RaphBoard.css'
	};

	config.watch.mainCss = {
		files: config.concat.mainCss.src,
		tasks: 'concat:mainCss'
	};

	/* Minify the JavaScript
	----------------------------------------------------------------------------------------------------*/

	config.uglify.all = {
		options: {
			preserveComments: 'some'	// keep comments starting with /*!
		},
		expand: true,
		src: 'build/out/RaphBoard/jquery.raphboard.js',
		ext: '.raphboard.min.js'
	}


	/* Copy Dependencies
	----------------------------------------------------------------------------------------------------*/

	config.copy.deps = {
		expand: true,
		flatten: true,
		src: depFiles,
		dest: 'build/out/raphael/'	// all depenencies will go in the raphael/ directory for now
									// (because we only have raphael)
	};


	/* Demos
	----------------------------------------------------------------------------------------------------*/

	config.copy.demos = {
		options: {
			process: true,	// replace template variables
			// while copying demo files over, rewrite <script> and <link> tags for new dependency locations
			processContentExclude: 'demos/*/**',	// don't process anything more than 1 level deep (like assets)
			processContent: function(content) {
				content = rewriteDemoStylesheetTags(content);
				content = rewriteDemoScriptTags(content);
				return content;
			}
		},
		src: 'demos/**',
		dest: 'build/out/'
	};

	function rewriteDemoStylesheetTags(content) {
		return content.replace(
			/(<link[^>]*href=['"])(.*?\.css)(['"][^>]*>)/g,
			function(full, before, href, after) {
				href = href.replace('../build/out/', '../');
				return before + href + after;
			}
		);
	}

	function rewriteDemoScriptTags(content) {
		return content.replace(
			/(<script[^>]*src=['"])(.*?)(['"][\s\S]*?<\/script>)/g,
			function(full, before, src, after) {
				if (src == '../build/deps.js') {
					return buildDepScriptTags();
				}
				else {
					src = src.replace('../build/out/', '../');
					src = src.replace('/jquery.raphboard.', '/jquery.raphboard.min.');	// use minified version of main JS file
					return before + src + after;
				}
			}
		);
	}

	function buildDepScriptTags() {
		var tags = [];
		for (var i=0; i<depFiles.length; i++) {
			var fileName = depFiles[i].replace(/.*\//, ''); // get file's basename
			tags.push("<script src='../raphael/" + fileName + "'></script>"); // all dependencies are in raphael/ for now
		}
		return tags.join("\n");
	}


	/* Copy Misc Files
	----------------------------------------------------------------------------------------------------*/

	config.copy.misc = {
		src: "*.txt", // licenses and changelog
		dest: 'build/out/'
	};


	/* Create ZIP file
	----------------------------------------------------------------------------------------------------*/

	config.compress.all = {
		options: {
			archive: 'dist/RaphBoard-<%= meta.version %>.zip'
		},
		expand: true,
		cwd: 'build/out/',
		src: '**',
		dest: 'RaphBoard-<%= meta.version %>/' // have a top-level directory in the ZIP file
	};


	/* Bower Component
	----------------------------------------------------------------------------------------------------*/
	// http://twitter.github.com/bower/

	grunt.registerTask('component', 'Build the RaphBoard component for the Bower package manager', [
		'clean:build',
		'submodules',
		'uglify', // we want the minified JS in there
		'copy:component',
		'copy:componentReadme',
		'componentConfig'
	]);

	config.copy.component = {
		expand: true,
		cwd: 'build/out/RaphBoard/',
		src: '**',
		dest: 'build/component/',
	};

	config.copy.componentReadme = {
		src: 'build/component-readme.md',
		dest: 'build/component/README.md'
	};

	grunt.registerTask('componentConfig', function() {
		grunt.file.write(
			'build/component/component.json',
			JSON.stringify(
				_.extend({}, pluginConfig, componentConfig), // combine the 2 configs
				null, // replacer
				2 // indent
			)
		);
	});


	/* Clean Up Files
	----------------------------------------------------------------------------------------------------*/

	config.clean.build = [
		'build/out/*',
		'build/component/*'
	];

	config.clean.dist = 'dist/*';



	// finally, give grunt the config object...
	grunt.initConfig(config);
};

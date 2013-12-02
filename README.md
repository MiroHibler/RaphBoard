# RaphBoard

## Cross-browser drawing board based on [Raphaël](http://MiroHibler.github.io/RaphBoard/).

![RaphBoard - Cross-browser drawing board](http://MiroHibler.github.io/RaphBoard/images/RaphBoard.jpg)

Visit the [library website](http://MiroHibler.github.io/RaphBoard/) and for more information.

### Dependencies
 * [grunt](http://gruntjs.com/)
 * [jQuery](http://jquery.com/)
 * [Raphaël](http://raphaeljs.com/)
 * [Raphaël FreeTransform](http://alias.io/raphael/free_transform/)

## How to start?

 * Go to a directory where you want to clone this repository
 * `git clone git://github.com/MiroHibler/RaphBoard.git`
 * `npm install` to install dependencies
 * `grunt` to build it (`grunt --help` to see available options)
 * Copy `build\out\raphboard.js` or `build\out\raphboard.min.js` (minified version) to your project
 * Enjoy! ;)

## Roadmap

### v2.0.0
 * Complete rewrite to better integrate with Raphaël
 * Enable adding user-defined shapes

## Want to contribute?

 * `git clone https://github.com/MiroHibler/RaphBoard.git`
 * `grunt --help` to see available options

*__PLEASE NOTE:__ All changes in code must go to `source` directory! `raphboard.js` is a generated file!*

After adding your changes, execute `grunt` in the project folder to generate the minified version, commit and you are ready to make a pull request!

## Found an issue?

First search for similar issues to make sure you don't repeat an existing one.

Then please create a fiddle ([boilerplate](http://jsfiddle.net/MZwAW/)) recreating the bug so we can find out what the problem is more easily (or be a hero and find it yourself and send a pull request!). You can also use the [RaphBoard playground](http://MiroHibler.github.io/RaphBoard/playground.html) to reproduce your issues.

Remember to add all the info that can be useful such as

 * error details
 * steps to reproduce
 * browser and its version
 * any suggestion of what do you think the problem could be

## Changelog

### 1.1.0
 * Menu and Attributes Panel now optional (use `grunt dev` to include them).
 * Dropped 'jquery.' prefix for distributables.
 * Bug fix: not accepting options on initialization.
 * Various other bug fixes.

### 1.0.1
 * Various bug fixes.

### 1.0.0
 * Initial release (Duh.)

## Copyright and license

Copyright © 2012-2013 [Miroslav Hibler](http://miro.hibler.me)

Licensed under the [**MIT**](http://opensource.org/licenses/mit-license.php) license.

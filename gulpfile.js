'use strict';

const gulp = require('gulp');
const babel = require('babelify');
const browserify = require('browserify');
const concat = require('gulp-concat');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
const css = require('gulp-clean-css');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const del = require('del');

const project = 'veldt';
const paths = {
	root: 'scripts/exports.js',
	scripts: [
		'scripts/**/*.js'
	],
	styles: [
		'styles/main.css',
		'styles/**/*.css'
	],
	build: 'build'
};


function clean() {
	return del([ paths.build ]);
}

function lint() {
	return gulp.src(paths.scripts)
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
}

function logError(err) {
	if (err instanceof SyntaxError) {
		console.error('Syntax Error:');
		console.error(err.message);
		console.error(err.codeFrame);
	} else {
		console.error(err.message);
	}
}

function handleError(err) {
	logError(err);
	this.emit('end');
}

function bundleDev(bundler, output) {
	return bundler.bundle()
		.on('error', handleError)
		.pipe(source(output))
		.pipe(gulp.dest(paths.build));
}

function bundleDist(bundler, output) {
	return bundler.bundle()
		.on('error', handleError)
		.pipe(source(output))
		.pipe(buffer())
		.pipe(uglify().on('error', handleError))
		.pipe(gulp.dest(paths.build));
}

function bundle(root, output, minify) {
	let bundler = browserify(root, {
		debug: !minify,
		standalone: project
	}).transform(babel, {
		global: true,
		compact: true,
		presets: ['@babel/preset-env']
	});
	return (minify) ? bundleDist(bundler, output) : bundleDev(bundler, output);
}

function buildDev() {
	return bundle(paths.root, `${project}.min.js`, true);
}

function buildDist() {
	return bundle(paths.root, `${project}.js`, false);
}

function buildStyles() {
	return gulp.src(paths.styles)
		.pipe(css())
		.pipe(concat(`${project}.css`))
		.pipe(gulp.dest(paths.build));
}

const build = gulp.series(clean, lint, gulp.parallel(buildDev, buildDist, buildStyles));

exports.clean = clean;
exports.lint = lint;
exports.build = build;
exports.default = build;

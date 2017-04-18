'use strict';

const babel = require('babelify');
const browserify = require('browserify');
const concat = require('gulp-concat');
const csso = require('gulp-csso');
const del = require('del');
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const runSequence = require('run-sequence');
const source = require('vinyl-source-stream');

const name = 'veldt';
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

gulp.task('clean', () => {
	del.sync(paths.build);
});

gulp.task('lint', () => {
	return gulp.src(paths.scripts)
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task('build-scripts', () => {
	return browserify(paths.root, {
			debug: true,
			standalone: name
		}).transform(babel, {
			global: true,
			compact: true,
			presets: [ 'es2015' ]
		})
		.bundle()
		.on('error', function(err) {
			if (err instanceof SyntaxError) {
				console.error('Syntax Error:');
				console.error(err.message);
				console.error(err.codeFrame);
			} else {
				console.error(err.message);
			}
			this.emit('end');
		})
		.pipe(source(`${name}.js`))
		.pipe(gulp.dest(paths.build));
});

gulp.task('build-styles', () => {
	return gulp.src(paths.styles)
		.pipe(csso())
		.pipe(concat(`${name}.css`))
		.pipe(gulp.dest(paths.build));
});

gulp.task('build', done => {
	runSequence(
		[ 'clean', 'lint' ],
		[ 'build-scripts', 'build-styles' ],
		done);
});

gulp.task('default', [ 'build' ], () => {
});

(function() {

    'use strict';

    const gulp = require('gulp');
    const runSequence = require('run-sequence');
    const source = require('vinyl-source-stream');
    const buffer = require('vinyl-buffer');
    const uglify = require('gulp-uglify');
    const browserify = require('browserify');
    const del = require('del');
    const jshint = require('gulp-jshint');
    const csso = require('gulp-csso');
    const concat = require('gulp-concat');
    const babel = require('babelify');

    const name = 'prism';
    const paths = {
        root: 'scripts/exports.js',
        styles: [
            'styles/main.css',
            'styles/**/*.css'
        ],
        scripts: [
            'scripts/**/*.js'
        ],
        build: 'build'
    };

    function handleError(err) {
        console.error(err);
        this.emit('end');
    }

    function bundle(b, output) {
        return b.bundle()
            .on('error', handleError)
            .pipe(source(output))
            .pipe(gulp.dest(paths.build));
    }

    function bundleMin(b, output) {
        return b.bundle()
            .on('error', handleError)
            .pipe(source(output))
            .pipe(buffer())
            .pipe(uglify())
            .pipe(gulp.dest(paths.build));
    }

    function build(root, output, minify) {
        const b = browserify(root, {
                debug: !minify,
                standalone: name
            }).transform(babel, {
                presets: [ 'es2015' ]
            });
        return (minify) ? bundleMin(b, output) : bundle(b, output);
    }

    gulp.task('clean', function () {
        del([ paths.build ]);
    });

    gulp.task('lint', function() {
        return gulp.src(paths.scripts)
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('jshint-stylish'));
    });

    gulp.task('build-scripts', function() {
        return build(paths.root, `${name}.js`, false);
    });

    gulp.task('build-styles', function () {
        return gulp.src(paths.styles)
            .pipe(csso())
            .pipe(concat(`${name}.css`))
            .pipe(gulp.dest(paths.build));
    });

    gulp.task('build', function(done) {
        runSequence(
            [ 'clean', 'lint' ],
            [ 'build-scripts', 'build-styles' ],
            done);
    });

    gulp.task('default', [ 'build' ], function() {
    });

}());

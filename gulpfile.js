(function() {

    'use strict';

    var gulp = require('gulp');
    var runSequence = require('run-sequence');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');
    var uglify = require('gulp-uglify');
    var browserify = require('browserify');
    var del = require('del');
    var jshint = require('gulp-jshint');
    var csso = require('gulp-csso');
    var concat = require('gulp-concat');
    var babel = require('babelify');

    var name = 'prism';
    var paths = {
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
        var b = browserify(root, {
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
        return build(paths.root, name + '.js', false);
    });

    gulp.task('build-styles', function () {
        return gulp.src(paths.styles)
            .pipe(csso())
            .pipe(concat(name + '.css'))
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

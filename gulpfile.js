( function() {

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

    var GO_PATH = process.env.GOPATH;
    var COPY_PATH = GO_PATH + '/src/github.com/unchartedsoftware/prism-app-template/build/public/';

    gulp.task('copy-build', [ 'build' ], function() {
        return gulp.src([
            paths.build + '/' + name + '.js',
            paths.build + '/' + name + '.css'
        ]).pipe( gulp.dest( COPY_PATH ) );
    });

    function handleError( err ) {
        console.log( err );
        this.emit( 'end' );
    }

    function bundle( b, output ) {
        return b.bundle()
            .on( 'error', handleError )
            .pipe( source( output ) )
            .pipe( gulp.dest( paths.build ) );
    }

    function bundleMin( b, output ) {
        return b.bundle()
            .on( 'error', handleError )
            .pipe( source( output ) )
            .pipe( buffer() )
            .pipe( uglify() )
            .pipe( gulp.dest( paths.build ) );
    }

    function build( root, output, minify ) {
        var b = browserify( root, {
            debug: !minify,
            standalone: name
        });
        return ( minify ) ? bundleMin( b, output ) : bundle( b, output );
    }

    gulp.task('clean', function () {
        del([ paths.build ]);
    });

    gulp.task('lint', function() {
        return gulp.src( paths.scripts )
            .pipe( jshint('.jshintrc') )
            .pipe( jshint.reporter('jshint-stylish') );
    });

    gulp.task('build-min-scripts', function() {
        return build( paths.root, name + '.min.js', true );
    });

    gulp.task('build-scripts', function() {
        return build( paths.root, name + '.js', false );
    });

    gulp.task('build-styles', function () {
        return gulp.src( paths.styles )
            .pipe( csso() )
            .pipe( concat( name + '.css') )
            .pipe( gulp.dest( paths.build ) );
    });

    gulp.task('build', function( done ) {
        runSequence(
            [ 'clean', 'lint' ],
            [ 'build-scripts', 'build-min-scripts', 'build-styles' ],
            done );
    });

    gulp.task('watch', [ 'copy-build' ], function( done ) {
        gulp.watch( paths.scripts, [ 'copy-build' ] );
        gulp.watch( paths.styles, [ 'copy-build' ] );
        done();
    });

    gulp.task('default', [ 'watch' ], function() {
    });

}());

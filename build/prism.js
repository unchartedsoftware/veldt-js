(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.prism = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        _boundBuffer = null;

    /**
     * Instantiates an IndexBuffer object.
     * @class IndexBuffer
     * @classdesc An index buffer object.
     */
    function IndexBuffer( arg, options ) {
        options = options || {};
        this.gl = WebGLContext.get();
        this.buffer = 0;
        if ( arg ) {
            if ( arg instanceof WebGLBuffer ) {
                // if the argument is already a webglbuffer, simply wrap it
                this.buffer = arg;
                this.type = options.type || 'UNSIGNED_SHORT';
                this.count = ( options.count !== undefined ) ? options.count : 0;
            } else {
                // otherwise, buffer it
                this.bufferData( arg );
            }
        }
        this.offset = ( options.offset !== undefined ) ? options.offset : 0;
        this.mode = ( options.mode !== undefined ) ? options.mode : 'TRIANGLES';
    }

    /**
     * Upload index data to the GPU.
     * @memberof IndexBuffer
     *
     * @param {Array|Uint16Array|Uint32Array} arg - The array of data to buffer.
     *
     * @returns {IndexBuffer} The index buffer object for chaining.
     */
    IndexBuffer.prototype.bufferData = function( arg ) {
        var gl = this.gl;
        // check for type support
        var uint32support = WebGLContext.checkExtension( 'OES_element_index_uint' );
        if( !uint32support ) {
            // no support for uint32
            if ( arg instanceof Array ) {
                // if array, buffer to uint16
                arg = new Uint16Array( arg );
            } else if ( arg instanceof Uint32Array ) {
                // if uint32, downgrade to uint16
                console.warn( 'Cannot create IndexBuffer of format ' +
                    'gl.UNSIGNED_INT as OES_element_index_uint is not ' +
                    'supported, defaulting to gl.UNSIGNED_SHORT.' );
                arg = new Uint16Array( arg );
            }
        } else {
            // uint32 is supported
            if ( arg instanceof Array ) {
                // if array, buffer to uint32
                arg = new Uint32Array( arg );
            }
        }
        // set data type based on array
        if ( arg instanceof Uint16Array ) {
            this.type = 'UNSIGNED_SHORT';
        } else if ( arg instanceof Uint32Array ) {
            this.type = 'UNSIGNED_INT';
        } else {
            console.error( 'IndexBuffer requires an Array or ' +
                'ArrayBuffer argument, command ignored.' );
            return;
        }
        // create buffer, store count
        if ( !this.buffer ) {
            this.buffer = gl.createBuffer();
        }
        this.count = arg.length;
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.buffer );
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, arg, gl.STATIC_DRAW );
        return this;
    };

    /**
     * Binds the index buffer object.
     * @memberof IndexBuffer
     *
     * @returns {IndexBuffer} Returns the index buffer object for chaining.
     */
    IndexBuffer.prototype.bind = function() {
        // if this buffer is already bound, exit early
        if ( _boundBuffer === this ) {
            return;
        }
        var gl = this.gl;
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.buffer );
        _boundBuffer = this;
        return this;
    };

    /**
     * Unbinds the index buffer object.
     * @memberof IndexBuffer
     *
     * @returns {IndexBuffer} Returns the index buffer object for chaining.
     */
    IndexBuffer.prototype.unbind = function() {
        // if there is no buffer bound, exit early
        if ( _boundBuffer === null ) {
            return;
        }
        var gl = this.gl;
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
        _boundBuffer = null;
        return this;
    };

    /**
     * Execute the draw command for the bound buffer.
     * @memberof IndexBuffer
     *
     * @param {Object} options - The options to pass to 'drawElements'. Optional.
     *
     * @returns {IndexBuffer} Returns the index buffer object for chaining.
     */
    IndexBuffer.prototype.draw = function( options ) {
        options = options || {};
        if ( _boundBuffer === null ) {
            console.warn( 'No IndexBuffer is bound, command ignored.' );
            return;
        }
        var gl = this.gl;
        var mode = gl[ options.mode || this.mode || 'TRIANGLES' ];
        var offset = ( options.offset !== undefined ) ? options.offset : this.offset;
        var count = ( options.count !== undefined ) ? options.count : this.count;
        gl.drawElements(
            mode,
            count,
            gl[ this.type ],
            offset );
        return this;
    };

    module.exports = IndexBuffer;

}());

},{"./WebGLContext":11}],2:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        Stack = require('../util/Stack'),
        _stack = new Stack(),
        _boundBuffer = null;

    /**
     * Binds the renderTarget object, caching it to prevent unnecessary rebinds.
     *
     * @param {RenderTarget} renderTarget - The RenderTarget object to bind.
     */
     function bind( renderTarget ) {
        // if this buffer is already bound, exit early
        if ( _boundBuffer === renderTarget ) {
            return;
        }
        var gl = renderTarget.gl;
        gl.bindFramebuffer( gl.FRAMEBUFFER, renderTarget.framebuffer );
        _boundBuffer = renderTarget;
    }

    /**
     * Unbinds the renderTarget object. Prevents unnecessary unbinding.
     *
     * @param {RenderTarget} renderTarget - The RenderTarget object to unbind.
     */
     function unbind( renderTarget ) {
        // if there is no buffer bound, exit early
        if ( _boundBuffer === null ) {
            return;
        }
        var gl = renderTarget.gl;
        gl.bindFramebuffer( gl.FRAMEBUFFER, null );
        _boundBuffer = null;
    }

    /**
     * Instantiates a RenderTarget object.
     * @class RenderTarget
     * @classdesc A renderTarget class to allow rendering to textures.
     */
    function RenderTarget() {
        var gl = this.gl = WebGLContext.get();
        this.framebuffer = gl.createFramebuffer();
        this.textures = {};
        return this;
    }

    /**
     * Binds the renderTarget object and pushes it to the front of the stack.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.push = function() {
        _stack.push( this );
        bind( this );
        return this;
    };

    /**
     * Unbinds the renderTarget object and binds the renderTarget beneath it on
     * this stack. If there is no underlying renderTarget, bind the backbuffer.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.pop = function() {
        var top;
        _stack.pop();
        top = _stack.top();
        if ( top ) {
            bind( top );
        } else {
            unbind( this );
        }
        return this;
    };

    /**
     * Attaches the provided texture to the provided attachment location.
     * @memberof RenderTarget
     *
     * @param {Texture2D} texture - The texture to attach.
     * @param {number} index - The attachment index. (optional)
     * @param {String} target - The texture target type. (optional)
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.setColorTarget = function( texture, index, target ) {
        var gl = this.gl;
        if ( typeof index === 'string' ) {
            target = index;
            index = undefined;
        }
        index = ( index !== undefined ) ? index : 0;
        this.textures[ 'color' + index ] = texture;
        this.push();
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl[ 'COLOR_ATTACHMENT' + index ],
            gl[ target || 'TEXTURE_2D' ],
            texture.texture,
            0 );
        this.pop();
        return this;
    };

    /**
     * Attaches the provided texture to the provided attachment location.
     * @memberof RenderTarget
     *
     * @param {Texture2D} texture - The texture to attach.
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.setDepthTarget = function( texture ) {
        var gl = this.gl;
        this.textures.depth = texture;
        this.push();
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            texture.texture,
            0 );
        this.pop();
        return this;
    };

    /**
     * Clears the color bits of the renderTarget.
     * @memberof RenderTarget
     *
     * @param {number} r - The red value.
     * @param {number} g - The green value.
     * @param {number} b - The blue value.
     * @param {number} a - The alpha value.
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.clearColor = function( r, g, b, a ) {
        var gl = this.gl;
        r = ( r !== undefined ) ? r : 0;
        g = ( g !== undefined ) ? g : 0;
        b = ( b !== undefined ) ? b : 0;
        a = ( a !== undefined ) ? a : 0;
        this.push();
        gl.clearColor( r, g, b, a );
        gl.clear( gl.COLOR_BUFFER_BIT );
        this.pop();
        return this;
    };

    /**
     * Clears the depth bits of the renderTarget.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.clearDepth = function( r, g, b, a ) {
        var gl = this.gl;
        r = ( r !== undefined ) ? r : 0;
        g = ( g !== undefined ) ? g : 0;
        b = ( b !== undefined ) ? b : 0;
        a = ( a !== undefined ) ? a : 0;
        this.push();
        gl.clearColor( r, g, b, a );
        gl.clear( gl.DEPTH_BUFFER_BIT );
        this.pop();
        return this;
    };

    /**
     * Clears the stencil bits of the renderTarget.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.clearStencil = function( r, g, b, a ) {
        var gl = this.gl;
        r = ( r !== undefined ) ? r : 0;
        g = ( g !== undefined ) ? g : 0;
        b = ( b !== undefined ) ? b : 0;
        a = ( a !== undefined ) ? a : 0;
        this.push();
        gl.clearColor( r, g, b, a );
        gl.clear( gl.STENCIL_BUFFER_BIT );
        this.pop();
        return this;
    };

    /**
     * Clears all the bits of the renderTarget.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.clear = function( r, g, b, a ) {
        var gl = this.gl;
        r = ( r !== undefined ) ? r : 0;
        g = ( g !== undefined ) ? g : 0;
        b = ( b !== undefined ) ? b : 0;
        a = ( a !== undefined ) ? a : 0;
        this.push();
        gl.clearColor( r, g, b, a );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT );
        this.pop();
        return this;
    };

    /**
     * Resizes the renderTarget and all attached textures by the provided height
     * and width.
     * @memberof RenderTarget
     *
     * @param {number} width - The new width of the renderTarget.
     * @param {number} height - The new height of the renderTarget.
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.resize = function( width, height ) {
        var key;
        if ( !width || !height ) {
            console.warn( 'Width or height arguments missing, command ignored.' );
            return this;
        }
        for ( key in this.textures ) {
            if ( this.textures.hasOwnProperty( key ) ) {
                this.textures[ key ].resize( width, height );
            }
        }
        return this;
    };

    module.exports = RenderTarget;

}());

},{"../util/Stack":13,"./WebGLContext":11}],3:[function(require,module,exports){
(function () {

    'use strict';

    var VertexPackage = require('../core/VertexPackage'),
        VertexBuffer = require('../core/VertexBuffer'),
        IndexBuffer = require('../core/IndexBuffer');

    function Renderable( spec, options ) {
        spec = spec || {};
        options = options || {};
        if ( spec.vertexBuffer || spec.vertexBuffers ) {
            // use existing vertex buffer
            this.vertexBuffers = spec.vertexBuffers || [ spec.vertexBuffer ];
        } else {
            // create vertex package
            var vertexPackage = new VertexPackage( spec.vertices );
            // create vertex buffer
            this.vertexBuffers = [ new VertexBuffer( vertexPackage ) ];
        }
        if ( spec.indexBuffer ) {
            // use existing index buffer
            this.indexBuffer = spec.indexBuffer;
        } else {
            if ( spec.indices ) {
                // create index buffer
                this.indexBuffer = new IndexBuffer( spec.indices );
            }
        }
        // store rendering options
        this.options = {
            mode: options.mode,
            offset: options.offset,
            count: options.count
        };
        return this;
    }

    Renderable.prototype.draw = function( options ) {
        var overrides = options || {};
        // override options if provided
        overrides.mode = overrides.mode || this.options.mode;
        overrides.offset = ( overrides.offset !== undefined ) ? overrides.offset : this.options.offset;
        overrides.count = ( overrides.count !== undefined ) ? overrides.count : this.options.count;
        // draw the renderable
        if ( this.indexBuffer ) {
            // use index buffer to draw elements
            this.vertexBuffers.forEach( function( vertexBuffer ) {
                vertexBuffer.bind();
                // no advantage to unbinding as there is no stack used
            });
            this.indexBuffer.bind();
            this.indexBuffer.draw( overrides );
            // no advantage to unbinding as there is no stack used
        } else {
            // no index buffer, use draw arrays
            this.vertexBuffers.forEach( function( vertexBuffer ) {
                vertexBuffer.bind();
                vertexBuffer.draw( overrides );
                // no advantage to unbinding as there is no stack used
            });
        }
        return this;
    };

    module.exports = Renderable;

}());

},{"../core/IndexBuffer":1,"../core/VertexBuffer":8,"../core/VertexPackage":9}],4:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        ShaderParser = require('./ShaderParser'),
        Util = require('../util/Util'),
        XHRLoader = require('../util/XHRLoader'),
        Stack = require('../util/Stack'),
        UNIFORM_FUNCTIONS = {
            'bool': 'uniform1i',
            'bool[]': 'uniform1iv',
            'float': 'uniform1f',
            'float[]': 'uniform1fv',
            'int': 'uniform1i',
            'int[]': 'uniform1iv',
            'uint': 'uniform1i',
            'uint[]': 'uniform1iv',
            'vec2': 'uniform2fv',
            'vec2[]': 'uniform2fv',
            'ivec2': 'uniform2iv',
            'ivec2[]': 'uniform2iv',
            'vec3': 'uniform3fv',
            'vec3[]': 'uniform3fv',
            'ivec3': 'uniform3iv',
            'ivec3[]': 'uniform3iv',
            'vec4': 'uniform4fv',
            'vec4[]': 'uniform4fv',
            'ivec4': 'uniform4iv',
            'ivec4[]': 'uniform4iv',
            'mat2': 'uniformMatrix2fv',
            'mat2[]': 'uniformMatrix2fv',
            'mat3': 'uniformMatrix3fv',
            'mat3[]': 'uniformMatrix3fv',
            'mat4': 'uniformMatrix4fv',
            'mat4[]': 'uniformMatrix4fv',
            'sampler2D': 'uniform1i',
            'samplerCube': 'uniform1i'
        },
        _stack = new Stack(),
        _boundShader = null;

    /**
     * Given vertex and fragment shader source, returns an object containing
     * information pertaining to the uniforms and attribtues declared.
     *
     * @param {String} vertSource - The vertex shader source.
     * @param {String} fragSource - The fragment shader source.
     *
     * @returns {Object} The attribute and uniform information.
     */
    function getAttributesAndUniformsFromSource( vertSource, fragSource ) {
        var declarations = ShaderParser.parseDeclarations(
                [ vertSource, fragSource ],
                [ 'uniform', 'attribute' ]),
            attributes = {},
            uniforms = {},
            attrCount = 0,
            declaration,
            i;
        // for each declaration in the shader
        for ( i=0; i<declarations.length; i++ ) {
            declaration = declarations[i];
            // check if its an attribute or uniform
            if ( declaration.qualifier === 'attribute' ) {
                // if attribute, store type and index
                attributes[ declaration.name ] = {
                    type: declaration.type,
                    index: attrCount++
                };
            } else if ( declaration.qualifier === 'uniform' ) {
                // if uniform, store type and buffer function name
                uniforms[ declaration.name ] = {
                    type: declaration.type,
                    func: UNIFORM_FUNCTIONS[ declaration.type + (declaration.count > 1 ? '[]' : '') ]
                };
            }
        }
        return {
            attributes: attributes,
            uniforms: uniforms
        };
    }

    /*
     * Given a shader source string and shader type, compiles the shader and
     * returns the resulting WebGLShader object.
     *
     * @param {WebGLRenderingContext} gl - The webgl rendering context.
     * @param {String} shaderSource - The shader source.
     * @param {String} type - The shader type.
     *
     * @returns {WebGLShader} The compiled shader object.
     */
    function compileShader( gl, shaderSource, type ) {
        var shader = gl.createShader( gl[ type ] );
        gl.shaderSource( shader, shaderSource );
        gl.compileShader( shader );
        if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
            console.error( 'An error occurred compiling the shaders: ' +
                gl.getShaderInfoLog( shader ) );
            return null;
        }
        return shader;
    }

    /**
     * Binds the attribute locations for the Shader object.
     *
     * @param {Shader} shader - The Shader object.
     */
    function bindAttributeLocations( shader ) {
        var gl = shader.gl,
            attributes = shader.attributes,
            name;
        for ( name in attributes ) {
            if ( attributes.hasOwnProperty( name ) ) {
                // bind the attribute location
                gl.bindAttribLocation(
                    shader.program,
                    attributes[ name ].index,
                    name );
                /*
                console.log( 'Bound vertex attribute \`' + name +
                    '\' to location ' + attributes[ name ].index );
                */
            }
        }
    }

    /**
     * Queries the webgl rendering context for the uniform locations.
     *
     * @param {Shader} shader - The Shader object.
     */
    function getUniformLocations( shader ) {
        var gl = shader.gl,
            uniforms = shader.uniforms,
            uniform,
            name;
        for ( name in uniforms ) {
            if ( uniforms.hasOwnProperty( name ) ) {
                uniform = uniforms[ name ];
                // get the uniform location
                uniform.location = gl.getUniformLocation( shader.program, name );
                /*
                console.log( name + ', ' +
                    gl.getUniformLocation( shader.program, name ) + ',' );
                */
            }
        }
    }

    /**
     * Returns a function to load shader source from a url.
     *
     * @param {String} url - The url to load the resource from.
     *
     * @returns {Function} The function to load the shader source.
     */
    function loadShaderSource( url ) {
        return function( done ) {
            XHRLoader.load(
                url,
                {
                    responseType: 'text',
                    success: done,
                    error: function(err) {
                        console.error( err );
                        done( null );
                    }
                });
        };
    }

    /**
     * Returns a function to pass through the shader source.
     *
     * @param {String} source - The source of the shader.
     *
     * @returns {Function} The function to pass through the shader source.
     */
    function passThroughSource( source ) {
        return function( done ) {
            done( source );
        };
    }

    /**
     * Returns a function that takes an array of GLSL source strings and URLs,
     * and resolves them into and array of GLSL source.
     */
    function resolveSources( sources ) {
        return function( done ) {
            var jobs = [];
            sources = sources || [];
            sources = ( !( sources instanceof Array ) ) ? [ sources ] : sources;
            sources.forEach( function( source ) {
                if ( ShaderParser.isGLSL( source ) ) {
                    jobs.push( passThroughSource( source ) );
                } else {
                    jobs.push( loadShaderSource( source ) );
                }
            });
            Util.async( jobs, function( results ) {
                done( results );
            });
        };
    }

    /**
     * Binds the shader object, caching it to prevent unnecessary rebinds.
     *
     * @param {Shader} shader - The Shader object to bind.
     */
    function bind( shader ) {
        // if this shader is already bound, exit early
        if ( _boundShader === shader ) {
            return;
        }
        shader.gl.useProgram( shader.program );
        _boundShader = shader;
    }

    /**
     * Unbinds the shader object. Prevents unnecessary unbinding.
     *
     * @param {Shader} shader - The Shader object to unbind.
     */
    function unbind( shader ) {
        // if there is no shader bound, exit early
        if ( _boundShader === null ) {
            return;
        }
        shader.gl.useProgram( null );
        _boundShader = null;
    }

    /**
     * Clears the shader attributes due to aborting of initialization.
     *
     * @param {Shader} shader - The Shader object.
     */
    function abortShader( shader ) {
        shader.program = null;
        shader.attributes = null;
        shader.uniforms = null;
        return shader;
    }

    /**
     * Instantiates a Shader object.
     * @class Shader
     * @classdesc A shader class to assist in compiling and linking webgl
     * shaders, storing attribute and uniform locations, and buffering uniforms.
     */
    function Shader( spec, callback ) {
        var that = this;
        spec = spec || {};
        this.program = 0;
        this.gl = WebGLContext.get();
        this.version = spec.version || '1.00';
        // check source arguments
        if ( !spec.vert ) {
            console.error( 'Vertex shader argument has not been provided, ' +
                'shader initialization aborted.' );
        }
        if ( !spec.frag ) {
            console.error( 'Fragment shader argument has not been provided, ' +
                'shader initialization aborted.' );
        }
        // create the shader
        Util.async({
            common: resolveSources( spec.common ),
            vert: resolveSources( spec.vert ),
            frag: resolveSources( spec.frag ),
        }, function( shaders ) {
            that.create( shaders );
            if ( callback ) {
                callback( that );
            }
        });
    }

    /**
     * Creates the shader object from source strings. This includes:
     *    1) Compiling and linking the shader program.
     *    2) Parsing shader source for attribute and uniform information.
     *    3) Binding attribute locations, by order of delcaration.
     *    4) Querying and storing uniform location.
     * @memberof Shader
     *
     * @param {Object} shaders - A map containing sources under 'vert' and
     *     'frag' attributes.
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.create = function( shaders ) {
        // once all shader sources are loaded
        var gl = this.gl,
            common = shaders.common.join( '' ),
            vert = shaders.vert.join( '' ),
            frag = shaders.frag.join( '' ),
            vertexShader,
            fragmentShader,
            attributesAndUniforms;
        // compile shaders
        vertexShader = compileShader( gl, common + vert, 'VERTEX_SHADER' );
        fragmentShader = compileShader( gl, common + frag, 'FRAGMENT_SHADER' );
        if ( !vertexShader || !fragmentShader ) {
            console.error( 'Aborting instantiation of shader due to compilation errors.' );
            return abortShader( this );
        }
        // parse source for attribute and uniforms
        attributesAndUniforms = getAttributesAndUniformsFromSource( vert, frag );
        // set member attributes
        this.attributes = attributesAndUniforms.attributes;
        this.uniforms = attributesAndUniforms.uniforms;
        // create the shader program
        this.program = gl.createProgram();
        // attach vertex and fragment shaders
        gl.attachShader( this.program, vertexShader );
        gl.attachShader( this.program, fragmentShader );
        // bind vertex attribute locations BEFORE linking
        bindAttributeLocations( this );
        // link shader
        gl.linkProgram( this.program );
        // If creating the shader program failed, alert
        if ( !gl.getProgramParameter( this.program, gl.LINK_STATUS ) ) {
            console.error( 'An error occured linking the shader: ' +
                gl.getProgramInfoLog( this.program ) );
            console.error( 'Aborting instantiation of shader due to linking errors.' );
            return abortShader( this );
        }
        // get shader uniform locations
        getUniformLocations( this );
        return this;
    };

    /**
     * Binds the shader object and pushes it to the front of the stack.
     * @memberof Shader
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.push = function() {
        _stack.push( this );
        bind( this );
        return this;
    };

    /**
     * Unbinds the shader object and binds the shader beneath it on
     * this stack. If there is no underlying shader, bind the backbuffer.
     * @memberof Shader
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.pop = function() {
        var top;
        _stack.pop();
        top = _stack.top();
        if ( top ) {
            bind( top );
        } else {
            unbind( this );
        }
        return this;
    };

    /**
     * Buffer a uniform value by name.
     * @memberof Shader
     *
     * @param {String} uniformName - The uniform name in the shader source.
     * @param {*} uniform - The uniform value to buffer.
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.setUniform = function( uniformName, uniform ) {
        if ( !this.program ) {
            if ( !this.hasLoggedError ) {
                console.warn( 'Attempting to use an incomplete shader, command ignored.' );
                this.hasLoggedError = true;
            }
            return;
        }
        if ( this !== _boundShader ) {
            console.warn( 'Attempting to set uniform `' + uniformName +
                '` for an unbound shader, command ignored.' );
            return;
        }
        var uniformSpec = this.uniforms[ uniformName ],
            func,
            type,
            location,
            value;
        // ensure that the uniform spec exists for the name
        if ( !uniformSpec ) {
            console.warn( 'No uniform found under name `' + uniformName +
                '`, command ignored.' );
            return;
        }
        // ensure that the uniform argument is defined
        if ( uniform === undefined ) {
            console.warn( 'Argument passed for uniform `' + uniformName +
                '` is undefined, command ignored.' );
            return;
        }
        // get the uniform location, type, and buffer function
        func = uniformSpec.func;
        type = uniformSpec.type;
        location = uniformSpec.location;
        value = uniform.toArray ? uniform.toArray() : uniform;
        value = ( value instanceof Array ) ? new Float32Array( value ) : value;
        // convert boolean's to 0 or 1
        value = ( typeof value === 'boolean' ) ? ( value ? 1 : 0 ) : value;
        // pass the arguments depending on the type
        switch ( type ) {
            case 'mat2':
            case 'mat3':
            case 'mat4':
                this.gl[ func ]( location, false, value );
                break;
            default:
                this.gl[ func ]( location, value );
                break;
        }
        return this;
    };

    module.exports = Shader;

}());

},{"../util/Stack":13,"../util/Util":14,"../util/XHRLoader":15,"./ShaderParser":5,"./WebGLContext":11}],5:[function(require,module,exports){
(function () {

    'use strict';

    var PRECISION_QUALIFIERS = {
        highp: true,
        mediump: true,
        lowp: true
    };

    var PRECISION_TYPES = {
        float: 'float',
        vec2: 'float',
        vec3: 'float',
        vec4: 'float',
        ivec2: 'int',
        ivec3: 'int',
        ivec4: 'int',
        int: 'int',
        uint: 'int',
        sampler2D: 'sampler2D',
        samplerCube: 'samplerCube',
    };

    var COMMENTS_REGEXP = /(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm;
    var ENDLINE_REGEXP = /(\r\n|\n|\r)/gm;
    var WHITESPACE_REGEXP = /\s{2,}/g;
    var BRACKET_WHITESPACE_REGEXP = /(\s*)(\[)(\s*)(\d+)(\s*)(\])(\s*)/g;
    var NAME_COUNT_REGEXP = /([a-zA-Z_][a-zA-Z0-9_]*)(?:\[(\d+)\])?/;
    var PRECISION_REGEX = /\b(precision)\s+(\w+)\s+(\w+)/;
    var GLSL_REGEXP =  /void\s+main\s*\(\s*\)\s*/mi;

    /**
     * Removes standard comments from the provided string.
     *
     * @param {String} str - The string to strip comments from.
     *
     * @return {String} The commentless string.
     */
    function stripComments( str ) {
        // regex source: https://github.com/moagrius/stripcomments
        return str.replace( COMMENTS_REGEXP, '' );
    }

    /**
     * Converts all whitespace into a single ' ' space character.
     *
     * @param {String} str - The string to normalize whitespace from.
     *
     * @return {String} The normalized string.
     */
    function normalizeWhitespace( str ) {
        return str.replace( ENDLINE_REGEXP, ' ' ) // remove line endings
            .replace( WHITESPACE_REGEXP, ' ' ) // normalize whitespace to single ' '
            .replace( BRACKET_WHITESPACE_REGEXP, '$2$4$6' ); // remove whitespace in brackets
    }

    /**
     * Parses the name and count out of a name statement, returning the
     * declaration object.
     *
     * @param {String} qualifier - The qualifier string.
     * @param {String} precision - The precision string.
     * @param {String} type - The type string.
     * @param {String} entry - The variable declaration string.
     */
    function parseNameAndCount( qualifier, precision, type, entry ) {
        // determine name and size of variable
        var matches = entry.match( NAME_COUNT_REGEXP );
        var name = matches[1];
        var count = ( matches[2] === undefined ) ? 1 : parseInt( matches[2], 10 );
        return {
            qualifier: qualifier,
            precision: precision,
            type: type,
            name: name,
            count: count
        };
    }

    /**
     * Parses a single 'statement'. A 'statement' is considered any sequence of
     * characters followed by a semi-colon. Therefore, a single 'statement' in
     * this sense could contain several comma separated declarations. Returns
     * all resulting declarations.
     *
     * @param {String} statement - The statement to parse.
     * @param {Object} precisions - The current state of global precisions.
     *
     * @returns {Array} The array of parsed declaration objects.
     */
    function parseStatement( statement, precisions ) {
        // split statement on commas
        //
        // [ 'uniform highp mat4 A[10]', 'B', 'C[2]' ]
        //
        var commaSplit = statement.split(',').map( function( elem ) {
            return elem.trim();
        });

        // split declaration header from statement
        //
        // [ 'uniform', 'highp', 'mat4', 'A[10]' ]
        //
        var header = commaSplit.shift().split(' ');

        // qualifier is always first element
        //
        // 'uniform'
        //
        var qualifier = header.shift();

        // precision may or may not be declared
        //
        // 'highp' || (if it was omited) 'mat4'
        //
        var precision = header.shift();
        var type;
        // if not a precision keyword it is the type instead
        if ( !PRECISION_QUALIFIERS[ precision ] ) {
            type = precision;
            precision = precisions[ PRECISION_TYPES[ type ] ];
        } else {
            type = header.shift();
        }

        // last part of header will be the first, and possible only variable name
        //
        // [ 'A[10]', 'B', 'C[2]' ]
        //
        var names = header.concat( commaSplit );
        // if there are other names after a ',' add them as well
        var results = [];
        names.forEach( function( name ) {
            results.push( parseNameAndCount( qualifier, precision, type, name ) );
        });
        return results;
    }

    /**
     * Splits the source string by semi-colons and constructs an array of
     * declaration objects based on the provided qualifier keywords.
     *
     * @param {String} source - The shader source string.
     * @param {String|Array} keywords - The qualifier declaration keywords.
     *
     * @returns {Array} The array of qualifier declaration objects.
     */
    function parseSource( source, keywords ) {
        // remove all comments from source
        var commentlessSource = stripComments( source );
        // normalize all whitespace in the source
        var normalized = normalizeWhitespace( commentlessSource );
        // get individual statements ( any sequence ending in ; )
        var statements = normalized.split(';');
        // build regex for parsing statements with targetted keywords
        var keywordStr = keywords.join('|');
        var keywordRegex = new RegExp( '.*\\b(' + keywordStr + ')\\b.*' );
        // parse and store global precision statements and any declarations
        var precisions = {};
        var matched = [];
        // for each statement
        statements.forEach( function( statement ) {
            // check if precision statement
            //
            // [ 'precision highp float', 'precision', 'highp', 'float' ]
            //
            var pmatch = statement.match( PRECISION_REGEX );
            if ( pmatch ) {
                precisions[ pmatch[3] ] = pmatch[2];
                return;
            }
            // check for keywords
            //
            // [ 'uniform float time' ]
            //
            var kmatch = statement.match( keywordRegex );
            if ( kmatch ) {
                // parse statement and add to array
                matched = matched.concat( parseStatement( kmatch[0], precisions ) );
            }
        });
        return matched;
    }

    /**
     * Filters out duplicate declarations present between shaders.
     *
     * @param {Array} declarations - The array of declarations.
     *
     * @returns {Array} The filtered array of declarations.
     */
    function filterDuplicatesByName( declarations ) {
        // in cases where the same declarations are present in multiple
        // sources, this function will remove duplicates from the results
        var seen = {};
        return declarations.filter( function( declaration ) {
            if ( seen[ declaration.name ] ) {
                return false;
            }
            seen[ declaration.name ] = true;
            return true;
        });
    }

    module.exports = {

        /**
         * Parses the provided GLSL source, and returns all declaration statements
         * that contain the provided qualifier type. This can be used to extract
         * all attributes and uniform names and types from a shader.
         *
         * For example, when provided a 'uniform' qualifiers, the declaration:
         * <pre>
         *     'uniform highp vec3 uSpecularColor;'
         * </pre>
         * Would be parsed to:
         * <pre>
         *     {
         *         qualifier: 'uniform',
         *         type: 'vec3',
         *         name: 'uSpecularColor',
         *         count: 1
         *     }
         * </pre>
         * @param {String|Array} sources - The shader sources.
         * @param {String|Array} qualifiers - The qualifiers to extract.
         *
         * @returns {Array} The array of qualifier declaration statements.
         */
        parseDeclarations: function( sources, qualifiers ) {
            // if no sources or qualifiers are provided, return empty array
            if ( !qualifiers || qualifiers.length === 0 ||
                !sources || sources.length === 0 ) {
                return [];
            }
            sources = ( sources instanceof Array ) ? sources : [ sources ];
            qualifiers = ( qualifiers instanceof Array ) ? qualifiers : [ qualifiers ];
            // parse out targetted declarations
            var declarations = [];
            sources.forEach( function( source ) {
                declarations = declarations.concat( parseSource( source, qualifiers ) );
            });
            // remove duplicates and return
            return filterDuplicatesByName( declarations );
        },

        /**
         * Detects based on the existence of a 'void main() {' statement, if
         * the string is glsl source code.
         *
         * @param {String} str - The input string to test.
         *
         * @returns {boolean} - True if the string is glsl code.
         */
        isGLSL: function( str ) {
            return GLSL_REGEXP.test( str );
        }

    };

}());

},{}],6:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        Util = require('../util/Util'),
        Stack = require('../util/Stack'),
        _stack = {},
        _boundTexture = null;

    /**
     * If the provided image dimensions are not powers of two, it will redraw
     * the image to the next highest power of two.
     *
     * @param {HTMLImageElement} image - The image object.
     *
     * @returns {HTMLImageElement} The new image object.
     */
    function ensurePowerOfTwo( image ) {
        if ( !Util.isPowerOfTwo( image.width ) ||
            !Util.isPowerOfTwo( image.height ) ) {
            var canvas = document.createElement( 'canvas' );
            canvas.width = Util.nextHighestPowerOfTwo( image.width );
            canvas.height = Util.nextHighestPowerOfTwo( image.height );
            var ctx = canvas.getContext('2d');
            ctx.drawImage(
                image,
                0, 0,
                image.width, image.height,
                0, 0,
                canvas.width, canvas.height );
            return canvas;
        }
        return image;
    }

    /**
     * Binds the texture object to a location and activates the texture unit
     * while caching it to prevent unnecessary rebinds.
     *
     * @param {Texture2D} texture - The Texture2D object to bind.
     * @param {number} location - The texture unit location index.
     */
    function bind( texture, location ) {
        // if this buffer is already bound, exit early
        if ( _boundTexture === texture ) {
            return;
        }
        var gl = texture.gl;
        location = gl[ 'TEXTURE' + location ] || gl.TEXTURE0;
        gl.activeTexture( location );
        gl.bindTexture( gl.TEXTURE_2D, texture.texture );
        _boundTexture = texture;
    }

    /**
     * Unbinds the texture object. Prevents unnecessary unbinding.
     *
     * @param {Texture2D} texture - The Texture2D object to unbind.
     */
    function unbind( texture ) {
        // if no buffer is bound, exit early
        if ( _boundTexture === null ) {
            return;
        }
        var gl = texture.gl;
        gl.bindTexture( gl.TEXTURE_2D, null );
        _boundTexture = null;
    }

    /**
     * Instantiates a Texture2D object.
     * @class Texture2D
     * @classdesc A texture class to represent a 2D texture.
     */
    function Texture2D( spec, callback ) {
        var that = this;
        // default
        spec = spec || {};
        this.gl = WebGLContext.get();
        // create texture object
        this.texture = this.gl.createTexture();
        this.wrap = spec.wrap || 'REPEAT';
        this.filter = spec.filter || 'LINEAR';
        this.invertY = spec.invertY !== undefined ? spec.invertY : true;
        this.mipMap = spec.mipMap !== undefined ? spec.mipMap : true;
        this.preMultiplyAlpha = spec.preMultiplyAlpha !== undefined ? spec.preMultiplyAlpha : true;
        // buffer the texture based on arguments
        if ( spec.image ) {
            // use existing Image object
            this.bufferData( spec.image );
            this.setParameters( this );
        } else if ( spec.url ) {
            // request image source from url
            var image = new Image();
            image.onload = function() {
                that.bufferData( image );
                that.setParameters( that );
                callback( that );
            };
            image.src = spec.url;
        } else {
            // assume this texture will be  rendered to. In this case disable
            // mipmapping, there is no need and it will only introduce very
            // peculiar rendering bugs in which the texture 'transforms' at
            // certain angles / distances to the mipmapped (empty) portions.
            this.mipMap = false;
            // buffer data
            if ( spec.format === 'DEPTH_COMPONENT' ) {
                // depth texture
                var depthTextureExt = WebGLContext.checkExtension( 'WEBGL_depth_texture' );
                if( !depthTextureExt ) {
                    console.warn( 'Cannot create Texture2D of format ' +
                        'gl.DEPTH_COMPONENT as WEBGL_depth_texture is ' +
                        'unsupported by this browser, command ignored' );
                    return;
                }
                // set format
                this.format = spec.format;
                // set type
                if ( !spec.type ) {
                    // default to unsigned int for higher precision
                    this.type = 'UNSIGNED_INT';
                } else if ( spec.type === 'UNSIGNED_SHORT' || spec.type === 'UNSIGNED_INT' ) {
                    // set to accept types
                    this.type = spec.type;
                } else {
                    // error
                    console.warn( 'Depth textures do not support type`' +
                        spec.type + '`, defaulting to `UNSIGNED_INT`.');
                    // default
                    this.type = 'UNSIGNED_INT';
                }
                // always disable mip mapping for depth texture
            } else {
                // other
                this.format = spec.format || 'RGBA';
                this.type = spec.type || 'UNSIGNED_BYTE';
            }
            this.internalFormat = this.format; // webgl requires format === internalFormat
            this.bufferData( spec.data || null, spec.width, spec.height );
            this.setParameters( this );
        }
    }

    /**
     * Binds the texture object and pushes it to the front of the stack.
     * @memberof Texture2D
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.push = function( location ) {
        _stack[ location ] = _stack[ location ] || new Stack();
        _stack[ location ].push( this );
        bind( this, location );
        return this;
    };

    /**
     * Unbinds the texture object and binds the texture beneath it on
     * this stack. If there is no underlying texture, unbinds the unit.
     * @memberof Texture2D
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.pop = function( location ) {
        var top;
        if ( !_stack[ location ] ) {
            console.warn( 'No texture was bound to texture unit `' + location +
                '`, command ignored.' );
        }
        _stack[ location ].pop();
        top = _stack[ location ].top();
        if ( top ) {
            bind( top, location );
        } else {
            unbind( this );
        }
        return this;
    };

    /**
     * Buffer data into the texture.
     * @memberof Texture2D
     *
     * @param {ImageData|ArrayBufferView|HTMLImageElement} data - The data.
     * @param {number} width - The width of the data.
     * @param {number} height - The height of the data.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.bufferData = function( data, width, height ) {
        var gl = this.gl;
        this.push();
        // invert y if specified
        gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, this.invertY );
        // premultiple alpha if specified
        gl.pixelStorei( gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.preMultiplyAlpha );
        // buffer texture based on type of data
        if ( data instanceof HTMLImageElement ) {
            // set dimensions of original image before resizing
            this.width = data.width;
            this.height = data.height;
            data = ensurePowerOfTwo( data );
            this.image = data;
            gl.texImage2D(
                gl.TEXTURE_2D,
                0, // level
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                data );
        } else {
            this.data = data;
            this.width = width || this.width;
            this.height = height || this.height;
            gl.texImage2D(
                gl.TEXTURE_2D,
                0, // level
                gl[ this.internalFormat ],
                this.width,
                this.height,
                0, // border, must be 0
                gl[ this.format ],
                gl[ this.type ],
                this.data );
        }
        if ( this.mipMap ) {
            gl.generateMipmap( gl.TEXTURE_2D );
        }
        this.pop();
        return this;
    };

    /**
     * Set the texture parameters.
     * @memberof Texture2D
     *
     * @param {Object} parameters - The parameters by name.
     * <pre>
     *     wrap | wrap.s | wrap.t - The wrapping type.
     *     filter | filter.min | filter.mag - The filter type.
     * </pre>
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.setParameters = function( parameters ) {
        var gl = this.gl;
        this.push();
        if ( parameters.wrap ) {
            // set wrap parameters
            this.wrap = parameters.wrap;
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl[ this.wrap.s || this.wrap ] );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl[ this.wrap.t || this.wrap ] );
        }
        if ( parameters.filter ) {
            // set filter parameters
            this.filter = parameters.filter;
            var minFilter = this.filter.min || this.filter;
            if ( this.mipMap ) {
                // append mipmap suffix to min filter
                minFilter += '_MIPMAP_LINEAR';
            }
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MAG_FILTER,
                gl[ this.filter.mag || this.filter ] );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_MIN_FILTER,
                gl[ minFilter] );
        }
        this.pop();
        return this;
    };

    /**
     * Resize the texture.
     * @memberof Texture2D
     *
     * @param {number} width - The new width of the texture.
     * @param {number} height - The new height of the texture.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.resize = function( width, height ) {
        if ( this.image ) {
            // there is no need to ever resize a texture that is based
            // of an actual image. That is what sampling is for.
            console.error( 'Cannot resize image based Texture2D' );
            return;
        }
        if ( !width || !height ) {
            console.warn( 'Width or height arguments missing, command ignored.' );
            return;
        }
        this.bufferData( this.data, width, height );
        return this;
    };

    module.exports = Texture2D;

}());

},{"../util/Stack":13,"../util/Util":14,"./WebGLContext":11}],7:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        Util = require('../util/Util'),
        Stack = require('../util/Stack'),
        FACES = [
            '-x', '+x',
            '-y', '+y',
            '-z', '+z'
        ],
        FACE_TARGETS = {
            '+z': 'TEXTURE_CUBE_MAP_POSITIVE_Z',
            '-z': 'TEXTURE_CUBE_MAP_NEGATIVE_Z',
            '+x': 'TEXTURE_CUBE_MAP_POSITIVE_X',
            '-x': 'TEXTURE_CUBE_MAP_NEGATIVE_X',
            '+y': 'TEXTURE_CUBE_MAP_POSITIVE_Y',
            '-y': 'TEXTURE_CUBE_MAP_NEGATIVE_Y'
        },
        _stack = {},
        _boundTexture = null;

    /**
     * If the provided image dimensions are not powers of two, it will redraw
     * the image to the next highest power of two.
     *
     * @param {HTMLImageElement} image - The image object.
     *
     * @returns {HTMLImageElement} The new image object.
     */
    function ensurePowerOfTwo( image ) {
        if ( !Util.isPowerOfTwo( image.width ) ||
            !Util.isPowerOfTwo( image.height ) ) {
            var canvas = document.createElement( 'canvas' );
            canvas.width = Util.nextHighestPowerOfTwo( image.width );
            canvas.height = Util.nextHighestPowerOfTwo( image.height );
            var ctx = canvas.getContext('2d');
            ctx.drawImage(
                image,
                0, 0,
                image.width, image.height,
                0, 0,
                canvas.width, canvas.height );
            return canvas;
        }
        return image;
    }

    /**
     * Binds the texture object to a location and activates the texture unit
     * while caching it to prevent unnecessary rebinds.
     *
     * @param {TextureCubeMap} texture - The TextureCubeMap object to bind.
     * @param {number} location - The texture unit location index.
     */
    function bind( texture, location ) {
        // if this buffer is already bound, exit early
        if ( _boundTexture === texture ) {
            return;
        }
        var gl = texture.gl;
        location = gl[ 'TEXTURE' + location ] || gl.TEXTURE0;
        gl.activeTexture( location );
        gl.bindTexture( gl.TEXTURE_CUBE_MAP, texture.texture );
        _boundTexture = texture;
    }

    /**
     * Unbinds the texture object. Prevents unnecessary unbinding.
     *
     * @param {TextureCubeMap} texture - The TextureCubeMap object to unbind.
     */
    function unbind( texture ) {
        // if no buffer is bound, exit early
        if ( _boundTexture === null ) {
            return;
        }
        var gl = texture.gl;
        gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );
        _boundTexture = null;
    }

    /**
     * Returns a function to load and buffer a given cube map face.
     *
     * @param {TextureCubeMap} cubeMap - The cube map object.
     * @param {String} url - The url to load the image.
     * @param {String} face - The face identification string.
     *
     * @returns {Function} The resulting function.
     */
    function loadAndBufferImage( cubeMap, url, face ) {
        return function( done ) {
            var image = new Image();
            image.onload = function() {
                // buffer face texture
                cubeMap.bufferFaceData( face, image );
                done();
            };
            image.src = url;
        };
    }

    /**
     * Instantiates a TextureCubeMap object.
     * @class TextureCubeMap
     * @classdesc A texture class to represent a cube map texture.
     */
    function TextureCubeMap( spec, callback ) {
        var that = this,
            face,
            jobs;
        // store gl context
        this.gl = WebGLContext.get();
        this.texture = this.gl.createTexture();
        this.wrap = spec.wrap || 'CLAMP_TO_EDGE';
        this.filter = spec.filter || 'LINEAR';
        this.invertY = spec.invertY !== undefined ? spec.invertY : false;
        // create cube map based on input
        if ( spec.images ) {
            // multiple Image objects
            for ( face in spec.images ) {
                if ( spec.images.hasOwnProperty( face ) ) {
                    // buffer face texture
                    this.bufferFaceData( face, spec.images[ face ] );
                }
            }
            this.setParameters( this );
        } else if ( spec.urls ) {
            // multiple urls
            jobs = {};
            for ( face in spec.urls ) {
                if ( spec.urls.hasOwnProperty( face ) ) {
                    // add job to map
                    jobs[ face ] = loadAndBufferImage(
                        this,
                        spec.urls[ face ],
                        face );
                }
            }
            Util.async( jobs, function() {
                that.setParameters( that );
                callback( that );
            });
        } else {
            // empty cube map
            this.format = spec.format || 'RGBA';
            this.internalFormat = this.format; // webgl requires format === internalFormat
            this.type = spec.type || 'UNSIGNED_BYTE';
            this.mipMap = spec.mipMap !== undefined ? spec.mipMap : false;
            FACES.forEach( function( face ) {
                var data = ( spec.data ? spec.data[face] : spec.data ) || null;
                that.bufferFaceData( face, data, spec.width, spec.height );
            });
            this.setParameters( this );
        }
    }

    /**
     * Binds the texture object and pushes it to the front of the stack.
     * @memberof TextureCubeMap
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
     TextureCubeMap.prototype.push = function( location ) {
        _stack[ location ] = _stack[ location ] || new Stack();
        _stack[ location ].push( this );
        bind( this, location );
        return this;
    };

    /**
     * Unbinds the texture object and binds the texture beneath it on
     * this stack. If there is no underlying texture, unbinds the unit.
     * @memberof TextureCubeMap
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
     TextureCubeMap.prototype.pop = function( location ) {
        var top;
        if ( !_stack[ location ] ) {
            console.log('No texture was bound to texture unit `' + location +
                '`, command ignored.');
        }
        _stack[ location ].pop();
        top = _stack[ location ].top();
        if ( top ) {
            bind( top, location );
        } else {
            unbind( this );
        }
        return this;
    };

    /**
     * Buffer data into the respective cube map face.
     * @memberof TextureCubeMap
     *
     * @param {String} face - The face identification string.
     * @param {ImageData|ArrayBufferView|HTMLImageElement} data - The data.
     * @param {number} width - The width of the data.
     * @param {number} height - The height of the data.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
    TextureCubeMap.prototype.bufferFaceData = function( face, data, width, height ) {
        var gl = this.gl,
            faceTarget = gl[ FACE_TARGETS[ face ] ];
        if ( !faceTarget ) {
            console.log('Invalid face enumeration `' + face + '` provided, ' +
                'command ignored.');
        }
        // buffer face texture
        this.push();
        if ( data instanceof HTMLImageElement ) {
            this.images = this.images || {};
            this.images[ face ] = ensurePowerOfTwo( data );
            this.filter = 'LINEAR'; // must be linear for mipmapping
            this.mipMap = true;
            gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, this.invertY );
            gl.texImage2D(
                faceTarget,
                0, // level
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                this.images[ face ] );
        } else {
            this.data = this.data || {};
            this.data[ face ] = data;
            this.width = width || this.width;
            this.height = height || this.height;
            gl.texImage2D(
                faceTarget,
                0, // level
                gl[ this.internalFormat ],
                this.width,
                this.height,
                0, // border, must be 0
                gl[ this.format ],
                gl[ this.type ],
                data );
        }
        // only generate mipmaps if all faces are buffered
        this.bufferedFaces = this.bufferedFaces || {};
        this.bufferedFaces[ face ] = true;
        // once all faces are buffered
        if ( this.mipMap &&
            this.bufferedFaces['-x'] && this.bufferedFaces['+x'] &&
            this.bufferedFaces['-y'] && this.bufferedFaces['+y'] &&
            this.bufferedFaces['-z'] && this.bufferedFaces['+z'] ) {
            // generate mipmaps once all faces are buffered
            gl.generateMipmap( gl.TEXTURE_CUBE_MAP );
        }
        this.pop();
        return this;
    };

    /**
     * Set the texture parameters.
     * @memberof TextureCubeMap
     *
     * @param {Object} parameters - The parameters by name.
     * <pre>
     *     wrap | wrap.s | wrap.t - The wrapping type.
     *     filter | filter.min | filter.mag - The filter type.
     * </pre>
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
    TextureCubeMap.prototype.setParameters = function( parameters ) {
        var gl = this.gl;
        this.push();
        if ( parameters.wrap ) {
            // set wrap parameters
            this.wrap = parameters.wrap;
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_WRAP_S,
                gl[ this.wrap.s || this.wrap ] );
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_WRAP_T,
                gl[ this.wrap.t || this.wrap ] );
            /* not supported in webgl 1.0
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_WRAP_R,
                gl[ this.wrap.r || this.wrap ] );
            */
        }
        if ( parameters.filter ) {
            // set filter parameters
            this.filter = parameters.filter;
            var minFilter = this.filter.min || this.filter;
            if ( this.minMap ) {
                // append min mpa suffix to min filter
                minFilter += '_MIPMAP_LINEAR';
            }
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_MAG_FILTER,
                gl[ this.filter.mag || this.filter ] );
            gl.texParameteri(
                gl.TEXTURE_CUBE_MAP,
                gl.TEXTURE_MIN_FILTER,
                gl[ minFilter] );
        }
        this.pop();
        return this;
    };

    module.exports = TextureCubeMap;

}());

},{"../util/Stack":13,"../util/Util":14,"./WebGLContext":11}],8:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        VertexPackage = require('./VertexPackage'),
        Util = require('../util/Util'),
        _boundBuffer = null,
        _enabledAttributes = null;

    function getStride( attributePointers ) {
        var BYTES_PER_COMPONENT = 4;
        var maxOffset = 0;
        var stride = 0;
        Object.keys( attributePointers ).forEach( function( key ) {
            // track the largest offset to determine the stride of the buffer
            var pointer = attributePointers[ key ];
            var offset = pointer.offset;
            if ( offset > maxOffset ) {
                maxOffset = offset;
                stride = offset + ( pointer.size * BYTES_PER_COMPONENT );
            }
        });
        return stride;
    }

    function getAttributePointers( attributePointers ) {
        // ensure there are pointers provided
        if ( !attributePointers || Object.keys( attributePointers ).length === 0 ) {
            console.warning( 'VertexBuffer requires attribute pointers to be ' +
                'specified upon instantiation, this buffer will not draw correctly.' );
            return {};
        }
        // parse pointers to ensure they are valid
        var pointers = {};
        Object.keys( attributePointers ).forEach( function( key ) {
            var index = parseInt( key, 10 );
            // check that key is an valid integer
            if ( isNaN( index ) ) {
                console.warn('Attribute index `' + key + '` does not represent an integer, discarding attribute pointer.');
                return;
            }
            var pointer = attributePointers[key];
            var size = pointer.size;
            var type = pointer.type;
            var offset = pointer.offset;
            // check size
            if ( !size || size < 1 || size > 4 ) {
                console.warn('Attribute pointer `size` parameter is invalid, ' +
                    'defaulting to 4.');
                size = 4;
            }
            // check type
            if ( !type || type !== 'FLOAT' ) {
                console.warn('Attribute pointer `type` parameter is invalid, ' +
                    'defaulting to `FLOAT`.');
                type = 'FLOAT';
            }
            pointers[ index ] = {
                size: size,
                type: type,
                offset: ( offset !== undefined ) ? offset : 0
            };
        });
        return pointers;
    }

    function getNumComponents(pointers) {
        var size = 0;
        var index;
        for ( index in pointers ) {
            if ( pointers.hasOwnProperty( index ) ) {
                size += pointers[ index ].size;
            }
        }
        return size;
    }

    function VertexBuffer( arg, attributePointers, options ) {
        options = options || {};
        this.buffer = 0;
        this.gl = WebGLContext.get();
        // first, set the attribute pointers
        if ( arg instanceof VertexPackage ) {
            // VertexPackage argument, use its attribute pointers
            this.pointers = arg.attributePointers();
            // shift options arg since there will be no attrib pointers arg
            options = attributePointers || {};
        } else {
            this.pointers = getAttributePointers( attributePointers );
        }
        // then buffer the data
        if ( arg ) {
            if ( arg instanceof VertexPackage ) {
                // VertexPackage argument
                this.bufferData( arg.buffer() );
            } else if ( arg instanceof WebGLBuffer ) {
                // WebGLBuffer argument
                this.buffer = arg;
                this.count = ( options.count !== undefined ) ? options.count : 0;
            } else {
                // Array or ArrayBuffer or number argument
                this.bufferData( arg );
            }
        }
        // set stride
        this.stride = getStride( this.pointers );
        // set draw offset and mode
        this.offset = ( options.offset !== undefined ) ? options.offset : 0;
        this.mode = ( options.mode !== undefined ) ? options.mode : 'TRIANGLES';
    }

    VertexBuffer.prototype.bufferData = function( arg ) {
        var gl = this.gl;
        if ( arg instanceof Array ) {
            // cast arrays into bufferview
            arg = new Float32Array( arg );
        } else if ( !Util.isTypedArray( arg ) && typeof arg !== 'number' ) {
            console.error( 'VertexBuffer requires an Array or ArrayBuffer, ' +
                'or a size argument, command ignored.' );
            return;
        }
        if ( !this.buffer ) {
            this.buffer = gl.createBuffer();
        }
        // get the total number of attribute components from pointers
        var numComponents = getNumComponents(this.pointers);
        // set count based on size of buffer and number of components
        if (typeof arg === 'number') {
            this.count = arg / numComponents;
        } else {
            this.count = arg.length / numComponents;
        }
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
        gl.bufferData( gl.ARRAY_BUFFER, arg, gl.STATIC_DRAW );
    };

    VertexBuffer.prototype.bufferSubData = function( array, offset ) {
        var gl = this.gl;
        if ( !this.buffer ) {
            console.error( 'VertexBuffer has not been initially buffered, ' +
                'command ignored.' );
            return;
        }
        if ( array instanceof Array ) {
            array = new Float32Array( array );
        } else if ( !Util.isTypedArray( array ) ) {
            console.error( 'VertexBuffer requires an Array or ArrayBuffer ' +
                'argument, command ignored.' );
            return;
        }
        offset = ( offset !== undefined ) ? offset : 0;
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
        gl.bufferSubData( gl.ARRAY_BUFFER, offset, array );
    };

    VertexBuffer.prototype.bind = function() {
        // if this buffer is already bound, exit early
        if ( _boundBuffer === this ) {
            return;
        }
        var gl = this.gl,
            pointers = this.pointers,
            previouslyEnabledAttributes = _enabledAttributes || {},
            pointer,
            index;
        // cache this vertex buffer
        _boundBuffer = this;
        _enabledAttributes = {};
        // bind buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
        for ( index in pointers ) {
            if ( pointers.hasOwnProperty( index ) ) {
                pointer = this.pointers[ index ];
                // set attribute pointer
                gl.vertexAttribPointer( index,
                    pointer.size,
                    gl[ pointer.type ],
                    false,
                    this.stride,
                    pointer.offset );
                // enabled attribute array
                gl.enableVertexAttribArray( index );
                // cache attribute
                _enabledAttributes[ index ] = true;
                // remove from previous list
                delete previouslyEnabledAttributes[ index ];
            }
        }
        // ensure leaked attribute arrays are disabled
        for ( index in previouslyEnabledAttributes ) {
            if ( previouslyEnabledAttributes.hasOwnProperty( index ) ) {
                gl.disableVertexAttribArray( index );
            }
        }
    };

    VertexBuffer.prototype.draw = function( options ) {
        options = options || {};
        if ( _boundBuffer === null ) {
            console.warn( 'No VertexBuffer is bound, command ignored.' );
            return;
        }
        var gl = this.gl;
        var mode = gl[ options.mode || this.mode || 'TRIANGLES' ];
        var offset = ( options.offset !== undefined ) ? options.offset : this.offset;
        var count = ( options.count !== undefined ) ? options.count : this.count;
        gl.drawArrays(
            mode, // primitive type
            offset, // offset
            count ); // count
    };

    VertexBuffer.prototype.unbind = function() {
        // if no buffer is bound, exit early
        if ( _boundBuffer === null ) {
            return;
        }
        var gl = this.gl,
            pointers = this.pointers,
            index;
        for ( index in pointers ) {
            if ( pointers.hasOwnProperty( index ) ) {
                gl.disableVertexAttribArray( index );
            }
        }
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
        _boundBuffer = null;
        _enabledAttributes = {};
    };

    module.exports = VertexBuffer;

}());

},{"../util/Util":14,"./VertexPackage":9,"./WebGLContext":11}],9:[function(require,module,exports){
(function () {

    'use strict';

    var COMPONENT_TYPE = 'FLOAT';
    var BYTES_PER_COMPONENT = 4;

    /**
     * Removes invalid attribute arguments. A valid argument
     * must be an Array of length > 0 key by a string representing an int.
     *
     * @param {Object} attributes - The map of vertex attributes.
     *
     * @returns {Array} The valid array of arguments.
     */
    function parseAttributeMap( attributes ) {
        var goodAttributes = [];
        Object.keys( attributes ).forEach( function( key ) {
            var index = parseInt( key, 10 );
            // check that key is an valid integer
            if ( isNaN( index ) ) {
                console.warn('Attribute index `' + key + '` does not ' +
                    'represent an integer, discarding attribute pointer.');
                return;
            }
            var vertices = attributes[key];
            // ensure attribute is valid
            if ( vertices &&
                vertices instanceof Array &&
                vertices.length > 0 ) {
                // add attribute data and index
                goodAttributes.push({
                    index: index,
                    data: vertices
                });
            } else {
                console.warn( 'Error parsing attribute of index `' + key +
                    '`, attribute discarded.' );
            }
        });
        // sort attributes ascending by index
        goodAttributes.sort(function(a,b) {
            return a.index - b.index;
        });
        return goodAttributes;
    }

    /**
     * Returns a component's byte size.
     *
     * @param {Object|Array} component - The component to measure.
     *
     * @returns {integer} The byte size of the component.
     */
    function getComponentSize( component ) {
        // check if vector
        if ( component.x !== undefined ) {
            // 1 component vector
            if ( component.y !== undefined ) {
                // 2 component vector
                if ( component.z !== undefined ) {
                    // 3 component vector
                    if ( component.w !== undefined ) {
                        // 4 component vector
                        return 4;
                    }
                    return 3;
                }
                return 2;
            }
            return 1;
        }
        // check if array
        if ( component instanceof Array ) {
            return component.length;
        }
        return 1;
    }

    /**
     * Calculates the type, size, and offset for each attribute in the
     * attribute array along with the length and stride of the package.
     *
     * @param {VertexPackage} vertexPackage - The VertexPackage object.
     * @param {Array} attributes - The array of vertex attributes.
     */
    function setPointersAndStride( vertexPackage, attributes ) {
        var shortestArray = Number.MAX_VALUE;
        var offset = 0;
        // clear pointers
        vertexPackage.pointers = {};
        // for each attribute
        attributes.forEach( function( vertices ) {
            // set size to number of components in the attribute
            var size = getComponentSize( vertices.data[0] );
            // length of the package will be the shortest attribute array length
            shortestArray = Math.min( shortestArray, vertices.data.length );
            // store pointer under index
            vertexPackage.pointers[ vertices.index ] = {
                type : COMPONENT_TYPE,
                size : size,
                offset : offset * BYTES_PER_COMPONENT
            };
            // accumulate attribute offset
            offset += size;
        });
        // set stride to total offset
        vertexPackage.stride = offset * BYTES_PER_COMPONENT;
        // set length of package to the shortest attribute array length
        vertexPackage.length = shortestArray;
    }

    function VertexPackage( attributes ) {
        if ( attributes !== undefined ) {
            return this.set( attributes );
        } else {
            this.data = new Float32Array(0);
            this.pointers = {};
        }
    }

    VertexPackage.prototype.set = function( attributeMap ) {
        var that = this;
        // remove bad attributes
        var attributes = parseAttributeMap( attributeMap );
        // set attribute pointers and stride
        setPointersAndStride( this, attributes );
        // set size of data vector
        this.data = new Float32Array( this.length * ( this.stride / BYTES_PER_COMPONENT ) );
        // for each vertex attribute array
        attributes.forEach( function( vertices ) {
            // get the pointer
            var pointer = that.pointers[ vertices.index ];
            // get the pointers offset
            var offset = pointer.offset / BYTES_PER_COMPONENT;
            // get the package stride
            var stride = that.stride / BYTES_PER_COMPONENT;
            // for each vertex
            var vertex, i, j;
            for ( i=0; i<that.length; i++ ) {
                vertex = vertices.data[i];
                // get the index in the buffer to the particular vertex
                j = offset + ( stride * i );
                switch ( pointer.size ) {
                    case 2:
                        that.data[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
                        that.data[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
                        break;
                    case 3:
                        that.data[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
                        that.data[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
                        that.data[j+2] = ( vertex.z !== undefined ) ? vertex.z : vertex[2];
                        break;
                    case 4:
                        that.data[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
                        that.data[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
                        that.data[j+2] = ( vertex.z !== undefined ) ? vertex.z : vertex[2];
                        that.data[j+3] = ( vertex.w !== undefined ) ? vertex.w : vertex[3];
                        break;
                    default:
                        if ( vertex.x !== undefined ) {
                            that.data[j] = vertex.x;
                        } else if ( vertex[0] !== undefined ) {
                            that.data[j] = vertex[0];
                        } else {
                            that.data[j] = vertex;
                        }
                        break;
                }
            }
        });
        return this;
    };

    VertexPackage.prototype.buffer = function() {
        return this.data;
    };

    VertexPackage.prototype.attributePointers = function() {
        return this.pointers;
    };

    module.exports = VertexPackage;

}());

},{}],10:[function(require,module,exports){
(function() {

    'use strict';

    var WebGLContext = require('./WebGLContext'),
        Stack = require('../util/Stack'),
        _stack = new Stack();

    function set( viewport, x, y, width, height ) {
        var gl = viewport.gl;
        x = ( x !== undefined ) ? x : viewport.x;
        y = ( y !== undefined ) ? y : viewport.y;
        width = ( width !== undefined ) ? width : viewport.width;
        height = ( height !== undefined ) ? height : viewport.height;
        gl.viewport( x, y, width, height );
    }

    function Viewport( spec ) {
        spec = spec || {};
        this.gl = WebGLContext.get();
        // set size
        this.resize(
            spec.width || this.gl.canvas.width,
            spec.height || this.gl.canvas.height );
        // set offset
        this.offset(
            spec.x !== undefined ? spec.x : 0,
            spec.y !== undefined ? spec.y : 0);
    }

    /**
     * Updates the viewport objects width and height.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
    Viewport.prototype.resize = function( width, height ) {
        if ( width !== undefined && height !== undefined ) {
            this.width = width;
            this.height = height;
            this.gl.canvas.width = width + this.x;
            this.gl.canvas.height = height + this.y;
        }
        return this;
    };

    /**
     * Updates the viewport objects x and y offsets.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
    Viewport.prototype.offset = function( x, y ) {
        if ( x !== undefined && y !== undefined ) {
            this.x = x;
            this.y = y;
            this.gl.canvas.width = this.width + x;
            this.gl.canvas.height = this.height + y;
        }
        return this;
    };

    /**
     * Sets the viewport object and pushes it to the front of the stack.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
     Viewport.prototype.push = function( x, y, width, height ) {
        _stack.push({
            viewport: this,
            x: x,
            y: y,
            width: width,
            height: height
        });
        set( this, x, y, width, height );
        return this;
    };

    /**
     * Pops current the viewport object and sets the viewport beneath it.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
     Viewport.prototype.pop = function() {
        var top;
        _stack.pop();
        top = _stack.top();
        if ( top ) {
            set( top.viewport, top.x, top.y, top.width, top.height );
        } else {
            set( this );
        }
        return this;
    };

    module.exports = Viewport;

}());

},{"../util/Stack":13,"./WebGLContext":11}],11:[function(require,module,exports){
(function() {

    'use strict';

    var _boundContext = null,
        _contextsById = {},
        EXTENSIONS = [
            // ratified
            'OES_texture_float',
            'OES_texture_half_float',
            'WEBGL_lose_context',
            'OES_standard_derivatives',
            'OES_vertex_array_object',
            'WEBGL_debug_renderer_info',
            'WEBGL_debug_shaders',
            'WEBGL_compressed_texture_s3tc',
            'WEBGL_depth_texture',
            'OES_element_index_uint',
            'EXT_texture_filter_anisotropic',
            'WEBGL_draw_buffers',
            'ANGLE_instanced_arrays',
            'OES_texture_float_linear',
            'OES_texture_half_float_linear',
            // community
            'WEBGL_compressed_texture_atc',
            'WEBGL_compressed_texture_pvrtc',
            'EXT_color_buffer_half_float',
            'WEBGL_color_buffer_float',
            'EXT_frag_depth',
            'EXT_sRGB',
            'WEBGL_compressed_texture_etc1',
            'EXT_blend_minmax',
            'EXT_shader_texture_lod'
        ];

    /**
     * Returns a Canvas element object from either an existing object, or
     * identification string.
     *
     * @param {HTMLCanvasElement|String} arg - The Canvas
     *     object or Canvas identification string.
     *
     * @returns {HTMLCanvasElement} The Canvas element object.
     */
    function getCanvas( arg ) {
        if ( arg instanceof HTMLImageElement ||
             arg instanceof HTMLCanvasElement ) {
            return arg;
        } else if ( typeof arg === 'string' ) {
            return document.getElementById( arg );
        }
        return null;
    }

    /**
     * Attempts to retreive a wrapped WebGLRenderingContext.
     *
     * @param {HTMLCanvasElement} The Canvas element object to create the context under.
     *
     * @returns {Object} The context wrapper.
     */
    function getContextWrapper( arg ) {
        if ( !arg ) {
            if ( _boundContext ) {
                // return last bound context
                return _boundContext;
            }
        } else {
            var canvas = getCanvas( arg );
            if ( canvas ) {
                return _contextsById[ canvas.id ];
            }
        }
        // no bound context or argument
        return null;
    }

    /**
     * Attempts to load all known extensions for a provided
     * WebGLRenderingContext. Stores the results in the context wrapper for
     * later queries.
     *
     * @param {Object} contextWrapper - The context wrapper.
     */
    function loadExtensions( contextWrapper ) {
        var gl = contextWrapper.gl,
            extension,
            i;
        for ( i=0; i<EXTENSIONS.length; i++ ) {
            extension = EXTENSIONS[i];
            contextWrapper.extensions[ extension ] = gl.getExtension( extension );
        }
    }

    /**
     * Attempts to create a WebGLRenderingContext wrapped inside an object which
     * will also store the extension query results.
     *
     * @param {HTMLCanvasElement} The Canvas element object to create the context under.
     * @param {Object}} options - Parameters to the webgl context, only used during instantiation. Optional.
     *
     * @returns {Object} The context wrapper.
     */
    function createContextWrapper( canvas, options ) {
        var contextWrapper,
            gl;
        try {
            // get WebGL context, fallback to experimental
            gl = canvas.getContext( 'webgl', options ) || canvas.getContext( 'experimental-webgl', options );
            // wrap context
            contextWrapper = {
                id: canvas.id,
                gl: gl,
                extensions: {}
            };
            // load WebGL extensions
            loadExtensions( contextWrapper );
            // add context wrapper to map
            _contextsById[ canvas.id ] = contextWrapper;
            // bind the context
            _boundContext = contextWrapper;
        } catch( err ) {
            console.error( err.message );
        }
        if ( !gl ) {
            console.error( 'Unable to initialize WebGL. Your browser may not ' +
                'support it.' );
        }
        return contextWrapper;
    }

    module.exports = {

        /**
         * Binds a specific WebGL context as the active context. This context
         * will be used for all code /webgl.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string.
         *
         * @returns {WebGLContext} This namespace, used for chaining.
         */
        bind: function( arg ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                _boundContext = wrapper;
                return this;
            }
            console.error( 'No context exists for provided argument `' + arg +
                '`, command ignored.' );
            return this;
        },

        /**
         * Creates a new or retreives an existing WebGL context for a provided
         * canvas object. During creation attempts to load all extensions found
         * at: https://www.khronos.org/registry/webgl/extensions/. If no
         * argument is provided it will attempt to return the currently bound
         * context. If no context is bound, it will return 'null'.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         * @param {Object}} options - Parameters to the webgl context, only used during instantiation. Optional.
         *
         * @returns {WebGLRenderingContext} The WebGLRenderingContext context object.
         */
        get: function( arg, options ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                // return the native WebGLRenderingContext
                return wrapper.gl;
            }
            // get canvas element
            var canvas = getCanvas( arg );
            // try to find or create context
            if ( !canvas || !createContextWrapper( canvas, options ) ) {
                console.error( 'Context could not be found or created for ' +
                    'argument of type`' + ( typeof arg ) + '`, returning `null`.' );
                return null;
            }
            // return context
            return _contextsById[ canvas.id ].gl;
        },

        /**
         * Returns an array of all supported extensions for the provided canvas
         * object. If no argument is provided it will attempt to query the
         * currently bound context. If no context is bound, it will return
         * an empty array.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         *
         * @returns {Array} All supported extensions.
         */
        supportedExtensions: function( arg ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                var extensions = wrapper.extensions;
                var supported = [];
                for ( var key in extensions ) {
                    if ( extensions.hasOwnProperty( key ) && extensions[ key ] ) {
                        supported.push( key );
                    }
                }
                return supported;
            }
            console.error('No context is currently bound or was provided, ' +
                'returning an empty array.');
            return [];
        },

        /**
         * Returns an array of all unsupported extensions for the provided canvas
         * object. If no argument is provided it will attempt to query the
         * currently bound context. If no context is bound, it will return
         * an empty array.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         *
         * @returns {Array} All unsupported extensions.
         */
        unsupportedExtensions: function( arg ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                var extensions = wrapper.extensions;
                var unsupported = [];
                for ( var key in extensions ) {
                    if ( extensions.hasOwnProperty( key ) && !extensions[ key ] ) {
                        unsupported.push( key );
                    }
                }
                return unsupported;
            }
            console.error('No context is currently bound or was provided, ' +
                'returning an empty array.');
            return [];
        },

        /**
         * Checks if an extension has been successfully loaded by the provided
         * canvas object. If no argument is provided it will attempt to return
         * the currently bound context. If no context is bound, it will return
         * 'false'.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         * @param {String} extension - The extension name.
         *
         * @returns {boolean} Whether or not the provided extension has been loaded successfully.
         */
        checkExtension: function( arg, extension ) {
            if ( !extension ) {
                // shift parameters if no canvas arg is provided
                extension = arg;
                arg = null;
            }
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                var extensions = wrapper.extensions;
                return extensions[ extension ] ? extensions[ extension ] : false;
            }
            console.error('No context is currently bound or provided as ' +
                'argument, returning false.');
            return false;
        }
    };

}());

},{}],12:[function(require,module,exports){
(function () {

    'use strict';

    module.exports = {
        IndexBuffer: require('./core/IndexBuffer'),
        Renderable: require('./core/Renderable'),
        RenderTarget: require('./core/RenderTarget'),
        Shader: require('./core/Shader'),
        Texture2D: require('./core/Texture2D'),
        TextureCubeMap: require('./core/TextureCubeMap'),
        VertexBuffer: require('./core/VertexBuffer'),
        VertexPackage: require('./core/VertexPackage'),
        Viewport: require('./core/Viewport'),
        WebGLContext: require('./core/WebGLContext')
    };

}());

},{"./core/IndexBuffer":1,"./core/RenderTarget":2,"./core/Renderable":3,"./core/Shader":4,"./core/Texture2D":6,"./core/TextureCubeMap":7,"./core/VertexBuffer":8,"./core/VertexPackage":9,"./core/Viewport":10,"./core/WebGLContext":11}],13:[function(require,module,exports){
(function () {

    'use strict';

    function Stack() {
        this.data = [];
    }

    Stack.prototype.push = function( value ) {
        this.data.push( value );
        return this;
    };

    Stack.prototype.pop = function() {
        this.data.pop();
        return this;
    };

    Stack.prototype.top = function() {
        var index = this.data.length - 1;
        if ( index < 0 ) {
            return null;
        }
        return this.data[ index ];
    };

    module.exports = Stack;

}());

},{}],14:[function(require,module,exports){
(function () {

    'use strict';

    var simplyDeferred = require('simply-deferred'),
        Deferred = simplyDeferred.Deferred,
        when = simplyDeferred.when;

    /**
     * Returns a function that resolves the provided deferred.
     *
     * @param {Deferred} deferred - The deferred object.
     *
     * @returns {Function} The function to resolve the deferred.
     */
    function resolveDeferred( deferred ) {
        return function( result ) {
            deferred.resolve( result );
        };
    }

    /**
     * Dispatches an array of jobs, accumulating the results and
     * passing them to the callback function in corresponding indices.
     *
     * @param {Array} jobs - The job array.
     * @param {Function} callback - The callback function.
     */
     function asyncArray( jobs, callback ) {
        var deferreds = [],
            deferred,
            i;
        for ( i=0; i<jobs.length; i++ ) {
            deferred = new Deferred();
            deferreds.push( deferred );
            jobs[i]( resolveDeferred( deferred ) );
        }
        when.apply( when, deferreds ).then( function() {
            var results = Array.prototype.slice.call( arguments, 0 );
            callback( results );
        });
    }

    /**
     * Dispatches a map of jobs, accumulating the results and
     * passing them to the callback function under corresponding
     * keys.
     *
     * @param {Object} jobs - The job map.
     * @param {Function} callback - The callback function.
     */
     function asyncObj( jobs, callback ) {
        var jobsByIndex = [],
            deferreds = [],
            deferred,
            key;
        for ( key in jobs ) {
            if ( jobs.hasOwnProperty( key ) ) {
                deferred = new Deferred();
                deferreds.push( deferred );
                jobsByIndex.push( key );
                jobs[ key ]( resolveDeferred( deferred ) );
            }
        }
        when.apply( when, deferreds ).done( function() {
            var results = Array.prototype.slice.call( arguments, 0 ),
                resultsByKey = {},
                i;
            for ( i=0; i<jobsByIndex.length; i++ ) {
                resultsByKey[ jobsByIndex[i] ] = results[i];
            }
            callback( resultsByKey );
        });
    }

    module.exports = {

        /**
         * Execute a set of functions asynchronously, once all have been
         * completed, execute the provided callback function. Jobs may be passed
         * as an array or object. The callback function will be passed the
         * results in the same format as the jobs. All jobs must have accept and
         * execute a callback function upon completion.
         *
         * @param {Array|Object} jobs - The set of functions to execute.
         * @param {Function} callback - The callback function to be executed upon completion.
         */
        async: function( jobs, callback ) {
            if ( jobs instanceof Array ) {
                asyncArray( jobs, callback );
            } else {
                asyncObj( jobs, callback );
            }
        },

        /**
         * Returns true if a provided array is a javscript TypedArray.
         *
         * @param {*} array - The variable to test.
         *
         * @returns {boolean} - Whether or not the variable is a TypedArray.
         */
        isTypedArray: function( array ) {
            return array &&
                array.buffer instanceof ArrayBuffer &&
                array.byteLength !== undefined;
        },

        /**
         * Returns true if the provided integer is a power of two.
         *
         * @param {integer} num - The number to test.
         *
         * @returns {boolean} - Whether or not the number is a power of two.
         */
        isPowerOfTwo: function( num ) {
            return ( num !== 0 ) ? ( num & ( num - 1 ) ) === 0 : false;
        },

        /**
         * Returns the next highest power of two for a number.
         *
         * Ex.
         *
         *     200 -> 256
         *     256 -> 256
         *     257 -> 512
         *
         * @param {integer} num - The number to modify.
         *
         * @returns {integer} - Next highest power of two.
         */
        nextHighestPowerOfTwo: function( num ) {
            var i;
            if ( num !== 0 ) {
                num = num-1;
            }
            for ( i=1; i<32; i<<=1 ) {
                num = num | num >> i;
            }
            return num + 1;
        }
    };

}());

},{"simply-deferred":20}],15:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        /**
         * Sends an XMLHttpRequest GET request to the supplied url.
         *
         * @param {String} url - The URL for the resource.
         * @param {Object} options - Contains the following options:
         * <pre>
         *     {
         *         {String} success - The success callback function.
         *         {String} error - The error callback function.
         *         {String} progress - The progress callback function.
         *         {String} responseType - The responseType of the XHR.
         *     }
         * </pre>
         */
        load: function ( url, options ) {
            var request = new XMLHttpRequest();
            request.open( 'GET', url, true );
            request.responseType = options.responseType;
            request.addEventListener( 'load', function () {
                if ( options.success ) {
                    options.success( this.response );
                }
            });
            if ( options.progress ) {
                request.addEventListener( 'progress', function ( event ) {
                    options.progress( event );
                });
            }
            if ( options.error ) {
                request.addEventListener( 'error', function ( event ) {
                    options.error( event );
                });
            }
            request.send();
        }
    };

}());

},{}],16:[function(require,module,exports){
var json = typeof JSON !== 'undefined' ? JSON : require('jsonify');

module.exports = function (obj, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var space = opts.space || '';
    if (typeof space === 'number') space = Array(space+1).join(' ');
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;
    var replacer = opts.replacer || function(key, value) { return value; };

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (parent, key, node, level) {
        var indent = space ? ('\n' + new Array(level + 1).join(space)) : '';
        var colonSeparator = space ? ': ' : ':';

        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        node = replacer.call(parent, key, node);

        if (node === undefined) {
            return;
        }
        if (typeof node !== 'object' || node === null) {
            return json.stringify(node);
        }
        if (isArray(node)) {
            var out = [];
            for (var i = 0; i < node.length; i++) {
                var item = stringify(node, i, node[i], level+1) || json.stringify(null);
                out.push(indent + space + item);
            }
            return '[' + out.join(',') + indent + ']';
        }
        else {
            if (seen.indexOf(node) !== -1) {
                if (cycles) return json.stringify('__cycle__');
                throw new TypeError('Converting circular structure to JSON');
            }
            else seen.push(node);

            var keys = objectKeys(node).sort(cmp && cmp(node));
            var out = [];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = stringify(node, key, node[key], level+1);

                if(!value) continue;

                var keyValue = json.stringify(key)
                    + colonSeparator
                    + value;
                ;
                out.push(indent + space + keyValue);
            }
            seen.splice(seen.indexOf(node), 1);
            return '{' + out.join(',') + indent + '}';
        }
    })({ '': obj }, '', obj, 0);
};

var isArray = Array.isArray || function (x) {
    return {}.toString.call(x) === '[object Array]';
};

var objectKeys = Object.keys || function (obj) {
    var has = Object.prototype.hasOwnProperty || function () { return true };
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

},{"jsonify":17}],17:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":18,"./lib/stringify":19}],18:[function(require,module,exports){
var at, // The index of the current character
    ch, // The current character
    escapee = {
        '"':  '"',
        '\\': '\\',
        '/':  '/',
        b:    '\b',
        f:    '\f',
        n:    '\n',
        r:    '\r',
        t:    '\t'
    },
    text,

    error = function (m) {
        // Call error when something is wrong.
        throw {
            name:    'SyntaxError',
            message: m,
            at:      at,
            text:    text
        };
    },
    
    next = function (c) {
        // If a c parameter is provided, verify that it matches the current character.
        if (c && c !== ch) {
            error("Expected '" + c + "' instead of '" + ch + "'");
        }
        
        // Get the next character. When there are no more characters,
        // return the empty string.
        
        ch = text.charAt(at);
        at += 1;
        return ch;
    },
    
    number = function () {
        // Parse a number value.
        var number,
            string = '';
        
        if (ch === '-') {
            string = '-';
            next('-');
        }
        while (ch >= '0' && ch <= '9') {
            string += ch;
            next();
        }
        if (ch === '.') {
            string += '.';
            while (next() && ch >= '0' && ch <= '9') {
                string += ch;
            }
        }
        if (ch === 'e' || ch === 'E') {
            string += ch;
            next();
            if (ch === '-' || ch === '+') {
                string += ch;
                next();
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
        }
        number = +string;
        if (!isFinite(number)) {
            error("Bad number");
        } else {
            return number;
        }
    },
    
    string = function () {
        // Parse a string value.
        var hex,
            i,
            string = '',
            uffff;
        
        // When parsing for string values, we must look for " and \ characters.
        if (ch === '"') {
            while (next()) {
                if (ch === '"') {
                    next();
                    return string;
                } else if (ch === '\\') {
                    next();
                    if (ch === 'u') {
                        uffff = 0;
                        for (i = 0; i < 4; i += 1) {
                            hex = parseInt(next(), 16);
                            if (!isFinite(hex)) {
                                break;
                            }
                            uffff = uffff * 16 + hex;
                        }
                        string += String.fromCharCode(uffff);
                    } else if (typeof escapee[ch] === 'string') {
                        string += escapee[ch];
                    } else {
                        break;
                    }
                } else {
                    string += ch;
                }
            }
        }
        error("Bad string");
    },

    white = function () {

// Skip whitespace.

        while (ch && ch <= ' ') {
            next();
        }
    },

    word = function () {

// true, false, or null.

        switch (ch) {
        case 't':
            next('t');
            next('r');
            next('u');
            next('e');
            return true;
        case 'f':
            next('f');
            next('a');
            next('l');
            next('s');
            next('e');
            return false;
        case 'n':
            next('n');
            next('u');
            next('l');
            next('l');
            return null;
        }
        error("Unexpected '" + ch + "'");
    },

    value,  // Place holder for the value function.

    array = function () {

// Parse an array value.

        var array = [];

        if (ch === '[') {
            next('[');
            white();
            if (ch === ']') {
                next(']');
                return array;   // empty array
            }
            while (ch) {
                array.push(value());
                white();
                if (ch === ']') {
                    next(']');
                    return array;
                }
                next(',');
                white();
            }
        }
        error("Bad array");
    },

    object = function () {

// Parse an object value.

        var key,
            object = {};

        if (ch === '{') {
            next('{');
            white();
            if (ch === '}') {
                next('}');
                return object;   // empty object
            }
            while (ch) {
                key = string();
                white();
                next(':');
                if (Object.hasOwnProperty.call(object, key)) {
                    error('Duplicate key "' + key + '"');
                }
                object[key] = value();
                white();
                if (ch === '}') {
                    next('}');
                    return object;
                }
                next(',');
                white();
            }
        }
        error("Bad object");
    };

value = function () {

// Parse a JSON value. It could be an object, an array, a string, a number,
// or a word.

    white();
    switch (ch) {
    case '{':
        return object();
    case '[':
        return array();
    case '"':
        return string();
    case '-':
        return number();
    default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
};

// Return the json_parse function. It will have access to all of the above
// functions and variables.

module.exports = function (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function' ? (function walk(holder, key) {
        var k, v, value = holder[key];
        if (value && typeof value === 'object') {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }({'': result}, '')) : result;
};

},{}],19:[function(require,module,exports){
var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    gap,
    indent,
    meta = {    // table of character substitutions
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    },
    rep;

function quote(string) {
    // If the string contains no control characters, no quote characters, and no
    // backslash characters, then we can safely slap some quotes around it.
    // Otherwise we must also replace the offending characters with safe escape
    // sequences.
    
    escapable.lastIndex = 0;
    return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        var c = meta[a];
        return typeof c === 'string' ? c :
            '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + string + '"';
}

function str(key, holder) {
    // Produce a string from holder[key].
    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];
    
    // If the value has a toJSON method, call it to obtain a replacement value.
    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }
    
    // If we were called with a replacer function, then call the replacer to
    // obtain a replacement value.
    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }
    
    // What happens next depends on the value's type.
    switch (typeof value) {
        case 'string':
            return quote(value);
        
        case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
        
        case 'boolean':
        case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
            
        case 'object':
            if (!value) return 'null';
            gap += indent;
            partial = [];
            
            // Array.isArray
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                
                // Join all of the elements together, separated with commas, and
                // wrap them in brackets.
                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            
            // If the replacer is an array, use it to select the members to be
            // stringified.
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            
        // Join all of the member texts together, separated with commas,
        // and wrap them in braces.

        v = partial.length === 0 ? '{}' : gap ?
            '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
            '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

module.exports = function (value, replacer, space) {
    var i;
    gap = '';
    indent = '';
    
    // If the space parameter is a number, make an indent string containing that
    // many spaces.
    if (typeof space === 'number') {
        for (i = 0; i < space; i += 1) {
            indent += ' ';
        }
    }
    // If the space parameter is a string, it will be used as the indent string.
    else if (typeof space === 'string') {
        indent = space;
    }

    // If there is a replacer, it must be a function or an array.
    // Otherwise, throw an error.
    rep = replacer;
    if (replacer && typeof replacer !== 'function'
    && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
        throw new Error('JSON.stringify');
    }
    
    // Make a fake root object containing our value under the key of ''.
    // Return the result of stringifying the value.
    return str('', {'': value});
};

},{}],20:[function(require,module,exports){
// Generated by CoffeeScript 1.6.3
(function() {
  var Deferred, PENDING, REJECTED, RESOLVED, VERSION, after, execute, flatten, has, installInto, isArguments, isPromise, wrap, _when,
    __slice = [].slice;

  VERSION = '3.0.0';

  PENDING = "pending";

  RESOLVED = "resolved";

  REJECTED = "rejected";

  has = function(obj, prop) {
    return obj != null ? obj.hasOwnProperty(prop) : void 0;
  };

  isArguments = function(obj) {
    return has(obj, 'length') && has(obj, 'callee');
  };

  isPromise = function(obj) {
    return has(obj, 'promise') && typeof (obj != null ? obj.promise : void 0) === 'function';
  };

  flatten = function(array) {
    if (isArguments(array)) {
      return flatten(Array.prototype.slice.call(array));
    }
    if (!Array.isArray(array)) {
      return [array];
    }
    return array.reduce(function(memo, value) {
      if (Array.isArray(value)) {
        return memo.concat(flatten(value));
      }
      memo.push(value);
      return memo;
    }, []);
  };

  after = function(times, func) {
    if (times <= 0) {
      return func();
    }
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  wrap = function(func, wrapper) {
    return function() {
      var args;
      args = [func].concat(Array.prototype.slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  execute = function(callbacks, args, context) {
    var callback, _i, _len, _ref, _results;
    _ref = flatten(callbacks);
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      callback = _ref[_i];
      _results.push(callback.call.apply(callback, [context].concat(__slice.call(args))));
    }
    return _results;
  };

  Deferred = function() {
    var candidate, close, closingArguments, doneCallbacks, failCallbacks, progressCallbacks, state;
    state = PENDING;
    doneCallbacks = [];
    failCallbacks = [];
    progressCallbacks = [];
    closingArguments = {
      'resolved': {},
      'rejected': {},
      'pending': {}
    };
    this.promise = function(candidate) {
      var pipe, storeCallbacks;
      candidate = candidate || {};
      candidate.state = function() {
        return state;
      };
      storeCallbacks = function(shouldExecuteImmediately, holder, holderState) {
        return function() {
          if (state === PENDING) {
            holder.push.apply(holder, flatten(arguments));
          }
          if (shouldExecuteImmediately()) {
            execute(arguments, closingArguments[holderState]);
          }
          return candidate;
        };
      };
      candidate.done = storeCallbacks((function() {
        return state === RESOLVED;
      }), doneCallbacks, RESOLVED);
      candidate.fail = storeCallbacks((function() {
        return state === REJECTED;
      }), failCallbacks, REJECTED);
      candidate.progress = storeCallbacks((function() {
        return state !== PENDING;
      }), progressCallbacks, PENDING);
      candidate.always = function() {
        var _ref;
        return (_ref = candidate.done.apply(candidate, arguments)).fail.apply(_ref, arguments);
      };
      pipe = function(doneFilter, failFilter, progressFilter) {
        var filter, master;
        master = new Deferred();
        filter = function(source, funnel, callback) {
          if (!callback) {
            return candidate[source](master[funnel]);
          }
          return candidate[source](function() {
            var args, value;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            value = callback.apply(null, args);
            if (isPromise(value)) {
              return value.done(master.resolve).fail(master.reject).progress(master.notify);
            } else {
              return master[funnel](value);
            }
          });
        };
        filter('done', 'resolve', doneFilter);
        filter('fail', 'reject', failFilter);
        filter('progress', 'notify', progressFilter);
        return master;
      };
      candidate.pipe = pipe;
      candidate.then = pipe;
      if (candidate.promise == null) {
        candidate.promise = function() {
          return candidate;
        };
      }
      return candidate;
    };
    this.promise(this);
    candidate = this;
    close = function(finalState, callbacks, context) {
      return function() {
        if (state === PENDING) {
          state = finalState;
          closingArguments[finalState] = arguments;
          execute(callbacks, closingArguments[finalState], context);
          return candidate;
        }
        return this;
      };
    };
    this.resolve = close(RESOLVED, doneCallbacks);
    this.reject = close(REJECTED, failCallbacks);
    this.notify = close(PENDING, progressCallbacks);
    this.resolveWith = function(context, args) {
      return close(RESOLVED, doneCallbacks, context).apply(null, args);
    };
    this.rejectWith = function(context, args) {
      return close(REJECTED, failCallbacks, context).apply(null, args);
    };
    this.notifyWith = function(context, args) {
      return close(PENDING, progressCallbacks, context).apply(null, args);
    };
    return this;
  };

  _when = function() {
    var def, defs, finish, resolutionArgs, trigger, _i, _len;
    defs = flatten(arguments);
    if (defs.length === 1) {
      if (isPromise(defs[0])) {
        return defs[0];
      } else {
        return (new Deferred()).resolve(defs[0]).promise();
      }
    }
    trigger = new Deferred();
    if (!defs.length) {
      return trigger.resolve().promise();
    }
    resolutionArgs = [];
    finish = after(defs.length, function() {
      return trigger.resolve.apply(trigger, resolutionArgs);
    });
    defs.forEach(function(def, index) {
      if (isPromise(def)) {
        return def.done(function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          resolutionArgs[index] = args.length > 1 ? args : args[0];
          return finish();
        });
      } else {
        resolutionArgs[index] = def;
        return finish();
      }
    });
    for (_i = 0, _len = defs.length; _i < _len; _i++) {
      def = defs[_i];
      isPromise(def) && def.fail(trigger.reject);
    }
    return trigger.promise();
  };

  installInto = function(fw) {
    fw.Deferred = function() {
      return new Deferred();
    };
    fw.ajax = wrap(fw.ajax, function(ajax, options) {
      var createWrapper, def, promise, xhr;
      if (options == null) {
        options = {};
      }
      def = new Deferred();
      createWrapper = function(wrapped, finisher) {
        return wrap(wrapped, function() {
          var args, func;
          func = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (func) {
            func.apply(null, args);
          }
          return finisher.apply(null, args);
        });
      };
      options.success = createWrapper(options.success, def.resolve);
      options.error = createWrapper(options.error, def.reject);
      xhr = ajax(options);
      promise = def.promise();
      promise.abort = function() {
        return xhr.abort();
      };
      return promise;
    });
    return fw.when = _when;
  };

  if (typeof exports !== 'undefined') {
    exports.Deferred = function() {
      return new Deferred();
    };
    exports.when = _when;
    exports.installInto = installInto;
  } else if (typeof define === 'function' && define.amd) {
    define(function() {
      if (typeof Zepto !== 'undefined') {
        return installInto(Zepto);
      } else {
        Deferred.when = _when;
        Deferred.installInto = installInto;
        return Deferred;
      }
    });
  } else if (typeof Zepto !== 'undefined') {
    installInto(Zepto);
  } else {
    this.Deferred = function() {
      return new Deferred();
    };
    this.Deferred.when = _when;
    this.Deferred.installInto = installInto;
  }

}).call(this);

},{}],21:[function(require,module,exports){
(function () {

    'use strict';

    module.exports = {
        TileLayer: require('./layer/exports'),
        Renderer: require('./renderer/exports'),
        TileRequestor: require('./request/TileRequestor'),
        MetaRequestor: require('./request/MetaRequestor')
    };

}());

},{"./layer/exports":26,"./renderer/exports":50,"./request/MetaRequestor":62,"./request/TileRequestor":64}],22:[function(require,module,exports){
(function() {

    'use strict';

    var Image = require('./Image');

    var Debug = Image.extend({

        options: {
            unloadInvisibleTiles: true,
            zIndex: 5000
        },

        initialize: function(options) {
            // set renderer
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend
                $.extend(true, this, options.rendererClass);
            }
            // set options
            L.setOptions(this, options);
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _redrawTile: function(tile) {
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            this.renderTile(tile, coord);
            this.tileDrawn(tile);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-debug-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            tile.onselectstart = L.Util.falseFn;
            tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        renderTile: function( /*elem, coord*/ ) {
            // override
        },

        tileDrawn: function(tile) {
            this._tileOnLoad.call(tile);
        }

    });

    module.exports = Debug;

}());

},{"./Image":23}],23:[function(require,module,exports){
(function() {

    'use strict';

    var Image = L.TileLayer.extend({

        getOpacity: function() {
            return this.options.opacity;
        },

        show: function() {
            this._hidden = false;
            this._prevMap.addLayer(this);
        },

        hide: function() {
            this._hidden = true;
            this._prevMap = this._map;
            this._map.removeLayer(this);
        },

        isHidden: function() {
            return this._hidden;
        },

        setBrightness: function(brightness) {
            this._brightness = brightness;
            $(this._container).css('-webkit-filter', 'brightness(' + (this._brightness * 100) + '%)');
            $(this._container).css('filter', 'brightness(' + (this._brightness * 100) + '%)');
        },

        getBrightness: function() {
            return (this._brightness !== undefined) ? this._brightness : 1;
        }

    });

    module.exports = Image;

}());

},{}],24:[function(require,module,exports){
(function() {

    'use strict';

    var MIN = Number.MAX_VALUE;
    var MAX = 0;

    var Live = L.Class.extend({

        initialize: function(meta, options) {
            // set renderer
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend and initialize
                if (options.rendererClass.prototype) {
                    $.extend(true, this, options.rendererClass.prototype);
                    options.rendererClass.prototype.initialize.apply(this, arguments);
                } else {
                    $.extend(true, this, options.rendererClass);
                    options.rendererClass.initialize.apply(this, arguments);
                }
            }
            // set options
            L.setOptions(this, options);
            // set meta
            this._meta = meta;
            // set params
            this._params = {
                binning: {}
            };
            this.clearExtrema();
        },

        clearExtrema: function() {
            this._extrema = {
                min: MIN,
                max: MAX
            };
            this._cache = {};
        },

        getExtrema: function() {
            return this._extrema;
        },

        updateExtrema: function(data) {
            var extrema = this.extractExtrema(data);
            var changed = false;
            if (extrema.min < this._extrema.min) {
                changed = true;
                this._extrema.min = extrema.min;
            }
            if (extrema.max > this._extrema.max) {
                changed = true;
                this._extrema.max = extrema.max;
            }
            return changed;
        },

        extractExtrema: function(data) {
            return {
                min: _.min(data),
                max: _.max(data)
            };
        },

        setMeta: function(meta) {
            this._meta = meta;
            return this;
        },

        getMeta: function() {
            return this._meta;
        },

        setParams: function(params) {
            this._params = params;
        },

        getParams: function() {
            return this._params;
        }

    });

    module.exports = Live;

}());

},{}],25:[function(require,module,exports){
(function() {

    'use strict';

    var Image = require('./Image');

    var Pending = Image.extend({

        options: {
            unloadInvisibleTiles: true,
            zIndex: 5000
        },

        initialize: function(options) {
            this._pendingTiles = {};
            // set renderer
            if (!options.rendererClass) {
                console.warn('No `rendererClass` option found, this layer will not render any data.');
            } else {
                // recursively extend
                $.extend(true, this, options.rendererClass);
            }
            // set options
            L.setOptions(this, options);
        },

        increment: function(coord) {
            var hash = this._getTileHash(coord);
            if (this._pendingTiles[hash] === undefined) {
                this._pendingTiles[hash] = 1;
                var tiles = this._getTilesWithHash(hash);
                tiles.forEach(function(tile) {
                    this._redrawTile(tile);
                }, this);
            } else {
                this._pendingTiles[hash]++;
            }
        },

        decrement: function(coord) {
            var hash = this._getTileHash(coord);
            this._pendingTiles[hash]--;
            if (this._pendingTiles[hash] === 0) {
                delete this._pendingTiles[hash];
                var tiles = this._getTilesWithHash(hash);
                tiles.forEach(function(tile) {
                    this._redrawTile(tile);
                }, this);
            }
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _getTileClass: function(hash) {
            return 'pending-' + hash;
        },

        _getTileHash: function(coord) {
            return coord.z + '-' + coord.x + '-' + coord.y;
        },

        _getTilesWithHash: function(hash) {
            var className = this._getTileClass(hash);
            var tiles = [];
            $(this._container).find('.' + className).each(function() {
                tiles.push(this);
            });
            return tiles;
        },

        _redrawTile: function(tile) {
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            var hash = this._getTileHash(coord);
            $(tile).addClass(this._getTileClass(hash));
            if (this._pendingTiles[hash] > 0) {
                this.renderTile(tile, coord);
            } else {
                tile.innerHTML = '';
            }
            this.tileDrawn(tile);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-pending-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            tile.onselectstart = L.Util.falseFn;
            tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        renderTile: function( /*elem*/ ) {
            // override
        },

        tileDrawn: function(tile) {
            this._tileOnLoad.call(tile);
        }

    });

    module.exports = Pending;

}());

},{"./Image":23}],26:[function(require,module,exports){
(function() {

    'use strict';

    // debug tile layer
    var Debug = require('./core/Debug');

    // pending tile layer
    var Pending = require('./core/Pending');

    // standard XYZ / TMX image layer
    var Image = require('./core/Image');

    // live tile layers
    var Heatmap = require('./types/Heatmap');
    var TopCount = require('./types/TopCount');
    var TopFrequency = require('./types/TopFrequency');
    var TopicCount = require('./types/TopicCount');
    var TopicFrequency = require('./types/TopicFrequency');

    module.exports = {
        Debug: Debug,
        Pending: Pending,
        Image: Image,
        Heatmap: Heatmap,
        TopCount: TopCount,
        TopFrequency: TopFrequency,
        TopicCount: TopicCount,
        TopicFrequency: TopicFrequency
    };

}());

},{"./core/Debug":22,"./core/Image":23,"./core/Pending":25,"./types/Heatmap":41,"./types/TopCount":42,"./types/TopFrequency":43,"./types/TopicCount":44,"./types/TopicFrequency":45}],27:[function(require,module,exports){
(function() {

    'use strict';

    function rgb2lab(rgb) {
        var r = rgb[0] > 0.04045 ? Math.pow((rgb[0] + 0.055) / 1.055, 2.4) : rgb[0] / 12.92;
        var g = rgb[1] > 0.04045 ? Math.pow((rgb[1] + 0.055) / 1.055, 2.4) : rgb[1] / 12.92;
        var b = rgb[2] > 0.04045 ? Math.pow((rgb[2] + 0.055) / 1.055, 2.4) : rgb[2] / 12.92;
        //Observer. = 2°, Illuminant = D65
        var x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
        var y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
        var z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
        x = x / 0.95047; // Observer= 2°, Illuminant= D65
        y = y / 1.00000;
        z = z / 1.08883;
        x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787037 * x) + (16 / 116);
        y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787037 * y) + (16 / 116);
        z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787037 * z) + (16 / 116);
        return [(116 * y) - 16,
            500 * (x - y),
            200 * (y - z),
            rgb[3]];
    }

    function lab2rgb(lab) {
        var y = (lab[0] + 16) / 116;
        var x = y + lab[1] / 500;
        var z = y - lab[2] / 200;
        x = x > 0.206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
        y = y > 0.206893034 ? y * y * y : (y - 4 / 29) / 7.787037;
        z = z > 0.206893034 ? z * z * z : (z - 4 / 29) / 7.787037;
        x = x * 0.95047; // Observer= 2°, Illuminant= D65
        y = y * 1.00000;
        z = z * 1.08883;
        var r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
        var g = x * -0.9692660 + y * 1.8760108 + z * 0.0415560;
        var b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
        r = r > 0.00304 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.00304 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        b = b > 0.00304 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;
        return [Math.max(Math.min(r, 1), 0), Math.max(Math.min(g, 1), 0), Math.max(Math.min(b, 1), 0), lab[3]];
    }

    function distance(c1, c2) {
        return Math.sqrt(
            (c1[0] - c2[0]) * (c1[0] - c2[0]) +
            (c1[1] - c2[1]) * (c1[1] - c2[1]) +
            (c1[2] - c2[2]) * (c1[2] - c2[2]) +
            (c1[3] - c2[3]) * (c1[3] - c2[3])
        );
    }

    var GRADIENT_STEPS = 200;

    // Interpolate between a set of colors using even perceptual distance and interpolation in CIE L*a*b* space
    var buildPerceptualLookupTable = function(baseColors) {
        var outputGradient = [];
        // Calculate perceptual spread in L*a*b* space
        var labs = _.map(baseColors, function(color) {
            return rgb2lab([color[0] / 255, color[1] / 255, color[2] / 255, color[3] / 255]);
        });
        var distances = _.map(labs, function(color, index, colors) {
            return index > 0 ? distance(color, colors[index - 1]) : 0;
        });
        // Calculate cumulative distances in [0,1]
        var totalDistance = _.reduce(distances, function(a, b) {
            return a + b;
        }, 0);
        distances = _.map(distances, function(d) {
            return d / totalDistance;
        });
        var distanceTraversed = 0;
        var key = 0;
        var progress;
        var stepProgress;
        var rgb;
        for (var i = 0; i < GRADIENT_STEPS; i++) {
            progress = i / (GRADIENT_STEPS - 1);
            if (progress > distanceTraversed + distances[key + 1] && key + 1 < labs.length - 1) {
                key += 1;
                distanceTraversed += distances[key];
            }
            stepProgress = (progress - distanceTraversed) / distances[key + 1];
            rgb = lab2rgb([
                labs[key][0] + (labs[key + 1][0] - labs[key][0]) * stepProgress,
                labs[key][1] + (labs[key + 1][1] - labs[key][1]) * stepProgress,
                labs[key][2] + (labs[key + 1][2] - labs[key][2]) * stepProgress,
                labs[key][3] + (labs[key + 1][3] - labs[key][3]) * stepProgress
            ]);
            outputGradient.push([
                Math.round(rgb[0] * 255),
                Math.round(rgb[1] * 255),
                Math.round(rgb[2] * 255),
                Math.round(rgb[3] * 255)
            ]);
        }
        return outputGradient;
    };

    var COOL = buildPerceptualLookupTable([
        [0x04, 0x20, 0x40, 0x50],
        [0x08, 0x40, 0x81, 0x7f],
        [0x08, 0x68, 0xac, 0xff],
        [0x2b, 0x8c, 0xbe, 0xff],
        [0x4e, 0xb3, 0xd3, 0xff],
        [0x7b, 0xcc, 0xc4, 0xff],
        [0xa8, 0xdd, 0xb5, 0xff],
        [0xcc, 0xeb, 0xc5, 0xff],
        [0xe0, 0xf3, 0xdb, 0xff],
        [0xf7, 0xfc, 0xf0, 0xff]
    ]);

    var HOT = buildPerceptualLookupTable([
        [0x40, 0x00, 0x13, 0x50],
        [0x80, 0x00, 0x26, 0x7f],
        [0xbd, 0x00, 0x26, 0xff],
        [0xe3, 0x1a, 0x1c, 0xff],
        [0xfc, 0x4e, 0x2a, 0xff],
        [0xfd, 0x8d, 0x3c, 0xff],
        [0xfe, 0xb2, 0x4c, 0xff],
        [0xfe, 0xd9, 0x76, 0xff],
        [0xff, 0xed, 0xa0, 0xff]
    ]);

    var VERDANT = buildPerceptualLookupTable([
        [0x00, 0x40, 0x26, 0x50],
        [0x00, 0x5a, 0x32, 0x7f],
        [0x23, 0x84, 0x43, 0xff],
        [0x41, 0xab, 0x5d, 0xff],
        [0x78, 0xc6, 0x79, 0xff],
        [0xad, 0xdd, 0x8e, 0xff],
        [0xd9, 0xf0, 0xa3, 0xff],
        [0xf7, 0xfc, 0xb9, 0xff],
        [0xff, 0xff, 0xe5, 0xff]
    ]);

    var SPECTRAL = buildPerceptualLookupTable([
        [0x26, 0x1a, 0x40, 0x50],
        [0x44, 0x2f, 0x72, 0x7f],
        [0xe1, 0x2b, 0x02, 0xff],
        [0x02, 0xdc, 0x01, 0xff],
        [0xff, 0xd2, 0x02, 0xff],
        [0xff, 0xff, 0xff, 0xff]
    ]);

    var TEMPERATURE = buildPerceptualLookupTable([
        [0x00, 0x16, 0x40, 0x50],
        [0x00, 0x39, 0x66, 0x7f], //blue
        [0x31, 0x3d, 0x66, 0xff], //purple
        [0xe1, 0x2b, 0x02, 0xff], //red
        [0xff, 0xd2, 0x02, 0xff], //yellow
        [0xff, 0xff, 0xff, 0xff] //white
    ]);

    var GREYSCALE = buildPerceptualLookupTable([
        [0x00, 0x00, 0x00, 0x7f],
        [0x40, 0x40, 0x40, 0xff],
        [0xff, 0xff, 0xff, 0xff]
    ]);

    var POLAR_HOT = buildPerceptualLookupTable([
        [ 0xff, 0x44, 0x00, 0xff ],
        [ 0xbd, 0xbd, 0xbd, 0xb0 ]
    ]);

    var POLAR_COLD = buildPerceptualLookupTable([
        [ 0xbd, 0xbd, 0xbd, 0xb0 ],
        [ 0x32, 0xa5, 0xf9, 0xff ]
    ]);

    var buildLookupFunction = function(RAMP) {
        return function(scaledValue, inColor) {
            var color = RAMP[Math.floor(scaledValue * (RAMP.length - 1))];
            inColor[0] = color[0];
            inColor[1] = color[1];
            inColor[2] = color[2];
            inColor[3] = color[3];
            return inColor;
        };
    };

    var ColorRamp = {
        cool: buildLookupFunction(COOL),
        hot: buildLookupFunction(HOT),
        verdant: buildLookupFunction(VERDANT),
        spectral: buildLookupFunction(SPECTRAL),
        temperature: buildLookupFunction(TEMPERATURE),
        grey: buildLookupFunction(GREYSCALE),
        polar: buildLookupFunction(POLAR_HOT.concat(POLAR_COLD))
    };

    var setColorRamp = function(type) {
        var func = ColorRamp[type.toLowerCase()];
        if (func) {
            this._colorRamp = func;
        }
        return this;
    };

    var getColorRamp = function() {
        return this._colorRamp;
    };

    var initialize = function() {
        this._colorRamp = ColorRamp.verdant;
    };

    module.exports = {
        initialize: initialize,
        setColorRamp: setColorRamp,
        getColorRamp: getColorRamp
    };

}());

},{}],28:[function(require,module,exports){
(function() {

    'use strict';

    var SIGMOID_SCALE = 0.15;

    // log10

    function log10Transform(val, min, max) {
        var logMin = Math.log10(min || 1);
        var logMax = Math.log10(max || 1);
        var logVal = Math.log10(val || 1);
        return (logVal - logMin) / ((logMax - logMin) || 1);
    }

    function inverseLog10Transform(nval, min, max) {
        var logMin = Math.log10(min || 1);
        var logMax = Math.log10(max || 1);
        return Math.pow(10, (nval * logMax - nval * logMin) + logMin);
    }

    // sigmoid

    function sigmoidTransform(val, min, max) {
        var absMin = Math.abs(min);
        var absMax = Math.abs(max);
        var distance = Math.max(absMin, absMax);
        var scaledVal = val / (SIGMOID_SCALE * distance);
        return 1 / (1 + Math.exp(-scaledVal));
    }

    function inverseSigmoidTransform(nval, min, max) {
        var absMin = Math.abs(min);
        var absMax = Math.abs(max);
        var distance = Math.max(absMin, absMax);
        return Math.log((1/nval) - 1) * -(SIGMOID_SCALE * distance);
    }

    // linear

    function linearTransform(val, min, max) {
        var range = max - min;
        return (val - min) / range;
    }

    function inverseLinearTransform(nval, min, max) {
        var range = max - min;
        return min + nval * range;
    }

    var Transform = {
        linear: linearTransform,
        log10: log10Transform,
        sigmoid: sigmoidTransform
    };

    var Inverse = {
        linear: inverseLinearTransform,
        log10: inverseLog10Transform,
        sigmoid: inverseSigmoidTransform
    };

    var initialize = function() {
        this._range = {
            min: 0,
            max: 1
        };
        this._transformFunc = log10Transform;
        this._inverseFunc = inverseLog10Transform;
    };

    var setTransformFunc = function(type) {
        var func = type.toLowerCase();
        this._transformFunc = Transform[func];
        this._inverseFunc = Inverse[func];
    };

    var setValueRange = function(range) {
        this._range.min = range.min;
        this._range.max = range.max;
    };

    var getValueRange = function() {
        return this._range;
    };

    var interpolateToRange = function(nval) {
        // interpolate between the filter range
        var rMin = this._range.min;
        var rMax = this._range.max;
        var rval = (nval - rMin) / (rMax - rMin);
        // ensure output is [0:1]
        return Math.max(0, Math.min(1, rval));
    };

    var transformValue = function(val) {
        // clamp the value between the extreme (shouldn't be necessary)
        var min = this._extrema.min;
        var max = this._extrema.max;
        var clamped = Math.max(Math.min(val, max), min);
        // normalize the value
        return this._transformFunc(clamped, min, max);
    };

    var untransformValue = function(nval) {
        var min = this._extrema.min;
        var max = this._extrema.max;
        // clamp the value between the extreme (shouldn't be necessary)
        var clamped = Math.max(Math.min(nval, 1), 0);
        // unnormalize the value
        return this._inverseFunc(clamped, min, max);
    };

    module.exports = {
        initialize: initialize,
        setTransformFunc: setTransformFunc,
        setValueRange: setValueRange,
        getValueRange: getValueRange,
        transformValue: transformValue,
        untransformValue: untransformValue,
        interpolateToRange: interpolateToRange
    };

}());

},{}],29:[function(require,module,exports){
(function() {

    'use strict';

    var Tiling = require('./Tiling');

    var setResolution = function(resolution) {
        if (resolution !== this._params.binning.resolution) {
            this._params.binning.resolution = resolution;
            this.clearExtrema();
        }
        return this;
    };

    var getResolution = function() {
        return this._params.binning.resolution;
    };

    module.exports = {
        // tiling
        setXField: Tiling.setXField,
        getXField: Tiling.getXField,
        setYField: Tiling.setYField,
        getYField: Tiling.getYField,
        // binning
        setResolution: setResolution,
        getResolution: getResolution
    };

}());

},{"./Tiling":39}],30:[function(require,module,exports){
(function(){

  'use strict';

  function isValidQuery(meta, query){
    if (query && Array.isArray(query.must)){
      var queryComponentCheck = true;

      query.must.forEach(function(queryItem){
        var queryConfig = queryItem.term || queryItem.range;
        queryComponentCheck = queryComponentCheck && meta[queryConfig.field];
      });

      return queryComponentCheck;
    } else {
      return false;
    }
  }

  function addBoolQuery(query){

    var meta = this._meta;
    if (isValidQuery(meta, query)) {
      console.log('Valid bool_query');
      this._params.bool_query = query;
    } else {
      console.warn('Invalid bool_query');
    }
  }

  function removeBoolQuery(){
    this._params.bool_query = null;
    delete this._params.bool_query;
  }

  function getBoolQuery(){
    return this._params.bool_query;
  }

  module.exports = {
    addBoolQuery : addBoolQuery,
    removeBoolQuery : removeBoolQuery,
    getBoolQuery : getBoolQuery
  };
}());

},{}],31:[function(require,module,exports){
(function() {

    'use strict';

    var setDateHistogram = function(field, from, to, interval) {
        if (!field) {
            console.warn('DateHistogram `field` is missing from argument. Ignoring command.');
            return;
        }
        if (from === undefined) {
            console.warn('DateHistogram `from` are missing from argument. Ignoring command.');
            return;
        }
        if (to === undefined) {
            console.warn('DateHistogram `to` are missing from argument. Ignoring command.');
            return;
        }
        this._params.date_histogram = {
            field: field,
            from: from,
            to: to,
            interval: interval
        };
        this.clearExtrema();
        return this;
    };

    var getDateHistogram = function() {
        return this._params.date_histogram;
    };

    module.exports = {
        setDateHistogram: setDateHistogram,
        getDateHistogram: getDateHistogram
    };

}());

},{}],32:[function(require,module,exports){
(function() {

    'use strict';

    var setHistogram = function(field, interval) {
        if (!field) {
            console.warn('Histogram `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!interval) {
            console.warn('Histogram `interval` are missing from argument. Ignoring command.');
            return;
        }
        this._params.histogram = {
            field: field,
            interval: interval
        };
        this.clearExtrema();
        return this;
    };

    var getHistogram = function() {
        return this._params.histogram;
    };

    module.exports = {
        setHistogram: setHistogram,
        getHistogram: getHistogram
    };

}());

},{}],33:[function(require,module,exports){
(function() {

    'use strict';

    var METRICS = {
        'min': true,
        'max': true,
        'sum': true,
        'avg': true
    };

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                console.warn('Field `' + field + '` is not ordinal in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var setMetricAgg = function(field, type) {
        if (!field) {
            console.warn('MetricAgg `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!type) {
            console.warn('MetricAgg `type` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            if (!METRICS[type]) {
                console.warn('MetricAgg type `' + type + '` is not supported. Ignoring command.');
                return;
            }
            this._params.metric_agg = {
                field: field,
                type: type
            };
            this.clearExtrema();
        }
        return this;
    };

    var getMetricAgg = function() {
        return this._params.metric_agg;
    };

    module.exports = {
        // tiling
        setMetricAgg: setMetricAgg,
        getMetricAgg: getMetricAgg,
    };

}());

},{}],34:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var normalizeTerms = function(prefixes) {
        prefixes.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        return prefixes;
    };

    var addPrefixFilter = function(field, prefixes) {
        if (!field) {
            console.warn('PrefixFilter `field` is missing from argument. Ignoring command.');
            return;
        }
        if (prefixes === undefined) {
            console.warn('PrefixFilter `prefixes` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var filter = _.find(this._params.prefix_filter, function(filter) {
                return filter.field === field;
            });
            if (filter) {
                console.warn('Range with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.prefix_filter = this._params.prefix_filter || [];
            this._params.prefix_filter.push({
                field: field,
                prefixes: normalizeTerms(prefixes)
            });
            this.clearExtrema();
        }
        return this;
    };

    var updatePrefixFilter = function(field, prefixes) {
        var filter = _.find(this._params.prefix_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        if (prefixes !== undefined) {
            filter.prefixes = normalizeTerms(prefixes);
            this.clearExtrema();
        }
        return this;
    };

    var removePrefixFilter = function(field) {
        var filter = _.find(this._params.prefix_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.prefix_filter = _.filter(this._params.prefix_filter, function(filter) {
            return filter.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getPrefixFilter = function() {
        return this._params.prefix_filter;
    };

    module.exports = {
        addPrefixFilter: addPrefixFilter,
        updatePrefixFilter: updatePrefixFilter,
        removePrefixFilter: removePrefixFilter,
        getPrefixFilter: getPrefixFilter
    };

}());

},{}],35:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var addQueryString = function(field, str) {
        if (!field) {
            console.warn('QueryString `field` is missing from argument. Ignoring command.');
            return;
        }
        if (!str) {
            console.warn('QueryString `string` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var query = _.find(this._params.query_string, function(query) {
                return query.field === field;
            });
            if (query) {
                console.warn('QueryString with `field` of `' + field + '` already exists, used `updateQueryString` instead.');
                return;
            }
            this._params.query_string = this._params.query_string || [];
            this._params.query_string.push({
                field: field,
                string: str
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateQueryString = function(field, str) {
        var query = _.find(this._params.query_string, function(query) {
            return query.field === field;
        });
        if (!query) {
            console.warn('QueryString with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        var changed = false;
        if (str !== undefined) {
            changed = true;
            query.string = str;
        }
        if (changed) {
            this.clearExtrema();
        }
        return this;
    };

    var removeQueryString = function(field) {
        var query = _.find(this._params.query_string, function(query) {
            return query.field === field;
        });
        if (!query) {
            console.warn('QueryString with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.query_string = _.filter(this._params.query_string, function(query) {
            return query.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getQueryString = function() {
        return this._params.query_string;
    };

    module.exports = {
        addQueryString: addQueryString,
        updateQueryString: updateQueryString,
        removeQueryString: removeQueryString,
        getQueryString: getQueryString
    };

}());

},{}],36:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                console.warn('Field `' + field + '` is not ordinal in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var addRange = function(field, from, to) {
        if (!field) {
            console.warn('Range `field` is missing from argument. Ignoring command.');
            return;
        }
        if (from === undefined) {
            console.warn('Range `from` is missing from argument. Ignoring command.');
            return;
        }
        if (to === undefined) {
            console.warn('Range `to` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var range = _.find(this._params.range, function(range) {
                return range.field === field;
            });
            if (range) {
                console.warn('Range with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.range = this._params.range || [];
            this._params.range.push({
                field: field,
                from: from,
                to: to
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateRange = function(field, from, to) {
        var range = _.find(this._params.range, function(range) {
            return range.field === field;
        });
        if (!range) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        var changed = false;
        if (from !== undefined) {
            changed = true;
            range.from = from;
        }
        if (to !== undefined) {
            changed = true;
            range.to = to;
        }
        if (changed) {
            this.clearExtrema();
        }
        return this;
    };

    var removeRange = function(field) {
        var range = _.find(this._params.range, function(range) {
            return range.field === field;
        });
        if (!range) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.range = _.filter(this._params.range, function(range) {
            return range.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getRange = function() {
        return this._params.range;
    };

    module.exports = {
        addRange: addRange,
        updateRange: updateRange,
        removeRange: removeRange,
        getRange: getRange
    };

}());

},{}],37:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var normalizeTerms = function(terms) {
        terms.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        return terms;
    };

    var setTermsAgg = function(field, terms) {
        if (!field) {
            console.warn('TermsAgg `field` is missing from argument. Ignoring command.');
            return;
        }
        if (terms === undefined) {
            console.warn('TermsAgg `terms` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            this._params.terms_agg = {
                field: field,
                terms: normalizeTerms(terms)
            };
            this.clearExtrema();
        }
        return this;
    };

    var getTermsAgg = function() {
        return this._params.terms_agg;
    };

    module.exports = {
        setTermsAgg: setTermsAgg,
        getTermsAgg: getTermsAgg
    };

}());

},{}],38:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var normalizeTerms = function(terms) {
        terms.sort(function(a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        return terms;
    };

    var addTermsFilter = function(field, terms) {
        if (!field) {
            console.warn('TermsFilter `field` is missing from argument. Ignoring command.');
            return;
        }
        if (terms === undefined) {
            console.warn('TermsFilter `terms` are missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            var filter = _.find(this._params.terms_filter, function(filter) {
                return filter.field === field;
            });
            if (filter) {
                console.warn('TermsFilter with `field` of `' + field + '` already exists, used `updateRange` instead.');
                return;
            }
            this._params.terms_filter = this._params.terms_filter || [];
            this._params.terms_filter.push({
                field: field,
                terms: normalizeTerms(terms)
            });
            this.clearExtrema();
        }
        return this;
    };

    var updateTermsFilter = function(field, terms) {
        var filter = _.find(this._params.terms_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        if (terms !== undefined) {
            filter.terms = normalizeTerms(terms);
            this.clearExtrema();
        }
        return this;
    };

    var removeTermsFilter = function(field) {
        var filter = _.find(this._params.terms_filter, function(filter) {
            return filter.field === field;
        });
        if (!filter) {
            console.warn('Range with `field` of `' + field + '` does not exist. Ignoring command.');
            return;
        }
        this._params.terms_filter = _.filter(this._params.terms_filter, function(filter) {
            return filter.field !== field;
        });
        this.clearExtrema();
        return this;
    };

    var getTermsFilter = function(field) {
        return this._params.terms_filter[field];
    };

    module.exports = {
        addTermsFilter: addTermsFilter,
        updateTermsFilter: updateTermsFilter,
        removeTermsFilter: removeTermsFilter,
        getTermsFilter: getTermsFilter
    };

}());

},{}],39:[function(require,module,exports){
(function() {

    'use strict';

    var DEFAULT_X_FIELD = 'pixel.x';
    var DEFAULT_Y_FIELD = 'pixel.y';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                console.warn('Field `' + field + '` is not ordinal in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var setXField = function(field) {
        if (field !== this._params.binning.x) {
            if (field === DEFAULT_X_FIELD) {
                // reset if default
                this._params.binning.x = undefined;
                this._params.binning.left = undefined;
                this._params.binning.right = undefined;
                this.clearExtrema();
            } else {
                var meta = this._meta[field];
                if (checkField(meta, field)) {
                    this._params.binning.x = field;
                    this._params.binning.left = meta.extrema.min;
                    this._params.binning.right = meta.extrema.max;
                    this.clearExtrema();
                }
            }
        }
        return this;
    };

    var getXField = function() {
        return this._params.binning.x;
    };

    var setYField = function(field) {
        if (field !== this._params.binning.y) {
            if (field === DEFAULT_Y_FIELD) {
                // reset if default
                this._params.binning.y = undefined;
                this._params.binning.bottom = undefined;
                this._params.binning.top = undefined;
                this.clearExtrema();
            } else {
                var meta = this._meta[field];
                if (checkField(meta, field)) {
                    this._params.binning.y = field;
                    this._params.binning.bottom = meta.extrema.min;
                    this._params.binning.top = meta.extrema.max;
                    this.clearExtrema();
                }
            }
        }
        return this;
    };

    var getYField = function() {
        return this._params.binning.y;
    };

    module.exports = {
        setXField: setXField,
        getXField: getXField,
        setYField: setYField,
        getYField: getYField,
        DEFAULT_X_FIELD: DEFAULT_X_FIELD,
        DEFAULT_Y_FIELD: DEFAULT_Y_FIELD
    };

}());

},{}],40:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type === 'string') {
                return true;
            } else {
                console.warn('Field `' + field + '` is not of type `string` in meta data. Ignoring command.');
            }
        } else {
            console.warn('Field `' + field + '` is not recognized in meta data. Ignoring command.');
        }
        return false;
    };

    var setTopTerms = function(field, size) {
        if (!field) {
            console.warn('TopTerms `field` is missing from argument. Ignoring command.');
            return;
        }
        var meta = this._meta[field];
        if (checkField(meta, field)) {
            this._params.top_terms = {
                field: field,
                size: size
            };
            this.clearExtrema();
        }
        return this;
    };

    var getTopTerms = function() {
        return this._params.top_terms;
    };

    module.exports = {
        setTopTerms: setTopTerms,
        getTopTerms: getTopTerms
    };

}());

},{}],41:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../params/Binning');
    var MetricAgg = require('../params/MetricAgg');
    var TermsFilter = require('../params/TermsFilter');
    var BoolQuery = require('../params/BoolQuery');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var QueryString = require('../params/QueryString');
    var ColorRamp = require('../mixins/ColorRamp');
    var ValueTransform = require('../mixins/ValueTransform');

    var Heatmap = Live.extend({

        includes: [
            // params
            Binning,
            MetricAgg,
            TermsFilter,
            BoolQuery,
            PrefixFilter,
            Range,
            QueryString,
            // mixins
            ColorRamp,
            ValueTransform
        ],

        type: 'heatmap',

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

        extractExtrema: function(data) {
            var bins = new Float64Array(data);
            return {
                min: _.min(bins),
                max: _.max(bins)
            };
        }

    });

    module.exports = Heatmap;

}());

},{"../core/Live":24,"../mixins/ColorRamp":27,"../mixins/ValueTransform":28,"../params/Binning":29,"../params/BoolQuery":30,"../params/MetricAgg":33,"../params/PrefixFilter":34,"../params/QueryString":35,"../params/Range":36,"../params/TermsFilter":38}],42:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var TopTerms = require('../params/TopTerms');
    var Range = require('../params/Range');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopCount = Live.extend({

        includes: [
            // params
            Tiling,
            TopTerms,
            TermsFilter,
            PrefixFilter,
            Range,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'top_count',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopCount;

}());

},{"../core/Live":24,"../mixins/ValueTransform":28,"../params/Histogram":32,"../params/PrefixFilter":34,"../params/Range":36,"../params/TermsFilter":38,"../params/Tiling":39,"../params/TopTerms":40}],43:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TopTerms = require('../params/TopTerms');
    var TermsFilter = require('../params/TermsFilter');
    var PrefixFilter = require('../params/PrefixFilter');
    var Range = require('../params/Range');
    var DateHistogram = require('../params/DateHistogram');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TopTerms,
            TermsFilter,
            PrefixFilter,
            Range,
            DateHistogram,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'top_frequency',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopFrequency;

}());

},{"../core/Live":24,"../mixins/ValueTransform":28,"../params/DateHistogram":31,"../params/Histogram":32,"../params/PrefixFilter":34,"../params/Range":36,"../params/TermsFilter":38,"../params/Tiling":39,"../params/TopTerms":40}],44:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopicCount = Live.extend({

        includes: [
            // params
            Tiling,
            TermsAgg,
            Range,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'topic_count',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopicCount;

}());

},{"../core/Live":24,"../mixins/ValueTransform":28,"../params/Histogram":32,"../params/Range":36,"../params/TermsAgg":37,"../params/Tiling":39}],45:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../params/Tiling');
    var TermsAgg = require('../params/TermsAgg');
    var Range = require('../params/Range');
    var DateHistogram = require('../params/DateHistogram');
    var Histogram = require('../params/Histogram');
    var ValueTransform = require('../mixins/ValueTransform');

    var TopicFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TermsAgg,
            Range,
            DateHistogram,
            Histogram,
            // mixins
            ValueTransform
        ],

        type: 'topic_frequency',

        initialize: function() {
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

    });

    module.exports = TopicFrequency;

}());

},{"../core/Live":24,"../mixins/ValueTransform":28,"../params/DateHistogram":31,"../params/Histogram":32,"../params/Range":36,"../params/TermsAgg":37,"../params/Tiling":39}],46:[function(require,module,exports){
(function() {

    'use strict';

    var DOM = require('./DOM');

    var Canvas = DOM.extend({

        _createTile: function() {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.width = tile.height = this.options.tileSize;
            tile.onselectstart = tile.onmousemove = L.Util.falseFn;
            return tile;
        }

    });

    module.exports = Canvas;

}());

},{"./DOM":47}],47:[function(require,module,exports){
(function() {

    'use strict';

    var Image = require('../../layer/core/Image');

    var DOM = Image.extend({

        onAdd: function(map) {
            L.TileLayer.prototype.onAdd.call(this, map);
            map.on('zoomstart', this.clearExtrema, this);
        },

        onRemove: function(map) {
            map.off('zoomstart', this.clearExtrema, this);
            L.TileLayer.prototype.onRemove.call(this, map);
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _createTile: function() {
            // override
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            tile._unadjustedTilePoint = {
                x: tilePoint.x,
                y: tilePoint.y
            };
            tile.dataset.x = tilePoint.x;
            tile.dataset.y = tilePoint.y;
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        _adjustTileKey: function(key) {
            // when dealing with wrapped tiles, internally leafet will use
            // coordinates n < 0 and n > (2^z) to position them correctly.
            // this function converts that to the modulos key used to cache them
            // data.
            // Ex. '-1:3' at z = 2 becomes '3:3'
            var kArr = key.split(':');
            var x = parseInt(kArr[0], 10);
            var y = parseInt(kArr[1], 10);
            var tilePoint = {
                x: x,
                y: y
            };
            this._adjustTilePoint(tilePoint);
            return tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.z;
        },

        _removeTile: function(key) {
            var adjustedKey = this._adjustTileKey(key);
            var cached = this._cache[adjustedKey];
            // remove the tile from the cache
            delete cached.tiles[key];
            if (_.keys(cached.tiles).length === 0) {
                // no more tiles use this cached data, so delete it
                delete this._cache[adjustedKey];
            }
            // call parent method
            L.TileLayer.prototype._removeTile.call(this, key);
        },

        _redrawTile: function(tile) {
            var self = this;
            var cache = this._cache;
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            // use the adjusted coordinates to hash the the cache values, this
            // is because we want to only have one copy of the data
            var hash = coord.x + ':' + coord.y + ':' + coord.z;
            // use the unadjsuted coordinates to track which 'wrapped' tiles
            // used the cached data
            var unadjustedHash = tile._unadjustedTilePoint.x + ':' + tile._unadjustedTilePoint.y;
            // check cache
            var cached = cache[hash];
            if (cached) {
                if (cached.isPending) {
                    // currently pending
                    // store the tile in the cache to draw to later
                    cached.tiles[unadjustedHash] = tile;
                } else {
                    // already requested
                    // store the tile in the cache
                    cached.tiles[unadjustedHash] = tile;
                    // draw the tile
                    self.renderTile(tile, cached.data);
                    self.tileDrawn(tile);
                }
            } else {
                // create a cache entry
                cache[hash] = {
                    isPending: true,
                    tiles: {},
                    data: null
                };
                // add tile to the cache entry
                cache[hash].tiles[unadjustedHash] = tile;
                // request the tile
                this.requestTile(coord, function(data) {
                    var cached = cache[hash];
                    if (!cached) {
                        // tile is no longer being tracked, ignore
                        return;
                    }
                    cached.isPending = false;
                    cached.data = data;
                    // update the extrema
                    if (data && self.updateExtrema(data)) {
                        // extrema changed, redraw all tiles
                        self.redraw();
                    } else {
                        // same extrema, we are good to render the tiles. In
                        // the case of a map with wraparound, we may have
                        // multiple tiles dependent on the response, so iterate
                        // over each tile and draw it.
                        _.forIn(cached.tiles, function(tile) {
                            self.renderTile(tile, data);
                            self.tileDrawn(tile);
                        });
                    }
                });
            }
        },

        tileDrawn: function(tile) {
            this._tileOnLoad.call(tile);
        },

        requestTile: function() {
            // override
        },

        renderTile: function() {
            // override
        },

    });

    module.exports = DOM;

}());

},{"../../layer/core/Image":23}],48:[function(require,module,exports){
(function() {

    'use strict';

    var DOM = require('./DOM');

    var HTML = DOM.extend({

        options: {
            handlers: {}
        },

        onAdd: function(map) {
            var self = this;
            DOM.prototype.onAdd.call(this, map);
            map.on('click', this.onClick, this);
            $(this._container).on('mouseover', function(e) {
                self.onMouseOver(e);
            });
            $(this._container).on('mouseout', function(e) {
                self.onMouseOut(e);
            });
        },

        onRemove: function(map) {
            map.off('click', this.onClick, this);
            $(this._container).off('mouseover');
            $(this._container).off('mouseout');
            DOM.prototype.onRemove.call(this, map);
        },

        _createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-html-tile');
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            tile.onselectstart = L.Util.falseFn;
            tile.onmousemove = L.Util.falseFn;
            return tile;
        },

        onMouseOver: function() {
            // override
        },

        onMouseOut: function() {
            // override
        },


        onClick: function() {
            // override
        }

    });

    module.exports = HTML;

}());

},{"./DOM":47}],49:[function(require,module,exports){
(function() {

    'use strict';

    var esper = require('esper');

    function translationMatrix(translation) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            translation[0], translation[1], translation[2], 1
        ]);
    }

    function orthoMatrix(left, right, bottom, top, near, far) {
        var mat = new Float32Array(16);
        mat[0] = 2 / ( right - left );
        mat[1] = 0;
        mat[2] = 0;
        mat[3] = 0;
        mat[4] = 0;
        mat[5] = 2 / ( top - bottom );
        mat[6] = 0;
        mat[7] = 0;
        mat[8] = 0;
        mat[9] = 0;
        mat[10] = -2 / ( far - near );
        mat[11] = 0;
        mat[12] = -( ( right + left ) / ( right - left ) );
        mat[13] = -( ( top + bottom ) / ( top - bottom ) );
        mat[14] = -( ( far + near ) / ( far - near ) );
        mat[15] = 1;
        return mat;
    }

    // TODO:
    //     - fix zoom transition animation bug
    //     - fix show / hide bug

    var WebGL = L.Class.extend({

        includes: [
            L.Mixin.Events
        ],

        options: {
            minZoom: 0,
            maxZoom: 18,
            zoomOffset: 0,
            opacity: 1,
            shaders: {
                vert: null,
                frag: null
            },
            unloadInvisibleTiles: L.Browser.mobile,
            updateWhenIdle: L.Browser.mobile
        },

        initialize: function(meta, options) {
            options = L.setOptions(this, options);
            if (options.bounds) {
                options.bounds = L.latLngBounds(options.bounds);
            }
        },

        getOpacity: function() {
            return this.options.opacity;
        },

        show: function() {
            this._hidden = false;
            this._prevMap.addLayer(this);
        },

        hide: function() {
            this._hidden = true;
            this._prevMap = this._map;
            this._map.removeLayer(this);
        },

        isHidden: function() {
            return this._hidden;
        },

        onAdd: function(map) {
            this._map = map;
            this._animated = map._zoomAnimated;
            if (!this._canvas) {
                // create canvas
                this._initCanvas();
                map._panes.tilePane.appendChild(this._canvas);
                // initialize the webgl context
                this._initGL();
            } else {
                map._panes.tilePane.appendChild(this._canvas);
            }
            // set up events
            map.on({
                'resize': this._resize,
                'viewreset': this._reset,
                'moveend': this._update,
                'zoomstart': this.clearExtrema
            }, this);
            if (map.options.zoomAnimation && L.Browser.any3d) {
                map.on({
                    'zoomstart': this._enableZooming,
                    'zoomanim': this._animateZoom,
                    'zoomend': this._disableZooming,
                }, this);
            }
            if (!this.options.updateWhenIdle) {
                this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
                map.on('move', this._limitedUpdate, this);
            }
            this._reset();
            this._update();
        },

        addTo: function(map) {
            map.addLayer(this);
            return this;
        },

        onRemove: function(map) {
            // clear the current buffer
            this._clearBackBuffer();
            map.getPanes().tilePane.removeChild(this._canvas);
            map.off({
                'resize': this._resize,
                'viewreset': this._reset,
                'moveend': this._update,
                'zoomstart': this.clearExtrema
            }, this);
            if (map.options.zoomAnimation) {
                map.off({
                    'zoomstart': this._enableZooming,
                    'zoomanim': this._animateZoom,
                    'zoomend': this._disableZooming
                }, this);
            }
            if (!this.options.updateWhenIdle) {
                map.off('move', this._limitedUpdate, this);
            }
            this._map = null;
            this._animated = null;
            this._isZooming = false;
            this._cache = {};
        },

        _enableZooming: function() {
            this._isZooming = true;
        },

        _disableZooming: function() {
            this._isZooming = false;
            this._clearBackBuffer();
        },

        bringToFront: function() {
            var pane = this._map._panes.tilePane;
            if (this._canvas) {
                pane.appendChild(this._canvas);
                this._setAutoZIndex(pane, Math.max);
            }
            return this;
        },

        bringToBack: function() {
            var pane = this._map._panes.tilePane;
            if (this._canvas) {
                pane.insertBefore(this._canvas, pane.firstChild);
                this._setAutoZIndex(pane, Math.min);
            }
            return this;
        },

        _setAutoZIndex: function(pane, compare) {
            var layers = pane.children;
            var edgeZIndex = -compare(Infinity, -Infinity); // -Infinity for max, Infinity for min
            var zIndex;
            var i;
            var len;
            for (i = 0, len = layers.length; i < len; i++) {
                if (layers[i] !== this._canvas) {
                    zIndex = parseInt(layers[i].style.zIndex, 10);
                    if (!isNaN(zIndex)) {
                        edgeZIndex = compare(edgeZIndex, zIndex);
                    }
                }
            }
            this.options.zIndex = this._canvas.style.zIndex = (isFinite(edgeZIndex) ? edgeZIndex : 0) + compare(1, -1);
        },

        setOpacity: function(opacity) {
            this.options.opacity = opacity;
            return this;
        },

        setZIndex: function(zIndex) {
            this.options.zIndex = zIndex;
            this._updateZIndex();
            return this;
        },

        _updateZIndex: function() {
            if (this._canvas && this.options.zIndex !== undefined) {
                this._canvas.style.zIndex = this.options.zIndex;
            }
        },

        _reset: function(e) {
            var self = this;
            _.forIn(this._tiles, function(tile) {
                self.fire('tileunload', {
                    tile: tile
                });
            });
            this._tiles = {};
            this._tilesToLoad = 0;
            if (this._animated && e && e.hard) {
                this._clearBackBuffer();
            }
        },

        _update: function() {
            if (!this._map) {
                return;
            }
            var map = this._map;
            var bounds = map.getPixelBounds();
            var zoom = map.getZoom();
            var tileSize = this._getTileSize();
            if (zoom > this.options.maxZoom ||
                zoom < this.options.minZoom) {
                return;
            }
            var tileBounds = L.bounds(
                bounds.min.divideBy(tileSize)._floor(),
                bounds.max.divideBy(tileSize)._floor());
            this._addTilesFromCenterOut(tileBounds);
            if (this.options.unloadInvisibleTiles) {
                this._removeOtherTiles(tileBounds);
            }
        },

        _addTilesFromCenterOut: function(bounds) {
            var queue = [];
            var center = bounds.getCenter();
            var j;
            var i;
            var point;
            for (j = bounds.min.y; j <= bounds.max.y; j++) {
                for (i = bounds.min.x; i <= bounds.max.x; i++) {
                    point = new L.Point(i, j);
                    if (this._tileShouldBeLoaded(point)) {
                        queue.push(point);
                    }
                }
            }
            var tilesToLoad = queue.length;
            if (tilesToLoad === 0) {
                return;
            }
            // load tiles in order of their distance to center
            queue.sort(function(a, b) {
                return a.distanceTo(center) - b.distanceTo(center);
            });
            // if its the first batch of tiles to load
            if (!this._tilesToLoad) {
                this.fire('loading');
            }
            this._tilesToLoad += tilesToLoad;
            for (i = 0; i < tilesToLoad; i++) {
                this._addTile(queue[i]);
            }
        },

        _tileShouldBeLoaded: function(tilePoint) {
            if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
                return false; // already loaded
            }
            var options = this.options;
            if (!options.continuousWorld) {
                var limit = this._getWrapTileNum();
                // don't load if exceeds world bounds
                if ((options.noWrap && (tilePoint.x < 0 || tilePoint.x >= limit.x)) ||
                    tilePoint.y < 0 || tilePoint.y >= limit.y) {
                    return false;
                }
            }
            if (options.bounds) {
                var tileSize = this._getTileSize();
                var nwPoint = tilePoint.multiplyBy(tileSize);
                var sePoint = nwPoint.add([tileSize, tileSize]);
                var nw = this._map.unproject(nwPoint);
                var se = this._map.unproject(sePoint);
                // TODO temporary hack, will be removed after refactoring projections
                // https://github.com/Leaflet/Leaflet/issues/1618
                if (!options.continuousWorld && !options.noWrap) {
                    nw = nw.wrap();
                    se = se.wrap();
                }
                if (!options.bounds.intersects([nw, se])) {
                    return false;
                }
            }
            return true;
        },

        _removeOtherTiles: function(bounds) {
            var self = this;
            _.forIn(this._tiles, function(tile, key) {
                var kArr = key.split(':');
                var x = parseInt(kArr[0], 10);
                var y = parseInt(kArr[1], 10);
                // remove tile if it's out of bounds
                if (x < bounds.min.x ||
                    x > bounds.max.x ||
                    y < bounds.min.y ||
                    y > bounds.max.y) {
                    self._removeTile(key);
                }
            });
        },

        _getTileSize: function() {
            var map = this._map;
            var zoom = map.getZoom() + this.options.zoomOffset;
            var zoomN = this.options.maxNativeZoom;
            var tileSize = 256;
            if (zoomN && zoom > zoomN) {
                tileSize = Math.round(map.getZoomScale(zoom) / map.getZoomScale(zoomN) * tileSize);
            }
            return tileSize;
        },

        redraw: function() {
            if (this._map) {
                this._reset({
                    hard: true
                });
                this._update();
            }
            return this;
        },

        _createTile: function() {
            return {};
        },

        _addTile: function(tilePoint) {
            // create a new tile
            var tile = this._createTile();
            this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
            this._loadTile(tile, tilePoint);
        },

        _loadTile: function(tile, tilePoint) {
            tile._layer = this;
            tile._tilePoint = tilePoint;
            tile._unadjustedTilePoint = {
                x: tilePoint.x,
                y: tilePoint.y
            };
            this._adjustTilePoint(tilePoint);
            this._redrawTile(tile);
        },

        _adjustTileKey: function(key) {
            // when dealing with wrapped tiles, internally leafet will use
            // coordinates n < 0 and n > (2^z) to position them correctly.
            // this function converts that to the modulos key used to cache them
            // data.
            // Ex. '-1:3' at z = 2 becomes '3:3'
            var kArr = key.split(':');
            var x = parseInt(kArr[0], 10);
            var y = parseInt(kArr[1], 10);
            var tilePoint = {
                x: x,
                y: y
            };
            this._adjustTilePoint(tilePoint);
            return tilePoint.x + ':' + tilePoint.y + ':' + tilePoint.z;
        },

        _getZoomForUrl: function() {
            var options = this.options;
            var zoom = this._map.getZoom();
            if (options.zoomReverse) {
                zoom = options.maxZoom - zoom;
            }
            zoom += options.zoomOffset;
            return options.maxNativeZoom ? Math.min(zoom, options.maxNativeZoom) : zoom;
        },

        _getTilePos: function(tilePoint) {
            var origin = this._map.getPixelOrigin();
            var tileSize = this._getTileSize();
            return tilePoint.multiplyBy(tileSize).subtract(origin);
        },

        _getWrapTileNum: function() {
            var crs = this._map.options.crs;
            var size = crs.getSize(this._map.getZoom());
            return size.divideBy(this._getTileSize())._floor();
        },

        _adjustTilePoint: function(tilePoint) {
            var limit = this._getWrapTileNum();
            // wrap tile coordinates
            if (!this.options.continuousWorld && !this.options.noWrap) {
                tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;
            }
            if (this.options.tms) {
                tilePoint.y = limit.y - tilePoint.y - 1;
            }
            tilePoint.z = this._getZoomForUrl();
        },

        _removeTile: function(key) {
            var adjustedKey = this._adjustTileKey(key);
            var cached = this._cache[adjustedKey];
            // remove the tile from the cache
            delete cached.tiles[key];
            if (_.keys(cached.tiles).length === 0) {
                // no more tiles use this cached data, so delete it
                delete this._cache[adjustedKey];
            }
            // unload the tile
            var tile = this._tiles[key];
            this.fire('tileunload', {
                tile: tile
            });
            delete this._tiles[key];
        },

        _tileLoaded: function() {
            this._tilesToLoad--;
            if (this._animated) {
                L.DomUtil.addClass(this._canvas, 'leaflet-zoom-animated');
            }
            if (!this._tilesToLoad) {
                this.fire('load');
                if (this._animated) {
                    // clear scaled tiles after all new tiles are loaded (for performance)
                    clearTimeout(this._clearBufferTimer);
                    this._clearBufferTimer = setTimeout(L.bind(this._clearBackBuffer, this), 500);
                }
            }
        },

        _tileOnLoad: function() {
            var layer = this._layer;
            L.DomUtil.addClass(this, 'leaflet-tile-loaded');
            layer.fire('tileload', {
                tile: this
            });
            layer._tileLoaded();
        },

        _tileOnError: function() {
            var layer = this._layer;
            layer.fire('tileerror', {
                tile: this
            });
            layer._tileLoaded();
        },

        _encodeFloatAsUint8: function(num) {
            return new Uint8Array([
                (num & 0xff000000) >> 24,
                (num & 0x00ff0000) >> 16,
                (num & 0x0000ff00) >> 8,
                (num & 0x000000ff)
            ]);
        },

        _createDataTexture: function(data) {
            var doubles = new Float64Array(data);
            var resolution = Math.sqrt(doubles.length);
            var buffer = new ArrayBuffer(resolution * resolution * 4);
            var encodedBins = new Uint8Array(buffer);
            for (var i = 0; i < resolution * resolution; i++) {
                // cast from float64 to float32
                var enc = this._encodeFloatAsUint8(doubles[i]);
                encodedBins[i * 4] = enc[0];
                encodedBins[i * 4 + 1] = enc[1];
                encodedBins[i * 4 + 2] = enc[2];
                encodedBins[i * 4 + 3] = enc[3];
            }
            return new esper.Texture2D({
                height: resolution,
                width: resolution,
                data: encodedBins,
                format: 'RGBA',
                type: 'UNSIGNED_BYTE',
                wrap: 'CLAMP_TO_EDGE',
                filter: 'NEAREST',
                invertY: true
            });
        },

        _redrawTile: function(tile) {
            var self = this;
            var cache = this._cache;
            var coord = {
                x: tile._tilePoint.x,
                y: tile._tilePoint.y,
                z: this._map._zoom
            };
            // use the adjusted coordinates to hash the the cache values, this
            // is because we want to only have one copy of the data
            var hash = coord.x + ':' + coord.y + ':' + coord.z;
            // use the unadjsuted coordinates to track which 'wrapped' tiles
            // used the cached data
            var unadjustedHash = tile._unadjustedTilePoint.x + ':' + tile._unadjustedTilePoint.y;
            // check cache
            var cached = cache[hash];
            if (cached) {
                // store the tile in the cache to draw to later
                cached.tiles[unadjustedHash] = tile;
            } else {
                // create a cache entry
                cache[hash] = {
                    isPending: true,
                    tiles: {},
                    data: null
                };
                // add tile to the cache entry
                cache[hash].tiles[unadjustedHash] = tile;
                // request the tile
                this.requestTile(coord, function(data) {
                    var cached = cache[hash];
                    if (!cached) {
                        // tile is no longer being tracked, ignore
                        return;
                    }
                    cached.isPending = false;
                    // if data is null, exit early
                    if (data === null) {
                        return;
                    }
                    // update the extrema
                    self.updateExtrema(data);
                    cached.data = self._createDataTexture(data);
                });
            }
        },

        _initGL: function() {
            var self = this;
            var gl = this._gl = esper.WebGLContext.get(this._canvas);
            // handle missing context
            if (!gl) {
                console.error('Unable to acquire a WebGL context.');
                return;
            }
            // init the webgl state
            gl.clearColor(0, 0, 0, 0);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.disable(gl.DEPTH_TEST);
            // create tile renderable
            self._renderable = new esper.Renderable({
                vertices: {
                    0: [
                        [0, -256],
                        [256, -256],
                        [256, 0],
                        [0, 0]
                    ],
                    1: [
                        [0, 0],
                        [1, 0],
                        [1, 1],
                        [0, 1]
                    ]
                },
                indices: [
                    0, 1, 2,
                    0, 2, 3
                ]
            });
            // load shaders
            this._shader = new esper.Shader({
                vert: this.options.shaders.vert,
                frag: this.options.shaders.frag
            }, function() {
                // execute callback
                var width = self._canvas.width;
                var height = self._canvas.height;
                self._viewport = new esper.Viewport({
                    width: width,
                    height: height
                });
                self._initialized = true;
                self._draw();
            });
        },

        _initCanvas: function() {
            this._canvas = L.DomUtil.create('canvas', 'leaflet-webgl-layer leaflet-layer');
            var size = this._map.getSize();
            this._canvas.width = size.x;
            this._canvas.height = size.y;
            var animated = this._map.options.zoomAnimation && L.Browser.any3d;
            L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));
        },

        _getProjection: function() {
            var bounds = this._map.getPixelBounds();
            var dim = Math.pow(2, this._map.getZoom()) * 256;
            return orthoMatrix(
                bounds.min.x,
                bounds.max.x,
                (dim - bounds.max.y),
                (dim - bounds.min.y),
                -1, 1);
        },

        _clearBackBuffer: function() {
            if (!this._gl) {
                return;
            }
            var gl = this._gl;
            gl.clear(gl.COLOR_BUFFER_BIT);
        },

        _animateZoom: function(e) {
            var scale = this._map.getZoomScale(e.zoom);
            var offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
            this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
        },

        _resize: function(resizeEvent) {
            var width = resizeEvent.newSize.x;
            var height = resizeEvent.newSize.y;
            if (this._initialized) {
                this._viewport.resize(width, height);
            }
        },

        _draw: function() {
            if (this._initialized && this._gl) {
                if (!this.isHidden()) {
                    // re-position canvas
                    if (!this._isZooming) {
                        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
                        L.DomUtil.setPosition(this._canvas, topLeft);
                    }
                    this._beforeDraw();
                    this.beforeDraw();
                    this.draw();
                    this.afterDraw();
                    this._afterDraw();
                }
                requestAnimationFrame(this._draw.bind(this));
            }
        },

        beforeDraw: function() {
            // override
        },

        _beforeDraw: function() {
            this._viewport.push();
            this._shader.push();
            this._shader.setUniform('uProjectionMatrix', this._getProjection());
            this._shader.setUniform('uOpacity', this.getOpacity());
            this._shader.setUniform('uTextureSampler', 0);
        },

        afterDraw: function() {
            // override
        },

        _afterDraw: function() {
            this._shader.pop();
            this._viewport.pop();
        },

        draw: function() {
            var self = this;
            var dim = Math.pow(2, this._map.getZoom()) * 256;
            // for each tile
            _.forIn(this._cache, function(cached) {
                if (cached.isPending || !cached.data) {
                    return;
                }
                // bind tile texture to texture unit 0
                cached.data.push(0);
                _.forIn(cached.tiles, function(tile, key) {
                    // find the tiles position from its key
                    var kArr = key.split(':');
                    var x = parseInt(kArr[0], 10);
                    var y = parseInt(kArr[1], 10);
                    // create model matrix
                    var model = new translationMatrix([
                        256 * x,
                        dim - (256 * y),
                        0
                    ]);
                    self._shader.setUniform('uModelMatrix', model);
                    // draw the tile
                    self._renderable.draw();
                });
            // no need to unbind texture
            });
        },

        requestTile: function() {
            // override
        }

    });

    module.exports = WebGL;

}());

},{"esper":12}],50:[function(require,module,exports){
(function() {

    'use strict';

    // canvas renderers
    var Canvas = {
        Heatmap: require('./types/canvas/Heatmap')
    };

    // html renderers
    var HTML = {
        Heatmap: require('./types/html/Heatmap'),
        Ring: require('./types/html/Ring'),
        WordCloud: require('./types/html/WordCloud'),
        WordHistogram: require('./types/html/WordHistogram')
    };

    // webgl renderers
    var WebGL = {
        Heatmap: require('./types/webgl/Heatmap')
    };

    // pending layer renderers
    var Pending = {
        Blink: require('./types/pending/Blink'),
        Spin: require('./types/pending/Spin'),
        BlinkSpin: require('./types/pending/BlinkSpin'),
    };

    // pending layer renderers
    var Debug = {
        Coord: require('./types/debug/Coord')
    };

    module.exports = {
        HTML: HTML,
        Canvas: Canvas,
        WebGL: WebGL,
        Debug: Debug,
        Pending: Pending
    };

}());

},{"./types/canvas/Heatmap":52,"./types/debug/Coord":53,"./types/html/Heatmap":54,"./types/html/Ring":55,"./types/html/WordCloud":56,"./types/html/WordHistogram":57,"./types/pending/Blink":58,"./types/pending/BlinkSpin":59,"./types/pending/Spin":60,"./types/webgl/Heatmap":61}],51:[function(require,module,exports){
(function() {

    'use strict';

    var POSITIVE = '1';
    var NEUTRAL = '0';
    var NEGATIVE = '-1';

    function getClassFunc(min, max) {
        min = min !== undefined ? min : -1;
        max = max !== undefined ? max : 1;
        var positive = [0.25 * max, 0.5 * max, 0.75 * max];
        var negative = [-0.25 * min, -0.5 * min, -0.75 * min];
        return function(sentiment) {
            var prefix;
            var range;
            if (sentiment < 0) {
                prefix = 'neg-';
                range = negative;
            } else {
                prefix = 'pos-';
                range = positive;
            }
            var abs = Math.abs(sentiment);
            if (abs > range[2]) {
                return prefix + '4';
            } else if (abs > range[1]) {
                return prefix + '3';
            } else if (abs > range[0]) {
                return prefix + '2';
            }
            return prefix + '1';
        };
    }

    function getTotal(count) {
        if (!count) {
            return 0;
        }
        var pos = count[POSITIVE] ? count[POSITIVE] : 0;
        var neu = count[NEUTRAL] ? count[NEUTRAL] : 0;
        var neg = count[NEGATIVE] ? count[NEGATIVE] : 0;
        return pos + neu + neg;
    }

    function getAvg(count) {
        if (!count) {
            return 0;
        }
        var pos = count[POSITIVE] ? count[POSITIVE] : 0;
        var neu = count[NEUTRAL] ? count[NEUTRAL] : 0;
        var neg = count[NEGATIVE] ? count[NEGATIVE] : 0;
        var total = pos + neu + neg;
        return (total !== 0) ? (pos - neg) / total : 0;
    }

    module.exports = {
        getClassFunc: getClassFunc,
        getTotal: getTotal,
        getAvg: getAvg
    };

}());

},{}],52:[function(require,module,exports){
(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var Heatmap = Canvas.extend({

        renderCanvas: function(bins, resolution, rampFunc) {
            var canvas = document.createElement('canvas');
            canvas.height = resolution;
            canvas.width = resolution;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.getImageData(0, 0, resolution, resolution);
            var data = imageData.data;
            var self = this;
            var color = [0, 0, 0, 0];
            var nval, rval, bin, i;
            for (i=0; i<bins.length; i++) {
                bin = bins[i];
                if (bin === 0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                    color[3] = 0;
                } else {
                    nval = self.transformValue(bin);
                    rval = self.interpolateToRange(nval);
                    rampFunc(rval, color);
                }
                data[i * 4] = color[0];
                data[i * 4 + 1] = color[1];
                data[i * 4 + 2] = color[2];
                data[i * 4 + 3] = color[3];
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        },

        renderTile: function(canvas, data) {
            if (!data) {
                return;
            }
            var bins = new Float64Array(data);
            var resolution = Math.sqrt(bins.length);
            var ramp = this.getColorRamp();
            var tileCanvas = this.renderCanvas(bins, resolution, ramp);
            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                tileCanvas,
                0, 0,
                resolution, resolution,
                0, 0,
                canvas.width, canvas.height);
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/Canvas":46}],53:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        renderTile: function(elem, coord) {
            $(elem).empty();
            $(elem).append('<div style="top:0; left:0;">' + coord.z + ', ' + coord.x + ', ' + coord.y + '</div>');
        }

    };

}());

},{}],54:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var TILE_SIZE = 256;

    var Heatmap = HTML.extend({

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
        },

        clearSelection: function() {
            $(this._container).removeClass('highlight');
            this.highlight = null;
        },

        onMouseOver: function(e) {
            var target = $(e.originalEvent.target);
            var value = target.attr('data-value');
            if (value) {
                if (this.options.handlers.mouseover) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseover(target, {
                        value: parseInt(value, 10),
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        bx: parseInt(target.attr('data-bx'), 10),
                        by: parseInt(target.attr('data-by'), 10),
                        type: 'heatmap',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            var target = $(e.originalEvent.target);
            var value = target.attr('data-value');
            if (value) {
                if (this.options.handlers.mouseout) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseout(target, {
                        value: value,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        bx: parseInt(target.attr('data-bx'), 10),
                        by: parseInt(target.attr('data-by'), 10),
                        type: 'heatmap',
                        layer: this
                    });
                }
            }
        },

        onClick: function(e) {
            // un-select any prev selected pixel
            $('.heatmap-pixel').removeClass('highlight');
            // get target
            var target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            if ( target.hasClass('heatmap-pixel') ) {
                target.addClass('highlight');
            }
            var value = target.attr('data-value');
            if (value) {
                if (this.options.handlers.click) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.click(target, {
                        value: value,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        bx: parseInt(target.attr('data-bx'), 10),
                        by: parseInt(target.attr('data-by'), 10),
                        type: 'heatmap',
                        layer: this
                    });
                }
            }
        },

        renderTile: function(container, data) {
            if (!data) {
                return;
            }
            var bins = new Float64Array(data);
            var resolution = Math.sqrt(bins.length);
            var rampFunc = this.getColorRamp();
            var pixelSize = TILE_SIZE / resolution;
            var self = this;
            var color = [0, 0, 0, 0];
            var html = '';
            var nval, rval, bin;
            var left, top;
            var i;
            for (i=0; i<bins.length; i++) {
                bin = bins[i];
                if (bin === 0) {
                    continue;
                } else {
                    left = (i % resolution);
                    top = Math.floor(i / resolution);
                    nval = self.transformValue(bin);
                    rval = self.interpolateToRange(nval);
                    rampFunc(rval, color);
                }
                var rgba = 'rgba(' +
                    color[0] + ',' +
                    color[1] + ',' +
                    color[2] + ',' +
                    (color[3] / 255) + ')';
                html += '<div class="heatmap-pixel" ' +
                    'data-value="' + bin + '" ' +
                    'data-bx="' + left + '" ' +
                    'data-by="' + top + '" ' +
                    'style="' +
                    'height:' + pixelSize + 'px;' +
                    'width:' + pixelSize + 'px;' +
                    'left:' + (left * pixelSize) + 'px;' +
                    'top:' + (top * pixelSize) + 'px;' +
                    'background-color:' + rgba + ';"></div>';
            }
            container.innerHTML = html;
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/HTML":48}],55:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var TILE_SIZE = 256;

    var Heatmap = HTML.extend({

        onClick: function(e) {
            var target = $(e.originalEvent.target);
            $('.heatmap-ring').removeClass('highlight');
            if ( target.hasClass('heatmap-ring') ) {
                target.addClass('highlight');
            }
        },

        renderTile: function(container, data) {
            if (!data) {
                return;
            }
            var self = this;
            var bins = new Float64Array(data);
            var resolution = Math.sqrt(bins.length);
            var binSize = (TILE_SIZE / resolution);
            var html = '';
            bins.forEach(function(bin, index) {
                if (!bin) {
                    return;
                }
                var percent = self.transformValue(bin);
                var radius = percent * binSize;
                var offset = (binSize - radius) / 2;
                var left = (index % resolution) * binSize;
                var top = Math.floor(index / resolution) * binSize;
                html += '<div class="heatmap-ring" style="' +
                    'left:' + (left + offset) + 'px;' +
                    'top:' + (top + offset) + 'px;' +
                    'width:' + radius + 'px;' +
                    'height:' + radius + 'px;' +
                    '"></div>';
            });
            container.innerHTML = html;
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/HTML":48}],56:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');
    var sentiment = require('../../sentiment/Sentiment');
    var sentimentFunc = sentiment.getClassFunc(-1, 1);

    var TILE_SIZE = 256;
    var HALF_SIZE = TILE_SIZE / 2;
    var VERTICAL_OFFSET = 24;
    var HORIZONTAL_OFFSET = 10;
    var MAX_NUM_WORDS = 15;
    var MIN_FONT_SIZE = 10;
    var MAX_FONT_SIZE = 20;
    var NUM_ATTEMPTS = 1;

    /**
     * Given an initial position, return a new position, incrementally spiralled
     * outwards.
     */
    var spiralPosition = function(pos) {
        var pi2 = 2 * Math.PI;
        var circ = pi2 * pos.radius;
        var inc = (pos.arcLength > circ / 10) ? circ / 10 : pos.arcLength;
        var da = inc / pos.radius;
        var nt = (pos.t + da);
        if (nt > pi2) {
            nt = nt % pi2;
            pos.radius = pos.radius + pos.radiusInc;
        }
        pos.t = nt;
        pos.x = pos.radius * Math.cos(nt);
        pos.y = pos.radius * Math.sin(nt);
        return pos;
    };

    /**
     *  Returns true if bounding box a intersects bounding box b
     */
    var intersectTest = function(a, b) {
        return (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
            (Math.abs(a.y - b.y) * 2 < (a.height + b.height));
    };

    /**
     *  Returns true if bounding box a is not fully contained inside bounding box b
     */
    var overlapTest = function(a, b) {
        return (a.x + a.width / 2 > b.x + b.width / 2 ||
            a.x - a.width / 2 < b.x - b.width / 2 ||
            a.y + a.height / 2 > b.y + b.height / 2 ||
            a.y - a.height / 2 < b.y - b.height / 2);
    };

    /**
     * Check if a word intersects another word, or is not fully contained in the
     * tile bounding box
     */
    var intersectWord = function(position, word, cloud, bb) {
        var box = {
            x: position.x,
            y: position.y,
            height: word.height,
            width: word.width
        };
        var i;
        for (i = 0; i < cloud.length; i++) {
            if (intersectTest(box, cloud[i])) {
                return true;
            }
        }
        // make sure it doesn't intersect the border;
        if (overlapTest(box, bb)) {
            // if it hits a border, increment collision count
            // and extend arc length
            position.collisions++;
            position.arcLength = position.radius;
            return true;
        }
        return false;
    };

    var WordCloud = HTML.extend({

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
        },

        clearSelection: function() {
            $(this._container).removeClass('highlight');
            this.highlight = null;
        },

        onMouseOver: function(e) {
            var target = $(e.originalEvent.target);
            $('.word-cloud-label').removeClass('hover');
            var word = target.attr('data-word');
            if (word) {
                $('.word-cloud-label[data-word=' + word + ']').addClass('hover');
                if (this.options.handlers.mouseover) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseover(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-cloud',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            var target = $(e.originalEvent.target);
            $('.word-cloud-label').removeClass('hover');
            var word = target.attr('data-word');
            if (word) {
                if (this.options.handlers.mouseout) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseout(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-cloud',
                        layer: this
                    });
                }
            }
        },

        onClick: function(e) {
            // un-select any prev selected words
            $('.word-cloud-label').removeClass('highlight');
            $(this._container).removeClass('highlight');
            // get target
            var target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            var word = target.attr('data-word');
            if (word) {
                $(this._container).addClass('highlight');
                $('.word-cloud-label[data-word=' + word + ']').addClass('highlight');
                this.highlight = word;
                if (this.options.handlers.click) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.click(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-cloud',
                        layer: this
                    });
                }
            } else {
                this.clearSelection();
            }
        },

        _measureWords: function(wordCounts) {
            // sort words by frequency
            wordCounts = wordCounts.sort(function(a, b) {
                return b.count - a.count;
            }).slice(0, MAX_NUM_WORDS);
            // build measurement html
            var html = '<div style="height:256px; width:256px;">';
            var self = this;
            wordCounts.forEach(function(word) {
                word.percent = self.transformValue(word.count);
                word.fontSize = MIN_FONT_SIZE + word.percent * (MAX_FONT_SIZE - MIN_FONT_SIZE);
                html += '<div class="word-cloud-label" style="' +
                    'visibility:hidden;' +
                    'font-size:' + word.fontSize + 'px;">' + word.text + '</div>';
            });
            html += '</div>';
            // append measurements
            var $temp = $(html);
            $('body').append($temp);
            $temp.children().each(function(index) {
                wordCounts[index].width = this.offsetWidth;
                wordCounts[index].height = this.offsetHeight;
            });
            $temp.remove();
            return wordCounts;
        },

        _createWordCloud: function(wordCounts) {
            var boundingBox = {
                width: TILE_SIZE - HORIZONTAL_OFFSET * 2,
                height: TILE_SIZE - VERTICAL_OFFSET * 2,
                x: 0,
                y: 0
            };
            var cloud = [];
            // sort words by frequency
            wordCounts = this._measureWords(wordCounts);
            // assemble word cloud
            wordCounts.forEach(function(wordCount) {
                // starting spiral position
                var pos = {
                    radius: 1,
                    radiusInc: 5,
                    arcLength: 10,
                    x: 0,
                    y: 0,
                    t: 0,
                    collisions: 0
                };
                // spiral outwards to find position
                while (pos.collisions < NUM_ATTEMPTS) {
                    // increment position in a spiral
                    pos = spiralPosition(pos);
                    // test for intersection
                    if (!intersectWord(pos, wordCount, cloud, boundingBox)) {
                        cloud.push({
                            text: wordCount.text,
                            fontSize: wordCount.fontSize,
                            percent: Math.round((wordCount.percent * 100) / 10) * 10, // round to nearest 10
                            x: pos.x,
                            y: pos.y,
                            width: wordCount.width,
                            height: wordCount.height,
                            sentiment: wordCount.sentiment,
                            avg: wordCount.avg
                        });
                        break;
                    }
                }
            });
            return cloud;
        },

        extractExtrema: function(data) {
            var sums = _.map(data, function(count) {
                if (_.isNumber(count)) {
                    return count;
                }
                return sentiment.getTotal(count);
            });
            return {
                min: _.min(sums),
                max: _.max(sums),
            };
        },

        renderTile: function(container, data) {
            if (!data || _.isEmpty(data)) {
                return;
            }
            var highlight = this.highlight;
            var wordCounts = _.map(data, function(count, key) {
                if (_.isNumber(count)) {
                    return {
                        count: count,
                        text: key
                    };
                }
                var total = sentiment.getTotal(count);
                var avg = sentiment.getAvg(count);
                return {
                    count: total,
                    text: key,
                    avg: avg,
                    sentiment: sentimentFunc(avg)
                };
            });
            // exit early if no words
            if (wordCounts.length === 0) {
                return;
            }
            // genereate the cloud
            var cloud = this._createWordCloud(wordCounts);
            // build html elements
            var html = '';
            cloud.forEach(function(word) {
                // create classes
                var classNames = [
                    'word-cloud-label',
                    'word-cloud-label-' + word.percent,
                    word.text === highlight ? 'highlight' : '',
                    word.sentiment ? word.sentiment : ''
                ].join(' ');
                // create styles
                var styles = [
                    'font-size:' + word.fontSize + 'px',
                    'left:' + (HALF_SIZE + word.x - (word.width / 2)) + 'px',
                    'top:' + (HALF_SIZE + word.y - (word.height / 2)) + 'px',
                    'width:' + word.width + 'px',
                    'height:' + word.height + 'px',
                ].join(';');
                // create html for entry
                html += '<div class="' + classNames + '"' +
                    'style="' + styles + '"' +
                    'data-sentiment="' + word.avg + '"' +
                    'data-word="' + word.text + '">' +
                    word.text +
                    '</div>';
            });
            container.innerHTML = html;
        }

    });

    module.exports = WordCloud;

}());

},{"../../core/HTML":48,"../../sentiment/Sentiment":51}],57:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');
    var sentiment = require('../../sentiment/Sentiment');
    var sentimentFunc = sentiment.getClassFunc(-1, 1);

    var TILE_SIZE = 256;
    var HALF_SIZE = TILE_SIZE / 2;
    var MAX_NUM_WORDS = 8;
    var MIN_FONT_SIZE = 16;
    var MAX_FONT_SIZE = 22;

    var isSingleValue = function(count) {
        // single values are never null, and always numbers
        return count !== null && _.isNumber(count);
    };

    var extractCount = function(count) {
        if (isSingleValue(count)) {
            return count;
        }
        return sentiment.getTotal(count);
    };

    var extractSentimentClass = function(avg) {
        if (avg !== undefined) {
            return sentimentFunc(avg);
        }
        return '';
    };

    var extractFrequency = function(count) {
        if (isSingleValue(count)) {
            return {
                count: count
            };
        }
        return {
            count: sentiment.getTotal(count),
            avg: sentiment.getAvg(count)
        };
    };

    var extractAvg = function(frequencies) {
        if (frequencies[0].avg === undefined) {
            return;
        }
        var sum = _.sumBy(frequencies, function(frequency) {
            return frequency.avg;
        });
        return sum / frequencies.length;
    };

    var extractValues = function(data, key) {
        var frequencies = _.map(data, extractFrequency);
        var avg = extractAvg(frequencies);
        var max = _.maxBy(frequencies, function(val) {
            return val.count;
        }).count;
        var total = _.sumBy(frequencies, function(val) {
            return val.count;
        });
        return {
            topic: key,
            frequencies: frequencies,
            max: max,
            total: total,
            avg: avg
        };
    };

    var WordHistogram = HTML.extend({

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
        },

        clearSelection: function() {
            $(this._container).removeClass('highlight');
            this.highlight = null;
        },

        onMouseOver: function(e) {
            var target = $(e.originalEvent.target);
            $('.word-histogram-entry').removeClass('hover');
            var word = target.attr('data-word');
            if (word) {
                $('.word-histogram-entry[data-word=' + word + ']').addClass('hover');
                if (this.options.handlers.mouseover) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseover(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-histogram',
                        layer: this
                    });
                }
            }
        },

        onMouseOut: function(e) {
            var target = $(e.originalEvent.target);
            $('.word-histogram-entry').removeClass('hover');
            var word = target.attr('data-word');
            if (word) {
                if (this.options.handlers.mouseout) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.mouseout(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-histogram',
                        layer: this
                    });
                }
            }
        },

        onClick: function(e) {
            // un-select and prev selected histogram
            $('.word-histogram-entry').removeClass('highlight');
            $(this._container).removeClass('highlight');
            // get target
            var target = $(e.originalEvent.target);
            if (!this.isTargetLayer(e.originalEvent.target)) {
                // this layer is not the target
                return;
            }
            var word = target.attr('data-word');
            if (word) {
                $(this._container).addClass('highlight');
                $('.word-histogram-entry[data-word=' + word + ']').addClass('highlight');
                this.highlight = word;
                if (this.options.handlers.click) {
                    var $parent = target.parents('.leaflet-html-tile');
                    this.options.handlers.click(target, {
                        value: word,
                        x: parseInt($parent.attr('data-x'), 10),
                        y: parseInt($parent.attr('data-y'), 10),
                        z: this._map.getZoom(),
                        type: 'word-histogram',
                        layer: this
                    });
                }
            } else {
                this.clearSelection();
            }
        },

        extractExtrema: function(data) {
            var sums = _.map(data, function(counts) {
                return _.sumBy(counts, extractCount);
            });
            return {
                min: _.min(sums),
                max: _.max(sums),
            };
        },

        renderTile: function(container, data) {
            if (!data || _.isEmpty(data)) {
                return;
            }
            var highlight = this.highlight;
            // convert object to array
            var values = _.map(data, extractValues).sort(function(a, b) {
                return b.total - a.total;
            });
            // get number of entries
            var numEntries = Math.min(values.length, MAX_NUM_WORDS);
            var $html = $('<div class="word-histograms" style="display:inline-block;"></div>');
            var totalHeight = 0;
            var self = this;
            values.slice(0, numEntries).forEach(function(value) {
                var topic = value.topic;
                var frequencies = value.frequencies;
                var max = value.max;
                var total = value.total;
                var avg = value.avg;
                var sentimentClass = extractSentimentClass(avg);
                var highlightClass = (topic === highlight) ? 'highlight' : '';
                // scale the height based on level min / max
                var percent = self.transformValue(total);
                var percentLabel = Math.round((percent * 100) / 10) * 10;
                var height = MIN_FONT_SIZE + percent * (MAX_FONT_SIZE - MIN_FONT_SIZE);
                totalHeight += height;
                // create container 'entry' for chart and hashtag
                var $entry = $('<div class="word-histogram-entry ' + highlightClass + '" ' +
                    'data-sentiment="' + avg + '"' +
                    'data-word="' + topic + '"' +
                    'style="' +
                    'height:' + height + 'px;"></div>');
                // create chart
                var $chart = $('<div class="word-histogram-left"' +
                    'data-sentiment="' + avg + '"' +
                    'data-word="' + topic + '"' +
                    '></div>');
                var barWidth = 'calc(' + (100 / frequencies.length) + '%)';
                // create bars
                frequencies.forEach(function(frequency) {
                    var count = frequency.count;
                    var avg = frequency.avg;
                    var sentimentClass = extractSentimentClass(avg);
                    // get the percent relative to the highest count in the tile
                    var relativePercent = (max !== 0) ? (count / max) * 100 : 0;
                    // make invisible if zero count
                    var visibility = relativePercent === 0 ? 'hidden' : '';
                    // Get the style class of the bar
                    var percentLabel = Math.round(relativePercent / 10) * 10;
                    var barClasses = [
                        'word-histogram-bar',
                        'word-histogram-bar-' + percentLabel,
                        sentimentClass + '-fill'
                    ].join(' ');
                    var barHeight;
                    var barTop;
                    // ensure there is at least a single pixel of color
                    if ((relativePercent / 100) * height < 3) {
                        barHeight = '3px';
                        barTop = 'calc(100% - 3px)';
                    } else {
                        barHeight = relativePercent + '%';
                        barTop = (100 - relativePercent) + '%';
                    }
                    // create bar
                    $chart.append('<div class="' + barClasses + '"' +
                        'data-word="' + topic + '"' +
                        'style="' +
                        'visibility:' + visibility + ';' +
                        'width:' + barWidth + ';' +
                        'height:' + barHeight + ';' +
                        'top:' + barTop + ';"></div>');
                });
                $entry.append($chart);
                var topicClasses = [
                    'word-histogram-label',
                    'word-histogram-label-' + percentLabel,
                    sentimentClass
                ].join(' ');
                // create tag label
                var $topic = $('<div class="word-histogram-right">' +
                    '<div class="' + topicClasses + '"' +
                    'data-sentiment="' + avg + '"' +
                    'data-word="' + topic + '"' +
                    'style="' +
                    'font-size:' + height + 'px;' +
                    'line-height:' + height + 'px;' +
                    'height:' + height + 'px">' + topic + '</div>' +
                    '</div>');
                $entry.append($topic);
                $html.append($entry);
            });
            $html.css('top', HALF_SIZE - (totalHeight / 2));
            container.innerHTML = $html[0].outerHTML;
        }
    });

    module.exports = WordHistogram;

}());

},{"../../core/HTML":48,"../../sentiment/Sentiment":51}],58:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        renderTile: function(elem) {
            elem.innerHtml = '<div class="blinking blinking-tile" style="animation-delay:' + -(Math.random() * 1200) + 'ms;"></div>';
        }

    };

}());

},{}],59:[function(require,module,exports){
(function() {

    'use strict';

    var DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            var delay = -(Math.random() * DELAY) + 'ms';
            elem.innerHTML =
                '<div class="vertical-centered-box blinking" style="animation-delay:' + delay + '">' +
                    '<div class="content">' +
                        '<div class="loader-circle"></div>' +
                        '<div class="loader-line-mask" style="animation-delay:' + delay + '">' +
                            '<div class="loader-line"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

    };

}());

},{}],60:[function(require,module,exports){
(function() {

    'use strict';

    var DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            var delay = -(Math.random() * DELAY) + 'ms';
            elem.innerHTML =
                '<div class="vertical-centered-box" style="animation-delay:' + delay + '">' +
                    '<div class="content">' +
                        '<div class="loader-circle"></div>' +
                        '<div class="loader-line-mask" style="animation-delay:' + delay + '">' +
                            '<div class="loader-line"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

    };

}());

},{}],61:[function(require,module,exports){
(function() {

    'use strict';

    var WebGL = require('../../core/WebGL');

    // TODO:
    //     - update to preceptual color ramps (layer is currently broken)

    var Heatmap = WebGL.extend({

        options: {
            shaders: {
                vert: '../../shaders/heatmap.vert',
                frag: '../../shaders/heatmap.frag',
            }
        },

        beforeDraw: function() {
            var ramp = this.getColorRamp();
            var color = [0, 0, 0, 0];
            this._shader.setUniform('uMin', this.getExtrema().min);
            this._shader.setUniform('uMax', this.getExtrema().max);
            this._shader.setUniform('uColorRampFrom', ramp(0.0, color));
            this._shader.setUniform('uColorRampTo', ramp(1.0, color));
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/WebGL":49}],62:[function(require,module,exports){
(function() {

    'use strict';

    var Requestor = require('./Requestor');

    function MetaRequestor() {
        Requestor.apply(this, arguments);
    }

    MetaRequestor.prototype = Object.create(Requestor.prototype);

    MetaRequestor.prototype.getHash = function(req) {
        return req.type + '-' +
            req.index + '-' +
            req.store;
    };

    MetaRequestor.prototype.getURL = function(res) {
        return 'meta/' +
            res.type + '/' +
            res.endpoint + '/' +
            res.index + '/' +
            res.store;
    };

    module.exports = MetaRequestor;

}());

},{"./Requestor":63}],63:[function(require,module,exports){
(function() {

    'use strict';

    var retryInterval = 5000;

    function getHost() {
        var loc = window.location;
        var new_uri;
        if (loc.protocol === 'https:') {
            new_uri = 'wss:';
        } else {
            new_uri = 'ws:';
        }
        return new_uri + '//' + loc.host + loc.pathname;
    }

    function establishConnection(requestor, callback) {
        requestor.socket = new WebSocket(getHost() + requestor.url);
        // on open
        requestor.socket.onopen = function() {
            requestor.isOpen = true;
            console.log('Websocket connection established');
            callback.apply(this, arguments);
        };
        // on message
        requestor.socket.onmessage = function(event) {
            var res = JSON.parse(event.data);
            var hash = requestor.getHash(res);
            var request = requestor.requests[hash];
            delete requestor.requests[hash];
            if (res.success) {
                request.resolve(requestor.getURL(res), res);
            } else {
                request.reject(res);
            }
        };
        // on close
        requestor.socket.onclose = function() {
            // log close only if connection was ever open
            if (requestor.isOpen) {
                console.warn('Websocket connection closed');
            }
            requestor.socket = null;
            requestor.isOpen = false;
            // reject all pending requests
            Object.keys(requestor.requests).forEach(function(key) {
                requestor.requests[key].reject();
            });
            // clear request map
            requestor.requests = {};
            // attempt to re-establish connection
            setTimeout(function() {
                establishConnection(requestor, function() {
                    // once connection is re-established, send pending requests
                    requestor.pending.forEach(function(req) {
                        requestor.get(req);
                    });
                    requestor.pending = [];
                });
            }, retryInterval);
        };
    }

    function Requestor(url, callback) {
        this.url = url;
        this.requests = {};
        this.pending = [];
        this.isOpen = false;
        establishConnection(this, callback);
    }

    Requestor.prototype.getHash = function( /*req*/ ) {
        // override
    };

    Requestor.prototype.getURL = function( /*res*/ ) {
        // override
    };

    Requestor.prototype.get = function(req) {
        if (!this.isOpen) {
            // if no connection, add request to pending queue
            this.pending.push(req);
            return;
        }
        var hash = this.getHash(req);
        var request = this.requests[hash];
        if (request) {
            return request.promise();
        }
        request = this.requests[hash] = $.Deferred();
        this.socket.send(JSON.stringify(req));
        return request.promise();
    };

    Requestor.prototype.close = function() {
        this.socket.onclose = null;
        this.socket.close();
        this.socket = null;
    };

    module.exports = Requestor;

}());

},{}],64:[function(require,module,exports){
(function() {

    'use strict';

    var stringify = require('json-stable-stringify');
    var Requestor = require('./Requestor');

    function pruneEmpty(obj) {
        return function prune(current) {
            _.forOwn(current, function(value, key) {
              if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
                (_.isString(value) && _.isEmpty(value)) ||
                (_.isObject(value) && _.isEmpty(prune(value)))) {
                delete current[key];
              }
            });
            // remove any leftover undefined values from the delete
            // operation on an array
            if (_.isArray(current)) {
                _.pull(current, undefined);
            }
            return current;
        }(_.cloneDeep(obj)); // do not modify the original object, create a clone instead
    }

    function TileRequestor() {
        Requestor.apply(this, arguments);
    }

    TileRequestor.prototype = Object.create(Requestor.prototype);

    TileRequestor.prototype.getHash = function(req) {
        var coord = req.coord;
        var hash = stringify(pruneEmpty(req.params));
        return req.type + '-' +
            req.index + '-' +
            req.store + '-' +
            coord.x + '-' +
            coord.y + '-' +
            coord.z + '-' +
            hash;
    };

    TileRequestor.prototype.getURL = function(res) {
        var coord = res.coord;
        return 'tile/' +
            res.type + '/' +
            res.index + '/' +
            res.store + '/' +
            coord.z + '/' +
            coord.x + '/' +
            coord.y;
    };

    module.exports = TileRequestor;

}());

},{"./Requestor":63,"json-stable-stringify":16}]},{},[21])(21)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvSW5kZXhCdWZmZXIuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvUmVuZGVyVGFyZ2V0LmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1JlbmRlcmFibGUuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvU2hhZGVyLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1NoYWRlclBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9lc3Blci9zcmMvY29yZS9UZXh0dXJlMkQuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVGV4dHVyZUN1YmVNYXAuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVmVydGV4QnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1ZlcnRleFBhY2thZ2UuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVmlld3BvcnQuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvV2ViR0xDb250ZXh0LmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9leHBvcnRzLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL1N0YWNrLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL1V0aWwuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL3V0aWwvWEhSTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2pzb24tc3RhYmxlLXN0cmluZ2lmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2pzb25pZnkvbGliL3BhcnNlLmpzIiwibm9kZV9tb2R1bGVzL2pzb25pZnkvbGliL3N0cmluZ2lmeS5qcyIsIm5vZGVfbW9kdWxlcy9zaW1wbHktZGVmZXJyZWQvZGVmZXJyZWQuanMiLCJzY3JpcHRzL2V4cG9ydHMuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvRGVidWcuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvSW1hZ2UuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvTGl2ZS5qcyIsInNjcmlwdHMvbGF5ZXIvY29yZS9QZW5kaW5nLmpzIiwic2NyaXB0cy9sYXllci9leHBvcnRzLmpzIiwic2NyaXB0cy9sYXllci9taXhpbnMvQ29sb3JSYW1wLmpzIiwic2NyaXB0cy9sYXllci9taXhpbnMvVmFsdWVUcmFuc2Zvcm0uanMiLCJzY3JpcHRzL2xheWVyL3BhcmFtcy9CaW5uaW5nLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvQm9vbFF1ZXJ5LmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvRGF0ZUhpc3RvZ3JhbS5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL0hpc3RvZ3JhbS5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL01ldHJpY0FnZy5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL1ByZWZpeEZpbHRlci5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL1F1ZXJ5U3RyaW5nLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvUmFuZ2UuanMiLCJzY3JpcHRzL2xheWVyL3BhcmFtcy9UZXJtc0FnZy5qcyIsInNjcmlwdHMvbGF5ZXIvcGFyYW1zL1Rlcm1zRmlsdGVyLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvVGlsaW5nLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbXMvVG9wVGVybXMuanMiLCJzY3JpcHRzL2xheWVyL3R5cGVzL0hlYXRtYXAuanMiLCJzY3JpcHRzL2xheWVyL3R5cGVzL1RvcENvdW50LmpzIiwic2NyaXB0cy9sYXllci90eXBlcy9Ub3BGcmVxdWVuY3kuanMiLCJzY3JpcHRzL2xheWVyL3R5cGVzL1RvcGljQ291bnQuanMiLCJzY3JpcHRzL2xheWVyL3R5cGVzL1RvcGljRnJlcXVlbmN5LmpzIiwic2NyaXB0cy9yZW5kZXJlci9jb3JlL0NhbnZhcy5qcyIsInNjcmlwdHMvcmVuZGVyZXIvY29yZS9ET00uanMiLCJzY3JpcHRzL3JlbmRlcmVyL2NvcmUvSFRNTC5qcyIsInNjcmlwdHMvcmVuZGVyZXIvY29yZS9XZWJHTC5qcyIsInNjcmlwdHMvcmVuZGVyZXIvZXhwb3J0cy5qcyIsInNjcmlwdHMvcmVuZGVyZXIvc2VudGltZW50L1NlbnRpbWVudC5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvY2FudmFzL0hlYXRtYXAuanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGVzL2RlYnVnL0Nvb3JkLmpzIiwic2NyaXB0cy9yZW5kZXJlci90eXBlcy9odG1sL0hlYXRtYXAuanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGVzL2h0bWwvUmluZy5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvaHRtbC9Xb3JkQ2xvdWQuanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGVzL2h0bWwvV29yZEhpc3RvZ3JhbS5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvcGVuZGluZy9CbGluay5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvcGVuZGluZy9CbGlua1NwaW4uanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGVzL3BlbmRpbmcvU3Bpbi5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZXMvd2ViZ2wvSGVhdG1hcC5qcyIsInNjcmlwdHMvcmVxdWVzdC9NZXRhUmVxdWVzdG9yLmpzIiwic2NyaXB0cy9yZXF1ZXN0L1JlcXVlc3Rvci5qcyIsInNjcmlwdHMvcmVxdWVzdC9UaWxlUmVxdWVzdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaHRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBXZWJHTENvbnRleHQgPSByZXF1aXJlKCcuL1dlYkdMQ29udGV4dCcpLFxyXG4gICAgICAgIF9ib3VuZEJ1ZmZlciA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYW4gSW5kZXhCdWZmZXIgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIEluZGV4QnVmZmVyXHJcbiAgICAgKiBAY2xhc3NkZXNjIEFuIGluZGV4IGJ1ZmZlciBvYmplY3QuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIEluZGV4QnVmZmVyKCBhcmcsIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgdGhpcy5nbCA9IFdlYkdMQ29udGV4dC5nZXQoKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IDA7XHJcbiAgICAgICAgaWYgKCBhcmcgKSB7XHJcbiAgICAgICAgICAgIGlmICggYXJnIGluc3RhbmNlb2YgV2ViR0xCdWZmZXIgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgYXJndW1lbnQgaXMgYWxyZWFkeSBhIHdlYmdsYnVmZmVyLCBzaW1wbHkgd3JhcCBpdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXIgPSBhcmc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBvcHRpb25zLnR5cGUgfHwgJ1VOU0lHTkVEX1NIT1JUJztcclxuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgPSAoIG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5jb3VudCA6IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBvdGhlcndpc2UsIGJ1ZmZlciBpdFxyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJEYXRhKCBhcmcgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm9mZnNldCA9ICggb3B0aW9ucy5vZmZzZXQgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5vZmZzZXQgOiAwO1xyXG4gICAgICAgIHRoaXMubW9kZSA9ICggb3B0aW9ucy5tb2RlICE9PSB1bmRlZmluZWQgKSA/IG9wdGlvbnMubW9kZSA6ICdUUklBTkdMRVMnO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXBsb2FkIGluZGV4IGRhdGEgdG8gdGhlIEdQVS5cclxuICAgICAqIEBtZW1iZXJvZiBJbmRleEJ1ZmZlclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7QXJyYXl8VWludDE2QXJyYXl8VWludDMyQXJyYXl9IGFyZyAtIFRoZSBhcnJheSBvZiBkYXRhIHRvIGJ1ZmZlci5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7SW5kZXhCdWZmZXJ9IFRoZSBpbmRleCBidWZmZXIgb2JqZWN0IGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgSW5kZXhCdWZmZXIucHJvdG90eXBlLmJ1ZmZlckRhdGEgPSBmdW5jdGlvbiggYXJnICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgLy8gY2hlY2sgZm9yIHR5cGUgc3VwcG9ydFxyXG4gICAgICAgIHZhciB1aW50MzJzdXBwb3J0ID0gV2ViR0xDb250ZXh0LmNoZWNrRXh0ZW5zaW9uKCAnT0VTX2VsZW1lbnRfaW5kZXhfdWludCcgKTtcclxuICAgICAgICBpZiggIXVpbnQzMnN1cHBvcnQgKSB7XHJcbiAgICAgICAgICAgIC8vIG5vIHN1cHBvcnQgZm9yIHVpbnQzMlxyXG4gICAgICAgICAgICBpZiAoIGFyZyBpbnN0YW5jZW9mIEFycmF5ICkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgYXJyYXksIGJ1ZmZlciB0byB1aW50MTZcclxuICAgICAgICAgICAgICAgIGFyZyA9IG5ldyBVaW50MTZBcnJheSggYXJnICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGFyZyBpbnN0YW5jZW9mIFVpbnQzMkFycmF5ICkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgdWludDMyLCBkb3duZ3JhZGUgdG8gdWludDE2XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oICdDYW5ub3QgY3JlYXRlIEluZGV4QnVmZmVyIG9mIGZvcm1hdCAnICtcclxuICAgICAgICAgICAgICAgICAgICAnZ2wuVU5TSUdORURfSU5UIGFzIE9FU19lbGVtZW50X2luZGV4X3VpbnQgaXMgbm90ICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICdzdXBwb3J0ZWQsIGRlZmF1bHRpbmcgdG8gZ2wuVU5TSUdORURfU0hPUlQuJyApO1xyXG4gICAgICAgICAgICAgICAgYXJnID0gbmV3IFVpbnQxNkFycmF5KCBhcmcgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHVpbnQzMiBpcyBzdXBwb3J0ZWRcclxuICAgICAgICAgICAgaWYgKCBhcmcgaW5zdGFuY2VvZiBBcnJheSApIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGFycmF5LCBidWZmZXIgdG8gdWludDMyXHJcbiAgICAgICAgICAgICAgICBhcmcgPSBuZXcgVWludDMyQXJyYXkoIGFyZyApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHNldCBkYXRhIHR5cGUgYmFzZWQgb24gYXJyYXlcclxuICAgICAgICBpZiAoIGFyZyBpbnN0YW5jZW9mIFVpbnQxNkFycmF5ICkge1xyXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSAnVU5TSUdORURfU0hPUlQnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIGFyZyBpbnN0YW5jZW9mIFVpbnQzMkFycmF5ICkge1xyXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSAnVU5TSUdORURfSU5UJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnSW5kZXhCdWZmZXIgcmVxdWlyZXMgYW4gQXJyYXkgb3IgJyArXHJcbiAgICAgICAgICAgICAgICAnQXJyYXlCdWZmZXIgYXJndW1lbnQsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gY3JlYXRlIGJ1ZmZlciwgc3RvcmUgY291bnRcclxuICAgICAgICBpZiAoICF0aGlzLmJ1ZmZlciApIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb3VudCA9IGFyZy5sZW5ndGg7XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlciggZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVyICk7XHJcbiAgICAgICAgZ2wuYnVmZmVyRGF0YSggZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIGFyZywgZ2wuU1RBVElDX0RSQVcgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgaW5kZXggYnVmZmVyIG9iamVjdC5cclxuICAgICAqIEBtZW1iZXJvZiBJbmRleEJ1ZmZlclxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtJbmRleEJ1ZmZlcn0gUmV0dXJucyB0aGUgaW5kZXggYnVmZmVyIG9iamVjdCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIEluZGV4QnVmZmVyLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gaWYgdGhpcyBidWZmZXIgaXMgYWxyZWFkeSBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kQnVmZmVyID09PSB0aGlzICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlciggZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVyICk7XHJcbiAgICAgICAgX2JvdW5kQnVmZmVyID0gdGhpcztcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmJpbmRzIHRoZSBpbmRleCBidWZmZXIgb2JqZWN0LlxyXG4gICAgICogQG1lbWJlcm9mIEluZGV4QnVmZmVyXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0luZGV4QnVmZmVyfSBSZXR1cm5zIHRoZSBpbmRleCBidWZmZXIgb2JqZWN0IGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgSW5kZXhCdWZmZXIucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIGJ1ZmZlciBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kQnVmZmVyID09PSBudWxsICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlciggZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwgKTtcclxuICAgICAgICBfYm91bmRCdWZmZXIgPSBudWxsO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGUgdGhlIGRyYXcgY29tbWFuZCBmb3IgdGhlIGJvdW5kIGJ1ZmZlci5cclxuICAgICAqIEBtZW1iZXJvZiBJbmRleEJ1ZmZlclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gVGhlIG9wdGlvbnMgdG8gcGFzcyB0byAnZHJhd0VsZW1lbnRzJy4gT3B0aW9uYWwuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0luZGV4QnVmZmVyfSBSZXR1cm5zIHRoZSBpbmRleCBidWZmZXIgb2JqZWN0IGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgSW5kZXhCdWZmZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICBpZiAoIF9ib3VuZEJ1ZmZlciA9PT0gbnVsbCApIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnTm8gSW5kZXhCdWZmZXIgaXMgYm91bmQsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICB2YXIgbW9kZSA9IGdsWyBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8ICdUUklBTkdMRVMnIF07XHJcbiAgICAgICAgdmFyIG9mZnNldCA9ICggb3B0aW9ucy5vZmZzZXQgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5vZmZzZXQgOiB0aGlzLm9mZnNldDtcclxuICAgICAgICB2YXIgY291bnQgPSAoIG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5jb3VudCA6IHRoaXMuY291bnQ7XHJcbiAgICAgICAgZ2wuZHJhd0VsZW1lbnRzKFxyXG4gICAgICAgICAgICBtb2RlLFxyXG4gICAgICAgICAgICBjb3VudCxcclxuICAgICAgICAgICAgZ2xbIHRoaXMudHlwZSBdLFxyXG4gICAgICAgICAgICBvZmZzZXQgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBJbmRleEJ1ZmZlcjtcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBXZWJHTENvbnRleHQgPSByZXF1aXJlKCcuL1dlYkdMQ29udGV4dCcpLFxyXG4gICAgICAgIFN0YWNrID0gcmVxdWlyZSgnLi4vdXRpbC9TdGFjaycpLFxyXG4gICAgICAgIF9zdGFjayA9IG5ldyBTdGFjaygpLFxyXG4gICAgICAgIF9ib3VuZEJ1ZmZlciA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgcmVuZGVyVGFyZ2V0IG9iamVjdCwgY2FjaGluZyBpdCB0byBwcmV2ZW50IHVubmVjZXNzYXJ5IHJlYmluZHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtSZW5kZXJUYXJnZXR9IHJlbmRlclRhcmdldCAtIFRoZSBSZW5kZXJUYXJnZXQgb2JqZWN0IHRvIGJpbmQuXHJcbiAgICAgKi9cclxuICAgICBmdW5jdGlvbiBiaW5kKCByZW5kZXJUYXJnZXQgKSB7XHJcbiAgICAgICAgLy8gaWYgdGhpcyBidWZmZXIgaXMgYWxyZWFkeSBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kQnVmZmVyID09PSByZW5kZXJUYXJnZXQgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gcmVuZGVyVGFyZ2V0LmdsO1xyXG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlciggZ2wuRlJBTUVCVUZGRVIsIHJlbmRlclRhcmdldC5mcmFtZWJ1ZmZlciApO1xyXG4gICAgICAgIF9ib3VuZEJ1ZmZlciA9IHJlbmRlclRhcmdldDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFVuYmluZHMgdGhlIHJlbmRlclRhcmdldCBvYmplY3QuIFByZXZlbnRzIHVubmVjZXNzYXJ5IHVuYmluZGluZy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1JlbmRlclRhcmdldH0gcmVuZGVyVGFyZ2V0IC0gVGhlIFJlbmRlclRhcmdldCBvYmplY3QgdG8gdW5iaW5kLlxyXG4gICAgICovXHJcbiAgICAgZnVuY3Rpb24gdW5iaW5kKCByZW5kZXJUYXJnZXQgKSB7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgbm8gYnVmZmVyIGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRCdWZmZXIgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gcmVuZGVyVGFyZ2V0LmdsO1xyXG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlciggZ2wuRlJBTUVCVUZGRVIsIG51bGwgKTtcclxuICAgICAgICBfYm91bmRCdWZmZXIgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zdGFudGlhdGVzIGEgUmVuZGVyVGFyZ2V0IG9iamVjdC5cclxuICAgICAqIEBjbGFzcyBSZW5kZXJUYXJnZXRcclxuICAgICAqIEBjbGFzc2Rlc2MgQSByZW5kZXJUYXJnZXQgY2xhc3MgdG8gYWxsb3cgcmVuZGVyaW5nIHRvIHRleHR1cmVzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBSZW5kZXJUYXJnZXQoKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbCA9IFdlYkdMQ29udGV4dC5nZXQoKTtcclxuICAgICAgICB0aGlzLmZyYW1lYnVmZmVyID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcclxuICAgICAgICB0aGlzLnRleHR1cmVzID0ge307XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgcmVuZGVyVGFyZ2V0IG9iamVjdCBhbmQgcHVzaGVzIGl0IHRvIHRoZSBmcm9udCBvZiB0aGUgc3RhY2suXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVuZGVyVGFyZ2V0XHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlclRhcmdldH0gVGhlIHJlbmRlclRhcmdldCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyVGFyZ2V0LnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX3N0YWNrLnB1c2goIHRoaXMgKTtcclxuICAgICAgICBiaW5kKCB0aGlzICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgcmVuZGVyVGFyZ2V0IG9iamVjdCBhbmQgYmluZHMgdGhlIHJlbmRlclRhcmdldCBiZW5lYXRoIGl0IG9uXHJcbiAgICAgKiB0aGlzIHN0YWNrLiBJZiB0aGVyZSBpcyBubyB1bmRlcmx5aW5nIHJlbmRlclRhcmdldCwgYmluZCB0aGUgYmFja2J1ZmZlci5cclxuICAgICAqIEBtZW1iZXJvZiBSZW5kZXJUYXJnZXRcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyVGFyZ2V0fSBUaGUgcmVuZGVyVGFyZ2V0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBSZW5kZXJUYXJnZXQucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciB0b3A7XHJcbiAgICAgICAgX3N0YWNrLnBvcCgpO1xyXG4gICAgICAgIHRvcCA9IF9zdGFjay50b3AoKTtcclxuICAgICAgICBpZiAoIHRvcCApIHtcclxuICAgICAgICAgICAgYmluZCggdG9wICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdW5iaW5kKCB0aGlzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEF0dGFjaGVzIHRoZSBwcm92aWRlZCB0ZXh0dXJlIHRvIHRoZSBwcm92aWRlZCBhdHRhY2htZW50IGxvY2F0aW9uLlxyXG4gICAgICogQG1lbWJlcm9mIFJlbmRlclRhcmdldFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7VGV4dHVyZTJEfSB0ZXh0dXJlIC0gVGhlIHRleHR1cmUgdG8gYXR0YWNoLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gVGhlIGF0dGFjaG1lbnQgaW5kZXguIChvcHRpb25hbClcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0YXJnZXQgLSBUaGUgdGV4dHVyZSB0YXJnZXQgdHlwZS4gKG9wdGlvbmFsKVxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJUYXJnZXR9IFRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFJlbmRlclRhcmdldC5wcm90b3R5cGUuc2V0Q29sb3JUYXJnZXQgPSBmdW5jdGlvbiggdGV4dHVyZSwgaW5kZXgsIHRhcmdldCApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIGlmICggdHlwZW9mIGluZGV4ID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgdGFyZ2V0ID0gaW5kZXg7XHJcbiAgICAgICAgICAgIGluZGV4ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbmRleCA9ICggaW5kZXggIT09IHVuZGVmaW5lZCApID8gaW5kZXggOiAwO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXNbICdjb2xvcicgKyBpbmRleCBdID0gdGV4dHVyZTtcclxuICAgICAgICB0aGlzLnB1c2goKTtcclxuICAgICAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChcclxuICAgICAgICAgICAgZ2wuRlJBTUVCVUZGRVIsXHJcbiAgICAgICAgICAgIGdsWyAnQ09MT1JfQVRUQUNITUVOVCcgKyBpbmRleCBdLFxyXG4gICAgICAgICAgICBnbFsgdGFyZ2V0IHx8ICdURVhUVVJFXzJEJyBdLFxyXG4gICAgICAgICAgICB0ZXh0dXJlLnRleHR1cmUsXHJcbiAgICAgICAgICAgIDAgKTtcclxuICAgICAgICB0aGlzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEF0dGFjaGVzIHRoZSBwcm92aWRlZCB0ZXh0dXJlIHRvIHRoZSBwcm92aWRlZCBhdHRhY2htZW50IGxvY2F0aW9uLlxyXG4gICAgICogQG1lbWJlcm9mIFJlbmRlclRhcmdldFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7VGV4dHVyZTJEfSB0ZXh0dXJlIC0gVGhlIHRleHR1cmUgdG8gYXR0YWNoLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJUYXJnZXR9IFRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFJlbmRlclRhcmdldC5wcm90b3R5cGUuc2V0RGVwdGhUYXJnZXQgPSBmdW5jdGlvbiggdGV4dHVyZSApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHRoaXMudGV4dHVyZXMuZGVwdGggPSB0ZXh0dXJlO1xyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIGdsLmZyYW1lYnVmZmVyVGV4dHVyZTJEKFxyXG4gICAgICAgICAgICBnbC5GUkFNRUJVRkZFUixcclxuICAgICAgICAgICAgZ2wuREVQVEhfQVRUQUNITUVOVCxcclxuICAgICAgICAgICAgZ2wuVEVYVFVSRV8yRCxcclxuICAgICAgICAgICAgdGV4dHVyZS50ZXh0dXJlLFxyXG4gICAgICAgICAgICAwICk7XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGVhcnMgdGhlIGNvbG9yIGJpdHMgb2YgdGhlIHJlbmRlclRhcmdldC5cclxuICAgICAqIEBtZW1iZXJvZiBSZW5kZXJUYXJnZXRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gciAtIFRoZSByZWQgdmFsdWUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZyAtIFRoZSBncmVlbiB2YWx1ZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBiIC0gVGhlIGJsdWUgdmFsdWUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYSAtIFRoZSBhbHBoYSB2YWx1ZS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyVGFyZ2V0fSBUaGUgcmVuZGVyVGFyZ2V0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBSZW5kZXJUYXJnZXQucHJvdG90eXBlLmNsZWFyQ29sb3IgPSBmdW5jdGlvbiggciwgZywgYiwgYSApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHIgPSAoIHIgIT09IHVuZGVmaW5lZCApID8gciA6IDA7XHJcbiAgICAgICAgZyA9ICggZyAhPT0gdW5kZWZpbmVkICkgPyBnIDogMDtcclxuICAgICAgICBiID0gKCBiICE9PSB1bmRlZmluZWQgKSA/IGIgOiAwO1xyXG4gICAgICAgIGEgPSAoIGEgIT09IHVuZGVmaW5lZCApID8gYSA6IDA7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgZ2wuY2xlYXJDb2xvciggciwgZywgYiwgYSApO1xyXG4gICAgICAgIGdsLmNsZWFyKCBnbC5DT0xPUl9CVUZGRVJfQklUICk7XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGVhcnMgdGhlIGRlcHRoIGJpdHMgb2YgdGhlIHJlbmRlclRhcmdldC5cclxuICAgICAqIEBtZW1iZXJvZiBSZW5kZXJUYXJnZXRcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyVGFyZ2V0fSBUaGUgcmVuZGVyVGFyZ2V0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBSZW5kZXJUYXJnZXQucHJvdG90eXBlLmNsZWFyRGVwdGggPSBmdW5jdGlvbiggciwgZywgYiwgYSApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHIgPSAoIHIgIT09IHVuZGVmaW5lZCApID8gciA6IDA7XHJcbiAgICAgICAgZyA9ICggZyAhPT0gdW5kZWZpbmVkICkgPyBnIDogMDtcclxuICAgICAgICBiID0gKCBiICE9PSB1bmRlZmluZWQgKSA/IGIgOiAwO1xyXG4gICAgICAgIGEgPSAoIGEgIT09IHVuZGVmaW5lZCApID8gYSA6IDA7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgZ2wuY2xlYXJDb2xvciggciwgZywgYiwgYSApO1xyXG4gICAgICAgIGdsLmNsZWFyKCBnbC5ERVBUSF9CVUZGRVJfQklUICk7XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGVhcnMgdGhlIHN0ZW5jaWwgYml0cyBvZiB0aGUgcmVuZGVyVGFyZ2V0LlxyXG4gICAgICogQG1lbWJlcm9mIFJlbmRlclRhcmdldFxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJUYXJnZXR9IFRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFJlbmRlclRhcmdldC5wcm90b3R5cGUuY2xlYXJTdGVuY2lsID0gZnVuY3Rpb24oIHIsIGcsIGIsIGEgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICByID0gKCByICE9PSB1bmRlZmluZWQgKSA/IHIgOiAwO1xyXG4gICAgICAgIGcgPSAoIGcgIT09IHVuZGVmaW5lZCApID8gZyA6IDA7XHJcbiAgICAgICAgYiA9ICggYiAhPT0gdW5kZWZpbmVkICkgPyBiIDogMDtcclxuICAgICAgICBhID0gKCBhICE9PSB1bmRlZmluZWQgKSA/IGEgOiAwO1xyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIGdsLmNsZWFyQ29sb3IoIHIsIGcsIGIsIGEgKTtcclxuICAgICAgICBnbC5jbGVhciggZ2wuU1RFTkNJTF9CVUZGRVJfQklUICk7XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGVhcnMgYWxsIHRoZSBiaXRzIG9mIHRoZSByZW5kZXJUYXJnZXQuXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVuZGVyVGFyZ2V0XHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlclRhcmdldH0gVGhlIHJlbmRlclRhcmdldCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyVGFyZ2V0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCByLCBnLCBiLCBhICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgciA9ICggciAhPT0gdW5kZWZpbmVkICkgPyByIDogMDtcclxuICAgICAgICBnID0gKCBnICE9PSB1bmRlZmluZWQgKSA/IGcgOiAwO1xyXG4gICAgICAgIGIgPSAoIGIgIT09IHVuZGVmaW5lZCApID8gYiA6IDA7XHJcbiAgICAgICAgYSA9ICggYSAhPT0gdW5kZWZpbmVkICkgPyBhIDogMDtcclxuICAgICAgICB0aGlzLnB1c2goKTtcclxuICAgICAgICBnbC5jbGVhckNvbG9yKCByLCBnLCBiLCBhICk7XHJcbiAgICAgICAgZ2wuY2xlYXIoIGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUIHwgZ2wuU1RFTkNJTF9CVUZGRVJfQklUICk7XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNpemVzIHRoZSByZW5kZXJUYXJnZXQgYW5kIGFsbCBhdHRhY2hlZCB0ZXh0dXJlcyBieSB0aGUgcHJvdmlkZWQgaGVpZ2h0XHJcbiAgICAgKiBhbmQgd2lkdGguXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVuZGVyVGFyZ2V0XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gVGhlIG5ldyB3aWR0aCBvZiB0aGUgcmVuZGVyVGFyZ2V0LlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBuZXcgaGVpZ2h0IG9mIHRoZSByZW5kZXJUYXJnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlclRhcmdldH0gVGhlIHJlbmRlclRhcmdldCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyVGFyZ2V0LnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiggd2lkdGgsIGhlaWdodCApIHtcclxuICAgICAgICB2YXIga2V5O1xyXG4gICAgICAgIGlmICggIXdpZHRoIHx8ICFoZWlnaHQgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ1dpZHRoIG9yIGhlaWdodCBhcmd1bWVudHMgbWlzc2luZywgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAoIGtleSBpbiB0aGlzLnRleHR1cmVzICkge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMudGV4dHVyZXMuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0dXJlc1sga2V5IF0ucmVzaXplKCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gUmVuZGVyVGFyZ2V0O1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFZlcnRleFBhY2thZ2UgPSByZXF1aXJlKCcuLi9jb3JlL1ZlcnRleFBhY2thZ2UnKSxcclxuICAgICAgICBWZXJ0ZXhCdWZmZXIgPSByZXF1aXJlKCcuLi9jb3JlL1ZlcnRleEJ1ZmZlcicpLFxyXG4gICAgICAgIEluZGV4QnVmZmVyID0gcmVxdWlyZSgnLi4vY29yZS9JbmRleEJ1ZmZlcicpO1xyXG5cclxuICAgIGZ1bmN0aW9uIFJlbmRlcmFibGUoIHNwZWMsIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgc3BlYyA9IHNwZWMgfHwge307XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgaWYgKCBzcGVjLnZlcnRleEJ1ZmZlciB8fCBzcGVjLnZlcnRleEJ1ZmZlcnMgKSB7XHJcbiAgICAgICAgICAgIC8vIHVzZSBleGlzdGluZyB2ZXJ0ZXggYnVmZmVyXHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4QnVmZmVycyA9IHNwZWMudmVydGV4QnVmZmVycyB8fCBbIHNwZWMudmVydGV4QnVmZmVyIF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gY3JlYXRlIHZlcnRleCBwYWNrYWdlXHJcbiAgICAgICAgICAgIHZhciB2ZXJ0ZXhQYWNrYWdlID0gbmV3IFZlcnRleFBhY2thZ2UoIHNwZWMudmVydGljZXMgKTtcclxuICAgICAgICAgICAgLy8gY3JlYXRlIHZlcnRleCBidWZmZXJcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhCdWZmZXJzID0gWyBuZXcgVmVydGV4QnVmZmVyKCB2ZXJ0ZXhQYWNrYWdlICkgXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBzcGVjLmluZGV4QnVmZmVyICkge1xyXG4gICAgICAgICAgICAvLyB1c2UgZXhpc3RpbmcgaW5kZXggYnVmZmVyXHJcbiAgICAgICAgICAgIHRoaXMuaW5kZXhCdWZmZXIgPSBzcGVjLmluZGV4QnVmZmVyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICggc3BlYy5pbmRpY2VzICkge1xyXG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGluZGV4IGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleEJ1ZmZlciA9IG5ldyBJbmRleEJ1ZmZlciggc3BlYy5pbmRpY2VzICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc3RvcmUgcmVuZGVyaW5nIG9wdGlvbnNcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIG1vZGU6IG9wdGlvbnMubW9kZSxcclxuICAgICAgICAgICAgb2Zmc2V0OiBvcHRpb25zLm9mZnNldCxcclxuICAgICAgICAgICAgY291bnQ6IG9wdGlvbnMuY291bnRcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIFJlbmRlcmFibGUucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiggb3B0aW9ucyApIHtcclxuICAgICAgICB2YXIgb3ZlcnJpZGVzID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICAvLyBvdmVycmlkZSBvcHRpb25zIGlmIHByb3ZpZGVkXHJcbiAgICAgICAgb3ZlcnJpZGVzLm1vZGUgPSBvdmVycmlkZXMubW9kZSB8fCB0aGlzLm9wdGlvbnMubW9kZTtcclxuICAgICAgICBvdmVycmlkZXMub2Zmc2V0ID0gKCBvdmVycmlkZXMub2Zmc2V0ICE9PSB1bmRlZmluZWQgKSA/IG92ZXJyaWRlcy5vZmZzZXQgOiB0aGlzLm9wdGlvbnMub2Zmc2V0O1xyXG4gICAgICAgIG92ZXJyaWRlcy5jb3VudCA9ICggb3ZlcnJpZGVzLmNvdW50ICE9PSB1bmRlZmluZWQgKSA/IG92ZXJyaWRlcy5jb3VudCA6IHRoaXMub3B0aW9ucy5jb3VudDtcclxuICAgICAgICAvLyBkcmF3IHRoZSByZW5kZXJhYmxlXHJcbiAgICAgICAgaWYgKCB0aGlzLmluZGV4QnVmZmVyICkge1xyXG4gICAgICAgICAgICAvLyB1c2UgaW5kZXggYnVmZmVyIHRvIGRyYXcgZWxlbWVudHNcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhCdWZmZXJzLmZvckVhY2goIGZ1bmN0aW9uKCB2ZXJ0ZXhCdWZmZXIgKSB7XHJcbiAgICAgICAgICAgICAgICB2ZXJ0ZXhCdWZmZXIuYmluZCgpO1xyXG4gICAgICAgICAgICAgICAgLy8gbm8gYWR2YW50YWdlIHRvIHVuYmluZGluZyBhcyB0aGVyZSBpcyBubyBzdGFjayB1c2VkXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4QnVmZmVyLmJpbmQoKTtcclxuICAgICAgICAgICAgdGhpcy5pbmRleEJ1ZmZlci5kcmF3KCBvdmVycmlkZXMgKTtcclxuICAgICAgICAgICAgLy8gbm8gYWR2YW50YWdlIHRvIHVuYmluZGluZyBhcyB0aGVyZSBpcyBubyBzdGFjayB1c2VkXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gbm8gaW5kZXggYnVmZmVyLCB1c2UgZHJhdyBhcnJheXNcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhCdWZmZXJzLmZvckVhY2goIGZ1bmN0aW9uKCB2ZXJ0ZXhCdWZmZXIgKSB7XHJcbiAgICAgICAgICAgICAgICB2ZXJ0ZXhCdWZmZXIuYmluZCgpO1xyXG4gICAgICAgICAgICAgICAgdmVydGV4QnVmZmVyLmRyYXcoIG92ZXJyaWRlcyApO1xyXG4gICAgICAgICAgICAgICAgLy8gbm8gYWR2YW50YWdlIHRvIHVuYmluZGluZyBhcyB0aGVyZSBpcyBubyBzdGFjayB1c2VkXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJhYmxlO1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0JyksXHJcbiAgICAgICAgU2hhZGVyUGFyc2VyID0gcmVxdWlyZSgnLi9TaGFkZXJQYXJzZXInKSxcclxuICAgICAgICBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC9VdGlsJyksXHJcbiAgICAgICAgWEhSTG9hZGVyID0gcmVxdWlyZSgnLi4vdXRpbC9YSFJMb2FkZXInKSxcclxuICAgICAgICBTdGFjayA9IHJlcXVpcmUoJy4uL3V0aWwvU3RhY2snKSxcclxuICAgICAgICBVTklGT1JNX0ZVTkNUSU9OUyA9IHtcclxuICAgICAgICAgICAgJ2Jvb2wnOiAndW5pZm9ybTFpJyxcclxuICAgICAgICAgICAgJ2Jvb2xbXSc6ICd1bmlmb3JtMWl2JyxcclxuICAgICAgICAgICAgJ2Zsb2F0JzogJ3VuaWZvcm0xZicsXHJcbiAgICAgICAgICAgICdmbG9hdFtdJzogJ3VuaWZvcm0xZnYnLFxyXG4gICAgICAgICAgICAnaW50JzogJ3VuaWZvcm0xaScsXHJcbiAgICAgICAgICAgICdpbnRbXSc6ICd1bmlmb3JtMWl2JyxcclxuICAgICAgICAgICAgJ3VpbnQnOiAndW5pZm9ybTFpJyxcclxuICAgICAgICAgICAgJ3VpbnRbXSc6ICd1bmlmb3JtMWl2JyxcclxuICAgICAgICAgICAgJ3ZlYzInOiAndW5pZm9ybTJmdicsXHJcbiAgICAgICAgICAgICd2ZWMyW10nOiAndW5pZm9ybTJmdicsXHJcbiAgICAgICAgICAgICdpdmVjMic6ICd1bmlmb3JtMml2JyxcclxuICAgICAgICAgICAgJ2l2ZWMyW10nOiAndW5pZm9ybTJpdicsXHJcbiAgICAgICAgICAgICd2ZWMzJzogJ3VuaWZvcm0zZnYnLFxyXG4gICAgICAgICAgICAndmVjM1tdJzogJ3VuaWZvcm0zZnYnLFxyXG4gICAgICAgICAgICAnaXZlYzMnOiAndW5pZm9ybTNpdicsXHJcbiAgICAgICAgICAgICdpdmVjM1tdJzogJ3VuaWZvcm0zaXYnLFxyXG4gICAgICAgICAgICAndmVjNCc6ICd1bmlmb3JtNGZ2JyxcclxuICAgICAgICAgICAgJ3ZlYzRbXSc6ICd1bmlmb3JtNGZ2JyxcclxuICAgICAgICAgICAgJ2l2ZWM0JzogJ3VuaWZvcm00aXYnLFxyXG4gICAgICAgICAgICAnaXZlYzRbXSc6ICd1bmlmb3JtNGl2JyxcclxuICAgICAgICAgICAgJ21hdDInOiAndW5pZm9ybU1hdHJpeDJmdicsXHJcbiAgICAgICAgICAgICdtYXQyW10nOiAndW5pZm9ybU1hdHJpeDJmdicsXHJcbiAgICAgICAgICAgICdtYXQzJzogJ3VuaWZvcm1NYXRyaXgzZnYnLFxyXG4gICAgICAgICAgICAnbWF0M1tdJzogJ3VuaWZvcm1NYXRyaXgzZnYnLFxyXG4gICAgICAgICAgICAnbWF0NCc6ICd1bmlmb3JtTWF0cml4NGZ2JyxcclxuICAgICAgICAgICAgJ21hdDRbXSc6ICd1bmlmb3JtTWF0cml4NGZ2JyxcclxuICAgICAgICAgICAgJ3NhbXBsZXIyRCc6ICd1bmlmb3JtMWknLFxyXG4gICAgICAgICAgICAnc2FtcGxlckN1YmUnOiAndW5pZm9ybTFpJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX3N0YWNrID0gbmV3IFN0YWNrKCksXHJcbiAgICAgICAgX2JvdW5kU2hhZGVyID0gbnVsbDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdmVuIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVyIHNvdXJjZSwgcmV0dXJucyBhbiBvYmplY3QgY29udGFpbmluZ1xyXG4gICAgICogaW5mb3JtYXRpb24gcGVydGFpbmluZyB0byB0aGUgdW5pZm9ybXMgYW5kIGF0dHJpYnR1ZXMgZGVjbGFyZWQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRTb3VyY2UgLSBUaGUgdmVydGV4IHNoYWRlciBzb3VyY2UuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZnJhZ1NvdXJjZSAtIFRoZSBmcmFnbWVudCBzaGFkZXIgc291cmNlLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBhdHRyaWJ1dGUgYW5kIHVuaWZvcm0gaW5mb3JtYXRpb24uXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldEF0dHJpYnV0ZXNBbmRVbmlmb3Jtc0Zyb21Tb3VyY2UoIHZlcnRTb3VyY2UsIGZyYWdTb3VyY2UgKSB7XHJcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucyA9IFNoYWRlclBhcnNlci5wYXJzZURlY2xhcmF0aW9ucyhcclxuICAgICAgICAgICAgICAgIFsgdmVydFNvdXJjZSwgZnJhZ1NvdXJjZSBdLFxyXG4gICAgICAgICAgICAgICAgWyAndW5pZm9ybScsICdhdHRyaWJ1dGUnIF0pLFxyXG4gICAgICAgICAgICBhdHRyaWJ1dGVzID0ge30sXHJcbiAgICAgICAgICAgIHVuaWZvcm1zID0ge30sXHJcbiAgICAgICAgICAgIGF0dHJDb3VudCA9IDAsXHJcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uLFxyXG4gICAgICAgICAgICBpO1xyXG4gICAgICAgIC8vIGZvciBlYWNoIGRlY2xhcmF0aW9uIGluIHRoZSBzaGFkZXJcclxuICAgICAgICBmb3IgKCBpPTA7IGk8ZGVjbGFyYXRpb25zLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICBkZWNsYXJhdGlvbiA9IGRlY2xhcmF0aW9uc1tpXTtcclxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgaXRzIGFuIGF0dHJpYnV0ZSBvciB1bmlmb3JtXHJcbiAgICAgICAgICAgIGlmICggZGVjbGFyYXRpb24ucXVhbGlmaWVyID09PSAnYXR0cmlidXRlJyApIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIGF0dHJpYnV0ZSwgc3RvcmUgdHlwZSBhbmQgaW5kZXhcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNbIGRlY2xhcmF0aW9uLm5hbWUgXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBkZWNsYXJhdGlvbi50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBhdHRyQ291bnQrK1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICggZGVjbGFyYXRpb24ucXVhbGlmaWVyID09PSAndW5pZm9ybScgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB1bmlmb3JtLCBzdG9yZSB0eXBlIGFuZCBidWZmZXIgZnVuY3Rpb24gbmFtZVxyXG4gICAgICAgICAgICAgICAgdW5pZm9ybXNbIGRlY2xhcmF0aW9uLm5hbWUgXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBkZWNsYXJhdGlvbi50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmM6IFVOSUZPUk1fRlVOQ1RJT05TWyBkZWNsYXJhdGlvbi50eXBlICsgKGRlY2xhcmF0aW9uLmNvdW50ID4gMSA/ICdbXScgOiAnJykgXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxyXG4gICAgICAgICAgICB1bmlmb3JtczogdW5pZm9ybXNcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qXHJcbiAgICAgKiBHaXZlbiBhIHNoYWRlciBzb3VyY2Ugc3RyaW5nIGFuZCBzaGFkZXIgdHlwZSwgY29tcGlsZXMgdGhlIHNoYWRlciBhbmRcclxuICAgICAqIHJldHVybnMgdGhlIHJlc3VsdGluZyBXZWJHTFNoYWRlciBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gVGhlIHdlYmdsIHJlbmRlcmluZyBjb250ZXh0LlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNoYWRlclNvdXJjZSAtIFRoZSBzaGFkZXIgc291cmNlLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgLSBUaGUgc2hhZGVyIHR5cGUuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1dlYkdMU2hhZGVyfSBUaGUgY29tcGlsZWQgc2hhZGVyIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gY29tcGlsZVNoYWRlciggZ2wsIHNoYWRlclNvdXJjZSwgdHlwZSApIHtcclxuICAgICAgICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKCBnbFsgdHlwZSBdICk7XHJcbiAgICAgICAgZ2wuc2hhZGVyU291cmNlKCBzaGFkZXIsIHNoYWRlclNvdXJjZSApO1xyXG4gICAgICAgIGdsLmNvbXBpbGVTaGFkZXIoIHNoYWRlciApO1xyXG4gICAgICAgIGlmICggIWdsLmdldFNoYWRlclBhcmFtZXRlciggc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyApICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQW4gZXJyb3Igb2NjdXJyZWQgY29tcGlsaW5nIHRoZSBzaGFkZXJzOiAnICtcclxuICAgICAgICAgICAgICAgIGdsLmdldFNoYWRlckluZm9Mb2coIHNoYWRlciApICk7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2hhZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmluZHMgdGhlIGF0dHJpYnV0ZSBsb2NhdGlvbnMgZm9yIHRoZSBTaGFkZXIgb2JqZWN0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U2hhZGVyfSBzaGFkZXIgLSBUaGUgU2hhZGVyIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYmluZEF0dHJpYnV0ZUxvY2F0aW9ucyggc2hhZGVyICkge1xyXG4gICAgICAgIHZhciBnbCA9IHNoYWRlci5nbCxcclxuICAgICAgICAgICAgYXR0cmlidXRlcyA9IHNoYWRlci5hdHRyaWJ1dGVzLFxyXG4gICAgICAgICAgICBuYW1lO1xyXG4gICAgICAgIGZvciAoIG5hbWUgaW4gYXR0cmlidXRlcyApIHtcclxuICAgICAgICAgICAgaWYgKCBhdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KCBuYW1lICkgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBiaW5kIHRoZSBhdHRyaWJ1dGUgbG9jYXRpb25cclxuICAgICAgICAgICAgICAgIGdsLmJpbmRBdHRyaWJMb2NhdGlvbihcclxuICAgICAgICAgICAgICAgICAgICBzaGFkZXIucHJvZ3JhbSxcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzWyBuYW1lIF0uaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZSApO1xyXG4gICAgICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCAnQm91bmQgdmVydGV4IGF0dHJpYnV0ZSBcXGAnICsgbmFtZSArXHJcbiAgICAgICAgICAgICAgICAgICAgJ1xcJyB0byBsb2NhdGlvbiAnICsgYXR0cmlidXRlc1sgbmFtZSBdLmluZGV4ICk7XHJcbiAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUXVlcmllcyB0aGUgd2ViZ2wgcmVuZGVyaW5nIGNvbnRleHQgZm9yIHRoZSB1bmlmb3JtIGxvY2F0aW9ucy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1NoYWRlcn0gc2hhZGVyIC0gVGhlIFNoYWRlciBvYmplY3QuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldFVuaWZvcm1Mb2NhdGlvbnMoIHNoYWRlciApIHtcclxuICAgICAgICB2YXIgZ2wgPSBzaGFkZXIuZ2wsXHJcbiAgICAgICAgICAgIHVuaWZvcm1zID0gc2hhZGVyLnVuaWZvcm1zLFxyXG4gICAgICAgICAgICB1bmlmb3JtLFxyXG4gICAgICAgICAgICBuYW1lO1xyXG4gICAgICAgIGZvciAoIG5hbWUgaW4gdW5pZm9ybXMgKSB7XHJcbiAgICAgICAgICAgIGlmICggdW5pZm9ybXMuaGFzT3duUHJvcGVydHkoIG5hbWUgKSApIHtcclxuICAgICAgICAgICAgICAgIHVuaWZvcm0gPSB1bmlmb3Jtc1sgbmFtZSBdO1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSB1bmlmb3JtIGxvY2F0aW9uXHJcbiAgICAgICAgICAgICAgICB1bmlmb3JtLmxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCBzaGFkZXIucHJvZ3JhbSwgbmFtZSApO1xyXG4gICAgICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBuYW1lICsgJywgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKCBzaGFkZXIucHJvZ3JhbSwgbmFtZSApICsgJywnICk7XHJcbiAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRvIGxvYWQgc2hhZGVyIHNvdXJjZSBmcm9tIGEgdXJsLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgLSBUaGUgdXJsIHRvIGxvYWQgdGhlIHJlc291cmNlIGZyb20uXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBUaGUgZnVuY3Rpb24gdG8gbG9hZCB0aGUgc2hhZGVyIHNvdXJjZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbG9hZFNoYWRlclNvdXJjZSggdXJsICkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiggZG9uZSApIHtcclxuICAgICAgICAgICAgWEhSTG9hZGVyLmxvYWQoXHJcbiAgICAgICAgICAgICAgICB1cmwsXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VUeXBlOiAndGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZG9uZSxcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIGVyciApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lKCBudWxsICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB0byBwYXNzIHRocm91Z2ggdGhlIHNoYWRlciBzb3VyY2UuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSAtIFRoZSBzb3VyY2Ugb2YgdGhlIHNoYWRlci5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFRoZSBmdW5jdGlvbiB0byBwYXNzIHRocm91Z2ggdGhlIHNoYWRlciBzb3VyY2UuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhc3NUaHJvdWdoU291cmNlKCBzb3VyY2UgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBkb25lICkge1xyXG4gICAgICAgICAgICBkb25lKCBzb3VyY2UgKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gYXJyYXkgb2YgR0xTTCBzb3VyY2Ugc3RyaW5ncyBhbmQgVVJMcyxcclxuICAgICAqIGFuZCByZXNvbHZlcyB0aGVtIGludG8gYW5kIGFycmF5IG9mIEdMU0wgc291cmNlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiByZXNvbHZlU291cmNlcyggc291cmNlcyApIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGRvbmUgKSB7XHJcbiAgICAgICAgICAgIHZhciBqb2JzID0gW107XHJcbiAgICAgICAgICAgIHNvdXJjZXMgPSBzb3VyY2VzIHx8IFtdO1xyXG4gICAgICAgICAgICBzb3VyY2VzID0gKCAhKCBzb3VyY2VzIGluc3RhbmNlb2YgQXJyYXkgKSApID8gWyBzb3VyY2VzIF0gOiBzb3VyY2VzO1xyXG4gICAgICAgICAgICBzb3VyY2VzLmZvckVhY2goIGZ1bmN0aW9uKCBzb3VyY2UgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIFNoYWRlclBhcnNlci5pc0dMU0woIHNvdXJjZSApICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpvYnMucHVzaCggcGFzc1Rocm91Z2hTb3VyY2UoIHNvdXJjZSApICk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGpvYnMucHVzaCggbG9hZFNoYWRlclNvdXJjZSggc291cmNlICkgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIFV0aWwuYXN5bmMoIGpvYnMsIGZ1bmN0aW9uKCByZXN1bHRzICkge1xyXG4gICAgICAgICAgICAgICAgZG9uZSggcmVzdWx0cyApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmluZHMgdGhlIHNoYWRlciBvYmplY3QsIGNhY2hpbmcgaXQgdG8gcHJldmVudCB1bm5lY2Vzc2FyeSByZWJpbmRzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U2hhZGVyfSBzaGFkZXIgLSBUaGUgU2hhZGVyIG9iamVjdCB0byBiaW5kLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBiaW5kKCBzaGFkZXIgKSB7XHJcbiAgICAgICAgLy8gaWYgdGhpcyBzaGFkZXIgaXMgYWxyZWFkeSBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kU2hhZGVyID09PSBzaGFkZXIgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2hhZGVyLmdsLnVzZVByb2dyYW0oIHNoYWRlci5wcm9ncmFtICk7XHJcbiAgICAgICAgX2JvdW5kU2hhZGVyID0gc2hhZGVyO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgc2hhZGVyIG9iamVjdC4gUHJldmVudHMgdW5uZWNlc3NhcnkgdW5iaW5kaW5nLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U2hhZGVyfSBzaGFkZXIgLSBUaGUgU2hhZGVyIG9iamVjdCB0byB1bmJpbmQuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHVuYmluZCggc2hhZGVyICkge1xyXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG5vIHNoYWRlciBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kU2hhZGVyID09PSBudWxsICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHNoYWRlci5nbC51c2VQcm9ncmFtKCBudWxsICk7XHJcbiAgICAgICAgX2JvdW5kU2hhZGVyID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENsZWFycyB0aGUgc2hhZGVyIGF0dHJpYnV0ZXMgZHVlIHRvIGFib3J0aW5nIG9mIGluaXRpYWxpemF0aW9uLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U2hhZGVyfSBzaGFkZXIgLSBUaGUgU2hhZGVyIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYWJvcnRTaGFkZXIoIHNoYWRlciApIHtcclxuICAgICAgICBzaGFkZXIucHJvZ3JhbSA9IG51bGw7XHJcbiAgICAgICAgc2hhZGVyLmF0dHJpYnV0ZXMgPSBudWxsO1xyXG4gICAgICAgIHNoYWRlci51bmlmb3JtcyA9IG51bGw7XHJcbiAgICAgICAgcmV0dXJuIHNoYWRlcjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEluc3RhbnRpYXRlcyBhIFNoYWRlciBvYmplY3QuXHJcbiAgICAgKiBAY2xhc3MgU2hhZGVyXHJcbiAgICAgKiBAY2xhc3NkZXNjIEEgc2hhZGVyIGNsYXNzIHRvIGFzc2lzdCBpbiBjb21waWxpbmcgYW5kIGxpbmtpbmcgd2ViZ2xcclxuICAgICAqIHNoYWRlcnMsIHN0b3JpbmcgYXR0cmlidXRlIGFuZCB1bmlmb3JtIGxvY2F0aW9ucywgYW5kIGJ1ZmZlcmluZyB1bmlmb3Jtcy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gU2hhZGVyKCBzcGVjLCBjYWxsYmFjayApIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgc3BlYyA9IHNwZWMgfHwge307XHJcbiAgICAgICAgdGhpcy5wcm9ncmFtID0gMDtcclxuICAgICAgICB0aGlzLmdsID0gV2ViR0xDb250ZXh0LmdldCgpO1xyXG4gICAgICAgIHRoaXMudmVyc2lvbiA9IHNwZWMudmVyc2lvbiB8fCAnMS4wMCc7XHJcbiAgICAgICAgLy8gY2hlY2sgc291cmNlIGFyZ3VtZW50c1xyXG4gICAgICAgIGlmICggIXNwZWMudmVydCApIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ1ZlcnRleCBzaGFkZXIgYXJndW1lbnQgaGFzIG5vdCBiZWVuIHByb3ZpZGVkLCAnICtcclxuICAgICAgICAgICAgICAgICdzaGFkZXIgaW5pdGlhbGl6YXRpb24gYWJvcnRlZC4nICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIXNwZWMuZnJhZyApIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ0ZyYWdtZW50IHNoYWRlciBhcmd1bWVudCBoYXMgbm90IGJlZW4gcHJvdmlkZWQsICcgK1xyXG4gICAgICAgICAgICAgICAgJ3NoYWRlciBpbml0aWFsaXphdGlvbiBhYm9ydGVkLicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gY3JlYXRlIHRoZSBzaGFkZXJcclxuICAgICAgICBVdGlsLmFzeW5jKHtcclxuICAgICAgICAgICAgY29tbW9uOiByZXNvbHZlU291cmNlcyggc3BlYy5jb21tb24gKSxcclxuICAgICAgICAgICAgdmVydDogcmVzb2x2ZVNvdXJjZXMoIHNwZWMudmVydCApLFxyXG4gICAgICAgICAgICBmcmFnOiByZXNvbHZlU291cmNlcyggc3BlYy5mcmFnICksXHJcbiAgICAgICAgfSwgZnVuY3Rpb24oIHNoYWRlcnMgKSB7XHJcbiAgICAgICAgICAgIHRoYXQuY3JlYXRlKCBzaGFkZXJzICk7XHJcbiAgICAgICAgICAgIGlmICggY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayggdGhhdCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIHRoZSBzaGFkZXIgb2JqZWN0IGZyb20gc291cmNlIHN0cmluZ3MuIFRoaXMgaW5jbHVkZXM6XHJcbiAgICAgKiAgICAxKSBDb21waWxpbmcgYW5kIGxpbmtpbmcgdGhlIHNoYWRlciBwcm9ncmFtLlxyXG4gICAgICogICAgMikgUGFyc2luZyBzaGFkZXIgc291cmNlIGZvciBhdHRyaWJ1dGUgYW5kIHVuaWZvcm0gaW5mb3JtYXRpb24uXHJcbiAgICAgKiAgICAzKSBCaW5kaW5nIGF0dHJpYnV0ZSBsb2NhdGlvbnMsIGJ5IG9yZGVyIG9mIGRlbGNhcmF0aW9uLlxyXG4gICAgICogICAgNCkgUXVlcnlpbmcgYW5kIHN0b3JpbmcgdW5pZm9ybSBsb2NhdGlvbi5cclxuICAgICAqIEBtZW1iZXJvZiBTaGFkZXJcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc2hhZGVycyAtIEEgbWFwIGNvbnRhaW5pbmcgc291cmNlcyB1bmRlciAndmVydCcgYW5kXHJcbiAgICAgKiAgICAgJ2ZyYWcnIGF0dHJpYnV0ZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1NoYWRlcn0gVGhlIHNoYWRlciBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgU2hhZGVyLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiggc2hhZGVycyApIHtcclxuICAgICAgICAvLyBvbmNlIGFsbCBzaGFkZXIgc291cmNlcyBhcmUgbG9hZGVkXHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbCxcclxuICAgICAgICAgICAgY29tbW9uID0gc2hhZGVycy5jb21tb24uam9pbiggJycgKSxcclxuICAgICAgICAgICAgdmVydCA9IHNoYWRlcnMudmVydC5qb2luKCAnJyApLFxyXG4gICAgICAgICAgICBmcmFnID0gc2hhZGVycy5mcmFnLmpvaW4oICcnICksXHJcbiAgICAgICAgICAgIHZlcnRleFNoYWRlcixcclxuICAgICAgICAgICAgZnJhZ21lbnRTaGFkZXIsXHJcbiAgICAgICAgICAgIGF0dHJpYnV0ZXNBbmRVbmlmb3JtcztcclxuICAgICAgICAvLyBjb21waWxlIHNoYWRlcnNcclxuICAgICAgICB2ZXJ0ZXhTaGFkZXIgPSBjb21waWxlU2hhZGVyKCBnbCwgY29tbW9uICsgdmVydCwgJ1ZFUlRFWF9TSEFERVInICk7XHJcbiAgICAgICAgZnJhZ21lbnRTaGFkZXIgPSBjb21waWxlU2hhZGVyKCBnbCwgY29tbW9uICsgZnJhZywgJ0ZSQUdNRU5UX1NIQURFUicgKTtcclxuICAgICAgICBpZiAoICF2ZXJ0ZXhTaGFkZXIgfHwgIWZyYWdtZW50U2hhZGVyICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQWJvcnRpbmcgaW5zdGFudGlhdGlvbiBvZiBzaGFkZXIgZHVlIHRvIGNvbXBpbGF0aW9uIGVycm9ycy4nICk7XHJcbiAgICAgICAgICAgIHJldHVybiBhYm9ydFNoYWRlciggdGhpcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBwYXJzZSBzb3VyY2UgZm9yIGF0dHJpYnV0ZSBhbmQgdW5pZm9ybXNcclxuICAgICAgICBhdHRyaWJ1dGVzQW5kVW5pZm9ybXMgPSBnZXRBdHRyaWJ1dGVzQW5kVW5pZm9ybXNGcm9tU291cmNlKCB2ZXJ0LCBmcmFnICk7XHJcbiAgICAgICAgLy8gc2V0IG1lbWJlciBhdHRyaWJ1dGVzXHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlc0FuZFVuaWZvcm1zLmF0dHJpYnV0ZXM7XHJcbiAgICAgICAgdGhpcy51bmlmb3JtcyA9IGF0dHJpYnV0ZXNBbmRVbmlmb3Jtcy51bmlmb3JtcztcclxuICAgICAgICAvLyBjcmVhdGUgdGhlIHNoYWRlciBwcm9ncmFtXHJcbiAgICAgICAgdGhpcy5wcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xyXG4gICAgICAgIC8vIGF0dGFjaCB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlcnNcclxuICAgICAgICBnbC5hdHRhY2hTaGFkZXIoIHRoaXMucHJvZ3JhbSwgdmVydGV4U2hhZGVyICk7XHJcbiAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKCB0aGlzLnByb2dyYW0sIGZyYWdtZW50U2hhZGVyICk7XHJcbiAgICAgICAgLy8gYmluZCB2ZXJ0ZXggYXR0cmlidXRlIGxvY2F0aW9ucyBCRUZPUkUgbGlua2luZ1xyXG4gICAgICAgIGJpbmRBdHRyaWJ1dGVMb2NhdGlvbnMoIHRoaXMgKTtcclxuICAgICAgICAvLyBsaW5rIHNoYWRlclxyXG4gICAgICAgIGdsLmxpbmtQcm9ncmFtKCB0aGlzLnByb2dyYW0gKTtcclxuICAgICAgICAvLyBJZiBjcmVhdGluZyB0aGUgc2hhZGVyIHByb2dyYW0gZmFpbGVkLCBhbGVydFxyXG4gICAgICAgIGlmICggIWdsLmdldFByb2dyYW1QYXJhbWV0ZXIoIHRoaXMucHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMgKSApIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ0FuIGVycm9yIG9jY3VyZWQgbGlua2luZyB0aGUgc2hhZGVyOiAnICtcclxuICAgICAgICAgICAgICAgIGdsLmdldFByb2dyYW1JbmZvTG9nKCB0aGlzLnByb2dyYW0gKSApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnQWJvcnRpbmcgaW5zdGFudGlhdGlvbiBvZiBzaGFkZXIgZHVlIHRvIGxpbmtpbmcgZXJyb3JzLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuIGFib3J0U2hhZGVyKCB0aGlzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGdldCBzaGFkZXIgdW5pZm9ybSBsb2NhdGlvbnNcclxuICAgICAgICBnZXRVbmlmb3JtTG9jYXRpb25zKCB0aGlzICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmluZHMgdGhlIHNoYWRlciBvYmplY3QgYW5kIHB1c2hlcyBpdCB0byB0aGUgZnJvbnQgb2YgdGhlIHN0YWNrLlxyXG4gICAgICogQG1lbWJlcm9mIFNoYWRlclxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtTaGFkZXJ9IFRoZSBzaGFkZXIgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFNoYWRlci5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIF9zdGFjay5wdXNoKCB0aGlzICk7XHJcbiAgICAgICAgYmluZCggdGhpcyApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVuYmluZHMgdGhlIHNoYWRlciBvYmplY3QgYW5kIGJpbmRzIHRoZSBzaGFkZXIgYmVuZWF0aCBpdCBvblxyXG4gICAgICogdGhpcyBzdGFjay4gSWYgdGhlcmUgaXMgbm8gdW5kZXJseWluZyBzaGFkZXIsIGJpbmQgdGhlIGJhY2tidWZmZXIuXHJcbiAgICAgKiBAbWVtYmVyb2YgU2hhZGVyXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1NoYWRlcn0gVGhlIHNoYWRlciBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgU2hhZGVyLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgdG9wO1xyXG4gICAgICAgIF9zdGFjay5wb3AoKTtcclxuICAgICAgICB0b3AgPSBfc3RhY2sudG9wKCk7XHJcbiAgICAgICAgaWYgKCB0b3AgKSB7XHJcbiAgICAgICAgICAgIGJpbmQoIHRvcCApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVuYmluZCggdGhpcyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCdWZmZXIgYSB1bmlmb3JtIHZhbHVlIGJ5IG5hbWUuXHJcbiAgICAgKiBAbWVtYmVyb2YgU2hhZGVyXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHVuaWZvcm1OYW1lIC0gVGhlIHVuaWZvcm0gbmFtZSBpbiB0aGUgc2hhZGVyIHNvdXJjZS5cclxuICAgICAqIEBwYXJhbSB7Kn0gdW5pZm9ybSAtIFRoZSB1bmlmb3JtIHZhbHVlIHRvIGJ1ZmZlci5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7U2hhZGVyfSBUaGUgc2hhZGVyIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBTaGFkZXIucHJvdG90eXBlLnNldFVuaWZvcm0gPSBmdW5jdGlvbiggdW5pZm9ybU5hbWUsIHVuaWZvcm0gKSB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5wcm9ncmFtICkge1xyXG4gICAgICAgICAgICBpZiAoICF0aGlzLmhhc0xvZ2dlZEVycm9yICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCAnQXR0ZW1wdGluZyB0byB1c2UgYW4gaW5jb21wbGV0ZSBzaGFkZXIsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhhc0xvZ2dlZEVycm9yID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggdGhpcyAhPT0gX2JvdW5kU2hhZGVyICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdBdHRlbXB0aW5nIHRvIHNldCB1bmlmb3JtIGAnICsgdW5pZm9ybU5hbWUgK1xyXG4gICAgICAgICAgICAgICAgJ2AgZm9yIGFuIHVuYm91bmQgc2hhZGVyLCBjb21tYW5kIGlnbm9yZWQuJyApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB1bmlmb3JtU3BlYyA9IHRoaXMudW5pZm9ybXNbIHVuaWZvcm1OYW1lIF0sXHJcbiAgICAgICAgICAgIGZ1bmMsXHJcbiAgICAgICAgICAgIHR5cGUsXHJcbiAgICAgICAgICAgIGxvY2F0aW9uLFxyXG4gICAgICAgICAgICB2YWx1ZTtcclxuICAgICAgICAvLyBlbnN1cmUgdGhhdCB0aGUgdW5pZm9ybSBzcGVjIGV4aXN0cyBmb3IgdGhlIG5hbWVcclxuICAgICAgICBpZiAoICF1bmlmb3JtU3BlYyApIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCAnTm8gdW5pZm9ybSBmb3VuZCB1bmRlciBuYW1lIGAnICsgdW5pZm9ybU5hbWUgK1xyXG4gICAgICAgICAgICAgICAgJ2AsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZW5zdXJlIHRoYXQgdGhlIHVuaWZvcm0gYXJndW1lbnQgaXMgZGVmaW5lZFxyXG4gICAgICAgIGlmICggdW5pZm9ybSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdBcmd1bWVudCBwYXNzZWQgZm9yIHVuaWZvcm0gYCcgKyB1bmlmb3JtTmFtZSArXHJcbiAgICAgICAgICAgICAgICAnYCBpcyB1bmRlZmluZWQsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZ2V0IHRoZSB1bmlmb3JtIGxvY2F0aW9uLCB0eXBlLCBhbmQgYnVmZmVyIGZ1bmN0aW9uXHJcbiAgICAgICAgZnVuYyA9IHVuaWZvcm1TcGVjLmZ1bmM7XHJcbiAgICAgICAgdHlwZSA9IHVuaWZvcm1TcGVjLnR5cGU7XHJcbiAgICAgICAgbG9jYXRpb24gPSB1bmlmb3JtU3BlYy5sb2NhdGlvbjtcclxuICAgICAgICB2YWx1ZSA9IHVuaWZvcm0udG9BcnJheSA/IHVuaWZvcm0udG9BcnJheSgpIDogdW5pZm9ybTtcclxuICAgICAgICB2YWx1ZSA9ICggdmFsdWUgaW5zdGFuY2VvZiBBcnJheSApID8gbmV3IEZsb2F0MzJBcnJheSggdmFsdWUgKSA6IHZhbHVlO1xyXG4gICAgICAgIC8vIGNvbnZlcnQgYm9vbGVhbidzIHRvIDAgb3IgMVxyXG4gICAgICAgIHZhbHVlID0gKCB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyApID8gKCB2YWx1ZSA/IDEgOiAwICkgOiB2YWx1ZTtcclxuICAgICAgICAvLyBwYXNzIHRoZSBhcmd1bWVudHMgZGVwZW5kaW5nIG9uIHRoZSB0eXBlXHJcbiAgICAgICAgc3dpdGNoICggdHlwZSApIHtcclxuICAgICAgICAgICAgY2FzZSAnbWF0Mic6XHJcbiAgICAgICAgICAgIGNhc2UgJ21hdDMnOlxyXG4gICAgICAgICAgICBjYXNlICdtYXQ0JzpcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2xbIGZ1bmMgXSggbG9jYXRpb24sIGZhbHNlLCB2YWx1ZSApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdsWyBmdW5jIF0oIGxvY2F0aW9uLCB2YWx1ZSApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFNoYWRlcjtcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBQUkVDSVNJT05fUVVBTElGSUVSUyA9IHtcclxuICAgICAgICBoaWdocDogdHJ1ZSxcclxuICAgICAgICBtZWRpdW1wOiB0cnVlLFxyXG4gICAgICAgIGxvd3A6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgdmFyIFBSRUNJU0lPTl9UWVBFUyA9IHtcclxuICAgICAgICBmbG9hdDogJ2Zsb2F0JyxcclxuICAgICAgICB2ZWMyOiAnZmxvYXQnLFxyXG4gICAgICAgIHZlYzM6ICdmbG9hdCcsXHJcbiAgICAgICAgdmVjNDogJ2Zsb2F0JyxcclxuICAgICAgICBpdmVjMjogJ2ludCcsXHJcbiAgICAgICAgaXZlYzM6ICdpbnQnLFxyXG4gICAgICAgIGl2ZWM0OiAnaW50JyxcclxuICAgICAgICBpbnQ6ICdpbnQnLFxyXG4gICAgICAgIHVpbnQ6ICdpbnQnLFxyXG4gICAgICAgIHNhbXBsZXIyRDogJ3NhbXBsZXIyRCcsXHJcbiAgICAgICAgc2FtcGxlckN1YmU6ICdzYW1wbGVyQ3ViZScsXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBDT01NRU5UU19SRUdFWFAgPSAvKFxcL1xcKihbXFxzXFxTXSo/KVxcKlxcLyl8KFxcL1xcLyguKikkKS9nbTtcclxuICAgIHZhciBFTkRMSU5FX1JFR0VYUCA9IC8oXFxyXFxufFxcbnxcXHIpL2dtO1xyXG4gICAgdmFyIFdISVRFU1BBQ0VfUkVHRVhQID0gL1xcc3syLH0vZztcclxuICAgIHZhciBCUkFDS0VUX1dISVRFU1BBQ0VfUkVHRVhQID0gLyhcXHMqKShcXFspKFxccyopKFxcZCspKFxccyopKFxcXSkoXFxzKikvZztcclxuICAgIHZhciBOQU1FX0NPVU5UX1JFR0VYUCA9IC8oW2EtekEtWl9dW2EtekEtWjAtOV9dKikoPzpcXFsoXFxkKylcXF0pPy87XHJcbiAgICB2YXIgUFJFQ0lTSU9OX1JFR0VYID0gL1xcYihwcmVjaXNpb24pXFxzKyhcXHcrKVxccysoXFx3KykvO1xyXG4gICAgdmFyIEdMU0xfUkVHRVhQID0gIC92b2lkXFxzK21haW5cXHMqXFwoXFxzKlxcKVxccyovbWk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZW1vdmVzIHN0YW5kYXJkIGNvbW1lbnRzIGZyb20gdGhlIHByb3ZpZGVkIHN0cmluZy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIC0gVGhlIHN0cmluZyB0byBzdHJpcCBjb21tZW50cyBmcm9tLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGNvbW1lbnRsZXNzIHN0cmluZy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc3RyaXBDb21tZW50cyggc3RyICkge1xyXG4gICAgICAgIC8vIHJlZ2V4IHNvdXJjZTogaHR0cHM6Ly9naXRodWIuY29tL21vYWdyaXVzL3N0cmlwY29tbWVudHNcclxuICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2UoIENPTU1FTlRTX1JFR0VYUCwgJycgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnZlcnRzIGFsbCB3aGl0ZXNwYWNlIGludG8gYSBzaW5nbGUgJyAnIHNwYWNlIGNoYXJhY3Rlci5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIC0gVGhlIHN0cmluZyB0byBub3JtYWxpemUgd2hpdGVzcGFjZSBmcm9tLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge1N0cmluZ30gVGhlIG5vcm1hbGl6ZWQgc3RyaW5nLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBub3JtYWxpemVXaGl0ZXNwYWNlKCBzdHIgKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKCBFTkRMSU5FX1JFR0VYUCwgJyAnICkgLy8gcmVtb3ZlIGxpbmUgZW5kaW5nc1xyXG4gICAgICAgICAgICAucmVwbGFjZSggV0hJVEVTUEFDRV9SRUdFWFAsICcgJyApIC8vIG5vcm1hbGl6ZSB3aGl0ZXNwYWNlIHRvIHNpbmdsZSAnICdcclxuICAgICAgICAgICAgLnJlcGxhY2UoIEJSQUNLRVRfV0hJVEVTUEFDRV9SRUdFWFAsICckMiQ0JDYnICk7IC8vIHJlbW92ZSB3aGl0ZXNwYWNlIGluIGJyYWNrZXRzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZXMgdGhlIG5hbWUgYW5kIGNvdW50IG91dCBvZiBhIG5hbWUgc3RhdGVtZW50LCByZXR1cm5pbmcgdGhlXHJcbiAgICAgKiBkZWNsYXJhdGlvbiBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHF1YWxpZmllciAtIFRoZSBxdWFsaWZpZXIgc3RyaW5nLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByZWNpc2lvbiAtIFRoZSBwcmVjaXNpb24gc3RyaW5nLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgLSBUaGUgdHlwZSBzdHJpbmcuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZW50cnkgLSBUaGUgdmFyaWFibGUgZGVjbGFyYXRpb24gc3RyaW5nLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZU5hbWVBbmRDb3VudCggcXVhbGlmaWVyLCBwcmVjaXNpb24sIHR5cGUsIGVudHJ5ICkge1xyXG4gICAgICAgIC8vIGRldGVybWluZSBuYW1lIGFuZCBzaXplIG9mIHZhcmlhYmxlXHJcbiAgICAgICAgdmFyIG1hdGNoZXMgPSBlbnRyeS5tYXRjaCggTkFNRV9DT1VOVF9SRUdFWFAgKTtcclxuICAgICAgICB2YXIgbmFtZSA9IG1hdGNoZXNbMV07XHJcbiAgICAgICAgdmFyIGNvdW50ID0gKCBtYXRjaGVzWzJdID09PSB1bmRlZmluZWQgKSA/IDEgOiBwYXJzZUludCggbWF0Y2hlc1syXSwgMTAgKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBxdWFsaWZpZXI6IHF1YWxpZmllcixcclxuICAgICAgICAgICAgcHJlY2lzaW9uOiBwcmVjaXNpb24sXHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgIGNvdW50OiBjb3VudFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZXMgYSBzaW5nbGUgJ3N0YXRlbWVudCcuIEEgJ3N0YXRlbWVudCcgaXMgY29uc2lkZXJlZCBhbnkgc2VxdWVuY2Ugb2ZcclxuICAgICAqIGNoYXJhY3RlcnMgZm9sbG93ZWQgYnkgYSBzZW1pLWNvbG9uLiBUaGVyZWZvcmUsIGEgc2luZ2xlICdzdGF0ZW1lbnQnIGluXHJcbiAgICAgKiB0aGlzIHNlbnNlIGNvdWxkIGNvbnRhaW4gc2V2ZXJhbCBjb21tYSBzZXBhcmF0ZWQgZGVjbGFyYXRpb25zLiBSZXR1cm5zXHJcbiAgICAgKiBhbGwgcmVzdWx0aW5nIGRlY2xhcmF0aW9ucy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RhdGVtZW50IC0gVGhlIHN0YXRlbWVudCB0byBwYXJzZS5cclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcmVjaXNpb25zIC0gVGhlIGN1cnJlbnQgc3RhdGUgb2YgZ2xvYmFsIHByZWNpc2lvbnMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0FycmF5fSBUaGUgYXJyYXkgb2YgcGFyc2VkIGRlY2xhcmF0aW9uIG9iamVjdHMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlU3RhdGVtZW50KCBzdGF0ZW1lbnQsIHByZWNpc2lvbnMgKSB7XHJcbiAgICAgICAgLy8gc3BsaXQgc3RhdGVtZW50IG9uIGNvbW1hc1xyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gWyAndW5pZm9ybSBoaWdocCBtYXQ0IEFbMTBdJywgJ0InLCAnQ1syXScgXVxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgdmFyIGNvbW1hU3BsaXQgPSBzdGF0ZW1lbnQuc3BsaXQoJywnKS5tYXAoIGZ1bmN0aW9uKCBlbGVtICkge1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlbS50cmltKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIHNwbGl0IGRlY2xhcmF0aW9uIGhlYWRlciBmcm9tIHN0YXRlbWVudFxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gWyAndW5pZm9ybScsICdoaWdocCcsICdtYXQ0JywgJ0FbMTBdJyBdXHJcbiAgICAgICAgLy9cclxuICAgICAgICB2YXIgaGVhZGVyID0gY29tbWFTcGxpdC5zaGlmdCgpLnNwbGl0KCcgJyk7XHJcblxyXG4gICAgICAgIC8vIHF1YWxpZmllciBpcyBhbHdheXMgZmlyc3QgZWxlbWVudFxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gJ3VuaWZvcm0nXHJcbiAgICAgICAgLy9cclxuICAgICAgICB2YXIgcXVhbGlmaWVyID0gaGVhZGVyLnNoaWZ0KCk7XHJcblxyXG4gICAgICAgIC8vIHByZWNpc2lvbiBtYXkgb3IgbWF5IG5vdCBiZSBkZWNsYXJlZFxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gJ2hpZ2hwJyB8fCAoaWYgaXQgd2FzIG9taXRlZCkgJ21hdDQnXHJcbiAgICAgICAgLy9cclxuICAgICAgICB2YXIgcHJlY2lzaW9uID0gaGVhZGVyLnNoaWZ0KCk7XHJcbiAgICAgICAgdmFyIHR5cGU7XHJcbiAgICAgICAgLy8gaWYgbm90IGEgcHJlY2lzaW9uIGtleXdvcmQgaXQgaXMgdGhlIHR5cGUgaW5zdGVhZFxyXG4gICAgICAgIGlmICggIVBSRUNJU0lPTl9RVUFMSUZJRVJTWyBwcmVjaXNpb24gXSApIHtcclxuICAgICAgICAgICAgdHlwZSA9IHByZWNpc2lvbjtcclxuICAgICAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uc1sgUFJFQ0lTSU9OX1RZUEVTWyB0eXBlIF0gXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0eXBlID0gaGVhZGVyLnNoaWZ0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBsYXN0IHBhcnQgb2YgaGVhZGVyIHdpbGwgYmUgdGhlIGZpcnN0LCBhbmQgcG9zc2libGUgb25seSB2YXJpYWJsZSBuYW1lXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBbICdBWzEwXScsICdCJywgJ0NbMl0nIF1cclxuICAgICAgICAvL1xyXG4gICAgICAgIHZhciBuYW1lcyA9IGhlYWRlci5jb25jYXQoIGNvbW1hU3BsaXQgKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBhcmUgb3RoZXIgbmFtZXMgYWZ0ZXIgYSAnLCcgYWRkIHRoZW0gYXMgd2VsbFxyXG4gICAgICAgIHZhciByZXN1bHRzID0gW107XHJcbiAgICAgICAgbmFtZXMuZm9yRWFjaCggZnVuY3Rpb24oIG5hbWUgKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCggcGFyc2VOYW1lQW5kQ291bnQoIHF1YWxpZmllciwgcHJlY2lzaW9uLCB0eXBlLCBuYW1lICkgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNwbGl0cyB0aGUgc291cmNlIHN0cmluZyBieSBzZW1pLWNvbG9ucyBhbmQgY29uc3RydWN0cyBhbiBhcnJheSBvZlxyXG4gICAgICogZGVjbGFyYXRpb24gb2JqZWN0cyBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgcXVhbGlmaWVyIGtleXdvcmRzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzb3VyY2UgLSBUaGUgc2hhZGVyIHNvdXJjZSBzdHJpbmcuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0ga2V5d29yZHMgLSBUaGUgcXVhbGlmaWVyIGRlY2xhcmF0aW9uIGtleXdvcmRzLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGFycmF5IG9mIHF1YWxpZmllciBkZWNsYXJhdGlvbiBvYmplY3RzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZVNvdXJjZSggc291cmNlLCBrZXl3b3JkcyApIHtcclxuICAgICAgICAvLyByZW1vdmUgYWxsIGNvbW1lbnRzIGZyb20gc291cmNlXHJcbiAgICAgICAgdmFyIGNvbW1lbnRsZXNzU291cmNlID0gc3RyaXBDb21tZW50cyggc291cmNlICk7XHJcbiAgICAgICAgLy8gbm9ybWFsaXplIGFsbCB3aGl0ZXNwYWNlIGluIHRoZSBzb3VyY2VcclxuICAgICAgICB2YXIgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVdoaXRlc3BhY2UoIGNvbW1lbnRsZXNzU291cmNlICk7XHJcbiAgICAgICAgLy8gZ2V0IGluZGl2aWR1YWwgc3RhdGVtZW50cyAoIGFueSBzZXF1ZW5jZSBlbmRpbmcgaW4gOyApXHJcbiAgICAgICAgdmFyIHN0YXRlbWVudHMgPSBub3JtYWxpemVkLnNwbGl0KCc7Jyk7XHJcbiAgICAgICAgLy8gYnVpbGQgcmVnZXggZm9yIHBhcnNpbmcgc3RhdGVtZW50cyB3aXRoIHRhcmdldHRlZCBrZXl3b3Jkc1xyXG4gICAgICAgIHZhciBrZXl3b3JkU3RyID0ga2V5d29yZHMuam9pbignfCcpO1xyXG4gICAgICAgIHZhciBrZXl3b3JkUmVnZXggPSBuZXcgUmVnRXhwKCAnLipcXFxcYignICsga2V5d29yZFN0ciArICcpXFxcXGIuKicgKTtcclxuICAgICAgICAvLyBwYXJzZSBhbmQgc3RvcmUgZ2xvYmFsIHByZWNpc2lvbiBzdGF0ZW1lbnRzIGFuZCBhbnkgZGVjbGFyYXRpb25zXHJcbiAgICAgICAgdmFyIHByZWNpc2lvbnMgPSB7fTtcclxuICAgICAgICB2YXIgbWF0Y2hlZCA9IFtdO1xyXG4gICAgICAgIC8vIGZvciBlYWNoIHN0YXRlbWVudFxyXG4gICAgICAgIHN0YXRlbWVudHMuZm9yRWFjaCggZnVuY3Rpb24oIHN0YXRlbWVudCApIHtcclxuICAgICAgICAgICAgLy8gY2hlY2sgaWYgcHJlY2lzaW9uIHN0YXRlbWVudFxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBbICdwcmVjaXNpb24gaGlnaHAgZmxvYXQnLCAncHJlY2lzaW9uJywgJ2hpZ2hwJywgJ2Zsb2F0JyBdXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIHZhciBwbWF0Y2ggPSBzdGF0ZW1lbnQubWF0Y2goIFBSRUNJU0lPTl9SRUdFWCApO1xyXG4gICAgICAgICAgICBpZiAoIHBtYXRjaCApIHtcclxuICAgICAgICAgICAgICAgIHByZWNpc2lvbnNbIHBtYXRjaFszXSBdID0gcG1hdGNoWzJdO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGZvciBrZXl3b3Jkc1xyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICAvLyBbICd1bmlmb3JtIGZsb2F0IHRpbWUnIF1cclxuICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgdmFyIGttYXRjaCA9IHN0YXRlbWVudC5tYXRjaCgga2V5d29yZFJlZ2V4ICk7XHJcbiAgICAgICAgICAgIGlmICgga21hdGNoICkge1xyXG4gICAgICAgICAgICAgICAgLy8gcGFyc2Ugc3RhdGVtZW50IGFuZCBhZGQgdG8gYXJyYXlcclxuICAgICAgICAgICAgICAgIG1hdGNoZWQgPSBtYXRjaGVkLmNvbmNhdCggcGFyc2VTdGF0ZW1lbnQoIGttYXRjaFswXSwgcHJlY2lzaW9ucyApICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbWF0Y2hlZDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpbHRlcnMgb3V0IGR1cGxpY2F0ZSBkZWNsYXJhdGlvbnMgcHJlc2VudCBiZXR3ZWVuIHNoYWRlcnMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGVjbGFyYXRpb25zIC0gVGhlIGFycmF5IG9mIGRlY2xhcmF0aW9ucy5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBmaWx0ZXJlZCBhcnJheSBvZiBkZWNsYXJhdGlvbnMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZpbHRlckR1cGxpY2F0ZXNCeU5hbWUoIGRlY2xhcmF0aW9ucyApIHtcclxuICAgICAgICAvLyBpbiBjYXNlcyB3aGVyZSB0aGUgc2FtZSBkZWNsYXJhdGlvbnMgYXJlIHByZXNlbnQgaW4gbXVsdGlwbGVcclxuICAgICAgICAvLyBzb3VyY2VzLCB0aGlzIGZ1bmN0aW9uIHdpbGwgcmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSB0aGUgcmVzdWx0c1xyXG4gICAgICAgIHZhciBzZWVuID0ge307XHJcbiAgICAgICAgcmV0dXJuIGRlY2xhcmF0aW9ucy5maWx0ZXIoIGZ1bmN0aW9uKCBkZWNsYXJhdGlvbiApIHtcclxuICAgICAgICAgICAgaWYgKCBzZWVuWyBkZWNsYXJhdGlvbi5uYW1lIF0gKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2VlblsgZGVjbGFyYXRpb24ubmFtZSBdID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBhcnNlcyB0aGUgcHJvdmlkZWQgR0xTTCBzb3VyY2UsIGFuZCByZXR1cm5zIGFsbCBkZWNsYXJhdGlvbiBzdGF0ZW1lbnRzXHJcbiAgICAgICAgICogdGhhdCBjb250YWluIHRoZSBwcm92aWRlZCBxdWFsaWZpZXIgdHlwZS4gVGhpcyBjYW4gYmUgdXNlZCB0byBleHRyYWN0XHJcbiAgICAgICAgICogYWxsIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm0gbmFtZXMgYW5kIHR5cGVzIGZyb20gYSBzaGFkZXIuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBGb3IgZXhhbXBsZSwgd2hlbiBwcm92aWRlZCBhICd1bmlmb3JtJyBxdWFsaWZpZXJzLCB0aGUgZGVjbGFyYXRpb246XHJcbiAgICAgICAgICogPHByZT5cclxuICAgICAgICAgKiAgICAgJ3VuaWZvcm0gaGlnaHAgdmVjMyB1U3BlY3VsYXJDb2xvcjsnXHJcbiAgICAgICAgICogPC9wcmU+XHJcbiAgICAgICAgICogV291bGQgYmUgcGFyc2VkIHRvOlxyXG4gICAgICAgICAqIDxwcmU+XHJcbiAgICAgICAgICogICAgIHtcclxuICAgICAgICAgKiAgICAgICAgIHF1YWxpZmllcjogJ3VuaWZvcm0nLFxyXG4gICAgICAgICAqICAgICAgICAgdHlwZTogJ3ZlYzMnLFxyXG4gICAgICAgICAqICAgICAgICAgbmFtZTogJ3VTcGVjdWxhckNvbG9yJyxcclxuICAgICAgICAgKiAgICAgICAgIGNvdW50OiAxXHJcbiAgICAgICAgICogICAgIH1cclxuICAgICAgICAgKiA8L3ByZT5cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gc291cmNlcyAtIFRoZSBzaGFkZXIgc291cmNlcy5cclxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0gcXVhbGlmaWVycyAtIFRoZSBxdWFsaWZpZXJzIHRvIGV4dHJhY3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBhcnJheSBvZiBxdWFsaWZpZXIgZGVjbGFyYXRpb24gc3RhdGVtZW50cy5cclxuICAgICAgICAgKi9cclxuICAgICAgICBwYXJzZURlY2xhcmF0aW9uczogZnVuY3Rpb24oIHNvdXJjZXMsIHF1YWxpZmllcnMgKSB7XHJcbiAgICAgICAgICAgIC8vIGlmIG5vIHNvdXJjZXMgb3IgcXVhbGlmaWVycyBhcmUgcHJvdmlkZWQsIHJldHVybiBlbXB0eSBhcnJheVxyXG4gICAgICAgICAgICBpZiAoICFxdWFsaWZpZXJzIHx8IHF1YWxpZmllcnMubGVuZ3RoID09PSAwIHx8XHJcbiAgICAgICAgICAgICAgICAhc291cmNlcyB8fCBzb3VyY2VzLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzb3VyY2VzID0gKCBzb3VyY2VzIGluc3RhbmNlb2YgQXJyYXkgKSA/IHNvdXJjZXMgOiBbIHNvdXJjZXMgXTtcclxuICAgICAgICAgICAgcXVhbGlmaWVycyA9ICggcXVhbGlmaWVycyBpbnN0YW5jZW9mIEFycmF5ICkgPyBxdWFsaWZpZXJzIDogWyBxdWFsaWZpZXJzIF07XHJcbiAgICAgICAgICAgIC8vIHBhcnNlIG91dCB0YXJnZXR0ZWQgZGVjbGFyYXRpb25zXHJcbiAgICAgICAgICAgIHZhciBkZWNsYXJhdGlvbnMgPSBbXTtcclxuICAgICAgICAgICAgc291cmNlcy5mb3JFYWNoKCBmdW5jdGlvbiggc291cmNlICkge1xyXG4gICAgICAgICAgICAgICAgZGVjbGFyYXRpb25zID0gZGVjbGFyYXRpb25zLmNvbmNhdCggcGFyc2VTb3VyY2UoIHNvdXJjZSwgcXVhbGlmaWVycyApICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyByZW1vdmUgZHVwbGljYXRlcyBhbmQgcmV0dXJuXHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJEdXBsaWNhdGVzQnlOYW1lKCBkZWNsYXJhdGlvbnMgKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBEZXRlY3RzIGJhc2VkIG9uIHRoZSBleGlzdGVuY2Ugb2YgYSAndm9pZCBtYWluKCkgeycgc3RhdGVtZW50LCBpZlxyXG4gICAgICAgICAqIHRoZSBzdHJpbmcgaXMgZ2xzbCBzb3VyY2UgY29kZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgLSBUaGUgaW5wdXQgc3RyaW5nIHRvIHRlc3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBUcnVlIGlmIHRoZSBzdHJpbmcgaXMgZ2xzbCBjb2RlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlzR0xTTDogZnVuY3Rpb24oIHN0ciApIHtcclxuICAgICAgICAgICAgcmV0dXJuIEdMU0xfUkVHRVhQLnRlc3QoIHN0ciApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0JyksXHJcbiAgICAgICAgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvVXRpbCcpLFxyXG4gICAgICAgIFN0YWNrID0gcmVxdWlyZSgnLi4vdXRpbC9TdGFjaycpLFxyXG4gICAgICAgIF9zdGFjayA9IHt9LFxyXG4gICAgICAgIF9ib3VuZFRleHR1cmUgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSWYgdGhlIHByb3ZpZGVkIGltYWdlIGRpbWVuc2lvbnMgYXJlIG5vdCBwb3dlcnMgb2YgdHdvLCBpdCB3aWxsIHJlZHJhd1xyXG4gICAgICogdGhlIGltYWdlIHRvIHRoZSBuZXh0IGhpZ2hlc3QgcG93ZXIgb2YgdHdvLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7SFRNTEltYWdlRWxlbWVudH0gaW1hZ2UgLSBUaGUgaW1hZ2Ugb2JqZWN0LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtIVE1MSW1hZ2VFbGVtZW50fSBUaGUgbmV3IGltYWdlIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZW5zdXJlUG93ZXJPZlR3byggaW1hZ2UgKSB7XHJcbiAgICAgICAgaWYgKCAhVXRpbC5pc1Bvd2VyT2ZUd28oIGltYWdlLndpZHRoICkgfHxcclxuICAgICAgICAgICAgIVV0aWwuaXNQb3dlck9mVHdvKCBpbWFnZS5oZWlnaHQgKSApIHtcclxuICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdjYW52YXMnICk7XHJcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IFV0aWwubmV4dEhpZ2hlc3RQb3dlck9mVHdvKCBpbWFnZS53aWR0aCApO1xyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gVXRpbC5uZXh0SGlnaGVzdFBvd2VyT2ZUd28oIGltYWdlLmhlaWdodCApO1xyXG4gICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoXHJcbiAgICAgICAgICAgICAgICBpbWFnZSxcclxuICAgICAgICAgICAgICAgIDAsIDAsXHJcbiAgICAgICAgICAgICAgICBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgMCwgMCxcclxuICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCApO1xyXG4gICAgICAgICAgICByZXR1cm4gY2FudmFzO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaW1hZ2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgdGV4dHVyZSBvYmplY3QgdG8gYSBsb2NhdGlvbiBhbmQgYWN0aXZhdGVzIHRoZSB0ZXh0dXJlIHVuaXRcclxuICAgICAqIHdoaWxlIGNhY2hpbmcgaXQgdG8gcHJldmVudCB1bm5lY2Vzc2FyeSByZWJpbmRzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7VGV4dHVyZTJEfSB0ZXh0dXJlIC0gVGhlIFRleHR1cmUyRCBvYmplY3QgdG8gYmluZC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsb2NhdGlvbiAtIFRoZSB0ZXh0dXJlIHVuaXQgbG9jYXRpb24gaW5kZXguXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGJpbmQoIHRleHR1cmUsIGxvY2F0aW9uICkge1xyXG4gICAgICAgIC8vIGlmIHRoaXMgYnVmZmVyIGlzIGFscmVhZHkgYm91bmQsIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAoIF9ib3VuZFRleHR1cmUgPT09IHRleHR1cmUgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGV4dHVyZS5nbDtcclxuICAgICAgICBsb2NhdGlvbiA9IGdsWyAnVEVYVFVSRScgKyBsb2NhdGlvbiBdIHx8IGdsLlRFWFRVUkUwO1xyXG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoIGxvY2F0aW9uICk7XHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoIGdsLlRFWFRVUkVfMkQsIHRleHR1cmUudGV4dHVyZSApO1xyXG4gICAgICAgIF9ib3VuZFRleHR1cmUgPSB0ZXh0dXJlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgdGV4dHVyZSBvYmplY3QuIFByZXZlbnRzIHVubmVjZXNzYXJ5IHVuYmluZGluZy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1RleHR1cmUyRH0gdGV4dHVyZSAtIFRoZSBUZXh0dXJlMkQgb2JqZWN0IHRvIHVuYmluZC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gdW5iaW5kKCB0ZXh0dXJlICkge1xyXG4gICAgICAgIC8vIGlmIG5vIGJ1ZmZlciBpcyBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kVGV4dHVyZSA9PT0gbnVsbCApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSB0ZXh0dXJlLmdsO1xyXG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKCBnbC5URVhUVVJFXzJELCBudWxsICk7XHJcbiAgICAgICAgX2JvdW5kVGV4dHVyZSA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYSBUZXh0dXJlMkQgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIFRleHR1cmUyRFxyXG4gICAgICogQGNsYXNzZGVzYyBBIHRleHR1cmUgY2xhc3MgdG8gcmVwcmVzZW50IGEgMkQgdGV4dHVyZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gVGV4dHVyZTJEKCBzcGVjLCBjYWxsYmFjayApIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgLy8gZGVmYXVsdFxyXG4gICAgICAgIHNwZWMgPSBzcGVjIHx8IHt9O1xyXG4gICAgICAgIHRoaXMuZ2wgPSBXZWJHTENvbnRleHQuZ2V0KCk7XHJcbiAgICAgICAgLy8gY3JlYXRlIHRleHR1cmUgb2JqZWN0XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlID0gdGhpcy5nbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgdGhpcy53cmFwID0gc3BlYy53cmFwIHx8ICdSRVBFQVQnO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyID0gc3BlYy5maWx0ZXIgfHwgJ0xJTkVBUic7XHJcbiAgICAgICAgdGhpcy5pbnZlcnRZID0gc3BlYy5pbnZlcnRZICE9PSB1bmRlZmluZWQgPyBzcGVjLmludmVydFkgOiB0cnVlO1xyXG4gICAgICAgIHRoaXMubWlwTWFwID0gc3BlYy5taXBNYXAgIT09IHVuZGVmaW5lZCA/IHNwZWMubWlwTWFwIDogdHJ1ZTtcclxuICAgICAgICB0aGlzLnByZU11bHRpcGx5QWxwaGEgPSBzcGVjLnByZU11bHRpcGx5QWxwaGEgIT09IHVuZGVmaW5lZCA/IHNwZWMucHJlTXVsdGlwbHlBbHBoYSA6IHRydWU7XHJcbiAgICAgICAgLy8gYnVmZmVyIHRoZSB0ZXh0dXJlIGJhc2VkIG9uIGFyZ3VtZW50c1xyXG4gICAgICAgIGlmICggc3BlYy5pbWFnZSApIHtcclxuICAgICAgICAgICAgLy8gdXNlIGV4aXN0aW5nIEltYWdlIG9iamVjdFxyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckRhdGEoIHNwZWMuaW1hZ2UgKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRQYXJhbWV0ZXJzKCB0aGlzICk7XHJcbiAgICAgICAgfSBlbHNlIGlmICggc3BlYy51cmwgKSB7XHJcbiAgICAgICAgICAgIC8vIHJlcXVlc3QgaW1hZ2Ugc291cmNlIGZyb20gdXJsXHJcbiAgICAgICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuYnVmZmVyRGF0YSggaW1hZ2UgKTtcclxuICAgICAgICAgICAgICAgIHRoYXQuc2V0UGFyYW1ldGVycyggdGhhdCApO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soIHRoYXQgKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW1hZ2Uuc3JjID0gc3BlYy51cmw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYXNzdW1lIHRoaXMgdGV4dHVyZSB3aWxsIGJlICByZW5kZXJlZCB0by4gSW4gdGhpcyBjYXNlIGRpc2FibGVcclxuICAgICAgICAgICAgLy8gbWlwbWFwcGluZywgdGhlcmUgaXMgbm8gbmVlZCBhbmQgaXQgd2lsbCBvbmx5IGludHJvZHVjZSB2ZXJ5XHJcbiAgICAgICAgICAgIC8vIHBlY3VsaWFyIHJlbmRlcmluZyBidWdzIGluIHdoaWNoIHRoZSB0ZXh0dXJlICd0cmFuc2Zvcm1zJyBhdFxyXG4gICAgICAgICAgICAvLyBjZXJ0YWluIGFuZ2xlcyAvIGRpc3RhbmNlcyB0byB0aGUgbWlwbWFwcGVkIChlbXB0eSkgcG9ydGlvbnMuXHJcbiAgICAgICAgICAgIHRoaXMubWlwTWFwID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vIGJ1ZmZlciBkYXRhXHJcbiAgICAgICAgICAgIGlmICggc3BlYy5mb3JtYXQgPT09ICdERVBUSF9DT01QT05FTlQnICkge1xyXG4gICAgICAgICAgICAgICAgLy8gZGVwdGggdGV4dHVyZVxyXG4gICAgICAgICAgICAgICAgdmFyIGRlcHRoVGV4dHVyZUV4dCA9IFdlYkdMQ29udGV4dC5jaGVja0V4dGVuc2lvbiggJ1dFQkdMX2RlcHRoX3RleHR1cmUnICk7XHJcbiAgICAgICAgICAgICAgICBpZiggIWRlcHRoVGV4dHVyZUV4dCApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oICdDYW5ub3QgY3JlYXRlIFRleHR1cmUyRCBvZiBmb3JtYXQgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdnbC5ERVBUSF9DT01QT05FTlQgYXMgV0VCR0xfZGVwdGhfdGV4dHVyZSBpcyAnICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ3Vuc3VwcG9ydGVkIGJ5IHRoaXMgYnJvd3NlciwgY29tbWFuZCBpZ25vcmVkJyApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHNldCBmb3JtYXRcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9ybWF0ID0gc3BlYy5mb3JtYXQ7XHJcbiAgICAgICAgICAgICAgICAvLyBzZXQgdHlwZVxyXG4gICAgICAgICAgICAgICAgaWYgKCAhc3BlYy50eXBlICkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGRlZmF1bHQgdG8gdW5zaWduZWQgaW50IGZvciBoaWdoZXIgcHJlY2lzaW9uXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlID0gJ1VOU0lHTkVEX0lOVCc7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzcGVjLnR5cGUgPT09ICdVTlNJR05FRF9TSE9SVCcgfHwgc3BlYy50eXBlID09PSAnVU5TSUdORURfSU5UJyApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXQgdG8gYWNjZXB0IHR5cGVzXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50eXBlID0gc3BlYy50eXBlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBlcnJvclxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0RlcHRoIHRleHR1cmVzIGRvIG5vdCBzdXBwb3J0IHR5cGVgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWMudHlwZSArICdgLCBkZWZhdWx0aW5nIHRvIGBVTlNJR05FRF9JTlRgLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGRlZmF1bHRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSAnVU5TSUdORURfSU5UJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIGFsd2F5cyBkaXNhYmxlIG1pcCBtYXBwaW5nIGZvciBkZXB0aCB0ZXh0dXJlXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBvdGhlclxyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JtYXQgPSBzcGVjLmZvcm1hdCB8fCAnUkdCQSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnR5cGUgPSBzcGVjLnR5cGUgfHwgJ1VOU0lHTkVEX0JZVEUnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJuYWxGb3JtYXQgPSB0aGlzLmZvcm1hdDsgLy8gd2ViZ2wgcmVxdWlyZXMgZm9ybWF0ID09PSBpbnRlcm5hbEZvcm1hdFxyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlckRhdGEoIHNwZWMuZGF0YSB8fCBudWxsLCBzcGVjLndpZHRoLCBzcGVjLmhlaWdodCApO1xyXG4gICAgICAgICAgICB0aGlzLnNldFBhcmFtZXRlcnMoIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgdGV4dHVyZSBvYmplY3QgYW5kIHB1c2hlcyBpdCB0byB0aGUgZnJvbnQgb2YgdGhlIHN0YWNrLlxyXG4gICAgICogQG1lbWJlcm9mIFRleHR1cmUyRFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsb2NhdGlvbiAtIFRoZSB0ZXh0dXJlIHVuaXQgbG9jYXRpb24gaW5kZXguXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmUyRH0gVGhlIHRleHR1cmUgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFRleHR1cmUyRC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCBsb2NhdGlvbiApIHtcclxuICAgICAgICBfc3RhY2tbIGxvY2F0aW9uIF0gPSBfc3RhY2tbIGxvY2F0aW9uIF0gfHwgbmV3IFN0YWNrKCk7XHJcbiAgICAgICAgX3N0YWNrWyBsb2NhdGlvbiBdLnB1c2goIHRoaXMgKTtcclxuICAgICAgICBiaW5kKCB0aGlzLCBsb2NhdGlvbiApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVuYmluZHMgdGhlIHRleHR1cmUgb2JqZWN0IGFuZCBiaW5kcyB0aGUgdGV4dHVyZSBiZW5lYXRoIGl0IG9uXHJcbiAgICAgKiB0aGlzIHN0YWNrLiBJZiB0aGVyZSBpcyBubyB1bmRlcmx5aW5nIHRleHR1cmUsIHVuYmluZHMgdGhlIHVuaXQuXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZTJEXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvY2F0aW9uIC0gVGhlIHRleHR1cmUgdW5pdCBsb2NhdGlvbiBpbmRleC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZTJEfSBUaGUgdGV4dHVyZSBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVGV4dHVyZTJELnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiggbG9jYXRpb24gKSB7XHJcbiAgICAgICAgdmFyIHRvcDtcclxuICAgICAgICBpZiAoICFfc3RhY2tbIGxvY2F0aW9uIF0gKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIHRleHR1cmUgd2FzIGJvdW5kIHRvIHRleHR1cmUgdW5pdCBgJyArIGxvY2F0aW9uICtcclxuICAgICAgICAgICAgICAgICdgLCBjb21tYW5kIGlnbm9yZWQuJyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBfc3RhY2tbIGxvY2F0aW9uIF0ucG9wKCk7XHJcbiAgICAgICAgdG9wID0gX3N0YWNrWyBsb2NhdGlvbiBdLnRvcCgpO1xyXG4gICAgICAgIGlmICggdG9wICkge1xyXG4gICAgICAgICAgICBiaW5kKCB0b3AsIGxvY2F0aW9uICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdW5iaW5kKCB0aGlzICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ1ZmZlciBkYXRhIGludG8gdGhlIHRleHR1cmUuXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZTJEXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtJbWFnZURhdGF8QXJyYXlCdWZmZXJWaWV3fEhUTUxJbWFnZUVsZW1lbnR9IGRhdGEgLSBUaGUgZGF0YS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgZGF0YS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBUaGUgaGVpZ2h0IG9mIHRoZSBkYXRhLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlMkR9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlMkQucHJvdG90eXBlLmJ1ZmZlckRhdGEgPSBmdW5jdGlvbiggZGF0YSwgd2lkdGgsIGhlaWdodCApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIC8vIGludmVydCB5IGlmIHNwZWNpZmllZFxyXG4gICAgICAgIGdsLnBpeGVsU3RvcmVpKCBnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0aGlzLmludmVydFkgKTtcclxuICAgICAgICAvLyBwcmVtdWx0aXBsZSBhbHBoYSBpZiBzcGVjaWZpZWRcclxuICAgICAgICBnbC5waXhlbFN0b3JlaSggZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCB0aGlzLnByZU11bHRpcGx5QWxwaGEgKTtcclxuICAgICAgICAvLyBidWZmZXIgdGV4dHVyZSBiYXNlZCBvbiB0eXBlIG9mIGRhdGFcclxuICAgICAgICBpZiAoIGRhdGEgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50ICkge1xyXG4gICAgICAgICAgICAvLyBzZXQgZGltZW5zaW9ucyBvZiBvcmlnaW5hbCBpbWFnZSBiZWZvcmUgcmVzaXppbmdcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGRhdGEud2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gZGF0YS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGRhdGEgPSBlbnN1cmVQb3dlck9mVHdvKCBkYXRhICk7XHJcbiAgICAgICAgICAgIHRoaXMuaW1hZ2UgPSBkYXRhO1xyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV8yRCxcclxuICAgICAgICAgICAgICAgIDAsIC8vIGxldmVsXHJcbiAgICAgICAgICAgICAgICBnbC5SR0JBLFxyXG4gICAgICAgICAgICAgICAgZ2wuUkdCQSxcclxuICAgICAgICAgICAgICAgIGdsLlVOU0lHTkVEX0JZVEUsXHJcbiAgICAgICAgICAgICAgICBkYXRhICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoIHx8IHRoaXMud2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV8yRCxcclxuICAgICAgICAgICAgICAgIDAsIC8vIGxldmVsXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy5pbnRlcm5hbEZvcm1hdCBdLFxyXG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aCxcclxuICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgMCwgLy8gYm9yZGVyLCBtdXN0IGJlIDBcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLmZvcm1hdCBdLFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMudHlwZSBdLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggdGhpcy5taXBNYXAgKSB7XHJcbiAgICAgICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKCBnbC5URVhUVVJFXzJEICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRoZSB0ZXh0dXJlIHBhcmFtZXRlcnMuXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZTJEXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgLSBUaGUgcGFyYW1ldGVycyBieSBuYW1lLlxyXG4gICAgICogPHByZT5cclxuICAgICAqICAgICB3cmFwIHwgd3JhcC5zIHwgd3JhcC50IC0gVGhlIHdyYXBwaW5nIHR5cGUuXHJcbiAgICAgKiAgICAgZmlsdGVyIHwgZmlsdGVyLm1pbiB8IGZpbHRlci5tYWcgLSBUaGUgZmlsdGVyIHR5cGUuXHJcbiAgICAgKiA8L3ByZT5cclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlMkR9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlMkQucHJvdG90eXBlLnNldFBhcmFtZXRlcnMgPSBmdW5jdGlvbiggcGFyYW1ldGVycyApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIGlmICggcGFyYW1ldGVycy53cmFwICkge1xyXG4gICAgICAgICAgICAvLyBzZXQgd3JhcCBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIHRoaXMud3JhcCA9IHBhcmFtZXRlcnMud3JhcDtcclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfMkQsXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX1dSQVBfUyxcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLndyYXAucyB8fCB0aGlzLndyYXAgXSApO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV8yRCxcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfV1JBUF9ULFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMud3JhcC50IHx8IHRoaXMud3JhcCBdICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggcGFyYW1ldGVycy5maWx0ZXIgKSB7XHJcbiAgICAgICAgICAgIC8vIHNldCBmaWx0ZXIgcGFyYW1ldGVyc1xyXG4gICAgICAgICAgICB0aGlzLmZpbHRlciA9IHBhcmFtZXRlcnMuZmlsdGVyO1xyXG4gICAgICAgICAgICB2YXIgbWluRmlsdGVyID0gdGhpcy5maWx0ZXIubWluIHx8IHRoaXMuZmlsdGVyO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMubWlwTWFwICkge1xyXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kIG1pcG1hcCBzdWZmaXggdG8gbWluIGZpbHRlclxyXG4gICAgICAgICAgICAgICAgbWluRmlsdGVyICs9ICdfTUlQTUFQX0xJTkVBUic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfMkQsXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX01BR19GSUxURVIsXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy5maWx0ZXIubWFnIHx8IHRoaXMuZmlsdGVyIF0gKTtcclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfMkQsXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX01JTl9GSUxURVIsXHJcbiAgICAgICAgICAgICAgICBnbFsgbWluRmlsdGVyXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc2l6ZSB0aGUgdGV4dHVyZS5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlMkRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBUaGUgbmV3IHdpZHRoIG9mIHRoZSB0ZXh0dXJlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBuZXcgaGVpZ2h0IG9mIHRoZSB0ZXh0dXJlLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlMkR9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlMkQucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKCB3aWR0aCwgaGVpZ2h0ICkge1xyXG4gICAgICAgIGlmICggdGhpcy5pbWFnZSApIHtcclxuICAgICAgICAgICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBldmVyIHJlc2l6ZSBhIHRleHR1cmUgdGhhdCBpcyBiYXNlZFxyXG4gICAgICAgICAgICAvLyBvZiBhbiBhY3R1YWwgaW1hZ2UuIFRoYXQgaXMgd2hhdCBzYW1wbGluZyBpcyBmb3IuXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdDYW5ub3QgcmVzaXplIGltYWdlIGJhc2VkIFRleHR1cmUyRCcgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICF3aWR0aCB8fCAhaGVpZ2h0ICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oICdXaWR0aCBvciBoZWlnaHQgYXJndW1lbnRzIG1pc3NpbmcsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idWZmZXJEYXRhKCB0aGlzLmRhdGEsIHdpZHRoLCBoZWlnaHQgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUZXh0dXJlMkQ7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgV2ViR0xDb250ZXh0ID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHQnKSxcclxuICAgICAgICBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC9VdGlsJyksXHJcbiAgICAgICAgU3RhY2sgPSByZXF1aXJlKCcuLi91dGlsL1N0YWNrJyksXHJcbiAgICAgICAgRkFDRVMgPSBbXHJcbiAgICAgICAgICAgICcteCcsICcreCcsXHJcbiAgICAgICAgICAgICcteScsICcreScsXHJcbiAgICAgICAgICAgICcteicsICcreidcclxuICAgICAgICBdLFxyXG4gICAgICAgIEZBQ0VfVEFSR0VUUyA9IHtcclxuICAgICAgICAgICAgJyt6JzogJ1RFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWicsXHJcbiAgICAgICAgICAgICcteic6ICdURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1onLFxyXG4gICAgICAgICAgICAnK3gnOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YJyxcclxuICAgICAgICAgICAgJy14JzogJ1RFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWCcsXHJcbiAgICAgICAgICAgICcreSc6ICdURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1knLFxyXG4gICAgICAgICAgICAnLXknOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgX3N0YWNrID0ge30sXHJcbiAgICAgICAgX2JvdW5kVGV4dHVyZSA9IG51bGw7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJZiB0aGUgcHJvdmlkZWQgaW1hZ2UgZGltZW5zaW9ucyBhcmUgbm90IHBvd2VycyBvZiB0d28sIGl0IHdpbGwgcmVkcmF3XHJcbiAgICAgKiB0aGUgaW1hZ2UgdG8gdGhlIG5leHQgaGlnaGVzdCBwb3dlciBvZiB0d28uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBpbWFnZSAtIFRoZSBpbWFnZSBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0hUTUxJbWFnZUVsZW1lbnR9IFRoZSBuZXcgaW1hZ2Ugb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBlbnN1cmVQb3dlck9mVHdvKCBpbWFnZSApIHtcclxuICAgICAgICBpZiAoICFVdGlsLmlzUG93ZXJPZlR3byggaW1hZ2Uud2lkdGggKSB8fFxyXG4gICAgICAgICAgICAhVXRpbC5pc1Bvd2VyT2ZUd28oIGltYWdlLmhlaWdodCApICkge1xyXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gVXRpbC5uZXh0SGlnaGVzdFBvd2VyT2ZUd28oIGltYWdlLndpZHRoICk7XHJcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBVdGlsLm5leHRIaWdoZXN0UG93ZXJPZlR3byggaW1hZ2UuaGVpZ2h0ICk7XHJcbiAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShcclxuICAgICAgICAgICAgICAgIGltYWdlLFxyXG4gICAgICAgICAgICAgICAgMCwgMCxcclxuICAgICAgICAgICAgICAgIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAwLCAwLFxyXG4gICAgICAgICAgICAgICAgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0ICk7XHJcbiAgICAgICAgICAgIHJldHVybiBjYW52YXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpbWFnZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmRzIHRoZSB0ZXh0dXJlIG9iamVjdCB0byBhIGxvY2F0aW9uIGFuZCBhY3RpdmF0ZXMgdGhlIHRleHR1cmUgdW5pdFxyXG4gICAgICogd2hpbGUgY2FjaGluZyBpdCB0byBwcmV2ZW50IHVubmVjZXNzYXJ5IHJlYmluZHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlQ3ViZU1hcH0gdGV4dHVyZSAtIFRoZSBUZXh0dXJlQ3ViZU1hcCBvYmplY3QgdG8gYmluZC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsb2NhdGlvbiAtIFRoZSB0ZXh0dXJlIHVuaXQgbG9jYXRpb24gaW5kZXguXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGJpbmQoIHRleHR1cmUsIGxvY2F0aW9uICkge1xyXG4gICAgICAgIC8vIGlmIHRoaXMgYnVmZmVyIGlzIGFscmVhZHkgYm91bmQsIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAoIF9ib3VuZFRleHR1cmUgPT09IHRleHR1cmUgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGV4dHVyZS5nbDtcclxuICAgICAgICBsb2NhdGlvbiA9IGdsWyAnVEVYVFVSRScgKyBsb2NhdGlvbiBdIHx8IGdsLlRFWFRVUkUwO1xyXG4gICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoIGxvY2F0aW9uICk7XHJcbiAgICAgICAgZ2wuYmluZFRleHR1cmUoIGdsLlRFWFRVUkVfQ1VCRV9NQVAsIHRleHR1cmUudGV4dHVyZSApO1xyXG4gICAgICAgIF9ib3VuZFRleHR1cmUgPSB0ZXh0dXJlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgdGV4dHVyZSBvYmplY3QuIFByZXZlbnRzIHVubmVjZXNzYXJ5IHVuYmluZGluZy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1RleHR1cmVDdWJlTWFwfSB0ZXh0dXJlIC0gVGhlIFRleHR1cmVDdWJlTWFwIG9iamVjdCB0byB1bmJpbmQuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHVuYmluZCggdGV4dHVyZSApIHtcclxuICAgICAgICAvLyBpZiBubyBidWZmZXIgaXMgYm91bmQsIGV4aXQgZWFybHlcclxuICAgICAgICBpZiAoIF9ib3VuZFRleHR1cmUgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGV4dHVyZS5nbDtcclxuICAgICAgICBnbC5iaW5kVGV4dHVyZSggZ2wuVEVYVFVSRV9DVUJFX01BUCwgbnVsbCApO1xyXG4gICAgICAgIF9ib3VuZFRleHR1cmUgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRvIGxvYWQgYW5kIGJ1ZmZlciBhIGdpdmVuIGN1YmUgbWFwIGZhY2UuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlQ3ViZU1hcH0gY3ViZU1hcCAtIFRoZSBjdWJlIG1hcCBvYmplY3QuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIC0gVGhlIHVybCB0byBsb2FkIHRoZSBpbWFnZS5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBmYWNlIC0gVGhlIGZhY2UgaWRlbnRpZmljYXRpb24gc3RyaW5nLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gVGhlIHJlc3VsdGluZyBmdW5jdGlvbi5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbG9hZEFuZEJ1ZmZlckltYWdlKCBjdWJlTWFwLCB1cmwsIGZhY2UgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBkb25lICkge1xyXG4gICAgICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBidWZmZXIgZmFjZSB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICBjdWJlTWFwLmJ1ZmZlckZhY2VEYXRhKCBmYWNlLCBpbWFnZSApO1xyXG4gICAgICAgICAgICAgICAgZG9uZSgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpbWFnZS5zcmMgPSB1cmw7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEluc3RhbnRpYXRlcyBhIFRleHR1cmVDdWJlTWFwIG9iamVjdC5cclxuICAgICAqIEBjbGFzcyBUZXh0dXJlQ3ViZU1hcFxyXG4gICAgICogQGNsYXNzZGVzYyBBIHRleHR1cmUgY2xhc3MgdG8gcmVwcmVzZW50IGEgY3ViZSBtYXAgdGV4dHVyZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gVGV4dHVyZUN1YmVNYXAoIHNwZWMsIGNhbGxiYWNrICkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgICAgICAgZmFjZSxcclxuICAgICAgICAgICAgam9icztcclxuICAgICAgICAvLyBzdG9yZSBnbCBjb250ZXh0XHJcbiAgICAgICAgdGhpcy5nbCA9IFdlYkdMQ29udGV4dC5nZXQoKTtcclxuICAgICAgICB0aGlzLnRleHR1cmUgPSB0aGlzLmdsLmNyZWF0ZVRleHR1cmUoKTtcclxuICAgICAgICB0aGlzLndyYXAgPSBzcGVjLndyYXAgfHwgJ0NMQU1QX1RPX0VER0UnO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyID0gc3BlYy5maWx0ZXIgfHwgJ0xJTkVBUic7XHJcbiAgICAgICAgdGhpcy5pbnZlcnRZID0gc3BlYy5pbnZlcnRZICE9PSB1bmRlZmluZWQgPyBzcGVjLmludmVydFkgOiBmYWxzZTtcclxuICAgICAgICAvLyBjcmVhdGUgY3ViZSBtYXAgYmFzZWQgb24gaW5wdXRcclxuICAgICAgICBpZiAoIHNwZWMuaW1hZ2VzICkge1xyXG4gICAgICAgICAgICAvLyBtdWx0aXBsZSBJbWFnZSBvYmplY3RzXHJcbiAgICAgICAgICAgIGZvciAoIGZhY2UgaW4gc3BlYy5pbWFnZXMgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNwZWMuaW1hZ2VzLmhhc093blByb3BlcnR5KCBmYWNlICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYnVmZmVyIGZhY2UgdGV4dHVyZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyRmFjZURhdGEoIGZhY2UsIHNwZWMuaW1hZ2VzWyBmYWNlIF0gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnNldFBhcmFtZXRlcnMoIHRoaXMgKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCBzcGVjLnVybHMgKSB7XHJcbiAgICAgICAgICAgIC8vIG11bHRpcGxlIHVybHNcclxuICAgICAgICAgICAgam9icyA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKCBmYWNlIGluIHNwZWMudXJscyApIHtcclxuICAgICAgICAgICAgICAgIGlmICggc3BlYy51cmxzLmhhc093blByb3BlcnR5KCBmYWNlICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYWRkIGpvYiB0byBtYXBcclxuICAgICAgICAgICAgICAgICAgICBqb2JzWyBmYWNlIF0gPSBsb2FkQW5kQnVmZmVySW1hZ2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWMudXJsc1sgZmFjZSBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmYWNlICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgVXRpbC5hc3luYyggam9icywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnNldFBhcmFtZXRlcnMoIHRoYXQgKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCB0aGF0ICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGVtcHR5IGN1YmUgbWFwXHJcbiAgICAgICAgICAgIHRoaXMuZm9ybWF0ID0gc3BlYy5mb3JtYXQgfHwgJ1JHQkEnO1xyXG4gICAgICAgICAgICB0aGlzLmludGVybmFsRm9ybWF0ID0gdGhpcy5mb3JtYXQ7IC8vIHdlYmdsIHJlcXVpcmVzIGZvcm1hdCA9PT0gaW50ZXJuYWxGb3JtYXRcclxuICAgICAgICAgICAgdGhpcy50eXBlID0gc3BlYy50eXBlIHx8ICdVTlNJR05FRF9CWVRFJztcclxuICAgICAgICAgICAgdGhpcy5taXBNYXAgPSBzcGVjLm1pcE1hcCAhPT0gdW5kZWZpbmVkID8gc3BlYy5taXBNYXAgOiBmYWxzZTtcclxuICAgICAgICAgICAgRkFDRVMuZm9yRWFjaCggZnVuY3Rpb24oIGZhY2UgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9ICggc3BlYy5kYXRhID8gc3BlYy5kYXRhW2ZhY2VdIDogc3BlYy5kYXRhICkgfHwgbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoYXQuYnVmZmVyRmFjZURhdGEoIGZhY2UsIGRhdGEsIHNwZWMud2lkdGgsIHNwZWMuaGVpZ2h0ICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLnNldFBhcmFtZXRlcnMoIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kcyB0aGUgdGV4dHVyZSBvYmplY3QgYW5kIHB1c2hlcyBpdCB0byB0aGUgZnJvbnQgb2YgdGhlIHN0YWNrLlxyXG4gICAgICogQG1lbWJlcm9mIFRleHR1cmVDdWJlTWFwXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvY2F0aW9uIC0gVGhlIHRleHR1cmUgdW5pdCBsb2NhdGlvbiBpbmRleC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZUN1YmVNYXB9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICAgVGV4dHVyZUN1YmVNYXAucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiggbG9jYXRpb24gKSB7XHJcbiAgICAgICAgX3N0YWNrWyBsb2NhdGlvbiBdID0gX3N0YWNrWyBsb2NhdGlvbiBdIHx8IG5ldyBTdGFjaygpO1xyXG4gICAgICAgIF9zdGFja1sgbG9jYXRpb24gXS5wdXNoKCB0aGlzICk7XHJcbiAgICAgICAgYmluZCggdGhpcywgbG9jYXRpb24gKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVbmJpbmRzIHRoZSB0ZXh0dXJlIG9iamVjdCBhbmQgYmluZHMgdGhlIHRleHR1cmUgYmVuZWF0aCBpdCBvblxyXG4gICAgICogdGhpcyBzdGFjay4gSWYgdGhlcmUgaXMgbm8gdW5kZXJseWluZyB0ZXh0dXJlLCB1bmJpbmRzIHRoZSB1bml0LlxyXG4gICAgICogQG1lbWJlcm9mIFRleHR1cmVDdWJlTWFwXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvY2F0aW9uIC0gVGhlIHRleHR1cmUgdW5pdCBsb2NhdGlvbiBpbmRleC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZUN1YmVNYXB9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICAgVGV4dHVyZUN1YmVNYXAucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCBsb2NhdGlvbiApIHtcclxuICAgICAgICB2YXIgdG9wO1xyXG4gICAgICAgIGlmICggIV9zdGFja1sgbG9jYXRpb24gXSApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ05vIHRleHR1cmUgd2FzIGJvdW5kIHRvIHRleHR1cmUgdW5pdCBgJyArIGxvY2F0aW9uICtcclxuICAgICAgICAgICAgICAgICdgLCBjb21tYW5kIGlnbm9yZWQuJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF9zdGFja1sgbG9jYXRpb24gXS5wb3AoKTtcclxuICAgICAgICB0b3AgPSBfc3RhY2tbIGxvY2F0aW9uIF0udG9wKCk7XHJcbiAgICAgICAgaWYgKCB0b3AgKSB7XHJcbiAgICAgICAgICAgIGJpbmQoIHRvcCwgbG9jYXRpb24gKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1bmJpbmQoIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQnVmZmVyIGRhdGEgaW50byB0aGUgcmVzcGVjdGl2ZSBjdWJlIG1hcCBmYWNlLlxyXG4gICAgICogQG1lbWJlcm9mIFRleHR1cmVDdWJlTWFwXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZhY2UgLSBUaGUgZmFjZSBpZGVudGlmaWNhdGlvbiBzdHJpbmcuXHJcbiAgICAgKiBAcGFyYW0ge0ltYWdlRGF0YXxBcnJheUJ1ZmZlclZpZXd8SFRNTEltYWdlRWxlbWVudH0gZGF0YSAtIFRoZSBkYXRhLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gVGhlIHdpZHRoIG9mIHRoZSBkYXRhLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIGRhdGEuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmVDdWJlTWFwfSBUaGUgdGV4dHVyZSBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVGV4dHVyZUN1YmVNYXAucHJvdG90eXBlLmJ1ZmZlckZhY2VEYXRhID0gZnVuY3Rpb24oIGZhY2UsIGRhdGEsIHdpZHRoLCBoZWlnaHQgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbCxcclxuICAgICAgICAgICAgZmFjZVRhcmdldCA9IGdsWyBGQUNFX1RBUkdFVFNbIGZhY2UgXSBdO1xyXG4gICAgICAgIGlmICggIWZhY2VUYXJnZXQgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdJbnZhbGlkIGZhY2UgZW51bWVyYXRpb24gYCcgKyBmYWNlICsgJ2AgcHJvdmlkZWQsICcgK1xyXG4gICAgICAgICAgICAgICAgJ2NvbW1hbmQgaWdub3JlZC4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gYnVmZmVyIGZhY2UgdGV4dHVyZVxyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIGlmICggZGF0YSBpbnN0YW5jZW9mIEhUTUxJbWFnZUVsZW1lbnQgKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW1hZ2VzID0gdGhpcy5pbWFnZXMgfHwge307XHJcbiAgICAgICAgICAgIHRoaXMuaW1hZ2VzWyBmYWNlIF0gPSBlbnN1cmVQb3dlck9mVHdvKCBkYXRhICk7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyID0gJ0xJTkVBUic7IC8vIG11c3QgYmUgbGluZWFyIGZvciBtaXBtYXBwaW5nXHJcbiAgICAgICAgICAgIHRoaXMubWlwTWFwID0gdHJ1ZTtcclxuICAgICAgICAgICAgZ2wucGl4ZWxTdG9yZWkoIGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRoaXMuaW52ZXJ0WSApO1xyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKFxyXG4gICAgICAgICAgICAgICAgZmFjZVRhcmdldCxcclxuICAgICAgICAgICAgICAgIDAsIC8vIGxldmVsXHJcbiAgICAgICAgICAgICAgICBnbC5SR0JBLFxyXG4gICAgICAgICAgICAgICAgZ2wuUkdCQSxcclxuICAgICAgICAgICAgICAgIGdsLlVOU0lHTkVEX0JZVEUsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmltYWdlc1sgZmFjZSBdICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhIHx8IHt9O1xyXG4gICAgICAgICAgICB0aGlzLmRhdGFbIGZhY2UgXSA9IGRhdGE7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSB3aWR0aCB8fCB0aGlzLndpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodCB8fCB0aGlzLmhlaWdodDtcclxuICAgICAgICAgICAgZ2wudGV4SW1hZ2UyRChcclxuICAgICAgICAgICAgICAgIGZhY2VUYXJnZXQsXHJcbiAgICAgICAgICAgICAgICAwLCAvLyBsZXZlbFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMuaW50ZXJuYWxGb3JtYXQgXSxcclxuICAgICAgICAgICAgICAgIHRoaXMud2lkdGgsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgICAgIDAsIC8vIGJvcmRlciwgbXVzdCBiZSAwXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy5mb3JtYXQgXSxcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLnR5cGUgXSxcclxuICAgICAgICAgICAgICAgIGRhdGEgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gb25seSBnZW5lcmF0ZSBtaXBtYXBzIGlmIGFsbCBmYWNlcyBhcmUgYnVmZmVyZWRcclxuICAgICAgICB0aGlzLmJ1ZmZlcmVkRmFjZXMgPSB0aGlzLmJ1ZmZlcmVkRmFjZXMgfHwge307XHJcbiAgICAgICAgdGhpcy5idWZmZXJlZEZhY2VzWyBmYWNlIF0gPSB0cnVlO1xyXG4gICAgICAgIC8vIG9uY2UgYWxsIGZhY2VzIGFyZSBidWZmZXJlZFxyXG4gICAgICAgIGlmICggdGhpcy5taXBNYXAgJiZcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJlZEZhY2VzWycteCddICYmIHRoaXMuYnVmZmVyZWRGYWNlc1snK3gnXSAmJlxyXG4gICAgICAgICAgICB0aGlzLmJ1ZmZlcmVkRmFjZXNbJy15J10gJiYgdGhpcy5idWZmZXJlZEZhY2VzWycreSddICYmXHJcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyZWRGYWNlc1snLXonXSAmJiB0aGlzLmJ1ZmZlcmVkRmFjZXNbJyt6J10gKSB7XHJcbiAgICAgICAgICAgIC8vIGdlbmVyYXRlIG1pcG1hcHMgb25jZSBhbGwgZmFjZXMgYXJlIGJ1ZmZlcmVkXHJcbiAgICAgICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKCBnbC5URVhUVVJFX0NVQkVfTUFQICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRoZSB0ZXh0dXJlIHBhcmFtZXRlcnMuXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZUN1YmVNYXBcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyAtIFRoZSBwYXJhbWV0ZXJzIGJ5IG5hbWUuXHJcbiAgICAgKiA8cHJlPlxyXG4gICAgICogICAgIHdyYXAgfCB3cmFwLnMgfCB3cmFwLnQgLSBUaGUgd3JhcHBpbmcgdHlwZS5cclxuICAgICAqICAgICBmaWx0ZXIgfCBmaWx0ZXIubWluIHwgZmlsdGVyLm1hZyAtIFRoZSBmaWx0ZXIgdHlwZS5cclxuICAgICAqIDwvcHJlPlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmVDdWJlTWFwfSBUaGUgdGV4dHVyZSBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVGV4dHVyZUN1YmVNYXAucHJvdG90eXBlLnNldFBhcmFtZXRlcnMgPSBmdW5jdGlvbiggcGFyYW1ldGVycyApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIGlmICggcGFyYW1ldGVycy53cmFwICkge1xyXG4gICAgICAgICAgICAvLyBzZXQgd3JhcCBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIHRoaXMud3JhcCA9IHBhcmFtZXRlcnMud3JhcDtcclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfQ1VCRV9NQVAsXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX1dSQVBfUyxcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLndyYXAucyB8fCB0aGlzLndyYXAgXSApO1xyXG4gICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV9DVUJFX01BUCxcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfV1JBUF9ULFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMud3JhcC50IHx8IHRoaXMud3JhcCBdICk7XHJcbiAgICAgICAgICAgIC8qIG5vdCBzdXBwb3J0ZWQgaW4gd2ViZ2wgMS4wXHJcbiAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX0NVQkVfTUFQLFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV9XUkFQX1IsXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy53cmFwLnIgfHwgdGhpcy53cmFwIF0gKTtcclxuICAgICAgICAgICAgKi9cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBwYXJhbWV0ZXJzLmZpbHRlciApIHtcclxuICAgICAgICAgICAgLy8gc2V0IGZpbHRlciBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyID0gcGFyYW1ldGVycy5maWx0ZXI7XHJcbiAgICAgICAgICAgIHZhciBtaW5GaWx0ZXIgPSB0aGlzLmZpbHRlci5taW4gfHwgdGhpcy5maWx0ZXI7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5taW5NYXAgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBhcHBlbmQgbWluIG1wYSBzdWZmaXggdG8gbWluIGZpbHRlclxyXG4gICAgICAgICAgICAgICAgbWluRmlsdGVyICs9ICdfTUlQTUFQX0xJTkVBUic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfQ1VCRV9NQVAsXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX01BR19GSUxURVIsXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy5maWx0ZXIubWFnIHx8IHRoaXMuZmlsdGVyIF0gKTtcclxuICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaShcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfQ1VCRV9NQVAsXHJcbiAgICAgICAgICAgICAgICBnbC5URVhUVVJFX01JTl9GSUxURVIsXHJcbiAgICAgICAgICAgICAgICBnbFsgbWluRmlsdGVyXSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBvcCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRleHR1cmVDdWJlTWFwO1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0JyksXHJcbiAgICAgICAgVmVydGV4UGFja2FnZSA9IHJlcXVpcmUoJy4vVmVydGV4UGFja2FnZScpLFxyXG4gICAgICAgIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsL1V0aWwnKSxcclxuICAgICAgICBfYm91bmRCdWZmZXIgPSBudWxsLFxyXG4gICAgICAgIF9lbmFibGVkQXR0cmlidXRlcyA9IG51bGw7XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0U3RyaWRlKCBhdHRyaWJ1dGVQb2ludGVycyApIHtcclxuICAgICAgICB2YXIgQllURVNfUEVSX0NPTVBPTkVOVCA9IDQ7XHJcbiAgICAgICAgdmFyIG1heE9mZnNldCA9IDA7XHJcbiAgICAgICAgdmFyIHN0cmlkZSA9IDA7XHJcbiAgICAgICAgT2JqZWN0LmtleXMoIGF0dHJpYnV0ZVBvaW50ZXJzICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcclxuICAgICAgICAgICAgLy8gdHJhY2sgdGhlIGxhcmdlc3Qgb2Zmc2V0IHRvIGRldGVybWluZSB0aGUgc3RyaWRlIG9mIHRoZSBidWZmZXJcclxuICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSBhdHRyaWJ1dGVQb2ludGVyc1sga2V5IF07XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSBwb2ludGVyLm9mZnNldDtcclxuICAgICAgICAgICAgaWYgKCBvZmZzZXQgPiBtYXhPZmZzZXQgKSB7XHJcbiAgICAgICAgICAgICAgICBtYXhPZmZzZXQgPSBvZmZzZXQ7XHJcbiAgICAgICAgICAgICAgICBzdHJpZGUgPSBvZmZzZXQgKyAoIHBvaW50ZXIuc2l6ZSAqIEJZVEVTX1BFUl9DT01QT05FTlQgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBzdHJpZGU7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0QXR0cmlidXRlUG9pbnRlcnMoIGF0dHJpYnV0ZVBvaW50ZXJzICkge1xyXG4gICAgICAgIC8vIGVuc3VyZSB0aGVyZSBhcmUgcG9pbnRlcnMgcHJvdmlkZWRcclxuICAgICAgICBpZiAoICFhdHRyaWJ1dGVQb2ludGVycyB8fCBPYmplY3Qua2V5cyggYXR0cmlidXRlUG9pbnRlcnMgKS5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybmluZyggJ1ZlcnRleEJ1ZmZlciByZXF1aXJlcyBhdHRyaWJ1dGUgcG9pbnRlcnMgdG8gYmUgJyArXHJcbiAgICAgICAgICAgICAgICAnc3BlY2lmaWVkIHVwb24gaW5zdGFudGlhdGlvbiwgdGhpcyBidWZmZXIgd2lsbCBub3QgZHJhdyBjb3JyZWN0bHkuJyApO1xyXG4gICAgICAgICAgICByZXR1cm4ge307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBhcnNlIHBvaW50ZXJzIHRvIGVuc3VyZSB0aGV5IGFyZSB2YWxpZFxyXG4gICAgICAgIHZhciBwb2ludGVycyA9IHt9O1xyXG4gICAgICAgIE9iamVjdC5rZXlzKCBhdHRyaWJ1dGVQb2ludGVycyApLmZvckVhY2goIGZ1bmN0aW9uKCBrZXkgKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KCBrZXksIDEwICk7XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIHRoYXQga2V5IGlzIGFuIHZhbGlkIGludGVnZXJcclxuICAgICAgICAgICAgaWYgKCBpc05hTiggaW5kZXggKSApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignQXR0cmlidXRlIGluZGV4IGAnICsga2V5ICsgJ2AgZG9lcyBub3QgcmVwcmVzZW50IGFuIGludGVnZXIsIGRpc2NhcmRpbmcgYXR0cmlidXRlIHBvaW50ZXIuJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSBhdHRyaWJ1dGVQb2ludGVyc1trZXldO1xyXG4gICAgICAgICAgICB2YXIgc2l6ZSA9IHBvaW50ZXIuc2l6ZTtcclxuICAgICAgICAgICAgdmFyIHR5cGUgPSBwb2ludGVyLnR5cGU7XHJcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSBwb2ludGVyLm9mZnNldDtcclxuICAgICAgICAgICAgLy8gY2hlY2sgc2l6ZVxyXG4gICAgICAgICAgICBpZiAoICFzaXplIHx8IHNpemUgPCAxIHx8IHNpemUgPiA0ICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdBdHRyaWJ1dGUgcG9pbnRlciBgc2l6ZWAgcGFyYW1ldGVyIGlzIGludmFsaWQsICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICdkZWZhdWx0aW5nIHRvIDQuJyk7XHJcbiAgICAgICAgICAgICAgICBzaXplID0gNDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBjaGVjayB0eXBlXHJcbiAgICAgICAgICAgIGlmICggIXR5cGUgfHwgdHlwZSAhPT0gJ0ZMT0FUJyApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignQXR0cmlidXRlIHBvaW50ZXIgYHR5cGVgIHBhcmFtZXRlciBpcyBpbnZhbGlkLCAnICtcclxuICAgICAgICAgICAgICAgICAgICAnZGVmYXVsdGluZyB0byBgRkxPQVRgLicpO1xyXG4gICAgICAgICAgICAgICAgdHlwZSA9ICdGTE9BVCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcG9pbnRlcnNbIGluZGV4IF0gPSB7XHJcbiAgICAgICAgICAgICAgICBzaXplOiBzaXplLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgIG9mZnNldDogKCBvZmZzZXQgIT09IHVuZGVmaW5lZCApID8gb2Zmc2V0IDogMFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBwb2ludGVycztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXROdW1Db21wb25lbnRzKHBvaW50ZXJzKSB7XHJcbiAgICAgICAgdmFyIHNpemUgPSAwO1xyXG4gICAgICAgIHZhciBpbmRleDtcclxuICAgICAgICBmb3IgKCBpbmRleCBpbiBwb2ludGVycyApIHtcclxuICAgICAgICAgICAgaWYgKCBwb2ludGVycy5oYXNPd25Qcm9wZXJ0eSggaW5kZXggKSApIHtcclxuICAgICAgICAgICAgICAgIHNpemUgKz0gcG9pbnRlcnNbIGluZGV4IF0uc2l6ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2l6ZTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBWZXJ0ZXhCdWZmZXIoIGFyZywgYXR0cmlidXRlUG9pbnRlcnMsIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgdGhpcy5idWZmZXIgPSAwO1xyXG4gICAgICAgIHRoaXMuZ2wgPSBXZWJHTENvbnRleHQuZ2V0KCk7XHJcbiAgICAgICAgLy8gZmlyc3QsIHNldCB0aGUgYXR0cmlidXRlIHBvaW50ZXJzXHJcbiAgICAgICAgaWYgKCBhcmcgaW5zdGFuY2VvZiBWZXJ0ZXhQYWNrYWdlICkge1xyXG4gICAgICAgICAgICAvLyBWZXJ0ZXhQYWNrYWdlIGFyZ3VtZW50LCB1c2UgaXRzIGF0dHJpYnV0ZSBwb2ludGVyc1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJzID0gYXJnLmF0dHJpYnV0ZVBvaW50ZXJzKCk7XHJcbiAgICAgICAgICAgIC8vIHNoaWZ0IG9wdGlvbnMgYXJnIHNpbmNlIHRoZXJlIHdpbGwgYmUgbm8gYXR0cmliIHBvaW50ZXJzIGFyZ1xyXG4gICAgICAgICAgICBvcHRpb25zID0gYXR0cmlidXRlUG9pbnRlcnMgfHwge307XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wb2ludGVycyA9IGdldEF0dHJpYnV0ZVBvaW50ZXJzKCBhdHRyaWJ1dGVQb2ludGVycyApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyB0aGVuIGJ1ZmZlciB0aGUgZGF0YVxyXG4gICAgICAgIGlmICggYXJnICkge1xyXG4gICAgICAgICAgICBpZiAoIGFyZyBpbnN0YW5jZW9mIFZlcnRleFBhY2thZ2UgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBWZXJ0ZXhQYWNrYWdlIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlckRhdGEoIGFyZy5idWZmZXIoKSApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBhcmcgaW5zdGFuY2VvZiBXZWJHTEJ1ZmZlciApIHtcclxuICAgICAgICAgICAgICAgIC8vIFdlYkdMQnVmZmVyIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlciA9IGFyZztcclxuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgPSAoIG9wdGlvbnMuY291bnQgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5jb3VudCA6IDA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBcnJheSBvciBBcnJheUJ1ZmZlciBvciBudW1iZXIgYXJndW1lbnRcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyRGF0YSggYXJnICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc2V0IHN0cmlkZVxyXG4gICAgICAgIHRoaXMuc3RyaWRlID0gZ2V0U3RyaWRlKCB0aGlzLnBvaW50ZXJzICk7XHJcbiAgICAgICAgLy8gc2V0IGRyYXcgb2Zmc2V0IGFuZCBtb2RlXHJcbiAgICAgICAgdGhpcy5vZmZzZXQgPSAoIG9wdGlvbnMub2Zmc2V0ICE9PSB1bmRlZmluZWQgKSA/IG9wdGlvbnMub2Zmc2V0IDogMDtcclxuICAgICAgICB0aGlzLm1vZGUgPSAoIG9wdGlvbnMubW9kZSAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLm1vZGUgOiAnVFJJQU5HTEVTJztcclxuICAgIH1cclxuXHJcbiAgICBWZXJ0ZXhCdWZmZXIucHJvdG90eXBlLmJ1ZmZlckRhdGEgPSBmdW5jdGlvbiggYXJnICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgaWYgKCBhcmcgaW5zdGFuY2VvZiBBcnJheSApIHtcclxuICAgICAgICAgICAgLy8gY2FzdCBhcnJheXMgaW50byBidWZmZXJ2aWV3XHJcbiAgICAgICAgICAgIGFyZyA9IG5ldyBGbG9hdDMyQXJyYXkoIGFyZyApO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoICFVdGlsLmlzVHlwZWRBcnJheSggYXJnICkgJiYgdHlwZW9mIGFyZyAhPT0gJ251bWJlcicgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdWZXJ0ZXhCdWZmZXIgcmVxdWlyZXMgYW4gQXJyYXkgb3IgQXJyYXlCdWZmZXIsICcgK1xyXG4gICAgICAgICAgICAgICAgJ29yIGEgc2l6ZSBhcmd1bWVudCwgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICF0aGlzLmJ1ZmZlciApIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZ2V0IHRoZSB0b3RhbCBudW1iZXIgb2YgYXR0cmlidXRlIGNvbXBvbmVudHMgZnJvbSBwb2ludGVyc1xyXG4gICAgICAgIHZhciBudW1Db21wb25lbnRzID0gZ2V0TnVtQ29tcG9uZW50cyh0aGlzLnBvaW50ZXJzKTtcclxuICAgICAgICAvLyBzZXQgY291bnQgYmFzZWQgb24gc2l6ZSBvZiBidWZmZXIgYW5kIG51bWJlciBvZiBjb21wb25lbnRzXHJcbiAgICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY291bnQgPSBhcmcgLyBudW1Db21wb25lbnRzO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY291bnQgPSBhcmcubGVuZ3RoIC8gbnVtQ29tcG9uZW50cztcclxuICAgICAgICB9XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlciApO1xyXG4gICAgICAgIGdsLmJ1ZmZlckRhdGEoIGdsLkFSUkFZX0JVRkZFUiwgYXJnLCBnbC5TVEFUSUNfRFJBVyApO1xyXG4gICAgfTtcclxuXHJcbiAgICBWZXJ0ZXhCdWZmZXIucHJvdG90eXBlLmJ1ZmZlclN1YkRhdGEgPSBmdW5jdGlvbiggYXJyYXksIG9mZnNldCApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIGlmICggIXRoaXMuYnVmZmVyICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnVmVydGV4QnVmZmVyIGhhcyBub3QgYmVlbiBpbml0aWFsbHkgYnVmZmVyZWQsICcgK1xyXG4gICAgICAgICAgICAgICAgJ2NvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBhcnJheSBpbnN0YW5jZW9mIEFycmF5ICkge1xyXG4gICAgICAgICAgICBhcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoIGFycmF5ICk7XHJcbiAgICAgICAgfSBlbHNlIGlmICggIVV0aWwuaXNUeXBlZEFycmF5KCBhcnJheSApICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnVmVydGV4QnVmZmVyIHJlcXVpcmVzIGFuIEFycmF5IG9yIEFycmF5QnVmZmVyICcgK1xyXG4gICAgICAgICAgICAgICAgJ2FyZ3VtZW50LCBjb21tYW5kIGlnbm9yZWQuJyApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9mZnNldCA9ICggb2Zmc2V0ICE9PSB1bmRlZmluZWQgKSA/IG9mZnNldCA6IDA7XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlciApO1xyXG4gICAgICAgIGdsLmJ1ZmZlclN1YkRhdGEoIGdsLkFSUkFZX0JVRkZFUiwgb2Zmc2V0LCBhcnJheSApO1xyXG4gICAgfTtcclxuXHJcbiAgICBWZXJ0ZXhCdWZmZXIucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBpZiB0aGlzIGJ1ZmZlciBpcyBhbHJlYWR5IGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBfYm91bmRCdWZmZXIgPT09IHRoaXMgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbCxcclxuICAgICAgICAgICAgcG9pbnRlcnMgPSB0aGlzLnBvaW50ZXJzLFxyXG4gICAgICAgICAgICBwcmV2aW91c2x5RW5hYmxlZEF0dHJpYnV0ZXMgPSBfZW5hYmxlZEF0dHJpYnV0ZXMgfHwge30sXHJcbiAgICAgICAgICAgIHBvaW50ZXIsXHJcbiAgICAgICAgICAgIGluZGV4O1xyXG4gICAgICAgIC8vIGNhY2hlIHRoaXMgdmVydGV4IGJ1ZmZlclxyXG4gICAgICAgIF9ib3VuZEJ1ZmZlciA9IHRoaXM7XHJcbiAgICAgICAgX2VuYWJsZWRBdHRyaWJ1dGVzID0ge307XHJcbiAgICAgICAgLy8gYmluZCBidWZmZXJcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5BUlJBWV9CVUZGRVIsIHRoaXMuYnVmZmVyICk7XHJcbiAgICAgICAgZm9yICggaW5kZXggaW4gcG9pbnRlcnMgKSB7XHJcbiAgICAgICAgICAgIGlmICggcG9pbnRlcnMuaGFzT3duUHJvcGVydHkoIGluZGV4ICkgKSB7XHJcbiAgICAgICAgICAgICAgICBwb2ludGVyID0gdGhpcy5wb2ludGVyc1sgaW5kZXggXTtcclxuICAgICAgICAgICAgICAgIC8vIHNldCBhdHRyaWJ1dGUgcG9pbnRlclxyXG4gICAgICAgICAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlciggaW5kZXgsXHJcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRlci5zaXplLFxyXG4gICAgICAgICAgICAgICAgICAgIGdsWyBwb2ludGVyLnR5cGUgXSxcclxuICAgICAgICAgICAgICAgICAgICBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0cmlkZSxcclxuICAgICAgICAgICAgICAgICAgICBwb2ludGVyLm9mZnNldCApO1xyXG4gICAgICAgICAgICAgICAgLy8gZW5hYmxlZCBhdHRyaWJ1dGUgYXJyYXlcclxuICAgICAgICAgICAgICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KCBpbmRleCApO1xyXG4gICAgICAgICAgICAgICAgLy8gY2FjaGUgYXR0cmlidXRlXHJcbiAgICAgICAgICAgICAgICBfZW5hYmxlZEF0dHJpYnV0ZXNbIGluZGV4IF0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGZyb20gcHJldmlvdXMgbGlzdFxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIHByZXZpb3VzbHlFbmFibGVkQXR0cmlidXRlc1sgaW5kZXggXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBlbnN1cmUgbGVha2VkIGF0dHJpYnV0ZSBhcnJheXMgYXJlIGRpc2FibGVkXHJcbiAgICAgICAgZm9yICggaW5kZXggaW4gcHJldmlvdXNseUVuYWJsZWRBdHRyaWJ1dGVzICkge1xyXG4gICAgICAgICAgICBpZiAoIHByZXZpb3VzbHlFbmFibGVkQXR0cmlidXRlcy5oYXNPd25Qcm9wZXJ0eSggaW5kZXggKSApIHtcclxuICAgICAgICAgICAgICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheSggaW5kZXggKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgVmVydGV4QnVmZmVyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgaWYgKCBfYm91bmRCdWZmZXIgPT09IG51bGwgKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ05vIFZlcnRleEJ1ZmZlciBpcyBib3VuZCwgY29tbWFuZCBpZ25vcmVkLicgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHZhciBtb2RlID0gZ2xbIG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgJ1RSSUFOR0xFUycgXTtcclxuICAgICAgICB2YXIgb2Zmc2V0ID0gKCBvcHRpb25zLm9mZnNldCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLm9mZnNldCA6IHRoaXMub2Zmc2V0O1xyXG4gICAgICAgIHZhciBjb3VudCA9ICggb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmNvdW50IDogdGhpcy5jb3VudDtcclxuICAgICAgICBnbC5kcmF3QXJyYXlzKFxyXG4gICAgICAgICAgICBtb2RlLCAvLyBwcmltaXRpdmUgdHlwZVxyXG4gICAgICAgICAgICBvZmZzZXQsIC8vIG9mZnNldFxyXG4gICAgICAgICAgICBjb3VudCApOyAvLyBjb3VudFxyXG4gICAgfTtcclxuXHJcbiAgICBWZXJ0ZXhCdWZmZXIucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIGlmIG5vIGJ1ZmZlciBpcyBib3VuZCwgZXhpdCBlYXJseVxyXG4gICAgICAgIGlmICggX2JvdW5kQnVmZmVyID09PSBudWxsICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2wsXHJcbiAgICAgICAgICAgIHBvaW50ZXJzID0gdGhpcy5wb2ludGVycyxcclxuICAgICAgICAgICAgaW5kZXg7XHJcbiAgICAgICAgZm9yICggaW5kZXggaW4gcG9pbnRlcnMgKSB7XHJcbiAgICAgICAgICAgIGlmICggcG9pbnRlcnMuaGFzT3duUHJvcGVydHkoIGluZGV4ICkgKSB7XHJcbiAgICAgICAgICAgICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoIGluZGV4ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCBudWxsICk7XHJcbiAgICAgICAgX2JvdW5kQnVmZmVyID0gbnVsbDtcclxuICAgICAgICBfZW5hYmxlZEF0dHJpYnV0ZXMgPSB7fTtcclxuICAgIH07XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBWZXJ0ZXhCdWZmZXI7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgQ09NUE9ORU5UX1RZUEUgPSAnRkxPQVQnO1xyXG4gICAgdmFyIEJZVEVTX1BFUl9DT01QT05FTlQgPSA0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBpbnZhbGlkIGF0dHJpYnV0ZSBhcmd1bWVudHMuIEEgdmFsaWQgYXJndW1lbnRcclxuICAgICAqIG11c3QgYmUgYW4gQXJyYXkgb2YgbGVuZ3RoID4gMCBrZXkgYnkgYSBzdHJpbmcgcmVwcmVzZW50aW5nIGFuIGludC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcyAtIFRoZSBtYXAgb2YgdmVydGV4IGF0dHJpYnV0ZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0FycmF5fSBUaGUgdmFsaWQgYXJyYXkgb2YgYXJndW1lbnRzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZUF0dHJpYnV0ZU1hcCggYXR0cmlidXRlcyApIHtcclxuICAgICAgICB2YXIgZ29vZEF0dHJpYnV0ZXMgPSBbXTtcclxuICAgICAgICBPYmplY3Qua2V5cyggYXR0cmlidXRlcyApLmZvckVhY2goIGZ1bmN0aW9uKCBrZXkgKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KCBrZXksIDEwICk7XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIHRoYXQga2V5IGlzIGFuIHZhbGlkIGludGVnZXJcclxuICAgICAgICAgICAgaWYgKCBpc05hTiggaW5kZXggKSApIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignQXR0cmlidXRlIGluZGV4IGAnICsga2V5ICsgJ2AgZG9lcyBub3QgJyArXHJcbiAgICAgICAgICAgICAgICAgICAgJ3JlcHJlc2VudCBhbiBpbnRlZ2VyLCBkaXNjYXJkaW5nIGF0dHJpYnV0ZSBwb2ludGVyLicpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciB2ZXJ0aWNlcyA9IGF0dHJpYnV0ZXNba2V5XTtcclxuICAgICAgICAgICAgLy8gZW5zdXJlIGF0dHJpYnV0ZSBpcyB2YWxpZFxyXG4gICAgICAgICAgICBpZiAoIHZlcnRpY2VzICYmXHJcbiAgICAgICAgICAgICAgICB2ZXJ0aWNlcyBpbnN0YW5jZW9mIEFycmF5ICYmXHJcbiAgICAgICAgICAgICAgICB2ZXJ0aWNlcy5sZW5ndGggPiAwICkge1xyXG4gICAgICAgICAgICAgICAgLy8gYWRkIGF0dHJpYnV0ZSBkYXRhIGFuZCBpbmRleFxyXG4gICAgICAgICAgICAgICAgZ29vZEF0dHJpYnV0ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4LFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHZlcnRpY2VzXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybiggJ0Vycm9yIHBhcnNpbmcgYXR0cmlidXRlIG9mIGluZGV4IGAnICsga2V5ICtcclxuICAgICAgICAgICAgICAgICAgICAnYCwgYXR0cmlidXRlIGRpc2NhcmRlZC4nICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBzb3J0IGF0dHJpYnV0ZXMgYXNjZW5kaW5nIGJ5IGluZGV4XHJcbiAgICAgICAgZ29vZEF0dHJpYnV0ZXMuc29ydChmdW5jdGlvbihhLGIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGEuaW5kZXggLSBiLmluZGV4O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBnb29kQXR0cmlidXRlcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBjb21wb25lbnQncyBieXRlIHNpemUuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IGNvbXBvbmVudCAtIFRoZSBjb21wb25lbnQgdG8gbWVhc3VyZS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7aW50ZWdlcn0gVGhlIGJ5dGUgc2l6ZSBvZiB0aGUgY29tcG9uZW50LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRDb21wb25lbnRTaXplKCBjb21wb25lbnQgKSB7XHJcbiAgICAgICAgLy8gY2hlY2sgaWYgdmVjdG9yXHJcbiAgICAgICAgaWYgKCBjb21wb25lbnQueCAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAvLyAxIGNvbXBvbmVudCB2ZWN0b3JcclxuICAgICAgICAgICAgaWYgKCBjb21wb25lbnQueSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgLy8gMiBjb21wb25lbnQgdmVjdG9yXHJcbiAgICAgICAgICAgICAgICBpZiAoIGNvbXBvbmVudC56ICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gMyBjb21wb25lbnQgdmVjdG9yXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjb21wb25lbnQudyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyA0IGNvbXBvbmVudCB2ZWN0b3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDQ7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGNoZWNrIGlmIGFycmF5XHJcbiAgICAgICAgaWYgKCBjb21wb25lbnQgaW5zdGFuY2VvZiBBcnJheSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudC5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsY3VsYXRlcyB0aGUgdHlwZSwgc2l6ZSwgYW5kIG9mZnNldCBmb3IgZWFjaCBhdHRyaWJ1dGUgaW4gdGhlXHJcbiAgICAgKiBhdHRyaWJ1dGUgYXJyYXkgYWxvbmcgd2l0aCB0aGUgbGVuZ3RoIGFuZCBzdHJpZGUgb2YgdGhlIHBhY2thZ2UuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtWZXJ0ZXhQYWNrYWdlfSB2ZXJ0ZXhQYWNrYWdlIC0gVGhlIFZlcnRleFBhY2thZ2Ugb2JqZWN0LlxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gYXR0cmlidXRlcyAtIFRoZSBhcnJheSBvZiB2ZXJ0ZXggYXR0cmlidXRlcy5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc2V0UG9pbnRlcnNBbmRTdHJpZGUoIHZlcnRleFBhY2thZ2UsIGF0dHJpYnV0ZXMgKSB7XHJcbiAgICAgICAgdmFyIHNob3J0ZXN0QXJyYXkgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIHZhciBvZmZzZXQgPSAwO1xyXG4gICAgICAgIC8vIGNsZWFyIHBvaW50ZXJzXHJcbiAgICAgICAgdmVydGV4UGFja2FnZS5wb2ludGVycyA9IHt9O1xyXG4gICAgICAgIC8vIGZvciBlYWNoIGF0dHJpYnV0ZVxyXG4gICAgICAgIGF0dHJpYnV0ZXMuZm9yRWFjaCggZnVuY3Rpb24oIHZlcnRpY2VzICkge1xyXG4gICAgICAgICAgICAvLyBzZXQgc2l6ZSB0byBudW1iZXIgb2YgY29tcG9uZW50cyBpbiB0aGUgYXR0cmlidXRlXHJcbiAgICAgICAgICAgIHZhciBzaXplID0gZ2V0Q29tcG9uZW50U2l6ZSggdmVydGljZXMuZGF0YVswXSApO1xyXG4gICAgICAgICAgICAvLyBsZW5ndGggb2YgdGhlIHBhY2thZ2Ugd2lsbCBiZSB0aGUgc2hvcnRlc3QgYXR0cmlidXRlIGFycmF5IGxlbmd0aFxyXG4gICAgICAgICAgICBzaG9ydGVzdEFycmF5ID0gTWF0aC5taW4oIHNob3J0ZXN0QXJyYXksIHZlcnRpY2VzLmRhdGEubGVuZ3RoICk7XHJcbiAgICAgICAgICAgIC8vIHN0b3JlIHBvaW50ZXIgdW5kZXIgaW5kZXhcclxuICAgICAgICAgICAgdmVydGV4UGFja2FnZS5wb2ludGVyc1sgdmVydGljZXMuaW5kZXggXSA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGUgOiBDT01QT05FTlRfVFlQRSxcclxuICAgICAgICAgICAgICAgIHNpemUgOiBzaXplLFxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0IDogb2Zmc2V0ICogQllURVNfUEVSX0NPTVBPTkVOVFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBhY2N1bXVsYXRlIGF0dHJpYnV0ZSBvZmZzZXRcclxuICAgICAgICAgICAgb2Zmc2V0ICs9IHNpemU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gc2V0IHN0cmlkZSB0byB0b3RhbCBvZmZzZXRcclxuICAgICAgICB2ZXJ0ZXhQYWNrYWdlLnN0cmlkZSA9IG9mZnNldCAqIEJZVEVTX1BFUl9DT01QT05FTlQ7XHJcbiAgICAgICAgLy8gc2V0IGxlbmd0aCBvZiBwYWNrYWdlIHRvIHRoZSBzaG9ydGVzdCBhdHRyaWJ1dGUgYXJyYXkgbGVuZ3RoXHJcbiAgICAgICAgdmVydGV4UGFja2FnZS5sZW5ndGggPSBzaG9ydGVzdEFycmF5O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFZlcnRleFBhY2thZ2UoIGF0dHJpYnV0ZXMgKSB7XHJcbiAgICAgICAgaWYgKCBhdHRyaWJ1dGVzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldCggYXR0cmlidXRlcyApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoMCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9pbnRlcnMgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgVmVydGV4UGFja2FnZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oIGF0dHJpYnV0ZU1hcCApIHtcclxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgLy8gcmVtb3ZlIGJhZCBhdHRyaWJ1dGVzXHJcbiAgICAgICAgdmFyIGF0dHJpYnV0ZXMgPSBwYXJzZUF0dHJpYnV0ZU1hcCggYXR0cmlidXRlTWFwICk7XHJcbiAgICAgICAgLy8gc2V0IGF0dHJpYnV0ZSBwb2ludGVycyBhbmQgc3RyaWRlXHJcbiAgICAgICAgc2V0UG9pbnRlcnNBbmRTdHJpZGUoIHRoaXMsIGF0dHJpYnV0ZXMgKTtcclxuICAgICAgICAvLyBzZXQgc2l6ZSBvZiBkYXRhIHZlY3RvclxyXG4gICAgICAgIHRoaXMuZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoIHRoaXMubGVuZ3RoICogKCB0aGlzLnN0cmlkZSAvIEJZVEVTX1BFUl9DT01QT05FTlQgKSApO1xyXG4gICAgICAgIC8vIGZvciBlYWNoIHZlcnRleCBhdHRyaWJ1dGUgYXJyYXlcclxuICAgICAgICBhdHRyaWJ1dGVzLmZvckVhY2goIGZ1bmN0aW9uKCB2ZXJ0aWNlcyApIHtcclxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBwb2ludGVyXHJcbiAgICAgICAgICAgIHZhciBwb2ludGVyID0gdGhhdC5wb2ludGVyc1sgdmVydGljZXMuaW5kZXggXTtcclxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBwb2ludGVycyBvZmZzZXRcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHBvaW50ZXIub2Zmc2V0IC8gQllURVNfUEVSX0NPTVBPTkVOVDtcclxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBwYWNrYWdlIHN0cmlkZVxyXG4gICAgICAgICAgICB2YXIgc3RyaWRlID0gdGhhdC5zdHJpZGUgLyBCWVRFU19QRVJfQ09NUE9ORU5UO1xyXG4gICAgICAgICAgICAvLyBmb3IgZWFjaCB2ZXJ0ZXhcclxuICAgICAgICAgICAgdmFyIHZlcnRleCwgaSwgajtcclxuICAgICAgICAgICAgZm9yICggaT0wOyBpPHRoYXQubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICB2ZXJ0ZXggPSB2ZXJ0aWNlcy5kYXRhW2ldO1xyXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBpbmRleCBpbiB0aGUgYnVmZmVyIHRvIHRoZSBwYXJ0aWN1bGFyIHZlcnRleFxyXG4gICAgICAgICAgICAgICAgaiA9IG9mZnNldCArICggc3RyaWRlICogaSApO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICggcG9pbnRlci5zaXplICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2pdID0gKCB2ZXJ0ZXgueCAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgueCA6IHZlcnRleFswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2orMV0gPSAoIHZlcnRleC55ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC55IDogdmVydGV4WzFdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVtqXSA9ICggdmVydGV4LnggIT09IHVuZGVmaW5lZCApID8gdmVydGV4LnggOiB2ZXJ0ZXhbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVtqKzFdID0gKCB2ZXJ0ZXgueSAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgueSA6IHZlcnRleFsxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2orMl0gPSAoIHZlcnRleC56ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC56IDogdmVydGV4WzJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVtqXSA9ICggdmVydGV4LnggIT09IHVuZGVmaW5lZCApID8gdmVydGV4LnggOiB2ZXJ0ZXhbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVtqKzFdID0gKCB2ZXJ0ZXgueSAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgueSA6IHZlcnRleFsxXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kYXRhW2orMl0gPSAoIHZlcnRleC56ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC56IDogdmVydGV4WzJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmRhdGFbaiszXSA9ICggdmVydGV4LncgIT09IHVuZGVmaW5lZCApID8gdmVydGV4LncgOiB2ZXJ0ZXhbM107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdmVydGV4LnggIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVtqXSA9IHZlcnRleC54O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCB2ZXJ0ZXhbMF0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVtqXSA9IHZlcnRleFswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGF0YVtqXSA9IHZlcnRleDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBWZXJ0ZXhQYWNrYWdlLnByb3RvdHlwZS5idWZmZXIgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhO1xyXG4gICAgfTtcclxuXHJcbiAgICBWZXJ0ZXhQYWNrYWdlLnByb3RvdHlwZS5hdHRyaWJ1dGVQb2ludGVycyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnBvaW50ZXJzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFZlcnRleFBhY2thZ2U7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBXZWJHTENvbnRleHQgPSByZXF1aXJlKCcuL1dlYkdMQ29udGV4dCcpLFxyXG4gICAgICAgIFN0YWNrID0gcmVxdWlyZSgnLi4vdXRpbC9TdGFjaycpLFxyXG4gICAgICAgIF9zdGFjayA9IG5ldyBTdGFjaygpO1xyXG5cclxuICAgIGZ1bmN0aW9uIHNldCggdmlld3BvcnQsIHgsIHksIHdpZHRoLCBoZWlnaHQgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdmlld3BvcnQuZ2w7XHJcbiAgICAgICAgeCA9ICggeCAhPT0gdW5kZWZpbmVkICkgPyB4IDogdmlld3BvcnQueDtcclxuICAgICAgICB5ID0gKCB5ICE9PSB1bmRlZmluZWQgKSA/IHkgOiB2aWV3cG9ydC55O1xyXG4gICAgICAgIHdpZHRoID0gKCB3aWR0aCAhPT0gdW5kZWZpbmVkICkgPyB3aWR0aCA6IHZpZXdwb3J0LndpZHRoO1xyXG4gICAgICAgIGhlaWdodCA9ICggaGVpZ2h0ICE9PSB1bmRlZmluZWQgKSA/IGhlaWdodCA6IHZpZXdwb3J0LmhlaWdodDtcclxuICAgICAgICBnbC52aWV3cG9ydCggeCwgeSwgd2lkdGgsIGhlaWdodCApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIFZpZXdwb3J0KCBzcGVjICkge1xyXG4gICAgICAgIHNwZWMgPSBzcGVjIHx8IHt9O1xyXG4gICAgICAgIHRoaXMuZ2wgPSBXZWJHTENvbnRleHQuZ2V0KCk7XHJcbiAgICAgICAgLy8gc2V0IHNpemVcclxuICAgICAgICB0aGlzLnJlc2l6ZShcclxuICAgICAgICAgICAgc3BlYy53aWR0aCB8fCB0aGlzLmdsLmNhbnZhcy53aWR0aCxcclxuICAgICAgICAgICAgc3BlYy5oZWlnaHQgfHwgdGhpcy5nbC5jYW52YXMuaGVpZ2h0ICk7XHJcbiAgICAgICAgLy8gc2V0IG9mZnNldFxyXG4gICAgICAgIHRoaXMub2Zmc2V0KFxyXG4gICAgICAgICAgICBzcGVjLnggIT09IHVuZGVmaW5lZCA/IHNwZWMueCA6IDAsXHJcbiAgICAgICAgICAgIHNwZWMueSAhPT0gdW5kZWZpbmVkID8gc3BlYy55IDogMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGVzIHRoZSB2aWV3cG9ydCBvYmplY3RzIHdpZHRoIGFuZCBoZWlnaHQuXHJcbiAgICAgKiBAbWVtYmVyb2YgVmlld3BvcnRcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Vmlld3BvcnR9IFRoZSB2aWV3cG9ydCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVmlld3BvcnQucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKCB3aWR0aCwgaGVpZ2h0ICkge1xyXG4gICAgICAgIGlmICggd2lkdGggIT09IHVuZGVmaW5lZCAmJiBoZWlnaHQgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgdGhpcy5nbC5jYW52YXMud2lkdGggPSB3aWR0aCArIHRoaXMueDtcclxuICAgICAgICAgICAgdGhpcy5nbC5jYW52YXMuaGVpZ2h0ID0gaGVpZ2h0ICsgdGhpcy55O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGVzIHRoZSB2aWV3cG9ydCBvYmplY3RzIHggYW5kIHkgb2Zmc2V0cy5cclxuICAgICAqIEBtZW1iZXJvZiBWaWV3cG9ydFxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtWaWV3cG9ydH0gVGhlIHZpZXdwb3J0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBWaWV3cG9ydC5wcm90b3R5cGUub2Zmc2V0ID0gZnVuY3Rpb24oIHgsIHkgKSB7XHJcbiAgICAgICAgaWYgKCB4ICE9PSB1bmRlZmluZWQgJiYgeSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgICAgICB0aGlzLmdsLmNhbnZhcy53aWR0aCA9IHRoaXMud2lkdGggKyB4O1xyXG4gICAgICAgICAgICB0aGlzLmdsLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodCArIHk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHZpZXdwb3J0IG9iamVjdCBhbmQgcHVzaGVzIGl0IHRvIHRoZSBmcm9udCBvZiB0aGUgc3RhY2suXHJcbiAgICAgKiBAbWVtYmVyb2YgVmlld3BvcnRcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Vmlld3BvcnR9IFRoZSB2aWV3cG9ydCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgIFZpZXdwb3J0LnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oIHgsIHksIHdpZHRoLCBoZWlnaHQgKSB7XHJcbiAgICAgICAgX3N0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICB2aWV3cG9ydDogdGhpcyxcclxuICAgICAgICAgICAgeDogeCxcclxuICAgICAgICAgICAgeTogeSxcclxuICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNldCggdGhpcywgeCwgeSwgd2lkdGgsIGhlaWdodCApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBvcHMgY3VycmVudCB0aGUgdmlld3BvcnQgb2JqZWN0IGFuZCBzZXRzIHRoZSB2aWV3cG9ydCBiZW5lYXRoIGl0LlxyXG4gICAgICogQG1lbWJlcm9mIFZpZXdwb3J0XHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1ZpZXdwb3J0fSBUaGUgdmlld3BvcnQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgICBWaWV3cG9ydC5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHRvcDtcclxuICAgICAgICBfc3RhY2sucG9wKCk7XHJcbiAgICAgICAgdG9wID0gX3N0YWNrLnRvcCgpO1xyXG4gICAgICAgIGlmICggdG9wICkge1xyXG4gICAgICAgICAgICBzZXQoIHRvcC52aWV3cG9ydCwgdG9wLngsIHRvcC55LCB0b3Aud2lkdGgsIHRvcC5oZWlnaHQgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZXQoIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gVmlld3BvcnQ7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBfYm91bmRDb250ZXh0ID0gbnVsbCxcclxuICAgICAgICBfY29udGV4dHNCeUlkID0ge30sXHJcbiAgICAgICAgRVhURU5TSU9OUyA9IFtcclxuICAgICAgICAgICAgLy8gcmF0aWZpZWRcclxuICAgICAgICAgICAgJ09FU190ZXh0dXJlX2Zsb2F0JyxcclxuICAgICAgICAgICAgJ09FU190ZXh0dXJlX2hhbGZfZmxvYXQnLFxyXG4gICAgICAgICAgICAnV0VCR0xfbG9zZV9jb250ZXh0JyxcclxuICAgICAgICAgICAgJ09FU19zdGFuZGFyZF9kZXJpdmF0aXZlcycsXHJcbiAgICAgICAgICAgICdPRVNfdmVydGV4X2FycmF5X29iamVjdCcsXHJcbiAgICAgICAgICAgICdXRUJHTF9kZWJ1Z19yZW5kZXJlcl9pbmZvJyxcclxuICAgICAgICAgICAgJ1dFQkdMX2RlYnVnX3NoYWRlcnMnLFxyXG4gICAgICAgICAgICAnV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX3MzdGMnLFxyXG4gICAgICAgICAgICAnV0VCR0xfZGVwdGhfdGV4dHVyZScsXHJcbiAgICAgICAgICAgICdPRVNfZWxlbWVudF9pbmRleF91aW50JyxcclxuICAgICAgICAgICAgJ0VYVF90ZXh0dXJlX2ZpbHRlcl9hbmlzb3Ryb3BpYycsXHJcbiAgICAgICAgICAgICdXRUJHTF9kcmF3X2J1ZmZlcnMnLFxyXG4gICAgICAgICAgICAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycsXHJcbiAgICAgICAgICAgICdPRVNfdGV4dHVyZV9mbG9hdF9saW5lYXInLFxyXG4gICAgICAgICAgICAnT0VTX3RleHR1cmVfaGFsZl9mbG9hdF9saW5lYXInLFxyXG4gICAgICAgICAgICAvLyBjb21tdW5pdHlcclxuICAgICAgICAgICAgJ1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9hdGMnLFxyXG4gICAgICAgICAgICAnV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX3B2cnRjJyxcclxuICAgICAgICAgICAgJ0VYVF9jb2xvcl9idWZmZXJfaGFsZl9mbG9hdCcsXHJcbiAgICAgICAgICAgICdXRUJHTF9jb2xvcl9idWZmZXJfZmxvYXQnLFxyXG4gICAgICAgICAgICAnRVhUX2ZyYWdfZGVwdGgnLFxyXG4gICAgICAgICAgICAnRVhUX3NSR0InLFxyXG4gICAgICAgICAgICAnV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX2V0YzEnLFxyXG4gICAgICAgICAgICAnRVhUX2JsZW5kX21pbm1heCcsXHJcbiAgICAgICAgICAgICdFWFRfc2hhZGVyX3RleHR1cmVfbG9kJ1xyXG4gICAgICAgIF07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgQ2FudmFzIGVsZW1lbnQgb2JqZWN0IGZyb20gZWl0aGVyIGFuIGV4aXN0aW5nIG9iamVjdCwgb3JcclxuICAgICAqIGlkZW50aWZpY2F0aW9uIHN0cmluZy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fFN0cmluZ30gYXJnIC0gVGhlIENhbnZhc1xyXG4gICAgICogICAgIG9iamVjdCBvciBDYW52YXMgaWRlbnRpZmljYXRpb24gc3RyaW5nLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtIVE1MQ2FudmFzRWxlbWVudH0gVGhlIENhbnZhcyBlbGVtZW50IG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0Q2FudmFzKCBhcmcgKSB7XHJcbiAgICAgICAgaWYgKCBhcmcgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50IHx8XHJcbiAgICAgICAgICAgICBhcmcgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGFyZztcclxuICAgICAgICB9IGVsc2UgaWYgKCB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBhcmcgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdHRlbXB0cyB0byByZXRyZWl2ZSBhIHdyYXBwZWQgV2ViR0xSZW5kZXJpbmdDb250ZXh0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IFRoZSBDYW52YXMgZWxlbWVudCBvYmplY3QgdG8gY3JlYXRlIHRoZSBjb250ZXh0IHVuZGVyLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBjb250ZXh0IHdyYXBwZXIuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldENvbnRleHRXcmFwcGVyKCBhcmcgKSB7XHJcbiAgICAgICAgaWYgKCAhYXJnICkge1xyXG4gICAgICAgICAgICBpZiAoIF9ib3VuZENvbnRleHQgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gbGFzdCBib3VuZCBjb250ZXh0XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gX2JvdW5kQ29udGV4dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBnZXRDYW52YXMoIGFyZyApO1xyXG4gICAgICAgICAgICBpZiAoIGNhbnZhcyApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBfY29udGV4dHNCeUlkWyBjYW52YXMuaWQgXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBubyBib3VuZCBjb250ZXh0IG9yIGFyZ3VtZW50XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdHRlbXB0cyB0byBsb2FkIGFsbCBrbm93biBleHRlbnNpb25zIGZvciBhIHByb3ZpZGVkXHJcbiAgICAgKiBXZWJHTFJlbmRlcmluZ0NvbnRleHQuIFN0b3JlcyB0aGUgcmVzdWx0cyBpbiB0aGUgY29udGV4dCB3cmFwcGVyIGZvclxyXG4gICAgICogbGF0ZXIgcXVlcmllcy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFdyYXBwZXIgLSBUaGUgY29udGV4dCB3cmFwcGVyLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBsb2FkRXh0ZW5zaW9ucyggY29udGV4dFdyYXBwZXIgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gY29udGV4dFdyYXBwZXIuZ2wsXHJcbiAgICAgICAgICAgIGV4dGVuc2lvbixcclxuICAgICAgICAgICAgaTtcclxuICAgICAgICBmb3IgKCBpPTA7IGk8RVhURU5TSU9OUy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgZXh0ZW5zaW9uID0gRVhURU5TSU9OU1tpXTtcclxuICAgICAgICAgICAgY29udGV4dFdyYXBwZXIuZXh0ZW5zaW9uc1sgZXh0ZW5zaW9uIF0gPSBnbC5nZXRFeHRlbnNpb24oIGV4dGVuc2lvbiApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEF0dGVtcHRzIHRvIGNyZWF0ZSBhIFdlYkdMUmVuZGVyaW5nQ29udGV4dCB3cmFwcGVkIGluc2lkZSBhbiBvYmplY3Qgd2hpY2hcclxuICAgICAqIHdpbGwgYWxzbyBzdG9yZSB0aGUgZXh0ZW5zaW9uIHF1ZXJ5IHJlc3VsdHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gVGhlIENhbnZhcyBlbGVtZW50IG9iamVjdCB0byBjcmVhdGUgdGhlIGNvbnRleHQgdW5kZXIuXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH19IG9wdGlvbnMgLSBQYXJhbWV0ZXJzIHRvIHRoZSB3ZWJnbCBjb250ZXh0LCBvbmx5IHVzZWQgZHVyaW5nIGluc3RhbnRpYXRpb24uIE9wdGlvbmFsLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBjb250ZXh0IHdyYXBwZXIuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNvbnRleHRXcmFwcGVyKCBjYW52YXMsIG9wdGlvbnMgKSB7XHJcbiAgICAgICAgdmFyIGNvbnRleHRXcmFwcGVyLFxyXG4gICAgICAgICAgICBnbDtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBnZXQgV2ViR0wgY29udGV4dCwgZmFsbGJhY2sgdG8gZXhwZXJpbWVudGFsXHJcbiAgICAgICAgICAgIGdsID0gY2FudmFzLmdldENvbnRleHQoICd3ZWJnbCcsIG9wdGlvbnMgKSB8fCBjYW52YXMuZ2V0Q29udGV4dCggJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIG9wdGlvbnMgKTtcclxuICAgICAgICAgICAgLy8gd3JhcCBjb250ZXh0XHJcbiAgICAgICAgICAgIGNvbnRleHRXcmFwcGVyID0ge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGNhbnZhcy5pZCxcclxuICAgICAgICAgICAgICAgIGdsOiBnbCxcclxuICAgICAgICAgICAgICAgIGV4dGVuc2lvbnM6IHt9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vIGxvYWQgV2ViR0wgZXh0ZW5zaW9uc1xyXG4gICAgICAgICAgICBsb2FkRXh0ZW5zaW9ucyggY29udGV4dFdyYXBwZXIgKTtcclxuICAgICAgICAgICAgLy8gYWRkIGNvbnRleHQgd3JhcHBlciB0byBtYXBcclxuICAgICAgICAgICAgX2NvbnRleHRzQnlJZFsgY2FudmFzLmlkIF0gPSBjb250ZXh0V3JhcHBlcjtcclxuICAgICAgICAgICAgLy8gYmluZCB0aGUgY29udGV4dFxyXG4gICAgICAgICAgICBfYm91bmRDb250ZXh0ID0gY29udGV4dFdyYXBwZXI7XHJcbiAgICAgICAgfSBjYXRjaCggZXJyICkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCBlcnIubWVzc2FnZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoICFnbCApIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ1VuYWJsZSB0byBpbml0aWFsaXplIFdlYkdMLiBZb3VyIGJyb3dzZXIgbWF5IG5vdCAnICtcclxuICAgICAgICAgICAgICAgICdzdXBwb3J0IGl0LicgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNvbnRleHRXcmFwcGVyO1xyXG4gICAgfVxyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBCaW5kcyBhIHNwZWNpZmljIFdlYkdMIGNvbnRleHQgYXMgdGhlIGFjdGl2ZSBjb250ZXh0LiBUaGlzIGNvbnRleHRcclxuICAgICAgICAgKiB3aWxsIGJlIHVzZWQgZm9yIGFsbCBjb2RlIC93ZWJnbC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR8U3RyaW5nfSBhcmcgLSBUaGUgQ2FudmFzIG9iamVjdCBvciBDYW52YXMgaWRlbnRpZmljYXRpb24gc3RyaW5nLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHJldHVybnMge1dlYkdMQ29udGV4dH0gVGhpcyBuYW1lc3BhY2UsIHVzZWQgZm9yIGNoYWluaW5nLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGJpbmQ6IGZ1bmN0aW9uKCBhcmcgKSB7XHJcbiAgICAgICAgICAgIHZhciB3cmFwcGVyID0gZ2V0Q29udGV4dFdyYXBwZXIoIGFyZyApO1xyXG4gICAgICAgICAgICBpZiAoIHdyYXBwZXIgKSB7XHJcbiAgICAgICAgICAgICAgICBfYm91bmRDb250ZXh0ID0gd3JhcHBlcjtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdObyBjb250ZXh0IGV4aXN0cyBmb3IgcHJvdmlkZWQgYXJndW1lbnQgYCcgKyBhcmcgK1xyXG4gICAgICAgICAgICAgICAgJ2AsIGNvbW1hbmQgaWdub3JlZC4nICk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENyZWF0ZXMgYSBuZXcgb3IgcmV0cmVpdmVzIGFuIGV4aXN0aW5nIFdlYkdMIGNvbnRleHQgZm9yIGEgcHJvdmlkZWRcclxuICAgICAgICAgKiBjYW52YXMgb2JqZWN0LiBEdXJpbmcgY3JlYXRpb24gYXR0ZW1wdHMgdG8gbG9hZCBhbGwgZXh0ZW5zaW9ucyBmb3VuZFxyXG4gICAgICAgICAqIGF0OiBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS93ZWJnbC9leHRlbnNpb25zLy4gSWYgbm9cclxuICAgICAgICAgKiBhcmd1bWVudCBpcyBwcm92aWRlZCBpdCB3aWxsIGF0dGVtcHQgdG8gcmV0dXJuIHRoZSBjdXJyZW50bHkgYm91bmRcclxuICAgICAgICAgKiBjb250ZXh0LiBJZiBubyBjb250ZXh0IGlzIGJvdW5kLCBpdCB3aWxsIHJldHVybiAnbnVsbCcuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fFN0cmluZ30gYXJnIC0gVGhlIENhbnZhcyBvYmplY3Qgb3IgQ2FudmFzIGlkZW50aWZpY2F0aW9uIHN0cmluZy4gT3B0aW9uYWwuXHJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9fSBvcHRpb25zIC0gUGFyYW1ldGVycyB0byB0aGUgd2ViZ2wgY29udGV4dCwgb25seSB1c2VkIGR1cmluZyBpbnN0YW50aWF0aW9uLiBPcHRpb25hbC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IFRoZSBXZWJHTFJlbmRlcmluZ0NvbnRleHQgY29udGV4dCBvYmplY3QuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiggYXJnLCBvcHRpb25zICkge1xyXG4gICAgICAgICAgICB2YXIgd3JhcHBlciA9IGdldENvbnRleHRXcmFwcGVyKCBhcmcgKTtcclxuICAgICAgICAgICAgaWYgKCB3cmFwcGVyICkge1xyXG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSBuYXRpdmUgV2ViR0xSZW5kZXJpbmdDb250ZXh0XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gd3JhcHBlci5nbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBnZXQgY2FudmFzIGVsZW1lbnRcclxuICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGdldENhbnZhcyggYXJnICk7XHJcbiAgICAgICAgICAgIC8vIHRyeSB0byBmaW5kIG9yIGNyZWF0ZSBjb250ZXh0XHJcbiAgICAgICAgICAgIGlmICggIWNhbnZhcyB8fCAhY3JlYXRlQ29udGV4dFdyYXBwZXIoIGNhbnZhcywgb3B0aW9ucyApICkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvciggJ0NvbnRleHQgY291bGQgbm90IGJlIGZvdW5kIG9yIGNyZWF0ZWQgZm9yICcgK1xyXG4gICAgICAgICAgICAgICAgICAgICdhcmd1bWVudCBvZiB0eXBlYCcgKyAoIHR5cGVvZiBhcmcgKSArICdgLCByZXR1cm5pbmcgYG51bGxgLicgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHJldHVybiBjb250ZXh0XHJcbiAgICAgICAgICAgIHJldHVybiBfY29udGV4dHNCeUlkWyBjYW52YXMuaWQgXS5nbDtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCBzdXBwb3J0ZWQgZXh0ZW5zaW9ucyBmb3IgdGhlIHByb3ZpZGVkIGNhbnZhc1xyXG4gICAgICAgICAqIG9iamVjdC4gSWYgbm8gYXJndW1lbnQgaXMgcHJvdmlkZWQgaXQgd2lsbCBhdHRlbXB0IHRvIHF1ZXJ5IHRoZVxyXG4gICAgICAgICAqIGN1cnJlbnRseSBib3VuZCBjb250ZXh0LiBJZiBubyBjb250ZXh0IGlzIGJvdW5kLCBpdCB3aWxsIHJldHVyblxyXG4gICAgICAgICAqIGFuIGVtcHR5IGFycmF5LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudHxTdHJpbmd9IGFyZyAtIFRoZSBDYW52YXMgb2JqZWN0IG9yIENhbnZhcyBpZGVudGlmaWNhdGlvbiBzdHJpbmcuIE9wdGlvbmFsLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHJldHVybnMge0FycmF5fSBBbGwgc3VwcG9ydGVkIGV4dGVuc2lvbnMuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc3VwcG9ydGVkRXh0ZW5zaW9uczogZnVuY3Rpb24oIGFyZyApIHtcclxuICAgICAgICAgICAgdmFyIHdyYXBwZXIgPSBnZXRDb250ZXh0V3JhcHBlciggYXJnICk7XHJcbiAgICAgICAgICAgIGlmICggd3JhcHBlciApIHtcclxuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb25zID0gd3JhcHBlci5leHRlbnNpb25zO1xyXG4gICAgICAgICAgICAgICAgdmFyIHN1cHBvcnRlZCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGtleSBpbiBleHRlbnNpb25zICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZXh0ZW5zaW9ucy5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgJiYgZXh0ZW5zaW9uc1sga2V5IF0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1cHBvcnRlZC5wdXNoKCBrZXkgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VwcG9ydGVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIGNvbnRleHQgaXMgY3VycmVudGx5IGJvdW5kIG9yIHdhcyBwcm92aWRlZCwgJyArXHJcbiAgICAgICAgICAgICAgICAncmV0dXJuaW5nIGFuIGVtcHR5IGFycmF5LicpO1xyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBhbGwgdW5zdXBwb3J0ZWQgZXh0ZW5zaW9ucyBmb3IgdGhlIHByb3ZpZGVkIGNhbnZhc1xyXG4gICAgICAgICAqIG9iamVjdC4gSWYgbm8gYXJndW1lbnQgaXMgcHJvdmlkZWQgaXQgd2lsbCBhdHRlbXB0IHRvIHF1ZXJ5IHRoZVxyXG4gICAgICAgICAqIGN1cnJlbnRseSBib3VuZCBjb250ZXh0LiBJZiBubyBjb250ZXh0IGlzIGJvdW5kLCBpdCB3aWxsIHJldHVyblxyXG4gICAgICAgICAqIGFuIGVtcHR5IGFycmF5LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudHxTdHJpbmd9IGFyZyAtIFRoZSBDYW52YXMgb2JqZWN0IG9yIENhbnZhcyBpZGVudGlmaWNhdGlvbiBzdHJpbmcuIE9wdGlvbmFsLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHJldHVybnMge0FycmF5fSBBbGwgdW5zdXBwb3J0ZWQgZXh0ZW5zaW9ucy5cclxuICAgICAgICAgKi9cclxuICAgICAgICB1bnN1cHBvcnRlZEV4dGVuc2lvbnM6IGZ1bmN0aW9uKCBhcmcgKSB7XHJcbiAgICAgICAgICAgIHZhciB3cmFwcGVyID0gZ2V0Q29udGV4dFdyYXBwZXIoIGFyZyApO1xyXG4gICAgICAgICAgICBpZiAoIHdyYXBwZXIgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXh0ZW5zaW9ucyA9IHdyYXBwZXIuZXh0ZW5zaW9ucztcclxuICAgICAgICAgICAgICAgIHZhciB1bnN1cHBvcnRlZCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGtleSBpbiBleHRlbnNpb25zICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZXh0ZW5zaW9ucy5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgJiYgIWV4dGVuc2lvbnNbIGtleSBdICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1bnN1cHBvcnRlZC5wdXNoKCBrZXkgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5zdXBwb3J0ZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignTm8gY29udGV4dCBpcyBjdXJyZW50bHkgYm91bmQgb3Igd2FzIHByb3ZpZGVkLCAnICtcclxuICAgICAgICAgICAgICAgICdyZXR1cm5pbmcgYW4gZW1wdHkgYXJyYXkuJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBDaGVja3MgaWYgYW4gZXh0ZW5zaW9uIGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBsb2FkZWQgYnkgdGhlIHByb3ZpZGVkXHJcbiAgICAgICAgICogY2FudmFzIG9iamVjdC4gSWYgbm8gYXJndW1lbnQgaXMgcHJvdmlkZWQgaXQgd2lsbCBhdHRlbXB0IHRvIHJldHVyblxyXG4gICAgICAgICAqIHRoZSBjdXJyZW50bHkgYm91bmQgY29udGV4dC4gSWYgbm8gY29udGV4dCBpcyBib3VuZCwgaXQgd2lsbCByZXR1cm5cclxuICAgICAgICAgKiAnZmFsc2UnLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudHxTdHJpbmd9IGFyZyAtIFRoZSBDYW52YXMgb2JqZWN0IG9yIENhbnZhcyBpZGVudGlmaWNhdGlvbiBzdHJpbmcuIE9wdGlvbmFsLlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBleHRlbnNpb24gLSBUaGUgZXh0ZW5zaW9uIG5hbWUuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIHByb3ZpZGVkIGV4dGVuc2lvbiBoYXMgYmVlbiBsb2FkZWQgc3VjY2Vzc2Z1bGx5LlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNoZWNrRXh0ZW5zaW9uOiBmdW5jdGlvbiggYXJnLCBleHRlbnNpb24gKSB7XHJcbiAgICAgICAgICAgIGlmICggIWV4dGVuc2lvbiApIHtcclxuICAgICAgICAgICAgICAgIC8vIHNoaWZ0IHBhcmFtZXRlcnMgaWYgbm8gY2FudmFzIGFyZyBpcyBwcm92aWRlZFxyXG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uID0gYXJnO1xyXG4gICAgICAgICAgICAgICAgYXJnID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgd3JhcHBlciA9IGdldENvbnRleHRXcmFwcGVyKCBhcmcgKTtcclxuICAgICAgICAgICAgaWYgKCB3cmFwcGVyICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbnMgPSB3cmFwcGVyLmV4dGVuc2lvbnM7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZXh0ZW5zaW9uc1sgZXh0ZW5zaW9uIF0gPyBleHRlbnNpb25zWyBleHRlbnNpb24gXSA6IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIGNvbnRleHQgaXMgY3VycmVudGx5IGJvdW5kIG9yIHByb3ZpZGVkIGFzICcgK1xyXG4gICAgICAgICAgICAgICAgJ2FyZ3VtZW50LCByZXR1cm5pbmcgZmFsc2UuJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgSW5kZXhCdWZmZXI6IHJlcXVpcmUoJy4vY29yZS9JbmRleEJ1ZmZlcicpLFxyXG4gICAgICAgIFJlbmRlcmFibGU6IHJlcXVpcmUoJy4vY29yZS9SZW5kZXJhYmxlJyksXHJcbiAgICAgICAgUmVuZGVyVGFyZ2V0OiByZXF1aXJlKCcuL2NvcmUvUmVuZGVyVGFyZ2V0JyksXHJcbiAgICAgICAgU2hhZGVyOiByZXF1aXJlKCcuL2NvcmUvU2hhZGVyJyksXHJcbiAgICAgICAgVGV4dHVyZTJEOiByZXF1aXJlKCcuL2NvcmUvVGV4dHVyZTJEJyksXHJcbiAgICAgICAgVGV4dHVyZUN1YmVNYXA6IHJlcXVpcmUoJy4vY29yZS9UZXh0dXJlQ3ViZU1hcCcpLFxyXG4gICAgICAgIFZlcnRleEJ1ZmZlcjogcmVxdWlyZSgnLi9jb3JlL1ZlcnRleEJ1ZmZlcicpLFxyXG4gICAgICAgIFZlcnRleFBhY2thZ2U6IHJlcXVpcmUoJy4vY29yZS9WZXJ0ZXhQYWNrYWdlJyksXHJcbiAgICAgICAgVmlld3BvcnQ6IHJlcXVpcmUoJy4vY29yZS9WaWV3cG9ydCcpLFxyXG4gICAgICAgIFdlYkdMQ29udGV4dDogcmVxdWlyZSgnLi9jb3JlL1dlYkdMQ29udGV4dCcpXHJcbiAgICB9O1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgZnVuY3Rpb24gU3RhY2soKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgU3RhY2sucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiggdmFsdWUgKSB7XHJcbiAgICAgICAgdGhpcy5kYXRhLnB1c2goIHZhbHVlICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIFN0YWNrLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmRhdGEucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIFN0YWNrLnByb3RvdHlwZS50b3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmRhdGEubGVuZ3RoIC0gMTtcclxuICAgICAgICBpZiAoIGluZGV4IDwgMCApIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbIGluZGV4IF07XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gU3RhY2s7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgc2ltcGx5RGVmZXJyZWQgPSByZXF1aXJlKCdzaW1wbHktZGVmZXJyZWQnKSxcclxuICAgICAgICBEZWZlcnJlZCA9IHNpbXBseURlZmVycmVkLkRlZmVycmVkLFxyXG4gICAgICAgIHdoZW4gPSBzaW1wbHlEZWZlcnJlZC53aGVuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgcmVzb2x2ZXMgdGhlIHByb3ZpZGVkIGRlZmVycmVkLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7RGVmZXJyZWR9IGRlZmVycmVkIC0gVGhlIGRlZmVycmVkIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFRoZSBmdW5jdGlvbiB0byByZXNvbHZlIHRoZSBkZWZlcnJlZC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcmVzb2x2ZURlZmVycmVkKCBkZWZlcnJlZCApIHtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oIHJlc3VsdCApIHtcclxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSggcmVzdWx0ICk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERpc3BhdGNoZXMgYW4gYXJyYXkgb2Ygam9icywgYWNjdW11bGF0aW5nIHRoZSByZXN1bHRzIGFuZFxyXG4gICAgICogcGFzc2luZyB0aGVtIHRvIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpbiBjb3JyZXNwb25kaW5nIGluZGljZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gam9icyAtIFRoZSBqb2IgYXJyYXkuXHJcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIFRoZSBjYWxsYmFjayBmdW5jdGlvbi5cclxuICAgICAqL1xyXG4gICAgIGZ1bmN0aW9uIGFzeW5jQXJyYXkoIGpvYnMsIGNhbGxiYWNrICkge1xyXG4gICAgICAgIHZhciBkZWZlcnJlZHMgPSBbXSxcclxuICAgICAgICAgICAgZGVmZXJyZWQsXHJcbiAgICAgICAgICAgIGk7XHJcbiAgICAgICAgZm9yICggaT0wOyBpPGpvYnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgIGRlZmVycmVkID0gbmV3IERlZmVycmVkKCk7XHJcbiAgICAgICAgICAgIGRlZmVycmVkcy5wdXNoKCBkZWZlcnJlZCApO1xyXG4gICAgICAgICAgICBqb2JzW2ldKCByZXNvbHZlRGVmZXJyZWQoIGRlZmVycmVkICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd2hlbi5hcHBseSggd2hlbiwgZGVmZXJyZWRzICkudGhlbiggZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMCApO1xyXG4gICAgICAgICAgICBjYWxsYmFjayggcmVzdWx0cyApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGlzcGF0Y2hlcyBhIG1hcCBvZiBqb2JzLCBhY2N1bXVsYXRpbmcgdGhlIHJlc3VsdHMgYW5kXHJcbiAgICAgKiBwYXNzaW5nIHRoZW0gdG8gdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHVuZGVyIGNvcnJlc3BvbmRpbmdcclxuICAgICAqIGtleXMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGpvYnMgLSBUaGUgam9iIG1hcC5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICAgZnVuY3Rpb24gYXN5bmNPYmooIGpvYnMsIGNhbGxiYWNrICkge1xyXG4gICAgICAgIHZhciBqb2JzQnlJbmRleCA9IFtdLFxyXG4gICAgICAgICAgICBkZWZlcnJlZHMgPSBbXSxcclxuICAgICAgICAgICAgZGVmZXJyZWQsXHJcbiAgICAgICAgICAgIGtleTtcclxuICAgICAgICBmb3IgKCBrZXkgaW4gam9icyApIHtcclxuICAgICAgICAgICAgaWYgKCBqb2JzLmhhc093blByb3BlcnR5KCBrZXkgKSApIHtcclxuICAgICAgICAgICAgICAgIGRlZmVycmVkID0gbmV3IERlZmVycmVkKCk7XHJcbiAgICAgICAgICAgICAgICBkZWZlcnJlZHMucHVzaCggZGVmZXJyZWQgKTtcclxuICAgICAgICAgICAgICAgIGpvYnNCeUluZGV4LnB1c2goIGtleSApO1xyXG4gICAgICAgICAgICAgICAgam9ic1sga2V5IF0oIHJlc29sdmVEZWZlcnJlZCggZGVmZXJyZWQgKSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdoZW4uYXBwbHkoIHdoZW4sIGRlZmVycmVkcyApLmRvbmUoIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDAgKSxcclxuICAgICAgICAgICAgICAgIHJlc3VsdHNCeUtleSA9IHt9LFxyXG4gICAgICAgICAgICAgICAgaTtcclxuICAgICAgICAgICAgZm9yICggaT0wOyBpPGpvYnNCeUluZGV4Lmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0c0J5S2V5WyBqb2JzQnlJbmRleFtpXSBdID0gcmVzdWx0c1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYWxsYmFjayggcmVzdWx0c0J5S2V5ICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEV4ZWN1dGUgYSBzZXQgb2YgZnVuY3Rpb25zIGFzeW5jaHJvbm91c2x5LCBvbmNlIGFsbCBoYXZlIGJlZW5cclxuICAgICAgICAgKiBjb21wbGV0ZWQsIGV4ZWN1dGUgdGhlIHByb3ZpZGVkIGNhbGxiYWNrIGZ1bmN0aW9uLiBKb2JzIG1heSBiZSBwYXNzZWRcclxuICAgICAgICAgKiBhcyBhbiBhcnJheSBvciBvYmplY3QuIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aWxsIGJlIHBhc3NlZCB0aGVcclxuICAgICAgICAgKiByZXN1bHRzIGluIHRoZSBzYW1lIGZvcm1hdCBhcyB0aGUgam9icy4gQWxsIGpvYnMgbXVzdCBoYXZlIGFjY2VwdCBhbmRcclxuICAgICAgICAgKiBleGVjdXRlIGEgY2FsbGJhY2sgZnVuY3Rpb24gdXBvbiBjb21wbGV0aW9uLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IGpvYnMgLSBUaGUgc2V0IG9mIGZ1bmN0aW9ucyB0byBleGVjdXRlLlxyXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIHVwb24gY29tcGxldGlvbi5cclxuICAgICAgICAgKi9cclxuICAgICAgICBhc3luYzogZnVuY3Rpb24oIGpvYnMsIGNhbGxiYWNrICkge1xyXG4gICAgICAgICAgICBpZiAoIGpvYnMgaW5zdGFuY2VvZiBBcnJheSApIHtcclxuICAgICAgICAgICAgICAgIGFzeW5jQXJyYXkoIGpvYnMsIGNhbGxiYWNrICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhc3luY09iaiggam9icywgY2FsbGJhY2sgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdHJ1ZSBpZiBhIHByb3ZpZGVkIGFycmF5IGlzIGEgamF2c2NyaXB0IFR5cGVkQXJyYXkuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0geyp9IGFycmF5IC0gVGhlIHZhcmlhYmxlIHRvIHRlc3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIG9yIG5vdCB0aGUgdmFyaWFibGUgaXMgYSBUeXBlZEFycmF5LlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlzVHlwZWRBcnJheTogZnVuY3Rpb24oIGFycmF5ICkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXJyYXkgJiZcclxuICAgICAgICAgICAgICAgIGFycmF5LmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICYmXHJcbiAgICAgICAgICAgICAgICBhcnJheS5ieXRlTGVuZ3RoICE9PSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBwcm92aWRlZCBpbnRlZ2VyIGlzIGEgcG93ZXIgb2YgdHdvLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtpbnRlZ2VyfSBudW0gLSBUaGUgbnVtYmVyIHRvIHRlc3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIG9yIG5vdCB0aGUgbnVtYmVyIGlzIGEgcG93ZXIgb2YgdHdvLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlzUG93ZXJPZlR3bzogZnVuY3Rpb24oIG51bSApIHtcclxuICAgICAgICAgICAgcmV0dXJuICggbnVtICE9PSAwICkgPyAoIG51bSAmICggbnVtIC0gMSApICkgPT09IDAgOiBmYWxzZTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBuZXh0IGhpZ2hlc3QgcG93ZXIgb2YgdHdvIGZvciBhIG51bWJlci5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEV4LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogICAgIDIwMCAtPiAyNTZcclxuICAgICAgICAgKiAgICAgMjU2IC0+IDI1NlxyXG4gICAgICAgICAqICAgICAyNTcgLT4gNTEyXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IG51bSAtIFRoZSBudW1iZXIgdG8gbW9kaWZ5LlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHJldHVybnMge2ludGVnZXJ9IC0gTmV4dCBoaWdoZXN0IHBvd2VyIG9mIHR3by5cclxuICAgICAgICAgKi9cclxuICAgICAgICBuZXh0SGlnaGVzdFBvd2VyT2ZUd286IGZ1bmN0aW9uKCBudW0gKSB7XHJcbiAgICAgICAgICAgIHZhciBpO1xyXG4gICAgICAgICAgICBpZiAoIG51bSAhPT0gMCApIHtcclxuICAgICAgICAgICAgICAgIG51bSA9IG51bS0xO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAoIGk9MTsgaTwzMjsgaTw8PTEgKSB7XHJcbiAgICAgICAgICAgICAgICBudW0gPSBudW0gfCBudW0gPj4gaTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVtICsgMTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNlbmRzIGFuIFhNTEh0dHBSZXF1ZXN0IEdFVCByZXF1ZXN0IHRvIHRoZSBzdXBwbGllZCB1cmwuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgLSBUaGUgVVJMIGZvciB0aGUgcmVzb3VyY2UuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gQ29udGFpbnMgdGhlIGZvbGxvd2luZyBvcHRpb25zOlxuICAgICAgICAgKiA8cHJlPlxuICAgICAgICAgKiAgICAge1xuICAgICAgICAgKiAgICAgICAgIHtTdHJpbmd9IHN1Y2Nlc3MgLSBUaGUgc3VjY2VzcyBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgICAgICogICAgICAgICB7U3RyaW5nfSBlcnJvciAtIFRoZSBlcnJvciBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgICAgICogICAgICAgICB7U3RyaW5nfSBwcm9ncmVzcyAtIFRoZSBwcm9ncmVzcyBjYWxsYmFjayBmdW5jdGlvbi5cbiAgICAgICAgICogICAgICAgICB7U3RyaW5nfSByZXNwb25zZVR5cGUgLSBUaGUgcmVzcG9uc2VUeXBlIG9mIHRoZSBYSFIuXG4gICAgICAgICAqICAgICB9XG4gICAgICAgICAqIDwvcHJlPlxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKCB1cmwsIG9wdGlvbnMgKSB7XG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgcmVxdWVzdC5vcGVuKCAnR0VUJywgdXJsLCB0cnVlICk7XG4gICAgICAgICAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IG9wdGlvbnMucmVzcG9uc2VUeXBlO1xuICAgICAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCAnbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIG9wdGlvbnMuc3VjY2VzcyApIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKCB0aGlzLnJlc3BvbnNlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIG9wdGlvbnMucHJvZ3Jlc3MgKSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKCAncHJvZ3Jlc3MnLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnByb2dyZXNzKCBldmVudCApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCBvcHRpb25zLmVycm9yICkge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lciggJ2Vycm9yJywgZnVuY3Rpb24gKCBldmVudCApIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lcnJvciggZXZlbnQgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgICAgICB9XG4gICAgfTtcblxufSgpKTtcbiIsInZhciBqc29uID0gdHlwZW9mIEpTT04gIT09ICd1bmRlZmluZWQnID8gSlNPTiA6IHJlcXVpcmUoJ2pzb25pZnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqLCBvcHRzKSB7XG4gICAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSBvcHRzID0geyBjbXA6IG9wdHMgfTtcbiAgICB2YXIgc3BhY2UgPSBvcHRzLnNwYWNlIHx8ICcnO1xuICAgIGlmICh0eXBlb2Ygc3BhY2UgPT09ICdudW1iZXInKSBzcGFjZSA9IEFycmF5KHNwYWNlKzEpLmpvaW4oJyAnKTtcbiAgICB2YXIgY3ljbGVzID0gKHR5cGVvZiBvcHRzLmN5Y2xlcyA9PT0gJ2Jvb2xlYW4nKSA/IG9wdHMuY3ljbGVzIDogZmFsc2U7XG4gICAgdmFyIHJlcGxhY2VyID0gb3B0cy5yZXBsYWNlciB8fCBmdW5jdGlvbihrZXksIHZhbHVlKSB7IHJldHVybiB2YWx1ZTsgfTtcblxuICAgIHZhciBjbXAgPSBvcHRzLmNtcCAmJiAoZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgYW9iaiA9IHsga2V5OiBhLCB2YWx1ZTogbm9kZVthXSB9O1xuICAgICAgICAgICAgICAgIHZhciBib2JqID0geyBrZXk6IGIsIHZhbHVlOiBub2RlW2JdIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGYoYW9iaiwgYm9iaik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH0pKG9wdHMuY21wKTtcblxuICAgIHZhciBzZWVuID0gW107XG4gICAgcmV0dXJuIChmdW5jdGlvbiBzdHJpbmdpZnkgKHBhcmVudCwga2V5LCBub2RlLCBsZXZlbCkge1xuICAgICAgICB2YXIgaW5kZW50ID0gc3BhY2UgPyAoJ1xcbicgKyBuZXcgQXJyYXkobGV2ZWwgKyAxKS5qb2luKHNwYWNlKSkgOiAnJztcbiAgICAgICAgdmFyIGNvbG9uU2VwYXJhdG9yID0gc3BhY2UgPyAnOiAnIDogJzonO1xuXG4gICAgICAgIGlmIChub2RlICYmIG5vZGUudG9KU09OICYmIHR5cGVvZiBub2RlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUudG9KU09OKCk7XG4gICAgICAgIH1cblxuICAgICAgICBub2RlID0gcmVwbGFjZXIuY2FsbChwYXJlbnQsIGtleSwgbm9kZSk7XG5cbiAgICAgICAgaWYgKG5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygbm9kZSAhPT0gJ29iamVjdCcgfHwgbm9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGpzb24uc3RyaW5naWZ5KG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0FycmF5KG5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHN0cmluZ2lmeShub2RlLCBpLCBub2RlW2ldLCBsZXZlbCsxKSB8fCBqc29uLnN0cmluZ2lmeShudWxsKTtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChpbmRlbnQgKyBzcGFjZSArIGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICdbJyArIG91dC5qb2luKCcsJykgKyBpbmRlbnQgKyAnXSc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoc2Vlbi5pbmRleE9mKG5vZGUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmIChjeWNsZXMpIHJldHVybiBqc29uLnN0cmluZ2lmeSgnX19jeWNsZV9fJyk7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29udmVydGluZyBjaXJjdWxhciBzdHJ1Y3R1cmUgdG8gSlNPTicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBzZWVuLnB1c2gobm9kZSk7XG5cbiAgICAgICAgICAgIHZhciBrZXlzID0gb2JqZWN0S2V5cyhub2RlKS5zb3J0KGNtcCAmJiBjbXAobm9kZSkpO1xuICAgICAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gc3RyaW5naWZ5KG5vZGUsIGtleSwgbm9kZVtrZXldLCBsZXZlbCsxKTtcblxuICAgICAgICAgICAgICAgIGlmKCF2YWx1ZSkgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICB2YXIga2V5VmFsdWUgPSBqc29uLnN0cmluZ2lmeShrZXkpXG4gICAgICAgICAgICAgICAgICAgICsgY29sb25TZXBhcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgKyB2YWx1ZTtcbiAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2goaW5kZW50ICsgc3BhY2UgKyBrZXlWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWVuLnNwbGljZShzZWVuLmluZGV4T2Yobm9kZSksIDEpO1xuICAgICAgICAgICAgcmV0dXJuICd7JyArIG91dC5qb2luKCcsJykgKyBpbmRlbnQgKyAnfSc7XG4gICAgICAgIH1cbiAgICB9KSh7ICcnOiBvYmogfSwgJycsIG9iaiwgMCk7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4ge30udG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5IHx8IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWUgfTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xufTtcbiIsImV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL2xpYi9wYXJzZScpO1xuZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2xpYi9zdHJpbmdpZnknKTtcbiIsInZhciBhdCwgLy8gVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNoYXJhY3RlclxuICAgIGNoLCAvLyBUaGUgY3VycmVudCBjaGFyYWN0ZXJcbiAgICBlc2NhcGVlID0ge1xuICAgICAgICAnXCInOiAgJ1wiJyxcbiAgICAgICAgJ1xcXFwnOiAnXFxcXCcsXG4gICAgICAgICcvJzogICcvJyxcbiAgICAgICAgYjogICAgJ1xcYicsXG4gICAgICAgIGY6ICAgICdcXGYnLFxuICAgICAgICBuOiAgICAnXFxuJyxcbiAgICAgICAgcjogICAgJ1xccicsXG4gICAgICAgIHQ6ICAgICdcXHQnXG4gICAgfSxcbiAgICB0ZXh0LFxuXG4gICAgZXJyb3IgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICAvLyBDYWxsIGVycm9yIHdoZW4gc29tZXRoaW5nIGlzIHdyb25nLlxuICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICBuYW1lOiAgICAnU3ludGF4RXJyb3InLFxuICAgICAgICAgICAgbWVzc2FnZTogbSxcbiAgICAgICAgICAgIGF0OiAgICAgIGF0LFxuICAgICAgICAgICAgdGV4dDogICAgdGV4dFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgXG4gICAgbmV4dCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIC8vIElmIGEgYyBwYXJhbWV0ZXIgaXMgcHJvdmlkZWQsIHZlcmlmeSB0aGF0IGl0IG1hdGNoZXMgdGhlIGN1cnJlbnQgY2hhcmFjdGVyLlxuICAgICAgICBpZiAoYyAmJiBjICE9PSBjaCkge1xuICAgICAgICAgICAgZXJyb3IoXCJFeHBlY3RlZCAnXCIgKyBjICsgXCInIGluc3RlYWQgb2YgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEdldCB0aGUgbmV4dCBjaGFyYWN0ZXIuIFdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgY2hhcmFjdGVycyxcbiAgICAgICAgLy8gcmV0dXJuIHRoZSBlbXB0eSBzdHJpbmcuXG4gICAgICAgIFxuICAgICAgICBjaCA9IHRleHQuY2hhckF0KGF0KTtcbiAgICAgICAgYXQgKz0gMTtcbiAgICAgICAgcmV0dXJuIGNoO1xuICAgIH0sXG4gICAgXG4gICAgbnVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBQYXJzZSBhIG51bWJlciB2YWx1ZS5cbiAgICAgICAgdmFyIG51bWJlcixcbiAgICAgICAgICAgIHN0cmluZyA9ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNoID09PSAnLScpIHtcbiAgICAgICAgICAgIHN0cmluZyA9ICctJztcbiAgICAgICAgICAgIG5leHQoJy0nKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoY2ggPj0gJzAnICYmIGNoIDw9ICc5Jykge1xuICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaCA9PT0gJy4nKSB7XG4gICAgICAgICAgICBzdHJpbmcgKz0gJy4nO1xuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSAmJiBjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSB7XG4gICAgICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjaCA9PT0gJ2UnIHx8IGNoID09PSAnRScpIHtcbiAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJy0nIHx8IGNoID09PSAnKycpIHtcbiAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2hpbGUgKGNoID49ICcwJyAmJiBjaCA8PSAnOScpIHtcbiAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG51bWJlciA9ICtzdHJpbmc7XG4gICAgICAgIGlmICghaXNGaW5pdGUobnVtYmVyKSkge1xuICAgICAgICAgICAgZXJyb3IoXCJCYWQgbnVtYmVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgc3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBQYXJzZSBhIHN0cmluZyB2YWx1ZS5cbiAgICAgICAgdmFyIGhleCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBzdHJpbmcgPSAnJyxcbiAgICAgICAgICAgIHVmZmZmO1xuICAgICAgICBcbiAgICAgICAgLy8gV2hlbiBwYXJzaW5nIGZvciBzdHJpbmcgdmFsdWVzLCB3ZSBtdXN0IGxvb2sgZm9yIFwiIGFuZCBcXCBjaGFyYWN0ZXJzLlxuICAgICAgICBpZiAoY2ggPT09ICdcIicpIHtcbiAgICAgICAgICAgIHdoaWxlIChuZXh0KCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICdcIicpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ3UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1ZmZmZiA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGV4ID0gcGFyc2VJbnQobmV4dCgpLCAxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShoZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1ZmZmZiA9IHVmZmZmICogMTYgKyBoZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1ZmZmZik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVzY2FwZWVbY2hdID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nICs9IGVzY2FwZWVbY2hdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVycm9yKFwiQmFkIHN0cmluZ1wiKTtcbiAgICB9LFxuXG4gICAgd2hpdGUgPSBmdW5jdGlvbiAoKSB7XG5cbi8vIFNraXAgd2hpdGVzcGFjZS5cblxuICAgICAgICB3aGlsZSAoY2ggJiYgY2ggPD0gJyAnKSB7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgd29yZCA9IGZ1bmN0aW9uICgpIHtcblxuLy8gdHJ1ZSwgZmFsc2UsIG9yIG51bGwuXG5cbiAgICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgICAgIG5leHQoJ3QnKTtcbiAgICAgICAgICAgIG5leHQoJ3InKTtcbiAgICAgICAgICAgIG5leHQoJ3UnKTtcbiAgICAgICAgICAgIG5leHQoJ2UnKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlICdmJzpcbiAgICAgICAgICAgIG5leHQoJ2YnKTtcbiAgICAgICAgICAgIG5leHQoJ2EnKTtcbiAgICAgICAgICAgIG5leHQoJ2wnKTtcbiAgICAgICAgICAgIG5leHQoJ3MnKTtcbiAgICAgICAgICAgIG5leHQoJ2UnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgY2FzZSAnbic6XG4gICAgICAgICAgICBuZXh0KCduJyk7XG4gICAgICAgICAgICBuZXh0KCd1Jyk7XG4gICAgICAgICAgICBuZXh0KCdsJyk7XG4gICAgICAgICAgICBuZXh0KCdsJyk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlcnJvcihcIlVuZXhwZWN0ZWQgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgfSxcblxuICAgIHZhbHVlLCAgLy8gUGxhY2UgaG9sZGVyIGZvciB0aGUgdmFsdWUgZnVuY3Rpb24uXG5cbiAgICBhcnJheSA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYW4gYXJyYXkgdmFsdWUuXG5cbiAgICAgICAgdmFyIGFycmF5ID0gW107XG5cbiAgICAgICAgaWYgKGNoID09PSAnWycpIHtcbiAgICAgICAgICAgIG5leHQoJ1snKTtcbiAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICBpZiAoY2ggPT09ICddJykge1xuICAgICAgICAgICAgICAgIG5leHQoJ10nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXk7ICAgLy8gZW1wdHkgYXJyYXlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChjaCkge1xuICAgICAgICAgICAgICAgIGFycmF5LnB1c2godmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICddJykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCddJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV4dCgnLCcpO1xuICAgICAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IoXCJCYWQgYXJyYXlcIik7XG4gICAgfSxcblxuICAgIG9iamVjdCA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYW4gb2JqZWN0IHZhbHVlLlxuXG4gICAgICAgIHZhciBrZXksXG4gICAgICAgICAgICBvYmplY3QgPSB7fTtcblxuICAgICAgICBpZiAoY2ggPT09ICd7Jykge1xuICAgICAgICAgICAgbmV4dCgneycpO1xuICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgbmV4dCgnfScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7ICAgLy8gZW1wdHkgb2JqZWN0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoY2gpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBzdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgICAgIG5leHQoJzonKTtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKCdEdXBsaWNhdGUga2V5IFwiJyArIGtleSArICdcIicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IHZhbHVlKCk7XG4gICAgICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5leHQoJywnKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVycm9yKFwiQmFkIG9iamVjdFwiKTtcbiAgICB9O1xuXG52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYSBKU09OIHZhbHVlLiBJdCBjb3VsZCBiZSBhbiBvYmplY3QsIGFuIGFycmF5LCBhIHN0cmluZywgYSBudW1iZXIsXG4vLyBvciBhIHdvcmQuXG5cbiAgICB3aGl0ZSgpO1xuICAgIHN3aXRjaCAoY2gpIHtcbiAgICBjYXNlICd7JzpcbiAgICAgICAgcmV0dXJuIG9iamVjdCgpO1xuICAgIGNhc2UgJ1snOlxuICAgICAgICByZXR1cm4gYXJyYXkoKTtcbiAgICBjYXNlICdcIic6XG4gICAgICAgIHJldHVybiBzdHJpbmcoKTtcbiAgICBjYXNlICctJzpcbiAgICAgICAgcmV0dXJuIG51bWJlcigpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBjaCA+PSAnMCcgJiYgY2ggPD0gJzknID8gbnVtYmVyKCkgOiB3b3JkKCk7XG4gICAgfVxufTtcblxuLy8gUmV0dXJuIHRoZSBqc29uX3BhcnNlIGZ1bmN0aW9uLiBJdCB3aWxsIGhhdmUgYWNjZXNzIHRvIGFsbCBvZiB0aGUgYWJvdmVcbi8vIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzb3VyY2UsIHJldml2ZXIpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIFxuICAgIHRleHQgPSBzb3VyY2U7XG4gICAgYXQgPSAwO1xuICAgIGNoID0gJyAnO1xuICAgIHJlc3VsdCA9IHZhbHVlKCk7XG4gICAgd2hpdGUoKTtcbiAgICBpZiAoY2gpIHtcbiAgICAgICAgZXJyb3IoXCJTeW50YXggZXJyb3JcIik7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSByZXZpdmVyIGZ1bmN0aW9uLCB3ZSByZWN1cnNpdmVseSB3YWxrIHRoZSBuZXcgc3RydWN0dXJlLFxuICAgIC8vIHBhc3NpbmcgZWFjaCBuYW1lL3ZhbHVlIHBhaXIgdG8gdGhlIHJldml2ZXIgZnVuY3Rpb24gZm9yIHBvc3NpYmxlXG4gICAgLy8gdHJhbnNmb3JtYXRpb24sIHN0YXJ0aW5nIHdpdGggYSB0ZW1wb3Jhcnkgcm9vdCBvYmplY3QgdGhhdCBob2xkcyB0aGUgcmVzdWx0XG4gICAgLy8gaW4gYW4gZW1wdHkga2V5LiBJZiB0aGVyZSBpcyBub3QgYSByZXZpdmVyIGZ1bmN0aW9uLCB3ZSBzaW1wbHkgcmV0dXJuIHRoZVxuICAgIC8vIHJlc3VsdC5cblxuICAgIHJldHVybiB0eXBlb2YgcmV2aXZlciA9PT0gJ2Z1bmN0aW9uJyA/IChmdW5jdGlvbiB3YWxrKGhvbGRlciwga2V5KSB7XG4gICAgICAgIHZhciBrLCB2LCB2YWx1ZSA9IGhvbGRlcltrZXldO1xuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgdiA9IHdhbGsodmFsdWUsIGspO1xuICAgICAgICAgICAgICAgICAgICBpZiAodiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtrXSA9IHY7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdmFsdWVba107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldml2ZXIuY2FsbChob2xkZXIsIGtleSwgdmFsdWUpO1xuICAgIH0oeycnOiByZXN1bHR9LCAnJykpIDogcmVzdWx0O1xufTtcbiIsInZhciBjeCA9IC9bXFx1MDAwMFxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nLFxuICAgIGVzY2FwYWJsZSA9IC9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgZ2FwLFxuICAgIGluZGVudCxcbiAgICBtZXRhID0geyAgICAvLyB0YWJsZSBvZiBjaGFyYWN0ZXIgc3Vic3RpdHV0aW9uc1xuICAgICAgICAnXFxiJzogJ1xcXFxiJyxcbiAgICAgICAgJ1xcdCc6ICdcXFxcdCcsXG4gICAgICAgICdcXG4nOiAnXFxcXG4nLFxuICAgICAgICAnXFxmJzogJ1xcXFxmJyxcbiAgICAgICAgJ1xccic6ICdcXFxccicsXG4gICAgICAgICdcIicgOiAnXFxcXFwiJyxcbiAgICAgICAgJ1xcXFwnOiAnXFxcXFxcXFwnXG4gICAgfSxcbiAgICByZXA7XG5cbmZ1bmN0aW9uIHF1b3RlKHN0cmluZykge1xuICAgIC8vIElmIHRoZSBzdHJpbmcgY29udGFpbnMgbm8gY29udHJvbCBjaGFyYWN0ZXJzLCBubyBxdW90ZSBjaGFyYWN0ZXJzLCBhbmQgbm9cbiAgICAvLyBiYWNrc2xhc2ggY2hhcmFjdGVycywgdGhlbiB3ZSBjYW4gc2FmZWx5IHNsYXAgc29tZSBxdW90ZXMgYXJvdW5kIGl0LlxuICAgIC8vIE90aGVyd2lzZSB3ZSBtdXN0IGFsc28gcmVwbGFjZSB0aGUgb2ZmZW5kaW5nIGNoYXJhY3RlcnMgd2l0aCBzYWZlIGVzY2FwZVxuICAgIC8vIHNlcXVlbmNlcy5cbiAgICBcbiAgICBlc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gZXNjYXBhYmxlLnRlc3Qoc3RyaW5nKSA/ICdcIicgKyBzdHJpbmcucmVwbGFjZShlc2NhcGFibGUsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgIHZhciBjID0gbWV0YVthXTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBjID09PSAnc3RyaW5nJyA/IGMgOlxuICAgICAgICAgICAgJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgfSkgKyAnXCInIDogJ1wiJyArIHN0cmluZyArICdcIic7XG59XG5cbmZ1bmN0aW9uIHN0cihrZXksIGhvbGRlcikge1xuICAgIC8vIFByb2R1Y2UgYSBzdHJpbmcgZnJvbSBob2xkZXJba2V5XS5cbiAgICB2YXIgaSwgICAgICAgICAgLy8gVGhlIGxvb3AgY291bnRlci5cbiAgICAgICAgaywgICAgICAgICAgLy8gVGhlIG1lbWJlciBrZXkuXG4gICAgICAgIHYsICAgICAgICAgIC8vIFRoZSBtZW1iZXIgdmFsdWUuXG4gICAgICAgIGxlbmd0aCxcbiAgICAgICAgbWluZCA9IGdhcCxcbiAgICAgICAgcGFydGlhbCxcbiAgICAgICAgdmFsdWUgPSBob2xkZXJba2V5XTtcbiAgICBcbiAgICAvLyBJZiB0aGUgdmFsdWUgaGFzIGEgdG9KU09OIG1ldGhvZCwgY2FsbCBpdCB0byBvYnRhaW4gYSByZXBsYWNlbWVudCB2YWx1ZS5cbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihrZXkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB3ZSB3ZXJlIGNhbGxlZCB3aXRoIGEgcmVwbGFjZXIgZnVuY3Rpb24sIHRoZW4gY2FsbCB0aGUgcmVwbGFjZXIgdG9cbiAgICAvLyBvYnRhaW4gYSByZXBsYWNlbWVudCB2YWx1ZS5cbiAgICBpZiAodHlwZW9mIHJlcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWx1ZSA9IHJlcC5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIFdoYXQgaGFwcGVucyBuZXh0IGRlcGVuZHMgb24gdGhlIHZhbHVlJ3MgdHlwZS5cbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgcmV0dXJuIHF1b3RlKHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAvLyBKU09OIG51bWJlcnMgbXVzdCBiZSBmaW5pdGUuIEVuY29kZSBub24tZmluaXRlIG51bWJlcnMgYXMgbnVsbC5cbiAgICAgICAgICAgIHJldHVybiBpc0Zpbml0ZSh2YWx1ZSkgPyBTdHJpbmcodmFsdWUpIDogJ251bGwnO1xuICAgICAgICBcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIGNhc2UgJ251bGwnOlxuICAgICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGEgYm9vbGVhbiBvciBudWxsLCBjb252ZXJ0IGl0IHRvIGEgc3RyaW5nLiBOb3RlOlxuICAgICAgICAgICAgLy8gdHlwZW9mIG51bGwgZG9lcyBub3QgcHJvZHVjZSAnbnVsbCcuIFRoZSBjYXNlIGlzIGluY2x1ZGVkIGhlcmUgaW5cbiAgICAgICAgICAgIC8vIHRoZSByZW1vdGUgY2hhbmNlIHRoYXQgdGhpcyBnZXRzIGZpeGVkIHNvbWVkYXkuXG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgICAgIFxuICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuICdudWxsJztcbiAgICAgICAgICAgIGdhcCArPSBpbmRlbnQ7XG4gICAgICAgICAgICBwYXJ0aWFsID0gW107XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFycmF5LmlzQXJyYXlcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydGlhbFtpXSA9IHN0cihpLCB2YWx1ZSkgfHwgJ251bGwnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBKb2luIGFsbCBvZiB0aGUgZWxlbWVudHMgdG9nZXRoZXIsIHNlcGFyYXRlZCB3aXRoIGNvbW1hcywgYW5kXG4gICAgICAgICAgICAgICAgLy8gd3JhcCB0aGVtIGluIGJyYWNrZXRzLlxuICAgICAgICAgICAgICAgIHYgPSBwYXJ0aWFsLmxlbmd0aCA9PT0gMCA/ICdbXScgOiBnYXAgP1xuICAgICAgICAgICAgICAgICAgICAnW1xcbicgKyBnYXAgKyBwYXJ0aWFsLmpvaW4oJyxcXG4nICsgZ2FwKSArICdcXG4nICsgbWluZCArICddJyA6XG4gICAgICAgICAgICAgICAgICAgICdbJyArIHBhcnRpYWwuam9pbignLCcpICsgJ10nO1xuICAgICAgICAgICAgICAgIGdhcCA9IG1pbmQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIElmIHRoZSByZXBsYWNlciBpcyBhbiBhcnJheSwgdXNlIGl0IHRvIHNlbGVjdCB0aGUgbWVtYmVycyB0byBiZVxuICAgICAgICAgICAgLy8gc3RyaW5naWZpZWQuXG4gICAgICAgICAgICBpZiAocmVwICYmIHR5cGVvZiByZXAgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gcmVwLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgayA9IHJlcFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHN0cihrLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRpYWwucHVzaChxdW90ZShrKSArIChnYXAgPyAnOiAnIDogJzonKSArIHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdGVyYXRlIHRocm91Z2ggYWxsIG9mIHRoZSBrZXlzIGluIHRoZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gc3RyKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydGlhbC5wdXNoKHF1b3RlKGspICsgKGdhcCA/ICc6ICcgOiAnOicpICsgdik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgLy8gSm9pbiBhbGwgb2YgdGhlIG1lbWJlciB0ZXh0cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLFxuICAgICAgICAvLyBhbmQgd3JhcCB0aGVtIGluIGJyYWNlcy5cblxuICAgICAgICB2ID0gcGFydGlhbC5sZW5ndGggPT09IDAgPyAne30nIDogZ2FwID9cbiAgICAgICAgICAgICd7XFxuJyArIGdhcCArIHBhcnRpYWwuam9pbignLFxcbicgKyBnYXApICsgJ1xcbicgKyBtaW5kICsgJ30nIDpcbiAgICAgICAgICAgICd7JyArIHBhcnRpYWwuam9pbignLCcpICsgJ30nO1xuICAgICAgICBnYXAgPSBtaW5kO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlLCByZXBsYWNlciwgc3BhY2UpIHtcbiAgICB2YXIgaTtcbiAgICBnYXAgPSAnJztcbiAgICBpbmRlbnQgPSAnJztcbiAgICBcbiAgICAvLyBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgbnVtYmVyLCBtYWtlIGFuIGluZGVudCBzdHJpbmcgY29udGFpbmluZyB0aGF0XG4gICAgLy8gbWFueSBzcGFjZXMuXG4gICAgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHNwYWNlOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluZGVudCArPSAnICc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIHN0cmluZywgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBpbmRlbnQgc3RyaW5nLlxuICAgIGVsc2UgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW5kZW50ID0gc3BhY2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSByZXBsYWNlciwgaXQgbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIGFuIGFycmF5LlxuICAgIC8vIE90aGVyd2lzZSwgdGhyb3cgYW4gZXJyb3IuXG4gICAgcmVwID0gcmVwbGFjZXI7XG4gICAgaWYgKHJlcGxhY2VyICYmIHR5cGVvZiByZXBsYWNlciAhPT0gJ2Z1bmN0aW9uJ1xuICAgICYmICh0eXBlb2YgcmVwbGFjZXIgIT09ICdvYmplY3QnIHx8IHR5cGVvZiByZXBsYWNlci5sZW5ndGggIT09ICdudW1iZXInKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0pTT04uc3RyaW5naWZ5Jyk7XG4gICAgfVxuICAgIFxuICAgIC8vIE1ha2UgYSBmYWtlIHJvb3Qgb2JqZWN0IGNvbnRhaW5pbmcgb3VyIHZhbHVlIHVuZGVyIHRoZSBrZXkgb2YgJycuXG4gICAgLy8gUmV0dXJuIHRoZSByZXN1bHQgb2Ygc3RyaW5naWZ5aW5nIHRoZSB2YWx1ZS5cbiAgICByZXR1cm4gc3RyKCcnLCB7Jyc6IHZhbHVlfSk7XG59O1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjYuM1xuKGZ1bmN0aW9uKCkge1xuICB2YXIgRGVmZXJyZWQsIFBFTkRJTkcsIFJFSkVDVEVELCBSRVNPTFZFRCwgVkVSU0lPTiwgYWZ0ZXIsIGV4ZWN1dGUsIGZsYXR0ZW4sIGhhcywgaW5zdGFsbEludG8sIGlzQXJndW1lbnRzLCBpc1Byb21pc2UsIHdyYXAsIF93aGVuLFxuICAgIF9fc2xpY2UgPSBbXS5zbGljZTtcblxuICBWRVJTSU9OID0gJzMuMC4wJztcblxuICBQRU5ESU5HID0gXCJwZW5kaW5nXCI7XG5cbiAgUkVTT0xWRUQgPSBcInJlc29sdmVkXCI7XG5cbiAgUkVKRUNURUQgPSBcInJlamVjdGVkXCI7XG5cbiAgaGFzID0gZnVuY3Rpb24ob2JqLCBwcm9wKSB7XG4gICAgcmV0dXJuIG9iaiAhPSBudWxsID8gb2JqLmhhc093blByb3BlcnR5KHByb3ApIDogdm9pZCAwO1xuICB9O1xuXG4gIGlzQXJndW1lbnRzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGhhcyhvYmosICdsZW5ndGgnKSAmJiBoYXMob2JqLCAnY2FsbGVlJyk7XG4gIH07XG5cbiAgaXNQcm9taXNlID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGhhcyhvYmosICdwcm9taXNlJykgJiYgdHlwZW9mIChvYmogIT0gbnVsbCA/IG9iai5wcm9taXNlIDogdm9pZCAwKSA9PT0gJ2Z1bmN0aW9uJztcbiAgfTtcblxuICBmbGF0dGVuID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICBpZiAoaXNBcmd1bWVudHMoYXJyYXkpKSB7XG4gICAgICByZXR1cm4gZmxhdHRlbihBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcnJheSkpO1xuICAgIH1cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XG4gICAgICByZXR1cm4gW2FycmF5XTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5LnJlZHVjZShmdW5jdGlvbihtZW1vLCB2YWx1ZSkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBtZW1vLmNvbmNhdChmbGF0dGVuKHZhbHVlKSk7XG4gICAgICB9XG4gICAgICBtZW1vLnB1c2godmFsdWUpO1xuICAgICAgcmV0dXJuIG1lbW87XG4gICAgfSwgW10pO1xuICB9O1xuXG4gIGFmdGVyID0gZnVuY3Rpb24odGltZXMsIGZ1bmMpIHtcbiAgICBpZiAodGltZXMgPD0gMCkge1xuICAgICAgcmV0dXJuIGZ1bmMoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKC0tdGltZXMgPCAxKSB7XG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICB9XG4gICAgfTtcbiAgfTtcblxuICB3cmFwID0gZnVuY3Rpb24oZnVuYywgd3JhcHBlcikge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBhcmdzO1xuICAgICAgYXJncyA9IFtmdW5jXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XG4gICAgICByZXR1cm4gd3JhcHBlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9O1xuXG4gIGV4ZWN1dGUgPSBmdW5jdGlvbihjYWxsYmFja3MsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICB2YXIgY2FsbGJhY2ssIF9pLCBfbGVuLCBfcmVmLCBfcmVzdWx0cztcbiAgICBfcmVmID0gZmxhdHRlbihjYWxsYmFja3MpO1xuICAgIF9yZXN1bHRzID0gW107XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBjYWxsYmFjayA9IF9yZWZbX2ldO1xuICAgICAgX3Jlc3VsdHMucHVzaChjYWxsYmFjay5jYWxsLmFwcGx5KGNhbGxiYWNrLCBbY29udGV4dF0uY29uY2F0KF9fc2xpY2UuY2FsbChhcmdzKSkpKTtcbiAgICB9XG4gICAgcmV0dXJuIF9yZXN1bHRzO1xuICB9O1xuXG4gIERlZmVycmVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbmRpZGF0ZSwgY2xvc2UsIGNsb3NpbmdBcmd1bWVudHMsIGRvbmVDYWxsYmFja3MsIGZhaWxDYWxsYmFja3MsIHByb2dyZXNzQ2FsbGJhY2tzLCBzdGF0ZTtcbiAgICBzdGF0ZSA9IFBFTkRJTkc7XG4gICAgZG9uZUNhbGxiYWNrcyA9IFtdO1xuICAgIGZhaWxDYWxsYmFja3MgPSBbXTtcbiAgICBwcm9ncmVzc0NhbGxiYWNrcyA9IFtdO1xuICAgIGNsb3NpbmdBcmd1bWVudHMgPSB7XG4gICAgICAncmVzb2x2ZWQnOiB7fSxcbiAgICAgICdyZWplY3RlZCc6IHt9LFxuICAgICAgJ3BlbmRpbmcnOiB7fVxuICAgIH07XG4gICAgdGhpcy5wcm9taXNlID0gZnVuY3Rpb24oY2FuZGlkYXRlKSB7XG4gICAgICB2YXIgcGlwZSwgc3RvcmVDYWxsYmFja3M7XG4gICAgICBjYW5kaWRhdGUgPSBjYW5kaWRhdGUgfHwge307XG4gICAgICBjYW5kaWRhdGUuc3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgfTtcbiAgICAgIHN0b3JlQ2FsbGJhY2tzID0gZnVuY3Rpb24oc2hvdWxkRXhlY3V0ZUltbWVkaWF0ZWx5LCBob2xkZXIsIGhvbGRlclN0YXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoc3RhdGUgPT09IFBFTkRJTkcpIHtcbiAgICAgICAgICAgIGhvbGRlci5wdXNoLmFwcGx5KGhvbGRlciwgZmxhdHRlbihhcmd1bWVudHMpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHNob3VsZEV4ZWN1dGVJbW1lZGlhdGVseSgpKSB7XG4gICAgICAgICAgICBleGVjdXRlKGFyZ3VtZW50cywgY2xvc2luZ0FyZ3VtZW50c1tob2xkZXJTdGF0ZV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgICB9O1xuICAgICAgfTtcbiAgICAgIGNhbmRpZGF0ZS5kb25lID0gc3RvcmVDYWxsYmFja3MoKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc3RhdGUgPT09IFJFU09MVkVEO1xuICAgICAgfSksIGRvbmVDYWxsYmFja3MsIFJFU09MVkVEKTtcbiAgICAgIGNhbmRpZGF0ZS5mYWlsID0gc3RvcmVDYWxsYmFja3MoKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc3RhdGUgPT09IFJFSkVDVEVEO1xuICAgICAgfSksIGZhaWxDYWxsYmFja3MsIFJFSkVDVEVEKTtcbiAgICAgIGNhbmRpZGF0ZS5wcm9ncmVzcyA9IHN0b3JlQ2FsbGJhY2tzKChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlICE9PSBQRU5ESU5HO1xuICAgICAgfSksIHByb2dyZXNzQ2FsbGJhY2tzLCBQRU5ESU5HKTtcbiAgICAgIGNhbmRpZGF0ZS5hbHdheXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9yZWY7XG4gICAgICAgIHJldHVybiAoX3JlZiA9IGNhbmRpZGF0ZS5kb25lLmFwcGx5KGNhbmRpZGF0ZSwgYXJndW1lbnRzKSkuZmFpbC5hcHBseShfcmVmLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICAgIHBpcGUgPSBmdW5jdGlvbihkb25lRmlsdGVyLCBmYWlsRmlsdGVyLCBwcm9ncmVzc0ZpbHRlcikge1xuICAgICAgICB2YXIgZmlsdGVyLCBtYXN0ZXI7XG4gICAgICAgIG1hc3RlciA9IG5ldyBEZWZlcnJlZCgpO1xuICAgICAgICBmaWx0ZXIgPSBmdW5jdGlvbihzb3VyY2UsIGZ1bm5lbCwgY2FsbGJhY2spIHtcbiAgICAgICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlW3NvdXJjZV0obWFzdGVyW2Z1bm5lbF0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlW3NvdXJjZV0oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgYXJncywgdmFsdWU7XG4gICAgICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuZG9uZShtYXN0ZXIucmVzb2x2ZSkuZmFpbChtYXN0ZXIucmVqZWN0KS5wcm9ncmVzcyhtYXN0ZXIubm90aWZ5KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBtYXN0ZXJbZnVubmVsXSh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGZpbHRlcignZG9uZScsICdyZXNvbHZlJywgZG9uZUZpbHRlcik7XG4gICAgICAgIGZpbHRlcignZmFpbCcsICdyZWplY3QnLCBmYWlsRmlsdGVyKTtcbiAgICAgICAgZmlsdGVyKCdwcm9ncmVzcycsICdub3RpZnknLCBwcm9ncmVzc0ZpbHRlcik7XG4gICAgICAgIHJldHVybiBtYXN0ZXI7XG4gICAgICB9O1xuICAgICAgY2FuZGlkYXRlLnBpcGUgPSBwaXBlO1xuICAgICAgY2FuZGlkYXRlLnRoZW4gPSBwaXBlO1xuICAgICAgaWYgKGNhbmRpZGF0ZS5wcm9taXNlID09IG51bGwpIHtcbiAgICAgICAgY2FuZGlkYXRlLnByb21pc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9O1xuICAgIHRoaXMucHJvbWlzZSh0aGlzKTtcbiAgICBjYW5kaWRhdGUgPSB0aGlzO1xuICAgIGNsb3NlID0gZnVuY3Rpb24oZmluYWxTdGF0ZSwgY2FsbGJhY2tzLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gUEVORElORykge1xuICAgICAgICAgIHN0YXRlID0gZmluYWxTdGF0ZTtcbiAgICAgICAgICBjbG9zaW5nQXJndW1lbnRzW2ZpbmFsU3RhdGVdID0gYXJndW1lbnRzO1xuICAgICAgICAgIGV4ZWN1dGUoY2FsbGJhY2tzLCBjbG9zaW5nQXJndW1lbnRzW2ZpbmFsU3RhdGVdLCBjb250ZXh0KTtcbiAgICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfTtcbiAgICB9O1xuICAgIHRoaXMucmVzb2x2ZSA9IGNsb3NlKFJFU09MVkVELCBkb25lQ2FsbGJhY2tzKTtcbiAgICB0aGlzLnJlamVjdCA9IGNsb3NlKFJFSkVDVEVELCBmYWlsQ2FsbGJhY2tzKTtcbiAgICB0aGlzLm5vdGlmeSA9IGNsb3NlKFBFTkRJTkcsIHByb2dyZXNzQ2FsbGJhY2tzKTtcbiAgICB0aGlzLnJlc29sdmVXaXRoID0gZnVuY3Rpb24oY29udGV4dCwgYXJncykge1xuICAgICAgcmV0dXJuIGNsb3NlKFJFU09MVkVELCBkb25lQ2FsbGJhY2tzLCBjb250ZXh0KS5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9O1xuICAgIHRoaXMucmVqZWN0V2l0aCA9IGZ1bmN0aW9uKGNvbnRleHQsIGFyZ3MpIHtcbiAgICAgIHJldHVybiBjbG9zZShSRUpFQ1RFRCwgZmFpbENhbGxiYWNrcywgY29udGV4dCkuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfTtcbiAgICB0aGlzLm5vdGlmeVdpdGggPSBmdW5jdGlvbihjb250ZXh0LCBhcmdzKSB7XG4gICAgICByZXR1cm4gY2xvc2UoUEVORElORywgcHJvZ3Jlc3NDYWxsYmFja3MsIGNvbnRleHQpLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgX3doZW4gPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZGVmLCBkZWZzLCBmaW5pc2gsIHJlc29sdXRpb25BcmdzLCB0cmlnZ2VyLCBfaSwgX2xlbjtcbiAgICBkZWZzID0gZmxhdHRlbihhcmd1bWVudHMpO1xuICAgIGlmIChkZWZzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgaWYgKGlzUHJvbWlzZShkZWZzWzBdKSkge1xuICAgICAgICByZXR1cm4gZGVmc1swXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAobmV3IERlZmVycmVkKCkpLnJlc29sdmUoZGVmc1swXSkucHJvbWlzZSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0cmlnZ2VyID0gbmV3IERlZmVycmVkKCk7XG4gICAgaWYgKCFkZWZzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRyaWdnZXIucmVzb2x2ZSgpLnByb21pc2UoKTtcbiAgICB9XG4gICAgcmVzb2x1dGlvbkFyZ3MgPSBbXTtcbiAgICBmaW5pc2ggPSBhZnRlcihkZWZzLmxlbmd0aCwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdHJpZ2dlci5yZXNvbHZlLmFwcGx5KHRyaWdnZXIsIHJlc29sdXRpb25BcmdzKTtcbiAgICB9KTtcbiAgICBkZWZzLmZvckVhY2goZnVuY3Rpb24oZGVmLCBpbmRleCkge1xuICAgICAgaWYgKGlzUHJvbWlzZShkZWYpKSB7XG4gICAgICAgIHJldHVybiBkZWYuZG9uZShmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYXJncztcbiAgICAgICAgICBhcmdzID0gMSA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICAgICAgICByZXNvbHV0aW9uQXJnc1tpbmRleF0gPSBhcmdzLmxlbmd0aCA+IDEgPyBhcmdzIDogYXJnc1swXTtcbiAgICAgICAgICByZXR1cm4gZmluaXNoKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x1dGlvbkFyZ3NbaW5kZXhdID0gZGVmO1xuICAgICAgICByZXR1cm4gZmluaXNoKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBkZWZzLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICBkZWYgPSBkZWZzW19pXTtcbiAgICAgIGlzUHJvbWlzZShkZWYpICYmIGRlZi5mYWlsKHRyaWdnZXIucmVqZWN0KTtcbiAgICB9XG4gICAgcmV0dXJuIHRyaWdnZXIucHJvbWlzZSgpO1xuICB9O1xuXG4gIGluc3RhbGxJbnRvID0gZnVuY3Rpb24oZncpIHtcbiAgICBmdy5EZWZlcnJlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBEZWZlcnJlZCgpO1xuICAgIH07XG4gICAgZncuYWpheCA9IHdyYXAoZncuYWpheCwgZnVuY3Rpb24oYWpheCwgb3B0aW9ucykge1xuICAgICAgdmFyIGNyZWF0ZVdyYXBwZXIsIGRlZiwgcHJvbWlzZSwgeGhyO1xuICAgICAgaWYgKG9wdGlvbnMgPT0gbnVsbCkge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgICB9XG4gICAgICBkZWYgPSBuZXcgRGVmZXJyZWQoKTtcbiAgICAgIGNyZWF0ZVdyYXBwZXIgPSBmdW5jdGlvbih3cmFwcGVkLCBmaW5pc2hlcikge1xuICAgICAgICByZXR1cm4gd3JhcCh3cmFwcGVkLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYXJncywgZnVuYztcbiAgICAgICAgICBmdW5jID0gYXJndW1lbnRzWzBdLCBhcmdzID0gMiA8PSBhcmd1bWVudHMubGVuZ3RoID8gX19zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkgOiBbXTtcbiAgICAgICAgICBpZiAoZnVuYykge1xuICAgICAgICAgICAgZnVuYy5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZpbmlzaGVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBjcmVhdGVXcmFwcGVyKG9wdGlvbnMuc3VjY2VzcywgZGVmLnJlc29sdmUpO1xuICAgICAgb3B0aW9ucy5lcnJvciA9IGNyZWF0ZVdyYXBwZXIob3B0aW9ucy5lcnJvciwgZGVmLnJlamVjdCk7XG4gICAgICB4aHIgPSBhamF4KG9wdGlvbnMpO1xuICAgICAgcHJvbWlzZSA9IGRlZi5wcm9taXNlKCk7XG4gICAgICBwcm9taXNlLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB4aHIuYWJvcnQoKTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9KTtcbiAgICByZXR1cm4gZncud2hlbiA9IF93aGVuO1xuICB9O1xuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBleHBvcnRzLkRlZmVycmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IERlZmVycmVkKCk7XG4gICAgfTtcbiAgICBleHBvcnRzLndoZW4gPSBfd2hlbjtcbiAgICBleHBvcnRzLmluc3RhbGxJbnRvID0gaW5zdGFsbEludG87XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHR5cGVvZiBaZXB0byAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbGxJbnRvKFplcHRvKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIERlZmVycmVkLndoZW4gPSBfd2hlbjtcbiAgICAgICAgRGVmZXJyZWQuaW5zdGFsbEludG8gPSBpbnN0YWxsSW50bztcbiAgICAgICAgcmV0dXJuIERlZmVycmVkO1xuICAgICAgfVxuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBaZXB0byAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpbnN0YWxsSW50byhaZXB0byk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5EZWZlcnJlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBEZWZlcnJlZCgpO1xuICAgIH07XG4gICAgdGhpcy5EZWZlcnJlZC53aGVuID0gX3doZW47XG4gICAgdGhpcy5EZWZlcnJlZC5pbnN0YWxsSW50byA9IGluc3RhbGxJbnRvO1xuICB9XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIFRpbGVMYXllcjogcmVxdWlyZSgnLi9sYXllci9leHBvcnRzJyksXG4gICAgICAgIFJlbmRlcmVyOiByZXF1aXJlKCcuL3JlbmRlcmVyL2V4cG9ydHMnKSxcbiAgICAgICAgVGlsZVJlcXVlc3RvcjogcmVxdWlyZSgnLi9yZXF1ZXN0L1RpbGVSZXF1ZXN0b3InKSxcbiAgICAgICAgTWV0YVJlcXVlc3RvcjogcmVxdWlyZSgnLi9yZXF1ZXN0L01ldGFSZXF1ZXN0b3InKVxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgSW1hZ2UgPSByZXF1aXJlKCcuL0ltYWdlJyk7XG5cbiAgICB2YXIgRGVidWcgPSBJbWFnZS5leHRlbmQoe1xuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHVubG9hZEludmlzaWJsZVRpbGVzOiB0cnVlLFxuICAgICAgICAgICAgekluZGV4OiA1MDAwXG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgICAgLy8gc2V0IHJlbmRlcmVyXG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMucmVuZGVyZXJDbGFzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTm8gYHJlbmRlcmVyQ2xhc3NgIG9wdGlvbiBmb3VuZCwgdGhpcyBsYXllciB3aWxsIG5vdCByZW5kZXIgYW55IGRhdGEuJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHJlY3Vyc2l2ZWx5IGV4dGVuZFxuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdGlvbnMucmVuZGVyZXJDbGFzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzZXQgb3B0aW9uc1xuICAgICAgICAgICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzZXQoe1xuICAgICAgICAgICAgICAgICAgICBoYXJkOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVkcmF3VGlsZTogZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgdmFyIGNvb3JkID0ge1xuICAgICAgICAgICAgICAgIHg6IHRpbGUuX3RpbGVQb2ludC54LFxuICAgICAgICAgICAgICAgIHk6IHRpbGUuX3RpbGVQb2ludC55LFxuICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5fem9vbVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyVGlsZSh0aWxlLCBjb29yZCk7XG4gICAgICAgICAgICB0aGlzLnRpbGVEcmF3bih0aWxlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfY3JlYXRlVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGlsZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LXRpbGUgbGVhZmxldC1kZWJ1Zy10aWxlJyk7XG4gICAgICAgICAgICB0aWxlLndpZHRoID0gdGhpcy5vcHRpb25zLnRpbGVTaXplO1xuICAgICAgICAgICAgdGlsZS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB0aWxlLm9uc2VsZWN0c3RhcnQgPSBMLlV0aWwuZmFsc2VGbjtcbiAgICAgICAgICAgIHRpbGUub25tb3VzZW1vdmUgPSBMLlV0aWwuZmFsc2VGbjtcbiAgICAgICAgICAgIHJldHVybiB0aWxlO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9sb2FkVGlsZTogZnVuY3Rpb24odGlsZSwgdGlsZVBvaW50KSB7XG4gICAgICAgICAgICB0aWxlLl9sYXllciA9IHRoaXM7XG4gICAgICAgICAgICB0aWxlLl90aWxlUG9pbnQgPSB0aWxlUG9pbnQ7XG4gICAgICAgICAgICB0aGlzLl9hZGp1c3RUaWxlUG9pbnQodGlsZVBvaW50KTtcbiAgICAgICAgICAgIHRoaXMuX3JlZHJhd1RpbGUodGlsZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyVGlsZTogZnVuY3Rpb24oIC8qZWxlbSwgY29vcmQqLyApIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cbiAgICAgICAgdGlsZURyYXduOiBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICB0aGlzLl90aWxlT25Mb2FkLmNhbGwodGlsZSk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBEZWJ1ZztcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBJbWFnZSA9IEwuVGlsZUxheWVyLmV4dGVuZCh7XG5cbiAgICAgICAgZ2V0T3BhY2l0eTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLm9wYWNpdHk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZNYXAuYWRkTGF5ZXIodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlkZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fcHJldk1hcCA9IHRoaXMuX21hcDtcbiAgICAgICAgICAgIHRoaXMuX21hcC5yZW1vdmVMYXllcih0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0hpZGRlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faGlkZGVuO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEJyaWdodG5lc3M6IGZ1bmN0aW9uKGJyaWdodG5lc3MpIHtcbiAgICAgICAgICAgIHRoaXMuX2JyaWdodG5lc3MgPSBicmlnaHRuZXNzO1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLmNzcygnLXdlYmtpdC1maWx0ZXInLCAnYnJpZ2h0bmVzcygnICsgKHRoaXMuX2JyaWdodG5lc3MgKiAxMDApICsgJyUpJyk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikuY3NzKCdmaWx0ZXInLCAnYnJpZ2h0bmVzcygnICsgKHRoaXMuX2JyaWdodG5lc3MgKiAxMDApICsgJyUpJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0QnJpZ2h0bmVzczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKHRoaXMuX2JyaWdodG5lc3MgIT09IHVuZGVmaW5lZCkgPyB0aGlzLl9icmlnaHRuZXNzIDogMTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IEltYWdlO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIE1JTiA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgdmFyIE1BWCA9IDA7XG5cbiAgICB2YXIgTGl2ZSA9IEwuQ2xhc3MuZXh0ZW5kKHtcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbihtZXRhLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBzZXQgcmVuZGVyZXJcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5yZW5kZXJlckNsYXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdObyBgcmVuZGVyZXJDbGFzc2Agb3B0aW9uIGZvdW5kLCB0aGlzIGxheWVyIHdpbGwgbm90IHJlbmRlciBhbnkgZGF0YS4nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmVjdXJzaXZlbHkgZXh0ZW5kIGFuZCBpbml0aWFsaXplXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZXJDbGFzcy5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcywgb3B0aW9ucy5yZW5kZXJlckNsYXNzLnByb3RvdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZXJDbGFzcy5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdGlvbnMucmVuZGVyZXJDbGFzcyk7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZXJDbGFzcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0IG9wdGlvbnNcbiAgICAgICAgICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIC8vIHNldCBtZXRhXG4gICAgICAgICAgICB0aGlzLl9tZXRhID0gbWV0YTtcbiAgICAgICAgICAgIC8vIHNldCBwYXJhbXNcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICBiaW5uaW5nOiB7fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYXJFeHRyZW1hOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2V4dHJlbWEgPSB7XG4gICAgICAgICAgICAgICAgbWluOiBNSU4sXG4gICAgICAgICAgICAgICAgbWF4OiBNQVhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEV4dHJlbWE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4dHJlbWE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlRXh0cmVtYTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIGV4dHJlbWEgPSB0aGlzLmV4dHJhY3RFeHRyZW1hKGRhdGEpO1xuICAgICAgICAgICAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChleHRyZW1hLm1pbiA8IHRoaXMuX2V4dHJlbWEubWluKSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXh0cmVtYS5taW4gPSBleHRyZW1hLm1pbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHRyZW1hLm1heCA+IHRoaXMuX2V4dHJlbWEubWF4KSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXh0cmVtYS5tYXggPSBleHRyZW1hLm1heDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VkO1xuICAgICAgICB9LFxuXG4gICAgICAgIGV4dHJhY3RFeHRyZW1hOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1pbjogXy5taW4oZGF0YSksXG4gICAgICAgICAgICAgICAgbWF4OiBfLm1heChkYXRhKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRNZXRhOiBmdW5jdGlvbihtZXRhKSB7XG4gICAgICAgICAgICB0aGlzLl9tZXRhID0gbWV0YTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldE1ldGE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX21ldGE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0UGFyYW1zOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcyA9IHBhcmFtcztcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRQYXJhbXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcztcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IExpdmU7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgSW1hZ2UgPSByZXF1aXJlKCcuL0ltYWdlJyk7XG5cbiAgICB2YXIgUGVuZGluZyA9IEltYWdlLmV4dGVuZCh7XG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgdW5sb2FkSW52aXNpYmxlVGlsZXM6IHRydWUsXG4gICAgICAgICAgICB6SW5kZXg6IDUwMDBcbiAgICAgICAgfSxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nVGlsZXMgPSB7fTtcbiAgICAgICAgICAgIC8vIHNldCByZW5kZXJlclxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnJlbmRlcmVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIGByZW5kZXJlckNsYXNzYCBvcHRpb24gZm91bmQsIHRoaXMgbGF5ZXIgd2lsbCBub3QgcmVuZGVyIGFueSBkYXRhLicpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyByZWN1cnNpdmVseSBleHRlbmRcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLCBvcHRpb25zLnJlbmRlcmVyQ2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0IG9wdGlvbnNcbiAgICAgICAgICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbmNyZW1lbnQ6IGZ1bmN0aW9uKGNvb3JkKSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IHRoaXMuX2dldFRpbGVIYXNoKGNvb3JkKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9wZW5kaW5nVGlsZXNbaGFzaF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdUaWxlc1toYXNoXSA9IDE7XG4gICAgICAgICAgICAgICAgdmFyIHRpbGVzID0gdGhpcy5fZ2V0VGlsZXNXaXRoSGFzaChoYXNoKTtcbiAgICAgICAgICAgICAgICB0aWxlcy5mb3JFYWNoKGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVkcmF3VGlsZSh0aWxlKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1RpbGVzW2hhc2hdKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVjcmVtZW50OiBmdW5jdGlvbihjb29yZCkge1xuICAgICAgICAgICAgdmFyIGhhc2ggPSB0aGlzLl9nZXRUaWxlSGFzaChjb29yZCk7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nVGlsZXNbaGFzaF0tLTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9wZW5kaW5nVGlsZXNbaGFzaF0gPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fcGVuZGluZ1RpbGVzW2hhc2hdO1xuICAgICAgICAgICAgICAgIHZhciB0aWxlcyA9IHRoaXMuX2dldFRpbGVzV2l0aEhhc2goaGFzaCk7XG4gICAgICAgICAgICAgICAgdGlsZXMuZm9yRWFjaChmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlZHJhd1RpbGUodGlsZSk7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVkcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9tYXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNldCh7XG4gICAgICAgICAgICAgICAgICAgIGhhcmQ6IHRydWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRUaWxlQ2xhc3M6IGZ1bmN0aW9uKGhhc2gpIHtcbiAgICAgICAgICAgIHJldHVybiAncGVuZGluZy0nICsgaGFzaDtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0VGlsZUhhc2g6IGZ1bmN0aW9uKGNvb3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gY29vcmQueiArICctJyArIGNvb3JkLnggKyAnLScgKyBjb29yZC55O1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRUaWxlc1dpdGhIYXNoOiBmdW5jdGlvbihoYXNoKSB7XG4gICAgICAgICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5fZ2V0VGlsZUNsYXNzKGhhc2gpO1xuICAgICAgICAgICAgdmFyIHRpbGVzID0gW107XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikuZmluZCgnLicgKyBjbGFzc05hbWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGlsZXMucHVzaCh0aGlzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRpbGVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWRyYXdUaWxlOiBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICB2YXIgY29vcmQgPSB7XG4gICAgICAgICAgICAgICAgeDogdGlsZS5fdGlsZVBvaW50LngsXG4gICAgICAgICAgICAgICAgeTogdGlsZS5fdGlsZVBvaW50LnksXG4gICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLl96b29tXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIGhhc2ggPSB0aGlzLl9nZXRUaWxlSGFzaChjb29yZCk7XG4gICAgICAgICAgICAkKHRpbGUpLmFkZENsYXNzKHRoaXMuX2dldFRpbGVDbGFzcyhoYXNoKSk7XG4gICAgICAgICAgICBpZiAodGhpcy5fcGVuZGluZ1RpbGVzW2hhc2hdID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyVGlsZSh0aWxlLCBjb29yZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRpbGUuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRpbGVEcmF3bih0aWxlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfY3JlYXRlVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGlsZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LXRpbGUgbGVhZmxldC1wZW5kaW5nLXRpbGUnKTtcbiAgICAgICAgICAgIHRpbGUud2lkdGggPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB0aWxlLmhlaWdodCA9IHRoaXMub3B0aW9ucy50aWxlU2l6ZTtcbiAgICAgICAgICAgIHRpbGUub25zZWxlY3RzdGFydCA9IEwuVXRpbC5mYWxzZUZuO1xuICAgICAgICAgICAgdGlsZS5vbm1vdXNlbW92ZSA9IEwuVXRpbC5mYWxzZUZuO1xuICAgICAgICAgICAgcmV0dXJuIHRpbGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2xvYWRUaWxlOiBmdW5jdGlvbih0aWxlLCB0aWxlUG9pbnQpIHtcbiAgICAgICAgICAgIHRpbGUuX2xheWVyID0gdGhpcztcbiAgICAgICAgICAgIHRpbGUuX3RpbGVQb2ludCA9IHRpbGVQb2ludDtcbiAgICAgICAgICAgIHRoaXMuX2FkanVzdFRpbGVQb2ludCh0aWxlUG9pbnQpO1xuICAgICAgICAgICAgdGhpcy5fcmVkcmF3VGlsZSh0aWxlKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbiggLyplbGVtKi8gKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9LFxuXG4gICAgICAgIHRpbGVEcmF3bjogZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgdGhpcy5fdGlsZU9uTG9hZC5jYWxsKHRpbGUpO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gUGVuZGluZztcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIGRlYnVnIHRpbGUgbGF5ZXJcbiAgICB2YXIgRGVidWcgPSByZXF1aXJlKCcuL2NvcmUvRGVidWcnKTtcblxuICAgIC8vIHBlbmRpbmcgdGlsZSBsYXllclxuICAgIHZhciBQZW5kaW5nID0gcmVxdWlyZSgnLi9jb3JlL1BlbmRpbmcnKTtcblxuICAgIC8vIHN0YW5kYXJkIFhZWiAvIFRNWCBpbWFnZSBsYXllclxuICAgIHZhciBJbWFnZSA9IHJlcXVpcmUoJy4vY29yZS9JbWFnZScpO1xuXG4gICAgLy8gbGl2ZSB0aWxlIGxheWVyc1xuICAgIHZhciBIZWF0bWFwID0gcmVxdWlyZSgnLi90eXBlcy9IZWF0bWFwJyk7XG4gICAgdmFyIFRvcENvdW50ID0gcmVxdWlyZSgnLi90eXBlcy9Ub3BDb3VudCcpO1xuICAgIHZhciBUb3BGcmVxdWVuY3kgPSByZXF1aXJlKCcuL3R5cGVzL1RvcEZyZXF1ZW5jeScpO1xuICAgIHZhciBUb3BpY0NvdW50ID0gcmVxdWlyZSgnLi90eXBlcy9Ub3BpY0NvdW50Jyk7XG4gICAgdmFyIFRvcGljRnJlcXVlbmN5ID0gcmVxdWlyZSgnLi90eXBlcy9Ub3BpY0ZyZXF1ZW5jeScpO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIERlYnVnOiBEZWJ1ZyxcbiAgICAgICAgUGVuZGluZzogUGVuZGluZyxcbiAgICAgICAgSW1hZ2U6IEltYWdlLFxuICAgICAgICBIZWF0bWFwOiBIZWF0bWFwLFxuICAgICAgICBUb3BDb3VudDogVG9wQ291bnQsXG4gICAgICAgIFRvcEZyZXF1ZW5jeTogVG9wRnJlcXVlbmN5LFxuICAgICAgICBUb3BpY0NvdW50OiBUb3BpY0NvdW50LFxuICAgICAgICBUb3BpY0ZyZXF1ZW5jeTogVG9waWNGcmVxdWVuY3lcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZnVuY3Rpb24gcmdiMmxhYihyZ2IpIHtcbiAgICAgICAgdmFyIHIgPSByZ2JbMF0gPiAwLjA0MDQ1ID8gTWF0aC5wb3coKHJnYlswXSArIDAuMDU1KSAvIDEuMDU1LCAyLjQpIDogcmdiWzBdIC8gMTIuOTI7XG4gICAgICAgIHZhciBnID0gcmdiWzFdID4gMC4wNDA0NSA/IE1hdGgucG93KChyZ2JbMV0gKyAwLjA1NSkgLyAxLjA1NSwgMi40KSA6IHJnYlsxXSAvIDEyLjkyO1xuICAgICAgICB2YXIgYiA9IHJnYlsyXSA+IDAuMDQwNDUgPyBNYXRoLnBvdygocmdiWzJdICsgMC4wNTUpIC8gMS4wNTUsIDIuNCkgOiByZ2JbMl0gLyAxMi45MjtcbiAgICAgICAgLy9PYnNlcnZlci4gPSAywrAsIElsbHVtaW5hbnQgPSBENjVcbiAgICAgICAgdmFyIHggPSByICogMC40MTI0NTY0ICsgZyAqIDAuMzU3NTc2MSArIGIgKiAwLjE4MDQzNzU7XG4gICAgICAgIHZhciB5ID0gciAqIDAuMjEyNjcyOSArIGcgKiAwLjcxNTE1MjIgKyBiICogMC4wNzIxNzUwO1xuICAgICAgICB2YXIgeiA9IHIgKiAwLjAxOTMzMzkgKyBnICogMC4xMTkxOTIwICsgYiAqIDAuOTUwMzA0MTtcbiAgICAgICAgeCA9IHggLyAwLjk1MDQ3OyAvLyBPYnNlcnZlcj0gMsKwLCBJbGx1bWluYW50PSBENjVcbiAgICAgICAgeSA9IHkgLyAxLjAwMDAwO1xuICAgICAgICB6ID0geiAvIDEuMDg4ODM7XG4gICAgICAgIHggPSB4ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh4LCAxIC8gMykgOiAoNy43ODcwMzcgKiB4KSArICgxNiAvIDExNik7XG4gICAgICAgIHkgPSB5ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh5LCAxIC8gMykgOiAoNy43ODcwMzcgKiB5KSArICgxNiAvIDExNik7XG4gICAgICAgIHogPSB6ID4gMC4wMDg4NTYgPyBNYXRoLnBvdyh6LCAxIC8gMykgOiAoNy43ODcwMzcgKiB6KSArICgxNiAvIDExNik7XG4gICAgICAgIHJldHVybiBbKDExNiAqIHkpIC0gMTYsXG4gICAgICAgICAgICA1MDAgKiAoeCAtIHkpLFxuICAgICAgICAgICAgMjAwICogKHkgLSB6KSxcbiAgICAgICAgICAgIHJnYlszXV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGFiMnJnYihsYWIpIHtcbiAgICAgICAgdmFyIHkgPSAobGFiWzBdICsgMTYpIC8gMTE2O1xuICAgICAgICB2YXIgeCA9IHkgKyBsYWJbMV0gLyA1MDA7XG4gICAgICAgIHZhciB6ID0geSAtIGxhYlsyXSAvIDIwMDtcbiAgICAgICAgeCA9IHggPiAwLjIwNjg5MzAzNCA/IHggKiB4ICogeCA6ICh4IC0gNCAvIDI5KSAvIDcuNzg3MDM3O1xuICAgICAgICB5ID0geSA+IDAuMjA2ODkzMDM0ID8geSAqIHkgKiB5IDogKHkgLSA0IC8gMjkpIC8gNy43ODcwMzc7XG4gICAgICAgIHogPSB6ID4gMC4yMDY4OTMwMzQgPyB6ICogeiAqIHogOiAoeiAtIDQgLyAyOSkgLyA3Ljc4NzAzNztcbiAgICAgICAgeCA9IHggKiAwLjk1MDQ3OyAvLyBPYnNlcnZlcj0gMsKwLCBJbGx1bWluYW50PSBENjVcbiAgICAgICAgeSA9IHkgKiAxLjAwMDAwO1xuICAgICAgICB6ID0geiAqIDEuMDg4ODM7XG4gICAgICAgIHZhciByID0geCAqIDMuMjQwNDU0MiArIHkgKiAtMS41MzcxMzg1ICsgeiAqIC0wLjQ5ODUzMTQ7XG4gICAgICAgIHZhciBnID0geCAqIC0wLjk2OTI2NjAgKyB5ICogMS44NzYwMTA4ICsgeiAqIDAuMDQxNTU2MDtcbiAgICAgICAgdmFyIGIgPSB4ICogMC4wNTU2NDM0ICsgeSAqIC0wLjIwNDAyNTkgKyB6ICogMS4wNTcyMjUyO1xuICAgICAgICByID0gciA+IDAuMDAzMDQgPyAxLjA1NSAqIE1hdGgucG93KHIsIDEgLyAyLjQpIC0gMC4wNTUgOiAxMi45MiAqIHI7XG4gICAgICAgIGcgPSBnID4gMC4wMDMwNCA/IDEuMDU1ICogTWF0aC5wb3coZywgMSAvIDIuNCkgLSAwLjA1NSA6IDEyLjkyICogZztcbiAgICAgICAgYiA9IGIgPiAwLjAwMzA0ID8gMS4wNTUgKiBNYXRoLnBvdyhiLCAxIC8gMi40KSAtIDAuMDU1IDogMTIuOTIgKiBiO1xuICAgICAgICByZXR1cm4gW01hdGgubWF4KE1hdGgubWluKHIsIDEpLCAwKSwgTWF0aC5tYXgoTWF0aC5taW4oZywgMSksIDApLCBNYXRoLm1heChNYXRoLm1pbihiLCAxKSwgMCksIGxhYlszXV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzdGFuY2UoYzEsIGMyKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoXG4gICAgICAgICAgICAoYzFbMF0gLSBjMlswXSkgKiAoYzFbMF0gLSBjMlswXSkgK1xuICAgICAgICAgICAgKGMxWzFdIC0gYzJbMV0pICogKGMxWzFdIC0gYzJbMV0pICtcbiAgICAgICAgICAgIChjMVsyXSAtIGMyWzJdKSAqIChjMVsyXSAtIGMyWzJdKSArXG4gICAgICAgICAgICAoYzFbM10gLSBjMlszXSkgKiAoYzFbM10gLSBjMlszXSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICB2YXIgR1JBRElFTlRfU1RFUFMgPSAyMDA7XG5cbiAgICAvLyBJbnRlcnBvbGF0ZSBiZXR3ZWVuIGEgc2V0IG9mIGNvbG9ycyB1c2luZyBldmVuIHBlcmNlcHR1YWwgZGlzdGFuY2UgYW5kIGludGVycG9sYXRpb24gaW4gQ0lFIEwqYSpiKiBzcGFjZVxuICAgIHZhciBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZSA9IGZ1bmN0aW9uKGJhc2VDb2xvcnMpIHtcbiAgICAgICAgdmFyIG91dHB1dEdyYWRpZW50ID0gW107XG4gICAgICAgIC8vIENhbGN1bGF0ZSBwZXJjZXB0dWFsIHNwcmVhZCBpbiBMKmEqYiogc3BhY2VcbiAgICAgICAgdmFyIGxhYnMgPSBfLm1hcChiYXNlQ29sb3JzLCBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIHJnYjJsYWIoW2NvbG9yWzBdIC8gMjU1LCBjb2xvclsxXSAvIDI1NSwgY29sb3JbMl0gLyAyNTUsIGNvbG9yWzNdIC8gMjU1XSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgZGlzdGFuY2VzID0gXy5tYXAobGFicywgZnVuY3Rpb24oY29sb3IsIGluZGV4LCBjb2xvcnMpIHtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCA+IDAgPyBkaXN0YW5jZShjb2xvciwgY29sb3JzW2luZGV4IC0gMV0pIDogMDtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIENhbGN1bGF0ZSBjdW11bGF0aXZlIGRpc3RhbmNlcyBpbiBbMCwxXVxuICAgICAgICB2YXIgdG90YWxEaXN0YW5jZSA9IF8ucmVkdWNlKGRpc3RhbmNlcywgZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgKyBiO1xuICAgICAgICB9LCAwKTtcbiAgICAgICAgZGlzdGFuY2VzID0gXy5tYXAoZGlzdGFuY2VzLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gZCAvIHRvdGFsRGlzdGFuY2U7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgZGlzdGFuY2VUcmF2ZXJzZWQgPSAwO1xuICAgICAgICB2YXIga2V5ID0gMDtcbiAgICAgICAgdmFyIHByb2dyZXNzO1xuICAgICAgICB2YXIgc3RlcFByb2dyZXNzO1xuICAgICAgICB2YXIgcmdiO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IEdSQURJRU5UX1NURVBTOyBpKyspIHtcbiAgICAgICAgICAgIHByb2dyZXNzID0gaSAvIChHUkFESUVOVF9TVEVQUyAtIDEpO1xuICAgICAgICAgICAgaWYgKHByb2dyZXNzID4gZGlzdGFuY2VUcmF2ZXJzZWQgKyBkaXN0YW5jZXNba2V5ICsgMV0gJiYga2V5ICsgMSA8IGxhYnMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgIGtleSArPSAxO1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlVHJhdmVyc2VkICs9IGRpc3RhbmNlc1trZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RlcFByb2dyZXNzID0gKHByb2dyZXNzIC0gZGlzdGFuY2VUcmF2ZXJzZWQpIC8gZGlzdGFuY2VzW2tleSArIDFdO1xuICAgICAgICAgICAgcmdiID0gbGFiMnJnYihbXG4gICAgICAgICAgICAgICAgbGFic1trZXldWzBdICsgKGxhYnNba2V5ICsgMV1bMF0gLSBsYWJzW2tleV1bMF0pICogc3RlcFByb2dyZXNzLFxuICAgICAgICAgICAgICAgIGxhYnNba2V5XVsxXSArIChsYWJzW2tleSArIDFdWzFdIC0gbGFic1trZXldWzFdKSAqIHN0ZXBQcm9ncmVzcyxcbiAgICAgICAgICAgICAgICBsYWJzW2tleV1bMl0gKyAobGFic1trZXkgKyAxXVsyXSAtIGxhYnNba2V5XVsyXSkgKiBzdGVwUHJvZ3Jlc3MsXG4gICAgICAgICAgICAgICAgbGFic1trZXldWzNdICsgKGxhYnNba2V5ICsgMV1bM10gLSBsYWJzW2tleV1bM10pICogc3RlcFByb2dyZXNzXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIG91dHB1dEdyYWRpZW50LnB1c2goW1xuICAgICAgICAgICAgICAgIE1hdGgucm91bmQocmdiWzBdICogMjU1KSxcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKHJnYlsxXSAqIDI1NSksXG4gICAgICAgICAgICAgICAgTWF0aC5yb3VuZChyZ2JbMl0gKiAyNTUpLFxuICAgICAgICAgICAgICAgIE1hdGgucm91bmQocmdiWzNdICogMjU1KVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dEdyYWRpZW50O1xuICAgIH07XG5cbiAgICB2YXIgQ09PTCA9IGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlKFtcbiAgICAgICAgWzB4MDQsIDB4MjAsIDB4NDAsIDB4NTBdLFxuICAgICAgICBbMHgwOCwgMHg0MCwgMHg4MSwgMHg3Zl0sXG4gICAgICAgIFsweDA4LCAweDY4LCAweGFjLCAweGZmXSxcbiAgICAgICAgWzB4MmIsIDB4OGMsIDB4YmUsIDB4ZmZdLFxuICAgICAgICBbMHg0ZSwgMHhiMywgMHhkMywgMHhmZl0sXG4gICAgICAgIFsweDdiLCAweGNjLCAweGM0LCAweGZmXSxcbiAgICAgICAgWzB4YTgsIDB4ZGQsIDB4YjUsIDB4ZmZdLFxuICAgICAgICBbMHhjYywgMHhlYiwgMHhjNSwgMHhmZl0sXG4gICAgICAgIFsweGUwLCAweGYzLCAweGRiLCAweGZmXSxcbiAgICAgICAgWzB4ZjcsIDB4ZmMsIDB4ZjAsIDB4ZmZdXG4gICAgXSk7XG5cbiAgICB2YXIgSE9UID0gYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUoW1xuICAgICAgICBbMHg0MCwgMHgwMCwgMHgxMywgMHg1MF0sXG4gICAgICAgIFsweDgwLCAweDAwLCAweDI2LCAweDdmXSxcbiAgICAgICAgWzB4YmQsIDB4MDAsIDB4MjYsIDB4ZmZdLFxuICAgICAgICBbMHhlMywgMHgxYSwgMHgxYywgMHhmZl0sXG4gICAgICAgIFsweGZjLCAweDRlLCAweDJhLCAweGZmXSxcbiAgICAgICAgWzB4ZmQsIDB4OGQsIDB4M2MsIDB4ZmZdLFxuICAgICAgICBbMHhmZSwgMHhiMiwgMHg0YywgMHhmZl0sXG4gICAgICAgIFsweGZlLCAweGQ5LCAweDc2LCAweGZmXSxcbiAgICAgICAgWzB4ZmYsIDB4ZWQsIDB4YTAsIDB4ZmZdXG4gICAgXSk7XG5cbiAgICB2YXIgVkVSREFOVCA9IGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlKFtcbiAgICAgICAgWzB4MDAsIDB4NDAsIDB4MjYsIDB4NTBdLFxuICAgICAgICBbMHgwMCwgMHg1YSwgMHgzMiwgMHg3Zl0sXG4gICAgICAgIFsweDIzLCAweDg0LCAweDQzLCAweGZmXSxcbiAgICAgICAgWzB4NDEsIDB4YWIsIDB4NWQsIDB4ZmZdLFxuICAgICAgICBbMHg3OCwgMHhjNiwgMHg3OSwgMHhmZl0sXG4gICAgICAgIFsweGFkLCAweGRkLCAweDhlLCAweGZmXSxcbiAgICAgICAgWzB4ZDksIDB4ZjAsIDB4YTMsIDB4ZmZdLFxuICAgICAgICBbMHhmNywgMHhmYywgMHhiOSwgMHhmZl0sXG4gICAgICAgIFsweGZmLCAweGZmLCAweGU1LCAweGZmXVxuICAgIF0pO1xuXG4gICAgdmFyIFNQRUNUUkFMID0gYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUoW1xuICAgICAgICBbMHgyNiwgMHgxYSwgMHg0MCwgMHg1MF0sXG4gICAgICAgIFsweDQ0LCAweDJmLCAweDcyLCAweDdmXSxcbiAgICAgICAgWzB4ZTEsIDB4MmIsIDB4MDIsIDB4ZmZdLFxuICAgICAgICBbMHgwMiwgMHhkYywgMHgwMSwgMHhmZl0sXG4gICAgICAgIFsweGZmLCAweGQyLCAweDAyLCAweGZmXSxcbiAgICAgICAgWzB4ZmYsIDB4ZmYsIDB4ZmYsIDB4ZmZdXG4gICAgXSk7XG5cbiAgICB2YXIgVEVNUEVSQVRVUkUgPSBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZShbXG4gICAgICAgIFsweDAwLCAweDE2LCAweDQwLCAweDUwXSxcbiAgICAgICAgWzB4MDAsIDB4MzksIDB4NjYsIDB4N2ZdLCAvL2JsdWVcbiAgICAgICAgWzB4MzEsIDB4M2QsIDB4NjYsIDB4ZmZdLCAvL3B1cnBsZVxuICAgICAgICBbMHhlMSwgMHgyYiwgMHgwMiwgMHhmZl0sIC8vcmVkXG4gICAgICAgIFsweGZmLCAweGQyLCAweDAyLCAweGZmXSwgLy95ZWxsb3dcbiAgICAgICAgWzB4ZmYsIDB4ZmYsIDB4ZmYsIDB4ZmZdIC8vd2hpdGVcbiAgICBdKTtcblxuICAgIHZhciBHUkVZU0NBTEUgPSBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZShbXG4gICAgICAgIFsweDAwLCAweDAwLCAweDAwLCAweDdmXSxcbiAgICAgICAgWzB4NDAsIDB4NDAsIDB4NDAsIDB4ZmZdLFxuICAgICAgICBbMHhmZiwgMHhmZiwgMHhmZiwgMHhmZl1cbiAgICBdKTtcblxuICAgIHZhciBQT0xBUl9IT1QgPSBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZShbXG4gICAgICAgIFsgMHhmZiwgMHg0NCwgMHgwMCwgMHhmZiBdLFxuICAgICAgICBbIDB4YmQsIDB4YmQsIDB4YmQsIDB4YjAgXVxuICAgIF0pO1xuXG4gICAgdmFyIFBPTEFSX0NPTEQgPSBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZShbXG4gICAgICAgIFsgMHhiZCwgMHhiZCwgMHhiZCwgMHhiMCBdLFxuICAgICAgICBbIDB4MzIsIDB4YTUsIDB4ZjksIDB4ZmYgXVxuICAgIF0pO1xuXG4gICAgdmFyIGJ1aWxkTG9va3VwRnVuY3Rpb24gPSBmdW5jdGlvbihSQU1QKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihzY2FsZWRWYWx1ZSwgaW5Db2xvcikge1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gUkFNUFtNYXRoLmZsb29yKHNjYWxlZFZhbHVlICogKFJBTVAubGVuZ3RoIC0gMSkpXTtcbiAgICAgICAgICAgIGluQ29sb3JbMF0gPSBjb2xvclswXTtcbiAgICAgICAgICAgIGluQ29sb3JbMV0gPSBjb2xvclsxXTtcbiAgICAgICAgICAgIGluQ29sb3JbMl0gPSBjb2xvclsyXTtcbiAgICAgICAgICAgIGluQ29sb3JbM10gPSBjb2xvclszXTtcbiAgICAgICAgICAgIHJldHVybiBpbkNvbG9yO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgQ29sb3JSYW1wID0ge1xuICAgICAgICBjb29sOiBidWlsZExvb2t1cEZ1bmN0aW9uKENPT0wpLFxuICAgICAgICBob3Q6IGJ1aWxkTG9va3VwRnVuY3Rpb24oSE9UKSxcbiAgICAgICAgdmVyZGFudDogYnVpbGRMb29rdXBGdW5jdGlvbihWRVJEQU5UKSxcbiAgICAgICAgc3BlY3RyYWw6IGJ1aWxkTG9va3VwRnVuY3Rpb24oU1BFQ1RSQUwpLFxuICAgICAgICB0ZW1wZXJhdHVyZTogYnVpbGRMb29rdXBGdW5jdGlvbihURU1QRVJBVFVSRSksXG4gICAgICAgIGdyZXk6IGJ1aWxkTG9va3VwRnVuY3Rpb24oR1JFWVNDQUxFKSxcbiAgICAgICAgcG9sYXI6IGJ1aWxkTG9va3VwRnVuY3Rpb24oUE9MQVJfSE9ULmNvbmNhdChQT0xBUl9DT0xEKSlcbiAgICB9O1xuXG4gICAgdmFyIHNldENvbG9yUmFtcCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdmFyIGZ1bmMgPSBDb2xvclJhbXBbdHlwZS50b0xvd2VyQ2FzZSgpXTtcbiAgICAgICAgaWYgKGZ1bmMpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbG9yUmFtcCA9IGZ1bmM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRDb2xvclJhbXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbG9yUmFtcDtcbiAgICB9O1xuXG4gICAgdmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fY29sb3JSYW1wID0gQ29sb3JSYW1wLnZlcmRhbnQ7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBpbml0aWFsaXplOiBpbml0aWFsaXplLFxuICAgICAgICBzZXRDb2xvclJhbXA6IHNldENvbG9yUmFtcCxcbiAgICAgICAgZ2V0Q29sb3JSYW1wOiBnZXRDb2xvclJhbXBcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFNJR01PSURfU0NBTEUgPSAwLjE1O1xuXG4gICAgLy8gbG9nMTBcblxuICAgIGZ1bmN0aW9uIGxvZzEwVHJhbnNmb3JtKHZhbCwgbWluLCBtYXgpIHtcbiAgICAgICAgdmFyIGxvZ01pbiA9IE1hdGgubG9nMTAobWluIHx8IDEpO1xuICAgICAgICB2YXIgbG9nTWF4ID0gTWF0aC5sb2cxMChtYXggfHwgMSk7XG4gICAgICAgIHZhciBsb2dWYWwgPSBNYXRoLmxvZzEwKHZhbCB8fCAxKTtcbiAgICAgICAgcmV0dXJuIChsb2dWYWwgLSBsb2dNaW4pIC8gKChsb2dNYXggLSBsb2dNaW4pIHx8IDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludmVyc2VMb2cxMFRyYW5zZm9ybShudmFsLCBtaW4sIG1heCkge1xuICAgICAgICB2YXIgbG9nTWluID0gTWF0aC5sb2cxMChtaW4gfHwgMSk7XG4gICAgICAgIHZhciBsb2dNYXggPSBNYXRoLmxvZzEwKG1heCB8fCAxKTtcbiAgICAgICAgcmV0dXJuIE1hdGgucG93KDEwLCAobnZhbCAqIGxvZ01heCAtIG52YWwgKiBsb2dNaW4pICsgbG9nTWluKTtcbiAgICB9XG5cbiAgICAvLyBzaWdtb2lkXG5cbiAgICBmdW5jdGlvbiBzaWdtb2lkVHJhbnNmb3JtKHZhbCwgbWluLCBtYXgpIHtcbiAgICAgICAgdmFyIGFic01pbiA9IE1hdGguYWJzKG1pbik7XG4gICAgICAgIHZhciBhYnNNYXggPSBNYXRoLmFicyhtYXgpO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLm1heChhYnNNaW4sIGFic01heCk7XG4gICAgICAgIHZhciBzY2FsZWRWYWwgPSB2YWwgLyAoU0lHTU9JRF9TQ0FMRSAqIGRpc3RhbmNlKTtcbiAgICAgICAgcmV0dXJuIDEgLyAoMSArIE1hdGguZXhwKC1zY2FsZWRWYWwpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnZlcnNlU2lnbW9pZFRyYW5zZm9ybShudmFsLCBtaW4sIG1heCkge1xuICAgICAgICB2YXIgYWJzTWluID0gTWF0aC5hYnMobWluKTtcbiAgICAgICAgdmFyIGFic01heCA9IE1hdGguYWJzKG1heCk7XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IE1hdGgubWF4KGFic01pbiwgYWJzTWF4KTtcbiAgICAgICAgcmV0dXJuIE1hdGgubG9nKCgxL252YWwpIC0gMSkgKiAtKFNJR01PSURfU0NBTEUgKiBkaXN0YW5jZSk7XG4gICAgfVxuXG4gICAgLy8gbGluZWFyXG5cbiAgICBmdW5jdGlvbiBsaW5lYXJUcmFuc2Zvcm0odmFsLCBtaW4sIG1heCkge1xuICAgICAgICB2YXIgcmFuZ2UgPSBtYXggLSBtaW47XG4gICAgICAgIHJldHVybiAodmFsIC0gbWluKSAvIHJhbmdlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludmVyc2VMaW5lYXJUcmFuc2Zvcm0obnZhbCwgbWluLCBtYXgpIHtcbiAgICAgICAgdmFyIHJhbmdlID0gbWF4IC0gbWluO1xuICAgICAgICByZXR1cm4gbWluICsgbnZhbCAqIHJhbmdlO1xuICAgIH1cblxuICAgIHZhciBUcmFuc2Zvcm0gPSB7XG4gICAgICAgIGxpbmVhcjogbGluZWFyVHJhbnNmb3JtLFxuICAgICAgICBsb2cxMDogbG9nMTBUcmFuc2Zvcm0sXG4gICAgICAgIHNpZ21vaWQ6IHNpZ21vaWRUcmFuc2Zvcm1cbiAgICB9O1xuXG4gICAgdmFyIEludmVyc2UgPSB7XG4gICAgICAgIGxpbmVhcjogaW52ZXJzZUxpbmVhclRyYW5zZm9ybSxcbiAgICAgICAgbG9nMTA6IGludmVyc2VMb2cxMFRyYW5zZm9ybSxcbiAgICAgICAgc2lnbW9pZDogaW52ZXJzZVNpZ21vaWRUcmFuc2Zvcm1cbiAgICB9O1xuXG4gICAgdmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmFuZ2UgPSB7XG4gICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICBtYXg6IDFcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fdHJhbnNmb3JtRnVuYyA9IGxvZzEwVHJhbnNmb3JtO1xuICAgICAgICB0aGlzLl9pbnZlcnNlRnVuYyA9IGludmVyc2VMb2cxMFRyYW5zZm9ybTtcbiAgICB9O1xuXG4gICAgdmFyIHNldFRyYW5zZm9ybUZ1bmMgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHZhciBmdW5jID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB0aGlzLl90cmFuc2Zvcm1GdW5jID0gVHJhbnNmb3JtW2Z1bmNdO1xuICAgICAgICB0aGlzLl9pbnZlcnNlRnVuYyA9IEludmVyc2VbZnVuY107XG4gICAgfTtcblxuICAgIHZhciBzZXRWYWx1ZVJhbmdlID0gZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgdGhpcy5fcmFuZ2UubWluID0gcmFuZ2UubWluO1xuICAgICAgICB0aGlzLl9yYW5nZS5tYXggPSByYW5nZS5tYXg7XG4gICAgfTtcblxuICAgIHZhciBnZXRWYWx1ZVJhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yYW5nZTtcbiAgICB9O1xuXG4gICAgdmFyIGludGVycG9sYXRlVG9SYW5nZSA9IGZ1bmN0aW9uKG52YWwpIHtcbiAgICAgICAgLy8gaW50ZXJwb2xhdGUgYmV0d2VlbiB0aGUgZmlsdGVyIHJhbmdlXG4gICAgICAgIHZhciByTWluID0gdGhpcy5fcmFuZ2UubWluO1xuICAgICAgICB2YXIgck1heCA9IHRoaXMuX3JhbmdlLm1heDtcbiAgICAgICAgdmFyIHJ2YWwgPSAobnZhbCAtIHJNaW4pIC8gKHJNYXggLSByTWluKTtcbiAgICAgICAgLy8gZW5zdXJlIG91dHB1dCBpcyBbMDoxXVxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcnZhbCkpO1xuICAgIH07XG5cbiAgICB2YXIgdHJhbnNmb3JtVmFsdWUgPSBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgLy8gY2xhbXAgdGhlIHZhbHVlIGJldHdlZW4gdGhlIGV4dHJlbWUgKHNob3VsZG4ndCBiZSBuZWNlc3NhcnkpXG4gICAgICAgIHZhciBtaW4gPSB0aGlzLl9leHRyZW1hLm1pbjtcbiAgICAgICAgdmFyIG1heCA9IHRoaXMuX2V4dHJlbWEubWF4O1xuICAgICAgICB2YXIgY2xhbXBlZCA9IE1hdGgubWF4KE1hdGgubWluKHZhbCwgbWF4KSwgbWluKTtcbiAgICAgICAgLy8gbm9ybWFsaXplIHRoZSB2YWx1ZVxuICAgICAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtRnVuYyhjbGFtcGVkLCBtaW4sIG1heCk7XG4gICAgfTtcblxuICAgIHZhciB1bnRyYW5zZm9ybVZhbHVlID0gZnVuY3Rpb24obnZhbCkge1xuICAgICAgICB2YXIgbWluID0gdGhpcy5fZXh0cmVtYS5taW47XG4gICAgICAgIHZhciBtYXggPSB0aGlzLl9leHRyZW1hLm1heDtcbiAgICAgICAgLy8gY2xhbXAgdGhlIHZhbHVlIGJldHdlZW4gdGhlIGV4dHJlbWUgKHNob3VsZG4ndCBiZSBuZWNlc3NhcnkpXG4gICAgICAgIHZhciBjbGFtcGVkID0gTWF0aC5tYXgoTWF0aC5taW4obnZhbCwgMSksIDApO1xuICAgICAgICAvLyB1bm5vcm1hbGl6ZSB0aGUgdmFsdWVcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludmVyc2VGdW5jKGNsYW1wZWQsIG1pbiwgbWF4KTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGluaXRpYWxpemU6IGluaXRpYWxpemUsXG4gICAgICAgIHNldFRyYW5zZm9ybUZ1bmM6IHNldFRyYW5zZm9ybUZ1bmMsXG4gICAgICAgIHNldFZhbHVlUmFuZ2U6IHNldFZhbHVlUmFuZ2UsXG4gICAgICAgIGdldFZhbHVlUmFuZ2U6IGdldFZhbHVlUmFuZ2UsXG4gICAgICAgIHRyYW5zZm9ybVZhbHVlOiB0cmFuc2Zvcm1WYWx1ZSxcbiAgICAgICAgdW50cmFuc2Zvcm1WYWx1ZTogdW50cmFuc2Zvcm1WYWx1ZSxcbiAgICAgICAgaW50ZXJwb2xhdGVUb1JhbmdlOiBpbnRlcnBvbGF0ZVRvUmFuZ2VcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFRpbGluZyA9IHJlcXVpcmUoJy4vVGlsaW5nJyk7XG5cbiAgICB2YXIgc2V0UmVzb2x1dGlvbiA9IGZ1bmN0aW9uKHJlc29sdXRpb24pIHtcbiAgICAgICAgaWYgKHJlc29sdXRpb24gIT09IHRoaXMuX3BhcmFtcy5iaW5uaW5nLnJlc29sdXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnJlc29sdXRpb24gPSByZXNvbHV0aW9uO1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFJlc29sdXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnJlc29sdXRpb247XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAvLyB0aWxpbmdcbiAgICAgICAgc2V0WEZpZWxkOiBUaWxpbmcuc2V0WEZpZWxkLFxuICAgICAgICBnZXRYRmllbGQ6IFRpbGluZy5nZXRYRmllbGQsXG4gICAgICAgIHNldFlGaWVsZDogVGlsaW5nLnNldFlGaWVsZCxcbiAgICAgICAgZ2V0WUZpZWxkOiBUaWxpbmcuZ2V0WUZpZWxkLFxuICAgICAgICAvLyBiaW5uaW5nXG4gICAgICAgIHNldFJlc29sdXRpb246IHNldFJlc29sdXRpb24sXG4gICAgICAgIGdldFJlc29sdXRpb246IGdldFJlc29sdXRpb25cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCl7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGZ1bmN0aW9uIGlzVmFsaWRRdWVyeShtZXRhLCBxdWVyeSl7XG4gICAgaWYgKHF1ZXJ5ICYmIEFycmF5LmlzQXJyYXkocXVlcnkubXVzdCkpe1xuICAgICAgdmFyIHF1ZXJ5Q29tcG9uZW50Q2hlY2sgPSB0cnVlO1xuXG4gICAgICBxdWVyeS5tdXN0LmZvckVhY2goZnVuY3Rpb24ocXVlcnlJdGVtKXtcbiAgICAgICAgdmFyIHF1ZXJ5Q29uZmlnID0gcXVlcnlJdGVtLnRlcm0gfHwgcXVlcnlJdGVtLnJhbmdlO1xuICAgICAgICBxdWVyeUNvbXBvbmVudENoZWNrID0gcXVlcnlDb21wb25lbnRDaGVjayAmJiBtZXRhW3F1ZXJ5Q29uZmlnLmZpZWxkXTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcXVlcnlDb21wb25lbnRDaGVjaztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZEJvb2xRdWVyeShxdWVyeSl7XG5cbiAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGE7XG4gICAgaWYgKGlzVmFsaWRRdWVyeShtZXRhLCBxdWVyeSkpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdWYWxpZCBib29sX3F1ZXJ5Jyk7XG4gICAgICB0aGlzLl9wYXJhbXMuYm9vbF9xdWVyeSA9IHF1ZXJ5O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgYm9vbF9xdWVyeScpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZUJvb2xRdWVyeSgpe1xuICAgIHRoaXMuX3BhcmFtcy5ib29sX3F1ZXJ5ID0gbnVsbDtcbiAgICBkZWxldGUgdGhpcy5fcGFyYW1zLmJvb2xfcXVlcnk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRCb29sUXVlcnkoKXtcbiAgICByZXR1cm4gdGhpcy5fcGFyYW1zLmJvb2xfcXVlcnk7XG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhZGRCb29sUXVlcnkgOiBhZGRCb29sUXVlcnksXG4gICAgcmVtb3ZlQm9vbFF1ZXJ5IDogcmVtb3ZlQm9vbFF1ZXJ5LFxuICAgIGdldEJvb2xRdWVyeSA6IGdldEJvb2xRdWVyeVxuICB9O1xufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBzZXREYXRlSGlzdG9ncmFtID0gZnVuY3Rpb24oZmllbGQsIGZyb20sIHRvLCBpbnRlcnZhbCkge1xuICAgICAgICBpZiAoIWZpZWxkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0RhdGVIaXN0b2dyYW0gYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZyb20gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdEYXRlSGlzdG9ncmFtIGBmcm9tYCBhcmUgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0byA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0RhdGVIaXN0b2dyYW0gYHRvYCBhcmUgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhcmFtcy5kYXRlX2hpc3RvZ3JhbSA9IHtcbiAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgIGZyb206IGZyb20sXG4gICAgICAgICAgICB0bzogdG8sXG4gICAgICAgICAgICBpbnRlcnZhbDogaW50ZXJ2YWxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXREYXRlSGlzdG9ncmFtID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMuZGF0ZV9oaXN0b2dyYW07XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBzZXREYXRlSGlzdG9ncmFtOiBzZXREYXRlSGlzdG9ncmFtLFxuICAgICAgICBnZXREYXRlSGlzdG9ncmFtOiBnZXREYXRlSGlzdG9ncmFtXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBzZXRIaXN0b2dyYW0gPSBmdW5jdGlvbihmaWVsZCwgaW50ZXJ2YWwpIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdIaXN0b2dyYW0gYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpbnRlcnZhbCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdIaXN0b2dyYW0gYGludGVydmFsYCBhcmUgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhcmFtcy5oaXN0b2dyYW0gPSB7XG4gICAgICAgICAgICBmaWVsZDogZmllbGQsXG4gICAgICAgICAgICBpbnRlcnZhbDogaW50ZXJ2YWxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRIaXN0b2dyYW0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5oaXN0b2dyYW07XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBzZXRIaXN0b2dyYW06IHNldEhpc3RvZ3JhbSxcbiAgICAgICAgZ2V0SGlzdG9ncmFtOiBnZXRIaXN0b2dyYW1cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIE1FVFJJQ1MgPSB7XG4gICAgICAgICdtaW4nOiB0cnVlLFxuICAgICAgICAnbWF4JzogdHJ1ZSxcbiAgICAgICAgJ3N1bSc6IHRydWUsXG4gICAgICAgICdhdmcnOiB0cnVlXG4gICAgfTtcblxuICAgIHZhciBjaGVja0ZpZWxkID0gZnVuY3Rpb24obWV0YSwgZmllbGQpIHtcbiAgICAgICAgaWYgKG1ldGEpIHtcbiAgICAgICAgICAgIGlmIChtZXRhLmV4dHJlbWEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IG9yZGluYWwgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIHNldE1ldHJpY0FnZyA9IGZ1bmN0aW9uKGZpZWxkLCB0eXBlKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignTWV0cmljQWdnIGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdNZXRyaWNBZ2cgYHR5cGVgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGFbZmllbGRdO1xuICAgICAgICBpZiAoY2hlY2tGaWVsZChtZXRhLCBmaWVsZCkpIHtcbiAgICAgICAgICAgIGlmICghTUVUUklDU1t0eXBlXSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTWV0cmljQWdnIHR5cGUgYCcgKyB0eXBlICsgJ2AgaXMgbm90IHN1cHBvcnRlZC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMubWV0cmljX2FnZyA9IHtcbiAgICAgICAgICAgICAgICBmaWVsZDogZmllbGQsXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRNZXRyaWNBZ2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5tZXRyaWNfYWdnO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgLy8gdGlsaW5nXG4gICAgICAgIHNldE1ldHJpY0FnZzogc2V0TWV0cmljQWdnLFxuICAgICAgICBnZXRNZXRyaWNBZ2c6IGdldE1ldHJpY0FnZyxcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IG9mIHR5cGUgYHN0cmluZ2AgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIG5vcm1hbGl6ZVRlcm1zID0gZnVuY3Rpb24ocHJlZml4ZXMpIHtcbiAgICAgICAgcHJlZml4ZXMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICBpZiAoYSA8IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByZWZpeGVzO1xuICAgIH07XG5cbiAgICB2YXIgYWRkUHJlZml4RmlsdGVyID0gZnVuY3Rpb24oZmllbGQsIHByZWZpeGVzKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUHJlZml4RmlsdGVyIGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmVmaXhlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1ByZWZpeEZpbHRlciBgcHJlZml4ZXNgIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1ldGEgPSB0aGlzLl9tZXRhW2ZpZWxkXTtcbiAgICAgICAgaWYgKGNoZWNrRmllbGQobWV0YSwgZmllbGQpKSB7XG4gICAgICAgICAgICB2YXIgZmlsdGVyID0gXy5maW5kKHRoaXMuX3BhcmFtcy5wcmVmaXhfZmlsdGVyLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyLmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignUmFuZ2Ugd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBhbHJlYWR5IGV4aXN0cywgdXNlZCBgdXBkYXRlUmFuZ2VgIGluc3RlYWQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnByZWZpeF9maWx0ZXIgPSB0aGlzLl9wYXJhbXMucHJlZml4X2ZpbHRlciB8fCBbXTtcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5wcmVmaXhfZmlsdGVyLnB1c2goe1xuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgICAgICBwcmVmaXhlczogbm9ybWFsaXplVGVybXMocHJlZml4ZXMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGVQcmVmaXhGaWx0ZXIgPSBmdW5jdGlvbihmaWVsZCwgcHJlZml4ZXMpIHtcbiAgICAgICAgdmFyIGZpbHRlciA9IF8uZmluZCh0aGlzLl9wYXJhbXMucHJlZml4X2ZpbHRlciwgZnVuY3Rpb24oZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyLmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JhbmdlIHdpdGggYGZpZWxkYCBvZiBgJyArIGZpZWxkICsgJ2AgZG9lcyBub3QgZXhpc3QuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByZWZpeGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZpbHRlci5wcmVmaXhlcyA9IG5vcm1hbGl6ZVRlcm1zKHByZWZpeGVzKTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciByZW1vdmVQcmVmaXhGaWx0ZXIgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICB2YXIgZmlsdGVyID0gXy5maW5kKHRoaXMuX3BhcmFtcy5wcmVmaXhfZmlsdGVyLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXIuZmllbGQgPT09IGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUmFuZ2Ugd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBkb2VzIG5vdCBleGlzdC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wYXJhbXMucHJlZml4X2ZpbHRlciA9IF8uZmlsdGVyKHRoaXMuX3BhcmFtcy5wcmVmaXhfZmlsdGVyLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXIuZmllbGQgIT09IGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRQcmVmaXhGaWx0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5wcmVmaXhfZmlsdGVyO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgYWRkUHJlZml4RmlsdGVyOiBhZGRQcmVmaXhGaWx0ZXIsXG4gICAgICAgIHVwZGF0ZVByZWZpeEZpbHRlcjogdXBkYXRlUHJlZml4RmlsdGVyLFxuICAgICAgICByZW1vdmVQcmVmaXhGaWx0ZXI6IHJlbW92ZVByZWZpeEZpbHRlcixcbiAgICAgICAgZ2V0UHJlZml4RmlsdGVyOiBnZXRQcmVmaXhGaWx0ZXJcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IGBzdHJpbmdgIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBhZGRRdWVyeVN0cmluZyA9IGZ1bmN0aW9uKGZpZWxkLCBzdHIpIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdRdWVyeVN0cmluZyBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXN0cikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdRdWVyeVN0cmluZyBgc3RyaW5nYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1ldGEgPSB0aGlzLl9tZXRhW2ZpZWxkXTtcbiAgICAgICAgaWYgKGNoZWNrRmllbGQobWV0YSwgZmllbGQpKSB7XG4gICAgICAgICAgICB2YXIgcXVlcnkgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnF1ZXJ5X3N0cmluZywgZnVuY3Rpb24ocXVlcnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcXVlcnkuZmllbGQgPT09IGZpZWxkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAocXVlcnkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1F1ZXJ5U3RyaW5nIHdpdGggYGZpZWxkYCBvZiBgJyArIGZpZWxkICsgJ2AgYWxyZWFkeSBleGlzdHMsIHVzZWQgYHVwZGF0ZVF1ZXJ5U3RyaW5nYCBpbnN0ZWFkLicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5xdWVyeV9zdHJpbmcgPSB0aGlzLl9wYXJhbXMucXVlcnlfc3RyaW5nIHx8IFtdO1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnF1ZXJ5X3N0cmluZy5wdXNoKHtcbiAgICAgICAgICAgICAgICBmaWVsZDogZmllbGQsXG4gICAgICAgICAgICAgICAgc3RyaW5nOiBzdHJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIHVwZGF0ZVF1ZXJ5U3RyaW5nID0gZnVuY3Rpb24oZmllbGQsIHN0cikge1xuICAgICAgICB2YXIgcXVlcnkgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnF1ZXJ5X3N0cmluZywgZnVuY3Rpb24ocXVlcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBxdWVyeS5maWVsZCA9PT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXF1ZXJ5KSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1F1ZXJ5U3RyaW5nIHdpdGggYGZpZWxkYCBvZiBgJyArIGZpZWxkICsgJ2AgZG9lcyBub3QgZXhpc3QuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKHN0ciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHF1ZXJ5LnN0cmluZyA9IHN0cjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIHJlbW92ZVF1ZXJ5U3RyaW5nID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gXy5maW5kKHRoaXMuX3BhcmFtcy5xdWVyeV9zdHJpbmcsIGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gcXVlcnkuZmllbGQgPT09IGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFxdWVyeSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdRdWVyeVN0cmluZyB3aXRoIGBmaWVsZGAgb2YgYCcgKyBmaWVsZCArICdgIGRvZXMgbm90IGV4aXN0LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhcmFtcy5xdWVyeV9zdHJpbmcgPSBfLmZpbHRlcih0aGlzLl9wYXJhbXMucXVlcnlfc3RyaW5nLCBmdW5jdGlvbihxdWVyeSkge1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5LmZpZWxkICE9PSBmaWVsZDtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0UXVlcnlTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5xdWVyeV9zdHJpbmc7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBhZGRRdWVyeVN0cmluZzogYWRkUXVlcnlTdHJpbmcsXG4gICAgICAgIHVwZGF0ZVF1ZXJ5U3RyaW5nOiB1cGRhdGVRdWVyeVN0cmluZyxcbiAgICAgICAgcmVtb3ZlUXVlcnlTdHJpbmc6IHJlbW92ZVF1ZXJ5U3RyaW5nLFxuICAgICAgICBnZXRRdWVyeVN0cmluZzogZ2V0UXVlcnlTdHJpbmdcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEuZXh0cmVtYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3Qgb3JkaW5hbCBpbiBtZXRhIGRhdGEuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3QgcmVjb2duaXplZCBpbiBtZXRhIGRhdGEuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICB2YXIgYWRkUmFuZ2UgPSBmdW5jdGlvbihmaWVsZCwgZnJvbSwgdG8pIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdSYW5nZSBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JhbmdlIGBmcm9tYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUmFuZ2UgYHRvYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1ldGEgPSB0aGlzLl9tZXRhW2ZpZWxkXTtcbiAgICAgICAgaWYgKGNoZWNrRmllbGQobWV0YSwgZmllbGQpKSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnJhbmdlLCBmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByYW5nZS5maWVsZCA9PT0gZmllbGQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChyYW5nZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignUmFuZ2Ugd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBhbHJlYWR5IGV4aXN0cywgdXNlZCBgdXBkYXRlUmFuZ2VgIGluc3RlYWQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnJhbmdlID0gdGhpcy5fcGFyYW1zLnJhbmdlIHx8IFtdO1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnJhbmdlLnB1c2goe1xuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgICAgICBmcm9tOiBmcm9tLFxuICAgICAgICAgICAgICAgIHRvOiB0b1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgdXBkYXRlUmFuZ2UgPSBmdW5jdGlvbihmaWVsZCwgZnJvbSwgdG8pIHtcbiAgICAgICAgdmFyIHJhbmdlID0gXy5maW5kKHRoaXMuX3BhcmFtcy5yYW5nZSwgZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiByYW5nZS5maWVsZCA9PT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXJhbmdlKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1JhbmdlIHdpdGggYGZpZWxkYCBvZiBgJyArIGZpZWxkICsgJ2AgZG9lcyBub3QgZXhpc3QuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKGZyb20gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICByYW5nZS5mcm9tID0gZnJvbTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG8gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICByYW5nZS50byA9IHRvO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgcmVtb3ZlUmFuZ2UgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICB2YXIgcmFuZ2UgPSBfLmZpbmQodGhpcy5fcGFyYW1zLnJhbmdlLCBmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJhbmdlLmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghcmFuZ2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignUmFuZ2Ugd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBkb2VzIG5vdCBleGlzdC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wYXJhbXMucmFuZ2UgPSBfLmZpbHRlcih0aGlzLl9wYXJhbXMucmFuZ2UsIGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmFuZ2UuZmllbGQgIT09IGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRSYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLnJhbmdlO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgYWRkUmFuZ2U6IGFkZFJhbmdlLFxuICAgICAgICB1cGRhdGVSYW5nZTogdXBkYXRlUmFuZ2UsXG4gICAgICAgIHJlbW92ZVJhbmdlOiByZW1vdmVSYW5nZSxcbiAgICAgICAgZ2V0UmFuZ2U6IGdldFJhbmdlXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBjaGVja0ZpZWxkID0gZnVuY3Rpb24obWV0YSwgZmllbGQpIHtcbiAgICAgICAgaWYgKG1ldGEpIHtcbiAgICAgICAgICAgIGlmIChtZXRhLnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCBvZiB0eXBlIGBzdHJpbmdgIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBub3JtYWxpemVUZXJtcyA9IGZ1bmN0aW9uKHRlcm1zKSB7XG4gICAgICAgIHRlcm1zLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgaWYgKGEgPCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGEgPiBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ZXJtcztcbiAgICB9O1xuXG4gICAgdmFyIHNldFRlcm1zQWdnID0gZnVuY3Rpb24oZmllbGQsIHRlcm1zKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVGVybXNBZ2cgYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRlcm1zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVGVybXNBZ2cgYHRlcm1zYCBhcmUgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtZXRhID0gdGhpcy5fbWV0YVtmaWVsZF07XG4gICAgICAgIGlmIChjaGVja0ZpZWxkKG1ldGEsIGZpZWxkKSkge1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnRlcm1zX2FnZyA9IHtcbiAgICAgICAgICAgICAgICBmaWVsZDogZmllbGQsXG4gICAgICAgICAgICAgICAgdGVybXM6IG5vcm1hbGl6ZVRlcm1zKHRlcm1zKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRUZXJtc0FnZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLnRlcm1zX2FnZztcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIHNldFRlcm1zQWdnOiBzZXRUZXJtc0FnZyxcbiAgICAgICAgZ2V0VGVybXNBZ2c6IGdldFRlcm1zQWdnXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBjaGVja0ZpZWxkID0gZnVuY3Rpb24obWV0YSwgZmllbGQpIHtcbiAgICAgICAgaWYgKG1ldGEpIHtcbiAgICAgICAgICAgIGlmIChtZXRhLnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCBvZiB0eXBlIGBzdHJpbmdgIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBub3JtYWxpemVUZXJtcyA9IGZ1bmN0aW9uKHRlcm1zKSB7XG4gICAgICAgIHRlcm1zLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgaWYgKGEgPCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGEgPiBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0ZXJtcztcbiAgICB9O1xuXG4gICAgdmFyIGFkZFRlcm1zRmlsdGVyID0gZnVuY3Rpb24oZmllbGQsIHRlcm1zKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVGVybXNGaWx0ZXIgYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuIElnbm9yaW5nIGNvbW1hbmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRlcm1zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVGVybXNGaWx0ZXIgYHRlcm1zYCBhcmUgbWlzc2luZyBmcm9tIGFyZ3VtZW50LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtZXRhID0gdGhpcy5fbWV0YVtmaWVsZF07XG4gICAgICAgIGlmIChjaGVja0ZpZWxkKG1ldGEsIGZpZWxkKSkge1xuICAgICAgICAgICAgdmFyIGZpbHRlciA9IF8uZmluZCh0aGlzLl9wYXJhbXMudGVybXNfZmlsdGVyLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyLmZpZWxkID09PSBmaWVsZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignVGVybXNGaWx0ZXIgd2l0aCBgZmllbGRgIG9mIGAnICsgZmllbGQgKyAnYCBhbHJlYWR5IGV4aXN0cywgdXNlZCBgdXBkYXRlUmFuZ2VgIGluc3RlYWQuJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLnRlcm1zX2ZpbHRlciA9IHRoaXMuX3BhcmFtcy50ZXJtc19maWx0ZXIgfHwgW107XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMudGVybXNfZmlsdGVyLnB1c2goe1xuICAgICAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgICAgICB0ZXJtczogbm9ybWFsaXplVGVybXModGVybXMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGVUZXJtc0ZpbHRlciA9IGZ1bmN0aW9uKGZpZWxkLCB0ZXJtcykge1xuICAgICAgICB2YXIgZmlsdGVyID0gXy5maW5kKHRoaXMuX3BhcmFtcy50ZXJtc19maWx0ZXIsIGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlci5maWVsZCA9PT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWZpbHRlcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdSYW5nZSB3aXRoIGBmaWVsZGAgb2YgYCcgKyBmaWVsZCArICdgIGRvZXMgbm90IGV4aXN0LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0ZXJtcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmaWx0ZXIudGVybXMgPSBub3JtYWxpemVUZXJtcyh0ZXJtcyk7XG4gICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgcmVtb3ZlVGVybXNGaWx0ZXIgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICB2YXIgZmlsdGVyID0gXy5maW5kKHRoaXMuX3BhcmFtcy50ZXJtc19maWx0ZXIsIGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlci5maWVsZCA9PT0gZmllbGQ7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIWZpbHRlcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdSYW5nZSB3aXRoIGBmaWVsZGAgb2YgYCcgKyBmaWVsZCArICdgIGRvZXMgbm90IGV4aXN0LiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhcmFtcy50ZXJtc19maWx0ZXIgPSBfLmZpbHRlcih0aGlzLl9wYXJhbXMudGVybXNfZmlsdGVyLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXIuZmllbGQgIT09IGZpZWxkO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRUZXJtc0ZpbHRlciA9IGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMudGVybXNfZmlsdGVyW2ZpZWxkXTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGFkZFRlcm1zRmlsdGVyOiBhZGRUZXJtc0ZpbHRlcixcbiAgICAgICAgdXBkYXRlVGVybXNGaWx0ZXI6IHVwZGF0ZVRlcm1zRmlsdGVyLFxuICAgICAgICByZW1vdmVUZXJtc0ZpbHRlcjogcmVtb3ZlVGVybXNGaWx0ZXIsXG4gICAgICAgIGdldFRlcm1zRmlsdGVyOiBnZXRUZXJtc0ZpbHRlclxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgREVGQVVMVF9YX0ZJRUxEID0gJ3BpeGVsLngnO1xuICAgIHZhciBERUZBVUxUX1lfRklFTEQgPSAncGl4ZWwueSc7XG5cbiAgICB2YXIgY2hlY2tGaWVsZCA9IGZ1bmN0aW9uKG1ldGEsIGZpZWxkKSB7XG4gICAgICAgIGlmIChtZXRhKSB7XG4gICAgICAgICAgICBpZiAobWV0YS5leHRyZW1hKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCBvcmRpbmFsIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YS4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBzZXRYRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICBpZiAoZmllbGQgIT09IHRoaXMuX3BhcmFtcy5iaW5uaW5nLngpIHtcbiAgICAgICAgICAgIGlmIChmaWVsZCA9PT0gREVGQVVMVF9YX0ZJRUxEKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzZXQgaWYgZGVmYXVsdFxuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1zLmJpbm5pbmcubGVmdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy5yaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGFbZmllbGRdO1xuICAgICAgICAgICAgICAgIGlmIChjaGVja0ZpZWxkKG1ldGEsIGZpZWxkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy54ID0gZmllbGQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLmxlZnQgPSBtZXRhLmV4dHJlbWEubWluO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy5yaWdodCA9IG1ldGEuZXh0cmVtYS5tYXg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0WEZpZWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMuYmlubmluZy54O1xuICAgIH07XG5cbiAgICB2YXIgc2V0WUZpZWxkID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB0aGlzLl9wYXJhbXMuYmlubmluZy55KSB7XG4gICAgICAgICAgICBpZiAoZmllbGQgPT09IERFRkFVTFRfWV9GSUVMRCkge1xuICAgICAgICAgICAgICAgIC8vIHJlc2V0IGlmIGRlZmF1bHRcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy55ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLmJvdHRvbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy50b3AgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG1ldGEgPSB0aGlzLl9tZXRhW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tGaWVsZChtZXRhLCBmaWVsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1zLmJpbm5pbmcueSA9IGZpZWxkO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy5ib3R0b20gPSBtZXRhLmV4dHJlbWEubWluO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy50b3AgPSBtZXRhLmV4dHJlbWEubWF4O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFlGaWVsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLmJpbm5pbmcueTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIHNldFhGaWVsZDogc2V0WEZpZWxkLFxuICAgICAgICBnZXRYRmllbGQ6IGdldFhGaWVsZCxcbiAgICAgICAgc2V0WUZpZWxkOiBzZXRZRmllbGQsXG4gICAgICAgIGdldFlGaWVsZDogZ2V0WUZpZWxkLFxuICAgICAgICBERUZBVUxUX1hfRklFTEQ6IERFRkFVTFRfWF9GSUVMRCxcbiAgICAgICAgREVGQVVMVF9ZX0ZJRUxEOiBERUZBVUxUX1lfRklFTERcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IG9mIHR5cGUgYHN0cmluZ2AgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdGaWVsZCBgJyArIGZpZWxkICsgJ2AgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLiBJZ25vcmluZyBjb21tYW5kLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIHNldFRvcFRlcm1zID0gZnVuY3Rpb24oZmllbGQsIHNpemUpIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdUb3BUZXJtcyBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4gSWdub3JpbmcgY29tbWFuZC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGFbZmllbGRdO1xuICAgICAgICBpZiAoY2hlY2tGaWVsZChtZXRhLCBmaWVsZCkpIHtcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcy50b3BfdGVybXMgPSB7XG4gICAgICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAgICAgICAgIHNpemU6IHNpemVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0VG9wVGVybXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy50b3BfdGVybXM7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBzZXRUb3BUZXJtczogc2V0VG9wVGVybXMsXG4gICAgICAgIGdldFRvcFRlcm1zOiBnZXRUb3BUZXJtc1xuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTGl2ZSA9IHJlcXVpcmUoJy4uL2NvcmUvTGl2ZScpO1xuICAgIHZhciBCaW5uaW5nID0gcmVxdWlyZSgnLi4vcGFyYW1zL0Jpbm5pbmcnKTtcbiAgICB2YXIgTWV0cmljQWdnID0gcmVxdWlyZSgnLi4vcGFyYW1zL01ldHJpY0FnZycpO1xuICAgIHZhciBUZXJtc0ZpbHRlciA9IHJlcXVpcmUoJy4uL3BhcmFtcy9UZXJtc0ZpbHRlcicpO1xuICAgIHZhciBCb29sUXVlcnkgPSByZXF1aXJlKCcuLi9wYXJhbXMvQm9vbFF1ZXJ5Jyk7XG4gICAgdmFyIFByZWZpeEZpbHRlciA9IHJlcXVpcmUoJy4uL3BhcmFtcy9QcmVmaXhGaWx0ZXInKTtcbiAgICB2YXIgUmFuZ2UgPSByZXF1aXJlKCcuLi9wYXJhbXMvUmFuZ2UnKTtcbiAgICB2YXIgUXVlcnlTdHJpbmcgPSByZXF1aXJlKCcuLi9wYXJhbXMvUXVlcnlTdHJpbmcnKTtcbiAgICB2YXIgQ29sb3JSYW1wID0gcmVxdWlyZSgnLi4vbWl4aW5zL0NvbG9yUmFtcCcpO1xuICAgIHZhciBWYWx1ZVRyYW5zZm9ybSA9IHJlcXVpcmUoJy4uL21peGlucy9WYWx1ZVRyYW5zZm9ybScpO1xuXG4gICAgdmFyIEhlYXRtYXAgPSBMaXZlLmV4dGVuZCh7XG5cbiAgICAgICAgaW5jbHVkZXM6IFtcbiAgICAgICAgICAgIC8vIHBhcmFtc1xuICAgICAgICAgICAgQmlubmluZyxcbiAgICAgICAgICAgIE1ldHJpY0FnZyxcbiAgICAgICAgICAgIFRlcm1zRmlsdGVyLFxuICAgICAgICAgICAgQm9vbFF1ZXJ5LFxuICAgICAgICAgICAgUHJlZml4RmlsdGVyLFxuICAgICAgICAgICAgUmFuZ2UsXG4gICAgICAgICAgICBRdWVyeVN0cmluZyxcbiAgICAgICAgICAgIC8vIG1peGluc1xuICAgICAgICAgICAgQ29sb3JSYW1wLFxuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm1cbiAgICAgICAgXSxcblxuICAgICAgICB0eXBlOiAnaGVhdG1hcCcsXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBDb2xvclJhbXAuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm0uaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgLy8gYmFzZVxuICAgICAgICAgICAgTGl2ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGV4dHJhY3RFeHRyZW1hOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgYmlucyA9IG5ldyBGbG9hdDY0QXJyYXkoZGF0YSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1pbjogXy5taW4oYmlucyksXG4gICAgICAgICAgICAgICAgbWF4OiBfLm1heChiaW5zKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhlYXRtYXA7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTGl2ZSA9IHJlcXVpcmUoJy4uL2NvcmUvTGl2ZScpO1xuICAgIHZhciBUaWxpbmcgPSByZXF1aXJlKCcuLi9wYXJhbXMvVGlsaW5nJyk7XG4gICAgdmFyIFRlcm1zRmlsdGVyID0gcmVxdWlyZSgnLi4vcGFyYW1zL1Rlcm1zRmlsdGVyJyk7XG4gICAgdmFyIFByZWZpeEZpbHRlciA9IHJlcXVpcmUoJy4uL3BhcmFtcy9QcmVmaXhGaWx0ZXInKTtcbiAgICB2YXIgVG9wVGVybXMgPSByZXF1aXJlKCcuLi9wYXJhbXMvVG9wVGVybXMnKTtcbiAgICB2YXIgUmFuZ2UgPSByZXF1aXJlKCcuLi9wYXJhbXMvUmFuZ2UnKTtcbiAgICB2YXIgSGlzdG9ncmFtID0gcmVxdWlyZSgnLi4vcGFyYW1zL0hpc3RvZ3JhbScpO1xuICAgIHZhciBWYWx1ZVRyYW5zZm9ybSA9IHJlcXVpcmUoJy4uL21peGlucy9WYWx1ZVRyYW5zZm9ybScpO1xuXG4gICAgdmFyIFRvcENvdW50ID0gTGl2ZS5leHRlbmQoe1xuXG4gICAgICAgIGluY2x1ZGVzOiBbXG4gICAgICAgICAgICAvLyBwYXJhbXNcbiAgICAgICAgICAgIFRpbGluZyxcbiAgICAgICAgICAgIFRvcFRlcm1zLFxuICAgICAgICAgICAgVGVybXNGaWx0ZXIsXG4gICAgICAgICAgICBQcmVmaXhGaWx0ZXIsXG4gICAgICAgICAgICBSYW5nZSxcbiAgICAgICAgICAgIEhpc3RvZ3JhbSxcbiAgICAgICAgICAgIC8vIG1peGluc1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm1cbiAgICAgICAgXSxcblxuICAgICAgICB0eXBlOiAndG9wX2NvdW50JyxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIC8vIGJhc2VcbiAgICAgICAgICAgIExpdmUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSxcblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUb3BDb3VudDtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBMaXZlID0gcmVxdWlyZSgnLi4vY29yZS9MaXZlJyk7XG4gICAgdmFyIFRpbGluZyA9IHJlcXVpcmUoJy4uL3BhcmFtcy9UaWxpbmcnKTtcbiAgICB2YXIgVG9wVGVybXMgPSByZXF1aXJlKCcuLi9wYXJhbXMvVG9wVGVybXMnKTtcbiAgICB2YXIgVGVybXNGaWx0ZXIgPSByZXF1aXJlKCcuLi9wYXJhbXMvVGVybXNGaWx0ZXInKTtcbiAgICB2YXIgUHJlZml4RmlsdGVyID0gcmVxdWlyZSgnLi4vcGFyYW1zL1ByZWZpeEZpbHRlcicpO1xuICAgIHZhciBSYW5nZSA9IHJlcXVpcmUoJy4uL3BhcmFtcy9SYW5nZScpO1xuICAgIHZhciBEYXRlSGlzdG9ncmFtID0gcmVxdWlyZSgnLi4vcGFyYW1zL0RhdGVIaXN0b2dyYW0nKTtcbiAgICB2YXIgSGlzdG9ncmFtID0gcmVxdWlyZSgnLi4vcGFyYW1zL0hpc3RvZ3JhbScpO1xuICAgIHZhciBWYWx1ZVRyYW5zZm9ybSA9IHJlcXVpcmUoJy4uL21peGlucy9WYWx1ZVRyYW5zZm9ybScpO1xuXG4gICAgdmFyIFRvcEZyZXF1ZW5jeSA9IExpdmUuZXh0ZW5kKHtcblxuICAgICAgICBpbmNsdWRlczogW1xuICAgICAgICAgICAgLy8gcGFyYW1zXG4gICAgICAgICAgICBUaWxpbmcsXG4gICAgICAgICAgICBUb3BUZXJtcyxcbiAgICAgICAgICAgIFRlcm1zRmlsdGVyLFxuICAgICAgICAgICAgUHJlZml4RmlsdGVyLFxuICAgICAgICAgICAgUmFuZ2UsXG4gICAgICAgICAgICBEYXRlSGlzdG9ncmFtLFxuICAgICAgICAgICAgSGlzdG9ncmFtLFxuICAgICAgICAgICAgLy8gbWl4aW5zXG4gICAgICAgICAgICBWYWx1ZVRyYW5zZm9ybVxuICAgICAgICBdLFxuXG4gICAgICAgIHR5cGU6ICd0b3BfZnJlcXVlbmN5JyxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIC8vIGJhc2VcbiAgICAgICAgICAgIExpdmUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSxcblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUb3BGcmVxdWVuY3k7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTGl2ZSA9IHJlcXVpcmUoJy4uL2NvcmUvTGl2ZScpO1xuICAgIHZhciBUaWxpbmcgPSByZXF1aXJlKCcuLi9wYXJhbXMvVGlsaW5nJyk7XG4gICAgdmFyIFRlcm1zQWdnID0gcmVxdWlyZSgnLi4vcGFyYW1zL1Rlcm1zQWdnJyk7XG4gICAgdmFyIFJhbmdlID0gcmVxdWlyZSgnLi4vcGFyYW1zL1JhbmdlJyk7XG4gICAgdmFyIEhpc3RvZ3JhbSA9IHJlcXVpcmUoJy4uL3BhcmFtcy9IaXN0b2dyYW0nKTtcbiAgICB2YXIgVmFsdWVUcmFuc2Zvcm0gPSByZXF1aXJlKCcuLi9taXhpbnMvVmFsdWVUcmFuc2Zvcm0nKTtcblxuICAgIHZhciBUb3BpY0NvdW50ID0gTGl2ZS5leHRlbmQoe1xuXG4gICAgICAgIGluY2x1ZGVzOiBbXG4gICAgICAgICAgICAvLyBwYXJhbXNcbiAgICAgICAgICAgIFRpbGluZyxcbiAgICAgICAgICAgIFRlcm1zQWdnLFxuICAgICAgICAgICAgUmFuZ2UsXG4gICAgICAgICAgICBIaXN0b2dyYW0sXG4gICAgICAgICAgICAvLyBtaXhpbnNcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtXG4gICAgICAgIF0sXG5cbiAgICAgICAgdHlwZTogJ3RvcGljX2NvdW50JyxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIC8vIGJhc2VcbiAgICAgICAgICAgIExpdmUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSxcblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUb3BpY0NvdW50O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIExpdmUgPSByZXF1aXJlKCcuLi9jb3JlL0xpdmUnKTtcbiAgICB2YXIgVGlsaW5nID0gcmVxdWlyZSgnLi4vcGFyYW1zL1RpbGluZycpO1xuICAgIHZhciBUZXJtc0FnZyA9IHJlcXVpcmUoJy4uL3BhcmFtcy9UZXJtc0FnZycpO1xuICAgIHZhciBSYW5nZSA9IHJlcXVpcmUoJy4uL3BhcmFtcy9SYW5nZScpO1xuICAgIHZhciBEYXRlSGlzdG9ncmFtID0gcmVxdWlyZSgnLi4vcGFyYW1zL0RhdGVIaXN0b2dyYW0nKTtcbiAgICB2YXIgSGlzdG9ncmFtID0gcmVxdWlyZSgnLi4vcGFyYW1zL0hpc3RvZ3JhbScpO1xuICAgIHZhciBWYWx1ZVRyYW5zZm9ybSA9IHJlcXVpcmUoJy4uL21peGlucy9WYWx1ZVRyYW5zZm9ybScpO1xuXG4gICAgdmFyIFRvcGljRnJlcXVlbmN5ID0gTGl2ZS5leHRlbmQoe1xuXG4gICAgICAgIGluY2x1ZGVzOiBbXG4gICAgICAgICAgICAvLyBwYXJhbXNcbiAgICAgICAgICAgIFRpbGluZyxcbiAgICAgICAgICAgIFRlcm1zQWdnLFxuICAgICAgICAgICAgUmFuZ2UsXG4gICAgICAgICAgICBEYXRlSGlzdG9ncmFtLFxuICAgICAgICAgICAgSGlzdG9ncmFtLFxuICAgICAgICAgICAgLy8gbWl4aW5zXG4gICAgICAgICAgICBWYWx1ZVRyYW5zZm9ybVxuICAgICAgICBdLFxuXG4gICAgICAgIHR5cGU6ICd0b3BpY19mcmVxdWVuY3knLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm0uaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgLy8gYmFzZVxuICAgICAgICAgICAgTGl2ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRvcGljRnJlcXVlbmN5O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIERPTSA9IHJlcXVpcmUoJy4vRE9NJyk7XG5cbiAgICB2YXIgQ2FudmFzID0gRE9NLmV4dGVuZCh7XG5cbiAgICAgICAgX2NyZWF0ZVRpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRpbGUgPSBMLkRvbVV0aWwuY3JlYXRlKCdjYW52YXMnLCAnbGVhZmxldC10aWxlJyk7XG4gICAgICAgICAgICB0aWxlLndpZHRoID0gdGlsZS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB0aWxlLm9uc2VsZWN0c3RhcnQgPSB0aWxlLm9ubW91c2Vtb3ZlID0gTC5VdGlsLmZhbHNlRm47XG4gICAgICAgICAgICByZXR1cm4gdGlsZTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IENhbnZhcztcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBJbWFnZSA9IHJlcXVpcmUoJy4uLy4uL2xheWVyL2NvcmUvSW1hZ2UnKTtcblxuICAgIHZhciBET00gPSBJbWFnZS5leHRlbmQoe1xuXG4gICAgICAgIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgICAgIEwuVGlsZUxheWVyLnByb3RvdHlwZS5vbkFkZC5jYWxsKHRoaXMsIG1hcCk7XG4gICAgICAgICAgICBtYXAub24oJ3pvb21zdGFydCcsIHRoaXMuY2xlYXJFeHRyZW1hLCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblJlbW92ZTogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICBtYXAub2ZmKCd6b29tc3RhcnQnLCB0aGlzLmNsZWFyRXh0cmVtYSwgdGhpcyk7XG4gICAgICAgICAgICBMLlRpbGVMYXllci5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzZXQoe1xuICAgICAgICAgICAgICAgICAgICBoYXJkOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBfY3JlYXRlVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9LFxuXG4gICAgICAgIF9sb2FkVGlsZTogZnVuY3Rpb24odGlsZSwgdGlsZVBvaW50KSB7XG4gICAgICAgICAgICB0aWxlLl9sYXllciA9IHRoaXM7XG4gICAgICAgICAgICB0aWxlLl90aWxlUG9pbnQgPSB0aWxlUG9pbnQ7XG4gICAgICAgICAgICB0aWxlLl91bmFkanVzdGVkVGlsZVBvaW50ID0ge1xuICAgICAgICAgICAgICAgIHg6IHRpbGVQb2ludC54LFxuICAgICAgICAgICAgICAgIHk6IHRpbGVQb2ludC55XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGlsZS5kYXRhc2V0LnggPSB0aWxlUG9pbnQueDtcbiAgICAgICAgICAgIHRpbGUuZGF0YXNldC55ID0gdGlsZVBvaW50Lnk7XG4gICAgICAgICAgICB0aGlzLl9hZGp1c3RUaWxlUG9pbnQodGlsZVBvaW50KTtcbiAgICAgICAgICAgIHRoaXMuX3JlZHJhd1RpbGUodGlsZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FkanVzdFRpbGVLZXk6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgLy8gd2hlbiBkZWFsaW5nIHdpdGggd3JhcHBlZCB0aWxlcywgaW50ZXJuYWxseSBsZWFmZXQgd2lsbCB1c2VcbiAgICAgICAgICAgIC8vIGNvb3JkaW5hdGVzIG4gPCAwIGFuZCBuID4gKDJeeikgdG8gcG9zaXRpb24gdGhlbSBjb3JyZWN0bHkuXG4gICAgICAgICAgICAvLyB0aGlzIGZ1bmN0aW9uIGNvbnZlcnRzIHRoYXQgdG8gdGhlIG1vZHVsb3Mga2V5IHVzZWQgdG8gY2FjaGUgdGhlbVxuICAgICAgICAgICAgLy8gZGF0YS5cbiAgICAgICAgICAgIC8vIEV4LiAnLTE6MycgYXQgeiA9IDIgYmVjb21lcyAnMzozJ1xuICAgICAgICAgICAgdmFyIGtBcnIgPSBrZXkuc3BsaXQoJzonKTtcbiAgICAgICAgICAgIHZhciB4ID0gcGFyc2VJbnQoa0FyclswXSwgMTApO1xuICAgICAgICAgICAgdmFyIHkgPSBwYXJzZUludChrQXJyWzFdLCAxMCk7XG4gICAgICAgICAgICB2YXIgdGlsZVBvaW50ID0ge1xuICAgICAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICAgICAgeTogeVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2FkanVzdFRpbGVQb2ludCh0aWxlUG9pbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRpbGVQb2ludC54ICsgJzonICsgdGlsZVBvaW50LnkgKyAnOicgKyB0aWxlUG9pbnQuejtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVtb3ZlVGlsZTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICB2YXIgYWRqdXN0ZWRLZXkgPSB0aGlzLl9hZGp1c3RUaWxlS2V5KGtleSk7XG4gICAgICAgICAgICB2YXIgY2FjaGVkID0gdGhpcy5fY2FjaGVbYWRqdXN0ZWRLZXldO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSB0aWxlIGZyb20gdGhlIGNhY2hlXG4gICAgICAgICAgICBkZWxldGUgY2FjaGVkLnRpbGVzW2tleV07XG4gICAgICAgICAgICBpZiAoXy5rZXlzKGNhY2hlZC50aWxlcykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gbW9yZSB0aWxlcyB1c2UgdGhpcyBjYWNoZWQgZGF0YSwgc28gZGVsZXRlIGl0XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2NhY2hlW2FkanVzdGVkS2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNhbGwgcGFyZW50IG1ldGhvZFxuICAgICAgICAgICAgTC5UaWxlTGF5ZXIucHJvdG90eXBlLl9yZW1vdmVUaWxlLmNhbGwodGhpcywga2V5KTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVkcmF3VGlsZTogZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGNhY2hlID0gdGhpcy5fY2FjaGU7XG4gICAgICAgICAgICB2YXIgY29vcmQgPSB7XG4gICAgICAgICAgICAgICAgeDogdGlsZS5fdGlsZVBvaW50LngsXG4gICAgICAgICAgICAgICAgeTogdGlsZS5fdGlsZVBvaW50LnksXG4gICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLl96b29tXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gdXNlIHRoZSBhZGp1c3RlZCBjb29yZGluYXRlcyB0byBoYXNoIHRoZSB0aGUgY2FjaGUgdmFsdWVzLCB0aGlzXG4gICAgICAgICAgICAvLyBpcyBiZWNhdXNlIHdlIHdhbnQgdG8gb25seSBoYXZlIG9uZSBjb3B5IG9mIHRoZSBkYXRhXG4gICAgICAgICAgICB2YXIgaGFzaCA9IGNvb3JkLnggKyAnOicgKyBjb29yZC55ICsgJzonICsgY29vcmQuejtcbiAgICAgICAgICAgIC8vIHVzZSB0aGUgdW5hZGpzdXRlZCBjb29yZGluYXRlcyB0byB0cmFjayB3aGljaCAnd3JhcHBlZCcgdGlsZXNcbiAgICAgICAgICAgIC8vIHVzZWQgdGhlIGNhY2hlZCBkYXRhXG4gICAgICAgICAgICB2YXIgdW5hZGp1c3RlZEhhc2ggPSB0aWxlLl91bmFkanVzdGVkVGlsZVBvaW50LnggKyAnOicgKyB0aWxlLl91bmFkanVzdGVkVGlsZVBvaW50Lnk7XG4gICAgICAgICAgICAvLyBjaGVjayBjYWNoZVxuICAgICAgICAgICAgdmFyIGNhY2hlZCA9IGNhY2hlW2hhc2hdO1xuICAgICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIGlmIChjYWNoZWQuaXNQZW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGN1cnJlbnRseSBwZW5kaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3JlIHRoZSB0aWxlIGluIHRoZSBjYWNoZSB0byBkcmF3IHRvIGxhdGVyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlZC50aWxlc1t1bmFkanVzdGVkSGFzaF0gPSB0aWxlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFscmVhZHkgcmVxdWVzdGVkXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0b3JlIHRoZSB0aWxlIGluIHRoZSBjYWNoZVxuICAgICAgICAgICAgICAgICAgICBjYWNoZWQudGlsZXNbdW5hZGp1c3RlZEhhc2hdID0gdGlsZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZHJhdyB0aGUgdGlsZVxuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbmRlclRpbGUodGlsZSwgY2FjaGVkLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRpbGVEcmF3bih0aWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBhIGNhY2hlIGVudHJ5XG4gICAgICAgICAgICAgICAgY2FjaGVbaGFzaF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlzUGVuZGluZzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdGlsZXM6IHt9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBudWxsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdGlsZSB0byB0aGUgY2FjaGUgZW50cnlcbiAgICAgICAgICAgICAgICBjYWNoZVtoYXNoXS50aWxlc1t1bmFkanVzdGVkSGFzaF0gPSB0aWxlO1xuICAgICAgICAgICAgICAgIC8vIHJlcXVlc3QgdGhlIHRpbGVcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3RUaWxlKGNvb3JkLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYWNoZWQgPSBjYWNoZVtoYXNoXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRpbGUgaXMgbm8gbG9uZ2VyIGJlaW5nIHRyYWNrZWQsIGlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlZC5pc1BlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgY2FjaGVkLmRhdGEgPSBkYXRhO1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGV4dHJlbWFcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgc2VsZi51cGRhdGVFeHRyZW1hKGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBleHRyZW1hIGNoYW5nZWQsIHJlZHJhdyBhbGwgdGlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVkcmF3KCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzYW1lIGV4dHJlbWEsIHdlIGFyZSBnb29kIHRvIHJlbmRlciB0aGUgdGlsZXMuIEluXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGUgY2FzZSBvZiBhIG1hcCB3aXRoIHdyYXBhcm91bmQsIHdlIG1heSBoYXZlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBtdWx0aXBsZSB0aWxlcyBkZXBlbmRlbnQgb24gdGhlIHJlc3BvbnNlLCBzbyBpdGVyYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBvdmVyIGVhY2ggdGlsZSBhbmQgZHJhdyBpdC5cbiAgICAgICAgICAgICAgICAgICAgICAgIF8uZm9ySW4oY2FjaGVkLnRpbGVzLCBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW5kZXJUaWxlKHRpbGUsIGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudGlsZURyYXduKHRpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB0aWxlRHJhd246IGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpbGVPbkxvYWQuY2FsbCh0aWxlKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZXF1ZXN0VGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBET007XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRE9NID0gcmVxdWlyZSgnLi9ET00nKTtcblxuICAgIHZhciBIVE1MID0gRE9NLmV4dGVuZCh7XG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgaGFuZGxlcnM6IHt9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgRE9NLnByb3RvdHlwZS5vbkFkZC5jYWxsKHRoaXMsIG1hcCk7XG4gICAgICAgICAgICBtYXAub24oJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0aGlzKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5vbignbW91c2VvdmVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHNlbGYub25Nb3VzZU92ZXIoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5vbignbW91c2VvdXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5vbk1vdXNlT3V0KGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25SZW1vdmU6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgbWFwLm9mZignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRoaXMpO1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLm9mZignbW91c2VvdmVyJyk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikub2ZmKCdtb3VzZW91dCcpO1xuICAgICAgICAgICAgRE9NLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsKHRoaXMsIG1hcCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NyZWF0ZVRpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRpbGUgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC10aWxlIGxlYWZsZXQtaHRtbC10aWxlJyk7XG4gICAgICAgICAgICB0aWxlLndpZHRoID0gdGhpcy5vcHRpb25zLnRpbGVTaXplO1xuICAgICAgICAgICAgdGlsZS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB0aWxlLm9uc2VsZWN0c3RhcnQgPSBMLlV0aWwuZmFsc2VGbjtcbiAgICAgICAgICAgIHRpbGUub25tb3VzZW1vdmUgPSBMLlV0aWwuZmFsc2VGbjtcbiAgICAgICAgICAgIHJldHVybiB0aWxlO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdmVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZU91dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9LFxuXG5cbiAgICAgICAgb25DbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gSFRNTDtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBlc3BlciA9IHJlcXVpcmUoJ2VzcGVyJyk7XG5cbiAgICBmdW5jdGlvbiB0cmFuc2xhdGlvbk1hdHJpeCh0cmFuc2xhdGlvbikge1xuICAgICAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgICAgICAgICAxLCAwLCAwLCAwLFxuICAgICAgICAgICAgMCwgMSwgMCwgMCxcbiAgICAgICAgICAgIDAsIDAsIDEsIDAsXG4gICAgICAgICAgICB0cmFuc2xhdGlvblswXSwgdHJhbnNsYXRpb25bMV0sIHRyYW5zbGF0aW9uWzJdLCAxXG4gICAgICAgIF0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9ydGhvTWF0cml4KGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gICAgICAgIHZhciBtYXQgPSBuZXcgRmxvYXQzMkFycmF5KDE2KTtcbiAgICAgICAgbWF0WzBdID0gMiAvICggcmlnaHQgLSBsZWZ0ICk7XG4gICAgICAgIG1hdFsxXSA9IDA7XG4gICAgICAgIG1hdFsyXSA9IDA7XG4gICAgICAgIG1hdFszXSA9IDA7XG4gICAgICAgIG1hdFs0XSA9IDA7XG4gICAgICAgIG1hdFs1XSA9IDIgLyAoIHRvcCAtIGJvdHRvbSApO1xuICAgICAgICBtYXRbNl0gPSAwO1xuICAgICAgICBtYXRbN10gPSAwO1xuICAgICAgICBtYXRbOF0gPSAwO1xuICAgICAgICBtYXRbOV0gPSAwO1xuICAgICAgICBtYXRbMTBdID0gLTIgLyAoIGZhciAtIG5lYXIgKTtcbiAgICAgICAgbWF0WzExXSA9IDA7XG4gICAgICAgIG1hdFsxMl0gPSAtKCAoIHJpZ2h0ICsgbGVmdCApIC8gKCByaWdodCAtIGxlZnQgKSApO1xuICAgICAgICBtYXRbMTNdID0gLSggKCB0b3AgKyBib3R0b20gKSAvICggdG9wIC0gYm90dG9tICkgKTtcbiAgICAgICAgbWF0WzE0XSA9IC0oICggZmFyICsgbmVhciApIC8gKCBmYXIgLSBuZWFyICkgKTtcbiAgICAgICAgbWF0WzE1XSA9IDE7XG4gICAgICAgIHJldHVybiBtYXQ7XG4gICAgfVxuXG4gICAgLy8gVE9ETzpcbiAgICAvLyAgICAgLSBmaXggem9vbSB0cmFuc2l0aW9uIGFuaW1hdGlvbiBidWdcbiAgICAvLyAgICAgLSBmaXggc2hvdyAvIGhpZGUgYnVnXG5cbiAgICB2YXIgV2ViR0wgPSBMLkNsYXNzLmV4dGVuZCh7XG5cbiAgICAgICAgaW5jbHVkZXM6IFtcbiAgICAgICAgICAgIEwuTWl4aW4uRXZlbnRzXG4gICAgICAgIF0sXG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgbWluWm9vbTogMCxcbiAgICAgICAgICAgIG1heFpvb206IDE4LFxuICAgICAgICAgICAgem9vbU9mZnNldDogMCxcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICBzaGFkZXJzOiB7XG4gICAgICAgICAgICAgICAgdmVydDogbnVsbCxcbiAgICAgICAgICAgICAgICBmcmFnOiBudWxsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5sb2FkSW52aXNpYmxlVGlsZXM6IEwuQnJvd3Nlci5tb2JpbGUsXG4gICAgICAgICAgICB1cGRhdGVXaGVuSWRsZTogTC5Ccm93c2VyLm1vYmlsZVxuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG1ldGEsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5ib3VuZHMpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmJvdW5kcyA9IEwubGF0TG5nQm91bmRzKG9wdGlvbnMuYm91bmRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBnZXRPcGFjaXR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMub3BhY2l0eTtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2hpZGRlbiA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fcHJldk1hcC5hZGRMYXllcih0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoaWRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2hpZGRlbiA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLl9wcmV2TWFwID0gdGhpcy5fbWFwO1xuICAgICAgICAgICAgdGhpcy5fbWFwLnJlbW92ZUxheWVyKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzSGlkZGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9oaWRkZW47XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgdGhpcy5fbWFwID0gbWFwO1xuICAgICAgICAgICAgdGhpcy5fYW5pbWF0ZWQgPSBtYXAuX3pvb21BbmltYXRlZDtcbiAgICAgICAgICAgIGlmICghdGhpcy5fY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGNhbnZhc1xuICAgICAgICAgICAgICAgIHRoaXMuX2luaXRDYW52YXMoKTtcbiAgICAgICAgICAgICAgICBtYXAuX3BhbmVzLnRpbGVQYW5lLmFwcGVuZENoaWxkKHRoaXMuX2NhbnZhcyk7XG4gICAgICAgICAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgd2ViZ2wgY29udGV4dFxuICAgICAgICAgICAgICAgIHRoaXMuX2luaXRHTCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXAuX3BhbmVzLnRpbGVQYW5lLmFwcGVuZENoaWxkKHRoaXMuX2NhbnZhcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzZXQgdXAgZXZlbnRzXG4gICAgICAgICAgICBtYXAub24oe1xuICAgICAgICAgICAgICAgICdyZXNpemUnOiB0aGlzLl9yZXNpemUsXG4gICAgICAgICAgICAgICAgJ3ZpZXdyZXNldCc6IHRoaXMuX3Jlc2V0LFxuICAgICAgICAgICAgICAgICdtb3ZlZW5kJzogdGhpcy5fdXBkYXRlLFxuICAgICAgICAgICAgICAgICd6b29tc3RhcnQnOiB0aGlzLmNsZWFyRXh0cmVtYVxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICBpZiAobWFwLm9wdGlvbnMuem9vbUFuaW1hdGlvbiAmJiBMLkJyb3dzZXIuYW55M2QpIHtcbiAgICAgICAgICAgICAgICBtYXAub24oe1xuICAgICAgICAgICAgICAgICAgICAnem9vbXN0YXJ0JzogdGhpcy5fZW5hYmxlWm9vbWluZyxcbiAgICAgICAgICAgICAgICAgICAgJ3pvb21hbmltJzogdGhpcy5fYW5pbWF0ZVpvb20sXG4gICAgICAgICAgICAgICAgICAgICd6b29tZW5kJzogdGhpcy5fZGlzYWJsZVpvb21pbmcsXG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy51cGRhdGVXaGVuSWRsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xpbWl0ZWRVcGRhdGUgPSBMLlV0aWwubGltaXRFeGVjQnlJbnRlcnZhbCh0aGlzLl91cGRhdGUsIDE1MCwgdGhpcyk7XG4gICAgICAgICAgICAgICAgbWFwLm9uKCdtb3ZlJywgdGhpcy5fbGltaXRlZFVwZGF0ZSwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkVG86IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgbWFwLmFkZExheWVyKHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25SZW1vdmU6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgLy8gY2xlYXIgdGhlIGN1cnJlbnQgYnVmZmVyXG4gICAgICAgICAgICB0aGlzLl9jbGVhckJhY2tCdWZmZXIoKTtcbiAgICAgICAgICAgIG1hcC5nZXRQYW5lcygpLnRpbGVQYW5lLnJlbW92ZUNoaWxkKHRoaXMuX2NhbnZhcyk7XG4gICAgICAgICAgICBtYXAub2ZmKHtcbiAgICAgICAgICAgICAgICAncmVzaXplJzogdGhpcy5fcmVzaXplLFxuICAgICAgICAgICAgICAgICd2aWV3cmVzZXQnOiB0aGlzLl9yZXNldCxcbiAgICAgICAgICAgICAgICAnbW92ZWVuZCc6IHRoaXMuX3VwZGF0ZSxcbiAgICAgICAgICAgICAgICAnem9vbXN0YXJ0JzogdGhpcy5jbGVhckV4dHJlbWFcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgaWYgKG1hcC5vcHRpb25zLnpvb21BbmltYXRpb24pIHtcbiAgICAgICAgICAgICAgICBtYXAub2ZmKHtcbiAgICAgICAgICAgICAgICAgICAgJ3pvb21zdGFydCc6IHRoaXMuX2VuYWJsZVpvb21pbmcsXG4gICAgICAgICAgICAgICAgICAgICd6b29tYW5pbSc6IHRoaXMuX2FuaW1hdGVab29tLFxuICAgICAgICAgICAgICAgICAgICAnem9vbWVuZCc6IHRoaXMuX2Rpc2FibGVab29taW5nXG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy51cGRhdGVXaGVuSWRsZSkge1xuICAgICAgICAgICAgICAgIG1hcC5vZmYoJ21vdmUnLCB0aGlzLl9saW1pdGVkVXBkYXRlLCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX21hcCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9hbmltYXRlZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9pc1pvb21pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2VuYWJsZVpvb21pbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faXNab29taW5nID0gdHJ1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZGlzYWJsZVpvb21pbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faXNab29taW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9jbGVhckJhY2tCdWZmZXIoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBicmluZ1RvRnJvbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHBhbmUgPSB0aGlzLl9tYXAuX3BhbmVzLnRpbGVQYW5lO1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NhbnZhcykge1xuICAgICAgICAgICAgICAgIHBhbmUuYXBwZW5kQ2hpbGQodGhpcy5fY2FudmFzKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRBdXRvWkluZGV4KHBhbmUsIE1hdGgubWF4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGJyaW5nVG9CYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBwYW5lID0gdGhpcy5fbWFwLl9wYW5lcy50aWxlUGFuZTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jYW52YXMpIHtcbiAgICAgICAgICAgICAgICBwYW5lLmluc2VydEJlZm9yZSh0aGlzLl9jYW52YXMsIHBhbmUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0QXV0b1pJbmRleChwYW5lLCBNYXRoLm1pbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBfc2V0QXV0b1pJbmRleDogZnVuY3Rpb24ocGFuZSwgY29tcGFyZSkge1xuICAgICAgICAgICAgdmFyIGxheWVycyA9IHBhbmUuY2hpbGRyZW47XG4gICAgICAgICAgICB2YXIgZWRnZVpJbmRleCA9IC1jb21wYXJlKEluZmluaXR5LCAtSW5maW5pdHkpOyAvLyAtSW5maW5pdHkgZm9yIG1heCwgSW5maW5pdHkgZm9yIG1pblxuICAgICAgICAgICAgdmFyIHpJbmRleDtcbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgdmFyIGxlbjtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGxheWVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsYXllcnNbaV0gIT09IHRoaXMuX2NhbnZhcykge1xuICAgICAgICAgICAgICAgICAgICB6SW5kZXggPSBwYXJzZUludChsYXllcnNbaV0uc3R5bGUuekluZGV4LCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNOYU4oekluZGV4KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRnZVpJbmRleCA9IGNvbXBhcmUoZWRnZVpJbmRleCwgekluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy56SW5kZXggPSB0aGlzLl9jYW52YXMuc3R5bGUuekluZGV4ID0gKGlzRmluaXRlKGVkZ2VaSW5kZXgpID8gZWRnZVpJbmRleCA6IDApICsgY29tcGFyZSgxLCAtMSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0T3BhY2l0eTogZnVuY3Rpb24ob3BhY2l0eSkge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0WkluZGV4OiBmdW5jdGlvbih6SW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy56SW5kZXggPSB6SW5kZXg7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVaSW5kZXgoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF91cGRhdGVaSW5kZXg6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2NhbnZhcyAmJiB0aGlzLm9wdGlvbnMuekluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jYW52YXMuc3R5bGUuekluZGV4ID0gdGhpcy5vcHRpb25zLnpJbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfcmVzZXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIF8uZm9ySW4odGhpcy5fdGlsZXMsIGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLmZpcmUoJ3RpbGV1bmxvYWQnLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpbGU6IHRpbGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fdGlsZXMgPSB7fTtcbiAgICAgICAgICAgIHRoaXMuX3RpbGVzVG9Mb2FkID0gMDtcbiAgICAgICAgICAgIGlmICh0aGlzLl9hbmltYXRlZCAmJiBlICYmIGUuaGFyZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NsZWFyQmFja0J1ZmZlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF91cGRhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9tYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5fbWFwO1xuICAgICAgICAgICAgdmFyIGJvdW5kcyA9IG1hcC5nZXRQaXhlbEJvdW5kcygpO1xuICAgICAgICAgICAgdmFyIHpvb20gPSBtYXAuZ2V0Wm9vbSgpO1xuICAgICAgICAgICAgdmFyIHRpbGVTaXplID0gdGhpcy5fZ2V0VGlsZVNpemUoKTtcbiAgICAgICAgICAgIGlmICh6b29tID4gdGhpcy5vcHRpb25zLm1heFpvb20gfHxcbiAgICAgICAgICAgICAgICB6b29tIDwgdGhpcy5vcHRpb25zLm1pblpvb20pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGlsZUJvdW5kcyA9IEwuYm91bmRzKFxuICAgICAgICAgICAgICAgIGJvdW5kcy5taW4uZGl2aWRlQnkodGlsZVNpemUpLl9mbG9vcigpLFxuICAgICAgICAgICAgICAgIGJvdW5kcy5tYXguZGl2aWRlQnkodGlsZVNpemUpLl9mbG9vcigpKTtcbiAgICAgICAgICAgIHRoaXMuX2FkZFRpbGVzRnJvbUNlbnRlck91dCh0aWxlQm91bmRzKTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMudW5sb2FkSW52aXNpYmxlVGlsZXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVPdGhlclRpbGVzKHRpbGVCb3VuZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9hZGRUaWxlc0Zyb21DZW50ZXJPdXQ6IGZ1bmN0aW9uKGJvdW5kcykge1xuICAgICAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgICAgICB2YXIgY2VudGVyID0gYm91bmRzLmdldENlbnRlcigpO1xuICAgICAgICAgICAgdmFyIGo7XG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIHZhciBwb2ludDtcbiAgICAgICAgICAgIGZvciAoaiA9IGJvdW5kcy5taW4ueTsgaiA8PSBib3VuZHMubWF4Lnk7IGorKykge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IGJvdW5kcy5taW4ueDsgaSA8PSBib3VuZHMubWF4Lng7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBwb2ludCA9IG5ldyBMLlBvaW50KGksIGopO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fdGlsZVNob3VsZEJlTG9hZGVkKHBvaW50KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucHVzaChwb2ludCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGlsZXNUb0xvYWQgPSBxdWV1ZS5sZW5ndGg7XG4gICAgICAgICAgICBpZiAodGlsZXNUb0xvYWQgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBsb2FkIHRpbGVzIGluIG9yZGVyIG9mIHRoZWlyIGRpc3RhbmNlIHRvIGNlbnRlclxuICAgICAgICAgICAgcXVldWUuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGEuZGlzdGFuY2VUbyhjZW50ZXIpIC0gYi5kaXN0YW5jZVRvKGNlbnRlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGlmIGl0cyB0aGUgZmlyc3QgYmF0Y2ggb2YgdGlsZXMgdG8gbG9hZFxuICAgICAgICAgICAgaWYgKCF0aGlzLl90aWxlc1RvTG9hZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnbG9hZGluZycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fdGlsZXNUb0xvYWQgKz0gdGlsZXNUb0xvYWQ7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGlsZXNUb0xvYWQ7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZFRpbGUocXVldWVbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF90aWxlU2hvdWxkQmVMb2FkZWQ6IGZ1bmN0aW9uKHRpbGVQb2ludCkge1xuICAgICAgICAgICAgaWYgKCh0aWxlUG9pbnQueCArICc6JyArIHRpbGVQb2ludC55KSBpbiB0aGlzLl90aWxlcykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgLy8gYWxyZWFkeSBsb2FkZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICAgICAgaWYgKCFvcHRpb25zLmNvbnRpbnVvdXNXb3JsZCkge1xuICAgICAgICAgICAgICAgIHZhciBsaW1pdCA9IHRoaXMuX2dldFdyYXBUaWxlTnVtKCk7XG4gICAgICAgICAgICAgICAgLy8gZG9uJ3QgbG9hZCBpZiBleGNlZWRzIHdvcmxkIGJvdW5kc1xuICAgICAgICAgICAgICAgIGlmICgob3B0aW9ucy5ub1dyYXAgJiYgKHRpbGVQb2ludC54IDwgMCB8fCB0aWxlUG9pbnQueCA+PSBsaW1pdC54KSkgfHxcbiAgICAgICAgICAgICAgICAgICAgdGlsZVBvaW50LnkgPCAwIHx8IHRpbGVQb2ludC55ID49IGxpbWl0LnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmJvdW5kcykge1xuICAgICAgICAgICAgICAgIHZhciB0aWxlU2l6ZSA9IHRoaXMuX2dldFRpbGVTaXplKCk7XG4gICAgICAgICAgICAgICAgdmFyIG53UG9pbnQgPSB0aWxlUG9pbnQubXVsdGlwbHlCeSh0aWxlU2l6ZSk7XG4gICAgICAgICAgICAgICAgdmFyIHNlUG9pbnQgPSBud1BvaW50LmFkZChbdGlsZVNpemUsIHRpbGVTaXplXSk7XG4gICAgICAgICAgICAgICAgdmFyIG53ID0gdGhpcy5fbWFwLnVucHJvamVjdChud1BvaW50KTtcbiAgICAgICAgICAgICAgICB2YXIgc2UgPSB0aGlzLl9tYXAudW5wcm9qZWN0KHNlUG9pbnQpO1xuICAgICAgICAgICAgICAgIC8vIFRPRE8gdGVtcG9yYXJ5IGhhY2ssIHdpbGwgYmUgcmVtb3ZlZCBhZnRlciByZWZhY3RvcmluZyBwcm9qZWN0aW9uc1xuICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9MZWFmbGV0L0xlYWZsZXQvaXNzdWVzLzE2MThcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuY29udGludW91c1dvcmxkICYmICFvcHRpb25zLm5vV3JhcCkge1xuICAgICAgICAgICAgICAgICAgICBudyA9IG53LndyYXAoKTtcbiAgICAgICAgICAgICAgICAgICAgc2UgPSBzZS53cmFwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5ib3VuZHMuaW50ZXJzZWN0cyhbbncsIHNlXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZW1vdmVPdGhlclRpbGVzOiBmdW5jdGlvbihib3VuZHMpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIF8uZm9ySW4odGhpcy5fdGlsZXMsIGZ1bmN0aW9uKHRpbGUsIGtleSkge1xuICAgICAgICAgICAgICAgIHZhciBrQXJyID0ga2V5LnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHggPSBwYXJzZUludChrQXJyWzBdLCAxMCk7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBwYXJzZUludChrQXJyWzFdLCAxMCk7XG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRpbGUgaWYgaXQncyBvdXQgb2YgYm91bmRzXG4gICAgICAgICAgICAgICAgaWYgKHggPCBib3VuZHMubWluLnggfHxcbiAgICAgICAgICAgICAgICAgICAgeCA+IGJvdW5kcy5tYXgueCB8fFxuICAgICAgICAgICAgICAgICAgICB5IDwgYm91bmRzLm1pbi55IHx8XG4gICAgICAgICAgICAgICAgICAgIHkgPiBib3VuZHMubWF4LnkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlVGlsZShrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRUaWxlU2l6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5fbWFwO1xuICAgICAgICAgICAgdmFyIHpvb20gPSBtYXAuZ2V0Wm9vbSgpICsgdGhpcy5vcHRpb25zLnpvb21PZmZzZXQ7XG4gICAgICAgICAgICB2YXIgem9vbU4gPSB0aGlzLm9wdGlvbnMubWF4TmF0aXZlWm9vbTtcbiAgICAgICAgICAgIHZhciB0aWxlU2l6ZSA9IDI1NjtcbiAgICAgICAgICAgIGlmICh6b29tTiAmJiB6b29tID4gem9vbU4pIHtcbiAgICAgICAgICAgICAgICB0aWxlU2l6ZSA9IE1hdGgucm91bmQobWFwLmdldFpvb21TY2FsZSh6b29tKSAvIG1hcC5nZXRab29tU2NhbGUoem9vbU4pICogdGlsZVNpemUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRpbGVTaXplO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzZXQoe1xuICAgICAgICAgICAgICAgICAgICBoYXJkOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBfY3JlYXRlVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FkZFRpbGU6IGZ1bmN0aW9uKHRpbGVQb2ludCkge1xuICAgICAgICAgICAgLy8gY3JlYXRlIGEgbmV3IHRpbGVcbiAgICAgICAgICAgIHZhciB0aWxlID0gdGhpcy5fY3JlYXRlVGlsZSgpO1xuICAgICAgICAgICAgdGhpcy5fdGlsZXNbdGlsZVBvaW50LnggKyAnOicgKyB0aWxlUG9pbnQueV0gPSB0aWxlO1xuICAgICAgICAgICAgdGhpcy5fbG9hZFRpbGUodGlsZSwgdGlsZVBvaW50KTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbG9hZFRpbGU6IGZ1bmN0aW9uKHRpbGUsIHRpbGVQb2ludCkge1xuICAgICAgICAgICAgdGlsZS5fbGF5ZXIgPSB0aGlzO1xuICAgICAgICAgICAgdGlsZS5fdGlsZVBvaW50ID0gdGlsZVBvaW50O1xuICAgICAgICAgICAgdGlsZS5fdW5hZGp1c3RlZFRpbGVQb2ludCA9IHtcbiAgICAgICAgICAgICAgICB4OiB0aWxlUG9pbnQueCxcbiAgICAgICAgICAgICAgICB5OiB0aWxlUG9pbnQueVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2FkanVzdFRpbGVQb2ludCh0aWxlUG9pbnQpO1xuICAgICAgICAgICAgdGhpcy5fcmVkcmF3VGlsZSh0aWxlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfYWRqdXN0VGlsZUtleTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAvLyB3aGVuIGRlYWxpbmcgd2l0aCB3cmFwcGVkIHRpbGVzLCBpbnRlcm5hbGx5IGxlYWZldCB3aWxsIHVzZVxuICAgICAgICAgICAgLy8gY29vcmRpbmF0ZXMgbiA8IDAgYW5kIG4gPiAoMl56KSB0byBwb3NpdGlvbiB0aGVtIGNvcnJlY3RseS5cbiAgICAgICAgICAgIC8vIHRoaXMgZnVuY3Rpb24gY29udmVydHMgdGhhdCB0byB0aGUgbW9kdWxvcyBrZXkgdXNlZCB0byBjYWNoZSB0aGVtXG4gICAgICAgICAgICAvLyBkYXRhLlxuICAgICAgICAgICAgLy8gRXguICctMTozJyBhdCB6ID0gMiBiZWNvbWVzICczOjMnXG4gICAgICAgICAgICB2YXIga0FyciA9IGtleS5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdmFyIHggPSBwYXJzZUludChrQXJyWzBdLCAxMCk7XG4gICAgICAgICAgICB2YXIgeSA9IHBhcnNlSW50KGtBcnJbMV0sIDEwKTtcbiAgICAgICAgICAgIHZhciB0aWxlUG9pbnQgPSB7XG4gICAgICAgICAgICAgICAgeDogeCxcbiAgICAgICAgICAgICAgICB5OiB5XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fYWRqdXN0VGlsZVBvaW50KHRpbGVQb2ludCk7XG4gICAgICAgICAgICByZXR1cm4gdGlsZVBvaW50LnggKyAnOicgKyB0aWxlUG9pbnQueSArICc6JyArIHRpbGVQb2ludC56O1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRab29tRm9yVXJsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICAgICAgdmFyIHpvb20gPSB0aGlzLl9tYXAuZ2V0Wm9vbSgpO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuem9vbVJldmVyc2UpIHtcbiAgICAgICAgICAgICAgICB6b29tID0gb3B0aW9ucy5tYXhab29tIC0gem9vbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHpvb20gKz0gb3B0aW9ucy56b29tT2Zmc2V0O1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubWF4TmF0aXZlWm9vbSA/IE1hdGgubWluKHpvb20sIG9wdGlvbnMubWF4TmF0aXZlWm9vbSkgOiB6b29tO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRUaWxlUG9zOiBmdW5jdGlvbih0aWxlUG9pbnQpIHtcbiAgICAgICAgICAgIHZhciBvcmlnaW4gPSB0aGlzLl9tYXAuZ2V0UGl4ZWxPcmlnaW4oKTtcbiAgICAgICAgICAgIHZhciB0aWxlU2l6ZSA9IHRoaXMuX2dldFRpbGVTaXplKCk7XG4gICAgICAgICAgICByZXR1cm4gdGlsZVBvaW50Lm11bHRpcGx5QnkodGlsZVNpemUpLnN1YnRyYWN0KG9yaWdpbik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFdyYXBUaWxlTnVtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBjcnMgPSB0aGlzLl9tYXAub3B0aW9ucy5jcnM7XG4gICAgICAgICAgICB2YXIgc2l6ZSA9IGNycy5nZXRTaXplKHRoaXMuX21hcC5nZXRab29tKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHNpemUuZGl2aWRlQnkodGhpcy5fZ2V0VGlsZVNpemUoKSkuX2Zsb29yKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FkanVzdFRpbGVQb2ludDogZnVuY3Rpb24odGlsZVBvaW50KSB7XG4gICAgICAgICAgICB2YXIgbGltaXQgPSB0aGlzLl9nZXRXcmFwVGlsZU51bSgpO1xuICAgICAgICAgICAgLy8gd3JhcCB0aWxlIGNvb3JkaW5hdGVzXG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5jb250aW51b3VzV29ybGQgJiYgIXRoaXMub3B0aW9ucy5ub1dyYXApIHtcbiAgICAgICAgICAgICAgICB0aWxlUG9pbnQueCA9ICgodGlsZVBvaW50LnggJSBsaW1pdC54KSArIGxpbWl0LngpICUgbGltaXQueDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMudG1zKSB7XG4gICAgICAgICAgICAgICAgdGlsZVBvaW50LnkgPSBsaW1pdC55IC0gdGlsZVBvaW50LnkgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGlsZVBvaW50LnogPSB0aGlzLl9nZXRab29tRm9yVXJsKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlbW92ZVRpbGU6IGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAgICAgdmFyIGFkanVzdGVkS2V5ID0gdGhpcy5fYWRqdXN0VGlsZUtleShrZXkpO1xuICAgICAgICAgICAgdmFyIGNhY2hlZCA9IHRoaXMuX2NhY2hlW2FkanVzdGVkS2V5XTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgdGlsZSBmcm9tIHRoZSBjYWNoZVxuICAgICAgICAgICAgZGVsZXRlIGNhY2hlZC50aWxlc1trZXldO1xuICAgICAgICAgICAgaWYgKF8ua2V5cyhjYWNoZWQudGlsZXMpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIG5vIG1vcmUgdGlsZXMgdXNlIHRoaXMgY2FjaGVkIGRhdGEsIHNvIGRlbGV0ZSBpdFxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9jYWNoZVthZGp1c3RlZEtleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB1bmxvYWQgdGhlIHRpbGVcbiAgICAgICAgICAgIHZhciB0aWxlID0gdGhpcy5fdGlsZXNba2V5XTtcbiAgICAgICAgICAgIHRoaXMuZmlyZSgndGlsZXVubG9hZCcsIHtcbiAgICAgICAgICAgICAgICB0aWxlOiB0aWxlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl90aWxlc1trZXldO1xuICAgICAgICB9LFxuXG4gICAgICAgIF90aWxlTG9hZGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpbGVzVG9Mb2FkLS07XG4gICAgICAgICAgICBpZiAodGhpcy5fYW5pbWF0ZWQpIHtcbiAgICAgICAgICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fY2FudmFzLCAnbGVhZmxldC16b29tLWFuaW1hdGVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3RpbGVzVG9Mb2FkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdsb2FkJyk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2FuaW1hdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNsZWFyIHNjYWxlZCB0aWxlcyBhZnRlciBhbGwgbmV3IHRpbGVzIGFyZSBsb2FkZWQgKGZvciBwZXJmb3JtYW5jZSlcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2NsZWFyQnVmZmVyVGltZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jbGVhckJ1ZmZlclRpbWVyID0gc2V0VGltZW91dChMLmJpbmQodGhpcy5fY2xlYXJCYWNrQnVmZmVyLCB0aGlzKSwgNTAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3RpbGVPbkxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGxheWVyID0gdGhpcy5fbGF5ZXI7XG4gICAgICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcywgJ2xlYWZsZXQtdGlsZS1sb2FkZWQnKTtcbiAgICAgICAgICAgIGxheWVyLmZpcmUoJ3RpbGVsb2FkJywge1xuICAgICAgICAgICAgICAgIHRpbGU6IHRoaXNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGF5ZXIuX3RpbGVMb2FkZWQoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfdGlsZU9uRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGxheWVyID0gdGhpcy5fbGF5ZXI7XG4gICAgICAgICAgICBsYXllci5maXJlKCd0aWxlZXJyb3InLCB7XG4gICAgICAgICAgICAgICAgdGlsZTogdGhpc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsYXllci5fdGlsZUxvYWRlZCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9lbmNvZGVGbG9hdEFzVWludDg6IGZ1bmN0aW9uKG51bSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFtcbiAgICAgICAgICAgICAgICAobnVtICYgMHhmZjAwMDAwMCkgPj4gMjQsXG4gICAgICAgICAgICAgICAgKG51bSAmIDB4MDBmZjAwMDApID4+IDE2LFxuICAgICAgICAgICAgICAgIChudW0gJiAweDAwMDBmZjAwKSA+PiA4LFxuICAgICAgICAgICAgICAgIChudW0gJiAweDAwMDAwMGZmKVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NyZWF0ZURhdGFUZXh0dXJlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgZG91YmxlcyA9IG5ldyBGbG9hdDY0QXJyYXkoZGF0YSk7XG4gICAgICAgICAgICB2YXIgcmVzb2x1dGlvbiA9IE1hdGguc3FydChkb3VibGVzLmxlbmd0aCk7XG4gICAgICAgICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHJlc29sdXRpb24gKiByZXNvbHV0aW9uICogNCk7XG4gICAgICAgICAgICB2YXIgZW5jb2RlZEJpbnMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXNvbHV0aW9uICogcmVzb2x1dGlvbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy8gY2FzdCBmcm9tIGZsb2F0NjQgdG8gZmxvYXQzMlxuICAgICAgICAgICAgICAgIHZhciBlbmMgPSB0aGlzLl9lbmNvZGVGbG9hdEFzVWludDgoZG91Ymxlc1tpXSk7XG4gICAgICAgICAgICAgICAgZW5jb2RlZEJpbnNbaSAqIDRdID0gZW5jWzBdO1xuICAgICAgICAgICAgICAgIGVuY29kZWRCaW5zW2kgKiA0ICsgMV0gPSBlbmNbMV07XG4gICAgICAgICAgICAgICAgZW5jb2RlZEJpbnNbaSAqIDQgKyAyXSA9IGVuY1syXTtcbiAgICAgICAgICAgICAgICBlbmNvZGVkQmluc1tpICogNCArIDNdID0gZW5jWzNdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ldyBlc3Blci5UZXh0dXJlMkQoe1xuICAgICAgICAgICAgICAgIGhlaWdodDogcmVzb2x1dGlvbixcbiAgICAgICAgICAgICAgICB3aWR0aDogcmVzb2x1dGlvbixcbiAgICAgICAgICAgICAgICBkYXRhOiBlbmNvZGVkQmlucyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdSR0JBJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnVU5TSUdORURfQllURScsXG4gICAgICAgICAgICAgICAgd3JhcDogJ0NMQU1QX1RPX0VER0UnLFxuICAgICAgICAgICAgICAgIGZpbHRlcjogJ05FQVJFU1QnLFxuICAgICAgICAgICAgICAgIGludmVydFk6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWRyYXdUaWxlOiBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgY2FjaGUgPSB0aGlzLl9jYWNoZTtcbiAgICAgICAgICAgIHZhciBjb29yZCA9IHtcbiAgICAgICAgICAgICAgICB4OiB0aWxlLl90aWxlUG9pbnQueCxcbiAgICAgICAgICAgICAgICB5OiB0aWxlLl90aWxlUG9pbnQueSxcbiAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuX3pvb21cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyB1c2UgdGhlIGFkanVzdGVkIGNvb3JkaW5hdGVzIHRvIGhhc2ggdGhlIHRoZSBjYWNoZSB2YWx1ZXMsIHRoaXNcbiAgICAgICAgICAgIC8vIGlzIGJlY2F1c2Ugd2Ugd2FudCB0byBvbmx5IGhhdmUgb25lIGNvcHkgb2YgdGhlIGRhdGFcbiAgICAgICAgICAgIHZhciBoYXNoID0gY29vcmQueCArICc6JyArIGNvb3JkLnkgKyAnOicgKyBjb29yZC56O1xuICAgICAgICAgICAgLy8gdXNlIHRoZSB1bmFkanN1dGVkIGNvb3JkaW5hdGVzIHRvIHRyYWNrIHdoaWNoICd3cmFwcGVkJyB0aWxlc1xuICAgICAgICAgICAgLy8gdXNlZCB0aGUgY2FjaGVkIGRhdGFcbiAgICAgICAgICAgIHZhciB1bmFkanVzdGVkSGFzaCA9IHRpbGUuX3VuYWRqdXN0ZWRUaWxlUG9pbnQueCArICc6JyArIHRpbGUuX3VuYWRqdXN0ZWRUaWxlUG9pbnQueTtcbiAgICAgICAgICAgIC8vIGNoZWNrIGNhY2hlXG4gICAgICAgICAgICB2YXIgY2FjaGVkID0gY2FjaGVbaGFzaF07XG4gICAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gc3RvcmUgdGhlIHRpbGUgaW4gdGhlIGNhY2hlIHRvIGRyYXcgdG8gbGF0ZXJcbiAgICAgICAgICAgICAgICBjYWNoZWQudGlsZXNbdW5hZGp1c3RlZEhhc2hdID0gdGlsZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgY2FjaGUgZW50cnlcbiAgICAgICAgICAgICAgICBjYWNoZVtoYXNoXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgaXNQZW5kaW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0aWxlczoge30sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG51bGxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aWxlIHRvIHRoZSBjYWNoZSBlbnRyeVxuICAgICAgICAgICAgICAgIGNhY2hlW2hhc2hdLnRpbGVzW3VuYWRqdXN0ZWRIYXNoXSA9IHRpbGU7XG4gICAgICAgICAgICAgICAgLy8gcmVxdWVzdCB0aGUgdGlsZVxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdFRpbGUoY29vcmQsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhY2hlZCA9IGNhY2hlW2hhc2hdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNhY2hlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGlsZSBpcyBubyBsb25nZXIgYmVpbmcgdHJhY2tlZCwgaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2FjaGVkLmlzUGVuZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBkYXRhIGlzIG51bGwsIGV4aXQgZWFybHlcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGV4dHJlbWFcbiAgICAgICAgICAgICAgICAgICAgc2VsZi51cGRhdGVFeHRyZW1hKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBjYWNoZWQuZGF0YSA9IHNlbGYuX2NyZWF0ZURhdGFUZXh0dXJlKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9pbml0R0w6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGdsID0gdGhpcy5fZ2wgPSBlc3Blci5XZWJHTENvbnRleHQuZ2V0KHRoaXMuX2NhbnZhcyk7XG4gICAgICAgICAgICAvLyBoYW5kbGUgbWlzc2luZyBjb250ZXh0XG4gICAgICAgICAgICBpZiAoIWdsKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVW5hYmxlIHRvIGFjcXVpcmUgYSBXZWJHTCBjb250ZXh0LicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGluaXQgdGhlIHdlYmdsIHN0YXRlXG4gICAgICAgICAgICBnbC5jbGVhckNvbG9yKDAsIDAsIDAsIDApO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgICAgIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORSk7XG4gICAgICAgICAgICBnbC5kaXNhYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgICAgICAgICAgLy8gY3JlYXRlIHRpbGUgcmVuZGVyYWJsZVxuICAgICAgICAgICAgc2VsZi5fcmVuZGVyYWJsZSA9IG5ldyBlc3Blci5SZW5kZXJhYmxlKHtcbiAgICAgICAgICAgICAgICB2ZXJ0aWNlczoge1xuICAgICAgICAgICAgICAgICAgICAwOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBbMCwgLTI1Nl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbMjU2LCAtMjU2XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFsyNTYsIDBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgWzAsIDBdXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIDE6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFswLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFsxLCAwXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFsxLCAxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFswLCAxXVxuICAgICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBpbmRpY2VzOiBbXG4gICAgICAgICAgICAgICAgICAgIDAsIDEsIDIsXG4gICAgICAgICAgICAgICAgICAgIDAsIDIsIDNcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGxvYWQgc2hhZGVyc1xuICAgICAgICAgICAgdGhpcy5fc2hhZGVyID0gbmV3IGVzcGVyLlNoYWRlcih7XG4gICAgICAgICAgICAgICAgdmVydDogdGhpcy5vcHRpb25zLnNoYWRlcnMudmVydCxcbiAgICAgICAgICAgICAgICBmcmFnOiB0aGlzLm9wdGlvbnMuc2hhZGVycy5mcmFnXG4gICAgICAgICAgICB9LCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBleGVjdXRlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gc2VsZi5fY2FudmFzLndpZHRoO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBzZWxmLl9jYW52YXMuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHNlbGYuX3ZpZXdwb3J0ID0gbmV3IGVzcGVyLlZpZXdwb3J0KHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNlbGYuX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLl9kcmF3KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBfaW5pdENhbnZhczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9jYW52YXMgPSBMLkRvbVV0aWwuY3JlYXRlKCdjYW52YXMnLCAnbGVhZmxldC13ZWJnbC1sYXllciBsZWFmbGV0LWxheWVyJyk7XG4gICAgICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX21hcC5nZXRTaXplKCk7XG4gICAgICAgICAgICB0aGlzLl9jYW52YXMud2lkdGggPSBzaXplLng7XG4gICAgICAgICAgICB0aGlzLl9jYW52YXMuaGVpZ2h0ID0gc2l6ZS55O1xuICAgICAgICAgICAgdmFyIGFuaW1hdGVkID0gdGhpcy5fbWFwLm9wdGlvbnMuem9vbUFuaW1hdGlvbiAmJiBMLkJyb3dzZXIuYW55M2Q7XG4gICAgICAgICAgICBMLkRvbVV0aWwuYWRkQ2xhc3ModGhpcy5fY2FudmFzLCAnbGVhZmxldC16b29tLScgKyAoYW5pbWF0ZWQgPyAnYW5pbWF0ZWQnIDogJ2hpZGUnKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFByb2plY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGJvdW5kcyA9IHRoaXMuX21hcC5nZXRQaXhlbEJvdW5kcygpO1xuICAgICAgICAgICAgdmFyIGRpbSA9IE1hdGgucG93KDIsIHRoaXMuX21hcC5nZXRab29tKCkpICogMjU2O1xuICAgICAgICAgICAgcmV0dXJuIG9ydGhvTWF0cml4KFxuICAgICAgICAgICAgICAgIGJvdW5kcy5taW4ueCxcbiAgICAgICAgICAgICAgICBib3VuZHMubWF4LngsXG4gICAgICAgICAgICAgICAgKGRpbSAtIGJvdW5kcy5tYXgueSksXG4gICAgICAgICAgICAgICAgKGRpbSAtIGJvdW5kcy5taW4ueSksXG4gICAgICAgICAgICAgICAgLTEsIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jbGVhckJhY2tCdWZmZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9nbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBnbCA9IHRoaXMuX2dsO1xuICAgICAgICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FuaW1hdGVab29tOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLl9tYXAuZ2V0Wm9vbVNjYWxlKGUuem9vbSk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gdGhpcy5fbWFwLl9nZXRDZW50ZXJPZmZzZXQoZS5jZW50ZXIpLl9tdWx0aXBseUJ5KC1zY2FsZSkuc3VidHJhY3QodGhpcy5fbWFwLl9nZXRNYXBQYW5lUG9zKCkpO1xuICAgICAgICAgICAgdGhpcy5fY2FudmFzLnN0eWxlW0wuRG9tVXRpbC5UUkFOU0ZPUk1dID0gTC5Eb21VdGlsLmdldFRyYW5zbGF0ZVN0cmluZyhvZmZzZXQpICsgJyBzY2FsZSgnICsgc2NhbGUgKyAnKSc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3Jlc2l6ZTogZnVuY3Rpb24ocmVzaXplRXZlbnQpIHtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IHJlc2l6ZUV2ZW50Lm5ld1NpemUueDtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSByZXNpemVFdmVudC5uZXdTaXplLnk7XG4gICAgICAgICAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl92aWV3cG9ydC5yZXNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2RyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxpemVkICYmIHRoaXMuX2dsKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzSGlkZGVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmUtcG9zaXRpb24gY2FudmFzXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5faXNab29taW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG9wTGVmdCA9IHRoaXMuX21hcC5jb250YWluZXJQb2ludFRvTGF5ZXJQb2ludChbMCwgMF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgTC5Eb21VdGlsLnNldFBvc2l0aW9uKHRoaXMuX2NhbnZhcywgdG9wTGVmdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYmVmb3JlRHJhdygpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJlZm9yZURyYXcoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWZ0ZXJEcmF3KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2FmdGVyRHJhdygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5fZHJhdy5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBiZWZvcmVEcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cbiAgICAgICAgX2JlZm9yZURyYXc6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fdmlld3BvcnQucHVzaCgpO1xuICAgICAgICAgICAgdGhpcy5fc2hhZGVyLnB1c2goKTtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5zZXRVbmlmb3JtKCd1UHJvamVjdGlvbk1hdHJpeCcsIHRoaXMuX2dldFByb2plY3Rpb24oKSk7XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIuc2V0VW5pZm9ybSgndU9wYWNpdHknLCB0aGlzLmdldE9wYWNpdHkoKSk7XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIuc2V0VW5pZm9ybSgndVRleHR1cmVTYW1wbGVyJywgMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWZ0ZXJEcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FmdGVyRHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIucG9wKCk7XG4gICAgICAgICAgICB0aGlzLl92aWV3cG9ydC5wb3AoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBkaW0gPSBNYXRoLnBvdygyLCB0aGlzLl9tYXAuZ2V0Wm9vbSgpKSAqIDI1NjtcbiAgICAgICAgICAgIC8vIGZvciBlYWNoIHRpbGVcbiAgICAgICAgICAgIF8uZm9ySW4odGhpcy5fY2FjaGUsIGZ1bmN0aW9uKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIGlmIChjYWNoZWQuaXNQZW5kaW5nIHx8ICFjYWNoZWQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGJpbmQgdGlsZSB0ZXh0dXJlIHRvIHRleHR1cmUgdW5pdCAwXG4gICAgICAgICAgICAgICAgY2FjaGVkLmRhdGEucHVzaCgwKTtcbiAgICAgICAgICAgICAgICBfLmZvckluKGNhY2hlZC50aWxlcywgZnVuY3Rpb24odGlsZSwga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbmQgdGhlIHRpbGVzIHBvc2l0aW9uIGZyb20gaXRzIGtleVxuICAgICAgICAgICAgICAgICAgICB2YXIga0FyciA9IGtleS5zcGxpdCgnOicpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeCA9IHBhcnNlSW50KGtBcnJbMF0sIDEwKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHkgPSBwYXJzZUludChrQXJyWzFdLCAxMCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBtb2RlbCBtYXRyaXhcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gbmV3IHRyYW5zbGF0aW9uTWF0cml4KFtcbiAgICAgICAgICAgICAgICAgICAgICAgIDI1NiAqIHgsXG4gICAgICAgICAgICAgICAgICAgICAgICBkaW0gLSAoMjU2ICogeSksXG4gICAgICAgICAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaGFkZXIuc2V0VW5pZm9ybSgndU1vZGVsTWF0cml4JywgbW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBkcmF3IHRoZSB0aWxlXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3JlbmRlcmFibGUuZHJhdygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gbm8gbmVlZCB0byB1bmJpbmQgdGV4dHVyZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVxdWVzdFRpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFdlYkdMO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gY2FudmFzIHJlbmRlcmVyc1xuICAgIHZhciBDYW52YXMgPSB7XG4gICAgICAgIEhlYXRtYXA6IHJlcXVpcmUoJy4vdHlwZXMvY2FudmFzL0hlYXRtYXAnKVxuICAgIH07XG5cbiAgICAvLyBodG1sIHJlbmRlcmVyc1xuICAgIHZhciBIVE1MID0ge1xuICAgICAgICBIZWF0bWFwOiByZXF1aXJlKCcuL3R5cGVzL2h0bWwvSGVhdG1hcCcpLFxuICAgICAgICBSaW5nOiByZXF1aXJlKCcuL3R5cGVzL2h0bWwvUmluZycpLFxuICAgICAgICBXb3JkQ2xvdWQ6IHJlcXVpcmUoJy4vdHlwZXMvaHRtbC9Xb3JkQ2xvdWQnKSxcbiAgICAgICAgV29yZEhpc3RvZ3JhbTogcmVxdWlyZSgnLi90eXBlcy9odG1sL1dvcmRIaXN0b2dyYW0nKVxuICAgIH07XG5cbiAgICAvLyB3ZWJnbCByZW5kZXJlcnNcbiAgICB2YXIgV2ViR0wgPSB7XG4gICAgICAgIEhlYXRtYXA6IHJlcXVpcmUoJy4vdHlwZXMvd2ViZ2wvSGVhdG1hcCcpXG4gICAgfTtcblxuICAgIC8vIHBlbmRpbmcgbGF5ZXIgcmVuZGVyZXJzXG4gICAgdmFyIFBlbmRpbmcgPSB7XG4gICAgICAgIEJsaW5rOiByZXF1aXJlKCcuL3R5cGVzL3BlbmRpbmcvQmxpbmsnKSxcbiAgICAgICAgU3BpbjogcmVxdWlyZSgnLi90eXBlcy9wZW5kaW5nL1NwaW4nKSxcbiAgICAgICAgQmxpbmtTcGluOiByZXF1aXJlKCcuL3R5cGVzL3BlbmRpbmcvQmxpbmtTcGluJyksXG4gICAgfTtcblxuICAgIC8vIHBlbmRpbmcgbGF5ZXIgcmVuZGVyZXJzXG4gICAgdmFyIERlYnVnID0ge1xuICAgICAgICBDb29yZDogcmVxdWlyZSgnLi90eXBlcy9kZWJ1Zy9Db29yZCcpXG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBIVE1MOiBIVE1MLFxuICAgICAgICBDYW52YXM6IENhbnZhcyxcbiAgICAgICAgV2ViR0w6IFdlYkdMLFxuICAgICAgICBEZWJ1ZzogRGVidWcsXG4gICAgICAgIFBlbmRpbmc6IFBlbmRpbmdcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFBPU0lUSVZFID0gJzEnO1xuICAgIHZhciBORVVUUkFMID0gJzAnO1xuICAgIHZhciBORUdBVElWRSA9ICctMSc7XG5cbiAgICBmdW5jdGlvbiBnZXRDbGFzc0Z1bmMobWluLCBtYXgpIHtcbiAgICAgICAgbWluID0gbWluICE9PSB1bmRlZmluZWQgPyBtaW4gOiAtMTtcbiAgICAgICAgbWF4ID0gbWF4ICE9PSB1bmRlZmluZWQgPyBtYXggOiAxO1xuICAgICAgICB2YXIgcG9zaXRpdmUgPSBbMC4yNSAqIG1heCwgMC41ICogbWF4LCAwLjc1ICogbWF4XTtcbiAgICAgICAgdmFyIG5lZ2F0aXZlID0gWy0wLjI1ICogbWluLCAtMC41ICogbWluLCAtMC43NSAqIG1pbl07XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihzZW50aW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBwcmVmaXg7XG4gICAgICAgICAgICB2YXIgcmFuZ2U7XG4gICAgICAgICAgICBpZiAoc2VudGltZW50IDwgMCkge1xuICAgICAgICAgICAgICAgIHByZWZpeCA9ICduZWctJztcbiAgICAgICAgICAgICAgICByYW5nZSA9IG5lZ2F0aXZlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggPSAncG9zLSc7XG4gICAgICAgICAgICAgICAgcmFuZ2UgPSBwb3NpdGl2ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBhYnMgPSBNYXRoLmFicyhzZW50aW1lbnQpO1xuICAgICAgICAgICAgaWYgKGFicyA+IHJhbmdlWzJdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArICc0JztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzID4gcmFuZ2VbMV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ICsgJzMnO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhYnMgPiByYW5nZVswXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyAnMic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJlZml4ICsgJzEnO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFRvdGFsKGNvdW50KSB7XG4gICAgICAgIGlmICghY291bnQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwb3MgPSBjb3VudFtQT1NJVElWRV0gPyBjb3VudFtQT1NJVElWRV0gOiAwO1xuICAgICAgICB2YXIgbmV1ID0gY291bnRbTkVVVFJBTF0gPyBjb3VudFtORVVUUkFMXSA6IDA7XG4gICAgICAgIHZhciBuZWcgPSBjb3VudFtORUdBVElWRV0gPyBjb3VudFtORUdBVElWRV0gOiAwO1xuICAgICAgICByZXR1cm4gcG9zICsgbmV1ICsgbmVnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEF2Zyhjb3VudCkge1xuICAgICAgICBpZiAoIWNvdW50KSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcG9zID0gY291bnRbUE9TSVRJVkVdID8gY291bnRbUE9TSVRJVkVdIDogMDtcbiAgICAgICAgdmFyIG5ldSA9IGNvdW50W05FVVRSQUxdID8gY291bnRbTkVVVFJBTF0gOiAwO1xuICAgICAgICB2YXIgbmVnID0gY291bnRbTkVHQVRJVkVdID8gY291bnRbTkVHQVRJVkVdIDogMDtcbiAgICAgICAgdmFyIHRvdGFsID0gcG9zICsgbmV1ICsgbmVnO1xuICAgICAgICByZXR1cm4gKHRvdGFsICE9PSAwKSA/IChwb3MgLSBuZWcpIC8gdG90YWwgOiAwO1xuICAgIH1cblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBnZXRDbGFzc0Z1bmM6IGdldENsYXNzRnVuYyxcbiAgICAgICAgZ2V0VG90YWw6IGdldFRvdGFsLFxuICAgICAgICBnZXRBdmc6IGdldEF2Z1xuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgQ2FudmFzID0gcmVxdWlyZSgnLi4vLi4vY29yZS9DYW52YXMnKTtcblxuICAgIHZhciBIZWF0bWFwID0gQ2FudmFzLmV4dGVuZCh7XG5cbiAgICAgICAgcmVuZGVyQ2FudmFzOiBmdW5jdGlvbihiaW5zLCByZXNvbHV0aW9uLCByYW1wRnVuYykge1xuICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHJlc29sdXRpb247XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSByZXNvbHV0aW9uO1xuICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgdmFyIGltYWdlRGF0YSA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgcmVzb2x1dGlvbiwgcmVzb2x1dGlvbik7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGltYWdlRGF0YS5kYXRhO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICAgICAgdmFyIG52YWwsIHJ2YWwsIGJpbiwgaTtcbiAgICAgICAgICAgIGZvciAoaT0wOyBpPGJpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBiaW4gPSBiaW5zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChiaW4gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbMF0gPSAwO1xuICAgICAgICAgICAgICAgICAgICBjb2xvclsxXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yWzJdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbM10gPSAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG52YWwgPSBzZWxmLnRyYW5zZm9ybVZhbHVlKGJpbik7XG4gICAgICAgICAgICAgICAgICAgIHJ2YWwgPSBzZWxmLmludGVycG9sYXRlVG9SYW5nZShudmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmFtcEZ1bmMocnZhbCwgY29sb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkYXRhW2kgKiA0XSA9IGNvbG9yWzBdO1xuICAgICAgICAgICAgICAgIGRhdGFbaSAqIDQgKyAxXSA9IGNvbG9yWzFdO1xuICAgICAgICAgICAgICAgIGRhdGFbaSAqIDQgKyAyXSA9IGNvbG9yWzJdO1xuICAgICAgICAgICAgICAgIGRhdGFbaSAqIDQgKyAzXSA9IGNvbG9yWzNdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuICAgICAgICAgICAgcmV0dXJuIGNhbnZhcztcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihjYW52YXMsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBiaW5zID0gbmV3IEZsb2F0NjRBcnJheShkYXRhKTtcbiAgICAgICAgICAgIHZhciByZXNvbHV0aW9uID0gTWF0aC5zcXJ0KGJpbnMubGVuZ3RoKTtcbiAgICAgICAgICAgIHZhciByYW1wID0gdGhpcy5nZXRDb2xvclJhbXAoKTtcbiAgICAgICAgICAgIHZhciB0aWxlQ2FudmFzID0gdGhpcy5yZW5kZXJDYW52YXMoYmlucywgcmVzb2x1dGlvbiwgcmFtcCk7XG4gICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICBjdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKFxuICAgICAgICAgICAgICAgIHRpbGVDYW52YXMsXG4gICAgICAgICAgICAgICAgMCwgMCxcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uLCByZXNvbHV0aW9uLFxuICAgICAgICAgICAgICAgIDAsIDAsXG4gICAgICAgICAgICAgICAgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhlYXRtYXA7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihlbGVtLCBjb29yZCkge1xuICAgICAgICAgICAgJChlbGVtKS5lbXB0eSgpO1xuICAgICAgICAgICAgJChlbGVtKS5hcHBlbmQoJzxkaXYgc3R5bGU9XCJ0b3A6MDsgbGVmdDowO1wiPicgKyBjb29yZC56ICsgJywgJyArIGNvb3JkLnggKyAnLCAnICsgY29vcmQueSArICc8L2Rpdj4nKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBIVE1MID0gcmVxdWlyZSgnLi4vLi4vY29yZS9IVE1MJyk7XG5cbiAgICB2YXIgVElMRV9TSVpFID0gMjU2O1xuXG4gICAgdmFyIEhlYXRtYXAgPSBIVE1MLmV4dGVuZCh7XG5cbiAgICAgICAgaXNUYXJnZXRMYXllcjogZnVuY3Rpb24oIGVsZW0gKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyICYmICQuY29udGFpbnModGhpcy5fY29udGFpbmVyLCBlbGVtICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYXJTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3ZlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0YXJnZXQuYXR0cignZGF0YS12YWx1ZScpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW92ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYXJlbnQgPSB0YXJnZXQucGFyZW50cygnLmxlYWZsZXQtaHRtbC10aWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW92ZXIodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcGFyc2VJbnQodmFsdWUsIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBieDogcGFyc2VJbnQodGFyZ2V0LmF0dHIoJ2RhdGEtYngnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnk6IHBhcnNlSW50KHRhcmdldC5hdHRyKCdkYXRhLWJ5JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdoZWF0bWFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldC5hdHRyKCdkYXRhLXZhbHVlJyk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdXQodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgYng6IHBhcnNlSW50KHRhcmdldC5hdHRyKCdkYXRhLWJ4JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5OiBwYXJzZUludCh0YXJnZXQuYXR0cignZGF0YS1ieScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaGVhdG1hcCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgLy8gdW4tc2VsZWN0IGFueSBwcmV2IHNlbGVjdGVkIHBpeGVsXG4gICAgICAgICAgICAkKCcuaGVhdG1hcC1waXhlbCcpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgIC8vIGdldCB0YXJnZXRcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzVGFyZ2V0TGF5ZXIoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCkpIHtcbiAgICAgICAgICAgICAgICAvLyB0aGlzIGxheWVyIGlzIG5vdCB0aGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCB0YXJnZXQuaGFzQ2xhc3MoJ2hlYXRtYXAtcGl4ZWwnKSApIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0LmF0dHIoJ2RhdGEtdmFsdWUnKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlcnMuY2xpY2spIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYXJlbnQgPSB0YXJnZXQucGFyZW50cygnLmxlYWZsZXQtaHRtbC10aWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oYW5kbGVycy5jbGljayh0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBieDogcGFyc2VJbnQodGFyZ2V0LmF0dHIoJ2RhdGEtYngnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnk6IHBhcnNlSW50KHRhcmdldC5hdHRyKCdkYXRhLWJ5JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdoZWF0bWFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihjb250YWluZXIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBiaW5zID0gbmV3IEZsb2F0NjRBcnJheShkYXRhKTtcbiAgICAgICAgICAgIHZhciByZXNvbHV0aW9uID0gTWF0aC5zcXJ0KGJpbnMubGVuZ3RoKTtcbiAgICAgICAgICAgIHZhciByYW1wRnVuYyA9IHRoaXMuZ2V0Q29sb3JSYW1wKCk7XG4gICAgICAgICAgICB2YXIgcGl4ZWxTaXplID0gVElMRV9TSVpFIC8gcmVzb2x1dGlvbjtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBjb2xvciA9IFswLCAwLCAwLCAwXTtcbiAgICAgICAgICAgIHZhciBodG1sID0gJyc7XG4gICAgICAgICAgICB2YXIgbnZhbCwgcnZhbCwgYmluO1xuICAgICAgICAgICAgdmFyIGxlZnQsIHRvcDtcbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgZm9yIChpPTA7IGk8Ymlucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGJpbiA9IGJpbnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGJpbiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsZWZ0ID0gKGkgJSByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgdG9wID0gTWF0aC5mbG9vcihpIC8gcmVzb2x1dGlvbik7XG4gICAgICAgICAgICAgICAgICAgIG52YWwgPSBzZWxmLnRyYW5zZm9ybVZhbHVlKGJpbik7XG4gICAgICAgICAgICAgICAgICAgIHJ2YWwgPSBzZWxmLmludGVycG9sYXRlVG9SYW5nZShudmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmFtcEZ1bmMocnZhbCwgY29sb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcmdiYSA9ICdyZ2JhKCcgK1xuICAgICAgICAgICAgICAgICAgICBjb2xvclswXSArICcsJyArXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yWzFdICsgJywnICtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbMl0gKyAnLCcgK1xuICAgICAgICAgICAgICAgICAgICAoY29sb3JbM10gLyAyNTUpICsgJyknO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJoZWF0bWFwLXBpeGVsXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLXZhbHVlPVwiJyArIGJpbiArICdcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtYng9XCInICsgbGVmdCArICdcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtYnk9XCInICsgdG9wICsgJ1wiICcgK1xuICAgICAgICAgICAgICAgICAgICAnc3R5bGU9XCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2hlaWdodDonICsgcGl4ZWxTaXplICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAnd2lkdGg6JyArIHBpeGVsU2l6ZSArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlZnQ6JyArIChsZWZ0ICogcGl4ZWxTaXplKSArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ3RvcDonICsgKHRvcCAqIHBpeGVsU2l6ZSkgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yOicgKyByZ2JhICsgJztcIj48L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBIZWF0bWFwO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEhUTUwgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0hUTUwnKTtcblxuICAgIHZhciBUSUxFX1NJWkUgPSAyNTY7XG5cbiAgICB2YXIgSGVhdG1hcCA9IEhUTUwuZXh0ZW5kKHtcblxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICQoJy5oZWF0bWFwLXJpbmcnKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICBpZiAoIHRhcmdldC5oYXNDbGFzcygnaGVhdG1hcC1yaW5nJykgKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmFkZENsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihjb250YWluZXIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBiaW5zID0gbmV3IEZsb2F0NjRBcnJheShkYXRhKTtcbiAgICAgICAgICAgIHZhciByZXNvbHV0aW9uID0gTWF0aC5zcXJ0KGJpbnMubGVuZ3RoKTtcbiAgICAgICAgICAgIHZhciBiaW5TaXplID0gKFRJTEVfU0laRSAvIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgdmFyIGh0bWwgPSAnJztcbiAgICAgICAgICAgIGJpbnMuZm9yRWFjaChmdW5jdGlvbihiaW4sIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFiaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcGVyY2VudCA9IHNlbGYudHJhbnNmb3JtVmFsdWUoYmluKTtcbiAgICAgICAgICAgICAgICB2YXIgcmFkaXVzID0gcGVyY2VudCAqIGJpblNpemU7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IChiaW5TaXplIC0gcmFkaXVzKSAvIDI7XG4gICAgICAgICAgICAgICAgdmFyIGxlZnQgPSAoaW5kZXggJSByZXNvbHV0aW9uKSAqIGJpblNpemU7XG4gICAgICAgICAgICAgICAgdmFyIHRvcCA9IE1hdGguZmxvb3IoaW5kZXggLyByZXNvbHV0aW9uKSAqIGJpblNpemU7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cImhlYXRtYXAtcmluZ1wiIHN0eWxlPVwiJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWZ0OicgKyAobGVmdCArIG9mZnNldCkgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICd0b3A6JyArICh0b3AgKyBvZmZzZXQpICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAnd2lkdGg6JyArIHJhZGl1cyArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2hlaWdodDonICsgcmFkaXVzICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAnXCI+PC9kaXY+JztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBIZWF0bWFwO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEhUTUwgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0hUTUwnKTtcbiAgICB2YXIgc2VudGltZW50ID0gcmVxdWlyZSgnLi4vLi4vc2VudGltZW50L1NlbnRpbWVudCcpO1xuICAgIHZhciBzZW50aW1lbnRGdW5jID0gc2VudGltZW50LmdldENsYXNzRnVuYygtMSwgMSk7XG5cbiAgICB2YXIgVElMRV9TSVpFID0gMjU2O1xuICAgIHZhciBIQUxGX1NJWkUgPSBUSUxFX1NJWkUgLyAyO1xuICAgIHZhciBWRVJUSUNBTF9PRkZTRVQgPSAyNDtcbiAgICB2YXIgSE9SSVpPTlRBTF9PRkZTRVQgPSAxMDtcbiAgICB2YXIgTUFYX05VTV9XT1JEUyA9IDE1O1xuICAgIHZhciBNSU5fRk9OVF9TSVpFID0gMTA7XG4gICAgdmFyIE1BWF9GT05UX1NJWkUgPSAyMDtcbiAgICB2YXIgTlVNX0FUVEVNUFRTID0gMTtcblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGFuIGluaXRpYWwgcG9zaXRpb24sIHJldHVybiBhIG5ldyBwb3NpdGlvbiwgaW5jcmVtZW50YWxseSBzcGlyYWxsZWRcbiAgICAgKiBvdXR3YXJkcy5cbiAgICAgKi9cbiAgICB2YXIgc3BpcmFsUG9zaXRpb24gPSBmdW5jdGlvbihwb3MpIHtcbiAgICAgICAgdmFyIHBpMiA9IDIgKiBNYXRoLlBJO1xuICAgICAgICB2YXIgY2lyYyA9IHBpMiAqIHBvcy5yYWRpdXM7XG4gICAgICAgIHZhciBpbmMgPSAocG9zLmFyY0xlbmd0aCA+IGNpcmMgLyAxMCkgPyBjaXJjIC8gMTAgOiBwb3MuYXJjTGVuZ3RoO1xuICAgICAgICB2YXIgZGEgPSBpbmMgLyBwb3MucmFkaXVzO1xuICAgICAgICB2YXIgbnQgPSAocG9zLnQgKyBkYSk7XG4gICAgICAgIGlmIChudCA+IHBpMikge1xuICAgICAgICAgICAgbnQgPSBudCAlIHBpMjtcbiAgICAgICAgICAgIHBvcy5yYWRpdXMgPSBwb3MucmFkaXVzICsgcG9zLnJhZGl1c0luYztcbiAgICAgICAgfVxuICAgICAgICBwb3MudCA9IG50O1xuICAgICAgICBwb3MueCA9IHBvcy5yYWRpdXMgKiBNYXRoLmNvcyhudCk7XG4gICAgICAgIHBvcy55ID0gcG9zLnJhZGl1cyAqIE1hdGguc2luKG50KTtcbiAgICAgICAgcmV0dXJuIHBvcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogIFJldHVybnMgdHJ1ZSBpZiBib3VuZGluZyBib3ggYSBpbnRlcnNlY3RzIGJvdW5kaW5nIGJveCBiXG4gICAgICovXG4gICAgdmFyIGludGVyc2VjdFRlc3QgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIHJldHVybiAoTWF0aC5hYnMoYS54IC0gYi54KSAqIDIgPCAoYS53aWR0aCArIGIud2lkdGgpKSAmJlxuICAgICAgICAgICAgKE1hdGguYWJzKGEueSAtIGIueSkgKiAyIDwgKGEuaGVpZ2h0ICsgYi5oZWlnaHQpKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogIFJldHVybnMgdHJ1ZSBpZiBib3VuZGluZyBib3ggYSBpcyBub3QgZnVsbHkgY29udGFpbmVkIGluc2lkZSBib3VuZGluZyBib3ggYlxuICAgICAqL1xuICAgIHZhciBvdmVybGFwVGVzdCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIChhLnggKyBhLndpZHRoIC8gMiA+IGIueCArIGIud2lkdGggLyAyIHx8XG4gICAgICAgICAgICBhLnggLSBhLndpZHRoIC8gMiA8IGIueCAtIGIud2lkdGggLyAyIHx8XG4gICAgICAgICAgICBhLnkgKyBhLmhlaWdodCAvIDIgPiBiLnkgKyBiLmhlaWdodCAvIDIgfHxcbiAgICAgICAgICAgIGEueSAtIGEuaGVpZ2h0IC8gMiA8IGIueSAtIGIuaGVpZ2h0IC8gMik7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIGEgd29yZCBpbnRlcnNlY3RzIGFub3RoZXIgd29yZCwgb3IgaXMgbm90IGZ1bGx5IGNvbnRhaW5lZCBpbiB0aGVcbiAgICAgKiB0aWxlIGJvdW5kaW5nIGJveFxuICAgICAqL1xuICAgIHZhciBpbnRlcnNlY3RXb3JkID0gZnVuY3Rpb24ocG9zaXRpb24sIHdvcmQsIGNsb3VkLCBiYikge1xuICAgICAgICB2YXIgYm94ID0ge1xuICAgICAgICAgICAgeDogcG9zaXRpb24ueCxcbiAgICAgICAgICAgIHk6IHBvc2l0aW9uLnksXG4gICAgICAgICAgICBoZWlnaHQ6IHdvcmQuaGVpZ2h0LFxuICAgICAgICAgICAgd2lkdGg6IHdvcmQud2lkdGhcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjbG91ZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGludGVyc2VjdFRlc3QoYm94LCBjbG91ZFtpXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBtYWtlIHN1cmUgaXQgZG9lc24ndCBpbnRlcnNlY3QgdGhlIGJvcmRlcjtcbiAgICAgICAgaWYgKG92ZXJsYXBUZXN0KGJveCwgYmIpKSB7XG4gICAgICAgICAgICAvLyBpZiBpdCBoaXRzIGEgYm9yZGVyLCBpbmNyZW1lbnQgY29sbGlzaW9uIGNvdW50XG4gICAgICAgICAgICAvLyBhbmQgZXh0ZW5kIGFyYyBsZW5ndGhcbiAgICAgICAgICAgIHBvc2l0aW9uLmNvbGxpc2lvbnMrKztcbiAgICAgICAgICAgIHBvc2l0aW9uLmFyY0xlbmd0aCA9IHBvc2l0aW9uLnJhZGl1cztcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdmFyIFdvcmRDbG91ZCA9IEhUTUwuZXh0ZW5kKHtcblxuICAgICAgICBpc1RhcmdldExheWVyOiBmdW5jdGlvbiggZWxlbSApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jb250YWluZXIgJiYgJC5jb250YWlucyh0aGlzLl9jb250YWluZXIsIGVsZW0gKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhclNlbGVjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHQgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdmVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICQoJy53b3JkLWNsb3VkLWxhYmVsJykucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgICAgICB2YXIgd29yZCA9IHRhcmdldC5hdHRyKCdkYXRhLXdvcmQnKTtcbiAgICAgICAgICAgIGlmICh3b3JkKSB7XG4gICAgICAgICAgICAgICAgJCgnLndvcmQtY2xvdWQtbGFiZWxbZGF0YS13b3JkPScgKyB3b3JkICsgJ10nKS5hZGRDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcih0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd3b3JkLWNsb3VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3V0OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgICQoJy53b3JkLWNsb3VkLWxhYmVsJykucmVtb3ZlQ2xhc3MoJ2hvdmVyJyk7XG4gICAgICAgICAgICB2YXIgd29yZCA9IHRhcmdldC5hdHRyKCdkYXRhLXdvcmQnKTtcbiAgICAgICAgICAgIGlmICh3b3JkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW91dCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3V0KHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3dvcmQtY2xvdWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIC8vIHVuLXNlbGVjdCBhbnkgcHJldiBzZWxlY3RlZCB3b3Jkc1xuICAgICAgICAgICAgJCgnLndvcmQtY2xvdWQtbGFiZWwnKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgLy8gZ2V0IHRhcmdldFxuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNUYXJnZXRMYXllcihlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgbGF5ZXIgaXMgbm90IHRoZSB0YXJnZXRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgd29yZCA9IHRhcmdldC5hdHRyKCdkYXRhLXdvcmQnKTtcbiAgICAgICAgICAgIGlmICh3b3JkKSB7XG4gICAgICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLmFkZENsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgICAgICAkKCcud29yZC1jbG91ZC1sYWJlbFtkYXRhLXdvcmQ9JyArIHdvcmQgKyAnXScpLmFkZENsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IHdvcmQ7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5jbGljaykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLmNsaWNrKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3dvcmQtY2xvdWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX21lYXN1cmVXb3JkczogZnVuY3Rpb24od29yZENvdW50cykge1xuICAgICAgICAgICAgLy8gc29ydCB3b3JkcyBieSBmcmVxdWVuY3lcbiAgICAgICAgICAgIHdvcmRDb3VudHMgPSB3b3JkQ291bnRzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBiLmNvdW50IC0gYS5jb3VudDtcbiAgICAgICAgICAgIH0pLnNsaWNlKDAsIE1BWF9OVU1fV09SRFMpO1xuICAgICAgICAgICAgLy8gYnVpbGQgbWVhc3VyZW1lbnQgaHRtbFxuICAgICAgICAgICAgdmFyIGh0bWwgPSAnPGRpdiBzdHlsZT1cImhlaWdodDoyNTZweDsgd2lkdGg6MjU2cHg7XCI+JztcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHdvcmRDb3VudHMuZm9yRWFjaChmdW5jdGlvbih3b3JkKSB7XG4gICAgICAgICAgICAgICAgd29yZC5wZXJjZW50ID0gc2VsZi50cmFuc2Zvcm1WYWx1ZSh3b3JkLmNvdW50KTtcbiAgICAgICAgICAgICAgICB3b3JkLmZvbnRTaXplID0gTUlOX0ZPTlRfU0laRSArIHdvcmQucGVyY2VudCAqIChNQVhfRk9OVF9TSVpFIC0gTUlOX0ZPTlRfU0laRSk7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cIndvcmQtY2xvdWQtbGFiZWxcIiBzdHlsZT1cIicgK1xuICAgICAgICAgICAgICAgICAgICAndmlzaWJpbGl0eTpoaWRkZW47JyArXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemU6JyArIHdvcmQuZm9udFNpemUgKyAncHg7XCI+JyArIHdvcmQudGV4dCArICc8L2Rpdj4nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBodG1sICs9ICc8L2Rpdj4nO1xuICAgICAgICAgICAgLy8gYXBwZW5kIG1lYXN1cmVtZW50c1xuICAgICAgICAgICAgdmFyICR0ZW1wID0gJChodG1sKTtcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoJHRlbXApO1xuICAgICAgICAgICAgJHRlbXAuY2hpbGRyZW4oKS5lYWNoKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgICAgICAgICAgd29yZENvdW50c1tpbmRleF0ud2lkdGggPSB0aGlzLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgICAgIHdvcmRDb3VudHNbaW5kZXhdLmhlaWdodCA9IHRoaXMub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkdGVtcC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHJldHVybiB3b3JkQ291bnRzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jcmVhdGVXb3JkQ2xvdWQ6IGZ1bmN0aW9uKHdvcmRDb3VudHMpIHtcbiAgICAgICAgICAgIHZhciBib3VuZGluZ0JveCA9IHtcbiAgICAgICAgICAgICAgICB3aWR0aDogVElMRV9TSVpFIC0gSE9SSVpPTlRBTF9PRkZTRVQgKiAyLFxuICAgICAgICAgICAgICAgIGhlaWdodDogVElMRV9TSVpFIC0gVkVSVElDQUxfT0ZGU0VUICogMixcbiAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgIHk6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgY2xvdWQgPSBbXTtcbiAgICAgICAgICAgIC8vIHNvcnQgd29yZHMgYnkgZnJlcXVlbmN5XG4gICAgICAgICAgICB3b3JkQ291bnRzID0gdGhpcy5fbWVhc3VyZVdvcmRzKHdvcmRDb3VudHMpO1xuICAgICAgICAgICAgLy8gYXNzZW1ibGUgd29yZCBjbG91ZFxuICAgICAgICAgICAgd29yZENvdW50cy5mb3JFYWNoKGZ1bmN0aW9uKHdvcmRDb3VudCkge1xuICAgICAgICAgICAgICAgIC8vIHN0YXJ0aW5nIHNwaXJhbCBwb3NpdGlvblxuICAgICAgICAgICAgICAgIHZhciBwb3MgPSB7XG4gICAgICAgICAgICAgICAgICAgIHJhZGl1czogMSxcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzSW5jOiA1LFxuICAgICAgICAgICAgICAgICAgICBhcmNMZW5ndGg6IDEwLFxuICAgICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgICAgICB0OiAwLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaXNpb25zOiAwXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyBzcGlyYWwgb3V0d2FyZHMgdG8gZmluZCBwb3NpdGlvblxuICAgICAgICAgICAgICAgIHdoaWxlIChwb3MuY29sbGlzaW9ucyA8IE5VTV9BVFRFTVBUUykge1xuICAgICAgICAgICAgICAgICAgICAvLyBpbmNyZW1lbnQgcG9zaXRpb24gaW4gYSBzcGlyYWxcbiAgICAgICAgICAgICAgICAgICAgcG9zID0gc3BpcmFsUG9zaXRpb24ocG9zKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGVzdCBmb3IgaW50ZXJzZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmICghaW50ZXJzZWN0V29yZChwb3MsIHdvcmRDb3VudCwgY2xvdWQsIGJvdW5kaW5nQm94KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xvdWQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogd29yZENvdW50LnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IHdvcmRDb3VudC5mb250U2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50OiBNYXRoLnJvdW5kKCh3b3JkQ291bnQucGVyY2VudCAqIDEwMCkgLyAxMCkgKiAxMCwgLy8gcm91bmQgdG8gbmVhcmVzdCAxMFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBvcy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBvcy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3b3JkQ291bnQud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB3b3JkQ291bnQuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbnRpbWVudDogd29yZENvdW50LnNlbnRpbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmc6IHdvcmRDb3VudC5hdmdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBjbG91ZDtcbiAgICAgICAgfSxcblxuICAgICAgICBleHRyYWN0RXh0cmVtYTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIHN1bXMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihjb3VudCkge1xuICAgICAgICAgICAgICAgIGlmIChfLmlzTnVtYmVyKGNvdW50KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY291bnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzZW50aW1lbnQuZ2V0VG90YWwoY291bnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1pbjogXy5taW4oc3VtcyksXG4gICAgICAgICAgICAgICAgbWF4OiBfLm1heChzdW1zKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyVGlsZTogZnVuY3Rpb24oY29udGFpbmVyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIWRhdGEgfHwgXy5pc0VtcHR5KGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGhpZ2hsaWdodCA9IHRoaXMuaGlnaGxpZ2h0O1xuICAgICAgICAgICAgdmFyIHdvcmRDb3VudHMgPSBfLm1hcChkYXRhLCBmdW5jdGlvbihjb3VudCwga2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKF8uaXNOdW1iZXIoY291bnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogY291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBrZXlcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRvdGFsID0gc2VudGltZW50LmdldFRvdGFsKGNvdW50KTtcbiAgICAgICAgICAgICAgICB2YXIgYXZnID0gc2VudGltZW50LmdldEF2Zyhjb3VudCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRvdGFsLFxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBrZXksXG4gICAgICAgICAgICAgICAgICAgIGF2ZzogYXZnLFxuICAgICAgICAgICAgICAgICAgICBzZW50aW1lbnQ6IHNlbnRpbWVudEZ1bmMoYXZnKVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGV4aXQgZWFybHkgaWYgbm8gd29yZHNcbiAgICAgICAgICAgIGlmICh3b3JkQ291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGdlbmVyZWF0ZSB0aGUgY2xvdWRcbiAgICAgICAgICAgIHZhciBjbG91ZCA9IHRoaXMuX2NyZWF0ZVdvcmRDbG91ZCh3b3JkQ291bnRzKTtcbiAgICAgICAgICAgIC8vIGJ1aWxkIGh0bWwgZWxlbWVudHNcbiAgICAgICAgICAgIHZhciBodG1sID0gJyc7XG4gICAgICAgICAgICBjbG91ZC5mb3JFYWNoKGZ1bmN0aW9uKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgY2xhc3Nlc1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc05hbWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAnd29yZC1jbG91ZC1sYWJlbCcsXG4gICAgICAgICAgICAgICAgICAgICd3b3JkLWNsb3VkLWxhYmVsLScgKyB3b3JkLnBlcmNlbnQsXG4gICAgICAgICAgICAgICAgICAgIHdvcmQudGV4dCA9PT0gaGlnaGxpZ2h0ID8gJ2hpZ2hsaWdodCcgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgd29yZC5zZW50aW1lbnQgPyB3b3JkLnNlbnRpbWVudCA6ICcnXG4gICAgICAgICAgICAgICAgXS5qb2luKCcgJyk7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIHN0eWxlc1xuICAgICAgICAgICAgICAgIHZhciBzdHlsZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemU6JyArIHdvcmQuZm9udFNpemUgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICAnbGVmdDonICsgKEhBTEZfU0laRSArIHdvcmQueCAtICh3b3JkLndpZHRoIC8gMikpICsgJ3B4JyxcbiAgICAgICAgICAgICAgICAgICAgJ3RvcDonICsgKEhBTEZfU0laRSArIHdvcmQueSAtICh3b3JkLmhlaWdodCAvIDIpKSArICdweCcsXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aDonICsgd29yZC53aWR0aCArICdweCcsXG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQ6JyArIHdvcmQuaGVpZ2h0ICsgJ3B4JyxcbiAgICAgICAgICAgICAgICBdLmpvaW4oJzsnKTtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgaHRtbCBmb3IgZW50cnlcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8ZGl2IGNsYXNzPVwiJyArIGNsYXNzTmFtZXMgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgJ3N0eWxlPVwiJyArIHN0eWxlcyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS1zZW50aW1lbnQ9XCInICsgd29yZC5hdmcgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtd29yZD1cIicgKyB3b3JkLnRleHQgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgIHdvcmQudGV4dCArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFdvcmRDbG91ZDtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBIVE1MID0gcmVxdWlyZSgnLi4vLi4vY29yZS9IVE1MJyk7XG4gICAgdmFyIHNlbnRpbWVudCA9IHJlcXVpcmUoJy4uLy4uL3NlbnRpbWVudC9TZW50aW1lbnQnKTtcbiAgICB2YXIgc2VudGltZW50RnVuYyA9IHNlbnRpbWVudC5nZXRDbGFzc0Z1bmMoLTEsIDEpO1xuXG4gICAgdmFyIFRJTEVfU0laRSA9IDI1NjtcbiAgICB2YXIgSEFMRl9TSVpFID0gVElMRV9TSVpFIC8gMjtcbiAgICB2YXIgTUFYX05VTV9XT1JEUyA9IDg7XG4gICAgdmFyIE1JTl9GT05UX1NJWkUgPSAxNjtcbiAgICB2YXIgTUFYX0ZPTlRfU0laRSA9IDIyO1xuXG4gICAgdmFyIGlzU2luZ2xlVmFsdWUgPSBmdW5jdGlvbihjb3VudCkge1xuICAgICAgICAvLyBzaW5nbGUgdmFsdWVzIGFyZSBuZXZlciBudWxsLCBhbmQgYWx3YXlzIG51bWJlcnNcbiAgICAgICAgcmV0dXJuIGNvdW50ICE9PSBudWxsICYmIF8uaXNOdW1iZXIoY291bnQpO1xuICAgIH07XG5cbiAgICB2YXIgZXh0cmFjdENvdW50ID0gZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgaWYgKGlzU2luZ2xlVmFsdWUoY291bnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gY291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbnRpbWVudC5nZXRUb3RhbChjb3VudCk7XG4gICAgfTtcblxuICAgIHZhciBleHRyYWN0U2VudGltZW50Q2xhc3MgPSBmdW5jdGlvbihhdmcpIHtcbiAgICAgICAgaWYgKGF2ZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VudGltZW50RnVuYyhhdmcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9O1xuXG4gICAgdmFyIGV4dHJhY3RGcmVxdWVuY3kgPSBmdW5jdGlvbihjb3VudCkge1xuICAgICAgICBpZiAoaXNTaW5nbGVWYWx1ZShjb3VudCkpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY291bnQ6IGNvdW50XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb3VudDogc2VudGltZW50LmdldFRvdGFsKGNvdW50KSxcbiAgICAgICAgICAgIGF2Zzogc2VudGltZW50LmdldEF2Zyhjb3VudClcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIGV4dHJhY3RBdmcgPSBmdW5jdGlvbihmcmVxdWVuY2llcykge1xuICAgICAgICBpZiAoZnJlcXVlbmNpZXNbMF0uYXZnID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3VtID0gXy5zdW1CeShmcmVxdWVuY2llcywgZnVuY3Rpb24oZnJlcXVlbmN5KSB7XG4gICAgICAgICAgICByZXR1cm4gZnJlcXVlbmN5LmF2ZztcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzdW0gLyBmcmVxdWVuY2llcy5sZW5ndGg7XG4gICAgfTtcblxuICAgIHZhciBleHRyYWN0VmFsdWVzID0gZnVuY3Rpb24oZGF0YSwga2V5KSB7XG4gICAgICAgIHZhciBmcmVxdWVuY2llcyA9IF8ubWFwKGRhdGEsIGV4dHJhY3RGcmVxdWVuY3kpO1xuICAgICAgICB2YXIgYXZnID0gZXh0cmFjdEF2ZyhmcmVxdWVuY2llcyk7XG4gICAgICAgIHZhciBtYXggPSBfLm1heEJ5KGZyZXF1ZW5jaWVzLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwuY291bnQ7XG4gICAgICAgIH0pLmNvdW50O1xuICAgICAgICB2YXIgdG90YWwgPSBfLnN1bUJ5KGZyZXF1ZW5jaWVzLCBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwuY291bnQ7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9waWM6IGtleSxcbiAgICAgICAgICAgIGZyZXF1ZW5jaWVzOiBmcmVxdWVuY2llcyxcbiAgICAgICAgICAgIG1heDogbWF4LFxuICAgICAgICAgICAgdG90YWw6IHRvdGFsLFxuICAgICAgICAgICAgYXZnOiBhdmdcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIFdvcmRIaXN0b2dyYW0gPSBIVE1MLmV4dGVuZCh7XG5cbiAgICAgICAgaXNUYXJnZXRMYXllcjogZnVuY3Rpb24oIGVsZW0gKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyICYmICQuY29udGFpbnModGhpcy5fY29udGFpbmVyLCBlbGVtICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYXJTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3ZlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICAkKCcud29yZC1oaXN0b2dyYW0tZW50cnknKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAkKCcud29yZC1oaXN0b2dyYW0tZW50cnlbZGF0YS13b3JkPScgKyB3b3JkICsgJ10nKS5hZGRDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcih0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd3b3JkLWhpc3RvZ3JhbScsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZU91dDogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICAkKCcud29yZC1oaXN0b2dyYW0tZW50cnknKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdXQodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd29yZC1oaXN0b2dyYW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIC8vIHVuLXNlbGVjdCBhbmQgcHJldiBzZWxlY3RlZCBoaXN0b2dyYW1cbiAgICAgICAgICAgICQoJy53b3JkLWhpc3RvZ3JhbS1lbnRyeScpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICAvLyBnZXQgdGFyZ2V0XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1RhcmdldExheWVyKGUub3JpZ2luYWxFdmVudC50YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBsYXllciBpcyBub3QgdGhlIHRhcmdldFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgICAgICQoJy53b3JkLWhpc3RvZ3JhbS1lbnRyeVtkYXRhLXdvcmQ9JyArIHdvcmQgKyAnXScpLmFkZENsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IHdvcmQ7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5jbGljaykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLmNsaWNrKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3dvcmQtaGlzdG9ncmFtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGV4dHJhY3RFeHRyZW1hOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgc3VtcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNvdW50cykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnN1bUJ5KGNvdW50cywgZXh0cmFjdENvdW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtaW46IF8ubWluKHN1bXMpLFxuICAgICAgICAgICAgICAgIG1heDogXy5tYXgoc3VtcyksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGNvbnRhaW5lciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhIHx8IF8uaXNFbXB0eShkYXRhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBoaWdobGlnaHQgPSB0aGlzLmhpZ2hsaWdodDtcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgb2JqZWN0IHRvIGFycmF5XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gXy5tYXAoZGF0YSwgZXh0cmFjdFZhbHVlcykuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBnZXQgbnVtYmVyIG9mIGVudHJpZXNcbiAgICAgICAgICAgIHZhciBudW1FbnRyaWVzID0gTWF0aC5taW4odmFsdWVzLmxlbmd0aCwgTUFYX05VTV9XT1JEUyk7XG4gICAgICAgICAgICB2YXIgJGh0bWwgPSAkKCc8ZGl2IGNsYXNzPVwid29yZC1oaXN0b2dyYW1zXCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9jaztcIj48L2Rpdj4nKTtcbiAgICAgICAgICAgIHZhciB0b3RhbEhlaWdodCA9IDA7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YWx1ZXMuc2xpY2UoMCwgbnVtRW50cmllcykuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHZhciB0b3BpYyA9IHZhbHVlLnRvcGljO1xuICAgICAgICAgICAgICAgIHZhciBmcmVxdWVuY2llcyA9IHZhbHVlLmZyZXF1ZW5jaWVzO1xuICAgICAgICAgICAgICAgIHZhciBtYXggPSB2YWx1ZS5tYXg7XG4gICAgICAgICAgICAgICAgdmFyIHRvdGFsID0gdmFsdWUudG90YWw7XG4gICAgICAgICAgICAgICAgdmFyIGF2ZyA9IHZhbHVlLmF2ZztcbiAgICAgICAgICAgICAgICB2YXIgc2VudGltZW50Q2xhc3MgPSBleHRyYWN0U2VudGltZW50Q2xhc3MoYXZnKTtcbiAgICAgICAgICAgICAgICB2YXIgaGlnaGxpZ2h0Q2xhc3MgPSAodG9waWMgPT09IGhpZ2hsaWdodCkgPyAnaGlnaGxpZ2h0JyA6ICcnO1xuICAgICAgICAgICAgICAgIC8vIHNjYWxlIHRoZSBoZWlnaHQgYmFzZWQgb24gbGV2ZWwgbWluIC8gbWF4XG4gICAgICAgICAgICAgICAgdmFyIHBlcmNlbnQgPSBzZWxmLnRyYW5zZm9ybVZhbHVlKHRvdGFsKTtcbiAgICAgICAgICAgICAgICB2YXIgcGVyY2VudExhYmVsID0gTWF0aC5yb3VuZCgocGVyY2VudCAqIDEwMCkgLyAxMCkgKiAxMDtcbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gTUlOX0ZPTlRfU0laRSArIHBlcmNlbnQgKiAoTUFYX0ZPTlRfU0laRSAtIE1JTl9GT05UX1NJWkUpO1xuICAgICAgICAgICAgICAgIHRvdGFsSGVpZ2h0ICs9IGhlaWdodDtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgY29udGFpbmVyICdlbnRyeScgZm9yIGNoYXJ0IGFuZCBoYXNodGFnXG4gICAgICAgICAgICAgICAgdmFyICRlbnRyeSA9ICQoJzxkaXYgY2xhc3M9XCJ3b3JkLWhpc3RvZ3JhbS1lbnRyeSAnICsgaGlnaGxpZ2h0Q2xhc3MgKyAnXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLXNlbnRpbWVudD1cIicgKyBhdmcgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtd29yZD1cIicgKyB0b3BpYyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnc3R5bGU9XCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2hlaWdodDonICsgaGVpZ2h0ICsgJ3B4O1wiPjwvZGl2PicpO1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBjaGFydFxuICAgICAgICAgICAgICAgIHZhciAkY2hhcnQgPSAkKCc8ZGl2IGNsYXNzPVwid29yZC1oaXN0b2dyYW0tbGVmdFwiJyArXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLXNlbnRpbWVudD1cIicgKyBhdmcgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtd29yZD1cIicgKyB0b3BpYyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnPjwvZGl2PicpO1xuICAgICAgICAgICAgICAgIHZhciBiYXJXaWR0aCA9ICdjYWxjKCcgKyAoMTAwIC8gZnJlcXVlbmNpZXMubGVuZ3RoKSArICclKSc7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGJhcnNcbiAgICAgICAgICAgICAgICBmcmVxdWVuY2llcy5mb3JFYWNoKGZ1bmN0aW9uKGZyZXF1ZW5jeSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY291bnQgPSBmcmVxdWVuY3kuY291bnQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhdmcgPSBmcmVxdWVuY3kuYXZnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VudGltZW50Q2xhc3MgPSBleHRyYWN0U2VudGltZW50Q2xhc3MoYXZnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBwZXJjZW50IHJlbGF0aXZlIHRvIHRoZSBoaWdoZXN0IGNvdW50IGluIHRoZSB0aWxlXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWxhdGl2ZVBlcmNlbnQgPSAobWF4ICE9PSAwKSA/IChjb3VudCAvIG1heCkgKiAxMDAgOiAwO1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIGludmlzaWJsZSBpZiB6ZXJvIGNvdW50XG4gICAgICAgICAgICAgICAgICAgIHZhciB2aXNpYmlsaXR5ID0gcmVsYXRpdmVQZXJjZW50ID09PSAwID8gJ2hpZGRlbicgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBzdHlsZSBjbGFzcyBvZiB0aGUgYmFyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwZXJjZW50TGFiZWwgPSBNYXRoLnJvdW5kKHJlbGF0aXZlUGVyY2VudCAvIDEwKSAqIDEwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFyQ2xhc3NlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICd3b3JkLWhpc3RvZ3JhbS1iYXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtaGlzdG9ncmFtLWJhci0nICsgcGVyY2VudExhYmVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VudGltZW50Q2xhc3MgKyAnLWZpbGwnXG4gICAgICAgICAgICAgICAgICAgIF0uam9pbignICcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFySGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmFyVG9wO1xuICAgICAgICAgICAgICAgICAgICAvLyBlbnN1cmUgdGhlcmUgaXMgYXQgbGVhc3QgYSBzaW5nbGUgcGl4ZWwgb2YgY29sb3JcbiAgICAgICAgICAgICAgICAgICAgaWYgKChyZWxhdGl2ZVBlcmNlbnQgLyAxMDApICogaGVpZ2h0IDwgMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFySGVpZ2h0ID0gJzNweCc7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJUb3AgPSAnY2FsYygxMDAlIC0gM3B4KSc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJIZWlnaHQgPSByZWxhdGl2ZVBlcmNlbnQgKyAnJSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJUb3AgPSAoMTAwIC0gcmVsYXRpdmVQZXJjZW50KSArICclJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYmFyXG4gICAgICAgICAgICAgICAgICAgICRjaGFydC5hcHBlbmQoJzxkaXYgY2xhc3M9XCInICsgYmFyQ2xhc3NlcyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEtd29yZD1cIicgKyB0b3BpYyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3N0eWxlPVwiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAndmlzaWJpbGl0eTonICsgdmlzaWJpbGl0eSArICc7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnd2lkdGg6JyArIGJhcldpZHRoICsgJzsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICdoZWlnaHQ6JyArIGJhckhlaWdodCArICc7JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAndG9wOicgKyBiYXJUb3AgKyAnO1wiPjwvZGl2PicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICRlbnRyeS5hcHBlbmQoJGNoYXJ0KTtcbiAgICAgICAgICAgICAgICB2YXIgdG9waWNDbGFzc2VzID0gW1xuICAgICAgICAgICAgICAgICAgICAnd29yZC1oaXN0b2dyYW0tbGFiZWwnLFxuICAgICAgICAgICAgICAgICAgICAnd29yZC1oaXN0b2dyYW0tbGFiZWwtJyArIHBlcmNlbnRMYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgc2VudGltZW50Q2xhc3NcbiAgICAgICAgICAgICAgICBdLmpvaW4oJyAnKTtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgdGFnIGxhYmVsXG4gICAgICAgICAgICAgICAgdmFyICR0b3BpYyA9ICQoJzxkaXYgY2xhc3M9XCJ3b3JkLWhpc3RvZ3JhbS1yaWdodFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIicgKyB0b3BpY0NsYXNzZXMgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtc2VudGltZW50PVwiJyArIGF2ZyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS13b3JkPVwiJyArIHRvcGljICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgK1xuICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplOicgKyBoZWlnaHQgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICdsaW5lLWhlaWdodDonICsgaGVpZ2h0ICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0OicgKyBoZWlnaHQgKyAncHhcIj4nICsgdG9waWMgKyAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nKTtcbiAgICAgICAgICAgICAgICAkZW50cnkuYXBwZW5kKCR0b3BpYyk7XG4gICAgICAgICAgICAgICAgJGh0bWwuYXBwZW5kKCRlbnRyeSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICRodG1sLmNzcygndG9wJywgSEFMRl9TSVpFIC0gKHRvdGFsSGVpZ2h0IC8gMikpO1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9ICRodG1sWzBdLm91dGVySFRNTDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBXb3JkSGlzdG9ncmFtO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICAgICAgcmVuZGVyVGlsZTogZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgZWxlbS5pbm5lckh0bWwgPSAnPGRpdiBjbGFzcz1cImJsaW5raW5nIGJsaW5raW5nLXRpbGVcIiBzdHlsZT1cImFuaW1hdGlvbi1kZWxheTonICsgLShNYXRoLnJhbmRvbSgpICogMTIwMCkgKyAnbXM7XCI+PC9kaXY+JztcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBERUxBWSA9IDEyMDA7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICB2YXIgZGVsYXkgPSAtKE1hdGgucmFuZG9tKCkgKiBERUxBWSkgKyAnbXMnO1xuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPVxuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidmVydGljYWwtY2VudGVyZWQtYm94IGJsaW5raW5nXCIgc3R5bGU9XCJhbmltYXRpb24tZGVsYXk6JyArIGRlbGF5ICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibG9hZGVyLWNpcmNsZVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsb2FkZXItbGluZS1tYXNrXCIgc3R5bGU9XCJhbmltYXRpb24tZGVsYXk6JyArIGRlbGF5ICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibG9hZGVyLWxpbmVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIERFTEFZID0gMTIwMDtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgIHZhciBkZWxheSA9IC0oTWF0aC5yYW5kb20oKSAqIERFTEFZKSArICdtcyc7XG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9XG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ2ZXJ0aWNhbC1jZW50ZXJlZC1ib3hcIiBzdHlsZT1cImFuaW1hdGlvbi1kZWxheTonICsgZGVsYXkgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udGVudFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsb2FkZXItY2lyY2xlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImxvYWRlci1saW5lLW1hc2tcIiBzdHlsZT1cImFuaW1hdGlvbi1kZWxheTonICsgZGVsYXkgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsb2FkZXItbGluZVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2Pic7XG4gICAgICAgIH1cblxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgV2ViR0wgPSByZXF1aXJlKCcuLi8uLi9jb3JlL1dlYkdMJyk7XG5cbiAgICAvLyBUT0RPOlxuICAgIC8vICAgICAtIHVwZGF0ZSB0byBwcmVjZXB0dWFsIGNvbG9yIHJhbXBzIChsYXllciBpcyBjdXJyZW50bHkgYnJva2VuKVxuXG4gICAgdmFyIEhlYXRtYXAgPSBXZWJHTC5leHRlbmQoe1xuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHNoYWRlcnM6IHtcbiAgICAgICAgICAgICAgICB2ZXJ0OiAnLi4vLi4vc2hhZGVycy9oZWF0bWFwLnZlcnQnLFxuICAgICAgICAgICAgICAgIGZyYWc6ICcuLi8uLi9zaGFkZXJzL2hlYXRtYXAuZnJhZycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYmVmb3JlRHJhdzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcmFtcCA9IHRoaXMuZ2V0Q29sb3JSYW1wKCk7XG4gICAgICAgICAgICB2YXIgY29sb3IgPSBbMCwgMCwgMCwgMF07XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIuc2V0VW5pZm9ybSgndU1pbicsIHRoaXMuZ2V0RXh0cmVtYSgpLm1pbik7XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIuc2V0VW5pZm9ybSgndU1heCcsIHRoaXMuZ2V0RXh0cmVtYSgpLm1heCk7XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIuc2V0VW5pZm9ybSgndUNvbG9yUmFtcEZyb20nLCByYW1wKDAuMCwgY29sb3IpKTtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5zZXRVbmlmb3JtKCd1Q29sb3JSYW1wVG8nLCByYW1wKDEuMCwgY29sb3IpKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhlYXRtYXA7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgUmVxdWVzdG9yID0gcmVxdWlyZSgnLi9SZXF1ZXN0b3InKTtcblxuICAgIGZ1bmN0aW9uIE1ldGFSZXF1ZXN0b3IoKSB7XG4gICAgICAgIFJlcXVlc3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIE1ldGFSZXF1ZXN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZXF1ZXN0b3IucHJvdG90eXBlKTtcblxuICAgIE1ldGFSZXF1ZXN0b3IucHJvdG90eXBlLmdldEhhc2ggPSBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgcmV0dXJuIHJlcS50eXBlICsgJy0nICtcbiAgICAgICAgICAgIHJlcS5pbmRleCArICctJyArXG4gICAgICAgICAgICByZXEuc3RvcmU7XG4gICAgfTtcblxuICAgIE1ldGFSZXF1ZXN0b3IucHJvdG90eXBlLmdldFVSTCA9IGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gJ21ldGEvJyArXG4gICAgICAgICAgICByZXMudHlwZSArICcvJyArXG4gICAgICAgICAgICByZXMuZW5kcG9pbnQgKyAnLycgK1xuICAgICAgICAgICAgcmVzLmluZGV4ICsgJy8nICtcbiAgICAgICAgICAgIHJlcy5zdG9yZTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBNZXRhUmVxdWVzdG9yO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHJldHJ5SW50ZXJ2YWwgPSA1MDAwO1xuXG4gICAgZnVuY3Rpb24gZ2V0SG9zdCgpIHtcbiAgICAgICAgdmFyIGxvYyA9IHdpbmRvdy5sb2NhdGlvbjtcbiAgICAgICAgdmFyIG5ld191cmk7XG4gICAgICAgIGlmIChsb2MucHJvdG9jb2wgPT09ICdodHRwczonKSB7XG4gICAgICAgICAgICBuZXdfdXJpID0gJ3dzczonO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmV3X3VyaSA9ICd3czonO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXdfdXJpICsgJy8vJyArIGxvYy5ob3N0ICsgbG9jLnBhdGhuYW1lO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVzdGFibGlzaENvbm5lY3Rpb24ocmVxdWVzdG9yLCBjYWxsYmFjaykge1xuICAgICAgICByZXF1ZXN0b3Iuc29ja2V0ID0gbmV3IFdlYlNvY2tldChnZXRIb3N0KCkgKyByZXF1ZXN0b3IudXJsKTtcbiAgICAgICAgLy8gb24gb3BlblxuICAgICAgICByZXF1ZXN0b3Iuc29ja2V0Lm9ub3BlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVxdWVzdG9yLmlzT3BlbiA9IHRydWU7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnV2Vic29ja2V0IGNvbm5lY3Rpb24gZXN0YWJsaXNoZWQnKTtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIG9uIG1lc3NhZ2VcbiAgICAgICAgcmVxdWVzdG9yLnNvY2tldC5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIHJlcyA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IHJlcXVlc3Rvci5nZXRIYXNoKHJlcyk7XG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHJlcXVlc3Rvci5yZXF1ZXN0c1toYXNoXTtcbiAgICAgICAgICAgIGRlbGV0ZSByZXF1ZXN0b3IucmVxdWVzdHNbaGFzaF07XG4gICAgICAgICAgICBpZiAocmVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnJlc29sdmUocmVxdWVzdG9yLmdldFVSTChyZXMpLCByZXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0LnJlamVjdChyZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBvbiBjbG9zZVxuICAgICAgICByZXF1ZXN0b3Iuc29ja2V0Lm9uY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGxvZyBjbG9zZSBvbmx5IGlmIGNvbm5lY3Rpb24gd2FzIGV2ZXIgb3BlblxuICAgICAgICAgICAgaWYgKHJlcXVlc3Rvci5pc09wZW4pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1dlYnNvY2tldCBjb25uZWN0aW9uIGNsb3NlZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVxdWVzdG9yLnNvY2tldCA9IG51bGw7XG4gICAgICAgICAgICByZXF1ZXN0b3IuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgICAgICAvLyByZWplY3QgYWxsIHBlbmRpbmcgcmVxdWVzdHNcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHJlcXVlc3Rvci5yZXF1ZXN0cykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgICAgICByZXF1ZXN0b3IucmVxdWVzdHNba2V5XS5yZWplY3QoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gY2xlYXIgcmVxdWVzdCBtYXBcbiAgICAgICAgICAgIHJlcXVlc3Rvci5yZXF1ZXN0cyA9IHt9O1xuICAgICAgICAgICAgLy8gYXR0ZW1wdCB0byByZS1lc3RhYmxpc2ggY29ubmVjdGlvblxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBlc3RhYmxpc2hDb25uZWN0aW9uKHJlcXVlc3RvciwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG9uY2UgY29ubmVjdGlvbiBpcyByZS1lc3RhYmxpc2hlZCwgc2VuZCBwZW5kaW5nIHJlcXVlc3RzXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3Rvci5wZW5kaW5nLmZvckVhY2goZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0b3IuZ2V0KHJlcSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0b3IucGVuZGluZyA9IFtdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgcmV0cnlJbnRlcnZhbCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gUmVxdWVzdG9yKHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG4gICAgICAgIHRoaXMucmVxdWVzdHMgPSB7fTtcbiAgICAgICAgdGhpcy5wZW5kaW5nID0gW107XG4gICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIGVzdGFibGlzaENvbm5lY3Rpb24odGhpcywgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIFJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0SGFzaCA9IGZ1bmN0aW9uKCAvKnJlcSovICkge1xuICAgICAgICAvLyBvdmVycmlkZVxuICAgIH07XG5cbiAgICBSZXF1ZXN0b3IucHJvdG90eXBlLmdldFVSTCA9IGZ1bmN0aW9uKCAvKnJlcyovICkge1xuICAgICAgICAvLyBvdmVycmlkZVxuICAgIH07XG5cbiAgICBSZXF1ZXN0b3IucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICAvLyBpZiBubyBjb25uZWN0aW9uLCBhZGQgcmVxdWVzdCB0byBwZW5kaW5nIHF1ZXVlXG4gICAgICAgICAgICB0aGlzLnBlbmRpbmcucHVzaChyZXEpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBoYXNoID0gdGhpcy5nZXRIYXNoKHJlcSk7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gdGhpcy5yZXF1ZXN0c1toYXNoXTtcbiAgICAgICAgaWYgKHJlcXVlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0LnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXF1ZXN0ID0gdGhpcy5yZXF1ZXN0c1toYXNoXSA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeShyZXEpKTtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3QucHJvbWlzZSgpO1xuICAgIH07XG5cbiAgICBSZXF1ZXN0b3IucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc29ja2V0Lm9uY2xvc2UgPSBudWxsO1xuICAgICAgICB0aGlzLnNvY2tldC5jbG9zZSgpO1xuICAgICAgICB0aGlzLnNvY2tldCA9IG51bGw7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gUmVxdWVzdG9yO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHN0cmluZ2lmeSA9IHJlcXVpcmUoJ2pzb24tc3RhYmxlLXN0cmluZ2lmeScpO1xuICAgIHZhciBSZXF1ZXN0b3IgPSByZXF1aXJlKCcuL1JlcXVlc3RvcicpO1xuXG4gICAgZnVuY3Rpb24gcHJ1bmVFbXB0eShvYmopIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHBydW5lKGN1cnJlbnQpIHtcbiAgICAgICAgICAgIF8uZm9yT3duKGN1cnJlbnQsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgaWYgKF8uaXNVbmRlZmluZWQodmFsdWUpIHx8IF8uaXNOdWxsKHZhbHVlKSB8fCBfLmlzTmFOKHZhbHVlKSB8fFxuICAgICAgICAgICAgICAgIChfLmlzU3RyaW5nKHZhbHVlKSAmJiBfLmlzRW1wdHkodmFsdWUpKSB8fFxuICAgICAgICAgICAgICAgIChfLmlzT2JqZWN0KHZhbHVlKSAmJiBfLmlzRW1wdHkocHJ1bmUodmFsdWUpKSkpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgY3VycmVudFtrZXldO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBhbnkgbGVmdG92ZXIgdW5kZWZpbmVkIHZhbHVlcyBmcm9tIHRoZSBkZWxldGVcbiAgICAgICAgICAgIC8vIG9wZXJhdGlvbiBvbiBhbiBhcnJheVxuICAgICAgICAgICAgaWYgKF8uaXNBcnJheShjdXJyZW50KSkge1xuICAgICAgICAgICAgICAgIF8ucHVsbChjdXJyZW50LCB1bmRlZmluZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnQ7XG4gICAgICAgIH0oXy5jbG9uZURlZXAob2JqKSk7IC8vIGRvIG5vdCBtb2RpZnkgdGhlIG9yaWdpbmFsIG9iamVjdCwgY3JlYXRlIGEgY2xvbmUgaW5zdGVhZFxuICAgIH1cblxuICAgIGZ1bmN0aW9uIFRpbGVSZXF1ZXN0b3IoKSB7XG4gICAgICAgIFJlcXVlc3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIFRpbGVSZXF1ZXN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZXF1ZXN0b3IucHJvdG90eXBlKTtcblxuICAgIFRpbGVSZXF1ZXN0b3IucHJvdG90eXBlLmdldEhhc2ggPSBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGNvb3JkID0gcmVxLmNvb3JkO1xuICAgICAgICB2YXIgaGFzaCA9IHN0cmluZ2lmeShwcnVuZUVtcHR5KHJlcS5wYXJhbXMpKTtcbiAgICAgICAgcmV0dXJuIHJlcS50eXBlICsgJy0nICtcbiAgICAgICAgICAgIHJlcS5pbmRleCArICctJyArXG4gICAgICAgICAgICByZXEuc3RvcmUgKyAnLScgK1xuICAgICAgICAgICAgY29vcmQueCArICctJyArXG4gICAgICAgICAgICBjb29yZC55ICsgJy0nICtcbiAgICAgICAgICAgIGNvb3JkLnogKyAnLScgK1xuICAgICAgICAgICAgaGFzaDtcbiAgICB9O1xuXG4gICAgVGlsZVJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0VVJMID0gZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHZhciBjb29yZCA9IHJlcy5jb29yZDtcbiAgICAgICAgcmV0dXJuICd0aWxlLycgK1xuICAgICAgICAgICAgcmVzLnR5cGUgKyAnLycgK1xuICAgICAgICAgICAgcmVzLmluZGV4ICsgJy8nICtcbiAgICAgICAgICAgIHJlcy5zdG9yZSArICcvJyArXG4gICAgICAgICAgICBjb29yZC56ICsgJy8nICtcbiAgICAgICAgICAgIGNvb3JkLnggKyAnLycgK1xuICAgICAgICAgICAgY29vcmQueTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUaWxlUmVxdWVzdG9yO1xuXG59KCkpO1xuIl19

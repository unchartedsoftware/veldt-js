(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.prism = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function () {

    'use strict';

    var Texture2D = require('./Texture2D');
    var ImageLoader = require('../util/ImageLoader');
    var Util = require('../util/Util');
    var MAG_FILTERS = {
        NEAREST: true,
        LINEAR: true
    };
    var MIN_FILTERS = {
        NEAREST: true,
        LINEAR: true,
        NEAREST_MIPMAP_NEAREST: true,
        LINEAR_MIPMAP_NEAREST: true,
        NEAREST_MIPMAP_LINEAR: true,
        LINEAR_MIPMAP_LINEAR: true
    };
    var WRAP_MODES = {
        REPEAT: true,
        MIRRORED_REPEAT: true,
        CLAMP_TO_EDGE: true
    };
    var TYPES = {
        UNSIGNED_BYTE: true,
        FLOAT: true
    };
    var FORMATS = {
        RGB: true,
        RGBA: true
    };

    /**
     * The default type for color textures.
     */
    var DEFAULT_TYPE = 'UNSIGNED_BYTE';

    /**
     * The default format for color textures.
     */
    var DEFAULT_FORMAT = 'RGBA';

    /**
     * The default wrap mode for color textures.
     */
    var DEFAULT_WRAP = 'REPEAT';

    /**
     * The default min / mag filter for color textures.
     */
    var DEFAULT_FILTER = 'LINEAR';

    /**
     * The default for whether alpha premultiplying is enabled.
     */
    var DEFAULT_PREMULTIPLY_ALPHA = true;

    /**
     * The default for whether mipmapping is enabled.
     */
    var DEFAULT_MIPMAP = true;

    /**
     * The default for whether invert-y is enabled.
     */
    var DEFAULT_INVERT_Y = true;

    /**
     * Instantiates a ColorTexture2D object.
     * @class ColorTexture2D
     * @classdesc A texture class to represent a 2D color texture.
     * @augments Texture2D
     *
     * @param {Object} spec - The specification arguments.
     * @param {ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} spec.image - The HTMLImageElement to buffer.
     * @param {String} spec.url - The HTMLImageElement URL to load and buffer.
     * @param {Uint8Array|Float32Array} spec.src - The data to buffer.
     * @param {number} width - The width of the texture.
     * @param {number} height - The height of the texture.
     * @param {String} spec.wrap - The wrapping type over both S and T dimension.
     * @param {String} spec.wrapS - The wrapping type over the S dimension.
     * @param {String} spec.wrapT - The wrapping type over the T dimension.
     * @param {String} spec.filter - The min / mag filter used during scaling.
     * @param {String} spec.minFilter - The minification filter used during scaling.
     * @param {String} spec.magFilter - The magnification filter used during scaling.
     * @param {bool} spec.mipMap - Whether or not mip-mapping is enabled.
     * @param {bool} spec.invertY - Whether or not invert-y is enabled.
     * @param {bool} spec.preMultiplyAlpha - Whether or not alpha premultiplying is enabled.
     * @param {String} spec.format - The texture pixel format.
     * @param {String} spec.type - The texture pixel component type.
     * @param {Function} callback - The callback to be executed if the data is loaded asynchronously via a URL.
     */
    function ColorTexture2D( spec, callback ) {
        spec = spec || {};
        // get specific params
        spec.wrapS = spec.wrapS || spec.wrap;
        spec.wrapT = spec.wrapT || spec.wrap;
        spec.minFilter = spec.minFilter || spec.filter;
        spec.magFilter = spec.magFilter || spec.filter;
        // set texture params
        spec.wrapS = WRAP_MODES[ spec.wrapS ] ? spec.wrapS : DEFAULT_WRAP;
        spec.wrapT = WRAP_MODES[ spec.wrapT ] ? spec.wrapT : DEFAULT_WRAP;
        spec.minFilter = MIN_FILTERS[ spec.minFilter ] ? spec.minFilter : DEFAULT_FILTER;
        spec.magFilter = MAG_FILTERS[ spec.magFilter ] ? spec.magFilter : DEFAULT_FILTER;
        // set other properties
        spec.mipMap = spec.mipMap !== undefined ? spec.mipMap : DEFAULT_MIPMAP;
        spec.invertY = spec.invertY !== undefined ? spec.invertY : DEFAULT_INVERT_Y;
        spec.preMultiplyAlpha = spec.preMultiplyAlpha !== undefined ? spec.preMultiplyAlpha : DEFAULT_PREMULTIPLY_ALPHA;
        // set format
        spec.format = FORMATS[ spec.format ] ? spec.format : DEFAULT_FORMAT;
        // buffer the texture based on argument type
        if ( typeof spec.src === 'string' ) {
            // request source from url
            // TODO: put extension handling for arraybuffer / image / video differentiation
            var that = this;
            ImageLoader.load({
                url: spec.src,
                success: function( image ) {
                    // set to unsigned byte type
                    spec.type = 'UNSIGNED_BYTE';
                    spec.src = Util.resizeCanvas( spec, image );
                    Texture2D.call( that, spec );
                    if ( callback ) {
                        callback( null, that );
                    }
                },
                error: function( err ) {
                    if ( callback ) {
                        callback( err, null );
                    }
                }
            });
        } else if ( Util.isCanvasType( spec.src ) ) {
            // is image / canvas / video type
            // set to unsigned byte type
            spec.type = 'UNSIGNED_BYTE';
            spec.src = Util.resizeCanvas( spec, spec.src );
            Texture2D.call( this, spec );
        } else {
            // array, arraybuffer, or null
            if ( spec.src === undefined ) {
                // if no data is provided, assume this texture will be rendered
                // to. In this case disable mipmapping, there is no need and it
                // will only introduce very peculiar and difficult to discern
                // rendering phenomena in which the texture 'transforms' at
                // certain angles / distances to the mipmapped (empty) portions.
                spec.mipMap = false;
            }
            // buffer from arg
            spec.type = TYPES[ spec.type ] ? spec.type : DEFAULT_TYPE;
            Texture2D.call( this, spec );
        }
    }

    ColorTexture2D.prototype = Object.create( Texture2D.prototype );

    module.exports = ColorTexture2D;

}());

},{"../util/ImageLoader":17,"../util/Util":20,"./Texture2D":8}],2:[function(require,module,exports){
(function () {

    'use strict';

    var Texture2D = require('./Texture2D');
    var MAG_FILTERS = {
        NEAREST: true,
        LINEAR: true
    };
    var MIN_FILTERS = {
        NEAREST: true,
        LINEAR: true
    };
    var WRAP_MODES = {
        REPEAT: true,
        CLAMP_TO_EDGE: true,
        MIRRORED_REPEAT: true
    };
    var DEPTH_TYPES = {
        UNSIGNED_BYTE: true,
        UNSIGNED_SHORT: true,
        UNSIGNED_INT: true
    };
    var FORMATS = {
        DEPTH_COMPONENT: true,
        DEPTH_STENCIL: true
    };

    /**
     * The default type for depth textures.
     */
    var DEFAULT_TYPE = 'UNSIGNED_INT';

    /**
     * The default format for depth textures.
     */
    var DEFAULT_FORMAT = 'DEPTH_COMPONENT';

    /**
     * The default wrap mode for depth textures.
     */
    var DEFAULT_WRAP = 'CLAMP_TO_EDGE';

    /**
     * The default min / mag filter for depth textures.
     */
    var DEFAULT_FILTER = 'LINEAR';

    /**
     * Instantiates a DepthTexture2D object.
     * @class DepthTexture2D
     * @classdesc A texture class to represent a 2D depth texture.
     * @augments Texture2D
     *
     * @param {Object} spec - The specification arguments.
     * @param {Uint8Array|Uint16Array|Uint32Array} spec.src - The data to buffer.
     * @param {number} width - The width of the texture.
     * @param {number} height - The height of the texture.
     * @param {String} spec.wrap - The wrapping type over both S and T dimension.
     * @param {String} spec.wrapS - The wrapping type over the S dimension.
     * @param {String} spec.wrapT - The wrapping type over the T dimension.
     * @param {String} spec.filter - The min / mag filter used during scaling.
     * @param {String} spec.minFilter - The minification filter used during scaling.
     * @param {String} spec.magFilter - The magnification filter used during scaling.
     * @param {String} spec.format - The texture pixel format.
     * @param {String} spec.type - The texture pixel component type.
     * @param {Function} callback - The callback to be executed if the data is loaded asynchronously via a URL.
     */
    function DepthTexture2D( spec ) {
        spec = spec || {};
        // get specific params
        spec.wrapS = spec.wrapS || spec.wrap;
        spec.wrapT = spec.wrapT || spec.wrap;
        spec.minFilter = spec.minFilter || spec.filter;
        spec.magFilter = spec.magFilter || spec.filter;
        // set texture params
        spec.wrapS = WRAP_MODES[ spec.wrapS ] ? spec.wrapS : DEFAULT_WRAP;
        spec.wrapT = WRAP_MODES[ spec.wrapT ] ? spec.wrapT : DEFAULT_WRAP;
        spec.minFilter = MIN_FILTERS[ spec.minFilter ] ? spec.minFilter : DEFAULT_FILTER;
        spec.magFilter = MAG_FILTERS[ spec.magFilter ] ? spec.magFilter : DEFAULT_FILTER;
        // set mip-mapping and format
        spec.mipMap = false; // disable mip-mapping
        spec.invertY = false; // no need to invert-y
        spec.preMultiplyAlpha = false; // no alpha to pre-multiply
        spec.format = FORMATS[ spec.format ] ? spec.format : DEFAULT_FORMAT;
        // check if stencil-depth, or just depth
        if ( spec.format === 'DEPTH_STENCIL' ) {
            spec.type = 'UNSIGNED_INT_24_8_WEBGL';
        } else {
            spec.type = DEPTH_TYPES[ spec.type ] ? spec.type : DEFAULT_TYPE;
        }
        Texture2D.call( this, spec );
    }

    DepthTexture2D.prototype = Object.create( Texture2D.prototype );

    module.exports = DepthTexture2D;

}());

},{"./Texture2D":8}],3:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext');
    var WebGLContextState = require('./WebGLContextState');
    var TYPES = {
        UNSIGNED_SHORT: true,
        UNSIGNED_INT: true
    };
    var MODES = {
        POINTS: true,
        LINES: true,
        LINE_STRIP: true,
        LINE_LOOP: true,
        TRIANGLES: true,
        TRIANGLE_STRIP: true,
        TRIANGLE_FAN: true
    };
    var BYTES_PER_TYPE = {
        UNSIGNED_SHORT: 2,
        UNSIGNED_INT: 4
    };

    /**
     * The default component type.
     */
    var DEFAULT_TYPE = 'UNSIGNED_SHORT';

    /**
     * The default render mode (primitive type).
     */
    var DEFAULT_MODE = 'TRIANGLES';

    /**
     * The default byte offset to render from.
     */
    var DEFAULT_BYTE_OFFSET = 0;

    /**
     * The default count of indices to render.
     */
    var DEFAULT_COUNT = 0;

    /**
     * Instantiates an IndexBuffer object.
     * @class IndexBuffer
     * @classdesc An index buffer object.
     *
     * @param {Uint16Array|Uin32Array|Array} arg - The index data to buffer.
     * @param {Object} options - The rendering options.
     * @param {String} options.mode - The draw mode / primitive type.
     * @param {String} options.byteOffset - The byte offset into the drawn buffer.
     * @param {String} options.count - The number of vertices to draw.
     */
    function IndexBuffer( arg, options ) {
        options = options || {};
        var gl = this.gl = WebGLContext.get();
        this.state = WebGLContextState.get( gl );
        this.buffer = gl.createBuffer();
        this.type = TYPES[ options.type ] ? options.type : DEFAULT_TYPE;
        // check if type is supported
        if ( this.type === 'UNSIGNED_INT' && !WebGLContext.checkExtension( 'OES_element_index_uint' ) ) {
            throw 'Cannot create IndexBuffer of type `UNSIGNED_INT` as extension `OES_element_index_uint` is not supported';
        }
        this.mode = MODES[ options.mode ] ? options.mode : DEFAULT_MODE;
        this.count = ( options.count !== undefined ) ? options.count : DEFAULT_COUNT;
        this.byteOffset = ( options.byteOffset !== undefined ) ? options.byteOffset : DEFAULT_BYTE_OFFSET;
        this.byteLength = 0;
        if ( arg ) {
            if ( arg instanceof WebGLBuffer ) {
                // WebGLBuffer argument
                if ( options.byteLength === undefined ) {
                    throw 'Argument of type `WebGLBuffer` must be complimented with a corresponding `options.byteLength`';
                }
                this.byteLength = options.byteLength;
                this.buffer = arg;
            } else if ( typeof arg === 'number' ) {
                // byte length argument
                if ( options.type === undefined ) {
                    throw 'Argument of type `number` must be complimented with a corresponding `options.type`';
                }
                this.bufferData( arg );
            } else if ( arg instanceof ArrayBuffer ) {
                // ArrayBuffer arg
                if ( options.type === undefined ) {
                    throw 'Argument of type `ArrayBuffer` must be complimented with a corresponding `options.type`';
                }
                this.bufferData( arg );
            } else {
                // Array or ArrayBufferView argument
                this.bufferData( arg );
            }
        } else {
            if ( options.type === undefined ) {
                throw 'Empty buffer must be complimented with a corresponding `options.type`';
            }
        }
        // ensure there isn't an overflow
        if ( this.count * BYTES_PER_TYPE[ this.type ] + this.byteOffset > this.byteLength ) {
            throw 'IndexBuffer `count` of ' + this.count + ' and `byteOffset` of ' + this.byteOffset + ' overflows the length of the buffer (' + this.byteLength + ')';
        }
    }

    /**
     * Upload index data to the GPU.
     * @memberof IndexBuffer
     *
     * @param {Array|ArrayBuffer|ArrayBufferView|number} arg - The array of data to buffer.
     *
     * @returns {IndexBuffer} The index buffer object for chaining.
     */
    IndexBuffer.prototype.bufferData = function( arg ) {
        var gl = this.gl;
        // cast array to ArrayBufferView based on provided type
        if ( arg instanceof Array ) {
            // check for type support
            if ( this.type === 'UNSIGNED_INT' ) {
                // uint32 is supported
                arg = new Uint32Array( arg );
            } else {
                // buffer to uint16
                arg = new Uint16Array( arg );
            }
        }
        // set ensure type corresponds to data
        if ( arg instanceof Uint16Array ) {
            this.type = 'UNSIGNED_SHORT';
        } else if ( arg instanceof Uint32Array ) {
            this.type = 'UNSIGNED_INT';
        } else if ( !( arg instanceof ArrayBuffer ) && typeof arg !== 'number' ) {
            throw 'Argument must be of type `Array`, `ArrayBuffer`, `ArrayBufferView`, or `number`';
        }
        // don't overwrite the count if it is already set
        if ( this.count === DEFAULT_COUNT ) {
            if ( typeof arg === 'number' ) {
                this.count = ( arg / BYTES_PER_TYPE[ this.type ] );
            } else {
                this.count = arg.length;
            }
        }
        // set byte length
        if ( typeof arg === 'number' ) {
            if ( arg % BYTES_PER_TYPE[ this.type ] ) {
                throw 'Byte length must be multiple of ' + BYTES_PER_TYPE[ this.type ];
            }
            this.byteLength = arg;
        } else {
            this.byteLength = arg.length * BYTES_PER_TYPE[ this.type ];
        }
        // buffer the data
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.buffer );
        gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, arg, gl.STATIC_DRAW );
        return this;
    };

    /**
     * Upload partial index data to the GPU.
     * @memberof IndexBuffer
     *
     * @param {Array|ArrayBuffer|ArrayBufferView} array - The array of data to buffer.
     * @param {number} byteOffset - The byte offset at which to buffer.
     *
     * @returns {IndexBuffer} The vertex buffer object for chaining.
     */
    IndexBuffer.prototype.bufferSubData = function( array, byteOffset ) {
        var gl = this.gl;
        if ( this.byteLength === 0 ) {
            throw 'Buffer has not been allocated';
        }
        // cast array to ArrayBufferView based on provided type
        if ( array instanceof Array ) {
            // check for type support
            if ( this.type === 'UNSIGNED_INT' ) {
                // uint32 is supported
                array = new Uint32Array( array );
            } else {
                // buffer to uint16
                array = new Uint16Array( array );
            }
        } else if (
            !( array instanceof Uint16Array ) &&
            !( array instanceof Uint32Array ) &&
            !( array instanceof ArrayBuffer ) ) {
            throw 'Argument must be of type `Array`, `ArrayBuffer`, or `ArrayBufferView`';
        }
        byteOffset = ( byteOffset !== undefined ) ? byteOffset : DEFAULT_BYTE_OFFSET;
        // get the total number of attribute components from pointers
        var byteLength = array.length * BYTES_PER_TYPE[ this.type ];
        if ( byteOffset + byteLength > this.byteLength ) {
            throw 'Argument of length ' + byteLength + ' bytes and byte offset of ' + byteOffset + ' bytes overflows the buffer length of ' + this.byteLength + ' bytes';
        }
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.buffer );
        gl.bufferSubData( gl.ELEMENT_ARRAY_BUFFER, byteOffset, array );
        return this;
    };

    /**
     * Execute the draw command for the bound buffer.
     * @memberof IndexBuffer
     *
     * @param {Object} options - The options to pass to 'drawElements'. Optional.
     * @param {String} options.mode - The draw mode / primitive type.
     * @param {String} options.byteOffset - The byteOffset into the drawn buffer.
     * @param {String} options.count - The number of vertices to draw.
     *
     * @returns {IndexBuffer} Returns the index buffer object for chaining.
     */
    IndexBuffer.prototype.draw = function( options ) {
        options = options || {};
        var gl = this.gl;
        var mode = gl[ options.mode || this.mode ];
        var type = gl[ this.type ];
        var byteOffset = ( options.byteOffset !== undefined ) ? options.byteOffset : this.byteOffset;
        var count = ( options.count !== undefined ) ? options.count : this.count;
        if ( count === 0 ) {
            throw 'Attempting to draw with a count of 0';
        }
        if ( byteOffset + count * BYTES_PER_TYPE[ this.type ] > this.byteLength ) {
            throw 'Attempting to draw with `count` of ' + count + ' and `byteOffset` of ' + byteOffset + ' which overflows the total byte length of the buffer (' + this.byteLength + ')';
        }
        // if this buffer is already bound, exit early
        if ( this.state.boundIndexBuffer !== this.buffer ) {
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, this.buffer );
            this.state.boundIndexBuffer = this.buffer;
        }
        // draw elements
        gl.drawElements( mode, count, type, byteOffset );
        return this;
    };

    module.exports = IndexBuffer;

}());

},{"./WebGLContext":13,"./WebGLContextState":14}],4:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext');
    var WebGLContextState = require('./WebGLContextState');
    var Util = require('../util/Util');

    var TEXTURE_TARGETS = {
        TEXTURE_2D: true,
        TEXTURE_CUBE_MAP: true
    };

    var DEPTH_FORMATS = {
        DEPTH_COMPONENT: true,
        DEPTH_STENCIL: true
    };

    /**
     * Instantiates a RenderTarget object.
     * @class RenderTarget
     * @classdesc A renderTarget class to allow rendering to textures.
     */
    function RenderTarget() {
        var gl = this.gl = WebGLContext.get();
        this.state = WebGLContextState.get( gl );
        this.framebuffer = gl.createFramebuffer();
        this.textures = {};
    }

    /**
     * Binds the renderTarget object and pushes it to the front of the stack.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.push = function() {
        if ( this.state.renderTargets.top() !== this ) {
            var gl = this.gl;
            gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer );
        }
        this.state.renderTargets.push( this );
        return this;
    };

    /**
     * Unbinds the renderTarget object and binds the renderTarget beneath it on this stack. If there is no underlying renderTarget, bind the backbuffer.
     * @memberof RenderTarget
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.pop = function() {
        var state = this.state;
        // if there is no render target bound, exit early
        if ( state.renderTargets.top() !== this ) {
            throw 'The current render target is not the top most element on the stack';
        }
        state.renderTargets.pop();
        var top = state.renderTargets.top();
        var gl;
        if ( top ) {
            gl = top.gl;
            gl.bindFramebuffer( gl.FRAMEBUFFER, top.framebuffer );
        } else {
            gl = this.gl;
            gl.bindFramebuffer( gl.FRAMEBUFFER, null );
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
        if ( !texture ) {
            throw 'Texture argument is missing';
        }
        if ( TEXTURE_TARGETS[ index ] && target === undefined ) {
            target = index;
            index = 0;
        }
        if ( index === undefined ) {
            index = 0;
        } else if ( !Util.isInteger( index ) || index < 0 ) {
            throw 'Texture color attachment index is invalid';
        }
        if ( target && !TEXTURE_TARGETS[ target ] ) {
            throw 'Texture target is invalid';
        }
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
        if ( !texture ) {
            throw 'Texture argument is missing';
        }
        if ( !DEPTH_FORMATS[ texture.format ] ) {
            throw 'Provided texture is not of format `DEPTH_COMPONENT` or `DEPTH_STENCIL`';
        }
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
     * Resizes the renderTarget and all attached textures by the provided height and width.
     * @memberof RenderTarget
     *
     * @param {number} width - The new width of the renderTarget.
     * @param {number} height - The new height of the renderTarget.
     *
     * @returns {RenderTarget} The renderTarget object, for chaining.
     */
    RenderTarget.prototype.resize = function( width, height ) {
        if ( typeof width !== 'number' || ( width <= 0 ) ) {
            throw 'Provided `width` of ' + width + ' is invalid';
        }
        if ( typeof height !== 'number' || ( height <= 0 ) ) {
            throw 'Provided `height` of ' + height + ' is invalid';
        }
        var textures = this.textures;
        Object.keys( textures ).forEach( function( key ) {
            textures[ key ].resize( width, height );
        });
        return this;
    };

    module.exports = RenderTarget;

}());

},{"../util/Util":20,"./WebGLContext":13,"./WebGLContextState":14}],5:[function(require,module,exports){
(function () {

    'use strict';

    var VertexPackage = require('../core/VertexPackage');
    var VertexBuffer = require('../core/VertexBuffer');
    var IndexBuffer = require('../core/IndexBuffer');

    /**
     * Iterates over all attribute pointers and throws an exception if an index
     * occurs mroe than once.
     * @private
     *
     * @param {Array} vertexBuffers - The array of vertexBuffers.
     */
    function checkIndexCollisions( vertexBuffers ) {
        var indices = {};
        vertexBuffers.forEach( function( buffer ) {
            Object.keys( buffer.pointers ).forEach( function( index ) {
                indices[ index ] = indices[ index ] || 0;
                indices[ index ]++;
            });
        });
        Object.keys( indices ).forEach( function( index ) {
            if ( indices[ index ] > 1 ) {
                throw 'More than one attribute pointer exists for index ' + index;
            }
        });
    }

    /**
     * Instantiates an Renderable object.
     * @class Renderable
     * @classdesc A container for one or more VertexBuffers and an optional IndexBuffer.
     *
     * @param {Object} spec - The renderable specification object.
     * @param {Array|Float32Array} spec.vertices - The vertices to interleave and buffer.
     * @param {VertexBuffer} spec.vertexBuffer - An existing vertex buffer to use.
     * @param {VertexBuffer[]} spec.vertexBuffers - Multiple vertex buffers to use.
     * @param {Array|Uint16Array|Uint32Array} spec.indices - The indices to buffer.
     * @param {IndexBuffer} spec.indexbuffer - An existing index buffer to use.
     * @param {String} spec.mode - The draw mode / primitive type.
     * @param {String} spec.byteOffset - The byte offset into the drawn buffer.
     * @param {String} spec.count - The number of vertices to draw.
     */
    function Renderable( spec ) {
        spec = spec || {};
        if ( spec.vertexBuffer || spec.vertexBuffers ) {
            // use existing vertex buffer
            this.vertexBuffers = spec.vertexBuffers || [ spec.vertexBuffer ];
        } else if ( spec.vertices ) {
            // create vertex package
            var vertexPackage = new VertexPackage( spec.vertices );
            // create vertex buffer
            this.vertexBuffers = [ new VertexBuffer( vertexPackage ) ];
        } else {
            this.vertexBuffers = [];
        }
        if ( spec.indexBuffer ) {
            // use existing index buffer
            this.indexBuffer = spec.indexBuffer;
        } else if ( spec.indices ) {
            // create index buffer
            this.indexBuffer = new IndexBuffer( spec.indices );
        } else {
            this.indexBuffer = null;
        }
        // check that no attribute indices clash
        checkIndexCollisions( this.vertexBuffers );
        // store rendering options
        this.options = {
            mode: spec.mode,
            byteOffset: spec.byteOffset,
            count: spec.count
        };
    }

    /**
     * Execute the draw command for the underlying buffers.
     * @memberof Renderable
     *
     * @param {Object} options - The options to pass to 'drawElements'. Optional.
     * @param {String} options.mode - The draw mode / primitive type.
     * @param {String} options.byteOffset - The byteOffset into the drawn buffer.
     * @param {String} options.count - The number of vertices to draw.
     *
     * @returns {Renderable} Returns the renderable object for chaining.
     */
    Renderable.prototype.draw = function( options ) {
        var overrides = options || {};
        // override options if provided
        overrides.mode = overrides.mode || this.options.mode;
        overrides.byteOffset = ( overrides.byteOffset !== undefined ) ? overrides.byteOffset : this.options.byteOffset;
        overrides.count = ( overrides.count !== undefined ) ? overrides.count : this.options.count;
        // draw the renderable
        if ( this.indexBuffer ) {
            // use index buffer to draw elements
            // bind vertex buffers and enable attribute pointers
            this.vertexBuffers.forEach( function( vertexBuffer ) {
                vertexBuffer.bind();
            });
            // draw primitives using index buffer
            this.indexBuffer.draw( overrides );
            // disable attribute pointers
            this.vertexBuffers.forEach( function( vertexBuffer ) {
                vertexBuffer.unbind();
            });
            // no advantage to unbinding as there is no stack used
        } else {
            // no index buffer, use draw arrays
            this.vertexBuffers.forEach( function( vertexBuffer ) {
                vertexBuffer.bind();
                vertexBuffer.draw( overrides );
                vertexBuffer.unbind();
            });
        }
        return this;
    };

    module.exports = Renderable;

}());

},{"../core/IndexBuffer":3,"../core/VertexBuffer":10,"../core/VertexPackage":11}],6:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext');
    var ShaderParser = require('./ShaderParser');
    var WebGLContextState = require('./WebGLContextState');
    var Async = require('../util/Async');
    var XHRLoader = require('../util/XHRLoader');
    var UNIFORM_FUNCTIONS = {
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
    };

    /**
     * Given a map of existing attributes, find the lowest index that is not
     * already used. If the attribute ordering was already provided, use that
     * instead.
     * @private
     *
     * @param {Object} attributes - The existing attributes object.
     * @param {Object} declaration - The attribute declaration object.
     *
     * @returns {number} The attribute index.
     */
    function getAttributeIndex( attributes, declaration ) {
        // check if attribute is already declared, if so, use that index
        if ( attributes[ declaration.name ] ) {
            return attributes[ declaration.name ].index;
        }
        // return next available index
        return Object.keys( attributes ).length;
    }

    /**
     * Given vertex and fragment shader source, parses the declarations and appends information pertaining to the uniforms and attribtues declared.
     * @private
     *
     * @param {Shader} shader - The shader object.
     * @param {String} vertSource - The vertex shader source.
     * @param {String} fragSource - The fragment shader source.
     *
     * @returns {Object} The attribute and uniform information.
     */
    function setAttributesAndUniforms( shader, vertSource, fragSource ) {
        var declarations = ShaderParser.parseDeclarations(
            [ vertSource, fragSource ],
            [ 'uniform', 'attribute' ]
        );
        // for each declaration in the shader
        declarations.forEach( function( declaration ) {
            // check if its an attribute or uniform
            if ( declaration.qualifier === 'attribute' ) {
                // if attribute, store type and index
                var index = getAttributeIndex( shader.attributes, declaration );
                shader.attributes[ declaration.name ] = {
                    type: declaration.type,
                    index: index
                };
            } else if ( declaration.qualifier === 'uniform' ) {
                // if uniform, store type and buffer function name
                shader.uniforms[ declaration.name ] = {
                    type: declaration.type,
                    func: UNIFORM_FUNCTIONS[ declaration.type + (declaration.count > 1 ? '[]' : '') ]
                };
            }
        });
    }

    /**
     * Given a shader source string and shader type, compiles the shader and returns the resulting WebGLShader object.
     * @private
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
            throw 'An error occurred compiling the shaders:\n' + gl.getShaderInfoLog( shader );
        }
        return shader;
    }

    /**
     * Binds the attribute locations for the Shader object.
     * @private
     *
     * @param {Shader} shader - The Shader object.
     */
    function bindAttributeLocations( shader ) {
        var gl = shader.gl;
        var attributes = shader.attributes;
        Object.keys( attributes ).forEach( function( key ) {
            // bind the attribute location
            gl.bindAttribLocation(
                shader.program,
                attributes[ key ].index,
                key );
        });
    }

    /**
     * Queries the webgl rendering context for the uniform locations.
     * @private
     *
     * @param {Shader} shader - The Shader object.
     */
    function getUniformLocations( shader ) {
        var gl = shader.gl;
        var uniforms = shader.uniforms;
        Object.keys( uniforms ).forEach( function( key ) {
            // get the uniform location
            uniforms[ key ].location = gl.getUniformLocation( shader.program, key );
        });
    }

    /**
     * Returns a function to load shader source from a url.
     * @private
     *
     * @param {String} url - The url to load the resource from.
     *
     * @returns {Function} The function to load the shader source.
     */
    function loadShaderSource( url ) {
        return function( done ) {
            XHRLoader.load({
                url: url,
                responseType: 'text',
                success: function( res ) {
                    done( null, res );
                },
                error: function( err ) {
                    done( err, null );
                }
            });
        };
    }

    /**
     * Returns a function to pass through the shader source.
     * @private
     *
     * @param {String} source - The source of the shader.
     *
     * @returns {Function} The function to pass through the shader source.
     */
    function passThroughSource( source ) {
        return function( done ) {
            done( null, source );
        };
    }

    /**
     * Returns a function that takes an array of GLSL source strings and URLs, and resolves them into and array of GLSL source.
     * @private
     *
     * @param {Array} sources - The shader sources.
     *
     * @returns - A function to resolve the shader sources.
     */
    function resolveSources( sources ) {
        return function( done ) {
            var tasks = [];
            sources = sources || [];
            sources = ( !( sources instanceof Array ) ) ? [ sources ] : sources;
            sources.forEach( function( source ) {
                if ( ShaderParser.isGLSL( source ) ) {
                    tasks.push( passThroughSource( source ) );
                } else {
                    tasks.push( loadShaderSource( source ) );
                }
            });
            Async.parallel( tasks, done );
        };
    }

    /**
     * Creates the shader program object from source strings. This includes:
     *    1) Compiling and linking the shader program.
     *    2) Parsing shader source for attribute and uniform information.
     *    3) Binding attribute locations, by order of delcaration.
     *    4) Querying and storing uniform location.
     * @private
     *
     * @param {Shader} shader - The Shader object.
     * @param {Object} sources - A map containing sources under 'vert' and 'frag' attributes.
     *
     * @returns {Shader} The shader object, for chaining.
     */
    function createProgram( shader, sources ) {
        var gl = shader.gl;
        var common = sources.common.join( '' );
        var vert = sources.vert.join( '' );
        var frag = sources.frag.join( '' );
        // compile shaders
        var vertexShader = compileShader( gl, common + vert, 'VERTEX_SHADER' );
        var fragmentShader = compileShader( gl, common + frag, 'FRAGMENT_SHADER' );
        // parse source for attribute and uniforms
        setAttributesAndUniforms( shader, vert, frag );
        // create the shader program
        shader.program = gl.createProgram();
        // attach vertex and fragment shaders
        gl.attachShader( shader.program, vertexShader );
        gl.attachShader( shader.program, fragmentShader );
        // bind vertex attribute locations BEFORE linking
        bindAttributeLocations( shader );
        // link shader
        gl.linkProgram( shader.program );
        // If creating the shader program failed, alert
        if ( !gl.getProgramParameter( shader.program, gl.LINK_STATUS ) ) {
            throw 'An error occured linking the shader:\n' + gl.getProgramInfoLog( shader.program );
        }
        // get shader uniform locations
        getUniformLocations( shader );
    }

    /**
     * Instantiates a Shader object.
     * @class Shader
     * @classdesc A shader class to assist in compiling and linking webgl
     * shaders, storing attribute and uniform locations, and buffering uniforms.
     *
     * @param {Object} spec - The shader specification object.
     * @param {String|String[]|Object} spec.common - Sources / URLs to be shared by both vvertex and fragment shaders.
     * @param {String|String[]|Object} spec.vert - The vertex shader sources / URLs.
     * @param {String|String[]|Object} spec.frag - The fragment shader sources / URLs.
     * @param {String[]} spec.attributes - The attribute index orderings.
     * @param {Function} callback - The callback function to execute once the shader
     *     has been successfully compiled and linked.
     */
    function Shader( spec, callback ) {
        var that = this;
        spec = spec || {};
        // check source arguments
        if ( !spec.vert ) {
            throw 'Vertex shader argument has not been provided';
        }
        if ( !spec.frag ) {
            throw 'Fragment shader argument has not been provided';
        }
        this.program = 0;
        this.gl = WebGLContext.get();
        this.state = WebGLContextState.get( this.gl );
        this.version = spec.version || '1.00';
        this.attributes = {};
        this.uniforms = {};
        // if attribute ordering is provided, use those indices
        if ( spec.attributes ) {
            spec.attributes.forEach( function( attr, index ) {
                that.attributes[ attr ] = {
                    index: index
                };
            });
        }
        // create the shader
        Async.parallel({
            common: resolveSources( spec.common ),
            vert: resolveSources( spec.vert ),
            frag: resolveSources( spec.frag ),
        }, function( err, sources ) {
            if ( err ) {
                if ( callback ) {
                    callback( err, null );
                }
                return;
            }
            // once all shader sources are loaded
            createProgram( that, sources );
            if ( callback ) {
                callback( null, that );
            }
        });
    }

    /**
     * Binds the shader object and pushes it to the front of the stack.
     * @memberof Shader
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.push = function() {
        // if this shader is already bound, no need to rebind
        if ( this.state.shaders.top() !== this ) {
            this.gl.useProgram( this.program );
        }
        this.state.shaders.push( this );
        return this;
    };

    /**
     * Unbinds the shader object and binds the shader beneath it on this stack. If there is no underlying shader, bind the backbuffer.
     * @memberof Shader
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.pop = function() {
        var state = this.state;
        // if there is no shader bound, exit early
        if ( state.shaders.top() !== this ) {
            throw 'Shader is not the top most element on the stack';
        }
        // pop shader off stack
        state.shaders.pop();
        // if there is an underlying shader, bind it
        var top = state.shaders.top();
        if ( top && top !== this ) {
            top.gl.useProgram( top.program );
        } else {
            // unbind the shader
            this.gl.useProgram( null );
        }
        return this;
    };

    /**
     * Buffer a uniform value by name.
     * @memberof Shader
     *
     * @param {String} name - The uniform name in the shader source.
     * @param {*} value - The uniform value to buffer.
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.setUniform = function( name, value ) {
        // ensure shader is bound
        if ( this !== this.state.shaders.top() ) {
            throw 'Attempting to set uniform `' + name + '` for an unbound shader';
        }
        var uniform = this.uniforms[ name ];
        // ensure that the uniform spec exists for the name
        if ( !uniform ) {
            throw 'No uniform found under name `' + name + '`';
        }
        // check value
        if ( value === undefined || value === null ) {
            // ensure that the uniform argument is defined
            throw 'Argument passed for uniform `' + name + '` is undefined';
        } else if ( value instanceof Array ) {
            // convert Array to Float32Array
            value = new Float32Array( value );
        } else if ( typeof value === 'boolean' ) {
            // convert boolean's to 0 or 1
            value = value ? 1 : 0;
        }
        // pass the arguments depending on the type
        if ( uniform.type === 'mat2' || uniform.type === 'mat3' || uniform.type === 'mat4' ) {
            this.gl[ uniform.func ]( uniform.location, false, value );
        } else {
            this.gl[ uniform.func ]( uniform.location, value );
        }
        return this;
    };

    /**
     * Buffer a map of uniform values.
     * @memberof Shader
     *
     * @param {Object} uniforms - The map of uniforms keyed by name.
     *
     * @returns {Shader} The shader object, for chaining.
     */
    Shader.prototype.setUniforms = function( args ) {
        // ensure shader is bound
        if ( this !== this.state.shaders.top() ) {
            throw 'Attempting to set uniform `' + name + '` for an unbound shader';
        }
        var gl = this.gl;
        var uniforms = this.uniforms;
        Object.keys( args ).forEach( function( name ) {
            var value = args[name];
            var uniform = uniforms[name];
            // ensure that the uniform exists for the name
            if ( !uniform ) {
                throw 'No uniform found under name `' + name + '`';
            }
            if ( value === undefined || value === null ) {
                // ensure that the uniform argument is defined
                throw 'Argument passed for uniform `' + name + '` is undefined';
            } else if ( value instanceof Array ) {
                // convert Array to Float32Array
                value = new Float32Array( value );
            } else if ( typeof value === 'boolean' ) {
                // convert boolean's to 0 or 1
                value = value ? 1 : 0;
            }
            // pass the arguments depending on the type
            if ( uniform.type === 'mat2' || uniform.type === 'mat3' || uniform.type === 'mat4' ) {
                gl[ uniform.func ]( uniform.location, false, value );
            } else {
                gl[ uniform.func ]( uniform.location, value );
            }
        });
        return this;
    };

    module.exports = Shader;

}());

},{"../util/Async":16,"../util/XHRLoader":21,"./ShaderParser":7,"./WebGLContext":13,"./WebGLContextState":14}],7:[function(require,module,exports){
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
    var GLSL_REGEXP =  /void\s+main\s*\(\s*(void)*\s*\)\s*/mi;

    /**
     * Removes standard comments from the provided string.
     * @private
     *
     * @param {String} str - The string to strip comments from.
     *
     * @returns {String} The commentless string.
     */
    function stripComments( str ) {
        // regex source: https://github.com/moagrius/stripcomments
        return str.replace( COMMENTS_REGEXP, '' );
    }

    /**
     * Converts all whitespace into a single ' ' space character.
     * @private
     *
     * @param {String} str - The string to normalize whitespace from.
     *
     * @returns {String} The normalized string.
     */
    function normalizeWhitespace( str ) {
        return str.replace( ENDLINE_REGEXP, ' ' ) // remove line endings
            .replace( WHITESPACE_REGEXP, ' ' ) // normalize whitespace to single ' '
            .replace( BRACKET_WHITESPACE_REGEXP, '$2$4$6' ); // remove whitespace in brackets
    }

    /**
     * Parses the name and count out of a name statement, returning the
     * declaration object.
     * @private
     *
     * @param {String} qualifier - The qualifier string.
     * @param {String} precision - The precision string.
     * @param {String} type - The type string.
     * @param {String} entry - The variable declaration string.
     *
     * @returns {Object} The declaration object.
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
     * @private
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
     * @private
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
     * @private
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
         * Parses the provided GLSL source, and returns all declaration statements that contain the provided qualifier type. This can be used to extract all attributes and uniform names and types from a shader.
         *
         * For example, when provided a 'uniform' qualifiers, the declaration:
         *
         *     'uniform highp vec3 uSpecularColor;'
         *
         * Would be parsed to:
         *     {
         *         qualifier: 'uniform',
         *         type: 'vec3',
         *         name: 'uSpecularColor',
         *         count: 1
         *     }
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
         * Detects based on the existence of a 'void main() {' statement, if the string is glsl source code.
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

},{}],8:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext');
    var WebGLContextState = require('./WebGLContextState');
    var Util = require('../util/Util');
    var MAG_FILTERS = {
        NEAREST: true,
        LINEAR: true
    };
    var MIN_FILTERS = {
        NEAREST: true,
        LINEAR: true,
        NEAREST_MIPMAP_NEAREST: true,
        LINEAR_MIPMAP_NEAREST: true,
        NEAREST_MIPMAP_LINEAR: true,
        LINEAR_MIPMAP_LINEAR: true
    };
    var NON_MIPMAP_MIN_FILTERS = {
        NEAREST: true,
        LINEAR: true,
    };
    var MIPMAP_MIN_FILTERS = {
        NEAREST_MIPMAP_NEAREST: true,
        LINEAR_MIPMAP_NEAREST: true,
        NEAREST_MIPMAP_LINEAR: true,
        LINEAR_MIPMAP_LINEAR: true
    };
    var WRAP_MODES = {
        REPEAT: true,
        MIRRORED_REPEAT: true,
        CLAMP_TO_EDGE: true
    };
    var DEPTH_TYPES = {
        DEPTH_COMPONENT: true,
        DEPTH_STENCIL: true
    };

    /**
     * The default type for textures.
     */
    var DEFAULT_TYPE = 'UNSIGNED_BYTE';

    /**
     * The default format for textures.
     */
    var DEFAULT_FORMAT = 'RGBA';

    /**
     * The default wrap mode for textures.
     */
    var DEFAULT_WRAP = 'REPEAT';

    /**
     * The default min / mag filter for textures.
     */
    var DEFAULT_FILTER = 'LINEAR';

    /**
     * The default for whether alpha premultiplying is enabled.
     */
    var DEFAULT_PREMULTIPLY_ALPHA = true;

    /**
     * The default for whether mipmapping is enabled.
     */
    var DEFAULT_MIPMAP = true;

    /**
     * The default for whether invert-y is enabled.
     */
    var DEFAULT_INVERT_Y = true;

    /**
     * The default mip-mapping filter suffix.
     */
    var DEFAULT_MIPMAP_MIN_FILTER_SUFFIX = '_MIPMAP_LINEAR';

    /**
     * Instantiates a Texture2D object.
     * @class Texture2D
     * @classdesc A texture class to represent a 2D texture.
     *
     * @param {Uint8Array|Uint16Array|Uint32Array|Float32Array|ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} spec.src - The data to buffer.
     * @param {number} width - The width of the texture.
     * @param {number} height - The height of the texture.
     * @param {String} spec.wrap - The wrapping type over both S and T dimension.
     * @param {String} spec.wrapS - The wrapping type over the S dimension.
     * @param {String} spec.wrapT - The wrapping type over the T dimension.
     * @param {String} spec.filter - The min / mag filter used during scaling.
     * @param {String} spec.minFilter - The minification filter used during scaling.
     * @param {String} spec.magFilter - The magnification filter used during scaling.
     * @param {bool} spec.mipMap - Whether or not mip-mapping is enabled.
     * @param {bool} spec.invertY - Whether or not invert-y is enabled.
     * @param {bool} spec.preMultiplyAlpha - Whether or not alpha premultiplying is enabled.
     * @param {String} spec.format - The texture pixel format.
     * @param {String} spec.type - The texture pixel component type.
     */
    function Texture2D( spec ) {
        spec = spec || {};
        // get specific params
        spec.wrapS = spec.wrapS || spec.wrap;
        spec.wrapT = spec.wrapT || spec.wrap;
        spec.minFilter = spec.minFilter || spec.filter;
        spec.magFilter = spec.magFilter || spec.filter;
        // set texture params
        this.wrapS = spec.wrapS || DEFAULT_WRAP;
        this.wrapT = spec.wrapT || DEFAULT_WRAP;
        this.minFilter = spec.minFilter || DEFAULT_FILTER;
        this.magFilter = spec.magFilter || DEFAULT_FILTER;
        // set other properties
        this.mipMap = spec.mipMap !== undefined ? spec.mipMap : DEFAULT_MIPMAP;
        this.invertY = spec.invertY !== undefined ? spec.invertY : DEFAULT_INVERT_Y;
        this.preMultiplyAlpha = spec.preMultiplyAlpha !== undefined ? spec.preMultiplyAlpha : DEFAULT_PREMULTIPLY_ALPHA;
        // set format
        this.format = spec.format || DEFAULT_FORMAT;
        if ( DEPTH_TYPES[ this.format ] && !WebGLContext.checkExtension( 'WEBGL_depth_texture' ) ) {
            throw 'Cannot create Texture2D of format `' + this.format + '` as `WEBGL_depth_texture` extension is unsupported';
        }
        // set type
        this.type = spec.type || DEFAULT_TYPE;
        if ( this.type === 'FLOAT' && !WebGLContext.checkExtension( 'OES_texture_float' ) ) {
            throw 'Cannot create Texture2D of type `FLOAT` as `OES_texture_float` extension is unsupported';
        }
        // check size
        if ( !Util.isCanvasType( spec.src ) ) {
            // if not a canvas type, dimensions MUST be specified
            if ( typeof spec.width !== 'number' || spec.width <= 0 ) {
                throw '`width` argument is missing or invalid';
            }
            if ( typeof spec.height !== 'number' || spec.height <= 0 ) {
                throw '`height` argument is missing or invalid';
            }
            if ( Util.mustBePowerOfTwo( this ) ) {
                if ( !Util.isPowerOfTwo( spec.width ) ) {
                    throw 'Parameters require a power-of-two texture, yet provided width of ' + spec.width + ' is not a power of two';
                }
                if ( !Util.isPowerOfTwo( spec.height ) ) {
                    throw 'Parameters require a power-of-two texture, yet provided height of ' + spec.height + ' is not a power of two';
                }
            }
        }
        var gl = this.gl = WebGLContext.get();
        this.state = WebGLContextState.get( gl );
        // create texture object
        this.texture = gl.createTexture();
        // buffer the data
        this.bufferData( spec.src || null, spec.width, spec.height );
        this.setParameters( this );
    }

    /**
     * Binds the texture object and pushes it onto the stack.
     * @memberof Texture2D
     *
     * @param {number} location - The texture unit location index. Default to 0.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.push = function( location ) {
        if ( location === undefined ) {
            location = 0;
        } else if ( !Util.isInteger( location ) || location < 0 ) {
            throw 'Texture unit location is invalid';
        }
        // if this texture is already bound, no need to rebind
        if ( this.state.texture2Ds.top( location ) !== this ) {
            var gl = this.gl;
            gl.activeTexture( gl[ 'TEXTURE' + location ] );
            gl.bindTexture( gl.TEXTURE_2D, this.texture );
        }
        // add to stack under the texture unit
        this.state.texture2Ds.push( location, this );
        return this;
    };

    /**
     * Unbinds the texture object and binds the texture beneath it on this stack. If there is no underlying texture, unbinds the unit.
     * @memberof Texture2D
     *
     * @param {number} location - The texture unit location index. Default to 0.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.pop = function( location ) {
        if ( location === undefined ) {
            location = 0;
        } else if ( !Util.isInteger( location ) || location < 0 ) {
            throw 'Texture unit location is invalid';
        }
        var state = this.state;
        if ( state.texture2Ds.top( location ) !== this ) {
            throw 'Texture2D is not the top most element on the stack';
        }
        state.texture2Ds.pop( location );
        var gl;
        var top = state.texture2Ds.top( location );
        if ( top ) {
            if ( top !== this ) {
                // bind underlying texture
                gl = top.gl;
                gl.activeTexture( gl[ 'TEXTURE' + location ] );
                gl.bindTexture( gl.TEXTURE_2D, top.texture );
            }
        } else {
            // unbind
            gl = this.gl;
            gl.bindTexture( gl.TEXTURE_2D, null );
        }
    };

    /**
     * Buffer data into the texture.
     * @memberof Texture2D
     *
     * @param {Array|ArrayBufferView|null} data - The data array to buffer.
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
        // premultiply alpha if specified
        gl.pixelStorei( gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.preMultiplyAlpha );
        // cast array arg
        if ( data instanceof Array ) {
            if ( this.type === 'UNSIGNED_SHORT' ) {
                data = new Uint16Array( data );
            } else if ( this.type === 'UNSIGNED_INT' ) {
                data = new Uint32Array( data );
            } else if ( this.type === 'FLOAT' ) {
                data = new Float32Array( data );
            } else {
                data = new Uint8Array( data );
            }
        }
        // set ensure type corresponds to data
        if ( data instanceof Uint8Array ) {
            this.type = 'UNSIGNED_BYTE';
        } else if ( data instanceof Uint16Array ) {
            this.type = 'UNSIGNED_SHORT';
        } else if ( data instanceof Uint32Array ) {
            this.type = 'UNSIGNED_INT';
        } else if ( data instanceof Float32Array ) {
            this.type = 'FLOAT';
        } else if ( data && !( data instanceof ArrayBuffer ) && !Util.isCanvasType( data ) ) {
            throw 'Argument must be of type `Array`, `ArrayBuffer`, `ArrayBufferView`, `ImageData`, `HTMLImageElement`, `HTMLCanvasElement`, `HTMLVideoElement`, or null';
        }
        if ( Util.isCanvasType( data ) ) {
            // store width and height
            this.width = data.width;
            this.height = data.height;
            // buffer the texture
            gl.texImage2D(
                gl.TEXTURE_2D,
                0, // mip-map level,
                gl[ this.format ], // webgl requires format === internalFormat
                gl[ this.format ],
                gl[ this.type ],
                data );
        } else {
            // store width and height
            this.width = width || this.width;
            this.height = height || this.height;
            // buffer the texture data
            gl.texImage2D(
                gl.TEXTURE_2D,
                0, // mip-map level
                gl[ this.format ], // webgl requires format === internalFormat
                this.width,
                this.height,
                0, // border, must be 0
                gl[ this.format ],
                gl[ this.type ],
                data );
        }
        // generate mip maps
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
     * @param {Object} params - The parameters by name.
     * @param {String} params.wrap - The wrapping type over both S and T dimension.
     * @param {String} params.wrapS - The wrapping type over the S dimension.
     * @param {String} params.wrapT - The wrapping type over the T dimension.
     * @param {String} params.filter - The min / mag filter used during scaling.
     * @param {String} params.minFilter - The minification filter used during scaling.
     * @param {String} params.magFilter - The magnification filter used during scaling.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.setParameters = function( params ) {
        var gl = this.gl;
        this.push();
        // set wrap S parameter
        var param = params.wrapS || params.wrap;
        if ( param ) {
            if ( WRAP_MODES[ param ] ) {
                this.wrapS = param;
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[ this.wrapS ] );
            } else {
                throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_WRAP_S`';
            }
        }
        // set wrap T parameter
        param = params.wrapT || params.wrap;
        if ( param ) {
            if ( WRAP_MODES[ param ] ) {
                this.wrapT = param;
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[ this.wrapT ] );
            } else {
                throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_WRAP_T`';
            }
        }
        // set mag filter parameter
        param = params.magFilter || params.filter;
        if ( param ) {
            if ( MAG_FILTERS[ param ] ) {
                this.magFilter = param;
                gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[ this.magFilter ] );
            } else {
                throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_MAG_FILTER`';
            }
        }
        // set min filter parameter
        param = params.minFilter || params.filter;
        if ( param ) {
            if ( this.mipMap ) {
                if ( NON_MIPMAP_MIN_FILTERS[ param ] ) {
                    // upgrade to mip-map min filter
                    param += DEFAULT_MIPMAP_MIN_FILTER_SUFFIX;
                }
                if ( MIPMAP_MIN_FILTERS[ param ] ) {
                    this.minFilter = param;
                    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[ this.minFilter ] );
                } else  {
                    throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_MIN_FILTER`';
                }
            } else {
                if ( MIN_FILTERS[ param ] ) {
                    this.minFilter = param;
                    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[ this.minFilter ] );
                } else {
                    throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_MIN_FILTER`';
                }
            }
        }
        this.pop();
        return this;
    };

    /**
     * Resize the underlying texture. This clears the texture data.
     * @memberof Texture2D
     *
     * @param {number} width - The new width of the texture.
     * @param {number} height - The new height of the texture.
     *
     * @returns {Texture2D} The texture object, for chaining.
     */
    Texture2D.prototype.resize = function( width, height ) {
        if ( typeof width !== 'number' || ( width <= 0 ) ) {
            throw 'Provided `width` of ' + width + ' is invalid';
        }
        if ( typeof height !== 'number' || ( height <= 0 ) ) {
            throw 'Provided `height` of ' + height + ' is invalid';
        }
        this.bufferData( null, width, height );
        return this;
    };

    module.exports = Texture2D;

}());

},{"../util/Util":20,"./WebGLContext":13,"./WebGLContextState":14}],9:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext');
    var WebGLContextState = require('./WebGLContextState');
    var Async = require('../util/Async');
    var Util = require('../util/Util');
    var ImageLoader = require('../util/ImageLoader');
    var FACES = [
        '-x', '+x',
        '-y', '+y',
        '-z', '+z'
    ];
    var FACE_TARGETS = {
        '+z': 'TEXTURE_CUBE_MAP_POSITIVE_Z',
        '-z': 'TEXTURE_CUBE_MAP_NEGATIVE_Z',
        '+x': 'TEXTURE_CUBE_MAP_POSITIVE_X',
        '-x': 'TEXTURE_CUBE_MAP_NEGATIVE_X',
        '+y': 'TEXTURE_CUBE_MAP_POSITIVE_Y',
        '-y': 'TEXTURE_CUBE_MAP_NEGATIVE_Y'
    };
    var TARGETS = {
        TEXTURE_CUBE_MAP_POSITIVE_Z: true,
        TEXTURE_CUBE_MAP_NEGATIVE_Z: true,
        TEXTURE_CUBE_MAP_POSITIVE_X: true,
        TEXTURE_CUBE_MAP_NEGATIVE_X: true,
        TEXTURE_CUBE_MAP_POSITIVE_Y: true,
        TEXTURE_CUBE_MAP_NEGATIVE_Y: true
    };
    var MAG_FILTERS = {
        NEAREST: true,
        LINEAR: true
    };
    var MIN_FILTERS = {
        NEAREST: true,
        LINEAR: true,
        NEAREST_MIPMAP_NEAREST: true,
        LINEAR_MIPMAP_NEAREST: true,
        NEAREST_MIPMAP_LINEAR: true,
        LINEAR_MIPMAP_LINEAR: true
    };
    var NON_MIPMAP_MIN_FILTERS = {
        NEAREST: true,
        LINEAR: true,
    };
    var MIPMAP_MIN_FILTERS = {
        NEAREST_MIPMAP_NEAREST: true,
        LINEAR_MIPMAP_NEAREST: true,
        NEAREST_MIPMAP_LINEAR: true,
        LINEAR_MIPMAP_LINEAR: true
    };
    var WRAP_MODES = {
        REPEAT: true,
        MIRRORED_REPEAT: true,
        CLAMP_TO_EDGE: true
    };
    var FORMATS = {
        RGB: true,
        RGBA: true
    };

    /**
     * The default type for textures.
     */
    var DEFAULT_TYPE = 'UNSIGNED_BYTE';

    /**
     * The default format for textures.
     */
    var DEFAULT_FORMAT = 'RGBA';

    /**
     * The default wrap mode for textures.
     */
    var DEFAULT_WRAP = 'CLAMP_TO_EDGE';

    /**
     * The default min / mag filter for textures.
     */
    var DEFAULT_FILTER = 'LINEAR';

    /**
     * The default for whether alpha premultiplying is enabled.
     */
    var DEFAULT_PREMULTIPLY_ALPHA = true;

    /**
     * The default for whether mipmapping is enabled.
     */
    var DEFAULT_MIPMAP = true;

    /**
     * The default for whether invert-y is enabled.
     */
    var DEFAULT_INVERT_Y = true;

    /**
     * The default mip-mapping filter suffix.
     */
    var DEFAULT_MIPMAP_MIN_FILTER_SUFFIX = '_MIPMAP_LINEAR';

    /**
     * Checks the width and height of the cubemap and throws an exception if
     * it does not meet requirements.
     * @private
     *
     * @param {TextureCubeMap} cubeMap - The cube map texture object.
     */
    function checkDimensions( cubeMap ) {
        if ( typeof cubeMap.width !== 'number' || cubeMap.width <= 0 ) {
            throw '`width` argument is missing or invalid';
        }
        if ( typeof cubeMap.height !== 'number' || cubeMap.height <= 0 ) {
            throw '`height` argument is missing or invalid';
        }
        if ( cubeMap.width !== cubeMap.height ) {
            throw 'Provided `width` must be equal to `height`';
        }
        if ( Util.mustBePowerOfTwo( cubeMap ) && !Util.isPowerOfTwo( cubeMap.width ) ) {
            throw 'Parameters require a power-of-two texture, yet provided size of ' + cubeMap.width + ' is not a power of two';
        }
    }

    /**
     * Returns a function to load a face from a url.
     * @private
     *
     * @param {TextureCubeMap} cubeMap - The cube map texture object.
     * @param {string} target - The texture target.
     * @param {string} url - The url to load the face from.
     *
     * @returns {function} The loader function.
     */
    function loadFaceURL( cubeMap, target, url ) {
        return function( done ) {
            // TODO: put extension handling for arraybuffer / image / video differentiation
            ImageLoader.load({
                url: url,
                success: function( image ) {
                    image = Util.resizeCanvas( cubeMap, image );
                    cubeMap.bufferData( target, image );
                    done( null );
                },
                error: function( err ) {
                    done( err, null );
                }
            });
        };
    }

    /**
     * Returns a function to load a face from a canvas type object.
     * @private
     *
     * @param {TextureCubeMap} cubeMap - The cube map texture object.
     * @param {string} target - The texture target.
     * @param {ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} canvas - The canvas type object.
     *
     * @returns {function} The loader function.
     */
    function loadFaceCanvas( cubeMap, target, canvas ) {
        return function( done ) {
            canvas = Util.resizeCanvas( cubeMap, canvas );
            cubeMap.bufferData( target, canvas );
            done( null );
        };
    }

    /**
     * Returns a function to load a face from an array type object.
     * @private
     *
     * @param {TextureCubeMap} cubeMap - The cube map texture object.
     * @param {string} target - The texture target.
     * @param {Array|ArrayBuffer|ArrayBufferView} arr - The array type object.
     *
     * @returns {function} The loader function.
     */
    function loadFaceArray( cubeMap, target, arr ) {
        checkDimensions( cubeMap );
        return function( done ) {
            cubeMap.bufferData( target, arr );
            done( null );
        };
    }

    /**
     * Instantiates a TextureCubeMap object.
     * @class TextureCubeMap
     * @classdesc A texture class to represent a cube map texture.
     *
     * @param {Object} spec - The specification arguments
     * @param {Object} spec.faces - The faces to buffer, under keys '+x', '+y', '+z', '-x', '-y', and '-z'.
     * @param {number} spec.width - The width of the faces.
     * @param {number} spec.height - The height of the faces.
     * @param {String} spec.wrap - The wrapping type over both S and T dimension.
     * @param {String} spec.wrapS - The wrapping type over the S dimension.
     * @param {String} spec.wrapT - The wrapping type over the T dimension.
     * @param {String} spec.filter - The min / mag filter used during scaling.
     * @param {String} spec.minFilter - The minification filter used during scaling.
     * @param {String} spec.magFilter - The magnification filter used during scaling.
     * @param {bool} spec.mipMap - Whether or not mip-mapping is enabled.
     * @param {bool} spec.invertY - Whether or not invert-y is enabled.
     * @param {bool} spec.preMultiplyAlpha - Whether or not alpha premultiplying is enabled.
     * @param {String} spec.format - The texture pixel format.
     * @param {String} spec.type - The texture pixel component type.
     */
    function TextureCubeMap( spec, callback ) {
        var that = this;
        var gl = this.gl = WebGLContext.get();
        this.state = WebGLContextState.get( gl );
        this.texture = gl.createTexture();
        // get specific params
        spec.wrapS = spec.wrapS || spec.wrap;
        spec.wrapT = spec.wrapT || spec.wrap;
        spec.minFilter = spec.minFilter || spec.filter;
        spec.magFilter = spec.magFilter || spec.filter;
        // set texture params
        this.wrapS = WRAP_MODES[ spec.wrapS ] ? spec.wrapS : DEFAULT_WRAP;
        this.wrapT = WRAP_MODES[ spec.wrapT ] ? spec.wrapT : DEFAULT_WRAP;
        this.minFilter = MIN_FILTERS[ spec.minFilter ] ? spec.minFilter : DEFAULT_FILTER;
        this.magFilter = MAG_FILTERS[ spec.magFilter ] ? spec.magFilter : DEFAULT_FILTER;
        // set other properties
        this.mipMap = spec.mipMap !== undefined ? spec.mipMap : DEFAULT_MIPMAP;
        this.invertY = spec.invertY !== undefined ? spec.invertY : DEFAULT_INVERT_Y;
        this.preMultiplyAlpha = spec.preMultiplyAlpha !== undefined ? spec.preMultiplyAlpha : DEFAULT_PREMULTIPLY_ALPHA;
        // set format and type
        this.format = FORMATS[ spec.format ] ? spec.format : DEFAULT_FORMAT;
        this.type = spec.type || DEFAULT_TYPE;
        if ( this.type === 'FLOAT' && !WebGLContext.checkExtension( 'OES_texture_float' ) ) {
            throw 'Cannot create Texture2D of type `FLOAT` as `OES_texture_float` extension is unsupported';
        }
        // set dimensions if provided
        this.width = spec.width;
        this.height = spec.height;
        // set buffered faces
        this.bufferedFaces = [];
        // create cube map based on input
        if ( spec.faces ) {
            var tasks = [];
            FACES.forEach( function( id ) {
                var face = spec.faces[ id ];
                var target = FACE_TARGETS[ id ];
                // load based on type
                if ( typeof face === 'string' ) {
                    // url
                    tasks.push( loadFaceURL( that, target, face ) );
                } else if ( Util.isCanvasType( face ) ) {
                    // canvas
                    tasks.push( loadFaceCanvas( that, target, face ) );
                } else {
                    // array / arraybuffer or null
                    tasks.push( loadFaceArray( that, target, face ) );
                }
            });
            Async.parallel( tasks, function( err ) {
                if ( err ) {
                    if ( callback ) {
                        callback( err, null );
                    }
                    return;
                }
                // set parameters
                that.setParameters( that );
                if ( callback ) {
                    callback( null, that );
                }
            });
        } else {
            // null
            checkDimensions( this );
            FACES.forEach( function( id ) {
                that.bufferData( FACE_TARGETS[ id ], null );
            });
            // set parameters
            this.setParameters( this );
        }
    }

    /**
     * Binds the texture object and pushes it to onto the stack.
     * @memberof TextureCubeMap
     *
     * @param {number} location - The texture unit location index.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
    TextureCubeMap.prototype.push = function( location ) {
        if ( location === undefined ) {
            location = 0;
        } else if ( !Util.isInteger( location ) || location < 0 ) {
            throw 'Texture unit location is invalid';
        }
        // if this texture is already bound, no need to rebind
        if ( this.state.textureCubeMaps.top( location ) !== this ) {
            var gl = this.gl;
            gl.activeTexture( gl[ 'TEXTURE' + location ] );
            gl.bindTexture( gl.TEXTURE_CUBE_MAP, this.texture );
        }
        // add to stack under the texture unit
        this.state.textureCubeMaps.push( location, this );
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
        if ( location === undefined ) {
            location = 0;
        } else if ( !Util.isInteger( location ) || location < 0 ) {
            throw 'Texture unit location is invalid';
        }
        var state = this.state;
        if ( state.textureCubeMaps.top( location ) !== this ) {
            throw 'The current texture is not the top most element on the stack';
        }
        state.textureCubeMaps.pop( location );
        var gl;
        var top = state.textureCubeMaps.top( location );
        if ( top ) {
            if ( top !== this ) {
                // bind underlying texture
                gl = top.gl;
                gl.activeTexture( gl[ 'TEXTURE' + location ] );
                gl.bindTexture( gl.TEXTURE_CUBE_MAP, top.texture );
            }
        } else {
            // unbind
            gl = this.gl;
            gl.bindTexture( gl.TEXTURE_CUBE_MAP, null );
        }
        return this;
    };

    /**
     * Buffer data into the respective cube map face.
     * @memberof TextureCubeMap
     *
     * @param {string} target - The face target.
     * @param {Object|null} data - The face data.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
    TextureCubeMap.prototype.bufferData = function( target, data ) {
        if ( !TARGETS[ target ] ) {
            throw 'Provided `target` of ' + target + ' is invalid';
        }
        var gl = this.gl;
        // buffer face texture
        this.push();
        // invert y if specified
        gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, this.invertY );
        // premultiply alpha if specified
        gl.pixelStorei( gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.preMultiplyAlpha );
        // cast array arg
        if ( data instanceof Array ) {
            if ( this.type === 'UNSIGNED_SHORT' ) {
                data = new Uint16Array( data );
            } else if ( this.type === 'UNSIGNED_INT' ) {
                data = new Uint32Array( data );
            } else if ( this.type === 'FLOAT' ) {
                data = new Float32Array( data );
            } else {
                data = new Uint8Array( data );
            }
        }
        // set ensure type corresponds to data
        if ( data instanceof Uint8Array ) {
            this.type = 'UNSIGNED_BYTE';
        } else if ( data instanceof Uint16Array ) {
            this.type = 'UNSIGNED_SHORT';
        } else if ( data instanceof Uint32Array ) {
            this.type = 'UNSIGNED_INT';
        } else if ( data instanceof Float32Array ) {
            this.type = 'FLOAT';
        } else if ( data && !( data instanceof ArrayBuffer ) && !Util.isCanvasType( data ) ) {
            throw 'Argument must be of type `Array`, `ArrayBuffer`, `ArrayBufferView`, `ImageData`, `HTMLImageElement`, `HTMLCanvasElement`, `HTMLVideoElement`, or null';
        }
        // buffer the data
        if ( Util.isCanvasType( data ) ) {
            // store width and height
            this.width = data.width;
            this.height = data.height;
            // buffer the texture
            gl.texImage2D(
                gl[ target ],
                0, // mip-map level,
                gl[ this.format ], // webgl requires format === internalFormat
                gl[ this.format ],
                gl[ this.type ],
                data );
        } else {
            // buffer the texture data
            gl.texImage2D(
                gl[ target ],
                0, // mip-map level
                gl[ this.format ], // webgl requires format === internalFormat
                this.width,
                this.height,
                0, // border, must be 0
                gl[ this.format ],
                gl[ this.type ],
                data );
        }
        // track that face was buffered
        if ( this.bufferedFaces.indexOf( target ) < 0 ) {
            this.bufferedFaces.push( target );
        }
        // if all faces buffered, generate mipmaps
        if ( this.mipMap && this.bufferedFaces.length === 6 ) {
            // only generate mipmaps if all faces are buffered
            gl.generateMipmap( gl.TEXTURE_CUBE_MAP );
        }
        this.pop();
        return this;
    };

    /**
     * Set the texture parameters.
     * @memberof TextureCubeMap
     *
     * @param {Object} params - The parameters by name.
     * @param {String} params.wrap - The wrapping type over both S and T dimension.
     * @param {String} params.wrapS - The wrapping type over the S dimension.
     * @param {String} params.wrapT - The wrapping type over the T dimension.
     * @param {String} params.filter - The min / mag filter used during scaling.
     * @param {String} params.minFilter - The minification filter used during scaling.
     * @param {String} params.magFilter - The magnification filter used during scaling.
     *
     * @returns {TextureCubeMap} The texture object, for chaining.
     */
    TextureCubeMap.prototype.setParameters = function( params ) {
        var gl = this.gl;
        this.push();
        // set wrap S parameter
        var param = params.wrapS || params.wrap;
        if ( param ) {
            if ( WRAP_MODES[ param ] ) {
                this.wrapS = param;
                gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl[ this.wrapS ] );
            } else {
                throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_WRAP_S`';
            }
        }
        // set wrap T parameter
        param = params.wrapT || params.wrap;
        if ( param ) {
            if ( WRAP_MODES[ param ] ) {
                this.wrapT = param;
                gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl[ this.wrapT ] );
            } else {
                throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_WRAP_T`';
            }
        }
        // set mag filter parameter
        param = params.magFilter || params.filter;
        if ( param ) {
            if ( MAG_FILTERS[ param ] ) {
                this.magFilter = param;
                gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl[ this.magFilter ] );
            } else {
                throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_MAG_FILTER`';
            }
        }
        // set min filter parameter
        param = params.minFilter || params.filter;
        if ( param ) {
            if ( this.mipMap ) {
                if ( NON_MIPMAP_MIN_FILTERS[ param ] ) {
                    // upgrade to mip-map min filter
                    param += DEFAULT_MIPMAP_MIN_FILTER_SUFFIX;
                }
                if ( MIPMAP_MIN_FILTERS[ param ] ) {
                    this.minFilter = param;
                    gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl[ this.minFilter ] );
                } else  {
                    throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_MIN_FILTER`';
                }
            } else {
                if ( MIN_FILTERS[ param ] ) {
                    this.minFilter = param;
                    gl.texParameteri( gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl[ this.minFilter ] );
                } else {
                    throw 'Texture parameter `' + param + '` is not a valid value for `TEXTURE_MIN_FILTER`';
                }
            }
        }
        this.pop();
        return this;
    };

    module.exports = TextureCubeMap;

}());

},{"../util/Async":16,"../util/ImageLoader":17,"../util/Util":20,"./WebGLContext":13,"./WebGLContextState":14}],10:[function(require,module,exports){
(function () {

    'use strict';

    var WebGLContext = require('./WebGLContext');
    var WebGLContextState = require('./WebGLContextState');
    var VertexPackage = require('./VertexPackage');
    var MODES = {
        POINTS: true,
        LINES: true,
        LINE_STRIP: true,
        LINE_LOOP: true,
        TRIANGLES: true,
        TRIANGLE_STRIP: true,
        TRIANGLE_FAN: true
    };
    var TYPES = {
        FLOAT: true
    };
    var BYTES_PER_TYPE = {
        FLOAT: 4
    };
    var BYTES_PER_COMPONENT = BYTES_PER_TYPE.FLOAT;
    var SIZES = {
        1: true,
        2: true,
        3: true,
        4: true
    };

    /**
     * The default render mode (primitive type).
     */
    var DEFAULT_MODE = 'TRIANGLES';

    /**
     * The default byte offset to render from.
     */
    var DEFAULT_BYTE_OFFSET = 0;

    /**
     * The default count of indices to render.
     */
    var DEFAULT_COUNT = 0;

    /**
     * Parse the attribute pointers and determine the byte stride of the buffer.
     * @private
     *
     * @param {Object} attributePointers - The attribute pointer map.
     *
     * @returns {number} - The byte stride of the buffer.
     */
    function getStride( attributePointers ) {
        // if there is only one attribute pointer assigned to this buffer,
        // there is no need for stride, set to default of 0
        var indices = Object.keys( attributePointers );
        if ( indices.length === 1 ) {
            return 0;
        }
        var maxByteOffset = 0;
        var byteSizeSum = 0;
        var byteStride = 0;
        indices.forEach( function( index ) {
            var pointer = attributePointers[ index ];
            var byteOffset = pointer.byteOffset;
            var size = pointer.size;
            var type = pointer.type;
            // track the sum of each attribute size
            byteSizeSum += size * BYTES_PER_TYPE[ type ];
            // track the largest offset to determine the byte stride of the buffer
            if ( byteOffset > maxByteOffset ) {
                maxByteOffset = byteOffset;
                byteStride = byteOffset + ( size * BYTES_PER_TYPE[ type ] );
            }
        });
        // check if the max byte offset is greater than or equal to the the sum of
        // the sizes. If so this buffer is not interleaved and does not need a
        // stride.
        if ( maxByteOffset >= byteSizeSum ) {
            // TODO: test what stride === 0 does for an interleaved buffer of
            // length === 1.
            return 0;
        }
        return byteStride;
    }

    /**
     * Parse the attribute pointers to ensure they are valid.
     * @private
     *
     * @param {Object} attributePointers - The attribute pointer map.
     *
     * @returns {Object} - The validated attribute pointer map.
     */
    function getAttributePointers( attributePointers ) {
        // ensure there are pointers provided
        if ( !attributePointers || Object.keys( attributePointers ).length === 0 ) {
            throw 'VertexBuffer requires attribute pointers to be specified upon instantiation';
        }
        // parse pointers to ensure they are valid
        var pointers = {};
        Object.keys( attributePointers ).forEach( function( key ) {
            var index = parseInt( key, 10 );
            // check that key is an valid integer
            if ( isNaN( index ) ) {
                throw 'Attribute index `' + key + '` does not represent an integer';
            }
            var pointer = attributePointers[key];
            var size = pointer.size;
            var type = pointer.type;
            var byteOffset = pointer.byteOffset;
            // check size
            if ( !SIZES[ size ] ) {
                throw 'Attribute pointer `size` parameter is invalid, must be one of ' +
                    JSON.stringify( Object.keys( SIZES ) );
            }
            // check type
            if ( !TYPES[ type ] ) {
                throw 'Attribute pointer `type` parameter is invalid, must be one of ' +
                    JSON.stringify( Object.keys( TYPES ) );
            }
            pointers[ index ] = {
                size: size,
                type: type,
                byteOffset: ( byteOffset !== undefined ) ? byteOffset : DEFAULT_BYTE_OFFSET
            };
        });
        return pointers;
    }

    /**
     * Return the number of components in the buffer.
     * @private
     *
     * @param {Object} attributePointers - The attribute pointer map.
     *
     * @returns {number} - The number of components in the buffer.
     */
    function getNumComponents( attributePointers ) {
        var size = 0;
        Object.keys( attributePointers ).forEach( function( index ) {
            size += attributePointers[ index ].size;
        });
        return size;
    }

    /**
     * Instantiates an VertexBuffer object.
     * @class VertexBuffer
     * @classdesc A vertex buffer object.
     *
     * @param {Array|Float32Array|VertexPackage|number} arg - The buffer or length of the buffer.
     * @param {Object} attributePointers - The array pointer map, or in the case of a vertex package arg, the options.
     * @param {Object} options - The rendering options.
     * @param {String} options.mode - The draw mode / primitive type.
     * @param {String} options.byteOffset - The byte offset into the drawn buffer.
     * @param {String} options.count - The number of indices to draw.
     */
    function VertexBuffer( arg, attributePointers, options ) {
        options = options || {};
        var gl = this.gl = WebGLContext.get();
        this.state = WebGLContextState.get( gl );
        this.buffer = gl.createBuffer();
        this.mode = MODES[ options.mode ] ? options.mode : DEFAULT_MODE;
        this.count = ( options.count !== undefined ) ? options.count : DEFAULT_COUNT;
        this.byteOffset = ( options.byteOffset !== undefined ) ? options.byteOffset : DEFAULT_BYTE_OFFSET;
        this.byteLength = 0;
        // first, set the attribute pointers
        if ( arg instanceof VertexPackage ) {
            // VertexPackage argument, use its attribute pointers
            this.pointers = arg.pointers;
            // shift options arg since there will be no attrib pointers arg
            options = attributePointers || {};
        } else {
            this.pointers = getAttributePointers( attributePointers );
        }
        // set the byte stride
        this.byteStride = getStride( this.pointers );
        // then buffer the data
        if ( arg ) {
            if ( arg instanceof VertexPackage ) {
                // VertexPackage argument
                this.bufferData( arg.buffer );
            } else if ( arg instanceof WebGLBuffer ) {
                // WebGLBuffer argument
                if ( options.byteLength === undefined ) {
                    throw 'Argument of type `WebGLBuffer` must be complimented with a corresponding `options.byteLength`';
                }
                this.byteLength = options.byteLength;
                this.buffer = arg;
            } else {
                // Array or ArrayBuffer or number argument
                this.bufferData( arg );
            }
        }
        // ensure there isn't an overflow
        var bytesPerCount = BYTES_PER_COMPONENT * getNumComponents( this.pointers );
        if ( this.count * bytesPerCount + this.byteOffset > this.byteLength ) {
            throw 'VertexBuffer `count` of ' + this.count + ' and `byteOffset` of ' + this.byteOffset + ' overflows the total byte length of the buffer (' + this.byteLength + ')';
        }
    }

    /**
     * Upload vertex data to the GPU.
     * @memberof VertexBuffer
     *
     * @param {Array|ArrayBuffer|ArrayBufferView|number} arg - The array of data to buffer, or size of the buffer in bytes.
     *
     * @returns {VertexBuffer} The vertex buffer object for chaining.
     */
    VertexBuffer.prototype.bufferData = function( arg ) {
        var gl = this.gl;
        if ( arg instanceof Array ) {
            // cast array into ArrayBufferView
            arg = new Float32Array( arg );
        } else if (
            !( arg instanceof ArrayBuffer ) &&
            !( arg instanceof Float32Array ) &&
            typeof arg !== 'number' ) {
            // if not arraybuffer or a numeric size
            throw 'Argument must be of type `Array`, `ArrayBuffer`, `ArrayBufferView`, or `number`';
        }
        // don't overwrite the count if it is already set
        if ( this.count === DEFAULT_COUNT ) {
            // get the total number of attribute components from pointers
            var numComponents = getNumComponents( this.pointers );
            // set count based on size of buffer and number of components
            if ( typeof arg === 'number' ) {
                this.count = ( arg / BYTES_PER_COMPONENT ) / numComponents;
            } else {
                this.count = arg.length / numComponents;
            }
        }
        // set byte length
        if ( typeof arg === 'number' ) {
            if ( arg % BYTES_PER_COMPONENT ) {
                throw 'Byte length must be multiple of ' + BYTES_PER_COMPONENT;
            }
            this.byteLength = arg;
        } else {
            this.byteLength = arg.length * BYTES_PER_COMPONENT;
        }
        // buffer the data
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
        gl.bufferData( gl.ARRAY_BUFFER, arg, gl.STATIC_DRAW );
    };

    /**
     * Upload partial vertex data to the GPU.
     * @memberof VertexBuffer
     *
     * @param {Array|ArrayBuffer|ArrayBufferView} array - The array of data to buffer.
     * @param {number} byteOffset - The byte offset at which to buffer.
     *
     * @returns {VertexBuffer} The vertex buffer object for chaining.
     */
    VertexBuffer.prototype.bufferSubData = function( array, byteOffset ) {
        var gl = this.gl;
        if ( this.byteLength === 0 ) {
            throw 'Buffer has not yet been allocated';
        }
        if ( array instanceof Array ) {
            array = new Float32Array( array );
        } else if ( !( array instanceof ArrayBuffer ) && !ArrayBuffer.isView( array ) ) {
            throw 'Argument must be of type `Array`, `ArrayBuffer`, or `ArrayBufferView`';
        }
        byteOffset = ( byteOffset !== undefined ) ? byteOffset : DEFAULT_BYTE_OFFSET;
        // get the total number of attribute components from pointers
        var byteLength = array.length * BYTES_PER_COMPONENT;
        if ( byteOffset + byteLength > this.byteLength ) {
            throw 'Argument of length ' + byteLength + ' bytes and offset of ' + byteOffset + ' bytes overflows the buffer length of ' + this.byteLength + ' bytes';
        }
        gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
        gl.bufferSubData( gl.ARRAY_BUFFER, byteOffset, array );
        return this;
    };

    /**
     * Binds the vertex buffer object.
     * @memberof VertexBuffer
     *
     * @returns {VertexBuffer} Returns the vertex buffer object for chaining.
     */
    VertexBuffer.prototype.bind = function() {
        var gl = this.gl;
        var state = this.state;
        // cache this vertex buffer
        if ( state.boundVertexBuffer !== this.buffer ) {
            // bind buffer
            gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
            state.boundVertexBuffer = this.buffer;
        }
        var pointers = this.pointers;
        var byteStride = this.byteStride;
        Object.keys( pointers ).forEach( function( index ) {
            var pointer = pointers[ index ];
            // set attribute pointer
            gl.vertexAttribPointer(
                index,
                pointer.size,
                gl[ pointer.type ],
                false,
                byteStride,
                pointer.byteOffset );
            // enable attribute index
            if ( !state.enabledVertexAttributes[ index ] ) {
                gl.enableVertexAttribArray( index );
                state.enabledVertexAttributes[ index ] = true;
            }
        });
        return this;
    };

    /**
     * Unbinds the vertex buffer object.
     * @memberof VertexBuffer
     *
     * @returns {VertexBuffer} Returns the vertex buffer object for chaining.
     */
    VertexBuffer.prototype.unbind = function() {
        var gl = this.gl;
        var state = this.state;
        // only bind if it already isn't bound
        if ( state.boundVertexBuffer !== this.buffer ) {
            // bind buffer
            gl.bindBuffer( gl.ARRAY_BUFFER, this.buffer );
            state.boundVertexBuffer = this.buffer;
        }
        Object.keys( this.pointers ).forEach( function( index ) {
            // disable attribute index
            if ( state.enabledVertexAttributes[ index ] ) {
                gl.disableVertexAttribArray( index );
                state.enabledVertexAttributes[ index ] = false;
            }
        });
        return this;
    };

    /**
     * Execute the draw command for the bound buffer.
     * @memberof VertexBuffer
     *
     * @param {Object} options - The options to pass to 'drawArrays'. Optional.
     * @param {String} options.mode - The draw mode / primitive type.
     * @param {String} options.byteOffset - The byte offset into the drawn buffer.
     * @param {String} options.count - The number of indices to draw.
     *
     * @returns {VertexBuffer} Returns the vertex buffer object for chaining.
     */
    VertexBuffer.prototype.draw = function( options ) {
        options = options || {};
        if ( this.state.boundVertexBuffer !== this.buffer ) {
            throw 'Attempting to draw an unbound VertexBuffer';
        }
        var gl = this.gl;
        var mode = gl[ options.mode || this.mode ];
        var byteOffset = ( options.byteOffset !== undefined ) ? options.byteOffset : this.byteOffset;
        var count = ( options.count !== undefined ) ? options.count : this.count;
        if ( count === 0 ) {
            throw 'Attempting to draw with a count of 0';
        }
        var bytesPerCount = BYTES_PER_COMPONENT * getNumComponents( this.pointers );
        if ( count * bytesPerCount + byteOffset > this.byteLength ) {
            throw 'Attempting to draw with `count` of ' + count + ' and `offset` of ' + byteOffset + ' overflows the total byte length of the buffer (' + this.byteLength + ')';
        }
        // draw elements
        gl.drawArrays( mode, byteOffset, count );
        return this;
    };

    module.exports = VertexBuffer;

}());

},{"./VertexPackage":11,"./WebGLContext":13,"./WebGLContextState":14}],11:[function(require,module,exports){
(function () {

    'use strict';

    var Util = require('../util/Util');
    var COMPONENT_TYPE = 'FLOAT';
    var BYTES_PER_COMPONENT = 4;

    /**
     * Removes invalid attribute arguments. A valid argument must be an Array of length > 0 key by a string representing an int.
     * @private
     *
     * @param {Object} attributes - The map of vertex attributes.
     *
     * @returns {Array} The valid array of arguments.
     */
    function parseAttributeMap( attributes ) {
        var goodAttributes = [];
        Object.keys( attributes ).forEach( function( key ) {
            var index = parseFloat( key );
            // check that key is an valid integer
            if ( !Util.isInteger( index ) || index < 0 ) {
                throw 'Attribute index `' + key + '` does not represent a valid integer';
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
                throw 'Error parsing attribute of index `' + key + '`';
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
     * @private
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
        // default to 1 otherwise
        return 1;
    }

    /**
     * Calculates the type, size, and offset for each attribute in the attribute array along with the length and stride of the package.
     * @private
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
                byteOffset : offset * BYTES_PER_COMPONENT
            };
            // accumulate attribute offset
            offset += size;
        });
        // set stride to total offset
        vertexPackage.byteStride = offset * BYTES_PER_COMPONENT;
        // set length of package to the shortest attribute array length
        vertexPackage.length = shortestArray;
    }

    /**
     * Fill the arraybuffer with a single component attribute.
     * @private
     *
     * @param {Float32Array} buffer - The arraybuffer to fill.
     * @param {Array} vertices - The vertex attribute array to copy from.
     * @param {number} length - The length of the buffer to copy from.
     * @param {number} offset - The offset to the attribute.
     * @param {number} stride - The of stride of the buffer.
     */
    function set1ComponentAttr( buffer, vertices, length, offset, stride ) {
        var vertex, i, j;
        for ( i=0; i<length; i++ ) {
            vertex = vertices[i];
            // get the index in the buffer to the particular vertex
            j = offset + ( stride * i );
            if ( vertex.x !== undefined ) {
                buffer[j] = vertex.x;
            } else if ( vertex[0] !== undefined ) {
                buffer[j] = vertex[0];
            } else {
                buffer[j] = vertex;
            }
        }
    }

    /**
     * Fill the arraybuffer with a double component attribute.
     * @private
     *
     * @param {Float32Array} buffer - The arraybuffer to fill.
     * @param {Array} vertices - The vertex attribute array to copy from.
     * @param {number} length - The length of the buffer to copy from.
     * @param {number} offset - The offset to the attribute.
     * @param {number} stride - The of stride of the buffer.
     */
    function set2ComponentAttr( buffer, vertices, length, offset, stride ) {
        var vertex, i, j;
        for ( i=0; i<length; i++ ) {
            vertex = vertices[i];
            // get the index in the buffer to the particular vertex
            j = offset + ( stride * i );
            buffer[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
            buffer[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
        }
    }

    /**
     * Fill the arraybuffer with a triple component attribute.
     * @private
     *
     * @param {Float32Array} buffer - The arraybuffer to fill.
     * @param {Array} vertices - The vertex attribute array to copy from.
     * @param {number} length - The length of the buffer to copy from.
     * @param {number} offset - The offset to the attribute.
     * @param {number} stride - The of stride of the buffer.
     */
    function set3ComponentAttr( buffer, vertices, length, offset, stride ) {
        var vertex, i, j;
        for ( i=0; i<length; i++ ) {
            vertex = vertices[i];
            // get the index in the buffer to the particular vertex
            j = offset + ( stride * i );
            buffer[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
            buffer[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
            buffer[j+2] = ( vertex.z !== undefined ) ? vertex.z : vertex[2];
        }
    }

    /**
     * Fill the arraybuffer with a quadruple component attribute.
     * @private
     *
     * @param {Float32Array} buffer - The arraybuffer to fill.
     * @param {Array} vertices - The vertex attribute array to copy from.
     * @param {number} length - The length of the buffer to copy from.
     * @param {number} offset - The offset to the attribute.
     * @param {number} stride - The of stride of the buffer.
     */
    function set4ComponentAttr( buffer, vertices, length, offset, stride ) {
        var vertex, i, j;
        for ( i=0; i<length; i++ ) {
            vertex = vertices[i];
            // get the index in the buffer to the particular vertex
            j = offset + ( stride * i );
            buffer[j] = ( vertex.x !== undefined ) ? vertex.x : vertex[0];
            buffer[j+1] = ( vertex.y !== undefined ) ? vertex.y : vertex[1];
            buffer[j+2] = ( vertex.z !== undefined ) ? vertex.z : vertex[2];
            buffer[j+3] = ( vertex.w !== undefined ) ? vertex.w : vertex[3];
        }
    }

    /**
     * Instantiates an VertexPackage object.
     * @class VertexPackage
     * @classdesc A vertex package object.
     *
     * @param {Object} attributes - The attributes to interleave keyed by index.
     */
    function VertexPackage( attributes ) {
        if ( attributes !== undefined ) {
            this.set( attributes );
        } else {
            this.buffer = new Float32Array(0);
            this.pointers = {};
        }
    }

    /**
     * Set the data to be interleaved inside the package. This clears any previously existing data.
     * @memberof VertexPackage
     *
     * @param {Object} attributes - The attributes to interleaved, keyed by index.
     *
     * @returns {VertexPackage} - The vertex package object, for chaining.
     */
    VertexPackage.prototype.set = function( attributes ) {
        // remove bad attributes
        attributes = parseAttributeMap( attributes );
        // set attribute pointers and stride
        setPointersAndStride( this, attributes );
        // set size of data vector
        var length = this.length;
        var stride = this.byteStride / BYTES_PER_COMPONENT;
        var pointers = this.pointers;
        var buffer = this.buffer = new Float32Array( length * stride );
        // for each vertex attribute array
        attributes.forEach( function( vertices ) {
            // get the pointer
            var pointer = pointers[ vertices.index ];
            // get the pointers offset
            var offset = pointer.byteOffset / BYTES_PER_COMPONENT;
            // copy vertex data into arraybuffer
            switch ( pointer.size ) {
                case 2:
                    set2ComponentAttr( buffer, vertices.data, length, offset, stride );
                    break;
                case 3:
                    set3ComponentAttr( buffer, vertices.data, length, offset, stride );
                    break;
                case 4:
                    set4ComponentAttr( buffer, vertices.data, length, offset, stride );
                    break;
                default:
                    set1ComponentAttr( buffer, vertices.data, length, offset, stride );
                    break;
            }
        });
        return this;
    };

    module.exports = VertexPackage;

}());

},{"../util/Util":20}],12:[function(require,module,exports){
(function() {

    'use strict';

    var WebGLContext = require('./WebGLContext');
    var WebGLContextState = require('./WebGLContextState');

    /**
     * Bind the viewport to the rendering context.
     *
     * @param {Viewport} viewport - The viewport object.
     * @param {number} width - The width override.
     * @param {number} height - The height override.
     * @param {number} x - The horizontal offset.
     * @param {number} y - The vertical offset.
     */
    function set( viewport, x, y, width, height ) {
        var gl = viewport.gl;
        x = ( x !== undefined ) ? x : 0;
        y = ( y !== undefined ) ? y : 0;
        width = ( width !== undefined ) ? width : viewport.width;
        height = ( height !== undefined ) ? height : viewport.height;
        gl.viewport( x, y, width, height );
    }

    /**
     * Instantiates an Viewport object.
     * @class Viewport
     * @classdesc A viewport object.
     *
     * @param {Object} spec - The viewport specification object.
     * @param {number} spec.width - The width of the viewport.
     * @param {number} spec.height - The height of the viewport.
     */
    function Viewport( spec ) {
        spec = spec || {};
        this.gl = WebGLContext.get();
        this.state = WebGLContextState.get( this.gl );
        // set size
        this.resize(
            spec.width || this.gl.canvas.width,
            spec.height || this.gl.canvas.height );
    }

    /**
     * Updates the viewports width and height. This resizes the underlying canvas element.
     * @memberof Viewport
     *
     * @param {number} width - The width of the viewport.
     * @param {number} height - The height of the viewport.
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
    Viewport.prototype.resize = function( width, height ) {
        if ( typeof width !== 'number' || ( width <= 0 ) ) {
            throw 'Provided `width` of ' + width + ' is invalid';
        }
        if ( typeof height !== 'number' || ( height <= 0 ) ) {
            throw 'Provided `height` of ' + height + ' is invalid';
        }
        this.width = width;
        this.height = height;
        this.gl.canvas.width = width;
        this.gl.canvas.height = height;
        return this;
    };

    /**
     * Activates the viewport and pushes it onto the stack with the provided arguments. The underlying canvas element is not affected.
     * @memberof Viewport
     *
     * @param {number} width - The width override.
     * @param {number} height - The height override.
     * @param {number} x - The horizontal offset override.
     * @param {number} y - The vertical offset override.
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
    Viewport.prototype.push = function( x, y, width, height ) {
        if ( x !== undefined && typeof x !== 'number' ) {
            throw 'Provided `x` of ' + x + ' is invalid';
        }
        if ( y !== undefined && typeof y !== 'number' ) {
            throw 'Provided `y` of ' + y + ' is invalid';
        }
        if ( width !== undefined && ( typeof width !== 'number' || ( width <= 0 ) ) ) {
            throw 'Provided `width` of ' + width + ' is invalid';
        }
        if ( height !== undefined && ( typeof height !== 'number' || ( height <= 0 ) ) ) {
            throw 'Provided `height` of ' + height + ' is invalid';
        }
        this.state.viewports.push({
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
     * Pops current the viewport object and activates the viewport beneath it.
     * @memberof Viewport
     *
     * @returns {Viewport} The viewport object, for chaining.
     */
    Viewport.prototype.pop = function() {
        var state = this.state;
        var top = state.viewports.top();
        if ( !top || this !== top.viewport ) {
            throw 'Viewport is not the top most element on the stack';
        }
        state.viewports.pop();
        top = state.viewports.top();
        if ( top ) {
            set( top.viewport, top.x, top.y, top.width, top.height );
        } else {
            set( this );
        }
        return this;
    };

    module.exports = Viewport;

}());

},{"./WebGLContext":13,"./WebGLContextState":14}],13:[function(require,module,exports){
(function() {

    'use strict';

    var EXTENSIONS = [
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
        'EXT_frag_depth',
        'WEBGL_draw_buffers',
        'ANGLE_instanced_arrays',
        'OES_texture_float_linear',
        'OES_texture_half_float_linear',
        'EXT_blend_minmax',
        'EXT_shader_texture_lod',
        // community
        'WEBGL_compressed_texture_atc',
        'WEBGL_compressed_texture_pvrtc',
        'EXT_color_buffer_half_float',
        'WEBGL_color_buffer_float',
        'EXT_sRGB',
        'WEBGL_compressed_texture_etc1'
    ];
    var _boundContext = null;
    var _contexts = {};

    /**
     * Returns an rfc4122 version 4 compliant UUID.
     * @private
     *
     * @returns {String} The UUID string.
     */
    function getUUID() {
        var replace = function( c ) {
            var r = Math.random() * 16 | 0;
            var v = ( c === 'x' ) ? r : ( r & 0x3 | 0x8 );
            return v.toString( 16 );
        };
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, replace );
    }

    /**
     * Returns the id of the HTMLCanvasElement element. If there is no id, it
     * generates one and appends it.
     * @private
     *
     * @param {HTMLCanvasElement} canvas - The Canvas object.
     *
     * @returns {String} The Canvas id string.
     */
    function getId( canvas ) {
        if ( !canvas.id ) {
            canvas.id = getUUID();
        }
        return canvas.id;
    }

    /**
     * Returns a Canvas element object from either an existing object, or identification string.
     * @private
     *
     * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas id or selector string.
     *
     * @returns {HTMLCanvasElement} The Canvas element object.
     */
    function getCanvas( arg ) {
        if ( arg instanceof HTMLCanvasElement ) {
            return arg;
        } else if ( typeof arg === 'string' ) {
            return document.getElementById( arg ) ||
                document.querySelector( arg );
        }
        return null;
    }

    /**
     * Attempts to retreive a wrapped WebGLRenderingContext.
     * @private
     *
     * @param {HTMLCanvasElement} The Canvas element object to create the context under.
     *
     * @returns {Object} The context wrapper.
     */
    function getContextWrapper( arg ) {
        if ( arg === undefined ) {
            if ( _boundContext ) {
                // return last bound context
                return _boundContext;
            }
        } else {
            var canvas = getCanvas( arg );
            if ( canvas ) {
                return _contexts[ getId( canvas ) ];
            }
        }
        // no bound context or argument
        return null;
    }

    /**
     * Attempts to load all known extensions for a provided WebGLRenderingContext. Stores the results in the context wrapper for later queries.
     * @private
     *
     * @param {Object} contextWrapper - The context wrapper.
     */
    function loadExtensions( contextWrapper ) {
        var gl = contextWrapper.gl;
        EXTENSIONS.forEach( function( id ) {
            contextWrapper.extensions[ id ] = gl.getExtension( id );
        });
    }

    /**
     * Attempts to create a WebGLRenderingContext wrapped inside an object which will also store the extension query results.
     * @private
     *
     * @param {HTMLCanvasElement} The Canvas element object to create the context under.
     * @param {Object}} options - Parameters to the webgl context, only used during instantiation. Optional.
     *
     * @returns {Object} The context wrapper.
     */
    function createContextWrapper( canvas, options ) {
        var gl = canvas.getContext( 'webgl', options ) || canvas.getContext( 'experimental-webgl', options );
        // wrap context
        var contextWrapper = {
            id: getId( canvas ),
            gl: gl,
            extensions: {}
        };
        // load WebGL extensions
        loadExtensions( contextWrapper );
        // add context wrapper to map
        _contexts[ getId( canvas ) ] = contextWrapper;
        // bind the context
        _boundContext = contextWrapper;
        return contextWrapper;
    }

    module.exports = {

        /**
         * Retrieves an existing WebGL context associated with the provided argument and binds it. While bound, the active context will be used implicitly by any instantiated `esper` constructs.
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
            throw 'No context exists for provided argument `' + arg + '`';
        },

        /**
         * Retrieves an existing WebGL context associated with the provided argument. If no context exists, one is created.
         * During creation attempts to load all extensions found at: https://www.khronos.org/registry/webgl/extensions/.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         * @param {Object}} options - Parameters to the webgl context, only used during instantiation. Optional.
         *
         * @returns {WebGLRenderingContext} The WebGLRenderingContext object.
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
            if ( !canvas ) {
                throw 'Context could not be associated with argument of type `' + ( typeof arg ) + '`';
            }
            // create context
            return createContextWrapper( canvas, options ).gl;
        },

        /**
         * Removes an existing WebGL context object for the provided or currently bound object.
         *
         * @param {HTMLCanvasElement|String} arg - The Canvas object or Canvas identification string. Optional.
         * @param {Object}} options - Parameters to the webgl context, only used during instantiation. Optional.
         *
         * @returns {WebGLRenderingContext} The WebGLRenderingContext object.
         */
        remove: function( arg ) {
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                // delete the context
                delete _contexts[ wrapper.id ];
                // remove if currently bound
                if ( wrapper === _boundContext ) {
                    _boundContext = null;
                }
            } else {
                throw 'Context could not be found or deleted for argument of type `' + ( typeof arg ) + '`';
            }
        },

        /**
         * Returns an array of all supported extensions for the provided or currently bound context object. If no context is bound, it will return an empty array.
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
                Object.keys( extensions ).forEach( function( key ) {
                    if ( extensions[ key ] ) {
                        supported.push( key );
                    }
                });
                return supported;
            }
            throw 'No context is currently bound or could be associated with the provided argument';
        },

        /**
         * Returns an array of all unsupported extensions for the provided or currently bound context object. If no context is bound, it will return an empty array.
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
                Object.keys( extensions ).forEach( function( key ) {
                    if ( !extensions[ key ] ) {
                        unsupported.push( key );
                    }
                });
                return unsupported;
            }
            throw 'No context is currently bound or could be associated with the provided argument';
        },

        /**
         * Checks if an extension has been successfully loaded for the provided or currently bound context object.
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
                arg = undefined;
            }
            var wrapper = getContextWrapper( arg );
            if ( wrapper ) {
                var extensions = wrapper.extensions;
                return extensions[ extension ] ? true : false;
            }
            throw 'No context is currently bound or could be associated with the provided argument';
        }
    };

}());

},{}],14:[function(require,module,exports){
(function() {

    'use strict';

    var Stack = require('../util/Stack');
    var StackMap = require('../util/StackMap');
    var _states = {};

    function WebGLContextState() {
        /**
         * The currently bound vertex buffer.
         * @private
         */
        this.boundVertexBuffer = null;

        /**
         * The currently enabled vertex attributes.
         * @private
         */
        this.enabledVertexAttributes = {
            '0': false,
            '1': false,
            '2': false,
            '3': false,
            '4': false,
            '5': false
            // ... others will be added as needed
        };

        /**
         * The currently bound index buffer.
         * @private
         */
        this.boundIndexBuffer = null;

        /**
         * The stack of pushed shaders.
         * @private
         */
        this.shaders = new Stack();

        /**
         * The stack of pushed viewports.
         * @private
         */
        this.viewports = new Stack();

        /**
         * The stack of pushed render targets.
         * @private
         */
        this.renderTargets = new Stack();

        /**
         * The map of stacks pushed texture2Ds, keyed by texture unit index.
         * @private
         */
        this.texture2Ds = new StackMap();

        /**
         * The map of pushed texture2Ds,, keyed by texture unit index.
         * @private
         */
        this.textureCubeMaps = new StackMap();
    }

    module.exports = {

        get: function( gl ) {
            var id = gl.canvas.id;
            if ( !_states[ id ] ) {
                _states[ id ] = new WebGLContextState();
            }
            return _states[ id ];
        }

    };

}());

},{"../util/Stack":18,"../util/StackMap":19}],15:[function(require,module,exports){
(function () {

    'use strict';

    module.exports = {
        IndexBuffer: require('./core/IndexBuffer'),
        Renderable: require('./core/Renderable'),
        RenderTarget: require('./core/RenderTarget'),
        Shader: require('./core/Shader'),
        Texture2D: require('./core/Texture2D'),
        ColorTexture2D: require('./core/ColorTexture2D'),
        DepthTexture2D: require('./core/DepthTexture2D'),
        TextureCubeMap: require('./core/TextureCubeMap'),
        VertexBuffer: require('./core/VertexBuffer'),
        VertexPackage: require('./core/VertexPackage'),
        Viewport: require('./core/Viewport'),
        WebGLContext: require('./core/WebGLContext')
    };

}());

},{"./core/ColorTexture2D":1,"./core/DepthTexture2D":2,"./core/IndexBuffer":3,"./core/RenderTarget":4,"./core/Renderable":5,"./core/Shader":6,"./core/Texture2D":8,"./core/TextureCubeMap":9,"./core/VertexBuffer":10,"./core/VertexPackage":11,"./core/Viewport":12,"./core/WebGLContext":13}],16:[function(require,module,exports){
(function () {

    'use strict';

    function getIterator( arg ) {
        var i = -1;
        var len;
        if ( Array.isArray( arg ) ) {
            len = arg.length;
            return function() {
                i++;
                return i < len ? i : null;
            };
        }
        var keys = Object.keys( arg );
        len = keys.length;
        return function() {
            i++;
            return i < len ? keys[i] : null;
        };
    }

    function once( fn ) {
        return function() {
            if ( fn === null ) {
                return;
            }
            fn.apply( this, arguments );
            fn = null;
        };
    }

    function each( object, iterator, callback ) {
        callback = once( callback );
        var key;
        var completed = 0;

        function done( err ) {
            completed--;
            if ( err ) {
                callback( err );
            } else if ( key === null && completed <= 0 ) {
                // check if key is null in case iterator isn't exhausted and done
                // was resolved synchronously.
                callback( null );
            }
        }

        var iter = getIterator(object);
        while ( ( key = iter() ) !== null ) {
            completed += 1;
            iterator( object[ key ], key, done );
        }
        if ( completed === 0 ) {
            callback( null );
        }
    }

    module.exports = {

        /**
         * Execute a set of functions asynchronously, once all have been
         * completed, execute the provided callback function. Jobs may be passed
         * as an array or object. The callback function will be passed the
         * results in the same format as the tasks. All tasks must have accept
         * and execute a callback function upon completion.
         *
         * @param {Array|Object} tasks - The set of functions to execute.
         * @param {Function} callback - The callback function to be executed upon completion.
         */
        parallel: function (tasks, callback) {
            var results = Array.isArray( tasks ) ? [] : {};
            each( tasks, function( task, key, done ) {
                task( function( err, res ) {
                    results[ key ] = res;
                    done( err );
                });
            }, function( err ) {
                callback( err, results );
            });
        }

    };

}());

},{}],17:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        /**
         * Sends an GET request create an Image object.
         *
         * @param {Object} options - The XHR options.
         * @param {String} options.url - The URL for the resource.
         * @param {Function} options.success - The success callback function.
         * @param {Function} options.error - The error callback function.
         */
        load: function ( options ) {
            var image = new Image();
            image.onload = function() {
                if ( options.success ) {
                    options.success( image );
                }
            };
            image.onerror = function( event ) {
                if ( options.error ) {
                    var err = 'Unable to load image from URL: `' + event.path[0].currentSrc + '`';
                    options.error( err );
                }
            };
            image.src = options.url;
        }
    };

}());

},{}],18:[function(require,module,exports){
(function () {

    'use strict';

    /**
     * Instantiates a stack object.
     * @class Stack
     * @classdesc A stack interface.
     */
    function Stack() {
        this.data = [];
    }

    /**
     * Push a value onto the stack.
     *
     * @param {*} value - The value.
     *
     * @returns The stack object for chaining.
     */
    Stack.prototype.push = function( value ) {
        this.data.push( value );
        return this;
    };

    /**
     * Pop a value off the stack. Returns `undefined` if there is no value on
     * the stack.
     *
     * @param {*} value - The value.
     *
     * @returns The value popped off the stack.
     */
    Stack.prototype.pop = function() {
        return this.data.pop();
    };

    /**
     * Returns the current top of the stack, without removing it. Returns
     * `undefined` if there is no value on the stack.
     *
     * @returns The value at the top of the stack.
     */
    Stack.prototype.top = function() {
        var index = this.data.length - 1;
        if ( index < 0 ) {
            return;
        }
        return this.data[ index ];
    };

    module.exports = Stack;

}());

},{}],19:[function(require,module,exports){
(function () {

    'use strict';

    var Stack = require('./Stack');

    /**
     * Instantiates a map of stack objects.
     * @class StackMap
     * @classdesc A hashmap of stacks.
     */
    function StackMap() {
        this.stacks = {};
    }

    /**
     * Push a value onto the stack under a given key.
     *
     * @param {String} key - The key.
     * @param {*} value - The value to push onto the stack.
     *
     * @returns The stack object for chaining.
     */
    StackMap.prototype.push = function( key, value ) {
        if ( !this.stacks[ key ] ) {
            this.stacks[ key ] = new Stack();
        }
        this.stacks[ key ].push( value );
        return this;
    };

    /**
     * Pop a value off the stack. Returns `undefined` if there is no value on
     * the stack, or there is no stack for the key.
     *
     * @param {String} key - The key.
     * @param {*} value - The value to push onto the stack.
     *
     * @returns The value popped off the stack.
     */
    StackMap.prototype.pop = function( key ) {
        if ( !this.stacks[ key ] ) {
            return;
        }
        return this.stacks[ key ].pop();
    };

    /**
     * Returns the current top of the stack, without removing it. Returns
     * `undefined` if there is no value on the stack or no stack for the key.
     *
     * @param {String} key - The key.
     *
     * @returns The value at the top of the stack.
     */
    StackMap.prototype.top = function( key ) {
        if ( !this.stacks[ key ] ) {
            return;
        }
        return this.stacks[ key ].top();
    };

    module.exports = StackMap;

}());

},{"./Stack":18}],20:[function(require,module,exports){
(function () {

    'use strict';

    var Util = {};

    /**
     * Returns true if the argument is an Array, ArrayBuffer, or ArrayBufferView.
     * @private
     *
     * @param {*} arg - The argument to test.
     *
     * @returns {bool} - Whether or not it is a canvas type.
     */
    Util.isArrayType = function( arg ) {
        return arg instanceof Array ||
            arg instanceof ArrayBuffer ||
            ArrayBuffer.isView( arg );
    };

    /**
     * Returns true if the argument is one of the WebGL `texImage2D` overridden
     * canvas types.
     *
     * @param {*} arg - The argument to test.
     *
     * @returns {bool} - Whether or not it is a canvas type.
     */
    Util.isCanvasType = function( arg ) {
        return arg instanceof ImageData ||
            arg instanceof HTMLImageElement ||
            arg instanceof HTMLCanvasElement ||
            arg instanceof HTMLVideoElement;
    };

    /**
     * Returns true if the texture MUST be a power-of-two. Otherwise return false.
     *
     * @param {Object} spec - The texture specification object.
     *
     * @returns {bool} - Whether or not the texture must be a power of two.
     */
    Util.mustBePowerOfTwo = function( spec ) {
        // According to:
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Non_power-of-two_textures
        // NPOT textures cannot be used with mipmapping and they must not "repeat"
        return spec.mipMap ||
            spec.wrapS === 'REPEAT' ||
            spec.wrapS === 'MIRRORED_REPEAT' ||
            spec.wrapT === 'REPEAT' ||
            spec.wrapT === 'MIRRORED_REPEAT';
    };

    /**
     * Returns true if the value is a number and is an integer.
     *
     * @param {integer} num - The number to test.
     *
     * @returns {boolean} - Whether or not the value is a number.
     */
    Util.isInteger = function( num ) {
        return typeof num === 'number' && ( num % 1 ) === 0;
    };

    /**
     * Returns true if the provided integer is a power of two.
     *
     * @param {integer} num - The number to test.
     *
     * @returns {boolean} - Whether or not the number is a power of two.
     */
    Util.isPowerOfTwo = function( num ) {
        return ( num !== 0 ) ? ( num & ( num - 1 ) ) === 0 : false;
    };

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
    Util.nextHighestPowerOfTwo = function( num ) {
        var i;
        if ( num !== 0 ) {
            num = num-1;
        }
        for ( i=1; i<32; i<<=1 ) {
            num = num | num >> i;
        }
        return num + 1;
    };

    /**
     * If the texture must be a POT, resizes and returns the image.
     * @private
     *
     * @param {Object} spec - The texture specification object.
     * @param {HTMLImageElement} img - The image object.
     */
    Util.resizeCanvas = function( spec, img ) {
        if ( !Util.mustBePowerOfTwo( spec ) ||
            ( Util.isPowerOfTwo( img.width ) && Util.isPowerOfTwo( img.height ) ) ) {
            return img;
        }
        // create an empty canvas element
        var canvas = document.createElement( 'canvas' );
        canvas.width = Util.nextHighestPowerOfTwo( img.width );
        canvas.height = Util.nextHighestPowerOfTwo( img.height );
        // copy the image contents to the canvas
        var ctx = canvas.getContext( '2d' );
        ctx.drawImage( img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height );
        return canvas;
    };

    module.exports = Util;

}());

},{}],21:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        /**
         * Sends an XMLHttpRequest GET request to the supplied url.
         *
         * @param {Object} options - The XHR options.
         * @param {String} options.url - The URL for the resource.
         * @param {Function} options.success - The success callback function.
         * @param {Function} options.error - The error callback function.
         * @param {Function} options.responseType - The responseType of the XHR.
         */
        load: function ( options ) {
            var request = new XMLHttpRequest();
            request.open( 'GET', options.url, true );
            request.responseType = options.responseType;
            request.onreadystatechange = function() {
                if ( request.readyState === 4 ) {
                    if ( request.status === 200 ) {
                        if ( options.success ) {
                            options.success( request.response );
                        }
                    } else {
                        if ( options.error ) {
                            options.error( 'GET ' + request.responseURL + ' ' + request.status + ' (' + request.statusText + ')' );
                        }
                    }
                }
            };
            request.send();
        }
    };

}());

},{}],22:[function(require,module,exports){
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

},{"jsonify":23}],23:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":24,"./lib/stringify":25}],24:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
(function () {

    'use strict';

    module.exports = {
        TileLayer: require('./layer/exports'),
        Renderer: require('./renderer/exports'),
        TileRequestor: require('./request/TileRequestor'),
        MetaRequestor: require('./request/MetaRequestor')
    };

}());

},{"./layer/exports":39,"./renderer/exports":61,"./request/MetaRequestor":75,"./request/TileRequestor":77}],27:[function(require,module,exports){
(function() {

    'use strict';

    var setDateHistogram = function(field, from, to, interval) {
        if (!field) {
            throw 'DateHistogram `field` is missing from argument';
        }
        if (from === undefined) {
            throw 'DateHistogram `from` are missing from argument';
        }
        if (to === undefined) {
            throw 'DateHistogram `to` are missing from argument';
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

},{}],28:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (!meta.extrema) {
                throw 'Histogram `field` ' + field + ' is not ordinal in meta data';
            }
        } else {
            throw 'Histogram `field` ' + field + ' is not recognized in meta data';
        }
    };

    var setHistogram = function(field, interval) {
        if (!field) {
            throw 'Histogram `field` is missing from argument';
        }
        if (!interval) {
            throw 'Histogram `interval` are missing from argument';
        }
        checkField(this._meta[field], field);
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

},{}],29:[function(require,module,exports){
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
            if (!meta.extrema) {
                throw 'Metrix `field` ' + field + ' is not ordinal in meta data';
            }
        } else {
            throw 'Metric `field` ' + field + ' is not recognized in meta data';
        }
    };

    var setMetric = function(field, type) {
        if (!field) {
            throw 'Metric `field` is missing from argument';
        }
        if (!type) {
            throw 'Metric `type` is missing from argument';
        }
        checkField(this._meta[field], field);
        if (!METRICS[type]) {
            throw 'Metric type `' + type + '` is not supported';
        }
        this._params.metric = {
            field: field,
            type: type
        };
        this.clearExtrema();
        return this;
    };

    var getMetric = function() {
        return this._params.metric;
    };

    module.exports = {
        // tiling
        setMetric: setMetric,
        getMetric: getMetric,
    };

}());

},{}],30:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'Terms `field` ' + field + ' is not of type `string` in meta data';
            }
        } else {
            throw 'Terms `field` ' + field + ' is not recognized in meta data';
        }
    };

    var setTerms = function(field, size) {
        if (!field) {
            throw 'Terms `field` is missing from argument';
        }
        checkField(this._meta[field], field);
        this._params.terms = {
            field: field,
            size: size
        };
        this.clearExtrema();
        return this;
    };

    var getTerms = function() {
        return this._params.terms;
    };

    module.exports = {
        setTerms: setTerms,
        getTerms: getTerms
    };

}());

},{}],31:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'Terms `field` ' + field + ' is not of type `string` in meta data';
            }
        } else {
            throw 'Terms `field` ' + field + ' is not recognized in meta data';
        }
    };

    var setTermsFilter = function(field, terms) {
        if (!field) {
            throw 'Terms `field` is missing from argument';
        }
        if (terms === undefined) {
            throw 'Terms `terms` are missing from argument';
        }
        checkField(this._meta[field], field);
        this._params.terms_filter = {
            field: field,
            terms: terms
        };
        this.clearExtrema();
        return this;
    };

    var getTermsFilter = function() {
        return this._params.terms_filter;
    };

    module.exports = {
        setTermsFilter: setTermsFilter,
        getTermsFilter: getTermsFilter
    };

}());

},{}],32:[function(require,module,exports){
// Provides top hits query functionality. 'size' indicates the number of top 
// hits to return, 'include' is the list of fields to include in the returned 
// data, 'sort' is the field to use for sort critera, and 'order' is value of
// 'asc' or 'desc' to indicate sort ordering.
(function() {

    'use strict';

    var setTopHits = function(size, include, sort, order) {
        this._params.top_hits = {
            size: size, 
            include:include,
            sort: sort,
            order: order            
        };
        this.clearExtrema();
        return this;
    };

    var getTopHits = function() {
        return this._params.top_hits;
    };

    // bind point for external controls
    var setSortField = function(sort) {
        this._params.top_hits.sort = sort;
        return this;
    };

    // bind point for external controls
    var getSortField = function() {
        return this._params.top_hits.sort;
    };

    module.exports = {
        setTopHits: setTopHits,
        getTopHits: getTopHits,
        setSortField: setSortField,
        getSortField: getSortField
    };

}());

},{}],33:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'TopTerms `field` ' + field + ' is not of type `string` in meta data';
            }
        } else {
            throw 'TopTerms `field` ' + field + ' is not recognized in meta data';
        }        
    };

    var setTopTerms = function(field, size) {
        if (!field) {
            throw 'TopTerms `field` is missing from argument';
        }
        checkField(this._meta[field], field);
        this._params.top_terms = {
            field: field,
            size: size
        };
        this.clearExtrema();
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

},{}],34:[function(require,module,exports){
(function() {

    'use strict';

    var Base = L.GridLayer.extend({

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

    module.exports = Base;

}());

},{}],35:[function(require,module,exports){
(function() {

    'use strict';

    var Base = require('./Base');

    var Debug = Base.extend({

        options: {
            unloadInvisibleTiles: true,
            zIndex: 5000
        },

        initialize: function(options) {
            // set renderer
            if (!options.rendererClass) {
                throw 'No `rendererClass` option found.';
            } else {
                // recursively extend
                $.extend(true, this, options.rendererClass);
            }
            // set options
            L.setOptions(this, options);
        },

        createTile: function(coord) {
            // create a <div> element for drawing
            var tile = L.DomUtil.create('div', 'leaflet-tile');
            // draw to it
            this.renderTile(tile, coord);
            // pass tile to callback
            return tile;
        },

        renderTile: function() {
            // override
        }

    });

    module.exports = Debug;

}());

},{"./Base":34}],36:[function(require,module,exports){
(function() {

    'use strict';

    var Base = require('./Base');

    var Image = L.TileLayer.extend(Base);

    module.exports = Image;

}());

},{"./Base":34}],37:[function(require,module,exports){
(function() {

    'use strict';

    var boolQueryCheck = require('../query/Bool');

    var MIN = Number.MAX_VALUE;
    var MAX = 0;

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    function getNormalizeCoords(coords) {
        var pow = Math.pow(2, coords.z);
        return {
            x: mod(coords.x, pow),
            y: mod(coords.y, pow),
            z: coords.z
        };
    }

    var Live = L.Class.extend({

        initialize: function(meta, options) {
            // set renderer
            if (!options.rendererClass) {
                throw 'No `rendererClass` option found.';
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
            // set extrema / cache
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

        setQuery: function(query) {
            if (!query.must && !query.must_not && !query.should) {
                throw 'Root query must have at least one `must`, `must_not`, or `should` argument.';
            }
            // check that the query is valid
            boolQueryCheck(this._meta, query);
            // set query
            this._params.must = query.must;
            this._params.must_not = query.must_not;
            this._params.should = query.should;
            // cleat extrema
            this.clearExtrema();
        },

        getMeta: function() {
            return this._meta;
        },

        getParams: function() {
            return this._params;
        },

        cacheKeyFromCoord: function(coords, normalize) {
            if (normalize) {
                // leaflet layer x and y may be > n^2, and < 0 in the case
                // of a wraparound. If normalize is true, mod the coords
                coords = getNormalizeCoords(coords);
            }
            return coords.z + ':' + coords.x + ':' + coords.y;
        },

        coordFromCacheKey: function(key) {
            var arr = key.split(':');
            return {
                x: parseInt(arr[1], 10),
                y: parseInt(arr[2], 10),
                z: parseInt(arr[0], 10)
            };
        },

        onTileUnload: function(event) {
            // cache key from coords
            var key = this.cacheKeyFromCoord(event.coords);
            // cache key from normalized coords
            var nkey = this.cacheKeyFromCoord(event.coords, true);
            // get cache entry
            var cached = this._cache[nkey];
            // could the be case where the cache is cleared before tiles are
            // unloaded
            if (!cached) {
                return;
            }
            // remove the tile from the cache
            delete cached.tiles[key];
            // don't remove cache entry unless to tiles use it anymore
            if (_.keys(cached.tiles).length === 0) {
                // no more tiles use this cached data, so delete it
                delete this._cache[key];
            }
        },

        onCacheHit: function(/*tile, cached, coords*/) {
            // this is executed for a tile whose data is already in memory.
            // probably just draw the tile.
        },

        onCacheLoad: function(/*tile, cached, coords*/) {
            // this is executed when the data for a tile is retreived and cached
            // probably just draw the tile.
        },

        onCacheLoadExtremaUpdate: function(/*tile, cached, coords*/) {
            // this is executed when the data for a tile is retreived and is
            // outside the current extrema. probably just redraw all tiles.
        },

        onTileLoad: function(event) {
            var self = this;
            var coords = event.coords;
            var ncoords = getNormalizeCoords(event.coords);
            var tile = event.tile;
            // cache key from coords
            var key = this.cacheKeyFromCoord(event.coords);
            // cache key from normalized coords
            var nkey = this.cacheKeyFromCoord(event.coords, true);
            // check cache
            var cached = this._cache[nkey];
            if (cached) {
                // add tile under normalize coords
                cached.tiles[key] = tile;
                if (!cached.isPending) {
                    // cache entry already exists
                    self.onCacheHit(tile, cached, coords);
                }
            } else {
                // create a cache entry
                this._cache[nkey] = {
                    isPending: true,
                    tiles: {},
                    data: null
                };
                // add tile to the cache entry
                this._cache[nkey].tiles[key] = tile;
                // request the tile
                this.requestTile(ncoords, function(data) {
                    var cached = self._cache[nkey];
                    if (!cached) {
                        // tile is no longer being tracked, ignore
                        return;
                    }
                    cached.isPending = false;
                    cached.data = data;
                    // update the extrema
                    if (data && self.updateExtrema(data)) {
                        // extrema changed
                        self.onCacheLoadExtremaUpdate(tile, cached, coords);
                    } else {
                        // data is loaded into cache
                        self.onCacheLoad(tile, cached, coords);
                    }
                });
            }
        },

    });

    module.exports = Live;

}());

},{"../query/Bool":44}],38:[function(require,module,exports){
(function() {

    'use strict';

    var Base = require('./Base');

    var Pending = Base.extend({

        options: {
            unloadInvisibleTiles: true,
            zIndex: 5000
        },

        initialize: function(options) {
            this._pendingTiles = {};
            // set renderer
            if (!options.rendererClass) {
                throw 'No `rendererClass` option found.';
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
                    this._updateTile(coord, tile);
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
                    this._updateTile(coord, tile);
                }, this);
            }
        },

        _getTileClass: function(hash) {
            return 'leaflet-pending-' + hash;
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

        _updateTile: function(coord, tile) {
            // get hash
            var hash = this._getTileHash(coord);
            $(tile).addClass(this._getTileClass(hash));
            if (this._pendingTiles[hash] > 0) {
                this.renderTile(tile, coord);
            } else {
                tile.innerHTML = '';
            }
        },

        createTile: function(coord) {
            // create a <div> element for drawing
            var tile = L.DomUtil.create('div', 'leaflet-tile');
            // get hash
            this._updateTile(coord, tile);
            // pass tile to callback
            return tile;
        },

        renderTile: function() {
            // override
        }

    });

    module.exports = Pending;

}());

},{"./Base":34}],39:[function(require,module,exports){
(function() {

    'use strict';

    // debug tile layer
    var Debug = require('./core/Debug');

    // pending tile layer
    var Pending = require('./core/Pending');

    // image layer
    var Image = require('./core/Image');

    // live tile layers
    var Heatmap = require('./type/Heatmap');
    var TopTrails = require('./type/TopTrails');
    var TopCount = require('./type/TopCount');
    var TopFrequency = require('./type/TopFrequency');
    var TopicCount = require('./type/TopicCount');
    var TopicFrequency = require('./type/TopicFrequency');
    var Preview = require('./type/Preview');

    module.exports = {
        Debug: Debug,
        Pending: Pending,
        Image: Image,
        Heatmap: Heatmap,
        TopCount: TopCount,
        TopTrails: TopTrails,
        TopFrequency: TopFrequency,
        TopicCount: TopicCount,
        TopicFrequency: TopicFrequency,
        Preview: Preview
    };

}());

},{"./core/Debug":35,"./core/Image":36,"./core/Pending":38,"./type/Heatmap":49,"./type/Preview":50,"./type/TopCount":51,"./type/TopFrequency":52,"./type/TopTrails":53,"./type/TopicCount":54,"./type/TopicFrequency":55}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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
        if (nval === 0) {
            return -distance;
        }
        if (nval === 1) {
            return distance;
        }
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

},{}],42:[function(require,module,exports){
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

},{"./Tiling":43}],43:[function(require,module,exports){
(function() {

    'use strict';

    var DEFAULT_X_FIELD = 'pixel.x';
    var DEFAULT_Y_FIELD = 'pixel.y';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.extrema) {
                return true;
            } else {
                throw 'Field `' + field + '` is not ordinal in meta data.';
            }
        } else {
            throw 'Field `' + field + '` is not recognized in meta data.';
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

},{}],44:[function(require,module,exports){
(function() {

    'use strict';

    var check;

    function checkQuery(meta, query) {
        var keys = _.keys(query);
        if (keys.length !== 1) {
            throw 'Bool sub-query must only have a single key, query has multiple keys: `' + JSON.stringify(keys) + '`.';
        }
        var type = keys[0];
        var checkFunc = check[type];
        if (!checkFunc) {
            throw 'Query type `' + type + '` is not recognized.';
        }
        // check query by type
        check[type](meta, query[type]);
    }

    function checkQueries(meta, queries) {
        if (_.isArray(queries)) {
            queries.forEach( function(query) {
                checkQuery(meta,query);
            });
            return queries;
        }
        checkQuery(meta, queries);
        return [
            queries
        ];
    }

    function checkBool(meta, query) {
        if (!query.must && !query.must_not && !query.should) {
            throw 'Bool must have at least one `must`, `must_not`, or `should` query argument.';
        }
        if (query.must) {
            checkQueries(meta, query.must);
        }
        if (query.must_not) {
            checkQueries(meta, query.must_not);
        }
        if (query.should) {
            checkQueries(meta, query.should);
        }
    }

    check = {
        bool: checkBool,
        prefix: require('./Prefix'),
        query_string: require('./QueryString'),
        range: require('./Range'),
        terms: require('./Terms'),
    };

    module.exports = checkBool;

}());

},{"./Prefix":45,"./QueryString":46,"./Range":47,"./Terms":48}],45:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'Prefix `field` ' + field + ' is not of type `string` in meta data.';
            }
        } else {
            throw 'Prefix `field` ' + field + ' is not recognized in meta data.';
        }        
    };

    module.exports = function(meta, query) {
        if (!query.field) {
            throw 'Prefix `field` is missing from argument';
        }
        if (query.prefixes === undefined) {
            throw 'Prefix `prefixes` are missing from argument';
        }
        checkField(meta[query.field], query.field);
    };

}());

},{}],46:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'QueryString `field` ' + field + ' is not `string` in meta data.';
            }
        } else {
            throw 'QueryString `field` ' + field + ' is not recognized in meta data.';
        }        
    };

    module.exports = function(meta, query) {
        if (!query.field) {
            throw 'QueryString `field` is missing from argument.';
        }
        if (!query.string) {
            throw 'QueryString `string` is missing from argument.';
        }
        checkField(meta[query.field], query.field);
    };

}());

},{}],47:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (!meta.extrema) {
                throw 'Range `field` ' + field + ' is not ordinal in meta data.';
            }
        } else {
            throw 'Range `field` ' + field + ' is not recognized in meta data.';
        }        
    };

    module.exports = function(meta, query) {
        if (!query.field) {
            throw 'Range `field` is missing from argument.';
        }
        if (query.from === undefined) {
            throw 'Range `from` is missing from argument.';
        }
        if (query.to === undefined) {
            throw 'Range `to` is missing from argument.';
        }
        checkField(meta[query.field], query.field);
    };

}());

},{}],48:[function(require,module,exports){
(function() {

    'use strict';

    var checkField = function(meta, field) {
        if (meta) {
            if (meta.type !== 'string') {
                throw 'Terms `field` ' + field + ' is not of type `string` in meta data.';
            }
        } else {
            throw 'Terms `field` ' + field + ' is not recognized in meta data.';
        }    
    };

    module.exports = function(meta, query) {
        if (!query.field) {
            throw 'Terms `field` is missing from argument.';
        }
        if (query.terms === undefined) {
            throw 'Terms `terms` are missing from argument.';
        }
        checkField(meta[query.field], query.field);
    };

}());

},{}],49:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../param/Binning');
    var Metric = require('../agg/Metric');
    var ColorRamp = require('../mixin/ColorRamp');
    var ValueTransform = require('../mixin/ValueTransform');

    var Heatmap = Live.extend({

        includes: [
            // params
            Binning,
            // aggs
            Metric,
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

},{"../agg/Metric":29,"../core/Live":37,"../mixin/ColorRamp":40,"../mixin/ValueTransform":41,"../param/Binning":42}],50:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../param/Binning');
    var TopHits = require('../agg/TopHits');

    var Preview = Live.extend({

        includes: [
            // params
            Binning,
            TopHits 
        ],

        type: 'preview',

        initialize: function() {
            Live.prototype.initialize.apply(this, arguments);
        },

        // extreme not relevant for preview
        extractExtrema: function() {
            return {
                min: 0,
                max: 0
            };
        },
    });

    module.exports = Preview;

}());

},{"../agg/TopHits":32,"../core/Live":37,"../param/Binning":42}],51:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../param/Tiling');
    var TopTerms = require('../agg/TopTerms');
    var Histogram = require('../agg/Histogram');
    var ValueTransform = require('../mixin/ValueTransform');

    var TopCount = Live.extend({

        includes: [
            // params
            Tiling,
            TopTerms,
            // aggs
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

},{"../agg/Histogram":28,"../agg/TopTerms":33,"../core/Live":37,"../mixin/ValueTransform":41,"../param/Tiling":43}],52:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../param/Tiling');
    var TopTerms = require('../agg/TopTerms');
    var DateHistogram = require('../agg/DateHistogram');
    var Histogram = require('../agg/Histogram');
    var ValueTransform = require('../mixin/ValueTransform');

    var TopFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            // aggs
            TopTerms,
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

},{"../agg/DateHistogram":27,"../agg/Histogram":28,"../agg/TopTerms":33,"../core/Live":37,"../mixin/ValueTransform":41,"../param/Tiling":43}],53:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Binning = require('../param/Binning');
    var Terms = require('../agg/Terms');
    var ColorRamp = require('../mixin/ColorRamp');
    var ValueTransform = require('../mixin/ValueTransform');

    var TopTrails = Live.extend({

        includes: [
            // params
            Binning,
            // aggs
            Terms,
            // mixins
            ColorRamp,
            ValueTransform
        ],

        type: 'top_trails',

        initialize: function() {
            ColorRamp.initialize.apply(this, arguments);
            ValueTransform.initialize.apply(this, arguments);
            // base
            Live.prototype.initialize.apply(this, arguments);
        },

        extractExtrema: function() {
            return [ 0, 0 ];
        }

    });

    module.exports = TopTrails;

}());

},{"../agg/Terms":30,"../core/Live":37,"../mixin/ColorRamp":40,"../mixin/ValueTransform":41,"../param/Binning":42}],54:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../param/Tiling');
    var TermsFilter = require('../agg/TermsFilter');
    var Histogram = require('../agg/Histogram');
    var ValueTransform = require('../mixin/ValueTransform');

    var TopicCount = Live.extend({

        includes: [
            // params
            Tiling,
            TermsFilter,
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

},{"../agg/Histogram":28,"../agg/TermsFilter":31,"../core/Live":37,"../mixin/ValueTransform":41,"../param/Tiling":43}],55:[function(require,module,exports){
(function() {

    'use strict';

    var Live = require('../core/Live');
    var Tiling = require('../param/Tiling');
    var TermsFilter = require('../agg/TermsFilter');
    var DateHistogram = require('../agg/DateHistogram');
    var Histogram = require('../agg/Histogram');
    var ValueTransform = require('../mixin/ValueTransform');

    var TopicFrequency = Live.extend({

        includes: [
            // params
            Tiling,
            TermsFilter,
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

},{"../agg/DateHistogram":27,"../agg/Histogram":28,"../agg/TermsFilter":31,"../core/Live":37,"../mixin/ValueTransform":41,"../param/Tiling":43}],56:[function(require,module,exports){
(function() {

    'use strict';

    var DOM = require('./DOM');

    var Canvas = DOM.extend({

        options: {
            handlers: {}
        },

        onAdd: function(map) {
            var self = this;
            DOM.prototype.onAdd.call(this, map);
            map.on('click', this.onClick, this);
            $(this._container).on('mousemove', function(e) {
                self.onMouseMove(e);
            });
            $(this._container).on('mouseover', function(e) {
                self.onMouseOver(e);
            });
            $(this._container).on('mouseout', function(e) {
                self.onMouseOut(e);
            });
        },

        onRemove: function(map) {
            map.off('click', this.onClick, this);
            $(this._container).off('mousemove');
            $(this._container).off('mouseover');
            $(this._container).off('mouseout');
            DOM.prototype.onRemove.call(this, map);
        },

        createTile: function() {
            var tile = L.DomUtil.create('canvas', 'leaflet-tile');
            tile.style['pointer-events'] = 'all';
            tile.width = this.options.tileSize;
            tile.height = this.options.tileSize;
            return tile;
        },

        clearTiles: function() {
            var tileSize = this.options.tileSize;
            _.forIn(this._tiles, function(tile) {
                var ctx = tile.el.getContext('2d');
                ctx.clearRect(0, 0, tileSize, tileSize);
            });
        },

        onMouseMove: function() {
            // override
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

    module.exports = Canvas;

}());

},{"./DOM":57}],57:[function(require,module,exports){
(function() {

    'use strict';

    var Base = require('../../layer/core/Base');

    function mod(n, m) {
        return ((n % m) + m) % m;
    }

    var DOM = Base.extend({

        onAdd: function(map) {
            L.GridLayer.prototype.onAdd.call(this, map);
            map.on('zoomstart', this.clearExtrema, this);
            this.on('tileload', this.onTileLoad, this);
            this.on('tileunload', this.onTileUnload, this);
        },

        onRemove: function(map) {
            map.off('zoomstart', this.clearExtrema, this);
            this.off('tileload', this.onTileLoad, this);
            this.off('tileunload', this.onTileUnload, this);
            L.GridLayer.prototype.onRemove.call(this, map);
        },

        _getLayerPointFromEvent: function(e) {
            var lonlat = this._map.mouseEventToLatLng(e);
            var pixel = this._map.project(lonlat);
            var zoom = this._map.getZoom();
            var pow = Math.pow(2, zoom);
            var tileSize = this.options.tileSize;
            return {
                x: mod(pixel.x, pow * tileSize),
                y: mod(pixel.y, pow * tileSize)
            };
        },

        _getTileCoordFromLayerPoint: function(layerPoint) {
            var tileSize = this.options.tileSize;
            return {
                x: Math.floor(layerPoint.x / tileSize),
                y: Math.floor(layerPoint.y / tileSize),
                z: this._map.getZoom()
            };
        },

        _getBinCoordFromLayerPoint: function(layerPoint) {
            var tileSize = this.options.tileSize;
            var resolution = this.getResolution() || tileSize;
            var tx = mod(layerPoint.x, tileSize);
            var ty = mod(layerPoint.y, tileSize);
            var pixelSize = tileSize / resolution;
            var bx = Math.floor(tx / pixelSize);
            var by = Math.floor(ty / pixelSize);
            return {
                x: bx,
                y: by,
                index: bx + (by * resolution),
                size: pixelSize
            };
        },

        onCacheHit: function(tile, cached, coords) {
            // data exists, render only this tile
            if (cached.data) {
                this.renderTile(tile, cached.data, coords);
            }
        },

        onCacheLoad: function(tile, cached, coords) {
            // same extrema, we are good to render the tiles. In
            // the case of a map with wraparound, we may have
            // multiple tiles dependent on the response, so iterate
            // over each tile and draw it.
            var self = this;
            if (cached.data) {
                _.forIn(cached.tiles, function(tile) {
                    self.renderTile(tile, cached.data, coords);
                });
            }
        },

        onCacheLoadExtremaUpdate: function() {
            // redraw all tiles
            var self = this;
            _.forIn(this._cache, function(cached) {
                _.forIn(cached.tiles, function(tile, key) {
                    if (cached.data) {
                        self.renderTile(tile, cached.data, self.coordFromCacheKey(key));
                    }
                });
            });
        },

        createTile: function() {
            // override
        },

        requestTile: function() {
            // override
        },

        renderTile: function() {
            // override
        }

    });

    module.exports = DOM;

}());

},{"../../layer/core/Base":34}],58:[function(require,module,exports){
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
            $(this._container).on('mousemove', function(e) {
                self.onMouseMove(e);
            });
            $(this._container).on('mouseover', function(e) {
                self.onMouseOver(e);
            });
            $(this._container).on('mouseout', function(e) {
                self.onMouseOut(e);
            });
        },

        onRemove: function(map) {
            map.off('click', this.onClick, this);
            $(this._container).off('mousemove');
            $(this._container).off('mouseover');
            $(this._container).off('mouseout');
            DOM.prototype.onRemove.call(this, map);
        },

        createTile: function() {
            var tile = L.DomUtil.create('div', 'leaflet-tile leaflet-html-tile');
            return tile;
        },

        onMouseMove: function() {
            // override
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

},{"./DOM":57}],59:[function(require,module,exports){
(function() {

    'use strict';

    var Base = require('../../layer/core/Base');

    var NO_OP = function() {};

    var Overlay = Base.extend({

        options: {
            zIndex: 1
        },

        onAdd: function(map) {
            map.on('zoomend', this.onZoomEnd, this);
            this.on('tileload', this.onTileLoad, this);
            this.on('tileunload', this.onTileUnload, this);
            this._tiles = {};
            this._initContainer();
            this._resetView();
            this._update();
        },

        onRemove: function(map) {
            map.off('zoomend', this.onZoomEnd, this);
            this.off('tileload', this.onTileLoad, this);
            this.off('tileunload', this.onTileUnload, this);
            this._removeAllTiles();
            L.DomUtil.remove(this._container);
            map._removeZoomLimit(this);
            this._tileZoom = null;
        },

        // No-op these functions
        createTile: NO_OP,
        _updateOpacity: NO_OP,
        _initTile: NO_OP,
        _tileReady: NO_OP,
        _updateLevels: NO_OP,
        _removeTilesAtZoom: NO_OP,
        _setZoomTransforms: NO_OP,

        _initContainer: function () {
            if (!this._container) {
                this._container = document.createElement('canvas');
                this._container.className += 'leaflet-layer leaflet-zoom-animated';
            }
            this._updateZIndex();
            this.getPane().appendChild(this._container);
        },

        _pruneTiles: function () {
            if (!this._map) {
                return;
            }
            var zoom = this._map.getZoom();
            if (zoom > this.options.maxZoom ||
                zoom < this.options.minZoom) {
                this._removeAllTiles();
                return;
            }
            var self = this;
            _.forIn(this._tiles, function(tile) {
                tile.retain = tile.current;
            });
            _.forIn(this._tiles, function(tile) {
                if (tile.current && !tile.active) {
                    var coords = tile.coords;
                    if (!self._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
                        self._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
                    }
                }
            });
            _.forIn(this._tiles, function(tile, key) {
                if (!tile.retain) {
                    self._removeTile(key);
                }
            });
        },

        _removeAllTiles: function () {
            var self = this;
            _.forIn(this._tiles, function(tile, key) {
                self._removeTile(key);
            });
        },

        _invalidateAll: function () {
            this._removeAllTiles();
            this._tileZoom = null;
        },

        _setView: function (center, zoom, noPrune, noUpdate) {
            var tileZoom = Math.round(zoom);
            if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
                (this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
                tileZoom = undefined;
            }
            var tileZoomChanged = this.options.updateWhenZooming && (tileZoom !== this._tileZoom);
            if (!noUpdate || tileZoomChanged) {
                this._tileZoom = tileZoom;
                if (this._abortLoading) {
                    this._abortLoading();
                }
                this._resetGrid();
                if (tileZoom !== undefined) {
                    this._update(center);
                }
                if (!noPrune) {
                    this._pruneTiles();
                }
            }
            this._setZoomTransform(center, zoom);
        },

        _setZoomTransform: function (center, zoom) {
            var currentCenter = this._map.getCenter();
            var currentZoom = this._map.getZoom();
            var scale = this._map.getZoomScale(zoom, currentZoom);
            var position = L.DomUtil.getPosition(this._container);
            var viewHalf = this._map.getSize().multiplyBy(0.5);
            var currentCenterPoint = this._map.project(currentCenter, zoom);
            var destCenterPoint = this._map.project(center, zoom);
            var centerOffset = destCenterPoint.subtract(currentCenterPoint);
            var topLeftOffset = viewHalf.multiplyBy(-scale).add(position).add(viewHalf).subtract(centerOffset);
            if (L.Browser.any3d) {
                L.DomUtil.setTransform(this._container, topLeftOffset, scale);
            } else {
                L.DomUtil.setPosition(this._container, topLeftOffset);
            }
        },

        // Private method to load tiles in the grid's active zoom level according to map bounds
        _update: function (center) {
            var map = this._map;
            if (!map) {
                return;
            }
            var zoom = map.getZoom();
            if (center === undefined) {
                center = map.getCenter();
            }
            if (this._tileZoom === undefined) {
                // if out of minzoom/maxzoom
                return;
            }
            var pixelBounds = this._getTiledPixelBounds(center),
                tileRange = this._pxBoundsToTileRange(pixelBounds),
                tileCenter = tileRange.getCenter(),
                queue = [];

            _.forIn(this._tiles, function(tile) {
                tile.current = false;
            });
            // _update just loads more tiles. If the tile zoom level differs too much
            // from the map's, let _setView reset levels and prune old tiles.
            if (Math.abs(zoom - this._tileZoom) > 1) {
                this._setView(center, zoom);
                return;
            }
            // create a queue of coordinates to load tiles from
            var i, j;
            for (j = tileRange.min.y; j <= tileRange.max.y; j++) {
                for (i = tileRange.min.x; i <= tileRange.max.x; i++) {
                    var coords = new L.Point(i, j);
                    coords.z = this._tileZoom;

                    if (!this._isValidTile(coords)) {
                        continue;
                    }

                    var tile = this._tiles[this._tileCoordsToKey(coords)];
                    if (tile) {
                        tile.current = true;
                    } else {
                        queue.push(coords);
                    }
                }
            }
            // sort tile queue to load tiles in order of their distance to center
            queue.sort(function (a, b) {
                return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
            });
            if (queue.length !== 0) {
                // if its the first batch of tiles to load
                if (!this._loading) {
                    this._loading = true;
                    // @event loading: Event
                    // Fired when the grid layer starts loading tiles
                    this.fire('loading');
                }
                for (i = 0; i < queue.length; i++) {
                    this._addTile(queue[i]);
                }
            }
        },

        _removeTile: function (key) {
            var tile = this._tiles[key];
            if (!tile) {
                return;
            }
            delete this._tiles[key];
            // @event tileunload: TileEvent
            // Fired when a tile is removed (e.g. when a tile goes off the screen).
            this.fire('tileunload', {
                coords: this._keyToTileCoords(key)
            });
        },

        _addTile: function (coords) {
            var key = this._tileCoordsToKey(coords);
            // save tile in cache
            var tile = this._tiles[key] = {
                coords: coords,
                current: true
            };
            // @event tileloadstart: TileEvent
            // Fired when a tile is requested and starts loading.
            this.fire('tileloadstart', {
                coords: coords
            });

            tile.loaded = +new Date();
            tile.active = true;
            this._pruneTiles();

            // @event tileload: TileEvent
            // Fired when a tile loads.
            this.fire('tileload', {
                coords: coords
            });

            if (this._noTilesToLoad()) {
                this._loading = false;
                // @event load: Event
                // Fired when the grid layer loaded all visible tiles.
                this.fire('load');

                if (L.Browser.ielt9 || !this._map._fadeAnimated) {
                    L.Util.requestAnimFrame(this._pruneTiles, this);
                } else {
                    // Wait a bit more than 0.2 secs (the duration of the tile fade-in)
                    // to trigger a pruning.
                    setTimeout(L.bind(this._pruneTiles, this), 250);
                }
            }
        }

    });

    module.exports = Overlay;

}());

},{"../../layer/core/Base":34}],60:[function(require,module,exports){
(function() {

    'use strict';

    var esper = require('esper');
    var Overlay = require('./Overlay');

    var WebGL = Overlay.extend({

        onAdd: function(map) {
            Overlay.prototype.onAdd.call(this, map);
            map.on('zoomstart', this.onZoomStart, this);
            map.on('zoomend', this.onZoomEnd, this);
        },

        onRemove: function(map) {
            Overlay.prototype.onRemove.call(this, map);
            map.off('zoomstart', this.onZoomStart, this);
            map.off('zoomend', this.onZoomEnd, this);
        },

        onZoomStart: function() {
            this._isZooming = true;
        },

        onZoomEnd: function() {
            this._isZooming = false;
            this._renderFrame();
        },

        onCacheHit: function() {
            // no-op
        },

        onCacheLoad: function(tile, cached, coords) {
            if (cached.data) {
                this._bufferTileTexture(cached, coords);
            }
        },

        onCacheLoadExtremaUpdate: function() {
            var self = this;
            _.forIn(this._cache, function(cached) {
                if (cached.data) {
                    self._bufferTileTexture(cached);
                }
            });
        },

        _initContainer: function () {
            Overlay.prototype._initContainer.call(this);
            if (!this._gl) {
                this._initGL();
            }
        },

        _initGL: function() {
            var self = this;
            var gl = this._gl = esper.WebGLContext.get(this._container);
            // handle missing context
            if (!gl) {
                throw 'Unable to acquire a WebGL context';
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
            new esper.Shader({
                vert: this.options.shaders.vert,
                frag: this.options.shaders.frag
            }, function(err, shader) {
                if (err) {
                    console.error(err);
                    return;
                }
                // execute callback
                var width = self._container.width;
                var height = self._container.height;
                self._viewport = new esper.Viewport({
                    width: width,
                    height: height
                });
                self._initialized = true;
                self._shader = shader;
                self._draw();
            });
        },

        _getTranslationMatrix: function(x, y, z) {
            var mat = new Float32Array(16);
            mat[0] = 1;
            mat[1] = 0;
            mat[2] = 0;
            mat[3] = 0;
            mat[4] = 0;
            mat[5] = 1;
            mat[6] = 0;
            mat[7] = 0;
            mat[8] = 0;
            mat[9] = 0;
            mat[10] = 1;
            mat[11] = 0;
            mat[12] = x;
            mat[13] = y;
            mat[14] = z;
            mat[15] = 1;
            return mat;
        },

        _getOrthoMatrix: function(left, right, bottom, top, near, far) {
            var mat = new Float32Array(16);
            mat[0] = 2 / (right - left);
            mat[1] = 0;
            mat[2] = 0;
            mat[3] = 0;
            mat[4] = 0;
            mat[5] = 2 / (top - bottom);
            mat[6] = 0;
            mat[7] = 0;
            mat[8] = 0;
            mat[9] = 0;
            mat[10] = -2 / (far - near);
            mat[11] = 0;
            mat[12] = -((right + left) / (right - left));
            mat[13] = -((top + bottom) / (top - bottom));
            mat[14] = -((far + near) / (far - near));
            mat[15] = 1;
            return mat;
        },

        _getProjection: function() {
            var bounds = this._map.getPixelBounds();
            var dim = Math.pow(2, this._map.getZoom()) * 256;
            return this._getOrthoMatrix(
                bounds.min.x,
                bounds.max.x,
                (dim - bounds.max.y),
                (dim - bounds.min.y),
                -1, 1);
        },

        _draw: function() {
            if (this._initialized) {
                if (!this.isHidden()) {
                    // re-position canvas
                    if (!this._isZooming) {
                        // dfarw the frame
                        this._renderFrame();
                    }
                }
                requestAnimationFrame(this._draw.bind(this));
            }
        },

        _renderFrame: function() {
            var size = this._map.getSize();
            // set canvas size
            this._container.width = size.x;
            this._container.height = size.y;
            // set viewport size
            this._viewport.resize(size.x, size.y);
            // re-position container
            var topLeft = this._map.containerPointToLayerPoint([0, 0]);
            L.DomUtil.setPosition(this._container, topLeft);
            // setup
            var gl = this._gl;
            this._viewport.push();
            this._shader.push();
            this._shader.setUniform('uProjectionMatrix', this._getProjection());
            this._shader.setUniform('uOpacity', this.getOpacity());
            this._shader.setUniform('uTextureSampler', 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            // draw
            this._renderTiles();
            // teardown
            this._shader.pop();
            this._viewport.pop();
        },

        _renderTiles: function() {
            var self = this;
            var dim = Math.pow(2, this._map.getZoom()) * 256;
            // for each tile
            _.forIn(this._cache, function(cached) {
                if (!cached.texture) {
                    return;
                }
                // bind tile texture to texture unit 0
                cached.texture.push(0);
                _.forIn(cached.tiles, function(tile, key) {
                    // find the tiles position from its key
                    var coord = self.coordFromCacheKey(key);
                    // create model matrix
                    var model = self._getTranslationMatrix(
                        256 * coord.x,
                        dim - (256 * coord.y),
                        0);
                    self._shader.setUniform('uModelMatrix', model);
                    // draw the tile
                    self._renderable.draw();
                });
                // no need to unbind texture
            });
        },

        _bufferTileTexture: function(cached) {
            var data = new Float64Array(cached.data);
            var resolution = Math.sqrt(data.length);
            var buffer = new ArrayBuffer(data.length * 4);
            var bins = new Uint8Array(buffer);
            var color = [0, 0, 0, 0];
            var nval, rval, bin, i;
            var ramp = this.getColorRamp();
            var self = this;
            for (i=0; i<data.length; i++) {
                bin = data[i];
                if (bin === 0) {
                    color[0] = 0;
                    color[1] = 0;
                    color[2] = 0;
                    color[3] = 0;
                } else {
                    nval = self.transformValue(bin);
                    rval = self.interpolateToRange(nval);
                    ramp(rval, color);
                }
                bins[i * 4] = color[0];
                bins[i * 4 + 1] = color[1];
                bins[i * 4 + 2] = color[2];
                bins[i * 4 + 3] = color[3];
            }
            cached.texture = new esper.Texture2D({
                height: resolution,
                width: resolution,
                src: bins,
                format: 'RGBA',
                type: 'UNSIGNED_BYTE',
                wrap: 'CLAMP_TO_EDGE',
                filter: 'NEAREST',
                invertY: true
            });
        }

    });

    module.exports = WebGL;

}());

},{"./Overlay":59,"esper":15}],61:[function(require,module,exports){
(function() {

    'use strict';

    // canvas renderers
    var Canvas = {
        Heatmap: require('./type/canvas/Heatmap'),
        TopTrails: require('./type/canvas/TopTrails'),
        Preview: require('./type/canvas/Preview')
    };

    // html renderers
    var HTML = {
        Heatmap: require('./type/html/Heatmap'),
        Ring: require('./type/html/Ring'),
        WordCloud: require('./type/html/WordCloud'),
        WordHistogram: require('./type/html/WordHistogram')
    };

    // webgl renderers
    var WebGL = {
        Heatmap: require('./type/webgl/Heatmap')
    };

    // pending layer renderers
    var Pending = {
        Blink: require('./type/pending/Blink'),
        Spin: require('./type/pending/Spin'),
        BlinkSpin: require('./type/pending/BlinkSpin')
    };

    // pending layer renderers
    var Debug = {
        Coord: require('./type/debug/Coord')
    };

    module.exports = {
        HTML: HTML,
        Canvas: Canvas,
        WebGL: WebGL,
        Debug: Debug,
        Pending: Pending
    };

}());

},{"./type/canvas/Heatmap":63,"./type/canvas/Preview":64,"./type/canvas/TopTrails":65,"./type/debug/Coord":66,"./type/html/Heatmap":67,"./type/html/Ring":68,"./type/html/WordCloud":69,"./type/html/WordHistogram":70,"./type/pending/Blink":71,"./type/pending/BlinkSpin":72,"./type/pending/Spin":73,"./type/webgl/Heatmap":74}],62:[function(require,module,exports){
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

},{}],63:[function(require,module,exports){
(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var Heatmap = Canvas.extend({

        renderCanvas: function(bins, resolution, ramp) {
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
                    ramp(rval, color);
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

},{"../../core/Canvas":56}],64:[function(require,module,exports){
(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var Preview = Canvas.extend({

        options: {
            lineWidth: 2,
            lineColor: 'lightblue',
            fillColor: 'darkblue',
        },

        highlighted: false,

        _drawHighlight: function(canvas, x, y, size) {
            var sizeOver2 = size / 2;
            var ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.fillStyle = this.options.fillColor;
            ctx.arc(
                x * size + sizeOver2,
                y * size + sizeOver2,
                sizeOver2,
                0,
                2 * Math.PI,
                false);
            ctx.fill();
            ctx.lineWidth = this.options.lineWidth;
            ctx.strokeStyle = this.options.lineColor;
            ctx.stroke();
        },

        onMouseMove: function(e) {
            var target = $(e.originalEvent.target);
            if (this.highlighted) {
                // clear existing highlight
                this.clearTiles();
                // clear highlighted flag
                this.highlighted = false;
            }
            // get layer coord
            var layerPoint = this._getLayerPointFromEvent(e);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPoint);
            // get cache key
            var nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            var cached = this._cache[nkey];
            if (cached && cached.data) {
                // get bin coordinate
                var bin = this._getBinCoordFromLayerPoint(layerPoint);
                // get bin data entry
                var data = cached.data[bin.index];
                if (data) {
                    // for each tile relying on that data
                    var self = this;
                    _.forIn(cached.tiles, function(tile) {
                        self._drawHighlight(tile, bin.x, bin.y, bin.size);
                    });
                    // flag as highlighted
                    this.highlighted = true;
                    // execute callback
                    if (this.options.handlers.mousemove) {
                        this.options.handlers.mousemove(target, {
                            value: data,
                            x: coord.x,
                            y: coord.z,
                            z: coord.z,
                            bx: bin.x,
                            by: bin.y,
                            type: 'preview',
                            layer: this
                        });
                    }
                    return;
                }
            }
            if (this.options.handlers.mousemove) {
                this.options.handlers.mousemove(target, null);
            }
        }

    });

    module.exports = Preview;

}());

},{"../../core/Canvas":56}],65:[function(require,module,exports){
(function() {

    'use strict';

    var Canvas = require('../../core/Canvas');

    var TopTrails = Canvas.extend({

        options: {
            color: [255, 0, 255, 255],
            downSampleFactor: 8
        },

        highlighted: false,

        onMouseMove: function(e) {
            var target = $(e.originalEvent.target);
            if (this.highlighted) {
                // clear existing highlights
                this.clearTiles();
                // clear highlighted flag
                this.highlighted = false;
            }
            // get layer coord
            var layerPoint = this._getLayerPointFromEvent(e);
            // get tile coord
            var coord = this._getTileCoordFromLayerPoint(layerPoint);
            // get cache key
            var nkey = this.cacheKeyFromCoord(coord, true);
            // get cache entry
            var cached = this._cache[nkey];
            if (cached && cached.pixels) {
                // get bin coordinate
                var bin = this._getBinCoordFromLayerPoint(layerPoint);
                // downsample the bin res
                var x = Math.floor(bin.x / this.options.downSampleFactor);
                var y = Math.floor(bin.y / this.options.downSampleFactor);
                // if hits a pixel
                if (cached.pixels[x] && cached.pixels[x][y]) {
                    var ids = Object.keys(cached.pixels[x][y]);
                    // take first entry
                    var id = ids[0];
                    // for each cache entry
                    var self = this;
                    _.forIn(this._cache, function(cached) {
                        if (cached.data) {
                            // for each tile relying on that data
                            _.forIn(cached.tiles, function(tile) {
                                var trail = cached.trails[id];
                                if (trail) {
                                    self._highlightTrail(tile, trail);
                                }
                            });
                        }
                    });
                    // execute callback
                    if (this.options.handlers.mousemove) {
                        this.options.handlers.mousemove(target, {
                            value: id,
                            x: coord.x,
                            y: coord.z,
                            z: coord.z,
                            bx: bin.x,
                            by: bin.y,
                            type: 'top-trails',
                            layer: this
                        });
                    }
                    // flag as highlighted
                    this.highlighted = true;
                    return;
                }
            }
            if (this.options.handlers.mousemove) {
                this.options.handlers.mousemove(target, null);
            }
        },

        _highlightTrail: function(canvas, pixels) {
            var resolution = this.getResolution() || this.options.tileSize;
            var highlight = document.createElement('canvas');
            highlight.height = resolution;
            highlight.width = resolution;
            var highlightCtx = highlight.getContext('2d');
            var imageData = highlightCtx.getImageData(0, 0, resolution, resolution);
            var data = imageData.data;
            var pixel, x, y, i, j;
            for (i=0; i<pixels.length; i++) {
                pixel = pixels[i];
                x = pixel[0];
                y = pixel[1];
                j = x + (resolution * y);
                data[j * 4] = this.options.color[0];
                data[j * 4 + 1] = this.options.color[1];
                data[j * 4 + 2] = this.options.color[2];
                data[j * 4 + 3] = this.options.color[3];
            }
            highlightCtx.putImageData(imageData, 0, 0);
            // draw to tile
            var ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                highlight,
                0, 0,
                resolution, resolution,
                0, 0,
                canvas.width, canvas.height);
        },

        renderTile: function(container, data, coord) {
            if (!data) {
                return;
            }
            // modify cache entry
            var nkey = this.cacheKeyFromCoord(coord, true);
            var cached = this._cache[nkey];
            if (cached.trails) {
                // trails already added, exit early
                return;
            }
            var trails = cached.trails = {};
            var pixels = cached.pixels = {};
            var ids  = Object.keys(data);
            var bins, bin;
            var id, i, j;
            var rx, ry, x, y;
            for (i=0; i<ids.length; i++) {
                id = ids[i];
                bins = data[id];
                for (j=0; j<bins.length; j++) {
                    bin = bins[j];
                    // down sample the pixel to make interaction easier
                    rx = Math.floor(bin[0] / this.options.downSampleFactor);
                    ry = Math.floor(bin[1] / this.options.downSampleFactor);
                    pixels[rx] = pixels[rx] || {};
                    pixels[rx][ry] = pixels[rx][ry] || {};
                    pixels[rx][ry][id] = true;
                    // add pixel under the trail at correct resolution
                    x = bin[0];
                    y = bin[1];
                    trails[id] = trails[id] || [];
                    trails[id].push([ x, y ]);
                }
            }
        }

    });

    module.exports = TopTrails;

}());

},{"../../core/Canvas":56}],66:[function(require,module,exports){
(function() {

    'use strict';

    module.exports = {

        renderTile: function(elem, coord) {
            $(elem).empty();
            $(elem).append('<div style="top:0; left:0;">' + coord.z + ', ' + coord.x + ', ' + coord.y + '</div>');
        }

    };

}());

},{}],67:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');

    var Heatmap = HTML.extend({

        isTargetLayer: function( elem ) {
            return this._container && $.contains(this._container, elem );
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
            var pixelSize = this.options.tileSize / resolution;
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

},{"../../core/HTML":58}],68:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');

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
            var binSize = (this.options.tileSize / resolution);
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

},{"../../core/HTML":58}],69:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');
    var sentiment = require('../../sentiment/Sentiment');
    var sentimentFunc = sentiment.getClassFunc(-1, 1);

    var VERTICAL_OFFSET = 24;
    var HORIZONTAL_OFFSET = 10;
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

        options: {
            maxNumWords: 15,
            minFontSize: 10,
            maxFontSize: 20
        },

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
            }).slice(0, this.options.maxNumWords);
            // build measurement html
            var html = '<div style="height:256px; width:256px;">';
            var minFontSize = this.options.minFontSize;
            var maxFontSize = this.options.maxFontSize;
            var self = this;
            wordCounts.forEach(function(word) {
                word.percent = self.transformValue(word.count);
                word.fontSize = minFontSize + word.percent * (maxFontSize - minFontSize);
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
            var tileSize = this.options.tileSize;
            var boundingBox = {
                width: tileSize - HORIZONTAL_OFFSET * 2,
                height: tileSize - VERTICAL_OFFSET * 2,
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
            var halfSize = this.options.tileSize / 2;
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
                    'left:' + (halfSize + word.x - (word.width / 2)) + 'px',
                    'top:' + (halfSize + word.y - (word.height / 2)) + 'px',
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

},{"../../core/HTML":58,"../../sentiment/Sentiment":62}],70:[function(require,module,exports){
(function() {

    'use strict';

    var HTML = require('../../core/HTML');
    var sentiment = require('../../sentiment/Sentiment');
    var sentimentFunc = sentiment.getClassFunc(-1, 1);

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

        options: {
            maxNumWords: 8,
            minFontSize: 16,
            maxFontSize: 22
        },

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
            var numEntries = Math.min(values.length, this.options.maxNumWords);
            var $html = $('<div class="word-histograms" style="display:inline-block;"></div>');
            var totalHeight = 0;
            var minFontSize = this.options.minFontSize;
            var maxFontSize = this.options.maxFontSize;
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
                var height = minFontSize + percent * (maxFontSize - minFontSize);
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
            $html.css('top', ( this.options.tileSize / 2 ) - (totalHeight / 2));
            container.innerHTML = $html[0].outerHTML;
        }
    });

    module.exports = WordHistogram;

}());

},{"../../core/HTML":58,"../../sentiment/Sentiment":62}],71:[function(require,module,exports){
(function() {

    'use strict';

    var DELAY = 1200;

    module.exports = {

        renderTile: function(elem) {
            var delay = -(Math.random() * DELAY) + 'ms';
            elem.innerHTML = '<div class="blinking blinking-tile" style="animation-delay:' + delay + '"></div>';
        }

    };

}());

},{}],72:[function(require,module,exports){
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

},{}],73:[function(require,module,exports){
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

},{}],74:[function(require,module,exports){
(function() {

    'use strict';

    var WebGL = require('../../core/WebGL');

    var vert = [
        'precision highp float;',
        'attribute vec2 aPosition;',
        'attribute vec2 aTextureCoord;',
        'uniform mat4 uProjectionMatrix;',
        'uniform mat4 uModelMatrix;',
        'varying vec2 vTextureCoord;',
        'void main() {',
            'vTextureCoord = aTextureCoord;',
            'gl_Position = uProjectionMatrix * uModelMatrix * vec4( aPosition, 0.0, 1.0 );',
        '}'
    ].join('');

    var frag = [
        'precision highp float;',
        'uniform sampler2D uTextureSampler;',
        'uniform float uOpacity;',
        'varying vec2 vTextureCoord;',
        'void main() {',
            'vec4 color = texture2D(uTextureSampler, vTextureCoord);',
            'gl_FragColor = vec4(color.rgb, color.a * uOpacity);',
        '}'
    ].join('');

    var Heatmap = WebGL.extend({

        options: {
            shaders: {
                vert: vert,
                frag: frag,
            }
        }

    });

    module.exports = Heatmap;

}());

},{"../../core/WebGL":60}],75:[function(require,module,exports){
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

},{"./Requestor":76}],76:[function(require,module,exports){
(function() {

    'use strict';

    var RETRY_INTERVAL = 5000;

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
                console.warn('Websocket connection closed, attempting to re-connect in ' + RETRY_INTERVAL);
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
            }, RETRY_INTERVAL);
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

},{}],77:[function(require,module,exports){
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

},{"./Requestor":76,"json-stable-stringify":22}]},{},[26])(26)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvQ29sb3JUZXh0dXJlMkQuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvRGVwdGhUZXh0dXJlMkQuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvSW5kZXhCdWZmZXIuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvUmVuZGVyVGFyZ2V0LmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1JlbmRlcmFibGUuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvU2hhZGVyLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1NoYWRlclBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9lc3Blci9zcmMvY29yZS9UZXh0dXJlMkQuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVGV4dHVyZUN1YmVNYXAuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVmVydGV4QnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1ZlcnRleFBhY2thZ2UuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvVmlld3BvcnQuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL2NvcmUvV2ViR0xDb250ZXh0LmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9jb3JlL1dlYkdMQ29udGV4dFN0YXRlLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy9leHBvcnRzLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL0FzeW5jLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL0ltYWdlTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL1N0YWNrLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL1N0YWNrTWFwLmpzIiwibm9kZV9tb2R1bGVzL2VzcGVyL3NyYy91dGlsL1V0aWwuanMiLCJub2RlX21vZHVsZXMvZXNwZXIvc3JjL3V0aWwvWEhSTG9hZGVyLmpzIiwibm9kZV9tb2R1bGVzL2pzb24tc3RhYmxlLXN0cmluZ2lmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9qc29uLXN0YWJsZS1zdHJpbmdpZnkvbm9kZV9tb2R1bGVzL2pzb25pZnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvanNvbi1zdGFibGUtc3RyaW5naWZ5L25vZGVfbW9kdWxlcy9qc29uaWZ5L2xpYi9wYXJzZS5qcyIsIm5vZGVfbW9kdWxlcy9qc29uLXN0YWJsZS1zdHJpbmdpZnkvbm9kZV9tb2R1bGVzL2pzb25pZnkvbGliL3N0cmluZ2lmeS5qcyIsInNjcmlwdHMvZXhwb3J0cy5qcyIsInNjcmlwdHMvbGF5ZXIvYWdnL0RhdGVIaXN0b2dyYW0uanMiLCJzY3JpcHRzL2xheWVyL2FnZy9IaXN0b2dyYW0uanMiLCJzY3JpcHRzL2xheWVyL2FnZy9NZXRyaWMuanMiLCJzY3JpcHRzL2xheWVyL2FnZy9UZXJtcy5qcyIsInNjcmlwdHMvbGF5ZXIvYWdnL1Rlcm1zRmlsdGVyLmpzIiwic2NyaXB0cy9sYXllci9hZ2cvVG9wSGl0cy5qcyIsInNjcmlwdHMvbGF5ZXIvYWdnL1RvcFRlcm1zLmpzIiwic2NyaXB0cy9sYXllci9jb3JlL0Jhc2UuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvRGVidWcuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvSW1hZ2UuanMiLCJzY3JpcHRzL2xheWVyL2NvcmUvTGl2ZS5qcyIsInNjcmlwdHMvbGF5ZXIvY29yZS9QZW5kaW5nLmpzIiwic2NyaXB0cy9sYXllci9leHBvcnRzLmpzIiwic2NyaXB0cy9sYXllci9taXhpbi9Db2xvclJhbXAuanMiLCJzY3JpcHRzL2xheWVyL21peGluL1ZhbHVlVHJhbnNmb3JtLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbS9CaW5uaW5nLmpzIiwic2NyaXB0cy9sYXllci9wYXJhbS9UaWxpbmcuanMiLCJzY3JpcHRzL2xheWVyL3F1ZXJ5L0Jvb2wuanMiLCJzY3JpcHRzL2xheWVyL3F1ZXJ5L1ByZWZpeC5qcyIsInNjcmlwdHMvbGF5ZXIvcXVlcnkvUXVlcnlTdHJpbmcuanMiLCJzY3JpcHRzL2xheWVyL3F1ZXJ5L1JhbmdlLmpzIiwic2NyaXB0cy9sYXllci9xdWVyeS9UZXJtcy5qcyIsInNjcmlwdHMvbGF5ZXIvdHlwZS9IZWF0bWFwLmpzIiwic2NyaXB0cy9sYXllci90eXBlL1ByZXZpZXcuanMiLCJzY3JpcHRzL2xheWVyL3R5cGUvVG9wQ291bnQuanMiLCJzY3JpcHRzL2xheWVyL3R5cGUvVG9wRnJlcXVlbmN5LmpzIiwic2NyaXB0cy9sYXllci90eXBlL1RvcFRyYWlscy5qcyIsInNjcmlwdHMvbGF5ZXIvdHlwZS9Ub3BpY0NvdW50LmpzIiwic2NyaXB0cy9sYXllci90eXBlL1RvcGljRnJlcXVlbmN5LmpzIiwic2NyaXB0cy9yZW5kZXJlci9jb3JlL0NhbnZhcy5qcyIsInNjcmlwdHMvcmVuZGVyZXIvY29yZS9ET00uanMiLCJzY3JpcHRzL3JlbmRlcmVyL2NvcmUvSFRNTC5qcyIsInNjcmlwdHMvcmVuZGVyZXIvY29yZS9PdmVybGF5LmpzIiwic2NyaXB0cy9yZW5kZXJlci9jb3JlL1dlYkdMLmpzIiwic2NyaXB0cy9yZW5kZXJlci9leHBvcnRzLmpzIiwic2NyaXB0cy9yZW5kZXJlci9zZW50aW1lbnQvU2VudGltZW50LmpzIiwic2NyaXB0cy9yZW5kZXJlci90eXBlL2NhbnZhcy9IZWF0bWFwLmpzIiwic2NyaXB0cy9yZW5kZXJlci90eXBlL2NhbnZhcy9QcmV2aWV3LmpzIiwic2NyaXB0cy9yZW5kZXJlci90eXBlL2NhbnZhcy9Ub3BUcmFpbHMuanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGUvZGVidWcvQ29vcmQuanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGUvaHRtbC9IZWF0bWFwLmpzIiwic2NyaXB0cy9yZW5kZXJlci90eXBlL2h0bWwvUmluZy5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZS9odG1sL1dvcmRDbG91ZC5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZS9odG1sL1dvcmRIaXN0b2dyYW0uanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGUvcGVuZGluZy9CbGluay5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZS9wZW5kaW5nL0JsaW5rU3Bpbi5qcyIsInNjcmlwdHMvcmVuZGVyZXIvdHlwZS9wZW5kaW5nL1NwaW4uanMiLCJzY3JpcHRzL3JlbmRlcmVyL3R5cGUvd2ViZ2wvSGVhdG1hcC5qcyIsInNjcmlwdHMvcmVxdWVzdC9NZXRhUmVxdWVzdG9yLmpzIiwic2NyaXB0cy9yZXF1ZXN0L1JlcXVlc3Rvci5qcyIsInNjcmlwdHMvcmVxdWVzdC9UaWxlUmVxdWVzdG9yLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ROQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9RQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBUZXh0dXJlMkQgPSByZXF1aXJlKCcuL1RleHR1cmUyRCcpO1xyXG4gICAgdmFyIEltYWdlTG9hZGVyID0gcmVxdWlyZSgnLi4vdXRpbC9JbWFnZUxvYWRlcicpO1xyXG4gICAgdmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsL1V0aWwnKTtcclxuICAgIHZhciBNQUdfRklMVEVSUyA9IHtcclxuICAgICAgICBORUFSRVNUOiB0cnVlLFxyXG4gICAgICAgIExJTkVBUjogdHJ1ZVxyXG4gICAgfTtcclxuICAgIHZhciBNSU5fRklMVEVSUyA9IHtcclxuICAgICAgICBORUFSRVNUOiB0cnVlLFxyXG4gICAgICAgIExJTkVBUjogdHJ1ZSxcclxuICAgICAgICBORUFSRVNUX01JUE1BUF9ORUFSRVNUOiB0cnVlLFxyXG4gICAgICAgIExJTkVBUl9NSVBNQVBfTkVBUkVTVDogdHJ1ZSxcclxuICAgICAgICBORUFSRVNUX01JUE1BUF9MSU5FQVI6IHRydWUsXHJcbiAgICAgICAgTElORUFSX01JUE1BUF9MSU5FQVI6IHRydWVcclxuICAgIH07XHJcbiAgICB2YXIgV1JBUF9NT0RFUyA9IHtcclxuICAgICAgICBSRVBFQVQ6IHRydWUsXHJcbiAgICAgICAgTUlSUk9SRURfUkVQRUFUOiB0cnVlLFxyXG4gICAgICAgIENMQU1QX1RPX0VER0U6IHRydWVcclxuICAgIH07XHJcbiAgICB2YXIgVFlQRVMgPSB7XHJcbiAgICAgICAgVU5TSUdORURfQllURTogdHJ1ZSxcclxuICAgICAgICBGTE9BVDogdHJ1ZVxyXG4gICAgfTtcclxuICAgIHZhciBGT1JNQVRTID0ge1xyXG4gICAgICAgIFJHQjogdHJ1ZSxcclxuICAgICAgICBSR0JBOiB0cnVlXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGRlZmF1bHQgdHlwZSBmb3IgY29sb3IgdGV4dHVyZXMuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX1RZUEUgPSAnVU5TSUdORURfQllURSc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3JtYXQgZm9yIGNvbG9yIHRleHR1cmVzLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9GT1JNQVQgPSAnUkdCQSc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCB3cmFwIG1vZGUgZm9yIGNvbG9yIHRleHR1cmVzLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9XUkFQID0gJ1JFUEVBVCc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBtaW4gLyBtYWcgZmlsdGVyIGZvciBjb2xvciB0ZXh0dXJlcy5cclxuICAgICAqL1xyXG4gICAgdmFyIERFRkFVTFRfRklMVEVSID0gJ0xJTkVBUic7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBhbHBoYSBwcmVtdWx0aXBseWluZyBpcyBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9QUkVNVUxUSVBMWV9BTFBIQSA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBtaXBtYXBwaW5nIGlzIGVuYWJsZWQuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX01JUE1BUCA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBpbnZlcnQteSBpcyBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9JTlZFUlRfWSA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYSBDb2xvclRleHR1cmUyRCBvYmplY3QuXHJcbiAgICAgKiBAY2xhc3MgQ29sb3JUZXh0dXJlMkRcclxuICAgICAqIEBjbGFzc2Rlc2MgQSB0ZXh0dXJlIGNsYXNzIHRvIHJlcHJlc2VudCBhIDJEIGNvbG9yIHRleHR1cmUuXHJcbiAgICAgKiBAYXVnbWVudHMgVGV4dHVyZTJEXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNwZWMgLSBUaGUgc3BlY2lmaWNhdGlvbiBhcmd1bWVudHMuXHJcbiAgICAgKiBAcGFyYW0ge0ltYWdlRGF0YXxIVE1MSW1hZ2VFbGVtZW50fEhUTUxDYW52YXNFbGVtZW50fEhUTUxWaWRlb0VsZW1lbnR9IHNwZWMuaW1hZ2UgLSBUaGUgSFRNTEltYWdlRWxlbWVudCB0byBidWZmZXIuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy51cmwgLSBUaGUgSFRNTEltYWdlRWxlbWVudCBVUkwgdG8gbG9hZCBhbmQgYnVmZmVyLlxyXG4gICAgICogQHBhcmFtIHtVaW50OEFycmF5fEZsb2F0MzJBcnJheX0gc3BlYy5zcmMgLSBUaGUgZGF0YSB0byBidWZmZXIuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBUaGUgd2lkdGggb2YgdGhlIHRleHR1cmUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gVGhlIGhlaWdodCBvZiB0aGUgdGV4dHVyZS5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLndyYXAgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIGJvdGggUyBhbmQgVCBkaW1lbnNpb24uXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy53cmFwUyAtIFRoZSB3cmFwcGluZyB0eXBlIG92ZXIgdGhlIFMgZGltZW5zaW9uLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMud3JhcFQgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIHRoZSBUIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLmZpbHRlciAtIFRoZSBtaW4gLyBtYWcgZmlsdGVyIHVzZWQgZHVyaW5nIHNjYWxpbmcuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy5taW5GaWx0ZXIgLSBUaGUgbWluaWZpY2F0aW9uIGZpbHRlciB1c2VkIGR1cmluZyBzY2FsaW5nLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMubWFnRmlsdGVyIC0gVGhlIG1hZ25pZmljYXRpb24gZmlsdGVyIHVzZWQgZHVyaW5nIHNjYWxpbmcuXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2x9IHNwZWMubWlwTWFwIC0gV2hldGhlciBvciBub3QgbWlwLW1hcHBpbmcgaXMgZW5hYmxlZC5cclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc3BlYy5pbnZlcnRZIC0gV2hldGhlciBvciBub3QgaW52ZXJ0LXkgaXMgZW5hYmxlZC5cclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc3BlYy5wcmVNdWx0aXBseUFscGhhIC0gV2hldGhlciBvciBub3QgYWxwaGEgcHJlbXVsdGlwbHlpbmcgaXMgZW5hYmxlZC5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLmZvcm1hdCAtIFRoZSB0ZXh0dXJlIHBpeGVsIGZvcm1hdC5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLnR5cGUgLSBUaGUgdGV4dHVyZSBwaXhlbCBjb21wb25lbnQgdHlwZS5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIC0gVGhlIGNhbGxiYWNrIHRvIGJlIGV4ZWN1dGVkIGlmIHRoZSBkYXRhIGlzIGxvYWRlZCBhc3luY2hyb25vdXNseSB2aWEgYSBVUkwuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIENvbG9yVGV4dHVyZTJEKCBzcGVjLCBjYWxsYmFjayApIHtcclxuICAgICAgICBzcGVjID0gc3BlYyB8fCB7fTtcclxuICAgICAgICAvLyBnZXQgc3BlY2lmaWMgcGFyYW1zXHJcbiAgICAgICAgc3BlYy53cmFwUyA9IHNwZWMud3JhcFMgfHwgc3BlYy53cmFwO1xyXG4gICAgICAgIHNwZWMud3JhcFQgPSBzcGVjLndyYXBUIHx8IHNwZWMud3JhcDtcclxuICAgICAgICBzcGVjLm1pbkZpbHRlciA9IHNwZWMubWluRmlsdGVyIHx8IHNwZWMuZmlsdGVyO1xyXG4gICAgICAgIHNwZWMubWFnRmlsdGVyID0gc3BlYy5tYWdGaWx0ZXIgfHwgc3BlYy5maWx0ZXI7XHJcbiAgICAgICAgLy8gc2V0IHRleHR1cmUgcGFyYW1zXHJcbiAgICAgICAgc3BlYy53cmFwUyA9IFdSQVBfTU9ERVNbIHNwZWMud3JhcFMgXSA/IHNwZWMud3JhcFMgOiBERUZBVUxUX1dSQVA7XHJcbiAgICAgICAgc3BlYy53cmFwVCA9IFdSQVBfTU9ERVNbIHNwZWMud3JhcFQgXSA/IHNwZWMud3JhcFQgOiBERUZBVUxUX1dSQVA7XHJcbiAgICAgICAgc3BlYy5taW5GaWx0ZXIgPSBNSU5fRklMVEVSU1sgc3BlYy5taW5GaWx0ZXIgXSA/IHNwZWMubWluRmlsdGVyIDogREVGQVVMVF9GSUxURVI7XHJcbiAgICAgICAgc3BlYy5tYWdGaWx0ZXIgPSBNQUdfRklMVEVSU1sgc3BlYy5tYWdGaWx0ZXIgXSA/IHNwZWMubWFnRmlsdGVyIDogREVGQVVMVF9GSUxURVI7XHJcbiAgICAgICAgLy8gc2V0IG90aGVyIHByb3BlcnRpZXNcclxuICAgICAgICBzcGVjLm1pcE1hcCA9IHNwZWMubWlwTWFwICE9PSB1bmRlZmluZWQgPyBzcGVjLm1pcE1hcCA6IERFRkFVTFRfTUlQTUFQO1xyXG4gICAgICAgIHNwZWMuaW52ZXJ0WSA9IHNwZWMuaW52ZXJ0WSAhPT0gdW5kZWZpbmVkID8gc3BlYy5pbnZlcnRZIDogREVGQVVMVF9JTlZFUlRfWTtcclxuICAgICAgICBzcGVjLnByZU11bHRpcGx5QWxwaGEgPSBzcGVjLnByZU11bHRpcGx5QWxwaGEgIT09IHVuZGVmaW5lZCA/IHNwZWMucHJlTXVsdGlwbHlBbHBoYSA6IERFRkFVTFRfUFJFTVVMVElQTFlfQUxQSEE7XHJcbiAgICAgICAgLy8gc2V0IGZvcm1hdFxyXG4gICAgICAgIHNwZWMuZm9ybWF0ID0gRk9STUFUU1sgc3BlYy5mb3JtYXQgXSA/IHNwZWMuZm9ybWF0IDogREVGQVVMVF9GT1JNQVQ7XHJcbiAgICAgICAgLy8gYnVmZmVyIHRoZSB0ZXh0dXJlIGJhc2VkIG9uIGFyZ3VtZW50IHR5cGVcclxuICAgICAgICBpZiAoIHR5cGVvZiBzcGVjLnNyYyA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgIC8vIHJlcXVlc3Qgc291cmNlIGZyb20gdXJsXHJcbiAgICAgICAgICAgIC8vIFRPRE86IHB1dCBleHRlbnNpb24gaGFuZGxpbmcgZm9yIGFycmF5YnVmZmVyIC8gaW1hZ2UgLyB2aWRlbyBkaWZmZXJlbnRpYXRpb25cclxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICBJbWFnZUxvYWRlci5sb2FkKHtcclxuICAgICAgICAgICAgICAgIHVybDogc3BlYy5zcmMsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiggaW1hZ2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc2V0IHRvIHVuc2lnbmVkIGJ5dGUgdHlwZVxyXG4gICAgICAgICAgICAgICAgICAgIHNwZWMudHlwZSA9ICdVTlNJR05FRF9CWVRFJztcclxuICAgICAgICAgICAgICAgICAgICBzcGVjLnNyYyA9IFV0aWwucmVzaXplQ2FudmFzKCBzcGVjLCBpbWFnZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIFRleHR1cmUyRC5jYWxsKCB0aGF0LCBzcGVjICk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soIG51bGwsIHRoYXQgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCBlcnIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soIGVyciwgbnVsbCApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmICggVXRpbC5pc0NhbnZhc1R5cGUoIHNwZWMuc3JjICkgKSB7XHJcbiAgICAgICAgICAgIC8vIGlzIGltYWdlIC8gY2FudmFzIC8gdmlkZW8gdHlwZVxyXG4gICAgICAgICAgICAvLyBzZXQgdG8gdW5zaWduZWQgYnl0ZSB0eXBlXHJcbiAgICAgICAgICAgIHNwZWMudHlwZSA9ICdVTlNJR05FRF9CWVRFJztcclxuICAgICAgICAgICAgc3BlYy5zcmMgPSBVdGlsLnJlc2l6ZUNhbnZhcyggc3BlYywgc3BlYy5zcmMgKTtcclxuICAgICAgICAgICAgVGV4dHVyZTJELmNhbGwoIHRoaXMsIHNwZWMgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBhcnJheSwgYXJyYXlidWZmZXIsIG9yIG51bGxcclxuICAgICAgICAgICAgaWYgKCBzcGVjLnNyYyA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgbm8gZGF0YSBpcyBwcm92aWRlZCwgYXNzdW1lIHRoaXMgdGV4dHVyZSB3aWxsIGJlIHJlbmRlcmVkXHJcbiAgICAgICAgICAgICAgICAvLyB0by4gSW4gdGhpcyBjYXNlIGRpc2FibGUgbWlwbWFwcGluZywgdGhlcmUgaXMgbm8gbmVlZCBhbmQgaXRcclxuICAgICAgICAgICAgICAgIC8vIHdpbGwgb25seSBpbnRyb2R1Y2UgdmVyeSBwZWN1bGlhciBhbmQgZGlmZmljdWx0IHRvIGRpc2Nlcm5cclxuICAgICAgICAgICAgICAgIC8vIHJlbmRlcmluZyBwaGVub21lbmEgaW4gd2hpY2ggdGhlIHRleHR1cmUgJ3RyYW5zZm9ybXMnIGF0XHJcbiAgICAgICAgICAgICAgICAvLyBjZXJ0YWluIGFuZ2xlcyAvIGRpc3RhbmNlcyB0byB0aGUgbWlwbWFwcGVkIChlbXB0eSkgcG9ydGlvbnMuXHJcbiAgICAgICAgICAgICAgICBzcGVjLm1pcE1hcCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGJ1ZmZlciBmcm9tIGFyZ1xyXG4gICAgICAgICAgICBzcGVjLnR5cGUgPSBUWVBFU1sgc3BlYy50eXBlIF0gPyBzcGVjLnR5cGUgOiBERUZBVUxUX1RZUEU7XHJcbiAgICAgICAgICAgIFRleHR1cmUyRC5jYWxsKCB0aGlzLCBzcGVjICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIENvbG9yVGV4dHVyZTJELnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIFRleHR1cmUyRC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IENvbG9yVGV4dHVyZTJEO1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFRleHR1cmUyRCA9IHJlcXVpcmUoJy4vVGV4dHVyZTJEJyk7XHJcbiAgICB2YXIgTUFHX0ZJTFRFUlMgPSB7XHJcbiAgICAgICAgTkVBUkVTVDogdHJ1ZSxcclxuICAgICAgICBMSU5FQVI6IHRydWVcclxuICAgIH07XHJcbiAgICB2YXIgTUlOX0ZJTFRFUlMgPSB7XHJcbiAgICAgICAgTkVBUkVTVDogdHJ1ZSxcclxuICAgICAgICBMSU5FQVI6IHRydWVcclxuICAgIH07XHJcbiAgICB2YXIgV1JBUF9NT0RFUyA9IHtcclxuICAgICAgICBSRVBFQVQ6IHRydWUsXHJcbiAgICAgICAgQ0xBTVBfVE9fRURHRTogdHJ1ZSxcclxuICAgICAgICBNSVJST1JFRF9SRVBFQVQ6IHRydWVcclxuICAgIH07XHJcbiAgICB2YXIgREVQVEhfVFlQRVMgPSB7XHJcbiAgICAgICAgVU5TSUdORURfQllURTogdHJ1ZSxcclxuICAgICAgICBVTlNJR05FRF9TSE9SVDogdHJ1ZSxcclxuICAgICAgICBVTlNJR05FRF9JTlQ6IHRydWVcclxuICAgIH07XHJcbiAgICB2YXIgRk9STUFUUyA9IHtcclxuICAgICAgICBERVBUSF9DT01QT05FTlQ6IHRydWUsXHJcbiAgICAgICAgREVQVEhfU1RFTkNJTDogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBkZWZhdWx0IHR5cGUgZm9yIGRlcHRoIHRleHR1cmVzLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9UWVBFID0gJ1VOU0lHTkVEX0lOVCc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3JtYXQgZm9yIGRlcHRoIHRleHR1cmVzLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9GT1JNQVQgPSAnREVQVEhfQ09NUE9ORU5UJztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBkZWZhdWx0IHdyYXAgbW9kZSBmb3IgZGVwdGggdGV4dHVyZXMuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX1dSQVAgPSAnQ0xBTVBfVE9fRURHRSc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBtaW4gLyBtYWcgZmlsdGVyIGZvciBkZXB0aCB0ZXh0dXJlcy5cclxuICAgICAqL1xyXG4gICAgdmFyIERFRkFVTFRfRklMVEVSID0gJ0xJTkVBUic7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYSBEZXB0aFRleHR1cmUyRCBvYmplY3QuXHJcbiAgICAgKiBAY2xhc3MgRGVwdGhUZXh0dXJlMkRcclxuICAgICAqIEBjbGFzc2Rlc2MgQSB0ZXh0dXJlIGNsYXNzIHRvIHJlcHJlc2VudCBhIDJEIGRlcHRoIHRleHR1cmUuXHJcbiAgICAgKiBAYXVnbWVudHMgVGV4dHVyZTJEXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNwZWMgLSBUaGUgc3BlY2lmaWNhdGlvbiBhcmd1bWVudHMuXHJcbiAgICAgKiBAcGFyYW0ge1VpbnQ4QXJyYXl8VWludDE2QXJyYXl8VWludDMyQXJyYXl9IHNwZWMuc3JjIC0gVGhlIGRhdGEgdG8gYnVmZmVyLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gVGhlIHdpZHRoIG9mIHRoZSB0ZXh0dXJlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIHRleHR1cmUuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy53cmFwIC0gVGhlIHdyYXBwaW5nIHR5cGUgb3ZlciBib3RoIFMgYW5kIFQgZGltZW5zaW9uLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMud3JhcFMgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIHRoZSBTIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLndyYXBUIC0gVGhlIHdyYXBwaW5nIHR5cGUgb3ZlciB0aGUgVCBkaW1lbnNpb24uXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy5maWx0ZXIgLSBUaGUgbWluIC8gbWFnIGZpbHRlciB1c2VkIGR1cmluZyBzY2FsaW5nLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMubWluRmlsdGVyIC0gVGhlIG1pbmlmaWNhdGlvbiBmaWx0ZXIgdXNlZCBkdXJpbmcgc2NhbGluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLm1hZ0ZpbHRlciAtIFRoZSBtYWduaWZpY2F0aW9uIGZpbHRlciB1c2VkIGR1cmluZyBzY2FsaW5nLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMuZm9ybWF0IC0gVGhlIHRleHR1cmUgcGl4ZWwgZm9ybWF0LlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMudHlwZSAtIFRoZSB0ZXh0dXJlIHBpeGVsIGNvbXBvbmVudCB0eXBlLlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgdG8gYmUgZXhlY3V0ZWQgaWYgdGhlIGRhdGEgaXMgbG9hZGVkIGFzeW5jaHJvbm91c2x5IHZpYSBhIFVSTC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gRGVwdGhUZXh0dXJlMkQoIHNwZWMgKSB7XHJcbiAgICAgICAgc3BlYyA9IHNwZWMgfHwge307XHJcbiAgICAgICAgLy8gZ2V0IHNwZWNpZmljIHBhcmFtc1xyXG4gICAgICAgIHNwZWMud3JhcFMgPSBzcGVjLndyYXBTIHx8IHNwZWMud3JhcDtcclxuICAgICAgICBzcGVjLndyYXBUID0gc3BlYy53cmFwVCB8fCBzcGVjLndyYXA7XHJcbiAgICAgICAgc3BlYy5taW5GaWx0ZXIgPSBzcGVjLm1pbkZpbHRlciB8fCBzcGVjLmZpbHRlcjtcclxuICAgICAgICBzcGVjLm1hZ0ZpbHRlciA9IHNwZWMubWFnRmlsdGVyIHx8IHNwZWMuZmlsdGVyO1xyXG4gICAgICAgIC8vIHNldCB0ZXh0dXJlIHBhcmFtc1xyXG4gICAgICAgIHNwZWMud3JhcFMgPSBXUkFQX01PREVTWyBzcGVjLndyYXBTIF0gPyBzcGVjLndyYXBTIDogREVGQVVMVF9XUkFQO1xyXG4gICAgICAgIHNwZWMud3JhcFQgPSBXUkFQX01PREVTWyBzcGVjLndyYXBUIF0gPyBzcGVjLndyYXBUIDogREVGQVVMVF9XUkFQO1xyXG4gICAgICAgIHNwZWMubWluRmlsdGVyID0gTUlOX0ZJTFRFUlNbIHNwZWMubWluRmlsdGVyIF0gPyBzcGVjLm1pbkZpbHRlciA6IERFRkFVTFRfRklMVEVSO1xyXG4gICAgICAgIHNwZWMubWFnRmlsdGVyID0gTUFHX0ZJTFRFUlNbIHNwZWMubWFnRmlsdGVyIF0gPyBzcGVjLm1hZ0ZpbHRlciA6IERFRkFVTFRfRklMVEVSO1xyXG4gICAgICAgIC8vIHNldCBtaXAtbWFwcGluZyBhbmQgZm9ybWF0XHJcbiAgICAgICAgc3BlYy5taXBNYXAgPSBmYWxzZTsgLy8gZGlzYWJsZSBtaXAtbWFwcGluZ1xyXG4gICAgICAgIHNwZWMuaW52ZXJ0WSA9IGZhbHNlOyAvLyBubyBuZWVkIHRvIGludmVydC15XHJcbiAgICAgICAgc3BlYy5wcmVNdWx0aXBseUFscGhhID0gZmFsc2U7IC8vIG5vIGFscGhhIHRvIHByZS1tdWx0aXBseVxyXG4gICAgICAgIHNwZWMuZm9ybWF0ID0gRk9STUFUU1sgc3BlYy5mb3JtYXQgXSA/IHNwZWMuZm9ybWF0IDogREVGQVVMVF9GT1JNQVQ7XHJcbiAgICAgICAgLy8gY2hlY2sgaWYgc3RlbmNpbC1kZXB0aCwgb3IganVzdCBkZXB0aFxyXG4gICAgICAgIGlmICggc3BlYy5mb3JtYXQgPT09ICdERVBUSF9TVEVOQ0lMJyApIHtcclxuICAgICAgICAgICAgc3BlYy50eXBlID0gJ1VOU0lHTkVEX0lOVF8yNF84X1dFQkdMJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzcGVjLnR5cGUgPSBERVBUSF9UWVBFU1sgc3BlYy50eXBlIF0gPyBzcGVjLnR5cGUgOiBERUZBVUxUX1RZUEU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFRleHR1cmUyRC5jYWxsKCB0aGlzLCBzcGVjICk7XHJcbiAgICB9XHJcblxyXG4gICAgRGVwdGhUZXh0dXJlMkQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggVGV4dHVyZTJELnByb3RvdHlwZSApO1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gRGVwdGhUZXh0dXJlMkQ7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgV2ViR0xDb250ZXh0ID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHQnKTtcclxuICAgIHZhciBXZWJHTENvbnRleHRTdGF0ZSA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0U3RhdGUnKTtcclxuICAgIHZhciBUWVBFUyA9IHtcclxuICAgICAgICBVTlNJR05FRF9TSE9SVDogdHJ1ZSxcclxuICAgICAgICBVTlNJR05FRF9JTlQ6IHRydWVcclxuICAgIH07XHJcbiAgICB2YXIgTU9ERVMgPSB7XHJcbiAgICAgICAgUE9JTlRTOiB0cnVlLFxyXG4gICAgICAgIExJTkVTOiB0cnVlLFxyXG4gICAgICAgIExJTkVfU1RSSVA6IHRydWUsXHJcbiAgICAgICAgTElORV9MT09QOiB0cnVlLFxyXG4gICAgICAgIFRSSUFOR0xFUzogdHJ1ZSxcclxuICAgICAgICBUUklBTkdMRV9TVFJJUDogdHJ1ZSxcclxuICAgICAgICBUUklBTkdMRV9GQU46IHRydWVcclxuICAgIH07XHJcbiAgICB2YXIgQllURVNfUEVSX1RZUEUgPSB7XHJcbiAgICAgICAgVU5TSUdORURfU0hPUlQ6IDIsXHJcbiAgICAgICAgVU5TSUdORURfSU5UOiA0XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGRlZmF1bHQgY29tcG9uZW50IHR5cGUuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX1RZUEUgPSAnVU5TSUdORURfU0hPUlQnO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGRlZmF1bHQgcmVuZGVyIG1vZGUgKHByaW1pdGl2ZSB0eXBlKS5cclxuICAgICAqL1xyXG4gICAgdmFyIERFRkFVTFRfTU9ERSA9ICdUUklBTkdMRVMnO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGRlZmF1bHQgYnl0ZSBvZmZzZXQgdG8gcmVuZGVyIGZyb20uXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX0JZVEVfT0ZGU0VUID0gMDtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBkZWZhdWx0IGNvdW50IG9mIGluZGljZXMgdG8gcmVuZGVyLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9DT1VOVCA9IDA7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYW4gSW5kZXhCdWZmZXIgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIEluZGV4QnVmZmVyXHJcbiAgICAgKiBAY2xhc3NkZXNjIEFuIGluZGV4IGJ1ZmZlciBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtVaW50MTZBcnJheXxVaW4zMkFycmF5fEFycmF5fSBhcmcgLSBUaGUgaW5kZXggZGF0YSB0byBidWZmZXIuXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIFRoZSByZW5kZXJpbmcgb3B0aW9ucy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLm1vZGUgLSBUaGUgZHJhdyBtb2RlIC8gcHJpbWl0aXZlIHR5cGUuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5ieXRlT2Zmc2V0IC0gVGhlIGJ5dGUgb2Zmc2V0IGludG8gdGhlIGRyYXduIGJ1ZmZlci5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLmNvdW50IC0gVGhlIG51bWJlciBvZiB2ZXJ0aWNlcyB0byBkcmF3LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBJbmRleEJ1ZmZlciggYXJnLCBvcHRpb25zICkge1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2wgPSBXZWJHTENvbnRleHQuZ2V0KCk7XHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFdlYkdMQ29udGV4dFN0YXRlLmdldCggZ2wgKTtcclxuICAgICAgICB0aGlzLmJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xyXG4gICAgICAgIHRoaXMudHlwZSA9IFRZUEVTWyBvcHRpb25zLnR5cGUgXSA/IG9wdGlvbnMudHlwZSA6IERFRkFVTFRfVFlQRTtcclxuICAgICAgICAvLyBjaGVjayBpZiB0eXBlIGlzIHN1cHBvcnRlZFxyXG4gICAgICAgIGlmICggdGhpcy50eXBlID09PSAnVU5TSUdORURfSU5UJyAmJiAhV2ViR0xDb250ZXh0LmNoZWNrRXh0ZW5zaW9uKCAnT0VTX2VsZW1lbnRfaW5kZXhfdWludCcgKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0Nhbm5vdCBjcmVhdGUgSW5kZXhCdWZmZXIgb2YgdHlwZSBgVU5TSUdORURfSU5UYCBhcyBleHRlbnNpb24gYE9FU19lbGVtZW50X2luZGV4X3VpbnRgIGlzIG5vdCBzdXBwb3J0ZWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLm1vZGUgPSBNT0RFU1sgb3B0aW9ucy5tb2RlIF0gPyBvcHRpb25zLm1vZGUgOiBERUZBVUxUX01PREU7XHJcbiAgICAgICAgdGhpcy5jb3VudCA9ICggb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmNvdW50IDogREVGQVVMVF9DT1VOVDtcclxuICAgICAgICB0aGlzLmJ5dGVPZmZzZXQgPSAoIG9wdGlvbnMuYnl0ZU9mZnNldCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmJ5dGVPZmZzZXQgOiBERUZBVUxUX0JZVEVfT0ZGU0VUO1xyXG4gICAgICAgIHRoaXMuYnl0ZUxlbmd0aCA9IDA7XHJcbiAgICAgICAgaWYgKCBhcmcgKSB7XHJcbiAgICAgICAgICAgIGlmICggYXJnIGluc3RhbmNlb2YgV2ViR0xCdWZmZXIgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBXZWJHTEJ1ZmZlciBhcmd1bWVudFxyXG4gICAgICAgICAgICAgICAgaWYgKCBvcHRpb25zLmJ5dGVMZW5ndGggPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnQXJndW1lbnQgb2YgdHlwZSBgV2ViR0xCdWZmZXJgIG11c3QgYmUgY29tcGxpbWVudGVkIHdpdGggYSBjb3JyZXNwb25kaW5nIGBvcHRpb25zLmJ5dGVMZW5ndGhgJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnl0ZUxlbmd0aCA9IG9wdGlvbnMuYnl0ZUxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyID0gYXJnO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyApIHtcclxuICAgICAgICAgICAgICAgIC8vIGJ5dGUgbGVuZ3RoIGFyZ3VtZW50XHJcbiAgICAgICAgICAgICAgICBpZiAoIG9wdGlvbnMudHlwZSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdBcmd1bWVudCBvZiB0eXBlIGBudW1iZXJgIG11c3QgYmUgY29tcGxpbWVudGVkIHdpdGggYSBjb3JyZXNwb25kaW5nIGBvcHRpb25zLnR5cGVgJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyRGF0YSggYXJnICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGFyZyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICkge1xyXG4gICAgICAgICAgICAgICAgLy8gQXJyYXlCdWZmZXIgYXJnXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9wdGlvbnMudHlwZSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93ICdBcmd1bWVudCBvZiB0eXBlIGBBcnJheUJ1ZmZlcmAgbXVzdCBiZSBjb21wbGltZW50ZWQgd2l0aCBhIGNvcnJlc3BvbmRpbmcgYG9wdGlvbnMudHlwZWAnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJEYXRhKCBhcmcgKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIEFycmF5IG9yIEFycmF5QnVmZmVyVmlldyBhcmd1bWVudFxyXG4gICAgICAgICAgICAgICAgdGhpcy5idWZmZXJEYXRhKCBhcmcgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmICggb3B0aW9ucy50eXBlID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnRW1wdHkgYnVmZmVyIG11c3QgYmUgY29tcGxpbWVudGVkIHdpdGggYSBjb3JyZXNwb25kaW5nIGBvcHRpb25zLnR5cGVgJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBlbnN1cmUgdGhlcmUgaXNuJ3QgYW4gb3ZlcmZsb3dcclxuICAgICAgICBpZiAoIHRoaXMuY291bnQgKiBCWVRFU19QRVJfVFlQRVsgdGhpcy50eXBlIF0gKyB0aGlzLmJ5dGVPZmZzZXQgPiB0aGlzLmJ5dGVMZW5ndGggKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdJbmRleEJ1ZmZlciBgY291bnRgIG9mICcgKyB0aGlzLmNvdW50ICsgJyBhbmQgYGJ5dGVPZmZzZXRgIG9mICcgKyB0aGlzLmJ5dGVPZmZzZXQgKyAnIG92ZXJmbG93cyB0aGUgbGVuZ3RoIG9mIHRoZSBidWZmZXIgKCcgKyB0aGlzLmJ5dGVMZW5ndGggKyAnKSc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXBsb2FkIGluZGV4IGRhdGEgdG8gdGhlIEdQVS5cclxuICAgICAqIEBtZW1iZXJvZiBJbmRleEJ1ZmZlclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7QXJyYXl8QXJyYXlCdWZmZXJ8QXJyYXlCdWZmZXJWaWV3fG51bWJlcn0gYXJnIC0gVGhlIGFycmF5IG9mIGRhdGEgdG8gYnVmZmVyLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtJbmRleEJ1ZmZlcn0gVGhlIGluZGV4IGJ1ZmZlciBvYmplY3QgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBJbmRleEJ1ZmZlci5wcm90b3R5cGUuYnVmZmVyRGF0YSA9IGZ1bmN0aW9uKCBhcmcgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICAvLyBjYXN0IGFycmF5IHRvIEFycmF5QnVmZmVyVmlldyBiYXNlZCBvbiBwcm92aWRlZCB0eXBlXHJcbiAgICAgICAgaWYgKCBhcmcgaW5zdGFuY2VvZiBBcnJheSApIHtcclxuICAgICAgICAgICAgLy8gY2hlY2sgZm9yIHR5cGUgc3VwcG9ydFxyXG4gICAgICAgICAgICBpZiAoIHRoaXMudHlwZSA9PT0gJ1VOU0lHTkVEX0lOVCcgKSB7XHJcbiAgICAgICAgICAgICAgICAvLyB1aW50MzIgaXMgc3VwcG9ydGVkXHJcbiAgICAgICAgICAgICAgICBhcmcgPSBuZXcgVWludDMyQXJyYXkoIGFyZyApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gYnVmZmVyIHRvIHVpbnQxNlxyXG4gICAgICAgICAgICAgICAgYXJnID0gbmV3IFVpbnQxNkFycmF5KCBhcmcgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBzZXQgZW5zdXJlIHR5cGUgY29ycmVzcG9uZHMgdG8gZGF0YVxyXG4gICAgICAgIGlmICggYXJnIGluc3RhbmNlb2YgVWludDE2QXJyYXkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICdVTlNJR05FRF9TSE9SVCc7XHJcbiAgICAgICAgfSBlbHNlIGlmICggYXJnIGluc3RhbmNlb2YgVWludDMyQXJyYXkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICdVTlNJR05FRF9JTlQnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoICEoIGFyZyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICkgJiYgdHlwZW9mIGFyZyAhPT0gJ251bWJlcicgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdBcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgYEFycmF5YCwgYEFycmF5QnVmZmVyYCwgYEFycmF5QnVmZmVyVmlld2AsIG9yIGBudW1iZXJgJztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gZG9uJ3Qgb3ZlcndyaXRlIHRoZSBjb3VudCBpZiBpdCBpcyBhbHJlYWR5IHNldFxyXG4gICAgICAgIGlmICggdGhpcy5jb3VudCA9PT0gREVGQVVMVF9DT1VOVCApIHtcclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgPSAoIGFyZyAvIEJZVEVTX1BFUl9UWVBFWyB0aGlzLnR5cGUgXSApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IGFyZy5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc2V0IGJ5dGUgbGVuZ3RoXHJcbiAgICAgICAgaWYgKCB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyApIHtcclxuICAgICAgICAgICAgaWYgKCBhcmcgJSBCWVRFU19QRVJfVFlQRVsgdGhpcy50eXBlIF0gKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnQnl0ZSBsZW5ndGggbXVzdCBiZSBtdWx0aXBsZSBvZiAnICsgQllURVNfUEVSX1RZUEVbIHRoaXMudHlwZSBdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYnl0ZUxlbmd0aCA9IGFyZztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmJ5dGVMZW5ndGggPSBhcmcubGVuZ3RoICogQllURVNfUEVSX1RZUEVbIHRoaXMudHlwZSBdO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBidWZmZXIgdGhlIGRhdGFcclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXIgKTtcclxuICAgICAgICBnbC5idWZmZXJEYXRhKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgYXJnLCBnbC5TVEFUSUNfRFJBVyApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwbG9hZCBwYXJ0aWFsIGluZGV4IGRhdGEgdG8gdGhlIEdQVS5cclxuICAgICAqIEBtZW1iZXJvZiBJbmRleEJ1ZmZlclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7QXJyYXl8QXJyYXlCdWZmZXJ8QXJyYXlCdWZmZXJWaWV3fSBhcnJheSAtIFRoZSBhcnJheSBvZiBkYXRhIHRvIGJ1ZmZlci5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBieXRlT2Zmc2V0IC0gVGhlIGJ5dGUgb2Zmc2V0IGF0IHdoaWNoIHRvIGJ1ZmZlci5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7SW5kZXhCdWZmZXJ9IFRoZSB2ZXJ0ZXggYnVmZmVyIG9iamVjdCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIEluZGV4QnVmZmVyLnByb3RvdHlwZS5idWZmZXJTdWJEYXRhID0gZnVuY3Rpb24oIGFycmF5LCBieXRlT2Zmc2V0ICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgaWYgKCB0aGlzLmJ5dGVMZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdCdWZmZXIgaGFzIG5vdCBiZWVuIGFsbG9jYXRlZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGNhc3QgYXJyYXkgdG8gQXJyYXlCdWZmZXJWaWV3IGJhc2VkIG9uIHByb3ZpZGVkIHR5cGVcclxuICAgICAgICBpZiAoIGFycmF5IGluc3RhbmNlb2YgQXJyYXkgKSB7XHJcbiAgICAgICAgICAgIC8vIGNoZWNrIGZvciB0eXBlIHN1cHBvcnRcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnR5cGUgPT09ICdVTlNJR05FRF9JTlQnICkge1xyXG4gICAgICAgICAgICAgICAgLy8gdWludDMyIGlzIHN1cHBvcnRlZFxyXG4gICAgICAgICAgICAgICAgYXJyYXkgPSBuZXcgVWludDMyQXJyYXkoIGFycmF5ICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBidWZmZXIgdG8gdWludDE2XHJcbiAgICAgICAgICAgICAgICBhcnJheSA9IG5ldyBVaW50MTZBcnJheSggYXJyYXkgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgICAgICAgICEoIGFycmF5IGluc3RhbmNlb2YgVWludDE2QXJyYXkgKSAmJlxyXG4gICAgICAgICAgICAhKCBhcnJheSBpbnN0YW5jZW9mIFVpbnQzMkFycmF5ICkgJiZcclxuICAgICAgICAgICAgISggYXJyYXkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnQXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIGBBcnJheWAsIGBBcnJheUJ1ZmZlcmAsIG9yIGBBcnJheUJ1ZmZlclZpZXdgJztcclxuICAgICAgICB9XHJcbiAgICAgICAgYnl0ZU9mZnNldCA9ICggYnl0ZU9mZnNldCAhPT0gdW5kZWZpbmVkICkgPyBieXRlT2Zmc2V0IDogREVGQVVMVF9CWVRFX09GRlNFVDtcclxuICAgICAgICAvLyBnZXQgdGhlIHRvdGFsIG51bWJlciBvZiBhdHRyaWJ1dGUgY29tcG9uZW50cyBmcm9tIHBvaW50ZXJzXHJcbiAgICAgICAgdmFyIGJ5dGVMZW5ndGggPSBhcnJheS5sZW5ndGggKiBCWVRFU19QRVJfVFlQRVsgdGhpcy50eXBlIF07XHJcbiAgICAgICAgaWYgKCBieXRlT2Zmc2V0ICsgYnl0ZUxlbmd0aCA+IHRoaXMuYnl0ZUxlbmd0aCApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0FyZ3VtZW50IG9mIGxlbmd0aCAnICsgYnl0ZUxlbmd0aCArICcgYnl0ZXMgYW5kIGJ5dGUgb2Zmc2V0IG9mICcgKyBieXRlT2Zmc2V0ICsgJyBieXRlcyBvdmVyZmxvd3MgdGhlIGJ1ZmZlciBsZW5ndGggb2YgJyArIHRoaXMuYnl0ZUxlbmd0aCArICcgYnl0ZXMnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXIgKTtcclxuICAgICAgICBnbC5idWZmZXJTdWJEYXRhKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgYnl0ZU9mZnNldCwgYXJyYXkgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlIHRoZSBkcmF3IGNvbW1hbmQgZm9yIHRoZSBib3VuZCBidWZmZXIuXHJcbiAgICAgKiBAbWVtYmVyb2YgSW5kZXhCdWZmZXJcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIFRoZSBvcHRpb25zIHRvIHBhc3MgdG8gJ2RyYXdFbGVtZW50cycuIE9wdGlvbmFsLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMubW9kZSAtIFRoZSBkcmF3IG1vZGUgLyBwcmltaXRpdmUgdHlwZS5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLmJ5dGVPZmZzZXQgLSBUaGUgYnl0ZU9mZnNldCBpbnRvIHRoZSBkcmF3biBidWZmZXIuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5jb3VudCAtIFRoZSBudW1iZXIgb2YgdmVydGljZXMgdG8gZHJhdy5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7SW5kZXhCdWZmZXJ9IFJldHVybnMgdGhlIGluZGV4IGJ1ZmZlciBvYmplY3QgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBJbmRleEJ1ZmZlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgdmFyIG1vZGUgPSBnbFsgb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSBdO1xyXG4gICAgICAgIHZhciB0eXBlID0gZ2xbIHRoaXMudHlwZSBdO1xyXG4gICAgICAgIHZhciBieXRlT2Zmc2V0ID0gKCBvcHRpb25zLmJ5dGVPZmZzZXQgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5ieXRlT2Zmc2V0IDogdGhpcy5ieXRlT2Zmc2V0O1xyXG4gICAgICAgIHZhciBjb3VudCA9ICggb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmNvdW50IDogdGhpcy5jb3VudDtcclxuICAgICAgICBpZiAoIGNvdW50ID09PSAwICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnQXR0ZW1wdGluZyB0byBkcmF3IHdpdGggYSBjb3VudCBvZiAwJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBieXRlT2Zmc2V0ICsgY291bnQgKiBCWVRFU19QRVJfVFlQRVsgdGhpcy50eXBlIF0gPiB0aGlzLmJ5dGVMZW5ndGggKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdBdHRlbXB0aW5nIHRvIGRyYXcgd2l0aCBgY291bnRgIG9mICcgKyBjb3VudCArICcgYW5kIGBieXRlT2Zmc2V0YCBvZiAnICsgYnl0ZU9mZnNldCArICcgd2hpY2ggb3ZlcmZsb3dzIHRoZSB0b3RhbCBieXRlIGxlbmd0aCBvZiB0aGUgYnVmZmVyICgnICsgdGhpcy5ieXRlTGVuZ3RoICsgJyknO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBpZiB0aGlzIGJ1ZmZlciBpcyBhbHJlYWR5IGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCB0aGlzLnN0YXRlLmJvdW5kSW5kZXhCdWZmZXIgIT09IHRoaXMuYnVmZmVyICkge1xyXG4gICAgICAgICAgICBnbC5iaW5kQnVmZmVyKCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXIgKTtcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5ib3VuZEluZGV4QnVmZmVyID0gdGhpcy5idWZmZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGRyYXcgZWxlbWVudHNcclxuICAgICAgICBnbC5kcmF3RWxlbWVudHMoIG1vZGUsIGNvdW50LCB0eXBlLCBieXRlT2Zmc2V0ICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gSW5kZXhCdWZmZXI7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgV2ViR0xDb250ZXh0ID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHQnKTtcclxuICAgIHZhciBXZWJHTENvbnRleHRTdGF0ZSA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0U3RhdGUnKTtcclxuICAgIHZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC9VdGlsJyk7XHJcblxyXG4gICAgdmFyIFRFWFRVUkVfVEFSR0VUUyA9IHtcclxuICAgICAgICBURVhUVVJFXzJEOiB0cnVlLFxyXG4gICAgICAgIFRFWFRVUkVfQ1VCRV9NQVA6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgdmFyIERFUFRIX0ZPUk1BVFMgPSB7XHJcbiAgICAgICAgREVQVEhfQ09NUE9ORU5UOiB0cnVlLFxyXG4gICAgICAgIERFUFRIX1NURU5DSUw6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYSBSZW5kZXJUYXJnZXQgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIFJlbmRlclRhcmdldFxyXG4gICAgICogQGNsYXNzZGVzYyBBIHJlbmRlclRhcmdldCBjbGFzcyB0byBhbGxvdyByZW5kZXJpbmcgdG8gdGV4dHVyZXMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIFJlbmRlclRhcmdldCgpIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsID0gV2ViR0xDb250ZXh0LmdldCgpO1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBXZWJHTENvbnRleHRTdGF0ZS5nZXQoIGdsICk7XHJcbiAgICAgICAgdGhpcy5mcmFtZWJ1ZmZlciA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlcyA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmluZHMgdGhlIHJlbmRlclRhcmdldCBvYmplY3QgYW5kIHB1c2hlcyBpdCB0byB0aGUgZnJvbnQgb2YgdGhlIHN0YWNrLlxyXG4gICAgICogQG1lbWJlcm9mIFJlbmRlclRhcmdldFxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJUYXJnZXR9IFRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFJlbmRlclRhcmdldC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICggdGhpcy5zdGF0ZS5yZW5kZXJUYXJnZXRzLnRvcCgpICE9PSB0aGlzICkge1xyXG4gICAgICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoIGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZyYW1lYnVmZmVyICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RhdGUucmVuZGVyVGFyZ2V0cy5wdXNoKCB0aGlzICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgcmVuZGVyVGFyZ2V0IG9iamVjdCBhbmQgYmluZHMgdGhlIHJlbmRlclRhcmdldCBiZW5lYXRoIGl0IG9uIHRoaXMgc3RhY2suIElmIHRoZXJlIGlzIG5vIHVuZGVybHlpbmcgcmVuZGVyVGFyZ2V0LCBiaW5kIHRoZSBiYWNrYnVmZmVyLlxyXG4gICAgICogQG1lbWJlcm9mIFJlbmRlclRhcmdldFxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtSZW5kZXJUYXJnZXR9IFRoZSByZW5kZXJUYXJnZXQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFJlbmRlclRhcmdldC5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5zdGF0ZTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyByZW5kZXIgdGFyZ2V0IGJvdW5kLCBleGl0IGVhcmx5XHJcbiAgICAgICAgaWYgKCBzdGF0ZS5yZW5kZXJUYXJnZXRzLnRvcCgpICE9PSB0aGlzICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnVGhlIGN1cnJlbnQgcmVuZGVyIHRhcmdldCBpcyBub3QgdGhlIHRvcCBtb3N0IGVsZW1lbnQgb24gdGhlIHN0YWNrJztcclxuICAgICAgICB9XHJcbiAgICAgICAgc3RhdGUucmVuZGVyVGFyZ2V0cy5wb3AoKTtcclxuICAgICAgICB2YXIgdG9wID0gc3RhdGUucmVuZGVyVGFyZ2V0cy50b3AoKTtcclxuICAgICAgICB2YXIgZ2w7XHJcbiAgICAgICAgaWYgKCB0b3AgKSB7XHJcbiAgICAgICAgICAgIGdsID0gdG9wLmdsO1xyXG4gICAgICAgICAgICBnbC5iaW5kRnJhbWVidWZmZXIoIGdsLkZSQU1FQlVGRkVSLCB0b3AuZnJhbWVidWZmZXIgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlciggZ2wuRlJBTUVCVUZGRVIsIG51bGwgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNoZXMgdGhlIHByb3ZpZGVkIHRleHR1cmUgdG8gdGhlIHByb3ZpZGVkIGF0dGFjaG1lbnQgbG9jYXRpb24uXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVuZGVyVGFyZ2V0XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlMkR9IHRleHR1cmUgLSBUaGUgdGV4dHVyZSB0byBhdHRhY2guXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBUaGUgYXR0YWNobWVudCBpbmRleC4gKG9wdGlvbmFsKVxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRhcmdldCAtIFRoZSB0ZXh0dXJlIHRhcmdldCB0eXBlLiAob3B0aW9uYWwpXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlclRhcmdldH0gVGhlIHJlbmRlclRhcmdldCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyVGFyZ2V0LnByb3RvdHlwZS5zZXRDb2xvclRhcmdldCA9IGZ1bmN0aW9uKCB0ZXh0dXJlLCBpbmRleCwgdGFyZ2V0ICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgaWYgKCAhdGV4dHVyZSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgYXJndW1lbnQgaXMgbWlzc2luZyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggVEVYVFVSRV9UQVJHRVRTWyBpbmRleCBdICYmIHRhcmdldCA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICB0YXJnZXQgPSBpbmRleDtcclxuICAgICAgICAgICAgaW5kZXggPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIGluZGV4ID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIGluZGV4ID0gMDtcclxuICAgICAgICB9IGVsc2UgaWYgKCAhVXRpbC5pc0ludGVnZXIoIGluZGV4ICkgfHwgaW5kZXggPCAwICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnVGV4dHVyZSBjb2xvciBhdHRhY2htZW50IGluZGV4IGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHRhcmdldCAmJiAhVEVYVFVSRV9UQVJHRVRTWyB0YXJnZXQgXSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgdGFyZ2V0IGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRleHR1cmVzWyAnY29sb3InICsgaW5kZXggXSA9IHRleHR1cmU7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoXHJcbiAgICAgICAgICAgIGdsLkZSQU1FQlVGRkVSLFxyXG4gICAgICAgICAgICBnbFsgJ0NPTE9SX0FUVEFDSE1FTlQnICsgaW5kZXggXSxcclxuICAgICAgICAgICAgZ2xbIHRhcmdldCB8fCAnVEVYVFVSRV8yRCcgXSxcclxuICAgICAgICAgICAgdGV4dHVyZS50ZXh0dXJlLFxyXG4gICAgICAgICAgICAwICk7XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdHRhY2hlcyB0aGUgcHJvdmlkZWQgdGV4dHVyZSB0byB0aGUgcHJvdmlkZWQgYXR0YWNobWVudCBsb2NhdGlvbi5cclxuICAgICAqIEBtZW1iZXJvZiBSZW5kZXJUYXJnZXRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1RleHR1cmUyRH0gdGV4dHVyZSAtIFRoZSB0ZXh0dXJlIHRvIGF0dGFjaC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7UmVuZGVyVGFyZ2V0fSBUaGUgcmVuZGVyVGFyZ2V0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBSZW5kZXJUYXJnZXQucHJvdG90eXBlLnNldERlcHRoVGFyZ2V0ID0gZnVuY3Rpb24oIHRleHR1cmUgKSB7XHJcbiAgICAgICAgaWYgKCAhdGV4dHVyZSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgYXJndW1lbnQgaXMgbWlzc2luZyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggIURFUFRIX0ZPUk1BVFNbIHRleHR1cmUuZm9ybWF0IF0gKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQcm92aWRlZCB0ZXh0dXJlIGlzIG5vdCBvZiBmb3JtYXQgYERFUFRIX0NPTVBPTkVOVGAgb3IgYERFUFRIX1NURU5DSUxgJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICB0aGlzLnRleHR1cmVzLmRlcHRoID0gdGV4dHVyZTtcclxuICAgICAgICB0aGlzLnB1c2goKTtcclxuICAgICAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChcclxuICAgICAgICAgICAgZ2wuRlJBTUVCVUZGRVIsXHJcbiAgICAgICAgICAgIGdsLkRFUFRIX0FUVEFDSE1FTlQsXHJcbiAgICAgICAgICAgIGdsLlRFWFRVUkVfMkQsXHJcbiAgICAgICAgICAgIHRleHR1cmUudGV4dHVyZSxcclxuICAgICAgICAgICAgMCApO1xyXG4gICAgICAgIHRoaXMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzaXplcyB0aGUgcmVuZGVyVGFyZ2V0IGFuZCBhbGwgYXR0YWNoZWQgdGV4dHVyZXMgYnkgdGhlIHByb3ZpZGVkIGhlaWdodCBhbmQgd2lkdGguXHJcbiAgICAgKiBAbWVtYmVyb2YgUmVuZGVyVGFyZ2V0XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gVGhlIG5ldyB3aWR0aCBvZiB0aGUgcmVuZGVyVGFyZ2V0LlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBuZXcgaGVpZ2h0IG9mIHRoZSByZW5kZXJUYXJnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlclRhcmdldH0gVGhlIHJlbmRlclRhcmdldCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyVGFyZ2V0LnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbiggd2lkdGgsIGhlaWdodCApIHtcclxuICAgICAgICBpZiAoIHR5cGVvZiB3aWR0aCAhPT0gJ251bWJlcicgfHwgKCB3aWR0aCA8PSAwICkgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQcm92aWRlZCBgd2lkdGhgIG9mICcgKyB3aWR0aCArICcgaXMgaW52YWxpZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggdHlwZW9mIGhlaWdodCAhPT0gJ251bWJlcicgfHwgKCBoZWlnaHQgPD0gMCApICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnUHJvdmlkZWQgYGhlaWdodGAgb2YgJyArIGhlaWdodCArICcgaXMgaW52YWxpZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0ZXh0dXJlcyA9IHRoaXMudGV4dHVyZXM7XHJcbiAgICAgICAgT2JqZWN0LmtleXMoIHRleHR1cmVzICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcclxuICAgICAgICAgICAgdGV4dHVyZXNbIGtleSBdLnJlc2l6ZSggd2lkdGgsIGhlaWdodCApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFJlbmRlclRhcmdldDtcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBWZXJ0ZXhQYWNrYWdlID0gcmVxdWlyZSgnLi4vY29yZS9WZXJ0ZXhQYWNrYWdlJyk7XHJcbiAgICB2YXIgVmVydGV4QnVmZmVyID0gcmVxdWlyZSgnLi4vY29yZS9WZXJ0ZXhCdWZmZXInKTtcclxuICAgIHZhciBJbmRleEJ1ZmZlciA9IHJlcXVpcmUoJy4uL2NvcmUvSW5kZXhCdWZmZXInKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEl0ZXJhdGVzIG92ZXIgYWxsIGF0dHJpYnV0ZSBwb2ludGVycyBhbmQgdGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBhbiBpbmRleFxyXG4gICAgICogb2NjdXJzIG1yb2UgdGhhbiBvbmNlLlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSB2ZXJ0ZXhCdWZmZXJzIC0gVGhlIGFycmF5IG9mIHZlcnRleEJ1ZmZlcnMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGNoZWNrSW5kZXhDb2xsaXNpb25zKCB2ZXJ0ZXhCdWZmZXJzICkge1xyXG4gICAgICAgIHZhciBpbmRpY2VzID0ge307XHJcbiAgICAgICAgdmVydGV4QnVmZmVycy5mb3JFYWNoKCBmdW5jdGlvbiggYnVmZmVyICkge1xyXG4gICAgICAgICAgICBPYmplY3Qua2V5cyggYnVmZmVyLnBvaW50ZXJzICkuZm9yRWFjaCggZnVuY3Rpb24oIGluZGV4ICkge1xyXG4gICAgICAgICAgICAgICAgaW5kaWNlc1sgaW5kZXggXSA9IGluZGljZXNbIGluZGV4IF0gfHwgMDtcclxuICAgICAgICAgICAgICAgIGluZGljZXNbIGluZGV4IF0rKztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgT2JqZWN0LmtleXMoIGluZGljZXMgKS5mb3JFYWNoKCBmdW5jdGlvbiggaW5kZXggKSB7XHJcbiAgICAgICAgICAgIGlmICggaW5kaWNlc1sgaW5kZXggXSA+IDEgKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnTW9yZSB0aGFuIG9uZSBhdHRyaWJ1dGUgcG9pbnRlciBleGlzdHMgZm9yIGluZGV4ICcgKyBpbmRleDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zdGFudGlhdGVzIGFuIFJlbmRlcmFibGUgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIFJlbmRlcmFibGVcclxuICAgICAqIEBjbGFzc2Rlc2MgQSBjb250YWluZXIgZm9yIG9uZSBvciBtb3JlIFZlcnRleEJ1ZmZlcnMgYW5kIGFuIG9wdGlvbmFsIEluZGV4QnVmZmVyLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcGVjIC0gVGhlIHJlbmRlcmFibGUgc3BlY2lmaWNhdGlvbiBvYmplY3QuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fEZsb2F0MzJBcnJheX0gc3BlYy52ZXJ0aWNlcyAtIFRoZSB2ZXJ0aWNlcyB0byBpbnRlcmxlYXZlIGFuZCBidWZmZXIuXHJcbiAgICAgKiBAcGFyYW0ge1ZlcnRleEJ1ZmZlcn0gc3BlYy52ZXJ0ZXhCdWZmZXIgLSBBbiBleGlzdGluZyB2ZXJ0ZXggYnVmZmVyIHRvIHVzZS5cclxuICAgICAqIEBwYXJhbSB7VmVydGV4QnVmZmVyW119IHNwZWMudmVydGV4QnVmZmVycyAtIE11bHRpcGxlIHZlcnRleCBidWZmZXJzIHRvIHVzZS5cclxuICAgICAqIEBwYXJhbSB7QXJyYXl8VWludDE2QXJyYXl8VWludDMyQXJyYXl9IHNwZWMuaW5kaWNlcyAtIFRoZSBpbmRpY2VzIHRvIGJ1ZmZlci5cclxuICAgICAqIEBwYXJhbSB7SW5kZXhCdWZmZXJ9IHNwZWMuaW5kZXhidWZmZXIgLSBBbiBleGlzdGluZyBpbmRleCBidWZmZXIgdG8gdXNlLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMubW9kZSAtIFRoZSBkcmF3IG1vZGUgLyBwcmltaXRpdmUgdHlwZS5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLmJ5dGVPZmZzZXQgLSBUaGUgYnl0ZSBvZmZzZXQgaW50byB0aGUgZHJhd24gYnVmZmVyLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMuY291bnQgLSBUaGUgbnVtYmVyIG9mIHZlcnRpY2VzIHRvIGRyYXcuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIFJlbmRlcmFibGUoIHNwZWMgKSB7XHJcbiAgICAgICAgc3BlYyA9IHNwZWMgfHwge307XHJcbiAgICAgICAgaWYgKCBzcGVjLnZlcnRleEJ1ZmZlciB8fCBzcGVjLnZlcnRleEJ1ZmZlcnMgKSB7XHJcbiAgICAgICAgICAgIC8vIHVzZSBleGlzdGluZyB2ZXJ0ZXggYnVmZmVyXHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4QnVmZmVycyA9IHNwZWMudmVydGV4QnVmZmVycyB8fCBbIHNwZWMudmVydGV4QnVmZmVyIF07XHJcbiAgICAgICAgfSBlbHNlIGlmICggc3BlYy52ZXJ0aWNlcyApIHtcclxuICAgICAgICAgICAgLy8gY3JlYXRlIHZlcnRleCBwYWNrYWdlXHJcbiAgICAgICAgICAgIHZhciB2ZXJ0ZXhQYWNrYWdlID0gbmV3IFZlcnRleFBhY2thZ2UoIHNwZWMudmVydGljZXMgKTtcclxuICAgICAgICAgICAgLy8gY3JlYXRlIHZlcnRleCBidWZmZXJcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhCdWZmZXJzID0gWyBuZXcgVmVydGV4QnVmZmVyKCB2ZXJ0ZXhQYWNrYWdlICkgXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleEJ1ZmZlcnMgPSBbXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBzcGVjLmluZGV4QnVmZmVyICkge1xyXG4gICAgICAgICAgICAvLyB1c2UgZXhpc3RpbmcgaW5kZXggYnVmZmVyXHJcbiAgICAgICAgICAgIHRoaXMuaW5kZXhCdWZmZXIgPSBzcGVjLmluZGV4QnVmZmVyO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIHNwZWMuaW5kaWNlcyApIHtcclxuICAgICAgICAgICAgLy8gY3JlYXRlIGluZGV4IGJ1ZmZlclxyXG4gICAgICAgICAgICB0aGlzLmluZGV4QnVmZmVyID0gbmV3IEluZGV4QnVmZmVyKCBzcGVjLmluZGljZXMgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4QnVmZmVyID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gY2hlY2sgdGhhdCBubyBhdHRyaWJ1dGUgaW5kaWNlcyBjbGFzaFxyXG4gICAgICAgIGNoZWNrSW5kZXhDb2xsaXNpb25zKCB0aGlzLnZlcnRleEJ1ZmZlcnMgKTtcclxuICAgICAgICAvLyBzdG9yZSByZW5kZXJpbmcgb3B0aW9uc1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHtcclxuICAgICAgICAgICAgbW9kZTogc3BlYy5tb2RlLFxyXG4gICAgICAgICAgICBieXRlT2Zmc2V0OiBzcGVjLmJ5dGVPZmZzZXQsXHJcbiAgICAgICAgICAgIGNvdW50OiBzcGVjLmNvdW50XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEV4ZWN1dGUgdGhlIGRyYXcgY29tbWFuZCBmb3IgdGhlIHVuZGVybHlpbmcgYnVmZmVycy5cclxuICAgICAqIEBtZW1iZXJvZiBSZW5kZXJhYmxlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBUaGUgb3B0aW9ucyB0byBwYXNzIHRvICdkcmF3RWxlbWVudHMnLiBPcHRpb25hbC5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLm1vZGUgLSBUaGUgZHJhdyBtb2RlIC8gcHJpbWl0aXZlIHR5cGUuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5ieXRlT2Zmc2V0IC0gVGhlIGJ5dGVPZmZzZXQgaW50byB0aGUgZHJhd24gYnVmZmVyLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMuY291bnQgLSBUaGUgbnVtYmVyIG9mIHZlcnRpY2VzIHRvIGRyYXcuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1JlbmRlcmFibGV9IFJldHVybnMgdGhlIHJlbmRlcmFibGUgb2JqZWN0IGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgUmVuZGVyYWJsZS5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xyXG4gICAgICAgIHZhciBvdmVycmlkZXMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIC8vIG92ZXJyaWRlIG9wdGlvbnMgaWYgcHJvdmlkZWRcclxuICAgICAgICBvdmVycmlkZXMubW9kZSA9IG92ZXJyaWRlcy5tb2RlIHx8IHRoaXMub3B0aW9ucy5tb2RlO1xyXG4gICAgICAgIG92ZXJyaWRlcy5ieXRlT2Zmc2V0ID0gKCBvdmVycmlkZXMuYnl0ZU9mZnNldCAhPT0gdW5kZWZpbmVkICkgPyBvdmVycmlkZXMuYnl0ZU9mZnNldCA6IHRoaXMub3B0aW9ucy5ieXRlT2Zmc2V0O1xyXG4gICAgICAgIG92ZXJyaWRlcy5jb3VudCA9ICggb3ZlcnJpZGVzLmNvdW50ICE9PSB1bmRlZmluZWQgKSA/IG92ZXJyaWRlcy5jb3VudCA6IHRoaXMub3B0aW9ucy5jb3VudDtcclxuICAgICAgICAvLyBkcmF3IHRoZSByZW5kZXJhYmxlXHJcbiAgICAgICAgaWYgKCB0aGlzLmluZGV4QnVmZmVyICkge1xyXG4gICAgICAgICAgICAvLyB1c2UgaW5kZXggYnVmZmVyIHRvIGRyYXcgZWxlbWVudHNcclxuICAgICAgICAgICAgLy8gYmluZCB2ZXJ0ZXggYnVmZmVycyBhbmQgZW5hYmxlIGF0dHJpYnV0ZSBwb2ludGVyc1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRleEJ1ZmZlcnMuZm9yRWFjaCggZnVuY3Rpb24oIHZlcnRleEJ1ZmZlciApIHtcclxuICAgICAgICAgICAgICAgIHZlcnRleEJ1ZmZlci5iaW5kKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBkcmF3IHByaW1pdGl2ZXMgdXNpbmcgaW5kZXggYnVmZmVyXHJcbiAgICAgICAgICAgIHRoaXMuaW5kZXhCdWZmZXIuZHJhdyggb3ZlcnJpZGVzICk7XHJcbiAgICAgICAgICAgIC8vIGRpc2FibGUgYXR0cmlidXRlIHBvaW50ZXJzXHJcbiAgICAgICAgICAgIHRoaXMudmVydGV4QnVmZmVycy5mb3JFYWNoKCBmdW5jdGlvbiggdmVydGV4QnVmZmVyICkge1xyXG4gICAgICAgICAgICAgICAgdmVydGV4QnVmZmVyLnVuYmluZCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gbm8gYWR2YW50YWdlIHRvIHVuYmluZGluZyBhcyB0aGVyZSBpcyBubyBzdGFjayB1c2VkXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gbm8gaW5kZXggYnVmZmVyLCB1c2UgZHJhdyBhcnJheXNcclxuICAgICAgICAgICAgdGhpcy52ZXJ0ZXhCdWZmZXJzLmZvckVhY2goIGZ1bmN0aW9uKCB2ZXJ0ZXhCdWZmZXIgKSB7XHJcbiAgICAgICAgICAgICAgICB2ZXJ0ZXhCdWZmZXIuYmluZCgpO1xyXG4gICAgICAgICAgICAgICAgdmVydGV4QnVmZmVyLmRyYXcoIG92ZXJyaWRlcyApO1xyXG4gICAgICAgICAgICAgICAgdmVydGV4QnVmZmVyLnVuYmluZCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gUmVuZGVyYWJsZTtcclxuXHJcbn0oKSk7XHJcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgV2ViR0xDb250ZXh0ID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHQnKTtcbiAgICB2YXIgU2hhZGVyUGFyc2VyID0gcmVxdWlyZSgnLi9TaGFkZXJQYXJzZXInKTtcbiAgICB2YXIgV2ViR0xDb250ZXh0U3RhdGUgPSByZXF1aXJlKCcuL1dlYkdMQ29udGV4dFN0YXRlJyk7XG4gICAgdmFyIEFzeW5jID0gcmVxdWlyZSgnLi4vdXRpbC9Bc3luYycpO1xuICAgIHZhciBYSFJMb2FkZXIgPSByZXF1aXJlKCcuLi91dGlsL1hIUkxvYWRlcicpO1xuICAgIHZhciBVTklGT1JNX0ZVTkNUSU9OUyA9IHtcbiAgICAgICAgJ2Jvb2wnOiAndW5pZm9ybTFpJyxcbiAgICAgICAgJ2Jvb2xbXSc6ICd1bmlmb3JtMWl2JyxcbiAgICAgICAgJ2Zsb2F0JzogJ3VuaWZvcm0xZicsXG4gICAgICAgICdmbG9hdFtdJzogJ3VuaWZvcm0xZnYnLFxuICAgICAgICAnaW50JzogJ3VuaWZvcm0xaScsXG4gICAgICAgICdpbnRbXSc6ICd1bmlmb3JtMWl2JyxcbiAgICAgICAgJ3VpbnQnOiAndW5pZm9ybTFpJyxcbiAgICAgICAgJ3VpbnRbXSc6ICd1bmlmb3JtMWl2JyxcbiAgICAgICAgJ3ZlYzInOiAndW5pZm9ybTJmdicsXG4gICAgICAgICd2ZWMyW10nOiAndW5pZm9ybTJmdicsXG4gICAgICAgICdpdmVjMic6ICd1bmlmb3JtMml2JyxcbiAgICAgICAgJ2l2ZWMyW10nOiAndW5pZm9ybTJpdicsXG4gICAgICAgICd2ZWMzJzogJ3VuaWZvcm0zZnYnLFxuICAgICAgICAndmVjM1tdJzogJ3VuaWZvcm0zZnYnLFxuICAgICAgICAnaXZlYzMnOiAndW5pZm9ybTNpdicsXG4gICAgICAgICdpdmVjM1tdJzogJ3VuaWZvcm0zaXYnLFxuICAgICAgICAndmVjNCc6ICd1bmlmb3JtNGZ2JyxcbiAgICAgICAgJ3ZlYzRbXSc6ICd1bmlmb3JtNGZ2JyxcbiAgICAgICAgJ2l2ZWM0JzogJ3VuaWZvcm00aXYnLFxuICAgICAgICAnaXZlYzRbXSc6ICd1bmlmb3JtNGl2JyxcbiAgICAgICAgJ21hdDInOiAndW5pZm9ybU1hdHJpeDJmdicsXG4gICAgICAgICdtYXQyW10nOiAndW5pZm9ybU1hdHJpeDJmdicsXG4gICAgICAgICdtYXQzJzogJ3VuaWZvcm1NYXRyaXgzZnYnLFxuICAgICAgICAnbWF0M1tdJzogJ3VuaWZvcm1NYXRyaXgzZnYnLFxuICAgICAgICAnbWF0NCc6ICd1bmlmb3JtTWF0cml4NGZ2JyxcbiAgICAgICAgJ21hdDRbXSc6ICd1bmlmb3JtTWF0cml4NGZ2JyxcbiAgICAgICAgJ3NhbXBsZXIyRCc6ICd1bmlmb3JtMWknLFxuICAgICAgICAnc2FtcGxlckN1YmUnOiAndW5pZm9ybTFpJ1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiBhIG1hcCBvZiBleGlzdGluZyBhdHRyaWJ1dGVzLCBmaW5kIHRoZSBsb3dlc3QgaW5kZXggdGhhdCBpcyBub3RcbiAgICAgKiBhbHJlYWR5IHVzZWQuIElmIHRoZSBhdHRyaWJ1dGUgb3JkZXJpbmcgd2FzIGFscmVhZHkgcHJvdmlkZWQsIHVzZSB0aGF0XG4gICAgICogaW5zdGVhZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMgLSBUaGUgZXhpc3RpbmcgYXR0cmlidXRlcyBvYmplY3QuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRlY2xhcmF0aW9uIC0gVGhlIGF0dHJpYnV0ZSBkZWNsYXJhdGlvbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUaGUgYXR0cmlidXRlIGluZGV4LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldEF0dHJpYnV0ZUluZGV4KCBhdHRyaWJ1dGVzLCBkZWNsYXJhdGlvbiApIHtcbiAgICAgICAgLy8gY2hlY2sgaWYgYXR0cmlidXRlIGlzIGFscmVhZHkgZGVjbGFyZWQsIGlmIHNvLCB1c2UgdGhhdCBpbmRleFxuICAgICAgICBpZiAoIGF0dHJpYnV0ZXNbIGRlY2xhcmF0aW9uLm5hbWUgXSApIHtcbiAgICAgICAgICAgIHJldHVybiBhdHRyaWJ1dGVzWyBkZWNsYXJhdGlvbi5uYW1lIF0uaW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmV0dXJuIG5leHQgYXZhaWxhYmxlIGluZGV4XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyggYXR0cmlidXRlcyApLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHaXZlbiB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlciBzb3VyY2UsIHBhcnNlcyB0aGUgZGVjbGFyYXRpb25zIGFuZCBhcHBlbmRzIGluZm9ybWF0aW9uIHBlcnRhaW5pbmcgdG8gdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ0dWVzIGRlY2xhcmVkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1NoYWRlcn0gc2hhZGVyIC0gVGhlIHNoYWRlciBvYmplY3QuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZlcnRTb3VyY2UgLSBUaGUgdmVydGV4IHNoYWRlciBzb3VyY2UuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGZyYWdTb3VyY2UgLSBUaGUgZnJhZ21lbnQgc2hhZGVyIHNvdXJjZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBhdHRyaWJ1dGUgYW5kIHVuaWZvcm0gaW5mb3JtYXRpb24uXG4gICAgICovXG4gICAgZnVuY3Rpb24gc2V0QXR0cmlidXRlc0FuZFVuaWZvcm1zKCBzaGFkZXIsIHZlcnRTb3VyY2UsIGZyYWdTb3VyY2UgKSB7XG4gICAgICAgIHZhciBkZWNsYXJhdGlvbnMgPSBTaGFkZXJQYXJzZXIucGFyc2VEZWNsYXJhdGlvbnMoXG4gICAgICAgICAgICBbIHZlcnRTb3VyY2UsIGZyYWdTb3VyY2UgXSxcbiAgICAgICAgICAgIFsgJ3VuaWZvcm0nLCAnYXR0cmlidXRlJyBdXG4gICAgICAgICk7XG4gICAgICAgIC8vIGZvciBlYWNoIGRlY2xhcmF0aW9uIGluIHRoZSBzaGFkZXJcbiAgICAgICAgZGVjbGFyYXRpb25zLmZvckVhY2goIGZ1bmN0aW9uKCBkZWNsYXJhdGlvbiApIHtcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIGl0cyBhbiBhdHRyaWJ1dGUgb3IgdW5pZm9ybVxuICAgICAgICAgICAgaWYgKCBkZWNsYXJhdGlvbi5xdWFsaWZpZXIgPT09ICdhdHRyaWJ1dGUnICkge1xuICAgICAgICAgICAgICAgIC8vIGlmIGF0dHJpYnV0ZSwgc3RvcmUgdHlwZSBhbmQgaW5kZXhcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRBdHRyaWJ1dGVJbmRleCggc2hhZGVyLmF0dHJpYnV0ZXMsIGRlY2xhcmF0aW9uICk7XG4gICAgICAgICAgICAgICAgc2hhZGVyLmF0dHJpYnV0ZXNbIGRlY2xhcmF0aW9uLm5hbWUgXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogZGVjbGFyYXRpb24udHlwZSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGRlY2xhcmF0aW9uLnF1YWxpZmllciA9PT0gJ3VuaWZvcm0nICkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHVuaWZvcm0sIHN0b3JlIHR5cGUgYW5kIGJ1ZmZlciBmdW5jdGlvbiBuYW1lXG4gICAgICAgICAgICAgICAgc2hhZGVyLnVuaWZvcm1zWyBkZWNsYXJhdGlvbi5uYW1lIF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGRlY2xhcmF0aW9uLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmM6IFVOSUZPUk1fRlVOQ1RJT05TWyBkZWNsYXJhdGlvbi50eXBlICsgKGRlY2xhcmF0aW9uLmNvdW50ID4gMSA/ICdbXScgOiAnJykgXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdpdmVuIGEgc2hhZGVyIHNvdXJjZSBzdHJpbmcgYW5kIHNoYWRlciB0eXBlLCBjb21waWxlcyB0aGUgc2hhZGVyIGFuZCByZXR1cm5zIHRoZSByZXN1bHRpbmcgV2ViR0xTaGFkZXIgb2JqZWN0LlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgLSBUaGUgd2ViZ2wgcmVuZGVyaW5nIGNvbnRleHQuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNoYWRlclNvdXJjZSAtIFRoZSBzaGFkZXIgc291cmNlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIC0gVGhlIHNoYWRlciB0eXBlLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1dlYkdMU2hhZGVyfSBUaGUgY29tcGlsZWQgc2hhZGVyIG9iamVjdC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjb21waWxlU2hhZGVyKCBnbCwgc2hhZGVyU291cmNlLCB0eXBlICkge1xuICAgICAgICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKCBnbFsgdHlwZSBdICk7XG4gICAgICAgIGdsLnNoYWRlclNvdXJjZSggc2hhZGVyLCBzaGFkZXJTb3VyY2UgKTtcbiAgICAgICAgZ2wuY29tcGlsZVNoYWRlciggc2hhZGVyICk7XG4gICAgICAgIGlmICggIWdsLmdldFNoYWRlclBhcmFtZXRlciggc2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyApICkge1xuICAgICAgICAgICAgdGhyb3cgJ0FuIGVycm9yIG9jY3VycmVkIGNvbXBpbGluZyB0aGUgc2hhZGVyczpcXG4nICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyggc2hhZGVyICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNoYWRlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCaW5kcyB0aGUgYXR0cmlidXRlIGxvY2F0aW9ucyBmb3IgdGhlIFNoYWRlciBvYmplY3QuXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U2hhZGVyfSBzaGFkZXIgLSBUaGUgU2hhZGVyIG9iamVjdC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBiaW5kQXR0cmlidXRlTG9jYXRpb25zKCBzaGFkZXIgKSB7XG4gICAgICAgIHZhciBnbCA9IHNoYWRlci5nbDtcbiAgICAgICAgdmFyIGF0dHJpYnV0ZXMgPSBzaGFkZXIuYXR0cmlidXRlcztcbiAgICAgICAgT2JqZWN0LmtleXMoIGF0dHJpYnV0ZXMgKS5mb3JFYWNoKCBmdW5jdGlvbigga2V5ICkge1xuICAgICAgICAgICAgLy8gYmluZCB0aGUgYXR0cmlidXRlIGxvY2F0aW9uXG4gICAgICAgICAgICBnbC5iaW5kQXR0cmliTG9jYXRpb24oXG4gICAgICAgICAgICAgICAgc2hhZGVyLnByb2dyYW0sXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc1sga2V5IF0uaW5kZXgsXG4gICAgICAgICAgICAgICAga2V5ICk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFF1ZXJpZXMgdGhlIHdlYmdsIHJlbmRlcmluZyBjb250ZXh0IGZvciB0aGUgdW5pZm9ybSBsb2NhdGlvbnMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U2hhZGVyfSBzaGFkZXIgLSBUaGUgU2hhZGVyIG9iamVjdC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRVbmlmb3JtTG9jYXRpb25zKCBzaGFkZXIgKSB7XG4gICAgICAgIHZhciBnbCA9IHNoYWRlci5nbDtcbiAgICAgICAgdmFyIHVuaWZvcm1zID0gc2hhZGVyLnVuaWZvcm1zO1xuICAgICAgICBPYmplY3Qua2V5cyggdW5pZm9ybXMgKS5mb3JFYWNoKCBmdW5jdGlvbigga2V5ICkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSB1bmlmb3JtIGxvY2F0aW9uXG4gICAgICAgICAgICB1bmlmb3Jtc1sga2V5IF0ubG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oIHNoYWRlci5wcm9ncmFtLCBrZXkgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGZ1bmN0aW9uIHRvIGxvYWQgc2hhZGVyIHNvdXJjZSBmcm9tIGEgdXJsLlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIC0gVGhlIHVybCB0byBsb2FkIHRoZSByZXNvdXJjZSBmcm9tLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBUaGUgZnVuY3Rpb24gdG8gbG9hZCB0aGUgc2hhZGVyIHNvdXJjZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBsb2FkU2hhZGVyU291cmNlKCB1cmwgKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiggZG9uZSApIHtcbiAgICAgICAgICAgIFhIUkxvYWRlci5sb2FkKHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICByZXNwb25zZVR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgICAgICAgICAgICBkb25lKCBudWxsLCByZXMgKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgICAgICAgICAgICBkb25lKCBlcnIsIG51bGwgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdG8gcGFzcyB0aHJvdWdoIHRoZSBzaGFkZXIgc291cmNlLlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIC0gVGhlIHNvdXJjZSBvZiB0aGUgc2hhZGVyLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBUaGUgZnVuY3Rpb24gdG8gcGFzcyB0aHJvdWdoIHRoZSBzaGFkZXIgc291cmNlLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHBhc3NUaHJvdWdoU291cmNlKCBzb3VyY2UgKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiggZG9uZSApIHtcbiAgICAgICAgICAgIGRvbmUoIG51bGwsIHNvdXJjZSApO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IHRha2VzIGFuIGFycmF5IG9mIEdMU0wgc291cmNlIHN0cmluZ3MgYW5kIFVSTHMsIGFuZCByZXNvbHZlcyB0aGVtIGludG8gYW5kIGFycmF5IG9mIEdMU0wgc291cmNlLlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBzb3VyY2VzIC0gVGhlIHNoYWRlciBzb3VyY2VzLlxuICAgICAqXG4gICAgICogQHJldHVybnMgLSBBIGZ1bmN0aW9uIHRvIHJlc29sdmUgdGhlIHNoYWRlciBzb3VyY2VzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlc29sdmVTb3VyY2VzKCBzb3VyY2VzICkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oIGRvbmUgKSB7XG4gICAgICAgICAgICB2YXIgdGFza3MgPSBbXTtcbiAgICAgICAgICAgIHNvdXJjZXMgPSBzb3VyY2VzIHx8IFtdO1xuICAgICAgICAgICAgc291cmNlcyA9ICggISggc291cmNlcyBpbnN0YW5jZW9mIEFycmF5ICkgKSA/IFsgc291cmNlcyBdIDogc291cmNlcztcbiAgICAgICAgICAgIHNvdXJjZXMuZm9yRWFjaCggZnVuY3Rpb24oIHNvdXJjZSApIHtcbiAgICAgICAgICAgICAgICBpZiAoIFNoYWRlclBhcnNlci5pc0dMU0woIHNvdXJjZSApICkge1xuICAgICAgICAgICAgICAgICAgICB0YXNrcy5wdXNoKCBwYXNzVGhyb3VnaFNvdXJjZSggc291cmNlICkgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0YXNrcy5wdXNoKCBsb2FkU2hhZGVyU291cmNlKCBzb3VyY2UgKSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgQXN5bmMucGFyYWxsZWwoIHRhc2tzLCBkb25lICk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyB0aGUgc2hhZGVyIHByb2dyYW0gb2JqZWN0IGZyb20gc291cmNlIHN0cmluZ3MuIFRoaXMgaW5jbHVkZXM6XG4gICAgICogICAgMSkgQ29tcGlsaW5nIGFuZCBsaW5raW5nIHRoZSBzaGFkZXIgcHJvZ3JhbS5cbiAgICAgKiAgICAyKSBQYXJzaW5nIHNoYWRlciBzb3VyY2UgZm9yIGF0dHJpYnV0ZSBhbmQgdW5pZm9ybSBpbmZvcm1hdGlvbi5cbiAgICAgKiAgICAzKSBCaW5kaW5nIGF0dHJpYnV0ZSBsb2NhdGlvbnMsIGJ5IG9yZGVyIG9mIGRlbGNhcmF0aW9uLlxuICAgICAqICAgIDQpIFF1ZXJ5aW5nIGFuZCBzdG9yaW5nIHVuaWZvcm0gbG9jYXRpb24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U2hhZGVyfSBzaGFkZXIgLSBUaGUgU2hhZGVyIG9iamVjdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc291cmNlcyAtIEEgbWFwIGNvbnRhaW5pbmcgc291cmNlcyB1bmRlciAndmVydCcgYW5kICdmcmFnJyBhdHRyaWJ1dGVzLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1NoYWRlcn0gVGhlIHNoYWRlciBvYmplY3QsIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjcmVhdGVQcm9ncmFtKCBzaGFkZXIsIHNvdXJjZXMgKSB7XG4gICAgICAgIHZhciBnbCA9IHNoYWRlci5nbDtcbiAgICAgICAgdmFyIGNvbW1vbiA9IHNvdXJjZXMuY29tbW9uLmpvaW4oICcnICk7XG4gICAgICAgIHZhciB2ZXJ0ID0gc291cmNlcy52ZXJ0LmpvaW4oICcnICk7XG4gICAgICAgIHZhciBmcmFnID0gc291cmNlcy5mcmFnLmpvaW4oICcnICk7XG4gICAgICAgIC8vIGNvbXBpbGUgc2hhZGVyc1xuICAgICAgICB2YXIgdmVydGV4U2hhZGVyID0gY29tcGlsZVNoYWRlciggZ2wsIGNvbW1vbiArIHZlcnQsICdWRVJURVhfU0hBREVSJyApO1xuICAgICAgICB2YXIgZnJhZ21lbnRTaGFkZXIgPSBjb21waWxlU2hhZGVyKCBnbCwgY29tbW9uICsgZnJhZywgJ0ZSQUdNRU5UX1NIQURFUicgKTtcbiAgICAgICAgLy8gcGFyc2Ugc291cmNlIGZvciBhdHRyaWJ1dGUgYW5kIHVuaWZvcm1zXG4gICAgICAgIHNldEF0dHJpYnV0ZXNBbmRVbmlmb3Jtcyggc2hhZGVyLCB2ZXJ0LCBmcmFnICk7XG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgc2hhZGVyIHByb2dyYW1cbiAgICAgICAgc2hhZGVyLnByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICAgIC8vIGF0dGFjaCB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlcnNcbiAgICAgICAgZ2wuYXR0YWNoU2hhZGVyKCBzaGFkZXIucHJvZ3JhbSwgdmVydGV4U2hhZGVyICk7XG4gICAgICAgIGdsLmF0dGFjaFNoYWRlciggc2hhZGVyLnByb2dyYW0sIGZyYWdtZW50U2hhZGVyICk7XG4gICAgICAgIC8vIGJpbmQgdmVydGV4IGF0dHJpYnV0ZSBsb2NhdGlvbnMgQkVGT1JFIGxpbmtpbmdcbiAgICAgICAgYmluZEF0dHJpYnV0ZUxvY2F0aW9ucyggc2hhZGVyICk7XG4gICAgICAgIC8vIGxpbmsgc2hhZGVyXG4gICAgICAgIGdsLmxpbmtQcm9ncmFtKCBzaGFkZXIucHJvZ3JhbSApO1xuICAgICAgICAvLyBJZiBjcmVhdGluZyB0aGUgc2hhZGVyIHByb2dyYW0gZmFpbGVkLCBhbGVydFxuICAgICAgICBpZiAoICFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKCBzaGFkZXIucHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMgKSApIHtcbiAgICAgICAgICAgIHRocm93ICdBbiBlcnJvciBvY2N1cmVkIGxpbmtpbmcgdGhlIHNoYWRlcjpcXG4nICsgZ2wuZ2V0UHJvZ3JhbUluZm9Mb2coIHNoYWRlci5wcm9ncmFtICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZ2V0IHNoYWRlciB1bmlmb3JtIGxvY2F0aW9uc1xuICAgICAgICBnZXRVbmlmb3JtTG9jYXRpb25zKCBzaGFkZXIgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZXMgYSBTaGFkZXIgb2JqZWN0LlxuICAgICAqIEBjbGFzcyBTaGFkZXJcbiAgICAgKiBAY2xhc3NkZXNjIEEgc2hhZGVyIGNsYXNzIHRvIGFzc2lzdCBpbiBjb21waWxpbmcgYW5kIGxpbmtpbmcgd2ViZ2xcbiAgICAgKiBzaGFkZXJzLCBzdG9yaW5nIGF0dHJpYnV0ZSBhbmQgdW5pZm9ybSBsb2NhdGlvbnMsIGFuZCBidWZmZXJpbmcgdW5pZm9ybXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3BlYyAtIFRoZSBzaGFkZXIgc3BlY2lmaWNhdGlvbiBvYmplY3QuXG4gICAgICogQHBhcmFtIHtTdHJpbmd8U3RyaW5nW118T2JqZWN0fSBzcGVjLmNvbW1vbiAtIFNvdXJjZXMgLyBVUkxzIHRvIGJlIHNoYXJlZCBieSBib3RoIHZ2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlcnMuXG4gICAgICogQHBhcmFtIHtTdHJpbmd8U3RyaW5nW118T2JqZWN0fSBzcGVjLnZlcnQgLSBUaGUgdmVydGV4IHNoYWRlciBzb3VyY2VzIC8gVVJMcy5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xTdHJpbmdbXXxPYmplY3R9IHNwZWMuZnJhZyAtIFRoZSBmcmFnbWVudCBzaGFkZXIgc291cmNlcyAvIFVSTHMuXG4gICAgICogQHBhcmFtIHtTdHJpbmdbXX0gc3BlYy5hdHRyaWJ1dGVzIC0gVGhlIGF0dHJpYnV0ZSBpbmRleCBvcmRlcmluZ3MuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSBvbmNlIHRoZSBzaGFkZXJcbiAgICAgKiAgICAgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IGNvbXBpbGVkIGFuZCBsaW5rZWQuXG4gICAgICovXG4gICAgZnVuY3Rpb24gU2hhZGVyKCBzcGVjLCBjYWxsYmFjayApIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICBzcGVjID0gc3BlYyB8fCB7fTtcbiAgICAgICAgLy8gY2hlY2sgc291cmNlIGFyZ3VtZW50c1xuICAgICAgICBpZiAoICFzcGVjLnZlcnQgKSB7XG4gICAgICAgICAgICB0aHJvdyAnVmVydGV4IHNoYWRlciBhcmd1bWVudCBoYXMgbm90IGJlZW4gcHJvdmlkZWQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICggIXNwZWMuZnJhZyApIHtcbiAgICAgICAgICAgIHRocm93ICdGcmFnbWVudCBzaGFkZXIgYXJndW1lbnQgaGFzIG5vdCBiZWVuIHByb3ZpZGVkJztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb2dyYW0gPSAwO1xuICAgICAgICB0aGlzLmdsID0gV2ViR0xDb250ZXh0LmdldCgpO1xuICAgICAgICB0aGlzLnN0YXRlID0gV2ViR0xDb250ZXh0U3RhdGUuZ2V0KCB0aGlzLmdsICk7XG4gICAgICAgIHRoaXMudmVyc2lvbiA9IHNwZWMudmVyc2lvbiB8fCAnMS4wMCc7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgICAgICB0aGlzLnVuaWZvcm1zID0ge307XG4gICAgICAgIC8vIGlmIGF0dHJpYnV0ZSBvcmRlcmluZyBpcyBwcm92aWRlZCwgdXNlIHRob3NlIGluZGljZXNcbiAgICAgICAgaWYgKCBzcGVjLmF0dHJpYnV0ZXMgKSB7XG4gICAgICAgICAgICBzcGVjLmF0dHJpYnV0ZXMuZm9yRWFjaCggZnVuY3Rpb24oIGF0dHIsIGluZGV4ICkge1xuICAgICAgICAgICAgICAgIHRoYXQuYXR0cmlidXRlc1sgYXR0ciBdID0ge1xuICAgICAgICAgICAgICAgICAgICBpbmRleDogaW5kZXhcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY3JlYXRlIHRoZSBzaGFkZXJcbiAgICAgICAgQXN5bmMucGFyYWxsZWwoe1xuICAgICAgICAgICAgY29tbW9uOiByZXNvbHZlU291cmNlcyggc3BlYy5jb21tb24gKSxcbiAgICAgICAgICAgIHZlcnQ6IHJlc29sdmVTb3VyY2VzKCBzcGVjLnZlcnQgKSxcbiAgICAgICAgICAgIGZyYWc6IHJlc29sdmVTb3VyY2VzKCBzcGVjLmZyYWcgKSxcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciwgc291cmNlcyApIHtcbiAgICAgICAgICAgIGlmICggZXJyICkge1xuICAgICAgICAgICAgICAgIGlmICggY2FsbGJhY2sgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCBlcnIsIG51bGwgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gb25jZSBhbGwgc2hhZGVyIHNvdXJjZXMgYXJlIGxvYWRlZFxuICAgICAgICAgICAgY3JlYXRlUHJvZ3JhbSggdGhhdCwgc291cmNlcyApO1xuICAgICAgICAgICAgaWYgKCBjYWxsYmFjayApIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayggbnVsbCwgdGhhdCApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCaW5kcyB0aGUgc2hhZGVyIG9iamVjdCBhbmQgcHVzaGVzIGl0IHRvIHRoZSBmcm9udCBvZiB0aGUgc3RhY2suXG4gICAgICogQG1lbWJlcm9mIFNoYWRlclxuICAgICAqXG4gICAgICogQHJldHVybnMge1NoYWRlcn0gVGhlIHNoYWRlciBvYmplY3QsIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBTaGFkZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gaWYgdGhpcyBzaGFkZXIgaXMgYWxyZWFkeSBib3VuZCwgbm8gbmVlZCB0byByZWJpbmRcbiAgICAgICAgaWYgKCB0aGlzLnN0YXRlLnNoYWRlcnMudG9wKCkgIT09IHRoaXMgKSB7XG4gICAgICAgICAgICB0aGlzLmdsLnVzZVByb2dyYW0oIHRoaXMucHJvZ3JhbSApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdGUuc2hhZGVycy5wdXNoKCB0aGlzICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBVbmJpbmRzIHRoZSBzaGFkZXIgb2JqZWN0IGFuZCBiaW5kcyB0aGUgc2hhZGVyIGJlbmVhdGggaXQgb24gdGhpcyBzdGFjay4gSWYgdGhlcmUgaXMgbm8gdW5kZXJseWluZyBzaGFkZXIsIGJpbmQgdGhlIGJhY2tidWZmZXIuXG4gICAgICogQG1lbWJlcm9mIFNoYWRlclxuICAgICAqXG4gICAgICogQHJldHVybnMge1NoYWRlcn0gVGhlIHNoYWRlciBvYmplY3QsIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBTaGFkZXIucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICAvLyBpZiB0aGVyZSBpcyBubyBzaGFkZXIgYm91bmQsIGV4aXQgZWFybHlcbiAgICAgICAgaWYgKCBzdGF0ZS5zaGFkZXJzLnRvcCgpICE9PSB0aGlzICkge1xuICAgICAgICAgICAgdGhyb3cgJ1NoYWRlciBpcyBub3QgdGhlIHRvcCBtb3N0IGVsZW1lbnQgb24gdGhlIHN0YWNrJztcbiAgICAgICAgfVxuICAgICAgICAvLyBwb3Agc2hhZGVyIG9mZiBzdGFja1xuICAgICAgICBzdGF0ZS5zaGFkZXJzLnBvcCgpO1xuICAgICAgICAvLyBpZiB0aGVyZSBpcyBhbiB1bmRlcmx5aW5nIHNoYWRlciwgYmluZCBpdFxuICAgICAgICB2YXIgdG9wID0gc3RhdGUuc2hhZGVycy50b3AoKTtcbiAgICAgICAgaWYgKCB0b3AgJiYgdG9wICE9PSB0aGlzICkge1xuICAgICAgICAgICAgdG9wLmdsLnVzZVByb2dyYW0oIHRvcC5wcm9ncmFtICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1bmJpbmQgdGhlIHNoYWRlclxuICAgICAgICAgICAgdGhpcy5nbC51c2VQcm9ncmFtKCBudWxsICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEJ1ZmZlciBhIHVuaWZvcm0gdmFsdWUgYnkgbmFtZS5cbiAgICAgKiBAbWVtYmVyb2YgU2hhZGVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSB1bmlmb3JtIG5hbWUgaW4gdGhlIHNoYWRlciBzb3VyY2UuXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSAtIFRoZSB1bmlmb3JtIHZhbHVlIHRvIGJ1ZmZlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtTaGFkZXJ9IFRoZSBzaGFkZXIgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgU2hhZGVyLnByb3RvdHlwZS5zZXRVbmlmb3JtID0gZnVuY3Rpb24oIG5hbWUsIHZhbHVlICkge1xuICAgICAgICAvLyBlbnN1cmUgc2hhZGVyIGlzIGJvdW5kXG4gICAgICAgIGlmICggdGhpcyAhPT0gdGhpcy5zdGF0ZS5zaGFkZXJzLnRvcCgpICkge1xuICAgICAgICAgICAgdGhyb3cgJ0F0dGVtcHRpbmcgdG8gc2V0IHVuaWZvcm0gYCcgKyBuYW1lICsgJ2AgZm9yIGFuIHVuYm91bmQgc2hhZGVyJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgdW5pZm9ybSA9IHRoaXMudW5pZm9ybXNbIG5hbWUgXTtcbiAgICAgICAgLy8gZW5zdXJlIHRoYXQgdGhlIHVuaWZvcm0gc3BlYyBleGlzdHMgZm9yIHRoZSBuYW1lXG4gICAgICAgIGlmICggIXVuaWZvcm0gKSB7XG4gICAgICAgICAgICB0aHJvdyAnTm8gdW5pZm9ybSBmb3VuZCB1bmRlciBuYW1lIGAnICsgbmFtZSArICdgJztcbiAgICAgICAgfVxuICAgICAgICAvLyBjaGVjayB2YWx1ZVxuICAgICAgICBpZiAoIHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgKSB7XG4gICAgICAgICAgICAvLyBlbnN1cmUgdGhhdCB0aGUgdW5pZm9ybSBhcmd1bWVudCBpcyBkZWZpbmVkXG4gICAgICAgICAgICB0aHJvdyAnQXJndW1lbnQgcGFzc2VkIGZvciB1bmlmb3JtIGAnICsgbmFtZSArICdgIGlzIHVuZGVmaW5lZCc7XG4gICAgICAgIH0gZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgKSB7XG4gICAgICAgICAgICAvLyBjb252ZXJ0IEFycmF5IHRvIEZsb2F0MzJBcnJheVxuICAgICAgICAgICAgdmFsdWUgPSBuZXcgRmxvYXQzMkFycmF5KCB2YWx1ZSApO1xuICAgICAgICB9IGVsc2UgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyApIHtcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgYm9vbGVhbidzIHRvIDAgb3IgMVxuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSA/IDEgOiAwO1xuICAgICAgICB9XG4gICAgICAgIC8vIHBhc3MgdGhlIGFyZ3VtZW50cyBkZXBlbmRpbmcgb24gdGhlIHR5cGVcbiAgICAgICAgaWYgKCB1bmlmb3JtLnR5cGUgPT09ICdtYXQyJyB8fCB1bmlmb3JtLnR5cGUgPT09ICdtYXQzJyB8fCB1bmlmb3JtLnR5cGUgPT09ICdtYXQ0JyApIHtcbiAgICAgICAgICAgIHRoaXMuZ2xbIHVuaWZvcm0uZnVuYyBdKCB1bmlmb3JtLmxvY2F0aW9uLCBmYWxzZSwgdmFsdWUgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ2xbIHVuaWZvcm0uZnVuYyBdKCB1bmlmb3JtLmxvY2F0aW9uLCB2YWx1ZSApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBCdWZmZXIgYSBtYXAgb2YgdW5pZm9ybSB2YWx1ZXMuXG4gICAgICogQG1lbWJlcm9mIFNoYWRlclxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHVuaWZvcm1zIC0gVGhlIG1hcCBvZiB1bmlmb3JtcyBrZXllZCBieSBuYW1lLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1NoYWRlcn0gVGhlIHNoYWRlciBvYmplY3QsIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICBTaGFkZXIucHJvdG90eXBlLnNldFVuaWZvcm1zID0gZnVuY3Rpb24oIGFyZ3MgKSB7XG4gICAgICAgIC8vIGVuc3VyZSBzaGFkZXIgaXMgYm91bmRcbiAgICAgICAgaWYgKCB0aGlzICE9PSB0aGlzLnN0YXRlLnNoYWRlcnMudG9wKCkgKSB7XG4gICAgICAgICAgICB0aHJvdyAnQXR0ZW1wdGluZyB0byBzZXQgdW5pZm9ybSBgJyArIG5hbWUgKyAnYCBmb3IgYW4gdW5ib3VuZCBzaGFkZXInO1xuICAgICAgICB9XG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgICAgIHZhciB1bmlmb3JtcyA9IHRoaXMudW5pZm9ybXM7XG4gICAgICAgIE9iamVjdC5rZXlzKCBhcmdzICkuZm9yRWFjaCggZnVuY3Rpb24oIG5hbWUgKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBhcmdzW25hbWVdO1xuICAgICAgICAgICAgdmFyIHVuaWZvcm0gPSB1bmlmb3Jtc1tuYW1lXTtcbiAgICAgICAgICAgIC8vIGVuc3VyZSB0aGF0IHRoZSB1bmlmb3JtIGV4aXN0cyBmb3IgdGhlIG5hbWVcbiAgICAgICAgICAgIGlmICggIXVuaWZvcm0gKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ05vIHVuaWZvcm0gZm91bmQgdW5kZXIgbmFtZSBgJyArIG5hbWUgKyAnYCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIHZhbHVlID09PSB1bmRlZmluZWQgfHwgdmFsdWUgPT09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgLy8gZW5zdXJlIHRoYXQgdGhlIHVuaWZvcm0gYXJndW1lbnQgaXMgZGVmaW5lZFxuICAgICAgICAgICAgICAgIHRocm93ICdBcmd1bWVudCBwYXNzZWQgZm9yIHVuaWZvcm0gYCcgKyBuYW1lICsgJ2AgaXMgdW5kZWZpbmVkJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHZhbHVlIGluc3RhbmNlb2YgQXJyYXkgKSB7XG4gICAgICAgICAgICAgICAgLy8gY29udmVydCBBcnJheSB0byBGbG9hdDMyQXJyYXlcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG5ldyBGbG9hdDMyQXJyYXkoIHZhbHVlICk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyApIHtcbiAgICAgICAgICAgICAgICAvLyBjb252ZXJ0IGJvb2xlYW4ncyB0byAwIG9yIDFcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlID8gMSA6IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBwYXNzIHRoZSBhcmd1bWVudHMgZGVwZW5kaW5nIG9uIHRoZSB0eXBlXG4gICAgICAgICAgICBpZiAoIHVuaWZvcm0udHlwZSA9PT0gJ21hdDInIHx8IHVuaWZvcm0udHlwZSA9PT0gJ21hdDMnIHx8IHVuaWZvcm0udHlwZSA9PT0gJ21hdDQnICkge1xuICAgICAgICAgICAgICAgIGdsWyB1bmlmb3JtLmZ1bmMgXSggdW5pZm9ybS5sb2NhdGlvbiwgZmFsc2UsIHZhbHVlICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGdsWyB1bmlmb3JtLmZ1bmMgXSggdW5pZm9ybS5sb2NhdGlvbiwgdmFsdWUgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFNoYWRlcjtcblxufSgpKTtcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBQUkVDSVNJT05fUVVBTElGSUVSUyA9IHtcclxuICAgICAgICBoaWdocDogdHJ1ZSxcclxuICAgICAgICBtZWRpdW1wOiB0cnVlLFxyXG4gICAgICAgIGxvd3A6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgdmFyIFBSRUNJU0lPTl9UWVBFUyA9IHtcclxuICAgICAgICBmbG9hdDogJ2Zsb2F0JyxcclxuICAgICAgICB2ZWMyOiAnZmxvYXQnLFxyXG4gICAgICAgIHZlYzM6ICdmbG9hdCcsXHJcbiAgICAgICAgdmVjNDogJ2Zsb2F0JyxcclxuICAgICAgICBpdmVjMjogJ2ludCcsXHJcbiAgICAgICAgaXZlYzM6ICdpbnQnLFxyXG4gICAgICAgIGl2ZWM0OiAnaW50JyxcclxuICAgICAgICBpbnQ6ICdpbnQnLFxyXG4gICAgICAgIHVpbnQ6ICdpbnQnLFxyXG4gICAgICAgIHNhbXBsZXIyRDogJ3NhbXBsZXIyRCcsXHJcbiAgICAgICAgc2FtcGxlckN1YmU6ICdzYW1wbGVyQ3ViZScsXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBDT01NRU5UU19SRUdFWFAgPSAvKFxcL1xcKihbXFxzXFxTXSo/KVxcKlxcLyl8KFxcL1xcLyguKikkKS9nbTtcclxuICAgIHZhciBFTkRMSU5FX1JFR0VYUCA9IC8oXFxyXFxufFxcbnxcXHIpL2dtO1xyXG4gICAgdmFyIFdISVRFU1BBQ0VfUkVHRVhQID0gL1xcc3syLH0vZztcclxuICAgIHZhciBCUkFDS0VUX1dISVRFU1BBQ0VfUkVHRVhQID0gLyhcXHMqKShcXFspKFxccyopKFxcZCspKFxccyopKFxcXSkoXFxzKikvZztcclxuICAgIHZhciBOQU1FX0NPVU5UX1JFR0VYUCA9IC8oW2EtekEtWl9dW2EtekEtWjAtOV9dKikoPzpcXFsoXFxkKylcXF0pPy87XHJcbiAgICB2YXIgUFJFQ0lTSU9OX1JFR0VYID0gL1xcYihwcmVjaXNpb24pXFxzKyhcXHcrKVxccysoXFx3KykvO1xyXG4gICAgdmFyIEdMU0xfUkVHRVhQID0gIC92b2lkXFxzK21haW5cXHMqXFwoXFxzKih2b2lkKSpcXHMqXFwpXFxzKi9taTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlbW92ZXMgc3RhbmRhcmQgY29tbWVudHMgZnJvbSB0aGUgcHJvdmlkZWQgc3RyaW5nLlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3RyIC0gVGhlIHN0cmluZyB0byBzdHJpcCBjb21tZW50cyBmcm9tLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBjb21tZW50bGVzcyBzdHJpbmcuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHN0cmlwQ29tbWVudHMoIHN0ciApIHtcclxuICAgICAgICAvLyByZWdleCBzb3VyY2U6IGh0dHBzOi8vZ2l0aHViLmNvbS9tb2Fncml1cy9zdHJpcGNvbW1lbnRzXHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKCBDT01NRU5UU19SRUdFWFAsICcnICk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb252ZXJ0cyBhbGwgd2hpdGVzcGFjZSBpbnRvIGEgc2luZ2xlICcgJyBzcGFjZSBjaGFyYWN0ZXIuXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgLSBUaGUgc3RyaW5nIHRvIG5vcm1hbGl6ZSB3aGl0ZXNwYWNlIGZyb20uXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1N0cmluZ30gVGhlIG5vcm1hbGl6ZWQgc3RyaW5nLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBub3JtYWxpemVXaGl0ZXNwYWNlKCBzdHIgKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKCBFTkRMSU5FX1JFR0VYUCwgJyAnICkgLy8gcmVtb3ZlIGxpbmUgZW5kaW5nc1xyXG4gICAgICAgICAgICAucmVwbGFjZSggV0hJVEVTUEFDRV9SRUdFWFAsICcgJyApIC8vIG5vcm1hbGl6ZSB3aGl0ZXNwYWNlIHRvIHNpbmdsZSAnICdcclxuICAgICAgICAgICAgLnJlcGxhY2UoIEJSQUNLRVRfV0hJVEVTUEFDRV9SRUdFWFAsICckMiQ0JDYnICk7IC8vIHJlbW92ZSB3aGl0ZXNwYWNlIGluIGJyYWNrZXRzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZXMgdGhlIG5hbWUgYW5kIGNvdW50IG91dCBvZiBhIG5hbWUgc3RhdGVtZW50LCByZXR1cm5pbmcgdGhlXHJcbiAgICAgKiBkZWNsYXJhdGlvbiBvYmplY3QuXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBxdWFsaWZpZXIgLSBUaGUgcXVhbGlmaWVyIHN0cmluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwcmVjaXNpb24gLSBUaGUgcHJlY2lzaW9uIHN0cmluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIC0gVGhlIHR5cGUgc3RyaW5nLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGVudHJ5IC0gVGhlIHZhcmlhYmxlIGRlY2xhcmF0aW9uIHN0cmluZy5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgZGVjbGFyYXRpb24gb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZU5hbWVBbmRDb3VudCggcXVhbGlmaWVyLCBwcmVjaXNpb24sIHR5cGUsIGVudHJ5ICkge1xyXG4gICAgICAgIC8vIGRldGVybWluZSBuYW1lIGFuZCBzaXplIG9mIHZhcmlhYmxlXHJcbiAgICAgICAgdmFyIG1hdGNoZXMgPSBlbnRyeS5tYXRjaCggTkFNRV9DT1VOVF9SRUdFWFAgKTtcclxuICAgICAgICB2YXIgbmFtZSA9IG1hdGNoZXNbMV07XHJcbiAgICAgICAgdmFyIGNvdW50ID0gKCBtYXRjaGVzWzJdID09PSB1bmRlZmluZWQgKSA/IDEgOiBwYXJzZUludCggbWF0Y2hlc1syXSwgMTAgKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBxdWFsaWZpZXI6IHF1YWxpZmllcixcclxuICAgICAgICAgICAgcHJlY2lzaW9uOiBwcmVjaXNpb24sXHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgIGNvdW50OiBjb3VudFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQYXJzZXMgYSBzaW5nbGUgJ3N0YXRlbWVudCcuIEEgJ3N0YXRlbWVudCcgaXMgY29uc2lkZXJlZCBhbnkgc2VxdWVuY2Ugb2ZcclxuICAgICAqIGNoYXJhY3RlcnMgZm9sbG93ZWQgYnkgYSBzZW1pLWNvbG9uLiBUaGVyZWZvcmUsIGEgc2luZ2xlICdzdGF0ZW1lbnQnIGluXHJcbiAgICAgKiB0aGlzIHNlbnNlIGNvdWxkIGNvbnRhaW4gc2V2ZXJhbCBjb21tYSBzZXBhcmF0ZWQgZGVjbGFyYXRpb25zLiBSZXR1cm5zXHJcbiAgICAgKiBhbGwgcmVzdWx0aW5nIGRlY2xhcmF0aW9ucy5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0YXRlbWVudCAtIFRoZSBzdGF0ZW1lbnQgdG8gcGFyc2UuXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJlY2lzaW9ucyAtIFRoZSBjdXJyZW50IHN0YXRlIG9mIGdsb2JhbCBwcmVjaXNpb25zLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGFycmF5IG9mIHBhcnNlZCBkZWNsYXJhdGlvbiBvYmplY3RzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZVN0YXRlbWVudCggc3RhdGVtZW50LCBwcmVjaXNpb25zICkge1xyXG4gICAgICAgIC8vIHNwbGl0IHN0YXRlbWVudCBvbiBjb21tYXNcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIFsgJ3VuaWZvcm0gaGlnaHAgbWF0NCBBWzEwXScsICdCJywgJ0NbMl0nIF1cclxuICAgICAgICAvL1xyXG4gICAgICAgIHZhciBjb21tYVNwbGl0ID0gc3RhdGVtZW50LnNwbGl0KCcsJykubWFwKCBmdW5jdGlvbiggZWxlbSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZW0udHJpbSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBzcGxpdCBkZWNsYXJhdGlvbiBoZWFkZXIgZnJvbSBzdGF0ZW1lbnRcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIFsgJ3VuaWZvcm0nLCAnaGlnaHAnLCAnbWF0NCcsICdBWzEwXScgXVxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgdmFyIGhlYWRlciA9IGNvbW1hU3BsaXQuc2hpZnQoKS5zcGxpdCgnICcpO1xyXG5cclxuICAgICAgICAvLyBxdWFsaWZpZXIgaXMgYWx3YXlzIGZpcnN0IGVsZW1lbnRcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vICd1bmlmb3JtJ1xyXG4gICAgICAgIC8vXHJcbiAgICAgICAgdmFyIHF1YWxpZmllciA9IGhlYWRlci5zaGlmdCgpO1xyXG5cclxuICAgICAgICAvLyBwcmVjaXNpb24gbWF5IG9yIG1heSBub3QgYmUgZGVjbGFyZWRcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vICdoaWdocCcgfHwgKGlmIGl0IHdhcyBvbWl0ZWQpICdtYXQ0J1xyXG4gICAgICAgIC8vXHJcbiAgICAgICAgdmFyIHByZWNpc2lvbiA9IGhlYWRlci5zaGlmdCgpO1xyXG4gICAgICAgIHZhciB0eXBlO1xyXG4gICAgICAgIC8vIGlmIG5vdCBhIHByZWNpc2lvbiBrZXl3b3JkIGl0IGlzIHRoZSB0eXBlIGluc3RlYWRcclxuICAgICAgICBpZiAoICFQUkVDSVNJT05fUVVBTElGSUVSU1sgcHJlY2lzaW9uIF0gKSB7XHJcbiAgICAgICAgICAgIHR5cGUgPSBwcmVjaXNpb247XHJcbiAgICAgICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbnNbIFBSRUNJU0lPTl9UWVBFU1sgdHlwZSBdIF07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdHlwZSA9IGhlYWRlci5zaGlmdCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gbGFzdCBwYXJ0IG9mIGhlYWRlciB3aWxsIGJlIHRoZSBmaXJzdCwgYW5kIHBvc3NpYmxlIG9ubHkgdmFyaWFibGUgbmFtZVxyXG4gICAgICAgIC8vXHJcbiAgICAgICAgLy8gWyAnQVsxMF0nLCAnQicsICdDWzJdJyBdXHJcbiAgICAgICAgLy9cclxuICAgICAgICB2YXIgbmFtZXMgPSBoZWFkZXIuY29uY2F0KCBjb21tYVNwbGl0ICk7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgYXJlIG90aGVyIG5hbWVzIGFmdGVyIGEgJywnIGFkZCB0aGVtIGFzIHdlbGxcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIG5hbWVzLmZvckVhY2goIGZ1bmN0aW9uKCBuYW1lICkge1xyXG4gICAgICAgICAgICByZXN1bHRzLnB1c2goIHBhcnNlTmFtZUFuZENvdW50KCBxdWFsaWZpZXIsIHByZWNpc2lvbiwgdHlwZSwgbmFtZSApICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTcGxpdHMgdGhlIHNvdXJjZSBzdHJpbmcgYnkgc2VtaS1jb2xvbnMgYW5kIGNvbnN0cnVjdHMgYW4gYXJyYXkgb2ZcclxuICAgICAqIGRlY2xhcmF0aW9uIG9iamVjdHMgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHF1YWxpZmllciBrZXl3b3Jkcy5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSAtIFRoZSBzaGFkZXIgc291cmNlIHN0cmluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBrZXl3b3JkcyAtIFRoZSBxdWFsaWZpZXIgZGVjbGFyYXRpb24ga2V5d29yZHMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0FycmF5fSBUaGUgYXJyYXkgb2YgcXVhbGlmaWVyIGRlY2xhcmF0aW9uIG9iamVjdHMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHBhcnNlU291cmNlKCBzb3VyY2UsIGtleXdvcmRzICkge1xyXG4gICAgICAgIC8vIHJlbW92ZSBhbGwgY29tbWVudHMgZnJvbSBzb3VyY2VcclxuICAgICAgICB2YXIgY29tbWVudGxlc3NTb3VyY2UgPSBzdHJpcENvbW1lbnRzKCBzb3VyY2UgKTtcclxuICAgICAgICAvLyBub3JtYWxpemUgYWxsIHdoaXRlc3BhY2UgaW4gdGhlIHNvdXJjZVxyXG4gICAgICAgIHZhciBub3JtYWxpemVkID0gbm9ybWFsaXplV2hpdGVzcGFjZSggY29tbWVudGxlc3NTb3VyY2UgKTtcclxuICAgICAgICAvLyBnZXQgaW5kaXZpZHVhbCBzdGF0ZW1lbnRzICggYW55IHNlcXVlbmNlIGVuZGluZyBpbiA7IClcclxuICAgICAgICB2YXIgc3RhdGVtZW50cyA9IG5vcm1hbGl6ZWQuc3BsaXQoJzsnKTtcclxuICAgICAgICAvLyBidWlsZCByZWdleCBmb3IgcGFyc2luZyBzdGF0ZW1lbnRzIHdpdGggdGFyZ2V0dGVkIGtleXdvcmRzXHJcbiAgICAgICAgdmFyIGtleXdvcmRTdHIgPSBrZXl3b3Jkcy5qb2luKCd8Jyk7XHJcbiAgICAgICAgdmFyIGtleXdvcmRSZWdleCA9IG5ldyBSZWdFeHAoICcuKlxcXFxiKCcgKyBrZXl3b3JkU3RyICsgJylcXFxcYi4qJyApO1xyXG4gICAgICAgIC8vIHBhcnNlIGFuZCBzdG9yZSBnbG9iYWwgcHJlY2lzaW9uIHN0YXRlbWVudHMgYW5kIGFueSBkZWNsYXJhdGlvbnNcclxuICAgICAgICB2YXIgcHJlY2lzaW9ucyA9IHt9O1xyXG4gICAgICAgIHZhciBtYXRjaGVkID0gW107XHJcbiAgICAgICAgLy8gZm9yIGVhY2ggc3RhdGVtZW50XHJcbiAgICAgICAgc3RhdGVtZW50cy5mb3JFYWNoKCBmdW5jdGlvbiggc3RhdGVtZW50ICkge1xyXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBwcmVjaXNpb24gc3RhdGVtZW50XHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIFsgJ3ByZWNpc2lvbiBoaWdocCBmbG9hdCcsICdwcmVjaXNpb24nLCAnaGlnaHAnLCAnZmxvYXQnIF1cclxuICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgdmFyIHBtYXRjaCA9IHN0YXRlbWVudC5tYXRjaCggUFJFQ0lTSU9OX1JFR0VYICk7XHJcbiAgICAgICAgICAgIGlmICggcG1hdGNoICkge1xyXG4gICAgICAgICAgICAgICAgcHJlY2lzaW9uc1sgcG1hdGNoWzNdIF0gPSBwbWF0Y2hbMl07XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gY2hlY2sgZm9yIGtleXdvcmRzXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vIFsgJ3VuaWZvcm0gZmxvYXQgdGltZScgXVxyXG4gICAgICAgICAgICAvL1xyXG4gICAgICAgICAgICB2YXIga21hdGNoID0gc3RhdGVtZW50Lm1hdGNoKCBrZXl3b3JkUmVnZXggKTtcclxuICAgICAgICAgICAgaWYgKCBrbWF0Y2ggKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJzZSBzdGF0ZW1lbnQgYW5kIGFkZCB0byBhcnJheVxyXG4gICAgICAgICAgICAgICAgbWF0Y2hlZCA9IG1hdGNoZWQuY29uY2F0KCBwYXJzZVN0YXRlbWVudCgga21hdGNoWzBdLCBwcmVjaXNpb25zICkgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBtYXRjaGVkO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlsdGVycyBvdXQgZHVwbGljYXRlIGRlY2xhcmF0aW9ucyBwcmVzZW50IGJldHdlZW4gc2hhZGVycy5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gZGVjbGFyYXRpb25zIC0gVGhlIGFycmF5IG9mIGRlY2xhcmF0aW9ucy5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBmaWx0ZXJlZCBhcnJheSBvZiBkZWNsYXJhdGlvbnMuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGZpbHRlckR1cGxpY2F0ZXNCeU5hbWUoIGRlY2xhcmF0aW9ucyApIHtcclxuICAgICAgICAvLyBpbiBjYXNlcyB3aGVyZSB0aGUgc2FtZSBkZWNsYXJhdGlvbnMgYXJlIHByZXNlbnQgaW4gbXVsdGlwbGVcclxuICAgICAgICAvLyBzb3VyY2VzLCB0aGlzIGZ1bmN0aW9uIHdpbGwgcmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSB0aGUgcmVzdWx0c1xyXG4gICAgICAgIHZhciBzZWVuID0ge307XHJcbiAgICAgICAgcmV0dXJuIGRlY2xhcmF0aW9ucy5maWx0ZXIoIGZ1bmN0aW9uKCBkZWNsYXJhdGlvbiApIHtcclxuICAgICAgICAgICAgaWYgKCBzZWVuWyBkZWNsYXJhdGlvbi5uYW1lIF0gKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgc2VlblsgZGVjbGFyYXRpb24ubmFtZSBdID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFBhcnNlcyB0aGUgcHJvdmlkZWQgR0xTTCBzb3VyY2UsIGFuZCByZXR1cm5zIGFsbCBkZWNsYXJhdGlvbiBzdGF0ZW1lbnRzIHRoYXQgY29udGFpbiB0aGUgcHJvdmlkZWQgcXVhbGlmaWVyIHR5cGUuIFRoaXMgY2FuIGJlIHVzZWQgdG8gZXh0cmFjdCBhbGwgYXR0cmlidXRlcyBhbmQgdW5pZm9ybSBuYW1lcyBhbmQgdHlwZXMgZnJvbSBhIHNoYWRlci5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEZvciBleGFtcGxlLCB3aGVuIHByb3ZpZGVkIGEgJ3VuaWZvcm0nIHF1YWxpZmllcnMsIHRoZSBkZWNsYXJhdGlvbjpcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqICAgICAndW5pZm9ybSBoaWdocCB2ZWMzIHVTcGVjdWxhckNvbG9yOydcclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIFdvdWxkIGJlIHBhcnNlZCB0bzpcclxuICAgICAgICAgKiAgICAge1xyXG4gICAgICAgICAqICAgICAgICAgcXVhbGlmaWVyOiAndW5pZm9ybScsXHJcbiAgICAgICAgICogICAgICAgICB0eXBlOiAndmVjMycsXHJcbiAgICAgICAgICogICAgICAgICBuYW1lOiAndVNwZWN1bGFyQ29sb3InLFxyXG4gICAgICAgICAqICAgICAgICAgY291bnQ6IDFcclxuICAgICAgICAgKiAgICAgfVxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBzb3VyY2VzIC0gVGhlIHNoYWRlciBzb3VyY2VzLlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBxdWFsaWZpZXJzIC0gVGhlIHF1YWxpZmllcnMgdG8gZXh0cmFjdC5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEByZXR1cm5zIHtBcnJheX0gVGhlIGFycmF5IG9mIHF1YWxpZmllciBkZWNsYXJhdGlvbiBzdGF0ZW1lbnRzLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHBhcnNlRGVjbGFyYXRpb25zOiBmdW5jdGlvbiggc291cmNlcywgcXVhbGlmaWVycyApIHtcclxuICAgICAgICAgICAgLy8gaWYgbm8gc291cmNlcyBvciBxdWFsaWZpZXJzIGFyZSBwcm92aWRlZCwgcmV0dXJuIGVtcHR5IGFycmF5XHJcbiAgICAgICAgICAgIGlmICggIXF1YWxpZmllcnMgfHwgcXVhbGlmaWVycy5sZW5ndGggPT09IDAgfHxcclxuICAgICAgICAgICAgICAgICFzb3VyY2VzIHx8IHNvdXJjZXMubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNvdXJjZXMgPSAoIHNvdXJjZXMgaW5zdGFuY2VvZiBBcnJheSApID8gc291cmNlcyA6IFsgc291cmNlcyBdO1xyXG4gICAgICAgICAgICBxdWFsaWZpZXJzID0gKCBxdWFsaWZpZXJzIGluc3RhbmNlb2YgQXJyYXkgKSA/IHF1YWxpZmllcnMgOiBbIHF1YWxpZmllcnMgXTtcclxuICAgICAgICAgICAgLy8gcGFyc2Ugb3V0IHRhcmdldHRlZCBkZWNsYXJhdGlvbnNcclxuICAgICAgICAgICAgdmFyIGRlY2xhcmF0aW9ucyA9IFtdO1xyXG4gICAgICAgICAgICBzb3VyY2VzLmZvckVhY2goIGZ1bmN0aW9uKCBzb3VyY2UgKSB7XHJcbiAgICAgICAgICAgICAgICBkZWNsYXJhdGlvbnMgPSBkZWNsYXJhdGlvbnMuY29uY2F0KCBwYXJzZVNvdXJjZSggc291cmNlLCBxdWFsaWZpZXJzICkgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIHJlbW92ZSBkdXBsaWNhdGVzIGFuZCByZXR1cm5cclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckR1cGxpY2F0ZXNCeU5hbWUoIGRlY2xhcmF0aW9ucyApO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERldGVjdHMgYmFzZWQgb24gdGhlIGV4aXN0ZW5jZSBvZiBhICd2b2lkIG1haW4oKSB7JyBzdGF0ZW1lbnQsIGlmIHRoZSBzdHJpbmcgaXMgZ2xzbCBzb3VyY2UgY29kZS5cclxuICAgICAgICAgKlxyXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgLSBUaGUgaW5wdXQgc3RyaW5nIHRvIHRlc3QuXHJcbiAgICAgICAgICpcclxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBUcnVlIGlmIHRoZSBzdHJpbmcgaXMgZ2xzbCBjb2RlLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlzR0xTTDogZnVuY3Rpb24oIHN0ciApIHtcclxuICAgICAgICAgICAgcmV0dXJuIEdMU0xfUkVHRVhQLnRlc3QoIHN0ciApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0Jyk7XHJcbiAgICB2YXIgV2ViR0xDb250ZXh0U3RhdGUgPSByZXF1aXJlKCcuL1dlYkdMQ29udGV4dFN0YXRlJyk7XHJcbiAgICB2YXIgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvVXRpbCcpO1xyXG4gICAgdmFyIE1BR19GSUxURVJTID0ge1xyXG4gICAgICAgIE5FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTElORUFSOiB0cnVlXHJcbiAgICB9O1xyXG4gICAgdmFyIE1JTl9GSUxURVJTID0ge1xyXG4gICAgICAgIE5FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTElORUFSOiB0cnVlLFxyXG4gICAgICAgIE5FQVJFU1RfTUlQTUFQX05FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTElORUFSX01JUE1BUF9ORUFSRVNUOiB0cnVlLFxyXG4gICAgICAgIE5FQVJFU1RfTUlQTUFQX0xJTkVBUjogdHJ1ZSxcclxuICAgICAgICBMSU5FQVJfTUlQTUFQX0xJTkVBUjogdHJ1ZVxyXG4gICAgfTtcclxuICAgIHZhciBOT05fTUlQTUFQX01JTl9GSUxURVJTID0ge1xyXG4gICAgICAgIE5FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTElORUFSOiB0cnVlLFxyXG4gICAgfTtcclxuICAgIHZhciBNSVBNQVBfTUlOX0ZJTFRFUlMgPSB7XHJcbiAgICAgICAgTkVBUkVTVF9NSVBNQVBfTkVBUkVTVDogdHJ1ZSxcclxuICAgICAgICBMSU5FQVJfTUlQTUFQX05FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTkVBUkVTVF9NSVBNQVBfTElORUFSOiB0cnVlLFxyXG4gICAgICAgIExJTkVBUl9NSVBNQVBfTElORUFSOiB0cnVlXHJcbiAgICB9O1xyXG4gICAgdmFyIFdSQVBfTU9ERVMgPSB7XHJcbiAgICAgICAgUkVQRUFUOiB0cnVlLFxyXG4gICAgICAgIE1JUlJPUkVEX1JFUEVBVDogdHJ1ZSxcclxuICAgICAgICBDTEFNUF9UT19FREdFOiB0cnVlXHJcbiAgICB9O1xyXG4gICAgdmFyIERFUFRIX1RZUEVTID0ge1xyXG4gICAgICAgIERFUFRIX0NPTVBPTkVOVDogdHJ1ZSxcclxuICAgICAgICBERVBUSF9TVEVOQ0lMOiB0cnVlXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIGRlZmF1bHQgdHlwZSBmb3IgdGV4dHVyZXMuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX1RZUEUgPSAnVU5TSUdORURfQllURSc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3JtYXQgZm9yIHRleHR1cmVzLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9GT1JNQVQgPSAnUkdCQSc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCB3cmFwIG1vZGUgZm9yIHRleHR1cmVzLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9XUkFQID0gJ1JFUEVBVCc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBtaW4gLyBtYWcgZmlsdGVyIGZvciB0ZXh0dXJlcy5cclxuICAgICAqL1xyXG4gICAgdmFyIERFRkFVTFRfRklMVEVSID0gJ0xJTkVBUic7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBhbHBoYSBwcmVtdWx0aXBseWluZyBpcyBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9QUkVNVUxUSVBMWV9BTFBIQSA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBtaXBtYXBwaW5nIGlzIGVuYWJsZWQuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX01JUE1BUCA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBpbnZlcnQteSBpcyBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9JTlZFUlRfWSA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBtaXAtbWFwcGluZyBmaWx0ZXIgc3VmZml4LlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9NSVBNQVBfTUlOX0ZJTFRFUl9TVUZGSVggPSAnX01JUE1BUF9MSU5FQVInO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zdGFudGlhdGVzIGEgVGV4dHVyZTJEIG9iamVjdC5cclxuICAgICAqIEBjbGFzcyBUZXh0dXJlMkRcclxuICAgICAqIEBjbGFzc2Rlc2MgQSB0ZXh0dXJlIGNsYXNzIHRvIHJlcHJlc2VudCBhIDJEIHRleHR1cmUuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtVaW50OEFycmF5fFVpbnQxNkFycmF5fFVpbnQzMkFycmF5fEZsb2F0MzJBcnJheXxJbWFnZURhdGF8SFRNTEltYWdlRWxlbWVudHxIVE1MQ2FudmFzRWxlbWVudHxIVE1MVmlkZW9FbGVtZW50fSBzcGVjLnNyYyAtIFRoZSBkYXRhIHRvIGJ1ZmZlci5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgdGV4dHVyZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBUaGUgaGVpZ2h0IG9mIHRoZSB0ZXh0dXJlLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMud3JhcCAtIFRoZSB3cmFwcGluZyB0eXBlIG92ZXIgYm90aCBTIGFuZCBUIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLndyYXBTIC0gVGhlIHdyYXBwaW5nIHR5cGUgb3ZlciB0aGUgUyBkaW1lbnNpb24uXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy53cmFwVCAtIFRoZSB3cmFwcGluZyB0eXBlIG92ZXIgdGhlIFQgZGltZW5zaW9uLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMuZmlsdGVyIC0gVGhlIG1pbiAvIG1hZyBmaWx0ZXIgdXNlZCBkdXJpbmcgc2NhbGluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLm1pbkZpbHRlciAtIFRoZSBtaW5pZmljYXRpb24gZmlsdGVyIHVzZWQgZHVyaW5nIHNjYWxpbmcuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy5tYWdGaWx0ZXIgLSBUaGUgbWFnbmlmaWNhdGlvbiBmaWx0ZXIgdXNlZCBkdXJpbmcgc2NhbGluZy5cclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc3BlYy5taXBNYXAgLSBXaGV0aGVyIG9yIG5vdCBtaXAtbWFwcGluZyBpcyBlbmFibGVkLlxyXG4gICAgICogQHBhcmFtIHtib29sfSBzcGVjLmludmVydFkgLSBXaGV0aGVyIG9yIG5vdCBpbnZlcnQteSBpcyBlbmFibGVkLlxyXG4gICAgICogQHBhcmFtIHtib29sfSBzcGVjLnByZU11bHRpcGx5QWxwaGEgLSBXaGV0aGVyIG9yIG5vdCBhbHBoYSBwcmVtdWx0aXBseWluZyBpcyBlbmFibGVkLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMuZm9ybWF0IC0gVGhlIHRleHR1cmUgcGl4ZWwgZm9ybWF0LlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMudHlwZSAtIFRoZSB0ZXh0dXJlIHBpeGVsIGNvbXBvbmVudCB0eXBlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBUZXh0dXJlMkQoIHNwZWMgKSB7XHJcbiAgICAgICAgc3BlYyA9IHNwZWMgfHwge307XHJcbiAgICAgICAgLy8gZ2V0IHNwZWNpZmljIHBhcmFtc1xyXG4gICAgICAgIHNwZWMud3JhcFMgPSBzcGVjLndyYXBTIHx8IHNwZWMud3JhcDtcclxuICAgICAgICBzcGVjLndyYXBUID0gc3BlYy53cmFwVCB8fCBzcGVjLndyYXA7XHJcbiAgICAgICAgc3BlYy5taW5GaWx0ZXIgPSBzcGVjLm1pbkZpbHRlciB8fCBzcGVjLmZpbHRlcjtcclxuICAgICAgICBzcGVjLm1hZ0ZpbHRlciA9IHNwZWMubWFnRmlsdGVyIHx8IHNwZWMuZmlsdGVyO1xyXG4gICAgICAgIC8vIHNldCB0ZXh0dXJlIHBhcmFtc1xyXG4gICAgICAgIHRoaXMud3JhcFMgPSBzcGVjLndyYXBTIHx8IERFRkFVTFRfV1JBUDtcclxuICAgICAgICB0aGlzLndyYXBUID0gc3BlYy53cmFwVCB8fCBERUZBVUxUX1dSQVA7XHJcbiAgICAgICAgdGhpcy5taW5GaWx0ZXIgPSBzcGVjLm1pbkZpbHRlciB8fCBERUZBVUxUX0ZJTFRFUjtcclxuICAgICAgICB0aGlzLm1hZ0ZpbHRlciA9IHNwZWMubWFnRmlsdGVyIHx8IERFRkFVTFRfRklMVEVSO1xyXG4gICAgICAgIC8vIHNldCBvdGhlciBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdGhpcy5taXBNYXAgPSBzcGVjLm1pcE1hcCAhPT0gdW5kZWZpbmVkID8gc3BlYy5taXBNYXAgOiBERUZBVUxUX01JUE1BUDtcclxuICAgICAgICB0aGlzLmludmVydFkgPSBzcGVjLmludmVydFkgIT09IHVuZGVmaW5lZCA/IHNwZWMuaW52ZXJ0WSA6IERFRkFVTFRfSU5WRVJUX1k7XHJcbiAgICAgICAgdGhpcy5wcmVNdWx0aXBseUFscGhhID0gc3BlYy5wcmVNdWx0aXBseUFscGhhICE9PSB1bmRlZmluZWQgPyBzcGVjLnByZU11bHRpcGx5QWxwaGEgOiBERUZBVUxUX1BSRU1VTFRJUExZX0FMUEhBO1xyXG4gICAgICAgIC8vIHNldCBmb3JtYXRcclxuICAgICAgICB0aGlzLmZvcm1hdCA9IHNwZWMuZm9ybWF0IHx8IERFRkFVTFRfRk9STUFUO1xyXG4gICAgICAgIGlmICggREVQVEhfVFlQRVNbIHRoaXMuZm9ybWF0IF0gJiYgIVdlYkdMQ29udGV4dC5jaGVja0V4dGVuc2lvbiggJ1dFQkdMX2RlcHRoX3RleHR1cmUnICkgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdDYW5ub3QgY3JlYXRlIFRleHR1cmUyRCBvZiBmb3JtYXQgYCcgKyB0aGlzLmZvcm1hdCArICdgIGFzIGBXRUJHTF9kZXB0aF90ZXh0dXJlYCBleHRlbnNpb24gaXMgdW5zdXBwb3J0ZWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBzZXQgdHlwZVxyXG4gICAgICAgIHRoaXMudHlwZSA9IHNwZWMudHlwZSB8fCBERUZBVUxUX1RZUEU7XHJcbiAgICAgICAgaWYgKCB0aGlzLnR5cGUgPT09ICdGTE9BVCcgJiYgIVdlYkdMQ29udGV4dC5jaGVja0V4dGVuc2lvbiggJ09FU190ZXh0dXJlX2Zsb2F0JyApICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnQ2Fubm90IGNyZWF0ZSBUZXh0dXJlMkQgb2YgdHlwZSBgRkxPQVRgIGFzIGBPRVNfdGV4dHVyZV9mbG9hdGAgZXh0ZW5zaW9uIGlzIHVuc3VwcG9ydGVkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gY2hlY2sgc2l6ZVxyXG4gICAgICAgIGlmICggIVV0aWwuaXNDYW52YXNUeXBlKCBzcGVjLnNyYyApICkge1xyXG4gICAgICAgICAgICAvLyBpZiBub3QgYSBjYW52YXMgdHlwZSwgZGltZW5zaW9ucyBNVVNUIGJlIHNwZWNpZmllZFxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBzcGVjLndpZHRoICE9PSAnbnVtYmVyJyB8fCBzcGVjLndpZHRoIDw9IDAgKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnYHdpZHRoYCBhcmd1bWVudCBpcyBtaXNzaW5nIG9yIGludmFsaWQnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIHNwZWMuaGVpZ2h0ICE9PSAnbnVtYmVyJyB8fCBzcGVjLmhlaWdodCA8PSAwICkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ2BoZWlnaHRgIGFyZ3VtZW50IGlzIG1pc3Npbmcgb3IgaW52YWxpZCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCBVdGlsLm11c3RCZVBvd2VyT2ZUd28oIHRoaXMgKSApIHtcclxuICAgICAgICAgICAgICAgIGlmICggIVV0aWwuaXNQb3dlck9mVHdvKCBzcGVjLndpZHRoICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ1BhcmFtZXRlcnMgcmVxdWlyZSBhIHBvd2VyLW9mLXR3byB0ZXh0dXJlLCB5ZXQgcHJvdmlkZWQgd2lkdGggb2YgJyArIHNwZWMud2lkdGggKyAnIGlzIG5vdCBhIHBvd2VyIG9mIHR3byc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoICFVdGlsLmlzUG93ZXJPZlR3byggc3BlYy5oZWlnaHQgKSApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnUGFyYW1ldGVycyByZXF1aXJlIGEgcG93ZXItb2YtdHdvIHRleHR1cmUsIHlldCBwcm92aWRlZCBoZWlnaHQgb2YgJyArIHNwZWMuaGVpZ2h0ICsgJyBpcyBub3QgYSBwb3dlciBvZiB0d28nO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2wgPSBXZWJHTENvbnRleHQuZ2V0KCk7XHJcbiAgICAgICAgdGhpcy5zdGF0ZSA9IFdlYkdMQ29udGV4dFN0YXRlLmdldCggZ2wgKTtcclxuICAgICAgICAvLyBjcmVhdGUgdGV4dHVyZSBvYmplY3RcclxuICAgICAgICB0aGlzLnRleHR1cmUgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XHJcbiAgICAgICAgLy8gYnVmZmVyIHRoZSBkYXRhXHJcbiAgICAgICAgdGhpcy5idWZmZXJEYXRhKCBzcGVjLnNyYyB8fCBudWxsLCBzcGVjLndpZHRoLCBzcGVjLmhlaWdodCApO1xyXG4gICAgICAgIHRoaXMuc2V0UGFyYW1ldGVycyggdGhpcyApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmluZHMgdGhlIHRleHR1cmUgb2JqZWN0IGFuZCBwdXNoZXMgaXQgb250byB0aGUgc3RhY2suXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZTJEXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvY2F0aW9uIC0gVGhlIHRleHR1cmUgdW5pdCBsb2NhdGlvbiBpbmRleC4gRGVmYXVsdCB0byAwLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlMkR9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlMkQucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiggbG9jYXRpb24gKSB7XHJcbiAgICAgICAgaWYgKCBsb2NhdGlvbiA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICBsb2NhdGlvbiA9IDA7XHJcbiAgICAgICAgfSBlbHNlIGlmICggIVV0aWwuaXNJbnRlZ2VyKCBsb2NhdGlvbiApIHx8IGxvY2F0aW9uIDwgMCApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgdW5pdCBsb2NhdGlvbiBpcyBpbnZhbGlkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gaWYgdGhpcyB0ZXh0dXJlIGlzIGFscmVhZHkgYm91bmQsIG5vIG5lZWQgdG8gcmViaW5kXHJcbiAgICAgICAgaWYgKCB0aGlzLnN0YXRlLnRleHR1cmUyRHMudG9wKCBsb2NhdGlvbiApICE9PSB0aGlzICkge1xyXG4gICAgICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgICAgICBnbC5hY3RpdmVUZXh0dXJlKCBnbFsgJ1RFWFRVUkUnICsgbG9jYXRpb24gXSApO1xyXG4gICAgICAgICAgICBnbC5iaW5kVGV4dHVyZSggZ2wuVEVYVFVSRV8yRCwgdGhpcy50ZXh0dXJlICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGFkZCB0byBzdGFjayB1bmRlciB0aGUgdGV4dHVyZSB1bml0XHJcbiAgICAgICAgdGhpcy5zdGF0ZS50ZXh0dXJlMkRzLnB1c2goIGxvY2F0aW9uLCB0aGlzICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgdGV4dHVyZSBvYmplY3QgYW5kIGJpbmRzIHRoZSB0ZXh0dXJlIGJlbmVhdGggaXQgb24gdGhpcyBzdGFjay4gSWYgdGhlcmUgaXMgbm8gdW5kZXJseWluZyB0ZXh0dXJlLCB1bmJpbmRzIHRoZSB1bml0LlxyXG4gICAgICogQG1lbWJlcm9mIFRleHR1cmUyRFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsb2NhdGlvbiAtIFRoZSB0ZXh0dXJlIHVuaXQgbG9jYXRpb24gaW5kZXguIERlZmF1bHQgdG8gMC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZTJEfSBUaGUgdGV4dHVyZSBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVGV4dHVyZTJELnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbiggbG9jYXRpb24gKSB7XHJcbiAgICAgICAgaWYgKCBsb2NhdGlvbiA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICBsb2NhdGlvbiA9IDA7XHJcbiAgICAgICAgfSBlbHNlIGlmICggIVV0aWwuaXNJbnRlZ2VyKCBsb2NhdGlvbiApIHx8IGxvY2F0aW9uIDwgMCApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgdW5pdCBsb2NhdGlvbiBpcyBpbnZhbGlkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5zdGF0ZTtcclxuICAgICAgICBpZiAoIHN0YXRlLnRleHR1cmUyRHMudG9wKCBsb2NhdGlvbiApICE9PSB0aGlzICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnVGV4dHVyZTJEIGlzIG5vdCB0aGUgdG9wIG1vc3QgZWxlbWVudCBvbiB0aGUgc3RhY2snO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGF0ZS50ZXh0dXJlMkRzLnBvcCggbG9jYXRpb24gKTtcclxuICAgICAgICB2YXIgZ2w7XHJcbiAgICAgICAgdmFyIHRvcCA9IHN0YXRlLnRleHR1cmUyRHMudG9wKCBsb2NhdGlvbiApO1xyXG4gICAgICAgIGlmICggdG9wICkge1xyXG4gICAgICAgICAgICBpZiAoIHRvcCAhPT0gdGhpcyApIHtcclxuICAgICAgICAgICAgICAgIC8vIGJpbmQgdW5kZXJseWluZyB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICBnbCA9IHRvcC5nbDtcclxuICAgICAgICAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoIGdsWyAnVEVYVFVSRScgKyBsb2NhdGlvbiBdICk7XHJcbiAgICAgICAgICAgICAgICBnbC5iaW5kVGV4dHVyZSggZ2wuVEVYVFVSRV8yRCwgdG9wLnRleHR1cmUgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHVuYmluZFxyXG4gICAgICAgICAgICBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKCBnbC5URVhUVVJFXzJELCBudWxsICk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ1ZmZlciBkYXRhIGludG8gdGhlIHRleHR1cmUuXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZTJEXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtBcnJheXxBcnJheUJ1ZmZlclZpZXd8bnVsbH0gZGF0YSAtIFRoZSBkYXRhIGFycmF5IHRvIGJ1ZmZlci5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgZGF0YS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBUaGUgaGVpZ2h0IG9mIHRoZSBkYXRhLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlMkR9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlMkQucHJvdG90eXBlLmJ1ZmZlckRhdGEgPSBmdW5jdGlvbiggZGF0YSwgd2lkdGgsIGhlaWdodCApIHtcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xyXG4gICAgICAgIHRoaXMucHVzaCgpO1xyXG4gICAgICAgIC8vIGludmVydCB5IGlmIHNwZWNpZmllZFxyXG4gICAgICAgIGdsLnBpeGVsU3RvcmVpKCBnbC5VTlBBQ0tfRkxJUF9ZX1dFQkdMLCB0aGlzLmludmVydFkgKTtcclxuICAgICAgICAvLyBwcmVtdWx0aXBseSBhbHBoYSBpZiBzcGVjaWZpZWRcclxuICAgICAgICBnbC5waXhlbFN0b3JlaSggZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCB0aGlzLnByZU11bHRpcGx5QWxwaGEgKTtcclxuICAgICAgICAvLyBjYXN0IGFycmF5IGFyZ1xyXG4gICAgICAgIGlmICggZGF0YSBpbnN0YW5jZW9mIEFycmF5ICkge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMudHlwZSA9PT0gJ1VOU0lHTkVEX1NIT1JUJyApIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBuZXcgVWludDE2QXJyYXkoIGRhdGEgKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICggdGhpcy50eXBlID09PSAnVU5TSUdORURfSU5UJyApIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBuZXcgVWludDMyQXJyYXkoIGRhdGEgKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICggdGhpcy50eXBlID09PSAnRkxPQVQnICkge1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoIGRhdGEgKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSBuZXcgVWludDhBcnJheSggZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHNldCBlbnN1cmUgdHlwZSBjb3JyZXNwb25kcyB0byBkYXRhXHJcbiAgICAgICAgaWYgKCBkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSApIHtcclxuICAgICAgICAgICAgdGhpcy50eXBlID0gJ1VOU0lHTkVEX0JZVEUnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIGRhdGEgaW5zdGFuY2VvZiBVaW50MTZBcnJheSApIHtcclxuICAgICAgICAgICAgdGhpcy50eXBlID0gJ1VOU0lHTkVEX1NIT1JUJztcclxuICAgICAgICB9IGVsc2UgaWYgKCBkYXRhIGluc3RhbmNlb2YgVWludDMyQXJyYXkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICdVTlNJR05FRF9JTlQnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIGRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHlwZSA9ICdGTE9BVCc7XHJcbiAgICAgICAgfSBlbHNlIGlmICggZGF0YSAmJiAhKCBkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgKSAmJiAhVXRpbC5pc0NhbnZhc1R5cGUoIGRhdGEgKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0FyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBgQXJyYXlgLCBgQXJyYXlCdWZmZXJgLCBgQXJyYXlCdWZmZXJWaWV3YCwgYEltYWdlRGF0YWAsIGBIVE1MSW1hZ2VFbGVtZW50YCwgYEhUTUxDYW52YXNFbGVtZW50YCwgYEhUTUxWaWRlb0VsZW1lbnRgLCBvciBudWxsJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBVdGlsLmlzQ2FudmFzVHlwZSggZGF0YSApICkge1xyXG4gICAgICAgICAgICAvLyBzdG9yZSB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoO1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBidWZmZXIgdGhlIHRleHR1cmVcclxuICAgICAgICAgICAgZ2wudGV4SW1hZ2UyRChcclxuICAgICAgICAgICAgICAgIGdsLlRFWFRVUkVfMkQsXHJcbiAgICAgICAgICAgICAgICAwLCAvLyBtaXAtbWFwIGxldmVsLFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMuZm9ybWF0IF0sIC8vIHdlYmdsIHJlcXVpcmVzIGZvcm1hdCA9PT0gaW50ZXJuYWxGb3JtYXRcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLmZvcm1hdCBdLFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMudHlwZSBdLFxyXG4gICAgICAgICAgICAgICAgZGF0YSApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHN0b3JlIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoIHx8IHRoaXMud2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBidWZmZXIgdGhlIHRleHR1cmUgZGF0YVxyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKFxyXG4gICAgICAgICAgICAgICAgZ2wuVEVYVFVSRV8yRCxcclxuICAgICAgICAgICAgICAgIDAsIC8vIG1pcC1tYXAgbGV2ZWxcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLmZvcm1hdCBdLCAvLyB3ZWJnbCByZXF1aXJlcyBmb3JtYXQgPT09IGludGVybmFsRm9ybWF0XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAwLCAvLyBib3JkZXIsIG11c3QgYmUgMFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMuZm9ybWF0IF0sXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy50eXBlIF0sXHJcbiAgICAgICAgICAgICAgICBkYXRhICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGdlbmVyYXRlIG1pcCBtYXBzXHJcbiAgICAgICAgaWYgKCB0aGlzLm1pcE1hcCApIHtcclxuICAgICAgICAgICAgZ2wuZ2VuZXJhdGVNaXBtYXAoIGdsLlRFWFRVUkVfMkQgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgdGhlIHRleHR1cmUgcGFyYW1ldGVycy5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlMkRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gVGhlIHBhcmFtZXRlcnMgYnkgbmFtZS5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMud3JhcCAtIFRoZSB3cmFwcGluZyB0eXBlIG92ZXIgYm90aCBTIGFuZCBUIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMud3JhcFMgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIHRoZSBTIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMud3JhcFQgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIHRoZSBUIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMuZmlsdGVyIC0gVGhlIG1pbiAvIG1hZyBmaWx0ZXIgdXNlZCBkdXJpbmcgc2NhbGluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMubWluRmlsdGVyIC0gVGhlIG1pbmlmaWNhdGlvbiBmaWx0ZXIgdXNlZCBkdXJpbmcgc2NhbGluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMubWFnRmlsdGVyIC0gVGhlIG1hZ25pZmljYXRpb24gZmlsdGVyIHVzZWQgZHVyaW5nIHNjYWxpbmcuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmUyRH0gVGhlIHRleHR1cmUgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFRleHR1cmUyRC5wcm90b3R5cGUuc2V0UGFyYW1ldGVycyA9IGZ1bmN0aW9uKCBwYXJhbXMgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICB0aGlzLnB1c2goKTtcclxuICAgICAgICAvLyBzZXQgd3JhcCBTIHBhcmFtZXRlclxyXG4gICAgICAgIHZhciBwYXJhbSA9IHBhcmFtcy53cmFwUyB8fCBwYXJhbXMud3JhcDtcclxuICAgICAgICBpZiAoIHBhcmFtICkge1xyXG4gICAgICAgICAgICBpZiAoIFdSQVBfTU9ERVNbIHBhcmFtIF0gKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBTID0gcGFyYW07XHJcbiAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKCBnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfUywgZ2xbIHRoaXMud3JhcFMgXSApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgcGFyYW1ldGVyIGAnICsgcGFyYW0gKyAnYCBpcyBub3QgYSB2YWxpZCB2YWx1ZSBmb3IgYFRFWFRVUkVfV1JBUF9TYCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc2V0IHdyYXAgVCBwYXJhbWV0ZXJcclxuICAgICAgICBwYXJhbSA9IHBhcmFtcy53cmFwVCB8fCBwYXJhbXMud3JhcDtcclxuICAgICAgICBpZiAoIHBhcmFtICkge1xyXG4gICAgICAgICAgICBpZiAoIFdSQVBfTU9ERVNbIHBhcmFtIF0gKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndyYXBUID0gcGFyYW07XHJcbiAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKCBnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX1dSQVBfVCwgZ2xbIHRoaXMud3JhcFQgXSApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgcGFyYW1ldGVyIGAnICsgcGFyYW0gKyAnYCBpcyBub3QgYSB2YWxpZCB2YWx1ZSBmb3IgYFRFWFRVUkVfV1JBUF9UYCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc2V0IG1hZyBmaWx0ZXIgcGFyYW1ldGVyXHJcbiAgICAgICAgcGFyYW0gPSBwYXJhbXMubWFnRmlsdGVyIHx8IHBhcmFtcy5maWx0ZXI7XHJcbiAgICAgICAgaWYgKCBwYXJhbSApIHtcclxuICAgICAgICAgICAgaWYgKCBNQUdfRklMVEVSU1sgcGFyYW0gXSApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFnRmlsdGVyID0gcGFyYW07XHJcbiAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKCBnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01BR19GSUxURVIsIGdsWyB0aGlzLm1hZ0ZpbHRlciBdICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnVGV4dHVyZSBwYXJhbWV0ZXIgYCcgKyBwYXJhbSArICdgIGlzIG5vdCBhIHZhbGlkIHZhbHVlIGZvciBgVEVYVFVSRV9NQUdfRklMVEVSYCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc2V0IG1pbiBmaWx0ZXIgcGFyYW1ldGVyXHJcbiAgICAgICAgcGFyYW0gPSBwYXJhbXMubWluRmlsdGVyIHx8IHBhcmFtcy5maWx0ZXI7XHJcbiAgICAgICAgaWYgKCBwYXJhbSApIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLm1pcE1hcCApIHtcclxuICAgICAgICAgICAgICAgIGlmICggTk9OX01JUE1BUF9NSU5fRklMVEVSU1sgcGFyYW0gXSApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB1cGdyYWRlIHRvIG1pcC1tYXAgbWluIGZpbHRlclxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtICs9IERFRkFVTFRfTUlQTUFQX01JTl9GSUxURVJfU1VGRklYO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCBNSVBNQVBfTUlOX0ZJTFRFUlNbIHBhcmFtIF0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5GaWx0ZXIgPSBwYXJhbTtcclxuICAgICAgICAgICAgICAgICAgICBnbC50ZXhQYXJhbWV0ZXJpKCBnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsWyB0aGlzLm1pbkZpbHRlciBdICk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnVGV4dHVyZSBwYXJhbWV0ZXIgYCcgKyBwYXJhbSArICdgIGlzIG5vdCBhIHZhbGlkIHZhbHVlIGZvciBgVEVYVFVSRV9NSU5fRklMVEVSYCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIE1JTl9GSUxURVJTWyBwYXJhbSBdICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluRmlsdGVyID0gcGFyYW07XHJcbiAgICAgICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaSggZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbFsgdGhpcy5taW5GaWx0ZXIgXSApO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnVGV4dHVyZSBwYXJhbWV0ZXIgYCcgKyBwYXJhbSArICdgIGlzIG5vdCBhIHZhbGlkIHZhbHVlIGZvciBgVEVYVFVSRV9NSU5fRklMVEVSYCc7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wb3AoKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNpemUgdGhlIHVuZGVybHlpbmcgdGV4dHVyZS4gVGhpcyBjbGVhcnMgdGhlIHRleHR1cmUgZGF0YS5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlMkRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBUaGUgbmV3IHdpZHRoIG9mIHRoZSB0ZXh0dXJlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBuZXcgaGVpZ2h0IG9mIHRoZSB0ZXh0dXJlLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtUZXh0dXJlMkR9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlMkQucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKCB3aWR0aCwgaGVpZ2h0ICkge1xyXG4gICAgICAgIGlmICggdHlwZW9mIHdpZHRoICE9PSAnbnVtYmVyJyB8fCAoIHdpZHRoIDw9IDAgKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1Byb3ZpZGVkIGB3aWR0aGAgb2YgJyArIHdpZHRoICsgJyBpcyBpbnZhbGlkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCB0eXBlb2YgaGVpZ2h0ICE9PSAnbnVtYmVyJyB8fCAoIGhlaWdodCA8PSAwICkgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQcm92aWRlZCBgaGVpZ2h0YCBvZiAnICsgaGVpZ2h0ICsgJyBpcyBpbnZhbGlkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idWZmZXJEYXRhKCBudWxsLCB3aWR0aCwgaGVpZ2h0ICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGV4dHVyZTJEO1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0Jyk7XHJcbiAgICB2YXIgV2ViR0xDb250ZXh0U3RhdGUgPSByZXF1aXJlKCcuL1dlYkdMQ29udGV4dFN0YXRlJyk7XHJcbiAgICB2YXIgQXN5bmMgPSByZXF1aXJlKCcuLi91dGlsL0FzeW5jJyk7XHJcbiAgICB2YXIgVXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvVXRpbCcpO1xyXG4gICAgdmFyIEltYWdlTG9hZGVyID0gcmVxdWlyZSgnLi4vdXRpbC9JbWFnZUxvYWRlcicpO1xyXG4gICAgdmFyIEZBQ0VTID0gW1xyXG4gICAgICAgICcteCcsICcreCcsXHJcbiAgICAgICAgJy15JywgJyt5JyxcclxuICAgICAgICAnLXonLCAnK3onXHJcbiAgICBdO1xyXG4gICAgdmFyIEZBQ0VfVEFSR0VUUyA9IHtcclxuICAgICAgICAnK3onOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9aJyxcclxuICAgICAgICAnLXonOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9aJyxcclxuICAgICAgICAnK3gnOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YJyxcclxuICAgICAgICAnLXgnOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9YJyxcclxuICAgICAgICAnK3knOiAnVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9ZJyxcclxuICAgICAgICAnLXknOiAnVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZJ1xyXG4gICAgfTtcclxuICAgIHZhciBUQVJHRVRTID0ge1xyXG4gICAgICAgIFRFWFRVUkVfQ1VCRV9NQVBfUE9TSVRJVkVfWjogdHJ1ZSxcclxuICAgICAgICBURVhUVVJFX0NVQkVfTUFQX05FR0FUSVZFX1o6IHRydWUsXHJcbiAgICAgICAgVEVYVFVSRV9DVUJFX01BUF9QT1NJVElWRV9YOiB0cnVlLFxyXG4gICAgICAgIFRFWFRVUkVfQ1VCRV9NQVBfTkVHQVRJVkVfWDogdHJ1ZSxcclxuICAgICAgICBURVhUVVJFX0NVQkVfTUFQX1BPU0lUSVZFX1k6IHRydWUsXHJcbiAgICAgICAgVEVYVFVSRV9DVUJFX01BUF9ORUdBVElWRV9ZOiB0cnVlXHJcbiAgICB9O1xyXG4gICAgdmFyIE1BR19GSUxURVJTID0ge1xyXG4gICAgICAgIE5FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTElORUFSOiB0cnVlXHJcbiAgICB9O1xyXG4gICAgdmFyIE1JTl9GSUxURVJTID0ge1xyXG4gICAgICAgIE5FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTElORUFSOiB0cnVlLFxyXG4gICAgICAgIE5FQVJFU1RfTUlQTUFQX05FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTElORUFSX01JUE1BUF9ORUFSRVNUOiB0cnVlLFxyXG4gICAgICAgIE5FQVJFU1RfTUlQTUFQX0xJTkVBUjogdHJ1ZSxcclxuICAgICAgICBMSU5FQVJfTUlQTUFQX0xJTkVBUjogdHJ1ZVxyXG4gICAgfTtcclxuICAgIHZhciBOT05fTUlQTUFQX01JTl9GSUxURVJTID0ge1xyXG4gICAgICAgIE5FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTElORUFSOiB0cnVlLFxyXG4gICAgfTtcclxuICAgIHZhciBNSVBNQVBfTUlOX0ZJTFRFUlMgPSB7XHJcbiAgICAgICAgTkVBUkVTVF9NSVBNQVBfTkVBUkVTVDogdHJ1ZSxcclxuICAgICAgICBMSU5FQVJfTUlQTUFQX05FQVJFU1Q6IHRydWUsXHJcbiAgICAgICAgTkVBUkVTVF9NSVBNQVBfTElORUFSOiB0cnVlLFxyXG4gICAgICAgIExJTkVBUl9NSVBNQVBfTElORUFSOiB0cnVlXHJcbiAgICB9O1xyXG4gICAgdmFyIFdSQVBfTU9ERVMgPSB7XHJcbiAgICAgICAgUkVQRUFUOiB0cnVlLFxyXG4gICAgICAgIE1JUlJPUkVEX1JFUEVBVDogdHJ1ZSxcclxuICAgICAgICBDTEFNUF9UT19FREdFOiB0cnVlXHJcbiAgICB9O1xyXG4gICAgdmFyIEZPUk1BVFMgPSB7XHJcbiAgICAgICAgUkdCOiB0cnVlLFxyXG4gICAgICAgIFJHQkE6IHRydWVcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCB0eXBlIGZvciB0ZXh0dXJlcy5cclxuICAgICAqL1xyXG4gICAgdmFyIERFRkFVTFRfVFlQRSA9ICdVTlNJR05FRF9CWVRFJztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBkZWZhdWx0IGZvcm1hdCBmb3IgdGV4dHVyZXMuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX0ZPUk1BVCA9ICdSR0JBJztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBkZWZhdWx0IHdyYXAgbW9kZSBmb3IgdGV4dHVyZXMuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX1dSQVAgPSAnQ0xBTVBfVE9fRURHRSc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBtaW4gLyBtYWcgZmlsdGVyIGZvciB0ZXh0dXJlcy5cclxuICAgICAqL1xyXG4gICAgdmFyIERFRkFVTFRfRklMVEVSID0gJ0xJTkVBUic7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBhbHBoYSBwcmVtdWx0aXBseWluZyBpcyBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9QUkVNVUxUSVBMWV9BTFBIQSA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBtaXBtYXBwaW5nIGlzIGVuYWJsZWQuXHJcbiAgICAgKi9cclxuICAgIHZhciBERUZBVUxUX01JUE1BUCA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBmb3Igd2hldGhlciBpbnZlcnQteSBpcyBlbmFibGVkLlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9JTlZFUlRfWSA9IHRydWU7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgZGVmYXVsdCBtaXAtbWFwcGluZyBmaWx0ZXIgc3VmZml4LlxyXG4gICAgICovXHJcbiAgICB2YXIgREVGQVVMVF9NSVBNQVBfTUlOX0ZJTFRFUl9TVUZGSVggPSAnX01JUE1BUF9MSU5FQVInO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHRoZSBjdWJlbWFwIGFuZCB0aHJvd3MgYW4gZXhjZXB0aW9uIGlmXHJcbiAgICAgKiBpdCBkb2VzIG5vdCBtZWV0IHJlcXVpcmVtZW50cy5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlQ3ViZU1hcH0gY3ViZU1hcCAtIFRoZSBjdWJlIG1hcCB0ZXh0dXJlIG9iamVjdC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gY2hlY2tEaW1lbnNpb25zKCBjdWJlTWFwICkge1xyXG4gICAgICAgIGlmICggdHlwZW9mIGN1YmVNYXAud2lkdGggIT09ICdudW1iZXInIHx8IGN1YmVNYXAud2lkdGggPD0gMCApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ2B3aWR0aGAgYXJndW1lbnQgaXMgbWlzc2luZyBvciBpbnZhbGlkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCB0eXBlb2YgY3ViZU1hcC5oZWlnaHQgIT09ICdudW1iZXInIHx8IGN1YmVNYXAuaGVpZ2h0IDw9IDAgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdgaGVpZ2h0YCBhcmd1bWVudCBpcyBtaXNzaW5nIG9yIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIGN1YmVNYXAud2lkdGggIT09IGN1YmVNYXAuaGVpZ2h0ICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnUHJvdmlkZWQgYHdpZHRoYCBtdXN0IGJlIGVxdWFsIHRvIGBoZWlnaHRgJztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBVdGlsLm11c3RCZVBvd2VyT2ZUd28oIGN1YmVNYXAgKSAmJiAhVXRpbC5pc1Bvd2VyT2ZUd28oIGN1YmVNYXAud2lkdGggKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1BhcmFtZXRlcnMgcmVxdWlyZSBhIHBvd2VyLW9mLXR3byB0ZXh0dXJlLCB5ZXQgcHJvdmlkZWQgc2l6ZSBvZiAnICsgY3ViZU1hcC53aWR0aCArICcgaXMgbm90IGEgcG93ZXIgb2YgdHdvJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdG8gbG9hZCBhIGZhY2UgZnJvbSBhIHVybC5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlQ3ViZU1hcH0gY3ViZU1hcCAtIFRoZSBjdWJlIG1hcCB0ZXh0dXJlIG9iamVjdC5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXQgLSBUaGUgdGV4dHVyZSB0YXJnZXQuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gVGhlIHVybCB0byBsb2FkIHRoZSBmYWNlIGZyb20uXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge2Z1bmN0aW9ufSBUaGUgbG9hZGVyIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBsb2FkRmFjZVVSTCggY3ViZU1hcCwgdGFyZ2V0LCB1cmwgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBkb25lICkge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBwdXQgZXh0ZW5zaW9uIGhhbmRsaW5nIGZvciBhcnJheWJ1ZmZlciAvIGltYWdlIC8gdmlkZW8gZGlmZmVyZW50aWF0aW9uXHJcbiAgICAgICAgICAgIEltYWdlTG9hZGVyLmxvYWQoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiggaW1hZ2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2UgPSBVdGlsLnJlc2l6ZUNhbnZhcyggY3ViZU1hcCwgaW1hZ2UgKTtcclxuICAgICAgICAgICAgICAgICAgICBjdWJlTWFwLmJ1ZmZlckRhdGEoIHRhcmdldCwgaW1hZ2UgKTtcclxuICAgICAgICAgICAgICAgICAgICBkb25lKCBudWxsICk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKCBlcnIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9uZSggZXJyLCBudWxsICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdG8gbG9hZCBhIGZhY2UgZnJvbSBhIGNhbnZhcyB0eXBlIG9iamVjdC5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlQ3ViZU1hcH0gY3ViZU1hcCAtIFRoZSBjdWJlIG1hcCB0ZXh0dXJlIG9iamVjdC5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXQgLSBUaGUgdGV4dHVyZSB0YXJnZXQuXHJcbiAgICAgKiBAcGFyYW0ge0ltYWdlRGF0YXxIVE1MSW1hZ2VFbGVtZW50fEhUTUxDYW52YXNFbGVtZW50fEhUTUxWaWRlb0VsZW1lbnR9IGNhbnZhcyAtIFRoZSBjYW52YXMgdHlwZSBvYmplY3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge2Z1bmN0aW9ufSBUaGUgbG9hZGVyIGZ1bmN0aW9uLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBsb2FkRmFjZUNhbnZhcyggY3ViZU1hcCwgdGFyZ2V0LCBjYW52YXMgKSB7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBkb25lICkge1xyXG4gICAgICAgICAgICBjYW52YXMgPSBVdGlsLnJlc2l6ZUNhbnZhcyggY3ViZU1hcCwgY2FudmFzICk7XHJcbiAgICAgICAgICAgIGN1YmVNYXAuYnVmZmVyRGF0YSggdGFyZ2V0LCBjYW52YXMgKTtcclxuICAgICAgICAgICAgZG9uZSggbnVsbCApO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIGEgZnVuY3Rpb24gdG8gbG9hZCBhIGZhY2UgZnJvbSBhbiBhcnJheSB0eXBlIG9iamVjdC5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtUZXh0dXJlQ3ViZU1hcH0gY3ViZU1hcCAtIFRoZSBjdWJlIG1hcCB0ZXh0dXJlIG9iamVjdC5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXQgLSBUaGUgdGV4dHVyZSB0YXJnZXQuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fEFycmF5QnVmZmVyfEFycmF5QnVmZmVyVmlld30gYXJyIC0gVGhlIGFycmF5IHR5cGUgb2JqZWN0LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtmdW5jdGlvbn0gVGhlIGxvYWRlciBmdW5jdGlvbi5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbG9hZEZhY2VBcnJheSggY3ViZU1hcCwgdGFyZ2V0LCBhcnIgKSB7XHJcbiAgICAgICAgY2hlY2tEaW1lbnNpb25zKCBjdWJlTWFwICk7XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCBkb25lICkge1xyXG4gICAgICAgICAgICBjdWJlTWFwLmJ1ZmZlckRhdGEoIHRhcmdldCwgYXJyICk7XHJcbiAgICAgICAgICAgIGRvbmUoIG51bGwgKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zdGFudGlhdGVzIGEgVGV4dHVyZUN1YmVNYXAgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIFRleHR1cmVDdWJlTWFwXHJcbiAgICAgKiBAY2xhc3NkZXNjIEEgdGV4dHVyZSBjbGFzcyB0byByZXByZXNlbnQgYSBjdWJlIG1hcCB0ZXh0dXJlLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcGVjIC0gVGhlIHNwZWNpZmljYXRpb24gYXJndW1lbnRzXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3BlYy5mYWNlcyAtIFRoZSBmYWNlcyB0byBidWZmZXIsIHVuZGVyIGtleXMgJyt4JywgJyt5JywgJyt6JywgJy14JywgJy15JywgYW5kICcteicuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3BlYy53aWR0aCAtIFRoZSB3aWR0aCBvZiB0aGUgZmFjZXMuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3BlYy5oZWlnaHQgLSBUaGUgaGVpZ2h0IG9mIHRoZSBmYWNlcy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLndyYXAgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIGJvdGggUyBhbmQgVCBkaW1lbnNpb24uXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy53cmFwUyAtIFRoZSB3cmFwcGluZyB0eXBlIG92ZXIgdGhlIFMgZGltZW5zaW9uLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMud3JhcFQgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIHRoZSBUIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLmZpbHRlciAtIFRoZSBtaW4gLyBtYWcgZmlsdGVyIHVzZWQgZHVyaW5nIHNjYWxpbmcuXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3BlYy5taW5GaWx0ZXIgLSBUaGUgbWluaWZpY2F0aW9uIGZpbHRlciB1c2VkIGR1cmluZyBzY2FsaW5nLlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNwZWMubWFnRmlsdGVyIC0gVGhlIG1hZ25pZmljYXRpb24gZmlsdGVyIHVzZWQgZHVyaW5nIHNjYWxpbmcuXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2x9IHNwZWMubWlwTWFwIC0gV2hldGhlciBvciBub3QgbWlwLW1hcHBpbmcgaXMgZW5hYmxlZC5cclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc3BlYy5pbnZlcnRZIC0gV2hldGhlciBvciBub3QgaW52ZXJ0LXkgaXMgZW5hYmxlZC5cclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc3BlYy5wcmVNdWx0aXBseUFscGhhIC0gV2hldGhlciBvciBub3QgYWxwaGEgcHJlbXVsdGlwbHlpbmcgaXMgZW5hYmxlZC5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLmZvcm1hdCAtIFRoZSB0ZXh0dXJlIHBpeGVsIGZvcm1hdC5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVjLnR5cGUgLSBUaGUgdGV4dHVyZSBwaXhlbCBjb21wb25lbnQgdHlwZS5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gVGV4dHVyZUN1YmVNYXAoIHNwZWMsIGNhbGxiYWNrICkge1xyXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsID0gV2ViR0xDb250ZXh0LmdldCgpO1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBXZWJHTENvbnRleHRTdGF0ZS5nZXQoIGdsICk7XHJcbiAgICAgICAgdGhpcy50ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xyXG4gICAgICAgIC8vIGdldCBzcGVjaWZpYyBwYXJhbXNcclxuICAgICAgICBzcGVjLndyYXBTID0gc3BlYy53cmFwUyB8fCBzcGVjLndyYXA7XHJcbiAgICAgICAgc3BlYy53cmFwVCA9IHNwZWMud3JhcFQgfHwgc3BlYy53cmFwO1xyXG4gICAgICAgIHNwZWMubWluRmlsdGVyID0gc3BlYy5taW5GaWx0ZXIgfHwgc3BlYy5maWx0ZXI7XHJcbiAgICAgICAgc3BlYy5tYWdGaWx0ZXIgPSBzcGVjLm1hZ0ZpbHRlciB8fCBzcGVjLmZpbHRlcjtcclxuICAgICAgICAvLyBzZXQgdGV4dHVyZSBwYXJhbXNcclxuICAgICAgICB0aGlzLndyYXBTID0gV1JBUF9NT0RFU1sgc3BlYy53cmFwUyBdID8gc3BlYy53cmFwUyA6IERFRkFVTFRfV1JBUDtcclxuICAgICAgICB0aGlzLndyYXBUID0gV1JBUF9NT0RFU1sgc3BlYy53cmFwVCBdID8gc3BlYy53cmFwVCA6IERFRkFVTFRfV1JBUDtcclxuICAgICAgICB0aGlzLm1pbkZpbHRlciA9IE1JTl9GSUxURVJTWyBzcGVjLm1pbkZpbHRlciBdID8gc3BlYy5taW5GaWx0ZXIgOiBERUZBVUxUX0ZJTFRFUjtcclxuICAgICAgICB0aGlzLm1hZ0ZpbHRlciA9IE1BR19GSUxURVJTWyBzcGVjLm1hZ0ZpbHRlciBdID8gc3BlYy5tYWdGaWx0ZXIgOiBERUZBVUxUX0ZJTFRFUjtcclxuICAgICAgICAvLyBzZXQgb3RoZXIgcHJvcGVydGllc1xyXG4gICAgICAgIHRoaXMubWlwTWFwID0gc3BlYy5taXBNYXAgIT09IHVuZGVmaW5lZCA/IHNwZWMubWlwTWFwIDogREVGQVVMVF9NSVBNQVA7XHJcbiAgICAgICAgdGhpcy5pbnZlcnRZID0gc3BlYy5pbnZlcnRZICE9PSB1bmRlZmluZWQgPyBzcGVjLmludmVydFkgOiBERUZBVUxUX0lOVkVSVF9ZO1xyXG4gICAgICAgIHRoaXMucHJlTXVsdGlwbHlBbHBoYSA9IHNwZWMucHJlTXVsdGlwbHlBbHBoYSAhPT0gdW5kZWZpbmVkID8gc3BlYy5wcmVNdWx0aXBseUFscGhhIDogREVGQVVMVF9QUkVNVUxUSVBMWV9BTFBIQTtcclxuICAgICAgICAvLyBzZXQgZm9ybWF0IGFuZCB0eXBlXHJcbiAgICAgICAgdGhpcy5mb3JtYXQgPSBGT1JNQVRTWyBzcGVjLmZvcm1hdCBdID8gc3BlYy5mb3JtYXQgOiBERUZBVUxUX0ZPUk1BVDtcclxuICAgICAgICB0aGlzLnR5cGUgPSBzcGVjLnR5cGUgfHwgREVGQVVMVF9UWVBFO1xyXG4gICAgICAgIGlmICggdGhpcy50eXBlID09PSAnRkxPQVQnICYmICFXZWJHTENvbnRleHQuY2hlY2tFeHRlbnNpb24oICdPRVNfdGV4dHVyZV9mbG9hdCcgKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0Nhbm5vdCBjcmVhdGUgVGV4dHVyZTJEIG9mIHR5cGUgYEZMT0FUYCBhcyBgT0VTX3RleHR1cmVfZmxvYXRgIGV4dGVuc2lvbiBpcyB1bnN1cHBvcnRlZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHNldCBkaW1lbnNpb25zIGlmIHByb3ZpZGVkXHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHNwZWMud2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBzcGVjLmhlaWdodDtcclxuICAgICAgICAvLyBzZXQgYnVmZmVyZWQgZmFjZXNcclxuICAgICAgICB0aGlzLmJ1ZmZlcmVkRmFjZXMgPSBbXTtcclxuICAgICAgICAvLyBjcmVhdGUgY3ViZSBtYXAgYmFzZWQgb24gaW5wdXRcclxuICAgICAgICBpZiAoIHNwZWMuZmFjZXMgKSB7XHJcbiAgICAgICAgICAgIHZhciB0YXNrcyA9IFtdO1xyXG4gICAgICAgICAgICBGQUNFUy5mb3JFYWNoKCBmdW5jdGlvbiggaWQgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmFjZSA9IHNwZWMuZmFjZXNbIGlkIF07XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gRkFDRV9UQVJHRVRTWyBpZCBdO1xyXG4gICAgICAgICAgICAgICAgLy8gbG9hZCBiYXNlZCBvbiB0eXBlXHJcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBmYWNlID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB1cmxcclxuICAgICAgICAgICAgICAgICAgICB0YXNrcy5wdXNoKCBsb2FkRmFjZVVSTCggdGhhdCwgdGFyZ2V0LCBmYWNlICkgKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIFV0aWwuaXNDYW52YXNUeXBlKCBmYWNlICkgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FudmFzXHJcbiAgICAgICAgICAgICAgICAgICAgdGFza3MucHVzaCggbG9hZEZhY2VDYW52YXMoIHRoYXQsIHRhcmdldCwgZmFjZSApICk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGFycmF5IC8gYXJyYXlidWZmZXIgb3IgbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIHRhc2tzLnB1c2goIGxvYWRGYWNlQXJyYXkoIHRoYXQsIHRhcmdldCwgZmFjZSApICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBBc3luYy5wYXJhbGxlbCggdGFza3MsIGZ1bmN0aW9uKCBlcnIgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGVyciApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNhbGxiYWNrICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayggZXJyLCBudWxsICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIHNldCBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgICAgICB0aGF0LnNldFBhcmFtZXRlcnMoIHRoYXQgKTtcclxuICAgICAgICAgICAgICAgIGlmICggY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soIG51bGwsIHRoYXQgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gbnVsbFxyXG4gICAgICAgICAgICBjaGVja0RpbWVuc2lvbnMoIHRoaXMgKTtcclxuICAgICAgICAgICAgRkFDRVMuZm9yRWFjaCggZnVuY3Rpb24oIGlkICkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5idWZmZXJEYXRhKCBGQUNFX1RBUkdFVFNbIGlkIF0sIG51bGwgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIHNldCBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIHRoaXMuc2V0UGFyYW1ldGVycyggdGhpcyApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmRzIHRoZSB0ZXh0dXJlIG9iamVjdCBhbmQgcHVzaGVzIGl0IHRvIG9udG8gdGhlIHN0YWNrLlxyXG4gICAgICogQG1lbWJlcm9mIFRleHR1cmVDdWJlTWFwXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxvY2F0aW9uIC0gVGhlIHRleHR1cmUgdW5pdCBsb2NhdGlvbiBpbmRleC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZUN1YmVNYXB9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlQ3ViZU1hcC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCBsb2NhdGlvbiApIHtcclxuICAgICAgICBpZiAoIGxvY2F0aW9uID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIGxvY2F0aW9uID0gMDtcclxuICAgICAgICB9IGVsc2UgaWYgKCAhVXRpbC5pc0ludGVnZXIoIGxvY2F0aW9uICkgfHwgbG9jYXRpb24gPCAwICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnVGV4dHVyZSB1bml0IGxvY2F0aW9uIGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBpZiB0aGlzIHRleHR1cmUgaXMgYWxyZWFkeSBib3VuZCwgbm8gbmVlZCB0byByZWJpbmRcclxuICAgICAgICBpZiAoIHRoaXMuc3RhdGUudGV4dHVyZUN1YmVNYXBzLnRvcCggbG9jYXRpb24gKSAhPT0gdGhpcyApIHtcclxuICAgICAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSggZ2xbICdURVhUVVJFJyArIGxvY2F0aW9uIF0gKTtcclxuICAgICAgICAgICAgZ2wuYmluZFRleHR1cmUoIGdsLlRFWFRVUkVfQ1VCRV9NQVAsIHRoaXMudGV4dHVyZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBhZGQgdG8gc3RhY2sgdW5kZXIgdGhlIHRleHR1cmUgdW5pdFxyXG4gICAgICAgIHRoaXMuc3RhdGUudGV4dHVyZUN1YmVNYXBzLnB1c2goIGxvY2F0aW9uLCB0aGlzICk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVW5iaW5kcyB0aGUgdGV4dHVyZSBvYmplY3QgYW5kIGJpbmRzIHRoZSB0ZXh0dXJlIGJlbmVhdGggaXQgb25cclxuICAgICAqIHRoaXMgc3RhY2suIElmIHRoZXJlIGlzIG5vIHVuZGVybHlpbmcgdGV4dHVyZSwgdW5iaW5kcyB0aGUgdW5pdC5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlQ3ViZU1hcFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsb2NhdGlvbiAtIFRoZSB0ZXh0dXJlIHVuaXQgbG9jYXRpb24gaW5kZXguXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmVDdWJlTWFwfSBUaGUgdGV4dHVyZSBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVGV4dHVyZUN1YmVNYXAucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCBsb2NhdGlvbiApIHtcclxuICAgICAgICBpZiAoIGxvY2F0aW9uID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIGxvY2F0aW9uID0gMDtcclxuICAgICAgICB9IGVsc2UgaWYgKCAhVXRpbC5pc0ludGVnZXIoIGxvY2F0aW9uICkgfHwgbG9jYXRpb24gPCAwICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnVGV4dHVyZSB1bml0IGxvY2F0aW9uIGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xyXG4gICAgICAgIGlmICggc3RhdGUudGV4dHVyZUN1YmVNYXBzLnRvcCggbG9jYXRpb24gKSAhPT0gdGhpcyApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1RoZSBjdXJyZW50IHRleHR1cmUgaXMgbm90IHRoZSB0b3AgbW9zdCBlbGVtZW50IG9uIHRoZSBzdGFjayc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0YXRlLnRleHR1cmVDdWJlTWFwcy5wb3AoIGxvY2F0aW9uICk7XHJcbiAgICAgICAgdmFyIGdsO1xyXG4gICAgICAgIHZhciB0b3AgPSBzdGF0ZS50ZXh0dXJlQ3ViZU1hcHMudG9wKCBsb2NhdGlvbiApO1xyXG4gICAgICAgIGlmICggdG9wICkge1xyXG4gICAgICAgICAgICBpZiAoIHRvcCAhPT0gdGhpcyApIHtcclxuICAgICAgICAgICAgICAgIC8vIGJpbmQgdW5kZXJseWluZyB0ZXh0dXJlXHJcbiAgICAgICAgICAgICAgICBnbCA9IHRvcC5nbDtcclxuICAgICAgICAgICAgICAgIGdsLmFjdGl2ZVRleHR1cmUoIGdsWyAnVEVYVFVSRScgKyBsb2NhdGlvbiBdICk7XHJcbiAgICAgICAgICAgICAgICBnbC5iaW5kVGV4dHVyZSggZ2wuVEVYVFVSRV9DVUJFX01BUCwgdG9wLnRleHR1cmUgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHVuYmluZFxyXG4gICAgICAgICAgICBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgICAgIGdsLmJpbmRUZXh0dXJlKCBnbC5URVhUVVJFX0NVQkVfTUFQLCBudWxsICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJ1ZmZlciBkYXRhIGludG8gdGhlIHJlc3BlY3RpdmUgY3ViZSBtYXAgZmFjZS5cclxuICAgICAqIEBtZW1iZXJvZiBUZXh0dXJlQ3ViZU1hcFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXQgLSBUaGUgZmFjZSB0YXJnZXQuXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdHxudWxsfSBkYXRhIC0gVGhlIGZhY2UgZGF0YS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7VGV4dHVyZUN1YmVNYXB9IFRoZSB0ZXh0dXJlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBUZXh0dXJlQ3ViZU1hcC5wcm90b3R5cGUuYnVmZmVyRGF0YSA9IGZ1bmN0aW9uKCB0YXJnZXQsIGRhdGEgKSB7XHJcbiAgICAgICAgaWYgKCAhVEFSR0VUU1sgdGFyZ2V0IF0gKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQcm92aWRlZCBgdGFyZ2V0YCBvZiAnICsgdGFyZ2V0ICsgJyBpcyBpbnZhbGlkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcclxuICAgICAgICAvLyBidWZmZXIgZmFjZSB0ZXh0dXJlXHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgLy8gaW52ZXJ0IHkgaWYgc3BlY2lmaWVkXHJcbiAgICAgICAgZ2wucGl4ZWxTdG9yZWkoIGdsLlVOUEFDS19GTElQX1lfV0VCR0wsIHRoaXMuaW52ZXJ0WSApO1xyXG4gICAgICAgIC8vIHByZW11bHRpcGx5IGFscGhhIGlmIHNwZWNpZmllZFxyXG4gICAgICAgIGdsLnBpeGVsU3RvcmVpKCBnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIHRoaXMucHJlTXVsdGlwbHlBbHBoYSApO1xyXG4gICAgICAgIC8vIGNhc3QgYXJyYXkgYXJnXHJcbiAgICAgICAgaWYgKCBkYXRhIGluc3RhbmNlb2YgQXJyYXkgKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy50eXBlID09PSAnVU5TSUdORURfU0hPUlQnICkge1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5ldyBVaW50MTZBcnJheSggZGF0YSApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCB0aGlzLnR5cGUgPT09ICdVTlNJR05FRF9JTlQnICkge1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5ldyBVaW50MzJBcnJheSggZGF0YSApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKCB0aGlzLnR5cGUgPT09ICdGTE9BVCcgKSB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0gbmV3IEZsb2F0MzJBcnJheSggZGF0YSApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGF0YSA9IG5ldyBVaW50OEFycmF5KCBkYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gc2V0IGVuc3VyZSB0eXBlIGNvcnJlc3BvbmRzIHRvIGRhdGFcclxuICAgICAgICBpZiAoIGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5ICkge1xyXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSAnVU5TSUdORURfQllURSc7XHJcbiAgICAgICAgfSBlbHNlIGlmICggZGF0YSBpbnN0YW5jZW9mIFVpbnQxNkFycmF5ICkge1xyXG4gICAgICAgICAgICB0aGlzLnR5cGUgPSAnVU5TSUdORURfU0hPUlQnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIGRhdGEgaW5zdGFuY2VvZiBVaW50MzJBcnJheSApIHtcclxuICAgICAgICAgICAgdGhpcy50eXBlID0gJ1VOU0lHTkVEX0lOVCc7XHJcbiAgICAgICAgfSBlbHNlIGlmICggZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSApIHtcclxuICAgICAgICAgICAgdGhpcy50eXBlID0gJ0ZMT0FUJztcclxuICAgICAgICB9IGVsc2UgaWYgKCBkYXRhICYmICEoIGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApICYmICFVdGlsLmlzQ2FudmFzVHlwZSggZGF0YSApICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnQXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIGBBcnJheWAsIGBBcnJheUJ1ZmZlcmAsIGBBcnJheUJ1ZmZlclZpZXdgLCBgSW1hZ2VEYXRhYCwgYEhUTUxJbWFnZUVsZW1lbnRgLCBgSFRNTENhbnZhc0VsZW1lbnRgLCBgSFRNTFZpZGVvRWxlbWVudGAsIG9yIG51bGwnO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBidWZmZXIgdGhlIGRhdGFcclxuICAgICAgICBpZiAoIFV0aWwuaXNDYW52YXNUeXBlKCBkYXRhICkgKSB7XHJcbiAgICAgICAgICAgIC8vIHN0b3JlIHdpZHRoIGFuZCBoZWlnaHRcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGRhdGEud2lkdGg7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gZGF0YS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIC8vIGJ1ZmZlciB0aGUgdGV4dHVyZVxyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRhcmdldCBdLFxyXG4gICAgICAgICAgICAgICAgMCwgLy8gbWlwLW1hcCBsZXZlbCxcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLmZvcm1hdCBdLCAvLyB3ZWJnbCByZXF1aXJlcyBmb3JtYXQgPT09IGludGVybmFsRm9ybWF0XHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy5mb3JtYXQgXSxcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLnR5cGUgXSxcclxuICAgICAgICAgICAgICAgIGRhdGEgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBidWZmZXIgdGhlIHRleHR1cmUgZGF0YVxyXG4gICAgICAgICAgICBnbC50ZXhJbWFnZTJEKFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRhcmdldCBdLFxyXG4gICAgICAgICAgICAgICAgMCwgLy8gbWlwLW1hcCBsZXZlbFxyXG4gICAgICAgICAgICAgICAgZ2xbIHRoaXMuZm9ybWF0IF0sIC8vIHdlYmdsIHJlcXVpcmVzIGZvcm1hdCA9PT0gaW50ZXJuYWxGb3JtYXRcclxuICAgICAgICAgICAgICAgIHRoaXMud2lkdGgsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCxcclxuICAgICAgICAgICAgICAgIDAsIC8vIGJvcmRlciwgbXVzdCBiZSAwXHJcbiAgICAgICAgICAgICAgICBnbFsgdGhpcy5mb3JtYXQgXSxcclxuICAgICAgICAgICAgICAgIGdsWyB0aGlzLnR5cGUgXSxcclxuICAgICAgICAgICAgICAgIGRhdGEgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gdHJhY2sgdGhhdCBmYWNlIHdhcyBidWZmZXJlZFxyXG4gICAgICAgIGlmICggdGhpcy5idWZmZXJlZEZhY2VzLmluZGV4T2YoIHRhcmdldCApIDwgMCApIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXJlZEZhY2VzLnB1c2goIHRhcmdldCApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBpZiBhbGwgZmFjZXMgYnVmZmVyZWQsIGdlbmVyYXRlIG1pcG1hcHNcclxuICAgICAgICBpZiAoIHRoaXMubWlwTWFwICYmIHRoaXMuYnVmZmVyZWRGYWNlcy5sZW5ndGggPT09IDYgKSB7XHJcbiAgICAgICAgICAgIC8vIG9ubHkgZ2VuZXJhdGUgbWlwbWFwcyBpZiBhbGwgZmFjZXMgYXJlIGJ1ZmZlcmVkXHJcbiAgICAgICAgICAgIGdsLmdlbmVyYXRlTWlwbWFwKCBnbC5URVhUVVJFX0NVQkVfTUFQICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRoZSB0ZXh0dXJlIHBhcmFtZXRlcnMuXHJcbiAgICAgKiBAbWVtYmVyb2YgVGV4dHVyZUN1YmVNYXBcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gVGhlIHBhcmFtZXRlcnMgYnkgbmFtZS5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMud3JhcCAtIFRoZSB3cmFwcGluZyB0eXBlIG92ZXIgYm90aCBTIGFuZCBUIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMud3JhcFMgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIHRoZSBTIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMud3JhcFQgLSBUaGUgd3JhcHBpbmcgdHlwZSBvdmVyIHRoZSBUIGRpbWVuc2lvbi5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMuZmlsdGVyIC0gVGhlIG1pbiAvIG1hZyBmaWx0ZXIgdXNlZCBkdXJpbmcgc2NhbGluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMubWluRmlsdGVyIC0gVGhlIG1pbmlmaWNhdGlvbiBmaWx0ZXIgdXNlZCBkdXJpbmcgc2NhbGluZy5cclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwYXJhbXMubWFnRmlsdGVyIC0gVGhlIG1hZ25pZmljYXRpb24gZmlsdGVyIHVzZWQgZHVyaW5nIHNjYWxpbmcuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1RleHR1cmVDdWJlTWFwfSBUaGUgdGV4dHVyZSBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVGV4dHVyZUN1YmVNYXAucHJvdG90eXBlLnNldFBhcmFtZXRlcnMgPSBmdW5jdGlvbiggcGFyYW1zICkge1xyXG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XHJcbiAgICAgICAgdGhpcy5wdXNoKCk7XHJcbiAgICAgICAgLy8gc2V0IHdyYXAgUyBwYXJhbWV0ZXJcclxuICAgICAgICB2YXIgcGFyYW0gPSBwYXJhbXMud3JhcFMgfHwgcGFyYW1zLndyYXA7XHJcbiAgICAgICAgaWYgKCBwYXJhbSApIHtcclxuICAgICAgICAgICAgaWYgKCBXUkFQX01PREVTWyBwYXJhbSBdICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwUyA9IHBhcmFtO1xyXG4gICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaSggZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsWyB0aGlzLndyYXBTIF0gKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdUZXh0dXJlIHBhcmFtZXRlciBgJyArIHBhcmFtICsgJ2AgaXMgbm90IGEgdmFsaWQgdmFsdWUgZm9yIGBURVhUVVJFX1dSQVBfU2AnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHNldCB3cmFwIFQgcGFyYW1ldGVyXHJcbiAgICAgICAgcGFyYW0gPSBwYXJhbXMud3JhcFQgfHwgcGFyYW1zLndyYXA7XHJcbiAgICAgICAgaWYgKCBwYXJhbSApIHtcclxuICAgICAgICAgICAgaWYgKCBXUkFQX01PREVTWyBwYXJhbSBdICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53cmFwVCA9IHBhcmFtO1xyXG4gICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaSggZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsWyB0aGlzLndyYXBUIF0gKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdUZXh0dXJlIHBhcmFtZXRlciBgJyArIHBhcmFtICsgJ2AgaXMgbm90IGEgdmFsaWQgdmFsdWUgZm9yIGBURVhUVVJFX1dSQVBfVGAnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHNldCBtYWcgZmlsdGVyIHBhcmFtZXRlclxyXG4gICAgICAgIHBhcmFtID0gcGFyYW1zLm1hZ0ZpbHRlciB8fCBwYXJhbXMuZmlsdGVyO1xyXG4gICAgICAgIGlmICggcGFyYW0gKSB7XHJcbiAgICAgICAgICAgIGlmICggTUFHX0ZJTFRFUlNbIHBhcmFtIF0gKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hZ0ZpbHRlciA9IHBhcmFtO1xyXG4gICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaSggZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbFsgdGhpcy5tYWdGaWx0ZXIgXSApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgcGFyYW1ldGVyIGAnICsgcGFyYW0gKyAnYCBpcyBub3QgYSB2YWxpZCB2YWx1ZSBmb3IgYFRFWFRVUkVfTUFHX0ZJTFRFUmAnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHNldCBtaW4gZmlsdGVyIHBhcmFtZXRlclxyXG4gICAgICAgIHBhcmFtID0gcGFyYW1zLm1pbkZpbHRlciB8fCBwYXJhbXMuZmlsdGVyO1xyXG4gICAgICAgIGlmICggcGFyYW0gKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5taXBNYXAgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIE5PTl9NSVBNQVBfTUlOX0ZJTFRFUlNbIHBhcmFtIF0gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBncmFkZSB0byBtaXAtbWFwIG1pbiBmaWx0ZXJcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbSArPSBERUZBVUxUX01JUE1BUF9NSU5fRklMVEVSX1NVRkZJWDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICggTUlQTUFQX01JTl9GSUxURVJTWyBwYXJhbSBdICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluRmlsdGVyID0gcGFyYW07XHJcbiAgICAgICAgICAgICAgICAgICAgZ2wudGV4UGFyYW1ldGVyaSggZ2wuVEVYVFVSRV9DVUJFX01BUCwgZ2wuVEVYVFVSRV9NSU5fRklMVEVSLCBnbFsgdGhpcy5taW5GaWx0ZXIgXSApO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgcGFyYW1ldGVyIGAnICsgcGFyYW0gKyAnYCBpcyBub3QgYSB2YWxpZCB2YWx1ZSBmb3IgYFRFWFRVUkVfTUlOX0ZJTFRFUmAnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBNSU5fRklMVEVSU1sgcGFyYW0gXSApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbkZpbHRlciA9IHBhcmFtO1xyXG4gICAgICAgICAgICAgICAgICAgIGdsLnRleFBhcmFtZXRlcmkoIGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2xbIHRoaXMubWluRmlsdGVyIF0gKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ1RleHR1cmUgcGFyYW1ldGVyIGAnICsgcGFyYW0gKyAnYCBpcyBub3QgYSB2YWxpZCB2YWx1ZSBmb3IgYFRFWFRVUkVfTUlOX0ZJTFRFUmAnO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucG9wKCk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGV4dHVyZUN1YmVNYXA7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJy4vV2ViR0xDb250ZXh0Jyk7XG4gICAgdmFyIFdlYkdMQ29udGV4dFN0YXRlID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHRTdGF0ZScpO1xuICAgIHZhciBWZXJ0ZXhQYWNrYWdlID0gcmVxdWlyZSgnLi9WZXJ0ZXhQYWNrYWdlJyk7XG4gICAgdmFyIE1PREVTID0ge1xuICAgICAgICBQT0lOVFM6IHRydWUsXG4gICAgICAgIExJTkVTOiB0cnVlLFxuICAgICAgICBMSU5FX1NUUklQOiB0cnVlLFxuICAgICAgICBMSU5FX0xPT1A6IHRydWUsXG4gICAgICAgIFRSSUFOR0xFUzogdHJ1ZSxcbiAgICAgICAgVFJJQU5HTEVfU1RSSVA6IHRydWUsXG4gICAgICAgIFRSSUFOR0xFX0ZBTjogdHJ1ZVxuICAgIH07XG4gICAgdmFyIFRZUEVTID0ge1xuICAgICAgICBGTE9BVDogdHJ1ZVxuICAgIH07XG4gICAgdmFyIEJZVEVTX1BFUl9UWVBFID0ge1xuICAgICAgICBGTE9BVDogNFxuICAgIH07XG4gICAgdmFyIEJZVEVTX1BFUl9DT01QT05FTlQgPSBCWVRFU19QRVJfVFlQRS5GTE9BVDtcbiAgICB2YXIgU0laRVMgPSB7XG4gICAgICAgIDE6IHRydWUsXG4gICAgICAgIDI6IHRydWUsXG4gICAgICAgIDM6IHRydWUsXG4gICAgICAgIDQ6IHRydWVcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhlIGRlZmF1bHQgcmVuZGVyIG1vZGUgKHByaW1pdGl2ZSB0eXBlKS5cbiAgICAgKi9cbiAgICB2YXIgREVGQVVMVF9NT0RFID0gJ1RSSUFOR0xFUyc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGVmYXVsdCBieXRlIG9mZnNldCB0byByZW5kZXIgZnJvbS5cbiAgICAgKi9cbiAgICB2YXIgREVGQVVMVF9CWVRFX09GRlNFVCA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGVmYXVsdCBjb3VudCBvZiBpbmRpY2VzIHRvIHJlbmRlci5cbiAgICAgKi9cbiAgICB2YXIgREVGQVVMVF9DT1VOVCA9IDA7XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSB0aGUgYXR0cmlidXRlIHBvaW50ZXJzIGFuZCBkZXRlcm1pbmUgdGhlIGJ5dGUgc3RyaWRlIG9mIHRoZSBidWZmZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVQb2ludGVycyAtIFRoZSBhdHRyaWJ1dGUgcG9pbnRlciBtYXAuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSAtIFRoZSBieXRlIHN0cmlkZSBvZiB0aGUgYnVmZmVyLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldFN0cmlkZSggYXR0cmlidXRlUG9pbnRlcnMgKSB7XG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lIGF0dHJpYnV0ZSBwb2ludGVyIGFzc2lnbmVkIHRvIHRoaXMgYnVmZmVyLFxuICAgICAgICAvLyB0aGVyZSBpcyBubyBuZWVkIGZvciBzdHJpZGUsIHNldCB0byBkZWZhdWx0IG9mIDBcbiAgICAgICAgdmFyIGluZGljZXMgPSBPYmplY3Qua2V5cyggYXR0cmlidXRlUG9pbnRlcnMgKTtcbiAgICAgICAgaWYgKCBpbmRpY2VzLmxlbmd0aCA9PT0gMSApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtYXhCeXRlT2Zmc2V0ID0gMDtcbiAgICAgICAgdmFyIGJ5dGVTaXplU3VtID0gMDtcbiAgICAgICAgdmFyIGJ5dGVTdHJpZGUgPSAwO1xuICAgICAgICBpbmRpY2VzLmZvckVhY2goIGZ1bmN0aW9uKCBpbmRleCApIHtcbiAgICAgICAgICAgIHZhciBwb2ludGVyID0gYXR0cmlidXRlUG9pbnRlcnNbIGluZGV4IF07XG4gICAgICAgICAgICB2YXIgYnl0ZU9mZnNldCA9IHBvaW50ZXIuYnl0ZU9mZnNldDtcbiAgICAgICAgICAgIHZhciBzaXplID0gcG9pbnRlci5zaXplO1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBwb2ludGVyLnR5cGU7XG4gICAgICAgICAgICAvLyB0cmFjayB0aGUgc3VtIG9mIGVhY2ggYXR0cmlidXRlIHNpemVcbiAgICAgICAgICAgIGJ5dGVTaXplU3VtICs9IHNpemUgKiBCWVRFU19QRVJfVFlQRVsgdHlwZSBdO1xuICAgICAgICAgICAgLy8gdHJhY2sgdGhlIGxhcmdlc3Qgb2Zmc2V0IHRvIGRldGVybWluZSB0aGUgYnl0ZSBzdHJpZGUgb2YgdGhlIGJ1ZmZlclxuICAgICAgICAgICAgaWYgKCBieXRlT2Zmc2V0ID4gbWF4Qnl0ZU9mZnNldCApIHtcbiAgICAgICAgICAgICAgICBtYXhCeXRlT2Zmc2V0ID0gYnl0ZU9mZnNldDtcbiAgICAgICAgICAgICAgICBieXRlU3RyaWRlID0gYnl0ZU9mZnNldCArICggc2l6ZSAqIEJZVEVTX1BFUl9UWVBFWyB0eXBlIF0gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZSBtYXggYnl0ZSBvZmZzZXQgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIHRoZSB0aGUgc3VtIG9mXG4gICAgICAgIC8vIHRoZSBzaXplcy4gSWYgc28gdGhpcyBidWZmZXIgaXMgbm90IGludGVybGVhdmVkIGFuZCBkb2VzIG5vdCBuZWVkIGFcbiAgICAgICAgLy8gc3RyaWRlLlxuICAgICAgICBpZiAoIG1heEJ5dGVPZmZzZXQgPj0gYnl0ZVNpemVTdW0gKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiB0ZXN0IHdoYXQgc3RyaWRlID09PSAwIGRvZXMgZm9yIGFuIGludGVybGVhdmVkIGJ1ZmZlciBvZlxuICAgICAgICAgICAgLy8gbGVuZ3RoID09PSAxLlxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJ5dGVTdHJpZGU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFyc2UgdGhlIGF0dHJpYnV0ZSBwb2ludGVycyB0byBlbnN1cmUgdGhleSBhcmUgdmFsaWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVQb2ludGVycyAtIFRoZSBhdHRyaWJ1dGUgcG9pbnRlciBtYXAuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSAtIFRoZSB2YWxpZGF0ZWQgYXR0cmlidXRlIHBvaW50ZXIgbWFwLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldEF0dHJpYnV0ZVBvaW50ZXJzKCBhdHRyaWJ1dGVQb2ludGVycyApIHtcbiAgICAgICAgLy8gZW5zdXJlIHRoZXJlIGFyZSBwb2ludGVycyBwcm92aWRlZFxuICAgICAgICBpZiAoICFhdHRyaWJ1dGVQb2ludGVycyB8fCBPYmplY3Qua2V5cyggYXR0cmlidXRlUG9pbnRlcnMgKS5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICB0aHJvdyAnVmVydGV4QnVmZmVyIHJlcXVpcmVzIGF0dHJpYnV0ZSBwb2ludGVycyB0byBiZSBzcGVjaWZpZWQgdXBvbiBpbnN0YW50aWF0aW9uJztcbiAgICAgICAgfVxuICAgICAgICAvLyBwYXJzZSBwb2ludGVycyB0byBlbnN1cmUgdGhleSBhcmUgdmFsaWRcbiAgICAgICAgdmFyIHBvaW50ZXJzID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKCBhdHRyaWJ1dGVQb2ludGVycyApLmZvckVhY2goIGZ1bmN0aW9uKCBrZXkgKSB7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBwYXJzZUludCgga2V5LCAxMCApO1xuICAgICAgICAgICAgLy8gY2hlY2sgdGhhdCBrZXkgaXMgYW4gdmFsaWQgaW50ZWdlclxuICAgICAgICAgICAgaWYgKCBpc05hTiggaW5kZXggKSApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnQXR0cmlidXRlIGluZGV4IGAnICsga2V5ICsgJ2AgZG9lcyBub3QgcmVwcmVzZW50IGFuIGludGVnZXInO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSBhdHRyaWJ1dGVQb2ludGVyc1trZXldO1xuICAgICAgICAgICAgdmFyIHNpemUgPSBwb2ludGVyLnNpemU7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IHBvaW50ZXIudHlwZTtcbiAgICAgICAgICAgIHZhciBieXRlT2Zmc2V0ID0gcG9pbnRlci5ieXRlT2Zmc2V0O1xuICAgICAgICAgICAgLy8gY2hlY2sgc2l6ZVxuICAgICAgICAgICAgaWYgKCAhU0laRVNbIHNpemUgXSApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnQXR0cmlidXRlIHBvaW50ZXIgYHNpemVgIHBhcmFtZXRlciBpcyBpbnZhbGlkLCBtdXN0IGJlIG9uZSBvZiAnICtcbiAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoIE9iamVjdC5rZXlzKCBTSVpFUyApICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGVjayB0eXBlXG4gICAgICAgICAgICBpZiAoICFUWVBFU1sgdHlwZSBdICkge1xuICAgICAgICAgICAgICAgIHRocm93ICdBdHRyaWJ1dGUgcG9pbnRlciBgdHlwZWAgcGFyYW1ldGVyIGlzIGludmFsaWQsIG11c3QgYmUgb25lIG9mICcgK1xuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSggT2JqZWN0LmtleXMoIFRZUEVTICkgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvaW50ZXJzWyBpbmRleCBdID0ge1xuICAgICAgICAgICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICBieXRlT2Zmc2V0OiAoIGJ5dGVPZmZzZXQgIT09IHVuZGVmaW5lZCApID8gYnl0ZU9mZnNldCA6IERFRkFVTFRfQllURV9PRkZTRVRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcG9pbnRlcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBudW1iZXIgb2YgY29tcG9uZW50cyBpbiB0aGUgYnVmZmVyLlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlUG9pbnRlcnMgLSBUaGUgYXR0cmlidXRlIHBvaW50ZXIgbWFwLlxuICAgICAqXG4gICAgICogQHJldHVybnMge251bWJlcn0gLSBUaGUgbnVtYmVyIG9mIGNvbXBvbmVudHMgaW4gdGhlIGJ1ZmZlci5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXROdW1Db21wb25lbnRzKCBhdHRyaWJ1dGVQb2ludGVycyApIHtcbiAgICAgICAgdmFyIHNpemUgPSAwO1xuICAgICAgICBPYmplY3Qua2V5cyggYXR0cmlidXRlUG9pbnRlcnMgKS5mb3JFYWNoKCBmdW5jdGlvbiggaW5kZXggKSB7XG4gICAgICAgICAgICBzaXplICs9IGF0dHJpYnV0ZVBvaW50ZXJzWyBpbmRleCBdLnNpemU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2l6ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZXMgYW4gVmVydGV4QnVmZmVyIG9iamVjdC5cbiAgICAgKiBAY2xhc3MgVmVydGV4QnVmZmVyXG4gICAgICogQGNsYXNzZGVzYyBBIHZlcnRleCBidWZmZXIgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheXxGbG9hdDMyQXJyYXl8VmVydGV4UGFja2FnZXxudW1iZXJ9IGFyZyAtIFRoZSBidWZmZXIgb3IgbGVuZ3RoIG9mIHRoZSBidWZmZXIuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZVBvaW50ZXJzIC0gVGhlIGFycmF5IHBvaW50ZXIgbWFwLCBvciBpbiB0aGUgY2FzZSBvZiBhIHZlcnRleCBwYWNrYWdlIGFyZywgdGhlIG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBUaGUgcmVuZGVyaW5nIG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMubW9kZSAtIFRoZSBkcmF3IG1vZGUgLyBwcmltaXRpdmUgdHlwZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5ieXRlT2Zmc2V0IC0gVGhlIGJ5dGUgb2Zmc2V0IGludG8gdGhlIGRyYXduIGJ1ZmZlci5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5jb3VudCAtIFRoZSBudW1iZXIgb2YgaW5kaWNlcyB0byBkcmF3LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIFZlcnRleEJ1ZmZlciggYXJnLCBhdHRyaWJ1dGVQb2ludGVycywgb3B0aW9ucyApIHtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2wgPSBXZWJHTENvbnRleHQuZ2V0KCk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBXZWJHTENvbnRleHRTdGF0ZS5nZXQoIGdsICk7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgICAgIHRoaXMubW9kZSA9IE1PREVTWyBvcHRpb25zLm1vZGUgXSA/IG9wdGlvbnMubW9kZSA6IERFRkFVTFRfTU9ERTtcbiAgICAgICAgdGhpcy5jb3VudCA9ICggb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmNvdW50IDogREVGQVVMVF9DT1VOVDtcbiAgICAgICAgdGhpcy5ieXRlT2Zmc2V0ID0gKCBvcHRpb25zLmJ5dGVPZmZzZXQgIT09IHVuZGVmaW5lZCApID8gb3B0aW9ucy5ieXRlT2Zmc2V0IDogREVGQVVMVF9CWVRFX09GRlNFVDtcbiAgICAgICAgdGhpcy5ieXRlTGVuZ3RoID0gMDtcbiAgICAgICAgLy8gZmlyc3QsIHNldCB0aGUgYXR0cmlidXRlIHBvaW50ZXJzXG4gICAgICAgIGlmICggYXJnIGluc3RhbmNlb2YgVmVydGV4UGFja2FnZSApIHtcbiAgICAgICAgICAgIC8vIFZlcnRleFBhY2thZ2UgYXJndW1lbnQsIHVzZSBpdHMgYXR0cmlidXRlIHBvaW50ZXJzXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJzID0gYXJnLnBvaW50ZXJzO1xuICAgICAgICAgICAgLy8gc2hpZnQgb3B0aW9ucyBhcmcgc2luY2UgdGhlcmUgd2lsbCBiZSBubyBhdHRyaWIgcG9pbnRlcnMgYXJnXG4gICAgICAgICAgICBvcHRpb25zID0gYXR0cmlidXRlUG9pbnRlcnMgfHwge307XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJzID0gZ2V0QXR0cmlidXRlUG9pbnRlcnMoIGF0dHJpYnV0ZVBvaW50ZXJzICk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IHRoZSBieXRlIHN0cmlkZVxuICAgICAgICB0aGlzLmJ5dGVTdHJpZGUgPSBnZXRTdHJpZGUoIHRoaXMucG9pbnRlcnMgKTtcbiAgICAgICAgLy8gdGhlbiBidWZmZXIgdGhlIGRhdGFcbiAgICAgICAgaWYgKCBhcmcgKSB7XG4gICAgICAgICAgICBpZiAoIGFyZyBpbnN0YW5jZW9mIFZlcnRleFBhY2thZ2UgKSB7XG4gICAgICAgICAgICAgICAgLy8gVmVydGV4UGFja2FnZSBhcmd1bWVudFxuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyRGF0YSggYXJnLmJ1ZmZlciApO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggYXJnIGluc3RhbmNlb2YgV2ViR0xCdWZmZXIgKSB7XG4gICAgICAgICAgICAgICAgLy8gV2ViR0xCdWZmZXIgYXJndW1lbnRcbiAgICAgICAgICAgICAgICBpZiAoIG9wdGlvbnMuYnl0ZUxlbmd0aCA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnQXJndW1lbnQgb2YgdHlwZSBgV2ViR0xCdWZmZXJgIG11c3QgYmUgY29tcGxpbWVudGVkIHdpdGggYSBjb3JyZXNwb25kaW5nIGBvcHRpb25zLmJ5dGVMZW5ndGhgJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5ieXRlTGVuZ3RoID0gb3B0aW9ucy5ieXRlTGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRoaXMuYnVmZmVyID0gYXJnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBBcnJheSBvciBBcnJheUJ1ZmZlciBvciBudW1iZXIgYXJndW1lbnRcbiAgICAgICAgICAgICAgICB0aGlzLmJ1ZmZlckRhdGEoIGFyZyApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGVuc3VyZSB0aGVyZSBpc24ndCBhbiBvdmVyZmxvd1xuICAgICAgICB2YXIgYnl0ZXNQZXJDb3VudCA9IEJZVEVTX1BFUl9DT01QT05FTlQgKiBnZXROdW1Db21wb25lbnRzKCB0aGlzLnBvaW50ZXJzICk7XG4gICAgICAgIGlmICggdGhpcy5jb3VudCAqIGJ5dGVzUGVyQ291bnQgKyB0aGlzLmJ5dGVPZmZzZXQgPiB0aGlzLmJ5dGVMZW5ndGggKSB7XG4gICAgICAgICAgICB0aHJvdyAnVmVydGV4QnVmZmVyIGBjb3VudGAgb2YgJyArIHRoaXMuY291bnQgKyAnIGFuZCBgYnl0ZU9mZnNldGAgb2YgJyArIHRoaXMuYnl0ZU9mZnNldCArICcgb3ZlcmZsb3dzIHRoZSB0b3RhbCBieXRlIGxlbmd0aCBvZiB0aGUgYnVmZmVyICgnICsgdGhpcy5ieXRlTGVuZ3RoICsgJyknO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBsb2FkIHZlcnRleCBkYXRhIHRvIHRoZSBHUFUuXG4gICAgICogQG1lbWJlcm9mIFZlcnRleEJ1ZmZlclxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheXxBcnJheUJ1ZmZlcnxBcnJheUJ1ZmZlclZpZXd8bnVtYmVyfSBhcmcgLSBUaGUgYXJyYXkgb2YgZGF0YSB0byBidWZmZXIsIG9yIHNpemUgb2YgdGhlIGJ1ZmZlciBpbiBieXRlcy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtWZXJ0ZXhCdWZmZXJ9IFRoZSB2ZXJ0ZXggYnVmZmVyIG9iamVjdCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgVmVydGV4QnVmZmVyLnByb3RvdHlwZS5idWZmZXJEYXRhID0gZnVuY3Rpb24oIGFyZyApIHtcbiAgICAgICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICAgICAgaWYgKCBhcmcgaW5zdGFuY2VvZiBBcnJheSApIHtcbiAgICAgICAgICAgIC8vIGNhc3QgYXJyYXkgaW50byBBcnJheUJ1ZmZlclZpZXdcbiAgICAgICAgICAgIGFyZyA9IG5ldyBGbG9hdDMyQXJyYXkoIGFyZyApO1xuICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgISggYXJnIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgKSAmJlxuICAgICAgICAgICAgISggYXJnIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5ICkgJiZcbiAgICAgICAgICAgIHR5cGVvZiBhcmcgIT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgLy8gaWYgbm90IGFycmF5YnVmZmVyIG9yIGEgbnVtZXJpYyBzaXplXG4gICAgICAgICAgICB0aHJvdyAnQXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIGBBcnJheWAsIGBBcnJheUJ1ZmZlcmAsIGBBcnJheUJ1ZmZlclZpZXdgLCBvciBgbnVtYmVyYCc7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZG9uJ3Qgb3ZlcndyaXRlIHRoZSBjb3VudCBpZiBpdCBpcyBhbHJlYWR5IHNldFxuICAgICAgICBpZiAoIHRoaXMuY291bnQgPT09IERFRkFVTFRfQ09VTlQgKSB7XG4gICAgICAgICAgICAvLyBnZXQgdGhlIHRvdGFsIG51bWJlciBvZiBhdHRyaWJ1dGUgY29tcG9uZW50cyBmcm9tIHBvaW50ZXJzXG4gICAgICAgICAgICB2YXIgbnVtQ29tcG9uZW50cyA9IGdldE51bUNvbXBvbmVudHMoIHRoaXMucG9pbnRlcnMgKTtcbiAgICAgICAgICAgIC8vIHNldCBjb3VudCBiYXNlZCBvbiBzaXplIG9mIGJ1ZmZlciBhbmQgbnVtYmVyIG9mIGNvbXBvbmVudHNcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9ICggYXJnIC8gQllURVNfUEVSX0NPTVBPTkVOVCApIC8gbnVtQ29tcG9uZW50cztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IGFyZy5sZW5ndGggLyBudW1Db21wb25lbnRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHNldCBieXRlIGxlbmd0aFxuICAgICAgICBpZiAoIHR5cGVvZiBhcmcgPT09ICdudW1iZXInICkge1xuICAgICAgICAgICAgaWYgKCBhcmcgJSBCWVRFU19QRVJfQ09NUE9ORU5UICkge1xuICAgICAgICAgICAgICAgIHRocm93ICdCeXRlIGxlbmd0aCBtdXN0IGJlIG11bHRpcGxlIG9mICcgKyBCWVRFU19QRVJfQ09NUE9ORU5UO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ieXRlTGVuZ3RoID0gYXJnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ieXRlTGVuZ3RoID0gYXJnLmxlbmd0aCAqIEJZVEVTX1BFUl9DT01QT05FTlQ7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYnVmZmVyIHRoZSBkYXRhXG4gICAgICAgIGdsLmJpbmRCdWZmZXIoIGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXIgKTtcbiAgICAgICAgZ2wuYnVmZmVyRGF0YSggZ2wuQVJSQVlfQlVGRkVSLCBhcmcsIGdsLlNUQVRJQ19EUkFXICk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFVwbG9hZCBwYXJ0aWFsIHZlcnRleCBkYXRhIHRvIHRoZSBHUFUuXG4gICAgICogQG1lbWJlcm9mIFZlcnRleEJ1ZmZlclxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheXxBcnJheUJ1ZmZlcnxBcnJheUJ1ZmZlclZpZXd9IGFycmF5IC0gVGhlIGFycmF5IG9mIGRhdGEgdG8gYnVmZmVyLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBieXRlT2Zmc2V0IC0gVGhlIGJ5dGUgb2Zmc2V0IGF0IHdoaWNoIHRvIGJ1ZmZlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtWZXJ0ZXhCdWZmZXJ9IFRoZSB2ZXJ0ZXggYnVmZmVyIG9iamVjdCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgVmVydGV4QnVmZmVyLnByb3RvdHlwZS5idWZmZXJTdWJEYXRhID0gZnVuY3Rpb24oIGFycmF5LCBieXRlT2Zmc2V0ICkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgICAgICBpZiAoIHRoaXMuYnl0ZUxlbmd0aCA9PT0gMCApIHtcbiAgICAgICAgICAgIHRocm93ICdCdWZmZXIgaGFzIG5vdCB5ZXQgYmVlbiBhbGxvY2F0ZWQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICggYXJyYXkgaW5zdGFuY2VvZiBBcnJheSApIHtcbiAgICAgICAgICAgIGFycmF5ID0gbmV3IEZsb2F0MzJBcnJheSggYXJyYXkgKTtcbiAgICAgICAgfSBlbHNlIGlmICggISggYXJyYXkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciApICYmICFBcnJheUJ1ZmZlci5pc1ZpZXcoIGFycmF5ICkgKSB7XG4gICAgICAgICAgICB0aHJvdyAnQXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIGBBcnJheWAsIGBBcnJheUJ1ZmZlcmAsIG9yIGBBcnJheUJ1ZmZlclZpZXdgJztcbiAgICAgICAgfVxuICAgICAgICBieXRlT2Zmc2V0ID0gKCBieXRlT2Zmc2V0ICE9PSB1bmRlZmluZWQgKSA/IGJ5dGVPZmZzZXQgOiBERUZBVUxUX0JZVEVfT0ZGU0VUO1xuICAgICAgICAvLyBnZXQgdGhlIHRvdGFsIG51bWJlciBvZiBhdHRyaWJ1dGUgY29tcG9uZW50cyBmcm9tIHBvaW50ZXJzXG4gICAgICAgIHZhciBieXRlTGVuZ3RoID0gYXJyYXkubGVuZ3RoICogQllURVNfUEVSX0NPTVBPTkVOVDtcbiAgICAgICAgaWYgKCBieXRlT2Zmc2V0ICsgYnl0ZUxlbmd0aCA+IHRoaXMuYnl0ZUxlbmd0aCApIHtcbiAgICAgICAgICAgIHRocm93ICdBcmd1bWVudCBvZiBsZW5ndGggJyArIGJ5dGVMZW5ndGggKyAnIGJ5dGVzIGFuZCBvZmZzZXQgb2YgJyArIGJ5dGVPZmZzZXQgKyAnIGJ5dGVzIG92ZXJmbG93cyB0aGUgYnVmZmVyIGxlbmd0aCBvZiAnICsgdGhpcy5ieXRlTGVuZ3RoICsgJyBieXRlcyc7XG4gICAgICAgIH1cbiAgICAgICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlciApO1xuICAgICAgICBnbC5idWZmZXJTdWJEYXRhKCBnbC5BUlJBWV9CVUZGRVIsIGJ5dGVPZmZzZXQsIGFycmF5ICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBCaW5kcyB0aGUgdmVydGV4IGJ1ZmZlciBvYmplY3QuXG4gICAgICogQG1lbWJlcm9mIFZlcnRleEJ1ZmZlclxuICAgICAqXG4gICAgICogQHJldHVybnMge1ZlcnRleEJ1ZmZlcn0gUmV0dXJucyB0aGUgdmVydGV4IGJ1ZmZlciBvYmplY3QgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIFZlcnRleEJ1ZmZlci5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgICAgICAvLyBjYWNoZSB0aGlzIHZlcnRleCBidWZmZXJcbiAgICAgICAgaWYgKCBzdGF0ZS5ib3VuZFZlcnRleEJ1ZmZlciAhPT0gdGhpcy5idWZmZXIgKSB7XG4gICAgICAgICAgICAvLyBiaW5kIGJ1ZmZlclxuICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlciggZ2wuQVJSQVlfQlVGRkVSLCB0aGlzLmJ1ZmZlciApO1xuICAgICAgICAgICAgc3RhdGUuYm91bmRWZXJ0ZXhCdWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcG9pbnRlcnMgPSB0aGlzLnBvaW50ZXJzO1xuICAgICAgICB2YXIgYnl0ZVN0cmlkZSA9IHRoaXMuYnl0ZVN0cmlkZTtcbiAgICAgICAgT2JqZWN0LmtleXMoIHBvaW50ZXJzICkuZm9yRWFjaCggZnVuY3Rpb24oIGluZGV4ICkge1xuICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSBwb2ludGVyc1sgaW5kZXggXTtcbiAgICAgICAgICAgIC8vIHNldCBhdHRyaWJ1dGUgcG9pbnRlclxuICAgICAgICAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihcbiAgICAgICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgICAgICBwb2ludGVyLnNpemUsXG4gICAgICAgICAgICAgICAgZ2xbIHBvaW50ZXIudHlwZSBdLFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgIGJ5dGVTdHJpZGUsXG4gICAgICAgICAgICAgICAgcG9pbnRlci5ieXRlT2Zmc2V0ICk7XG4gICAgICAgICAgICAvLyBlbmFibGUgYXR0cmlidXRlIGluZGV4XG4gICAgICAgICAgICBpZiAoICFzdGF0ZS5lbmFibGVkVmVydGV4QXR0cmlidXRlc1sgaW5kZXggXSApIHtcbiAgICAgICAgICAgICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSggaW5kZXggKTtcbiAgICAgICAgICAgICAgICBzdGF0ZS5lbmFibGVkVmVydGV4QXR0cmlidXRlc1sgaW5kZXggXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVW5iaW5kcyB0aGUgdmVydGV4IGJ1ZmZlciBvYmplY3QuXG4gICAgICogQG1lbWJlcm9mIFZlcnRleEJ1ZmZlclxuICAgICAqXG4gICAgICogQHJldHVybnMge1ZlcnRleEJ1ZmZlcn0gUmV0dXJucyB0aGUgdmVydGV4IGJ1ZmZlciBvYmplY3QgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIFZlcnRleEJ1ZmZlci5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIC8vIG9ubHkgYmluZCBpZiBpdCBhbHJlYWR5IGlzbid0IGJvdW5kXG4gICAgICAgIGlmICggc3RhdGUuYm91bmRWZXJ0ZXhCdWZmZXIgIT09IHRoaXMuYnVmZmVyICkge1xuICAgICAgICAgICAgLy8gYmluZCBidWZmZXJcbiAgICAgICAgICAgIGdsLmJpbmRCdWZmZXIoIGdsLkFSUkFZX0JVRkZFUiwgdGhpcy5idWZmZXIgKTtcbiAgICAgICAgICAgIHN0YXRlLmJvdW5kVmVydGV4QnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgICAgIH1cbiAgICAgICAgT2JqZWN0LmtleXMoIHRoaXMucG9pbnRlcnMgKS5mb3JFYWNoKCBmdW5jdGlvbiggaW5kZXggKSB7XG4gICAgICAgICAgICAvLyBkaXNhYmxlIGF0dHJpYnV0ZSBpbmRleFxuICAgICAgICAgICAgaWYgKCBzdGF0ZS5lbmFibGVkVmVydGV4QXR0cmlidXRlc1sgaW5kZXggXSApIHtcbiAgICAgICAgICAgICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoIGluZGV4ICk7XG4gICAgICAgICAgICAgICAgc3RhdGUuZW5hYmxlZFZlcnRleEF0dHJpYnV0ZXNbIGluZGV4IF0gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBFeGVjdXRlIHRoZSBkcmF3IGNvbW1hbmQgZm9yIHRoZSBib3VuZCBidWZmZXIuXG4gICAgICogQG1lbWJlcm9mIFZlcnRleEJ1ZmZlclxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBUaGUgb3B0aW9ucyB0byBwYXNzIHRvICdkcmF3QXJyYXlzJy4gT3B0aW9uYWwuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMubW9kZSAtIFRoZSBkcmF3IG1vZGUgLyBwcmltaXRpdmUgdHlwZS5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5ieXRlT2Zmc2V0IC0gVGhlIGJ5dGUgb2Zmc2V0IGludG8gdGhlIGRyYXduIGJ1ZmZlci5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5jb3VudCAtIFRoZSBudW1iZXIgb2YgaW5kaWNlcyB0byBkcmF3LlxuICAgICAqXG4gICAgICogQHJldHVybnMge1ZlcnRleEJ1ZmZlcn0gUmV0dXJucyB0aGUgdmVydGV4IGJ1ZmZlciBvYmplY3QgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIFZlcnRleEJ1ZmZlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCBvcHRpb25zICkge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgaWYgKCB0aGlzLnN0YXRlLmJvdW5kVmVydGV4QnVmZmVyICE9PSB0aGlzLmJ1ZmZlciApIHtcbiAgICAgICAgICAgIHRocm93ICdBdHRlbXB0aW5nIHRvIGRyYXcgYW4gdW5ib3VuZCBWZXJ0ZXhCdWZmZXInO1xuICAgICAgICB9XG4gICAgICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgICAgIHZhciBtb2RlID0gZ2xbIG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgXTtcbiAgICAgICAgdmFyIGJ5dGVPZmZzZXQgPSAoIG9wdGlvbnMuYnl0ZU9mZnNldCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmJ5dGVPZmZzZXQgOiB0aGlzLmJ5dGVPZmZzZXQ7XG4gICAgICAgIHZhciBjb3VudCA9ICggb3B0aW9ucy5jb3VudCAhPT0gdW5kZWZpbmVkICkgPyBvcHRpb25zLmNvdW50IDogdGhpcy5jb3VudDtcbiAgICAgICAgaWYgKCBjb3VudCA9PT0gMCApIHtcbiAgICAgICAgICAgIHRocm93ICdBdHRlbXB0aW5nIHRvIGRyYXcgd2l0aCBhIGNvdW50IG9mIDAnO1xuICAgICAgICB9XG4gICAgICAgIHZhciBieXRlc1BlckNvdW50ID0gQllURVNfUEVSX0NPTVBPTkVOVCAqIGdldE51bUNvbXBvbmVudHMoIHRoaXMucG9pbnRlcnMgKTtcbiAgICAgICAgaWYgKCBjb3VudCAqIGJ5dGVzUGVyQ291bnQgKyBieXRlT2Zmc2V0ID4gdGhpcy5ieXRlTGVuZ3RoICkge1xuICAgICAgICAgICAgdGhyb3cgJ0F0dGVtcHRpbmcgdG8gZHJhdyB3aXRoIGBjb3VudGAgb2YgJyArIGNvdW50ICsgJyBhbmQgYG9mZnNldGAgb2YgJyArIGJ5dGVPZmZzZXQgKyAnIG92ZXJmbG93cyB0aGUgdG90YWwgYnl0ZSBsZW5ndGggb2YgdGhlIGJ1ZmZlciAoJyArIHRoaXMuYnl0ZUxlbmd0aCArICcpJztcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IGVsZW1lbnRzXG4gICAgICAgIGdsLmRyYXdBcnJheXMoIG1vZGUsIGJ5dGVPZmZzZXQsIGNvdW50ICk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFZlcnRleEJ1ZmZlcjtcblxufSgpKTtcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC9VdGlsJyk7XHJcbiAgICB2YXIgQ09NUE9ORU5UX1RZUEUgPSAnRkxPQVQnO1xyXG4gICAgdmFyIEJZVEVTX1BFUl9DT01QT05FTlQgPSA0O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlcyBpbnZhbGlkIGF0dHJpYnV0ZSBhcmd1bWVudHMuIEEgdmFsaWQgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBsZW5ndGggPiAwIGtleSBieSBhIHN0cmluZyByZXByZXNlbnRpbmcgYW4gaW50LlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcyAtIFRoZSBtYXAgb2YgdmVydGV4IGF0dHJpYnV0ZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge0FycmF5fSBUaGUgdmFsaWQgYXJyYXkgb2YgYXJndW1lbnRzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBwYXJzZUF0dHJpYnV0ZU1hcCggYXR0cmlidXRlcyApIHtcclxuICAgICAgICB2YXIgZ29vZEF0dHJpYnV0ZXMgPSBbXTtcclxuICAgICAgICBPYmplY3Qua2V5cyggYXR0cmlidXRlcyApLmZvckVhY2goIGZ1bmN0aW9uKCBrZXkgKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhcnNlRmxvYXQoIGtleSApO1xyXG4gICAgICAgICAgICAvLyBjaGVjayB0aGF0IGtleSBpcyBhbiB2YWxpZCBpbnRlZ2VyXHJcbiAgICAgICAgICAgIGlmICggIVV0aWwuaXNJbnRlZ2VyKCBpbmRleCApIHx8IGluZGV4IDwgMCApIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdBdHRyaWJ1dGUgaW5kZXggYCcgKyBrZXkgKyAnYCBkb2VzIG5vdCByZXByZXNlbnQgYSB2YWxpZCBpbnRlZ2VyJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdmVydGljZXMgPSBhdHRyaWJ1dGVzW2tleV07XHJcbiAgICAgICAgICAgIC8vIGVuc3VyZSBhdHRyaWJ1dGUgaXMgdmFsaWRcclxuICAgICAgICAgICAgaWYgKCB2ZXJ0aWNlcyAmJlxyXG4gICAgICAgICAgICAgICAgdmVydGljZXMgaW5zdGFuY2VvZiBBcnJheSAmJlxyXG4gICAgICAgICAgICAgICAgdmVydGljZXMubGVuZ3RoID4gMCApIHtcclxuICAgICAgICAgICAgICAgIC8vIGFkZCBhdHRyaWJ1dGUgZGF0YSBhbmQgaW5kZXhcclxuICAgICAgICAgICAgICAgIGdvb2RBdHRyaWJ1dGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB2ZXJ0aWNlc1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyAnRXJyb3IgcGFyc2luZyBhdHRyaWJ1dGUgb2YgaW5kZXggYCcgKyBrZXkgKyAnYCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBzb3J0IGF0dHJpYnV0ZXMgYXNjZW5kaW5nIGJ5IGluZGV4XHJcbiAgICAgICAgZ29vZEF0dHJpYnV0ZXMuc29ydChmdW5jdGlvbihhLGIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGEuaW5kZXggLSBiLmluZGV4O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBnb29kQXR0cmlidXRlcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYSBjb21wb25lbnQncyBieXRlIHNpemUuXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fEFycmF5fSBjb21wb25lbnQgLSBUaGUgY29tcG9uZW50IHRvIG1lYXN1cmUuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge2ludGVnZXJ9IFRoZSBieXRlIHNpemUgb2YgdGhlIGNvbXBvbmVudC5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0Q29tcG9uZW50U2l6ZSggY29tcG9uZW50ICkge1xyXG4gICAgICAgIC8vIGNoZWNrIGlmIHZlY3RvclxyXG4gICAgICAgIGlmICggY29tcG9uZW50LnggIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgLy8gMSBjb21wb25lbnQgdmVjdG9yXHJcbiAgICAgICAgICAgIGlmICggY29tcG9uZW50LnkgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIC8vIDIgY29tcG9uZW50IHZlY3RvclxyXG4gICAgICAgICAgICAgICAgaWYgKCBjb21wb25lbnQueiAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIDMgY29tcG9uZW50IHZlY3RvclxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggY29tcG9uZW50LncgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gNCBjb21wb25lbnQgdmVjdG9yXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjaGVjayBpZiBhcnJheVxyXG4gICAgICAgIGlmICggY29tcG9uZW50IGluc3RhbmNlb2YgQXJyYXkgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjb21wb25lbnQubGVuZ3RoO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBkZWZhdWx0IHRvIDEgb3RoZXJ3aXNlXHJcbiAgICAgICAgcmV0dXJuIDE7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxjdWxhdGVzIHRoZSB0eXBlLCBzaXplLCBhbmQgb2Zmc2V0IGZvciBlYWNoIGF0dHJpYnV0ZSBpbiB0aGUgYXR0cmlidXRlIGFycmF5IGFsb25nIHdpdGggdGhlIGxlbmd0aCBhbmQgc3RyaWRlIG9mIHRoZSBwYWNrYWdlLlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1ZlcnRleFBhY2thZ2V9IHZlcnRleFBhY2thZ2UgLSBUaGUgVmVydGV4UGFja2FnZSBvYmplY3QuXHJcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBhdHRyaWJ1dGVzIC0gVGhlIGFycmF5IG9mIHZlcnRleCBhdHRyaWJ1dGVzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzZXRQb2ludGVyc0FuZFN0cmlkZSggdmVydGV4UGFja2FnZSwgYXR0cmlidXRlcyApIHtcclxuICAgICAgICB2YXIgc2hvcnRlc3RBcnJheSA9IE51bWJlci5NQVhfVkFMVUU7XHJcbiAgICAgICAgdmFyIG9mZnNldCA9IDA7XHJcbiAgICAgICAgLy8gY2xlYXIgcG9pbnRlcnNcclxuICAgICAgICB2ZXJ0ZXhQYWNrYWdlLnBvaW50ZXJzID0ge307XHJcbiAgICAgICAgLy8gZm9yIGVhY2ggYXR0cmlidXRlXHJcbiAgICAgICAgYXR0cmlidXRlcy5mb3JFYWNoKCBmdW5jdGlvbiggdmVydGljZXMgKSB7XHJcbiAgICAgICAgICAgIC8vIHNldCBzaXplIHRvIG51bWJlciBvZiBjb21wb25lbnRzIGluIHRoZSBhdHRyaWJ1dGVcclxuICAgICAgICAgICAgdmFyIHNpemUgPSBnZXRDb21wb25lbnRTaXplKCB2ZXJ0aWNlcy5kYXRhWzBdICk7XHJcbiAgICAgICAgICAgIC8vIGxlbmd0aCBvZiB0aGUgcGFja2FnZSB3aWxsIGJlIHRoZSBzaG9ydGVzdCBhdHRyaWJ1dGUgYXJyYXkgbGVuZ3RoXHJcbiAgICAgICAgICAgIHNob3J0ZXN0QXJyYXkgPSBNYXRoLm1pbiggc2hvcnRlc3RBcnJheSwgdmVydGljZXMuZGF0YS5sZW5ndGggKTtcclxuICAgICAgICAgICAgLy8gc3RvcmUgcG9pbnRlciB1bmRlciBpbmRleFxyXG4gICAgICAgICAgICB2ZXJ0ZXhQYWNrYWdlLnBvaW50ZXJzWyB2ZXJ0aWNlcy5pbmRleCBdID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZSA6IENPTVBPTkVOVF9UWVBFLFxyXG4gICAgICAgICAgICAgICAgc2l6ZSA6IHNpemUsXHJcbiAgICAgICAgICAgICAgICBieXRlT2Zmc2V0IDogb2Zmc2V0ICogQllURVNfUEVSX0NPTVBPTkVOVFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBhY2N1bXVsYXRlIGF0dHJpYnV0ZSBvZmZzZXRcclxuICAgICAgICAgICAgb2Zmc2V0ICs9IHNpemU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gc2V0IHN0cmlkZSB0byB0b3RhbCBvZmZzZXRcclxuICAgICAgICB2ZXJ0ZXhQYWNrYWdlLmJ5dGVTdHJpZGUgPSBvZmZzZXQgKiBCWVRFU19QRVJfQ09NUE9ORU5UO1xyXG4gICAgICAgIC8vIHNldCBsZW5ndGggb2YgcGFja2FnZSB0byB0aGUgc2hvcnRlc3QgYXR0cmlidXRlIGFycmF5IGxlbmd0aFxyXG4gICAgICAgIHZlcnRleFBhY2thZ2UubGVuZ3RoID0gc2hvcnRlc3RBcnJheTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpbGwgdGhlIGFycmF5YnVmZmVyIHdpdGggYSBzaW5nbGUgY29tcG9uZW50IGF0dHJpYnV0ZS5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IGJ1ZmZlciAtIFRoZSBhcnJheWJ1ZmZlciB0byBmaWxsLlxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgLSBUaGUgdmVydGV4IGF0dHJpYnV0ZSBhcnJheSB0byBjb3B5IGZyb20uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoIC0gVGhlIGxlbmd0aCBvZiB0aGUgYnVmZmVyIHRvIGNvcHkgZnJvbS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgLSBUaGUgb2Zmc2V0IHRvIHRoZSBhdHRyaWJ1dGUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RyaWRlIC0gVGhlIG9mIHN0cmlkZSBvZiB0aGUgYnVmZmVyLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzZXQxQ29tcG9uZW50QXR0ciggYnVmZmVyLCB2ZXJ0aWNlcywgbGVuZ3RoLCBvZmZzZXQsIHN0cmlkZSApIHtcclxuICAgICAgICB2YXIgdmVydGV4LCBpLCBqO1xyXG4gICAgICAgIGZvciAoIGk9MDsgaTxsZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgdmVydGV4ID0gdmVydGljZXNbaV07XHJcbiAgICAgICAgICAgIC8vIGdldCB0aGUgaW5kZXggaW4gdGhlIGJ1ZmZlciB0byB0aGUgcGFydGljdWxhciB2ZXJ0ZXhcclxuICAgICAgICAgICAgaiA9IG9mZnNldCArICggc3RyaWRlICogaSApO1xyXG4gICAgICAgICAgICBpZiAoIHZlcnRleC54ICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXJbal0gPSB2ZXJ0ZXgueDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICggdmVydGV4WzBdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXJbal0gPSB2ZXJ0ZXhbMF07XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXJbal0gPSB2ZXJ0ZXg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaWxsIHRoZSBhcnJheWJ1ZmZlciB3aXRoIGEgZG91YmxlIGNvbXBvbmVudCBhdHRyaWJ1dGUuXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSBidWZmZXIgLSBUaGUgYXJyYXlidWZmZXIgdG8gZmlsbC5cclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIC0gVGhlIHZlcnRleCBhdHRyaWJ1dGUgYXJyYXkgdG8gY29weSBmcm9tLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIGJ1ZmZlciB0byBjb3B5IGZyb20uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IC0gVGhlIG9mZnNldCB0byB0aGUgYXR0cmlidXRlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0cmlkZSAtIFRoZSBvZiBzdHJpZGUgb2YgdGhlIGJ1ZmZlci5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc2V0MkNvbXBvbmVudEF0dHIoIGJ1ZmZlciwgdmVydGljZXMsIGxlbmd0aCwgb2Zmc2V0LCBzdHJpZGUgKSB7XHJcbiAgICAgICAgdmFyIHZlcnRleCwgaSwgajtcclxuICAgICAgICBmb3IgKCBpPTA7IGk8bGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgIHZlcnRleCA9IHZlcnRpY2VzW2ldO1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIGluZGV4IGluIHRoZSBidWZmZXIgdG8gdGhlIHBhcnRpY3VsYXIgdmVydGV4XHJcbiAgICAgICAgICAgIGogPSBvZmZzZXQgKyAoIHN0cmlkZSAqIGkgKTtcclxuICAgICAgICAgICAgYnVmZmVyW2pdID0gKCB2ZXJ0ZXgueCAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgueCA6IHZlcnRleFswXTtcclxuICAgICAgICAgICAgYnVmZmVyW2orMV0gPSAoIHZlcnRleC55ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC55IDogdmVydGV4WzFdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpbGwgdGhlIGFycmF5YnVmZmVyIHdpdGggYSB0cmlwbGUgY29tcG9uZW50IGF0dHJpYnV0ZS5cclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtGbG9hdDMyQXJyYXl9IGJ1ZmZlciAtIFRoZSBhcnJheWJ1ZmZlciB0byBmaWxsLlxyXG4gICAgICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgLSBUaGUgdmVydGV4IGF0dHJpYnV0ZSBhcnJheSB0byBjb3B5IGZyb20uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoIC0gVGhlIGxlbmd0aCBvZiB0aGUgYnVmZmVyIHRvIGNvcHkgZnJvbS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgLSBUaGUgb2Zmc2V0IHRvIHRoZSBhdHRyaWJ1dGUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3RyaWRlIC0gVGhlIG9mIHN0cmlkZSBvZiB0aGUgYnVmZmVyLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBzZXQzQ29tcG9uZW50QXR0ciggYnVmZmVyLCB2ZXJ0aWNlcywgbGVuZ3RoLCBvZmZzZXQsIHN0cmlkZSApIHtcclxuICAgICAgICB2YXIgdmVydGV4LCBpLCBqO1xyXG4gICAgICAgIGZvciAoIGk9MDsgaTxsZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgdmVydGV4ID0gdmVydGljZXNbaV07XHJcbiAgICAgICAgICAgIC8vIGdldCB0aGUgaW5kZXggaW4gdGhlIGJ1ZmZlciB0byB0aGUgcGFydGljdWxhciB2ZXJ0ZXhcclxuICAgICAgICAgICAgaiA9IG9mZnNldCArICggc3RyaWRlICogaSApO1xyXG4gICAgICAgICAgICBidWZmZXJbal0gPSAoIHZlcnRleC54ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC54IDogdmVydGV4WzBdO1xyXG4gICAgICAgICAgICBidWZmZXJbaisxXSA9ICggdmVydGV4LnkgIT09IHVuZGVmaW5lZCApID8gdmVydGV4LnkgOiB2ZXJ0ZXhbMV07XHJcbiAgICAgICAgICAgIGJ1ZmZlcltqKzJdID0gKCB2ZXJ0ZXgueiAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgueiA6IHZlcnRleFsyXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaWxsIHRoZSBhcnJheWJ1ZmZlciB3aXRoIGEgcXVhZHJ1cGxlIGNvbXBvbmVudCBhdHRyaWJ1dGUuXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSBidWZmZXIgLSBUaGUgYXJyYXlidWZmZXIgdG8gZmlsbC5cclxuICAgICAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIC0gVGhlIHZlcnRleCBhdHRyaWJ1dGUgYXJyYXkgdG8gY29weSBmcm9tLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCAtIFRoZSBsZW5ndGggb2YgdGhlIGJ1ZmZlciB0byBjb3B5IGZyb20uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0IC0gVGhlIG9mZnNldCB0byB0aGUgYXR0cmlidXRlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHN0cmlkZSAtIFRoZSBvZiBzdHJpZGUgb2YgdGhlIGJ1ZmZlci5cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gc2V0NENvbXBvbmVudEF0dHIoIGJ1ZmZlciwgdmVydGljZXMsIGxlbmd0aCwgb2Zmc2V0LCBzdHJpZGUgKSB7XHJcbiAgICAgICAgdmFyIHZlcnRleCwgaSwgajtcclxuICAgICAgICBmb3IgKCBpPTA7IGk8bGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgIHZlcnRleCA9IHZlcnRpY2VzW2ldO1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIGluZGV4IGluIHRoZSBidWZmZXIgdG8gdGhlIHBhcnRpY3VsYXIgdmVydGV4XHJcbiAgICAgICAgICAgIGogPSBvZmZzZXQgKyAoIHN0cmlkZSAqIGkgKTtcclxuICAgICAgICAgICAgYnVmZmVyW2pdID0gKCB2ZXJ0ZXgueCAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgueCA6IHZlcnRleFswXTtcclxuICAgICAgICAgICAgYnVmZmVyW2orMV0gPSAoIHZlcnRleC55ICE9PSB1bmRlZmluZWQgKSA/IHZlcnRleC55IDogdmVydGV4WzFdO1xyXG4gICAgICAgICAgICBidWZmZXJbaisyXSA9ICggdmVydGV4LnogIT09IHVuZGVmaW5lZCApID8gdmVydGV4LnogOiB2ZXJ0ZXhbMl07XHJcbiAgICAgICAgICAgIGJ1ZmZlcltqKzNdID0gKCB2ZXJ0ZXgudyAhPT0gdW5kZWZpbmVkICkgPyB2ZXJ0ZXgudyA6IHZlcnRleFszXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYW4gVmVydGV4UGFja2FnZSBvYmplY3QuXHJcbiAgICAgKiBAY2xhc3MgVmVydGV4UGFja2FnZVxyXG4gICAgICogQGNsYXNzZGVzYyBBIHZlcnRleCBwYWNrYWdlIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcyAtIFRoZSBhdHRyaWJ1dGVzIHRvIGludGVybGVhdmUga2V5ZWQgYnkgaW5kZXguXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIFZlcnRleFBhY2thZ2UoIGF0dHJpYnV0ZXMgKSB7XHJcbiAgICAgICAgaWYgKCBhdHRyaWJ1dGVzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0KCBhdHRyaWJ1dGVzICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5idWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KDApO1xyXG4gICAgICAgICAgICB0aGlzLnBvaW50ZXJzID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRoZSBkYXRhIHRvIGJlIGludGVybGVhdmVkIGluc2lkZSB0aGUgcGFja2FnZS4gVGhpcyBjbGVhcnMgYW55IHByZXZpb3VzbHkgZXhpc3RpbmcgZGF0YS5cclxuICAgICAqIEBtZW1iZXJvZiBWZXJ0ZXhQYWNrYWdlXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMgLSBUaGUgYXR0cmlidXRlcyB0byBpbnRlcmxlYXZlZCwga2V5ZWQgYnkgaW5kZXguXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1ZlcnRleFBhY2thZ2V9IC0gVGhlIHZlcnRleCBwYWNrYWdlIG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBWZXJ0ZXhQYWNrYWdlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiggYXR0cmlidXRlcyApIHtcclxuICAgICAgICAvLyByZW1vdmUgYmFkIGF0dHJpYnV0ZXNcclxuICAgICAgICBhdHRyaWJ1dGVzID0gcGFyc2VBdHRyaWJ1dGVNYXAoIGF0dHJpYnV0ZXMgKTtcclxuICAgICAgICAvLyBzZXQgYXR0cmlidXRlIHBvaW50ZXJzIGFuZCBzdHJpZGVcclxuICAgICAgICBzZXRQb2ludGVyc0FuZFN0cmlkZSggdGhpcywgYXR0cmlidXRlcyApO1xyXG4gICAgICAgIC8vIHNldCBzaXplIG9mIGRhdGEgdmVjdG9yXHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xyXG4gICAgICAgIHZhciBzdHJpZGUgPSB0aGlzLmJ5dGVTdHJpZGUgLyBCWVRFU19QRVJfQ09NUE9ORU5UO1xyXG4gICAgICAgIHZhciBwb2ludGVycyA9IHRoaXMucG9pbnRlcnM7XHJcbiAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMuYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSggbGVuZ3RoICogc3RyaWRlICk7XHJcbiAgICAgICAgLy8gZm9yIGVhY2ggdmVydGV4IGF0dHJpYnV0ZSBhcnJheVxyXG4gICAgICAgIGF0dHJpYnV0ZXMuZm9yRWFjaCggZnVuY3Rpb24oIHZlcnRpY2VzICkge1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIHBvaW50ZXJcclxuICAgICAgICAgICAgdmFyIHBvaW50ZXIgPSBwb2ludGVyc1sgdmVydGljZXMuaW5kZXggXTtcclxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBwb2ludGVycyBvZmZzZXRcclxuICAgICAgICAgICAgdmFyIG9mZnNldCA9IHBvaW50ZXIuYnl0ZU9mZnNldCAvIEJZVEVTX1BFUl9DT01QT05FTlQ7XHJcbiAgICAgICAgICAgIC8vIGNvcHkgdmVydGV4IGRhdGEgaW50byBhcnJheWJ1ZmZlclxyXG4gICAgICAgICAgICBzd2l0Y2ggKCBwb2ludGVyLnNpemUgKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0MkNvbXBvbmVudEF0dHIoIGJ1ZmZlciwgdmVydGljZXMuZGF0YSwgbGVuZ3RoLCBvZmZzZXQsIHN0cmlkZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgICAgICAgICAgIHNldDNDb21wb25lbnRBdHRyKCBidWZmZXIsIHZlcnRpY2VzLmRhdGEsIGxlbmd0aCwgb2Zmc2V0LCBzdHJpZGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDpcclxuICAgICAgICAgICAgICAgICAgICBzZXQ0Q29tcG9uZW50QXR0ciggYnVmZmVyLCB2ZXJ0aWNlcy5kYXRhLCBsZW5ndGgsIG9mZnNldCwgc3RyaWRlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHNldDFDb21wb25lbnRBdHRyKCBidWZmZXIsIHZlcnRpY2VzLmRhdGEsIGxlbmd0aCwgb2Zmc2V0LCBzdHJpZGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFZlcnRleFBhY2thZ2U7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBXZWJHTENvbnRleHQgPSByZXF1aXJlKCcuL1dlYkdMQ29udGV4dCcpO1xyXG4gICAgdmFyIFdlYkdMQ29udGV4dFN0YXRlID0gcmVxdWlyZSgnLi9XZWJHTENvbnRleHRTdGF0ZScpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQmluZCB0aGUgdmlld3BvcnQgdG8gdGhlIHJlbmRlcmluZyBjb250ZXh0LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7Vmlld3BvcnR9IHZpZXdwb3J0IC0gVGhlIHZpZXdwb3J0IG9iamVjdC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFRoZSB3aWR0aCBvdmVycmlkZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBUaGUgaGVpZ2h0IG92ZXJyaWRlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHggLSBUaGUgaG9yaXpvbnRhbCBvZmZzZXQuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geSAtIFRoZSB2ZXJ0aWNhbCBvZmZzZXQuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHNldCggdmlld3BvcnQsIHgsIHksIHdpZHRoLCBoZWlnaHQgKSB7XHJcbiAgICAgICAgdmFyIGdsID0gdmlld3BvcnQuZ2w7XHJcbiAgICAgICAgeCA9ICggeCAhPT0gdW5kZWZpbmVkICkgPyB4IDogMDtcclxuICAgICAgICB5ID0gKCB5ICE9PSB1bmRlZmluZWQgKSA/IHkgOiAwO1xyXG4gICAgICAgIHdpZHRoID0gKCB3aWR0aCAhPT0gdW5kZWZpbmVkICkgPyB3aWR0aCA6IHZpZXdwb3J0LndpZHRoO1xyXG4gICAgICAgIGhlaWdodCA9ICggaGVpZ2h0ICE9PSB1bmRlZmluZWQgKSA/IGhlaWdodCA6IHZpZXdwb3J0LmhlaWdodDtcclxuICAgICAgICBnbC52aWV3cG9ydCggeCwgeSwgd2lkdGgsIGhlaWdodCApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zdGFudGlhdGVzIGFuIFZpZXdwb3J0IG9iamVjdC5cclxuICAgICAqIEBjbGFzcyBWaWV3cG9ydFxyXG4gICAgICogQGNsYXNzZGVzYyBBIHZpZXdwb3J0IG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3BlYyAtIFRoZSB2aWV3cG9ydCBzcGVjaWZpY2F0aW9uIG9iamVjdC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzcGVjLndpZHRoIC0gVGhlIHdpZHRoIG9mIHRoZSB2aWV3cG9ydC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzcGVjLmhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIHZpZXdwb3J0LlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBWaWV3cG9ydCggc3BlYyApIHtcclxuICAgICAgICBzcGVjID0gc3BlYyB8fCB7fTtcclxuICAgICAgICB0aGlzLmdsID0gV2ViR0xDb250ZXh0LmdldCgpO1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBXZWJHTENvbnRleHRTdGF0ZS5nZXQoIHRoaXMuZ2wgKTtcclxuICAgICAgICAvLyBzZXQgc2l6ZVxyXG4gICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICBzcGVjLndpZHRoIHx8IHRoaXMuZ2wuY2FudmFzLndpZHRoLFxyXG4gICAgICAgICAgICBzcGVjLmhlaWdodCB8fCB0aGlzLmdsLmNhbnZhcy5oZWlnaHQgKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZXMgdGhlIHZpZXdwb3J0cyB3aWR0aCBhbmQgaGVpZ2h0LiBUaGlzIHJlc2l6ZXMgdGhlIHVuZGVybHlpbmcgY2FudmFzIGVsZW1lbnQuXHJcbiAgICAgKiBAbWVtYmVyb2YgVmlld3BvcnRcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBUaGUgd2lkdGggb2YgdGhlIHZpZXdwb3J0LlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBoZWlnaHQgb2YgdGhlIHZpZXdwb3J0LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtWaWV3cG9ydH0gVGhlIHZpZXdwb3J0IG9iamVjdCwgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBWaWV3cG9ydC5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24oIHdpZHRoLCBoZWlnaHQgKSB7XHJcbiAgICAgICAgaWYgKCB0eXBlb2Ygd2lkdGggIT09ICdudW1iZXInIHx8ICggd2lkdGggPD0gMCApICkge1xyXG4gICAgICAgICAgICB0aHJvdyAnUHJvdmlkZWQgYHdpZHRoYCBvZiAnICsgd2lkdGggKyAnIGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHR5cGVvZiBoZWlnaHQgIT09ICdudW1iZXInIHx8ICggaGVpZ2h0IDw9IDAgKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1Byb3ZpZGVkIGBoZWlnaHRgIG9mICcgKyBoZWlnaHQgKyAnIGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5nbC5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmdsLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWN0aXZhdGVzIHRoZSB2aWV3cG9ydCBhbmQgcHVzaGVzIGl0IG9udG8gdGhlIHN0YWNrIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50cy4gVGhlIHVuZGVybHlpbmcgY2FudmFzIGVsZW1lbnQgaXMgbm90IGFmZmVjdGVkLlxyXG4gICAgICogQG1lbWJlcm9mIFZpZXdwb3J0XHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gVGhlIHdpZHRoIG92ZXJyaWRlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIFRoZSBoZWlnaHQgb3ZlcnJpZGUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSBob3Jpem9udGFsIG9mZnNldCBvdmVycmlkZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIHZlcnRpY2FsIG9mZnNldCBvdmVycmlkZS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Vmlld3BvcnR9IFRoZSB2aWV3cG9ydCBvYmplY3QsIGZvciBjaGFpbmluZy5cclxuICAgICAqL1xyXG4gICAgVmlld3BvcnQucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiggeCwgeSwgd2lkdGgsIGhlaWdodCApIHtcclxuICAgICAgICBpZiAoIHggIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgeCAhPT0gJ251bWJlcicgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQcm92aWRlZCBgeGAgb2YgJyArIHggKyAnIGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHkgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgeSAhPT0gJ251bWJlcicgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQcm92aWRlZCBgeWAgb2YgJyArIHkgKyAnIGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIHdpZHRoICE9PSB1bmRlZmluZWQgJiYgKCB0eXBlb2Ygd2lkdGggIT09ICdudW1iZXInIHx8ICggd2lkdGggPD0gMCApICkgKSB7XHJcbiAgICAgICAgICAgIHRocm93ICdQcm92aWRlZCBgd2lkdGhgIG9mICcgKyB3aWR0aCArICcgaXMgaW52YWxpZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggaGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgKCB0eXBlb2YgaGVpZ2h0ICE9PSAnbnVtYmVyJyB8fCAoIGhlaWdodCA8PSAwICkgKSApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1Byb3ZpZGVkIGBoZWlnaHRgIG9mICcgKyBoZWlnaHQgKyAnIGlzIGludmFsaWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0YXRlLnZpZXdwb3J0cy5wdXNoKHtcclxuICAgICAgICAgICAgdmlld3BvcnQ6IHRoaXMsXHJcbiAgICAgICAgICAgIHg6IHgsXHJcbiAgICAgICAgICAgIHk6IHksXHJcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHRcclxuICAgICAgICB9KTtcclxuICAgICAgICBzZXQoIHRoaXMsIHgsIHksIHdpZHRoLCBoZWlnaHQgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQb3BzIGN1cnJlbnQgdGhlIHZpZXdwb3J0IG9iamVjdCBhbmQgYWN0aXZhdGVzIHRoZSB2aWV3cG9ydCBiZW5lYXRoIGl0LlxyXG4gICAgICogQG1lbWJlcm9mIFZpZXdwb3J0XHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge1ZpZXdwb3J0fSBUaGUgdmlld3BvcnQgb2JqZWN0LCBmb3IgY2hhaW5pbmcuXHJcbiAgICAgKi9cclxuICAgIFZpZXdwb3J0LnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlO1xyXG4gICAgICAgIHZhciB0b3AgPSBzdGF0ZS52aWV3cG9ydHMudG9wKCk7XHJcbiAgICAgICAgaWYgKCAhdG9wIHx8IHRoaXMgIT09IHRvcC52aWV3cG9ydCApIHtcclxuICAgICAgICAgICAgdGhyb3cgJ1ZpZXdwb3J0IGlzIG5vdCB0aGUgdG9wIG1vc3QgZWxlbWVudCBvbiB0aGUgc3RhY2snO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzdGF0ZS52aWV3cG9ydHMucG9wKCk7XHJcbiAgICAgICAgdG9wID0gc3RhdGUudmlld3BvcnRzLnRvcCgpO1xyXG4gICAgICAgIGlmICggdG9wICkge1xyXG4gICAgICAgICAgICBzZXQoIHRvcC52aWV3cG9ydCwgdG9wLngsIHRvcC55LCB0b3Aud2lkdGgsIHRvcC5oZWlnaHQgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZXQoIHRoaXMgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gVmlld3BvcnQ7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRVhURU5TSU9OUyA9IFtcbiAgICAgICAgLy8gcmF0aWZpZWRcbiAgICAgICAgJ09FU190ZXh0dXJlX2Zsb2F0JyxcbiAgICAgICAgJ09FU190ZXh0dXJlX2hhbGZfZmxvYXQnLFxuICAgICAgICAnV0VCR0xfbG9zZV9jb250ZXh0JyxcbiAgICAgICAgJ09FU19zdGFuZGFyZF9kZXJpdmF0aXZlcycsXG4gICAgICAgICdPRVNfdmVydGV4X2FycmF5X29iamVjdCcsXG4gICAgICAgICdXRUJHTF9kZWJ1Z19yZW5kZXJlcl9pbmZvJyxcbiAgICAgICAgJ1dFQkdMX2RlYnVnX3NoYWRlcnMnLFxuICAgICAgICAnV0VCR0xfY29tcHJlc3NlZF90ZXh0dXJlX3MzdGMnLFxuICAgICAgICAnV0VCR0xfZGVwdGhfdGV4dHVyZScsXG4gICAgICAgICdPRVNfZWxlbWVudF9pbmRleF91aW50JyxcbiAgICAgICAgJ0VYVF90ZXh0dXJlX2ZpbHRlcl9hbmlzb3Ryb3BpYycsXG4gICAgICAgICdFWFRfZnJhZ19kZXB0aCcsXG4gICAgICAgICdXRUJHTF9kcmF3X2J1ZmZlcnMnLFxuICAgICAgICAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycsXG4gICAgICAgICdPRVNfdGV4dHVyZV9mbG9hdF9saW5lYXInLFxuICAgICAgICAnT0VTX3RleHR1cmVfaGFsZl9mbG9hdF9saW5lYXInLFxuICAgICAgICAnRVhUX2JsZW5kX21pbm1heCcsXG4gICAgICAgICdFWFRfc2hhZGVyX3RleHR1cmVfbG9kJyxcbiAgICAgICAgLy8gY29tbXVuaXR5XG4gICAgICAgICdXRUJHTF9jb21wcmVzc2VkX3RleHR1cmVfYXRjJyxcbiAgICAgICAgJ1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9wdnJ0YycsXG4gICAgICAgICdFWFRfY29sb3JfYnVmZmVyX2hhbGZfZmxvYXQnLFxuICAgICAgICAnV0VCR0xfY29sb3JfYnVmZmVyX2Zsb2F0JyxcbiAgICAgICAgJ0VYVF9zUkdCJyxcbiAgICAgICAgJ1dFQkdMX2NvbXByZXNzZWRfdGV4dHVyZV9ldGMxJ1xuICAgIF07XG4gICAgdmFyIF9ib3VuZENvbnRleHQgPSBudWxsO1xuICAgIHZhciBfY29udGV4dHMgPSB7fTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gcmZjNDEyMiB2ZXJzaW9uIDQgY29tcGxpYW50IFVVSUQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVVUlEIHN0cmluZy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRVVUlEKCkge1xuICAgICAgICB2YXIgcmVwbGFjZSA9IGZ1bmN0aW9uKCBjICkge1xuICAgICAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuICAgICAgICAgICAgdmFyIHYgPSAoIGMgPT09ICd4JyApID8gciA6ICggciAmIDB4MyB8IDB4OCApO1xuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoIDE2ICk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKCAvW3h5XS9nLCByZXBsYWNlICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgaWQgb2YgdGhlIEhUTUxDYW52YXNFbGVtZW50IGVsZW1lbnQuIElmIHRoZXJlIGlzIG5vIGlkLCBpdFxuICAgICAqIGdlbmVyYXRlcyBvbmUgYW5kIGFwcGVuZHMgaXQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR9IGNhbnZhcyAtIFRoZSBDYW52YXMgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHJldHVybnMge1N0cmluZ30gVGhlIENhbnZhcyBpZCBzdHJpbmcuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0SWQoIGNhbnZhcyApIHtcbiAgICAgICAgaWYgKCAhY2FudmFzLmlkICkge1xuICAgICAgICAgICAgY2FudmFzLmlkID0gZ2V0VVVJRCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYW52YXMuaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIENhbnZhcyBlbGVtZW50IG9iamVjdCBmcm9tIGVpdGhlciBhbiBleGlzdGluZyBvYmplY3QsIG9yIGlkZW50aWZpY2F0aW9uIHN0cmluZy5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudHxTdHJpbmd9IGFyZyAtIFRoZSBDYW52YXMgb2JqZWN0IG9yIENhbnZhcyBpZCBvciBzZWxlY3RvciBzdHJpbmcuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7SFRNTENhbnZhc0VsZW1lbnR9IFRoZSBDYW52YXMgZWxlbWVudCBvYmplY3QuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0Q2FudmFzKCBhcmcgKSB7XG4gICAgICAgIGlmICggYXJnIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQgKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJnO1xuICAgICAgICB9IGVsc2UgaWYgKCB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyApIHtcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggYXJnICkgfHxcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBhcmcgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBdHRlbXB0cyB0byByZXRyZWl2ZSBhIHdyYXBwZWQgV2ViR0xSZW5kZXJpbmdDb250ZXh0LlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBUaGUgQ2FudmFzIGVsZW1lbnQgb2JqZWN0IHRvIGNyZWF0ZSB0aGUgY29udGV4dCB1bmRlci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBjb250ZXh0IHdyYXBwZXIuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0Q29udGV4dFdyYXBwZXIoIGFyZyApIHtcbiAgICAgICAgaWYgKCBhcmcgPT09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgIGlmICggX2JvdW5kQ29udGV4dCApIHtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gbGFzdCBib3VuZCBjb250ZXh0XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9ib3VuZENvbnRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZ2V0Q2FudmFzKCBhcmcgKTtcbiAgICAgICAgICAgIGlmICggY2FudmFzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBfY29udGV4dHNbIGdldElkKCBjYW52YXMgKSBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIG5vIGJvdW5kIGNvbnRleHQgb3IgYXJndW1lbnRcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXR0ZW1wdHMgdG8gbG9hZCBhbGwga25vd24gZXh0ZW5zaW9ucyBmb3IgYSBwcm92aWRlZCBXZWJHTFJlbmRlcmluZ0NvbnRleHQuIFN0b3JlcyB0aGUgcmVzdWx0cyBpbiB0aGUgY29udGV4dCB3cmFwcGVyIGZvciBsYXRlciBxdWVyaWVzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFdyYXBwZXIgLSBUaGUgY29udGV4dCB3cmFwcGVyLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGxvYWRFeHRlbnNpb25zKCBjb250ZXh0V3JhcHBlciApIHtcbiAgICAgICAgdmFyIGdsID0gY29udGV4dFdyYXBwZXIuZ2w7XG4gICAgICAgIEVYVEVOU0lPTlMuZm9yRWFjaCggZnVuY3Rpb24oIGlkICkge1xuICAgICAgICAgICAgY29udGV4dFdyYXBwZXIuZXh0ZW5zaW9uc1sgaWQgXSA9IGdsLmdldEV4dGVuc2lvbiggaWQgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXR0ZW1wdHMgdG8gY3JlYXRlIGEgV2ViR0xSZW5kZXJpbmdDb250ZXh0IHdyYXBwZWQgaW5zaWRlIGFuIG9iamVjdCB3aGljaCB3aWxsIGFsc28gc3RvcmUgdGhlIGV4dGVuc2lvbiBxdWVyeSByZXN1bHRzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBUaGUgQ2FudmFzIGVsZW1lbnQgb2JqZWN0IHRvIGNyZWF0ZSB0aGUgY29udGV4dCB1bmRlci5cbiAgICAgKiBAcGFyYW0ge09iamVjdH19IG9wdGlvbnMgLSBQYXJhbWV0ZXJzIHRvIHRoZSB3ZWJnbCBjb250ZXh0LCBvbmx5IHVzZWQgZHVyaW5nIGluc3RhbnRpYXRpb24uIE9wdGlvbmFsLlxuICAgICAqXG4gICAgICogQHJldHVybnMge09iamVjdH0gVGhlIGNvbnRleHQgd3JhcHBlci5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjcmVhdGVDb250ZXh0V3JhcHBlciggY2FudmFzLCBvcHRpb25zICkge1xuICAgICAgICB2YXIgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCggJ3dlYmdsJywgb3B0aW9ucyApIHx8IGNhbnZhcy5nZXRDb250ZXh0KCAnZXhwZXJpbWVudGFsLXdlYmdsJywgb3B0aW9ucyApO1xuICAgICAgICAvLyB3cmFwIGNvbnRleHRcbiAgICAgICAgdmFyIGNvbnRleHRXcmFwcGVyID0ge1xuICAgICAgICAgICAgaWQ6IGdldElkKCBjYW52YXMgKSxcbiAgICAgICAgICAgIGdsOiBnbCxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IHt9XG4gICAgICAgIH07XG4gICAgICAgIC8vIGxvYWQgV2ViR0wgZXh0ZW5zaW9uc1xuICAgICAgICBsb2FkRXh0ZW5zaW9ucyggY29udGV4dFdyYXBwZXIgKTtcbiAgICAgICAgLy8gYWRkIGNvbnRleHQgd3JhcHBlciB0byBtYXBcbiAgICAgICAgX2NvbnRleHRzWyBnZXRJZCggY2FudmFzICkgXSA9IGNvbnRleHRXcmFwcGVyO1xuICAgICAgICAvLyBiaW5kIHRoZSBjb250ZXh0XG4gICAgICAgIF9ib3VuZENvbnRleHQgPSBjb250ZXh0V3JhcHBlcjtcbiAgICAgICAgcmV0dXJuIGNvbnRleHRXcmFwcGVyO1xuICAgIH1cblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXRyaWV2ZXMgYW4gZXhpc3RpbmcgV2ViR0wgY29udGV4dCBhc3NvY2lhdGVkIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50IGFuZCBiaW5kcyBpdC4gV2hpbGUgYm91bmQsIHRoZSBhY3RpdmUgY29udGV4dCB3aWxsIGJlIHVzZWQgaW1wbGljaXRseSBieSBhbnkgaW5zdGFudGlhdGVkIGBlc3BlcmAgY29uc3RydWN0cy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudHxTdHJpbmd9IGFyZyAtIFRoZSBDYW52YXMgb2JqZWN0IG9yIENhbnZhcyBpZGVudGlmaWNhdGlvbiBzdHJpbmcuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJHTENvbnRleHR9IFRoaXMgbmFtZXNwYWNlLCB1c2VkIGZvciBjaGFpbmluZy5cbiAgICAgICAgICovXG4gICAgICAgIGJpbmQ6IGZ1bmN0aW9uKCBhcmcgKSB7XG4gICAgICAgICAgICB2YXIgd3JhcHBlciA9IGdldENvbnRleHRXcmFwcGVyKCBhcmcgKTtcbiAgICAgICAgICAgIGlmICggd3JhcHBlciApIHtcbiAgICAgICAgICAgICAgICBfYm91bmRDb250ZXh0ID0gd3JhcHBlcjtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93ICdObyBjb250ZXh0IGV4aXN0cyBmb3IgcHJvdmlkZWQgYXJndW1lbnQgYCcgKyBhcmcgKyAnYCc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHJpZXZlcyBhbiBleGlzdGluZyBXZWJHTCBjb250ZXh0IGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnQuIElmIG5vIGNvbnRleHQgZXhpc3RzLCBvbmUgaXMgY3JlYXRlZC5cbiAgICAgICAgICogRHVyaW5nIGNyZWF0aW9uIGF0dGVtcHRzIHRvIGxvYWQgYWxsIGV4dGVuc2lvbnMgZm91bmQgYXQ6IGh0dHBzOi8vd3d3Lmtocm9ub3Mub3JnL3JlZ2lzdHJ5L3dlYmdsL2V4dGVuc2lvbnMvLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fFN0cmluZ30gYXJnIC0gVGhlIENhbnZhcyBvYmplY3Qgb3IgQ2FudmFzIGlkZW50aWZpY2F0aW9uIHN0cmluZy4gT3B0aW9uYWwuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fX0gb3B0aW9ucyAtIFBhcmFtZXRlcnMgdG8gdGhlIHdlYmdsIGNvbnRleHQsIG9ubHkgdXNlZCBkdXJpbmcgaW5zdGFudGlhdGlvbi4gT3B0aW9uYWwuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm5zIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IFRoZSBXZWJHTFJlbmRlcmluZ0NvbnRleHQgb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0OiBmdW5jdGlvbiggYXJnLCBvcHRpb25zICkge1xuICAgICAgICAgICAgdmFyIHdyYXBwZXIgPSBnZXRDb250ZXh0V3JhcHBlciggYXJnICk7XG4gICAgICAgICAgICBpZiAoIHdyYXBwZXIgKSB7XG4gICAgICAgICAgICAgICAvLyByZXR1cm4gdGhlIG5hdGl2ZSBXZWJHTFJlbmRlcmluZ0NvbnRleHRcbiAgICAgICAgICAgICAgIHJldHVybiB3cmFwcGVyLmdsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZ2V0IGNhbnZhcyBlbGVtZW50XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZ2V0Q2FudmFzKCBhcmcgKTtcbiAgICAgICAgICAgIC8vIHRyeSB0byBmaW5kIG9yIGNyZWF0ZSBjb250ZXh0XG4gICAgICAgICAgICBpZiAoICFjYW52YXMgKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ0NvbnRleHQgY291bGQgbm90IGJlIGFzc29jaWF0ZWQgd2l0aCBhcmd1bWVudCBvZiB0eXBlIGAnICsgKCB0eXBlb2YgYXJnICkgKyAnYCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjcmVhdGUgY29udGV4dFxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUNvbnRleHRXcmFwcGVyKCBjYW52YXMsIG9wdGlvbnMgKS5nbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBhbiBleGlzdGluZyBXZWJHTCBjb250ZXh0IG9iamVjdCBmb3IgdGhlIHByb3ZpZGVkIG9yIGN1cnJlbnRseSBib3VuZCBvYmplY3QuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR8U3RyaW5nfSBhcmcgLSBUaGUgQ2FudmFzIG9iamVjdCBvciBDYW52YXMgaWRlbnRpZmljYXRpb24gc3RyaW5nLiBPcHRpb25hbC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9fSBvcHRpb25zIC0gUGFyYW1ldGVycyB0byB0aGUgd2ViZ2wgY29udGV4dCwgb25seSB1c2VkIGR1cmluZyBpbnN0YW50aWF0aW9uLiBPcHRpb25hbC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gVGhlIFdlYkdMUmVuZGVyaW5nQ29udGV4dCBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uKCBhcmcgKSB7XG4gICAgICAgICAgICB2YXIgd3JhcHBlciA9IGdldENvbnRleHRXcmFwcGVyKCBhcmcgKTtcbiAgICAgICAgICAgIGlmICggd3JhcHBlciApIHtcbiAgICAgICAgICAgICAgICAvLyBkZWxldGUgdGhlIGNvbnRleHRcbiAgICAgICAgICAgICAgICBkZWxldGUgX2NvbnRleHRzWyB3cmFwcGVyLmlkIF07XG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlIGlmIGN1cnJlbnRseSBib3VuZFxuICAgICAgICAgICAgICAgIGlmICggd3JhcHBlciA9PT0gX2JvdW5kQ29udGV4dCApIHtcbiAgICAgICAgICAgICAgICAgICAgX2JvdW5kQ29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnQ29udGV4dCBjb3VsZCBub3QgYmUgZm91bmQgb3IgZGVsZXRlZCBmb3IgYXJndW1lbnQgb2YgdHlwZSBgJyArICggdHlwZW9mIGFyZyApICsgJ2AnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGFsbCBzdXBwb3J0ZWQgZXh0ZW5zaW9ucyBmb3IgdGhlIHByb3ZpZGVkIG9yIGN1cnJlbnRseSBib3VuZCBjb250ZXh0IG9iamVjdC4gSWYgbm8gY29udGV4dCBpcyBib3VuZCwgaXQgd2lsbCByZXR1cm4gYW4gZW1wdHkgYXJyYXkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR8U3RyaW5nfSBhcmcgLSBUaGUgQ2FudmFzIG9iamVjdCBvciBDYW52YXMgaWRlbnRpZmljYXRpb24gc3RyaW5nLiBPcHRpb25hbC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge0FycmF5fSBBbGwgc3VwcG9ydGVkIGV4dGVuc2lvbnMuXG4gICAgICAgICAqL1xuICAgICAgICBzdXBwb3J0ZWRFeHRlbnNpb25zOiBmdW5jdGlvbiggYXJnICkge1xuICAgICAgICAgICAgdmFyIHdyYXBwZXIgPSBnZXRDb250ZXh0V3JhcHBlciggYXJnICk7XG4gICAgICAgICAgICBpZiAoIHdyYXBwZXIgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbnMgPSB3cmFwcGVyLmV4dGVuc2lvbnM7XG4gICAgICAgICAgICAgICAgdmFyIHN1cHBvcnRlZCA9IFtdO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKCBleHRlbnNpb25zICkuZm9yRWFjaCggZnVuY3Rpb24oIGtleSApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBleHRlbnNpb25zWyBrZXkgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1cHBvcnRlZC5wdXNoKCBrZXkgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdXBwb3J0ZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyAnTm8gY29udGV4dCBpcyBjdXJyZW50bHkgYm91bmQgb3IgY291bGQgYmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBwcm92aWRlZCBhcmd1bWVudCc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgYWxsIHVuc3VwcG9ydGVkIGV4dGVuc2lvbnMgZm9yIHRoZSBwcm92aWRlZCBvciBjdXJyZW50bHkgYm91bmQgY29udGV4dCBvYmplY3QuIElmIG5vIGNvbnRleHQgaXMgYm91bmQsIGl0IHdpbGwgcmV0dXJuIGFuIGVtcHR5IGFycmF5LlxuICAgICAgICAgKiBhbiBlbXB0eSBhcnJheS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudHxTdHJpbmd9IGFyZyAtIFRoZSBDYW52YXMgb2JqZWN0IG9yIENhbnZhcyBpZGVudGlmaWNhdGlvbiBzdHJpbmcuIE9wdGlvbmFsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7QXJyYXl9IEFsbCB1bnN1cHBvcnRlZCBleHRlbnNpb25zLlxuICAgICAgICAgKi9cbiAgICAgICAgdW5zdXBwb3J0ZWRFeHRlbnNpb25zOiBmdW5jdGlvbiggYXJnICkge1xuICAgICAgICAgICAgdmFyIHdyYXBwZXIgPSBnZXRDb250ZXh0V3JhcHBlciggYXJnICk7XG4gICAgICAgICAgICBpZiAoIHdyYXBwZXIgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4dGVuc2lvbnMgPSB3cmFwcGVyLmV4dGVuc2lvbnM7XG4gICAgICAgICAgICAgICAgdmFyIHVuc3VwcG9ydGVkID0gW107XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoIGV4dGVuc2lvbnMgKS5mb3JFYWNoKCBmdW5jdGlvbigga2V5ICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoICFleHRlbnNpb25zWyBrZXkgXSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuc3VwcG9ydGVkLnB1c2goIGtleSApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuc3VwcG9ydGVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgJ05vIGNvbnRleHQgaXMgY3VycmVudGx5IGJvdW5kIG9yIGNvdWxkIGJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgcHJvdmlkZWQgYXJndW1lbnQnO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVja3MgaWYgYW4gZXh0ZW5zaW9uIGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBsb2FkZWQgZm9yIHRoZSBwcm92aWRlZCBvciBjdXJyZW50bHkgYm91bmQgY29udGV4dCBvYmplY3QuXG4gICAgICAgICAqICdmYWxzZScuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7SFRNTENhbnZhc0VsZW1lbnR8U3RyaW5nfSBhcmcgLSBUaGUgQ2FudmFzIG9iamVjdCBvciBDYW52YXMgaWRlbnRpZmljYXRpb24gc3RyaW5nLiBPcHRpb25hbC5cbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGV4dGVuc2lvbiAtIFRoZSBleHRlbnNpb24gbmFtZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59IFdoZXRoZXIgb3Igbm90IHRoZSBwcm92aWRlZCBleHRlbnNpb24gaGFzIGJlZW4gbG9hZGVkIHN1Y2Nlc3NmdWxseS5cbiAgICAgICAgICovXG4gICAgICAgIGNoZWNrRXh0ZW5zaW9uOiBmdW5jdGlvbiggYXJnLCBleHRlbnNpb24gKSB7XG4gICAgICAgICAgICBpZiAoICFleHRlbnNpb24gKSB7XG4gICAgICAgICAgICAgICAgLy8gc2hpZnQgcGFyYW1ldGVycyBpZiBubyBjYW52YXMgYXJnIGlzIHByb3ZpZGVkXG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uID0gYXJnO1xuICAgICAgICAgICAgICAgIGFyZyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3cmFwcGVyID0gZ2V0Q29udGV4dFdyYXBwZXIoIGFyZyApO1xuICAgICAgICAgICAgaWYgKCB3cmFwcGVyICkge1xuICAgICAgICAgICAgICAgIHZhciBleHRlbnNpb25zID0gd3JhcHBlci5leHRlbnNpb25zO1xuICAgICAgICAgICAgICAgIHJldHVybiBleHRlbnNpb25zWyBleHRlbnNpb24gXSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93ICdObyBjb250ZXh0IGlzIGN1cnJlbnRseSBib3VuZCBvciBjb3VsZCBiZSBhc3NvY2lhdGVkIHdpdGggdGhlIHByb3ZpZGVkIGFyZ3VtZW50JztcbiAgICAgICAgfVxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBTdGFjayA9IHJlcXVpcmUoJy4uL3V0aWwvU3RhY2snKTtcclxuICAgIHZhciBTdGFja01hcCA9IHJlcXVpcmUoJy4uL3V0aWwvU3RhY2tNYXAnKTtcclxuICAgIHZhciBfc3RhdGVzID0ge307XHJcblxyXG4gICAgZnVuY3Rpb24gV2ViR0xDb250ZXh0U3RhdGUoKSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIGN1cnJlbnRseSBib3VuZCB2ZXJ0ZXggYnVmZmVyLlxyXG4gICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5ib3VuZFZlcnRleEJ1ZmZlciA9IG51bGw7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSBjdXJyZW50bHkgZW5hYmxlZCB2ZXJ0ZXggYXR0cmlidXRlcy5cclxuICAgICAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZFZlcnRleEF0dHJpYnV0ZXMgPSB7XHJcbiAgICAgICAgICAgICcwJzogZmFsc2UsXHJcbiAgICAgICAgICAgICcxJzogZmFsc2UsXHJcbiAgICAgICAgICAgICcyJzogZmFsc2UsXHJcbiAgICAgICAgICAgICczJzogZmFsc2UsXHJcbiAgICAgICAgICAgICc0JzogZmFsc2UsXHJcbiAgICAgICAgICAgICc1JzogZmFsc2VcclxuICAgICAgICAgICAgLy8gLi4uIG90aGVycyB3aWxsIGJlIGFkZGVkIGFzIG5lZWRlZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSBjdXJyZW50bHkgYm91bmQgaW5kZXggYnVmZmVyLlxyXG4gICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5ib3VuZEluZGV4QnVmZmVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIHN0YWNrIG9mIHB1c2hlZCBzaGFkZXJzLlxyXG4gICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zaGFkZXJzID0gbmV3IFN0YWNrKCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSBzdGFjayBvZiBwdXNoZWQgdmlld3BvcnRzLlxyXG4gICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy52aWV3cG9ydHMgPSBuZXcgU3RhY2soKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIHN0YWNrIG9mIHB1c2hlZCByZW5kZXIgdGFyZ2V0cy5cclxuICAgICAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucmVuZGVyVGFyZ2V0cyA9IG5ldyBTdGFjaygpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGUgbWFwIG9mIHN0YWNrcyBwdXNoZWQgdGV4dHVyZTJEcywga2V5ZWQgYnkgdGV4dHVyZSB1bml0IGluZGV4LlxyXG4gICAgICAgICAqIEBwcml2YXRlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50ZXh0dXJlMkRzID0gbmV3IFN0YWNrTWFwKCk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSBtYXAgb2YgcHVzaGVkIHRleHR1cmUyRHMsLCBrZXllZCBieSB0ZXh0dXJlIHVuaXQgaW5kZXguXHJcbiAgICAgICAgICogQHByaXZhdGVcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRleHR1cmVDdWJlTWFwcyA9IG5ldyBTdGFja01hcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCBnbCApIHtcclxuICAgICAgICAgICAgdmFyIGlkID0gZ2wuY2FudmFzLmlkO1xyXG4gICAgICAgICAgICBpZiAoICFfc3RhdGVzWyBpZCBdICkge1xyXG4gICAgICAgICAgICAgICAgX3N0YXRlc1sgaWQgXSA9IG5ldyBXZWJHTENvbnRleHRTdGF0ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBfc3RhdGVzWyBpZCBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgSW5kZXhCdWZmZXI6IHJlcXVpcmUoJy4vY29yZS9JbmRleEJ1ZmZlcicpLFxyXG4gICAgICAgIFJlbmRlcmFibGU6IHJlcXVpcmUoJy4vY29yZS9SZW5kZXJhYmxlJyksXHJcbiAgICAgICAgUmVuZGVyVGFyZ2V0OiByZXF1aXJlKCcuL2NvcmUvUmVuZGVyVGFyZ2V0JyksXHJcbiAgICAgICAgU2hhZGVyOiByZXF1aXJlKCcuL2NvcmUvU2hhZGVyJyksXHJcbiAgICAgICAgVGV4dHVyZTJEOiByZXF1aXJlKCcuL2NvcmUvVGV4dHVyZTJEJyksXHJcbiAgICAgICAgQ29sb3JUZXh0dXJlMkQ6IHJlcXVpcmUoJy4vY29yZS9Db2xvclRleHR1cmUyRCcpLFxyXG4gICAgICAgIERlcHRoVGV4dHVyZTJEOiByZXF1aXJlKCcuL2NvcmUvRGVwdGhUZXh0dXJlMkQnKSxcclxuICAgICAgICBUZXh0dXJlQ3ViZU1hcDogcmVxdWlyZSgnLi9jb3JlL1RleHR1cmVDdWJlTWFwJyksXHJcbiAgICAgICAgVmVydGV4QnVmZmVyOiByZXF1aXJlKCcuL2NvcmUvVmVydGV4QnVmZmVyJyksXHJcbiAgICAgICAgVmVydGV4UGFja2FnZTogcmVxdWlyZSgnLi9jb3JlL1ZlcnRleFBhY2thZ2UnKSxcclxuICAgICAgICBWaWV3cG9ydDogcmVxdWlyZSgnLi9jb3JlL1ZpZXdwb3J0JyksXHJcbiAgICAgICAgV2ViR0xDb250ZXh0OiByZXF1aXJlKCcuL2NvcmUvV2ViR0xDb250ZXh0JylcclxuICAgIH07XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRJdGVyYXRvciggYXJnICkge1xyXG4gICAgICAgIHZhciBpID0gLTE7XHJcbiAgICAgICAgdmFyIGxlbjtcclxuICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGFyZyApICkge1xyXG4gICAgICAgICAgICBsZW4gPSBhcmcubGVuZ3RoO1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaSA8IGxlbiA/IGkgOiBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKCBhcmcgKTtcclxuICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICAgICAgcmV0dXJuIGkgPCBsZW4gPyBrZXlzW2ldIDogbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uY2UoIGZuICkge1xyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKCBmbiA9PT0gbnVsbCApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmbi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XHJcbiAgICAgICAgICAgIGZuID0gbnVsbDtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGVhY2goIG9iamVjdCwgaXRlcmF0b3IsIGNhbGxiYWNrICkge1xyXG4gICAgICAgIGNhbGxiYWNrID0gb25jZSggY2FsbGJhY2sgKTtcclxuICAgICAgICB2YXIga2V5O1xyXG4gICAgICAgIHZhciBjb21wbGV0ZWQgPSAwO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBkb25lKCBlcnIgKSB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlZC0tO1xyXG4gICAgICAgICAgICBpZiAoIGVyciApIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCBlcnIgKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICgga2V5ID09PSBudWxsICYmIGNvbXBsZXRlZCA8PSAwICkge1xyXG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYga2V5IGlzIG51bGwgaW4gY2FzZSBpdGVyYXRvciBpc24ndCBleGhhdXN0ZWQgYW5kIGRvbmVcclxuICAgICAgICAgICAgICAgIC8vIHdhcyByZXNvbHZlZCBzeW5jaHJvbm91c2x5LlxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soIG51bGwgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGl0ZXIgPSBnZXRJdGVyYXRvcihvYmplY3QpO1xyXG4gICAgICAgIHdoaWxlICggKCBrZXkgPSBpdGVyKCkgKSAhPT0gbnVsbCApIHtcclxuICAgICAgICAgICAgY29tcGxldGVkICs9IDE7XHJcbiAgICAgICAgICAgIGl0ZXJhdG9yKCBvYmplY3RbIGtleSBdLCBrZXksIGRvbmUgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCBjb21wbGV0ZWQgPT09IDAgKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCBudWxsICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBFeGVjdXRlIGEgc2V0IG9mIGZ1bmN0aW9ucyBhc3luY2hyb25vdXNseSwgb25jZSBhbGwgaGF2ZSBiZWVuXHJcbiAgICAgICAgICogY29tcGxldGVkLCBleGVjdXRlIHRoZSBwcm92aWRlZCBjYWxsYmFjayBmdW5jdGlvbi4gSm9icyBtYXkgYmUgcGFzc2VkXHJcbiAgICAgICAgICogYXMgYW4gYXJyYXkgb3Igb2JqZWN0LiBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gd2lsbCBiZSBwYXNzZWQgdGhlXHJcbiAgICAgICAgICogcmVzdWx0cyBpbiB0aGUgc2FtZSBmb3JtYXQgYXMgdGhlIHRhc2tzLiBBbGwgdGFza3MgbXVzdCBoYXZlIGFjY2VwdFxyXG4gICAgICAgICAqIGFuZCBleGVjdXRlIGEgY2FsbGJhY2sgZnVuY3Rpb24gdXBvbiBjb21wbGV0aW9uLlxyXG4gICAgICAgICAqXHJcbiAgICAgICAgICogQHBhcmFtIHtBcnJheXxPYmplY3R9IHRhc2tzIC0gVGhlIHNldCBvZiBmdW5jdGlvbnMgdG8gZXhlY3V0ZS5cclxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIFRoZSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBleGVjdXRlZCB1cG9uIGNvbXBsZXRpb24uXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgcGFyYWxsZWw6IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBBcnJheS5pc0FycmF5KCB0YXNrcyApID8gW10gOiB7fTtcclxuICAgICAgICAgICAgZWFjaCggdGFza3MsIGZ1bmN0aW9uKCB0YXNrLCBrZXksIGRvbmUgKSB7XHJcbiAgICAgICAgICAgICAgICB0YXNrKCBmdW5jdGlvbiggZXJyLCByZXMgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1sga2V5IF0gPSByZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9uZSggZXJyICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCBlcnIsIHJlc3VsdHMgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VuZHMgYW4gR0VUIHJlcXVlc3QgY3JlYXRlIGFuIEltYWdlIG9iamVjdC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBUaGUgWEhSIG9wdGlvbnMuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLnVybCAtIFRoZSBVUkwgZm9yIHRoZSByZXNvdXJjZS5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5zdWNjZXNzIC0gVGhlIHN1Y2Nlc3MgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMuZXJyb3IgLSBUaGUgZXJyb3IgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAoIG9wdGlvbnMgKSB7XG4gICAgICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggb3B0aW9ucy5zdWNjZXNzICkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MoIGltYWdlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltYWdlLm9uZXJyb3IgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBvcHRpb25zLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXJyID0gJ1VuYWJsZSB0byBsb2FkIGltYWdlIGZyb20gVVJMOiBgJyArIGV2ZW50LnBhdGhbMF0uY3VycmVudFNyYyArICdgJztcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lcnJvciggZXJyICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltYWdlLnNyYyA9IG9wdGlvbnMudXJsO1xuICAgICAgICB9XG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5zdGFudGlhdGVzIGEgc3RhY2sgb2JqZWN0LlxyXG4gICAgICogQGNsYXNzIFN0YWNrXHJcbiAgICAgKiBAY2xhc3NkZXNjIEEgc3RhY2sgaW50ZXJmYWNlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBTdGFjaygpIHtcclxuICAgICAgICB0aGlzLmRhdGEgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFB1c2ggYSB2YWx1ZSBvbnRvIHRoZSBzdGFjay5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIC0gVGhlIHZhbHVlLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIFRoZSBzdGFjayBvYmplY3QgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBTdGFjay5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCB2YWx1ZSApIHtcclxuICAgICAgICB0aGlzLmRhdGEucHVzaCggdmFsdWUgKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQb3AgYSB2YWx1ZSBvZmYgdGhlIHN0YWNrLiBSZXR1cm5zIGB1bmRlZmluZWRgIGlmIHRoZXJlIGlzIG5vIHZhbHVlIG9uXHJcbiAgICAgKiB0aGUgc3RhY2suXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSAtIFRoZSB2YWx1ZS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgcG9wcGVkIG9mZiB0aGUgc3RhY2suXHJcbiAgICAgKi9cclxuICAgIFN0YWNrLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kYXRhLnBvcCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGN1cnJlbnQgdG9wIG9mIHRoZSBzdGFjaywgd2l0aG91dCByZW1vdmluZyBpdC4gUmV0dXJuc1xyXG4gICAgICogYHVuZGVmaW5lZGAgaWYgdGhlcmUgaXMgbm8gdmFsdWUgb24gdGhlIHN0YWNrLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIFRoZSB2YWx1ZSBhdCB0aGUgdG9wIG9mIHRoZSBzdGFjay5cclxuICAgICAqL1xyXG4gICAgU3RhY2sucHJvdG90eXBlLnRvcCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZGF0YS5sZW5ndGggLSAxO1xyXG4gICAgICAgIGlmICggaW5kZXggPCAwICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmRhdGFbIGluZGV4IF07XHJcbiAgICB9O1xyXG5cclxuICAgIG1vZHVsZS5leHBvcnRzID0gU3RhY2s7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgU3RhY2sgPSByZXF1aXJlKCcuL1N0YWNrJyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbnN0YW50aWF0ZXMgYSBtYXAgb2Ygc3RhY2sgb2JqZWN0cy5cclxuICAgICAqIEBjbGFzcyBTdGFja01hcFxyXG4gICAgICogQGNsYXNzZGVzYyBBIGhhc2htYXAgb2Ygc3RhY2tzLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBTdGFja01hcCgpIHtcclxuICAgICAgICB0aGlzLnN0YWNrcyA9IHt9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUHVzaCBhIHZhbHVlIG9udG8gdGhlIHN0YWNrIHVuZGVyIGEgZ2l2ZW4ga2V5LlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBUaGUga2V5LlxyXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBwdXNoIG9udG8gdGhlIHN0YWNrLlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIFRoZSBzdGFjayBvYmplY3QgZm9yIGNoYWluaW5nLlxyXG4gICAgICovXHJcbiAgICBTdGFja01hcC5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCBrZXksIHZhbHVlICkge1xyXG4gICAgICAgIGlmICggIXRoaXMuc3RhY2tzWyBrZXkgXSApIHtcclxuICAgICAgICAgICAgdGhpcy5zdGFja3NbIGtleSBdID0gbmV3IFN0YWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RhY2tzWyBrZXkgXS5wdXNoKCB2YWx1ZSApO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBvcCBhIHZhbHVlIG9mZiB0aGUgc3RhY2suIFJldHVybnMgYHVuZGVmaW5lZGAgaWYgdGhlcmUgaXMgbm8gdmFsdWUgb25cclxuICAgICAqIHRoZSBzdGFjaywgb3IgdGhlcmUgaXMgbm8gc3RhY2sgZm9yIHRoZSBrZXkuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSAtIFRoZSBrZXkuXHJcbiAgICAgKiBAcGFyYW0geyp9IHZhbHVlIC0gVGhlIHZhbHVlIHRvIHB1c2ggb250byB0aGUgc3RhY2suXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMgVGhlIHZhbHVlIHBvcHBlZCBvZmYgdGhlIHN0YWNrLlxyXG4gICAgICovXHJcbiAgICBTdGFja01hcC5wcm90b3R5cGUucG9wID0gZnVuY3Rpb24oIGtleSApIHtcclxuICAgICAgICBpZiAoICF0aGlzLnN0YWNrc1sga2V5IF0gKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhY2tzWyBrZXkgXS5wb3AoKTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IHRvcCBvZiB0aGUgc3RhY2ssIHdpdGhvdXQgcmVtb3ZpbmcgaXQuIFJldHVybnNcclxuICAgICAqIGB1bmRlZmluZWRgIGlmIHRoZXJlIGlzIG5vIHZhbHVlIG9uIHRoZSBzdGFjayBvciBubyBzdGFjayBmb3IgdGhlIGtleS5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0gVGhlIGtleS5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyBUaGUgdmFsdWUgYXQgdGhlIHRvcCBvZiB0aGUgc3RhY2suXHJcbiAgICAgKi9cclxuICAgIFN0YWNrTWFwLnByb3RvdHlwZS50b3AgPSBmdW5jdGlvbigga2V5ICkge1xyXG4gICAgICAgIGlmICggIXRoaXMuc3RhY2tzWyBrZXkgXSApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5zdGFja3NbIGtleSBdLnRvcCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFN0YWNrTWFwO1xyXG5cclxufSgpKTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFV0aWwgPSB7fTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYW4gQXJyYXksIEFycmF5QnVmZmVyLCBvciBBcnJheUJ1ZmZlclZpZXcuXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7Kn0gYXJnIC0gVGhlIGFyZ3VtZW50IHRvIHRlc3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge2Jvb2x9IC0gV2hldGhlciBvciBub3QgaXQgaXMgYSBjYW52YXMgdHlwZS5cclxuICAgICAqL1xyXG4gICAgVXRpbC5pc0FycmF5VHlwZSA9IGZ1bmN0aW9uKCBhcmcgKSB7XHJcbiAgICAgICAgcmV0dXJuIGFyZyBpbnN0YW5jZW9mIEFycmF5IHx8XHJcbiAgICAgICAgICAgIGFyZyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8XHJcbiAgICAgICAgICAgIEFycmF5QnVmZmVyLmlzVmlldyggYXJnICk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBvbmUgb2YgdGhlIFdlYkdMIGB0ZXhJbWFnZTJEYCBvdmVycmlkZGVuXHJcbiAgICAgKiBjYW52YXMgdHlwZXMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHsqfSBhcmcgLSBUaGUgYXJndW1lbnQgdG8gdGVzdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbH0gLSBXaGV0aGVyIG9yIG5vdCBpdCBpcyBhIGNhbnZhcyB0eXBlLlxyXG4gICAgICovXHJcbiAgICBVdGlsLmlzQ2FudmFzVHlwZSA9IGZ1bmN0aW9uKCBhcmcgKSB7XHJcbiAgICAgICAgcmV0dXJuIGFyZyBpbnN0YW5jZW9mIEltYWdlRGF0YSB8fFxyXG4gICAgICAgICAgICBhcmcgaW5zdGFuY2VvZiBIVE1MSW1hZ2VFbGVtZW50IHx8XHJcbiAgICAgICAgICAgIGFyZyBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50IHx8XHJcbiAgICAgICAgICAgIGFyZyBpbnN0YW5jZW9mIEhUTUxWaWRlb0VsZW1lbnQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0cnVlIGlmIHRoZSB0ZXh0dXJlIE1VU1QgYmUgYSBwb3dlci1vZi10d28uIE90aGVyd2lzZSByZXR1cm4gZmFsc2UuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNwZWMgLSBUaGUgdGV4dHVyZSBzcGVjaWZpY2F0aW9uIG9iamVjdC5cclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbH0gLSBXaGV0aGVyIG9yIG5vdCB0aGUgdGV4dHVyZSBtdXN0IGJlIGEgcG93ZXIgb2YgdHdvLlxyXG4gICAgICovXHJcbiAgICBVdGlsLm11c3RCZVBvd2VyT2ZUd28gPSBmdW5jdGlvbiggc3BlYyApIHtcclxuICAgICAgICAvLyBBY2NvcmRpbmcgdG86XHJcbiAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYkdMX0FQSS9UdXRvcmlhbC9Vc2luZ190ZXh0dXJlc19pbl9XZWJHTCNOb25fcG93ZXItb2YtdHdvX3RleHR1cmVzXHJcbiAgICAgICAgLy8gTlBPVCB0ZXh0dXJlcyBjYW5ub3QgYmUgdXNlZCB3aXRoIG1pcG1hcHBpbmcgYW5kIHRoZXkgbXVzdCBub3QgXCJyZXBlYXRcIlxyXG4gICAgICAgIHJldHVybiBzcGVjLm1pcE1hcCB8fFxyXG4gICAgICAgICAgICBzcGVjLndyYXBTID09PSAnUkVQRUFUJyB8fFxyXG4gICAgICAgICAgICBzcGVjLndyYXBTID09PSAnTUlSUk9SRURfUkVQRUFUJyB8fFxyXG4gICAgICAgICAgICBzcGVjLndyYXBUID09PSAnUkVQRUFUJyB8fFxyXG4gICAgICAgICAgICBzcGVjLndyYXBUID09PSAnTUlSUk9SRURfUkVQRUFUJztcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHZhbHVlIGlzIGEgbnVtYmVyIGFuZCBpcyBhbiBpbnRlZ2VyLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gbnVtIC0gVGhlIG51bWJlciB0byB0ZXN0LlxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgb3Igbm90IHRoZSB2YWx1ZSBpcyBhIG51bWJlci5cclxuICAgICAqL1xyXG4gICAgVXRpbC5pc0ludGVnZXIgPSBmdW5jdGlvbiggbnVtICkge1xyXG4gICAgICAgIHJldHVybiB0eXBlb2YgbnVtID09PSAnbnVtYmVyJyAmJiAoIG51bSAlIDEgKSA9PT0gMDtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHByb3ZpZGVkIGludGVnZXIgaXMgYSBwb3dlciBvZiB0d28uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtpbnRlZ2VyfSBudW0gLSBUaGUgbnVtYmVyIHRvIHRlc3QuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IC0gV2hldGhlciBvciBub3QgdGhlIG51bWJlciBpcyBhIHBvd2VyIG9mIHR3by5cclxuICAgICAqL1xyXG4gICAgVXRpbC5pc1Bvd2VyT2ZUd28gPSBmdW5jdGlvbiggbnVtICkge1xyXG4gICAgICAgIHJldHVybiAoIG51bSAhPT0gMCApID8gKCBudW0gJiAoIG51bSAtIDEgKSApID09PSAwIDogZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgbmV4dCBoaWdoZXN0IHBvd2VyIG9mIHR3byBmb3IgYSBudW1iZXIuXHJcbiAgICAgKlxyXG4gICAgICogRXguXHJcbiAgICAgKlxyXG4gICAgICogICAgIDIwMCAtPiAyNTZcclxuICAgICAqICAgICAyNTYgLT4gMjU2XHJcbiAgICAgKiAgICAgMjU3IC0+IDUxMlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7aW50ZWdlcn0gbnVtIC0gVGhlIG51bWJlciB0byBtb2RpZnkuXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge2ludGVnZXJ9IC0gTmV4dCBoaWdoZXN0IHBvd2VyIG9mIHR3by5cclxuICAgICAqL1xyXG4gICAgVXRpbC5uZXh0SGlnaGVzdFBvd2VyT2ZUd28gPSBmdW5jdGlvbiggbnVtICkge1xyXG4gICAgICAgIHZhciBpO1xyXG4gICAgICAgIGlmICggbnVtICE9PSAwICkge1xyXG4gICAgICAgICAgICBudW0gPSBudW0tMTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICggaT0xOyBpPDMyOyBpPDw9MSApIHtcclxuICAgICAgICAgICAgbnVtID0gbnVtIHwgbnVtID4+IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudW0gKyAxO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIHRoZSB0ZXh0dXJlIG11c3QgYmUgYSBQT1QsIHJlc2l6ZXMgYW5kIHJldHVybnMgdGhlIGltYWdlLlxyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3BlYyAtIFRoZSB0ZXh0dXJlIHNwZWNpZmljYXRpb24gb2JqZWN0LlxyXG4gICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBpbWcgLSBUaGUgaW1hZ2Ugb2JqZWN0LlxyXG4gICAgICovXHJcbiAgICBVdGlsLnJlc2l6ZUNhbnZhcyA9IGZ1bmN0aW9uKCBzcGVjLCBpbWcgKSB7XHJcbiAgICAgICAgaWYgKCAhVXRpbC5tdXN0QmVQb3dlck9mVHdvKCBzcGVjICkgfHxcclxuICAgICAgICAgICAgKCBVdGlsLmlzUG93ZXJPZlR3byggaW1nLndpZHRoICkgJiYgVXRpbC5pc1Bvd2VyT2ZUd28oIGltZy5oZWlnaHQgKSApICkge1xyXG4gICAgICAgICAgICByZXR1cm4gaW1nO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBjcmVhdGUgYW4gZW1wdHkgY2FudmFzIGVsZW1lbnRcclxuICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcclxuICAgICAgICBjYW52YXMud2lkdGggPSBVdGlsLm5leHRIaWdoZXN0UG93ZXJPZlR3byggaW1nLndpZHRoICk7XHJcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IFV0aWwubmV4dEhpZ2hlc3RQb3dlck9mVHdvKCBpbWcuaGVpZ2h0ICk7XHJcbiAgICAgICAgLy8gY29weSB0aGUgaW1hZ2UgY29udGVudHMgdG8gdGhlIGNhbnZhc1xyXG4gICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCggJzJkJyApO1xyXG4gICAgICAgIGN0eC5kcmF3SW1hZ2UoIGltZywgMCwgMCwgaW1nLndpZHRoLCBpbWcuaGVpZ2h0LCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQgKTtcclxuICAgICAgICByZXR1cm4gY2FudmFzO1xyXG4gICAgfTtcclxuXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFV0aWw7XHJcblxyXG59KCkpO1xyXG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VuZHMgYW4gWE1MSHR0cFJlcXVlc3QgR0VUIHJlcXVlc3QgdG8gdGhlIHN1cHBsaWVkIHVybC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBUaGUgWEhSIG9wdGlvbnMuXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLnVybCAtIFRoZSBVUkwgZm9yIHRoZSByZXNvdXJjZS5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gb3B0aW9ucy5zdWNjZXNzIC0gVGhlIHN1Y2Nlc3MgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMuZXJyb3IgLSBUaGUgZXJyb3IgY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IG9wdGlvbnMucmVzcG9uc2VUeXBlIC0gVGhlIHJlc3BvbnNlVHlwZSBvZiB0aGUgWEhSLlxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKCBvcHRpb25zICkge1xuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHJlcXVlc3Qub3BlbiggJ0dFVCcsIG9wdGlvbnMudXJsLCB0cnVlICk7XG4gICAgICAgICAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IG9wdGlvbnMucmVzcG9uc2VUeXBlO1xuICAgICAgICAgICAgcmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIHJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gNCApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCByZXF1ZXN0LnN0YXR1cyA9PT0gMjAwICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBvcHRpb25zLnN1Y2Nlc3MgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzKCByZXF1ZXN0LnJlc3BvbnNlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIG9wdGlvbnMuZXJyb3IgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lcnJvciggJ0dFVCAnICsgcmVxdWVzdC5yZXNwb25zZVVSTCArICcgJyArIHJlcXVlc3Quc3RhdHVzICsgJyAoJyArIHJlcXVlc3Quc3RhdHVzVGV4dCArICcpJyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlcXVlc3Quc2VuZCgpO1xuICAgICAgICB9XG4gICAgfTtcblxufSgpKTtcbiIsInZhciBqc29uID0gdHlwZW9mIEpTT04gIT09ICd1bmRlZmluZWQnID8gSlNPTiA6IHJlcXVpcmUoJ2pzb25pZnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqLCBvcHRzKSB7XG4gICAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSBvcHRzID0geyBjbXA6IG9wdHMgfTtcbiAgICB2YXIgc3BhY2UgPSBvcHRzLnNwYWNlIHx8ICcnO1xuICAgIGlmICh0eXBlb2Ygc3BhY2UgPT09ICdudW1iZXInKSBzcGFjZSA9IEFycmF5KHNwYWNlKzEpLmpvaW4oJyAnKTtcbiAgICB2YXIgY3ljbGVzID0gKHR5cGVvZiBvcHRzLmN5Y2xlcyA9PT0gJ2Jvb2xlYW4nKSA/IG9wdHMuY3ljbGVzIDogZmFsc2U7XG4gICAgdmFyIHJlcGxhY2VyID0gb3B0cy5yZXBsYWNlciB8fCBmdW5jdGlvbihrZXksIHZhbHVlKSB7IHJldHVybiB2YWx1ZTsgfTtcblxuICAgIHZhciBjbXAgPSBvcHRzLmNtcCAmJiAoZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICB2YXIgYW9iaiA9IHsga2V5OiBhLCB2YWx1ZTogbm9kZVthXSB9O1xuICAgICAgICAgICAgICAgIHZhciBib2JqID0geyBrZXk6IGIsIHZhbHVlOiBub2RlW2JdIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGYoYW9iaiwgYm9iaik7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH0pKG9wdHMuY21wKTtcblxuICAgIHZhciBzZWVuID0gW107XG4gICAgcmV0dXJuIChmdW5jdGlvbiBzdHJpbmdpZnkgKHBhcmVudCwga2V5LCBub2RlLCBsZXZlbCkge1xuICAgICAgICB2YXIgaW5kZW50ID0gc3BhY2UgPyAoJ1xcbicgKyBuZXcgQXJyYXkobGV2ZWwgKyAxKS5qb2luKHNwYWNlKSkgOiAnJztcbiAgICAgICAgdmFyIGNvbG9uU2VwYXJhdG9yID0gc3BhY2UgPyAnOiAnIDogJzonO1xuXG4gICAgICAgIGlmIChub2RlICYmIG5vZGUudG9KU09OICYmIHR5cGVvZiBub2RlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgbm9kZSA9IG5vZGUudG9KU09OKCk7XG4gICAgICAgIH1cblxuICAgICAgICBub2RlID0gcmVwbGFjZXIuY2FsbChwYXJlbnQsIGtleSwgbm9kZSk7XG5cbiAgICAgICAgaWYgKG5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2Ygbm9kZSAhPT0gJ29iamVjdCcgfHwgbm9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGpzb24uc3RyaW5naWZ5KG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0FycmF5KG5vZGUpKSB7XG4gICAgICAgICAgICB2YXIgb3V0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IHN0cmluZ2lmeShub2RlLCBpLCBub2RlW2ldLCBsZXZlbCsxKSB8fCBqc29uLnN0cmluZ2lmeShudWxsKTtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChpbmRlbnQgKyBzcGFjZSArIGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICdbJyArIG91dC5qb2luKCcsJykgKyBpbmRlbnQgKyAnXSc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoc2Vlbi5pbmRleE9mKG5vZGUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmIChjeWNsZXMpIHJldHVybiBqc29uLnN0cmluZ2lmeSgnX19jeWNsZV9fJyk7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29udmVydGluZyBjaXJjdWxhciBzdHJ1Y3R1cmUgdG8gSlNPTicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBzZWVuLnB1c2gobm9kZSk7XG5cbiAgICAgICAgICAgIHZhciBrZXlzID0gb2JqZWN0S2V5cyhub2RlKS5zb3J0KGNtcCAmJiBjbXAobm9kZSkpO1xuICAgICAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IGtleXNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gc3RyaW5naWZ5KG5vZGUsIGtleSwgbm9kZVtrZXldLCBsZXZlbCsxKTtcblxuICAgICAgICAgICAgICAgIGlmKCF2YWx1ZSkgY29udGludWU7XG5cbiAgICAgICAgICAgICAgICB2YXIga2V5VmFsdWUgPSBqc29uLnN0cmluZ2lmeShrZXkpXG4gICAgICAgICAgICAgICAgICAgICsgY29sb25TZXBhcmF0b3JcbiAgICAgICAgICAgICAgICAgICAgKyB2YWx1ZTtcbiAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2goaW5kZW50ICsgc3BhY2UgKyBrZXlWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWVuLnNwbGljZShzZWVuLmluZGV4T2Yobm9kZSksIDEpO1xuICAgICAgICAgICAgcmV0dXJuICd7JyArIG91dC5qb2luKCcsJykgKyBpbmRlbnQgKyAnfSc7XG4gICAgICAgIH1cbiAgICB9KSh7ICcnOiBvYmogfSwgJycsIG9iaiwgMCk7XG59O1xuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4ge30udG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5IHx8IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWUgfTtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKGhhcy5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xufTtcbiIsImV4cG9ydHMucGFyc2UgPSByZXF1aXJlKCcuL2xpYi9wYXJzZScpO1xuZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2xpYi9zdHJpbmdpZnknKTtcbiIsInZhciBhdCwgLy8gVGhlIGluZGV4IG9mIHRoZSBjdXJyZW50IGNoYXJhY3RlclxuICAgIGNoLCAvLyBUaGUgY3VycmVudCBjaGFyYWN0ZXJcbiAgICBlc2NhcGVlID0ge1xuICAgICAgICAnXCInOiAgJ1wiJyxcbiAgICAgICAgJ1xcXFwnOiAnXFxcXCcsXG4gICAgICAgICcvJzogICcvJyxcbiAgICAgICAgYjogICAgJ1xcYicsXG4gICAgICAgIGY6ICAgICdcXGYnLFxuICAgICAgICBuOiAgICAnXFxuJyxcbiAgICAgICAgcjogICAgJ1xccicsXG4gICAgICAgIHQ6ICAgICdcXHQnXG4gICAgfSxcbiAgICB0ZXh0LFxuXG4gICAgZXJyb3IgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICAvLyBDYWxsIGVycm9yIHdoZW4gc29tZXRoaW5nIGlzIHdyb25nLlxuICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICBuYW1lOiAgICAnU3ludGF4RXJyb3InLFxuICAgICAgICAgICAgbWVzc2FnZTogbSxcbiAgICAgICAgICAgIGF0OiAgICAgIGF0LFxuICAgICAgICAgICAgdGV4dDogICAgdGV4dFxuICAgICAgICB9O1xuICAgIH0sXG4gICAgXG4gICAgbmV4dCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIC8vIElmIGEgYyBwYXJhbWV0ZXIgaXMgcHJvdmlkZWQsIHZlcmlmeSB0aGF0IGl0IG1hdGNoZXMgdGhlIGN1cnJlbnQgY2hhcmFjdGVyLlxuICAgICAgICBpZiAoYyAmJiBjICE9PSBjaCkge1xuICAgICAgICAgICAgZXJyb3IoXCJFeHBlY3RlZCAnXCIgKyBjICsgXCInIGluc3RlYWQgb2YgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEdldCB0aGUgbmV4dCBjaGFyYWN0ZXIuIFdoZW4gdGhlcmUgYXJlIG5vIG1vcmUgY2hhcmFjdGVycyxcbiAgICAgICAgLy8gcmV0dXJuIHRoZSBlbXB0eSBzdHJpbmcuXG4gICAgICAgIFxuICAgICAgICBjaCA9IHRleHQuY2hhckF0KGF0KTtcbiAgICAgICAgYXQgKz0gMTtcbiAgICAgICAgcmV0dXJuIGNoO1xuICAgIH0sXG4gICAgXG4gICAgbnVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBQYXJzZSBhIG51bWJlciB2YWx1ZS5cbiAgICAgICAgdmFyIG51bWJlcixcbiAgICAgICAgICAgIHN0cmluZyA9ICcnO1xuICAgICAgICBcbiAgICAgICAgaWYgKGNoID09PSAnLScpIHtcbiAgICAgICAgICAgIHN0cmluZyA9ICctJztcbiAgICAgICAgICAgIG5leHQoJy0nKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoY2ggPj0gJzAnICYmIGNoIDw9ICc5Jykge1xuICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaCA9PT0gJy4nKSB7XG4gICAgICAgICAgICBzdHJpbmcgKz0gJy4nO1xuICAgICAgICAgICAgd2hpbGUgKG5leHQoKSAmJiBjaCA+PSAnMCcgJiYgY2ggPD0gJzknKSB7XG4gICAgICAgICAgICAgICAgc3RyaW5nICs9IGNoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChjaCA9PT0gJ2UnIHx8IGNoID09PSAnRScpIHtcbiAgICAgICAgICAgIHN0cmluZyArPSBjaDtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJy0nIHx8IGNoID09PSAnKycpIHtcbiAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd2hpbGUgKGNoID49ICcwJyAmJiBjaCA8PSAnOScpIHtcbiAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG51bWJlciA9ICtzdHJpbmc7XG4gICAgICAgIGlmICghaXNGaW5pdGUobnVtYmVyKSkge1xuICAgICAgICAgICAgZXJyb3IoXCJCYWQgbnVtYmVyXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgXG4gICAgc3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBQYXJzZSBhIHN0cmluZyB2YWx1ZS5cbiAgICAgICAgdmFyIGhleCxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBzdHJpbmcgPSAnJyxcbiAgICAgICAgICAgIHVmZmZmO1xuICAgICAgICBcbiAgICAgICAgLy8gV2hlbiBwYXJzaW5nIGZvciBzdHJpbmcgdmFsdWVzLCB3ZSBtdXN0IGxvb2sgZm9yIFwiIGFuZCBcXCBjaGFyYWN0ZXJzLlxuICAgICAgICBpZiAoY2ggPT09ICdcIicpIHtcbiAgICAgICAgICAgIHdoaWxlIChuZXh0KCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICdcIicpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY2ggPT09ICdcXFxcJykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCA9PT0gJ3UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1ZmZmZiA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGV4ID0gcGFyc2VJbnQobmV4dCgpLCAxNik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShoZXgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1ZmZmZiA9IHVmZmZmICogMTYgKyBoZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1ZmZmZik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVzY2FwZWVbY2hdID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RyaW5nICs9IGVzY2FwZWVbY2hdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmcgKz0gY2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVycm9yKFwiQmFkIHN0cmluZ1wiKTtcbiAgICB9LFxuXG4gICAgd2hpdGUgPSBmdW5jdGlvbiAoKSB7XG5cbi8vIFNraXAgd2hpdGVzcGFjZS5cblxuICAgICAgICB3aGlsZSAoY2ggJiYgY2ggPD0gJyAnKSB7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgd29yZCA9IGZ1bmN0aW9uICgpIHtcblxuLy8gdHJ1ZSwgZmFsc2UsIG9yIG51bGwuXG5cbiAgICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgICAgIG5leHQoJ3QnKTtcbiAgICAgICAgICAgIG5leHQoJ3InKTtcbiAgICAgICAgICAgIG5leHQoJ3UnKTtcbiAgICAgICAgICAgIG5leHQoJ2UnKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBjYXNlICdmJzpcbiAgICAgICAgICAgIG5leHQoJ2YnKTtcbiAgICAgICAgICAgIG5leHQoJ2EnKTtcbiAgICAgICAgICAgIG5leHQoJ2wnKTtcbiAgICAgICAgICAgIG5leHQoJ3MnKTtcbiAgICAgICAgICAgIG5leHQoJ2UnKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgY2FzZSAnbic6XG4gICAgICAgICAgICBuZXh0KCduJyk7XG4gICAgICAgICAgICBuZXh0KCd1Jyk7XG4gICAgICAgICAgICBuZXh0KCdsJyk7XG4gICAgICAgICAgICBuZXh0KCdsJyk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBlcnJvcihcIlVuZXhwZWN0ZWQgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgfSxcblxuICAgIHZhbHVlLCAgLy8gUGxhY2UgaG9sZGVyIGZvciB0aGUgdmFsdWUgZnVuY3Rpb24uXG5cbiAgICBhcnJheSA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYW4gYXJyYXkgdmFsdWUuXG5cbiAgICAgICAgdmFyIGFycmF5ID0gW107XG5cbiAgICAgICAgaWYgKGNoID09PSAnWycpIHtcbiAgICAgICAgICAgIG5leHQoJ1snKTtcbiAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICBpZiAoY2ggPT09ICddJykge1xuICAgICAgICAgICAgICAgIG5leHQoJ10nKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXk7ICAgLy8gZW1wdHkgYXJyYXlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHdoaWxlIChjaCkge1xuICAgICAgICAgICAgICAgIGFycmF5LnB1c2godmFsdWUoKSk7XG4gICAgICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICddJykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCddJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV4dCgnLCcpO1xuICAgICAgICAgICAgICAgIHdoaXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IoXCJCYWQgYXJyYXlcIik7XG4gICAgfSxcblxuICAgIG9iamVjdCA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYW4gb2JqZWN0IHZhbHVlLlxuXG4gICAgICAgIHZhciBrZXksXG4gICAgICAgICAgICBvYmplY3QgPSB7fTtcblxuICAgICAgICBpZiAoY2ggPT09ICd7Jykge1xuICAgICAgICAgICAgbmV4dCgneycpO1xuICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgIGlmIChjaCA9PT0gJ30nKSB7XG4gICAgICAgICAgICAgICAgbmV4dCgnfScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7ICAgLy8gZW1wdHkgb2JqZWN0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aGlsZSAoY2gpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBzdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgICAgIG5leHQoJzonKTtcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yKCdEdXBsaWNhdGUga2V5IFwiJyArIGtleSArICdcIicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IHZhbHVlKCk7XG4gICAgICAgICAgICAgICAgd2hpdGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoY2ggPT09ICd9Jykge1xuICAgICAgICAgICAgICAgICAgICBuZXh0KCd9Jyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5leHQoJywnKTtcbiAgICAgICAgICAgICAgICB3aGl0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVycm9yKFwiQmFkIG9iamVjdFwiKTtcbiAgICB9O1xuXG52YWx1ZSA9IGZ1bmN0aW9uICgpIHtcblxuLy8gUGFyc2UgYSBKU09OIHZhbHVlLiBJdCBjb3VsZCBiZSBhbiBvYmplY3QsIGFuIGFycmF5LCBhIHN0cmluZywgYSBudW1iZXIsXG4vLyBvciBhIHdvcmQuXG5cbiAgICB3aGl0ZSgpO1xuICAgIHN3aXRjaCAoY2gpIHtcbiAgICBjYXNlICd7JzpcbiAgICAgICAgcmV0dXJuIG9iamVjdCgpO1xuICAgIGNhc2UgJ1snOlxuICAgICAgICByZXR1cm4gYXJyYXkoKTtcbiAgICBjYXNlICdcIic6XG4gICAgICAgIHJldHVybiBzdHJpbmcoKTtcbiAgICBjYXNlICctJzpcbiAgICAgICAgcmV0dXJuIG51bWJlcigpO1xuICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBjaCA+PSAnMCcgJiYgY2ggPD0gJzknID8gbnVtYmVyKCkgOiB3b3JkKCk7XG4gICAgfVxufTtcblxuLy8gUmV0dXJuIHRoZSBqc29uX3BhcnNlIGZ1bmN0aW9uLiBJdCB3aWxsIGhhdmUgYWNjZXNzIHRvIGFsbCBvZiB0aGUgYWJvdmVcbi8vIGZ1bmN0aW9ucyBhbmQgdmFyaWFibGVzLlxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzb3VyY2UsIHJldml2ZXIpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIFxuICAgIHRleHQgPSBzb3VyY2U7XG4gICAgYXQgPSAwO1xuICAgIGNoID0gJyAnO1xuICAgIHJlc3VsdCA9IHZhbHVlKCk7XG4gICAgd2hpdGUoKTtcbiAgICBpZiAoY2gpIHtcbiAgICAgICAgZXJyb3IoXCJTeW50YXggZXJyb3JcIik7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSByZXZpdmVyIGZ1bmN0aW9uLCB3ZSByZWN1cnNpdmVseSB3YWxrIHRoZSBuZXcgc3RydWN0dXJlLFxuICAgIC8vIHBhc3NpbmcgZWFjaCBuYW1lL3ZhbHVlIHBhaXIgdG8gdGhlIHJldml2ZXIgZnVuY3Rpb24gZm9yIHBvc3NpYmxlXG4gICAgLy8gdHJhbnNmb3JtYXRpb24sIHN0YXJ0aW5nIHdpdGggYSB0ZW1wb3Jhcnkgcm9vdCBvYmplY3QgdGhhdCBob2xkcyB0aGUgcmVzdWx0XG4gICAgLy8gaW4gYW4gZW1wdHkga2V5LiBJZiB0aGVyZSBpcyBub3QgYSByZXZpdmVyIGZ1bmN0aW9uLCB3ZSBzaW1wbHkgcmV0dXJuIHRoZVxuICAgIC8vIHJlc3VsdC5cblxuICAgIHJldHVybiB0eXBlb2YgcmV2aXZlciA9PT0gJ2Z1bmN0aW9uJyA/IChmdW5jdGlvbiB3YWxrKGhvbGRlciwga2V5KSB7XG4gICAgICAgIHZhciBrLCB2LCB2YWx1ZSA9IGhvbGRlcltrZXldO1xuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh2YWx1ZSwgaykpIHtcbiAgICAgICAgICAgICAgICAgICAgdiA9IHdhbGsodmFsdWUsIGspO1xuICAgICAgICAgICAgICAgICAgICBpZiAodiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtrXSA9IHY7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdmFsdWVba107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldml2ZXIuY2FsbChob2xkZXIsIGtleSwgdmFsdWUpO1xuICAgIH0oeycnOiByZXN1bHR9LCAnJykpIDogcmVzdWx0O1xufTtcbiIsInZhciBjeCA9IC9bXFx1MDAwMFxcdTAwYWRcXHUwNjAwLVxcdTA2MDRcXHUwNzBmXFx1MTdiNFxcdTE3YjVcXHUyMDBjLVxcdTIwMGZcXHUyMDI4LVxcdTIwMmZcXHUyMDYwLVxcdTIwNmZcXHVmZWZmXFx1ZmZmMC1cXHVmZmZmXS9nLFxuICAgIGVzY2FwYWJsZSA9IC9bXFxcXFxcXCJcXHgwMC1cXHgxZlxceDdmLVxceDlmXFx1MDBhZFxcdTA2MDAtXFx1MDYwNFxcdTA3MGZcXHUxN2I0XFx1MTdiNVxcdTIwMGMtXFx1MjAwZlxcdTIwMjgtXFx1MjAyZlxcdTIwNjAtXFx1MjA2ZlxcdWZlZmZcXHVmZmYwLVxcdWZmZmZdL2csXG4gICAgZ2FwLFxuICAgIGluZGVudCxcbiAgICBtZXRhID0geyAgICAvLyB0YWJsZSBvZiBjaGFyYWN0ZXIgc3Vic3RpdHV0aW9uc1xuICAgICAgICAnXFxiJzogJ1xcXFxiJyxcbiAgICAgICAgJ1xcdCc6ICdcXFxcdCcsXG4gICAgICAgICdcXG4nOiAnXFxcXG4nLFxuICAgICAgICAnXFxmJzogJ1xcXFxmJyxcbiAgICAgICAgJ1xccic6ICdcXFxccicsXG4gICAgICAgICdcIicgOiAnXFxcXFwiJyxcbiAgICAgICAgJ1xcXFwnOiAnXFxcXFxcXFwnXG4gICAgfSxcbiAgICByZXA7XG5cbmZ1bmN0aW9uIHF1b3RlKHN0cmluZykge1xuICAgIC8vIElmIHRoZSBzdHJpbmcgY29udGFpbnMgbm8gY29udHJvbCBjaGFyYWN0ZXJzLCBubyBxdW90ZSBjaGFyYWN0ZXJzLCBhbmQgbm9cbiAgICAvLyBiYWNrc2xhc2ggY2hhcmFjdGVycywgdGhlbiB3ZSBjYW4gc2FmZWx5IHNsYXAgc29tZSBxdW90ZXMgYXJvdW5kIGl0LlxuICAgIC8vIE90aGVyd2lzZSB3ZSBtdXN0IGFsc28gcmVwbGFjZSB0aGUgb2ZmZW5kaW5nIGNoYXJhY3RlcnMgd2l0aCBzYWZlIGVzY2FwZVxuICAgIC8vIHNlcXVlbmNlcy5cbiAgICBcbiAgICBlc2NhcGFibGUubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gZXNjYXBhYmxlLnRlc3Qoc3RyaW5nKSA/ICdcIicgKyBzdHJpbmcucmVwbGFjZShlc2NhcGFibGUsIGZ1bmN0aW9uIChhKSB7XG4gICAgICAgIHZhciBjID0gbWV0YVthXTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBjID09PSAnc3RyaW5nJyA/IGMgOlxuICAgICAgICAgICAgJ1xcXFx1JyArICgnMDAwMCcgKyBhLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtNCk7XG4gICAgfSkgKyAnXCInIDogJ1wiJyArIHN0cmluZyArICdcIic7XG59XG5cbmZ1bmN0aW9uIHN0cihrZXksIGhvbGRlcikge1xuICAgIC8vIFByb2R1Y2UgYSBzdHJpbmcgZnJvbSBob2xkZXJba2V5XS5cbiAgICB2YXIgaSwgICAgICAgICAgLy8gVGhlIGxvb3AgY291bnRlci5cbiAgICAgICAgaywgICAgICAgICAgLy8gVGhlIG1lbWJlciBrZXkuXG4gICAgICAgIHYsICAgICAgICAgIC8vIFRoZSBtZW1iZXIgdmFsdWUuXG4gICAgICAgIGxlbmd0aCxcbiAgICAgICAgbWluZCA9IGdhcCxcbiAgICAgICAgcGFydGlhbCxcbiAgICAgICAgdmFsdWUgPSBob2xkZXJba2V5XTtcbiAgICBcbiAgICAvLyBJZiB0aGUgdmFsdWUgaGFzIGEgdG9KU09OIG1ldGhvZCwgY2FsbCBpdCB0byBvYnRhaW4gYSByZXBsYWNlbWVudCB2YWx1ZS5cbiAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvSlNPTihrZXkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBJZiB3ZSB3ZXJlIGNhbGxlZCB3aXRoIGEgcmVwbGFjZXIgZnVuY3Rpb24sIHRoZW4gY2FsbCB0aGUgcmVwbGFjZXIgdG9cbiAgICAvLyBvYnRhaW4gYSByZXBsYWNlbWVudCB2YWx1ZS5cbiAgICBpZiAodHlwZW9mIHJlcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB2YWx1ZSA9IHJlcC5jYWxsKGhvbGRlciwga2V5LCB2YWx1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIFdoYXQgaGFwcGVucyBuZXh0IGRlcGVuZHMgb24gdGhlIHZhbHVlJ3MgdHlwZS5cbiAgICBzd2l0Y2ggKHR5cGVvZiB2YWx1ZSkge1xuICAgICAgICBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgcmV0dXJuIHF1b3RlKHZhbHVlKTtcbiAgICAgICAgXG4gICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAvLyBKU09OIG51bWJlcnMgbXVzdCBiZSBmaW5pdGUuIEVuY29kZSBub24tZmluaXRlIG51bWJlcnMgYXMgbnVsbC5cbiAgICAgICAgICAgIHJldHVybiBpc0Zpbml0ZSh2YWx1ZSkgPyBTdHJpbmcodmFsdWUpIDogJ251bGwnO1xuICAgICAgICBcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIGNhc2UgJ251bGwnOlxuICAgICAgICAgICAgLy8gSWYgdGhlIHZhbHVlIGlzIGEgYm9vbGVhbiBvciBudWxsLCBjb252ZXJ0IGl0IHRvIGEgc3RyaW5nLiBOb3RlOlxuICAgICAgICAgICAgLy8gdHlwZW9mIG51bGwgZG9lcyBub3QgcHJvZHVjZSAnbnVsbCcuIFRoZSBjYXNlIGlzIGluY2x1ZGVkIGhlcmUgaW5cbiAgICAgICAgICAgIC8vIHRoZSByZW1vdGUgY2hhbmNlIHRoYXQgdGhpcyBnZXRzIGZpeGVkIHNvbWVkYXkuXG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgICAgIFxuICAgICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuICdudWxsJztcbiAgICAgICAgICAgIGdhcCArPSBpbmRlbnQ7XG4gICAgICAgICAgICBwYXJ0aWFsID0gW107XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIEFycmF5LmlzQXJyYXlcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmFwcGx5KHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFydGlhbFtpXSA9IHN0cihpLCB2YWx1ZSkgfHwgJ251bGwnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyBKb2luIGFsbCBvZiB0aGUgZWxlbWVudHMgdG9nZXRoZXIsIHNlcGFyYXRlZCB3aXRoIGNvbW1hcywgYW5kXG4gICAgICAgICAgICAgICAgLy8gd3JhcCB0aGVtIGluIGJyYWNrZXRzLlxuICAgICAgICAgICAgICAgIHYgPSBwYXJ0aWFsLmxlbmd0aCA9PT0gMCA/ICdbXScgOiBnYXAgP1xuICAgICAgICAgICAgICAgICAgICAnW1xcbicgKyBnYXAgKyBwYXJ0aWFsLmpvaW4oJyxcXG4nICsgZ2FwKSArICdcXG4nICsgbWluZCArICddJyA6XG4gICAgICAgICAgICAgICAgICAgICdbJyArIHBhcnRpYWwuam9pbignLCcpICsgJ10nO1xuICAgICAgICAgICAgICAgIGdhcCA9IG1pbmQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIElmIHRoZSByZXBsYWNlciBpcyBhbiBhcnJheSwgdXNlIGl0IHRvIHNlbGVjdCB0aGUgbWVtYmVycyB0byBiZVxuICAgICAgICAgICAgLy8gc3RyaW5naWZpZWQuXG4gICAgICAgICAgICBpZiAocmVwICYmIHR5cGVvZiByZXAgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gcmVwLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgayA9IHJlcFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBrID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IHN0cihrLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRpYWwucHVzaChxdW90ZShrKSArIChnYXAgPyAnOiAnIDogJzonKSArIHYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCBpdGVyYXRlIHRocm91Z2ggYWxsIG9mIHRoZSBrZXlzIGluIHRoZSBvYmplY3QuXG4gICAgICAgICAgICAgICAgZm9yIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ID0gc3RyKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFydGlhbC5wdXNoKHF1b3RlKGspICsgKGdhcCA/ICc6ICcgOiAnOicpICsgdik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgLy8gSm9pbiBhbGwgb2YgdGhlIG1lbWJlciB0ZXh0cyB0b2dldGhlciwgc2VwYXJhdGVkIHdpdGggY29tbWFzLFxuICAgICAgICAvLyBhbmQgd3JhcCB0aGVtIGluIGJyYWNlcy5cblxuICAgICAgICB2ID0gcGFydGlhbC5sZW5ndGggPT09IDAgPyAne30nIDogZ2FwID9cbiAgICAgICAgICAgICd7XFxuJyArIGdhcCArIHBhcnRpYWwuam9pbignLFxcbicgKyBnYXApICsgJ1xcbicgKyBtaW5kICsgJ30nIDpcbiAgICAgICAgICAgICd7JyArIHBhcnRpYWwuam9pbignLCcpICsgJ30nO1xuICAgICAgICBnYXAgPSBtaW5kO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlLCByZXBsYWNlciwgc3BhY2UpIHtcbiAgICB2YXIgaTtcbiAgICBnYXAgPSAnJztcbiAgICBpbmRlbnQgPSAnJztcbiAgICBcbiAgICAvLyBJZiB0aGUgc3BhY2UgcGFyYW1ldGVyIGlzIGEgbnVtYmVyLCBtYWtlIGFuIGluZGVudCBzdHJpbmcgY29udGFpbmluZyB0aGF0XG4gICAgLy8gbWFueSBzcGFjZXMuXG4gICAgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHNwYWNlOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGluZGVudCArPSAnICc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gSWYgdGhlIHNwYWNlIHBhcmFtZXRlciBpcyBhIHN0cmluZywgaXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBpbmRlbnQgc3RyaW5nLlxuICAgIGVsc2UgaWYgKHR5cGVvZiBzcGFjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW5kZW50ID0gc3BhY2U7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYSByZXBsYWNlciwgaXQgbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIGFuIGFycmF5LlxuICAgIC8vIE90aGVyd2lzZSwgdGhyb3cgYW4gZXJyb3IuXG4gICAgcmVwID0gcmVwbGFjZXI7XG4gICAgaWYgKHJlcGxhY2VyICYmIHR5cGVvZiByZXBsYWNlciAhPT0gJ2Z1bmN0aW9uJ1xuICAgICYmICh0eXBlb2YgcmVwbGFjZXIgIT09ICdvYmplY3QnIHx8IHR5cGVvZiByZXBsYWNlci5sZW5ndGggIT09ICdudW1iZXInKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0pTT04uc3RyaW5naWZ5Jyk7XG4gICAgfVxuICAgIFxuICAgIC8vIE1ha2UgYSBmYWtlIHJvb3Qgb2JqZWN0IGNvbnRhaW5pbmcgb3VyIHZhbHVlIHVuZGVyIHRoZSBrZXkgb2YgJycuXG4gICAgLy8gUmV0dXJuIHRoZSByZXN1bHQgb2Ygc3RyaW5naWZ5aW5nIHRoZSB2YWx1ZS5cbiAgICByZXR1cm4gc3RyKCcnLCB7Jyc6IHZhbHVlfSk7XG59O1xuIiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBUaWxlTGF5ZXI6IHJlcXVpcmUoJy4vbGF5ZXIvZXhwb3J0cycpLFxuICAgICAgICBSZW5kZXJlcjogcmVxdWlyZSgnLi9yZW5kZXJlci9leHBvcnRzJyksXG4gICAgICAgIFRpbGVSZXF1ZXN0b3I6IHJlcXVpcmUoJy4vcmVxdWVzdC9UaWxlUmVxdWVzdG9yJyksXG4gICAgICAgIE1ldGFSZXF1ZXN0b3I6IHJlcXVpcmUoJy4vcmVxdWVzdC9NZXRhUmVxdWVzdG9yJylcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHNldERhdGVIaXN0b2dyYW0gPSBmdW5jdGlvbihmaWVsZCwgZnJvbSwgdG8sIGludGVydmFsKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIHRocm93ICdEYXRlSGlzdG9ncmFtIGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyAnRGF0ZUhpc3RvZ3JhbSBgZnJvbWAgYXJlIG1pc3NpbmcgZnJvbSBhcmd1bWVudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93ICdEYXRlSGlzdG9ncmFtIGB0b2AgYXJlIG1pc3NpbmcgZnJvbSBhcmd1bWVudCc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGFyYW1zLmRhdGVfaGlzdG9ncmFtID0ge1xuICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAgICAgZnJvbTogZnJvbSxcbiAgICAgICAgICAgIHRvOiB0byxcbiAgICAgICAgICAgIGludGVydmFsOiBpbnRlcnZhbFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldERhdGVIaXN0b2dyYW0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5kYXRlX2hpc3RvZ3JhbTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIHNldERhdGVIaXN0b2dyYW06IHNldERhdGVIaXN0b2dyYW0sXG4gICAgICAgIGdldERhdGVIaXN0b2dyYW06IGdldERhdGVIaXN0b2dyYW1cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKCFtZXRhLmV4dHJlbWEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnSGlzdG9ncmFtIGBmaWVsZGAgJyArIGZpZWxkICsgJyBpcyBub3Qgb3JkaW5hbCBpbiBtZXRhIGRhdGEnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgJ0hpc3RvZ3JhbSBgZmllbGRgICcgKyBmaWVsZCArICcgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhJztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgc2V0SGlzdG9ncmFtID0gZnVuY3Rpb24oZmllbGQsIGludGVydmFsKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIHRocm93ICdIaXN0b2dyYW0gYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIHRocm93ICdIaXN0b2dyYW0gYGludGVydmFsYCBhcmUgbWlzc2luZyBmcm9tIGFyZ3VtZW50JztcbiAgICAgICAgfVxuICAgICAgICBjaGVja0ZpZWxkKHRoaXMuX21ldGFbZmllbGRdLCBmaWVsZCk7XG4gICAgICAgIHRoaXMuX3BhcmFtcy5oaXN0b2dyYW0gPSB7XG4gICAgICAgICAgICBmaWVsZDogZmllbGQsXG4gICAgICAgICAgICBpbnRlcnZhbDogaW50ZXJ2YWxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRIaXN0b2dyYW0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5oaXN0b2dyYW07XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICBzZXRIaXN0b2dyYW06IHNldEhpc3RvZ3JhbSxcbiAgICAgICAgZ2V0SGlzdG9ncmFtOiBnZXRIaXN0b2dyYW1cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIE1FVFJJQ1MgPSB7XG4gICAgICAgICdtaW4nOiB0cnVlLFxuICAgICAgICAnbWF4JzogdHJ1ZSxcbiAgICAgICAgJ3N1bSc6IHRydWUsXG4gICAgICAgICdhdmcnOiB0cnVlXG4gICAgfTtcblxuICAgIHZhciBjaGVja0ZpZWxkID0gZnVuY3Rpb24obWV0YSwgZmllbGQpIHtcbiAgICAgICAgaWYgKG1ldGEpIHtcbiAgICAgICAgICAgIGlmICghbWV0YS5leHRyZW1hKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ01ldHJpeCBgZmllbGRgICcgKyBmaWVsZCArICcgaXMgbm90IG9yZGluYWwgaW4gbWV0YSBkYXRhJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93ICdNZXRyaWMgYGZpZWxkYCAnICsgZmllbGQgKyAnIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YSc7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHNldE1ldHJpYyA9IGZ1bmN0aW9uKGZpZWxkLCB0eXBlKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIHRocm93ICdNZXRyaWMgYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdHlwZSkge1xuICAgICAgICAgICAgdGhyb3cgJ01ldHJpYyBgdHlwZWAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50JztcbiAgICAgICAgfVxuICAgICAgICBjaGVja0ZpZWxkKHRoaXMuX21ldGFbZmllbGRdLCBmaWVsZCk7XG4gICAgICAgIGlmICghTUVUUklDU1t0eXBlXSkge1xuICAgICAgICAgICAgdGhyb3cgJ01ldHJpYyB0eXBlIGAnICsgdHlwZSArICdgIGlzIG5vdCBzdXBwb3J0ZWQnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3BhcmFtcy5tZXRyaWMgPSB7XG4gICAgICAgICAgICBmaWVsZDogZmllbGQsXG4gICAgICAgICAgICB0eXBlOiB0eXBlXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0TWV0cmljID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMubWV0cmljO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgLy8gdGlsaW5nXG4gICAgICAgIHNldE1ldHJpYzogc2V0TWV0cmljLFxuICAgICAgICBnZXRNZXRyaWM6IGdldE1ldHJpYyxcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnVGVybXMgYGZpZWxkYCAnICsgZmllbGQgKyAnIGlzIG5vdCBvZiB0eXBlIGBzdHJpbmdgIGluIG1ldGEgZGF0YSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyAnVGVybXMgYGZpZWxkYCAnICsgZmllbGQgKyAnIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YSc7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHNldFRlcm1zID0gZnVuY3Rpb24oZmllbGQsIHNpemUpIHtcbiAgICAgICAgaWYgKCFmaWVsZCkge1xuICAgICAgICAgICAgdGhyb3cgJ1Rlcm1zIGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50JztcbiAgICAgICAgfVxuICAgICAgICBjaGVja0ZpZWxkKHRoaXMuX21ldGFbZmllbGRdLCBmaWVsZCk7XG4gICAgICAgIHRoaXMuX3BhcmFtcy50ZXJtcyA9IHtcbiAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgIHNpemU6IHNpemVcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRUZXJtcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLnRlcm1zO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgc2V0VGVybXM6IHNldFRlcm1zLFxuICAgICAgICBnZXRUZXJtczogZ2V0VGVybXNcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnVGVybXMgYGZpZWxkYCAnICsgZmllbGQgKyAnIGlzIG5vdCBvZiB0eXBlIGBzdHJpbmdgIGluIG1ldGEgZGF0YSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyAnVGVybXMgYGZpZWxkYCAnICsgZmllbGQgKyAnIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YSc7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHNldFRlcm1zRmlsdGVyID0gZnVuY3Rpb24oZmllbGQsIHRlcm1zKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIHRocm93ICdUZXJtcyBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRlcm1zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93ICdUZXJtcyBgdGVybXNgIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQnO1xuICAgICAgICB9XG4gICAgICAgIGNoZWNrRmllbGQodGhpcy5fbWV0YVtmaWVsZF0sIGZpZWxkKTtcbiAgICAgICAgdGhpcy5fcGFyYW1zLnRlcm1zX2ZpbHRlciA9IHtcbiAgICAgICAgICAgIGZpZWxkOiBmaWVsZCxcbiAgICAgICAgICAgIHRlcm1zOiB0ZXJtc1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFRlcm1zRmlsdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMudGVybXNfZmlsdGVyO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgc2V0VGVybXNGaWx0ZXI6IHNldFRlcm1zRmlsdGVyLFxuICAgICAgICBnZXRUZXJtc0ZpbHRlcjogZ2V0VGVybXNGaWx0ZXJcbiAgICB9O1xuXG59KCkpO1xuIiwiLy8gUHJvdmlkZXMgdG9wIGhpdHMgcXVlcnkgZnVuY3Rpb25hbGl0eS4gJ3NpemUnIGluZGljYXRlcyB0aGUgbnVtYmVyIG9mIHRvcCBcbi8vIGhpdHMgdG8gcmV0dXJuLCAnaW5jbHVkZScgaXMgdGhlIGxpc3Qgb2YgZmllbGRzIHRvIGluY2x1ZGUgaW4gdGhlIHJldHVybmVkIFxuLy8gZGF0YSwgJ3NvcnQnIGlzIHRoZSBmaWVsZCB0byB1c2UgZm9yIHNvcnQgY3JpdGVyYSwgYW5kICdvcmRlcicgaXMgdmFsdWUgb2Zcbi8vICdhc2MnIG9yICdkZXNjJyB0byBpbmRpY2F0ZSBzb3J0IG9yZGVyaW5nLlxuKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHNldFRvcEhpdHMgPSBmdW5jdGlvbihzaXplLCBpbmNsdWRlLCBzb3J0LCBvcmRlcikge1xuICAgICAgICB0aGlzLl9wYXJhbXMudG9wX2hpdHMgPSB7XG4gICAgICAgICAgICBzaXplOiBzaXplLCBcbiAgICAgICAgICAgIGluY2x1ZGU6aW5jbHVkZSxcbiAgICAgICAgICAgIHNvcnQ6IHNvcnQsXG4gICAgICAgICAgICBvcmRlcjogb3JkZXIgICAgICAgICAgICBcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHZhciBnZXRUb3BIaXRzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMudG9wX2hpdHM7XG4gICAgfTtcblxuICAgIC8vIGJpbmQgcG9pbnQgZm9yIGV4dGVybmFsIGNvbnRyb2xzXG4gICAgdmFyIHNldFNvcnRGaWVsZCA9IGZ1bmN0aW9uKHNvcnQpIHtcbiAgICAgICAgdGhpcy5fcGFyYW1zLnRvcF9oaXRzLnNvcnQgPSBzb3J0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gYmluZCBwb2ludCBmb3IgZXh0ZXJuYWwgY29udHJvbHNcbiAgICB2YXIgZ2V0U29ydEZpZWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMudG9wX2hpdHMuc29ydDtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIHNldFRvcEhpdHM6IHNldFRvcEhpdHMsXG4gICAgICAgIGdldFRvcEhpdHM6IGdldFRvcEhpdHMsXG4gICAgICAgIHNldFNvcnRGaWVsZDogc2V0U29ydEZpZWxkLFxuICAgICAgICBnZXRTb3J0RmllbGQ6IGdldFNvcnRGaWVsZFxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgY2hlY2tGaWVsZCA9IGZ1bmN0aW9uKG1ldGEsIGZpZWxkKSB7XG4gICAgICAgIGlmIChtZXRhKSB7XG4gICAgICAgICAgICBpZiAobWV0YS50eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHRocm93ICdUb3BUZXJtcyBgZmllbGRgICcgKyBmaWVsZCArICcgaXMgbm90IG9mIHR5cGUgYHN0cmluZ2AgaW4gbWV0YSBkYXRhJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93ICdUb3BUZXJtcyBgZmllbGRgICcgKyBmaWVsZCArICcgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhJztcbiAgICAgICAgfSAgICAgICAgXG4gICAgfTtcblxuICAgIHZhciBzZXRUb3BUZXJtcyA9IGZ1bmN0aW9uKGZpZWxkLCBzaXplKSB7XG4gICAgICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgICAgIHRocm93ICdUb3BUZXJtcyBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudCc7XG4gICAgICAgIH1cbiAgICAgICAgY2hlY2tGaWVsZCh0aGlzLl9tZXRhW2ZpZWxkXSwgZmllbGQpO1xuICAgICAgICB0aGlzLl9wYXJhbXMudG9wX3Rlcm1zID0ge1xuICAgICAgICAgICAgZmllbGQ6IGZpZWxkLFxuICAgICAgICAgICAgc2l6ZTogc2l6ZVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFRvcFRlcm1zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMudG9wX3Rlcm1zO1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgc2V0VG9wVGVybXM6IHNldFRvcFRlcm1zLFxuICAgICAgICBnZXRUb3BUZXJtczogZ2V0VG9wVGVybXNcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEJhc2UgPSBMLkdyaWRMYXllci5leHRlbmQoe1xuXG4gICAgICAgIGdldE9wYWNpdHk6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5vcGFjaXR5O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNob3c6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faGlkZGVuID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9wcmV2TWFwLmFkZExheWVyKHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5faGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ByZXZNYXAgPSB0aGlzLl9tYXA7XG4gICAgICAgICAgICB0aGlzLl9tYXAucmVtb3ZlTGF5ZXIodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNIaWRkZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hpZGRlbjtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRCcmlnaHRuZXNzOiBmdW5jdGlvbihicmlnaHRuZXNzKSB7XG4gICAgICAgICAgICB0aGlzLl9icmlnaHRuZXNzID0gYnJpZ2h0bmVzcztcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5jc3MoJy13ZWJraXQtZmlsdGVyJywgJ2JyaWdodG5lc3MoJyArICh0aGlzLl9icmlnaHRuZXNzICogMTAwKSArICclKScpO1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLmNzcygnZmlsdGVyJywgJ2JyaWdodG5lc3MoJyArICh0aGlzLl9icmlnaHRuZXNzICogMTAwKSArICclKScpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEJyaWdodG5lc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICh0aGlzLl9icmlnaHRuZXNzICE9PSB1bmRlZmluZWQpID8gdGhpcy5fYnJpZ2h0bmVzcyA6IDE7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBCYXNlO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuL0Jhc2UnKTtcblxuICAgIHZhciBEZWJ1ZyA9IEJhc2UuZXh0ZW5kKHtcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICB1bmxvYWRJbnZpc2libGVUaWxlczogdHJ1ZSxcbiAgICAgICAgICAgIHpJbmRleDogNTAwMFxuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIHNldCByZW5kZXJlclxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnJlbmRlcmVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnTm8gYHJlbmRlcmVyQ2xhc3NgIG9wdGlvbiBmb3VuZC4nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyByZWN1cnNpdmVseSBleHRlbmRcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLCBvcHRpb25zLnJlbmRlcmVyQ2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0IG9wdGlvbnNcbiAgICAgICAgICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVUaWxlOiBmdW5jdGlvbihjb29yZCkge1xuICAgICAgICAgICAgLy8gY3JlYXRlIGEgPGRpdj4gZWxlbWVudCBmb3IgZHJhd2luZ1xuICAgICAgICAgICAgdmFyIHRpbGUgPSBMLkRvbVV0aWwuY3JlYXRlKCdkaXYnLCAnbGVhZmxldC10aWxlJyk7XG4gICAgICAgICAgICAvLyBkcmF3IHRvIGl0XG4gICAgICAgICAgICB0aGlzLnJlbmRlclRpbGUodGlsZSwgY29vcmQpO1xuICAgICAgICAgICAgLy8gcGFzcyB0aWxlIHRvIGNhbGxiYWNrXG4gICAgICAgICAgICByZXR1cm4gdGlsZTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBEZWJ1ZztcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBCYXNlID0gcmVxdWlyZSgnLi9CYXNlJyk7XG5cbiAgICB2YXIgSW1hZ2UgPSBMLlRpbGVMYXllci5leHRlbmQoQmFzZSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IEltYWdlO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGJvb2xRdWVyeUNoZWNrID0gcmVxdWlyZSgnLi4vcXVlcnkvQm9vbCcpO1xuXG4gICAgdmFyIE1JTiA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgdmFyIE1BWCA9IDA7XG5cbiAgICBmdW5jdGlvbiBtb2QobiwgbSkge1xuICAgICAgICByZXR1cm4gKChuICUgbSkgKyBtKSAlIG07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Tm9ybWFsaXplQ29vcmRzKGNvb3Jkcykge1xuICAgICAgICB2YXIgcG93ID0gTWF0aC5wb3coMiwgY29vcmRzLnopO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogbW9kKGNvb3Jkcy54LCBwb3cpLFxuICAgICAgICAgICAgeTogbW9kKGNvb3Jkcy55LCBwb3cpLFxuICAgICAgICAgICAgejogY29vcmRzLnpcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgTGl2ZSA9IEwuQ2xhc3MuZXh0ZW5kKHtcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbihtZXRhLCBvcHRpb25zKSB7XG4gICAgICAgICAgICAvLyBzZXQgcmVuZGVyZXJcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5yZW5kZXJlckNsYXNzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ05vIGByZW5kZXJlckNsYXNzYCBvcHRpb24gZm91bmQuJztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gcmVjdXJzaXZlbHkgZXh0ZW5kIGFuZCBpbml0aWFsaXplXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVuZGVyZXJDbGFzcy5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgdGhpcywgb3B0aW9ucy5yZW5kZXJlckNsYXNzLnByb3RvdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZXJDbGFzcy5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdGlvbnMucmVuZGVyZXJDbGFzcyk7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMucmVuZGVyZXJDbGFzcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0IG9wdGlvbnNcbiAgICAgICAgICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgICAgIC8vIHNldCBtZXRhXG4gICAgICAgICAgICB0aGlzLl9tZXRhID0gbWV0YTtcbiAgICAgICAgICAgIC8vIHNldCBwYXJhbXNcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICBiaW5uaW5nOiB7fVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIHNldCBleHRyZW1hIC8gY2FjaGVcbiAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYXJFeHRyZW1hOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2V4dHJlbWEgPSB7XG4gICAgICAgICAgICAgICAgbWluOiBNSU4sXG4gICAgICAgICAgICAgICAgbWF4OiBNQVhcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEV4dHJlbWE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2V4dHJlbWE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlRXh0cmVtYTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIGV4dHJlbWEgPSB0aGlzLmV4dHJhY3RFeHRyZW1hKGRhdGEpO1xuICAgICAgICAgICAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChleHRyZW1hLm1pbiA8IHRoaXMuX2V4dHJlbWEubWluKSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXh0cmVtYS5taW4gPSBleHRyZW1hLm1pbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChleHRyZW1hLm1heCA+IHRoaXMuX2V4dHJlbWEubWF4KSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXh0cmVtYS5tYXggPSBleHRyZW1hLm1heDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VkO1xuICAgICAgICB9LFxuXG4gICAgICAgIGV4dHJhY3RFeHRyZW1hOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG1pbjogXy5taW4oZGF0YSksXG4gICAgICAgICAgICAgICAgbWF4OiBfLm1heChkYXRhKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRRdWVyeTogZnVuY3Rpb24ocXVlcnkpIHtcbiAgICAgICAgICAgIGlmICghcXVlcnkubXVzdCAmJiAhcXVlcnkubXVzdF9ub3QgJiYgIXF1ZXJ5LnNob3VsZCkge1xuICAgICAgICAgICAgICAgIHRocm93ICdSb290IHF1ZXJ5IG11c3QgaGF2ZSBhdCBsZWFzdCBvbmUgYG11c3RgLCBgbXVzdF9ub3RgLCBvciBgc2hvdWxkYCBhcmd1bWVudC4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2hlY2sgdGhhdCB0aGUgcXVlcnkgaXMgdmFsaWRcbiAgICAgICAgICAgIGJvb2xRdWVyeUNoZWNrKHRoaXMuX21ldGEsIHF1ZXJ5KTtcbiAgICAgICAgICAgIC8vIHNldCBxdWVyeVxuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLm11c3QgPSBxdWVyeS5tdXN0O1xuICAgICAgICAgICAgdGhpcy5fcGFyYW1zLm11c3Rfbm90ID0gcXVlcnkubXVzdF9ub3Q7XG4gICAgICAgICAgICB0aGlzLl9wYXJhbXMuc2hvdWxkID0gcXVlcnkuc2hvdWxkO1xuICAgICAgICAgICAgLy8gY2xlYXQgZXh0cmVtYVxuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRNZXRhOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9tZXRhO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFBhcmFtczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhY2hlS2V5RnJvbUNvb3JkOiBmdW5jdGlvbihjb29yZHMsIG5vcm1hbGl6ZSkge1xuICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZSkge1xuICAgICAgICAgICAgICAgIC8vIGxlYWZsZXQgbGF5ZXIgeCBhbmQgeSBtYXkgYmUgPiBuXjIsIGFuZCA8IDAgaW4gdGhlIGNhc2VcbiAgICAgICAgICAgICAgICAvLyBvZiBhIHdyYXBhcm91bmQuIElmIG5vcm1hbGl6ZSBpcyB0cnVlLCBtb2QgdGhlIGNvb3Jkc1xuICAgICAgICAgICAgICAgIGNvb3JkcyA9IGdldE5vcm1hbGl6ZUNvb3Jkcyhjb29yZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvb3Jkcy56ICsgJzonICsgY29vcmRzLnggKyAnOicgKyBjb29yZHMueTtcbiAgICAgICAgfSxcblxuICAgICAgICBjb29yZEZyb21DYWNoZUtleTogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICB2YXIgYXJyID0ga2V5LnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KGFyclsxXSwgMTApLFxuICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KGFyclsyXSwgMTApLFxuICAgICAgICAgICAgICAgIHo6IHBhcnNlSW50KGFyclswXSwgMTApXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uVGlsZVVubG9hZDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIC8vIGNhY2hlIGtleSBmcm9tIGNvb3Jkc1xuICAgICAgICAgICAgdmFyIGtleSA9IHRoaXMuY2FjaGVLZXlGcm9tQ29vcmQoZXZlbnQuY29vcmRzKTtcbiAgICAgICAgICAgIC8vIGNhY2hlIGtleSBmcm9tIG5vcm1hbGl6ZWQgY29vcmRzXG4gICAgICAgICAgICB2YXIgbmtleSA9IHRoaXMuY2FjaGVLZXlGcm9tQ29vcmQoZXZlbnQuY29vcmRzLCB0cnVlKTtcbiAgICAgICAgICAgIC8vIGdldCBjYWNoZSBlbnRyeVxuICAgICAgICAgICAgdmFyIGNhY2hlZCA9IHRoaXMuX2NhY2hlW25rZXldO1xuICAgICAgICAgICAgLy8gY291bGQgdGhlIGJlIGNhc2Ugd2hlcmUgdGhlIGNhY2hlIGlzIGNsZWFyZWQgYmVmb3JlIHRpbGVzIGFyZVxuICAgICAgICAgICAgLy8gdW5sb2FkZWRcbiAgICAgICAgICAgIGlmICghY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSB0aWxlIGZyb20gdGhlIGNhY2hlXG4gICAgICAgICAgICBkZWxldGUgY2FjaGVkLnRpbGVzW2tleV07XG4gICAgICAgICAgICAvLyBkb24ndCByZW1vdmUgY2FjaGUgZW50cnkgdW5sZXNzIHRvIHRpbGVzIHVzZSBpdCBhbnltb3JlXG4gICAgICAgICAgICBpZiAoXy5rZXlzKGNhY2hlZC50aWxlcykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgLy8gbm8gbW9yZSB0aWxlcyB1c2UgdGhpcyBjYWNoZWQgZGF0YSwgc28gZGVsZXRlIGl0XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2NhY2hlW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DYWNoZUhpdDogZnVuY3Rpb24oLyp0aWxlLCBjYWNoZWQsIGNvb3JkcyovKSB7XG4gICAgICAgICAgICAvLyB0aGlzIGlzIGV4ZWN1dGVkIGZvciBhIHRpbGUgd2hvc2UgZGF0YSBpcyBhbHJlYWR5IGluIG1lbW9yeS5cbiAgICAgICAgICAgIC8vIHByb2JhYmx5IGp1c3QgZHJhdyB0aGUgdGlsZS5cbiAgICAgICAgfSxcblxuICAgICAgICBvbkNhY2hlTG9hZDogZnVuY3Rpb24oLyp0aWxlLCBjYWNoZWQsIGNvb3JkcyovKSB7XG4gICAgICAgICAgICAvLyB0aGlzIGlzIGV4ZWN1dGVkIHdoZW4gdGhlIGRhdGEgZm9yIGEgdGlsZSBpcyByZXRyZWl2ZWQgYW5kIGNhY2hlZFxuICAgICAgICAgICAgLy8gcHJvYmFibHkganVzdCBkcmF3IHRoZSB0aWxlLlxuICAgICAgICB9LFxuXG4gICAgICAgIG9uQ2FjaGVMb2FkRXh0cmVtYVVwZGF0ZTogZnVuY3Rpb24oLyp0aWxlLCBjYWNoZWQsIGNvb3JkcyovKSB7XG4gICAgICAgICAgICAvLyB0aGlzIGlzIGV4ZWN1dGVkIHdoZW4gdGhlIGRhdGEgZm9yIGEgdGlsZSBpcyByZXRyZWl2ZWQgYW5kIGlzXG4gICAgICAgICAgICAvLyBvdXRzaWRlIHRoZSBjdXJyZW50IGV4dHJlbWEuIHByb2JhYmx5IGp1c3QgcmVkcmF3IGFsbCB0aWxlcy5cbiAgICAgICAgfSxcblxuICAgICAgICBvblRpbGVMb2FkOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGNvb3JkcyA9IGV2ZW50LmNvb3JkcztcbiAgICAgICAgICAgIHZhciBuY29vcmRzID0gZ2V0Tm9ybWFsaXplQ29vcmRzKGV2ZW50LmNvb3Jkcyk7XG4gICAgICAgICAgICB2YXIgdGlsZSA9IGV2ZW50LnRpbGU7XG4gICAgICAgICAgICAvLyBjYWNoZSBrZXkgZnJvbSBjb29yZHNcbiAgICAgICAgICAgIHZhciBrZXkgPSB0aGlzLmNhY2hlS2V5RnJvbUNvb3JkKGV2ZW50LmNvb3Jkcyk7XG4gICAgICAgICAgICAvLyBjYWNoZSBrZXkgZnJvbSBub3JtYWxpemVkIGNvb3Jkc1xuICAgICAgICAgICAgdmFyIG5rZXkgPSB0aGlzLmNhY2hlS2V5RnJvbUNvb3JkKGV2ZW50LmNvb3JkcywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBjaGVjayBjYWNoZVxuICAgICAgICAgICAgdmFyIGNhY2hlZCA9IHRoaXMuX2NhY2hlW25rZXldO1xuICAgICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aWxlIHVuZGVyIG5vcm1hbGl6ZSBjb29yZHNcbiAgICAgICAgICAgICAgICBjYWNoZWQudGlsZXNba2V5XSA9IHRpbGU7XG4gICAgICAgICAgICAgICAgaWYgKCFjYWNoZWQuaXNQZW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhY2hlIGVudHJ5IGFscmVhZHkgZXhpc3RzXG4gICAgICAgICAgICAgICAgICAgIHNlbGYub25DYWNoZUhpdCh0aWxlLCBjYWNoZWQsIGNvb3Jkcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYSBjYWNoZSBlbnRyeVxuICAgICAgICAgICAgICAgIHRoaXMuX2NhY2hlW25rZXldID0ge1xuICAgICAgICAgICAgICAgICAgICBpc1BlbmRpbmc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHRpbGVzOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogbnVsbFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgLy8gYWRkIHRpbGUgdG8gdGhlIGNhY2hlIGVudHJ5XG4gICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVbbmtleV0udGlsZXNba2V5XSA9IHRpbGU7XG4gICAgICAgICAgICAgICAgLy8gcmVxdWVzdCB0aGUgdGlsZVxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdFRpbGUobmNvb3JkcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FjaGVkID0gc2VsZi5fY2FjaGVbbmtleV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghY2FjaGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aWxlIGlzIG5vIGxvbmdlciBiZWluZyB0cmFja2VkLCBpZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYWNoZWQuaXNQZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNhY2hlZC5kYXRhID0gZGF0YTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHRoZSBleHRyZW1hXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIHNlbGYudXBkYXRlRXh0cmVtYShkYXRhKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXh0cmVtYSBjaGFuZ2VkXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9uQ2FjaGVMb2FkRXh0cmVtYVVwZGF0ZSh0aWxlLCBjYWNoZWQsIGNvb3Jkcyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkYXRhIGlzIGxvYWRlZCBpbnRvIGNhY2hlXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9uQ2FjaGVMb2FkKHRpbGUsIGNhY2hlZCwgY29vcmRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IExpdmU7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4vQmFzZScpO1xuXG4gICAgdmFyIFBlbmRpbmcgPSBCYXNlLmV4dGVuZCh7XG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgdW5sb2FkSW52aXNpYmxlVGlsZXM6IHRydWUsXG4gICAgICAgICAgICB6SW5kZXg6IDUwMDBcbiAgICAgICAgfSxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLl9wZW5kaW5nVGlsZXMgPSB7fTtcbiAgICAgICAgICAgIC8vIHNldCByZW5kZXJlclxuICAgICAgICAgICAgaWYgKCFvcHRpb25zLnJlbmRlcmVyQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnTm8gYHJlbmRlcmVyQ2xhc3NgIG9wdGlvbiBmb3VuZC4nO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyByZWN1cnNpdmVseSBleHRlbmRcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCB0aGlzLCBvcHRpb25zLnJlbmRlcmVyQ2xhc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gc2V0IG9wdGlvbnNcbiAgICAgICAgICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbmNyZW1lbnQ6IGZ1bmN0aW9uKGNvb3JkKSB7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IHRoaXMuX2dldFRpbGVIYXNoKGNvb3JkKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9wZW5kaW5nVGlsZXNbaGFzaF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdUaWxlc1toYXNoXSA9IDE7XG4gICAgICAgICAgICAgICAgdmFyIHRpbGVzID0gdGhpcy5fZ2V0VGlsZXNXaXRoSGFzaChoYXNoKTtcbiAgICAgICAgICAgICAgICB0aWxlcy5mb3JFYWNoKGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlVGlsZShjb29yZCwgdGlsZSk7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdUaWxlc1toYXNoXSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGRlY3JlbWVudDogZnVuY3Rpb24oY29vcmQpIHtcbiAgICAgICAgICAgIHZhciBoYXNoID0gdGhpcy5fZ2V0VGlsZUhhc2goY29vcmQpO1xuICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1RpbGVzW2hhc2hdLS07XG4gICAgICAgICAgICBpZiAodGhpcy5fcGVuZGluZ1RpbGVzW2hhc2hdID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX3BlbmRpbmdUaWxlc1toYXNoXTtcbiAgICAgICAgICAgICAgICB2YXIgdGlsZXMgPSB0aGlzLl9nZXRUaWxlc1dpdGhIYXNoKGhhc2gpO1xuICAgICAgICAgICAgICAgIHRpbGVzLmZvckVhY2goZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl91cGRhdGVUaWxlKGNvb3JkLCB0aWxlKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0VGlsZUNsYXNzOiBmdW5jdGlvbihoYXNoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2xlYWZsZXQtcGVuZGluZy0nICsgaGFzaDtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0VGlsZUhhc2g6IGZ1bmN0aW9uKGNvb3JkKSB7XG4gICAgICAgICAgICByZXR1cm4gY29vcmQueiArICctJyArIGNvb3JkLnggKyAnLScgKyBjb29yZC55O1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRUaWxlc1dpdGhIYXNoOiBmdW5jdGlvbihoYXNoKSB7XG4gICAgICAgICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5fZ2V0VGlsZUNsYXNzKGhhc2gpO1xuICAgICAgICAgICAgdmFyIHRpbGVzID0gW107XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikuZmluZCgnLicgKyBjbGFzc05hbWUpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGlsZXMucHVzaCh0aGlzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRpbGVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF91cGRhdGVUaWxlOiBmdW5jdGlvbihjb29yZCwgdGlsZSkge1xuICAgICAgICAgICAgLy8gZ2V0IGhhc2hcbiAgICAgICAgICAgIHZhciBoYXNoID0gdGhpcy5fZ2V0VGlsZUhhc2goY29vcmQpO1xuICAgICAgICAgICAgJCh0aWxlKS5hZGRDbGFzcyh0aGlzLl9nZXRUaWxlQ2xhc3MoaGFzaCkpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BlbmRpbmdUaWxlc1toYXNoXSA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlclRpbGUodGlsZSwgY29vcmQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aWxlLmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVRpbGU6IGZ1bmN0aW9uKGNvb3JkKSB7XG4gICAgICAgICAgICAvLyBjcmVhdGUgYSA8ZGl2PiBlbGVtZW50IGZvciBkcmF3aW5nXG4gICAgICAgICAgICB2YXIgdGlsZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2RpdicsICdsZWFmbGV0LXRpbGUnKTtcbiAgICAgICAgICAgIC8vIGdldCBoYXNoXG4gICAgICAgICAgICB0aGlzLl91cGRhdGVUaWxlKGNvb3JkLCB0aWxlKTtcbiAgICAgICAgICAgIC8vIHBhc3MgdGlsZSB0byBjYWxsYmFja1xuICAgICAgICAgICAgcmV0dXJuIHRpbGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gUGVuZGluZztcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIGRlYnVnIHRpbGUgbGF5ZXJcbiAgICB2YXIgRGVidWcgPSByZXF1aXJlKCcuL2NvcmUvRGVidWcnKTtcblxuICAgIC8vIHBlbmRpbmcgdGlsZSBsYXllclxuICAgIHZhciBQZW5kaW5nID0gcmVxdWlyZSgnLi9jb3JlL1BlbmRpbmcnKTtcblxuICAgIC8vIGltYWdlIGxheWVyXG4gICAgdmFyIEltYWdlID0gcmVxdWlyZSgnLi9jb3JlL0ltYWdlJyk7XG5cbiAgICAvLyBsaXZlIHRpbGUgbGF5ZXJzXG4gICAgdmFyIEhlYXRtYXAgPSByZXF1aXJlKCcuL3R5cGUvSGVhdG1hcCcpO1xuICAgIHZhciBUb3BUcmFpbHMgPSByZXF1aXJlKCcuL3R5cGUvVG9wVHJhaWxzJyk7XG4gICAgdmFyIFRvcENvdW50ID0gcmVxdWlyZSgnLi90eXBlL1RvcENvdW50Jyk7XG4gICAgdmFyIFRvcEZyZXF1ZW5jeSA9IHJlcXVpcmUoJy4vdHlwZS9Ub3BGcmVxdWVuY3knKTtcbiAgICB2YXIgVG9waWNDb3VudCA9IHJlcXVpcmUoJy4vdHlwZS9Ub3BpY0NvdW50Jyk7XG4gICAgdmFyIFRvcGljRnJlcXVlbmN5ID0gcmVxdWlyZSgnLi90eXBlL1RvcGljRnJlcXVlbmN5Jyk7XG4gICAgdmFyIFByZXZpZXcgPSByZXF1aXJlKCcuL3R5cGUvUHJldmlldycpO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIERlYnVnOiBEZWJ1ZyxcbiAgICAgICAgUGVuZGluZzogUGVuZGluZyxcbiAgICAgICAgSW1hZ2U6IEltYWdlLFxuICAgICAgICBIZWF0bWFwOiBIZWF0bWFwLFxuICAgICAgICBUb3BDb3VudDogVG9wQ291bnQsXG4gICAgICAgIFRvcFRyYWlsczogVG9wVHJhaWxzLFxuICAgICAgICBUb3BGcmVxdWVuY3k6IFRvcEZyZXF1ZW5jeSxcbiAgICAgICAgVG9waWNDb3VudDogVG9waWNDb3VudCxcbiAgICAgICAgVG9waWNGcmVxdWVuY3k6IFRvcGljRnJlcXVlbmN5LFxuICAgICAgICBQcmV2aWV3OiBQcmV2aWV3XG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGZ1bmN0aW9uIHJnYjJsYWIocmdiKSB7XG4gICAgICAgIHZhciByID0gcmdiWzBdID4gMC4wNDA0NSA/IE1hdGgucG93KChyZ2JbMF0gKyAwLjA1NSkgLyAxLjA1NSwgMi40KSA6IHJnYlswXSAvIDEyLjkyO1xuICAgICAgICB2YXIgZyA9IHJnYlsxXSA+IDAuMDQwNDUgPyBNYXRoLnBvdygocmdiWzFdICsgMC4wNTUpIC8gMS4wNTUsIDIuNCkgOiByZ2JbMV0gLyAxMi45MjtcbiAgICAgICAgdmFyIGIgPSByZ2JbMl0gPiAwLjA0MDQ1ID8gTWF0aC5wb3coKHJnYlsyXSArIDAuMDU1KSAvIDEuMDU1LCAyLjQpIDogcmdiWzJdIC8gMTIuOTI7XG4gICAgICAgIC8vT2JzZXJ2ZXIuID0gMsKwLCBJbGx1bWluYW50ID0gRDY1XG4gICAgICAgIHZhciB4ID0gciAqIDAuNDEyNDU2NCArIGcgKiAwLjM1NzU3NjEgKyBiICogMC4xODA0Mzc1O1xuICAgICAgICB2YXIgeSA9IHIgKiAwLjIxMjY3MjkgKyBnICogMC43MTUxNTIyICsgYiAqIDAuMDcyMTc1MDtcbiAgICAgICAgdmFyIHogPSByICogMC4wMTkzMzM5ICsgZyAqIDAuMTE5MTkyMCArIGIgKiAwLjk1MDMwNDE7XG4gICAgICAgIHggPSB4IC8gMC45NTA0NzsgLy8gT2JzZXJ2ZXI9IDLCsCwgSWxsdW1pbmFudD0gRDY1XG4gICAgICAgIHkgPSB5IC8gMS4wMDAwMDtcbiAgICAgICAgeiA9IHogLyAxLjA4ODgzO1xuICAgICAgICB4ID0geCA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeCwgMSAvIDMpIDogKDcuNzg3MDM3ICogeCkgKyAoMTYgLyAxMTYpO1xuICAgICAgICB5ID0geSA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeSwgMSAvIDMpIDogKDcuNzg3MDM3ICogeSkgKyAoMTYgLyAxMTYpO1xuICAgICAgICB6ID0geiA+IDAuMDA4ODU2ID8gTWF0aC5wb3coeiwgMSAvIDMpIDogKDcuNzg3MDM3ICogeikgKyAoMTYgLyAxMTYpO1xuICAgICAgICByZXR1cm4gWygxMTYgKiB5KSAtIDE2LFxuICAgICAgICAgICAgNTAwICogKHggLSB5KSxcbiAgICAgICAgICAgIDIwMCAqICh5IC0geiksXG4gICAgICAgICAgICByZ2JbM11dO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxhYjJyZ2IobGFiKSB7XG4gICAgICAgIHZhciB5ID0gKGxhYlswXSArIDE2KSAvIDExNjtcbiAgICAgICAgdmFyIHggPSB5ICsgbGFiWzFdIC8gNTAwO1xuICAgICAgICB2YXIgeiA9IHkgLSBsYWJbMl0gLyAyMDA7XG4gICAgICAgIHggPSB4ID4gMC4yMDY4OTMwMzQgPyB4ICogeCAqIHggOiAoeCAtIDQgLyAyOSkgLyA3Ljc4NzAzNztcbiAgICAgICAgeSA9IHkgPiAwLjIwNjg5MzAzNCA/IHkgKiB5ICogeSA6ICh5IC0gNCAvIDI5KSAvIDcuNzg3MDM3O1xuICAgICAgICB6ID0geiA+IDAuMjA2ODkzMDM0ID8geiAqIHogKiB6IDogKHogLSA0IC8gMjkpIC8gNy43ODcwMzc7XG4gICAgICAgIHggPSB4ICogMC45NTA0NzsgLy8gT2JzZXJ2ZXI9IDLCsCwgSWxsdW1pbmFudD0gRDY1XG4gICAgICAgIHkgPSB5ICogMS4wMDAwMDtcbiAgICAgICAgeiA9IHogKiAxLjA4ODgzO1xuICAgICAgICB2YXIgciA9IHggKiAzLjI0MDQ1NDIgKyB5ICogLTEuNTM3MTM4NSArIHogKiAtMC40OTg1MzE0O1xuICAgICAgICB2YXIgZyA9IHggKiAtMC45NjkyNjYwICsgeSAqIDEuODc2MDEwOCArIHogKiAwLjA0MTU1NjA7XG4gICAgICAgIHZhciBiID0geCAqIDAuMDU1NjQzNCArIHkgKiAtMC4yMDQwMjU5ICsgeiAqIDEuMDU3MjI1MjtcbiAgICAgICAgciA9IHIgPiAwLjAwMzA0ID8gMS4wNTUgKiBNYXRoLnBvdyhyLCAxIC8gMi40KSAtIDAuMDU1IDogMTIuOTIgKiByO1xuICAgICAgICBnID0gZyA+IDAuMDAzMDQgPyAxLjA1NSAqIE1hdGgucG93KGcsIDEgLyAyLjQpIC0gMC4wNTUgOiAxMi45MiAqIGc7XG4gICAgICAgIGIgPSBiID4gMC4wMDMwNCA/IDEuMDU1ICogTWF0aC5wb3coYiwgMSAvIDIuNCkgLSAwLjA1NSA6IDEyLjkyICogYjtcbiAgICAgICAgcmV0dXJuIFtNYXRoLm1heChNYXRoLm1pbihyLCAxKSwgMCksIE1hdGgubWF4KE1hdGgubWluKGcsIDEpLCAwKSwgTWF0aC5tYXgoTWF0aC5taW4oYiwgMSksIDApLCBsYWJbM11dO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3RhbmNlKGMxLCBjMikge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KFxuICAgICAgICAgICAgKGMxWzBdIC0gYzJbMF0pICogKGMxWzBdIC0gYzJbMF0pICtcbiAgICAgICAgICAgIChjMVsxXSAtIGMyWzFdKSAqIChjMVsxXSAtIGMyWzFdKSArXG4gICAgICAgICAgICAoYzFbMl0gLSBjMlsyXSkgKiAoYzFbMl0gLSBjMlsyXSkgK1xuICAgICAgICAgICAgKGMxWzNdIC0gYzJbM10pICogKGMxWzNdIC0gYzJbM10pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIEdSQURJRU5UX1NURVBTID0gMjAwO1xuXG4gICAgLy8gSW50ZXJwb2xhdGUgYmV0d2VlbiBhIHNldCBvZiBjb2xvcnMgdXNpbmcgZXZlbiBwZXJjZXB0dWFsIGRpc3RhbmNlIGFuZCBpbnRlcnBvbGF0aW9uIGluIENJRSBMKmEqYiogc3BhY2VcbiAgICB2YXIgYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUgPSBmdW5jdGlvbihiYXNlQ29sb3JzKSB7XG4gICAgICAgIHZhciBvdXRwdXRHcmFkaWVudCA9IFtdO1xuICAgICAgICAvLyBDYWxjdWxhdGUgcGVyY2VwdHVhbCBzcHJlYWQgaW4gTCphKmIqIHNwYWNlXG4gICAgICAgIHZhciBsYWJzID0gXy5tYXAoYmFzZUNvbG9ycywgZnVuY3Rpb24oY29sb3IpIHtcbiAgICAgICAgICAgIHJldHVybiByZ2IybGFiKFtjb2xvclswXSAvIDI1NSwgY29sb3JbMV0gLyAyNTUsIGNvbG9yWzJdIC8gMjU1LCBjb2xvclszXSAvIDI1NV0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGRpc3RhbmNlcyA9IF8ubWFwKGxhYnMsIGZ1bmN0aW9uKGNvbG9yLCBpbmRleCwgY29sb3JzKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5kZXggPiAwID8gZGlzdGFuY2UoY29sb3IsIGNvbG9yc1tpbmRleCAtIDFdKSA6IDA7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBDYWxjdWxhdGUgY3VtdWxhdGl2ZSBkaXN0YW5jZXMgaW4gWzAsMV1cbiAgICAgICAgdmFyIHRvdGFsRGlzdGFuY2UgPSBfLnJlZHVjZShkaXN0YW5jZXMsIGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhICsgYjtcbiAgICAgICAgfSwgMCk7XG4gICAgICAgIGRpc3RhbmNlcyA9IF8ubWFwKGRpc3RhbmNlcywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGQgLyB0b3RhbERpc3RhbmNlO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIGRpc3RhbmNlVHJhdmVyc2VkID0gMDtcbiAgICAgICAgdmFyIGtleSA9IDA7XG4gICAgICAgIHZhciBwcm9ncmVzcztcbiAgICAgICAgdmFyIHN0ZXBQcm9ncmVzcztcbiAgICAgICAgdmFyIHJnYjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBHUkFESUVOVF9TVEVQUzsgaSsrKSB7XG4gICAgICAgICAgICBwcm9ncmVzcyA9IGkgLyAoR1JBRElFTlRfU1RFUFMgLSAxKTtcbiAgICAgICAgICAgIGlmIChwcm9ncmVzcyA+IGRpc3RhbmNlVHJhdmVyc2VkICsgZGlzdGFuY2VzW2tleSArIDFdICYmIGtleSArIDEgPCBsYWJzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICBrZXkgKz0gMTtcbiAgICAgICAgICAgICAgICBkaXN0YW5jZVRyYXZlcnNlZCArPSBkaXN0YW5jZXNba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0ZXBQcm9ncmVzcyA9IChwcm9ncmVzcyAtIGRpc3RhbmNlVHJhdmVyc2VkKSAvIGRpc3RhbmNlc1trZXkgKyAxXTtcbiAgICAgICAgICAgIHJnYiA9IGxhYjJyZ2IoW1xuICAgICAgICAgICAgICAgIGxhYnNba2V5XVswXSArIChsYWJzW2tleSArIDFdWzBdIC0gbGFic1trZXldWzBdKSAqIHN0ZXBQcm9ncmVzcyxcbiAgICAgICAgICAgICAgICBsYWJzW2tleV1bMV0gKyAobGFic1trZXkgKyAxXVsxXSAtIGxhYnNba2V5XVsxXSkgKiBzdGVwUHJvZ3Jlc3MsXG4gICAgICAgICAgICAgICAgbGFic1trZXldWzJdICsgKGxhYnNba2V5ICsgMV1bMl0gLSBsYWJzW2tleV1bMl0pICogc3RlcFByb2dyZXNzLFxuICAgICAgICAgICAgICAgIGxhYnNba2V5XVszXSArIChsYWJzW2tleSArIDFdWzNdIC0gbGFic1trZXldWzNdKSAqIHN0ZXBQcm9ncmVzc1xuICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICBvdXRwdXRHcmFkaWVudC5wdXNoKFtcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKHJnYlswXSAqIDI1NSksXG4gICAgICAgICAgICAgICAgTWF0aC5yb3VuZChyZ2JbMV0gKiAyNTUpLFxuICAgICAgICAgICAgICAgIE1hdGgucm91bmQocmdiWzJdICogMjU1KSxcbiAgICAgICAgICAgICAgICBNYXRoLnJvdW5kKHJnYlszXSAqIDI1NSlcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXRHcmFkaWVudDtcbiAgICB9O1xuXG4gICAgdmFyIENPT0wgPSBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZShbXG4gICAgICAgIFsweDA0LCAweDIwLCAweDQwLCAweDUwXSxcbiAgICAgICAgWzB4MDgsIDB4NDAsIDB4ODEsIDB4N2ZdLFxuICAgICAgICBbMHgwOCwgMHg2OCwgMHhhYywgMHhmZl0sXG4gICAgICAgIFsweDJiLCAweDhjLCAweGJlLCAweGZmXSxcbiAgICAgICAgWzB4NGUsIDB4YjMsIDB4ZDMsIDB4ZmZdLFxuICAgICAgICBbMHg3YiwgMHhjYywgMHhjNCwgMHhmZl0sXG4gICAgICAgIFsweGE4LCAweGRkLCAweGI1LCAweGZmXSxcbiAgICAgICAgWzB4Y2MsIDB4ZWIsIDB4YzUsIDB4ZmZdLFxuICAgICAgICBbMHhlMCwgMHhmMywgMHhkYiwgMHhmZl0sXG4gICAgICAgIFsweGY3LCAweGZjLCAweGYwLCAweGZmXVxuICAgIF0pO1xuXG4gICAgdmFyIEhPVCA9IGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlKFtcbiAgICAgICAgWzB4NDAsIDB4MDAsIDB4MTMsIDB4NTBdLFxuICAgICAgICBbMHg4MCwgMHgwMCwgMHgyNiwgMHg3Zl0sXG4gICAgICAgIFsweGJkLCAweDAwLCAweDI2LCAweGZmXSxcbiAgICAgICAgWzB4ZTMsIDB4MWEsIDB4MWMsIDB4ZmZdLFxuICAgICAgICBbMHhmYywgMHg0ZSwgMHgyYSwgMHhmZl0sXG4gICAgICAgIFsweGZkLCAweDhkLCAweDNjLCAweGZmXSxcbiAgICAgICAgWzB4ZmUsIDB4YjIsIDB4NGMsIDB4ZmZdLFxuICAgICAgICBbMHhmZSwgMHhkOSwgMHg3NiwgMHhmZl0sXG4gICAgICAgIFsweGZmLCAweGVkLCAweGEwLCAweGZmXVxuICAgIF0pO1xuXG4gICAgdmFyIFZFUkRBTlQgPSBidWlsZFBlcmNlcHR1YWxMb29rdXBUYWJsZShbXG4gICAgICAgIFsweDAwLCAweDQwLCAweDI2LCAweDUwXSxcbiAgICAgICAgWzB4MDAsIDB4NWEsIDB4MzIsIDB4N2ZdLFxuICAgICAgICBbMHgyMywgMHg4NCwgMHg0MywgMHhmZl0sXG4gICAgICAgIFsweDQxLCAweGFiLCAweDVkLCAweGZmXSxcbiAgICAgICAgWzB4NzgsIDB4YzYsIDB4NzksIDB4ZmZdLFxuICAgICAgICBbMHhhZCwgMHhkZCwgMHg4ZSwgMHhmZl0sXG4gICAgICAgIFsweGQ5LCAweGYwLCAweGEzLCAweGZmXSxcbiAgICAgICAgWzB4ZjcsIDB4ZmMsIDB4YjksIDB4ZmZdLFxuICAgICAgICBbMHhmZiwgMHhmZiwgMHhlNSwgMHhmZl1cbiAgICBdKTtcblxuICAgIHZhciBTUEVDVFJBTCA9IGJ1aWxkUGVyY2VwdHVhbExvb2t1cFRhYmxlKFtcbiAgICAgICAgWzB4MjYsIDB4MWEsIDB4NDAsIDB4NTBdLFxuICAgICAgICBbMHg0NCwgMHgyZiwgMHg3MiwgMHg3Zl0sXG4gICAgICAgIFsweGUxLCAweDJiLCAweDAyLCAweGZmXSxcbiAgICAgICAgWzB4MDIsIDB4ZGMsIDB4MDEsIDB4ZmZdLFxuICAgICAgICBbMHhmZiwgMHhkMiwgMHgwMiwgMHhmZl0sXG4gICAgICAgIFsweGZmLCAweGZmLCAweGZmLCAweGZmXVxuICAgIF0pO1xuXG4gICAgdmFyIFRFTVBFUkFUVVJFID0gYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUoW1xuICAgICAgICBbMHgwMCwgMHgxNiwgMHg0MCwgMHg1MF0sXG4gICAgICAgIFsweDAwLCAweDM5LCAweDY2LCAweDdmXSwgLy9ibHVlXG4gICAgICAgIFsweDMxLCAweDNkLCAweDY2LCAweGZmXSwgLy9wdXJwbGVcbiAgICAgICAgWzB4ZTEsIDB4MmIsIDB4MDIsIDB4ZmZdLCAvL3JlZFxuICAgICAgICBbMHhmZiwgMHhkMiwgMHgwMiwgMHhmZl0sIC8veWVsbG93XG4gICAgICAgIFsweGZmLCAweGZmLCAweGZmLCAweGZmXSAvL3doaXRlXG4gICAgXSk7XG5cbiAgICB2YXIgR1JFWVNDQUxFID0gYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUoW1xuICAgICAgICBbMHgwMCwgMHgwMCwgMHgwMCwgMHg3Zl0sXG4gICAgICAgIFsweDQwLCAweDQwLCAweDQwLCAweGZmXSxcbiAgICAgICAgWzB4ZmYsIDB4ZmYsIDB4ZmYsIDB4ZmZdXG4gICAgXSk7XG5cbiAgICB2YXIgUE9MQVJfSE9UID0gYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUoW1xuICAgICAgICBbIDB4ZmYsIDB4NDQsIDB4MDAsIDB4ZmYgXSxcbiAgICAgICAgWyAweGJkLCAweGJkLCAweGJkLCAweGIwIF1cbiAgICBdKTtcblxuICAgIHZhciBQT0xBUl9DT0xEID0gYnVpbGRQZXJjZXB0dWFsTG9va3VwVGFibGUoW1xuICAgICAgICBbIDB4YmQsIDB4YmQsIDB4YmQsIDB4YjAgXSxcbiAgICAgICAgWyAweDMyLCAweGE1LCAweGY5LCAweGZmIF1cbiAgICBdKTtcblxuICAgIHZhciBidWlsZExvb2t1cEZ1bmN0aW9uID0gZnVuY3Rpb24oUkFNUCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2NhbGVkVmFsdWUsIGluQ29sb3IpIHtcbiAgICAgICAgICAgIHZhciBjb2xvciA9IFJBTVBbTWF0aC5mbG9vcihzY2FsZWRWYWx1ZSAqIChSQU1QLmxlbmd0aCAtIDEpKV07XG4gICAgICAgICAgICBpbkNvbG9yWzBdID0gY29sb3JbMF07XG4gICAgICAgICAgICBpbkNvbG9yWzFdID0gY29sb3JbMV07XG4gICAgICAgICAgICBpbkNvbG9yWzJdID0gY29sb3JbMl07XG4gICAgICAgICAgICBpbkNvbG9yWzNdID0gY29sb3JbM107XG4gICAgICAgICAgICByZXR1cm4gaW5Db2xvcjtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIENvbG9yUmFtcCA9IHtcbiAgICAgICAgY29vbDogYnVpbGRMb29rdXBGdW5jdGlvbihDT09MKSxcbiAgICAgICAgaG90OiBidWlsZExvb2t1cEZ1bmN0aW9uKEhPVCksXG4gICAgICAgIHZlcmRhbnQ6IGJ1aWxkTG9va3VwRnVuY3Rpb24oVkVSREFOVCksXG4gICAgICAgIHNwZWN0cmFsOiBidWlsZExvb2t1cEZ1bmN0aW9uKFNQRUNUUkFMKSxcbiAgICAgICAgdGVtcGVyYXR1cmU6IGJ1aWxkTG9va3VwRnVuY3Rpb24oVEVNUEVSQVRVUkUpLFxuICAgICAgICBncmV5OiBidWlsZExvb2t1cEZ1bmN0aW9uKEdSRVlTQ0FMRSksXG4gICAgICAgIHBvbGFyOiBidWlsZExvb2t1cEZ1bmN0aW9uKFBPTEFSX0hPVC5jb25jYXQoUE9MQVJfQ09MRCkpXG4gICAgfTtcblxuICAgIHZhciBzZXRDb2xvclJhbXAgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHZhciBmdW5jID0gQ29sb3JSYW1wW3R5cGUudG9Mb3dlckNhc2UoKV07XG4gICAgICAgIGlmIChmdW5jKSB7XG4gICAgICAgICAgICB0aGlzLl9jb2xvclJhbXAgPSBmdW5jO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0Q29sb3JSYW1wID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb2xvclJhbXA7XG4gICAgfTtcblxuICAgIHZhciBpbml0aWFsaXplID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2NvbG9yUmFtcCA9IENvbG9yUmFtcC52ZXJkYW50O1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgaW5pdGlhbGl6ZTogaW5pdGlhbGl6ZSxcbiAgICAgICAgc2V0Q29sb3JSYW1wOiBzZXRDb2xvclJhbXAsXG4gICAgICAgIGdldENvbG9yUmFtcDogZ2V0Q29sb3JSYW1wXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBTSUdNT0lEX1NDQUxFID0gMC4xNTtcblxuICAgIC8vIGxvZzEwXG5cbiAgICBmdW5jdGlvbiBsb2cxMFRyYW5zZm9ybSh2YWwsIG1pbiwgbWF4KSB7XG4gICAgICAgIHZhciBsb2dNaW4gPSBNYXRoLmxvZzEwKG1pbiB8fCAxKTtcbiAgICAgICAgdmFyIGxvZ01heCA9IE1hdGgubG9nMTAobWF4IHx8IDEpO1xuICAgICAgICB2YXIgbG9nVmFsID0gTWF0aC5sb2cxMCh2YWwgfHwgMSk7XG4gICAgICAgIHJldHVybiAobG9nVmFsIC0gbG9nTWluKSAvICgobG9nTWF4IC0gbG9nTWluKSB8fCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbnZlcnNlTG9nMTBUcmFuc2Zvcm0obnZhbCwgbWluLCBtYXgpIHtcbiAgICAgICAgdmFyIGxvZ01pbiA9IE1hdGgubG9nMTAobWluIHx8IDEpO1xuICAgICAgICB2YXIgbG9nTWF4ID0gTWF0aC5sb2cxMChtYXggfHwgMSk7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdygxMCwgKG52YWwgKiBsb2dNYXggLSBudmFsICogbG9nTWluKSArIGxvZ01pbik7XG4gICAgfVxuXG4gICAgLy8gc2lnbW9pZFxuXG4gICAgZnVuY3Rpb24gc2lnbW9pZFRyYW5zZm9ybSh2YWwsIG1pbiwgbWF4KSB7XG4gICAgICAgIHZhciBhYnNNaW4gPSBNYXRoLmFicyhtaW4pO1xuICAgICAgICB2YXIgYWJzTWF4ID0gTWF0aC5hYnMobWF4KTtcbiAgICAgICAgdmFyIGRpc3RhbmNlID0gTWF0aC5tYXgoYWJzTWluLCBhYnNNYXgpO1xuICAgICAgICB2YXIgc2NhbGVkVmFsID0gdmFsIC8gKFNJR01PSURfU0NBTEUgKiBkaXN0YW5jZSk7XG4gICAgICAgIHJldHVybiAxIC8gKDEgKyBNYXRoLmV4cCgtc2NhbGVkVmFsKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW52ZXJzZVNpZ21vaWRUcmFuc2Zvcm0obnZhbCwgbWluLCBtYXgpIHtcbiAgICAgICAgdmFyIGFic01pbiA9IE1hdGguYWJzKG1pbik7XG4gICAgICAgIHZhciBhYnNNYXggPSBNYXRoLmFicyhtYXgpO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLm1heChhYnNNaW4sIGFic01heCk7XG4gICAgICAgIGlmIChudmFsID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gLWRpc3RhbmNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChudmFsID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gZGlzdGFuY2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hdGgubG9nKCgxL252YWwpIC0gMSkgKiAtKFNJR01PSURfU0NBTEUgKiBkaXN0YW5jZSk7XG4gICAgfVxuXG4gICAgLy8gbGluZWFyXG5cbiAgICBmdW5jdGlvbiBsaW5lYXJUcmFuc2Zvcm0odmFsLCBtaW4sIG1heCkge1xuICAgICAgICB2YXIgcmFuZ2UgPSBtYXggLSBtaW47XG4gICAgICAgIHJldHVybiAodmFsIC0gbWluKSAvIHJhbmdlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGludmVyc2VMaW5lYXJUcmFuc2Zvcm0obnZhbCwgbWluLCBtYXgpIHtcbiAgICAgICAgdmFyIHJhbmdlID0gbWF4IC0gbWluO1xuICAgICAgICByZXR1cm4gbWluICsgbnZhbCAqIHJhbmdlO1xuICAgIH1cblxuICAgIHZhciBUcmFuc2Zvcm0gPSB7XG4gICAgICAgIGxpbmVhcjogbGluZWFyVHJhbnNmb3JtLFxuICAgICAgICBsb2cxMDogbG9nMTBUcmFuc2Zvcm0sXG4gICAgICAgIHNpZ21vaWQ6IHNpZ21vaWRUcmFuc2Zvcm1cbiAgICB9O1xuXG4gICAgdmFyIEludmVyc2UgPSB7XG4gICAgICAgIGxpbmVhcjogaW52ZXJzZUxpbmVhclRyYW5zZm9ybSxcbiAgICAgICAgbG9nMTA6IGludmVyc2VMb2cxMFRyYW5zZm9ybSxcbiAgICAgICAgc2lnbW9pZDogaW52ZXJzZVNpZ21vaWRUcmFuc2Zvcm1cbiAgICB9O1xuXG4gICAgdmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcmFuZ2UgPSB7XG4gICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICBtYXg6IDFcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fdHJhbnNmb3JtRnVuYyA9IGxvZzEwVHJhbnNmb3JtO1xuICAgICAgICB0aGlzLl9pbnZlcnNlRnVuYyA9IGludmVyc2VMb2cxMFRyYW5zZm9ybTtcbiAgICB9O1xuXG4gICAgdmFyIHNldFRyYW5zZm9ybUZ1bmMgPSBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHZhciBmdW5jID0gdHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB0aGlzLl90cmFuc2Zvcm1GdW5jID0gVHJhbnNmb3JtW2Z1bmNdO1xuICAgICAgICB0aGlzLl9pbnZlcnNlRnVuYyA9IEludmVyc2VbZnVuY107XG4gICAgfTtcblxuICAgIHZhciBzZXRWYWx1ZVJhbmdlID0gZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgdGhpcy5fcmFuZ2UubWluID0gcmFuZ2UubWluO1xuICAgICAgICB0aGlzLl9yYW5nZS5tYXggPSByYW5nZS5tYXg7XG4gICAgfTtcblxuICAgIHZhciBnZXRWYWx1ZVJhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yYW5nZTtcbiAgICB9O1xuXG4gICAgdmFyIGludGVycG9sYXRlVG9SYW5nZSA9IGZ1bmN0aW9uKG52YWwpIHtcbiAgICAgICAgLy8gaW50ZXJwb2xhdGUgYmV0d2VlbiB0aGUgZmlsdGVyIHJhbmdlXG4gICAgICAgIHZhciByTWluID0gdGhpcy5fcmFuZ2UubWluO1xuICAgICAgICB2YXIgck1heCA9IHRoaXMuX3JhbmdlLm1heDtcbiAgICAgICAgdmFyIHJ2YWwgPSAobnZhbCAtIHJNaW4pIC8gKHJNYXggLSByTWluKTtcbiAgICAgICAgLy8gZW5zdXJlIG91dHB1dCBpcyBbMDoxXVxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcnZhbCkpO1xuICAgIH07XG5cbiAgICB2YXIgdHJhbnNmb3JtVmFsdWUgPSBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgLy8gY2xhbXAgdGhlIHZhbHVlIGJldHdlZW4gdGhlIGV4dHJlbWUgKHNob3VsZG4ndCBiZSBuZWNlc3NhcnkpXG4gICAgICAgIHZhciBtaW4gPSB0aGlzLl9leHRyZW1hLm1pbjtcbiAgICAgICAgdmFyIG1heCA9IHRoaXMuX2V4dHJlbWEubWF4O1xuICAgICAgICB2YXIgY2xhbXBlZCA9IE1hdGgubWF4KE1hdGgubWluKHZhbCwgbWF4KSwgbWluKTtcbiAgICAgICAgLy8gbm9ybWFsaXplIHRoZSB2YWx1ZVxuICAgICAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtRnVuYyhjbGFtcGVkLCBtaW4sIG1heCk7XG4gICAgfTtcblxuICAgIHZhciB1bnRyYW5zZm9ybVZhbHVlID0gZnVuY3Rpb24obnZhbCkge1xuICAgICAgICB2YXIgbWluID0gdGhpcy5fZXh0cmVtYS5taW47XG4gICAgICAgIHZhciBtYXggPSB0aGlzLl9leHRyZW1hLm1heDtcbiAgICAgICAgLy8gY2xhbXAgdGhlIHZhbHVlIGJldHdlZW4gdGhlIGV4dHJlbWUgKHNob3VsZG4ndCBiZSBuZWNlc3NhcnkpXG4gICAgICAgIHZhciBjbGFtcGVkID0gTWF0aC5tYXgoTWF0aC5taW4obnZhbCwgMSksIDApO1xuICAgICAgICAvLyB1bm5vcm1hbGl6ZSB0aGUgdmFsdWVcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludmVyc2VGdW5jKGNsYW1wZWQsIG1pbiwgbWF4KTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGluaXRpYWxpemU6IGluaXRpYWxpemUsXG4gICAgICAgIHNldFRyYW5zZm9ybUZ1bmM6IHNldFRyYW5zZm9ybUZ1bmMsXG4gICAgICAgIHNldFZhbHVlUmFuZ2U6IHNldFZhbHVlUmFuZ2UsXG4gICAgICAgIGdldFZhbHVlUmFuZ2U6IGdldFZhbHVlUmFuZ2UsXG4gICAgICAgIHRyYW5zZm9ybVZhbHVlOiB0cmFuc2Zvcm1WYWx1ZSxcbiAgICAgICAgdW50cmFuc2Zvcm1WYWx1ZTogdW50cmFuc2Zvcm1WYWx1ZSxcbiAgICAgICAgaW50ZXJwb2xhdGVUb1JhbmdlOiBpbnRlcnBvbGF0ZVRvUmFuZ2VcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFRpbGluZyA9IHJlcXVpcmUoJy4vVGlsaW5nJyk7XG5cbiAgICB2YXIgc2V0UmVzb2x1dGlvbiA9IGZ1bmN0aW9uKHJlc29sdXRpb24pIHtcbiAgICAgICAgaWYgKHJlc29sdXRpb24gIT09IHRoaXMuX3BhcmFtcy5iaW5uaW5nLnJlc29sdXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnJlc29sdXRpb24gPSByZXNvbHV0aW9uO1xuICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFJlc29sdXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnJlc29sdXRpb247XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuICAgICAgICAvLyB0aWxpbmdcbiAgICAgICAgc2V0WEZpZWxkOiBUaWxpbmcuc2V0WEZpZWxkLFxuICAgICAgICBnZXRYRmllbGQ6IFRpbGluZy5nZXRYRmllbGQsXG4gICAgICAgIHNldFlGaWVsZDogVGlsaW5nLnNldFlGaWVsZCxcbiAgICAgICAgZ2V0WUZpZWxkOiBUaWxpbmcuZ2V0WUZpZWxkLFxuICAgICAgICAvLyBiaW5uaW5nXG4gICAgICAgIHNldFJlc29sdXRpb246IHNldFJlc29sdXRpb24sXG4gICAgICAgIGdldFJlc29sdXRpb246IGdldFJlc29sdXRpb25cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIERFRkFVTFRfWF9GSUVMRCA9ICdwaXhlbC54JztcbiAgICB2YXIgREVGQVVMVF9ZX0ZJRUxEID0gJ3BpeGVsLnknO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEuZXh0cmVtYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnRmllbGQgYCcgKyBmaWVsZCArICdgIGlzIG5vdCBvcmRpbmFsIGluIG1ldGEgZGF0YS4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgJ0ZpZWxkIGAnICsgZmllbGQgKyAnYCBpcyBub3QgcmVjb2duaXplZCBpbiBtZXRhIGRhdGEuJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcblxuICAgIHZhciBzZXRYRmllbGQgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgICAgICBpZiAoZmllbGQgIT09IHRoaXMuX3BhcmFtcy5iaW5uaW5nLngpIHtcbiAgICAgICAgICAgIGlmIChmaWVsZCA9PT0gREVGQVVMVF9YX0ZJRUxEKSB7XG4gICAgICAgICAgICAgICAgLy8gcmVzZXQgaWYgZGVmYXVsdFxuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLnggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1zLmJpbm5pbmcubGVmdCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy5yaWdodCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbWV0YSA9IHRoaXMuX21ldGFbZmllbGRdO1xuICAgICAgICAgICAgICAgIGlmIChjaGVja0ZpZWxkKG1ldGEsIGZpZWxkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy54ID0gZmllbGQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLmxlZnQgPSBtZXRhLmV4dHJlbWEubWluO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy5yaWdodCA9IG1ldGEuZXh0cmVtYS5tYXg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJFeHRyZW1hKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB2YXIgZ2V0WEZpZWxkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXMuYmlubmluZy54O1xuICAgIH07XG5cbiAgICB2YXIgc2V0WUZpZWxkID0gZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgaWYgKGZpZWxkICE9PSB0aGlzLl9wYXJhbXMuYmlubmluZy55KSB7XG4gICAgICAgICAgICBpZiAoZmllbGQgPT09IERFRkFVTFRfWV9GSUVMRCkge1xuICAgICAgICAgICAgICAgIC8vIHJlc2V0IGlmIGRlZmF1bHRcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy55ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtcy5iaW5uaW5nLmJvdHRvbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy50b3AgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhckV4dHJlbWEoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG1ldGEgPSB0aGlzLl9tZXRhW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tGaWVsZChtZXRhLCBmaWVsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1zLmJpbm5pbmcueSA9IGZpZWxkO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy5ib3R0b20gPSBtZXRhLmV4dHJlbWEubWluO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbXMuYmlubmluZy50b3AgPSBtZXRhLmV4dHJlbWEubWF4O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyRXh0cmVtYSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgdmFyIGdldFlGaWVsZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGFyYW1zLmJpbm5pbmcueTtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIHNldFhGaWVsZDogc2V0WEZpZWxkLFxuICAgICAgICBnZXRYRmllbGQ6IGdldFhGaWVsZCxcbiAgICAgICAgc2V0WUZpZWxkOiBzZXRZRmllbGQsXG4gICAgICAgIGdldFlGaWVsZDogZ2V0WUZpZWxkLFxuICAgICAgICBERUZBVUxUX1hfRklFTEQ6IERFRkFVTFRfWF9GSUVMRCxcbiAgICAgICAgREVGQVVMVF9ZX0ZJRUxEOiBERUZBVUxUX1lfRklFTERcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrO1xuXG4gICAgZnVuY3Rpb24gY2hlY2tRdWVyeShtZXRhLCBxdWVyeSkge1xuICAgICAgICB2YXIga2V5cyA9IF8ua2V5cyhxdWVyeSk7XG4gICAgICAgIGlmIChrZXlzLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgdGhyb3cgJ0Jvb2wgc3ViLXF1ZXJ5IG11c3Qgb25seSBoYXZlIGEgc2luZ2xlIGtleSwgcXVlcnkgaGFzIG11bHRpcGxlIGtleXM6IGAnICsgSlNPTi5zdHJpbmdpZnkoa2V5cykgKyAnYC4nO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0eXBlID0ga2V5c1swXTtcbiAgICAgICAgdmFyIGNoZWNrRnVuYyA9IGNoZWNrW3R5cGVdO1xuICAgICAgICBpZiAoIWNoZWNrRnVuYykge1xuICAgICAgICAgICAgdGhyb3cgJ1F1ZXJ5IHR5cGUgYCcgKyB0eXBlICsgJ2AgaXMgbm90IHJlY29nbml6ZWQuJztcbiAgICAgICAgfVxuICAgICAgICAvLyBjaGVjayBxdWVyeSBieSB0eXBlXG4gICAgICAgIGNoZWNrW3R5cGVdKG1ldGEsIHF1ZXJ5W3R5cGVdKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja1F1ZXJpZXMobWV0YSwgcXVlcmllcykge1xuICAgICAgICBpZiAoXy5pc0FycmF5KHF1ZXJpZXMpKSB7XG4gICAgICAgICAgICBxdWVyaWVzLmZvckVhY2goIGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgY2hlY2tRdWVyeShtZXRhLHF1ZXJ5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJpZXM7XG4gICAgICAgIH1cbiAgICAgICAgY2hlY2tRdWVyeShtZXRhLCBxdWVyaWVzKTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHF1ZXJpZXNcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja0Jvb2wobWV0YSwgcXVlcnkpIHtcbiAgICAgICAgaWYgKCFxdWVyeS5tdXN0ICYmICFxdWVyeS5tdXN0X25vdCAmJiAhcXVlcnkuc2hvdWxkKSB7XG4gICAgICAgICAgICB0aHJvdyAnQm9vbCBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIGBtdXN0YCwgYG11c3Rfbm90YCwgb3IgYHNob3VsZGAgcXVlcnkgYXJndW1lbnQuJztcbiAgICAgICAgfVxuICAgICAgICBpZiAocXVlcnkubXVzdCkge1xuICAgICAgICAgICAgY2hlY2tRdWVyaWVzKG1ldGEsIHF1ZXJ5Lm11c3QpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChxdWVyeS5tdXN0X25vdCkge1xuICAgICAgICAgICAgY2hlY2tRdWVyaWVzKG1ldGEsIHF1ZXJ5Lm11c3Rfbm90KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocXVlcnkuc2hvdWxkKSB7XG4gICAgICAgICAgICBjaGVja1F1ZXJpZXMobWV0YSwgcXVlcnkuc2hvdWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNoZWNrID0ge1xuICAgICAgICBib29sOiBjaGVja0Jvb2wsXG4gICAgICAgIHByZWZpeDogcmVxdWlyZSgnLi9QcmVmaXgnKSxcbiAgICAgICAgcXVlcnlfc3RyaW5nOiByZXF1aXJlKCcuL1F1ZXJ5U3RyaW5nJyksXG4gICAgICAgIHJhbmdlOiByZXF1aXJlKCcuL1JhbmdlJyksXG4gICAgICAgIHRlcm1zOiByZXF1aXJlKCcuL1Rlcm1zJyksXG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gY2hlY2tCb29sO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnUHJlZml4IGBmaWVsZGAgJyArIGZpZWxkICsgJyBpcyBub3Qgb2YgdHlwZSBgc3RyaW5nYCBpbiBtZXRhIGRhdGEuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93ICdQcmVmaXggYGZpZWxkYCAnICsgZmllbGQgKyAnIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YS4nO1xuICAgICAgICB9ICAgICAgICBcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtZXRhLCBxdWVyeSkge1xuICAgICAgICBpZiAoIXF1ZXJ5LmZpZWxkKSB7XG4gICAgICAgICAgICB0aHJvdyAnUHJlZml4IGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAocXVlcnkucHJlZml4ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgJ1ByZWZpeCBgcHJlZml4ZXNgIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQnO1xuICAgICAgICB9XG4gICAgICAgIGNoZWNrRmllbGQobWV0YVtxdWVyeS5maWVsZF0sIHF1ZXJ5LmZpZWxkKTtcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGNoZWNrRmllbGQgPSBmdW5jdGlvbihtZXRhLCBmaWVsZCkge1xuICAgICAgICBpZiAobWV0YSkge1xuICAgICAgICAgICAgaWYgKG1ldGEudHlwZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyAnUXVlcnlTdHJpbmcgYGZpZWxkYCAnICsgZmllbGQgKyAnIGlzIG5vdCBgc3RyaW5nYCBpbiBtZXRhIGRhdGEuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93ICdRdWVyeVN0cmluZyBgZmllbGRgICcgKyBmaWVsZCArICcgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLic7XG4gICAgICAgIH0gICAgICAgIFxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG1ldGEsIHF1ZXJ5KSB7XG4gICAgICAgIGlmICghcXVlcnkuZmllbGQpIHtcbiAgICAgICAgICAgIHRocm93ICdRdWVyeVN0cmluZyBgZmllbGRgIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4nO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcXVlcnkuc3RyaW5nKSB7XG4gICAgICAgICAgICB0aHJvdyAnUXVlcnlTdHJpbmcgYHN0cmluZ2AgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50Lic7XG4gICAgICAgIH1cbiAgICAgICAgY2hlY2tGaWVsZChtZXRhW3F1ZXJ5LmZpZWxkXSwgcXVlcnkuZmllbGQpO1xuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgY2hlY2tGaWVsZCA9IGZ1bmN0aW9uKG1ldGEsIGZpZWxkKSB7XG4gICAgICAgIGlmIChtZXRhKSB7XG4gICAgICAgICAgICBpZiAoIW1ldGEuZXh0cmVtYSkge1xuICAgICAgICAgICAgICAgIHRocm93ICdSYW5nZSBgZmllbGRgICcgKyBmaWVsZCArICcgaXMgbm90IG9yZGluYWwgaW4gbWV0YSBkYXRhLic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyAnUmFuZ2UgYGZpZWxkYCAnICsgZmllbGQgKyAnIGlzIG5vdCByZWNvZ25pemVkIGluIG1ldGEgZGF0YS4nO1xuICAgICAgICB9ICAgICAgICBcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihtZXRhLCBxdWVyeSkge1xuICAgICAgICBpZiAoIXF1ZXJ5LmZpZWxkKSB7XG4gICAgICAgICAgICB0aHJvdyAnUmFuZ2UgYGZpZWxkYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuJztcbiAgICAgICAgfVxuICAgICAgICBpZiAocXVlcnkuZnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyAnUmFuZ2UgYGZyb21gIGlzIG1pc3NpbmcgZnJvbSBhcmd1bWVudC4nO1xuICAgICAgICB9XG4gICAgICAgIGlmIChxdWVyeS50byA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyAnUmFuZ2UgYHRvYCBpcyBtaXNzaW5nIGZyb20gYXJndW1lbnQuJztcbiAgICAgICAgfVxuICAgICAgICBjaGVja0ZpZWxkKG1ldGFbcXVlcnkuZmllbGRdLCBxdWVyeS5maWVsZCk7XG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBjaGVja0ZpZWxkID0gZnVuY3Rpb24obWV0YSwgZmllbGQpIHtcbiAgICAgICAgaWYgKG1ldGEpIHtcbiAgICAgICAgICAgIGlmIChtZXRhLnR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ1Rlcm1zIGBmaWVsZGAgJyArIGZpZWxkICsgJyBpcyBub3Qgb2YgdHlwZSBgc3RyaW5nYCBpbiBtZXRhIGRhdGEuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93ICdUZXJtcyBgZmllbGRgICcgKyBmaWVsZCArICcgaXMgbm90IHJlY29nbml6ZWQgaW4gbWV0YSBkYXRhLic7XG4gICAgICAgIH0gICAgXG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24obWV0YSwgcXVlcnkpIHtcbiAgICAgICAgaWYgKCFxdWVyeS5maWVsZCkge1xuICAgICAgICAgICAgdGhyb3cgJ1Rlcm1zIGBmaWVsZGAgaXMgbWlzc2luZyBmcm9tIGFyZ3VtZW50Lic7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHF1ZXJ5LnRlcm1zID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93ICdUZXJtcyBgdGVybXNgIGFyZSBtaXNzaW5nIGZyb20gYXJndW1lbnQuJztcbiAgICAgICAgfVxuICAgICAgICBjaGVja0ZpZWxkKG1ldGFbcXVlcnkuZmllbGRdLCBxdWVyeS5maWVsZCk7XG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBMaXZlID0gcmVxdWlyZSgnLi4vY29yZS9MaXZlJyk7XG4gICAgdmFyIEJpbm5pbmcgPSByZXF1aXJlKCcuLi9wYXJhbS9CaW5uaW5nJyk7XG4gICAgdmFyIE1ldHJpYyA9IHJlcXVpcmUoJy4uL2FnZy9NZXRyaWMnKTtcbiAgICB2YXIgQ29sb3JSYW1wID0gcmVxdWlyZSgnLi4vbWl4aW4vQ29sb3JSYW1wJyk7XG4gICAgdmFyIFZhbHVlVHJhbnNmb3JtID0gcmVxdWlyZSgnLi4vbWl4aW4vVmFsdWVUcmFuc2Zvcm0nKTtcblxuICAgIHZhciBIZWF0bWFwID0gTGl2ZS5leHRlbmQoe1xuXG4gICAgICAgIGluY2x1ZGVzOiBbXG4gICAgICAgICAgICAvLyBwYXJhbXNcbiAgICAgICAgICAgIEJpbm5pbmcsXG4gICAgICAgICAgICAvLyBhZ2dzXG4gICAgICAgICAgICBNZXRyaWMsXG4gICAgICAgICAgICAvLyBtaXhpbnNcbiAgICAgICAgICAgIENvbG9yUmFtcCxcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtXG4gICAgICAgIF0sXG5cbiAgICAgICAgdHlwZTogJ2hlYXRtYXAnLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgQ29sb3JSYW1wLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIC8vIGJhc2VcbiAgICAgICAgICAgIExpdmUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBleHRyYWN0RXh0cmVtYTogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIGJpbnMgPSBuZXcgRmxvYXQ2NEFycmF5KGRhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtaW46IF8ubWluKGJpbnMpLFxuICAgICAgICAgICAgICAgIG1heDogXy5tYXgoYmlucylcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBIZWF0bWFwO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIExpdmUgPSByZXF1aXJlKCcuLi9jb3JlL0xpdmUnKTtcbiAgICB2YXIgQmlubmluZyA9IHJlcXVpcmUoJy4uL3BhcmFtL0Jpbm5pbmcnKTtcbiAgICB2YXIgVG9wSGl0cyA9IHJlcXVpcmUoJy4uL2FnZy9Ub3BIaXRzJyk7XG5cbiAgICB2YXIgUHJldmlldyA9IExpdmUuZXh0ZW5kKHtcblxuICAgICAgICBpbmNsdWRlczogW1xuICAgICAgICAgICAgLy8gcGFyYW1zXG4gICAgICAgICAgICBCaW5uaW5nLFxuICAgICAgICAgICAgVG9wSGl0cyBcbiAgICAgICAgXSxcblxuICAgICAgICB0eXBlOiAncHJldmlldycsXG5cbiAgICAgICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBMaXZlLnByb3RvdHlwZS5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gZXh0cmVtZSBub3QgcmVsZXZhbnQgZm9yIHByZXZpZXdcbiAgICAgICAgZXh0cmFjdEV4dHJlbWE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICAgICAgbWF4OiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBQcmV2aWV3O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIExpdmUgPSByZXF1aXJlKCcuLi9jb3JlL0xpdmUnKTtcbiAgICB2YXIgVGlsaW5nID0gcmVxdWlyZSgnLi4vcGFyYW0vVGlsaW5nJyk7XG4gICAgdmFyIFRvcFRlcm1zID0gcmVxdWlyZSgnLi4vYWdnL1RvcFRlcm1zJyk7XG4gICAgdmFyIEhpc3RvZ3JhbSA9IHJlcXVpcmUoJy4uL2FnZy9IaXN0b2dyYW0nKTtcbiAgICB2YXIgVmFsdWVUcmFuc2Zvcm0gPSByZXF1aXJlKCcuLi9taXhpbi9WYWx1ZVRyYW5zZm9ybScpO1xuXG4gICAgdmFyIFRvcENvdW50ID0gTGl2ZS5leHRlbmQoe1xuXG4gICAgICAgIGluY2x1ZGVzOiBbXG4gICAgICAgICAgICAvLyBwYXJhbXNcbiAgICAgICAgICAgIFRpbGluZyxcbiAgICAgICAgICAgIFRvcFRlcm1zLFxuICAgICAgICAgICAgLy8gYWdnc1xuICAgICAgICAgICAgSGlzdG9ncmFtLFxuICAgICAgICAgICAgLy8gbWl4aW5zXG4gICAgICAgICAgICBWYWx1ZVRyYW5zZm9ybVxuICAgICAgICBdLFxuXG4gICAgICAgIHR5cGU6ICd0b3BfY291bnQnLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm0uaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgLy8gYmFzZVxuICAgICAgICAgICAgTGl2ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRvcENvdW50O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIExpdmUgPSByZXF1aXJlKCcuLi9jb3JlL0xpdmUnKTtcbiAgICB2YXIgVGlsaW5nID0gcmVxdWlyZSgnLi4vcGFyYW0vVGlsaW5nJyk7XG4gICAgdmFyIFRvcFRlcm1zID0gcmVxdWlyZSgnLi4vYWdnL1RvcFRlcm1zJyk7XG4gICAgdmFyIERhdGVIaXN0b2dyYW0gPSByZXF1aXJlKCcuLi9hZ2cvRGF0ZUhpc3RvZ3JhbScpO1xuICAgIHZhciBIaXN0b2dyYW0gPSByZXF1aXJlKCcuLi9hZ2cvSGlzdG9ncmFtJyk7XG4gICAgdmFyIFZhbHVlVHJhbnNmb3JtID0gcmVxdWlyZSgnLi4vbWl4aW4vVmFsdWVUcmFuc2Zvcm0nKTtcblxuICAgIHZhciBUb3BGcmVxdWVuY3kgPSBMaXZlLmV4dGVuZCh7XG5cbiAgICAgICAgaW5jbHVkZXM6IFtcbiAgICAgICAgICAgIC8vIHBhcmFtc1xuICAgICAgICAgICAgVGlsaW5nLFxuICAgICAgICAgICAgLy8gYWdnc1xuICAgICAgICAgICAgVG9wVGVybXMsXG4gICAgICAgICAgICBEYXRlSGlzdG9ncmFtLFxuICAgICAgICAgICAgSGlzdG9ncmFtLFxuICAgICAgICAgICAgLy8gbWl4aW5zXG4gICAgICAgICAgICBWYWx1ZVRyYW5zZm9ybVxuICAgICAgICBdLFxuXG4gICAgICAgIHR5cGU6ICd0b3BfZnJlcXVlbmN5JyxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIC8vIGJhc2VcbiAgICAgICAgICAgIExpdmUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSxcblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUb3BGcmVxdWVuY3k7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTGl2ZSA9IHJlcXVpcmUoJy4uL2NvcmUvTGl2ZScpO1xuICAgIHZhciBCaW5uaW5nID0gcmVxdWlyZSgnLi4vcGFyYW0vQmlubmluZycpO1xuICAgIHZhciBUZXJtcyA9IHJlcXVpcmUoJy4uL2FnZy9UZXJtcycpO1xuICAgIHZhciBDb2xvclJhbXAgPSByZXF1aXJlKCcuLi9taXhpbi9Db2xvclJhbXAnKTtcbiAgICB2YXIgVmFsdWVUcmFuc2Zvcm0gPSByZXF1aXJlKCcuLi9taXhpbi9WYWx1ZVRyYW5zZm9ybScpO1xuXG4gICAgdmFyIFRvcFRyYWlscyA9IExpdmUuZXh0ZW5kKHtcblxuICAgICAgICBpbmNsdWRlczogW1xuICAgICAgICAgICAgLy8gcGFyYW1zXG4gICAgICAgICAgICBCaW5uaW5nLFxuICAgICAgICAgICAgLy8gYWdnc1xuICAgICAgICAgICAgVGVybXMsXG4gICAgICAgICAgICAvLyBtaXhpbnNcbiAgICAgICAgICAgIENvbG9yUmFtcCxcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtXG4gICAgICAgIF0sXG5cbiAgICAgICAgdHlwZTogJ3RvcF90cmFpbHMnLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgQ29sb3JSYW1wLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIC8vIGJhc2VcbiAgICAgICAgICAgIExpdmUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBleHRyYWN0RXh0cmVtYTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gWyAwLCAwIF07XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUb3BUcmFpbHM7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTGl2ZSA9IHJlcXVpcmUoJy4uL2NvcmUvTGl2ZScpO1xuICAgIHZhciBUaWxpbmcgPSByZXF1aXJlKCcuLi9wYXJhbS9UaWxpbmcnKTtcbiAgICB2YXIgVGVybXNGaWx0ZXIgPSByZXF1aXJlKCcuLi9hZ2cvVGVybXNGaWx0ZXInKTtcbiAgICB2YXIgSGlzdG9ncmFtID0gcmVxdWlyZSgnLi4vYWdnL0hpc3RvZ3JhbScpO1xuICAgIHZhciBWYWx1ZVRyYW5zZm9ybSA9IHJlcXVpcmUoJy4uL21peGluL1ZhbHVlVHJhbnNmb3JtJyk7XG5cbiAgICB2YXIgVG9waWNDb3VudCA9IExpdmUuZXh0ZW5kKHtcblxuICAgICAgICBpbmNsdWRlczogW1xuICAgICAgICAgICAgLy8gcGFyYW1zXG4gICAgICAgICAgICBUaWxpbmcsXG4gICAgICAgICAgICBUZXJtc0ZpbHRlcixcbiAgICAgICAgICAgIEhpc3RvZ3JhbSxcbiAgICAgICAgICAgIC8vIG1peGluc1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm1cbiAgICAgICAgXSxcblxuICAgICAgICB0eXBlOiAndG9waWNfY291bnQnLFxuXG4gICAgICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm0uaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgLy8gYmFzZVxuICAgICAgICAgICAgTGl2ZS5wcm90b3R5cGUuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRvcGljQ291bnQ7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgTGl2ZSA9IHJlcXVpcmUoJy4uL2NvcmUvTGl2ZScpO1xuICAgIHZhciBUaWxpbmcgPSByZXF1aXJlKCcuLi9wYXJhbS9UaWxpbmcnKTtcbiAgICB2YXIgVGVybXNGaWx0ZXIgPSByZXF1aXJlKCcuLi9hZ2cvVGVybXNGaWx0ZXInKTtcbiAgICB2YXIgRGF0ZUhpc3RvZ3JhbSA9IHJlcXVpcmUoJy4uL2FnZy9EYXRlSGlzdG9ncmFtJyk7XG4gICAgdmFyIEhpc3RvZ3JhbSA9IHJlcXVpcmUoJy4uL2FnZy9IaXN0b2dyYW0nKTtcbiAgICB2YXIgVmFsdWVUcmFuc2Zvcm0gPSByZXF1aXJlKCcuLi9taXhpbi9WYWx1ZVRyYW5zZm9ybScpO1xuXG4gICAgdmFyIFRvcGljRnJlcXVlbmN5ID0gTGl2ZS5leHRlbmQoe1xuXG4gICAgICAgIGluY2x1ZGVzOiBbXG4gICAgICAgICAgICAvLyBwYXJhbXNcbiAgICAgICAgICAgIFRpbGluZyxcbiAgICAgICAgICAgIFRlcm1zRmlsdGVyLFxuICAgICAgICAgICAgRGF0ZUhpc3RvZ3JhbSxcbiAgICAgICAgICAgIEhpc3RvZ3JhbSxcbiAgICAgICAgICAgIC8vIG1peGluc1xuICAgICAgICAgICAgVmFsdWVUcmFuc2Zvcm1cbiAgICAgICAgXSxcblxuICAgICAgICB0eXBlOiAndG9waWNfZnJlcXVlbmN5JyxcblxuICAgICAgICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIFZhbHVlVHJhbnNmb3JtLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIC8vIGJhc2VcbiAgICAgICAgICAgIExpdmUucHJvdG90eXBlLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSxcblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUb3BpY0ZyZXF1ZW5jeTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBET00gPSByZXF1aXJlKCcuL0RPTScpO1xuXG4gICAgdmFyIENhbnZhcyA9IERPTS5leHRlbmQoe1xuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGhhbmRsZXJzOiB7fVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIERPTS5wcm90b3R5cGUub25BZGQuY2FsbCh0aGlzLCBtYXApO1xuICAgICAgICAgICAgbWFwLm9uKCdjbGljaycsIHRoaXMub25DbGljaywgdGhpcyk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikub24oJ21vdXNlbW92ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLm9uTW91c2VNb3ZlKGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikub24oJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLm9uTW91c2VPdmVyKGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikub24oJ21vdXNlb3V0JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHNlbGYub25Nb3VzZU91dChlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uUmVtb3ZlOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgICAgIG1hcC5vZmYoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0aGlzKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5vZmYoJ21vdXNlbW92ZScpO1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLm9mZignbW91c2VvdmVyJyk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikub2ZmKCdtb3VzZW91dCcpO1xuICAgICAgICAgICAgRE9NLnByb3RvdHlwZS5vblJlbW92ZS5jYWxsKHRoaXMsIG1hcCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlVGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdGlsZSA9IEwuRG9tVXRpbC5jcmVhdGUoJ2NhbnZhcycsICdsZWFmbGV0LXRpbGUnKTtcbiAgICAgICAgICAgIHRpbGUuc3R5bGVbJ3BvaW50ZXItZXZlbnRzJ10gPSAnYWxsJztcbiAgICAgICAgICAgIHRpbGUud2lkdGggPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB0aWxlLmhlaWdodCA9IHRoaXMub3B0aW9ucy50aWxlU2l6ZTtcbiAgICAgICAgICAgIHJldHVybiB0aWxlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsZWFyVGlsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHRpbGVTaXplID0gdGhpcy5vcHRpb25zLnRpbGVTaXplO1xuICAgICAgICAgICAgXy5mb3JJbih0aGlzLl90aWxlcywgZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgICAgIHZhciBjdHggPSB0aWxlLmVsLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgY3R4LmNsZWFyUmVjdCgwLCAwLCB0aWxlU2l6ZSwgdGlsZVNpemUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZU1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDYW52YXM7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgQmFzZSA9IHJlcXVpcmUoJy4uLy4uL2xheWVyL2NvcmUvQmFzZScpO1xuXG4gICAgZnVuY3Rpb24gbW9kKG4sIG0pIHtcbiAgICAgICAgcmV0dXJuICgobiAlIG0pICsgbSkgJSBtO1xuICAgIH1cblxuICAgIHZhciBET00gPSBCYXNlLmV4dGVuZCh7XG5cbiAgICAgICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgTC5HcmlkTGF5ZXIucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcbiAgICAgICAgICAgIG1hcC5vbignem9vbXN0YXJ0JywgdGhpcy5jbGVhckV4dHJlbWEsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5vbigndGlsZWxvYWQnLCB0aGlzLm9uVGlsZUxvYWQsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5vbigndGlsZXVubG9hZCcsIHRoaXMub25UaWxlVW5sb2FkLCB0aGlzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblJlbW92ZTogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICBtYXAub2ZmKCd6b29tc3RhcnQnLCB0aGlzLmNsZWFyRXh0cmVtYSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLm9mZigndGlsZWxvYWQnLCB0aGlzLm9uVGlsZUxvYWQsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5vZmYoJ3RpbGV1bmxvYWQnLCB0aGlzLm9uVGlsZVVubG9hZCwgdGhpcyk7XG4gICAgICAgICAgICBMLkdyaWRMYXllci5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nZXRMYXllclBvaW50RnJvbUV2ZW50OiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgbG9ubGF0ID0gdGhpcy5fbWFwLm1vdXNlRXZlbnRUb0xhdExuZyhlKTtcbiAgICAgICAgICAgIHZhciBwaXhlbCA9IHRoaXMuX21hcC5wcm9qZWN0KGxvbmxhdCk7XG4gICAgICAgICAgICB2YXIgem9vbSA9IHRoaXMuX21hcC5nZXRab29tKCk7XG4gICAgICAgICAgICB2YXIgcG93ID0gTWF0aC5wb3coMiwgem9vbSk7XG4gICAgICAgICAgICB2YXIgdGlsZVNpemUgPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IG1vZChwaXhlbC54LCBwb3cgKiB0aWxlU2l6ZSksXG4gICAgICAgICAgICAgICAgeTogbW9kKHBpeGVsLnksIHBvdyAqIHRpbGVTaXplKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0VGlsZUNvb3JkRnJvbUxheWVyUG9pbnQ6IGZ1bmN0aW9uKGxheWVyUG9pbnQpIHtcbiAgICAgICAgICAgIHZhciB0aWxlU2l6ZSA9IHRoaXMub3B0aW9ucy50aWxlU2l6ZTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgeDogTWF0aC5mbG9vcihsYXllclBvaW50LnggLyB0aWxlU2l6ZSksXG4gICAgICAgICAgICAgICAgeTogTWF0aC5mbG9vcihsYXllclBvaW50LnkgLyB0aWxlU2l6ZSksXG4gICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0QmluQ29vcmRGcm9tTGF5ZXJQb2ludDogZnVuY3Rpb24obGF5ZXJQb2ludCkge1xuICAgICAgICAgICAgdmFyIHRpbGVTaXplID0gdGhpcy5vcHRpb25zLnRpbGVTaXplO1xuICAgICAgICAgICAgdmFyIHJlc29sdXRpb24gPSB0aGlzLmdldFJlc29sdXRpb24oKSB8fCB0aWxlU2l6ZTtcbiAgICAgICAgICAgIHZhciB0eCA9IG1vZChsYXllclBvaW50LngsIHRpbGVTaXplKTtcbiAgICAgICAgICAgIHZhciB0eSA9IG1vZChsYXllclBvaW50LnksIHRpbGVTaXplKTtcbiAgICAgICAgICAgIHZhciBwaXhlbFNpemUgPSB0aWxlU2l6ZSAvIHJlc29sdXRpb247XG4gICAgICAgICAgICB2YXIgYnggPSBNYXRoLmZsb29yKHR4IC8gcGl4ZWxTaXplKTtcbiAgICAgICAgICAgIHZhciBieSA9IE1hdGguZmxvb3IodHkgLyBwaXhlbFNpemUpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBieCxcbiAgICAgICAgICAgICAgICB5OiBieSxcbiAgICAgICAgICAgICAgICBpbmRleDogYnggKyAoYnkgKiByZXNvbHV0aW9uKSxcbiAgICAgICAgICAgICAgICBzaXplOiBwaXhlbFNpemVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DYWNoZUhpdDogZnVuY3Rpb24odGlsZSwgY2FjaGVkLCBjb29yZHMpIHtcbiAgICAgICAgICAgIC8vIGRhdGEgZXhpc3RzLCByZW5kZXIgb25seSB0aGlzIHRpbGVcbiAgICAgICAgICAgIGlmIChjYWNoZWQuZGF0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyVGlsZSh0aWxlLCBjYWNoZWQuZGF0YSwgY29vcmRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvbkNhY2hlTG9hZDogZnVuY3Rpb24odGlsZSwgY2FjaGVkLCBjb29yZHMpIHtcbiAgICAgICAgICAgIC8vIHNhbWUgZXh0cmVtYSwgd2UgYXJlIGdvb2QgdG8gcmVuZGVyIHRoZSB0aWxlcy4gSW5cbiAgICAgICAgICAgIC8vIHRoZSBjYXNlIG9mIGEgbWFwIHdpdGggd3JhcGFyb3VuZCwgd2UgbWF5IGhhdmVcbiAgICAgICAgICAgIC8vIG11bHRpcGxlIHRpbGVzIGRlcGVuZGVudCBvbiB0aGUgcmVzcG9uc2UsIHNvIGl0ZXJhdGVcbiAgICAgICAgICAgIC8vIG92ZXIgZWFjaCB0aWxlIGFuZCBkcmF3IGl0LlxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgaWYgKGNhY2hlZC5kYXRhKSB7XG4gICAgICAgICAgICAgICAgXy5mb3JJbihjYWNoZWQudGlsZXMsIGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW5kZXJUaWxlKHRpbGUsIGNhY2hlZC5kYXRhLCBjb29yZHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uQ2FjaGVMb2FkRXh0cmVtYVVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyByZWRyYXcgYWxsIHRpbGVzXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBfLmZvckluKHRoaXMuX2NhY2hlLCBmdW5jdGlvbihjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICBfLmZvckluKGNhY2hlZC50aWxlcywgZnVuY3Rpb24odGlsZSwga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZWQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW5kZXJUaWxlKHRpbGUsIGNhY2hlZC5kYXRhLCBzZWxmLmNvb3JkRnJvbUNhY2hlS2V5KGtleSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVxdWVzdFRpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBET007XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRE9NID0gcmVxdWlyZSgnLi9ET00nKTtcblxuICAgIHZhciBIVE1MID0gRE9NLmV4dGVuZCh7XG5cbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgaGFuZGxlcnM6IHt9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25BZGQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgRE9NLnByb3RvdHlwZS5vbkFkZC5jYWxsKHRoaXMsIG1hcCk7XG4gICAgICAgICAgICBtYXAub24oJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0aGlzKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5vbignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHNlbGYub25Nb3VzZU1vdmUoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5vbignbW91c2VvdmVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHNlbGYub25Nb3VzZU92ZXIoZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5vbignbW91c2VvdXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5vbk1vdXNlT3V0KGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25SZW1vdmU6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgbWFwLm9mZignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRoaXMpO1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLm9mZignbW91c2Vtb3ZlJyk7XG4gICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikub2ZmKCdtb3VzZW92ZXInKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5vZmYoJ21vdXNlb3V0Jyk7XG4gICAgICAgICAgICBET00ucHJvdG90eXBlLm9uUmVtb3ZlLmNhbGwodGhpcywgbWFwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVUaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aWxlID0gTC5Eb21VdGlsLmNyZWF0ZSgnZGl2JywgJ2xlYWZsZXQtdGlsZSBsZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgcmV0dXJuIHRpbGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZU1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3ZlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBvdmVycmlkZVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gb3ZlcnJpZGVcbiAgICAgICAgfSxcblxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG92ZXJyaWRlXG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBIVE1MO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEJhc2UgPSByZXF1aXJlKCcuLi8uLi9sYXllci9jb3JlL0Jhc2UnKTtcblxuICAgIHZhciBOT19PUCA9IGZ1bmN0aW9uKCkge307XG5cbiAgICB2YXIgT3ZlcmxheSA9IEJhc2UuZXh0ZW5kKHtcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICB6SW5kZXg6IDFcbiAgICAgICAgfSxcblxuICAgICAgICBvbkFkZDogZnVuY3Rpb24obWFwKSB7XG4gICAgICAgICAgICBtYXAub24oJ3pvb21lbmQnLCB0aGlzLm9uWm9vbUVuZCwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLm9uKCd0aWxlbG9hZCcsIHRoaXMub25UaWxlTG9hZCwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLm9uKCd0aWxldW5sb2FkJywgdGhpcy5vblRpbGVVbmxvYWQsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5fdGlsZXMgPSB7fTtcbiAgICAgICAgICAgIHRoaXMuX2luaXRDb250YWluZXIoKTtcbiAgICAgICAgICAgIHRoaXMuX3Jlc2V0VmlldygpO1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25SZW1vdmU6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgbWFwLm9mZignem9vbWVuZCcsIHRoaXMub25ab29tRW5kLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMub2ZmKCd0aWxlbG9hZCcsIHRoaXMub25UaWxlTG9hZCwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLm9mZigndGlsZXVubG9hZCcsIHRoaXMub25UaWxlVW5sb2FkLCB0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUFsbFRpbGVzKCk7XG4gICAgICAgICAgICBMLkRvbVV0aWwucmVtb3ZlKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgICAgICBtYXAuX3JlbW92ZVpvb21MaW1pdCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX3RpbGVab29tID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBOby1vcCB0aGVzZSBmdW5jdGlvbnNcbiAgICAgICAgY3JlYXRlVGlsZTogTk9fT1AsXG4gICAgICAgIF91cGRhdGVPcGFjaXR5OiBOT19PUCxcbiAgICAgICAgX2luaXRUaWxlOiBOT19PUCxcbiAgICAgICAgX3RpbGVSZWFkeTogTk9fT1AsXG4gICAgICAgIF91cGRhdGVMZXZlbHM6IE5PX09QLFxuICAgICAgICBfcmVtb3ZlVGlsZXNBdFpvb206IE5PX09QLFxuICAgICAgICBfc2V0Wm9vbVRyYW5zZm9ybXM6IE5PX09QLFxuXG4gICAgICAgIF9pbml0Q29udGFpbmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2NvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lci5jbGFzc05hbWUgKz0gJ2xlYWZsZXQtbGF5ZXIgbGVhZmxldC16b29tLWFuaW1hdGVkJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVpJbmRleCgpO1xuICAgICAgICAgICAgdGhpcy5nZXRQYW5lKCkuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcHJ1bmVUaWxlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9tYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgem9vbSA9IHRoaXMuX21hcC5nZXRab29tKCk7XG4gICAgICAgICAgICBpZiAoem9vbSA+IHRoaXMub3B0aW9ucy5tYXhab29tIHx8XG4gICAgICAgICAgICAgICAgem9vbSA8IHRoaXMub3B0aW9ucy5taW5ab29tKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQWxsVGlsZXMoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBfLmZvckluKHRoaXMuX3RpbGVzLCBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICAgICAgdGlsZS5yZXRhaW4gPSB0aWxlLmN1cnJlbnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIF8uZm9ySW4odGhpcy5fdGlsZXMsIGZ1bmN0aW9uKHRpbGUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGlsZS5jdXJyZW50ICYmICF0aWxlLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29vcmRzID0gdGlsZS5jb29yZHM7XG4gICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5fcmV0YWluUGFyZW50KGNvb3Jkcy54LCBjb29yZHMueSwgY29vcmRzLnosIGNvb3Jkcy56IC0gNSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3JldGFpbkNoaWxkcmVuKGNvb3Jkcy54LCBjb29yZHMueSwgY29vcmRzLnosIGNvb3Jkcy56ICsgMik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIF8uZm9ySW4odGhpcy5fdGlsZXMsIGZ1bmN0aW9uKHRpbGUsIGtleSkge1xuICAgICAgICAgICAgICAgIGlmICghdGlsZS5yZXRhaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlVGlsZShrZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZW1vdmVBbGxUaWxlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgXy5mb3JJbih0aGlzLl90aWxlcywgZnVuY3Rpb24odGlsZSwga2V5KSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlVGlsZShrZXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2ludmFsaWRhdGVBbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUFsbFRpbGVzKCk7XG4gICAgICAgICAgICB0aGlzLl90aWxlWm9vbSA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldFZpZXc6IGZ1bmN0aW9uIChjZW50ZXIsIHpvb20sIG5vUHJ1bmUsIG5vVXBkYXRlKSB7XG4gICAgICAgICAgICB2YXIgdGlsZVpvb20gPSBNYXRoLnJvdW5kKHpvb20pO1xuICAgICAgICAgICAgaWYgKCh0aGlzLm9wdGlvbnMubWF4Wm9vbSAhPT0gdW5kZWZpbmVkICYmIHRpbGVab29tID4gdGhpcy5vcHRpb25zLm1heFpvb20pIHx8XG4gICAgICAgICAgICAgICAgKHRoaXMub3B0aW9ucy5taW5ab29tICE9PSB1bmRlZmluZWQgJiYgdGlsZVpvb20gPCB0aGlzLm9wdGlvbnMubWluWm9vbSkpIHtcbiAgICAgICAgICAgICAgICB0aWxlWm9vbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0aWxlWm9vbUNoYW5nZWQgPSB0aGlzLm9wdGlvbnMudXBkYXRlV2hlblpvb21pbmcgJiYgKHRpbGVab29tICE9PSB0aGlzLl90aWxlWm9vbSk7XG4gICAgICAgICAgICBpZiAoIW5vVXBkYXRlIHx8IHRpbGVab29tQ2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RpbGVab29tID0gdGlsZVpvb207XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2Fib3J0TG9hZGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hYm9ydExvYWRpbmcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzZXRHcmlkKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRpbGVab29tICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlKGNlbnRlcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghbm9QcnVuZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcnVuZVRpbGVzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2V0Wm9vbVRyYW5zZm9ybShjZW50ZXIsIHpvb20pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRab29tVHJhbnNmb3JtOiBmdW5jdGlvbiAoY2VudGVyLCB6b29tKSB7XG4gICAgICAgICAgICB2YXIgY3VycmVudENlbnRlciA9IHRoaXMuX21hcC5nZXRDZW50ZXIoKTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50Wm9vbSA9IHRoaXMuX21hcC5nZXRab29tKCk7XG4gICAgICAgICAgICB2YXIgc2NhbGUgPSB0aGlzLl9tYXAuZ2V0Wm9vbVNjYWxlKHpvb20sIGN1cnJlbnRab29tKTtcbiAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IEwuRG9tVXRpbC5nZXRQb3NpdGlvbih0aGlzLl9jb250YWluZXIpO1xuICAgICAgICAgICAgdmFyIHZpZXdIYWxmID0gdGhpcy5fbWFwLmdldFNpemUoKS5tdWx0aXBseUJ5KDAuNSk7XG4gICAgICAgICAgICB2YXIgY3VycmVudENlbnRlclBvaW50ID0gdGhpcy5fbWFwLnByb2plY3QoY3VycmVudENlbnRlciwgem9vbSk7XG4gICAgICAgICAgICB2YXIgZGVzdENlbnRlclBvaW50ID0gdGhpcy5fbWFwLnByb2plY3QoY2VudGVyLCB6b29tKTtcbiAgICAgICAgICAgIHZhciBjZW50ZXJPZmZzZXQgPSBkZXN0Q2VudGVyUG9pbnQuc3VidHJhY3QoY3VycmVudENlbnRlclBvaW50KTtcbiAgICAgICAgICAgIHZhciB0b3BMZWZ0T2Zmc2V0ID0gdmlld0hhbGYubXVsdGlwbHlCeSgtc2NhbGUpLmFkZChwb3NpdGlvbikuYWRkKHZpZXdIYWxmKS5zdWJ0cmFjdChjZW50ZXJPZmZzZXQpO1xuICAgICAgICAgICAgaWYgKEwuQnJvd3Nlci5hbnkzZCkge1xuICAgICAgICAgICAgICAgIEwuRG9tVXRpbC5zZXRUcmFuc2Zvcm0odGhpcy5fY29udGFpbmVyLCB0b3BMZWZ0T2Zmc2V0LCBzY2FsZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIEwuRG9tVXRpbC5zZXRQb3NpdGlvbih0aGlzLl9jb250YWluZXIsIHRvcExlZnRPZmZzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFByaXZhdGUgbWV0aG9kIHRvIGxvYWQgdGlsZXMgaW4gdGhlIGdyaWQncyBhY3RpdmUgem9vbSBsZXZlbCBhY2NvcmRpbmcgdG8gbWFwIGJvdW5kc1xuICAgICAgICBfdXBkYXRlOiBmdW5jdGlvbiAoY2VudGVyKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5fbWFwO1xuICAgICAgICAgICAgaWYgKCFtYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgem9vbSA9IG1hcC5nZXRab29tKCk7XG4gICAgICAgICAgICBpZiAoY2VudGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjZW50ZXIgPSBtYXAuZ2V0Q2VudGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fdGlsZVpvb20gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8vIGlmIG91dCBvZiBtaW56b29tL21heHpvb21cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcGl4ZWxCb3VuZHMgPSB0aGlzLl9nZXRUaWxlZFBpeGVsQm91bmRzKGNlbnRlciksXG4gICAgICAgICAgICAgICAgdGlsZVJhbmdlID0gdGhpcy5fcHhCb3VuZHNUb1RpbGVSYW5nZShwaXhlbEJvdW5kcyksXG4gICAgICAgICAgICAgICAgdGlsZUNlbnRlciA9IHRpbGVSYW5nZS5nZXRDZW50ZXIoKSxcbiAgICAgICAgICAgICAgICBxdWV1ZSA9IFtdO1xuXG4gICAgICAgICAgICBfLmZvckluKHRoaXMuX3RpbGVzLCBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICAgICAgdGlsZS5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIF91cGRhdGUganVzdCBsb2FkcyBtb3JlIHRpbGVzLiBJZiB0aGUgdGlsZSB6b29tIGxldmVsIGRpZmZlcnMgdG9vIG11Y2hcbiAgICAgICAgICAgIC8vIGZyb20gdGhlIG1hcCdzLCBsZXQgX3NldFZpZXcgcmVzZXQgbGV2ZWxzIGFuZCBwcnVuZSBvbGQgdGlsZXMuXG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoem9vbSAtIHRoaXMuX3RpbGVab29tKSA+IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXRWaWV3KGNlbnRlciwgem9vbSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY3JlYXRlIGEgcXVldWUgb2YgY29vcmRpbmF0ZXMgdG8gbG9hZCB0aWxlcyBmcm9tXG4gICAgICAgICAgICB2YXIgaSwgajtcbiAgICAgICAgICAgIGZvciAoaiA9IHRpbGVSYW5nZS5taW4ueTsgaiA8PSB0aWxlUmFuZ2UubWF4Lnk7IGorKykge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IHRpbGVSYW5nZS5taW4ueDsgaSA8PSB0aWxlUmFuZ2UubWF4Lng7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29vcmRzID0gbmV3IEwuUG9pbnQoaSwgaik7XG4gICAgICAgICAgICAgICAgICAgIGNvb3Jkcy56ID0gdGhpcy5fdGlsZVpvb207XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1ZhbGlkVGlsZShjb29yZHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aWxlID0gdGhpcy5fdGlsZXNbdGhpcy5fdGlsZUNvb3Jkc1RvS2V5KGNvb3JkcyldO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGlsZS5jdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goY29vcmRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNvcnQgdGlsZSBxdWV1ZSB0byBsb2FkIHRpbGVzIGluIG9yZGVyIG9mIHRoZWlyIGRpc3RhbmNlIHRvIGNlbnRlclxuICAgICAgICAgICAgcXVldWUuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmRpc3RhbmNlVG8odGlsZUNlbnRlcikgLSBiLmRpc3RhbmNlVG8odGlsZUNlbnRlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBpZiBpdHMgdGhlIGZpcnN0IGJhdGNoIG9mIHRpbGVzIHRvIGxvYWRcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2xvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIEBldmVudCBsb2FkaW5nOiBFdmVudFxuICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZCB3aGVuIHRoZSBncmlkIGxheWVyIHN0YXJ0cyBsb2FkaW5nIHRpbGVzXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlyZSgnbG9hZGluZycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWRkVGlsZShxdWV1ZVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9yZW1vdmVUaWxlOiBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgdGlsZSA9IHRoaXMuX3RpbGVzW2tleV07XG4gICAgICAgICAgICBpZiAoIXRpbGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fdGlsZXNba2V5XTtcbiAgICAgICAgICAgIC8vIEBldmVudCB0aWxldW5sb2FkOiBUaWxlRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gYSB0aWxlIGlzIHJlbW92ZWQgKGUuZy4gd2hlbiBhIHRpbGUgZ29lcyBvZmYgdGhlIHNjcmVlbikuXG4gICAgICAgICAgICB0aGlzLmZpcmUoJ3RpbGV1bmxvYWQnLCB7XG4gICAgICAgICAgICAgICAgY29vcmRzOiB0aGlzLl9rZXlUb1RpbGVDb29yZHMoa2V5KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2FkZFRpbGU6IGZ1bmN0aW9uIChjb29yZHMpIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSB0aGlzLl90aWxlQ29vcmRzVG9LZXkoY29vcmRzKTtcbiAgICAgICAgICAgIC8vIHNhdmUgdGlsZSBpbiBjYWNoZVxuICAgICAgICAgICAgdmFyIHRpbGUgPSB0aGlzLl90aWxlc1trZXldID0ge1xuICAgICAgICAgICAgICAgIGNvb3JkczogY29vcmRzLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBAZXZlbnQgdGlsZWxvYWRzdGFydDogVGlsZUV2ZW50XG4gICAgICAgICAgICAvLyBGaXJlZCB3aGVuIGEgdGlsZSBpcyByZXF1ZXN0ZWQgYW5kIHN0YXJ0cyBsb2FkaW5nLlxuICAgICAgICAgICAgdGhpcy5maXJlKCd0aWxlbG9hZHN0YXJ0Jywge1xuICAgICAgICAgICAgICAgIGNvb3JkczogY29vcmRzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGlsZS5sb2FkZWQgPSArbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHRpbGUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3BydW5lVGlsZXMoKTtcblxuICAgICAgICAgICAgLy8gQGV2ZW50IHRpbGVsb2FkOiBUaWxlRXZlbnRcbiAgICAgICAgICAgIC8vIEZpcmVkIHdoZW4gYSB0aWxlIGxvYWRzLlxuICAgICAgICAgICAgdGhpcy5maXJlKCd0aWxlbG9hZCcsIHtcbiAgICAgICAgICAgICAgICBjb29yZHM6IGNvb3Jkc1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9ub1RpbGVzVG9Mb2FkKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9sb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gQGV2ZW50IGxvYWQ6IEV2ZW50XG4gICAgICAgICAgICAgICAgLy8gRmlyZWQgd2hlbiB0aGUgZ3JpZCBsYXllciBsb2FkZWQgYWxsIHZpc2libGUgdGlsZXMuXG4gICAgICAgICAgICAgICAgdGhpcy5maXJlKCdsb2FkJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoTC5Ccm93c2VyLmllbHQ5IHx8ICF0aGlzLl9tYXAuX2ZhZGVBbmltYXRlZCkge1xuICAgICAgICAgICAgICAgICAgICBMLlV0aWwucmVxdWVzdEFuaW1GcmFtZSh0aGlzLl9wcnVuZVRpbGVzLCB0aGlzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBXYWl0IGEgYml0IG1vcmUgdGhhbiAwLjIgc2VjcyAodGhlIGR1cmF0aW9uIG9mIHRoZSB0aWxlIGZhZGUtaW4pXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIHRyaWdnZXIgYSBwcnVuaW5nLlxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KEwuYmluZCh0aGlzLl9wcnVuZVRpbGVzLCB0aGlzKSwgMjUwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBPdmVybGF5O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGVzcGVyID0gcmVxdWlyZSgnZXNwZXInKTtcbiAgICB2YXIgT3ZlcmxheSA9IHJlcXVpcmUoJy4vT3ZlcmxheScpO1xuXG4gICAgdmFyIFdlYkdMID0gT3ZlcmxheS5leHRlbmQoe1xuXG4gICAgICAgIG9uQWRkOiBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgICAgIE92ZXJsYXkucHJvdG90eXBlLm9uQWRkLmNhbGwodGhpcywgbWFwKTtcbiAgICAgICAgICAgIG1hcC5vbignem9vbXN0YXJ0JywgdGhpcy5vblpvb21TdGFydCwgdGhpcyk7XG4gICAgICAgICAgICBtYXAub24oJ3pvb21lbmQnLCB0aGlzLm9uWm9vbUVuZCwgdGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25SZW1vdmU6IGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICAgICAgT3ZlcmxheS5wcm90b3R5cGUub25SZW1vdmUuY2FsbCh0aGlzLCBtYXApO1xuICAgICAgICAgICAgbWFwLm9mZignem9vbXN0YXJ0JywgdGhpcy5vblpvb21TdGFydCwgdGhpcyk7XG4gICAgICAgICAgICBtYXAub2ZmKCd6b29tZW5kJywgdGhpcy5vblpvb21FbmQsIHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uWm9vbVN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2lzWm9vbWluZyA9IHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25ab29tRW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX2lzWm9vbWluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fcmVuZGVyRnJhbWUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbkNhY2hlSGl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIG5vLW9wXG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DYWNoZUxvYWQ6IGZ1bmN0aW9uKHRpbGUsIGNhY2hlZCwgY29vcmRzKSB7XG4gICAgICAgICAgICBpZiAoY2FjaGVkLmRhdGEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9idWZmZXJUaWxlVGV4dHVyZShjYWNoZWQsIGNvb3Jkcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DYWNoZUxvYWRFeHRyZW1hVXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIF8uZm9ySW4odGhpcy5fY2FjaGUsIGZ1bmN0aW9uKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIGlmIChjYWNoZWQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9idWZmZXJUaWxlVGV4dHVyZShjYWNoZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9pbml0Q29udGFpbmVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBPdmVybGF5LnByb3RvdHlwZS5faW5pdENvbnRhaW5lci5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9nbCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2luaXRHTCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9pbml0R0w6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGdsID0gdGhpcy5fZ2wgPSBlc3Blci5XZWJHTENvbnRleHQuZ2V0KHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgICAgICAvLyBoYW5kbGUgbWlzc2luZyBjb250ZXh0XG4gICAgICAgICAgICBpZiAoIWdsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgJ1VuYWJsZSB0byBhY3F1aXJlIGEgV2ViR0wgY29udGV4dCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpbml0IHRoZSB3ZWJnbCBzdGF0ZVxuICAgICAgICAgICAgZ2wuY2xlYXJDb2xvcigwLCAwLCAwLCAwKTtcbiAgICAgICAgICAgIGdsLmVuYWJsZShnbC5CTEVORCk7XG4gICAgICAgICAgICBnbC5ibGVuZEZ1bmMoZ2wuU1JDX0FMUEhBLCBnbC5PTkUpO1xuICAgICAgICAgICAgZ2wuZGlzYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSB0aWxlIHJlbmRlcmFibGVcbiAgICAgICAgICAgIHNlbGYuX3JlbmRlcmFibGUgPSBuZXcgZXNwZXIuUmVuZGVyYWJsZSh7XG4gICAgICAgICAgICAgICAgdmVydGljZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgMDogW1xuICAgICAgICAgICAgICAgICAgICAgICAgWzAsIC0yNTZdLFxuICAgICAgICAgICAgICAgICAgICAgICAgWzI1NiwgLTI1Nl0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbMjU2LCAwXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFswLCAwXVxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAxOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBbMCwgMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbMSwgMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbMSwgMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICBbMCwgMV1cbiAgICAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgaW5kaWNlczogW1xuICAgICAgICAgICAgICAgICAgICAwLCAxLCAyLFxuICAgICAgICAgICAgICAgICAgICAwLCAyLCAzXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBsb2FkIHNoYWRlcnNcbiAgICAgICAgICAgIG5ldyBlc3Blci5TaGFkZXIoe1xuICAgICAgICAgICAgICAgIHZlcnQ6IHRoaXMub3B0aW9ucy5zaGFkZXJzLnZlcnQsXG4gICAgICAgICAgICAgICAgZnJhZzogdGhpcy5vcHRpb25zLnNoYWRlcnMuZnJhZ1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBzaGFkZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBleGVjdXRlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gc2VsZi5fY29udGFpbmVyLndpZHRoO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBzZWxmLl9jb250YWluZXIuaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHNlbGYuX3ZpZXdwb3J0ID0gbmV3IGVzcGVyLlZpZXdwb3J0KHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNlbGYuX2luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLl9zaGFkZXIgPSBzaGFkZXI7XG4gICAgICAgICAgICAgICAgc2VsZi5fZHJhdygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFRyYW5zbGF0aW9uTWF0cml4OiBmdW5jdGlvbih4LCB5LCB6KSB7XG4gICAgICAgICAgICB2YXIgbWF0ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gICAgICAgICAgICBtYXRbMF0gPSAxO1xuICAgICAgICAgICAgbWF0WzFdID0gMDtcbiAgICAgICAgICAgIG1hdFsyXSA9IDA7XG4gICAgICAgICAgICBtYXRbM10gPSAwO1xuICAgICAgICAgICAgbWF0WzRdID0gMDtcbiAgICAgICAgICAgIG1hdFs1XSA9IDE7XG4gICAgICAgICAgICBtYXRbNl0gPSAwO1xuICAgICAgICAgICAgbWF0WzddID0gMDtcbiAgICAgICAgICAgIG1hdFs4XSA9IDA7XG4gICAgICAgICAgICBtYXRbOV0gPSAwO1xuICAgICAgICAgICAgbWF0WzEwXSA9IDE7XG4gICAgICAgICAgICBtYXRbMTFdID0gMDtcbiAgICAgICAgICAgIG1hdFsxMl0gPSB4O1xuICAgICAgICAgICAgbWF0WzEzXSA9IHk7XG4gICAgICAgICAgICBtYXRbMTRdID0gejtcbiAgICAgICAgICAgIG1hdFsxNV0gPSAxO1xuICAgICAgICAgICAgcmV0dXJuIG1hdDtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2V0T3J0aG9NYXRyaXg6IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gICAgICAgICAgICB2YXIgbWF0ID0gbmV3IEZsb2F0MzJBcnJheSgxNik7XG4gICAgICAgICAgICBtYXRbMF0gPSAyIC8gKHJpZ2h0IC0gbGVmdCk7XG4gICAgICAgICAgICBtYXRbMV0gPSAwO1xuICAgICAgICAgICAgbWF0WzJdID0gMDtcbiAgICAgICAgICAgIG1hdFszXSA9IDA7XG4gICAgICAgICAgICBtYXRbNF0gPSAwO1xuICAgICAgICAgICAgbWF0WzVdID0gMiAvICh0b3AgLSBib3R0b20pO1xuICAgICAgICAgICAgbWF0WzZdID0gMDtcbiAgICAgICAgICAgIG1hdFs3XSA9IDA7XG4gICAgICAgICAgICBtYXRbOF0gPSAwO1xuICAgICAgICAgICAgbWF0WzldID0gMDtcbiAgICAgICAgICAgIG1hdFsxMF0gPSAtMiAvIChmYXIgLSBuZWFyKTtcbiAgICAgICAgICAgIG1hdFsxMV0gPSAwO1xuICAgICAgICAgICAgbWF0WzEyXSA9IC0oKHJpZ2h0ICsgbGVmdCkgLyAocmlnaHQgLSBsZWZ0KSk7XG4gICAgICAgICAgICBtYXRbMTNdID0gLSgodG9wICsgYm90dG9tKSAvICh0b3AgLSBib3R0b20pKTtcbiAgICAgICAgICAgIG1hdFsxNF0gPSAtKChmYXIgKyBuZWFyKSAvIChmYXIgLSBuZWFyKSk7XG4gICAgICAgICAgICBtYXRbMTVdID0gMTtcbiAgICAgICAgICAgIHJldHVybiBtYXQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dldFByb2plY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGJvdW5kcyA9IHRoaXMuX21hcC5nZXRQaXhlbEJvdW5kcygpO1xuICAgICAgICAgICAgdmFyIGRpbSA9IE1hdGgucG93KDIsIHRoaXMuX21hcC5nZXRab29tKCkpICogMjU2O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dldE9ydGhvTWF0cml4KFxuICAgICAgICAgICAgICAgIGJvdW5kcy5taW4ueCxcbiAgICAgICAgICAgICAgICBib3VuZHMubWF4LngsXG4gICAgICAgICAgICAgICAgKGRpbSAtIGJvdW5kcy5tYXgueSksXG4gICAgICAgICAgICAgICAgKGRpbSAtIGJvdW5kcy5taW4ueSksXG4gICAgICAgICAgICAgICAgLTEsIDEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9kcmF3OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc0hpZGRlbigpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlLXBvc2l0aW9uIGNhbnZhc1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2lzWm9vbWluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGZhcncgdGhlIGZyYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJGcmFtZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLl9kcmF3LmJpbmQodGhpcykpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9yZW5kZXJGcmFtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX21hcC5nZXRTaXplKCk7XG4gICAgICAgICAgICAvLyBzZXQgY2FudmFzIHNpemVcbiAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lci53aWR0aCA9IHNpemUueDtcbiAgICAgICAgICAgIHRoaXMuX2NvbnRhaW5lci5oZWlnaHQgPSBzaXplLnk7XG4gICAgICAgICAgICAvLyBzZXQgdmlld3BvcnQgc2l6ZVxuICAgICAgICAgICAgdGhpcy5fdmlld3BvcnQucmVzaXplKHNpemUueCwgc2l6ZS55KTtcbiAgICAgICAgICAgIC8vIHJlLXBvc2l0aW9uIGNvbnRhaW5lclxuICAgICAgICAgICAgdmFyIHRvcExlZnQgPSB0aGlzLl9tYXAuY29udGFpbmVyUG9pbnRUb0xheWVyUG9pbnQoWzAsIDBdKTtcbiAgICAgICAgICAgIEwuRG9tVXRpbC5zZXRQb3NpdGlvbih0aGlzLl9jb250YWluZXIsIHRvcExlZnQpO1xuICAgICAgICAgICAgLy8gc2V0dXBcbiAgICAgICAgICAgIHZhciBnbCA9IHRoaXMuX2dsO1xuICAgICAgICAgICAgdGhpcy5fdmlld3BvcnQucHVzaCgpO1xuICAgICAgICAgICAgdGhpcy5fc2hhZGVyLnB1c2goKTtcbiAgICAgICAgICAgIHRoaXMuX3NoYWRlci5zZXRVbmlmb3JtKCd1UHJvamVjdGlvbk1hdHJpeCcsIHRoaXMuX2dldFByb2plY3Rpb24oKSk7XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIuc2V0VW5pZm9ybSgndU9wYWNpdHknLCB0aGlzLmdldE9wYWNpdHkoKSk7XG4gICAgICAgICAgICB0aGlzLl9zaGFkZXIuc2V0VW5pZm9ybSgndVRleHR1cmVTYW1wbGVyJywgMCk7XG4gICAgICAgICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICAgICAgICAgIC8vIGRyYXdcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlclRpbGVzKCk7XG4gICAgICAgICAgICAvLyB0ZWFyZG93blxuICAgICAgICAgICAgdGhpcy5fc2hhZGVyLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5fdmlld3BvcnQucG9wKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlbmRlclRpbGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhciBkaW0gPSBNYXRoLnBvdygyLCB0aGlzLl9tYXAuZ2V0Wm9vbSgpKSAqIDI1NjtcbiAgICAgICAgICAgIC8vIGZvciBlYWNoIHRpbGVcbiAgICAgICAgICAgIF8uZm9ySW4odGhpcy5fY2FjaGUsIGZ1bmN0aW9uKGNhY2hlZCkge1xuICAgICAgICAgICAgICAgIGlmICghY2FjaGVkLnRleHR1cmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBiaW5kIHRpbGUgdGV4dHVyZSB0byB0ZXh0dXJlIHVuaXQgMFxuICAgICAgICAgICAgICAgIGNhY2hlZC50ZXh0dXJlLnB1c2goMCk7XG4gICAgICAgICAgICAgICAgXy5mb3JJbihjYWNoZWQudGlsZXMsIGZ1bmN0aW9uKHRpbGUsIGtleSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIHRoZSB0aWxlcyBwb3NpdGlvbiBmcm9tIGl0cyBrZXlcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvb3JkID0gc2VsZi5jb29yZEZyb21DYWNoZUtleShrZXkpO1xuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgbW9kZWwgbWF0cml4XG4gICAgICAgICAgICAgICAgICAgIHZhciBtb2RlbCA9IHNlbGYuX2dldFRyYW5zbGF0aW9uTWF0cml4KFxuICAgICAgICAgICAgICAgICAgICAgICAgMjU2ICogY29vcmQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpbSAtICgyNTYgKiBjb29yZC55KSxcbiAgICAgICAgICAgICAgICAgICAgICAgIDApO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLl9zaGFkZXIuc2V0VW5pZm9ybSgndU1vZGVsTWF0cml4JywgbW9kZWwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBkcmF3IHRoZSB0aWxlXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuX3JlbmRlcmFibGUuZHJhdygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIG5vIG5lZWQgdG8gdW5iaW5kIHRleHR1cmVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9idWZmZXJUaWxlVGV4dHVyZTogZnVuY3Rpb24oY2FjaGVkKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IG5ldyBGbG9hdDY0QXJyYXkoY2FjaGVkLmRhdGEpO1xuICAgICAgICAgICAgdmFyIHJlc29sdXRpb24gPSBNYXRoLnNxcnQoZGF0YS5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihkYXRhLmxlbmd0aCAqIDQpO1xuICAgICAgICAgICAgdmFyIGJpbnMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICAgICAgdmFyIG52YWwsIHJ2YWwsIGJpbiwgaTtcbiAgICAgICAgICAgIHZhciByYW1wID0gdGhpcy5nZXRDb2xvclJhbXAoKTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGZvciAoaT0wOyBpPGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBiaW4gPSBkYXRhW2ldO1xuICAgICAgICAgICAgICAgIGlmIChiaW4gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbMF0gPSAwO1xuICAgICAgICAgICAgICAgICAgICBjb2xvclsxXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yWzJdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbM10gPSAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG52YWwgPSBzZWxmLnRyYW5zZm9ybVZhbHVlKGJpbik7XG4gICAgICAgICAgICAgICAgICAgIHJ2YWwgPSBzZWxmLmludGVycG9sYXRlVG9SYW5nZShudmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmFtcChydmFsLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJpbnNbaSAqIDRdID0gY29sb3JbMF07XG4gICAgICAgICAgICAgICAgYmluc1tpICogNCArIDFdID0gY29sb3JbMV07XG4gICAgICAgICAgICAgICAgYmluc1tpICogNCArIDJdID0gY29sb3JbMl07XG4gICAgICAgICAgICAgICAgYmluc1tpICogNCArIDNdID0gY29sb3JbM107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWNoZWQudGV4dHVyZSA9IG5ldyBlc3Blci5UZXh0dXJlMkQoe1xuICAgICAgICAgICAgICAgIGhlaWdodDogcmVzb2x1dGlvbixcbiAgICAgICAgICAgICAgICB3aWR0aDogcmVzb2x1dGlvbixcbiAgICAgICAgICAgICAgICBzcmM6IGJpbnMsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnUkdCQScsXG4gICAgICAgICAgICAgICAgdHlwZTogJ1VOU0lHTkVEX0JZVEUnLFxuICAgICAgICAgICAgICAgIHdyYXA6ICdDTEFNUF9UT19FREdFJyxcbiAgICAgICAgICAgICAgICBmaWx0ZXI6ICdORUFSRVNUJyxcbiAgICAgICAgICAgICAgICBpbnZlcnRZOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFdlYkdMO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gY2FudmFzIHJlbmRlcmVyc1xuICAgIHZhciBDYW52YXMgPSB7XG4gICAgICAgIEhlYXRtYXA6IHJlcXVpcmUoJy4vdHlwZS9jYW52YXMvSGVhdG1hcCcpLFxuICAgICAgICBUb3BUcmFpbHM6IHJlcXVpcmUoJy4vdHlwZS9jYW52YXMvVG9wVHJhaWxzJyksXG4gICAgICAgIFByZXZpZXc6IHJlcXVpcmUoJy4vdHlwZS9jYW52YXMvUHJldmlldycpXG4gICAgfTtcblxuICAgIC8vIGh0bWwgcmVuZGVyZXJzXG4gICAgdmFyIEhUTUwgPSB7XG4gICAgICAgIEhlYXRtYXA6IHJlcXVpcmUoJy4vdHlwZS9odG1sL0hlYXRtYXAnKSxcbiAgICAgICAgUmluZzogcmVxdWlyZSgnLi90eXBlL2h0bWwvUmluZycpLFxuICAgICAgICBXb3JkQ2xvdWQ6IHJlcXVpcmUoJy4vdHlwZS9odG1sL1dvcmRDbG91ZCcpLFxuICAgICAgICBXb3JkSGlzdG9ncmFtOiByZXF1aXJlKCcuL3R5cGUvaHRtbC9Xb3JkSGlzdG9ncmFtJylcbiAgICB9O1xuXG4gICAgLy8gd2ViZ2wgcmVuZGVyZXJzXG4gICAgdmFyIFdlYkdMID0ge1xuICAgICAgICBIZWF0bWFwOiByZXF1aXJlKCcuL3R5cGUvd2ViZ2wvSGVhdG1hcCcpXG4gICAgfTtcblxuICAgIC8vIHBlbmRpbmcgbGF5ZXIgcmVuZGVyZXJzXG4gICAgdmFyIFBlbmRpbmcgPSB7XG4gICAgICAgIEJsaW5rOiByZXF1aXJlKCcuL3R5cGUvcGVuZGluZy9CbGluaycpLFxuICAgICAgICBTcGluOiByZXF1aXJlKCcuL3R5cGUvcGVuZGluZy9TcGluJyksXG4gICAgICAgIEJsaW5rU3BpbjogcmVxdWlyZSgnLi90eXBlL3BlbmRpbmcvQmxpbmtTcGluJylcbiAgICB9O1xuXG4gICAgLy8gcGVuZGluZyBsYXllciByZW5kZXJlcnNcbiAgICB2YXIgRGVidWcgPSB7XG4gICAgICAgIENvb3JkOiByZXF1aXJlKCcuL3R5cGUvZGVidWcvQ29vcmQnKVxuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgSFRNTDogSFRNTCxcbiAgICAgICAgQ2FudmFzOiBDYW52YXMsXG4gICAgICAgIFdlYkdMOiBXZWJHTCxcbiAgICAgICAgRGVidWc6IERlYnVnLFxuICAgICAgICBQZW5kaW5nOiBQZW5kaW5nXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBQT1NJVElWRSA9ICcxJztcbiAgICB2YXIgTkVVVFJBTCA9ICcwJztcbiAgICB2YXIgTkVHQVRJVkUgPSAnLTEnO1xuXG4gICAgZnVuY3Rpb24gZ2V0Q2xhc3NGdW5jKG1pbiwgbWF4KSB7XG4gICAgICAgIG1pbiA9IG1pbiAhPT0gdW5kZWZpbmVkID8gbWluIDogLTE7XG4gICAgICAgIG1heCA9IG1heCAhPT0gdW5kZWZpbmVkID8gbWF4IDogMTtcbiAgICAgICAgdmFyIHBvc2l0aXZlID0gWzAuMjUgKiBtYXgsIDAuNSAqIG1heCwgMC43NSAqIG1heF07XG4gICAgICAgIHZhciBuZWdhdGl2ZSA9IFstMC4yNSAqIG1pbiwgLTAuNSAqIG1pbiwgLTAuNzUgKiBtaW5dO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oc2VudGltZW50KSB7XG4gICAgICAgICAgICB2YXIgcHJlZml4O1xuICAgICAgICAgICAgdmFyIHJhbmdlO1xuICAgICAgICAgICAgaWYgKHNlbnRpbWVudCA8IDApIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggPSAnbmVnLSc7XG4gICAgICAgICAgICAgICAgcmFuZ2UgPSBuZWdhdGl2ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJ3Bvcy0nO1xuICAgICAgICAgICAgICAgIHJhbmdlID0gcG9zaXRpdmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYWJzID0gTWF0aC5hYnMoc2VudGltZW50KTtcbiAgICAgICAgICAgIGlmIChhYnMgPiByYW5nZVsyXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyAnNCc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFicyA+IHJhbmdlWzFdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArICczJztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYWJzID4gcmFuZ2VbMF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJlZml4ICsgJzInO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByZWZpeCArICcxJztcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRUb3RhbChjb3VudCkge1xuICAgICAgICBpZiAoIWNvdW50KSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcG9zID0gY291bnRbUE9TSVRJVkVdID8gY291bnRbUE9TSVRJVkVdIDogMDtcbiAgICAgICAgdmFyIG5ldSA9IGNvdW50W05FVVRSQUxdID8gY291bnRbTkVVVFJBTF0gOiAwO1xuICAgICAgICB2YXIgbmVnID0gY291bnRbTkVHQVRJVkVdID8gY291bnRbTkVHQVRJVkVdIDogMDtcbiAgICAgICAgcmV0dXJuIHBvcyArIG5ldSArIG5lZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRBdmcoY291bnQpIHtcbiAgICAgICAgaWYgKCFjb3VudCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBvcyA9IGNvdW50W1BPU0lUSVZFXSA/IGNvdW50W1BPU0lUSVZFXSA6IDA7XG4gICAgICAgIHZhciBuZXUgPSBjb3VudFtORVVUUkFMXSA/IGNvdW50W05FVVRSQUxdIDogMDtcbiAgICAgICAgdmFyIG5lZyA9IGNvdW50W05FR0FUSVZFXSA/IGNvdW50W05FR0FUSVZFXSA6IDA7XG4gICAgICAgIHZhciB0b3RhbCA9IHBvcyArIG5ldSArIG5lZztcbiAgICAgICAgcmV0dXJuICh0b3RhbCAhPT0gMCkgPyAocG9zIC0gbmVnKSAvIHRvdGFsIDogMDtcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAgICAgZ2V0Q2xhc3NGdW5jOiBnZXRDbGFzc0Z1bmMsXG4gICAgICAgIGdldFRvdGFsOiBnZXRUb3RhbCxcbiAgICAgICAgZ2V0QXZnOiBnZXRBdmdcbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIENhbnZhcyA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvQ2FudmFzJyk7XG5cbiAgICB2YXIgSGVhdG1hcCA9IENhbnZhcy5leHRlbmQoe1xuXG4gICAgICAgIHJlbmRlckNhbnZhczogZnVuY3Rpb24oYmlucywgcmVzb2x1dGlvbiwgcmFtcCkge1xuICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHJlc29sdXRpb247XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSByZXNvbHV0aW9uO1xuICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgdmFyIGltYWdlRGF0YSA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgcmVzb2x1dGlvbiwgcmVzb2x1dGlvbik7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGltYWdlRGF0YS5kYXRhO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICAgICAgdmFyIG52YWwsIHJ2YWwsIGJpbiwgaTtcbiAgICAgICAgICAgIGZvciAoaT0wOyBpPGJpbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBiaW4gPSBiaW5zW2ldO1xuICAgICAgICAgICAgICAgIGlmIChiaW4gPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbMF0gPSAwO1xuICAgICAgICAgICAgICAgICAgICBjb2xvclsxXSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbG9yWzJdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbM10gPSAwO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG52YWwgPSBzZWxmLnRyYW5zZm9ybVZhbHVlKGJpbik7XG4gICAgICAgICAgICAgICAgICAgIHJ2YWwgPSBzZWxmLmludGVycG9sYXRlVG9SYW5nZShudmFsKTtcbiAgICAgICAgICAgICAgICAgICAgcmFtcChydmFsLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRhdGFbaSAqIDRdID0gY29sb3JbMF07XG4gICAgICAgICAgICAgICAgZGF0YVtpICogNCArIDFdID0gY29sb3JbMV07XG4gICAgICAgICAgICAgICAgZGF0YVtpICogNCArIDJdID0gY29sb3JbMl07XG4gICAgICAgICAgICAgICAgZGF0YVtpICogNCArIDNdID0gY29sb3JbM107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlRGF0YSwgMCwgMCk7XG4gICAgICAgICAgICByZXR1cm4gY2FudmFzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGNhbnZhcywgZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGJpbnMgPSBuZXcgRmxvYXQ2NEFycmF5KGRhdGEpO1xuICAgICAgICAgICAgdmFyIHJlc29sdXRpb24gPSBNYXRoLnNxcnQoYmlucy5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIHJhbXAgPSB0aGlzLmdldENvbG9yUmFtcCgpO1xuICAgICAgICAgICAgdmFyIHRpbGVDYW52YXMgPSB0aGlzLnJlbmRlckNhbnZhcyhiaW5zLCByZXNvbHV0aW9uLCByYW1wKTtcbiAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgIGN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoXG4gICAgICAgICAgICAgICAgdGlsZUNhbnZhcyxcbiAgICAgICAgICAgICAgICAwLCAwLFxuICAgICAgICAgICAgICAgIHJlc29sdXRpb24sIHJlc29sdXRpb24sXG4gICAgICAgICAgICAgICAgMCwgMCxcbiAgICAgICAgICAgICAgICBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gSGVhdG1hcDtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBDYW52YXMgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0NhbnZhcycpO1xuXG4gICAgdmFyIFByZXZpZXcgPSBDYW52YXMuZXh0ZW5kKHtcblxuICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICBsaW5lV2lkdGg6IDIsXG4gICAgICAgICAgICBsaW5lQ29sb3I6ICdsaWdodGJsdWUnLFxuICAgICAgICAgICAgZmlsbENvbG9yOiAnZGFya2JsdWUnLFxuICAgICAgICB9LFxuXG4gICAgICAgIGhpZ2hsaWdodGVkOiBmYWxzZSxcblxuICAgICAgICBfZHJhd0hpZ2hsaWdodDogZnVuY3Rpb24oY2FudmFzLCB4LCB5LCBzaXplKSB7XG4gICAgICAgICAgICB2YXIgc2l6ZU92ZXIyID0gc2l6ZSAvIDI7XG4gICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhpcy5vcHRpb25zLmZpbGxDb2xvcjtcbiAgICAgICAgICAgIGN0eC5hcmMoXG4gICAgICAgICAgICAgICAgeCAqIHNpemUgKyBzaXplT3ZlcjIsXG4gICAgICAgICAgICAgICAgeSAqIHNpemUgKyBzaXplT3ZlcjIsXG4gICAgICAgICAgICAgICAgc2l6ZU92ZXIyLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMiAqIE1hdGguUEksXG4gICAgICAgICAgICAgICAgZmFsc2UpO1xuICAgICAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgICAgIGN0eC5saW5lV2lkdGggPSB0aGlzLm9wdGlvbnMubGluZVdpZHRoO1xuICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5vcHRpb25zLmxpbmVDb2xvcjtcbiAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlTW92ZTogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICBpZiAodGhpcy5oaWdobGlnaHRlZCkge1xuICAgICAgICAgICAgICAgIC8vIGNsZWFyIGV4aXN0aW5nIGhpZ2hsaWdodFxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaWxlcygpO1xuICAgICAgICAgICAgICAgIC8vIGNsZWFyIGhpZ2hsaWdodGVkIGZsYWdcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBnZXQgbGF5ZXIgY29vcmRcbiAgICAgICAgICAgIHZhciBsYXllclBvaW50ID0gdGhpcy5fZ2V0TGF5ZXJQb2ludEZyb21FdmVudChlKTtcbiAgICAgICAgICAgIC8vIGdldCB0aWxlIGNvb3JkXG4gICAgICAgICAgICB2YXIgY29vcmQgPSB0aGlzLl9nZXRUaWxlQ29vcmRGcm9tTGF5ZXJQb2ludChsYXllclBvaW50KTtcbiAgICAgICAgICAgIC8vIGdldCBjYWNoZSBrZXlcbiAgICAgICAgICAgIHZhciBua2V5ID0gdGhpcy5jYWNoZUtleUZyb21Db29yZChjb29yZCwgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBnZXQgY2FjaGUgZW50cnlcbiAgICAgICAgICAgIHZhciBjYWNoZWQgPSB0aGlzLl9jYWNoZVtua2V5XTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQgJiYgY2FjaGVkLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAvLyBnZXQgYmluIGNvb3JkaW5hdGVcbiAgICAgICAgICAgICAgICB2YXIgYmluID0gdGhpcy5fZ2V0QmluQ29vcmRGcm9tTGF5ZXJQb2ludChsYXllclBvaW50KTtcbiAgICAgICAgICAgICAgICAvLyBnZXQgYmluIGRhdGEgZW50cnlcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGNhY2hlZC5kYXRhW2Jpbi5pbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggdGlsZSByZWx5aW5nIG9uIHRoYXQgZGF0YVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIF8uZm9ySW4oY2FjaGVkLnRpbGVzLCBmdW5jdGlvbih0aWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9kcmF3SGlnaGxpZ2h0KHRpbGUsIGJpbi54LCBiaW4ueSwgYmluLnNpemUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmxhZyBhcyBoaWdobGlnaHRlZFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXhlY3V0ZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlbW92ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlbW92ZSh0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiBjb29yZC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGNvb3JkLnosXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgejogY29vcmQueixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBieDogYmluLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnk6IGJpbi55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwcmV2aWV3JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2Vtb3ZlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlbW92ZSh0YXJnZXQsIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gUHJldmlldztcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBDYW52YXMgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0NhbnZhcycpO1xuXG4gICAgdmFyIFRvcFRyYWlscyA9IENhbnZhcy5leHRlbmQoe1xuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIGNvbG9yOiBbMjU1LCAwLCAyNTUsIDI1NV0sXG4gICAgICAgICAgICBkb3duU2FtcGxlRmFjdG9yOiA4XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlnaGxpZ2h0ZWQ6IGZhbHNlLFxuXG4gICAgICAgIG9uTW91c2VNb3ZlOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIGlmICh0aGlzLmhpZ2hsaWdodGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gY2xlYXIgZXhpc3RpbmcgaGlnaGxpZ2h0c1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaWxlcygpO1xuICAgICAgICAgICAgICAgIC8vIGNsZWFyIGhpZ2hsaWdodGVkIGZsYWdcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBnZXQgbGF5ZXIgY29vcmRcbiAgICAgICAgICAgIHZhciBsYXllclBvaW50ID0gdGhpcy5fZ2V0TGF5ZXJQb2ludEZyb21FdmVudChlKTtcbiAgICAgICAgICAgIC8vIGdldCB0aWxlIGNvb3JkXG4gICAgICAgICAgICB2YXIgY29vcmQgPSB0aGlzLl9nZXRUaWxlQ29vcmRGcm9tTGF5ZXJQb2ludChsYXllclBvaW50KTtcbiAgICAgICAgICAgIC8vIGdldCBjYWNoZSBrZXlcbiAgICAgICAgICAgIHZhciBua2V5ID0gdGhpcy5jYWNoZUtleUZyb21Db29yZChjb29yZCwgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBnZXQgY2FjaGUgZW50cnlcbiAgICAgICAgICAgIHZhciBjYWNoZWQgPSB0aGlzLl9jYWNoZVtua2V5XTtcbiAgICAgICAgICAgIGlmIChjYWNoZWQgJiYgY2FjaGVkLnBpeGVscykge1xuICAgICAgICAgICAgICAgIC8vIGdldCBiaW4gY29vcmRpbmF0ZVxuICAgICAgICAgICAgICAgIHZhciBiaW4gPSB0aGlzLl9nZXRCaW5Db29yZEZyb21MYXllclBvaW50KGxheWVyUG9pbnQpO1xuICAgICAgICAgICAgICAgIC8vIGRvd25zYW1wbGUgdGhlIGJpbiByZXNcbiAgICAgICAgICAgICAgICB2YXIgeCA9IE1hdGguZmxvb3IoYmluLnggLyB0aGlzLm9wdGlvbnMuZG93blNhbXBsZUZhY3Rvcik7XG4gICAgICAgICAgICAgICAgdmFyIHkgPSBNYXRoLmZsb29yKGJpbi55IC8gdGhpcy5vcHRpb25zLmRvd25TYW1wbGVGYWN0b3IpO1xuICAgICAgICAgICAgICAgIC8vIGlmIGhpdHMgYSBwaXhlbFxuICAgICAgICAgICAgICAgIGlmIChjYWNoZWQucGl4ZWxzW3hdICYmIGNhY2hlZC5waXhlbHNbeF1beV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkcyA9IE9iamVjdC5rZXlzKGNhY2hlZC5waXhlbHNbeF1beV0pO1xuICAgICAgICAgICAgICAgICAgICAvLyB0YWtlIGZpcnN0IGVudHJ5XG4gICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IGlkc1swXTtcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9yIGVhY2ggY2FjaGUgZW50cnlcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICBfLmZvckluKHRoaXMuX2NhY2hlLCBmdW5jdGlvbihjYWNoZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZWQuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZvciBlYWNoIHRpbGUgcmVseWluZyBvbiB0aGF0IGRhdGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfLmZvckluKGNhY2hlZC50aWxlcywgZnVuY3Rpb24odGlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHJhaWwgPSBjYWNoZWQudHJhaWxzW2lkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRyYWlsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9oaWdobGlnaHRUcmFpbCh0aWxlLCB0cmFpbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGV4ZWN1dGUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW1vdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW1vdmUodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGNvb3JkLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogY29vcmQueixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6OiBjb29yZC56LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ4OiBiaW4ueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBieTogYmluLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3RvcC10cmFpbHMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBmbGFnIGFzIGhpZ2hsaWdodGVkXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW1vdmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2Vtb3ZlKHRhcmdldCwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2hpZ2hsaWdodFRyYWlsOiBmdW5jdGlvbihjYW52YXMsIHBpeGVscykge1xuICAgICAgICAgICAgdmFyIHJlc29sdXRpb24gPSB0aGlzLmdldFJlc29sdXRpb24oKSB8fCB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBoaWdobGlnaHQuaGVpZ2h0ID0gcmVzb2x1dGlvbjtcbiAgICAgICAgICAgIGhpZ2hsaWdodC53aWR0aCA9IHJlc29sdXRpb247XG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0Q3R4ID0gaGlnaGxpZ2h0LmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICB2YXIgaW1hZ2VEYXRhID0gaGlnaGxpZ2h0Q3R4LmdldEltYWdlRGF0YSgwLCAwLCByZXNvbHV0aW9uLCByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgIHZhciBkYXRhID0gaW1hZ2VEYXRhLmRhdGE7XG4gICAgICAgICAgICB2YXIgcGl4ZWwsIHgsIHksIGksIGo7XG4gICAgICAgICAgICBmb3IgKGk9MDsgaTxwaXhlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwaXhlbCA9IHBpeGVsc1tpXTtcbiAgICAgICAgICAgICAgICB4ID0gcGl4ZWxbMF07XG4gICAgICAgICAgICAgICAgeSA9IHBpeGVsWzFdO1xuICAgICAgICAgICAgICAgIGogPSB4ICsgKHJlc29sdXRpb24gKiB5KTtcbiAgICAgICAgICAgICAgICBkYXRhW2ogKiA0XSA9IHRoaXMub3B0aW9ucy5jb2xvclswXTtcbiAgICAgICAgICAgICAgICBkYXRhW2ogKiA0ICsgMV0gPSB0aGlzLm9wdGlvbnMuY29sb3JbMV07XG4gICAgICAgICAgICAgICAgZGF0YVtqICogNCArIDJdID0gdGhpcy5vcHRpb25zLmNvbG9yWzJdO1xuICAgICAgICAgICAgICAgIGRhdGFbaiAqIDQgKyAzXSA9IHRoaXMub3B0aW9ucy5jb2xvclszXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhpZ2hsaWdodEN0eC5wdXRJbWFnZURhdGEoaW1hZ2VEYXRhLCAwLCAwKTtcbiAgICAgICAgICAgIC8vIGRyYXcgdG8gdGlsZVxuICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgY3R4LmltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShcbiAgICAgICAgICAgICAgICBoaWdobGlnaHQsXG4gICAgICAgICAgICAgICAgMCwgMCxcbiAgICAgICAgICAgICAgICByZXNvbHV0aW9uLCByZXNvbHV0aW9uLFxuICAgICAgICAgICAgICAgIDAsIDAsXG4gICAgICAgICAgICAgICAgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihjb250YWluZXIsIGRhdGEsIGNvb3JkKSB7XG4gICAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBtb2RpZnkgY2FjaGUgZW50cnlcbiAgICAgICAgICAgIHZhciBua2V5ID0gdGhpcy5jYWNoZUtleUZyb21Db29yZChjb29yZCwgdHJ1ZSk7XG4gICAgICAgICAgICB2YXIgY2FjaGVkID0gdGhpcy5fY2FjaGVbbmtleV07XG4gICAgICAgICAgICBpZiAoY2FjaGVkLnRyYWlscykge1xuICAgICAgICAgICAgICAgIC8vIHRyYWlscyBhbHJlYWR5IGFkZGVkLCBleGl0IGVhcmx5XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRyYWlscyA9IGNhY2hlZC50cmFpbHMgPSB7fTtcbiAgICAgICAgICAgIHZhciBwaXhlbHMgPSBjYWNoZWQucGl4ZWxzID0ge307XG4gICAgICAgICAgICB2YXIgaWRzICA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgICAgICAgICAgdmFyIGJpbnMsIGJpbjtcbiAgICAgICAgICAgIHZhciBpZCwgaSwgajtcbiAgICAgICAgICAgIHZhciByeCwgcnksIHgsIHk7XG4gICAgICAgICAgICBmb3IgKGk9MDsgaTxpZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZCA9IGlkc1tpXTtcbiAgICAgICAgICAgICAgICBiaW5zID0gZGF0YVtpZF07XG4gICAgICAgICAgICAgICAgZm9yIChqPTA7IGo8Ymlucy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICBiaW4gPSBiaW5zW2pdO1xuICAgICAgICAgICAgICAgICAgICAvLyBkb3duIHNhbXBsZSB0aGUgcGl4ZWwgdG8gbWFrZSBpbnRlcmFjdGlvbiBlYXNpZXJcbiAgICAgICAgICAgICAgICAgICAgcnggPSBNYXRoLmZsb29yKGJpblswXSAvIHRoaXMub3B0aW9ucy5kb3duU2FtcGxlRmFjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgcnkgPSBNYXRoLmZsb29yKGJpblsxXSAvIHRoaXMub3B0aW9ucy5kb3duU2FtcGxlRmFjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgcGl4ZWxzW3J4XSA9IHBpeGVsc1tyeF0gfHwge307XG4gICAgICAgICAgICAgICAgICAgIHBpeGVsc1tyeF1bcnldID0gcGl4ZWxzW3J4XVtyeV0gfHwge307XG4gICAgICAgICAgICAgICAgICAgIHBpeGVsc1tyeF1bcnldW2lkXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFkZCBwaXhlbCB1bmRlciB0aGUgdHJhaWwgYXQgY29ycmVjdCByZXNvbHV0aW9uXG4gICAgICAgICAgICAgICAgICAgIHggPSBiaW5bMF07XG4gICAgICAgICAgICAgICAgICAgIHkgPSBiaW5bMV07XG4gICAgICAgICAgICAgICAgICAgIHRyYWlsc1tpZF0gPSB0cmFpbHNbaWRdIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICB0cmFpbHNbaWRdLnB1c2goWyB4LCB5IF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRvcFRyYWlscztcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGVsZW0sIGNvb3JkKSB7XG4gICAgICAgICAgICAkKGVsZW0pLmVtcHR5KCk7XG4gICAgICAgICAgICAkKGVsZW0pLmFwcGVuZCgnPGRpdiBzdHlsZT1cInRvcDowOyBsZWZ0OjA7XCI+JyArIGNvb3JkLnogKyAnLCAnICsgY29vcmQueCArICcsICcgKyBjb29yZC55ICsgJzwvZGl2PicpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIEhUTUwgPSByZXF1aXJlKCcuLi8uLi9jb3JlL0hUTUwnKTtcblxuICAgIHZhciBIZWF0bWFwID0gSFRNTC5leHRlbmQoe1xuXG4gICAgICAgIGlzVGFyZ2V0TGF5ZXI6IGZ1bmN0aW9uKCBlbGVtICkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lciAmJiAkLmNvbnRhaW5zKHRoaXMuX2NvbnRhaW5lciwgZWxlbSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdmVyOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHRhcmdldC5hdHRyKCdkYXRhLXZhbHVlJyk7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcih0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBwYXJzZUludCh2YWx1ZSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ4OiBwYXJzZUludCh0YXJnZXQuYXR0cignZGF0YS1ieCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICBieTogcGFyc2VJbnQodGFyZ2V0LmF0dHIoJ2RhdGEtYnknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2hlYXRtYXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdGFyZ2V0LmF0dHIoJ2RhdGEtdmFsdWUnKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyICRwYXJlbnQgPSB0YXJnZXQucGFyZW50cygnLmxlYWZsZXQtaHRtbC10aWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oYW5kbGVycy5tb3VzZW91dCh0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBieDogcGFyc2VJbnQodGFyZ2V0LmF0dHIoJ2RhdGEtYngnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgYnk6IHBhcnNlSW50KHRhcmdldC5hdHRyKCdkYXRhLWJ5JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdoZWF0bWFwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAvLyB1bi1zZWxlY3QgYW55IHByZXYgc2VsZWN0ZWQgcGl4ZWxcbiAgICAgICAgICAgICQoJy5oZWF0bWFwLXBpeGVsJykucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgLy8gZ2V0IHRhcmdldFxuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNUYXJnZXRMYXllcihlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIC8vIHRoaXMgbGF5ZXIgaXMgbm90IHRoZSB0YXJnZXRcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIHRhcmdldC5oYXNDbGFzcygnaGVhdG1hcC1waXhlbCcpICkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5hZGRDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB0YXJnZXQuYXR0cignZGF0YS12YWx1ZScpO1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5jbGljaykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLmNsaWNrKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ4OiBwYXJzZUludCh0YXJnZXQuYXR0cignZGF0YS1ieCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICBieTogcGFyc2VJbnQodGFyZ2V0LmF0dHIoJ2RhdGEtYnknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2hlYXRtYXAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGNvbnRhaW5lciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGJpbnMgPSBuZXcgRmxvYXQ2NEFycmF5KGRhdGEpO1xuICAgICAgICAgICAgdmFyIHJlc29sdXRpb24gPSBNYXRoLnNxcnQoYmlucy5sZW5ndGgpO1xuICAgICAgICAgICAgdmFyIHJhbXBGdW5jID0gdGhpcy5nZXRDb2xvclJhbXAoKTtcbiAgICAgICAgICAgIHZhciBwaXhlbFNpemUgPSB0aGlzLm9wdGlvbnMudGlsZVNpemUgLyByZXNvbHV0aW9uO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGNvbG9yID0gWzAsIDAsIDAsIDBdO1xuICAgICAgICAgICAgdmFyIGh0bWwgPSAnJztcbiAgICAgICAgICAgIHZhciBudmFsLCBydmFsLCBiaW47XG4gICAgICAgICAgICB2YXIgbGVmdCwgdG9wO1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGk9MDsgaTxiaW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYmluID0gYmluc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoYmluID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxlZnQgPSAoaSAlIHJlc29sdXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0b3AgPSBNYXRoLmZsb29yKGkgLyByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgbnZhbCA9IHNlbGYudHJhbnNmb3JtVmFsdWUoYmluKTtcbiAgICAgICAgICAgICAgICAgICAgcnZhbCA9IHNlbGYuaW50ZXJwb2xhdGVUb1JhbmdlKG52YWwpO1xuICAgICAgICAgICAgICAgICAgICByYW1wRnVuYyhydmFsLCBjb2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciByZ2JhID0gJ3JnYmEoJyArXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yWzBdICsgJywnICtcbiAgICAgICAgICAgICAgICAgICAgY29sb3JbMV0gKyAnLCcgK1xuICAgICAgICAgICAgICAgICAgICBjb2xvclsyXSArICcsJyArXG4gICAgICAgICAgICAgICAgICAgIChjb2xvclszXSAvIDI1NSkgKyAnKSc7XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cImhlYXRtYXAtcGl4ZWxcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtdmFsdWU9XCInICsgYmluICsgJ1wiICcgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS1ieD1cIicgKyBsZWZ0ICsgJ1wiICcgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS1ieT1cIicgKyB0b3AgKyAnXCIgJyArXG4gICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgK1xuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0OicgKyBwaXhlbFNpemUgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aDonICsgcGl4ZWxTaXplICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAnbGVmdDonICsgKGxlZnQgKiBwaXhlbFNpemUpICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAndG9wOicgKyAodG9wICogcGl4ZWxTaXplKSArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3I6JyArIHJnYmEgKyAnO1wiPjwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gaHRtbDtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhlYXRtYXA7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgSFRNTCA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvSFRNTCcpO1xuXG4gICAgdmFyIEhlYXRtYXAgPSBIVE1MLmV4dGVuZCh7XG5cbiAgICAgICAgb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICAkKCcuaGVhdG1hcC1yaW5nJykucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgaWYgKCB0YXJnZXQuaGFzQ2xhc3MoJ2hlYXRtYXAtcmluZycpICkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5hZGRDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyVGlsZTogZnVuY3Rpb24oY29udGFpbmVyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgYmlucyA9IG5ldyBGbG9hdDY0QXJyYXkoZGF0YSk7XG4gICAgICAgICAgICB2YXIgcmVzb2x1dGlvbiA9IE1hdGguc3FydChiaW5zLmxlbmd0aCk7XG4gICAgICAgICAgICB2YXIgYmluU2l6ZSA9ICh0aGlzLm9wdGlvbnMudGlsZVNpemUgLyByZXNvbHV0aW9uKTtcbiAgICAgICAgICAgIHZhciBodG1sID0gJyc7XG4gICAgICAgICAgICBiaW5zLmZvckVhY2goZnVuY3Rpb24oYmluLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICghYmluKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHBlcmNlbnQgPSBzZWxmLnRyYW5zZm9ybVZhbHVlKGJpbik7XG4gICAgICAgICAgICAgICAgdmFyIHJhZGl1cyA9IHBlcmNlbnQgKiBiaW5TaXplO1xuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAoYmluU2l6ZSAtIHJhZGl1cykgLyAyO1xuICAgICAgICAgICAgICAgIHZhciBsZWZ0ID0gKGluZGV4ICUgcmVzb2x1dGlvbikgKiBiaW5TaXplO1xuICAgICAgICAgICAgICAgIHZhciB0b3AgPSBNYXRoLmZsb29yKGluZGV4IC8gcmVzb2x1dGlvbikgKiBiaW5TaXplO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJoZWF0bWFwLXJpbmdcIiBzdHlsZT1cIicgK1xuICAgICAgICAgICAgICAgICAgICAnbGVmdDonICsgKGxlZnQgKyBvZmZzZXQpICsgJ3B4OycgK1xuICAgICAgICAgICAgICAgICAgICAndG9wOicgKyAodG9wICsgb2Zmc2V0KSArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoOicgKyByYWRpdXMgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQ6JyArIHJhZGl1cyArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ1wiPjwvZGl2Pic7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gSGVhdG1hcDtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBIVE1MID0gcmVxdWlyZSgnLi4vLi4vY29yZS9IVE1MJyk7XG4gICAgdmFyIHNlbnRpbWVudCA9IHJlcXVpcmUoJy4uLy4uL3NlbnRpbWVudC9TZW50aW1lbnQnKTtcbiAgICB2YXIgc2VudGltZW50RnVuYyA9IHNlbnRpbWVudC5nZXRDbGFzc0Z1bmMoLTEsIDEpO1xuXG4gICAgdmFyIFZFUlRJQ0FMX09GRlNFVCA9IDI0O1xuICAgIHZhciBIT1JJWk9OVEFMX09GRlNFVCA9IDEwO1xuICAgIHZhciBOVU1fQVRURU1QVFMgPSAxO1xuXG4gICAgLyoqXG4gICAgICogR2l2ZW4gYW4gaW5pdGlhbCBwb3NpdGlvbiwgcmV0dXJuIGEgbmV3IHBvc2l0aW9uLCBpbmNyZW1lbnRhbGx5IHNwaXJhbGxlZFxuICAgICAqIG91dHdhcmRzLlxuICAgICAqL1xuICAgIHZhciBzcGlyYWxQb3NpdGlvbiA9IGZ1bmN0aW9uKHBvcykge1xuICAgICAgICB2YXIgcGkyID0gMiAqIE1hdGguUEk7XG4gICAgICAgIHZhciBjaXJjID0gcGkyICogcG9zLnJhZGl1cztcbiAgICAgICAgdmFyIGluYyA9IChwb3MuYXJjTGVuZ3RoID4gY2lyYyAvIDEwKSA/IGNpcmMgLyAxMCA6IHBvcy5hcmNMZW5ndGg7XG4gICAgICAgIHZhciBkYSA9IGluYyAvIHBvcy5yYWRpdXM7XG4gICAgICAgIHZhciBudCA9IChwb3MudCArIGRhKTtcbiAgICAgICAgaWYgKG50ID4gcGkyKSB7XG4gICAgICAgICAgICBudCA9IG50ICUgcGkyO1xuICAgICAgICAgICAgcG9zLnJhZGl1cyA9IHBvcy5yYWRpdXMgKyBwb3MucmFkaXVzSW5jO1xuICAgICAgICB9XG4gICAgICAgIHBvcy50ID0gbnQ7XG4gICAgICAgIHBvcy54ID0gcG9zLnJhZGl1cyAqIE1hdGguY29zKG50KTtcbiAgICAgICAgcG9zLnkgPSBwb3MucmFkaXVzICogTWF0aC5zaW4obnQpO1xuICAgICAgICByZXR1cm4gcG9zO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiAgUmV0dXJucyB0cnVlIGlmIGJvdW5kaW5nIGJveCBhIGludGVyc2VjdHMgYm91bmRpbmcgYm94IGJcbiAgICAgKi9cbiAgICB2YXIgaW50ZXJzZWN0VGVzdCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIChNYXRoLmFicyhhLnggLSBiLngpICogMiA8IChhLndpZHRoICsgYi53aWR0aCkpICYmXG4gICAgICAgICAgICAoTWF0aC5hYnMoYS55IC0gYi55KSAqIDIgPCAoYS5oZWlnaHQgKyBiLmhlaWdodCkpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiAgUmV0dXJucyB0cnVlIGlmIGJvdW5kaW5nIGJveCBhIGlzIG5vdCBmdWxseSBjb250YWluZWQgaW5zaWRlIGJvdW5kaW5nIGJveCBiXG4gICAgICovXG4gICAgdmFyIG92ZXJsYXBUZXN0ID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgICByZXR1cm4gKGEueCArIGEud2lkdGggLyAyID4gYi54ICsgYi53aWR0aCAvIDIgfHxcbiAgICAgICAgICAgIGEueCAtIGEud2lkdGggLyAyIDwgYi54IC0gYi53aWR0aCAvIDIgfHxcbiAgICAgICAgICAgIGEueSArIGEuaGVpZ2h0IC8gMiA+IGIueSArIGIuaGVpZ2h0IC8gMiB8fFxuICAgICAgICAgICAgYS55IC0gYS5oZWlnaHQgLyAyIDwgYi55IC0gYi5oZWlnaHQgLyAyKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgYSB3b3JkIGludGVyc2VjdHMgYW5vdGhlciB3b3JkLCBvciBpcyBub3QgZnVsbHkgY29udGFpbmVkIGluIHRoZVxuICAgICAqIHRpbGUgYm91bmRpbmcgYm94XG4gICAgICovXG4gICAgdmFyIGludGVyc2VjdFdvcmQgPSBmdW5jdGlvbihwb3NpdGlvbiwgd29yZCwgY2xvdWQsIGJiKSB7XG4gICAgICAgIHZhciBib3ggPSB7XG4gICAgICAgICAgICB4OiBwb3NpdGlvbi54LFxuICAgICAgICAgICAgeTogcG9zaXRpb24ueSxcbiAgICAgICAgICAgIGhlaWdodDogd29yZC5oZWlnaHQsXG4gICAgICAgICAgICB3aWR0aDogd29yZC53aWR0aFxuICAgICAgICB9O1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNsb3VkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0VGVzdChib3gsIGNsb3VkW2ldKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIG1ha2Ugc3VyZSBpdCBkb2Vzbid0IGludGVyc2VjdCB0aGUgYm9yZGVyO1xuICAgICAgICBpZiAob3ZlcmxhcFRlc3QoYm94LCBiYikpIHtcbiAgICAgICAgICAgIC8vIGlmIGl0IGhpdHMgYSBib3JkZXIsIGluY3JlbWVudCBjb2xsaXNpb24gY291bnRcbiAgICAgICAgICAgIC8vIGFuZCBleHRlbmQgYXJjIGxlbmd0aFxuICAgICAgICAgICAgcG9zaXRpb24uY29sbGlzaW9ucysrO1xuICAgICAgICAgICAgcG9zaXRpb24uYXJjTGVuZ3RoID0gcG9zaXRpb24ucmFkaXVzO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICB2YXIgV29yZENsb3VkID0gSFRNTC5leHRlbmQoe1xuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIG1heE51bVdvcmRzOiAxNSxcbiAgICAgICAgICAgIG1pbkZvbnRTaXplOiAxMCxcbiAgICAgICAgICAgIG1heEZvbnRTaXplOiAyMFxuICAgICAgICB9LFxuXG4gICAgICAgIGlzVGFyZ2V0TGF5ZXI6IGZ1bmN0aW9uKCBlbGVtICkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lciAmJiAkLmNvbnRhaW5zKHRoaXMuX2NvbnRhaW5lciwgZWxlbSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsZWFyU2VsZWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZU92ZXI6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgJCgnLndvcmQtY2xvdWQtbGFiZWwnKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAkKCcud29yZC1jbG91ZC1sYWJlbFtkYXRhLXdvcmQ9JyArIHdvcmQgKyAnXScpLmFkZENsYXNzKCdob3ZlcicpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdmVyKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3dvcmQtY2xvdWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uTW91c2VPdXQ6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKGUub3JpZ2luYWxFdmVudC50YXJnZXQpO1xuICAgICAgICAgICAgJCgnLndvcmQtY2xvdWQtbGFiZWwnKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdXQodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd29yZC1jbG91ZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgLy8gdW4tc2VsZWN0IGFueSBwcmV2IHNlbGVjdGVkIHdvcmRzXG4gICAgICAgICAgICAkKCcud29yZC1jbG91ZC1sYWJlbCcpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICAvLyBnZXQgdGFyZ2V0XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1RhcmdldExheWVyKGUub3JpZ2luYWxFdmVudC50YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBsYXllciBpcyBub3QgdGhlIHRhcmdldFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgICAgICQoJy53b3JkLWNsb3VkLWxhYmVsW2RhdGEtd29yZD0nICsgd29yZCArICddJykuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gd29yZDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLmNsaWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMuY2xpY2sodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd29yZC1jbG91ZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfbWVhc3VyZVdvcmRzOiBmdW5jdGlvbih3b3JkQ291bnRzKSB7XG4gICAgICAgICAgICAvLyBzb3J0IHdvcmRzIGJ5IGZyZXF1ZW5jeVxuICAgICAgICAgICAgd29yZENvdW50cyA9IHdvcmRDb3VudHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIuY291bnQgLSBhLmNvdW50O1xuICAgICAgICAgICAgfSkuc2xpY2UoMCwgdGhpcy5vcHRpb25zLm1heE51bVdvcmRzKTtcbiAgICAgICAgICAgIC8vIGJ1aWxkIG1lYXN1cmVtZW50IGh0bWxcbiAgICAgICAgICAgIHZhciBodG1sID0gJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MjU2cHg7IHdpZHRoOjI1NnB4O1wiPic7XG4gICAgICAgICAgICB2YXIgbWluRm9udFNpemUgPSB0aGlzLm9wdGlvbnMubWluRm9udFNpemU7XG4gICAgICAgICAgICB2YXIgbWF4Rm9udFNpemUgPSB0aGlzLm9wdGlvbnMubWF4Rm9udFNpemU7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICB3b3JkQ291bnRzLmZvckVhY2goZnVuY3Rpb24od29yZCkge1xuICAgICAgICAgICAgICAgIHdvcmQucGVyY2VudCA9IHNlbGYudHJhbnNmb3JtVmFsdWUod29yZC5jb3VudCk7XG4gICAgICAgICAgICAgICAgd29yZC5mb250U2l6ZSA9IG1pbkZvbnRTaXplICsgd29yZC5wZXJjZW50ICogKG1heEZvbnRTaXplIC0gbWluRm9udFNpemUpO1xuICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxkaXYgY2xhc3M9XCJ3b3JkLWNsb3VkLWxhYmVsXCIgc3R5bGU9XCInICtcbiAgICAgICAgICAgICAgICAgICAgJ3Zpc2liaWxpdHk6aGlkZGVuOycgK1xuICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplOicgKyB3b3JkLmZvbnRTaXplICsgJ3B4O1wiPicgKyB3b3JkLnRleHQgKyAnPC9kaXY+JztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaHRtbCArPSAnPC9kaXY+JztcbiAgICAgICAgICAgIC8vIGFwcGVuZCBtZWFzdXJlbWVudHNcbiAgICAgICAgICAgIHZhciAkdGVtcCA9ICQoaHRtbCk7XG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKCR0ZW1wKTtcbiAgICAgICAgICAgICR0ZW1wLmNoaWxkcmVuKCkuZWFjaChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIHdvcmRDb3VudHNbaW5kZXhdLndpZHRoID0gdGhpcy5vZmZzZXRXaWR0aDtcbiAgICAgICAgICAgICAgICB3b3JkQ291bnRzW2luZGV4XS5oZWlnaHQgPSB0aGlzLm9mZnNldEhlaWdodDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJHRlbXAucmVtb3ZlKCk7XG4gICAgICAgICAgICByZXR1cm4gd29yZENvdW50cztcbiAgICAgICAgfSxcblxuICAgICAgICBfY3JlYXRlV29yZENsb3VkOiBmdW5jdGlvbih3b3JkQ291bnRzKSB7XG4gICAgICAgICAgICB2YXIgdGlsZVNpemUgPSB0aGlzLm9wdGlvbnMudGlsZVNpemU7XG4gICAgICAgICAgICB2YXIgYm91bmRpbmdCb3ggPSB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IHRpbGVTaXplIC0gSE9SSVpPTlRBTF9PRkZTRVQgKiAyLFxuICAgICAgICAgICAgICAgIGhlaWdodDogdGlsZVNpemUgLSBWRVJUSUNBTF9PRkZTRVQgKiAyLFxuICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgeTogMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBjbG91ZCA9IFtdO1xuICAgICAgICAgICAgLy8gc29ydCB3b3JkcyBieSBmcmVxdWVuY3lcbiAgICAgICAgICAgIHdvcmRDb3VudHMgPSB0aGlzLl9tZWFzdXJlV29yZHMod29yZENvdW50cyk7XG4gICAgICAgICAgICAvLyBhc3NlbWJsZSB3b3JkIGNsb3VkXG4gICAgICAgICAgICB3b3JkQ291bnRzLmZvckVhY2goZnVuY3Rpb24od29yZENvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gc3RhcnRpbmcgc3BpcmFsIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgdmFyIHBvcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzOiAxLFxuICAgICAgICAgICAgICAgICAgICByYWRpdXNJbmM6IDUsXG4gICAgICAgICAgICAgICAgICAgIGFyY0xlbmd0aDogMTAsXG4gICAgICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgICAgIHQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpc2lvbnM6IDBcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIC8vIHNwaXJhbCBvdXR3YXJkcyB0byBmaW5kIHBvc2l0aW9uXG4gICAgICAgICAgICAgICAgd2hpbGUgKHBvcy5jb2xsaXNpb25zIDwgTlVNX0FUVEVNUFRTKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGluY3JlbWVudCBwb3NpdGlvbiBpbiBhIHNwaXJhbFxuICAgICAgICAgICAgICAgICAgICBwb3MgPSBzcGlyYWxQb3NpdGlvbihwb3MpO1xuICAgICAgICAgICAgICAgICAgICAvLyB0ZXN0IGZvciBpbnRlcnNlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpbnRlcnNlY3RXb3JkKHBvcywgd29yZENvdW50LCBjbG91ZCwgYm91bmRpbmdCb3gpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbG91ZC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB3b3JkQ291bnQudGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogd29yZENvdW50LmZvbnRTaXplLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnQ6IE1hdGgucm91bmQoKHdvcmRDb3VudC5wZXJjZW50ICogMTAwKSAvIDEwKSAqIDEwLCAvLyByb3VuZCB0byBuZWFyZXN0IDEwXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogcG9zLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogcG9zLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdvcmRDb3VudC53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHdvcmRDb3VudC5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VudGltZW50OiB3b3JkQ291bnQuc2VudGltZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF2Zzogd29yZENvdW50LmF2Z1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGNsb3VkO1xuICAgICAgICB9LFxuXG4gICAgICAgIGV4dHJhY3RFeHRyZW1hOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgc3VtcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgICAgICAgICAgaWYgKF8uaXNOdW1iZXIoY291bnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb3VudDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbnRpbWVudC5nZXRUb3RhbChjb3VudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbWluOiBfLm1pbihzdW1zKSxcbiAgICAgICAgICAgICAgICBtYXg6IF8ubWF4KHN1bXMpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihjb250YWluZXIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghZGF0YSB8fCBfLmlzRW1wdHkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaGlnaGxpZ2h0ID0gdGhpcy5oaWdobGlnaHQ7XG4gICAgICAgICAgICB2YXIgd29yZENvdW50cyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNvdW50LCBrZXkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXy5pc051bWJlcihjb3VudCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBjb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGtleVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdG90YWwgPSBzZW50aW1lbnQuZ2V0VG90YWwoY291bnQpO1xuICAgICAgICAgICAgICAgIHZhciBhdmcgPSBzZW50aW1lbnQuZ2V0QXZnKGNvdW50KTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBjb3VudDogdG90YWwsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGtleSxcbiAgICAgICAgICAgICAgICAgICAgYXZnOiBhdmcsXG4gICAgICAgICAgICAgICAgICAgIHNlbnRpbWVudDogc2VudGltZW50RnVuYyhhdmcpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gZXhpdCBlYXJseSBpZiBubyB3b3Jkc1xuICAgICAgICAgICAgaWYgKHdvcmRDb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZ2VuZXJlYXRlIHRoZSBjbG91ZFxuICAgICAgICAgICAgdmFyIGNsb3VkID0gdGhpcy5fY3JlYXRlV29yZENsb3VkKHdvcmRDb3VudHMpO1xuICAgICAgICAgICAgLy8gYnVpbGQgaHRtbCBlbGVtZW50c1xuICAgICAgICAgICAgdmFyIGhhbGZTaXplID0gdGhpcy5vcHRpb25zLnRpbGVTaXplIC8gMjtcbiAgICAgICAgICAgIHZhciBodG1sID0gJyc7XG4gICAgICAgICAgICBjbG91ZC5mb3JFYWNoKGZ1bmN0aW9uKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgY2xhc3Nlc1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc05hbWVzID0gW1xuICAgICAgICAgICAgICAgICAgICAnd29yZC1jbG91ZC1sYWJlbCcsXG4gICAgICAgICAgICAgICAgICAgICd3b3JkLWNsb3VkLWxhYmVsLScgKyB3b3JkLnBlcmNlbnQsXG4gICAgICAgICAgICAgICAgICAgIHdvcmQudGV4dCA9PT0gaGlnaGxpZ2h0ID8gJ2hpZ2hsaWdodCcgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgd29yZC5zZW50aW1lbnQgPyB3b3JkLnNlbnRpbWVudCA6ICcnXG4gICAgICAgICAgICAgICAgXS5qb2luKCcgJyk7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIHN0eWxlc1xuICAgICAgICAgICAgICAgIHZhciBzdHlsZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemU6JyArIHdvcmQuZm9udFNpemUgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICAnbGVmdDonICsgKGhhbGZTaXplICsgd29yZC54IC0gKHdvcmQud2lkdGggLyAyKSkgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICAndG9wOicgKyAoaGFsZlNpemUgKyB3b3JkLnkgLSAod29yZC5oZWlnaHQgLyAyKSkgKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICAnd2lkdGg6JyArIHdvcmQud2lkdGggKyAncHgnLFxuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0OicgKyB3b3JkLmhlaWdodCArICdweCcsXG4gICAgICAgICAgICAgICAgXS5qb2luKCc7Jyk7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGh0bWwgZm9yIGVudHJ5XG4gICAgICAgICAgICAgICAgaHRtbCArPSAnPGRpdiBjbGFzcz1cIicgKyBjbGFzc05hbWVzICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgKyBzdHlsZXMgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtc2VudGltZW50PVwiJyArIHdvcmQuYXZnICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLXdvcmQ9XCInICsgd29yZC50ZXh0ICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICB3b3JkLnRleHQgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBXb3JkQ2xvdWQ7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgSFRNTCA9IHJlcXVpcmUoJy4uLy4uL2NvcmUvSFRNTCcpO1xuICAgIHZhciBzZW50aW1lbnQgPSByZXF1aXJlKCcuLi8uLi9zZW50aW1lbnQvU2VudGltZW50Jyk7XG4gICAgdmFyIHNlbnRpbWVudEZ1bmMgPSBzZW50aW1lbnQuZ2V0Q2xhc3NGdW5jKC0xLCAxKTtcblxuICAgIHZhciBpc1NpbmdsZVZhbHVlID0gZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgLy8gc2luZ2xlIHZhbHVlcyBhcmUgbmV2ZXIgbnVsbCwgYW5kIGFsd2F5cyBudW1iZXJzXG4gICAgICAgIHJldHVybiBjb3VudCAhPT0gbnVsbCAmJiBfLmlzTnVtYmVyKGNvdW50KTtcbiAgICB9O1xuXG4gICAgdmFyIGV4dHJhY3RDb3VudCA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgICAgIGlmIChpc1NpbmdsZVZhbHVlKGNvdW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZW50aW1lbnQuZ2V0VG90YWwoY291bnQpO1xuICAgIH07XG5cbiAgICB2YXIgZXh0cmFjdFNlbnRpbWVudENsYXNzID0gZnVuY3Rpb24oYXZnKSB7XG4gICAgICAgIGlmIChhdmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbnRpbWVudEZ1bmMoYXZnKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfTtcblxuICAgIHZhciBleHRyYWN0RnJlcXVlbmN5ID0gZnVuY3Rpb24oY291bnQpIHtcbiAgICAgICAgaWYgKGlzU2luZ2xlVmFsdWUoY291bnQpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGNvdW50OiBjb3VudFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY291bnQ6IHNlbnRpbWVudC5nZXRUb3RhbChjb3VudCksXG4gICAgICAgICAgICBhdmc6IHNlbnRpbWVudC5nZXRBdmcoY291bnQpXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBleHRyYWN0QXZnID0gZnVuY3Rpb24oZnJlcXVlbmNpZXMpIHtcbiAgICAgICAgaWYgKGZyZXF1ZW5jaWVzWzBdLmF2ZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN1bSA9IF8uc3VtQnkoZnJlcXVlbmNpZXMsIGZ1bmN0aW9uKGZyZXF1ZW5jeSkge1xuICAgICAgICAgICAgcmV0dXJuIGZyZXF1ZW5jeS5hdmc7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3VtIC8gZnJlcXVlbmNpZXMubGVuZ3RoO1xuICAgIH07XG5cbiAgICB2YXIgZXh0cmFjdFZhbHVlcyA9IGZ1bmN0aW9uKGRhdGEsIGtleSkge1xuICAgICAgICB2YXIgZnJlcXVlbmNpZXMgPSBfLm1hcChkYXRhLCBleHRyYWN0RnJlcXVlbmN5KTtcbiAgICAgICAgdmFyIGF2ZyA9IGV4dHJhY3RBdmcoZnJlcXVlbmNpZXMpO1xuICAgICAgICB2YXIgbWF4ID0gXy5tYXhCeShmcmVxdWVuY2llcywgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsLmNvdW50O1xuICAgICAgICB9KS5jb3VudDtcbiAgICAgICAgdmFyIHRvdGFsID0gXy5zdW1CeShmcmVxdWVuY2llcywgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsLmNvdW50O1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcGljOiBrZXksXG4gICAgICAgICAgICBmcmVxdWVuY2llczogZnJlcXVlbmNpZXMsXG4gICAgICAgICAgICBtYXg6IG1heCxcbiAgICAgICAgICAgIHRvdGFsOiB0b3RhbCxcbiAgICAgICAgICAgIGF2ZzogYXZnXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBXb3JkSGlzdG9ncmFtID0gSFRNTC5leHRlbmQoe1xuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIG1heE51bVdvcmRzOiA4LFxuICAgICAgICAgICAgbWluRm9udFNpemU6IDE2LFxuICAgICAgICAgICAgbWF4Rm9udFNpemU6IDIyXG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNUYXJnZXRMYXllcjogZnVuY3Rpb24oIGVsZW0gKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyICYmICQuY29udGFpbnModGhpcy5fY29udGFpbmVyLCBlbGVtICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYXJTZWxlY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCh0aGlzLl9jb250YWluZXIpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0ID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBvbk1vdXNlT3ZlcjogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICAkKCcud29yZC1oaXN0b2dyYW0tZW50cnknKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAkKCcud29yZC1oaXN0b2dyYW0tZW50cnlbZGF0YS13b3JkPScgKyB3b3JkICsgJ10nKS5hZGRDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3Zlcih0YXJnZXQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB3b3JkLFxuICAgICAgICAgICAgICAgICAgICAgICAgeDogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXgnKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogcGFyc2VJbnQoJHBhcmVudC5hdHRyKCdkYXRhLXknKSwgMTApLFxuICAgICAgICAgICAgICAgICAgICAgICAgejogdGhpcy5fbWFwLmdldFpvb20oKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd3b3JkLWhpc3RvZ3JhbScsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXllcjogdGhpc1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25Nb3VzZU91dDogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9ICQoZS5vcmlnaW5hbEV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICAkKCcud29yZC1oaXN0b2dyYW0tZW50cnknKS5yZW1vdmVDbGFzcygnaG92ZXInKTtcbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhhbmRsZXJzLm1vdXNlb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciAkcGFyZW50ID0gdGFyZ2V0LnBhcmVudHMoJy5sZWFmbGV0LWh0bWwtdGlsZScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGFuZGxlcnMubW91c2VvdXQodGFyZ2V0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogd29yZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS14JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBhcnNlSW50KCRwYXJlbnQuYXR0cignZGF0YS15JyksIDEwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHo6IHRoaXMuX21hcC5nZXRab29tKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnd29yZC1oaXN0b2dyYW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGF5ZXI6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIC8vIHVuLXNlbGVjdCBhbmQgcHJldiBzZWxlY3RlZCBoaXN0b2dyYW1cbiAgICAgICAgICAgICQoJy53b3JkLWhpc3RvZ3JhbS1lbnRyeScpLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgICQodGhpcy5fY29udGFpbmVyKS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XG4gICAgICAgICAgICAvLyBnZXQgdGFyZ2V0XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJChlLm9yaWdpbmFsRXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc1RhcmdldExheWVyKGUub3JpZ2luYWxFdmVudC50YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBsYXllciBpcyBub3QgdGhlIHRhcmdldFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3b3JkID0gdGFyZ2V0LmF0dHIoJ2RhdGEtd29yZCcpO1xuICAgICAgICAgICAgaWYgKHdvcmQpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMuX2NvbnRhaW5lcikuYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xuICAgICAgICAgICAgICAgICQoJy53b3JkLWhpc3RvZ3JhbS1lbnRyeVtkYXRhLXdvcmQ9JyArIHdvcmQgKyAnXScpLmFkZENsYXNzKCdoaWdobGlnaHQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZ2hsaWdodCA9IHdvcmQ7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5oYW5kbGVycy5jbGljaykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgJHBhcmVudCA9IHRhcmdldC5wYXJlbnRzKCcubGVhZmxldC1odG1sLXRpbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhhbmRsZXJzLmNsaWNrKHRhcmdldCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHdvcmQsXG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteCcpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBwYXJzZUludCgkcGFyZW50LmF0dHIoJ2RhdGEteScpLCAxMCksXG4gICAgICAgICAgICAgICAgICAgICAgICB6OiB0aGlzLl9tYXAuZ2V0Wm9vbSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3dvcmQtaGlzdG9ncmFtJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxheWVyOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGV4dHJhY3RFeHRyZW1hOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgc3VtcyA9IF8ubWFwKGRhdGEsIGZ1bmN0aW9uKGNvdW50cykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfLnN1bUJ5KGNvdW50cywgZXh0cmFjdENvdW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBtaW46IF8ubWluKHN1bXMpLFxuICAgICAgICAgICAgICAgIG1heDogXy5tYXgoc3VtcyksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGNvbnRhaW5lciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFkYXRhIHx8IF8uaXNFbXB0eShkYXRhKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBoaWdobGlnaHQgPSB0aGlzLmhpZ2hsaWdodDtcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgb2JqZWN0IHRvIGFycmF5XG4gICAgICAgICAgICB2YXIgdmFsdWVzID0gXy5tYXAoZGF0YSwgZXh0cmFjdFZhbHVlcykuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGIudG90YWwgLSBhLnRvdGFsO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBnZXQgbnVtYmVyIG9mIGVudHJpZXNcbiAgICAgICAgICAgIHZhciBudW1FbnRyaWVzID0gTWF0aC5taW4odmFsdWVzLmxlbmd0aCwgdGhpcy5vcHRpb25zLm1heE51bVdvcmRzKTtcbiAgICAgICAgICAgIHZhciAkaHRtbCA9ICQoJzxkaXYgY2xhc3M9XCJ3b3JkLWhpc3RvZ3JhbXNcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lLWJsb2NrO1wiPjwvZGl2PicpO1xuICAgICAgICAgICAgdmFyIHRvdGFsSGVpZ2h0ID0gMDtcbiAgICAgICAgICAgIHZhciBtaW5Gb250U2l6ZSA9IHRoaXMub3B0aW9ucy5taW5Gb250U2l6ZTtcbiAgICAgICAgICAgIHZhciBtYXhGb250U2l6ZSA9IHRoaXMub3B0aW9ucy5tYXhGb250U2l6ZTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIHZhbHVlcy5zbGljZSgwLCBudW1FbnRyaWVzKS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRvcGljID0gdmFsdWUudG9waWM7XG4gICAgICAgICAgICAgICAgdmFyIGZyZXF1ZW5jaWVzID0gdmFsdWUuZnJlcXVlbmNpZXM7XG4gICAgICAgICAgICAgICAgdmFyIG1heCA9IHZhbHVlLm1heDtcbiAgICAgICAgICAgICAgICB2YXIgdG90YWwgPSB2YWx1ZS50b3RhbDtcbiAgICAgICAgICAgICAgICB2YXIgYXZnID0gdmFsdWUuYXZnO1xuICAgICAgICAgICAgICAgIHZhciBzZW50aW1lbnRDbGFzcyA9IGV4dHJhY3RTZW50aW1lbnRDbGFzcyhhdmcpO1xuICAgICAgICAgICAgICAgIHZhciBoaWdobGlnaHRDbGFzcyA9ICh0b3BpYyA9PT0gaGlnaGxpZ2h0KSA/ICdoaWdobGlnaHQnIDogJyc7XG4gICAgICAgICAgICAgICAgLy8gc2NhbGUgdGhlIGhlaWdodCBiYXNlZCBvbiBsZXZlbCBtaW4gLyBtYXhcbiAgICAgICAgICAgICAgICB2YXIgcGVyY2VudCA9IHNlbGYudHJhbnNmb3JtVmFsdWUodG90YWwpO1xuICAgICAgICAgICAgICAgIHZhciBwZXJjZW50TGFiZWwgPSBNYXRoLnJvdW5kKChwZXJjZW50ICogMTAwKSAvIDEwKSAqIDEwO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBtaW5Gb250U2l6ZSArIHBlcmNlbnQgKiAobWF4Rm9udFNpemUgLSBtaW5Gb250U2l6ZSk7XG4gICAgICAgICAgICAgICAgdG90YWxIZWlnaHQgKz0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBjb250YWluZXIgJ2VudHJ5JyBmb3IgY2hhcnQgYW5kIGhhc2h0YWdcbiAgICAgICAgICAgICAgICB2YXIgJGVudHJ5ID0gJCgnPGRpdiBjbGFzcz1cIndvcmQtaGlzdG9ncmFtLWVudHJ5ICcgKyBoaWdobGlnaHRDbGFzcyArICdcIiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtc2VudGltZW50PVwiJyArIGF2ZyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS13b3JkPVwiJyArIHRvcGljICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICdzdHlsZT1cIicgK1xuICAgICAgICAgICAgICAgICAgICAnaGVpZ2h0OicgKyBoZWlnaHQgKyAncHg7XCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGNoYXJ0XG4gICAgICAgICAgICAgICAgdmFyICRjaGFydCA9ICQoJzxkaXYgY2xhc3M9XCJ3b3JkLWhpc3RvZ3JhbS1sZWZ0XCInICtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEtc2VudGltZW50PVwiJyArIGF2ZyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS13b3JkPVwiJyArIHRvcGljICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICc+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgdmFyIGJhcldpZHRoID0gJ2NhbGMoJyArICgxMDAgLyBmcmVxdWVuY2llcy5sZW5ndGgpICsgJyUpJztcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYmFyc1xuICAgICAgICAgICAgICAgIGZyZXF1ZW5jaWVzLmZvckVhY2goZnVuY3Rpb24oZnJlcXVlbmN5KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3VudCA9IGZyZXF1ZW5jeS5jb3VudDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF2ZyA9IGZyZXF1ZW5jeS5hdmc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZW50aW1lbnRDbGFzcyA9IGV4dHJhY3RTZW50aW1lbnRDbGFzcyhhdmcpO1xuICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIHBlcmNlbnQgcmVsYXRpdmUgdG8gdGhlIGhpZ2hlc3QgY291bnQgaW4gdGhlIHRpbGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbGF0aXZlUGVyY2VudCA9IChtYXggIT09IDApID8gKGNvdW50IC8gbWF4KSAqIDEwMCA6IDA7XG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2UgaW52aXNpYmxlIGlmIHplcm8gY291bnRcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZpc2liaWxpdHkgPSByZWxhdGl2ZVBlcmNlbnQgPT09IDAgPyAnaGlkZGVuJyA6ICcnO1xuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHN0eWxlIGNsYXNzIG9mIHRoZSBiYXJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBlcmNlbnRMYWJlbCA9IE1hdGgucm91bmQocmVsYXRpdmVQZXJjZW50IC8gMTApICogMTA7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXJDbGFzc2VzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3dvcmQtaGlzdG9ncmFtLWJhcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnd29yZC1oaXN0b2dyYW0tYmFyLScgKyBwZXJjZW50TGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZW50aW1lbnRDbGFzcyArICctZmlsbCdcbiAgICAgICAgICAgICAgICAgICAgXS5qb2luKCcgJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXJIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXJUb3A7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGVyZSBpcyBhdCBsZWFzdCBhIHNpbmdsZSBwaXhlbCBvZiBjb2xvclxuICAgICAgICAgICAgICAgICAgICBpZiAoKHJlbGF0aXZlUGVyY2VudCAvIDEwMCkgKiBoZWlnaHQgPCAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJIZWlnaHQgPSAnM3B4JztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhclRvcCA9ICdjYWxjKDEwMCUgLSAzcHgpJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhckhlaWdodCA9IHJlbGF0aXZlUGVyY2VudCArICclJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhclRvcCA9ICgxMDAgLSByZWxhdGl2ZVBlcmNlbnQpICsgJyUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBiYXJcbiAgICAgICAgICAgICAgICAgICAgJGNoYXJ0LmFwcGVuZCgnPGRpdiBjbGFzcz1cIicgKyBiYXJDbGFzc2VzICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YS13b3JkPVwiJyArIHRvcGljICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnc3R5bGU9XCInICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd2aXNpYmlsaXR5OicgKyB2aXNpYmlsaXR5ICsgJzsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd3aWR0aDonICsgYmFyV2lkdGggKyAnOycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2hlaWdodDonICsgYmFySGVpZ2h0ICsgJzsnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd0b3A6JyArIGJhclRvcCArICc7XCI+PC9kaXY+Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJGVudHJ5LmFwcGVuZCgkY2hhcnQpO1xuICAgICAgICAgICAgICAgIHZhciB0b3BpY0NsYXNzZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICd3b3JkLWhpc3RvZ3JhbS1sYWJlbCcsXG4gICAgICAgICAgICAgICAgICAgICd3b3JkLWhpc3RvZ3JhbS1sYWJlbC0nICsgcGVyY2VudExhYmVsLFxuICAgICAgICAgICAgICAgICAgICBzZW50aW1lbnRDbGFzc1xuICAgICAgICAgICAgICAgIF0uam9pbignICcpO1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSB0YWcgbGFiZWxcbiAgICAgICAgICAgICAgICB2YXIgJHRvcGljID0gJCgnPGRpdiBjbGFzcz1cIndvcmQtaGlzdG9ncmFtLXJpZ2h0XCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiJyArIHRvcGljQ2xhc3NlcyArICdcIicgK1xuICAgICAgICAgICAgICAgICAgICAnZGF0YS1zZW50aW1lbnQ9XCInICsgYXZnICsgJ1wiJyArXG4gICAgICAgICAgICAgICAgICAgICdkYXRhLXdvcmQ9XCInICsgdG9waWMgKyAnXCInICtcbiAgICAgICAgICAgICAgICAgICAgJ3N0eWxlPVwiJyArXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemU6JyArIGhlaWdodCArICdweDsnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtaGVpZ2h0OicgKyBoZWlnaHQgKyAncHg7JyArXG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQ6JyArIGhlaWdodCArICdweFwiPicgKyB0b3BpYyArICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicpO1xuICAgICAgICAgICAgICAgICRlbnRyeS5hcHBlbmQoJHRvcGljKTtcbiAgICAgICAgICAgICAgICAkaHRtbC5hcHBlbmQoJGVudHJ5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGh0bWwuY3NzKCd0b3AnLCAoIHRoaXMub3B0aW9ucy50aWxlU2l6ZSAvIDIgKSAtICh0b3RhbEhlaWdodCAvIDIpKTtcbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAkaHRtbFswXS5vdXRlckhUTUw7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gV29yZEhpc3RvZ3JhbTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBERUxBWSA9IDEyMDA7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICB2YXIgZGVsYXkgPSAtKE1hdGgucmFuZG9tKCkgKiBERUxBWSkgKyAnbXMnO1xuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cImJsaW5raW5nIGJsaW5raW5nLXRpbGVcIiBzdHlsZT1cImFuaW1hdGlvbi1kZWxheTonICsgZGVsYXkgKyAnXCI+PC9kaXY+JztcbiAgICAgICAgfVxuXG4gICAgfTtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBERUxBWSA9IDEyMDA7XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgICAgICByZW5kZXJUaWxlOiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICB2YXIgZGVsYXkgPSAtKE1hdGgucmFuZG9tKCkgKiBERUxBWSkgKyAnbXMnO1xuICAgICAgICAgICAgZWxlbS5pbm5lckhUTUwgPVxuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidmVydGljYWwtY2VudGVyZWQtYm94IGJsaW5raW5nXCIgc3R5bGU9XCJhbmltYXRpb24tZGVsYXk6JyArIGRlbGF5ICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibG9hZGVyLWNpcmNsZVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsb2FkZXItbGluZS1tYXNrXCIgc3R5bGU9XCJhbmltYXRpb24tZGVsYXk6JyArIGRlbGF5ICsgJ1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwibG9hZGVyLWxpbmVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIERFTEFZID0gMTIwMDtcblxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xuXG4gICAgICAgIHJlbmRlclRpbGU6IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgIHZhciBkZWxheSA9IC0oTWF0aC5yYW5kb20oKSAqIERFTEFZKSArICdtcyc7XG4gICAgICAgICAgICBlbGVtLmlubmVySFRNTCA9XG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ2ZXJ0aWNhbC1jZW50ZXJlZC1ib3hcIiBzdHlsZT1cImFuaW1hdGlvbi1kZWxheTonICsgZGVsYXkgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udGVudFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsb2FkZXItY2lyY2xlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImxvYWRlci1saW5lLW1hc2tcIiBzdHlsZT1cImFuaW1hdGlvbi1kZWxheTonICsgZGVsYXkgKyAnXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJsb2FkZXItbGluZVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2Pic7XG4gICAgICAgIH1cblxuICAgIH07XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgV2ViR0wgPSByZXF1aXJlKCcuLi8uLi9jb3JlL1dlYkdMJyk7XG5cbiAgICB2YXIgdmVydCA9IFtcbiAgICAgICAgJ3ByZWNpc2lvbiBoaWdocCBmbG9hdDsnLFxuICAgICAgICAnYXR0cmlidXRlIHZlYzIgYVBvc2l0aW9uOycsXG4gICAgICAgICdhdHRyaWJ1dGUgdmVjMiBhVGV4dHVyZUNvb3JkOycsXG4gICAgICAgICd1bmlmb3JtIG1hdDQgdVByb2plY3Rpb25NYXRyaXg7JyxcbiAgICAgICAgJ3VuaWZvcm0gbWF0NCB1TW9kZWxNYXRyaXg7JyxcbiAgICAgICAgJ3ZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkOycsXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgICAgICd2VGV4dHVyZUNvb3JkID0gYVRleHR1cmVDb29yZDsnLFxuICAgICAgICAgICAgJ2dsX1Bvc2l0aW9uID0gdVByb2plY3Rpb25NYXRyaXggKiB1TW9kZWxNYXRyaXggKiB2ZWM0KCBhUG9zaXRpb24sIDAuMCwgMS4wICk7JyxcbiAgICAgICAgJ30nXG4gICAgXS5qb2luKCcnKTtcblxuICAgIHZhciBmcmFnID0gW1xuICAgICAgICAncHJlY2lzaW9uIGhpZ2hwIGZsb2F0OycsXG4gICAgICAgICd1bmlmb3JtIHNhbXBsZXIyRCB1VGV4dHVyZVNhbXBsZXI7JyxcbiAgICAgICAgJ3VuaWZvcm0gZmxvYXQgdU9wYWNpdHk7JyxcbiAgICAgICAgJ3ZhcnlpbmcgdmVjMiB2VGV4dHVyZUNvb3JkOycsXG4gICAgICAgICd2b2lkIG1haW4oKSB7JyxcbiAgICAgICAgICAgICd2ZWM0IGNvbG9yID0gdGV4dHVyZTJEKHVUZXh0dXJlU2FtcGxlciwgdlRleHR1cmVDb29yZCk7JyxcbiAgICAgICAgICAgICdnbF9GcmFnQ29sb3IgPSB2ZWM0KGNvbG9yLnJnYiwgY29sb3IuYSAqIHVPcGFjaXR5KTsnLFxuICAgICAgICAnfSdcbiAgICBdLmpvaW4oJycpO1xuXG4gICAgdmFyIEhlYXRtYXAgPSBXZWJHTC5leHRlbmQoe1xuXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgIHNoYWRlcnM6IHtcbiAgICAgICAgICAgICAgICB2ZXJ0OiB2ZXJ0LFxuICAgICAgICAgICAgICAgIGZyYWc6IGZyYWcsXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBIZWF0bWFwO1xuXG59KCkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIFJlcXVlc3RvciA9IHJlcXVpcmUoJy4vUmVxdWVzdG9yJyk7XG5cbiAgICBmdW5jdGlvbiBNZXRhUmVxdWVzdG9yKCkge1xuICAgICAgICBSZXF1ZXN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBNZXRhUmVxdWVzdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUmVxdWVzdG9yLnByb3RvdHlwZSk7XG5cbiAgICBNZXRhUmVxdWVzdG9yLnByb3RvdHlwZS5nZXRIYXNoID0gZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHJldHVybiByZXEudHlwZSArICctJyArXG4gICAgICAgICAgICByZXEuaW5kZXggKyAnLScgK1xuICAgICAgICAgICAgcmVxLnN0b3JlO1xuICAgIH07XG5cbiAgICBNZXRhUmVxdWVzdG9yLnByb3RvdHlwZS5nZXRVUkwgPSBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgcmV0dXJuICdtZXRhLycgK1xuICAgICAgICAgICAgcmVzLnR5cGUgKyAnLycgK1xuICAgICAgICAgICAgcmVzLmVuZHBvaW50ICsgJy8nICtcbiAgICAgICAgICAgIHJlcy5pbmRleCArICcvJyArXG4gICAgICAgICAgICByZXMuc3RvcmU7XG4gICAgfTtcblxuICAgIG1vZHVsZS5leHBvcnRzID0gTWV0YVJlcXVlc3RvcjtcblxufSgpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBSRVRSWV9JTlRFUlZBTCA9IDUwMDA7XG5cbiAgICBmdW5jdGlvbiBnZXRIb3N0KCkge1xuICAgICAgICB2YXIgbG9jID0gd2luZG93LmxvY2F0aW9uO1xuICAgICAgICB2YXIgbmV3X3VyaTtcbiAgICAgICAgaWYgKGxvYy5wcm90b2NvbCA9PT0gJ2h0dHBzOicpIHtcbiAgICAgICAgICAgIG5ld191cmkgPSAnd3NzOic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXdfdXJpID0gJ3dzOic7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld191cmkgKyAnLy8nICsgbG9jLmhvc3QgKyBsb2MucGF0aG5hbWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXN0YWJsaXNoQ29ubmVjdGlvbihyZXF1ZXN0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJlcXVlc3Rvci5zb2NrZXQgPSBuZXcgV2ViU29ja2V0KGdldEhvc3QoKSArIHJlcXVlc3Rvci51cmwpO1xuICAgICAgICAvLyBvbiBvcGVuXG4gICAgICAgIHJlcXVlc3Rvci5zb2NrZXQub25vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXF1ZXN0b3IuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdXZWJzb2NrZXQgY29ubmVjdGlvbiBlc3RhYmxpc2hlZCcpO1xuICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gb24gbWVzc2FnZVxuICAgICAgICByZXF1ZXN0b3Iuc29ja2V0Lm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICAgICAgICAgIHZhciBoYXNoID0gcmVxdWVzdG9yLmdldEhhc2gocmVzKTtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gcmVxdWVzdG9yLnJlcXVlc3RzW2hhc2hdO1xuICAgICAgICAgICAgZGVsZXRlIHJlcXVlc3Rvci5yZXF1ZXN0c1toYXNoXTtcbiAgICAgICAgICAgIGlmIChyZXMuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QucmVzb2x2ZShyZXF1ZXN0b3IuZ2V0VVJMKHJlcyksIHJlcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QucmVqZWN0KHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIG9uIGNsb3NlXG4gICAgICAgIHJlcXVlc3Rvci5zb2NrZXQub25jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gbG9nIGNsb3NlIG9ubHkgaWYgY29ubmVjdGlvbiB3YXMgZXZlciBvcGVuXG4gICAgICAgICAgICBpZiAocmVxdWVzdG9yLmlzT3Blbikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignV2Vic29ja2V0IGNvbm5lY3Rpb24gY2xvc2VkLCBhdHRlbXB0aW5nIHRvIHJlLWNvbm5lY3QgaW4gJyArIFJFVFJZX0lOVEVSVkFMKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3Rvci5zb2NrZXQgPSBudWxsO1xuICAgICAgICAgICAgcmVxdWVzdG9yLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gcmVqZWN0IGFsbCBwZW5kaW5nIHJlcXVlc3RzXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhyZXF1ZXN0b3IucmVxdWVzdHMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICAgICAgcmVxdWVzdG9yLnJlcXVlc3RzW2tleV0ucmVqZWN0KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGNsZWFyIHJlcXVlc3QgbWFwXG4gICAgICAgICAgICByZXF1ZXN0b3IucmVxdWVzdHMgPSB7fTtcbiAgICAgICAgICAgIC8vIGF0dGVtcHQgdG8gcmUtZXN0YWJsaXNoIGNvbm5lY3Rpb25cbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgZXN0YWJsaXNoQ29ubmVjdGlvbihyZXF1ZXN0b3IsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBvbmNlIGNvbm5lY3Rpb24gaXMgcmUtZXN0YWJsaXNoZWQsIHNlbmQgcGVuZGluZyByZXF1ZXN0c1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0b3IucGVuZGluZy5mb3JFYWNoKGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdG9yLmdldChyZXEpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdG9yLnBlbmRpbmcgPSBbXTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIFJFVFJZX0lOVEVSVkFMKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBSZXF1ZXN0b3IodXJsLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcbiAgICAgICAgdGhpcy5yZXF1ZXN0cyA9IHt9O1xuICAgICAgICB0aGlzLnBlbmRpbmcgPSBbXTtcbiAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgZXN0YWJsaXNoQ29ubmVjdGlvbih0aGlzLCBjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgUmVxdWVzdG9yLnByb3RvdHlwZS5nZXRIYXNoID0gZnVuY3Rpb24oIC8qcmVxKi8gKSB7XG4gICAgICAgIC8vIG92ZXJyaWRlXG4gICAgfTtcblxuICAgIFJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0VVJMID0gZnVuY3Rpb24oIC8qcmVzKi8gKSB7XG4gICAgICAgIC8vIG92ZXJyaWRlXG4gICAgfTtcblxuICAgIFJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIC8vIGlmIG5vIGNvbm5lY3Rpb24sIGFkZCByZXF1ZXN0IHRvIHBlbmRpbmcgcXVldWVcbiAgICAgICAgICAgIHRoaXMucGVuZGluZy5wdXNoKHJlcSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhhc2ggPSB0aGlzLmdldEhhc2gocmVxKTtcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB0aGlzLnJlcXVlc3RzW2hhc2hdO1xuICAgICAgICBpZiAocmVxdWVzdCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3QucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJlcXVlc3QgPSB0aGlzLnJlcXVlc3RzW2hhc2hdID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB0aGlzLnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KHJlcSkpO1xuICAgICAgICByZXR1cm4gcmVxdWVzdC5wcm9taXNlKCk7XG4gICAgfTtcblxuICAgIFJlcXVlc3Rvci5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zb2NrZXQub25jbG9zZSA9IG51bGw7XG4gICAgICAgIHRoaXMuc29ja2V0LmNsb3NlKCk7XG4gICAgICAgIHRoaXMuc29ja2V0ID0gbnVsbDtcbiAgICB9O1xuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBSZXF1ZXN0b3I7XG5cbn0oKSk7XG4iLCIoZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgc3RyaW5naWZ5ID0gcmVxdWlyZSgnanNvbi1zdGFibGUtc3RyaW5naWZ5Jyk7XG4gICAgdmFyIFJlcXVlc3RvciA9IHJlcXVpcmUoJy4vUmVxdWVzdG9yJyk7XG5cbiAgICBmdW5jdGlvbiBwcnVuZUVtcHR5KG9iaikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gcHJ1bmUoY3VycmVudCkge1xuICAgICAgICAgICAgXy5mb3JPd24oY3VycmVudCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICBpZiAoXy5pc1VuZGVmaW5lZCh2YWx1ZSkgfHwgXy5pc051bGwodmFsdWUpIHx8IF8uaXNOYU4odmFsdWUpIHx8XG4gICAgICAgICAgICAgICAgKF8uaXNTdHJpbmcodmFsdWUpICYmIF8uaXNFbXB0eSh2YWx1ZSkpIHx8XG4gICAgICAgICAgICAgICAgKF8uaXNPYmplY3QodmFsdWUpICYmIF8uaXNFbXB0eShwcnVuZSh2YWx1ZSkpKSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjdXJyZW50W2tleV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIGFueSBsZWZ0b3ZlciB1bmRlZmluZWQgdmFsdWVzIGZyb20gdGhlIGRlbGV0ZVxuICAgICAgICAgICAgLy8gb3BlcmF0aW9uIG9uIGFuIGFycmF5XG4gICAgICAgICAgICBpZiAoXy5pc0FycmF5KGN1cnJlbnQpKSB7XG4gICAgICAgICAgICAgICAgXy5wdWxsKGN1cnJlbnQsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY3VycmVudDtcbiAgICAgICAgfShfLmNsb25lRGVlcChvYmopKTsgLy8gZG8gbm90IG1vZGlmeSB0aGUgb3JpZ2luYWwgb2JqZWN0LCBjcmVhdGUgYSBjbG9uZSBpbnN0ZWFkXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gVGlsZVJlcXVlc3RvcigpIHtcbiAgICAgICAgUmVxdWVzdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgVGlsZVJlcXVlc3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFJlcXVlc3Rvci5wcm90b3R5cGUpO1xuXG4gICAgVGlsZVJlcXVlc3Rvci5wcm90b3R5cGUuZ2V0SGFzaCA9IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgY29vcmQgPSByZXEuY29vcmQ7XG4gICAgICAgIHZhciBoYXNoID0gc3RyaW5naWZ5KHBydW5lRW1wdHkocmVxLnBhcmFtcykpO1xuICAgICAgICByZXR1cm4gcmVxLnR5cGUgKyAnLScgK1xuICAgICAgICAgICAgcmVxLmluZGV4ICsgJy0nICtcbiAgICAgICAgICAgIHJlcS5zdG9yZSArICctJyArXG4gICAgICAgICAgICBjb29yZC54ICsgJy0nICtcbiAgICAgICAgICAgIGNvb3JkLnkgKyAnLScgK1xuICAgICAgICAgICAgY29vcmQueiArICctJyArXG4gICAgICAgICAgICBoYXNoO1xuICAgIH07XG5cbiAgICBUaWxlUmVxdWVzdG9yLnByb3RvdHlwZS5nZXRVUkwgPSBmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgdmFyIGNvb3JkID0gcmVzLmNvb3JkO1xuICAgICAgICByZXR1cm4gJ3RpbGUvJyArXG4gICAgICAgICAgICByZXMudHlwZSArICcvJyArXG4gICAgICAgICAgICByZXMuaW5kZXggKyAnLycgK1xuICAgICAgICAgICAgcmVzLnN0b3JlICsgJy8nICtcbiAgICAgICAgICAgIGNvb3JkLnogKyAnLycgK1xuICAgICAgICAgICAgY29vcmQueCArICcvJyArXG4gICAgICAgICAgICBjb29yZC55O1xuICAgIH07XG5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRpbGVSZXF1ZXN0b3I7XG5cbn0oKSk7XG4iXX0=

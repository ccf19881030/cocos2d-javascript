var util = require('util'),
    event = require('event'),
    geo = require('geometry'),
    ccp = geo.ccp,
    TextureAtlas = require('../TextureAtlas').TextureAtlas,
    RenderTexture = require('./RenderTexture').RenderTexture,
	Node = require('./Node').Node;

/**
 * @class cocos.nodes.BatchNode Draws all children to an in-memory canvas and only redraws when something changes
 * @extends cocos.nodes.Node
 *
 * @constructor
 * @namedparams
 * @param {geometry.Size} size The size of the in-memory canvas used for drawing to
 */
var BatchNode = Node.extend({
    contentRect: null,
    renderTexture: null,
    dirty: true,
    dynamicResize: false,

    /** @private
     * Areas that need redrawing
     *
     * Not implemented
     */
    _dirtyRects: null,


	init: function(opts) {
		@super;

        var size = opts['size'] || geo.sizeMake(1, 1);

        event.addListener(this, 'contentsize_changed', util.callback(this, this._resizeCanvas));
        
		this._dirtyRects = [];
        this.set('contentRect', geo.rectMake(0, 0, size.width, size.height));
        this.renderTexture = RenderTexture.create(size);
        this.renderTexture.sprite.set('isRelativeAnchorPoint', false);
        this.addChild({child: this.renderTexture});
	},

    addChild: function(opts) {
        var ret = @super;

        var child = opts['child'],
            z     = opts['z'];

        if (child == this.renderTexture) {
            return ret;
        }

        // TODO handle texture resize

        // Watch for changes in child
        event.addListener(child, 'istransformdirty_changed', util.callback(this, function() { this.set('dirty', true); }));
        event.addListener(child, 'visible_changed', util.callback(this, function() { this.set('dirty', true); }));

        this.set('dirty', true);

        return ret;
    },

    _resizeCanvas: function(oldSize) {
        var size = this.get('contentSize');

        if (geo.sizeEqualToSize(size, oldSize)) {
            return; // No change
        }

        this.renderTexture.set('contentSize', size);
        this.set('dirty', true);
    },

    update: function() {

    },

    visit: function(context) {
        if (!this.visible) {
            return;
        }

        context.save();

        this.transform(context);

        // Only redraw if something changed
        if (this.dirty) {
            this.renderTexture.clear();
            for (var i = 0, childLen = this.children.length; i < childLen; i++) {
                var c = this.children[i];
                if (c == this.renderTexture) {
                    continue;
                }
                c.visit(this.renderTexture.context);
            }
            this.set('dirty', false);
        }

        this.renderTexture.visit(context);

        this.draw(context);

        context.restore();
	},

	draw: function(ctx) {
    }
});

/**
 * @class cocos.nodes.SpriteBatchNode A BatchNode that accepts only Sprite using the same texture
 * @extends cocos.nodes.BatchNode
 *
 * @constructor
 * @namedparams
 * @param {String} file (Optional) Path to image to use as sprite atlas
 * @param {Texture2D} texture (Optional) Texture to use as sprite atlas
 * @param {cocos.TextureAtlas} textureAtlas (Optional) TextureAtlas to use as sprite atlas
 */
var SpriteBatchNode = BatchNode.extend({
    textureAtlas: null,

    init: function(opts) {
        @super;

        var file         = opts['file'],
            textureAtlas = opts['textureAtlas'],
            texture      = opts['texture'];

        if (file || texture) {
            textureAtlas = TextureAtlas.create({file: file, texture: texture});
        }

        this.set('textureAtlas', textureAtlas);
    },

    /**
     * @property texture
     * @type cocos.Texture2D
     */
    get_texture: function() {
		return this.textureAtlas ? this.textureAtlas.texture : null;
	}

});

exports.BatchNode = BatchNode;
exports.SpriteBatchNode = SpriteBatchNode;
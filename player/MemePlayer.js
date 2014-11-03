+function () {
'use strict';
function isGIF(url) {
  return /\.gif$/i.test(url);
}

function isDefined(value) {
  return typeof value !== 'undefined';
}

function isString(value) {
  return typeof value === 'string';
}

var BASE64_DATAURI_REGEX = /^data:(\w+\/\w+);base64,(.*)$/;

function dataURLtoBase64(dataUrl) {
  var match = dataUrl.match(BASE64_DATAURI_REGEX);

  if (!match) {
    throw new Error("[MemePlayer:nodatauri] Can't match url: " + dataUrl +
      " to regex: " + BASE64_DATAURI_REGEX);
  }
  return match[2];
}

function getHttpAsArrayBuffer(url, cb) {
  var xhr = new XMLHttpRequest(),
    requestError;

  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';

  requestError = function () {
    cb(new Error('[MemePlayer:network] A network error occurred.'));
  };

  xhr.onload = function () {
    var response = xhr.response;
    if (xhr.status >= 400) {
      cb(new Error('[MemePlayer:http] HTTP request returned ' + xhr.status), response);
    } else {
      cb(null, response);
    }
  };

  xhr.onerror = xhr.onabort = requestError;
  xhr.send();
}

function createFrames(ctx, url, width, height, cb) {
  var img;

  if (isGIF(url)) {
    getHttpAsArrayBuffer(url, function (err, data) {
      if (err) {
        cb(err);
      } else {
        var decoder = new GIF.Decoder(new Uint8Array(data)),
          gif = { frames: [] },
          nFrames = decoder.numFrames(),
          imageData,
          lastImageRawData,
          frameInfo;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        if (nFrames > 0) {
          imageData = ctx.createImageData(decoder.width, decoder.height);
          decoder.decodeAndBlitFrameRGBA(0, imageData.data);
          frameInfo = decoder.frameInfo(0);
          gif.frames.push({
            delay: frameInfo.delay,
            frame: imageData
          });
          lastImageRawData = imageData.data;
        }
        for (var i = 1; i < nFrames; i++) {
          imageData = ctx.createImageData(decoder.width, decoder.height);
          for (var j = 0; j < imageData.data.length; j++) {
            imageData.data[j] = lastImageRawData[j];
          }
          decoder.decodeAndBlitFrameRGBA(i, imageData.data);
          frameInfo = decoder.frameInfo(i);
          gif.frames.push({
            delay: frameInfo.delay,
            frame: imageData
          });
          lastImageRawData = imageData.data;
        }
        cb(null, gif);
      }
    });
  } else {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.addEventListener('load', function () {
      var imageData;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      imageData = ctx.getImageData(0, 0, width, height);
      cb(null, { frames: [{ frame: imageData }] });
    });
    img.src = url;
  }
}

function bestSplit (ctx, value) {
  var words = value.split(/\s+/),
      i,
      metrics,
      upperWidth,
      lowerWidth,
      renderWidth,
      minWidth,
      upperText,
      lowerText,
      bestValue;

  metrics = ctx.measureText(value);
  minWidth = metrics.width;
  bestValue = value;

  for (i = 1; i < words.length; i++) {
    upperText = words.slice(0, i).join(' ');
    metrics = ctx.measureText(upperText);
    upperWidth = metrics.width;
    lowerText = words.slice(i).join(' ');
    metrics = ctx.measureText(lowerText);
    lowerWidth = metrics.width;
    renderWidth = Math.max(upperWidth, lowerWidth);
    if (renderWidth < minWidth) {
      minWidth = renderWidth;
      bestValue = [upperText, lowerText];
    }
  }

  return {
    width: minWidth,
    value: bestValue
  };
}

function renderText (ctx, text, img) {
  var renderLine, xPos, yPos, upperOffset, lowerOffset;

  xPos = {
    left: 0,
    center: img.width/2,
    right: img.width
  };

  yPos = {
    top: 0,
    middle: img.height/2,
    bottom: img.height
  };

  upperOffset = {
    top: 0,
    middle: -30,
    bottom: -60
  };

  lowerOffset = {
    top: 60,
    middle: 30,
    bottom: 0
  };

  renderLine = function (value, align, baseline) {
    var metrics, scale, opt;

    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    metrics = ctx.measureText(value);
    scale = Math.min(1.0, img.width / metrics.width);
    if (scale <= 0.5) {
      opt = bestSplit(ctx, value);
      scale = Math.min(1.0, img.width / opt.width);
      value = opt.value;
    }

    ctx.save();
    ctx.translate(xPos[align], yPos[baseline]);
    ctx.scale(scale, scale);
    if (isString(value)) {
      ctx.fillText(value, 0, 0);
      ctx.strokeText(value, 0, 0);
    } else {
      ctx.save();
      ctx.translate(0, upperOffset[baseline]);
      ctx.fillText(value[0], 0, 0);
      ctx.strokeText(value[0], 0, 0);
      ctx.restore();
      ctx.translate(0, lowerOffset[baseline]);
      ctx.fillText(value[1], 0, 0);
      ctx.strokeText(value[1], 0, 0);
    }
    ctx.restore();
  };

  ctx.font = "60px Impact";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  renderLine(text.top.value, text.top.align, 'top');
  renderLine(text.middle.value, text.middle.align, 'middle');
  renderLine(text.bottom.value, text.bottom.align, 'bottom');
}

function createContentData(canvas, ctx, text, image, cb) {
  var encoder,
    frame,
    frameIndex,
    renderNextFrame;

  if (image.frames.length > 1) {
    // animated GIF
    frameIndex = 0;
    encoder = new GIF.Encoder();
    encoder.setRepeat(0);
    encoder.start();
    renderNextFrame = function () {
      frame = image.frames[frameIndex++];
      encoder.setDelay(frame.delay * 10); // 1/100ths sec -> ms
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, frame.frame.width, frame.frame.height);
      ctx.putImageData(frame.frame, 0, 0);
      renderText(ctx, text, frame.frame);
      encoder.addFrame(ctx);

      if (frameIndex === image.frames.length) {
        encoder.finish();
        cb(null, {
          data: btoa(encoder.stream().getData()),
          contentType: 'image/gif'
        });
      } else {
        // perf: don't bog down the event loop.
        setTimeout(renderNextFrame, 0);
      }
    };
    renderNextFrame();
  } else {
    // JPG
    frame = image.frames[0];
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, frame.frame.width, frame.frame.height);
    ctx.putImageData(frame.frame, 0, 0);
    renderText(ctx, text, frame.frame);
    cb(null, {
      data: dataURLtoBase64(canvas.toDataURL('image/jpeg')),
      contentType: 'image/jpeg'
    });
  }
}

/**
 * @class MemePlayer
 * @description
 * Enhances a canvas with meme viewing and editing capabilities.
 *
 * @param {!HTMLCanvasElement} canvas The canvas element to render into.
 * @param {!number} width The width of the canvas, in pixels.
 * @param {!number} height The height of the canvas, in pixels.
 */
function MemePlayer(canvas, width, height) {
  this.$$canvas = canvas;
  this.$$ctx = canvas.getContext('2d');
  this.$$image = null;
  this.$$text = {
    top: { value: '', align: 'center' },
    middle: { value: '', align: 'center' },
    bottom: { value: '', align: 'center' }
  };
  this.$$width = width;
  this.$$height = height;
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);
}

/**
 * @method MemePlayer#setWidth
 * @description
 * Sets the width of the canvas.
 *
 * @param {number} width The new width of the canvas, in pixels.
 */
MemePlayer.prototype.setWidth = function (width) {
  this.$$width = width;
  this.$$canvas.setAttribute('width', width);
  this.$$redraw();
};

/**
 * @method MemePlayer#setHeight
 * @description
 * Sets the height of the canvas.
 *
 * @param {number} height The new height of the canvas, in pixels.
 */
MemePlayer.prototype.setHeight = function (height) {
  this.$$height = height;
  this.$$canvas.setAttribute('height', height);
  this.$$redraw();
};

/**
 * @method MemePlayer#loadTemplate
 * @description
 * Loads a template image and starts displaying it on the canvas.
 *
 * @param {!string} url The URL of the image to display. JPG, PNG and GIF are
 *    supported image formats.
 * @param {MemePlayer~loadTemplateCallback} cb The callback that handles the
 *    result.
 */
MemePlayer.prototype.loadTemplate = function (url, cb) {
  createFrames(this.$$ctx, url, this.$$width, this.$$height, function (err, image) {
    if (err) {
      cb(err);
    } else {
      this.$$image = image;
      this.$$frameIndex = 0;
      this.$$redraw();
      cb();
    }
  }.bind(this));
};

/**
 * @callback MemePlayer~loadTemplateCallback
 * @description
 * This callback handles the result from loading a template URL.
 *
 * @param {?Error} err If not null, the error that occurred trying to load
 *    the template.
 */

/**
 * @private
 */
MemePlayer.prototype.$$redraw = function () {
  var ctx = this.$$ctx,
    image = this.$$image,
    text = this.$$text,
    timeout = this.$$timeout,
    frame;

  if (image) {
    frame = image.frames[this.$$frameIndex].frame;
    if (timeout) {
      clearTimeout(timeout);
      this.$$timeout = null;
    }
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, frame.width, frame.height);
    ctx.putImageData(frame, 0, 0);
    renderText(ctx, text, frame);

    if (isDefined(image.frames[this.$$frameIndex].delay)) {
      this.$$timeout = setTimeout(function () {
        this.$$timeout = null;
        if (this.$$image) {
          this.$$frameIndex = (this.$$frameIndex + 1) % image.frames.length;
          this.$$redraw();
        }
      }.bind(this), image.frames[this.$$frameIndex].delay * 10);
    }
  }
};

/**
 * An object containing meme text to render over an image.
 * @typedef {Object} MemePlayer~MemeText
 * @property {Object} top An object representing the top line of text, if any.
 * @property {string} top.value The actual text content of the top line.
 * @property {string} top.align The alignment of the top line. Must be one of
 *    'left', 'right' or 'center'.
 * @property {Object} middle An object representing the middle line of text, if any.
 * @property {string} middle.value The actual text content of the middle line.
 * @property {string} middle.align The alignment of the middle line. Must be one of
 *    'left', 'right' or 'center'.
 * @property {Object} bottom An object representing the bottom line of text, if any.
 * @property {string} bottom.value The actual text content of the bottom line.
 * @property {string} bottom.align The alignment of the bottom line. Must be one of
 *    'left', 'right' or 'center'.
 */

/**
 * @method MemePlayer#setText
 * @description
 * Sets the meme text and re-renders the meme.
 *
 * @param {MemeText} text The new meme text to render.
 */
MemePlayer.prototype.setText = function (text) {
  this.$$text.top.value = text.top.value || '';
  this.$$text.top.align = text.top.align || 'center';
  this.$$text.middle.value = text.middle.value || '';
  this.$$text.middle.align = text.middle.align || 'center';
  this.$$text.bottom.value = text.bottom.value || '';
  this.$$text.bottom.align = text.bottom.align || 'center';
  this.$$redraw();
};

/**
 * @typedef {Object} MemePlayer~MemeData
 * @property {string} data The base64 encoded meme data.
 * @property {string} contentType The MIME type of the base64 encoded data.
 *    Guaranteed to be an image type, and if the loaded template was an animated
 *    GIF with multiple frames it's also guaranteed to be 'image/gif'.
 */

/**
 * @method MemePlayer#export
 * @description
 * Exports the content of the player to a data URL.
 *
 * @param {MemePlayer~exportCallback} cb A callback for the result
 */
MemePlayer.prototype.export = function (cb) {
  createContentData(this.$$canvas, this.$$ctx, this.$$text, this.$$image, cb);
};

/**
 * @callback MemePlayer~exportCallback
 * @param {?Error} err If not null, the error that occurred trying to export the
 *    content.
 * @param {MemeData} result The exported contents of this MemePlayer.
 */
window.MemePlayer = MemePlayer;
}();
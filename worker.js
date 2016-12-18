if (this.Editor) {
  Editor.Worker = function(editor, data, callback) {
    if (!editor.workers) {
      editor.workers = [];
      editor.idleWorkers = [];
      editor.workerQueue = [];
    }

    var worker = editor.idleWorkers.pop()
    if (!worker) {
      if (editor.workers.length < Editor.Worker.max) {
        var worker = new Worker('worker.images.js');
        editor.workers.push(worker);
      } else {
        editor.workerQueue.push(data, callback)
      }
    }
    if (worker)
      Editor.Worker.process(editor, worker, data, callback)
    return editor.worker;
  }
  Editor.Worker.max  = 2;

  Editor.Worker.process = function(editor, worker, data, callback) {
    var listener = function(e) {
      callback.call(editor, e.data)

      worker.removeEventListener('message', listener);

      var cb = editor.workerQueue.pop()
      if (cb) {
        Editor.Worker.process(editor, worker, editor.workerQueue.pop(), cb)
      } else {
        editor.idleWorkers.push(worker)
        clearTimeout(editor.killWorkers)
        editor.killWorkers = setTimeout(function() {
          editor.idleWorkers = editor.idleWorkers.filter(function(worker, index) {
            if (index > 0) {
              var i = editor.workers.indexOf(worker)
              if (i > -1) 
                editor.workers.splice(i, 1)
              worker.terminate()
            } else {
              return true;
            }
          });
        }, 5000)
      }
    };
    worker.addEventListener('message', listener);
    console.time('postmessage')
    worker.postMessage(data)
    console.timeEnd('postmessage')
  }
} else {
  self.addEventListener('message', function(e) {
    var data = e.data;

    var palette = Palette(data)

    var beforeCrop = new Date;
    smartcrop.crop(data, {
      imageOperations: IO,
      width: Math.min(data.width, data.height),
      height: Math.min(data.height, data.width)
    }).then(function(result) {
      // send data to main thread to put unto canvas
      postMessage({
        palette: palette.toString(),
        square: result.topCrop,
        cropTime: new Date - beforeCrop
      });
    })

  }, false);


  var IO = {
    // Takes imageInput as argument
    // returns an object which has at least
    // {width: n, height: n}
    open: function(image) {
      return smartcrop.Promise.resolve(image);
    },
    // Takes an image (as returned by open), and changes it's size by resampling
    resample: function(image, width, height) {
      return Promise.resolve(image).then(function(image) {
        var c = canvasFactory(~~width, ~~height);
        var ctx = c.getContext('2d');

        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, c.width, c.height);
        return smartcrop.Promise.resolve(c);
      });
    },
    getData: function(image) {
      return Promise.resolve(image).then(function(c) {
        return image
      });
    },
  }


}

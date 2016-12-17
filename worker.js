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
          editor.idleWorkers.forEach(function(worker, index) {
            if (index > 0) {
              var i = editor.workers.indexOf(worker)
              if (i > -1) 
                editor.workers.splice(i, 1)
              worker.terminate()
            }
          });
          editor.idleWorkers = []
        }, 5000)
      }
    };
    worker.addEventListener('message', listener);
    worker.postMessage(data)
  }
} else {
  self.addEventListener('message', function(e) {
    var data = e.data;

    var palette = Palette(data)

    // send data to main thread to put unto canvas
    postMessage(palette.toString());
  }, false);
}


class StrokeLine {
  constructor(id, options) {
    if (!options) options = {};

    this.reg = new RegExp('^touch');
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.frameId = null;
    this.last = { x: 0, y: 0 };
    this.queue = [];
    this.drawing = false;
    this.setDrawType('draw');

    this.initContext(options.contextOptions || {});
    this.setEvents();
  }

  start() {
    this.stop();
    const animateFrame = ((callback) => {
      return window.requestAnimationFrame
        || function (cb) {
          return window.setTimeout(cb, 1000/60);
        };
    })();
    const loop = () => {
      this.frameId = animateFrame(loop);
      this.stroke();
    };
    loop();
  }

  stop() {
    this.resetDrawData();
    if (this.frameId) {
      const cancelAnimateFrame = window.cancelAnimationFrame
        || window.clearTimeout;
      cancelAnimateFrame(this.frameId);
    }
  }

  clear() {
    this.clearCanvas();
    this.initContext();
    this.resetDrawData();
  }

  getData() {
    return this.canvas.toDataURL();
  }

  setDrawType(type) {
    this.drawType = type;

    if (type === 'elase') {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  clearCanvas() {
    this.canvas.width = this.canvas.width;
  }

  initContext(options) {
    if (!options) options = {};
    Object.keys(options).forEach((key) => {
      this.ctx[key] = options[key];
    });
  }

  resetDrawData() {
    this.last = { x: 0, y: 0 };
    this.queue = [];
    this.drawing = false;
    this.setDrawType('draw');
  }

  setEvents() {
    [
      { eventName: 'touchstart', handle: 'drawStart' },
      { eventName: 'touchmove', handle: 'draw' },
      { eventName: 'touchend', handle: 'drawEnd' },
      { eventName: 'mousedown', handle: 'drawStart' },
      { eventName: 'mousemove', handle: 'draw' },
      { eventName: 'mouseup', handle: 'drawEnd' },
    ].forEach(({ eventName, handle }) => {
      this.canvas.addEventListener(eventName, (e) => {
        if (!this.frameId) return;

        e.stopPropagation();
        e.preventDefault();
        this[handle](e);
      }, false);
    });
  }

  drawStart(event) {
    this.drawing = true;
    this.last = this.getCurrentPos(event);
  }

  draw(event) {
    if (!this.drawing) return;

    this.queue.push(this.getCurrentPos(event));
  }

  drawEnd() {
    this.drawing = false;
  }

  getCurrentPos(event) {
    const { left, top } = this.canvas.getBoundingClientRect();
    const { clientX, clientY } = this.getClientPos(event);

    return { x: clientX - left, y: clientY - top };
  }

  getClientPos(event) {
    return this.reg.test(event.type)
      ? {
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY,
      }
      : {
        clientX: event.clientX,
        clientY: event.clientY,
      };
  }

  stroke() {
    if (!this.queue.length && !this.drawing) {
      return;
    }

    let pos = this.queue.shift();
    while(pos) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.last.x, this.last.y);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
      this.last = pos;
      pos = this.queue.shift();
    }
  }
}

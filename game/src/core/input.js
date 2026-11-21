// Input Manager: Keyboard, Mouse, Pointer Lock

export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;
    this.keys = new Set();
    this.justPressed = new Set();
    this.mouse = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      down: false,
      rightDown: false,
      justDown: false
    };
    this.pointerLocked = false;

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
  }

  requestPointerLock() {
    if (!this.pointerLocked && this.domElement && this.domElement.requestPointerLock) {
      this.domElement.requestPointerLock();
    }
  }

  exitPointerLock() {
    if (this.pointerLocked && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  _onKeyDown(e) {
    const k = e.code;
    if (!this.keys.has(k)) {
      this.justPressed.add(k);
    }
    this.keys.add(k);
  }

  _onKeyUp(e) {
    this.keys.delete(e.code);
  }

  _onMouseMove(e) {
    if (this.pointerLocked) {
      this.mouse.dx += e.movementX || 0;
      this.mouse.dy += e.movementY || 0;
    }
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  _onMouseDown(e) {
    if (e.button === 0) {
      this.mouse.down = true;
      this.mouse.justDown = true;
      this.requestPointerLock();
    } else if (e.button === 2) {
      this.mouse.rightDown = true;
    }
  }

  _onMouseUp(e) {
    if (e.button === 0) this.mouse.down = false;
    if (e.button === 2) this.mouse.rightDown = false;
  }

  _onPointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.domElement;
  }

  isDown(code) {
    return this.keys.has(code);
  }

  wasJustPressed(code) {
    return this.justPressed.has(code);
  }

  postUpdate() {
    this.justPressed.clear();
    this.mouse.justDown = false;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
  }

  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
  }
}

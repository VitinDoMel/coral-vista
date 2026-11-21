export class InputController {
  constructor(domElement) {
    this.domElement = domElement;
    this.keysDown = new Set();
    this.keysJustPressed = new Set();
    this.mouseButtonsDown = new Set();
    this.mouseButtonsJustPressed = new Set();
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.pointerLocked = false;
    this.pointerLockEnabled = true;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (event) => {
      const code = event.code;
      if (!this.keysDown.has(code)) {
        this.keysJustPressed.add(code);
      }
      this.keysDown.add(code);
    });

    window.addEventListener('keyup', (event) => {
      this.keysDown.delete(event.code);
    });

    window.addEventListener('mousemove', (event) => {
      if (this.pointerLocked || this.mouseButtonsDown.has(2)) {
        this.mouseDeltaX += event.movementX || 0;
        this.mouseDeltaY += event.movementY || 0;
      }
    });

    this.domElement.addEventListener('mousedown', (event) => {
      if (!this.mouseButtonsDown.has(event.button)) {
        this.mouseButtonsJustPressed.add(event.button);
      }
      this.mouseButtonsDown.add(event.button);

      if (
        this.pointerLockEnabled &&
        !this.pointerLocked &&
        this.domElement.requestPointerLock
      ) {
        try {
          this.domElement.requestPointerLock();
        } catch (_err) {
          // Headless browser may reject pointer lock
        }
      }
    });

    window.addEventListener('mouseup', (event) => {
      this.mouseButtonsDown.delete(event.button);
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.domElement;
    });
  }

  isKeyDown(code) {
    return this.keysDown.has(code);
  }

  consumeKeyPress(code) {
    if (this.keysJustPressed.has(code)) {
      this.keysJustPressed.delete(code);
      return true;
    }
    return false;
  }

  consumeMouseDelta() {
    const dx = this.mouseDeltaX;
    const dy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return { dx, dy };
  }

  endFrame() {
    this.keysJustPressed.clear();
    this.mouseButtonsJustPressed.clear();
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }
}

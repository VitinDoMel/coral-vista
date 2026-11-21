// Keyboard and mouse user input manager

export class InputManager {
  constructor(domElement) {
    this.domElement = domElement;
    this.keys = new Map();
    this.mouse = {
      deltaX: 0,
      deltaY: 0,
      isLocked: false,
      leftButton: false,
      rightButton: false,
    };

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);

    this.domElement.addEventListener('click', () => {
      if (!this.mouse.isLocked && document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock();
      }
    });
  }

  onKeyDown(event) {
    this.keys.set(event.code, true);
  }

  onKeyUp(event) {
    this.keys.set(event.code, false);
  }

  onMouseMove(event) {
    if (this.mouse.isLocked) {
      this.mouse.deltaX += event.movementX || 0;
      this.mouse.deltaY += event.movementY || 0;
    }
  }

  onMouseDown(event) {
    if (event.button === 0) this.mouse.leftButton = true;
    if (event.button === 2) this.mouse.rightButton = true;
  }

  onMouseUp(event) {
    if (event.button === 0) this.mouse.leftButton = false;
    if (event.button === 2) this.mouse.rightButton = false;
  }

  onPointerLockChange() {
    this.mouse.isLocked = document.pointerLockElement === this.domElement;
    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.style.opacity = this.mouse.isLocked ? '0' : '0.9';
    }
  }

  isDown(code) {
    return !!this.keys.get(code);
  }

  consumeMouseDelta() {
    const dx = this.mouse.deltaX;
    const dy = this.mouse.deltaY;
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    return { dx, dy };
  }

  getMovementVector() {
    let forward = 0;
    let right = 0;

    if (this.isDown('KeyW') || this.isDown('ArrowUp')) forward += 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) forward -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) right += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) right -= 1;

    const len = Math.hypot(forward, right);
    if (len > 0) {
      forward /= len;
      right /= len;
    }

    return {
      forward,
      right,
      sprint: this.isDown('ShiftLeft') || this.isDown('ShiftRight'),
      jump: this.isDown('Space'),
      interact: this.isDown('KeyF') || this.isDown('KeyE'),
    };
  }
}

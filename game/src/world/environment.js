import * as THREE from 'three';
import { PALETTE, CITY_BOUNDS } from '../core/constants.js';

// Sun-Soaked Coastal Environment: Sky Gradient Shader, Sun, Distant Fog, Turquoise Sea, Sand Beach

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this._setupSky();
    this._setupLighting();
    this._setupSeaAndBeach();
  }

  _setupSky() {
    // Sky Dome with Vertical Gradient Shader (Deep Blue Top -> Soft Cyan -> Warm Peach -> Pink Horizon)
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 horizonColor;
      uniform vec3 bandColor;
      uniform vec3 sunColor;
      uniform vec3 sunPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 dir = normalize(vWorldPosition);
        float h = clamp(dir.y, 0.0, 1.0);

        vec3 sky;
        if (h > 0.35) {
          sky = mix(midColor, topColor, (h - 0.35) / 0.65);
        } else {
          sky = mix(horizonColor, midColor, h / 0.35);
        }

        // Sunset pink band right near horizon
        float band = exp(-pow((h - 0.06) * 18.0, 2.0));
        sky = mix(sky, bandColor, band * 0.45);

        // Low Western Sun Disc
        vec3 sDir = normalize(sunPosition);
        float sunDot = max(0.0, dot(dir, sDir));
        float sunDisc = smoothstep(0.996, 0.999, sunDot);
        float sunGlow = pow(sunDot, 48.0) * 0.55;

        sky += (sunColor * sunDisc * 2.5) + (sunColor * sunGlow * 0.8);
        gl_FragColor = vec4(sky, 1.0);
      }
    `;

    const sunPos = new THREE.Vector3(-380, 130, -260);

    const skyUniforms = {
      topColor: { value: new THREE.Color(PALETTE.skyTop) },
      midColor: { value: new THREE.Color(PALETTE.skyMid) },
      horizonColor: { value: new THREE.Color(PALETTE.skyHorizon) },
      bandColor: { value: new THREE.Color(PALETTE.skyBand) },
      sunColor: { value: new THREE.Color(PALETTE.sun) },
      sunPosition: { value: sunPos }
    };

    const skyGeo = new THREE.SphereGeometry(950, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    // Far, clear warm peach fog
    this.scene.fog = new THREE.Fog(PALETTE.fog, 130, 620);
  }

  _setupLighting() {
    // Balanced natural Hemisphere light (Sky blue down, warm sand bounce up)
    this.hemiLight = new THREE.HemisphereLight(PALETTE.hemiSky, PALETTE.hemiGround, 1.25);
    this.hemiLight.position.set(0, 100, 0);
    this.scene.add(this.hemiLight);

    // Directional Sun Light casting crisp, soft PCF shadows
    this.sunLight = new THREE.DirectionalLight(PALETTE.sun, 2.6);
    this.sunLight.position.set(-280, 150, -200);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 700;
    const d = 160;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  _setupSeaAndBeach() {
    // Broad turquoise ocean (#1fb5c9 -> #0e7fa6)
    const seaGeo = new THREE.PlaneGeometry(1600, 900);
    const seaMat = new THREE.MeshStandardMaterial({
      color: PALETTE.seaShallow,
      roughness: 0.15,
      metalness: 0.35
    });

    this.seaMesh = new THREE.Mesh(seaGeo, seaMat);
    this.seaMesh.rotation.x = -Math.PI / 2;
    this.seaMesh.position.set(0, -0.4, 650);
    this.seaMesh.receiveShadow = true;
    this.scene.add(this.seaMesh);

    // Fine golden sand beach (#f3dfb0) along Seabreeze Boulevard
    const beachGeo = new THREE.PlaneGeometry(800, 75);
    const beachMat = new THREE.MeshStandardMaterial({
      color: PALETTE.sand,
      roughness: 0.9
    });

    this.beachMesh = new THREE.Mesh(beachGeo, beachMat);
    this.beachMesh.rotation.x = -Math.PI / 2;
    this.beachMesh.position.set(0, 0.05, 238);
    this.beachMesh.receiveShadow = true;
    this.scene.add(this.beachMesh);
  }

  updateFollow(pos) {
    if (this.skyMesh) {
      this.skyMesh.position.copy(pos);
    }
    if (this.sunLight) {
      this.sunLight.position.set(pos.x - 280, 150, pos.z - 200);
      this.sunLight.target.position.set(pos.x, 0, pos.z);
    }
  }
}

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PRODUCTS, PRODUCT_MAP } from './catalog';
import {
  AABB,
  CashierRig,
  PlayerRig,
  ShelfRig,
  createCashierDesk,
  createKopdesStore,
  createPlayerModel,
  createProductMesh,
  createReturnCrate,
  createShelfUnit,
  createVillagerModel,
} from './models';
import { soundManager } from './sound';
import { StoreTexturePack, createStoreTexturePack } from './textures';
import {
  ActiveOrder,
  BasketItem,
  CameraPreset,
  GamePhase,
  NearbyInteractable,
  ProductId,
  TouchMoveVector,
  VillagerProfile,
} from './types';

// Pre-allocated math helpers (zero GC inside render loop)
const _moveVec = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

interface FlyingItem {
  mesh: THREE.Group;
  start: THREE.Vector3;
  elapsed: number;
  duration: number;
}

export interface EngineCallbacks {
  onNearbyChange: (nearby: NearbyInteractable | null) => void;
  onDirectClickInteract: (type: 'shelf' | 'cashier' | 'return', productId?: ProductId) => void;
  onContextLost: (lost: boolean) => void;
}

const CAMERA_OFFSETS: Record<CameraPreset, { offset: THREE.Vector3; lookY: number }> = {
  near: { offset: new THREE.Vector3(0, 4.4, 5.2), lookY: 1.05 },
  standard: { offset: new THREE.Vector3(0, 6.2, 6.8), lookY: 0.9 },
  high: { offset: new THREE.Vector3(0, 9.2, 7.6), lookY: 0.5 },
};

const STORE_BOUNDS = {
  minX: -6.55,
  maxX: 6.55,
  minZ: -5.95,
  maxZ: 5.95,
};

const PLAYER_RADIUS = 0.42;

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class KopdesGameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: StoreTexturePack;
  private envRT: THREE.WebGLRenderTarget;

  private player: PlayerRig;
  private shelves: ShelfRig[] = [];
  private cashier: CashierRig;
  private returnPoint: THREE.Vector3;
  private colliders: AABB[] = [];
  private clickables: THREE.Object3D[] = [];

  private currentVillagerMesh: THREE.Group | null = null;
  private villagerCelebrateTime = 0;

  private keys = new Set<string>();
  private touchMove: TouchMoveVector = { x: 0, z: 0 };

  private phase: GamePhase = 'menu';
  private cameraPreset: CameraPreset = 'standard';
  private activeOrder: ActiveOrder | null = null;
  private basket: BasketItem[] = [];
  private orderReady = false;

  private playerPos = new THREE.Vector3(-1.5, 0, 3.6);
  private playerYaw = Math.PI;
  private walkCycle = 0;
  private menuOrbitAngle = 0.35;

  private lastNearbyKey = '';
  private flyingItems: FlyingItem[] = [];

  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcce7f5);
    this.scene.fog = new THREE.Fog(0xcce7f5, 19, 46);

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 90);
    this.camera.position.set(0, 6.8, 10.2);

    // Mandatory studio environment reflection
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    // Warm/cool balanced lighting rig (<= 3 shadow casters)
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0xb8956a, 0.78);
    hemiLight.position.set(0, 14, 0);
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 1.38);
    keyLight.position.set(6.5, 12.5, 7.5);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 32;
    const d = 10;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimFill = new THREE.DirectionalLight(0xdbeafe, 0.42);
    rimFill.position.set(-8, 6, -7);
    this.scene.add(rimFill);

    // Build procedural textures & Kopdes Merah Putih interior
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createStoreTexturePack(PRODUCTS, maxAniso);

    const store = createKopdesStore(this.textures);
    this.scene.add(store);

    // Build 8 Kopdes shelves
    for (const prod of PRODUCTS) {
      const { rig, collider } = createShelfUnit(prod, this.textures);
      this.shelves.push(rig);
      this.colliders.push(collider);
      this.clickables.push(rig.hitbox);
      this.scene.add(rig.group);
    }

    // Build cashier counter
    const cashierBuilt = createCashierDesk(this.textures);
    this.cashier = cashierBuilt.rig;
    this.colliders.push(...cashierBuilt.colliders);
    this.clickables.push(this.cashier.hitbox);
    this.scene.add(this.cashier.group);

    // Build return crate
    const returnBuilt = createReturnCrate(this.textures);
    this.returnPoint = returnBuilt.interactPoint;
    this.colliders.push(returnBuilt.collider);
    this.clickables.push(returnBuilt.hitbox);
    this.scene.add(returnBuilt.group);

    // Build Kopdes player officer
    this.player = createPlayerModel(this.textures.contactShadow);
    this.player.root.position.copy(this.playerPos);
    this.player.root.rotation.y = this.playerYaw;
    this.scene.add(this.player.root);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.clock.start();
    this.tick();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleResize = (): void => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      if (this.phase === 'playing') {
        e.preventDefault();
      }
    }
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handleBlur = (): void => {
    this.keys.clear();
    this.touchMove.x = 0;
    this.touchMove.z = 0;
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (this.phase !== 'playing') return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    _raycaster.setFromCamera(_pointer, this.camera);

    const hits = _raycaster.intersectObjects(this.clickables, false);
    if (hits.length > 0) {
      const data = hits[0].object.userData as {
        interactType?: 'shelf' | 'cashier' | 'return';
        productId?: ProductId;
      };
      if (data.interactType === 'shelf' && data.productId) {
        const shelf = this.shelves.find((s) => s.product.id === data.productId);
        if (shelf && this.playerPos.distanceTo(shelf.interactPoint) < 3.0) {
          this.callbacks.onDirectClickInteract('shelf', data.productId);
        }
      } else if (data.interactType === 'cashier') {
        if (this.playerPos.distanceTo(this.cashier.interactPoint) < 3.2) {
          this.callbacks.onDirectClickInteract('cashier');
        }
      } else if (data.interactType === 'return') {
        if (this.playerPos.distanceTo(this.returnPoint) < 2.8) {
          this.callbacks.onDirectClickInteract('return');
        }
      }
    }
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.callbacks.onContextLost(true);
  };

  private handleContextRestored = (): void => {
    this.callbacks.onContextLost(false);
  };

  public setPhase(phase: GamePhase): void {
    this.phase = phase;
    if (phase !== 'playing') {
      this.keys.clear();
      this.touchMove.x = 0;
      this.touchMove.z = 0;
    }
  }

  public setCameraPreset(preset: CameraPreset): void {
    this.cameraPreset = preset;
  }

  public setTouchMove(vec: TouchMoveVector): void {
    this.touchMove.x = vec.x;
    this.touchMove.z = vec.z;
  }

  public resetPlayerPosition(): void {
    this.playerPos.set(-1.5, 0, 3.6);
    this.playerYaw = Math.PI;
    this.player.root.position.copy(this.playerPos);
    this.player.root.rotation.y = this.playerYaw;
    this.lastNearbyKey = '';
    this.callbacks.onNearbyChange(null);
  }

  public setActiveOrder(order: ActiveOrder | null, villagerChanged: boolean): void {
    this.activeOrder = order;
    if (order && villagerChanged) {
      this.spawnVillager(order.villager);
    }
    this.recomputeOrderReadiness();
  }

  public syncBasket(items: BasketItem[]): void {
    this.basket = items;
    const container = this.player.basketItemsGroup;

    // Clear existing miniature meshes
    while (container.children.length > 0) {
      const child = container.children[0];
      container.remove(child);
    }

    // Place up to 8 miniature 3D products neatly in 2 stacked layers inside the basket
    items.slice(0, 8).forEach((item, index) => {
      const mini = createProductMesh(item.productId, 0.56);
      const layer = Math.floor(index / 4);
      const slot = index % 4;
      const col = slot % 2;
      const row = Math.floor(slot / 2);
      mini.position.set(-0.14 + col * 0.28, layer * 0.14, -0.09 + row * 0.18);
      mini.rotation.y = (slot * 0.35 - 0.5) * 0.6;
      container.add(mini);
    });

    this.recomputeOrderReadiness();
  }

  public triggerPickupArc(productId: ProductId): void {
    const shelf = this.shelves.find((s) => s.product.id === productId);
    if (!shelf) return;
    const mesh = createProductMesh(productId, 0.72);
    const start = new THREE.Vector3(
      shelf.product.shelfPosition[0],
      1.15,
      shelf.product.shelfPosition[2] + 0.35,
    );
    mesh.position.copy(start);
    this.scene.add(mesh);
    this.flyingItems.push({ mesh, start, elapsed: 0, duration: 0.28 });
  }

  public triggerVillagerCelebrate(): void {
    this.villagerCelebrateTime = 0.65;
  }

  private spawnVillager(profile: VillagerProfile): void {
    const anchor = this.cashier.villagerAnchor;
    while (anchor.children.length > 0) {
      anchor.remove(anchor.children[0]);
    }
    this.currentVillagerMesh = createVillagerModel(profile, this.textures.contactShadow);
    anchor.add(this.currentVillagerMesh);
  }

  private recomputeOrderReadiness(): void {
    if (!this.activeOrder) {
      this.orderReady = false;
      return;
    }
    const counts = new Map<ProductId, number>();
    for (const item of this.basket) {
      counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
    }
    this.orderReady = this.activeOrder.items.every(
      (req) => (counts.get(req.productId) ?? 0) >= req.requiredQty,
    );
  }

  private isColliding(x: number, z: number): boolean {
    if (
      x < STORE_BOUNDS.minX + PLAYER_RADIUS ||
      x > STORE_BOUNDS.maxX - PLAYER_RADIUS ||
      z < STORE_BOUNDS.minZ + PLAYER_RADIUS ||
      z > STORE_BOUNDS.maxZ - PLAYER_RADIUS
    ) {
      return true;
    }
    for (const box of this.colliders) {
      if (
        x + PLAYER_RADIUS > box.minX &&
        x - PLAYER_RADIUS < box.maxX &&
        z + PLAYER_RADIUS > box.minZ &&
        z - PLAYER_RADIUS < box.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  private updatePlayer(dt: number): void {
    let ix = this.touchMove.x;
    let iz = this.touchMove.z;

    if (this.phase === 'playing') {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iz -= 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iz += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;
    }

    _moveVec.set(ix, 0, iz);
    const moving = _moveVec.lengthSq() > 0.01;

    if (moving) {
      _moveVec.normalize();
      const speed = 5.4;
      const stepX = _moveVec.x * speed * dt;
      const stepZ = _moveVec.z * speed * dt;

      // Axis-sliding collision resolution
      if (!this.isColliding(this.playerPos.x + stepX, this.playerPos.z)) {
        this.playerPos.x += stepX;
      }
      if (!this.isColliding(this.playerPos.x, this.playerPos.z + stepZ)) {
        this.playerPos.z += stepZ;
      }

      const targetYaw = Math.atan2(_moveVec.x, _moveVec.z);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * (1 - Math.exp(-14 * dt));

      this.walkCycle += dt * 11.5;
      soundManager.playFootstep();
    } else {
      this.walkCycle = THREE.MathUtils.damp(this.walkCycle, 0, 8, dt);
    }

    this.player.root.position.copy(this.playerPos);
    this.player.root.rotation.y = this.playerYaw;

    // Leg swing and gentle body stride bob
    const stride = moving ? Math.sin(this.walkCycle) * 0.52 : 0;
    this.player.leftLeg.rotation.x = THREE.MathUtils.damp(this.player.leftLeg.rotation.x, stride, 16, dt);
    this.player.rightLeg.rotation.x = THREE.MathUtils.damp(this.player.rightLeg.rotation.x, -stride, 16, dt);
    const bob = moving ? Math.abs(Math.sin(this.walkCycle)) * 0.055 : 0;
    this.player.bodyGroup.position.y = THREE.MathUtils.damp(this.player.bodyGroup.position.y, bob, 14, dt);
  }

  private updateBeaconsAndProximity(elapsed: number, dt: number): void {
    const counts = new Map<ProductId, number>();
    for (const item of this.basket) {
      counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
    }

    const neededSet = new Set<ProductId>();
    if (this.activeOrder) {
      for (const req of this.activeOrder.items) {
        if ((counts.get(req.productId) ?? 0) < req.requiredQty) {
          neededSet.add(req.productId);
        }
      }
    }

    const pulseScale = 1 + Math.sin(elapsed * 4.2) * 0.06;
    let closest: NearbyInteractable | null = null;
    let bestDist = Infinity;

    for (const shelf of this.shelves) {
      const isNeeded = neededSet.has(shelf.product.id);
      const targetOpacity = isNeeded && this.phase === 'playing' ? 0.85 : 0.0;
      shelf.beaconMaterial.opacity = THREE.MathUtils.damp(
        shelf.beaconMaterial.opacity,
        targetOpacity,
        8,
        dt,
      );
      if (isNeeded) {
        shelf.beaconMesh.scale.setScalar(pulseScale);
      }

      const dist = this.playerPos.distanceTo(shelf.interactPoint);
      if (dist < 1.95 && dist < bestDist) {
        bestDist = dist;
        closest = {
          type: 'shelf',
          productId: shelf.product.id,
          label: shelf.product.name,
          actionHint: `Ambil ${shelf.product.shortName}`,
          distance: dist,
        };
      }
    }

    // Cashier beacon: strong green glow when order is ready, soft subtle hint otherwise
    const cashierTargetOpacity =
      this.phase === 'playing' ? (this.orderReady ? 0.92 : 0.22) : 0.12;
    this.cashier.beaconMaterial.opacity = THREE.MathUtils.damp(
      this.cashier.beaconMaterial.opacity,
      cashierTargetOpacity,
      8,
      dt,
    );
    this.cashier.beaconMaterial.color.setHex(this.orderReady ? 0x16a34a : 0xd97706);
    if (this.orderReady) {
      this.cashier.beaconMesh.scale.setScalar(pulseScale);
    } else {
      this.cashier.beaconMesh.scale.setScalar(1);
    }

    const distCashier = this.playerPos.distanceTo(this.cashier.interactPoint);
    if (distCashier < 2.25 && distCashier < bestDist) {
      bestDist = distCashier;
      closest = {
        type: 'cashier',
        label: 'Meja Kasir Kopdes',
        actionHint: this.orderReady ? 'Pindai & Hitung Belanja' : 'Lengkapi Daftar Dulu',
        distance: distCashier,
      };
    }

    const distReturn = this.playerPos.distanceTo(this.returnPoint);
    if (distReturn < 1.85 && distReturn < bestDist && this.basket.length > 0) {
      bestDist = distReturn;
      const lastItem = PRODUCT_MAP[this.basket[this.basket.length - 1].productId];
      closest = {
        type: 'return',
        label: 'Kotak Pengembalian',
        actionHint: `Kembalikan ${lastItem.shortName}`,
        distance: distReturn,
      };
    }

    const nextKey = closest
      ? `${closest.type}:${closest.productId ?? ''}:${closest.actionHint}`
      : 'none';
    if (nextKey !== this.lastNearbyKey) {
      this.lastNearbyKey = nextKey;
      this.callbacks.onNearbyChange(closest);
    }
  }

  private updateFlyingItems(dt: number): void {
    for (let i = this.flyingItems.length - 1; i >= 0; i--) {
      const f = this.flyingItems[i];
      f.elapsed += dt;
      const t = Math.min(1, f.elapsed / f.duration);
      const targetX = this.playerPos.x + Math.sin(this.playerYaw) * 0.45;
      const targetZ = this.playerPos.z + Math.cos(this.playerYaw) * 0.45;
      const targetY = 0.98;

      f.mesh.position.x = THREE.MathUtils.lerp(f.start.x, targetX, t);
      f.mesh.position.z = THREE.MathUtils.lerp(f.start.z, targetZ, t);
      f.mesh.position.y = THREE.MathUtils.lerp(f.start.y, targetY, t) + Math.sin(t * Math.PI) * 0.65;
      f.mesh.rotation.y += dt * 7;
      f.mesh.scale.setScalar(1 - t * 0.35);

      if (t >= 1) {
        this.scene.remove(f.mesh);
        this.flyingItems.splice(i, 1);
      }
    }
  }

  private updateVillagerIdle(elapsed: number, dt: number): void {
    if (!this.currentVillagerMesh) return;
    if (this.villagerCelebrateTime > 0) {
      this.villagerCelebrateTime = Math.max(0, this.villagerCelebrateTime - dt);
      const hop = Math.sin(this.villagerCelebrateTime * 18) * 0.14;
      this.currentVillagerMesh.position.y = Math.max(0, hop);
    } else {
      this.currentVillagerMesh.position.y = Math.sin(elapsed * 2.4) * 0.015;
    }
  }

  private updateCamera(dt: number): void {
    if (this.phase === 'menu') {
      this.menuOrbitAngle += dt * 0.16;
      const radius = 10.6;
      _camDesired.set(
        Math.sin(this.menuOrbitAngle) * radius * 0.72,
        6.1,
        Math.cos(this.menuOrbitAngle) * radius * 0.52 + 4.4,
      );
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camDesired.x, 3, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camDesired.y, 3, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camDesired.z, 3, dt);
      _camLook.set(0, 1.1, -0.8);
      this.camera.lookAt(_camLook);
      return;
    }

    const cfg = CAMERA_OFFSETS[this.cameraPreset];
    _camDesired.set(
      THREE.MathUtils.clamp(this.playerPos.x * 0.85, -4.6, 4.6) + cfg.offset.x,
      cfg.offset.y,
      this.playerPos.z + cfg.offset.z,
    );

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camDesired.x, 6.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camDesired.y, 6.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camDesired.z, 6.5, dt);

    _camLook.set(this.playerPos.x * 0.9, cfg.lookY, this.playerPos.z - 0.6);
    this.camera.lookAt(_camLook);
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    this.updatePlayer(dt);
    this.updateBeaconsAndProximity(elapsed, dt);
    this.updateFlyingItems(dt);
    this.updateVillagerIdle(elapsed, dt);
    this.updateCamera(dt);

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.textures.dispose();
    this.envRT.dispose();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

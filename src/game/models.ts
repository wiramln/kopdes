import * as THREE from 'three';
import { StoreTexturePack } from './textures';
import { ProductDef, ProductId, VillagerProfile } from './types';

export interface PlayerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  basketItemsGroup: THREE.Group;
}

export interface ShelfRig {
  product: ProductDef;
  group: THREE.Group;
  beaconMesh: THREE.Mesh;
  beaconMaterial: THREE.MeshBasicMaterial;
  interactPoint: THREE.Vector3;
  hitbox: THREE.Mesh;
}

export interface CashierRig {
  group: THREE.Group;
  beaconMesh: THREE.Mesh;
  beaconMaterial: THREE.MeshBasicMaterial;
  interactPoint: THREE.Vector3;
  hitbox: THREE.Mesh;
  villagerAnchor: THREE.Group;
}

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Creates a recognizable multi-part 3D miniature product mesh pivoted at bottom-center (y = 0).
 */
export function createProductMesh(productId: ProductId, scale = 1): THREE.Group {
  const g = new THREE.Group();

  switch (productId) {
    case 'beras': {
      // Woven 5kg rice sack: sack body + green Kopdes label + pinched neck
      const sackMat = new THREE.MeshStandardMaterial({ color: 0xf4efe3, roughness: 0.85, metalness: 0.0 });
      const labelMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55, metalness: 0.05 });
      const tieMat = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.7, metalness: 0.0 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.16), sackMat);
      body.position.y = 0.17;
      body.castShadow = true;

      const label = new THREE.Mesh(new THREE.BoxGeometry(0.285, 0.12, 0.166), labelMat);
      label.position.y = 0.18;

      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.1), tieMat);
      neck.position.y = 0.355;

      g.add(body, label, neck);
      break;
    }

    case 'minyak': {
      // 2L Cooking oil jerrycan: translucent golden body + handle + red cap
      const jugMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.28, metalness: 0.08 });
      const labelMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.55, metalness: 0.0 });
      const capMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.05 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.14), jugMat);
      body.position.y = 0.14;
      body.castShadow = true;

      const label = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.146), labelMat);
      label.position.y = 0.14;

      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.036, 0.055, 10), capMat);
      spout.position.set(-0.045, 0.305, 0);

      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.035), jugMat);
      handle.position.set(0.06, 0.25, 0);

      g.add(body, label, spout, handle);
      break;
    }

    case 'gula': {
      // 1kg sugar pouch with blue band and crimped ends
      const bagMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.52, metalness: 0.02 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42, metalness: 0.08 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.12), bagMat);
      body.position.y = 0.12;
      body.castShadow = true;

      const band = new THREE.Mesh(new THREE.BoxGeometry(0.206, 0.09, 0.126), bandMat);
      band.position.y = 0.13;

      const crimp = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.02, 0.04), bandMat);
      crimp.position.y = 0.25;

      g.add(body, band, crimp);
      break;
    }

    case 'telur': {
      // Egg pulp tray with 6 visible oval eggs
      const trayMat = new THREE.MeshStandardMaterial({ color: 0xc2a882, roughness: 0.92, metalness: 0.0 });
      const eggMat = new THREE.MeshStandardMaterial({ color: 0xd9a06c, roughness: 0.45, metalness: 0.02 });

      const tray = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.22), trayMat);
      tray.position.y = 0.03;
      tray.castShadow = true;
      g.add(tray);

      const eggGeo = new THREE.SphereGeometry(0.038, 10, 8);
      eggGeo.scale(1, 1.32, 1);
      for (let ix = -1; ix <= 1; ix++) {
        for (let iz = -0.5; iz <= 0.5; iz += 1) {
          const egg = new THREE.Mesh(eggGeo, eggMat);
          egg.position.set(ix * 0.09, 0.075, iz * 0.095);
          g.add(egg);
        }
      }
      break;
    }

    case 'kopi': {
      // Standing UMKM village coffee pouch
      const pouchMat = new THREE.MeshStandardMaterial({ color: 0x452719, roughness: 0.65, metalness: 0.05 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.45 });
      const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.72, metalness: 0.0 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.27, 0.1), pouchMat);
      body.position.y = 0.135;
      body.castShadow = true;

      const sticker = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.106), creamMat);
      sticker.position.y = 0.14;

      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.184, 0.035, 0.104), goldMat);
      trim.position.y = 0.235;

      g.add(body, sticker, trim);
      break;
    }

    case 'keripik': {
      // Bright yellow-red UMKM cassava chips pack
      const packMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.15 });
      const redMat = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.45, metalness: 0.08 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.27, 0.11), packMat);
      body.position.y = 0.135;
      body.castShadow = true;

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.226, 0.095, 0.115), redMat);
      stripe.position.y = 0.15;

      const topSeal = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.025, 0.025), redMat);
      topSeal.position.y = 0.28;

      g.add(body, stripe, topSeal);
      break;
    }

    case 'madu': {
      // Forest honey glass-like amber jar + wooden lid
      const jarMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.18,
        metalness: 0.12,
      });
      const lidMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75, metalness: 0.0 });
      const labelMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.6, metalness: 0.0 });

      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.23, 14), jarMat);
      jar.position.y = 0.115;
      jar.castShadow = true;

      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.091, 0.092, 0.09, 14), labelMat);
      label.position.y = 0.115;

      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.045, 14), lidMat);
      lid.position.y = 0.25;

      g.add(jar, label, lid);
      break;
    }

    case 'pupuk': {
      // Organic fertilizer 5kg green sack
      const sackMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85, metalness: 0.0 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xa3e635, roughness: 0.5, metalness: 0.05 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.34, 0.16), sackMat);
      body.position.y = 0.17;
      body.castShadow = true;

      const band = new THREE.Mesh(new THREE.BoxGeometry(0.305, 0.1, 0.166), bandMat);
      band.position.y = 0.18;

      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.06), bandMat);
      seam.position.y = 0.35;

      g.add(body, band, seam);
      break;
    }
  }

  g.scale.setScalar(scale);
  return g;
}

export function createPlayerModel(contactShadowTex: THREE.CanvasTexture): PlayerRig {
  const root = new THREE.Group();

  // Ground contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdca57c, roughness: 0.72, metalness: 0.0 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.68, metalness: 0.0 });
  const vestMat = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.55, metalness: 0.05 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78, metalness: 0.0 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45, metalness: 0.1 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1916, roughness: 0.85, metalness: 0.0 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.65 });

  // Legs pivoted at hips (y = 0.62)
  const makeLeg = (xOffset: number) => {
    const leg = new THREE.Group();
    leg.position.set(xOffset, 0.62, 0);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.19), pantsMat);
    thigh.position.y = -0.26;
    thigh.castShadow = true;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.28), shoeMat);
    shoe.position.set(0, -0.56, 0.045);
    shoe.castShadow = true;
    leg.add(thigh, shoe);
    return leg;
  };

  const leftLeg = makeLeg(-0.13);
  const rightLeg = makeLeg(0.13);
  bodyGroup.add(leftLeg, rightLeg);

  // Torso (white shirt + Kopdes Merah Putih vest)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.62, 0.28), shirtMat);
  torso.position.y = 0.94;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.54, 0.305), vestMat);
  vest.position.y = 0.93;
  vest.castShadow = true;
  bodyGroup.add(vest);

  // White front collar & gold Kopdes chest badge
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.315), shirtMat);
  collar.position.set(0, 1.15, 0.01);
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.055, 0.02), goldMat);
  badge.position.set(0.13, 1.07, 0.16);
  bodyGroup.add(collar, badge);

  // Head + Kopdes cap
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), skinMat);
  head.position.y = 1.46;
  head.castShadow = true;
  bodyGroup.add(head);

  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.22, 0.18), hairMat);
  hairBack.position.set(0, 1.48, -0.1);
  bodyGroup.add(hairBack);

  const capDome = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.13, 0.39), vestMat);
  capDome.position.set(0, 1.65, 0);
  capDome.castShadow = true;
  const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.18), shirtMat);
  capVisor.position.set(0, 1.59, 0.24);
  bodyGroup.add(capDome, capVisor);

  // Eyes
  const eyeGeo = new THREE.BoxGeometry(0.045, 0.055, 0.02);
  const leftEye = new THREE.Mesh(eyeGeo, hairMat);
  leftEye.position.set(-0.085, 1.47, 0.185);
  const rightEye = new THREE.Mesh(eyeGeo, hairMat);
  rightEye.position.set(0.085, 1.47, 0.185);
  bodyGroup.add(leftEye, rightEye);

  // Arms angled forward holding the Kopdes shopping basket
  const makeArm = (xOffset: number) => {
    const arm = new THREE.Group();
    arm.position.set(xOffset, 1.16, 0.02);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.24, 0.16), shirtMat);
    sleeve.position.y = -0.11;
    sleeve.castShadow = true;
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.28, 0.13), skinMat);
    forearm.position.set(0, -0.26, 0.16);
    forearm.rotation.x = -Math.PI / 2.6;
    forearm.castShadow = true;
    arm.add(sleeve, forearm);
    return arm;
  };

  const leftArm = makeArm(-0.33);
  const rightArm = makeArm(0.33);
  bodyGroup.add(leftArm, rightArm);

  // Shopping basket held in front (+Z is forward for player)
  const basketHolder = new THREE.Group();
  basketHolder.position.set(0, 0.82, 0.44);
  bodyGroup.add(basketHolder);

  const basketRedMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.48, metalness: 0.08 });
  const basketTrimMat = new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.4, metalness: 0.15 });

  const basketBase = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.44), basketRedMat);
  basketBase.castShadow = true;
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, 0.04), basketRedMat);
  frontWall.position.set(0, 0.13, 0.2);
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, 0.04), basketRedMat);
  backWall.position.set(0, 0.13, -0.2);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.44), basketRedMat);
  leftWall.position.set(-0.29, 0.13, 0);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.44), basketRedMat);
  rightWall.position.set(0.29, 0.13, 0);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.035, 0.47), basketTrimMat);
  rim.position.set(0, 0.265, 0);

  basketHolder.add(basketBase, frontWall, backWall, leftWall, rightWall, rim);

  const basketItemsGroup = new THREE.Group();
  basketItemsGroup.position.set(0, 0.045, 0);
  basketHolder.add(basketItemsGroup);

  return {
    root,
    bodyGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    basketItemsGroup,
  };
}

export function createVillagerModel(
  profile: VillagerProfile,
  contactShadowTex: THREE.CanvasTexture,
): THREE.Group {
  const g = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.05),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow);

  const skinMat = new THREE.MeshStandardMaterial({ color: profile.skinColor, roughness: 0.72, metalness: 0.0 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: profile.shirtColor, roughness: 0.65, metalness: 0.04 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: profile.pantsColor, roughness: 0.8, metalness: 0.0 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5, metalness: 0.05 });
  const headMat = new THREE.MeshStandardMaterial({ color: profile.headwearColor, roughness: 0.6, metalness: 0.04 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });

  // Legs
  for (const x of [-0.12, 0.12]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.54, 0.18), pantsMat);
    leg.position.set(x, 0.35, 0);
    leg.castShadow = true;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.25), shoeMat);
    shoe.position.set(x, 0.05, 0.03);
    g.add(leg, shoe);
  }

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.28), shirtMat);
  torso.position.y = 0.93;
  torso.castShadow = true;
  g.add(torso);

  // Arms
  for (const x of [-0.31, 0.31]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.15), shirtMat);
    arm.position.set(x, 0.95, 0.03);
    arm.castShadow = true;
    g.add(arm);
  }

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), skinMat);
  head.position.y = 1.44;
  head.castShadow = true;
  g.add(head);

  const lEye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.02), eyeMat);
  lEye.position.set(-0.08, 1.45, 0.18);
  const rEye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.02), eyeMat);
  rEye.position.set(0.08, 1.45, 0.18);
  g.add(lEye, rEye);

  // Headwear variations
  if (profile.headwear === 'peci') {
    const peci = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.15, 0.38), headMat);
    peci.position.set(0, 1.66, 0);
    peci.castShadow = true;
    g.add(peci);
  } else if (profile.headwear === 'hijab') {
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.41, 0.36), headMat);
    hood.position.set(0, 1.44, -0.04);
    const drape = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.32), headMat);
    drape.position.set(0, 1.18, 0);
    g.add(hood, drape);
  } else if (profile.headwear === 'cap') {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.12, 0.37), headMat);
    cap.position.set(0, 1.63, 0);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.16), headMat);
    brim.position.set(0, 1.58, 0.22);
    g.add(cap, brim);
  }

  return g;
}

export function createShelfUnit(
  product: ProductDef,
  textures: StoreTexturePack,
): { rig: ShelfRig; collider: AABB } {
  const group = new THREE.Group();
  group.position.set(...product.shelfPosition);
  group.rotation.y = product.shelfRotationY;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.38, metalness: 0.55 });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodGrain,
    roughness: 0.72,
    metalness: 0.02,
  });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.42, metalness: 0.1 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e6, roughness: 0.85, metalness: 0.0 });

  const width = 2.0;
  const depth = 0.84;
  const height = 1.9;

  // Base plinth
  const base = new THREE.Mesh(new THREE.BoxGeometry(width, 0.14, depth), frameMat);
  base.position.y = 0.07;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Back panel
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(width - 0.08, height - 0.15, 0.05), backMat);
  backPanel.position.set(0, height / 2 + 0.04, -depth / 2 + 0.04);
  backPanel.castShadow = true;
  backPanel.receiveShadow = true;
  group.add(backPanel);

  // 4 Steel corner uprights
  const postGeo = new THREE.BoxGeometry(0.06, height, 0.06);
  const postPositions: [number, number][] = [
    [-width / 2 + 0.04, -depth / 2 + 0.04],
    [width / 2 - 0.04, -depth / 2 + 0.04],
    [-width / 2 + 0.04, depth / 2 - 0.04],
    [width / 2 - 0.04, depth / 2 - 0.04],
  ];
  for (const [px, pz] of postPositions) {
    const post = new THREE.Mesh(postGeo, frameMat);
    post.position.set(px, height / 2, pz);
    post.castShadow = true;
    group.add(post);
  }

  // 3 Wooden decks + red price rails + populated 3D products
  const deckHeights = [0.22, 0.76, 1.3];
  for (const dy of deckHeights) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, 0.055, depth - 0.06), woodMat);
    deck.position.y = dy;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, 0.042, 0.025), railMat);
    rail.position.set(0, dy, depth / 2 - 0.015);
    group.add(rail);

    // Populate 4 products per shelf deck
    for (let i = 0; i < 4; i++) {
      const item = createProductMesh(product.id, 1.0);
      const x = -0.66 + i * 0.44;
      const z = 0.08 + (i % 2 === 0 ? 0.02 : -0.02);
      item.position.set(x, dy + 0.028, z);
      item.rotation.y = (i - 1.5) * 0.06;
      group.add(item);
    }
  }

  // Overhead product category signboard
  const signTex = textures.shelfSigns.get(product.id);
  const signBack = new THREE.Mesh(new THREE.BoxGeometry(width, 0.56, 0.08), frameMat);
  signBack.position.set(0, height + 0.28, 0);
  signBack.castShadow = true;
  group.add(signBack);

  const signFaceMat = new THREE.MeshStandardMaterial({
    map: signTex,
    roughness: 0.45,
    metalness: 0.04,
  });
  const signFront = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.08, 0.48), signFaceMat);
  signFront.position.set(0, height + 0.28, 0.043);
  group.add(signFront);

  // Also put sign on back side so readable from all angles
  const signRear = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.08, 0.48), signFaceMat);
  signRear.position.set(0, height + 0.28, -0.043);
  signRear.rotation.y = Math.PI;
  group.add(signRear);

  // Floor highlight beacon ring in front of the shelf (+Z front access side)
  const beaconMaterial = new THREE.MeshBasicMaterial({
    map: textures.floorRing,
    color: 0xd97706,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const beaconMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.55), beaconMaterial);
  beaconMesh.rotation.x = -Math.PI / 2;
  beaconMesh.position.set(0, 0.03, depth / 2 + 0.72);
  group.add(beaconMesh);

  // Invisible simplified raycast proxy box
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.25, height + 0.6, depth + 0.35),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitbox.position.set(0, (height + 0.5) / 2, 0);
  hitbox.userData = { interactType: 'shelf', productId: product.id };
  group.add(hitbox);

  const interactPoint = new THREE.Vector3(
    product.shelfPosition[0],
    0,
    product.shelfPosition[2] + depth / 2 + 0.72,
  );

  const collider: AABB = {
    minX: product.shelfPosition[0] - width / 2 - 0.08,
    maxX: product.shelfPosition[0] + width / 2 + 0.08,
    minZ: product.shelfPosition[2] - depth / 2 - 0.08,
    maxZ: product.shelfPosition[2] + depth / 2 + 0.08,
  };

  return {
    rig: { product, group, beaconMesh, beaconMaterial, interactPoint, hitbox },
    collider,
  };
}

export function createCashierDesk(textures: StoreTexturePack): {
  rig: CashierRig;
  colliders: AABB[];
} {
  const group = new THREE.Group();
  const basePos = new THREE.Vector3(3.1, 0, 4.15);
  group.position.copy(basePos);

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f4, roughness: 0.55, metalness: 0.05 });
  const redTrimMat = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.42, metalness: 0.1 });
  const woodTopMat = new THREE.MeshStandardMaterial({
    map: textures.woodGrain,
    roughness: 0.58,
    metalness: 0.04,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.32, metalness: 0.65 });
  const screenMat = new THREE.MeshStandardMaterial({
    map: textures.posScreen,
    emissive: 0x223344,
    emissiveIntensity: 0.4,
    roughness: 0.25,
    metalness: 0.1,
  });

  // Main horizontal counter
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.92, 0.92), bodyMat);
  mainBody.position.set(0, 0.46, 0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  group.add(mainBody);

  // Red Kopdes fascia stripe on front & back
  const redStripe = new THREE.Mesh(new THREE.BoxGeometry(3.24, 0.24, 0.95), redTrimMat);
  redStripe.position.set(0, 0.54, 0);
  group.add(redStripe);

  // Wooden countertop
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.32, 0.08, 1.02), woodTopMat);
  counterTop.position.set(0, 0.96, 0);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  group.add(counterTop);

  // Side L-wing counter
  const wingBody = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.92, 1.35), bodyMat);
  wingBody.position.set(1.18, 0.46, -0.92);
  wingBody.castShadow = true;
  wingBody.receiveShadow = true;
  group.add(wingBody);

  const wingTop = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.08, 1.42), woodTopMat);
  wingTop.position.set(1.18, 0.96, -0.92);
  wingTop.castShadow = true;
  group.add(wingTop);

  // POS Monitor + stand
  const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.26, 12), darkMetalMat);
  standPole.position.set(-0.55, 1.12, 0.02);
  const monitorHousing = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.4, 0.07), darkMetalMat);
  monitorHousing.position.set(-0.55, 1.38, 0.02);
  monitorHousing.rotation.x = -0.15;
  monitorHousing.castShadow = true;
  const monitorFace = new THREE.Mesh(new THREE.PlaneGeometry(0.49, 0.33), screenMat);
  monitorFace.position.set(-0.55, 1.38, -0.02);
  monitorFace.rotation.y = Math.PI;
  monitorFace.rotation.x = 0.15;
  group.add(standPole, monitorHousing, monitorFace);

  // Cash drawer under POS
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.11, 0.46), darkMetalMat);
  drawer.position.set(-0.55, 1.055, 0.02);
  group.add(drawer);

  // Standing barcode scanner with red scanning window
  const scanBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), darkMetalMat);
  scanBase.position.set(0.18, 1.02, -0.05);
  const scanNeck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.1), darkMetalMat);
  scanNeck.position.set(0.18, 1.15, -0.05);
  const scanLaser = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.08, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    }),
  );
  scanLaser.position.set(0.18, 1.19, -0.105);
  group.add(scanBase, scanNeck, scanLaser);

  // Paper shopping bags stack on counter
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.85, metalness: 0.0 });
  for (let i = 0; i < 3; i++) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.12), bagMat);
    bag.position.set(1.18, 1.15, -0.7 - i * 0.16);
    bag.castShadow = true;
    group.add(bag);
  }

  // Floor beacon ring on the player's side of the cashier desk (-Z side)
  const beaconMaterial = new THREE.MeshBasicMaterial({
    map: textures.floorRing,
    color: 0x15803d,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const beaconMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), beaconMaterial);
  beaconMesh.rotation.x = -Math.PI / 2;
  beaconMesh.position.set(-0.25, 0.03, -1.15);
  group.add(beaconMesh);

  // Villager waiting anchor on customer side (+Z side facing -Z toward counter)
  const villagerAnchor = new THREE.Group();
  villagerAnchor.position.set(-0.15, 0, 1.12);
  villagerAnchor.rotation.y = Math.PI;
  group.add(villagerAnchor);

  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.7, 1.8),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitbox.position.set(0.1, 0.85, -0.1);
  hitbox.userData = { interactType: 'cashier' };
  group.add(hitbox);

  const interactPoint = new THREE.Vector3(basePos.x - 0.25, 0, basePos.z - 1.15);

  const colliders: AABB[] = [
    {
      minX: basePos.x - 1.72,
      maxX: basePos.x + 1.72,
      minZ: basePos.z - 0.56,
      maxZ: basePos.z + 1.45,
    },
    {
      minX: basePos.x + 0.68,
      maxX: basePos.x + 1.72,
      minZ: basePos.z - 1.68,
      maxZ: basePos.z - 0.45,
    },
  ];

  return {
    rig: { group, beaconMesh, beaconMaterial, interactPoint, hitbox, villagerAnchor },
    colliders,
  };
}

export function createReturnCrate(textures: StoreTexturePack): {
  group: THREE.Group;
  interactPoint: THREE.Vector3;
  collider: AABB;
  hitbox: THREE.Mesh;
} {
  const pos = new THREE.Vector3(-4.8, 0, 4.3);
  const group = new THREE.Group();
  group.position.copy(pos);

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.woodGrain,
    roughness: 0.78,
    metalness: 0.02,
  });
  const signMat = new THREE.MeshStandardMaterial({
    map: textures.returnSign,
    roughness: 0.55,
    metalness: 0.02,
  });

  const crate = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.65, 0.8), woodMat);
  crate.position.y = 0.325;
  crate.castShadow = true;
  crate.receiveShadow = true;
  group.add(crate);

  const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.25, 0.07), woodMat);
  post.position.set(0, 0.625, 0.36);
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.46, 0.06), woodMat);
  signBoard.position.set(0, 1.28, 0.36);
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.42), signMat);
  signFace.position.set(0, 1.28, 0.325);
  signFace.rotation.y = Math.PI;
  group.add(post, signBoard, signFace);

  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 1.5, 1.0),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitbox.position.set(0, 0.75, 0);
  hitbox.userData = { interactType: 'return' };
  group.add(hitbox);

  return {
    group,
    interactPoint: new THREE.Vector3(pos.x, 0, pos.z - 0.95),
    collider: {
      minX: pos.x - 0.66,
      maxX: pos.x + 0.66,
      minZ: pos.z - 0.48,
      maxZ: pos.z + 0.48,
    },
    hitbox,
  };
}

export function createKopdesStore(textures: StoreTexturePack): THREE.Group {
  const store = new THREE.Group();

  // Floor (14.4m x 13.6m)
  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.terrazzoFloor,
    roughness: 0.68,
    metalness: 0.03,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 13.6), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  store.add(floor);

  // Welcome mat near entrance (front-left)
  const matMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 1.15),
    new THREE.MeshStandardMaterial({
      map: textures.welcomeMat,
      roughness: 0.9,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  matMesh.rotation.x = -Math.PI / 2;
  matMesh.position.set(-1.5, 0.022, 5.55);
  store.add(matMesh);

  // Store wall materials
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfaf7f0, roughness: 0.85, metalness: 0.0 });
  const redBandMat = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.52, metalness: 0.05 });
  const woodTrimMat = new THREE.MeshStandardMaterial({
    map: textures.woodGrain,
    roughness: 0.66,
    metalness: 0.02,
  });

  // Back wall (z = -6.7)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(14.6, 4.4, 0.25), wallMat);
  backWall.position.set(0, 2.2, -6.7);
  backWall.receiveShadow = true;
  store.add(backWall);

  // Merah Putih wall stripe & wooden wainscot
  const backWainscot = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.95, 0.06), woodTrimMat);
  backWainscot.position.set(0, 0.475, -6.55);
  const backRedStripe = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.16, 0.07), redBandMat);
  backRedStripe.position.set(0, 0.98, -6.54);
  store.add(backWainscot, backRedStripe);

  // Main Kopdes Merah Putih Banner on back wall
  const bannerFrame = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.95, 0.12), redBandMat);
  bannerFrame.position.set(0, 2.85, -6.52);
  bannerFrame.castShadow = true;
  const bannerFace = new THREE.Mesh(
    new THREE.PlaneGeometry(7.35, 1.78),
    new THREE.MeshStandardMaterial({
      map: textures.wallBanner,
      roughness: 0.42,
      metalness: 0.05,
    }),
  );
  bannerFace.position.set(0, 2.85, -6.45);
  store.add(bannerFrame, bannerFace);

  // Left wall (x = -7.2) with large panoramic window frame
  const leftLowWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.05, 13.6), wallMat);
  leftLowWall.position.set(-7.2, 0.525, 0);
  leftLowWall.receiveShadow = true;
  const leftTopBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 13.6), wallMat);
  leftTopBeam.position.set(-7.2, 4.02, 0);
  const leftRedTrim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 13.6), redBandMat);
  leftRedTrim.position.set(-7.18, 1.08, 0);
  store.add(leftLowWall, leftTopBeam, leftRedTrim);

  // Left vertical wooden mullions
  for (const zPos of [-6.5, -2.2, 2.2, 6.5]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.6, 0.24), woodTrimMat);
    pillar.position.set(-7.18, 2.0, zPos);
    pillar.castShadow = true;
    store.add(pillar);
  }

  // Right wall (x = 7.2) with matching village windows
  const rightLowWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.05, 13.6), wallMat);
  rightLowWall.position.set(7.2, 0.525, 0);
  rightLowWall.receiveShadow = true;
  const rightTopBeam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 13.6), wallMat);
  rightTopBeam.position.set(7.2, 4.02, 0);
  const rightRedTrim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 13.6), redBandMat);
  rightRedTrim.position.set(7.18, 1.08, 0);
  store.add(rightLowWall, rightTopBeam, rightRedTrim);

  for (const zPos of [-6.5, -2.2, 2.2, 6.5]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.6, 0.24), woodTrimMat);
    pillar.position.set(7.18, 2.0, zPos);
    pillar.castShadow = true;
    store.add(pillar);
  }

  // Subtle translucent window glass panes (safe for software WebGL, no transmission pass)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    transparent: true,
    opacity: 0.18,
    roughness: 0.1,
    metalness: 0.1,
    depthWrite: false,
  });
  const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(13.0, 2.55), glassMat);
  leftGlass.position.set(-7.18, 2.38, 0);
  leftGlass.rotation.y = Math.PI / 2;
  const rightGlass = new THREE.Mesh(new THREE.PlaneGeometry(13.0, 2.55), glassMat);
  rightGlass.position.set(7.18, 2.38, 0);
  rightGlass.rotation.y = -Math.PI / 2;
  store.add(leftGlass, rightGlass);

  // Hanging warm industrial-village ceiling lamps (visible from higher angles)
  const lampCordMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.7 });
  const lampShadeMat = new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.35, metalness: 0.25 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    emissive: 0xfde68a,
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  const lampCoords: [number, number][] = [
    [-3.2, -2.1],
    [3.2, -2.1],
    [-3.2, 2.4],
    [3.2, 2.4],
  ];
  for (const [lx, lz] of lampCoords) {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 4.35, lz);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.75, 6), lampCordMat);
    cord.position.y = -0.375;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 14, 1, true), lampShadeMat);
    shade.position.y = -0.82;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), bulbMat);
    bulb.position.y = -0.88;
    lamp.add(cord, shade, bulb);
    store.add(lamp);
  }

  // Outdoor Indonesian village lawn & stylized multi-part trees outside the windows
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.92, metalness: 0.0 });
  const outerGround = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), grassMat);
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.05;
  store.add(outerGround);

  // Outdoor stone veranda path around the cooperative
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xd6cfc2, roughness: 0.88, metalness: 0.0 });
  const veranda = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.06, 17.2), pathMat);
  veranda.position.set(0, -0.03, 0.5);
  store.add(veranda);

  // Stylized multi-part village trees visible outside windows
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x784826, roughness: 0.88, metalness: 0.0 });
  const foliageA = new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.78, metalness: 0.0 });
  const foliageB = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.82, metalness: 0.0 });

  const treePositions: [number, number, number][] = [
    [-11.5, 0, -5.5],
    [-10.8, 0, 1.2],
    [-12.2, 0, 6.2],
    [11.4, 0, -4.8],
    [10.9, 0, 2.0],
    [12.0, 0, 6.5],
    [-5.0, 0, -11.5],
    [4.5, 0, -11.2],
  ];
  treePositions.forEach(([tx, ty, tz], idx) => {
    const tree = new THREE.Group();
    tree.position.set(tx, ty, tz);
    const scale = 0.88 + (idx % 3) * 0.16;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.2, 8), trunkMat);
    trunk.position.y = 1.1;
    const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.35, 1), idx % 2 === 0 ? foliageA : foliageB);
    crown1.position.set(0, 2.7, 0);
    const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), idx % 2 === 0 ? foliageB : foliageA);
    crown2.position.set(0.55, 3.25, 0.35);
    const crown3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), foliageA);
    crown3.position.set(-0.5, 2.95, -0.35);
    tree.add(trunk, crown1, crown2, crown3);
    tree.scale.setScalar(scale);
    store.add(tree);
  });

  // Low wooden village fence perimeter outside windows
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x9a6b3e, roughness: 0.8, metalness: 0.0 });
  for (const side of [-1, 1]) {
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 18), fenceMat);
    railTop.position.set(side * 9.8, 0.85, 0);
    const railMid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 18), fenceMat);
    railMid.position.set(side * 9.8, 0.45, 0);
    store.add(railTop, railMid);
    for (let fz = -8; fz <= 8; fz += 2.6) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), fenceMat);
      post.position.set(side * 9.8, 0.55, fz);
      store.add(post);
    }
  }

  return store;
}

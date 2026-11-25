import * as THREE from 'three';
import { formatRupiah } from './catalog';
import { ProductDef } from './types';

export interface StoreTexturePack {
  terrazzoFloor: THREE.CanvasTexture;
  woodGrain: THREE.CanvasTexture;
  wallBanner: THREE.CanvasTexture;
  posScreen: THREE.CanvasTexture;
  welcomeMat: THREE.CanvasTexture;
  returnSign: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  floorRing: THREE.CanvasTexture;
  shelfSigns: Map<string, THREE.CanvasTexture>;
  dispose: () => void;
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(maxAnisotropy, 8);
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function createTerrazzoCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#EFE9DD';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle terrazzo flecks
  const flecks = ['#DCD2C0', '#C7B8A1', '#E5D9C5', '#B89E82', '#FFFFFF'];
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = flecks[Math.floor(rand() * flecks.length)];
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 1.5 + rand() * 3.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tile grout lines (2x2 grid per repeat)
  ctx.strokeStyle = 'rgba(140, 122, 98, 0.28)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 252);
  ctx.strokeRect(258, 2, 252, 252);
  ctx.strokeRect(2, 258, 252, 252);
  ctx.strokeRect(258, 258, 252, 252);

  return canvas;
}

function createWoodCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#B88250';
  ctx.fillRect(0, 0, 512, 256);

  for (let y = 0; y < 256; y += 3) {
    const shade = Math.sin(y * 0.14) * 10 + Math.cos(y * 0.04) * 8;
    ctx.fillStyle = `rgb(${Math.round(180 + shade)}, ${Math.round(126 + shade * 0.8)}, ${Math.round(76 + shade * 0.5)})`;
    ctx.fillRect(0, y, 512, 3);
  }

  ctx.strokeStyle = 'rgba(92, 56, 28, 0.22)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    const y = (i / 18) * 256;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + 6, 340, y - 6, 512, y);
    ctx.stroke();
  }

  return canvas;
}

function createWallBannerCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // White backing with crisp Kopdes Merah Putih red header
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 1024, 256);

  ctx.fillStyle = '#C81E1E';
  ctx.fillRect(0, 0, 1024, 152);

  // Subtle gold hairline separator
  ctx.fillStyle = '#D97706';
  ctx.fillRect(0, 152, 1024, 8);

  // Emblem circle on left
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(106, 76, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#C81E1E';
  ctx.beginPath();
  ctx.arc(106, 76, 35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KD', 106, 78);

  // Title text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.font = '700 54px sans-serif';
  ctx.fillText('KOPERASI DESA MERAH PUTIH', 178, 80);

  // Subtitle on white bottom band
  ctx.fillStyle = '#292524';
  ctx.font = '600 30px sans-serif';
  ctx.fillText('SEMBAKO HARIAN  ·  PRODUK UMKM DESA  ·  SARANA TANI', 178, 208);

  // Border frame
  ctx.strokeStyle = '#991B1B';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 1014, 246);

  return canvas;
}

function createShelfSignCanvas(product: ProductDef): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FAF8F4';
  ctx.fillRect(0, 0, 512, 160);

  // Category top band
  const bandColor =
    product.category === 'Sembako'
      ? '#C81E1E'
      : product.category === 'UMKM Desa'
        ? '#B45309'
        : '#15803D';

  ctx.fillStyle = bandColor;
  ctx.fillRect(0, 0, 512, 48);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(product.category.toUpperCase(), 256, 25);

  ctx.fillStyle = '#1C1917';
  ctx.font = '700 36px sans-serif';
  ctx.fillText(product.shortName, 256, 86);

  ctx.fillStyle = '#991B1B';
  ctx.font = '700 28px monospace';
  ctx.fillText(formatRupiah(product.price), 256, 132);

  ctx.strokeStyle = '#D6D3D1';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 506, 154);

  return canvas;
}

function createPosScreenCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 256, 192);

  ctx.fillStyle = '#C81E1E';
  ctx.fillRect(0, 0, 256, 36);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('KASIR KOPDES', 14, 24);

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(14, 48, 228, 72);

  ctx.fillStyle = '#4ADE80';
  ctx.font = '700 24px monospace';
  ctx.fillText('SIAP PINDAI', 26, 92);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 14px sans-serif';
  ctx.fillText('MERAH PUTIH POS', 14, 152);
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(14, 164, 120, 12);

  return canvas;
}

function createWelcomeMatCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#991B1B';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#F5F0E6';
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, 476, 220);

  ctx.fillStyle = '#FAF8F4';
  ctx.font = '700 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SELAMAT DATANG', 256, 112);

  ctx.font = '600 24px sans-serif';
  ctx.fillStyle = '#FDE68A';
  ctx.fillText('KOPDES MERAH PUTIH', 256, 168);

  return canvas;
}

function createReturnSignCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FEF3C7';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 120);

  ctx.fillStyle = '#78350F';
  ctx.font = '700 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KEMBALIKAN', 128, 48);
  ctx.font = '600 22px sans-serif';
  ctx.fillText('BARANG (Q)', 128, 86);

  return canvas;
}

function createContactShadowCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(20, 14, 10, 0.45)');
  grad.addColorStop(0.55, 'rgba(20, 14, 10, 0.22)');
  grad.addColorStop(1, 'rgba(20, 14, 10, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

function createFloorRingCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Outer crisp ring
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(128, 128, 104, 0, Math.PI * 2);
  ctx.stroke();

  // Soft inner fill glow
  const grad = ctx.createRadialGradient(128, 128, 25, 128, 128, 104);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.18)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0.42)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 100, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

export function createStoreTexturePack(
  products: ProductDef[],
  maxAnisotropy: number,
): StoreTexturePack {
  const terrazzoFloor = finalizeTexture(createTerrazzoCanvas(), maxAnisotropy, 7, 7);
  const woodGrain = finalizeTexture(createWoodCanvas(), maxAnisotropy, 2, 1);
  const wallBanner = finalizeTexture(createWallBannerCanvas(), maxAnisotropy);
  const posScreen = finalizeTexture(createPosScreenCanvas(), maxAnisotropy);
  const welcomeMat = finalizeTexture(createWelcomeMatCanvas(), maxAnisotropy);
  const returnSign = finalizeTexture(createReturnSignCanvas(), maxAnisotropy);
  const contactShadow = finalizeTexture(createContactShadowCanvas(), maxAnisotropy);
  const floorRing = finalizeTexture(createFloorRingCanvas(), maxAnisotropy);

  const shelfSigns = new Map<string, THREE.CanvasTexture>();
  for (const prod of products) {
    shelfSigns.set(prod.id, finalizeTexture(createShelfSignCanvas(prod), maxAnisotropy));
  }

  return {
    terrazzoFloor,
    woodGrain,
    wallBanner,
    posScreen,
    welcomeMat,
    returnSign,
    contactShadow,
    floorRing,
    shelfSigns,
    dispose: () => {
      terrazzoFloor.dispose();
      woodGrain.dispose();
      wallBanner.dispose();
      posScreen.dispose();
      welcomeMat.dispose();
      returnSign.dispose();
      contactShadow.dispose();
      floorRing.dispose();
      shelfSigns.forEach((t) => t.dispose());
    },
  };
}

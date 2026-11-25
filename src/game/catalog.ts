import { ActiveOrder, OrderRequirement, ProductDef, ProductId, VillagerProfile } from './types';

export const BASKET_CAPACITY = 8;
export const INITIAL_SHIFT_SECONDS = 120;
export const ORDER_TIME_BONUS = 15;
export const PERFECT_MATH_BONUS_RP = 5000;

export const PRODUCTS: ProductDef[] = [
  {
    id: 'beras',
    name: 'Beras Desa 5kg',
    shortName: 'Beras 5kg',
    unit: 'karung',
    category: 'Sembako',
    price: 65000,
    primaryColor: '#F3EFE4',
    accentColor: '#15803D',
    shelfPosition: [-4.4, 0, -4.2],
    shelfRotationY: 0,
    aisleLabel: 'Rak A1 · Sembako',
  },
  {
    id: 'minyak',
    name: 'Minyak Goreng 2L',
    shortName: 'Minyak 2L',
    unit: 'jerigen',
    category: 'Sembako',
    price: 35000,
    primaryColor: '#EAB308',
    accentColor: '#B91C1C',
    shelfPosition: [-1.4, 0, -4.2],
    shelfRotationY: 0,
    aisleLabel: 'Rak A2 · Sembako',
  },
  {
    id: 'gula',
    name: 'Gula Pasir 1kg',
    shortName: 'Gula 1kg',
    unit: 'bungkus',
    category: 'Sembako',
    price: 18000,
    primaryColor: '#F8FAFC',
    accentColor: '#0284C7',
    shelfPosition: [1.6, 0, -4.2],
    shelfRotationY: 0,
    aisleLabel: 'Rak A3 · Sembako',
  },
  {
    id: 'telur',
    name: 'Telur Kampung',
    shortName: 'Telur Tray',
    unit: 'tray',
    category: 'Sembako',
    price: 32000,
    primaryColor: '#D6B98C',
    accentColor: '#92400E',
    shelfPosition: [4.6, 0, -4.2],
    shelfRotationY: 0,
    aisleLabel: 'Rak A4 · Sembako',
  },
  {
    id: 'kopi',
    name: 'Kopi Bubuk Desa',
    shortName: 'Kopi Desa',
    unit: 'pouch',
    category: 'UMKM Desa',
    price: 25000,
    primaryColor: '#4A2C1D',
    accentColor: '#D97706',
    shelfPosition: [-4.4, 0, 0.2],
    shelfRotationY: 0,
    aisleLabel: 'Rak B1 · UMKM',
  },
  {
    id: 'keripik',
    name: 'Keripik Singkong',
    shortName: 'Keripik UMKM',
    unit: 'bungkus',
    category: 'UMKM Desa',
    price: 15000,
    primaryColor: '#F59E0B',
    accentColor: '#C81E1E',
    shelfPosition: [-1.4, 0, 0.2],
    shelfRotationY: 0,
    aisleLabel: 'Rak B2 · UMKM',
  },
  {
    id: 'madu',
    name: 'Madu Hutan Desa',
    shortName: 'Madu Hutan',
    unit: 'toples',
    category: 'UMKM Desa',
    price: 50000,
    primaryColor: '#D97706',
    accentColor: '#78350F',
    shelfPosition: [1.6, 0, 0.2],
    shelfRotationY: 0,
    aisleLabel: 'Rak B3 · UMKM',
  },
  {
    id: 'pupuk',
    name: 'Pupuk Organik 5kg',
    shortName: 'Pupuk 5kg',
    unit: 'karung',
    category: 'Sarana Tani',
    price: 40000,
    primaryColor: '#166534',
    accentColor: '#A3E635',
    shelfPosition: [4.6, 0, 0.2],
    shelfRotationY: 0,
    aisleLabel: 'Rak B4 · Tani',
  },
];

export const PRODUCT_MAP: Record<ProductId, ProductDef> = PRODUCTS.reduce(
  (acc, prod) => {
    acc[prod.id] = prod;
    return acc;
  },
  {} as Record<ProductId, ProductDef>,
);

export const VILLAGERS: VillagerProfile[] = [
  {
    name: 'Ibu Sari',
    role: 'Anggota PKK RT 02',
    shirtColor: 0x0f766e,
    pantsColor: 0x334155,
    skinColor: 0xd9a176,
    headwear: 'hijab',
    headwearColor: 0xfef3c7,
  },
  {
    name: 'Pak Budi',
    role: 'Kelompok Tani Makmur',
    shirtColor: 0x1d4ed8,
    pantsColor: 0x1f2937,
    skinColor: 0xc68b5e,
    headwear: 'peci',
    headwearColor: 0x18181b,
  },
  {
    name: 'Mbak Rina',
    role: 'Pemilik Warung Kuliner',
    shirtColor: 0xbe123c,
    pantsColor: 0x3f3f46,
    skinColor: 0xe0ae86,
    headwear: 'hijab',
    headwearColor: 0xfde68a,
  },
  {
    name: 'Mas Agus',
    role: 'Karang Taruna Desa',
    shirtColor: 0x047857,
    pantsColor: 0x27272a,
    skinColor: 0xc98f62,
    headwear: 'cap',
    headwearColor: 0xb91c1c,
  },
  {
    name: 'Ibu Ratna',
    role: 'Warga Dusun Krajan',
    shirtColor: 0x7c2d12,
    pantsColor: 0x292524,
    skinColor: 0xd79f74,
    headwear: 'hijab',
    headwearColor: 0xe2e8f0,
  },
  {
    name: 'Pak Hendra',
    role: 'Peternak Mandiri',
    shirtColor: 0x4338ca,
    pantsColor: 0x1e293b,
    skinColor: 0xbe8358,
    headwear: 'peci',
    headwearColor: 0x1c1917,
  },
];

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function generateOrder(orderNumber: number): ActiveOrder {
  const villager = VILLAGERS[(orderNumber - 1) % VILLAGERS.length];

  // Progressive difficulty: early orders have 2-3 items, later orders 3-5 total units
  const distinctTypes =
    orderNumber <= 1 ? 2 : orderNumber <= 3 ? 3 : Math.min(4, 2 + Math.floor(Math.random() * 3));

  const shuffled = [...PRODUCTS].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, distinctTypes);

  let totalUnits = 0;
  const maxUnits = Math.min(BASKET_CAPACITY - 1, orderNumber <= 2 ? 3 : orderNumber <= 5 ? 5 : 6);

  const items: OrderRequirement[] = chosen.map((prod, idx) => {
    const remainingSlots = maxUnits - totalUnits - (chosen.length - 1 - idx);
    let qty = 1;
    if (remainingSlots >= 2 && orderNumber >= 2 && Math.random() < 0.45) {
      qty = 2;
    }
    totalUnits += qty;
    return { productId: prod.id, requiredQty: qty };
  });

  const totalExpectedPrice = items.reduce(
    (sum, req) => sum + PRODUCT_MAP[req.productId].price * req.requiredQty,
    0,
  );

  return {
    id: orderNumber,
    villager,
    items,
    totalExpectedPrice,
  };
}

export function generateTotalChoices(correctTotal: number): number[] {
  const deltas = [-15000, -10000, -5000, 5000, 10000, 15000, 20000];
  const candidates = new Set<number>([correctTotal]);

  const shuffledDeltas = [...deltas].sort(() => Math.random() - 0.5);
  for (const delta of shuffledDeltas) {
    if (candidates.size >= 3) break;
    const val = correctTotal + delta;
    if (val > 0 && val !== correctTotal) {
      candidates.add(val);
    }
  }

  while (candidates.size < 3) {
    candidates.add(correctTotal + candidates.size * 10000);
  }

  return Array.from(candidates).sort((a, b) => a - b);
}

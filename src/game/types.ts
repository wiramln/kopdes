export type ProductId =
  | 'beras'
  | 'minyak'
  | 'gula'
  | 'telur'
  | 'kopi'
  | 'keripik'
  | 'madu'
  | 'pupuk';

export type ProductCategory = 'Sembako' | 'UMKM Desa' | 'Sarana Tani';

export interface ProductDef {
  id: ProductId;
  name: string;
  shortName: string;
  unit: string;
  category: ProductCategory;
  price: number;
  primaryColor: string;
  accentColor: string;
  shelfPosition: [number, number, number];
  shelfRotationY: number;
  aisleLabel: string;
}

export interface OrderRequirement {
  productId: ProductId;
  requiredQty: number;
}

export interface VillagerProfile {
  name: string;
  role: string;
  shirtColor: number;
  pantsColor: number;
  skinColor: number;
  headwear: 'peci' | 'cap' | 'hijab' | 'none';
  headwearColor: number;
}

export interface ActiveOrder {
  id: number;
  villager: VillagerProfile;
  items: OrderRequirement[];
  totalExpectedPrice: number;
}

export interface BasketItem {
  uid: string;
  productId: ProductId;
}

export type GamePhase = 'menu' | 'playing' | 'checkout' | 'paused' | 'gameover';

export type CameraPreset = 'near' | 'standard' | 'high';

export type InteractableType = 'shelf' | 'cashier' | 'return';

export interface NearbyInteractable {
  type: InteractableType;
  productId?: ProductId;
  label: string;
  actionHint: string;
  distance: number;
}

export interface HighScoreRecord {
  bestRevenue: number;
  bestServed: number;
  bestStreak: number;
}

export interface ToastNotice {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'warning';
}

export interface TouchMoveVector {
  x: number;
  z: number;
}

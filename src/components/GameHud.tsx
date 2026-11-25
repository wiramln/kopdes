import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Pause,
  RotateCcw,
  ShoppingBasket,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BASKET_CAPACITY, PRODUCT_MAP, formatRupiah } from '../game/catalog';
import {
  ActiveOrder,
  BasketItem,
  CameraPreset,
  NearbyInteractable,
  ProductId,
  ToastNotice,
  TouchMoveVector,
} from '../game/types';

interface GameHudProps {
  order: ActiveOrder | null;
  basket: BasketItem[];
  timeLeft: number;
  revenue: number;
  servedCount: number;
  streak: number;
  nearby: NearbyInteractable | null;
  orderReady: boolean;
  cameraPreset: CameraPreset;
  muted: boolean;
  dockCollapsed: boolean;
  showTouchPad: boolean;
  toast: ToastNotice | null;
  onPrimaryAction: () => void;
  onReturnLastItem: () => void;
  onChangeCamera: (preset: CameraPreset) => void;
  onToggleMute: () => void;
  onToggleDock: () => void;
  onToggleTouchPad: () => void;
  onPause: () => void;
  onTouchMoveChange: (vec: TouchMoveVector) => void;
}

function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function GameHud({
  order,
  basket,
  timeLeft,
  revenue,
  servedCount,
  streak,
  nearby,
  orderReady,
  cameraPreset,
  muted,
  dockCollapsed,
  showTouchPad,
  toast,
  onPrimaryAction,
  onReturnLastItem,
  onChangeCamera,
  onToggleMute,
  onToggleDock,
  onToggleTouchPad,
  onPause,
  onTouchMoveChange,
}: GameHudProps) {
  const basketCounts = new Map<ProductId, number>();
  for (const item of basket) {
    basketCounts.set(item.productId, (basketCounts.get(item.productId) ?? 0) + 1);
  }

  const extraItemsCount = (() => {
    if (!order) return 0;
    const reqMap = new Map<ProductId, number>();
    for (const r of order.items) reqMap.set(r.productId, r.requiredQty);
    let extra = 0;
    basketCounts.forEach((qty, pid) => {
      const req = reqMap.get(pid) ?? 0;
      if (qty > req) extra += qty - req;
    });
    return extra;
  })();

  const isLowTime = timeLeft <= 20;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4 sm:p-5">
      {/* Top Row: Left Active Order + Right Tabular Metrics */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Active Villager Order Card (Solid dark surface, no backdrop-blur) */}
        {order && (
          <section
            aria-label="Pesanan warga aktif"
            className="pointer-events-auto w-72 sm:w-80 rounded-xl border border-stone-700/90 bg-stone-950/90 px-4 py-3.5 text-stone-100 shadow-lg"
          >
            <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-stone-800">
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-white truncate">
                  {order.villager.name}
                </h2>
                <p className="text-xs text-stone-400 truncate">
                  Pesanan #{order.id} · {order.villager.role}
                </p>
              </div>
              <span className="font-mono-num text-xs text-stone-300 shrink-0">
                {basket.length}/{BASKET_CAPACITY}
              </span>
            </div>

            <ul className="mt-2.5 space-y-1.5">
              {order.items.map((req) => {
                const prod = PRODUCT_MAP[req.productId];
                const have = basketCounts.get(req.productId) ?? 0;
                const done = have >= req.requiredQty;
                return (
                  <li
                    key={req.productId}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: prod.accentColor }}
                        aria-hidden="true"
                      />
                      <span
                        className={`truncate ${
                          done ? 'text-stone-400 line-through' : 'text-stone-100 font-medium'
                        }`}
                      >
                        {prod.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono-num text-xs">
                      <span className={done ? 'text-emerald-400 font-semibold' : 'text-amber-300'}>
                        {Math.min(have, req.requiredQty)}/{req.requiredQty}
                      </span>
                      {done && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
              {orderReady ? (
                <span className="font-semibold text-emerald-400">
                  Lengkap — Bawa ke meja kasir
                </span>
              ) : (
                <span className="text-stone-400">
                  Ikuti cincin kuning di depan rak
                </span>
              )}
              {extraItemsCount > 0 && (
                <span className="text-amber-400 shrink-0">+{extraItemsCount} ekstra</span>
              )}
            </div>
          </section>
        )}

        {/* Top-Right: Single-row Tabular Metrics Strip */}
        <section
          aria-label="Statistik shift"
          className="pointer-events-auto flex items-center gap-4 sm:gap-5 rounded-xl border border-stone-700/90 bg-stone-950/90 px-4 py-3 text-stone-100 shadow-lg"
        >
          <div>
            <div className="text-[11px] text-stone-400">Sisa Waktu</div>
            <div
              className={`font-mono-num text-lg font-bold leading-tight ${
                isLowTime ? 'text-red-400' : 'text-white'
              }`}
            >
              {formatTimer(timeLeft)}
            </div>
          </div>

          <div className="h-7 w-px bg-stone-800" aria-hidden="true" />

          <div>
            <div className="text-[11px] text-stone-400">Omzet Kopdes</div>
            <div className="font-mono-num text-base sm:text-lg font-bold leading-tight text-emerald-400">
              {formatRupiah(revenue)}
            </div>
          </div>

          <div className="hidden sm:block h-7 w-px bg-stone-800" aria-hidden="true" />

          <div className="hidden sm:block">
            <div className="text-[11px] text-stone-400">Warga</div>
            <div className="font-mono-num text-lg font-bold leading-tight text-white">
              {servedCount}
              {streak >= 2 && (
                <span className="ml-1.5 text-xs font-medium text-amber-400">
                  · {streak}x teliti
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Transient Feedback Toast (centered top-middle below header, never blocks avatar) */}
      {toast && (
        <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-20">
          <div
            className={`rounded-lg border px-4 py-2 text-xs sm:text-sm font-medium shadow-lg whitespace-nowrap ${
              toast.tone === 'success'
                ? 'border-emerald-700 bg-emerald-950/95 text-emerald-200'
                : toast.tone === 'warning'
                  ? 'border-amber-700 bg-amber-950/95 text-amber-200'
                  : 'border-stone-700 bg-stone-900/95 text-stone-100'
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* Optional Touch D-Pad (bottom-left, only shown when toggled on) */}
      {showTouchPad && (
        <div
          className="pointer-events-auto fixed bottom-24 left-4 z-20 grid grid-cols-3 gap-1.5 rounded-xl border border-stone-700 bg-stone-950/90 p-2"
          aria-label="Kontrol arah sentuh"
        >
          <div />
          <button
            type="button"
            onPointerDown={() => onTouchMoveChange({ x: 0, z: -1 })}
            onPointerUp={() => onTouchMoveChange({ x: 0, z: 0 })}
            onPointerLeave={() => onTouchMoveChange({ x: 0, z: 0 })}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-800 text-stone-100 active:bg-[#C81E1E]"
            aria-label="Jalan maju"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
          <div />
          <button
            type="button"
            onPointerDown={() => onTouchMoveChange({ x: -1, z: 0 })}
            onPointerUp={() => onTouchMoveChange({ x: 0, z: 0 })}
            onPointerLeave={() => onTouchMoveChange({ x: 0, z: 0 })}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-800 text-stone-100 active:bg-[#C81E1E]"
            aria-label="Jalan kiri"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onPointerDown={() => onTouchMoveChange({ x: 0, z: 1 })}
            onPointerUp={() => onTouchMoveChange({ x: 0, z: 0 })}
            onPointerLeave={() => onTouchMoveChange({ x: 0, z: 0 })}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-800 text-stone-100 active:bg-[#C81E1E]"
            aria-label="Jalan mundur"
          >
            <ArrowDown className="h-5 w-5" />
          </button>
          <button
            type="button"
            onPointerDown={() => onTouchMoveChange({ x: 1, z: 0 })}
            onPointerUp={() => onTouchMoveChange({ x: 0, z: 0 })}
            onPointerLeave={() => onTouchMoveChange({ x: 0, z: 0 })}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-800 text-stone-100 active:bg-[#C81E1E]"
            aria-label="Jalan kanan"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Unified Collapsible Bottom Control Dock */}
      <div className="pointer-events-none flex flex-col items-center">
        {/* Collapse / Expand Tab */}
        <button
          type="button"
          onClick={onToggleDock}
          className="pointer-events-auto mb-1.5 inline-flex items-center gap-1.5 rounded-t-lg border border-b-0 border-stone-700 bg-stone-950/90 px-3 py-1 text-[11px] font-medium text-stone-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          aria-expanded={!dockCollapsed}
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Tampilkan Kontrol (H)
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Sembunyikan Kontrol (H)
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 rounded-xl border border-stone-700/90 bg-stone-950/92 px-3.5 py-2.5 shadow-xl max-w-[94vw]">
            {/* Primary Contextual Action Button */}
            <button
              type="button"
              disabled={!nearby}
              onClick={onPrimaryAction}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400 ${
                nearby
                  ? nearby.type === 'cashier' && orderReady
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer'
                    : 'bg-[#C81E1E] text-white hover:bg-red-700 cursor-pointer'
                  : 'bg-stone-800/80 text-stone-400 cursor-default'
              }`}
            >
              <ShoppingBasket className="h-4 w-4" />
              {nearby ? `${nearby.actionHint} (E)` : 'WASD / Panah untuk bergerak'}
            </button>

            {/* Return Last Item */}
            <button
              type="button"
              disabled={basket.length === 0}
              onClick={onReturnLastItem}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                basket.length > 0
                  ? 'border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800 cursor-pointer'
                  : 'border-stone-800 bg-stone-900/40 text-stone-600 cursor-default'
              }`}
              title="Kembalikan barang terakhir dari keranjang (Q)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Kembalikan (Q)
            </button>

            <div className="hidden md:block h-6 w-px bg-stone-800" aria-hidden="true" />

            {/* Camera Angle Segmented Control */}
            <div
              className="flex items-center gap-0.5 rounded-lg bg-stone-900 p-0.5 border border-stone-800"
              role="group"
              aria-label="Sudut kamera"
            >
              {(
                [
                  { id: 'near', label: 'Dekat' },
                  { id: 'standard', label: 'Standar' },
                  { id: 'high', label: 'Tinggi' },
                ] as { id: CameraPreset; label: string }[]
              ).map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => onChangeCamera(cam.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    cameraPreset === cam.id
                      ? 'bg-stone-700 text-white'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>

            <div className="hidden md:block h-6 w-px bg-stone-800" aria-hidden="true" />

            {/* Audio Mute Toggle */}
            <button
              type="button"
              onClick={onToggleMute}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-medium text-stone-200 hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={muted ? 'Aktifkan suara' : 'Bisukan suara'}
            >
              {muted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
              <span className="hidden sm:inline">{muted ? 'Bisu' : 'Suara'}</span>
            </button>

            {/* Optional Touch D-Pad Toggle */}
            <button
              type="button"
              onClick={onToggleTouchPad}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showTouchPad
                  ? 'border-amber-600 bg-amber-950/60 text-amber-200'
                  : 'border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800'
              }`}
              title="Tampilkan tombol arah di layar"
            >
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Tombol Arah</span>
            </button>

            {/* Pause Button */}
            <button
              type="button"
              onClick={onPause}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-medium text-stone-200 hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Pause className="h-4 w-4" />
              Jeda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

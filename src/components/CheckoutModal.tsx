import { useEffect, useMemo, useState } from 'react';
import { Check, ScanBarcode, X } from 'lucide-react';
import {
  PERFECT_MATH_BONUS_RP,
  PRODUCT_MAP,
  formatRupiah,
  generateTotalChoices,
} from '../game/catalog';
import { soundManager } from '../game/sound';
import { ActiveOrder, ProductId } from '../game/types';

interface ScanUnit {
  key: string;
  productId: ProductId;
  name: string;
  price: number;
  category: string;
  color: string;
}

interface CheckoutModalProps {
  order: ActiveOrder;
  onComplete: (perfectMath: boolean) => void;
  onCancel: () => void;
}

export function CheckoutModal({ order, onComplete, onCancel }: CheckoutModalProps) {
  const units = useMemo<ScanUnit[]>(() => {
    const list: ScanUnit[] = [];
    for (const req of order.items) {
      const prod = PRODUCT_MAP[req.productId];
      for (let i = 0; i < req.requiredQty; i++) {
        list.push({
          key: `${order.id}-${req.productId}-${i}`,
          productId: req.productId,
          name: prod.name,
          price: prod.price,
          category: prod.category,
          color: prod.accentColor,
        });
      }
    }
    return list;
  }, [order]);

  const choices = useMemo(
    () => generateTotalChoices(order.totalExpectedPrice),
    [order.totalExpectedPrice],
  );

  const [scannedKeys, setScannedKeys] = useState<string[]>([]);
  const [recentKey, setRecentKey] = useState<string | null>(null);
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  const [hadMistake, setHadMistake] = useState(false);

  const allScanned = scannedKeys.length === units.length;

  const scannedSubtotal = useMemo(() => {
    const set = new Set(scannedKeys);
    return units.reduce((sum, u) => (set.has(u.key) ? sum + u.price : sum), 0);
  }, [scannedKeys, units]);

  const scanUnit = (unitKey: string) => {
    if (scannedKeys.includes(unitKey)) return;
    soundManager.playScanBeep();
    setScannedKeys((prev) => [...prev, unitKey]);
    setRecentKey(unitKey);
  };

  // Allow fast scanning with Space or Enter during step 1, and Escape to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (!allScanned && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        const nextUnscanned = units.find((u) => !scannedKeys.includes(u.key));
        if (nextUnscanned) {
          scanUnit(nextUnscanned.key);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [allScanned, scannedKeys, units, onCancel]);

  const handleChooseTotal = (amount: number) => {
    if (amount === order.totalExpectedPrice) {
      soundManager.playCashRegister();
      onComplete(!hadMistake);
    } else {
      soundManager.playError();
      setHadMistake(true);
      setWrongChoice(amount);
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-stone-700 bg-stone-900 text-stone-100 shadow-2xl overflow-hidden">
        {/* Top Merah Putih POS Header */}
        <div className="flex items-center justify-between gap-4 border-b border-stone-800 bg-[#C81E1E] px-6 py-4">
          <div>
            <h2 id="checkout-modal-title" className="font-display text-xl font-bold text-white">
              Meja Kasir Kopdes Merah Putih
            </h2>
            <p className="text-xs text-red-100 mt-0.5">
              {order.villager.name} · {order.villager.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-900/60 text-white hover:bg-red-900 transition-colors focus-visible:outline-2 focus-visible:outline-white"
            aria-label="Tutup meja kasir"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator Strip */}
        <div className="flex items-center justify-between border-b border-stone-800 bg-stone-950/70 px-6 py-3 text-xs">
          <div className="flex items-center gap-3 text-stone-300">
            <span className={!allScanned ? 'font-semibold text-amber-400' : 'text-emerald-400'}>
              01. Pindai Barang ({scannedKeys.length}/{units.length})
            </span>
            <span className="text-stone-600" aria-hidden="true">
              /
            </span>
            <span className={allScanned ? 'font-semibold text-amber-400' : 'text-stone-500'}>
              02. Hitung & Konfirmasi Total
            </span>
          </div>
          <div className="font-mono-num text-stone-400">
            {allScanned ? 'Siap verifikasi' : 'Klik barang atau tekan Spasi'}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Barcode Scanning Grid */}
          {!allScanned ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-300">
                  Klik setiap barang di meja kasir (atau tekan <span className="font-mono-num text-amber-300">Spasi</span>) untuk memindai barcode.
                </p>
                <div className="text-right">
                  <span className="block text-[11px] text-stone-400">Subtotal Terpindai</span>
                  <span className="font-mono-num text-lg font-bold text-emerald-400">
                    {formatRupiah(scannedSubtotal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {units.map((unit) => {
                  const isScanned = scannedKeys.includes(unit.key);
                  const isFlashing = recentKey === unit.key;
                  return (
                    <button
                      key={unit.key}
                      type="button"
                      disabled={isScanned}
                      onClick={() => scanUnit(unit.key)}
                      className={`relative flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors overflow-hidden focus-visible:outline-2 focus-visible:outline-amber-400 ${
                        isScanned
                          ? 'border-emerald-800/70 bg-emerald-950/35 text-stone-400 cursor-default'
                          : 'border-stone-700 bg-stone-800/90 text-stone-100 hover:border-amber-500 hover:bg-stone-800 cursor-pointer'
                      }`}
                    >
                      {isFlashing && (
                        <span
                          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-red-500 animate-scan-sweep"
                          aria-hidden="true"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: unit.color }}
                            aria-hidden="true"
                          />
                          <span className="text-sm font-semibold truncate">{unit.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-stone-400">
                          {unit.category} · <span className="font-mono-num">{formatRupiah(unit.price)}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isScanned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                            <Check className="h-4 w-4" />
                            Terpindai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
                            <ScanBarcode className="h-4 w-4" />
                            Pindai
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Step 2: Quick Total Calculation */
            <div className="space-y-5">
              <div className="rounded-lg border border-stone-800 bg-stone-950 p-4 space-y-2">
                <div className="text-xs font-semibold text-stone-400 pb-2 border-b border-stone-800">
                  Rincian Struk Belanja Warga
                </div>
                {order.items.map((req) => {
                  const prod = PRODUCT_MAP[req.productId];
                  return (
                    <div
                      key={req.productId}
                      className="flex items-center justify-between text-sm text-stone-200"
                    >
                      <span>
                        {prod.name}{' '}
                        <span className="font-mono-num text-stone-400">
                          ({req.requiredQty} × {formatRupiah(prod.price)})
                        </span>
                      </span>
                      <span className="font-mono-num text-stone-300">
                        {formatRupiah(prod.price * req.requiredQty)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-stone-200">
                    Pilih total belanja yang benar untuk menyerahkan struk:
                  </p>
                  {!hadMistake && (
                    <span className="text-xs text-amber-400 whitespace-nowrap shrink-0">
                      Bonus teliti +{formatRupiah(PERFECT_MATH_BONUS_RP)}
                    </span>
                  )}
                </div>

                {wrongChoice !== null && (
                  <p className="text-xs text-red-400">
                    {formatRupiah(wrongChoice)} belum tepat. Coba jumlahkan kembali rincian di atas.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {choices.map((amount) => {
                    const isWrong = wrongChoice === amount;
                    return (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleChooseTotal(amount)}
                        className={`rounded-lg border px-4 py-3.5 font-mono-num text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer ${
                          isWrong
                            ? 'border-red-700 bg-red-950/60 text-red-300'
                            : 'border-stone-700 bg-stone-800 text-white hover:border-emerald-500 hover:bg-emerald-950/50'
                        }`}
                      >
                        {formatRupiah(amount)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

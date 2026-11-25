import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckoutModal } from './components/CheckoutModal';
import { GameHud } from './components/GameHud';
import { MenuAndSummaryOverlay } from './components/MenuAndSummaryOverlay';
import {
  BASKET_CAPACITY,
  INITIAL_SHIFT_SECONDS,
  ORDER_TIME_BONUS,
  PERFECT_MATH_BONUS_RP,
  PRODUCT_MAP,
  formatRupiah,
  generateOrder,
} from './game/catalog';
import { KopdesGameEngine } from './game/engine';
import { soundManager } from './game/sound';
import {
  ActiveOrder,
  BasketItem,
  CameraPreset,
  GamePhase,
  HighScoreRecord,
  NearbyInteractable,
  ProductId,
  ToastNotice,
  TouchMoveVector,
} from './game/types';

const HIGH_SCORE_STORAGE_KEY = 'kopdes_mart_3d_highscore_v1';

function loadHighScore(): HighScoreRecord {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (!raw) return { bestRevenue: 0, bestServed: 0, bestStreak: 0 };
    const parsed = JSON.parse(raw) as Partial<HighScoreRecord>;
    return {
      bestRevenue: Number(parsed.bestRevenue) || 0,
      bestServed: Number(parsed.bestServed) || 0,
      bestStreak: Number(parsed.bestStreak) || 0,
    };
  } catch {
    return { bestRevenue: 0, bestServed: 0, bestStreak: 0 };
  }
}

function saveHighScore(record: HighScoreRecord): void {
  try {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage quota errors
  }
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<KopdesGameEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>('menu');
  const [order, setOrder] = useState<ActiveOrder>(() => generateOrder(1));
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_SHIFT_SECONDS);
  const [revenue, setRevenue] = useState<number>(0);
  const [servedCount, setServedCount] = useState<number>(0);
  const [perfectCount, setPerfectCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [highScore, setHighScore] = useState<HighScoreRecord>(() => loadHighScore());
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  const [nearby, setNearby] = useState<NearbyInteractable | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('standard');
  const [muted, setMuted] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [showTouchPad, setShowTouchPad] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [contextLost, setContextLost] = useState<boolean>(false);

  const toastIdRef = useRef(0);
  const uidCounterRef = useRef(0);
  const lastTickSecRef = useRef<number>(-1);

  const showToast = useCallback((text: string, tone: ToastNotice['tone'] = 'info') => {
    toastIdRef.current += 1;
    const id = toastIdRef.current;
    setToast({ id, text, tone });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 2400);
  }, []);

  const orderReady = useMemo(() => {
    const counts = new Map<ProductId, number>();
    for (const item of basket) {
      counts.set(item.productId, (counts.get(item.productId) ?? 0) + 1);
    }
    return order.items.every((req) => (counts.get(req.productId) ?? 0) >= req.requiredQty);
  }, [basket, order]);

  // Refs for fresh state inside engine callbacks & keyboard shortcuts
  const stateRef = useRef({
    phase,
    order,
    basket,
    nearby,
    orderReady,
  });
  stateRef.current = { phase, order, basket, nearby, orderReady };

  const pickupProduct = useCallback(
    (productId: ProductId) => {
      const { basket: curBasket, order: curOrder } = stateRef.current;
      if (curBasket.length >= BASKET_CAPACITY) {
        soundManager.playError();
        showToast('Keranjang penuh (maks. 8 barang). Tekan Q untuk mengembalikan.', 'warning');
        return;
      }

      uidCounterRef.current += 1;
      const nextItem: BasketItem = {
        uid: `b-${uidCounterRef.current}`,
        productId,
      };
      const nextBasket = [...curBasket, nextItem];
      setBasket(nextBasket);
      soundManager.playPickup();
      engineRef.current?.triggerPickupArc(productId);

      const prod = PRODUCT_MAP[productId];
      const req = curOrder.items.find((r) => r.productId === productId);
      const curCount = nextBasket.filter((b) => b.productId === productId).length;

      if (!req) {
        showToast(`${prod.shortName} tidak ada di daftar warga ini (Q untuk batal).`, 'warning');
      } else if (curCount > req.requiredQty) {
        showToast(`${prod.shortName} berlebih (${curCount}/${req.requiredQty}).`, 'warning');
      } else {
        showToast(`Mengambil ${prod.shortName} (${curCount}/${req.requiredQty})`, 'info');
      }
    },
    [showToast],
  );

  const returnLastItem = useCallback(() => {
    const { basket: curBasket } = stateRef.current;
    if (curBasket.length === 0) return;
    const removed = curBasket[curBasket.length - 1];
    setBasket(curBasket.slice(0, -1));
    soundManager.playReturnItem();
    showToast(`Mengembalikan ${PRODUCT_MAP[removed.productId].shortName}`, 'info');
  }, [showToast]);

  const tryOpenCashier = useCallback(() => {
    const { orderReady: ready, order: curOrder, basket: curBasket } = stateRef.current;
    if (!ready) {
      soundManager.playError();
      const missing = curOrder.items
        .map((req) => {
          const have = curBasket.filter((b) => b.productId === req.productId).length;
          const diff = req.requiredQty - have;
          return diff > 0 ? `${diff}× ${PRODUCT_MAP[req.productId].shortName}` : null;
        })
        .filter(Boolean);
      showToast(`Belum lengkap! Kurang: ${missing.join(', ')}`, 'warning');
      return;
    }
    soundManager.playNewOrder();
    setPhase('checkout');
  }, [showToast]);

  const handlePrimaryAction = useCallback(() => {
    const { phase: curPhase, nearby: curNearby } = stateRef.current;
    if (curPhase !== 'playing' || !curNearby) return;
    if (curNearby.type === 'shelf' && curNearby.productId) {
      pickupProduct(curNearby.productId);
    } else if (curNearby.type === 'cashier') {
      tryOpenCashier();
    } else if (curNearby.type === 'return') {
      returnLastItem();
    }
  }, [pickupProduct, returnLastItem, tryOpenCashier]);

  // Stable callbacks ref for Three.js engine mount
  const directClickRef = useRef((type: 'shelf' | 'cashier' | 'return', productId?: ProductId) => {
    if (type === 'shelf' && productId) {
      pickupProduct(productId);
    } else if (type === 'cashier') {
      tryOpenCashier();
    } else if (type === 'return') {
      returnLastItem();
    }
  });
  directClickRef.current = (type, productId) => {
    if (type === 'shelf' && productId) {
      pickupProduct(productId);
    } else if (type === 'cashier') {
      tryOpenCashier();
    } else if (type === 'return') {
      returnLastItem();
    }
  };

  // Mount Three.js engine once in isolated container
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new KopdesGameEngine(mount, {
      onNearbyChange: (next) => setNearby(next),
      onDirectClickInteract: (type, productId) => directClickRef.current(type, productId),
      onContextLost: (lost) => setContextLost(lost),
    });

    engine.setActiveOrder(stateRef.current.order, true);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync phase, camera preset, basket, and active order to Three.js engine
  useEffect(() => {
    engineRef.current?.setPhase(phase);
  }, [phase]);

  useEffect(() => {
    engineRef.current?.setCameraPreset(cameraPreset);
  }, [cameraPreset]);

  useEffect(() => {
    engineRef.current?.syncBasket(basket);
  }, [basket]);

  useEffect(() => {
    engineRef.current?.setActiveOrder(order, true);
  }, [order]);

  // Countdown shift timer (runs normally during 'playing', slows gently during 'checkout')
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'checkout') return;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        const step = phase === 'checkout' ? 0.12 : 0.25;
        const next = Math.max(0, prev - step);
        const ceilSec = Math.ceil(next);

        if (ceilSec > 0 && ceilSec <= 10 && ceilSec !== lastTickSecRef.current) {
          lastTickSecRef.current = ceilSec;
          soundManager.playTimerTick();
        }

        if (next <= 0) {
          soundManager.playShiftOver();
          setPhase('gameover');
        }
        return next;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [phase]);

  // Persist high score when entering gameover
  useEffect(() => {
    if (phase !== 'gameover') return;
    const prev = loadHighScore();
    const beatRevenue = revenue > prev.bestRevenue;
    const updated: HighScoreRecord = {
      bestRevenue: Math.max(prev.bestRevenue, revenue),
      bestServed: Math.max(prev.bestServed, servedCount),
      bestStreak: Math.max(prev.bestStreak, bestStreak),
    };
    setHighScore(updated);
    setIsNewRecord(beatRevenue && revenue > 0);
    saveHighScore(updated);
  }, [phase, revenue, servedCount, bestStreak]);

  // Keyboard shortcuts during gameplay
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const curPhase = stateRef.current.phase;

      if (e.code === 'KeyH' && curPhase === 'playing') {
        setDockCollapsed((prev) => !prev);
        return;
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (curPhase === 'playing') {
          setPhase('paused');
          return;
        }
        if (curPhase === 'paused') {
          setPhase('playing');
          return;
        }
      }

      if (curPhase !== 'playing') return;

      if (e.code === 'KeyE' || e.code === 'Space') {
        e.preventDefault();
        handlePrimaryAction();
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        returnLastItem();
      } else if (e.code === 'Digit1') {
        setCameraPreset('near');
      } else if (e.code === 'Digit2') {
        setCameraPreset('standard');
      } else if (e.code === 'Digit3') {
        setCameraPreset('high');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePrimaryAction, returnLastItem]);

  const handleStartNewShift = useCallback(() => {
    soundManager.unlock();
    soundManager.playNewOrder();
    const firstOrder = generateOrder(1);
    setOrder(firstOrder);
    setBasket([]);
    setTimeLeft(INITIAL_SHIFT_SECONDS);
    setRevenue(0);
    setServedCount(0);
    setPerfectCount(0);
    setStreak(0);
    setBestStreak(0);
    setIsNewRecord(false);
    lastTickSecRef.current = -1;
    engineRef.current?.resetPlayerPosition();
    setPhase('playing');
    showToast(`Pesanan pertama dari ${firstOrder.villager.name} siap dilayani!`, 'info');
  }, [showToast]);

  const handleCheckoutComplete = useCallback(
    (perfectMath: boolean) => {
      const earned = order.totalExpectedPrice + (perfectMath ? PERFECT_MATH_BONUS_RP : 0);
      setRevenue((prev) => prev + earned);
      setServedCount((prev) => prev + 1);
      setTimeLeft((prev) => Math.min(180, prev + ORDER_TIME_BONUS));

      if (perfectMath) {
        setPerfectCount((prev) => prev + 1);
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setStreak(0);
      }

      engineRef.current?.triggerVillagerCelebrate();

      const nextOrder = generateOrder(order.id + 1);
      setBasket([]);
      setOrder(nextOrder);
      setPhase('playing');

      showToast(
        perfectMath
          ? `Transaksi tepat! +${formatRupiah(earned)} & +${ORDER_TIME_BONUS} dtk`
          : `Transaksi selesai! +${formatRupiah(earned)} & +${ORDER_TIME_BONUS} dtk`,
        'success',
      );
    },
    [order, showToast],
  );

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundManager.setMuted(next);
      return next;
    });
  }, []);

  const handleTouchMoveChange = useCallback((vec: TouchMoveVector) => {
    engineRef.current?.setTouchMove(vec);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-stone-950">
      {/* Isolated WebGL Canvas Container */}
      <div ref={canvasMountRef} className="absolute inset-0 h-full w-full" />

      {/* WebGL Context Lost Recovery Banner */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-6 text-center">
          <div className="max-w-sm rounded-xl border border-stone-700 bg-stone-900 p-6">
            <h2 className="font-display text-lg font-bold text-white">
              Tampilan 3D sedang dipulihkan
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              Konteks WebGL terhenti sementara. Muat ulang halaman bila tampilan belum kembali.
            </p>
          </div>
        </div>
      )}

      {/* Active Gameplay HUD */}
      {(phase === 'playing' || phase === 'checkout') && (
        <GameHud
          order={order}
          basket={basket}
          timeLeft={timeLeft}
          revenue={revenue}
          servedCount={servedCount}
          streak={streak}
          nearby={nearby}
          orderReady={orderReady}
          cameraPreset={cameraPreset}
          muted={muted}
          dockCollapsed={dockCollapsed}
          showTouchPad={showTouchPad}
          toast={toast}
          onPrimaryAction={handlePrimaryAction}
          onReturnLastItem={returnLastItem}
          onChangeCamera={setCameraPreset}
          onToggleMute={handleToggleMute}
          onToggleDock={() => setDockCollapsed((v) => !v)}
          onToggleTouchPad={() => setShowTouchPad((v) => !v)}
          onPause={() => setPhase('paused')}
          onTouchMoveChange={handleTouchMoveChange}
        />
      )}

      {/* Cashier Mini-Game Modal */}
      {phase === 'checkout' && (
        <CheckoutModal
          order={order}
          onComplete={handleCheckoutComplete}
          onCancel={() => setPhase('playing')}
        />
      )}

      {/* Start Menu, Pause, and Shift Summary Overlays */}
      <MenuAndSummaryOverlay
        phase={phase}
        revenue={revenue}
        servedCount={servedCount}
        perfectCount={perfectCount}
        bestStreak={bestStreak}
        highScore={highScore}
        isNewRecord={isNewRecord}
        muted={muted}
        onStart={handleStartNewShift}
        onResume={() => setPhase('playing')}
        onBackToMenu={() => setPhase('menu')}
        onToggleMute={handleToggleMute}
      />
    </main>
  );
}

import { Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { formatRupiah } from '../game/catalog';
import { GamePhase, HighScoreRecord } from '../game/types';

interface MenuAndSummaryOverlayProps {
  phase: GamePhase;
  revenue: number;
  servedCount: number;
  perfectCount: number;
  bestStreak: number;
  highScore: HighScoreRecord;
  isNewRecord: boolean;
  muted: boolean;
  onStart: () => void;
  onResume: () => void;
  onBackToMenu: () => void;
  onToggleMute: () => void;
}

export function MenuAndSummaryOverlay({
  phase,
  revenue,
  servedCount,
  perfectCount,
  bestStreak,
  highScore,
  isNewRecord,
  muted,
  onStart,
  onResume,
  onBackToMenu,
  onToggleMute,
}: MenuAndSummaryOverlayProps) {
  if (phase === 'playing' || phase === 'checkout') {
    return null;
  }

  if (phase === 'menu') {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-start p-6 sm:p-12 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-stone-700/90 bg-stone-950/92 p-7 text-stone-100 shadow-2xl">
          <div className="text-xs font-semibold text-amber-400">
            Simulasi 3D · Koperasi Desa Merah Putih
          </div>

          <h1 className="font-display mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
            Kopdes Mart 3D
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-stone-300">
            Layani warga desa dengan sigap: susuri lorong rak sembako dan produk UMKM, masukkan
            pesanan ke keranjang, lalu pindai dan hitung belanjaan di meja kasir sebelum shift
            berakhir.
          </p>

          <ol className="mt-5 space-y-2 border-y border-stone-800 py-4 text-xs sm:text-sm text-stone-300">
            <li>
              <span className="font-mono-num text-amber-400 mr-2">01.</span>
              Bergerak di dalam gerai dengan <span className="font-semibold text-white">WASD</span> atau{' '}
              <span className="font-semibold text-white">Tombol Panah</span>.
            </li>
            <li>
              <span className="font-mono-num text-amber-400 mr-2">02.</span>
              Dekati rak bertanda cincin kuning, tekan <span className="font-semibold text-white">E</span> /{' '}
              <span className="font-semibold text-white">Spasi</span> atau klik rak untuk mengambil barang.
            </li>
            <li>
              <span className="font-mono-num text-amber-400 mr-2">03.</span>
              Bawa keranjang ke meja kasir untuk pindai barcode dan hitung total belanja warga.
            </li>
          </ol>

          {highScore.bestRevenue > 0 && (
            <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
              <span>Rekor Terbaik</span>
              <span className="font-mono-num text-stone-200">
                {formatRupiah(highScore.bestRevenue)} · {highScore.bestServed} warga
              </span>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onStart}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#C81E1E] px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer whitespace-nowrap"
            >
              <Play className="h-4 w-4" />
              Mulai Melayani
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-3.5 py-3 text-xs font-medium text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              aria-label={muted ? 'Aktifkan suara' : 'Bisukan suara'}
            >
              {muted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'paused') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/75 p-4">
        <div className="w-full max-w-sm rounded-xl border border-stone-700 bg-stone-900 p-6 text-stone-100 shadow-2xl">
          <h2 className="font-display text-2xl font-bold text-white">Permainan Dijeda</h2>
          <p className="mt-1.5 text-sm text-stone-400">
            Timer shift berhenti sementara. Siap lanjut melayani warga?
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#C81E1E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4" />
              Lanjutkan Shift
            </button>
            <button
              type="button"
              onClick={onStart}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-stone-700 bg-stone-800 px-4 py-2.5 text-sm font-medium text-stone-200 hover:bg-stone-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Ulangi dari Awal
            </button>
            <button
              type="button"
              onClick={onBackToMenu}
              className="w-full rounded-lg px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
            >
              Kembali ke Menu Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  // phase === 'gameover'
  const accuracy = servedCount > 0 ? Math.round((perfectCount / servedCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-950/80 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-700 bg-stone-900 text-stone-100 shadow-2xl overflow-hidden">
        <div className="bg-[#C81E1E] px-6 py-5">
          <div className="text-xs font-medium text-red-100">
            Laporan Akhir Shift · Kopdes Merah Putih
          </div>
          <h2 className="font-display mt-1 text-2xl font-bold text-white">
            Shift Pelayanan Selesai
          </h2>
          {isNewRecord && (
            <p className="mt-1 text-xs font-semibold text-amber-200">
              Rekor omzet koperasi baru tercapai!
            </p>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 border-b border-stone-800 pb-5">
            <div>
              <div className="text-xs text-stone-400">Total Omzet</div>
              <div className="font-mono-num mt-1 text-xl font-bold text-emerald-400">
                {formatRupiah(revenue)}
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Warga Terlayani</div>
              <div className="font-mono-num mt-1 text-xl font-bold text-white">
                {servedCount} warga
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Ketelitian Kasir</div>
              <div className="font-mono-num mt-1 text-base font-semibold text-stone-200">
                {accuracy}% ({perfectCount}/{servedCount})
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-400">Rentetan Teliti</div>
              <div className="font-mono-num mt-1 text-base font-semibold text-amber-300">
                {bestStreak}× beruntun
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>Rekor Pribadi Tertinggi</span>
            <span className="font-mono-num text-stone-200">
              {formatRupiah(highScore.bestRevenue)} · {highScore.bestServed} warga
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onStart}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#C81E1E] px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              Main Shift Baru
            </button>
            <button
              type="button"
              onClick={onBackToMenu}
              className="rounded-lg border border-stone-700 bg-stone-800 px-4 py-3 text-sm font-medium text-stone-200 hover:bg-stone-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

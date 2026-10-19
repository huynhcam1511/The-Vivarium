import type { EcoEnvironment, EcoResources } from '../types';
import { Sun, Moon, Wind, Thermometer, Droplets, BookOpen, Settings, BarChart2 } from 'lucide-react';

interface TelemetryHeaderProps {
  environment: EcoEnvironment;
  resources: EcoResources;
  gameMode?: 'SANDBOX' | 'SURVIVAL';
  onToggleMode?: () => void;
}

export const TelemetryHeader: React.FC<TelemetryHeaderProps> = ({
  environment,
  resources,
  gameMode = 'SANDBOX',
  onToggleMode,
}) => {
  const isDay = environment.timeOfDay > 0.22 && environment.timeOfDay < 0.78;

  return (
    <header className="fixed top-3 left-4 right-4 z-40 flex items-center justify-between pointer-events-none select-none">
      {/* 1. Left: Brand & Title */}
      <div className="flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-sm">
          🌱
        </div>
        <div>
          <h1 className="text-xs font-black tracking-widest text-emerald-100 flex items-center gap-2 uppercase">
            The Vivarium
          </h1>
          <p className="text-[10px] text-emerald-400/80 font-medium tracking-tight">
            Living Ecosystem Sandbox
          </p>
        </div>
      </div>

      {/* 2. Middle-Left: Atmospheric Telemetry */}
      <div className="flex items-center gap-3.5 bg-neutral-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto text-xs text-neutral-300">
        {/* Season & Day */}
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          {isDay ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-300" />}
          <div className="flex flex-col text-[11px] leading-tight">
            <span>Ngày 28</span>
            <span className="text-[9px] text-amber-200/70 font-normal">Mùa Xuân</span>
          </div>
        </div>

        <div className="w-px h-5 bg-white/15" />

        {/* Temperature */}
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-4 h-4 text-rose-400" />
          <div className="flex flex-col text-[11px] leading-tight">
            <span className="font-semibold">{environment.temperature.toFixed(1)}°C</span>
            <span className="text-[9px] text-neutral-400 font-normal">Nhiệt độ</span>
          </div>
        </div>

        <div className="w-px h-5 bg-white/15" />

        {/* Humidity */}
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-sky-400" />
          <div className="flex flex-col text-[11px] leading-tight">
            <span className="font-semibold">{environment.humidity.toFixed(0)}%</span>
            <span className="text-[9px] text-neutral-400 font-normal">Độ ẩm</span>
          </div>
        </div>

        <div className="w-px h-5 bg-white/15" />

        {/* CO2 */}
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 text-xs">☁️</span>
          <div className="flex flex-col text-[11px] leading-tight">
            <span className="font-semibold">{environment.co2Ppm} ppm</span>
            <span className="text-[9px] text-neutral-400 font-normal">CO₂</span>
          </div>
        </div>

        <div className="w-px h-5 bg-white/15" />

        {/* Wind */}
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-teal-400" />
          <div className="flex flex-col text-[11px] leading-tight">
            <span className="font-semibold">Gió nhẹ</span>
            <span className="text-[9px] text-neutral-400 font-normal">2.1 m/s</span>
          </div>
        </div>
      </div>

      {/* 3. Middle-Right: Ecological Resources Store */}
      <div className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto text-xs">
        {/* Honey */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-200">
          <span className="text-sm">🍯</span>
          <div className="flex flex-col text-[10px] leading-tight">
            <span className="text-neutral-400">Mật ong</span>
            <span className="font-bold text-amber-300">1,284</span>
          </div>
        </div>

        {/* Pollen / Plant */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-200">
          <span className="text-sm">🌼</span>
          <div className="flex flex-col text-[10px] leading-tight">
            <span className="text-neutral-400">Phấn hoa</span>
            <span className="font-bold text-emerald-300">1,093</span>
          </div>
        </div>

        {/* Wax */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-yellow-950/40 border border-yellow-500/20 text-yellow-200">
          <span className="text-sm">🕯️</span>
          <div className="flex flex-col text-[10px] leading-tight">
            <span className="text-neutral-400">Sáp ong</span>
            <span className="font-bold text-yellow-300">642</span>
          </div>
        </div>

        {/* Water */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-950/40 border border-sky-500/20 text-sky-200">
          <span className="text-sm">💧</span>
          <div className="flex flex-col text-[10px] leading-tight">
            <span className="text-neutral-400">Nước</span>
            <span className="font-bold text-sky-300">398</span>
          </div>
        </div>

        {/* Seeds / Food */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-950/40 border border-orange-500/20 text-orange-200">
          <span className="text-sm">🌰</span>
          <div className="flex flex-col text-[10px] leading-tight">
            <span className="text-neutral-400">Hạt giống</span>
            <span className="font-bold text-orange-300">856</span>
          </div>
        </div>

        {/* Soil / Mud */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-600/30 text-stone-200">
          <span className="text-sm">🧱</span>
          <div className="flex flex-col text-[10px] leading-tight">
            <span className="text-neutral-400">Đất</span>
            <span className="font-bold text-stone-200">{resources.mud + 312}</span>
          </div>
        </div>
      </div>

      {/* 4. Right: Game Mode & Menu Icons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onToggleMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            gameMode === 'SANDBOX'
              ? 'bg-emerald-600 border-emerald-400/50 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-neutral-900/90 border-white/10 text-neutral-300 hover:text-white'
          }`}
        >
          <span>🌱</span>
          <span>Sandbox</span>
        </button>

        <div className="flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md p-1 rounded-xl border border-white/10 text-neutral-400">
          <button className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Bách khoa Sinh học">
            <BookOpen className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Thống kê Sinh thái">
            <BarChart2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Cài đặt">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

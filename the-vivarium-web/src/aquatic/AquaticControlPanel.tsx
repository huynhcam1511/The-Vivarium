import React from 'react';
import type { AquaticSystem } from './AquaticSystem';

interface AquaticControlPanelProps {
  system: AquaticSystem;
  onRefresh: () => void;
  onJumpCamera: (preset: 'LAKE' | 'WATERFALL' | 'OVERVIEW') => void;
}

export const AquaticControlPanel: React.FC<AquaticControlPanelProps> = ({
  system,
  onRefresh,
  onJumpCamera,
}) => {
  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3 p-4 rounded-2xl bg-neutral-900/90 backdrop-blur-md border border-white/10 shadow-2xl text-white select-none max-w-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-bold tracking-wide uppercase text-cyan-200">
            PACK-004 Thủy Sinh & Thảm Thực Vật
          </h2>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700/50">
          LOD0-LOD3
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
          <div className="text-neutral-400">Mực Nước Hồ:</div>
          <div className="text-base font-bold text-cyan-300">
            {(system.getWaterLevel()).toFixed(1)} px
            <span className="text-[10px] text-neutral-400 font-normal ml-1">
              ({system.waterLevelOffset >= 0 ? `+${system.waterLevelOffset.toFixed(1)}` : system.waterLevelOffset.toFixed(1)})
            </span>
          </div>
        </div>
        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
          <div className="text-neutral-400">Độ Trong Suốt:</div>
          <div className="text-base font-bold text-emerald-300">
            {(system.waterClarity * 100).toFixed(0)}%
          </div>
        </div>
        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
          <div className="text-neutral-400">Quần Thể Cá:</div>
          <div className="text-base font-bold text-amber-300">
            {system.fishes.length} con
            <span className="text-[10px] text-neutral-400 font-normal ml-1">(6 Minnow, 3 Chép)</span>
          </div>
        </div>
        <div className="bg-black/40 p-2 rounded-lg border border-white/5">
          <div className="text-neutral-400">Thực Vật Ven Hồ:</div>
          <div className="text-base font-bold text-blue-300">
            {system.floraList.length} cụm
            <span className="text-[10px] text-neutral-400 font-normal ml-1">(Chuông, Rêu, Dương Xỉ, Rong)</span>
          </div>
        </div>
      </div>

      {/* Environmental Inflow Actions */}
      <div className="flex flex-col gap-1.5 text-xs">
        <span className="text-neutral-400 text-[10px] font-mono">Tác Động Môi Trường & Thời Tiết:</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              system.applyRainInflow(8.0, 1.0);
              onRefresh();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-100 font-medium transition active:scale-95 text-center"
          >
            🌧️ Nạp Nước Mưa (+8px)
          </button>
          <button
            onClick={() => {
              system.evaporateWater(6.0, 1.0);
              onRefresh();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-100 font-medium transition active:scale-95 text-center"
          >
            ☀️ Bay Hơi Nắng (-6px)
          </button>
        </div>
      </div>

      {/* Quick Camera Presets */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-white/10 text-[11px]">
        <span className="text-neutral-400 text-[10px] font-mono">Góc Nhìn:</span>
        <button
          onClick={() => onJumpCamera('LAKE')}
          className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-center font-medium"
        >
          Lòng Hồ (1.2x)
        </button>
        <button
          onClick={() => onJumpCamera('WATERFALL')}
          className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-center font-medium"
        >
          Thác Nước (1.5x)
        </button>
        <button
          onClick={() => onJumpCamera('OVERVIEW')}
          className="flex-1 px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-center font-medium"
        >
          Toàn Cảnh (0.9x)
        </button>
      </div>
    </div>
  );
};

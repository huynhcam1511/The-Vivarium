import type { ToolType, TimeSpeed } from '../types';
import { Shovel, Square, MousePointer2, Sprout, Hammer, FlaskConical, LayoutGrid, Play, Pause, FastForward } from 'lucide-react';

interface GameToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  timeSpeed: TimeSpeed;
  onChangeSpeed: (speed: TimeSpeed) => void;
  onJumpCamera: (preset: 'CANOPY' | 'SURFACE' | 'QUEEN' | 'LAKE' | 'WATERFALL' | 'HIVE' | 'CAVE') => void;
  antPopulation: number;
  beePopulation: number;
}

export const GameToolbar: React.FC<GameToolbarProps> = ({
  currentTool,
  onSelectTool,
  timeSpeed,
  onChangeSpeed,
  onJumpCamera,
  antPopulation,
  beePopulation,
}) => {
  return (
    <div className="fixed bottom-3 left-4 right-4 z-40 flex items-end justify-between select-none pointer-events-none">
      {/* 1. Left: Main Interactive Operations Toolbar */}
      <div className="flex items-center gap-1.5 bg-neutral-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
        {/* Di chuyển / Select */}
        <button
          onClick={() => onSelectTool('SELECT')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
            currentTool === 'SELECT'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
          title="Di chuyển & Chọn đối tượng"
        >
          <MousePointer2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Di chuyển</span>
        </button>

        {/* Đào */}
        <button
          onClick={() => onSelectTool('DIG')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
            currentTool === 'DIG'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
          title="Đào đường hầm và phòng ngầm"
        >
          <Shovel className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Đào</span>
        </button>

        {/* Lấp */}
        <button
          onClick={() => onSelectTool('FILL')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${
            currentTool === 'FILL'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
          title="Lấp đất đóng kín hang"
        >
          <Square className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Lấp</span>
        </button>

        {/* Trồng */}
        <button
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all"
          title="Trồng cỏ hoa và cây nấm"
        >
          <Sprout className="w-5 h-5 mb-0.5 text-emerald-400" />
          <span className="text-[10px]">Trồng</span>
        </button>

        {/* Xây */}
        <button
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all"
          title="Xây dựng tổ, cầu gỗ và máng dẫn nước"
        >
          <Hammer className="w-5 h-5 mb-0.5 text-amber-400" />
          <span className="text-[10px]">Xây</span>
        </button>

        {/* Nghiên cứu */}
        <button
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all"
          title="Nghiên cứu tiến hóa và công nghệ sinh học"
        >
          <FlaskConical className="w-5 h-5 mb-0.5 text-purple-400" />
          <span className="text-[10px]">Nghiên cứu</span>
        </button>

        {/* Quản lý */}
        <button
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all"
          title="Bảng phân công lao động sinh thái"
        >
          <LayoutGrid className="w-5 h-5 mb-0.5 text-sky-400" />
          <span className="text-[10px]">Quản lý</span>
        </button>
      </div>

      {/* 2. Middle: Biological Demographics Indicator Pill */}
      <div className="flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
        {/* Kiến */}
        <button
          onClick={() => onJumpCamera('QUEEN')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/40 text-neutral-200 transition-colors cursor-pointer"
          title="Nhấp để chuyển camera về Buồng Kiến Chúa"
        >
          <span className="text-base">🐜</span>
          <div className="flex flex-col text-[11px] leading-tight text-left">
            <span className="text-neutral-400 text-[9px]">Kiến thợ & Chúa</span>
            <span className="font-bold text-amber-300">{(1250 + antPopulation).toLocaleString()}</span>
          </div>
        </button>

        {/* Ong */}
        <button
          onClick={() => onJumpCamera('HIVE')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 border border-amber-600/30 text-amber-200 transition-colors cursor-pointer"
          title="Nhấp để chuyển camera về Tổ Ong Rừng Sồi"
        >
          <span className="text-base">🐝</span>
          <div className="flex flex-col text-[11px] leading-tight text-left">
            <span className="text-neutral-400 text-[9px]">Ong mật</span>
            <span className="font-bold text-yellow-300">{(880 + beePopulation).toLocaleString()}</span>
          </div>
        </button>

        {/* Thực vật */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-600/30 text-emerald-200">
          <span className="text-base">🌿</span>
          <div className="flex flex-col text-[11px] leading-tight">
            <span className="text-neutral-400 text-[9px]">Thực vật</span>
            <span className="font-bold text-emerald-300">4,892</span>
          </div>
        </div>

        {/* Nước */}
        <button
          onClick={() => onJumpCamera('LAKE')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-950/40 hover:bg-sky-950/60 border border-sky-600/30 text-sky-200 transition-colors cursor-pointer"
          title="Nhấp để xem Hồ nước & Đàn cá"
        >
          <span className="text-base">🦆</span>
          <div className="flex flex-col text-[11px] leading-tight text-left">
            <span className="text-neutral-400 text-[9px]">Hồ & Cá</span>
            <span className="font-bold text-sky-300">398 L</span>
          </div>
        </button>

        {/* Động vật khác */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-600/30 text-indigo-200">
          <span className="text-base">🦌</span>
          <div className="flex flex-col text-[11px] leading-tight">
            <span className="text-neutral-400 text-[9px]">Động vật</span>
            <span className="font-bold text-indigo-300">17</span>
          </div>
        </div>
      </div>

      {/* 3. Right: Camera Location Quick Selector & Simulation Speed */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl">
          <button
            onClick={() => onChangeSpeed(timeSpeed === 0 ? 1 : 0)}
            className={`p-2 rounded-xl transition-all ${
              timeSpeed === 0
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'text-neutral-300 hover:text-white hover:bg-white/10'
            }`}
            title={timeSpeed === 0 ? 'Tiếp tục mô phỏng' : 'Tạm dừng mô phỏng'}
          >
            {timeSpeed === 0 ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onChangeSpeed(1)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeSpeed === 1 ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            1x
          </button>

          <button
            onClick={() => onChangeSpeed(2)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeSpeed === 2 ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            2x
          </button>

          <button
            onClick={() => onChangeSpeed(5)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-0.5 transition-all ${
              timeSpeed === 5 ? 'bg-amber-500 text-neutral-950 font-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>5x</span>
          </button>
        </div>

        {/* Camera Preset Quick Jumps */}
        <div className="flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md px-2 py-1.5 rounded-2xl border border-white/10 shadow-2xl text-[11px]">
          <button
            onClick={() => onJumpCamera('CANOPY')}
            className="px-2 py-1 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
          >
            Cây cổ thụ
          </button>
          <button
            onClick={() => onJumpCamera('HIVE')}
            className="px-2 py-1 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
          >
            Tổ ong
          </button>
          <button
            onClick={() => onJumpCamera('LAKE')}
            className="px-2 py-1 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
          >
            Hồ nước
          </button>
          <button
            onClick={() => onJumpCamera('QUEEN')}
            className="px-2 py-1 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
          >
            Tổ kiến
          </button>
        </div>
      </div>
    </div>
  );
};

interface OrbProps {
  size?: number;
  active?: boolean;
}

/** ARIA'nın yaşayan AI küresi — nefes alan, dönen halkalı */
export default function Orb({ size = 180, active = false }: OrbProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* ping halo */}
      <div className="animate-ping-slow absolute inset-0 rounded-full border border-cyan-400/40" />
      {/* outer rotating dashed ring */}
      <div className="animate-orb-spin-rev absolute inset-[-14%] rounded-full border border-dashed border-violet-400/25" />
      {/* conic glow ring */}
      <div
        className="animate-orb-spin ring-conic absolute inset-[-4%] rounded-full opacity-70 blur-md"
        style={{ mask: 'radial-gradient(farthest-side, transparent 72%, black 76%)', WebkitMask: 'radial-gradient(farthest-side, transparent 72%, black 76%)' }}
      />
      {/* core */}
      <div className="animate-orb-breathe absolute inset-[8%] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 32% 28%, rgba(165,243,252,0.9) 0%, rgba(103,232,249,0.55) 18%, rgba(139,92,246,0.75) 46%, rgba(219,39,119,0.6) 74%, rgba(76,29,149,0.9) 100%)',
          boxShadow:
            '0 0 60px 8px rgba(139,92,246,0.45), 0 0 120px 24px rgba(34,211,238,0.22), inset 0 0 40px rgba(255,255,255,0.15)',
        }}
      />
      {/* inner swirl */}
      <div
        className="animate-orb-spin absolute inset-[16%] rounded-full opacity-80 blur-[2px]"
        style={{
          background: 'conic-gradient(from 90deg, transparent 0deg, rgba(255,255,255,0.35) 90deg, transparent 180deg, rgba(34,211,238,0.3) 270deg, transparent 360deg)',
          animationDuration: active ? '4s' : '9s',
        }}
      />
      {/* specular highlight */}
      <div className="absolute left-[24%] top-[18%] h-[16%] w-[24%] rounded-full bg-white/50 blur-md" />
      {/* label dot */}
      {active && (
        <span className="absolute -bottom-7 flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-cyan-300/80 uppercase">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
          düşünüyor
        </span>
      )}
    </div>
  );
}

export default function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#050510]">
      {/* aurora blobs */}
      <div
        className="animate-aurora absolute -top-[20%] left-[8%] h-[55vh] w-[55vw] rounded-full opacity-35 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)' }}
      />
      <div
        className="animate-aurora-2 absolute top-[30%] -right-[10%] h-[60vh] w-[50vw] rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 65%)' }}
      />
      <div
        className="animate-aurora absolute bottom-[-25%] left-[30%] h-[50vh] w-[45vw] rounded-full opacity-25 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #db2777 0%, transparent 65%)', animationDelay: '-12s' }}
      />
      {/* fine grid */}
      <div className="bg-grid absolute inset-0" />
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, transparent 40%, rgba(5,5,16,0.75) 100%)' }}
      />
    </div>
  );
}

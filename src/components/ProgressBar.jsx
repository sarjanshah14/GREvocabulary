export default function ProgressBar({ value = 0, max = 100, color = '#E8735A', height = 6, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`progress-track ${className}`} style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function ThresholdSlider({ threshold, onChange }) {
  const pct = (threshold * 100).toFixed(0);
  return (
    <div className="threshold-slider card">
      <div className="mode-toggle-head">
        <span className="mode-toggle-emoji">🎚️</span>
        <span>Compression aggressiveness</span>
      </div>
      <div className="threshold-slider-header">
        <span className="threshold-value">{pct}%</span>
      </div>
      <input
        id="threshold"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={threshold}
        style={{ "--fill": `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <div className="threshold-slider-labels">
        <span>🪶 Keep more</span>
        <span>✂️ Keep less</span>
      </div>
    </div>
  );
}

interface RiskGaugeProps {
  score: number;
  size?: number;
}

export default function RiskGauge({ score, size = 140 }: RiskGaugeProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const dashOffset = circumference * (1 - clampedScore / 100);

  const color =
    clampedScore <= 30 ? "#22c55e" :
    clampedScore <= 60 ? "#eab308" : "#ef4444";

  const label =
    clampedScore <= 30 ? "Low Risk" :
    clampedScore <= 60 ? "Medium Risk" : "High Risk";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a1a1a" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s ease" }}
        />
        <text x="60" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Inter">
          {clampedScore}
        </text>
        <text x="60" y="70" textAnchor="middle" fill="#71717a" fontSize="9" fontFamily="Inter">
          / 100
        </text>
      </svg>
      <span className="text-xs font-medium mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

// Motif d'entrelacs à 8 branches (inspiré des lattices géométriques arabo-andalouses)
// Utilisé comme accent visuel discret, jamais comme simple décor répété partout.
export default function GeometricPattern({
  color = "#c9a227",
  opacity = 0.16,
  className = "",
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  const tile = (x: number, y: number, key: string) => (
    <g key={key} transform={`translate(${x},${y})`}>
      <path
        d="M40 0 L52 12 L40 24 L28 12 Z
           M40 24 L52 36 L40 48 L28 36 Z
           M16 12 L28 24 L16 36 L4 24 Z
           M64 12 L76 24 L64 36 L52 24 Z"
        fill="none"
        stroke={color}
        strokeWidth="1.1"
      />
      <circle cx="40" cy="24" r="3" fill={color} />
    </g>
  );

  const tiles = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      tiles.push(tile(col * 80 - 20, row * 48 - 20, `${row}-${col}`));
    }
  }

  return (
    <svg
      className={className}
      viewBox="0 0 440 180"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
      aria-hidden="true"
    >
      {tiles}
    </svg>
  );
}

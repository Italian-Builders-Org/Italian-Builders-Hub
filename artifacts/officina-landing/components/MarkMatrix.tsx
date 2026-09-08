/*
 * Il simbolo ufficiale ricostruito sulla matrice 3×3. I colori sono quelli
 * vettoriali originali del logo, mai sostituiti con la palette funzionale.
 * Con `animated` le sette celle si assemblano lungo assi ortogonali.
 */
const CELLS = [
  { n: 1, x: 0, y: 0, fill: "#339654" },
  { n: 2, x: 32.04, y: 0, fill: "#288c49" },
  { n: 3, x: 0, y: 22.65, fill: "#1b8a45" },
  { n: 4, x: 32.04, y: 22.65, fill: "#ffffff" },
  { n: 5, x: 64.08, y: 22.65, fill: "#ba3232" },
  { n: 6, x: 32.04, y: 45.3, fill: "#b92c2c" },
  { n: 7, x: 64.08, y: 45.3, fill: "#af2727" },
];

type MarkMatrixProps = {
  animated?: boolean;
  className?: string;
};

export function MarkMatrix({ animated = false, className }: MarkMatrixProps) {
  return (
    <svg
      viewBox="-1 -1 98.12 69.95"
      role="img"
      aria-label="Il simbolo di Italian Builders: sette moduli su una griglia"
      className={className}
    >
      {/* La matrice completa, in grigio tecnico: le celle vuote restano visibili */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`g-${row}-${col}`}
            x={col * 32.04}
            y={row * 22.65}
            width="32.04"
            height="22.65"
            fill="none"
            stroke="#bfc3c7"
            strokeOpacity="0.55"
            strokeWidth="0.6"
          />
        )),
      )}
      {CELLS.map((cell) => (
        <rect
          key={cell.n}
          className={animated ? `mark-cell mark-cell-${cell.n}` : undefined}
          x={cell.x}
          y={cell.y}
          width="32.04"
          height="22.65"
          fill={cell.fill}
        />
      ))}
    </svg>
  );
}

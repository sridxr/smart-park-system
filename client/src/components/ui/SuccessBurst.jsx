import { motion as Motion } from "framer-motion";

const pieces = [
  { x: -70, y: -46, rotate: -18, color: "rgba(16, 185, 129, 0.85)" },
  { x: -30, y: -72, rotate: 15, color: "rgba(59, 130, 246, 0.82)" },
  { x: 18, y: -64, rotate: -10, color: "rgba(236, 72, 153, 0.78)" },
  { x: 64, y: -38, rotate: 20, color: "rgba(250, 204, 21, 0.82)" },
  { x: -54, y: 18, rotate: 8, color: "rgba(6, 182, 212, 0.8)" },
  { x: 54, y: 16, rotate: -15, color: "rgba(139, 92, 246, 0.82)" },
];

function SuccessBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {pieces.map((piece, index) => (
        <Motion.span
          key={`${piece.x}-${piece.y}`}
          initial={{ opacity: 0, scale: 0.4, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.9], x: piece.x, y: piece.y, rotate: piece.rotate }}
          transition={{ duration: 0.9, delay: index * 0.03, ease: "easeOut" }}
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{ background: piece.color }}
        />
      ))}
    </div>
  );
}

export default SuccessBurst;

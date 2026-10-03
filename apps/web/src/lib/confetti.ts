import confetti from 'canvas-confetti';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#6C5CE7', '#FF9F43', '#2D3436', '#00B894'];
const DURATION_MS = 1_000;
const PARTICLES_PER_FRAME = 2;
const SPREAD = 55;
const Z_INDEX = 200;

let cancelActive: (() => void) | null = null;

function burst(angle: number, x: number) {
  confetti({
    particleCount: PARTICLES_PER_FRAME,
    angle,
    spread: SPREAD,
    origin: { x },
    colors: COLORS,
    disableForReducedMotion: true,
    zIndex: Z_INDEX
  });
}

export function celebrate(): void {
  if (typeof window === 'undefined') return;

  cancelActive?.();

  const end = Date.now() + DURATION_MS;
  let frameId = 0;

  const frame = () => {
    burst(60, 0);
    burst(120, 1);

    if (Date.now() < end) {
      frameId = window.requestAnimationFrame(frame);
    }
  };

  frameId = window.requestAnimationFrame(frame);

  cancelActive = () => {
    window.cancelAnimationFrame(frameId);
    cancelActive = null;
  };
}
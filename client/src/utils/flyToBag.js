// A thumbnail that arcs from the product image into the navbar bag icon.
// Runs entirely on the compositor (transform + opacity via the Web Animations
// API) so it stays smooth even while the add-to-cart request is in flight.
const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const flyToBag = (originEl, imageSrc) => {
  if (!originEl || !imageSrc || typeof document === 'undefined') return;
  if (prefersReducedMotion()) return;
  if (typeof originEl.getBoundingClientRect !== 'function') return;

  const target = document.querySelector('[data-bag-target]');
  if (!target) return;

  const from = originEl.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !from.height || !to.width) return;

  const ghost = document.createElement('img');
  if (typeof ghost.animate !== 'function') return;

  ghost.src = imageSrc;
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.className = 'fly-ghost';
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const endScale = Math.min(0.34, Math.max(0.1, (to.width * 1.4) / from.width));
  const midScale = (1 + endScale) / 2;

  const animation = ghost.animate(
    [
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 0.95 },
      {
        transform: `translate3d(${dx * 0.5}px, ${dy * 0.25 - 56}px, 0) scale(${midScale})`,
        opacity: 0.9,
        offset: 0.55,
      },
      { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${endScale})`, opacity: 0 },
    ],
    { duration: 720, easing: 'cubic-bezier(0.32, 0.72, 0.26, 1)', fill: 'forwards' }
  );

  const cleanup = () => ghost.remove();
  animation.onfinish = cleanup;
  animation.oncancel = cleanup;
};

import { useState } from 'react';

const message = 'First-time customers: 25% off';

export default function AnnouncementBar() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="flex items-center bg-ink text-cream">
      <p className="sr-only">{message}. Complimentary shipping over ₹1,999. Easy 3-month returns.</p>
      <div className="min-w-0 flex-1 overflow-hidden" aria-hidden="true">
        <div className="announcement-track" style={{ animationPlayState: paused ? 'paused' : 'running' }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="announcement-copy">
              {[0, 1].map((repeat) => (
                <span key={repeat} className="flex shrink-0 items-center gap-8 px-4">
                  <strong className="font-semibold">{message}</strong>
                  <span className="text-clay">•</span>
                  <span>Complimentary shipping over ₹1,999</span>
                  <span className="text-clay">•</span>
                  <span>Easy 3-month returns</span>
                  <span className="text-clay">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? 'Resume announcement' : 'Pause announcement'}
        className="announcement-control flex h-10 w-10 shrink-0 items-center justify-center border-l border-cream/20 text-cream transition-colors hover:bg-white/10"
      >
        <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span>
      </button>
    </div>
  );
}

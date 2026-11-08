import { Logo } from './Layout';
import { useTheme } from '../lib/theme';
import { SignalMeter } from './ui';
import { IconMoon, IconSun } from './icons';

// Illustration only: shows what the watchlist looks like inside the app.
const PREVIEW = [
  { name: 'Payments migration', score: 72, level: 'risk', note: '2 overdue tasks' },
  { name: 'Mobile onboarding', score: 38, level: 'watch', note: '88% of budget committed' },
  { name: 'Help centre refresh', score: 8, level: 'ok', note: 'No warning signs' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  const [dark, setDark] = useTheme();
  return (
    <div className="min-h-screen bg-canvas grid lg:grid-cols-[1fr_minmax(0,560px)]">
      {/* Story panel */}
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-[#101833] text-white relative overflow-hidden">
        <div className="flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="8" fill="#3D5AFE" /><rect x="7" y="17" width="4" height="8" rx="1.5" fill="#fff" opacity=".55" /><rect x="14" y="12" width="4" height="13" rx="1.5" fill="#fff" opacity=".8" /><rect x="21" y="7" width="4" height="18" rx="1.5" fill="#FFB547" /></svg>
          <span className="text-[17px] font-extrabold tracking-[-0.02em]">ProSight</span>
        </div>

        <div className="max-w-[460px]">
          <h2 className="text-[40px] leading-[1.08] font-extrabold tracking-[-0.03em]">
            See trouble coming before the deadline does.
          </h2>
          <p className="mt-4 text-[#aab4d4] text-[17px] leading-relaxed">
            ProSight watches every task, budget and deadline, and ranks your projects by risk so you know where to look first.
          </p>

          <div className="dark mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-5" aria-hidden>
            {PREVIEW.map((p, i) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-white">{p.name}</span>
                  <span className="text-[#aab4d4]">{p.note}</span>
                </div>
                <SignalMeter score={p.score} level={p.level} animate delay={300 + i * 120} />
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-[#7f8bb3]">Early warnings and bottleneck detection for project teams.</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col px-5 sm:px-10 py-6">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface cursor-pointer"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <IconSun /> : <IconMoon />}
          </button>
        </div>
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[380px] mx-auto py-10">
            <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">{title}</h1>
            <p className="text-muted mt-1.5">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <p className="mt-8 text-sm text-muted">{footer}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

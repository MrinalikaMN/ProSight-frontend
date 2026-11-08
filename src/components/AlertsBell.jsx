import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { levelStyles } from '../lib/risk';
import { cx } from '../lib/cx';
import { IconBell, IconCheck, IconX } from './icons';

export default function AlertsBell({ alerts, align = 'left' }) {
  const { items, unread, markRead } = alerts;
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const go = (a) => {
    markRead([a.id]);
    setOpen(false);
    navigate(a.to);
  };

  return (
    <div className="relative" ref={wrap}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted hover:text-ink hover:bg-surface-2 cursor-pointer"
        aria-label={unread ? `Alerts, ${unread} unread` : 'Alerts'} aria-expanded={open}
      >
        <IconBell size={19} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-risk text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cx(
            'absolute z-50 mt-2 w-[min(380px,calc(100vw-2rem))] rounded-xl border border-line bg-surface shadow-2xl animate-pop overflow-hidden',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          role="dialog" aria-label="Alerts"
        >
          <div className="flex items-center justify-between px-4 h-12 border-b border-line">
            <p className="font-bold text-ink">Alerts {items.length > 0 && <span className="text-muted font-semibold">{items.length}</span>}</p>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={() => markRead(items.map((a) => a.id))} className="text-xs font-semibold text-brand hover:underline px-2 py-1 cursor-pointer">
                  Mark all as read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-2 cursor-pointer" aria-label="Close alerts">
                <IconX size={15} />
              </button>
            </div>
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-10">
              <span className="h-10 w-10 rounded-xl bg-ok-soft text-ok flex items-center justify-center mb-2"><IconCheck size={18} /></span>
              <p className="font-semibold text-ink">All clear</p>
              <p className="text-sm text-muted mt-0.5">No overdue work, budget pressure or severe risks right now.</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto scroll-thin divide-y divide-line">
              {items.map((a) => (
                <li key={a.id}>
                  <button onClick={() => go(a)} className={cx('w-full flex gap-3 px-4 py-3 text-left hover:bg-surface-2 cursor-pointer', !a.unread && 'opacity-60')}>
                    <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', levelStyles[a.level].bg)} />
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-sm text-ink', a.unread ? 'font-semibold' : 'font-medium')}>{a.title}</span>
                      <span className="block text-xs text-muted mt-0.5">{a.detail}</span>
                    </span>
                    {a.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

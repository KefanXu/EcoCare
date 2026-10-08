import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Heart, Stethoscope, Users } from 'lucide-react';
import { PARTICIPANT_ROLES, ROLE_PROFILES } from '../../lib/participantRoles';
import { useEcoStore } from '../../store/useEcoStore';

const ICONS = { patient: Heart, caregiver: Users, clinician: Stethoscope };

export function RoleSwitcher() {
  const role = useEcoStore((s) => s.participantRole);
  const setRole = useEcoStore((s) => s.setParticipantRole);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const profile = ROLE_PROFILES[role];
  const Icon = ICONS[role];

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
      if (!open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const options = [...(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [])];
      const index = options.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options[next]?.focus();
    }}>
      <button ref={triggerRef} type="button" aria-label={`EcoCare. You are looking at this as a ${profile.label.toLowerCase()}. Tap to change.`} title="Choose whose point of view to use" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left rounded-lg px-2 py-1.5 -ml-2 hover:bg-stone-50 transition min-h-[44px]">
        <div><div className="text-base font-semibold text-slate-900">EcoCare</div><div className="flex items-center gap-1.5 text-xs text-slate-600"><Icon className="w-3.5 h-3.5" aria-hidden />{profile.label}</div></div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && <div role="menu" aria-label="Whose point of view to use" className="map-panel absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] p-1.5">
        <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">I am looking at this as a…</div>
        {PARTICIPANT_ROLES.map((value) => { const ItemIcon = ICONS[value]; return (
          <button key={value} type="button" role="menuitemradio" tabIndex={-1} aria-checked={role === value} onClick={() => { setRole(value); setOpen(false); triggerRef.current?.focus(); }} className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition ${role === value ? 'bg-sky-50 text-sky-800' : 'text-slate-700 hover:bg-stone-50'}`}>
            <ItemIcon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /><span className="flex-1"><span className="block text-sm font-semibold">{ROLE_PROFILES[value].label}</span><span className="block text-xs text-slate-500 leading-relaxed mt-0.5">{ROLE_PROFILES[value].focus}</span></span>{role === value && <Check className="w-4 h-4 mt-0.5" aria-hidden />}
          </button>
        ); })}
      </div>}
    </div>
  );
}

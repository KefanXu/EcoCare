import { useState } from 'react';
import { useActiveHighlight, useEcoStore } from '../../store/useEcoStore';
import { findPreviewProposal } from './findPreviewProposal';

export function OverlayBanner() {
  const previewProposalId = useEcoStore((s) => s.previewProposalId);
  const appliedOverlay = useEcoStore((s) => s.appliedOverlay);
  const messages = useEcoStore((s) => s.messages);
  const cancelPreview = useEcoStore((s) => s.cancelPreview);
  const applyPreviewAsOverlay = useEcoStore((s) => s.applyPreviewAsOverlay);
  const discardOverlay = useEcoStore((s) => s.discardOverlay);
  const clearAllOverlays = useEcoStore((s) => s.clearAllOverlays);
  const setActiveHighlight = useEcoStore((s) => s.setActiveHighlight);
  const activeHighlight = useActiveHighlight();

  const [managerOpen, setManagerOpen] = useState(false);

  const preview = previewProposalId
    ? findPreviewProposal(messages, previewProposalId)
    : null;

  if (!preview && appliedOverlay.length === 0 && !activeHighlight) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
      {activeHighlight && (
        <div className="flex items-center gap-2 bg-white border border-amber-300 ring-1 ring-amber-200 rounded-full pl-3 pr-1.5 py-1 shadow-md text-xs">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-slate-700">
            <span className="text-amber-700 font-semibold">Highlighting:</span>{' '}
            {activeHighlight.title}
          </span>
          <button
            onClick={() => setActiveHighlight(null)}
            className="text-[11px] px-2 py-0.5 rounded-full border border-stone-300 bg-white text-slate-600 hover:border-slate-400"
          >
            Clear
          </button>
        </div>
      )}
      {preview && (
        <div className="flex items-center gap-2 bg-white border border-emerald-300 ring-1 ring-emerald-200 rounded-full pl-3 pr-1.5 py-1 shadow-md text-xs">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700">
            <span className="text-emerald-700 font-semibold">Previewing:</span>{' '}
            {preview.title}
          </span>
          <button
            onClick={() => applyPreviewAsOverlay()}
            className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700"
          >
            Apply
          </button>
          <button
            onClick={() => cancelPreview()}
            className="text-[11px] px-2 py-0.5 rounded-full border border-stone-300 bg-white text-slate-600 hover:border-slate-400"
          >
            Discard
          </button>
        </div>
      )}
      {appliedOverlay.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setManagerOpen((v) => !v)}
            className="flex items-center gap-2 bg-white border border-emerald-300 rounded-full px-3 py-1 shadow-sm text-xs hover:border-emerald-400"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700">
              What-if overlays:{' '}
              <span className="font-semibold text-emerald-700">{appliedOverlay.length}</span>
            </span>
            <span className="text-[11px] text-slate-500">Manage</span>
          </button>
          {managerOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-white border border-stone-200 rounded-lg shadow-lg p-2 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  Active overlays
                </div>
                <button
                  onClick={() => {
                    clearAllOverlays();
                    setManagerOpen(false);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-md text-rose-600 hover:bg-rose-50"
                >
                  Clear all
                </button>
              </div>
              {appliedOverlay.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {p.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {p.rationale}
                    </div>
                  </div>
                  <button
                    onClick={() => discardOverlay(p.id)}
                    className="shrink-0 text-[10px] px-2 py-0.5 rounded-md border border-stone-300 text-slate-600 hover:border-rose-300 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

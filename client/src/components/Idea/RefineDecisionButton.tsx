import { PenLine } from 'lucide-react';
import { useEcoStore } from '../../store/useEcoStore';
import { useUiText } from '../../lib/uiText';

export function RefineDecisionButton({ id, onOpen, compact = false }: { id: string; onOpen?: () => void; compact?: boolean }) {
  const { tr } = useUiText();
  return <button type="button" className="decision-refine-button" title={tr('Refine decision')} aria-label={tr('Refine decision')} onClick={() => {
    onOpen?.();
    useEcoStore.getState().setRefiningIdea(id);
  }}><PenLine size={15} aria-hidden />{!compact && tr('Refine decision')}</button>;
}

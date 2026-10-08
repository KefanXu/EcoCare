import { useEcoStore } from '../store/useEcoStore';

/** Cancel immediately on a perspective switch, including switch-away-and-back. */
export function startRoleRequest(revision: number) {
  const controller = new AbortController();
  const isCurrent = () => !controller.signal.aborted && useEcoStore.getState().roleRevision === revision;
  const unsubscribe = useEcoStore.subscribe((state) => {
    if (state.roleRevision !== revision) controller.abort();
  });
  if (!isCurrent()) controller.abort();
  return { controller, isCurrent, dispose: unsubscribe };
}

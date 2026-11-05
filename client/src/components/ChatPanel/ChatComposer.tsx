import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { useUiText } from '../../lib/uiText';
import './chatComposer.css';

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (value: string) => void;
  onStop: () => void;
  streaming: boolean;
  placeholder: string;
  context?: ReactNode;
}

export function ChatComposer({ value, onChange, onSend, onStop, streaming, placeholder, context }: ChatComposerProps) {
  const { tr } = useUiText();
  const textarea = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const input = textarea.current!;
    function resize() {
      input.style.height = '0px';
      input.style.height = `${Math.min(160, Math.max(56, input.scrollHeight))}px`;
    }
    resize();
    // Reflow a draft when the assistant panel changes width, not just when typing.
    let width = input.clientWidth;
    const observer = new ResizeObserver(() => {
      if (input.clientWidth !== width) { width = input.clientWidth; resize(); }
    });
    observer.observe(input);
    return () => observer.disconnect();
  }, [value, placeholder]);

  function send() {
    if (!streaming && value.trim()) {
      onSend(value);
      textarea.current?.focus({ preventScroll: true });
    }
  }
  return <form className="chat-composer" aria-label={tr('Message composer')} onSubmit={event => { event.preventDefault(); send(); }}>
    {context && <div className="chat-composer-context">{context}</div>}
    <div className="chat-composer-input">
      <textarea
        ref={textarea}
        rows={2}
        value={value}
        aria-label={placeholder}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
            event.preventDefault();
            send();
          }
        }}
      />
      {streaming ? <button key="stop" type="button" className="chat-composer-action is-stop" onClick={event => { event.preventDefault(); onStop(); textarea.current?.focus({ preventScroll: true }); }} aria-label={tr('Stop answer')} title={tr('Stop answer')}><Square size={16} fill="currentColor" strokeWidth={0} aria-hidden /></button>
        : <button key="send" type="submit" className="chat-composer-action" disabled={!value.trim()} aria-label={tr('Send message')} title={tr('Send message')}><ArrowUp size={21} strokeWidth={2} aria-hidden /></button>}
    </div>
  </form>;
}

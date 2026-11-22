import React, { useEffect, useId, useRef, useState } from 'react';

export interface TooltipProps {
  readonly content: string;
  readonly children: React.ReactElement<{
    readonly 'aria-describedby'?: string;
    readonly onClick?: (event: React.MouseEvent) => void;
    readonly onKeyDown?: (event: React.KeyboardEvent) => void;
  }>;
  readonly className?: string;
}

/**
 * HeroUI-inspired pure React + CSS bottom tooltip supporting hover, focus, tap pin,
 * Escape dismissal, and outside pointer dismissal without third-party dependencies.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children, className }) => {
  const tooltipId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsPinned(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsPinned(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className ?? ''}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => {
        if (!isPinned) {
          setIsOpen(false);
        }
      }}
      onFocus={() => setIsOpen(true)}
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
          setIsPinned(false);
        }
      }}
    >
      {React.cloneElement(children, {
        'aria-describedby': isOpen ? tooltipId : undefined,
        onClick: (event: React.MouseEvent) => {
          children.props.onClick?.(event);
          if (isPinned) {
            setIsPinned(false);
            setIsOpen(false);
          } else {
            setIsPinned(true);
            setIsOpen(true);
          }
        },
        onKeyDown: (event: React.KeyboardEvent) => {
          children.props.onKeyDown?.(event);
          if (event.key === 'Escape') {
            setIsPinned(false);
            setIsOpen(false);
          }
        },
      })}

      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className="tooltip-pop-in pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30 w-max max-w-[220px] px-2.5 py-1.5 rounded-[10px] bg-tooltip border border-border-subtle text-[11px] font-medium text-text-primary shadow-xl text-center leading-snug origin-top motion-reduce:animate-none"
        >
          <span
            aria-hidden="true"
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-tooltip border-l border-t border-border-subtle"
          />
          <span className="relative z-10">{content}</span>
        </div>
      )}
    </div>
  );
};

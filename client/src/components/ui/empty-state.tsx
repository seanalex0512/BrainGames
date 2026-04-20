import { type ReactNode } from 'react';
import { Button } from './button';

interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
  readonly ctaLabel?: string;
  readonly onCta?: () => void;
  readonly icon?: ReactNode;
}

export function EmptyState({ title, description, ctaLabel, onCta, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      {icon && <div className="text-white/40 text-6xl">{icon}</div>}
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-white/60 max-w-sm">{description}</p>
      {ctaLabel && onCta && (
        <Button onClick={onCta} size="lg">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}

import { Check, Clock, PackageCheck, ThumbsUp, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts/I18nContext';

type Status = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'failed';

interface Props {
  status: Status;
  startDate?: string | null;
  endDate?: string | null;
  renterReturnedAt?: string | null;
  lessorReturnedAt?: string | null;
  compact?: boolean;
}

export default function BookingTracker({
  status,
  startDate,
  endDate,
  renterReturnedAt,
  lessorReturnedAt,
  compact = false,
}: Props) {
  const { t } = useI18n();

  // Negative outcomes
  if (status === 'rejected' || status === 'cancelled' || status === 'failed') {
    return (
      <div className={cn(
        'flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive',
        compact ? 'text-xs' : 'text-sm'
      )}>
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium">{t(`bookingStatus.${status}`)}</span>
      </div>
    );
  }

  // Determine current step (0..3)
  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  let current = 0; // pending
  if (status === 'confirmed') current = 1;
  if (status === 'confirmed' && start && now >= start) current = 2; // in use
  if (status === 'completed') current = 3;

  const steps = [
    { key: 'pending', label: t('tracker.requested'), icon: Clock },
    { key: 'confirmed', label: t('tracker.confirmed'), icon: ThumbsUp },
    { key: 'inuse', label: t('tracker.inUse'), icon: PackageCheck },
    { key: 'completed', label: t('tracker.completed'), icon: Check },
  ];

  // Time-based progress within "in use" step
  let inUseProgress = 0;
  if (current >= 2 && start && end) {
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    inUseProgress = Math.max(0, Math.min(1, total > 0 ? elapsed / total : 1));
  }

  // Overall bar fill (0..1) – each completed step = 1/3 of the bar
  const segment = 1 / (steps.length - 1);
  let fill = current * segment;
  if (current === 2) fill = 2 * segment + inUseProgress * segment;
  if (current === 3) fill = 1;

  return (
    <div className={cn('w-full', compact ? 'space-y-2' : 'space-y-3')}>
      <div className="relative">
        {/* Track */}
        <div className={cn('absolute start-0 end-0 top-1/2 -translate-y-1/2 rounded-full bg-muted', compact ? 'h-1' : 'h-1.5')} />
        {/* Fill */}
        <div
          className={cn('absolute start-0 top-1/2 -translate-y-1/2 rounded-full bg-primary transition-all duration-500', compact ? 'h-1' : 'h-1.5')}
          style={{ width: `${fill * 100}%` }}
        />
        {/* Nodes */}
        <div className="relative flex items-center justify-between">
          {steps.map((s, i) => {
            const reached = i <= current;
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 transition-all',
                    compact ? 'h-6 w-6' : 'h-8 w-8',
                    reached
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-muted bg-background text-muted-foreground'
                  )}
                >
                  <Icon className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
                </div>
                {!compact && (
                  <span className={cn('text-[10px] sm:text-xs text-center max-w-[72px] leading-tight', reached ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                    {s.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {compact && (
        <p className="text-[11px] text-muted-foreground">
          {steps[current]?.label}
          {current === 2 && start && end && ` · ${Math.round(inUseProgress * 100)}%`}
        </p>
      )}

      {!compact && current === 2 && start && end && (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>{t('tracker.duration')}</span>
          <span className="font-medium text-foreground">{Math.round(inUseProgress * 100)}%</span>
        </div>
      )}

      {!compact && (renterReturnedAt || lessorReturnedAt) && status === 'confirmed' && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={cn('rounded-full px-2 py-1', renterReturnedAt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
            {t('tracker.renterConfirmed')}: {renterReturnedAt ? '✓' : '—'}
          </span>
          <span className={cn('rounded-full px-2 py-1', lessorReturnedAt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
            {t('tracker.lessorConfirmed')}: {lessorReturnedAt ? '✓' : '—'}
          </span>
        </div>
      )}
    </div>
  );
}

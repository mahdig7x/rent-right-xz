import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';

interface Props {
  bookingId: string;
  reviewerId: string;
  reviewedUserId: string;
  onSubmitted?: () => void;
}

export default function ReviewDialog({ bookingId, reviewerId, reviewedUserId, onSubmitted }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) { toast({ title: t('review.pickRating'), variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      reviewer_id: reviewerId,
      reviewed_user_id: reviewedUserId,
      rating,
      comment,
    });
    setLoading(false);
    if (error) { toast({ title: t('review.failed'), variant: 'destructive' }); return; }
    toast({ title: t('review.submitted') });
    setOpen(false);
    onSubmitted?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Star className="me-1.5 h-3.5 w-3.5" />{t('review.leave')}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t('review.title')}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star className={`h-9 w-9 ${n <= (hover || rating) ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
              </button>
            ))}
          </div>
          <Textarea placeholder={t('review.commentPlaceholder')} rows={4} value={comment} onChange={e => setComment(e.target.value)} />
          <Button className="w-full" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t('review.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

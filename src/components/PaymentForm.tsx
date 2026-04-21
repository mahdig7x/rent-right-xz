import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  loading?: boolean;
}

export default function PaymentForm({ amount, onSuccess, loading: externalLoading }: PaymentFormProps) {
  const { t } = useI18n();
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const formatNumber = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handlePay = async () => {
    setError('');
    const digits = card.number.replace(/\s/g, '');
    if (digits.length < 13) return setError(t('pay.invalidCard'));
    if (!card.name.trim()) return setError(t('pay.nameRequired'));
    if (card.expiry.length !== 5) return setError(t('pay.invalidExpiry'));
    if (card.cvc.length < 3) return setError(t('pay.invalidCvc'));

    setProcessing(true);
    // Simulated processing delay
    await new Promise(r => setTimeout(r, 1500));
    setProcessing(false);
    onSuccess();
  };

  const isLoading = processing || externalLoading;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <CreditCard className="h-6 w-6 text-primary" />
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t('pay.testMode')}</span>
        </div>
        <p className="font-mono text-sm tracking-wider text-muted-foreground">
          {card.number || '•••• •••• •••• ••••'}
        </p>
        <div className="flex justify-between mt-3 text-xs">
          <span className="text-muted-foreground uppercase">{card.name || t('pay.cardholder')}</span>
          <span className="text-muted-foreground">{card.expiry || 'MM/YY'}</span>
        </div>
      </div>

      <div>
        <Label className="text-xs">{t('pay.cardNumber')}</Label>
        <Input
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          value={card.number}
          onChange={e => setCard({ ...card, number: formatNumber(e.target.value) })}
        />
      </div>
      <div>
        <Label className="text-xs">{t('pay.cardholderName')}</Label>
        <Input
          placeholder={t('pay.namePlaceholder')}
          value={card.name}
          onChange={e => setCard({ ...card, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{t('pay.expiry')}</Label>
          <Input
            inputMode="numeric"
            placeholder="MM/YY"
            value={card.expiry}
            onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
          />
        </div>
        <div>
          <Label className="text-xs">CVC</Label>
          <Input
            inputMode="numeric"
            placeholder="123"
            maxLength={4}
            value={card.cvc}
            onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button className="w-full h-12 text-base font-semibold rounded-xl" onClick={handlePay} disabled={isLoading}>
        {isLoading ? (
          <><Loader2 className="me-2 h-5 w-5 animate-spin" />{t('pay.processing')}</>
        ) : (
          <><Lock className="me-2 h-4 w-4" />{t('pay.payNow')} ${amount}</>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">{t('pay.testHint')}</p>
    </div>
  );
}

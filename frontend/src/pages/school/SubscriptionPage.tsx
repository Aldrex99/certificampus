import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, Badge, Alert } from '@/components/ui/misc';
import {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useCreateCheckoutMutation,
} from '@/store/api';
import type { Plan } from '@/types';

function intervalLabel(interval: Plan['interval']): string {
  return interval === 'year' ? 'an' : 'mois';
}

export default function SubscriptionPage() {
  const [params, setParams] = useSearchParams();
  const { data: plans, isLoading: plansLoading } = useGetPlansQuery();
  const { data: current, isLoading: subLoading, refetch } = useGetMySubscriptionQuery();
  const [createCheckout, checkoutState] = useCreateCheckoutMutation();

  // Handle the return from Stripe Checkout (or the mock flow).
  useEffect(() => {
    const checkout = params.get('checkout');
    if (!checkout) return;
    if (checkout === 'success') {
      toast.success('Abonnement activé avec succès !');
      refetch();
    } else if (checkout === 'cancel') {
      toast.info('Paiement annulé.');
    }
    params.delete('checkout');
    params.delete('session_id');
    params.delete('mock');
    setParams(params, { replace: true });
  }, [params, setParams, refetch]);

  const onSubscribe = async (planId: string) => {
    try {
      const { url } = await createCheckout({ planId }).unwrap();
      // Redirect to Stripe Checkout (real mode) or back to this page (mock mode).
      window.location.href = url;
    } catch {
      // Errors surfaced by the global toast middleware.
    }
  };

  if (plansLoading || subLoading)
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );

  const activePlanId =
    current?.plan?._id ?? undefined;
  const used = current?.used ?? 0;
  const quota = current?.quota ?? 0;
  const remaining = current?.remaining ?? 0;
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const periodEnd = current?.periodEnd
    ? new Date(current.periodEnd).toLocaleDateString('fr-FR')
    : null;

  return (
    <div>
      <PageHeader
        title="Abonnement"
        description="Choisissez une formule pour générer des certificats."
      />

      {/* Current usage */}
      {current?.plan ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Formule actuelle : {current.plan.name}
              <Badge variant="success">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Certificats utilisés cette période
              </span>
              <span className="font-medium">
                {used} / {quota}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={
                  pct >= 100
                    ? 'h-full bg-destructive'
                    : pct >= 80
                      ? 'h-full bg-amber-500'
                      : 'h-full bg-brand'
                }
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {remaining} certificat(s) restant(s)
              {periodEnd ? ` — renouvellement le ${periodEnd}` : ''}.
            </p>
            {remaining === 0 && (
              <Alert variant="error">
                Quota atteint. Passez à une formule supérieure pour générer
                davantage de certificats.
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert variant="error">
          Vous n'avez pas encore d'abonnement actif. Choisissez une formule
          ci-dessous pour commencer à générer des certificats.
        </Alert>
      )}

      {/* Plans grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {plans?.map((plan) => {
          const isCurrent = plan._id === activePlanId;
          return (
            <Card
              key={plan._id}
              className={isCurrent ? 'border-brand ring-1 ring-brand' : ''}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <Badge variant="success">Actuelle</Badge>}
                </CardTitle>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{plan.price} €</span>
                  <span className="text-sm text-muted-foreground">
                    {' '}
                    / {intervalLabel(plan.interval)}
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand" />
                    {plan.certificateQuota} certificats / {intervalLabel(plan.interval)}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand" />
                    Génération PDF & QR code
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand" />
                    Vérification publique
                  </li>
                </ul>
                <Button
                  className="w-full"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || checkoutState.isLoading}
                  onClick={() => onSubscribe(plan._id)}
                >
                  {isCurrent
                    ? 'Formule active'
                    : checkoutState.isLoading
                      ? 'Redirection...'
                      : "S'abonner"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

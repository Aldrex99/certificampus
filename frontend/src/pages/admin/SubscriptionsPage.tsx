import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Table, Th, Td, Badge, Spinner } from '@/components/ui/misc';
import {
  useGetSubscriptionsQuery,
  useDeleteSubscriptionMutation,
} from '@/store/api';
import { Plan, Subscription } from '@/types';

const statusVariant: Record<string, 'success' | 'warning' | 'muted'> = {
  active: 'success',
  pending: 'warning',
  cancelled: 'muted',
  expired: 'muted',
};

const statusLabel: Record<string, string> = {
  active: 'Actif',
  pending: 'En attente',
  cancelled: 'Annulé',
  expired: 'Expiré',
};

/** Reads the populated school label, or a placeholder when unassigned. */
function schoolLabel(s: Subscription): string {
  if (s.school && typeof s.school === 'object') return s.school.label;
  return '—';
}

/** Reads the populated plan, or null when the subscription has none. */
function planOf(s: Subscription): Plan | null {
  return s.plan && typeof s.plan === 'object' ? s.plan : null;
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Whether the validity period has already elapsed. */
function isExpired(value?: string): boolean {
  return value ? new Date(value).getTime() < Date.now() : false;
}

export default function SubscriptionsPage() {
  const { data, isLoading } = useGetSubscriptionsQuery({});
  const [deleteSub] = useDeleteSubscriptionMutation();

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Abonnements"
        description="Suivi des abonnements souscrits par les établissements."
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>École</Th>
              <Th>Formule</Th>
              <Th>Statut</Th>
              <Th>Fin de validité</Th>
              <Th>Usage</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <Td className="py-8 text-center text-muted-foreground">
                  Aucun abonnement
                </Td>
              </tr>
            ) : (
              items.map((s) => {
                const plan = planOf(s);
                const expired = isExpired(s.currentPeriodEnd);
                return (
                  <tr key={s._id}>
                    <Td className="font-medium">{schoolLabel(s)}</Td>
                    <Td>
                      {plan ? (
                        <span>
                          {plan.name}
                          <span className="text-muted-foreground">
                            {' '}
                            · {plan.price} € /{' '}
                            {plan.interval === 'year' ? 'an' : 'mois'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{s.name ?? '—'}</span>
                      )}
                    </Td>
                    <Td>
                      <Badge variant={statusVariant[s.status]}>
                        {statusLabel[s.status] ?? s.status}
                      </Badge>
                    </Td>
                    <Td>
                      <span className={expired ? 'text-destructive' : ''}>
                        {formatDate(s.currentPeriodEnd)}
                        {expired && (
                          <span className="ml-1 text-xs">(expirée)</span>
                        )}
                      </span>
                    </Td>
                    <Td>
                      {plan
                        ? `${s.usedThisPeriod ?? 0} / ${plan.certificateQuota}`
                        : '—'}
                    </Td>
                    <Td className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSub(s._id)}
                        title="Supprimer l'abonnement"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}

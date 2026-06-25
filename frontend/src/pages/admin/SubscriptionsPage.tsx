import { FormEvent, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Table, Th, Td, Badge, Spinner } from '@/components/ui/misc';
import {
  useGetSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
} from '@/store/api';
import { Subscription } from '@/types';

const empty = { name: '', type: 'monthly', price: 0, status: 'pending' };
const statusVariant: Record<string, 'success' | 'warning' | 'muted'> = {
  active: 'success',
  pending: 'warning',
  cancelled: 'muted',
  expired: 'muted',
};

export default function SubscriptionsPage() {
  const { data, isLoading } = useGetSubscriptionsQuery({});
  const [createSub] = useCreateSubscriptionMutation();
  const [updateSub] = useUpdateSubscriptionMutation();
  const [deleteSub] = useDeleteSubscriptionMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [form, setForm] = useState<{ name: string; type: string; price: number; status: string }>(empty);

  const items = data?.items ?? [];

  const openCreate = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Subscription) => {
    setEditing(s);
    setForm({ name: s.name ?? '', type: s.type ?? 'monthly', price: s.price ?? 0, status: s.status });
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body = { ...form, price: Number(form.price) } as Partial<Subscription>;
    try {
      if (editing) await updateSub({ id: editing._id, body }).unwrap();
      else await createSub(body).unwrap();
      setOpen(false);
    } catch {
      // Error toast handled globally by the toast middleware.
    }
  };

  return (
    <div>
      <PageHeader
        title="Abonnements"
        description="Gérez les offres et abonnements des établissements."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Ajouter</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nom</Th>
              <Th>Type</Th>
              <Th>Prix</Th>
              <Th>Statut</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><Td className="py-8 text-center text-muted-foreground">Aucun abonnement</Td></tr>
            ) : (
              items.map((s) => (
                <tr key={s._id}>
                  <Td className="font-medium">{s.name}</Td>
                  <Td>{s.type}</Td>
                  <Td>{s.price} €</Td>
                  <Td><Badge variant={statusVariant[s.status]}>{s.status}</Badge></Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSub(s._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier l'abonnement" : 'Nouvel abonnement'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={onSubmit}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
                <option value="one-time">Unique</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prix (€)</Label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="pending">En attente</option>
              <option value="active">Actif</option>
              <option value="cancelled">Annulé</option>
              <option value="expired">Expiré</option>
            </Select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

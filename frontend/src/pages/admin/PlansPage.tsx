import { FormEvent, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Table, Th, Td, Badge, Spinner } from '@/components/ui/misc';
import {
  useGetAdminPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} from '@/store/api';
import { Plan } from '@/types';

interface PlanForm {
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  certificateQuota: number;
  isActive: boolean;
}

const empty: PlanForm = {
  name: '',
  description: '',
  price: 0,
  interval: 'month',
  certificateQuota: 50,
  isActive: true,
};

export default function PlansPage() {
  const { data: plans, isLoading } = useGetAdminPlansQuery();
  const [createPlan] = useCreatePlanMutation();
  const [updatePlan] = useUpdatePlanMutation();
  const [deletePlan] = useDeletePlanMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(empty);

  const items = plans ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: p.price,
      interval: p.interval,
      certificateQuota: p.certificateQuota,
      isActive: p.isActive,
    });
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body: Partial<Plan> = {
      ...form,
      price: Number(form.price),
      certificateQuota: Number(form.certificateQuota),
    };
    try {
      if (editing) await updatePlan({ id: editing._id, body }).unwrap();
      else await createPlan(body).unwrap();
      setOpen(false);
    } catch {
      // Error toast handled globally by the toast middleware.
    }
  };

  return (
    <div>
      <PageHeader
        title="Formules"
        description="Définissez les formules d'abonnement (prix et quota de certificats)."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nom</Th>
              <Th>Prix</Th>
              <Th>Intervalle</Th>
              <Th>Quota / période</Th>
              <Th>Statut</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <Td className="py-8 text-center text-muted-foreground">
                  Aucune formule
                </Td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p._id}>
                  <Td className="font-medium">{p.name}</Td>
                  <Td>{p.price} €</Td>
                  <Td>{p.interval === 'year' ? 'Annuel' : 'Mensuel'}</Td>
                  <Td>{p.certificateQuota} certificats</Td>
                  <Td>
                    {p.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="muted">Inactive</Badge>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deletePlan(p._id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
        title={editing ? 'Modifier la formule' : 'Nouvelle formule'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={onSubmit}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prix (€)</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Intervalle</Label>
              <Select
                value={form.interval}
                onChange={(e) =>
                  setForm({ ...form, interval: e.target.value as 'month' | 'year' })
                }
              >
                <option value="month">Mensuel</option>
                <option value="year">Annuel</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quota de certificats</Label>
              <Input
                type="number"
                min={1}
                value={form.certificateQuota}
                onChange={(e) =>
                  setForm({ ...form, certificateQuota: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.value === 'active' })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

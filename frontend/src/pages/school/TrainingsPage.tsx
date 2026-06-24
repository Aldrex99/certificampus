import { FormEvent, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Table, Th, Td, Spinner, Alert } from '@/components/ui/misc';
import {
  useGetTrainingsQuery,
  useCreateTrainingMutation,
  useUpdateTrainingMutation,
  useDeleteTrainingMutation,
} from '@/store/api';
import { Training } from '@/types';
import { apiError } from '@/lib/errors';

const empty = { label: '', level: '', description: '' };

export default function TrainingsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useGetTrainingsQuery({ search });
  const [createTraining] = useCreateTrainingMutation();
  const [updateTraining] = useUpdateTrainingMutation();
  const [deleteTraining] = useDeleteTrainingMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Training | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  const items = data?.items ?? [];

  const openCreate = () => { setEditing(null); setForm(empty); setError(''); setOpen(true); };
  const openEdit = (t: Training) => {
    setEditing(t);
    setForm({ label: t.label, level: t.level ?? '', description: t.description ?? '' });
    setError('');
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) await updateTraining({ id: editing._id, body: form }).unwrap();
      else await createTraining(form).unwrap();
      setOpen(false);
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Formations"
        description="Gérez les formations et niveaux de votre établissement."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Ajouter</Button>}
      />

      <div className="mb-4">
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Libellé</Th>
              <Th>Niveau</Th>
              <Th>Description</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><Td className="py-8 text-center text-muted-foreground">Aucune formation</Td></tr>
            ) : (
              items.map((t) => (
                <tr key={t._id}>
                  <Td className="font-medium">{t.label}</Td>
                  <Td>{t.level ?? '—'}</Td>
                  <Td className="text-muted-foreground">{t.description ?? '—'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTraining(t._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        title={editing ? 'Modifier la formation' : 'Ajouter une formation'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={onSubmit}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="space-y-1.5">
            <Label>Libellé</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Niveau</Label>
            <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="BTS, Bachelor, Master..." />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

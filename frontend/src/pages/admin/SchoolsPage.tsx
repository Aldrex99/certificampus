import { FormEvent, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Table, Th, Td, Badge, Spinner } from '@/components/ui/misc';
import {
  useGetSchoolsQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useDeleteSchoolMutation,
} from '@/store/api';
import { School } from '@/types';
import { formatDate } from '@/lib/utils';

const emptyCreate = { label: '', address: '', region: '', ownerFirstname: '', ownerLastname: '', ownerEmail: '' };

export default function SchoolsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useGetSchoolsQuery({ search });
  const [createSchool] = useCreateSchoolMutation();
  const [updateSchool] = useUpdateSchoolMutation();
  const [deleteSchool] = useDeleteSchoolMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyCreate);

  const items = data?.items ?? [];

  const openCreate = () => { setEditing(null); setForm(emptyCreate); setOpen(true); };
  const openEdit = (s: School) => {
    setEditing(s);
    setForm({ label: s.label, address: s.address ?? '', region: s.region ?? '' });
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await updateSchool({ id: editing._id, body: form }).unwrap();
      else await createSchool(form).unwrap();
      setOpen(false);
    } catch {
      // Error toast handled globally by the toast middleware.
    }
  };

  return (
    <div>
      <PageHeader
        title="Établissements"
        description="Gérez les écoles partenaires de la plateforme."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Ajouter une école</Button>}
      />

      <div className="mb-4">
        <Input placeholder="Rechercher par nom..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Établissement</Th>
              <Th>Responsable</Th>
              <Th>Statut</Th>
              <Th>Créé le</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><Td className="py-8 text-center text-muted-foreground">Aucun établissement</Td></tr>
            ) : (
              items.map((s) => (
                <tr key={s._id}>
                  <Td className="font-medium">{s.label}</Td>
                  <Td className="text-muted-foreground">
                    {s.owner ? `${s.owner.firstname} ${s.owner.lastname} (${s.owner.email})` : '—'}
                  </Td>
                  <Td>{s.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>}</Td>
                  <Td>{formatDate(s.createdAt)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSchool(s._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        title={editing ? "Modifier l'établissement" : 'Nouvel établissement'}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={onSubmit}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nom de l'établissement</Label>
            <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Région</Label>
              <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>
          </div>
          {!editing && (
            <>
              <p className="pt-2 text-sm font-medium text-brand">Responsable</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input value={form.ownerFirstname} onChange={(e) => setForm({ ...form, ownerFirstname: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input value={form.ownerLastname} onChange={(e) => setForm({ ...form, ownerLastname: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email du responsable</Label>
                <Input type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} required />
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}

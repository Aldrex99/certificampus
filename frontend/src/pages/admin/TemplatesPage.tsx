import { FormEvent, useState } from 'react';
import { Plus, Trash2, Pencil, Eye } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Table, Th, Td, Badge, Spinner, Alert } from '@/components/ui/misc';
import {
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} from '@/store/api';
import { TemplateDiploma } from '@/types';
import { apiError } from '@/lib/errors';

const DEFAULT_CONTENT = `<section style="text-align:center;padding:24px;border:4px double #0b1e3f">
  <h1>Certificat de Réussite</h1>
  <p>{{schoolName}}</p>
  <h2>{{studentName}}</h2>
  <p>Formation : {{trainingLabel}}</p>
  <p>Mention : {{grade}} — {{graduationDate}}</p>
  <div>{{qrcode}}</div>
</section>`;

export default function TemplatesPage() {
  const { data: templates, isLoading } = useGetTemplatesQuery();
  const [createTpl] = useCreateTemplateMutation();
  const [updateTpl] = useUpdateTemplateMutation();
  const [deleteTpl] = useDeleteTemplateMutation();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateDiploma | null>(null);
  const [form, setForm] = useState({ name: '', content: DEFAULT_CONTENT, isDefault: false });
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const items = templates ?? [];

  const openCreate = () => { setEditing(null); setForm({ name: '', content: DEFAULT_CONTENT, isDefault: false }); setError(''); setOpen(true); };
  const openEdit = (t: TemplateDiploma) => {
    setEditing(t);
    setForm({ name: t.name, content: t.content, isDefault: t.isDefault });
    setError('');
    setOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) await updateTpl({ id: editing._id, body: form }).unwrap();
      else await createTpl(form).unwrap();
      setOpen(false);
    } catch (err) {
      setError(apiError(err));
    }
  };

  const preview = (content: string) => {
    setPreviewHtml(
      content
        .replace(/{{studentName}}/g, 'Jeanne Dupont')
        .replace(/{{schoolName}}/g, 'École Démo')
        .replace(/{{trainingLabel}}/g, 'Master Dev Web')
        .replace(/{{grade}}/g, 'Très Bien')
        .replace(/{{graduationDate}}/g, '30/06/2026')
        .replace(/{{[\w]+}}/g, '')
    );
    setPreviewOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Templates de diplôme"
        description="Gérez les modèles utilisés pour générer les certificats."
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Ajouter</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Nom</Th>
              <Th>Par défaut</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><Td className="py-8 text-center text-muted-foreground">Aucun template</Td></tr>
            ) : (
              items.map((t) => (
                <tr key={t._id}>
                  <Td className="font-medium">{t.name}</Td>
                  <Td>{t.isDefault ? <Badge variant="success">Défaut</Badge> : <Badge variant="muted">—</Badge>}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => preview(t.content)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteTpl(t._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
        title={editing ? 'Modifier le template' : 'Nouveau template'}
        footer={
          <>
            <Button variant="outline" onClick={() => preview(form.content)}>Aperçu</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={onSubmit}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label>Contenu HTML (placeholders : {'{{studentName}}, {{schoolName}}, {{trainingLabel}}, {{grade}}, {{graduationDate}}, {{qrcode}}'})</Label>
            <textarea
              className="flex min-h-[200px] w-full rounded-md border border-input bg-white px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Définir comme template par défaut
          </label>
        </form>
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Aperçu du template">
        <div className="rounded-md border p-2" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </Modal>
    </div>
  );
}

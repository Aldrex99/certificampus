import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Eye, Send, FileCheck, AlertTriangle } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Table, Th, Td, Badge, Spinner } from '@/components/ui/misc';
import { toast } from 'react-toastify';
import {
  useGetCertifiableQuery,
  useGenerateDiplomasMutation,
  usePublishDiplomasMutation,
  useLazyPreviewDiplomaQuery,
  useGetMySubscriptionQuery,
} from '@/store/api';
import { Diploma } from '@/types';

export default function CertificationsPage() {
  const { data: students, isLoading } = useGetCertifiableQuery({});
  const { data: subscription } = useGetMySubscriptionQuery();
  const [generate, genState] = useGenerateDiplomasMutation();
  const [publish, pubState] = usePublishDiplomasMutation();
  const [triggerPreview, previewState] = useLazyPreviewDiplomaQuery();

  const [selected, setSelected] = useState<string[]>([]);
  const [generated, setGenerated] = useState<Diploma[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const items = students ?? [];
  const hasPlan = Boolean(subscription?.plan);
  const remaining = subscription?.remaining ?? 0;
  const overQuota = hasPlan && selected.length > remaining;
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelected(selected.length === items.length ? [] : items.map((s) => s._id));

  const onPreview = async (studentId: string) => {
    try {
      const res = await triggerPreview(studentId).unwrap();
      setPreviewHtml(res.html);
      setPreviewOpen(true);
    } catch {
      // Error toast handled globally by the toast middleware.
    }
  };

  const onGenerate = async () => {
    if (!selected.length) return;
    try {
      const res = await generate({ studentIds: selected }).unwrap();
      setGenerated(res.generated);
      toast.success(`${res.generated.length} diplôme(s) généré(s).`);
      setSelected([]);
    } catch {
      // Error toast handled globally by the toast middleware.
    }
  };

  const onPublish = async () => {
    if (!generated.length) return;
    try {
      const res = await publish({ diplomaIds: generated.map((d) => d._id), send: true }).unwrap();
      toast.success(`${res.published} diplôme(s) publié(s), ${res.sent} envoyé(s) par e-mail.`);
      setGenerated([]);
    } catch {
      // Error toast handled globally by the toast middleware.
    }
  };

  return (
    <div>
      <PageHeader
        title="Certifications"
        description="Sélectionnez les étudiants admis, générez puis publiez leurs diplômes."
        actions={
          <>
            <Button
              variant="outline"
              onClick={onGenerate}
              disabled={!selected.length || genState.isLoading || !hasPlan || overQuota}
            >
              <Award className="h-4 w-4" /> Générer
            </Button>
            <Button variant="accent" onClick={onPublish} disabled={!generated.length || pubState.isLoading}>
              <Send className="h-4 w-4" /> Publier & envoyer
            </Button>
          </>
        }
      />

      {!hasPlan ? (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Aucun abonnement actif.{' '}
          <Link to="/app/subscription" className="font-medium underline">
            Souscrivez à une formule
          </Link>{' '}
          pour générer des certificats.
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-md border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
          <span>
            Quota : <strong>{remaining}</strong> certificat(s) restant(s) cette
            période ({subscription?.used ?? 0}/{subscription?.quota ?? 0} utilisés).
          </span>
          {overQuota && (
            <span className="font-medium text-destructive">
              Sélection ({selected.length}) supérieure au quota restant.
            </span>
          )}
        </div>
      )}

      {generated.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
          <FileCheck className="h-4 w-4 text-brand" />
          {generated.length} diplôme(s) généré(s) — prêts à être publiés.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th className="w-10">
                <input type="checkbox" checked={items.length > 0 && selected.length === items.length} onChange={toggleAll} />
              </Th>
              <Th>Étudiant</Th>
              <Th>Email</Th>
              <Th>Mention</Th>
              <Th>Certifié</Th>
              <Th className="text-right">Aperçu</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><Td className="py-8 text-center text-muted-foreground">Aucun étudiant admis à certifier</Td></tr>
            ) : (
              items.map((s) => (
                <tr key={s._id}>
                  <Td><input type="checkbox" checked={selected.includes(s._id)} onChange={() => toggle(s._id)} /></Td>
                  <Td className="font-medium">{s.firstname} {s.lastname}</Td>
                  <Td className="text-muted-foreground">{s.email}</Td>
                  <Td>{s.grade ?? '—'}</Td>
                  <Td>{s.isCertified ? <Badge variant="success">Oui</Badge> : <Badge variant="muted">Non</Badge>}</Td>
                  <Td className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onPreview(s._id)} disabled={previewState.isFetching}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Aperçu du diplôme">
        <div className="rounded-md border p-2" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </Modal>
    </div>
  );
}

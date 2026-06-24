import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Plus, Upload, Download, Trash2, Pencil } from "lucide-react";
import { PageHeader, Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, Th, Td, Badge, Spinner } from "@/components/ui/misc";
import { toast } from "react-toastify";
import {
  useGetStudentsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useBulkDeleteStudentsMutation,
  useImportStudentsMutation,
  useGetTrainingsQuery,
} from "@/store/api";
import { Student } from "@/types";
import { formatDate } from "@/lib/utils";

const empty = {
  firstname: "",
  lastname: "",
  email: "",
  status: "ajourne",
  grade: "",
  training: "",
  graduationDate: "",
};

/** Reads a student's training id, whether populated or a raw id. */
const trainingId = (t: Student["training"]): string =>
  typeof t === "string" ? t : (t?._id ?? "");

const dateInput = (iso?: string): string => (iso ? iso.slice(0, 10) : "");

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [training, setTraining] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetStudentsQuery({
    page,
    search,
    status,
    training,
  });
  const { data: trainings } = useGetTrainingsQuery({});

  const [createStudent] = useCreateStudentMutation();
  const [updateStudent] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const [bulkDelete] = useBulkDeleteStudentsMutation();
  const [importStudents, importState] = useImportStudentsMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Record<string, string>>(empty);
  const [selected, setSelected] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };
  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      firstname: s.firstname,
      lastname: s.lastname,
      email: s.email,
      status: s.status,
      grade: s.grade ?? "",
      training: trainingId(s.training),
      graduationDate: dateInput(s.graduationDate),
    });
    setModalOpen(true);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      training: form.training || null,
      graduationDate: form.graduationDate || null,
    } as unknown as Partial<Student>;
    try {
      if (editing) await updateStudent({ id: editing._id, body }).unwrap();
      else await createStudent(body).unwrap();
      setModalOpen(false);
    } catch {
      // Error toast handled globally by the toast middleware.
    }
  };

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await importStudents(fd).unwrap();
      toast.success(
        `Import terminé : ${res.created} créés, ${res.updated} mis à jour, ${res.skipped} ignorés.`,
      );
    } catch {
      // Error toast handled globally by the toast middleware.
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  const toggleAll = () =>
    setSelected(
      selected.length === items.length ? [] : items.map((s) => s._id),
    );

  const onBulkDelete = async () => {
    if (!selected.length) return;
    await bulkDelete(selected);
    setSelected([]);
  };

  const downloadTemplate = () => {
    window.open("/api/v1/students/template", "_blank");
  };

  return (
    <div>
      <PageHeader
        title="Étudiants"
        description="Gérez la liste des étudiants de votre établissement."
        actions={
          <>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4" /> Template
            </Button>
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={importState.isLoading}
            >
              <Upload className="h-4 w-4" />{" "}
              {importState.isLoading ? "Import..." : "Importer Excel"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onImport}
            />
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Ajouter
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="max-w-[180px]"
        >
          <option value="">Tous les statuts</option>
          <option value="admis">Admis</option>
          <option value="ajourne">Ajournés</option>
        </Select>
        <Select
          value={training}
          onChange={(e) => {
            setTraining(e.target.value);
            setPage(1);
          }}
          className="max-w-[200px]"
        >
          <option value="">Toutes les formations</option>
          {trainings?.items.map((t) => (
            <option key={t._id} value={t._id}>
              {t.label}
            </option>
          ))}
        </Select>
        {selected.length > 0 && (
          <Button variant="destructive" onClick={onBulkDelete}>
            <Trash2 className="h-4 w-4" /> Supprimer ({selected.length})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th className="w-10">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.length === items.length}
                  onChange={toggleAll}
                />
              </Th>
              <Th>Nom</Th>
              <Th>Email</Th>
              <Th>Formation</Th>
              <Th>Statut</Th>
              <Th>Mention</Th>
              <Th>Certifié</Th>
              <Th>Date</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <Td className="py-8 text-center text-muted-foreground">
                  Aucun étudiant
                </Td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s._id}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.includes(s._id)}
                      onChange={() => toggle(s._id)}
                    />
                  </Td>
                  <Td className="font-medium">
                    {s.firstname} {s.lastname}
                  </Td>
                  <Td className="text-muted-foreground">{s.email}</Td>
                  <Td>
                    {typeof s.training === "object" ? s.training.label : "—"}
                  </Td>
                  <Td>
                    <Badge
                      variant={s.status === "admis" ? "success" : "warning"}
                    >
                      {s.status === "admis" ? "Admis" : "Ajourné"}
                    </Badge>
                  </Td>
                  <Td>{s.grade ?? "—"}</Td>
                  <Td>
                    {s.isCertified ? (
                      <Badge variant="success">Oui</Badge>
                    ) : (
                      <Badge variant="muted">Non</Badge>
                    )}
                  </Td>
                  <Td>{formatDate(s.graduationDate)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteStudent(s._id)}
                      >
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

      {data && data.total > data.limit && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data.total} étudiant(s)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <span className="px-2 py-1">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier l'étudiant" : "Ajouter un étudiant"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={onSubmit}>
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input
                value={form.firstname}
                onChange={(e) =>
                  setForm({ ...form, firstname: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input
                value={form.lastname}
                onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Formation</Label>
            <Select
              value={form.training}
              onChange={(e) => setForm({ ...form, training: e.target.value })}
            >
              <option value="">Aucune formation</option>
              {trainings?.items.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ajourne">Ajourné</option>
                <option value="admis">Admis</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mention</Label>
              <Input
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Date de certification</Label>
            <Input
              type="date"
              value={form.graduationDate}
              onChange={(e) =>
                setForm({ ...form, graduationDate: e.target.value })
              }
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

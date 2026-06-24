import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Alert } from '@/components/ui/misc';
import { useRegisterMutation } from '@/store/api';
import { apiError } from '@/lib/errors';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    schoolName: '',
  });
  const [register, { isLoading }] = useRegisterMutation();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form).unwrap();
      setDone(true);
    } catch (err) {
      setError(apiError(err));
    }
  };

  if (done) {
    return (
      <AuthLayout title="Compte créé" footer={<Link to="/login" className="underline">Retour à la connexion</Link>}>
        <Alert variant="success">
          Votre compte a été créé. Consultez votre boîte mail pour l'activer.
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Inscription"
      footer={
        <>
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-medium underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Prénom</Label>
            <Input value={form.firstname} onChange={(e) => update('firstname', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={form.lastname} onChange={(e) => update('lastname', e.target.value)} required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Nom de l'établissement</Label>
          <Input value={form.schoolName} onChange={(e) => update('schoolName', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Adresse e-mail</Label>
          <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Mot de passe</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Au moins 8 caractères, avec lettres et chiffres.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Création...' : "S'inscrire"}
        </Button>
      </form>
    </AuthLayout>
  );
}

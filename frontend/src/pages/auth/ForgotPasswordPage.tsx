import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Alert } from '@/components/ui/misc';
import { useForgotPasswordMutation } from '@/store/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await forgot({ email });
    setDone(true);
  };

  return (
    <AuthLayout title="Mot de passe oublié" footer={<Link to="/login" className="underline">Connexion</Link>}>
      {done ? (
        <Alert variant="success">
          Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
          </p>
          <div className="space-y-1.5">
            <Label>Adresse e-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Envoi...' : 'Envoyer le lien'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Alert } from '@/components/ui/misc';
import { useResetPasswordMutation } from '@/store/api';
import { apiError } from '@/lib/errors';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [reset, { isLoading }] = useResetPasswordMutation();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await reset({ email, token, password }).unwrap();
      navigate('/login');
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AuthLayout title="Nouveau mot de passe" footer={<Link to="/login" className="underline">Connexion</Link>}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="space-y-1.5">
          <Label>Adresse e-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Token</Label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Nouveau mot de passe</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Mise à jour...' : 'Réinitialiser'}
        </Button>
      </form>
    </AuthLayout>
  );
}

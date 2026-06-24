import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Alert } from '@/components/ui/misc';
import { useActivateMutation } from '@/store/api';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/authSlice';
import { apiError } from '@/lib/errors';

export default function ActivatePage() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [activate, { isLoading }] = useActivateMutation();
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await activate({ email, token, password: password || undefined }).unwrap();
      dispatch(setCredentials(res));
      navigate('/app');
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AuthLayout title="Activer mon compte" footer={<Link to="/login" className="underline">Connexion</Link>}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="space-y-1.5">
          <Label>Adresse e-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Code / token d'activation</Label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Définir un mot de passe (optionnel)</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Activation...' : 'Activer'}
        </Button>
      </form>
    </AuthLayout>
  );
}

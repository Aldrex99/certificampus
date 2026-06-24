import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Alert } from '@/components/ui/misc';
import { useLoginMutation } from '@/store/api';
import { useAppDispatch } from '@/store';
import { setCredentials } from '@/store/authSlice';
import { apiError } from '@/lib/errors';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials(res));
      navigate(res.user.role === 'admin' ? '/admin' : '/app');
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-medium underline">
            S'inscrire
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="text-brand underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>
    </AuthLayout>
  );
}

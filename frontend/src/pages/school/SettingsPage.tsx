import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Alert, Spinner } from '@/components/ui/misc';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '@/store/api';
import { apiError } from '@/lib/errors';

export default function SettingsPage() {
  const { data, isLoading } = useGetProfileQuery();
  const [updateProfile, updateState] = useUpdateProfileMutation();
  const [changePassword, passwordState] = useChangePasswordMutation();

  const [profile, setProfile] = useState({ firstname: '', lastname: '', email: '', schoolName: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileMsg, setProfileMsg] = useState({ ok: '', err: '' });
  const [pwMsg, setPwMsg] = useState({ ok: '', err: '' });

  useEffect(() => {
    if (data) {
      setProfile({
        firstname: data.user.firstname,
        lastname: data.user.lastname,
        email: data.user.email,
        schoolName: data.school?.label ?? '',
      });
    }
  }, [data]);

  const onProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg({ ok: '', err: '' });
    try {
      await updateProfile(profile).unwrap();
      setProfileMsg({ ok: 'Informations mises à jour.', err: '' });
    } catch (err) {
      setProfileMsg({ ok: '', err: apiError(err) });
    }
  };

  const onPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg({ ok: '', err: '' });
    try {
      await changePassword(pw).unwrap();
      setPwMsg({ ok: 'Mot de passe modifié.', err: '' });
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ ok: '', err: apiError(err) });
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div>
      <PageHeader title="Paramètres" description="Gérez les informations de votre compte." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informations</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onProfile} className="space-y-4">
              {profileMsg.err && <Alert>{profileMsg.err}</Alert>}
              {profileMsg.ok && <Alert variant="success">{profileMsg.ok}</Alert>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input value={profile.firstname} onChange={(e) => setProfile({ ...profile, firstname: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input value={profile.lastname} onChange={(e) => setProfile({ ...profile, lastname: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Nom de l'établissement</Label>
                <Input value={profile.schoolName} onChange={(e) => setProfile({ ...profile, schoolName: e.target.value })} />
              </div>
              <Button type="submit" disabled={updateState.isLoading}>
                {updateState.isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mot de passe</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onPassword} className="space-y-4">
              {pwMsg.err && <Alert>{pwMsg.err}</Alert>}
              {pwMsg.ok && <Alert variant="success">{pwMsg.ok}</Alert>}
              <div className="space-y-1.5">
                <Label>Mot de passe actuel</Label>
                <Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Nouveau mot de passe</Label>
                <Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmer</Label>
                <Input type="password" value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} required />
              </div>
              <Button type="submit" disabled={passwordState.isLoading}>
                {passwordState.isLoading ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

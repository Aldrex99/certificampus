import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Spinner } from '@/components/ui/misc';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '@/store/api';

export default function SettingsPage() {
  const { data, isLoading } = useGetProfileQuery();
  const [updateProfile, updateState] = useUpdateProfileMutation();
  const [changePassword, passwordState] = useChangePasswordMutation();

  const [profile, setProfile] = useState({ firstname: '', lastname: '', email: '', schoolName: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

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
    try {
      await updateProfile(profile).unwrap();
    } catch {
      // Feedback handled globally by the toast middleware.
    }
  };

  const onPassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await changePassword(pw).unwrap();
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      // Feedback handled globally by the toast middleware.
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

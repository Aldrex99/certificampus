import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, CheckCircle, Award, CreditCard, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, Alert } from '@/components/ui/misc';
import { useGetAdminDashboardQuery } from '@/store/api';

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
          <Icon className="h-6 w-6 text-brand" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, isError } = useGetAdminDashboardQuery();

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (isError || !data) return <Alert>Impossible de charger les statistiques.</Alert>;

  return (
    <div>
      <PageHeader title="Tableau de bord" description="Statistiques globales de la plateforme." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Building2} label="Établissements" value={data.totals.schools} />
        <Stat icon={CheckCircle} label="Écoles actives" value={data.totals.activeSchools} />
        <Stat icon={Award} label="Certifications délivrées" value={data.totals.diplomas} />
        <Stat icon={CreditCard} label="Abonnements" value={data.totals.subscriptions} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Écoles partenaires par année</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.schoolsByYear}>
                <XAxis dataKey="year" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Écoles" fill="#0b1e3f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Croissance annuelle</CardTitle></CardHeader>
          <CardContent className="flex h-[260px] flex-col items-center justify-center">
            <TrendingUp className={`h-16 w-16 ${data.growthVsLastYear >= 0 ? 'text-green-600' : 'text-destructive'}`} />
            <p className="mt-4 text-4xl font-bold">
              {data.growthVsLastYear >= 0 ? '+' : ''}{data.growthVsLastYear}%
            </p>
            <p className="text-sm text-muted-foreground">vs année précédente (N-1)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

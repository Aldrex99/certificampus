import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Users, GraduationCap, Award, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, Alert } from '@/components/ui/misc';
import { useGetDashboardQuery } from '@/store/api';

const COLORS = ['#0b1e3f', '#b8860b'];

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
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

export default function SchoolDashboard() {
  const { data, isLoading, isError } = useGetDashboardQuery();

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (isError || !data) return <Alert>Impossible de charger le tableau de bord.</Alert>;

  const successData = [
    { name: 'Admis', value: data.success.admis },
    { name: 'Ajournés', value: data.success.ajourne },
  ];
  const certData = [
    { name: 'Certifiés', value: data.certification.certified },
    { name: 'Non certifiés', value: data.certification.notCertified },
  ];

  return (
    <div>
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de votre établissement." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Étudiants" value={data.totals.students} />
        <Stat icon={GraduationCap} label="Formations" value={data.totals.trainings} />
        <Stat icon={Award} label="Diplômes générés" value={data.totals.diplomasGenerated} />
        <Stat icon={Send} label="Diplômes envoyés" value={data.totals.diplomasSent} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Réussite</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={successData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {successData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Certification</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={certData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {certData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Taux de réussite par année</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[...data.yearlyTrend].reverse()}>
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="successRate" name="Réussite %" fill="#0b1e3f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

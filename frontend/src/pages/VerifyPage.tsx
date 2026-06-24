import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/misc';
import { formatDate } from '@/lib/utils';

interface VerifyResult {
  valid: boolean;
  student: string;
  school: string;
  training?: string;
  grade?: string;
  graduationDate?: string;
}

/** Public diploma verification — reachable by scanning the QR code. */
export default function VerifyPage() {
  const { token } = useParams();
  const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [data, setData] = useState<VerifyResult | null>(null);

  useEffect(() => {
    fetch(`/api/v1/verify/${token}?format=json`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.valid) {
          setData(json.data);
          setState('valid');
        } else {
          setState('invalid');
        }
      })
      .catch(() => setState('invalid'));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/">
            <Logo className="text-2xl" />
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Vérification du certificat</CardTitle>
          </CardHeader>
          <CardContent>
            {state === 'loading' && (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            )}
            {state === 'invalid' && (
              <div className="py-6 text-center">
                <XCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
                <p className="font-medium">Certificat introuvable ou invalide</p>
              </div>
            )}
            {state === 'valid' && data && (
              <div className="py-2 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-600" />
                <p className="mb-4 font-medium text-green-700">Certificat authentique</p>
                <dl className="space-y-2 text-left text-sm">
                  <Row label="Titulaire" value={data.student} />
                  <Row label="Établissement" value={data.school} />
                  {data.training && <Row label="Formation" value={data.training} />}
                  {data.grade && <Row label="Mention" value={data.grade} />}
                  <Row label="Délivré le" value={formatDate(data.graduationDate)} />
                </dl>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

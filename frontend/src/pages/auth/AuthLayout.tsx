import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthLayout({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand to-brand-light p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/">
            <Logo light className="text-3xl" />
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-brand">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
        </Card>
        {footer && <div className="mt-4 text-center text-sm text-white/80">{footer}</div>}
      </div>
    </div>
  );
}

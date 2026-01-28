import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Fetch user data
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/me`, {
    headers: {
      Cookie: `next-auth.session-token=${session.user?.id}`, // This won't work in server component, need to pass session
    },
  });

  // For now, show basic dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Book snow removal services</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/customer/book">
                <Button className="w-full">Find Providers</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Provider</CardTitle>
              <CardDescription>Offer snow removal services</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/provider/dashboard">
                <Button className="w-full">Provider Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


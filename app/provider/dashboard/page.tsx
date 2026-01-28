import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EarningsDisplay } from '@/components/payments/EarningsDisplay';

export default async function ProviderDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const provider = await prisma.providerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      bookings: {
        where: {
          status: { in: ['PENDING', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS'] },
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          address: {
            include: { city: true },
          },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 10,
      },
    },
  });

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Provider Profile Not Found</CardTitle>
            <CardDescription>You need to set up your provider profile first</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/provider/onboarding">
              <Button className="w-full">Start Onboarding</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate recent earnings
  const recentBookings = await prisma.booking.findMany({
    where: {
      providerId: provider.id,
      status: 'COMPLETED',
      paymentStatus: 'CAPTURED',
    },
    orderBy: { completedAt: 'desc' },
    take: 10,
  });

  const totalEarnings = recentBookings.reduce((sum, booking) => sum + booking.providerPayout, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Provider Dashboard</h1>
          {!provider.stripeOnboardingComplete && (
            <Link href="/provider/onboarding">
              <Button>Complete Onboarding</Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                ${(totalEarnings / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Last 10 completed jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{provider.bookings.length}</p>
              <p className="text-sm text-gray-500 mt-1">Pending and scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{provider.averageRating.toFixed(1)}</p>
              <p className="text-sm text-gray-500 mt-1">From {provider.totalReviews} reviews</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Jobs</CardTitle>
              <CardDescription>Your scheduled bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {provider.bookings.length === 0 ? (
                <p className="text-gray-500">No upcoming jobs</p>
              ) : (
                <div className="space-y-4">
                  {provider.bookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">
                            {booking.customer.firstName} {booking.customer.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.address.streetAddress}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.scheduledDate).toLocaleDateString()} at {booking.scheduledTimeStart}
                          </p>
                        </div>
                        <Link href={`/provider/jobs/${booking.id}`}>
                          <Button size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/provider/availability" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Manage Availability
                </Button>
              </Link>
              <Link href="/provider/pricing" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Update Pricing
                </Button>
              </Link>
              <Link href="/provider/earnings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  View Earnings
                </Button>
              </Link>
              <Link href="/provider/profile" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


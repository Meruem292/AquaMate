import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
        <header className="py-4 px-4 sm:px-6 lg:px-8 border-b">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-primary">
              <Droplets className="h-6 w-6" />
              <span className="text-xl font-bold">AquaMate Dashboard</span>
            </Link>
            <Button variant="outline" asChild>
                <Link href="/">Log Out</Link>
            </Button>
          </div>
        </header>
      <main className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Welcome to your Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              This is a placeholder page. Your actual dashboard with real-time data and analytics will be displayed here.
            </p>
            <Button asChild>
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

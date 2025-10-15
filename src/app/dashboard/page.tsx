import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <main className="flex-grow flex items-center justify-center p-8">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to your Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            This is a placeholder page. Your actual dashboard with real-time data and analytics will be displayed here.
          </p>
           <p className="text-muted-foreground mb-6">
            Select an option from the sidebar to get started.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

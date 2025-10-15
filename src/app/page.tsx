import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CheckCircle, Gauge, LineChart, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: <Gauge className="h-8 w-8 text-primary" />,
    title: 'Real-Time Monitoring',
    description: 'Track water quality parameters like pH, temperature, and dissolved oxygen in real-time.',
  },
  {
    icon: <LineChart className="h-8 w-8 text-primary" />,
    title: 'Predictive Analytics',
    description: 'Leverage AI to predict potential issues and receive proactive alerts before they impact your stock.',
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: 'Automated Alerts',
    description: 'Get instant notifications on your devices when parameters deviate from the optimal range.',
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: 'Easy Management',
    description: 'A user-friendly dashboard to visualize data, manage devices, and optimize your farm operations.',
  },
];

export default function Home() {

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white">
          <Image
            src="/Aquamate_bg.jpg"
            alt="AquaMate hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 px-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Smarter Aquaculture, Healthier Fish
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto text-white">
              AquaMate provides intelligent water monitoring and analytics to help you optimize your aquaculture operations and ensure the health of your aquatic life.
            </p>
            <Button size="lg" asChild className="mt-8 transition-transform duration-300 hover:scale-105">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Succeed</h2>
              <p className="mt-4 text-muted-foreground md:text-lg">
                AquaMate is packed with powerful features to make managing your farm effortless and efficient.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center bg-card shadow-lg hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                      {feature.icon}
                    </div>
                    <CardTitle className="mt-4 !text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-card border-t">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Dive In?</h2>
            <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl mx-auto">
              Join hundreds of successful fish farmers who trust AquaMate. Start your journey towards a more productive and sustainable farm today.
            </p>
            <Button size="lg" asChild className="mt-8 transition-transform duration-300 hover:scale-105">
              <Link href="/signup">Start Your Free Trial</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

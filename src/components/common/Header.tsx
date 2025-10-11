import Link from 'next/link';
import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent absolute top-0 w-full z-10">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Droplets className="h-6 w-6" />
          <span className="text-xl font-bold">AquaMate</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="transition-all duration-300 ease-in-out hover:shadow-lg bg-white text-primary hover:bg-white/90">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

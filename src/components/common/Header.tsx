import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 bg-transparent absolute top-0 w-full z-10">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <Image src="/Aquamate.png" alt="AquaMate Logo" width={24} height={24} className="rounded-full" />
          <span className="text-xl font-bold">AquaMate</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#features" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Features</Link>
        </nav>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="transition-all duration-300 ease-in-out hover:shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

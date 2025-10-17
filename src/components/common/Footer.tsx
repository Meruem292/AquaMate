import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-card text-card-foreground mt-auto">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src="https://picsum.photos/seed/logo/24/24" alt="AquaMate Logo" width={24} height={24} className="rounded-full" data-ai-hint="logo fish" />
            <span className="text-xl font-bold">AquaMate</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AquaMate. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

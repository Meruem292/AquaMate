import { LoginForm } from '@/components/auth/LoginForm';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center py-24 px-4">
        <LoginForm />
      </main>
    </div>
  );
}

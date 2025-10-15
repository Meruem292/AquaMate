import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background-dark">
      <main className="flex-grow flex items-center justify-center py-24 px-4">
        <LoginForm />
      </main>
    </div>
  );
}

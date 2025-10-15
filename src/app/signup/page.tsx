import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background-dark">
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <SignupForm />
      </main>
    </div>
  );
}

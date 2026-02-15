import { LoginForm } from '@/components/auth/login-form';
import { AuroraBackground } from '@/components/aurora-background';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AuroraBackground />
      <div className="relative z-10 w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}

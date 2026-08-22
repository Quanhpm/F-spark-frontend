import { AuthShowcase } from "./auth-showcase";
import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <main className="grid min-h-svh min-w-0 grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] overflow-x-clip bg-surface font-sans max-[1024px]:block">
      <LoginForm />
      <AuthShowcase />
    </main>
  );
}

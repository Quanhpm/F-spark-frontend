import { AuthShowcase } from "./auth-showcase";
import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <main className="grid min-h-svh min-w-0 grid-cols-[minmax(560px,1fr)_minmax(560px,1fr)] overflow-x-clip bg-surface font-sans max-[1180px]:grid-cols-[minmax(500px,58%)_minmax(420px,42%)] max-[900px]:block">
      <LoginForm />
      <AuthShowcase />
    </main>
  );
}

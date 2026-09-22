import { LoginForm } from "./form"

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 bg-card border-2 border-border p-8 rounded-3xl shadow-flat animate-slide-in">
        <div className="text-center">
          <h1 className="text-3xl font-heading font-bold">Welcome Back</h1>
          <p className="mt-2 text-muted-foreground font-medium">Sign in to your account.</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  )
}

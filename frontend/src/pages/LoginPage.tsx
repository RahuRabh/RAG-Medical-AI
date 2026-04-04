import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../features/auth/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Sign in to manage your tasks across devices and sessions."
      submitLabel="Log In"
      onSubmit={async (email, password) => {
        await auth.login(email, password);
        toast.success("Logged in successfully");
        navigate("/dashboard");
      }}
      footer={
        <p>
          Need an account? <Link to="/register">Create one</Link>
        </p>
      }
    />
  );
}

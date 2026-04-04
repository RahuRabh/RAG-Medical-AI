import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../features/auth/useAuth";

export function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <AuthForm
      title="Create your account"
      subtitle="Register once, then add, edit, and track your tasks from the dashboard."
      submitLabel="Register"
      onSubmit={async (email, password) => {
        await auth.register(email, password);
        toast.success("Registration successful");
        navigate("/dashboard");
      }}
      footer={
        <p>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      }
    />
  );
}

import { useState } from "react";
import type { FormEvent } from "react";

import { useAuth } from "@/features/auth/context/useAuth";

import type { AuthMode } from "@/features/auth/component/AuthModal/AuthModal";

import { Button } from "@/components/ui/button/Button";
import { InputField } from "@/components/ui/InputField/InputField";
import { PasswordInput } from "@/components/ui/PasswordInput/PasswordInput";

import { sendOtpRequest, verifyOtpRequest } from "@/api/auth";

import styles from "./AuthForm.module.css";

type AuthFormProps = {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  onSuccess: () => void;
};

export function AuthForm({ onSuccess, mode, setMode }: AuthFormProps) {
  const { login, register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await register(name, email, password);
        onSuccess();
      } else if (mode === "login") {
        await login(email, password);
        onSuccess();
      } else if (mode === "forgot") {
        await sendOtpRequest(email);
        setMode("verify");
      } else if (mode === "verify") {
        await verifyOtpRequest({
          email,
          otp,
          newPassword: password,
        });
        setMode("login");
        setPassword("");
        setOtp("");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Something went wrong here. please try again!",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.authForm} onSubmit={handleSubmit}>
      {mode === "register" && (
        <InputField
          type="string"
          label={"Name"}
          value={name}
          onChange={setName}
          placeholder={"Enter Your Name"}
          required
        />
      )}

      {/* EMAIL: Shown in all states except during OTP verification */}
      {mode !== "verify" && (
        <InputField
          type="email"
          label={"Email"}
          value={email}
          onChange={setEmail}
          placeholder={"Enter Your Email id"}
          required
        />
      )}

      {/* OTP INPUT: Only shown during verification stage */}
      {mode === "verify" && (
        <InputField
          type="text"
          label={"Verification Code"}
          value={otp}
          onChange={setOtp}
          placeholder={"6-digit code"}
          required
          maxLength={6}
        />
      )}

      {/* PASSWORD / NEW PASSWORD: Hide only during the initial email OTP request stage */}
      {mode !== "forgot" && (
        <PasswordInput
          label={mode === "verify" ? "New Password" : "Password"}
          value={password}
          onChange={setPassword}
          placeholder={"Minimum 8 characters"}
          required
          minLength={8}
        />
      )}

      {/* FORGOT PASSWORD INLINE LINK BUTTON */}
      <div className={styles.buttonGroup}>
        {mode === "login" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setError("");
              setMode("forgot");
            }}
            className={styles.authButtons}
          >
            Forgot Password
          </Button>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="sm"
          className={`${styles.authButtons} ${isSubmitting ? styles.buttonLoading : ""}`}
        >
          {isSubmitting && <div className={styles.loader}></div>}
          <span className={styles.buttonText}>
            {mode === "login"
              ? "Log In"
              : mode === "register"
                ? "Register"
                : mode === "forgot"
                  ? "Get Code"
                  : "Save New Password"}
          </span>
        </Button>
      </div>

      {error ? <p className={styles.formError}>{error}</p> : null}
    </form>
  );
}

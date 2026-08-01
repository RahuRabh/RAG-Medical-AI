import React, { useState } from "react";

import { useAuth } from "@/features/auth/context/useAuth";
import { useSetting } from "@/features/settings/context/useSetting";

import { Button } from "@/components/ui/button/Button";
import { PasswordInput } from "@/components/ui/PasswordInput/PasswordInput";

import styles from "./Security.module.css";

export function Security() {
  const { updatePassword } = useAuth();
  const { closeView } = useSetting();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
      closeView();
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "Something went wrong. Please try again!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className={styles.modalContainer}>
      <Button
        size="icon"
        type="button"
        variant="ghost"
        onClick={() => closeView()}
        className={styles.xButton}
      >
        x
      </Button>

      <PasswordInput
        required
        minLength={8}
        value={currentPassword}
        label={"Current Password"}
        placeholder={"Enter Current Password"}
        onChange={(newValue) => setCurrentPassword(newValue)}
      />

      <PasswordInput
        required
        minLength={8}
        value={newPassword}
        label={"New Password"}
        placeholder={"Enter New Password"}
        onChange={(newValue) => setNewPassword(newValue)}
      />

      {error && <p className={styles.errorText}>{error}</p>}
      {isSubmitting && <div className={styles.loader}></div>}
      <Button
        size="sm"
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        className={styles.saveButton}
      >
        Change Password
      </Button>
    </form>
  );
}

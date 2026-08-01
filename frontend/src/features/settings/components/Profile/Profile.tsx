import { toast } from "sonner";
import React, { useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/useAuth";
import { useSetting } from "@/features/settings/context/useSetting";

import { Button } from "@/components/ui/button/Button";
import { Avatar } from "@/components/ui/Avatar/Avatar";
import { InputField } from "@/components/ui/InputField/InputField";

import styles from "./Profile.module.css";

export function Profile() {
  const { user, updateProfile } = useAuth();
  const { closeView } = useSetting();

  const [name, setName] = useState(user?.name || "");
  const [previewImage, setPreviewImage] = useState(user?.image || "");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ref to securely trigger hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }

    setError("");

    // save file for backend upload and generate URL for UI Preview
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await updateProfile({
        name: name,
        imageFile: imageFile,
      });
      closeView();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Something went wrong here. please try again!",
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
        className={styles.xButton}
        onClick={() => closeView()}
      >
        x
      </Button>

      <div className={styles.avatarSection}>
        <Avatar src={previewImage} name={name || "user profile"} size="xl" />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: "none" }}
        />

        <Button
          variant="ghost"
          size="icon"
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
        >
          ✎
        </Button>
      </div>

      <InputField
        type="text"
        label={"Display Name"}
        value={name}
        placeholder={"Your name"}
        onChange={(newValue) => setName(newValue)}
        disabled={isSubmitting}
      />

      <InputField
        type={"email"}
        label={"Email"}
        value={user?.email || "User Email"}
        placeholder={"Your Email"}
        onChange={() => {}}
        disabled={true}
      />

      {error && <p className={styles.errorText}>{error}</p>}
      {isSubmitting && <div className={styles.loader}></div>}
      
      <Button
        type="submit"
        variant="primary"
        className={styles.saveButton}
        disabled={isSubmitting}
      >
        Save Changes
      </Button>
    </form>
  );
}

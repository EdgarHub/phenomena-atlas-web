"use client";

import { useId, useState, type FormEvent } from "react";
import ui from "@/components/ui.module.css";
import { RequestFailed } from "@/lib/api/request";
import { profileFailureCopy } from "./profile-failure";
import { SignInLink } from "./sign-in-link";
import styles from "./account.module.css";

export interface ProfileValues {
  firstName: string;
  lastName: string;
  email: string;
}

interface ProfileFormProps {
  initial: ProfileValues;
  /** Writes the details. Throws RequestFailed when the API refuses or cannot be reached. */
  save: (values: ProfileValues) => Promise<void>;
  /** Called after a successful save, such as to close the form. */
  onSaved?: () => void;
  onCancel?: () => void;
  testId?: string;
}

/** First name, last name and email, saved together: either all of them change or none does. */
export function ProfileForm({ initial, save, onSaved, onCancel, testId }: ProfileFormProps) {
  const id = useId();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<RequestFailed | undefined>();

  const field = (name: keyof ProfileValues) => ({
    id: `${id}-${name}`,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setSaved(false);
      setValues((current) => ({ ...current, [name]: event.target.value }));
    },
    disabled: pending,
    required: true,
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
    };
    setValues(trimmed);
    setPending(true);
    setSaved(false);
    setFailure(undefined);
    try {
      await save(trimmed);
      setSaved(true);
      onSaved?.();
    } catch (error) {
      setFailure(error instanceof RequestFailed ? error : new RequestFailed(undefined, undefined));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.profileForm} onSubmit={(event) => void submit(event)} data-testid={testId}>
      <div className={styles.formField}>
        <label htmlFor={`${id}-firstName`} className={styles.filterLabel}>First name</label>
        <input className={styles.input} autoComplete="given-name" maxLength={100} {...field("firstName")} />
      </div>
      <div className={styles.formField}>
        <label htmlFor={`${id}-lastName`} className={styles.filterLabel}>Last name</label>
        <input className={styles.input} autoComplete="family-name" maxLength={100} {...field("lastName")} />
      </div>
      <div className={styles.formField}>
        <label htmlFor={`${id}-email`} className={styles.filterLabel}>Email</label>
        <input className={styles.input} type="email" autoComplete="email" maxLength={254} {...field("email")} />
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={ui.button} disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </button>
        {onCancel && (
          <button type="button" className={ui.button} onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        )}
      </div>

      {saved && (
        <p className={styles.successText} role="status">Details saved.</p>
      )}
      {failure && (
        <p className={styles.formError} role="alert">
          {profileFailureCopy(failure)}
          {failure.status === 401 && <> <SignInLink label="Sign in again" /></>}
        </p>
      )}
    </form>
  );
}

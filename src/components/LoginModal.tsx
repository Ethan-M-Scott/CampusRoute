'use client';

// Login form that authenticates the user and sends them into the dashboard.
import { signIn } from "../../auth-client";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { SCHOOLS } from '@/src/data/schools';

const LoginModal = ({dialog}: {dialog: HTMLDialogElement | null}) => {
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const onSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email")?.toString();
      const password = formData.get("password")?.toString();

      if (!email || !password) {
        setError("Email and password are required");
        return;
      }

      // Attempt to sign in using better-auth
      const { data, error: authError } = await signIn.email({
        email,
        password,
      });

      if (authError) {
        console.error("Better Auth sign-in error:", authError);
        setError(
          authError.message ||
          authError.code ||
          `could not sign in with the provided credentials${authError.status ? ` (${authError.status})` : ""}`
        );
        return;
      }

      dialog?.close();
      await new Promise((resolve) => setTimeout(resolve, 200));
      window.location.assign('/routes');
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || "could not sign in with the provided credentials");
    }
  }, [router, dialog]);

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md p-4 sm:p-8">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <label htmlFor="email">Email:</label>
      <input autoFocus id="email" name="email" type="email" placeholder="Enter Email" className="w-full min-w-0 mb-2 p-2 border rounded" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" placeholder="Enter Password" minLength={8} maxLength={128} className="w-full min-w-0 mb-4 p-2 border rounded" required />
      {error ? <span className="block break-words text-red-600 text-sm">{error}</span> : ""}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
        <button type="button" onClick={() => dialog?.close()} className="w-full sm:w-auto px-4 py-2 border rounded hover:bg-gray-100">
          Cancel
        </button>
        <button type="submit" className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Log In
        </button>
      </div>
    </form>
  );
};

export default LoginModal;
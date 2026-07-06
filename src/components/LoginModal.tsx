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
      window.location.href = '/routes';
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e.message || "could not sign in with the provided credentials");
    }
  }, [router, dialog]);

  return (
    <form onSubmit={onSubmit} className="p-8 w-96">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <label htmlFor="email">Email:</label>
      <input autoFocus id="email" name="email" type="email" placeholder="Enter Email" className="w-full mb-2 p-2 border rounded" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" placeholder="Enter Password" minLength={8} maxLength={128} className="w-full mb-4 p-2 border rounded" required />
      {error ? <span className="capitalize text-red-600 text-sm">{error}</span> : ""}
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={() => dialog?.close()} className="px-4 py-2 border rounded hover:bg-gray-100">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Log In
        </button>
      </div>
    </form>
  );
};

export default LoginModal;
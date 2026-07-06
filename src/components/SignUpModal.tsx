'use client';

// Sign-up form that captures the user's school before entering the dashboard.
import { signUp } from "../../auth-client";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { SCHOOLS } from "@/src/data/schools";
import { useAppState } from '@/src/components/AppStateContext';

const SignUpModal = ({dialog}: {dialog: HTMLDialogElement | null}) => {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const { setSelectedSchool } = useAppState();
  
  const [schoolSearch, setSchoolSearch] = useState("");
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const onSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email")?.toString();
      const name = formData.get("name")?.toString();
      let schoolId = formData.get("school")?.toString();
      const password = formData.get("password")?.toString();

      if (!schoolId && schoolSearch) {
        const match = SCHOOLS.find(s => s.name.toLowerCase() === schoolSearch.trim().toLowerCase() || s.id.toLowerCase() === schoolSearch.trim().toLowerCase());
        if (match) {
          schoolId = match.id;
        }
      }

      if (!email || !name || !password) {
        setError("All fields are required");
        return;
      }
      if (!schoolId) {
        setError("Please select a valid school from the list");
        return;
      }

      // Create account with better-auth
      const { data, error: authError } = await signUp.email({
        email,
        name,
        password,
        school: schoolId,
      } as any); 

      if (authError) {
        setError(authError.message || "account could not be created with the provided credentials");
        return;
      }

      // Set the school in app state
      const school = SCHOOLS.find((s) => s.id === schoolId);
      if (school) {
        setSelectedSchool(school);
      }

      dialog?.close();
      window.location.href = '/routes';
    } catch (e: unknown) {
      console.error("Sign up error:", e);
      setError(e instanceof Error ? e.message : "account could not be created with the provided credentials");
    }
  }, [router, setError, setSelectedSchool, dialog, schoolSearch]);
  
  const filteredSchools = SCHOOLS.filter(s => s.name.toLowerCase().includes(schoolSearch.toLowerCase()));

  return (
    <form onSubmit={onSubmit} className="p-8 w-96 min-h-[32rem]">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
      
      <label htmlFor="email">Email:</label>
      <input autoFocus id="email" name="email" type="email" placeholder="Enter Email" className="w-full mb-2 p-2 border rounded" required />
      
      <label htmlFor="name">Username:</label>
      <input id="name" name="name" placeholder="Enter Username" className="w-full mb-2 p-2 border rounded" required />
      
      <label htmlFor="school">School:</label>
      <div className="relative w-full mb-2">
        <input
          id="schoolSearch"
          type="text"
          placeholder="Search for your school..."
          className="w-full p-2 border rounded"
          value={schoolSearch}
          onChange={(e) => {
            setSchoolSearch(e.target.value);
            setIsSchoolDropdownOpen(true);
            setSelectedSchoolId("");
          }}
          onFocus={() => setIsSchoolDropdownOpen(true)}
          onBlur={() => setIsSchoolDropdownOpen(false)}
          required={!selectedSchoolId}
        />
        <input type="hidden" name="school" value={selectedSchoolId} />
        
        {isSchoolDropdownOpen && (
          <div 
            className="absolute z-10 w-full bg-white border rounded mt-1 max-h-48 overflow-y-auto shadow-lg"
            onMouseDown={(e) => e.preventDefault()}
          >
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school) => (
                <div 
                  key={school.id} 
                  className="p-2 hover:bg-blue-50 cursor-pointer" 
                  onMouseDown={(e) => { e.preventDefault(); setSchoolSearch(school.name); setSelectedSchoolId(school.id); setIsSchoolDropdownOpen(false); }}
                >
                  {school.name}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-500 italic">
                School Not in System
              </div>
            )}
          </div>
        )}
      </div>
      
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" placeholder="Enter Password" minLength={8} maxLength={128} className="w-full mb-4 p-2 border rounded" required />
      
      {error ? <span className="capitalize text-red-600 text-sm">{error}</span> : ""}
      
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={() => dialog?.close()} className="px-4 py-2 border rounded hover:bg-gray-100">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Sign Up
        </button>
      </div>
    </form>
  );
};

export default SignUpModal;

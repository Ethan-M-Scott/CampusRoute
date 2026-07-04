"use client";
// Lightweight redirect page that sends /home traffic back to the landing page.
import { useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return null;
}

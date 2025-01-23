"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import HeroSection from '../components/hero/HeroSection';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-start w-full">
      {/* HeroSection */}
      <HeroSection />
    </div>
  );
}
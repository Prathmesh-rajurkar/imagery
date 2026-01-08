'use client';
import { useSession } from "next-auth/react";
import Image from "next/image";

// oRINmhD7lzjmj5sA
export default function Home() {
  const { data: session } = useSession();
  console.log(session);
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      
    </div>
  );
}

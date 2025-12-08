"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateRoomPage() {
  const router = useRouter();

  useEffect(() => {
    const roomId = generateRoomCode();
    router.push(`/room/${roomId}`);
  }, [router]);

  return (
    <div className="flex items-center mt-20 text-5xl font-semibold mx-auto w-fit">
      Criando sala...
    </div>
  );
}

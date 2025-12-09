"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RetroGrid } from "@/components/ui/retro-grid";

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
    <div>
      <RetroGrid />
      <div className="flex items-center mt-16 text-5xl font-semibold mx-auto w-fit">
        Criando sala...
      </div>
    </div>
  );
}

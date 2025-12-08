"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Entrar em uma sala</h1>

      <input
        className="border border-white/70 p-2 rounded-lg w-40 text-center uppercase"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="X4P9K2"
      />

      <Button
        onClick={() => router.push(`/room/${code}`)}
        className="px-4 py-2 rounded-lg"
      >
        Entrar
      </Button>
    </div>
  );
}

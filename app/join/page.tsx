"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  return (
    <div className="flex flex-col items-center mt-16 gap-4">
      <h1 className="text-4xl font-bold">Entrar em uma sala</h1>

      <input
        className="border border-white/70 p-2 rounded-lg w-40 text-center uppercase"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="X4P9K2"
      />

      <Button
        onClick={() => router.push(`/room/${code}`)}
        className="h-12 w-24 text-2xl"
      >
        Entrar
      </Button>
    </div>
  );
}

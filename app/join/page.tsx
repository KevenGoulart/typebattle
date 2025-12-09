"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/ui/retro-grid";
import { AuroraText } from "@/components/ui/aurora-text";
import { TypingAnimation } from "@/components/ui/typing-animation";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  return (
    <div className="relative min-h-screen pt-12 w-full overflow-hidden">
      <RetroGrid />

      <div className="w-fit mx-auto flex flex-col items-center gap-4">
        <h1 className="font-bold text-6xl">
          <TypingAnimation>Entrar em uma sala</TypingAnimation>
        </h1>

        <input
          className="border border-white/50 p-2 rounded-2xl w-40 text-center uppercase"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="X4P9K2"
        />

        <Button
          onClick={() => router.push(`/room/${code}`)}
          className="h-12 w-24 text-2xl rounded-xl bg-slate-900 hover:bg-slate-300 border border-slate-600"
        >
          <AuroraText className="text-2xl font-semibold">Entrar</AuroraText>
        </Button>
      </div>
    </div>
  );
}

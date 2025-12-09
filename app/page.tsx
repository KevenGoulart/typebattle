import { AuroraText } from "@/components/ui/aurora-text";
import { Button } from "@/components/ui/button";
import { RetroGrid } from "@/components/ui/retro-grid";
import { TypingAnimation } from "@/components/ui/typing-animation";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen pt-12 w-full overflow-hidden">
      <RetroGrid />

      <div className="w-fit mx-auto flex flex-col items-center gap-4">
        <h1 className="font-bold text-7xl">
          <TypingAnimation>Typing Battle</TypingAnimation>
        </h1>
        <h2 className="text-xl font-medium max-w-[400px] text-center leading-6 text-white/85">
          Crie ou entre em uma sala para disputar quem digita mais rápido
        </h2>
        <img src="/typing.gif" className="rounded-[40px] w-[200px]" />
        <div className="flex items-center gap-4">
          <Button
            asChild
            className="h-12 w-20 text-2xl rounded-xl bg-slate-900 hover:bg-slate-300 border border-slate-600"
          >
            <Link href="/create">
              <AuroraText className="text-2xl font-semibold">Criar</AuroraText>
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 w-24 text-2xl rounded-xl bg-slate-900 hover:bg-slate-300 border border-slate-600"
          >
            <Link href="/join">
              <AuroraText className="text-2xl font-semibold">Entrar</AuroraText>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

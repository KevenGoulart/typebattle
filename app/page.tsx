import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center mt-16 gap-4">
      <h1 className="font-bold text-5xl">Typing Battle</h1>
      <h2 className="text-xl font-medium">
        Crie ou entre em uma sala para disputar quem digita mais rápido
      </h2>
      <img src="/typing.gif" className="rounded-[40px] w-[200px]" />
      <div className="flex items-center gap-4">
        <Button asChild className="h-12 w-20 text-2xl">
          <Link href="/create">Criar</Link>
        </Button>
        <Button asChild className="h-12 w-24 text-2xl">
          <Link href="/join">Entrar</Link>
        </Button>
      </div>
    </div>
  );
}

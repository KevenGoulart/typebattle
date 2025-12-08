import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Crie ou entre em uma sala</h1>
      <div className="flex items-center gap-4">
        <Button asChild>
          <Link href="/create">Criar</Link>
        </Button>
        <Button asChild>
          <Link href="/join">Entrar</Link>
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { WORDS } from "@/lib/words";
import { v4 as uuidv4 } from "uuid";

export default function RoomPage() {
  const { id } = useParams();
  const roomId = String(id);

  const [playerId, setPlayerId] = useState<string>("");
  const [opponent, setOpponent] = useState<any>(null);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const currentWord = WORDS[currentWordIndex];

  const [winner, setWinner] = useState<string | null>(null);

  // ✅ Criar jogador ao entrar na sala
  useEffect(() => {
    const join = async () => {
      const id = uuidv4();
      setPlayerId(id);

      // cria sala se não existir
      await supabase.from("rooms").upsert({
        id: roomId,
      });

      // cria player
      await supabase.from("players").insert({
        id,
        room_id: roomId,
        username: "Player",
      });
    };

    join();

    return () => {
      if (playerId) {
        supabase.from("players").delete().eq("id", playerId);
      }
    };
  }, []);

  // ✅ Realtime - escuta mudanças dos players
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const player = payload.new as any;

          if (player.id !== playerId) {
            setOpponent(player);

            if (player.finished) {
              setWinner("opponent");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId]);

  // ✅ Quando digitar
  const handleChange = async (e: any) => {
    const value = e.target.value;

    if (!currentWord) return;

    // Limita ao tamanho da palavra
    if (value.length > currentWord.length) return;

    setInput(value);

    // Atualiza progresso no banco
    await supabase
      .from("players")
      .update({
        word_index: currentWordIndex,
        letter_index: value.length,
      })
      .eq("id", playerId);

    // ✅ Se acertou a palavra inteira
    if (value === currentWord) {
      if (currentWordIndex + 1 === WORDS.length) {
        // FINALIZOU
        await supabase
          .from("players")
          .update({ finished: true })
          .eq("id", playerId);

        setWinner("you");
      } else {
        // Avança para próxima palavra
        setCurrentWordIndex((prev) => prev + 1);
        setInput("");
      }
    }
  };

  // ✅ renderizar palavra com letras coloridas
  function renderWord(word: string, typed: string) {
    return word.split("").map((char, index) => {
      let color = "text-gray-400";

      if (index < typed.length) {
        if (typed[index] === char) {
          color = "text-yellow-500";
        } else {
          color = "text-red-500";
        }
      }

      return (
        <span key={index} className={`${color} text-4xl font-bold`}>
          {char}
        </span>
      );
    });
  }

  return (
    <div className="min-h-screen p-10 bg-black text-white">
      <h1 className="text-xl mb-6">Sala: {roomId}</h1>

      {winner && (
        <h2 className="text-3xl mb-6 text-green-400">
          {winner === "you" ? "✅ VOCÊ GANHOU!" : "❌ O OPONENTE GANHOU"}
        </h2>
      )}

      <div className="grid grid-cols-2 gap-10">
        {/* SEU LADO */}
        <div className="p-6 border rounded-xl">
          <h2 className="mb-4 text-xl">Você</h2>

          <div className="mb-4">
            {currentWord && renderWord(currentWord, input)}
          </div>

          <input
            className="w-full p-3 text-black text-lg"
            value={input}
            onChange={handleChange}
            disabled={!!winner}
          />

          <p className="mt-4">
            Palavra: {currentWordIndex + 1} / {WORDS.length}
          </p>
        </div>

        {/* OPONENTE */}
        <div className="p-6 border rounded-xl">
          <h2 className="mb-4 text-xl">Oponente</h2>

          {opponent ? (
            <>
              <div className="mb-4">
                {renderWord(
                  WORDS[opponent.word_index] || "",
                  (WORDS[opponent.word_index] || "").slice(
                    0,
                    opponent.letter_index
                  )
                )}
              </div>

              <p>
                Palavra: {opponent.word_index + 1} / {WORDS.length}
              </p>
            </>
          ) : (
            <p>Aguardando oponente entrar...</p>
          )}
        </div>
      </div>
    </div>
  );
}

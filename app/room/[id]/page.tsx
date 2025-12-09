"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ALL_WORDS } from "@/lib/words";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { FaCopy } from "react-icons/fa";
import { RetroGrid } from "@/components/ui/retro-grid";
import { AuroraText } from "@/components/ui/aurora-text";

export default function RoomPage() {
  const { id } = useParams();
  const roomId = String(id);

  const [playerId, setPlayerId] = useState<string>("");
  const [opponent, setOpponent] = useState<any>(null);

  const [ready, setReady] = useState(false);
  const [roomStatus, setRoomStatus] = useState("waiting");

  const [WORDS, setWORDS] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const currentWord = WORDS[currentWordIndex];

  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const join = async () => {
      const id = uuidv4();
      setPlayerId(id);

      const { data: roomData } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      let words: string[] = [];

      if (!roomData) {
        const shuffled = [...ALL_WORDS].sort(() => Math.random() - 0.5);
        words = shuffled.slice(0, 10);

        await supabase.from("rooms").upsert({
          id: roomId,
          status: "waiting",
          words,
        });
      } else {
        words = roomData.words;
      }

      setWORDS(words);

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

  useEffect(() => {
    const channelPlayers = supabase
      .channel(`room:${roomId}:players`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const player = payload.new as any;

          if (player.id !== playerId) {
            setOpponent(player);
          }

          if (player.finished && player.id !== playerId) {
            setWinner("opponent");
          }

          if (payload.eventType === "UPDATE") {
            const { data: players } = await supabase
              .from("players")
              .select("*")
              .eq("room_id", roomId);

            const bothReady =
              players?.length === 2 && players.every((p) => p.ready === true);

            if (bothReady) {
              await supabase
                .from("rooms")
                .update({
                  status: "playing",
                })
                .eq("id", roomId);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelPlayers);
    };
  }, [playerId]);

  useEffect(() => {
    const channelRoom = supabase
      .channel(`room:${roomId}:room`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        async (payload) => {
          const room = payload.new as any;
          setRoomStatus(room.status);
          if (room.words) setWORDS(room.words);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelRoom);
    };
  }, []);

  const handleChange = async (e: any) => {
    if (roomStatus !== "playing") return;

    const value = e.target.value;
    if (!currentWord) return;
    if (value.length > currentWord.length) return;

    setInput(value);

    await supabase
      .from("players")
      .update({
        word_index: currentWordIndex,
        letter_index: value.length,
      })
      .eq("id", playerId);

    if (value === currentWord) {
      if (currentWordIndex + 1 === WORDS.length) {
        await supabase
          .from("players")
          .update({ finished: true })
          .eq("id", playerId);

        setWinner("you");
      } else {
        setCurrentWordIndex((prev) => prev + 1);
        setInput("");
      }
    }
  };

  function renderWord(word: string, typed: string) {
    return word.split("").map((char, index) => {
      let color = "text-gray-500";

      if (index < typed.length) {
        if (typed[index] === char) color = "text-yellow-500";
        else color = "text-red-500";
      }

      return (
        <span key={index} className={`${color} text-5xl font-bold`}>
          {char}
        </span>
      );
    });
  }

  return (
    <div>
      <RetroGrid />
      <div className="min-h-screen p-10 bg-black/60 text-white">
        <h1 className="text-2xl font-semibold mb-6">
          Sala:
          <Button
            onClick={async () => {
              await navigator.clipboard.writeText(roomId);
            }}
            className="bg-blue-900 hover:bg-blue-800 cursor-pointer px-2 py-3 rounded-lg text-xl text-white/85 font-bold ml-2"
          >
            <FaCopy /> {roomId}
          </Button>
        </h1>

        {winner && (
          <h2
            className={`text-3xl mb-6 w-fit mx-auto font-bold ${
              winner === "you" ? "text-green-400" : "text-red-400"
            }`}
          >
            {winner === "you" ? "✅ VOCÊ GANHOU!" : "❌ O OPONENTE GANHOU"}
          </h2>
        )}

        <div className="grid grid-cols-2 gap-10">
          <div className="p-6 border border-white/50 rounded-2xl">
            <h2 className="mb-4 text-xl font-semibold">Você</h2>

            <div className="mb-4">
              {currentWord && renderWord(currentWord, input)}
            </div>

            <input
              className="w-full p-3 text-white border border-white/50 rounded-lg text-lg"
              value={input}
              onChange={handleChange}
              disabled={roomStatus !== "playing" || !!winner}
            />

            <p className="mt-4 font-semibold">
              Palavra: {currentWordIndex + 1} / {WORDS.length}
            </p>
          </div>

          <div className="p-6 border border-white/50 rounded-2xl">
            <h2 className="mb-4 text-xl font-semibold">Oponente</h2>

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

                <p className="font-semibold">
                  Palavra: {opponent.word_index + 1} / {WORDS.length}
                </p>
              </>
            ) : (
              <p>Aguardando oponente entrar...</p>
            )}
          </div>
        </div>

        {roomStatus === "waiting" && (
          <div className="mt-4 mx-auto w-fit">
            <Button
              onClick={async () => {
                setReady(true);
                await supabase
                  .from("players")
                  .update({ ready: true })
                  .eq("id", playerId);
              }}
              className="h-12 w-fit text-2xl rounded-xl bg-slate-800 hover:bg-slate-600 border border-slate-600 cursor-pointer"
              disabled={ready}
            >
              <AuroraText className="text-2xl font-semibold">
                {ready ? "Aguardando oponente..." : "Estou pronto!"}
              </AuroraText>
            </Button>
          </div>
        )}

        {winner && (
          <div className="w-fit mx-auto mt-6">
            <Button
              onClick={async () => {
                // 1. Gerar novas palavras
                const shuffled = [...ALL_WORDS].sort(() => Math.random() - 0.5);
                const newWords = shuffled.slice(0, 10);

                // 2. Atualizar a sala com palavras novas e status "waiting"
                await supabase
                  .from("rooms")
                  .update({
                    status: "waiting",
                    words: newWords, // <---- Atualizando aqui
                  })
                  .eq("id", roomId);

                // 3. Resetar todos os jogadores da sala
                await supabase
                  .from("players")
                  .update({
                    ready: false,
                    finished: false,
                    word_index: 0,
                    letter_index: 0,
                  })
                  .eq("room_id", roomId);

                // 4. Resetar estado local
                setWinner(null);
                setReady(false);
                setCurrentWordIndex(0);
                setInput("");
                setWORDS(newWords); // <---- atualizar localmente
              }}
              className="bg-blue-900 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-xl font-bold"
            >
              🔁 Jogar Novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

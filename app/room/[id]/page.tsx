"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { WORDS } from "@/lib/words";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";

export default function RoomPage() {
  const { id } = useParams();
  const roomId = String(id);

  const [playerId, setPlayerId] = useState<string>("");
  const [opponent, setOpponent] = useState<any>(null);

  const [ready, setReady] = useState(false);
  const [roomStatus, setRoomStatus] = useState("waiting");
  const [countdown, setCountdown] = useState<number | null>(null);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const currentWord = WORDS[currentWordIndex];

  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const join = async () => {
      const id = uuidv4();
      setPlayerId(id);

      await supabase.from("rooms").upsert({
        id: roomId,
        status: "waiting",
      });

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

          if (player.finished) {
            setWinner("opponent");
          }

          if (payload.eventType === "UPDATE") {
            const { data: players } = await supabase
              .from("players")
              .select("*")
              .eq("room_id", roomId);

            if (
              players?.length === 2 &&
              players.every((p) => p.ready === true)
            ) {
              await supabase
                .from("rooms")
                .update({
                  status: "countdown",
                  countdown: 3,
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
          setCountdown(room.countdown);

          if (
            payload.eventType === "UPDATE" &&
            room.status === "countdown" &&
            payload.old.countdown !== room.countdown &&
            room.countdown === 3
          ) {
            setTimeout(async () => {
              const n = room.countdown - 1;

              await supabase
                .from("rooms")
                .update({
                  countdown: n,
                  status: n === 0 ? "playing" : "countdown",
                })
                .eq("id", roomId);
            }, 1000);
          }
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
    <div className="min-h-screen p-10 bg-black/60 text-white">
      <h1 className="text-2xl font-semibold mb-6">Sala: {roomId}</h1>

      {winner && (
        <h2 className="text-3xl mb-6 w-fit mx-auto font-bold text-green-400">
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
            className="bg-green-800 h-12 cursor-pointer hover:bg-green-600 text-white px-6 py-3 rounded-lg text-xl font-bold"
            disabled={ready}
          >
            {ready ? "Aguardando oponente..." : "Estou pronto!"}
          </Button>
        </div>
      )}

      {roomStatus === "countdown" && (
        <h2 className="text-5xl font-bold mt-4 mx-auto w-fit text-yellow-400">
          {countdown}
        </h2>
      )}
    </div>
  );
}

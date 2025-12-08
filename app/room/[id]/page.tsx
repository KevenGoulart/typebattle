"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket-client";
import { useParams } from "next/navigation";

const WORDS = [
  "typescript",
  "socket",
  "react",
  "component",
  "hook",
  "javascript",
  "context",
  "frontend",
  "backend",
  "deploy",
];

export default function RoomPage() {
  const { id } = useParams();
  const roomId = String(id);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState<number | null>(null);

  const [myIndex, setMyIndex] = useState(0);
  const [myInput, setMyInput] = useState("");

  const [opponentIndex, setOpponentIndex] = useState(0);
  const [opponentInput, setOpponentInput] = useState("");

  const myWord = WORDS[myIndex];
  const opponentWord = WORDS[opponentIndex];

  useEffect(() => {
    socket.emit("join-room", {
      roomId,
      username: "Player",
    });

    socket.on("opponent-typing", ({ progress }) => {
      setOpponentInput(progress);
    });

    socket.on("opponent-advanced", ({ index }) => {
      setOpponentIndex(index);
      setOpponentInput("");
    });

    socket.on("opponent-finished", () => {
      alert(`Oponente terminou`);
    });

    return () => {
      socket.off("opponent-typing");
      socket.off("opponent-advanced");
      socket.off("opponent-finished");
    };
  }, [roomId]);

  function onType(e: any) {
    const value = e.target.value;

    if (!startTime) {
      setStartTime(Date.now());
    }

    setMyInput(value);

    socket.emit("typing", {
      roomId,
      index: myIndex,
      progress: value,
    });

    if (value === myWord) {
      const nextIndex = myIndex + 1;

      if (nextIndex === WORDS.length) {
        const minutes = (Date.now() - startTime!) / 60000;
        const words = WORDS.join(" ").length / 5;
        const calcWpm = Math.floor(words / minutes);

        setWpm(calcWpm);

        socket.emit("finish", {
          roomId,
          wpm: calcWpm,
        });

        return;
      }

      setMyIndex(nextIndex);
      setMyInput("");

      socket.emit("advance", {
        roomId,
        index: nextIndex,
      });
    }
  }

  function renderHighlightedWord(word: string, input: string = "") {
    return word.split("").map((char, index) => {
      let color = "text-gray-400";

      if (index < input.length) {
        if (input[index] === char) {
          color = "text-yellow-500";
        } else {
          color = "text-red-500";
        }
      }

      return (
        <span key={index} className={`text-3xl font-bold ${color}`}>
          {char}
        </span>
      );
    });
  }

  return (
    <div className="p-10 min-h-screen bg-neutral-950 text-white">
      <h1 className="text-2xl font-bold mb-8 text-center">Sala: {roomId}</h1>

      <div className="grid grid-cols-2 gap-10">
        <div className="border p-6 rounded-lg space-y-4">
          <h2 className="text-xl font-bold text-center">Você</h2>
          <p className="text-center text-sm">
            Palavra {myIndex + 1} / {WORDS.length}
          </p>

          <div className="flex gap-1 justify-center mb-4">
            {renderHighlightedWord(myWord, myInput)}
          </div>

          <textarea
            className="border w-full p-4 bg-black border-white/50 rounded focus:outline-none"
            value={myInput}
            onChange={onType}
            disabled={!!wpm}
          />
        </div>

        <div className="border p-6 rounded-lg space-y-4 opacity-80">
          <h2 className="text-xl font-bold text-center">Oponente</h2>
          <p className="text-center text-sm">
            Palavra {opponentIndex + 1} / {WORDS.length}
          </p>

          <div className="flex gap-1 justify-center mb-4">
            {renderHighlightedWord(opponentWord, opponentInput)}
          </div>
        </div>
      </div>

      {wpm && (
        <h2 className="text-3xl mt-10 font-bold text-center text-green-500">
          🎉 Você venceu
        </h2>
      )}
    </div>
  );
}

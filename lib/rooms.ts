type Room = {
  users: string[];
  text: string;
  status: "waiting" | "playing" | "finished";
};

export const rooms = new Map<string, Room>();

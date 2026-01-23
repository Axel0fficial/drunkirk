import { Challenge } from "./models";

export const CHALLENGES: Challenge[] = [
  {
    id: "take_sips",
    text: "Take {n} sips",
    difficulty: "easy",
    quantity: { min: 1, max: 3 },
  },
  {
    id: "give_sips",
    text: "Give {n} sips",
    difficulty: "easy",
    quantity: { min: 1, max: 3 },
  },
  {
    id: "take_big_sips",
    text: "Take {n} sips",
    difficulty: "normal",
    quantity: { min: 3, max: 6 },
  },
  {
    id: "everyone_drinks",
    text: "Everyone drinks {n} sips",
    difficulty: "normal",
    quantity: { min: 1, max: 2 },
  },
  {
    id: "finish_drink",
    text: "Finish your drink",
    difficulty: "hard",
  },
];

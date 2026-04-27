export type CharacterCard = {
  id: string;
  name: string;
  description?: string;
  systemPrompt?: string;
};

export const characters: CharacterCard[] = [];


export interface Board {
  id: number;
  title: string;
  background: string;
  created_at: Date;
  updated_at: Date;
}

export interface List {
  id: number;
  title: string;
  position: number;
  board_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  position: number;
  list_id: number;
  due_date: Date | null;
  labels: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CardMember {
  id: number;
  card_id: number;
  user_id: string;
  created_at: Date;
}

export interface BoardWithLists extends Board {
  lists: ListWithCards[];
}

export interface ListWithCards extends List {
  cards: CardWithMembers[];
}

export interface CardWithMembers extends Card {
  members: string[];
}

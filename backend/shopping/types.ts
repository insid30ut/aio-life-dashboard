export interface ShoppingList {
  id: number;
  title: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingItem {
  id: number;
  name: string;
  is_checked: boolean;
  list_id: number;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingListWithItems extends ShoppingList {
  items: ShoppingItem[];
}

import Dexie, { type Table } from "dexie";

export interface User {
  id?: number;
  email: string;
  password: string;
  name?: string;
  region: string;
  currency: string;
  createdAt: Date;
}

export interface Expense {
  id?: number;
  userId: number;
  amount: number;
  description?: string;
  date: Date;
  categoryId: number;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  region?: string;
}

class PiggyBankDB extends Dexie {
  users!: Table<User>;
  expenses!: Table<Expense>;
  categories!: Table<Category>;

  constructor() {
    super("PiggyBankDB");
    this.version(1).stores({
      users: "++id, email, name, region",
      expenses: "++id, userId, categoryId, date, [userId+date]",
      categories: "++id, name, region",
    });
  }
}

export const db = new PiggyBankDB();

import { users } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Types based on the existing users table
export type User = typeof users.$inferSelect;
export type UpsertUser = {
  id?: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
}

export const authStorage = new AuthStorage();

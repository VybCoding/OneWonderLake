import {
  users,
  interestedParties,
  type User,
  type UpsertUser,
  type InterestedParty,
  type InsertInterestedParty,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Interested parties operations
  createInterestedParty(party: InsertInterestedParty): Promise<InterestedParty>;
  getInterestedParties(): Promise<InterestedParty[]>;
  getInterestedPartyByEmail(email: string): Promise<InterestedParty | undefined>;
  markEmailSent(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Interested parties operations
  async createInterestedParty(party: InsertInterestedParty): Promise<InterestedParty> {
    const [newParty] = await db
      .insert(interestedParties)
      .values(party)
      .returning();
    return newParty;
  }

  async getInterestedParties(): Promise<InterestedParty[]> {
    return await db
      .select()
      .from(interestedParties)
      .orderBy(desc(interestedParties.createdAt));
  }

  async getInterestedPartyByEmail(email: string): Promise<InterestedParty | undefined> {
    const [party] = await db
      .select()
      .from(interestedParties)
      .where(eq(interestedParties.email, email));
    return party;
  }

  async markEmailSent(id: string): Promise<void> {
    await db
      .update(interestedParties)
      .set({ emailSent: true })
      .where(eq(interestedParties.id, id));
  }
}

export const storage = new DatabaseStorage();

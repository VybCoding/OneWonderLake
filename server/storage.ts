import {
  users,
  interestedParties,
  searchedAddresses,
  communityQuestions,
  dynamicFaqs,
  type User,
  type UpsertUser,
  type InterestedParty,
  type InsertInterestedParty,
  type SearchedAddress,
  type InsertSearchedAddress,
  type CommunityQuestion,
  type InsertCommunityQuestion,
  type DynamicFaq,
  type InsertDynamicFaq,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

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
  
  // Searched addresses operations
  createSearchedAddress(address: InsertSearchedAddress): Promise<SearchedAddress>;
  getSearchedAddresses(): Promise<SearchedAddress[]>;
  
  // Community questions operations
  createCommunityQuestion(question: InsertCommunityQuestion): Promise<CommunityQuestion>;
  getCommunityQuestions(): Promise<CommunityQuestion[]>;
  getCommunityQuestionById(id: string): Promise<CommunityQuestion | undefined>;
  answerCommunityQuestion(id: string, answer: string, editedQuestion?: string, editedCategory?: string): Promise<CommunityQuestion | undefined>;
  deleteCommunityQuestion(id: string): Promise<void>;
  publishQuestionToFaq(id: string): Promise<DynamicFaq | undefined>;
  
  // Dynamic FAQs operations
  getDynamicFaqs(): Promise<DynamicFaq[]>;
  createDynamicFaq(faq: InsertDynamicFaq): Promise<DynamicFaq>;
  incrementFaqViewCount(id: string): Promise<void>;
  markFaqNotNew(id: string): Promise<void>;
  deleteDynamicFaq(id: string): Promise<void>;
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

  // Searched addresses operations
  async createSearchedAddress(address: InsertSearchedAddress): Promise<SearchedAddress> {
    const [newAddress] = await db
      .insert(searchedAddresses)
      .values(address)
      .returning();
    return newAddress;
  }

  async getSearchedAddresses(): Promise<SearchedAddress[]> {
    return await db
      .select()
      .from(searchedAddresses)
      .orderBy(desc(searchedAddresses.createdAt));
  }

  // Community questions operations
  async createCommunityQuestion(question: InsertCommunityQuestion): Promise<CommunityQuestion> {
    const [newQuestion] = await db
      .insert(communityQuestions)
      .values(question)
      .returning();
    return newQuestion;
  }

  async getCommunityQuestions(): Promise<CommunityQuestion[]> {
    return await db
      .select()
      .from(communityQuestions)
      .orderBy(desc(communityQuestions.createdAt));
  }

  async getCommunityQuestionById(id: string): Promise<CommunityQuestion | undefined> {
    const [question] = await db
      .select()
      .from(communityQuestions)
      .where(eq(communityQuestions.id, id));
    return question;
  }

  async answerCommunityQuestion(id: string, answer: string, editedQuestion?: string, editedCategory?: string): Promise<CommunityQuestion | undefined> {
    const updateData: any = { 
      answer, 
      status: "answered",
      answeredAt: new Date() 
    };
    
    if (editedQuestion && editedQuestion.trim().length > 0) {
      updateData.question = editedQuestion.trim();
    }
    
    if (editedCategory && ["general", "taxes", "property_rights", "services"].includes(editedCategory)) {
      updateData.category = editedCategory;
    }
    
    const [updated] = await db
      .update(communityQuestions)
      .set(updateData)
      .where(eq(communityQuestions.id, id))
      .returning();
    return updated;
  }

  async deleteCommunityQuestion(id: string): Promise<void> {
    await db
      .delete(communityQuestions)
      .where(eq(communityQuestions.id, id));
  }

  async publishQuestionToFaq(id: string): Promise<DynamicFaq | undefined> {
    const question = await this.getCommunityQuestionById(id);
    if (!question || !question.answer) {
      return undefined;
    }
    
    const [faq] = await db
      .insert(dynamicFaqs)
      .values({
        question: question.question,
        answer: question.answer,
        category: question.category,
        sourceQuestionId: question.id,
      })
      .returning();
    
    await db
      .update(communityQuestions)
      .set({ status: "published" })
      .where(eq(communityQuestions.id, id));
    
    return faq;
  }

  // Dynamic FAQs operations
  async getDynamicFaqs(): Promise<DynamicFaq[]> {
    return await db
      .select()
      .from(dynamicFaqs)
      .orderBy(desc(dynamicFaqs.createdAt));
  }

  async createDynamicFaq(faq: InsertDynamicFaq): Promise<DynamicFaq> {
    const [newFaq] = await db
      .insert(dynamicFaqs)
      .values(faq)
      .returning();
    return newFaq;
  }

  async incrementFaqViewCount(id: string): Promise<void> {
    await db
      .update(dynamicFaqs)
      .set({ viewCount: sql`${dynamicFaqs.viewCount} + 1` })
      .where(eq(dynamicFaqs.id, id));
  }

  async markFaqNotNew(id: string): Promise<void> {
    await db
      .update(dynamicFaqs)
      .set({ isNew: false })
      .where(eq(dynamicFaqs.id, id));
  }

  async deleteDynamicFaq(id: string): Promise<void> {
    await db
      .delete(dynamicFaqs)
      .where(eq(dynamicFaqs.id, id));
  }
}

export const storage = new DatabaseStorage();

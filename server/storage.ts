import {
  users,
  interestedParties,
  searchedAddresses,
  communityQuestions,
  dynamicFaqs,
  emailCorrespondence,
  inboundEmails,
  emailUsage,
  contacts,
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
  type EmailCorrespondence,
  type InsertEmailCorrespondence,
  type InboundEmail,
  type InsertInboundEmail,
  type EmailUsage,
  type InsertEmailUsage,
  type Contact,
  type InsertContact,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Interested parties operations
  createInterestedParty(party: InsertInterestedParty & { unsubscribeToken: string }): Promise<InterestedParty>;
  getInterestedParties(): Promise<InterestedParty[]>;
  getInterestedPartyByEmail(email: string): Promise<InterestedParty | undefined>;
  getInterestedPartyByToken(token: string): Promise<InterestedParty | undefined>;
  markEmailSent(id: string): Promise<void>;
  unsubscribeParty(token: string): Promise<boolean>;
  
  // Searched addresses operations
  createSearchedAddress(address: InsertSearchedAddress): Promise<SearchedAddress>;
  getSearchedAddresses(): Promise<SearchedAddress[]>;
  
  // Community questions operations
  createCommunityQuestion(question: InsertCommunityQuestion & { unsubscribeToken: string }): Promise<CommunityQuestion>;
  getCommunityQuestions(): Promise<CommunityQuestion[]>;
  getCommunityQuestionById(id: string): Promise<CommunityQuestion | undefined>;
  getCommunityQuestionByToken(token: string): Promise<CommunityQuestion | undefined>;
  answerCommunityQuestion(id: string, answer: string, editedQuestion?: string, editedCategory?: string): Promise<CommunityQuestion | undefined>;
  deleteCommunityQuestion(id: string): Promise<void>;
  publishQuestionToFaq(id: string): Promise<DynamicFaq | undefined>;
  unsubscribeQuestion(token: string): Promise<boolean>;
  
  // Dynamic FAQs operations
  getDynamicFaqs(): Promise<DynamicFaq[]>;
  createDynamicFaq(faq: InsertDynamicFaq): Promise<DynamicFaq>;
  incrementFaqViewCount(id: string): Promise<void>;
  markFaqNotNew(id: string): Promise<void>;
  deleteDynamicFaq(id: string): Promise<void>;
  
  // Email correspondence operations
  createEmailCorrespondence(email: InsertEmailCorrespondence): Promise<EmailCorrespondence>;
  getEmailCorrespondence(): Promise<EmailCorrespondence[]>;
  getEmailCorrespondenceByRelated(relatedType: string, relatedId: string): Promise<EmailCorrespondence[]>;
  
  // Inbound email operations
  createInboundEmail(email: InsertInboundEmail): Promise<InboundEmail>;
  getInboundEmails(): Promise<InboundEmail[]>;
  getInboundEmailById(id: string): Promise<InboundEmail | undefined>;
  getInboundEmailByResendId(resendEmailId: string): Promise<InboundEmail | undefined>;
  markInboundEmailRead(id: string): Promise<void>;
  markInboundEmailReplied(id: string, replyEmailId: string): Promise<void>;
  
  // Email usage tracking operations
  getOrCreateEmailUsage(month: string): Promise<EmailUsage>;
  incrementSentCount(month: string): Promise<EmailUsage>;
  incrementReceivedCount(month: string): Promise<EmailUsage>;
  getCurrentMonthUsage(): Promise<EmailUsage>;
  setEmailShutoff(month: string, isShutoff: boolean): Promise<void>;
  
  // Contact operations
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  getContactById(id: string): Promise<Contact | undefined>;
  getContactByEmail(email: string): Promise<Contact | undefined>;
  updateContact(id: string, updates: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<void>;
  
  // Additional inbound email operations
  deleteInboundEmail(id: string): Promise<void>;
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
  async createInterestedParty(party: InsertInterestedParty & { unsubscribeToken: string }): Promise<InterestedParty> {
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

  async getInterestedPartyByToken(token: string): Promise<InterestedParty | undefined> {
    const [party] = await db
      .select()
      .from(interestedParties)
      .where(eq(interestedParties.unsubscribeToken, token));
    return party;
  }

  async markEmailSent(id: string): Promise<void> {
    await db
      .update(interestedParties)
      .set({ emailSent: true })
      .where(eq(interestedParties.id, id));
  }

  async unsubscribeParty(token: string): Promise<boolean> {
    const result = await db
      .update(interestedParties)
      .set({ unsubscribed: true })
      .where(eq(interestedParties.unsubscribeToken, token))
      .returning();
    return result.length > 0;
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
  async createCommunityQuestion(question: InsertCommunityQuestion & { unsubscribeToken: string }): Promise<CommunityQuestion> {
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

  async getCommunityQuestionByToken(token: string): Promise<CommunityQuestion | undefined> {
    const [question] = await db
      .select()
      .from(communityQuestions)
      .where(eq(communityQuestions.unsubscribeToken, token));
    return question;
  }

  async unsubscribeQuestion(token: string): Promise<boolean> {
    const result = await db
      .update(communityQuestions)
      .set({ unsubscribed: true })
      .where(eq(communityQuestions.unsubscribeToken, token))
      .returning();
    return result.length > 0;
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

  // Email correspondence operations
  async createEmailCorrespondence(email: InsertEmailCorrespondence): Promise<EmailCorrespondence> {
    const [newEmail] = await db
      .insert(emailCorrespondence)
      .values(email)
      .returning();
    return newEmail;
  }

  async getEmailCorrespondence(): Promise<EmailCorrespondence[]> {
    return await db
      .select()
      .from(emailCorrespondence)
      .orderBy(desc(emailCorrespondence.createdAt));
  }

  async getEmailCorrespondenceByRelated(relatedType: string, relatedId: string): Promise<EmailCorrespondence[]> {
    return await db
      .select()
      .from(emailCorrespondence)
      .where(eq(emailCorrespondence.relatedType, relatedType))
      .orderBy(desc(emailCorrespondence.createdAt));
  }

  // Inbound email operations
  async createInboundEmail(email: InsertInboundEmail): Promise<InboundEmail> {
    const [newEmail] = await db
      .insert(inboundEmails)
      .values(email)
      .returning();
    return newEmail;
  }

  async getInboundEmails(): Promise<InboundEmail[]> {
    return await db
      .select()
      .from(inboundEmails)
      .orderBy(desc(inboundEmails.receivedAt));
  }

  async getInboundEmailById(id: string): Promise<InboundEmail | undefined> {
    const [email] = await db
      .select()
      .from(inboundEmails)
      .where(eq(inboundEmails.id, id));
    return email;
  }

  async getInboundEmailByResendId(resendEmailId: string): Promise<InboundEmail | undefined> {
    const [email] = await db
      .select()
      .from(inboundEmails)
      .where(eq(inboundEmails.resendEmailId, resendEmailId));
    return email;
  }

  async markInboundEmailRead(id: string): Promise<void> {
    await db
      .update(inboundEmails)
      .set({ isRead: true })
      .where(eq(inboundEmails.id, id));
  }

  async markInboundEmailReplied(id: string, replyEmailId: string): Promise<void> {
    await db
      .update(inboundEmails)
      .set({ isReplied: true, replyEmailId })
      .where(eq(inboundEmails.id, id));
  }

  // Email usage tracking operations
  async getOrCreateEmailUsage(month: string): Promise<EmailUsage> {
    const [existing] = await db
      .select()
      .from(emailUsage)
      .where(eq(emailUsage.month, month));
    
    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(emailUsage)
      .values({ month, sentCount: 0, receivedCount: 0, isShutoff: false })
      .returning();
    return created;
  }

  async incrementSentCount(month: string): Promise<EmailUsage> {
    await this.getOrCreateEmailUsage(month);
    
    const [updated] = await db
      .update(emailUsage)
      .set({ 
        sentCount: sql`${emailUsage.sentCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(emailUsage.month, month))
      .returning();
    return updated;
  }

  async incrementReceivedCount(month: string): Promise<EmailUsage> {
    await this.getOrCreateEmailUsage(month);
    
    const [updated] = await db
      .update(emailUsage)
      .set({ 
        receivedCount: sql`${emailUsage.receivedCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(emailUsage.month, month))
      .returning();
    return updated;
  }

  async getCurrentMonthUsage(): Promise<EmailUsage> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.getOrCreateEmailUsage(month);
  }

  async setEmailShutoff(month: string, isShutoff: boolean): Promise<void> {
    await db
      .update(emailUsage)
      .set({ isShutoff, updatedAt: new Date() })
      .where(eq(emailUsage.month, month));
  }

  // Contact operations
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async getContacts(): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt));
  }

  async getContactById(id: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));
    return contact;
  }

  async getContactByEmail(email: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.email, email));
    return contact;
  }

  async updateContact(id: string, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: string): Promise<void> {
    await db
      .delete(contacts)
      .where(eq(contacts.id, id));
  }

  // Additional inbound email operations
  async deleteInboundEmail(id: string): Promise<void> {
    await db
      .delete(inboundEmails)
      .where(eq(inboundEmails.id, id));
  }
}

export const storage = new DatabaseStorage();

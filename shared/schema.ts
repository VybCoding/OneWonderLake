import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Interested parties - residents who express interest or disinterest in annexation
export const interestedParties = pgTable("interested_parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  address: varchar("address").notNull(),
  phone: varchar("phone"),
  notes: text("notes"),
  source: varchar("source").notNull(), // 'address_checker' or 'tax_estimator'
  interested: boolean("interested").notNull().default(true), // true = interested in annexation, false = not interested
  latitude: varchar("latitude"), // Geocoded latitude for map display
  longitude: varchar("longitude"), // Geocoded longitude for map display
  emailSent: boolean("email_sent").default(false),
  contactConsent: boolean("contact_consent").notNull().default(false), // User consented to be contacted
  unsubscribed: boolean("unsubscribed").default(false), // User has unsubscribed from communications
  unsubscribeToken: varchar("unsubscribe_token"), // Secure token for unsubscribe link
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInterestedPartySchema = createInsertSchema(interestedParties).omit({
  id: true,
  emailSent: true,
  unsubscribed: true,
  unsubscribeToken: true,
  createdAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address").max(255, "Email is too long"),
  address: z.string().min(5, "Please enter your full address").max(500, "Address is too long"),
  phone: z.string().max(20, "Phone number is too long").optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes are too long").optional().or(z.literal("")),
  source: z.enum(["address_checker", "tax_estimator"], { 
    required_error: "Source is required",
    invalid_type_error: "Invalid source" 
  }),
  interested: z.boolean().default(true),
  latitude: z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
  contactConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to be contacted to submit this form"
  }),
});

export type InsertInterestedParty = z.infer<typeof insertInterestedPartySchema>;
export type InterestedParty = typeof interestedParties.$inferSelect;

// Searched addresses - track all address lookups for analytics
export const searchedAddresses = pgTable("searched_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: varchar("address").notNull(),
  result: varchar("result").notNull(), // 'resident', 'annexation', 'other_municipality', 'outside_area', 'not_found'
  municipalityName: varchar("municipality_name"), // For other_municipality results
  latitude: varchar("latitude"),
  longitude: varchar("longitude"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSearchedAddressSchema = createInsertSchema(searchedAddresses).omit({
  id: true,
  createdAt: true,
});

export type InsertSearchedAddress = z.infer<typeof insertSearchedAddressSchema>;
export type SearchedAddress = typeof searchedAddresses.$inferSelect;

// Question categories enum
export const questionCategories = ["general", "taxes", "property_rights", "services"] as const;
export type QuestionCategory = typeof questionCategories[number];

// Question status enum
export const questionStatuses = ["pending", "answered", "published"] as const;
export type QuestionStatus = typeof questionStatuses[number];

// Community questions - questions submitted by residents
export const communityQuestions = pgTable("community_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  address: varchar("address"),
  phone: varchar("phone"),
  category: varchar("category").notNull().default("general"),
  status: varchar("status").notNull().default("pending"),
  answer: text("answer"),
  contactConsent: boolean("contact_consent").notNull().default(false), // User consented to be contacted
  unsubscribed: boolean("unsubscribed").default(false), // User has unsubscribed from communications
  unsubscribeToken: varchar("unsubscribe_token"), // Secure token for unsubscribe link
  createdAt: timestamp("created_at").defaultNow(),
  answeredAt: timestamp("answered_at"),
});

export const insertCommunityQuestionSchema = createInsertSchema(communityQuestions).omit({
  id: true,
  status: true,
  answer: true,
  unsubscribed: true,
  unsubscribeToken: true,
  createdAt: true,
  answeredAt: true,
}).extend({
  question: z.string().min(10, "Question must be at least 10 characters").max(1000, "Question is too long"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address").max(255, "Email is too long"),
  address: z.string().max(500, "Address is too long").optional().or(z.literal("")),
  phone: z.string().max(20, "Phone number is too long").optional().or(z.literal("")),
  category: z.enum(questionCategories).default("general"),
  contactConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to be contacted to submit this form"
  }),
});

export type InsertCommunityQuestion = z.infer<typeof insertCommunityQuestionSchema>;
export type CommunityQuestion = typeof communityQuestions.$inferSelect;

// Dynamic FAQs - published questions that appear in the FAQ section
export const dynamicFaqs = pgTable("dynamic_faqs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").notNull().default("general"),
  isNew: boolean("is_new").default(true),
  viewCount: integer("view_count").default(0),
  sourceQuestionId: varchar("source_question_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDynamicFaqSchema = createInsertSchema(dynamicFaqs).omit({
  id: true,
  isNew: true,
  viewCount: true,
  createdAt: true,
}).extend({
  question: z.string().min(10, "Question must be at least 10 characters").max(1000, "Question is too long"),
  answer: z.string().min(10, "Answer must be at least 10 characters").max(5000, "Answer is too long"),
  category: z.enum(questionCategories).default("general"),
  sourceQuestionId: z.string().optional(),
});

export type InsertDynamicFaq = z.infer<typeof insertDynamicFaqSchema>;
export type DynamicFaq = typeof dynamicFaqs.$inferSelect;

// Email correspondence - track all emails sent from admin
export const emailCorrespondence = pgTable("email_correspondence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientEmail: varchar("recipient_email").notNull(),
  recipientName: varchar("recipient_name"),
  subject: varchar("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body"),
  relatedType: varchar("related_type"), // 'interested_party', 'community_question', or null for general
  relatedId: varchar("related_id"), // ID of the related record
  sentBy: varchar("sent_by"), // Admin user ID who sent
  resendId: varchar("resend_id"), // Resend's email ID for tracking
  status: varchar("status").notNull().default("sent"), // 'sent', 'delivered', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailCorrespondenceSchema = createInsertSchema(emailCorrespondence).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailCorrespondence = z.infer<typeof insertEmailCorrespondenceSchema>;
export type EmailCorrespondence = typeof emailCorrespondence.$inferSelect;

// Inbound emails - emails received via Resend webhook
export const inboundEmails = pgTable("inbound_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resendEmailId: varchar("resend_email_id").notNull().unique(), // Resend's email_id from webhook
  fromEmail: varchar("from_email").notNull(),
  fromName: varchar("from_name"),
  toEmail: varchar("to_email").notNull(), // Should be contact@onewonderlake.com
  subject: varchar("subject").notNull(),
  textBody: text("text_body"),
  htmlBody: text("html_body"),
  messageId: varchar("message_id"), // Original message ID header
  inReplyTo: varchar("in_reply_to"), // For threading
  isRead: boolean("is_read").default(false),
  isReplied: boolean("is_replied").default(false),
  replyEmailId: varchar("reply_email_id"), // ID of our reply email_correspondence record
  attachments: jsonb("attachments"), // Array of attachment metadata
  receivedAt: timestamp("received_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInboundEmailSchema = createInsertSchema(inboundEmails).omit({
  id: true,
  createdAt: true,
});

export type InsertInboundEmail = z.infer<typeof insertInboundEmailSchema>;
export type InboundEmail = typeof inboundEmails.$inferSelect;

// Email usage tracking - monthly email counters for free tier management
export const emailUsage = pgTable("email_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: varchar("month").notNull().unique(), // Format: YYYY-MM
  sentCount: integer("sent_count").default(0),
  receivedCount: integer("received_count").default(0),
  isShutoff: boolean("is_shutoff").default(false), // Auto-shutoff when reaching 2500
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailUsageSchema = createInsertSchema(emailUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailUsage = z.infer<typeof insertEmailUsageSchema>;
export type EmailUsage = typeof emailUsage.$inferSelect;

// Contact sources enum
export const contactSources = ["interested_party", "community_question", "inbound_email", "tax_estimator", "manual"] as const;
export type ContactSource = typeof contactSources[number];

// Interest status enum
export const interestStatuses = ["interested", "not_interested", "unknown"] as const;
export type InterestStatus = typeof interestStatuses[number];

// Contacts - unified contact list from all sources
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  address: varchar("address"),
  source: varchar("source").notNull().default("manual"), // Source of the contact
  relatedEntityId: varchar("related_entity_id"), // ID of the original record (interested_party, question, etc.)
  interestStatus: varchar("interest_status").notNull().default("unknown"), // interested, not_interested, unknown
  contactConsent: boolean("contact_consent").default(false),
  marketingOptOut: boolean("marketing_opt_out").default(false), // User opted out of marketing/promotions
  unsubscribed: boolean("unsubscribed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address").max(255, "Email is too long"),
  phone: z.string().max(20, "Phone number is too long").optional().or(z.literal("")),
  address: z.string().max(500, "Address is too long").optional().or(z.literal("")),
  source: z.enum(contactSources).default("manual"),
  interestStatus: z.enum(interestStatuses).default("unknown"),
  contactConsent: z.boolean().default(false),
  marketingOptOut: z.boolean().default(false),
  unsubscribed: z.boolean().default(false),
  notes: z.string().max(1000, "Notes are too long").optional().or(z.literal("")),
  relatedEntityId: z.string().optional(),
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Build info type for version tracking
export interface BuildInfo {
  version: string;
  buildDate: string;
  buildTime: string;
  gitCommit: string;
}

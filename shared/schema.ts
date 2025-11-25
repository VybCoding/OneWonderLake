import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, index, jsonb, boolean } from "drizzle-orm/pg-core";
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

// Interested parties - residents who want to be annexed
export const interestedParties = pgTable("interested_parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  address: varchar("address").notNull(),
  phone: varchar("phone"),
  notes: text("notes"),
  source: varchar("source").notNull(), // 'address_checker' or 'tax_estimator'
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInterestedPartySchema = createInsertSchema(interestedParties).omit({
  id: true,
  emailSent: true,
  createdAt: true,
});

export type InsertInterestedParty = z.infer<typeof insertInterestedPartySchema>;
export type InterestedParty = typeof interestedParties.$inferSelect;

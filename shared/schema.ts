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

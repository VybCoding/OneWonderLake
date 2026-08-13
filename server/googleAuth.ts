import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const GOOGLE_ISSUER = "https://accounts.google.com";

/**
 * Comma-separated allowlist of email addresses permitted into /admin.
 * Anyone signing in with a Google account outside this list is rejected at the
 * OIDC callback, so admin access is controlled entirely by this env var.
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowlisted(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

const getOidcConfig = memoize(
  async () => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for admin sign-in",
      );
    }
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? GOOGLE_ISSUER),
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
  },
  { maxAge: 3600 * 1000 },
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["given_name"],
    lastName: claims["family_name"],
    profileImageUrl: claims["picture"],
    // The allowlist is the source of truth for admin rights, so a newly added
    // address becomes an admin on first sign-in without touching the database.
    isAdmin: isAllowlisted(claims["email"]),
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const verify: VerifyFunction = async (tokens, verified) => {
    try {
      const claims = tokens.claims();

      if (!claims?.email_verified) {
        return verified(null, false, { message: "Google email is not verified" });
      }
      if (!isAllowlisted(claims.email as string)) {
        console.warn("[AUTH] Rejected sign-in for non-allowlisted address:", claims.email);
        return verified(null, false, { message: "This account is not authorized" });
      }

      await upsertUser(claims);
      verified(null, { claims });
    } catch (error) {
      verified(error as Error);
    }
  };

  // Strategies are registered per-hostname so the same build works on the
  // production domain and on Vercel preview URLs.
  const registeredStrategies = new Set<string>();

  const ensureStrategy = async (domain: string) => {
    const strategyName = `google:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const config = await getOidcConfig();
      passport.use(
        new Strategy(
          {
            name: strategyName,
            config,
            scope: "openid email profile",
            callbackURL: `https://${domain}/api/callback`,
          },
          verify,
        ),
      );
      registeredStrategies.add(strategyName);
    }
    return strategyName;
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", async (req, res, next) => {
    try {
      const strategyName = await ensureStrategy(req.hostname);
      passport.authenticate(strategyName, {
        prompt: "select_account",
        scope: ["openid", "email", "profile"],
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/callback", async (req, res, next) => {
    try {
      const strategyName = await ensureStrategy(req.hostname);
      passport.authenticate(strategyName, {
        successReturnToOrRedirect: "/admin",
        failureRedirect: "/admin?error=unauthorized",
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => res.redirect("/"));
    });
  });
}

/**
 * Session-backed auth guard. The Postgres-backed session cookie (1 week)
 * governs how long a login lasts; we re-check the allowlist on every request so
 * removing an address from ADMIN_EMAILS revokes access immediately.
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated?.() || !user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!isAllowlisted(user.claims.email)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return next();
};

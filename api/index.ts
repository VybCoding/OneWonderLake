import type { IncomingMessage, ServerResponse } from "node:http";

import { createApp } from "../server/app";

// The Express app is built once per warm function instance and reused across
// invocations, so route registration and OIDC discovery are not repeated.
const appPromise = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  return app(req as any, res as any);
}

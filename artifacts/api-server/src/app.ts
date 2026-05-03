import express, { type Express, type Request } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Disable ETag generation for JSON API responses. With ETag enabled, Express
// returns 304 Not Modified when the client sends If-None-Match — but the
// browser does NOT auto-fill the response body, and our generated client
// treats 304 as "no body" and returns null. That null then overwrites the
// React Query cache (e.g. workspace data), making forms appear blank on
// revisit even though the data still exists on the server.
app.set("etag", false);

// Trust the upstream proxy (Replit's edge) so req.ip / X-Forwarded-* are
// honored for rate limiting and Clerk host detection. Only one hop.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ─── Rate limiting (mounted BEFORE the Clerk proxy) ──────────────
// Defense-in-depth against brute-force enumeration on the auth-adjacent
// endpoints. The Clerk proxy middleware terminates the request, so the
// limiter MUST be installed first to actually run.
const clerkProxyLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many auth requests; please slow down." },
});
const teamLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip ?? "unknown",
  message: { error: "Too many team management requests; please slow down." },
});

app.use(CLERK_PROXY_PATH, clerkProxyLimiter, clerkProxyMiddleware());

// ─── CORS ────────────────────────────────────────────────────────
// Lock cross-origin access to the configured app origin (and the local
// Replit dev domain when present). Sending `credentials: true` together
// with `origin: true` would have echoed *any* requesting origin, which
// negates browser-side CSRF protection for cookie-authenticated
// endpoints. RUNSAFE_APP_ORIGIN can be a comma-separated list.
const configuredOrigins = (process.env.RUNSAFE_APP_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const replitDevDomain = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : null;
const allowedOrigins = new Set(
  [...configuredOrigins, replitDevDomain].filter((s): s is string => !!s),
);
const isProd = process.env.NODE_ENV === "production";

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      // Same-origin (no Origin header) and server-to-server tools are
      // allowed; cross-origin browser requests must match the allowlist.
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      // Fail-open is restricted to non-production: in production a missing
      // RUNSAFE_APP_ORIGIN would otherwise silently allow every origin
      // alongside cookie credentials.
      if (allowedOrigins.size === 0 && !isProd) return cb(null, true);
      return cb(new Error("Origin not allowed by CORS policy"));
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api/team", teamLimiter);

app.use("/api", router);

export default app;

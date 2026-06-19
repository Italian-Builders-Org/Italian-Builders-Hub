import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, waitlistTable } from "@workspace/db";
import {
  CreateWaitlistSignupBody,
  GetWaitlistCountResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function emptyToNull(value: string | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

router.post("/waitlist", async (req, res): Promise<void> => {
  const parsed = CreateWaitlistSignupBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid waitlist body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const {
    name,
    email,
    role,
    building,
    telegramHandle,
    xHandle,
    linkedin,
    website,
    projectUrl,
  } = parsed.data;

  try {
    const [row] = await db
      .insert(waitlistTable)
      .values({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        building: emptyToNull(building),
        telegramHandle: emptyToNull(telegramHandle),
        xHandle: emptyToNull(xHandle),
        linkedin: emptyToNull(linkedin),
        website: emptyToNull(website),
        projectUrl: emptyToNull(projectUrl),
        source: "Website Waitlist",
      })
      .returning();

    res.status(201).json({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      building: row.building,
      telegramHandle: row.telegramHandle,
      xHandle: row.xHandle,
      linkedin: row.linkedin,
      website: row.website,
      projectUrl: row.projectUrl,
      source: row.source,
      status: row.status,
      activatedAt: row.activatedAt?.toISOString() ?? null,
      activatedBy: row.activatedBy,
      inviteId: row.inviteId,
      inviteEmailSentAt: row.inviteEmailSentAt?.toISOString() ?? null,
      inviteEmailError: row.inviteEmailError,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    const getCode = (e: unknown): string | undefined =>
      e && typeof e === "object" && "code" in e
        ? (e as { code?: string }).code
        : undefined;
    const cause =
      err && typeof err === "object" && "cause" in err
        ? (err as { cause?: unknown }).cause
        : undefined;
    if (getCode(err) === "23505" || getCode(cause) === "23505") {
      res.status(409).json({ error: "This email is already on the waitlist." });
      return;
    }
    throw err;
  }
});

router.get("/waitlist/count", async (_req, res): Promise<void> => {
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(waitlistTable);

  res.json(GetWaitlistCountResponse.parse({ count }));
});

export default router;

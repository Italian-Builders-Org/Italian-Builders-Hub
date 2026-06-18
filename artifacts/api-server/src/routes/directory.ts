import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, buildersTable, projectsTable, osProjectsTable } from "@workspace/db";
import {
  ListBuildersResponse,
  ListProjectsResponse,
  ListProjectsQueryParams,
  ListOsProjectsResponse,
  GetDirectoryStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/builders", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(buildersTable)
    .orderBy(buildersTable.sortOrder);
  res.json(ListBuildersResponse.parse(rows));
});

router.get("/projects", async (req, res): Promise<void> => {
  const params = ListProjectsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const category = params.data.category;
  const rows = category
    ? await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.category, category))
        .orderBy(projectsTable.sortOrder)
    : await db.select().from(projectsTable).orderBy(projectsTable.sortOrder);

  res.json(ListProjectsResponse.parse(rows));
});

router.get("/os-projects", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(osProjectsTable)
    .orderBy(osProjectsTable.sortOrder);
  res.json(ListOsProjectsResponse.parse(rows));
});

router.get("/stats", async (_req, res): Promise<void> => {
  res.json(
    GetDirectoryStatsResponse.parse({
      builders: "500+",
      regions: "20",
      cities: "60+",
    }),
  );
});

export default router;

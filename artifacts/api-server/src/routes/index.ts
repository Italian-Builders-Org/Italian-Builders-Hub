import { Router, type IRouter } from "express";
import healthRouter from "./health";
import waitlistRouter from "./waitlist";
import directoryRouter from "./directory";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(waitlistRouter);
router.use(directoryRouter);
router.use(adminRouter);

export default router;

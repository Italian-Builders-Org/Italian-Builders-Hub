import { Router, type IRouter } from "express";
import healthRouter from "./health";
import waitlistRouter from "./waitlist";
import directoryRouter from "./directory";

const router: IRouter = Router();

router.use(healthRouter);
router.use(waitlistRouter);
router.use(directoryRouter);

export default router;

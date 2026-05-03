import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspaceRouter from "./workspace";
import teamRouter from "./team";
import sopsRouter from "./sops";
import tasksRouter from "./tasks";
import complianceRouter from "./compliance";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workspaceRouter);
router.use(teamRouter);
router.use(sopsRouter);
router.use(tasksRouter);
router.use(complianceRouter);
router.use(dashboardRouter);

export default router;

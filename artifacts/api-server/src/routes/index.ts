import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wasteDetectionRouter from "./waste-detection";

const router: IRouter = Router();

router.use(healthRouter);
router.use(wasteDetectionRouter);

export default router;

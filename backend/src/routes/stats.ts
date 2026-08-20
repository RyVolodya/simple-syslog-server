import { Router } from "express";
import { getLast24Stats } from "../services/service.Last24Messages";
const router = Router();
router.get("/messages", async (_req, res, next) => {
  try { res.json(await getLast24Stats()); }
  catch (error) { next(error); }
});
export default router;

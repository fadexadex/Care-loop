import { Router } from "express";
import { AIController } from "./controller";

const aiController = new AIController();
const router = Router();


router.post("/webhook/whatsapp", aiController.handleWebhook);

export default router;

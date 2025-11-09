import { Router } from "express";
import { VoterController } from "./voter.controller";
import {authMiddleware} from "../../middleware/auth.middleware";
import {roleMiddleware} from "../../middleware/role.middleware";


const router = Router();

router.post("/", authMiddleware, roleMiddleware(["ADMIN","COORDINATOR","AGITATOR"]), VoterController.createVoter);
router.get("/me", authMiddleware, VoterController.listMine);
router.get("/uik/:code", authMiddleware, VoterController.listByUik);
router.put("/:id", authMiddleware, VoterController.update);
router.delete("/:id", authMiddleware, VoterController.remove);
router.get("/Search", authMiddleware, VoterController.SearchVoters);

export default router;

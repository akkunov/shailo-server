import { Router } from "express";
import { UserController } from "./user.controller";
import {authMiddleware} from "../../middleware/auth.middleware";


const router = Router();

router.post("/create-coordinator", authMiddleware, UserController.createCoordinator);
router.post("/create-agitator", authMiddleware, UserController.createAgitator);
router.get("/coordinators", authMiddleware, UserController.getCoordinators);
router.get("/all-agitators", authMiddleware, UserController.getAgitators);
router.get("/voters", authMiddleware, UserController.getVoters);
router.get("/coordinator-voters/:id", authMiddleware, UserController.getCoordinatorsVoters);


router.post("/assign-uiks", authMiddleware, UserController.assignUIKs);
router.get("/agitators", authMiddleware, UserController.listAgitators);
router.get("/agitatorsExcel",UserController.exportAgitatorsByUIK);
router.get("/byuik",UserController.exportAgitatorsBySpecificUIKs);
router.get("/Search",UserController.Search);
router.get("/agitatorSumm",UserController.AgitSumm);
router.get("/:id", authMiddleware, UserController.getUser);
router.post("/reset", UserController.reset);
router.put("/:id", authMiddleware, UserController.updateUser);
router.delete("/:id", authMiddleware, UserController.deleteUser);



export default router;

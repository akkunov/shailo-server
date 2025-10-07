import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./modules/auth/auth.routes";
import { authMiddleware } from "./middleware/auth.middleware";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// публичные
app.use("/auth", authRoutes);

// защищённые (пример)
app.get("/protected", authMiddleware, (req, res) => {
    res.json({ message: "Доступ разрешён" });
});

export default app;

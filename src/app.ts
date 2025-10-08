import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser'
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import uikRoutes from "./modules/uik/uik.routes";
import voterRoutes from "./modules/voter/voter.routes";
import statsRoutes from "./modules/stats/stats.routes";

dotenv.config();
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());


// публичные
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uiks", uikRoutes);
app.use("/api/voters", voterRoutes);
app.use("/api/stats", statsRoutes);


app.get("/health", (req, res) => res.json({ ok: true }));

export default app;

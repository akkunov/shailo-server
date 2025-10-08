import app from "./app";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
console.log("ENV:", process.env.DATABASE_URL);

app.listen(PORT,"0.0.0.0", () => {
    console.log(`🚀 Server running on :${PORT}`);
});
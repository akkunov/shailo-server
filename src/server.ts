import app from "./app";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const host = '0.0.0.0'

app.listen(PORT, host, () => {
    console.log(`🚀 Server running on http://${host}:${PORT}`);
});
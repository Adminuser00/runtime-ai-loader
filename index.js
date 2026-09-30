import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
export default app;

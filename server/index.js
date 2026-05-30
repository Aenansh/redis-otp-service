import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ path: "./.env.local" });

//Routes
import otpRoute from "./routes/otp.routes.js";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use("/api/v1/otp", otpRoute);

const PORT = process.env.PORT || 3000;
const SERVER_URI = process.env.SERVER_URI || "http://localhost:";

app.listen(PORT, () => {
  console.log(`Server listening on ${SERVER_URI}${PORT}`);
});

require("dns").setDefaultResultOrder("ipv4first");

const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { createSocketServer } = require("./realtime/socketServer");

const app = express();
const httpServer = http.createServer(app);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
  })
);

app.use(express.json());

createSocketServer(httpServer, { frontendUrl });

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/parking", require("./routes/parking"));
app.use("/api/booking", require("./routes/booking"));
app.use("/api/bookings", require("./routes/booking"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/ai", require("./routes/aiIntelligenceRoutes"));
app.use("/api/ai-platform", require("./routes/aiRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/platform", require("./routes/platformRoutes"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/trip", require("./routes/tripRoutes"));
app.use("/api/billing", require("./routes/billingRoutes"));
app.use("/api/vehicle", require("./routes/vehicleRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/location", require("./routes/locationRoutes"));
app.use("/api/ai/mobility", require("./routes/aiMobilityRoutes"));

app.get("/", (req, res) => {
  res.send("Smart Parking Backend Running");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB error:", err.message));

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

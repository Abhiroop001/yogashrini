// Server/config/db.js
// Robust MongoDB Connection Manager with Event Listeners & Graceful Teardown
const mongoose = require("mongoose");
const config = require("./index");

async function connectDB() {
  if (!config.MONGO_URI) {
    throw new Error("Cannot connect to database: MONGO_URI is not set in environment.");
  }

  try {
    const conn = await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (err) {
    console.error("[MongoDB] Initial connection error:", err.message);
    throw err;
  }
}

// Lifecycle Event Observers
mongoose.connection.on("connected", () => {
  console.log("[MongoDB] Connection state: CONNECTED");
});

mongoose.connection.on("error", (err) => {
  console.error("[MongoDB] Runtime error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] Connection state: DISCONNECTED");
});

mongoose.connection.on("reconnected", () => {
  console.log("[MongoDB] Connection state: RECONNECTED");
});

module.exports = connectDB;

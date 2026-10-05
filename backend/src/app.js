import express from "express";

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BlogForge API is healthy",
  });
});

export default app;
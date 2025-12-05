//libraries
import express from "express";
import morgan from "morgan";

//config and routers
import config from "./config/config.js";
import recipesRouter from "./routers/recipes.js";

const app = express();

// middleware
app.use(express.json());
app.use(morgan("dev"));

// health
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: Date.now() })
);

// routers
app.use("/api/recipes", recipesRouter);

// generic 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
  console.log("http://localhost:" + config.PORT);
});

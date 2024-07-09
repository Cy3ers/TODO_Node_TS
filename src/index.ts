import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

import usersRouter from "./routes/users";
import tasksRouter from "./routes/tasks";

app.use("/api/users", usersRouter);
app.use("/api/tasks", tasksRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

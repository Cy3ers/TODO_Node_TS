import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import authMiddleware from "../middleware/auth-middleware";

const router = express.Router();
const taskDataPath = path.join(__dirname, "../data/tasks.json");

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
}

const readTaskData = (): { tasks: Task[] } => {
  const data = fs.readFileSync(taskDataPath, "utf8");
  return JSON.parse(data);
};

const writeTaskData = (data: { tasks: Task[] }): void => {
  fs.writeFileSync(taskDataPath, JSON.stringify(data, null, 2), "utf8");
};

router.post("/", authMiddleware, (req: Request, res: Response) => {
  const data = readTaskData();
  const newTask: Task = {
    id: data.tasks.length + 1,
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    priority: req.body.priority
  };
  data.tasks.push(newTask);
  writeTaskData(data);
  res.status(201).send(newTask);
});

router.get("/", authMiddleware, (req: Request, res: Response) => {
  const data = readTaskData();
  const { status, priority } = req.query;
  let tasks = data.tasks;

  if (status) {
    tasks = tasks.filter((task) => task.status === status);
  }
  if (priority) {
    tasks = tasks.filter((task) => task.priority === priority);
  }

  res.status(200).send(tasks);
});

router.put("/:id", authMiddleware, (req: Request, res: Response) => {
  const data = readTaskData();
  const task = data.tasks.find((t) => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).send("Task not found.");

  task.title = req.body.title;
  task.description = req.body.description;
  task.status = req.body.status;
  task.priority = req.body.priority;

  writeTaskData(data);
  res.status(200).send(task);
});

router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
  const data = readTaskData();
  const taskIndex = data.tasks.findIndex((t) => t.id === parseInt(req.params.id));
  if (taskIndex === -1) return res.status(404).send("Task not found.");

  const deletedTask = data.tasks.splice(taskIndex, 1);
  writeTaskData(data);

  res.status(200).send(deletedTask);
});

export default router;

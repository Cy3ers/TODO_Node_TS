// ./src/routes/tasks.ts
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import authMiddleware from "../middleware/auth-middleware";

const router = express.Router();
const taskDataPath = path.join(__dirname, "../data/tasks.json");
const userDataPath = path.join(__dirname, "../data/users.json");

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  userId: number; // Add userId to Task interface
}

interface User {
  id: number;
  username: string;
  password: string;
  tasks: number[]; // Array of task IDs associated with this user
}

// Extend Request interface to include user property
interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

const readTaskData = (): { tasks: Task[] } => {
  const data = fs.readFileSync(taskDataPath, "utf8");
  return JSON.parse(data);
};

const writeTaskData = (data: { tasks: Task[] }): void => {
  fs.writeFileSync(taskDataPath, JSON.stringify(data, null, 2), "utf8");
};

const readUserData = (): { users: User[] } => {
  const data = fs.readFileSync(userDataPath, "utf8");
  return JSON.parse(data);
};

const writeUserData = (data: { users: User[] }): void => {
  fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2), "utf8");
};

router.post("/", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, description, status, priority } = req.body;
  const userId = req.user!.id; // Use non-null assertion operator if user is guaranteed to exist

  const taskData = readTaskData();
  const userData = readUserData();

  const newTask: Task = {
    id: taskData.tasks.length + 1,
    title,
    description,
    status,
    priority,
    userId
  };

  taskData.tasks.push(newTask);

  // Update user's tasks array
  const userIndex = userData.users.findIndex((user) => user.id === userId);
  if (userIndex !== -1) {
    userData.users[userIndex].tasks.push(newTask.id);
    writeUserData(userData);
  } else {
    return res.status(404).send("User not found.");
  }

  writeTaskData(taskData);
  res.status(201).send(newTask);
});

router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
  const { status, priority } = req.query;
  const userId = req.user!.id; // Use non-null assertion operator if user is guaranteed to exist

  const taskData = readTaskData();
  const userData = readUserData();

  let tasks = taskData.tasks.filter((task) => task.userId === userId);

  if (status) {
    tasks = tasks.filter((task) => task.status === status);
  }
  if (priority) {
    tasks = tasks.filter((task) => task.priority === priority);
  }

  res.status(200).send(tasks);
});

router.put("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const { title, description, status, priority } = req.body;
  const taskId = parseInt(req.params.id);
  const userId = req.user!.id; // Use non-null assertion operator if user is guaranteed to exist

  const taskData = readTaskData();
  const userData = readUserData();

  const task = taskData.tasks.find((t) => t.id === taskId);

  if (!task) {
    return res.status(404).send("Task not found.");
  }

  if (task.userId !== userId) {
    return res.status(403).send("Unauthorized access to task.");
  }

  task.title = title;
  task.description = description;
  task.status = status;
  task.priority = priority;

  writeTaskData(taskData);
  res.status(200).send(task);
});

router.delete("/:id", authMiddleware, (req: AuthRequest, res: Response) => {
  const taskId = parseInt(req.params.id);
  const userId = req.user!.id; // Use non-null assertion operator if user is guaranteed to exist

  const taskData = readTaskData();
  const userData = readUserData();

  const taskIndex = taskData.tasks.findIndex((t) => t.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).send("Task not found.");
  }

  const task = taskData.tasks[taskIndex];

  if (task.userId !== userId) {
    return res.status(403).send("Unauthorized access to task.");
  }

  taskData.tasks.splice(taskIndex, 1);

  // Remove task from user's tasks array
  const userIndex = userData.users.findIndex((user) => user.id === userId);
  if (userIndex !== -1) {
    const taskIndexInUser = userData.users[userIndex].tasks.indexOf(taskId);
    if (taskIndexInUser !== -1) {
      userData.users[userIndex].tasks.splice(taskIndexInUser, 1);
      writeUserData(userData);
    }
  }

  writeTaskData(taskData);
  res.status(200).send(task);
});

export default router;

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

export function getUsers() {
  const data = fs.readFileSync(USERS_FILE, "utf-8");
  return JSON.parse(data);
}

export function saveUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function getUserCards(username: string) {
  const userDir = path.join(DATA_DIR, "cards");
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir);
  }
  const userFile = path.join(userDir, `${username}.json`);
  if (!fs.existsSync(userFile)) {
    return [];
  }
  const data = fs.readFileSync(userFile, "utf-8");
  return JSON.parse(data);
}

export function saveUserCards(username: string, cards: any[]) {
  const userDir = path.join(DATA_DIR, "cards");
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir);
  }
  const userFile = path.join(userDir, `${username}.json`);
  fs.writeFileSync(userFile, JSON.stringify(cards, null, 2));
}

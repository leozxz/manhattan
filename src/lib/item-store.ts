import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const FILE_PATH = join(process.cwd(), "data", "items.json");

export function loadServerItemIds(): string[] {
  if (!existsSync(FILE_PATH)) return [];
  try {
    return JSON.parse(readFileSync(FILE_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function addServerItemId(id: string) {
  const ids = loadServerItemIds();
  if (ids.includes(id)) return;
  ids.push(id);
  writeFileSync(FILE_PATH, JSON.stringify(ids, null, 2));
}

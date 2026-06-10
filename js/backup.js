import {
  getTodos
} from "./storage.js";

import {
  APP_VERSION
} from "./version.js";

export async function exportTodos(){

  const todos = await getTodos();

  const backupData = {

    version: APP_VERSION,

    exportDate: new Date().toISOString(),

    todos

  };

  const json =
    JSON.stringify(
      backupData,
      null,
      2
    );

  const blob =
    new Blob(
      [json],
      {
        type: "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  const today =
    new Date()
      .toISOString()
      .slice(0,10);

  a.href = url;

  a.download =
    `todo-backup-${today}.json`;

  a.click();

  URL.revokeObjectURL(url);

}

export async function importTodos(file){
  const text = await file.text();
  const data = JSON.parse(text);
  if(!Array.isArray(data.todos)){
    throw new Error(
      "Invalid Backup File"
    );
  }
  const isValid = data.todos.every(todo =>
    typeof todo === "object" &&
    todo !== null &&
    "id" in todo &&
    "text" in todo &&
    "completed" in todo &&
    "priority" in todo
  );
  if(!isValid){
    throw new Error(
        "Invalid Backup File"
    );
  }
  return data.todos;
}
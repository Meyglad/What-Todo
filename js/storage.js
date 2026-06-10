import {
  getAllTodosFromDB,
  saveAllTodosToDB
} from "./database.js";

async function getTodos() {
  return await getAllTodosFromDB();
}

async function saveTodos(todos) {
  await saveAllTodosToDB(todos);
}

export {
  getTodos,
  saveTodos
};
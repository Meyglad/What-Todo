const DB_NAME = "TodoDB";
const DB_VERSION = 1;
const STORE_NAME = "todos";

function openDB() {
  return new Promise((resolve, reject) => {

    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = function(event) {

      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {

        db.createObjectStore(
          STORE_NAME,
          { keyPath: "id" }
        );

      }

    };

    request.onsuccess = function() {
      resolve(request.result);
    };

    request.onerror = function() {
      reject(request.error);
    };

  });
}

async function getAllTodosFromDB() {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(
      STORE_NAME
    );

    const request = store.getAll();

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);

  });

}

async function saveAllTodosToDB(todos) {

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(
      STORE_NAME
    );

    store.clear();

    todos.forEach(todo => {
      store.put(todo);
    });

    transaction.oncomplete = () =>
      resolve();

    transaction.onerror = () =>
      reject(transaction.error);

  });

}

export {
  openDB,
  STORE_NAME,
  getAllTodosFromDB,
  saveAllTodosToDB
};
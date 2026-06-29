const DB_NAME = "TodoDB";
const DB_VERSION = 2;
const STORE_NAME = "todos";
const QUEUE_STORE = "syncQueue";

import {
  supabase
} from "./supabase.js";

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

      if(!db.objectStoreNames.contains(QUEUE_STORE)){
        db.createObjectStore(
          QUEUE_STORE,
          {
            keyPath: "id",
            autoIncrement: true
          }
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

export async function getUserTodos(
  userId
){

  const {
    data,
    error
  } = await supabase

    .from("todos")

    .select("*")

    .eq(
      "user_id",
      userId
    );

  if(error){

    console.error(error);

    return [];

  }

  return data;

}

export async function addTodoToSupabase(
  todo,
  userId
){
  try {
    const {data, error} = await supabase
    .from("todos")
    .insert({
      user_id: userId,
      text: todo.text,
      completed: todo.completed,
      priority: todo.priority,
      note: todo.note,
      deleted: todo.deleted,
      order_index: todo.order
    })
    .select();
    return {data, error};
  } catch(err) {
    console.log("OFFLINE -> QUEUE", err);
    await addToQueue({
      type: "ADD_TODO",
      payload: {
        todo,
        userId
      }
    });
    return {
      data: null,
      error: err
    };
  }
}

export async function loadTodosFromSupabase(
  userId
){

  const {
    data,
    error
  } = await supabase

    .from("todos")

    .select("*")

    .eq(
      "user_id",
      userId
    )

    .order(
      "order_index",
      {
        ascending: true
      }
    );

  console.log(
    "LOAD TODOS RESULT",
    {
      data,
      error
    }
  );

  return {
    data,
    error
  };

}

export async function replaceTodosForUser(
  userId,
  todos
){
  const backupTodos = todos.map((todo, index) => ({
    user_id: userId,
    text: todo.text ?? "",
    completed: Boolean(todo.completed),
    priority: Boolean(todo.priority),
    note: todo.note ?? "",
    deleted: Boolean(todo.deleted),
    order_index: typeof todo.order === "number"
      ? todo.order
      : index,
    updated_at: new Date(
      todo.updatedAt || todo.createdAt || Date.now()
    ).toISOString(),
    deleted_at: todo.deleted
      ? new Date(
          todo.deletedAt || todo.updatedAt || todo.createdAt || Date.now()
        ).toISOString()
      : null
  }));

  const { error: deleteError } = await supabase
    .from("todos")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    return {
      data: null,
      error: deleteError
    };
  }

  const { data, error } = await supabase
    .from("todos")
    .insert(backupTodos)
    .select();

  if (error) {
    return {
      data: null,
      error
    };
  }

  return {
    data: (data || []).map(todo => ({
      ...todo,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      order: todo.order_index
    })),
    error: null
  };
}

export async function syncTodosFromSupabase(
  userId
){

  const {
    data,
    error
  } = await loadTodosFromSupabase(
    userId
  );

  if(error){

    console.error(error);

    return;

  }

  const normalizedTodos = data.map(todo => ({
    ...todo,
    createdAt: todo.created_at,
    updatedAt: todo.updated_at,
    order: todo.order_index
  }));

  const localTodos = await getAllTodosFromDB();

  function getTimestamp(todo) {
    return new Date(
      todo.updatedAt || todo.createdAt || 0
    ).getTime();
  }

  const hasLocalData = localTodos.length > 0;

  if (!hasLocalData) {
    await saveAllTodosToDB(
      normalizedTodos
    );

    console.log(
      "SYNC COMPLETE",
      normalizedTodos.length
    );
    return;
  }

  const localTodoMap = new Map(
    localTodos.map(todo => [String(todo.id), todo])
  );

  const mergedTodos = localTodos.map(todo => ({
    ...todo
  }));

  normalizedTodos.forEach(remoteTodo => {
    const remoteId = String(remoteTodo.id);
    const localTodo = localTodoMap.get(remoteId);

    if (!localTodo) {
      return;
    }

    if (
      getTimestamp(remoteTodo) >= getTimestamp(localTodo)
    ) {
      const index = mergedTodos.findIndex(
        todo => String(todo.id) === remoteId
      );

      if (index !== -1) {
        mergedTodos[index] = remoteTodo;
      }
    }
  });

  await saveAllTodosToDB(
    mergedTodos
  );



  console.log(
    "SYNC COMPLETE",
    mergedTodos.length
  );

}

export async function updateTodoInSupabase(
  todo
){
  console.log("UPDATING SUPABASE ID", todo.id);
  const { data, error } =
    await supabase

      .from("todos")

      .update({

        text: todo.text,

        completed: todo.completed,

        priority: todo.priority,

        note: todo.note,

        deleted: todo.deleted,

        order_index: todo.order,

        updated_at: new Date().toISOString(),

        deleted_at: todo.deleted ? new Date().toISOString() : null

      })

      .eq("id", todo.id)

      .select();

  return {
    data,
    error
  };

}

export async function deleteTodoFromSupabase(
  todoId
){

  const { data, error } =
    await supabase

      .from("todos")

      .delete()

      .eq("id", todoId);

  return {
    data,
    error
  };

}

export async function createProfile(profile){

  const { data, error } =
    await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

  return {
    data,
    error
  };

}

export async function getProfile(userId){
  const { data, error } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
  console.log("GET PROFILE USER ID", userId);
  console.log("GET PROFILE DATA", data);
  if(error){
    if(error.code !== "PGRST116"){
      console.log("GET PROFILE ERROR", error);
    }
  }
  return {
    data,
    error
  };

}

export async function updateProfile(userId, updates){

  return await supabase
  .from("profiles")
  .update(updates)
  .eq("id", userId)
  .select()
  .single();

  // const { data, error } =
  //   await supabase
  //     .from("profiles")
  //     .update({
  //       ...updates,
  //       updated_at: new Date().toISOString()
  //     })
  //     .eq("id", userId)
  //     .select()
  //     .single();

  // return {
  //   data,
  //   error
  // };

}

export function subscribeToTodos(userId, callback){

  return supabase
    .channel("todos-realtime")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "todos",
        filter: `user_id=eq.${userId}`
      },

      payload => {

        console.log(
          "REALTIME EVENT",
          payload
        );

        callback(payload);

      }
    )

    .subscribe();

}

export async function addToQueue(operation){

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      QUEUE_STORE,
      "readwrite"
    );

    const store = transaction.objectStore(
      QUEUE_STORE
    );

    const request = store.add({
      ...operation,
      createdAt: Date.now()
    });

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);

  });

}

export async function getQueueItems(){

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      "syncQueue",
      "readonly"
    );

    const store = transaction.objectStore(
      "syncQueue"
    );

    const request = store.getAll();

    request.onsuccess = () =>
      resolve(request.result);

    request.onerror = () =>
      reject(request.error);

  });

}

export async function removeQueueItem(id){

  const db = await openDB();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      "syncQueue",
      "readwrite"
    );

    const store = transaction.objectStore(
      "syncQueue"
    );

    const request = store.delete(id);

    request.onsuccess = () =>
      resolve();

    request.onerror = () =>
      reject(request.error);

  });

}
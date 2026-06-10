//--------------------------------
// DOM Elements
//--------------------------------
const input = document.getElementById("input");
const button = document.getElementById("addBtn");
const list = document.getElementById("list");
const completedCount = document.getElementById("completedCount");
const remainingCount = document.getElementById("remainingCount");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const darkModeToggle = document.getElementById("darkModeToggle");
const settingsBtn = document.getElementById("settingsBtn");
const clearSearch = document.getElementById("clearSearch");
const customSelect = document.querySelector(".custom-select");
const selectBtn = document.getElementById("selectBtn");
const selectOptions = document.getElementById("selectOptions");
const selectedText = document.getElementById("selectedText");
const filterOptions = document.querySelectorAll("#selectOptions .option");
const sortSelect = document.querySelector(".sort-select");
const sortBtn = document.getElementById("sortBtn");
const sortOptions = document.getElementById("sortOptions");
const sortSelectedText = document.getElementById("sortSelectedText");
const sortOptionItems = document.querySelectorAll(".sort-option");
const closeSettings = document.getElementById("closeSettings");
const confirmDeleteToggle = document.getElementById("confirmDeleteToggle");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deleteModal = document.getElementById("deleteModal");
const updateToast = document.getElementById("updateToast");
const updateBtn = document.getElementById("updateBtn");
const updateVersionText = document.getElementById("updateVersionText");
const appVersionText = document.getElementById("appVersionText");
const appUpdateDate = document.getElementById("appUpdateDate");
const toolbarSettingsBtn = document.getElementById("toolbarSettingsBtn");
const toolbarSearchBtn = document.getElementById("toolbarSearchBtn");
const toolbarSearchBox = document.getElementById("toolbarSearchBox");
const toolbarSearchClose = document.getElementById("toolbarSearchClose");
const toolbarSearchInput = document.getElementById("toolbarSearchInput");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const installAppBtn = document.getElementById("installAppBtn");
const installAppItem = document.getElementById("installAppItem");


//--------------------------------
// App State
//--------------------------------
let currentFilter = localStorage.getItem("todoFilter") || "all";
let currentSort = localStorage.getItem("todoSort") || "auto";
let confirmDelete = JSON.parse(localStorage.getItem("confirmDelete")) ?? true;
let searchValue = "";
let draggedItem = null;
let todoToDelete = null;

import {
    saveTodos,
    getTodos
} from "./storage.js";

import {
    showMessage
} from "./ui.js";

import {
  openSettingsModal,
  closeSettingsModal
} from "./modals.js";

import {
  initTheme
} from "./theme.js";

import {
  setupTodoTooltip
} from "./tooltip.js";

import {
  APP_VERSION,
  LAST_UPDATE
} from "./version.js";

import {
  exportTodos,
  importTodos
} from "./backup.js";

appVersionText.textContent = APP_VERSION;
appUpdateDate.textContent = LAST_UPDATE;
updateVersionText.textContent = `ورژن ${APP_VERSION}`;

updateBtn.addEventListener("click", () => {
  location.reload();
});

async function isDuplicateTodo(text, excludeId = null){

  const normalizedText = text.trim().toLowerCase();
  const todos = await getTodos();

  return todos.some(todo =>
    todo.id !== excludeId &&
    todo.text.trim().toLowerCase() === normalizedText
  );

}

function createTodoText(text){

  const span = document.createElement("span");

  span.classList.add("todo-text");
  span.textContent = text;

  setupTodoTooltip(span, text);

  return span;

}

function createActionButton(className, iconHtml){

  const button = document.createElement("span");

  button.classList.add(className);
  button.innerHTML = iconHtml;

  return button;

}

input.value = "";
searchInput.value = "";
confirmDeleteToggle.checked = confirmDelete;
initTheme(darkModeToggle);
darkModeToggle.checked = document.body.classList.contains("dark");

cancelDeleteBtn.addEventListener("click", function(){
  closeDeleteModal();
});

confirmDeleteBtn.addEventListener("click", async function(){

  if(!todoToDelete) return;

  let todos = await getTodos();

  todos = todos.map(t => {

    if(t.id === todoToDelete.id){

      return{
        ...t,
        deleted: true,
        updatedAt: Date.now()
      };

    }

    return t;

  });

  await saveTodos(todos);
  closeDeleteModal();
  await renderList();

});

deleteModal.addEventListener("click", function(event){

  if(event.target === deleteModal){
    closeDeleteModal();
  }

});

// searchInput.addEventListener("input", async function(){
//   searchValue = searchInput.value.toLowerCase();

//   if(searchInput.value.trim() !== ""){
//     clearSearch.classList.add("show");
//   } else {
//     clearSearch.classList.remove("show");
//   }

//   await renderList();
//   await checkEmptyState();
// });

clearSearch.addEventListener("click", async function(){
  searchInput.value = "";
  searchValue = "";

  clearSearch.classList.remove("show");

  await renderList();
  await checkEmptyState();

  searchInput.focus();
});

function getTodoRank(todo){

  if(!todo.completed && todo.priority){
    return 1;
  }

  if(!todo.completed && !todo.priority){
    return 2;
  }

  if(todo.completed && todo.priority){
    return 3;
  }

  return 4;
}

async function getProcessedTodos(){
  let todos = await getTodos();

  todos = todos.map(todo => ({
    deleted: false,
    ...todo
  }));

  if(currentFilter === "trash"){
    todos = todos.filter(todo => todo.deleted);
  } else {
    todos = todos.filter(todo => !todo.deleted);
  }

  if(currentFilter === "completed"){
    todos = todos.filter(t => t.completed);
  }

  if(currentFilter === "remaining"){
    todos = todos.filter(t => !t.completed);
  }

  if(currentFilter === "priority"){
    todos = todos.filter(t => t.priority);
  }

  if(searchValue.trim() !== ""){
    todos = todos.filter(t =>
      t.text.toLowerCase().includes(searchValue)
    );
  }

  if(currentSort === "auto"){

    todos.sort((a, b) => {

      const rankDiff = getTodoRank(a) - getTodoRank(b);

      if(rankDiff !== 0){
        return rankDiff;
      }

      const aTime = a.updatedAt || a.createdAt;
      const bTime = b.updatedAt || b.createdAt;

      return bTime - aTime;
    });

  }

  if(currentSort === "newest"){
    todos.sort((a, b) => {

      const aTime = a.updatedAt || a.createdAt;
      const bTime = b.updatedAt || b.createdAt;

      return bTime - aTime;
    });
  }

  if(currentSort === "oldest"){
    todos.sort((a, b) => {

      const aTime = a.updatedAt || a.createdAt;
      const bTime = b.updatedAt || b.createdAt;
      
      return aTime - bTime;
    });
  }

  if(currentSort === "manual"){
    todos.sort((a, b) => a.order - b.order);
  }

  return todos;
}

async function renderList(){

  const todos = await getTodos();
  // console.log("Todos:", todos);

  list.innerHTML = "";

  const processedTodos = await getProcessedTodos();

  processedTodos.forEach(todo => {
    createItem(todo);
  });

  await updateStats();
  await checkEmptyState();
}

selectBtn.addEventListener("click", function(){
  customSelect.classList.toggle("open");
});

filterOptions.forEach(option => {

  option.classList.remove("active");

  if(option.dataset.value === currentFilter){
    option.classList.add("active");
    selectedText.textContent = option.textContent.trim();
  }

  option.addEventListener("click", async function(){
    filterOptions.forEach(opt => {
      opt.classList.remove("active");
    });

    option.classList.add("active");

    currentFilter = option.dataset.value;

    selectedText.textContent = option.textContent.trim();

    localStorage.setItem("todoFilter", currentFilter);

    customSelect.classList.remove("open");

    await renderList();
    await checkEmptyState();
  });

});

sortBtn.addEventListener("click", function(){
  sortSelect.classList.toggle("open");
});

sortOptionItems.forEach(option => {

  option.classList.remove("active");

  if(option.dataset.value === currentSort){
    option.classList.add("active");
    sortSelectedText.textContent = option.textContent.trim();
  }

  option.addEventListener("click", async function(){
    sortOptionItems.forEach(opt => {
      opt.classList.remove("active");
    });

    option.classList.add("active");

    currentSort = option.dataset.value;

    sortSelectedText.textContent = option.textContent.trim();

    localStorage.setItem("todoSort", currentSort);

    sortSelect.classList.remove("open");

    await renderList();
  });
});

document.addEventListener("click", function(event){

  if(!customSelect.contains(event.target)){
    customSelect.classList.remove("open");
  }

  if(!sortSelect.contains(event.target)){
    sortSelect.classList.remove("open");
  }

});

async function checkEmptyState(){

  const allTodos = await getTodos();
  const filteredTodos = await getProcessedTodos();

  if(allTodos.length === 0){

    list.style.display = "none";

    emptyMessage.style.display = "block";
    emptyMessage.textContent = "هنوز کاری ثبت نشده ✨";

  } else if(filteredTodos.length === 0){

    list.style.display = "none";

    emptyMessage.style.display = "block";
    emptyMessage.textContent = "چیزی پیدا نشد 🔍";

  } else {

    list.style.display = "block";

    emptyMessage.style.display = "none";
  }

}

async function updateTodo(todoId, updates){
  let todos = await getTodos();

  todos = todos.map(todo => {

    if(todo.id === todoId){

      return{
        ...todo,
        ...updates
      };

    }

    return todo;

  });

  await saveTodos(todos);
}

async function setTodoDeleted(todoId, deleted){

  await updateTodo(todoId, {
    deleted,
    updatedAt: Date.now()
  });

}

async function setTodoPriority(todoId, priority){

  await updateTodo(todoId, {
    priority,
    updatedAt: Date.now()
  });
}

async function setTodoCompleted(todoId, completed){

  await updateTodo(todoId, {
    completed,
    updatedAt: Date.now()
  });

}

function openDeleteModal(todo){
  todoToDelete = todo;
  deleteModal.classList.add("show");
}

function closeDeleteModal(){
  deleteModal.classList.remove("show");
  todoToDelete = null;
}

async function updateStats(){

  const todos = await getProcessedTodos();

  const completedTodos = todos.filter(function(todo){
    return todo.completed;
  });

  const remainingTodos = todos.filter(function(todo){
    return !todo.completed;
  });

  completedCount.textContent = completedTodos.length;
  remainingCount.textContent = remainingTodos.length;

}

async function closeEditing(li){
  const inputEdit = li.querySelector(".edit-input");

  if(!inputEdit) return;

  const todos = await getTodos();

  const originalTodo = todos.find(t => t.id === Number(li.dataset.id));

  if(!originalTodo){
    li.classList.remove("editing");
    return;
  }

  const newSpan = createTodoText(originalTodo.text);
  const centerContent = li.querySelector(".center-content");

  centerContent.replaceChild(newSpan, inputEdit);
  
  li.classList.remove("editing");
}

async function updateTodoText(todoId, text){

  await updateTodo(todoId, {
    text,
    updatedAt: Date.now()
  });

}

function finishEditing(li, inputEdit, newText){

  const newSpan = createTodoText(newText);

  const centerContent = li.querySelector(".center-content");

  centerContent.replaceChild(newSpan, inputEdit);

  li.classList.remove("editing");

}

function createNotePanel(todo, li){

  const notePanel = document.createElement("div");

  notePanel.classList.add("note-panel");

  notePanel.innerHTML = `
    <textarea class="note-input" placeholder="یادداشت بنویس..."></textarea>

    <div class="note-footer">
      <span class="save-status"></span>

      <div class="note-actions">
        <button class="close-note-btn">
          <i class="bi bi-check-circle-fill"></i>
        </button>
      </div>
    </div>
  `;

  const noteInput = notePanel.querySelector(".note-input");
  const saveStatus = notePanel.querySelector(".save-status");
  
  let saveTimeout;

  noteInput.value = todo.note || "";

  function autoResizeTextarea(){
    noteInput.style.height = "auto";
    noteInput.style.height = noteInput.scrollHeight + "px";
  }

  autoResizeTextarea();

  noteInput.addEventListener("input", autoResizeTextarea);

  noteInput.addEventListener("input", async function(){

    autoResizeTextarea();

    let todos = await getTodos();

    todos = todos.map(t => {

      if(t.id === todo.id){

        return{
          ...t,
          note: noteInput.value,
          updatedAt: Date.now()
        };
      }

      return t;
    });

    saveTodos(todos);

    todo.note = noteInput.value;

    notePanel.updateNoteIcon();

    clearTimeout(saveTimeout);

    saveStatus.textContent = "";

    saveTimeout = setTimeout(() => {

      saveStatus.textContent = "متن شما ذخیره شد";

      saveStatus.classList.add("show");

      setTimeout(() => {
        saveStatus.classList.remove("show");
      }, 2000);

    }, 1000);

  });

  const closeNoteBtn = notePanel.querySelector(".close-note-btn");

  closeNoteBtn.addEventListener("click", async function(event){
    event.stopPropagation();

    li.classList.remove("note-open");

    await renderList();
  });

  return {
    notePanel,
    autoResizeTextarea,
    noteInput
  };

}

function createLeftActions(
  isTrashView,
  restoreBtn,
  noteBtn,
  editBtn,
  confirmBtn,
  deleteBtn
){

  const leftActions = document.createElement("div");

  leftActions.classList.add("left-actions");

  if(isTrashView){

    leftActions.appendChild(restoreBtn);
    leftActions.appendChild(deleteBtn);

  } else {

    leftActions.appendChild(noteBtn);
    leftActions.appendChild(editBtn);
    leftActions.appendChild(confirmBtn);
    leftActions.appendChild(deleteBtn);

  }

  return leftActions;

}

function createCenterContent(spanText){

  const centerContent = document.createElement("div");

  centerContent.classList.add("center-content");

  centerContent.appendChild(spanText);

  return centerContent;

}

function createRightActions(checkbox, priorityBtn){

  const rightActions = document.createElement("div");

  rightActions.classList.add("right-actions");

  rightActions.appendChild(checkbox);
  rightActions.appendChild(priorityBtn);

  return rightActions;

}

function createDeleteButton(todo, isTrashView){

  const deleteBtn = createActionButton(
    "delete-btn",
    '<i class="bi bi-trash"></i>'
  );

  deleteBtn.addEventListener("click", async function(event){
    event.stopPropagation();

    if(isTrashView){

      let todos = await getTodos();

      todos = todos.filter(t => t.id !== todo.id);

      await saveTodos(todos);

      await renderList();

      return;

    }

    if(confirmDelete){

      openDeleteModal(todo);

      return;

    }

    await setTodoDeleted(todo.id, true);

    await renderList();
  });

  return deleteBtn;

}

function createRestoreButton(todo){

   const restoreBtn = createActionButton(
    "restore-btn",
    '<i class="bi bi-recycle"></i>'
  );

  restoreBtn.addEventListener("click", async function(event){
    event.stopPropagation();

    await setTodoDeleted(todo.id, false);

    await renderList();
  });

  return restoreBtn;

}

function createPriorityButton(todo){

  const priorityBtn = document.createElement("span");

  priorityBtn.classList.add("priority-btn");

  if(todo.priority){
      priorityBtn.innerHTML = '<i class="bi bi-star-fill"></i>';
      priorityBtn.classList.add("active");
  } else {
      priorityBtn.innerHTML = '<i class="bi bi-star"></i>';
      priorityBtn.classList.remove("active");
  }

  priorityBtn.addEventListener("click",  async function(event){
    event.stopPropagation();

    await setTodoPriority(todo.id, !todo.priority);

    await renderList();

  });

  return priorityBtn;

}

function createEditButton(todo, li, spanText, centerContent){

  const editBtn = createActionButton(
    "edit-btn",
    '<i class="bi bi-pencil"></i>'
  );

  editBtn.addEventListener("click", async function(event){
    event.stopPropagation();

    const currentEditing = document.querySelector("li.editing");

    if (currentEditing && currentEditing !== li){
      await closeEditing(currentEditing);
    }

    li.classList.add("editing");

    const inputEdit = document.createElement("input");
    inputEdit.classList.add("edit-input");
    inputEdit.type = "text";
    inputEdit.value = spanText.textContent;

    const currentSpan = li.querySelector(".todo-text");
    centerContent.replaceChild(inputEdit, currentSpan);

    inputEdit.focus();

    inputEdit.addEventListener("click", function(event){
      event.stopPropagation();
    });

    inputEdit.addEventListener("keydown", async function(event){

      if(event.key === "Escape"){

        const newSpan = createTodoText(todo.text);

        centerContent.replaceChild(newSpan, inputEdit);

        li.classList.remove("editing");

        return;

      }

      if (event.key === "Enter"){

        const newText = inputEdit.value;

        if(await isDuplicateTodo(newText, todo.id)){
          showMessage("این آیتم تکراری است");
          return;
        }

        await updateTodoText(todo.id, newText);

        await renderList();

      }

    });
  });

  return editBtn;

}

function createConfirmButton(todo, li){

  const confirmBtn = createActionButton(
    'confirm-btn',
    '<i class="bi bi-floppy"></i>'
  );

  confirmBtn.addEventListener("click", async function(){
    const inputEdit = li.querySelector(".edit-input");

    if (!inputEdit) return;

    const newText = inputEdit.value;

    if(await isDuplicateTodo(newText, todo.id)){
      showMessage("این آیتم تکراری است");
      return;
    }

    await updateTodoText(todo.id, newText);

    await renderList();

  });

  return confirmBtn;
  
}

function createNoteButton(
  todo,
  li,
  notePanel,
  autoResizeTextarea
){

  const noteBtn = createActionButton(
    "note-btn",
    '<i class="bi bi-journal"></i>'
  );

  function updateNoteIcon(){

    if(todo.note && todo.note.trim() !== ""){
      noteBtn.innerHTML = '<i class="bi bi-journal-text"></i>';
      noteBtn.classList.add("active");
    } else {
      noteBtn.innerHTML = '<i class="bi bi-journal"></i>';
      noteBtn.classList.remove("active");
    }
  }

  notePanel.updateNoteIcon = updateNoteIcon;

  updateNoteIcon();

  noteBtn.addEventListener("click", function(event){
    event.stopPropagation();

    const currentlyOpen = document.querySelector("li.note-open");

    if(currentlyOpen && currentlyOpen !== li){
      currentlyOpen.classList.remove("note-open");
    }

    li.classList.toggle("note-open");

    const noteInput = notePanel.querySelector(".note-input");
    autoResizeTextarea();

    setTimeout(() => {
      noteInput.focus();

      const length = noteInput.value.length;
      noteInput.setSelectionRange(length, length);
    }, 150);
  });

  return noteBtn;

}

function createItem(todo) {

  const li = document.createElement("li");

  li.dataset.id = todo.id;

  const isTrashView = currentFilter === "trash";

  if (todo.completed){
    li.classList.add("done");
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;

  checkbox.addEventListener("change", async function(){

    await setTodoCompleted(todo.id, checkbox.checked);

    await renderList();
  
  });

  const spanText = createTodoText(todo.text);

  const priorityBtn = createPriorityButton(todo);

  if(todo.priority){
    priorityBtn.classList.add("active");
  }

  const deleteBtn = createDeleteButton(
    todo,
    isTrashView
  );

  const restoreBtn = createRestoreButton(todo);

  const {
    notePanel,
    autoResizeTextarea
  } = createNotePanel(todo, li);

  const noteBtn = createNoteButton(
    todo,
    li,
    notePanel,
    autoResizeTextarea
  );

  const centerContent = createCenterContent(spanText);

  const editBtn = createEditButton(
    todo,
    li,
    spanText,
    centerContent
  );

  const confirmBtn = createConfirmButton(
    todo,
    li
  );

  const rightActions = createRightActions(
    checkbox,
    priorityBtn
  );

  const leftActions = createLeftActions(
    isTrashView,
    restoreBtn,
    noteBtn,
    editBtn,
    confirmBtn,
    deleteBtn
  );

  li.appendChild(rightActions);
  li.appendChild(centerContent);
  li.appendChild(leftActions);
  li.appendChild(notePanel);

  list.appendChild(li);

}

async function saveManualOrder(){

    if(currentSort !== "manual") return;

    const todos = await getTodos();

    [...list.children].forEach((li, index) => {

      const id = Number(li.dataset.id);

      const todo = todos.find(t => t.id === id);

      if(todo){
        todo.order = index;
      }
    });
    
    await saveTodos(todos);
  }

async function addItem() {

  const itemList = {
    id: Date.now(),
    text: input.value,
    completed: false,
    priority: false,
    note: "",
    createdAt: Date.now(),
    updatedAt: null,
    order: Date.now(),
    deleted: false
  };

  let todos = await getTodos();

  if(await isDuplicateTodo(itemList.text)){
    showMessage("این آیتم تکراری است");
    return;
  }

  if (itemList.text.trim() === "") return;
  
  todos.push(itemList);

  await saveTodos(todos);

  await renderList();

  input.value = "";
  input.focus();

  await checkEmptyState();

}

button.addEventListener("click", addItem);

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addItem();
  }
});

await renderList();
await checkEmptyState();

document.addEventListener("click", async function(event){
  const editingLi = document.querySelector("li.editing");

  if(!editingLi) return;

  if(!editingLi.contains(event.target)){
    await closeEditing(editingLi);
  }
});

toolbarSettingsBtn.addEventListener("click", openSettingsModal);

closeSettings.addEventListener("click", closeSettingsModal);

settingsModal.addEventListener("click", function(event){

  if(event.target === settingsModal){
    closeSettingsModal();
  }

});

confirmDeleteToggle.addEventListener("change", function(){

  confirmDelete = confirmDeleteToggle.checked;

  localStorage.setItem("confirmDelete", JSON.stringify(confirmDelete));

});

let deferredPrompt = null;
installAppItem.style.display = "none";

window.addEventListener("beforeinstallprompt", event => {
  console.log("PWA INSTALL AVAILABLE");
  event.preventDefault();
  deferredPrompt = event;
  installAppItem.style.display = "flex";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    const registration = await navigator.serviceWorker.register("./service-worker.js");

    await registration.update();

    // تابع برای نشان دادن توست
    const showToast = (worker) => {
      console.log("SHOW TOAST");
      updateOverlay.classList.add("show");

      updateBtn.onclick = () => {
        worker.postMessage("SKIP_WAITING");
      };
    };

    // ۱. اگر همین الان یک SW در انتظار (waiting) هست
    if (registration.waiting) {
      showToast(registration.waiting);
    }

    // ۲. اگر آپدیت جدیدی پیدا شد
    registration.addEventListener("updatefound", () => {

      console.log("UPDATE FOUND");

      const newWorker = registration.installing;

      newWorker.addEventListener("statechange", () => {
        if(newWorker.state === "installed"){

          console.log("SHOW TOAST");
          showToast(newWorker);
        
        }
      });
    });

    // چک کردن دوره‌ای برای نسخه جدید (هر ۱۰ ثانیه)
    setInterval(() => {
      registration.update();
    }, 10000);
  });

  // ۳. وقتی نسخه جدید فعال شد، صفحه را ریفرش کن
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });

}

toolbarSearchBtn.addEventListener("click", () => {
  toolbarSearchBox.classList.add("show");
  toolbarSearchBtn.style.display = "none";
  toolbarSearchInput.focus();
});

toolbarSearchClose.addEventListener("click", async () => {
  toolbarSearchBox.classList.remove("show");
  toolbarSearchBtn.style.display = "flex";
  toolbarSearchInput.value = "";
  searchValue = "";
  await renderList();
});

toolbarSearchInput.addEventListener("input", async function(){
  searchValue = toolbarSearchInput.value.toLowerCase();
  await renderList();
  await checkEmptyState();
});

toolbarSearchInput.addEventListener("keydown", async function(event){
  if(event.key === "Escape"){
    toolbarSearchBox.classList.remove("show");
    toolbarSearchBtn.style.display = "flex";
    toolbarSearchInput.value = "";
    searchValue = "";
    await renderList();
  }
});

document.addEventListener("keydown", function(event){
  if(event.ctrlKey && event.key === "f"){
    event.preventDefault();
    toolbarSearchBox.classList.add("show");
    toolbarSearchBtn.style.display = "none";
    toolbarSearchInput.focus();
  }
});

exportBtn.addEventListener("click", exportTodos);

importBtn.addEventListener("click", () => {
  importFile.click();
});

importFile.addEventListener(
  "change",
  async function(){

    const file =
      importFile.files[0];

    if(!file) return;

    try{

      const todos =
        await importTodos(file);

      const confirmed =
        confirm(
          "اطلاعات فعلی جایگزین شوند؟"
        );

      if(!confirmed){
        return;
      }

      await saveTodos(todos);

      await renderList();

      console.log("SHOW SUCCESS MESSAGE");
      showMessage(
        "اطلاعات با موفقیت بازیابی شد"
      );

    }

    catch(error){

      console.error(error);

      showMessage(
        "فایل معتبر نیست"
      );

    }

    importFile.value = "";

  }
);

installAppBtn.addEventListener("click", async() => {
  if(!deferredPrompt){
    return;
  }
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  console.log("INSTALL RESULT:", result.outcome);
  deferredPrompt = null;
});
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
const restoreModal = document.getElementById("restoreModal");
const updateOverlay = document.getElementById("updateOverlay");
const updateToast = document.getElementById("updateToast");
const updateBtn = document.getElementById("updateBtn");
const updateVersionText = document.getElementById("updateVersionText");
const updateWhatsNew = document.getElementById("updateWhatsNew");
const showChangesBtn = document.getElementById("showChangesBtn");
const updateChangesList = document.getElementById("updateChangesList");
const appVersionText = document.getElementById("appVersionText");
const appUpdateDate = document.getElementById("appUpdateDate");
const toolbarSettingsBtn = document.getElementById("toolbarSettingsBtn");
const toolbarSearchBtn = document.getElementById("toolbarSearchBtn");
const toolbarSearchBox = document.getElementById("toolbarSearchBox");
const toolbarSearchClose = document.getElementById("toolbarSearchClose");
const toolbarSearchInput = document.getElementById("toolbarSearchInput");
const searchHintBar = document.getElementById("searchHintBar");
const searchHintText = document.getElementById("searchHintText");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const installAppBtn = document.getElementById("installAppBtn");
const installAppItem = document.getElementById("installAppItem");
const authTitle = document.getElementById("authTitle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authToggleBtn = document.getElementById("authToggleBtn");
const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");
const closeProfileBtn = document.getElementById("closeProfileBtn");
const profileEmail = document.getElementById("profileEmail");
const profileUsername = document.getElementById("profileUsername");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const logoutBtn = document.getElementById("logoutBtn");
const bootLoader = document.getElementById("bootLoader");
const bootLoaderText = document.getElementById("bootLoaderText");
const noteModal = document.getElementById("noteModal");
const noteModalInput = document.getElementById("noteModalInput");
const noteModalSaveStatus = document.getElementById("noteModalSaveStatus");
const closeNoteModalBtn = document.getElementById("closeNoteModalBtn");
const saveAndCloseNoteBtn = document.getElementById("saveAndCloseNoteBtn");


//--------------------------------
// App State
//--------------------------------
let currentFilter = localStorage.getItem("todoFilter") || "all";
let currentSort = localStorage.getItem("todoSort") || "auto";
let confirmDelete = JSON.parse(localStorage.getItem("confirmDelete")) ?? true;
let searchValue = "";
let draggedItem = null;
let todoToDelete = null;
let isRegisterMode = false;
let currentUser = null;
let currentProfile = null;
let realtimeSubscription = null;
let deleteModalOpen = false;
let pendingRestoreFile = null;
let activeNoteTodoId = null;
let noteSaveTimeout = null;

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
  getLatestChanges,
  getChangesSince
} from "./changelog.js";

import {
  exportTodos,
  importTodos
} from "./backup.js";

import {
  signInWithGoogle,
  getCurrentUser
} from "./supabase.js";

import {
  register,
  login,
  logout
} from "./auth.js";

import {
  openDB,
  STORE_NAME,
  getAllTodosFromDB,
  saveAllTodosToDB,
  getUserTodos,
  addTodoToSupabase,
  syncTodosFromSupabase,
  loadTodosFromSupabase,
  updateTodoInSupabase,
  deleteTodoFromSupabase,
  getProfile,
  createProfile,
  updateProfile,
  subscribeToTodos,
  replaceTodosForUser
} from "./database.js";


appVersionText.textContent = APP_VERSION;
appUpdateDate.textContent = LAST_UPDATE;
updateVersionText.textContent = `ورژن ${APP_VERSION}`;
if(updateWhatsNew){
  updateWhatsNew.textContent = "بهبود پایداری، بهینه‌سازی سرعت، و رفع باگ‌ها";
}

let pendingServiceWorker = null;
let lastServiceWorkerCheckAt = 0;

function buildWhatsNewText(fallback = "بهبود پایداری، بهینه‌سازی سرعت، و رفع باگ‌ها"){
  return fallback;
}

function showUpdateOverlay({
  title = "نسخه جدید آماده است",
  message = `ورژن ${APP_VERSION}`,
  details = "",
  changes = [],
  buttonText = "بروزرسانی برنامه",
  onConfirm = null
} = {}){
  const titleEl = document.querySelector(".update-modal h2");

  if(titleEl){
    titleEl.textContent = title;
  }

  updateVersionText.textContent = message;

  if(updateWhatsNew){
    updateWhatsNew.textContent = details || buildWhatsNewText();
  }

  if(updateChangesList){
    updateChangesList.innerHTML = "";
    updateChangesList.hidden = true;
  }

  if(showChangesBtn){
    const hasChanges = Array.isArray(changes) && changes.length > 0;

    showChangesBtn.style.display = hasChanges ? "block" : "none";
    showChangesBtn.textContent = "مشاهده تغییرات";

    showChangesBtn.onclick = () => {
      if(!updateChangesList || !hasChanges) return;

      const shouldOpen = updateChangesList.hidden;

      if(shouldOpen){
        updateChangesList.innerHTML = changes
          .map(change => `<li>${change}</li>`)
          .join("");

        updateChangesList.hidden = false;
        showChangesBtn.textContent = "بستن تغییرات";
      } else {
        updateChangesList.hidden = true;
        showChangesBtn.textContent = "مشاهده تغییرات";
      }
    };
  }

  updateBtn.textContent = buttonText;
  updateOverlay.classList.add("show");

  updateBtn.onclick = async () => {
    if(onConfirm){
      await onConfirm();
      return;
    }

    location.reload();
  };
}

function handleVersionAnnouncement(){
  const key = "lastSeenAppVersion";
  const lastSeenVersion = localStorage.getItem(key);

  if(lastSeenVersion !== APP_VERSION){
    localStorage.setItem(key, APP_VERSION);

    if(lastSeenVersion){
      const versionChanges = getChangesSince(lastSeenVersion, APP_VERSION);
      showUpdateOverlay({
        title: "برنامه با موفقیت به‌روزرسانی شد",
        message: `از ${lastSeenVersion} به ${APP_VERSION}`,
        details: "تغییرات جدید بارگذاری شد و آماده استفاده است.",
        changes: versionChanges,
        buttonText: "متوجه شدم",
        onConfirm: async () => {
          updateOverlay.classList.remove("show");
        }
      });
    }
  }
}

updateBtn.addEventListener("click", () => {
  location.reload();
});

async function checkForAppUpdate(registration, force = false){
  const now = Date.now();
  const checkInterval = 5 * 60 * 1000;

  if(!force && now - lastServiceWorkerCheckAt < checkInterval){
    return;
  }

  lastServiceWorkerCheckAt = now;

  try{
    await registration.update();
  } catch(error){
    console.error("UPDATE CHECK ERROR", error);
  }
}

async function getTodoDuplicateInfo(text, excludeId = null){
  const normalizedText = (text || "").trim().toLowerCase();
  const todos = await getTodos();

  let existsActive = false;
  let existsInTrash = false;

  todos.forEach(todo => {
    if(todo.id === excludeId) return;

    const todoText = (todo.text || "").trim().toLowerCase();

    if(todoText !== normalizedText) return;

    if(todo.deleted){
      existsInTrash = true;
    } else {
      existsActive = true;
    }
  });

  return {
    existsActive,
    existsInTrash
  };
}

async function isDuplicateTodo(text, excludeId = null){
  const info = await getTodoDuplicateInfo(text, excludeId);
  return info.existsActive || info.existsInTrash;
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
  await setTodoDeleted(todoToDelete.id, true);
  closeDeleteModal();
  await renderList();
});

deleteModal.addEventListener("click", function(event){

  if(event.target === deleteModal){
    closeDeleteModal();
  }

});

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
    ...todo,
    matchType: null
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
    const normalizedSearch = searchValue.trim().toLowerCase();

    todos = todos.filter(t => {
      const textMatch = (t.text || "").toLowerCase().includes(normalizedSearch);
      const noteMatch = (t.note || "").toLowerCase().includes(normalizedSearch);

      if(textMatch && noteMatch){
        t.matchType = "both";
      } else if(textMatch){
        t.matchType = "title";
      } else if(noteMatch){
        t.matchType = "note";
      } else {
        t.matchType = null;
      }

      return textMatch || noteMatch;
    });
  } else {
    todos.forEach(t => {
      t.matchType = null;
    });
  }

  // console.log("FIRST TODO", todos[0]);

  if(currentSort === "auto"){

    todos.sort((a, b) => {

      const rankDiff = getTodoRank(a) - getTodoRank(b);

      if(rankDiff !== 0){
        return rankDiff;
      }

      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();

      return bTime - aTime;
    });

  }

  if(currentSort === "newest"){
    console.log("CURRENT SORT", currentSort);
    todos.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
    console.log("NEWEST FIRST", todos[0]);
  }

  if(currentSort === "oldest"){
    todos.sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return aTime - bTime;
    });
  }

  if(currentSort === "manual"){
    todos.sort((a, b) => a.order - b.order);
  }
  return todos;
}

async function updateSearchHint(){
  const hasActiveSearch =
    toolbarSearchBox.classList.contains("show") &&
    searchValue.trim() !== "";

  if(!hasActiveSearch){
    searchHintBar.hidden = true;
    searchHintBar.style.display = "none";
    searchHintText.innerHTML = "";
    return;
  }

  const processedTodos = await getProcessedTodos();

  if(processedTodos.length === 0){
    searchHintBar.hidden = true;
    searchHintBar.style.display = "none";
    searchHintText.innerHTML = "";
    return;
  }

  searchHintBar.hidden = false;
  searchHintBar.style.display = "flex";
  searchHintText.innerHTML = `
    <span class="search-hint-label">
      <span class="search-hint-dot search-hint-dot-title"></span>
      <span>نتایج از عنوان آیتم</span>
    </span>
    <span class="search-hint-separator">-</span>
    <span class="search-hint-label">
      <span class="search-hint-dot search-hint-dot-note"></span>
      <span>نتایج از نوت آیتم</span>
    </span>
  `;
}

async function renderList(){
  const todos = await getTodos();
  list.innerHTML = "";
  const processedTodos = await getProcessedTodos();
  processedTodos.forEach(todo => {
    createItem(todo);
  });
  await updateStats();
  await checkEmptyState();
  await updateSearchHint();
}

selectBtn.addEventListener("click", function(){
  customSelect.classList.toggle("open");
});

filterOptions.forEach(option => {
  option.classList.remove("active");
  if(option.dataset.value === currentFilter){
    option.classList.add("active");
    selectedText.innerHTML = option.innerHTML;
  }
  option.addEventListener("click", async function(){
    filterOptions.forEach(opt => {
      opt.classList.remove("active");
    });
    option.classList.add("active");
    currentFilter = option.dataset.value;
    selectedText.innerHTML = option.innerHTML;
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

  if(
    toolbarSearchBox.classList.contains("show") &&
    !toolbarSearchBox.contains(event.target) &&
    !toolbarSearchBtn.contains(event.target)
  ){
    toolbarSearchBox.classList.remove("show");
    toolbarSearchBtn.style.display = "flex";
    toolbarSearchInput.value = "";
    searchValue = "";
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
  console.log("UPDATEDTODO CALLED", todoId, updates);
  let todos = await getTodos();
  let updateTodo = null;
  todos = todos.map(todo => {
    if(todo.id === todoId){
      updateTodo = {
        ...todo,
        ...updates
      };
      return updateTodo;
    }
    return todo;
  });
  await saveTodos(todos);
  if(updateTodo){
    console.log("SENDING TO SUPABASE", updateTodo);
    const result = await updateTodoInSupabase(updateTodo);
    console.log("SUPABASE UPDATE", result);
  }
}

async function setTodoDeleted(todoId, deleted){
  console.log("SET DELETED CALLED", todoId, deleted);
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
  console.log("COMPLETE CLICK", todoId, completed);
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

function autoResizeNoteModalInput(){
  if(!noteModalInput) return;
  noteModalInput.style.height = "auto";
  noteModalInput.style.height = `${noteModalInput.scrollHeight}px`;
}

async function saveActiveNote(){
  if(activeNoteTodoId === null) return;

  await updateTodo(activeNoteTodoId, {
    note: noteModalInput.value,
    updatedAt: Date.now()
  });

  noteModalSaveStatus.textContent = "ذخیره شد";
  noteModalSaveStatus.classList.add("show");

  setTimeout(() => {
    noteModalSaveStatus.classList.remove("show");
  }, 1500);
}

async function closeNoteModal(){
  if(noteSaveTimeout){
    clearTimeout(noteSaveTimeout);
    noteSaveTimeout = null;
    await saveActiveNote();
  }

  noteModal.classList.remove("show");
  activeNoteTodoId = null;
  noteModalInput.value = "";
  noteModalSaveStatus.textContent = "";
}

function openNoteModal(todo){
  activeNoteTodoId = todo.id;
  noteModalInput.value = todo.note || "";
  noteModalSaveStatus.textContent = "";

  noteModal.classList.add("show");

  autoResizeNoteModalInput();

  setTimeout(() => {
    noteModalInput.focus();
    const length = noteModalInput.value.length;
    noteModalInput.setSelectionRange(length, length);
  }, 60);
}

function openRestoreModal(file){
  pendingRestoreFile = file;
  restoreModal.classList.add("show");
}

function closeRestoreModal(){
  restoreModal.classList.remove("show");
  pendingRestoreFile = null;
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
    console.log("INPUT EVENT");
    autoResizeTextarea();

    todo.note = noteInput.value;

    notePanel.updateNoteIcon();

    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(async() => {
      await updateTodo(todo.id, {
        note: noteInput.value,
        updatedAt: Date.now()
      });
      saveStatus.textContent = "ذخیره شد";
      saveStatus.classList.add("show");
      setTimeout(() => {
        saveStatus.classList.remove("show");
      }, 2000);
    }, 1000);

    saveStatus.textContent = "";

  });

  const closeNoteBtn = notePanel.querySelector(".close-note-btn");

  closeNoteBtn.addEventListener("click", async function(event){
    console.log("NOTE CLOSED BUTTON CLICKED");
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

function createSearchSourceBadges(todo){
  const badges = document.createElement("div");

  badges.classList.add("search-source-badges");

  if(todo.matchType === "title" || todo.matchType === "both"){
    const titleBadge = document.createElement("span");
    titleBadge.classList.add("search-source-badge", "search-source-badge-title");
    titleBadge.setAttribute("title", "نتیجه از عنوان آیتم");
    badges.appendChild(titleBadge);
  }

  if(todo.matchType === "note" || todo.matchType === "both"){
    const noteBadge = document.createElement("span");
    noteBadge.classList.add("search-source-badge", "search-source-badge-note");
    noteBadge.setAttribute("title", "نتیجه از نوت آیتم");
    badges.appendChild(noteBadge);
  }

  return badges;
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
      const deleteResult = await deleteTodoFromSupabase(todo.id);

      if(deleteResult.error){
        showMessage("خطا در حذف کامل آیتم");
        return;
      }

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

    const openNote = document.querySelector("li.note-open");
    if(openNote){
      openNote.classList.remove("note-open");
    }

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

        const duplicateInfo = await getTodoDuplicateInfo(newText, todo.id);

        if(duplicateInfo.existsInTrash){
          showMessage("این آیتم در سطل زباله وجود دارد");
          return;
        }

        if(duplicateInfo.existsActive){
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

    const duplicateInfo = await getTodoDuplicateInfo(newText, todo.id);

    if(duplicateInfo.existsInTrash){
      showMessage("این آیتم در سطل زباله وجود دارد");
      return;
    }

    if(duplicateInfo.existsActive){
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

  noteBtn.addEventListener("click", async function(event){
    event.stopPropagation();

    const currentEditing = document.querySelector("li.editing");

    if(currentEditing && currentEditing !== li){
      await closeEditing(currentEditing);
    }

    openNoteModal(todo);
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
  const searchSourceBadges = createSearchSourceBadges(todo);

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
  if(searchValue.trim() && todo.matchType){
    li.appendChild(searchSourceBadges);
  }
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

  if (itemList.text.trim() === "") return;

  const duplicateInfo = await getTodoDuplicateInfo(itemList.text);

  if(duplicateInfo.existsInTrash){
    showMessage("این آیتم در سطل زباله وجود دارد");
    return;
  }

  if(duplicateInfo.existsActive){
    showMessage("این آیتم تکراری است");
    return;
  }
  
  todos.push(itemList);

  await saveTodos(todos);
  if(currentUser){
    const result = await addTodoToSupabase(itemList, currentUser.id);
    if(result.error || !result.data || !result.data[0]){
      showMessage("خطا در همگام‌سازی با سرور");
      return;
    }
    const supabaseTodo = result.data[0];
    itemList.id = supabaseTodo.id;
    todos = todos.map(t => {
      if(t.createdAt === itemList.createdAt){
        return itemList;
      }
      return t;
    });
    await saveTodos(todos);
  }

  await renderList();

  input.value = "";
  input.focus();

  await checkEmptyState();

}

button.addEventListener("click", addItem);

input.addEventListener("keydown", function (event) {

  if(event.key === "Enter"){
    event.preventDefault();
    addItem();
  }

  // if(event.key === "Escape"){
  //   input.value = "";
  //   input.blur();
  // }

});

document.addEventListener("click", async function(event){
  const editingLi = document.querySelector("li.editing");

  if(editingLi && !editingLi.contains(event.target)){
    await closeEditing(editingLi);
  }

});

noteModalInput.addEventListener("input", function(){
  autoResizeNoteModalInput();

  noteModalSaveStatus.textContent = "";

  if(noteSaveTimeout){
    clearTimeout(noteSaveTimeout);
  }

  noteSaveTimeout = setTimeout(async () => {
    await saveActiveNote();
    noteSaveTimeout = null;
    await renderList();
  }, 700);
});

closeNoteModalBtn.addEventListener("click", async () => {
  await closeNoteModal();
  await renderList();
});

saveAndCloseNoteBtn.addEventListener("click", async () => {
  await closeNoteModal();
  await renderList();
});

noteModal.addEventListener("click", async function(event){
  if(event.target === noteModal){
    await closeNoteModal();
    await renderList();
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

    await checkForAppUpdate(registration, true);

    const showToast = (worker) => {
      if(!worker) return;

      pendingServiceWorker = worker;
      showUpdateOverlay({
        title: "نسخه جدید آماده است",
        message: `نسخه ${APP_VERSION} آماده نصب است`,
        details: "برای دریافت آخرین تغییرات، روی دکمه بروزرسانی بزنید.",
        changes: getLatestChanges(APP_VERSION),
        buttonText: "بروزرسانی برنامه",
        onConfirm: async () => {
          if(pendingServiceWorker){
            pendingServiceWorker.postMessage("SKIP_WAITING");
          }
        }
      });
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

    // چک کردن دوره‌ای برای نسخه جدید (هر ۵ دقیقه)
    setInterval(() => {
      checkForAppUpdate(registration);
    }, 5 * 60 * 1000);

    document.addEventListener("visibilitychange", () => {
      if(document.visibilityState === "visible"){
        checkForAppUpdate(registration, true);
      }
    });

    window.addEventListener("focus", () => {
      checkForAppUpdate(registration, true);
    });

    handleVersionAnnouncement();
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

function closeProfileMenu(){
  profileMenu.classList.remove("show");
}

function hideBootLoader(){
  if(!bootLoader) return;

  bootLoader.classList.add("hidden");

  setTimeout(() => {
    bootLoader.style.display = "none";
  }, 220);
}

function showBootLoader(message = "در حال بارگذاری اطلاعات..."){
  if(!bootLoader) return;

  if(bootLoaderText){
    bootLoaderText.textContent = message;
  }

  bootLoader.style.display = "flex";
  bootLoader.classList.remove("hidden");
  bootLoader.classList.add("visible");
}

window.addEventListener("beforeunload", () => {
  showBootLoader("در حال بازنشانی و بارگذاری مجدد...");
});

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const isRefreshKey = key === "f5" || (event.ctrlKey && key === "r");
  const isHardRefresh = event.ctrlKey && event.shiftKey && key === "r";

  if(isRefreshKey || isHardRefresh){
    showBootLoader("در حال بازنشانی و بارگذاری مجدد...");
  }
});

document.addEventListener("keydown", function(event){

  if(event.ctrlKey && event.key === "f"){
    event.preventDefault();
    toolbarSearchBox.classList.add("show");
    toolbarSearchBtn.style.display = "none";
    toolbarSearchInput.focus();
  }

  if(event.key !== "Escape") return;

  if(deleteModal.classList.contains("show")){
    closeDeleteModal();
    return;
  }

  if(settingsModal.classList.contains("show")){
    closeSettingsModal();
    return;
  }

  if(profileMenu.classList.contains("show")){
    closeProfileMenu();
    return;
  }

  if(noteModal.classList.contains("show")){
    closeNoteModal();
    return;
  }

  // document.querySelectorAll(".custom-select.open")
  //   .forEach(el => el.classList.remove("open"));
  customSelect.classList.remove("open");
  sortSelect.classList.remove("open");

  if(document.activeElement === input){
    input.value = "";
    input.blur();
    return;
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
      await importTodos(file);
      openRestoreModal(file);
    }

    catch(error){

      console.error(error);

      showMessage(
        "فایل معتبر نیست"
      );

      importFile.value = "";

    }

  }
);

const cancelRestoreBtn = document.getElementById("cancelRestoreBtn");
const confirmRestoreBtn = document.getElementById("confirmRestoreBtn");

cancelRestoreBtn.addEventListener("click", () => {
  closeRestoreModal();
  importFile.value = "";
});

confirmRestoreBtn.addEventListener("click", async () => {
  if(!pendingRestoreFile){
    return;
  }

  try{
    const todos = await importTodos(pendingRestoreFile);

    if(currentUser){
      const replaceResult = await replaceTodosForUser(currentUser.id, todos);
      if(replaceResult.error){
        throw replaceResult.error;
      }
      await saveTodos(replaceResult.data || todos);
    } else {
      await saveTodos(todos);
    }

    closeRestoreModal();
    closeSettingsModal();
    await renderList();

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

  finally{
    importFile.value = "";
    closeRestoreModal();
  }
});

restoreModal.addEventListener("click", function(event){
  if(event.target === restoreModal){
    closeRestoreModal();
    importFile.value = "";
  }
});

installAppBtn.addEventListener("click", async() => {
  if(!deferredPrompt){
    return;
  }
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  console.log("INSTALL RESULT:", result.outcome);
  deferredPrompt = null;
});

import {supabase}
from "./supabase.js";

console.log("SUPABASE CONNECTED",
  supabase
);

const authScreen = document.getElementById("authScreen");
// const googleLoginBtn = document.getElementById("googleLoginBtn");

// googleLoginBtn.addEventListener("click", async () => {
//   await signInWithGoogle();
// });

async function checkAuth(){
  authScreen.style.display = "none";
  const user = await getCurrentUser();
  if(!user){
    authScreen.style.display = "flex";
    return;
  }
  currentUser = user;
  if(!realtimeSubscription){
    realtimeSubscription = subscribeToTodos(
      user.id,
      async payload => {
        console.log("REALTIME RECIEVED", payload);
      }
    );
  }
  let profileResult = await getProfile(user.id);
  if(profileResult.error || !profileResult.data){
    const createResult = await createProfile({
      id: user.id,
      username: user.email.split("@")[0]
    });
    console.log("CREATE PROFILE RESULT", createResult);
    profileResult = createResult;
  }
  if(!profileResult.data){
    showMessage("خطا در بارگذاری پروفایل");
    return;
  }
  currentProfile = profileResult.data;  
  profileEmail.textContent = user.email;
  profileUsername.value = profileResult.data.username || "";
  profileUsername.textContent = profileResult.data.username;
  await syncTodosFromSupabase(user.id);
  authScreen.style.display = "none";
  await renderList();
}

async function bootApp(){
  try{
    await checkAuth();
    if(!currentUser){
      await renderList();
      await checkEmptyState();
    }
  }
  catch(error){
    console.error("BOOT ERROR", error);
    showMessage("خطا در بارگذاری اولیه");
  }
  finally{
    hideBootLoader();
  }
}

bootApp();

authToggleBtn.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  if(isRegisterMode){
    authTitle.textContent = "ثبت نام";
    authSubmitBtn.textContent = "ثبت نام";
    authToggleBtn.textContent = "ورود";
  } else {
    authTitle.textContent = "ورود به حساب کاربری";
    authSubmitBtn.textContent = "ورود";
    authToggleBtn.textContent = "ثبت نام";
  }
});

authSubmitBtn.addEventListener("click", async () => {
  console.log("AUTH BUTTON CLICKED");
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  if(!email || !password){
    showMessage("لطفا اطلاعات را کامل کنید");
    return;
  }
  try{
    if(isRegisterMode){
      const result = await register(email, password);
      console.log("REGISTER RESULT", result);
      console.log("SHOWMESSAGE FUNCTION", showMessage);
      if(result.error){
        switch(result.error.code){
          case "user_already_exists":
            showMessage("این ایمیل پیش از این ثبت شده است");
            break;
          case "weak_password":
            showMessage("رمز عبور باید حداقل ۸ کاراکتر و شامل حروف بزرگ، کوچک، عدد و نماد باشد");
            break;
          default:
            showMessage(result.error.message);
        }
        return;
      }
      showMessage("ثبت نام انجام شد");
      await checkAuth();
    } else {
      const result = await login(email, password);
      if(result.error){
        switch(result.error.code){
          case "invalid_credentials":
            showMessage("ایمیل یا رمز عبور اشتباه است");
            break;
          default:
            showMessage(result.error.message);
        }
        return;
      }
      showMessage("ورود موفق");
      await checkAuth();
    }
  }
  catch(error){
    console.error(error);
    showMessage("خطا در عملیات");
  }
});

profileBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  profileMenu.classList.toggle("show");
});

closeProfileBtn.addEventListener("click", () => {
  closeProfileMenu();
});

profileMenu.addEventListener("click", (event) => {
  if(event.target === profileMenu){
    closeProfileMenu();
  }
});

logoutBtn.addEventListener("click", async () => {
  await logout();
  location.reload();
});

saveProfileBtn.addEventListener("click", async function(){
  const username = profileUsername.value.trim();
  if(!username){
    showMessage("نام کاربری نمی تواند خالی باشد");
    return;
  }
  const result = await updateProfile(currentUser.id, {
    username
  });
  if(result.error){
    showMessage("خطا در ذخیره پروفایل");
    return;
  }
  showMessage("پروفایل ذخیره شد");
});
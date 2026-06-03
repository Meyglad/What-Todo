//--------------------------------
// DOM Elements
//--------------------------------
const input = document.getElementById("input");
const button = document.getElementById("addBtn");
const list = document.getElementById("list");
const tooltip = document.getElementById("tooltip");
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
const todoTooltip = document.createElement("div");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const confirmDeleteToggle = document.getElementById("confirmDeleteToggle");
const deleteModal = document.getElementById("deleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");


//--------------------------------
// App State
//--------------------------------
let currentFilter = localStorage.getItem("todoFilter") || "all";
let currentSort = localStorage.getItem("todoSort") || "auto";
let confirmDelete = JSON.parse(localStorage.getItem("confirmDelete")) ?? true;
let searchValue = "";
let draggedItem = null;
let todoToDelete = null;





function isDuplicateTodo(text, excludeId = null){

  const normalizedText = text.trim().toLowerCase();

  return getTodos().some(todo =>
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
darkModeToggle.checked = document.body.classList.contains("dark");
initTheme();

cancelDeleteBtn.addEventListener("click", function(){
  closeDeleteModal();
});

confirmDeleteBtn.addEventListener("click", function(){

  if(!todoToDelete) return;

  let todos = getTodos();

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

  savedTodos(todos);
  closeDeleteModal();
  renderList();

});

deleteModal.addEventListener("click", function(event){

  if(event.target === deleteModal){
    closeDeleteModal();
  }

});

todoTooltip.classList.add("todo-tooltip");
document.body.appendChild(todoTooltip);

searchInput.addEventListener("input", function(){
  searchValue = searchInput.value.toLowerCase();

  if(searchInput.value.trim() !== ""){
    clearSearch.classList.add("show");
  } else {
    clearSearch.classList.remove("show");
  }

  renderList();
  checkEmptyState();
});

clearSearch.addEventListener("click", function(){
  searchInput.value = "";
  searchValue = "";

  clearSearch.classList.remove("show");

  renderList();
  checkEmptyState();

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

function getProcessedTodos(){
  let todos = getTodos();

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

function renderList(){
  list.innerHTML = "";

  const todos = getProcessedTodos();

  todos.forEach(todo => {
    createItem(todo);
  });

  updateStats();
  checkEmptyState();
}

function initTheme(){
  const savedTheme = localStorage.getItem("theme");

  if(savedTheme){

    if(savedTheme === "dark"){

      document.body.classList.add("dark");

    }

  } else {

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if(systemDark){

      document.body.classList.add("dark");

    }

  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(event){
    const savedTheme = localStorage.getItem("theme");

    if(savedTheme) return;

    document.body.classList.toggle("dark", event.matches);
  });

  darkModeToggle.addEventListener("change", function(){
    document.body.classList.toggle("dark", darkModeToggle.checked);
    localStorage.setItem("theme", darkModeToggle.checked ? "dark" : "light");
  });
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

  option.addEventListener("click", function(){
    filterOptions.forEach(opt => {
      opt.classList.remove("active");
    });

    option.classList.add("active");

    currentFilter = option.dataset.value;

    selectedText.textContent = option.textContent.trim();

    localStorage.setItem("todoFilter", currentFilter);

    customSelect.classList.remove("open");

    renderList();
    checkEmptyState();
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

  option.addEventListener("click", function(){
    sortOptionItems.forEach(opt => {
      opt.classList.remove("active");
    });

    option.classList.add("active");

    currentSort = option.dataset.value;

    sortSelectedText.textContent = option.textContent.trim();

    localStorage.setItem("todoSort", currentSort);

    sortSelect.classList.remove("open");

    renderList();
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

function checkEmptyState(){

  const allTodos = getTodos();
  const filteredTodos = getProcessedTodos();

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

function getTodos(){
  return JSON.parse(localStorage.getItem("todoList")) || [];
}

function savedTodos(todos){
  localStorage.setItem("todoList", JSON.stringify(todos));
}

function updateTodo(todoId, updates){
  let todos = getTodos();

  todos = todos.map(todo => {

    if(todo.id === todoId){

      return{
        ...todo,
        ...updates
      };

    }

    return todo;

  });

  savedTodos(todos);
}

function setTodoDeleted(todoId, deleted){

  updateTodo(todoId, {
    deleted,
    updatedAt: Date.now()
  });

}

function setTodoPriority(todoId, priority){

  updateTodo(todoId, {
    priority,
    updatedAt: Date.now()
  });
}

function setTodoCompleted(todoId, completed){

  updateTodo(todoId, {
    completed,
    updatedAt: Date.now()
  });

}


function showMessage(text){
  tooltip.textContent = text;

  tooltip.classList.add("show");

  setTimeout(function(){
    tooltip.classList.remove("show");
  }, 2500);
}

function openDeleteModal(todo){
  todoToDelete = todo;
  deleteModal.classList.add("show");
}

function closeDeleteModal(){
  deleteModal.classList.remove("show");
  todoToDelete = null;
}

function updateStats(){

  const todos = getProcessedTodos();

  const completedTodos = todos.filter(function(todo){
    return todo.completed;
  });

  const remainingTodos = todos.filter(function(todo){
    return !todo.completed;
  });

  completedCount.textContent = completedTodos.length;
  remainingCount.textContent = remainingTodos.length;

}

function closeEditing(li){
  const inputEdit = li.querySelector(".edit-input");

  if(!inputEdit) return;

  const originalTodo = getTodos().find(t => t.id === Number(li.dataset.id));
  const newSpan = createTodoText(originalTodo.text);
  const centerContent = li.querySelector(".center-content");

  centerContent.replaceChild(newSpan, inputEdit);
  
  li.classList.remove("editing");
}

function updateTodoText(todoId, text){

  updateTodo(todoId, {
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

  noteInput.addEventListener("input", function(){

    autoResizeTextarea();

    let todos = getTodos();

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

    savedTodos(todos);

    todo.note = noteInput.value;

    notePanel.updateNoteIcon();

    // const noteBtn = li.querySelector("note-btn");

    // if(noteBtn){

    //   if(todo.note && todo.note.trim() !== ""){
    //     noteBtn.innerHTML = '<i class="bi bi-journal-text"></i>';
    //     noteBtn.classList.add("activr");
    //   } else {
    //     noteBtn.innerHTML = '<i class="bi bi-journal"></i>';
    //     noteBtn.classList.remove("active");
    //   }

    // }

    // updateNoteIcon();

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

  closeNoteBtn.addEventListener("click", function(event){
    event.stopPropagation();

    li.classList.remove("note-open");

    renderList();
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

  deleteBtn.addEventListener("click", function(event){
    event.stopPropagation();

    if(isTrashView){

      let todos = getTodos();

      todos = todos.filter(t => t.id !== todo.id);

      savedTodos(todos);

      renderList();

      return;

    }

    if(confirmDelete){

      openDeleteModal(todo);

      return;

    }

    setTodoDeleted(todo.id, true);

    renderList();
  });

  return deleteBtn;

}

function createRestoreButton(todo){

   const restoreBtn = createActionButton(
    "restore-btn",
    '<i class="bi bi-recycle"></i>'
  );

  restoreBtn.addEventListener("click", function(event){
    event.stopPropagation();

    setTodoDeleted(todo.id, false);

    renderList();
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

  priorityBtn.addEventListener("click", function(event){
    event.stopPropagation();

    setTodoPriority(todo.id, !todo.priority);

    renderList();

  });

  return priorityBtn;

}

function createEditButton(todo, li, spanText, centerContent){

  const editBtn = createActionButton(
    "edit-btn",
    '<i class="bi bi-pencil"></i>'
  );

  editBtn.addEventListener("click", function(event){
    event.stopPropagation();

    const currentEditing = document.querySelector("li.editing");

    if (currentEditing && currentEditing !== li){
      closeEditing(currentEditing);
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

    inputEdit.addEventListener("keydown", function(event){

      if(event.key === "Escape"){

        const newSpan = createTodoText(todo.text);

        centerContent.replaceChild(newSpan, inputEdit);

        li.classList.remove("editing");

        return;

      }

      if (event.key === "Enter"){

        const newText = inputEdit.value;

        if(isDuplicateTodo(newText, todo.id)){
          showMessage("این آیتم تکراری است");
          return;
        }

        updateTodoText(todo.id, newText);

        renderList();

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

  confirmBtn.addEventListener("click", function(){
    const inputEdit = li.querySelector(".edit-input");

    if (!inputEdit) return;

    const newText = inputEdit.value;

    if(isDuplicateTodo(newText, todo.id)){
      showMessage("این آیتم تکراری است");
      return;
    }

    updateTodoText(todo.id, newText);

    renderList();

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

  checkbox.addEventListener("change", function(){

    setTodoCompleted(todo.id, checkbox.checked);

    renderList();
  
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

function saveManualOrder(){

    if(currentSort !== "manual") return;

    const todos = getTodos();

    [...list.children].forEach((li, index) => {

      const id = Number(li.dataset.id);

      const todo = todos.find(t => t.id === id);

      if(todo){
        todo.order = index;
      }
    });
    
    savedTodos(todos);
  }

function addItem() {

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

  let todos = getTodos();

  if(isDuplicateTodo(itemList.text)){
    showMessage("این آیتم تکراری است");
    return;
  }

  if (itemList.text.trim() === "") return;
  
  todos.push(itemList);

  savedTodos(todos);

  renderList();

  updateStats();

  input.value = "";
  input.focus();

  checkEmptyState();

}

button.addEventListener("click", addItem);

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    addItem();
  }
});

renderList();
checkEmptyState();

document.addEventListener("click", function(event){
  const editingLi = document.querySelector("li.editing");

  if(!editingLi) return;

  if(!editingLi.contains(event.target)){
    closeEditing(editingLi);
  }
});

function setupTodoTooltip(element, text){
  element.addEventListener("mouseenter", function(){
    
    if(element.scrollWidth <= element.clientWidth){
      return;
    }
    
    todoTooltip.textContent = text;
    
    const rect = element.getBoundingClientRect();
    
    todoTooltip.style.top = `${rect.bottom + 10}px`;
    todoTooltip.style.left = `${rect.left + rect.width / 2}px`;
    todoTooltip.style.transform = "translateX(-50%)";

    todoTooltip.classList.add("show")
  });
  
  element.addEventListener("mouseleave", function(){
    todoTooltip.classList.remove("show");
  });
}

settingsBtn.addEventListener("click", function(){

  settingsModal.classList.add("show");

});

closeSettings.addEventListener("click", function(){
  settingsModal.classList.remove("show");
});

settingsModal.addEventListener("click", function(event){

  if(event.target === settingsModal){
    settingsModal.classList.remove("show");
  }

});

confirmDeleteToggle.addEventListener("change", function(){

  confirmDelete = confirmDeleteToggle.checked;

  localStorage.setItem("confirmDelete", JSON.stringify(confirmDelete));

});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => {
        console.log("Service Worker Registered");
      })
      .catch((err) => {
        console.error(err);
      });
  });
}
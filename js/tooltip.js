const todoTooltip = document.createElement("div");

todoTooltip.classList.add("todo-tooltip");

document.body.appendChild(todoTooltip);

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

export {
    setupTodoTooltip
}
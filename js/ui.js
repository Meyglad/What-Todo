const tooltip = document.getElementById("tooltip");

function showMessage(text){

    tooltip.textContent = text;
    tooltip.classList.add("show");
    
    setTimeout(function(){
        tooltip.classList.remove("show");
    }, 2500);

}

export {
    showMessage };
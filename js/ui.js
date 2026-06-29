const tooltip = document.getElementById("tooltip");

function showMessage(text){
    console.log("SHOW MESSAGE CALLED", text);

    tooltip.textContent = text;
    tooltip.classList.add("show");
    console.log(tooltip);
    console.log(tooltip.className);
    console.log(getComputedStyle(tooltip).opacity);
    
    setTimeout(function(){
        tooltip.classList.remove("show");
    }, 2500);

}

export {
    showMessage };
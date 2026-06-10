function initTheme(darkModeToggle){
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

export {
    initTheme
};
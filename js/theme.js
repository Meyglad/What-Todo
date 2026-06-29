function initTheme(darkModeToggle){

  function applyTheme(isDark) {
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
  }

  const savedTheme = localStorage.getItem("theme");

  if(savedTheme){

    if(savedTheme === "dark"){
      applyTheme(true);
    } else {
      applyTheme(false);
    }

  } else {

    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if(systemDark){
      applyTheme(true);
    } else {
      applyTheme(false);
    }

  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(event){
    const savedTheme = localStorage.getItem("theme");

    if(savedTheme) return;

    applyTheme(event.matches);
  });

  darkModeToggle.addEventListener("change", function(){

    applyTheme(darkModeToggle.checked);
    localStorage.setItem("theme", darkModeToggle.checked ? "dark" : "light");

  });
  
}

export {
    initTheme
};
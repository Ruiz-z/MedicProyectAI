const menu = document.getElementById('menu');
const sidebar = document.getElementById('sidebar')

menu.addEventListener('click',()=>{
    sidebar.classList.toggle('menu-toggle');
    menu.classList.toggle('menu-toggle');
});
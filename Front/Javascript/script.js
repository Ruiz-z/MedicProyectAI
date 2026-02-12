const menu = document.getElementById('menu');
const sidebar = document.getElementById('sidebar')

menu.addEventListener('click',()=>{
    sidebar.classList.toggle('menu-toggle');
    menu.classlist.toggle('menu-toggle');
});
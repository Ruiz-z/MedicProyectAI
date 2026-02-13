document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");

  if (!form || !emailEl || !passEl) {
    console.error("Faltan IDs: loginForm, email o password en el HTML.");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = emailEl.value.trim();
    const password = passEl.value;

    // Credenciales ficticias
    const fakeUser = "mauroruiz0404@gmail.com";
    const fakePass = "123456";

    if (email === fakeUser && password === fakePass) {
      localStorage.setItem("auth", "true");
      window.location.href = "menu.html";
      return;
    }

    alert("Credenciales incorrectas. Use admin@muguerza.com / 123456");
  });
});

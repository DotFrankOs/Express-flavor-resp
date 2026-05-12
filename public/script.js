async function conectarConBackend() {
    try{
        const respuesta = await fetch('/api/saludo');
        const datos = await respuesta.json();

        console.log("Respuesta recibida", datos);
        alert(datos.mensaje);
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
    }
}

conectarConBackend();

let cart = [];

function addToCart(itemName, price) {
  cart.push({ name: itemName, price });
  updateCart();
}

function updateCart() {
  const cartItems = document.getElementById("cart-items");
  const totalText = document.getElementById("total");
  if (!cartItems || !totalText) return;

  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - $${item.price}`;
    const del = document.createElement("button");
    del.textContent = "❌";
    del.style.marginLeft = "10px";
    del.onclick = () => {
      cart.splice(index, 1);
      updateCart();
    };
    li.appendChild(del);
    cartItems.appendChild(li);
    total += item.price;
  });
  totalText.textContent = `Total: $${total.toFixed(2)}`;
}

function buy() {
  alert("¡Compra exitosa! 🎉");
  cart = [];
  updateCart();
}

function goToMenu(menuPage) {
  window.location.href = menuPage;
}

function goBack() {
  window.history.back();
}

function logout() {
  window.location.href = "index.html";
}


const btnReporte = document.getElementById("btnReporte");
const modalReporte = document.getElementById("modalReporte");
const cerrarModal = document.getElementById("cerrarModal");
const enviarReporte = document.getElementById("enviarReporte");
const textoReporte = document.getElementById("textoReporte");

btnReporte.onclick = () => {
  modalReporte.style.display = "flex";
};

cerrarModal.onclick = () => {
  modalReporte.style.display = "none";
};

enviarReporte.onclick = () => {
  const mensaje = textoReporte.value.trim();

  if (mensaje === "") {
    alert("Por favor escribe tu el nombre de tu ´pn.");
    return;
  }

  alert("Gracias, tu reporte ha sido enviado:\n" + mensaje);
  textoReporte.value = "";
  modalReporte.style.display = "none";
};
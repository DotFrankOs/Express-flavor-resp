import { authService } from '../auth/authService.js';
import { alertService } from '../alert/alertService.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById("login-form");
    const btnSaveAccount = document.getElementById("btnSaveAccount");
    const inputUser = document.getElementById("inputUser");
    const inputPass = document.getElementById("inputPass");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const result = await authService.login(inputUser.value, inputPass.value);
            window.location.href = "restaurantes.html";
        } catch (err) {
            alertService.show(err.message || "Error de autenticación", 'error');
        }
    });

    btnSaveAccount.addEventListener('click', async () => {
        if (!inputUser.value || !inputPass.value) {
            alertService.show("Por favor completa los campos", 'error');
            return;
        }

        try {
            await authService.register({
                user: inputUser.value,
                pass: inputPass.value,
                name: inputUser.value
            });
            alertService.show("Cuenta guardada localmente. Ahora puedes iniciar sesión.", 'success');
        } catch (err) {
            alertService.show(err.message || "Error al registrar", 'error');
        }
    });
});
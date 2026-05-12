export const alertService = {
  show(message, type = 'info') {
    const existing = document.getElementById('custom-alert');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'custom-alert';
    overlay.className = 'alert-overlay';

    const titles = { info: 'Atención', error: 'Error', success: '¡Listo!' };

    overlay.innerHTML = `
      <div class="alert-box ${type}">
        <h3>${titles[type] || titles.info}</h3>
        <p>${message}</p>
        <div class="alert-actions">
          <button class="alert-btn" id="alert-ok">Aceptar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const close = () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 250);
    };

    overlay.querySelector('#alert-ok').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    const onKey = (e) => {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
    };
    document.addEventListener('keydown', onKey);
  },

  confirm(message) {
    return new Promise((resolve) => {
      const existing = document.getElementById('custom-confirm');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'custom-confirm';
      overlay.className = 'alert-overlay';

      overlay.innerHTML = `
        <div class="alert-box info">
          <h3>Confirmar acción</h3>
          <p>${message}</p>
          <div class="alert-actions">
            <button class="alert-btn" id="confirm-yes">Sí, confirmar</button>
            <button class="alert-btn secondary" id="confirm-no">Cancelar</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('active'));

      const close = (result) => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 250);
        resolve(result);
      };

      overlay.querySelector('#confirm-yes').addEventListener('click', () => close(true));
      overlay.querySelector('#confirm-no').addEventListener('click', () => close(false));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });

      const onKey = (e) => {
        if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', onKey); }
      };
      document.addEventListener('keydown', onKey);
    });
  }
};
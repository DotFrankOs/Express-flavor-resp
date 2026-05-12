import { reportService } from '../scripts/report/reportService.js';

class ReportButton extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        #report-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%;
                        background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:9999; }
        #report-modal > div { background:#75563c; padding:20px; width:300px; border-radius:10px; text-align:center; color:white; }
        #report-btn { position:fixed; top:10px; right:10px; padding:8px 15px; z-index:100; }
      </style>
      <button id="report-btn">Reporte</button>
      <div id="report-modal">
        <div>
          <h3>Enviar Reporte</h3>
          <textarea id="report-text" rows="4" style="width:100%;"></textarea><br><br>
          <input type="file" id="report-image" accept="image/*"><br><br>
          <button id="send-report">Enviar</button>
          <button id="close-report">Cancelar</button>
        </div>
      </div>
    `;

    const modal = this.querySelector('#report-modal');
    this.querySelector('#report-btn').addEventListener('click', () => modal.style.display = 'flex');
    this.querySelector('#close-report').addEventListener('click', () => modal.style.display = 'none');
    this.querySelector('#send-report').addEventListener('click', async () => {
      const desc = this.querySelector('#report-text').value;
      const img = this.querySelector('#report-image').files[0];
      const result = await reportService.send(desc, img);
      if (result.success) {
        alert('Reporte enviado');
        modal.style.display = 'none';
        this.querySelector('#report-text').value = '';
        this.querySelector('#report-image').value = '';
      } else {
        alert(result.message);
      }
    });
  }
}
customElements.define('report-button', ReportButton);
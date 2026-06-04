const tabBtns = document.querySelectorAll('.tab-btn');
const simPanels = document.querySelectorAll('.sim-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    
    tabBtns.forEach(b => b.classList.remove('active'));
    simPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const target = document.getElementById('tab-' + btn.dataset.tab);
    if (target) target.classList.add('active');

    limpiarResultados();
  });
});

const hamburger = document.getElementById('hamburger');
const mainNav   = document.getElementById('mainNav');

hamburger.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

mainNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mainNav.classList.remove('open'));
});

function mostrarResultados(html) {
  const area = document.getElementById('resultados-area');
  area.innerHTML = html;

  document.getElementById('resultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function limpiarResultados() {
  const area = document.getElementById('resultados-area');
  area.innerHTML = `
    <div class="results-placeholder">
      <span class="placeholder-icon">📊</span>
      <p>Los resultados aparecerán aquí después de calcular un escenario.</p>
    </div>`;
}

function esNumeroValido(val) {
  return val !== '' && val !== null && !isNaN(Number(val)) && Number(val) >= 0;
}

function marcarError(input) {
  input.classList.add('error');
  input.addEventListener('input', () => input.classList.remove('error'), { once: true });
  return false;
}

function semaforoUso(pct) {
  if (pct < 50) return 'ok';
  if (pct < 80) return 'warn';
  return 'danger';
}

function tarjeta(label, value, clase = '') {
  return `
    <div class="res-card ${clase}">
      <div class="res-card-label">${label}</div>
      <div class="res-card-value">${value}</div>
    </div>`;
}

function badge(texto, clase) {
  const iconos = { ok: '✅', warn: '⚠️', danger: '🚨' };
  return `<div class="status-badge ${clase}">${iconos[clase]} ${texto}</div>`;
}

function barraProgreso(labelIzq, labelDer, pct, clase) {
  const pctCap = Math.min(pct, 100);
  return `
    <div class="progress-container">
      <div class="progress-label">
        <span>${labelIzq}</span>
        <span>${labelDer}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${clase}" style="width:${pctCap}%"></div>
      </div>
    </div>`;
}

function fmt(n) {
  return Number(n).toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function resetForm(escenario) {
  switch (escenario) {
    case 'A':
      ['a-reserva','a-consumo','a-reabastecimiento','a-critico'].forEach(id => {
        document.getElementById(id).value = '';
        document.getElementById(id).classList.remove('error');
      });
      break;

    case 'B': {
      const cont = document.getElementById('b-productos-container');
      
      const primero = cont.querySelector('.producto-row');
      cont.innerHTML = '';
      cont.appendChild(primero);
      primero.querySelectorAll('input').forEach(i => { i.value = ''; i.classList.remove('error'); });
      break;
    }

    case 'C':
      ['c-normal','c-desvio','c-costo-km','c-viajes'].forEach(id => {
        document.getElementById(id).value = '';
        document.getElementById(id).classList.remove('error');
      });
      break;

    case 'D': {
      document.getElementById('d-presupuesto').value = '';
      const cont = document.getElementById('d-items-container');
      const primero = cont.querySelector('.producto-row');
      cont.innerHTML = '';
      cont.appendChild(primero);
      primero.querySelectorAll('input').forEach(i => { i.value = ''; i.classList.remove('error'); });
      break;
    }

    case 'E':
      ['e-demanda','e-porcentaje','e-stock','e-personas'].forEach(id => {
        document.getElementById(id).value = '';
        document.getElementById(id).classList.remove('error');
      });
      break;

    case 'F': {
      ['f-ingreso','f-gasto-anterior','f-gasto-actual'].forEach(id => {
        document.getElementById(id).value = '';
        document.getElementById(id).classList.remove('error');
      });
      const cont = document.getElementById('f-productos-container');
      const primero = cont.querySelector('.producto-row');
      cont.innerHTML = '';
      const h4 = document.createElement('h4');
      h4.className = 'sub-label';
      h4.textContent = 'Productos de referencia (opcional)';
      cont.appendChild(h4);
      cont.appendChild(primero);
      primero.querySelectorAll('input').forEach(i => { i.value = ''; i.classList.remove('error'); });
      break;
    }
  }
  limpiarResultados();
}

function calcularA() {
  const reservaInp   = document.getElementById('a-reserva');
  const consumoInp   = document.getElementById('a-consumo');
  const reabastInp   = document.getElementById('a-reabastecimiento');
  const criticoInp   = document.getElementById('a-critico');

  let valido = true;
  if (!esNumeroValido(reservaInp.value))  valido = marcarError(reservaInp);
  if (!esNumeroValido(consumoInp.value))  valido = marcarError(consumoInp);
  if (!esNumeroValido(reabastInp.value))  valido = marcarError(reabastInp);
  if (!esNumeroValido(criticoInp.value))  valido = marcarError(criticoInp);
  if (!valido) { alert('⚠️ Por favor completa todos los campos con valores válidos.'); return; }

  const reserva        = Number(reservaInp.value);
  const consumo        = Number(consumoInp.value);
  const reabastecimiento = Number(reabastInp.value);
  const nivelCritico   = Number(criticoInp.value);

  const perdidaNeta = consumo - reabastecimiento;

  const filas = [];
  let actual = reserva;
  let diasCritico = null;
  let diasAgotado = null;

  for (let dia = 1; dia <= 60; dia++) {
    actual = actual - consumo + reabastecimiento;
    if (actual <= nivelCritico && diasCritico === null) diasCritico = dia;
    if (actual <= 0 && diasAgotado === null) { diasAgotado = dia; actual = 0; }
    filas.push({ dia, reserva: actual });
    if (actual <= 0) break;
  }

  let diaExacto = null;
  if (perdidaNeta > 0) {
    diaExacto = ((reserva - nivelCritico) / perdidaNeta).toFixed(1);
  }

  let estado, estadoTexto;
  if (perdidaNeta <= 0) {
    estado = 'ok';
    estadoTexto = 'La reserva no se agota (reabastecimiento ≥ consumo)';
  } else if (diasCritico && diasCritico <= 5) {
    estado = 'danger';
    estadoTexto = `¡Alerta crítica! Nivel crítico en ${diaExacto || diasCritico} días`;
  } else if (diasCritico && diasCritico <= 14) {
    estado = 'warn';
    estadoTexto = `Precaución: nivel crítico en ${diaExacto || diasCritico} días`;
  } else {
    estado = 'ok';
    estadoTexto = `Reserva estable. Nivel crítico en ${diaExacto || '--'} días`;
  }

  const filasMostradas = filas.slice(0, 15);
  const filasHTML = filasMostradas.map(f => {
    const cls = f.reserva <= nivelCritico ? 'danger' : f.reserva <= nivelCritico * 2 ? 'warn' : 'ok';
    return `<tr>
      <td>Día ${f.dia}</td>
      <td style="color:var(--${cls})">${fmt(f.reserva)} L</td>
      <td>${f.reserva <= 0 ? '🚨 Agotado' : f.reserva <= nivelCritico ? '⚠️ Crítico' : '✅ Normal'}</td>
    </tr>`;
  }).join('');

  const pctRestante = (filas[0]?.reserva / reserva) * 100;

  mostrarResultados(`
    <div class="result-block">
      <div class="result-header">🛢️ Simulador de Abastecimiento de Carburantes</div>
      ${badge(estadoTexto, estado)}
      <div class="result-cards-row">
        ${tarjeta('Reserva Inicial', `${fmt(reserva)} L`)}
        ${tarjeta('Pérdida Neta / Día', `${fmt(perdidaNeta)} L`, perdidaNeta > 0 ? 'danger' : 'ok')}
        ${tarjeta('Día Nivel Crítico', diaExacto ? `Día ${diaExacto}` : 'No alcanza', perdidaNeta > 0 ? estado : 'ok')}
        ${tarjeta('Día de Agotamiento', diasAgotado ? `Día ${diasAgotado}` : 'Sostenible', diasAgotado ? 'danger' : 'ok')}
      </div>
      ${barraProgreso('Nivel crítico', 'Reserva inicial', (reserva > 0 ? (nivelCritico / reserva) * 100 : 0), 'danger')}
      <h4 class="sub-label" style="margin-bottom:12px">Proyección diaria (primeros ${filasMostradas.length} días)</h4>
      <table class="res-table">
        <thead><tr><th>Día</th><th>Reserva restante</th><th>Estado</th></tr></thead>
        <tbody>${filasHTML}</tbody>
      </table>
      ${filas.length > 15 ? `<p style="color:var(--text-muted);font-size:0.82rem;margin-top:10px">Se muestran los primeros 15 días. Total proyectado: ${filas.length} días hasta el agotamiento.</p>` : ''}
    </div>
  `);
}

function agregarProducto() {
  const cont = document.getElementById('b-productos-container');
  const div = document.createElement('div');
  div.className = 'producto-row';
  div.innerHTML = `
    <div class="form-grid four-col">
      <div class="form-group">
        <label>Producto</label>
        <input type="text" class="b-nombre" placeholder="Ej: Leche" />
      </div>
      <div class="form-group">
        <label>Precio anterior (Bs)</label>
        <input type="number" class="b-anterior" placeholder="Ej: 5" min="0" step="0.01" />
      </div>
      <div class="form-group">
        <label>Precio actual (Bs)</label>
        <input type="number" class="b-actual" placeholder="Ej: 7" min="0" step="0.01" />
      </div>
      <div class="form-group">
        <label>Cantidad mensual</label>
        <input type="number" class="b-cantidad" placeholder="Ej: 8" min="0" />
      </div>
    </div>`;
  cont.appendChild(div);
}

function calcularB() {
  const filas = document.querySelectorAll('#b-productos-container .producto-row');
  const productos = [];
  let valido = true;

  filas.forEach((fila, i) => {
    const nombre   = fila.querySelector('.b-nombre');
    const anterior = fila.querySelector('.b-anterior');
    const actual   = fila.querySelector('.b-actual');
    const cantidad = fila.querySelector('.b-cantidad');

    if (!nombre.value.trim())           { valido = marcarError(nombre); }
    if (!esNumeroValido(anterior.value)){ valido = marcarError(anterior); }
    if (!esNumeroValido(actual.value))  { valido = marcarError(actual); }
    if (!esNumeroValido(cantidad.value)){ valido = marcarError(cantidad); }

    if (valido || productos.length === 0) {
      productos.push({
        nombre:   nombre.value.trim() || `Producto ${i+1}`,
        anterior: Number(anterior.value),
        actual:   Number(actual.value),
        cantidad: Number(cantidad.value)
      });
    }
  });

  if (!valido) { alert('⚠️ Completa todos los campos de los productos correctamente.'); return; }
  let gastoAnteriorTotal = 0;
  let gastoActualTotal   = 0;

  const filasHTML = productos.map(p => {
    const gastoAntes  = p.anterior * p.cantidad;
    const gastoActual = p.actual * p.cantidad;
    const incremento  = p.actual - p.anterior;
    const pctAumento  = p.anterior > 0 ? ((incremento / p.anterior) * 100).toFixed(1) : '—';
    const diferencia  = gastoActual - gastoAntes;

    gastoAnteriorTotal += gastoAntes;
    gastoActualTotal   += gastoActual;

    return `<tr>
      <td>${p.nombre}</td>
      <td>${fmt(p.anterior)} Bs</td>
      <td>${fmt(p.actual)} Bs</td>
      <td style="color:var(--danger)">+${fmt(incremento)} Bs (${pctAumento}%)</td>
      <td>${p.cantidad}</td>
      <td>${fmt(gastoAntes)} Bs</td>
      <td>${fmt(gastoActual)} Bs</td>
      <td style="color:var(--danger)">+${fmt(diferencia)} Bs</td>
    </tr>`;
  }).join('');

  const diferencia = gastoActualTotal - gastoAnteriorTotal;
  const pctTotal   = gastoAnteriorTotal > 0 ? ((diferencia / gastoAnteriorTotal) * 100).toFixed(1) : 0;
  const estado     = Number(pctTotal) < 10 ? 'ok' : Number(pctTotal) < 25 ? 'warn' : 'danger';

  mostrarResultados(`
    <div class="result-block">
      <div class="result-header">🛒 Simulador de Precios de Alimentos</div>
      ${badge(`Gasto aumentó un ${pctTotal}%`, estado)}
      <div class="result-cards-row">
        ${tarjeta('Gasto anterior', `${fmt(gastoAnteriorTotal)} Bs`)}
        ${tarjeta('Gasto actual', `${fmt(gastoActualTotal)} Bs`, estado)}
        ${tarjeta('Diferencia mensual', `+${fmt(diferencia)} Bs`, 'danger')}
        ${tarjeta('Aumento porcentual', `${pctTotal}%`, estado)}
      </div>
      ${barraProgreso('Gasto anterior', 'Gasto actual', gastoAnteriorTotal > 0 ? (gastoActualTotal / gastoAnteriorTotal) * 100 : 0, estado)}
      <h4 class="sub-label" style="margin-bottom:12px">Detalle por producto</h4>
      <table class="res-table">
        <thead>
          <tr>
            <th>Producto</th><th>Precio ant.</th><th>Precio act.</th>
            <th>Incremento</th><th>Cant.</th><th>Gasto ant.</th><th>Gasto act.</th><th>Diferencia</th>
          </tr>
        </thead>
        <tbody>${filasHTML}</tbody>
      </table>
    </div>
  `);
}

function calcularC() {
  const normalInp  = document.getElementById('c-normal');
  const desvioInp  = document.getElementById('c-desvio');
  const costoInp   = document.getElementById('c-costo-km');
  const viajesInp  = document.getElementById('c-viajes');

  let valido = true;
  if (!esNumeroValido(normalInp.value))  valido = marcarError(normalInp);
  if (!esNumeroValido(desvioInp.value))  valido = marcarError(desvioInp);
  if (!esNumeroValido(costoInp.value))   valido = marcarError(costoInp);
  if (!esNumeroValido(viajesInp.value))  valido = marcarError(viajesInp);
  if (!valido) { alert('⚠️ Completa todos los campos correctamente.'); return; }

  const distNormal = Number(normalInp.value);
  const distDesvio = Number(desvioInp.value);
  const costoPorKm = Number(costoInp.value);
  const viajes     = Number(viajesInp.value);

  const costoNormalViaje  = distNormal * costoPorKm;
  const costoDesvioViaje  = distDesvio * costoPorKm;
  const diferencia        = distDesvio - distNormal;
  const costoAdicionalViaje = diferencia * costoPorKm;
  const costoNormalSemana = costoNormalViaje * viajes;
  const costoDesvioSemana = costoDesvioViaje * viajes;
  const adicionalSemana   = costoAdicionalViaje * viajes;
  const adicionalMes      = adicionalSemana * 4;

  const pctAumento = costoNormalSemana > 0 ? ((adicionalSemana / costoNormalSemana) * 100).toFixed(1) : 0;
  const estado     = Number(pctAumento) < 20 ? 'warn' : 'danger';

  mostrarResultados(`
    <div class="result-block">
      <div class="result-header">🚌 Simulador de Costo de Transporte</div>
      ${badge(`Costo aumenta un ${pctAumento}% por el desvío`, estado)}
      <div class="result-cards-row">
        ${tarjeta('Distancia adicional', `${fmt(diferencia)} km / viaje`)}
        ${tarjeta('Costo normal (semana)', `${fmt(costoNormalSemana)} Bs`, 'ok')}
        ${tarjeta('Costo con desvío (sem.)', `${fmt(costoDesvioSemana)} Bs`, estado)}
        ${tarjeta('Gasto adicional / semana', `${fmt(adicionalSemana)} Bs`, 'danger')}
        ${tarjeta('Gasto adicional / mes', `${fmt(adicionalMes)} Bs`, 'danger')}
        ${tarjeta('Aumento porcentual', `${pctAumento}%`, estado)}
      </div>
      ${barraProgreso('Ruta normal', `Ruta con desvío (+${pctAumento}%)`, distNormal > 0 ? (distDesvio / distNormal) * 100 : 0, estado)}
      <table class="res-table">
        <thead><tr><th>Concepto</th><th>Por viaje</th><th>Por semana</th><th>Por mes (x4)</th></tr></thead>
        <tbody>
          <tr>
            <td>Ruta normal</td>
            <td>${fmt(costoNormalViaje)} Bs</td>
            <td>${fmt(costoNormalSemana)} Bs</td>
            <td>${fmt(costoNormalSemana * 4)} Bs</td>
          </tr>
          <tr>
            <td>Ruta con desvío</td>
            <td>${fmt(costoDesvioViaje)} Bs</td>
            <td>${fmt(costoDesvioSemana)} Bs</td>
            <td>${fmt(costoDesvioSemana * 4)} Bs</td>
          </tr>
          <tr style="font-weight:600">
            <td style="color:var(--danger)">Diferencia adicional</td>
            <td style="color:var(--danger)">+${fmt(costoAdicionalViaje)} Bs</td>
            <td style="color:var(--danger)">+${fmt(adicionalSemana)} Bs</td>
            <td style="color:var(--danger)">+${fmt(adicionalMes)} Bs</td>
          </tr>
        </tbody>
      </table>
    </div>
  `);
}

function agregarItemD() {
  const cont = document.getElementById('d-items-container');
  const div = document.createElement('div');
  div.className = 'producto-row';
  div.innerHTML = `
    <div class="form-grid three-col">
      <div class="form-group">
        <label>Producto</label>
        <input type="text" class="d-nombre" placeholder="Ej: Fideo" />
      </div>
      <div class="form-group">
        <label>Precio (Bs)</label>
        <input type="number" class="d-precio" placeholder="Ej: 8" min="0" step="0.01" />
      </div>
      <div class="form-group">
        <label>Cantidad</label>
        <input type="number" class="d-cantidad" placeholder="Ej: 2" min="0" />
      </div>
    </div>`;
  cont.appendChild(div);
}

function calcularD() {
  const presupuestoInp = document.getElementById('d-presupuesto');
  if (!esNumeroValido(presupuestoInp.value)) {
    marcarError(presupuestoInp);
    alert('⚠️ Ingresa un presupuesto válido.');
    return;
  }

  const presupuesto = Number(presupuestoInp.value);
  const filas = document.querySelectorAll('#d-items-container .producto-row');
  const items = [];
  let valido = true;

  filas.forEach((fila, i) => {
    const nombre   = fila.querySelector('.d-nombre');
    const precio   = fila.querySelector('.d-precio');
    const cantidad = fila.querySelector('.d-cantidad');
    if (!nombre.value.trim())            valido = marcarError(nombre);
    if (!esNumeroValido(precio.value))   valido = marcarError(precio);
    if (!esNumeroValido(cantidad.value)) valido = marcarError(cantidad);
    items.push({
      nombre:   nombre.value.trim() || `Producto ${i+1}`,
      precio:   Number(precio.value),
      cantidad: Number(cantidad.value)
    });
  });

  if (!valido) { alert('⚠️ Completa todos los campos de los productos.'); return; }

  const totalCompra = items.reduce((sum, it) => sum + (it.precio * it.cantidad), 0);
  const saldo       = presupuesto - totalCompra;
  const alcanza     = saldo >= 0;
  const pctUso      = presupuesto > 0 ? (totalCompra / presupuesto) * 100 : 100;

  let nivelGasto;
  if (pctUso < 60)       nivelGasto = { texto: 'Bajo', clase: 'ok' };
  else if (pctUso < 90)  nivelGasto = { texto: 'Medio', clase: 'warn' };
  else                   nivelGasto = { texto: 'Alto', clase: 'danger' };

  const estado = alcanza ? (pctUso < 90 ? 'ok' : 'warn') : 'danger';

  const filasHTML = items.map(it => {
    const subtotal = it.precio * it.cantidad;
    return `<tr>
      <td>${it.nombre}</td>
      <td>${fmt(it.precio)} Bs</td>
      <td>${it.cantidad}</td>
      <td><strong>${fmt(subtotal)} Bs</strong></td>
    </tr>`;
  }).join('');

  mostrarResultados(`
    <div class="result-block">
      <div class="result-header">👨‍👩‍👧 Simulador de Compras Familiares</div>
      ${badge(
        alcanza
          ? `El presupuesto ALCANZA (sobran ${fmt(saldo)} Bs)`
          : `El presupuesto NO ALCANZA (faltan ${fmt(Math.abs(saldo))} Bs)`,
        estado
      )}
      <div class="result-cards-row">
        ${tarjeta('Presupuesto', `${fmt(presupuesto)} Bs`)}
        ${tarjeta('Total compra', `${fmt(totalCompra)} Bs`, estado)}
        ${tarjeta(alcanza ? 'Saldo restante' : 'Monto faltante', `${fmt(Math.abs(saldo))} Bs`, alcanza ? 'ok' : 'danger')}
        ${tarjeta('Nivel de gasto', nivelGasto.texto, nivelGasto.clase)}
      </div>
      ${barraProgreso('Presupuesto usado', `${pctUso.toFixed(1)}%`, pctUso, nivelGasto.clase)}
      <table class="res-table">
        <thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${filasHTML}
          <tr style="font-weight:700;border-top:2px solid var(--border-strong)">
            <td colspan="3">TOTAL</td>
            <td style="color:var(--${estado})">${fmt(totalCompra)} Bs</td>
          </tr>
        </tbody>
      </table>
    </div>
  `);
}

function calcularE() {
  const demandaInp   = document.getElementById('e-demanda');
  const pctInp       = document.getElementById('e-porcentaje');
  const stockInp     = document.getElementById('e-stock');
  const personasInp  = document.getElementById('e-personas');

  let valido = true;
  if (!esNumeroValido(demandaInp.value))  valido = marcarError(demandaInp);
  if (!esNumeroValido(pctInp.value))      valido = marcarError(pctInp);
  if (!esNumeroValido(stockInp.value))    valido = marcarError(stockInp);
  if (!esNumeroValido(personasInp.value)) valido = marcarError(personasInp);
  if (!valido) { alert('⚠️ Completa todos los campos correctamente.'); return; }

  const demandaNormal  = Number(demandaInp.value);
  const porcentaje     = Number(pctInp.value);
  const stock          = Number(stockInp.value);
  const personas       = Number(personasInp.value);

  // Modelo: nuevaDemanda = demanda + demanda * (pct/100)
  const nuevaDemanda   = demandaNormal + demandaNormal * (porcentaje / 100);
  const diferencia     = nuevaDemanda - demandaNormal;
  const stockRestante  = stock - nuevaDemanda;
  const alcanza        = stockRestante >= 0;
  const pctStockUsado  = stock > 0 ? (nuevaDemanda / stock) * 100 : 100;

  const porPersona     = personas > 0 ? (stock / personas).toFixed(2) : 'N/A';
  const estado         = alcanza ? (pctStockUsado < 80 ? 'ok' : 'warn') : 'danger';

  mostrarResultados(`
    <div class="result-block">
      <div class="result-header">📦 Simulador de Rumor de Escasez y Compras por Pánico</div>
      ${badge(
        alcanza
          ? `Stock suficiente (sobran ${fmt(stockRestante)} unidades)`
          : `⚡ Stock INSUFICIENTE (faltan ${fmt(Math.abs(stockRestante))} unidades)`,
        estado
      )}
      <div class="result-cards-row">
        ${tarjeta('Demanda normal', `${fmt(demandaNormal)} u.`)}
        ${tarjeta('Nueva demanda (con rumor)', `${fmt(nuevaDemanda)} u.`, 'danger')}
        ${tarjeta('Aumento de demanda', `+${fmt(diferencia)} u. (+${porcentaje}%)`, 'danger')}
        ${tarjeta('Stock disponible', `${fmt(stock)} u.`)}
        ${tarjeta(alcanza ? 'Stock sobrante' : 'Déficit de stock', `${fmt(Math.abs(stockRestante))} u.`, alcanza ? 'ok' : 'danger')}
        ${tarjeta('Por persona/familia', `${porPersona} u.`, pctStockUsado > 100 ? 'danger' : 'ok')}
      </div>
      ${barraProgreso(`Demanda normal (${fmt(demandaNormal)} u.)`, `Nueva demanda (${fmt(nuevaDemanda)} u.)`, pctStockUsado, estado)}
      <table class="res-table">
        <thead><tr><th>Indicador</th><th>Valor</th><th>Evaluación</th></tr></thead>
        <tbody>
          <tr><td>Demanda normal</td><td>${fmt(demandaNormal)} unidades</td><td style="color:var(--ok)">✅ Base</td></tr>
          <tr><td>Demanda por pánico</td><td>${fmt(nuevaDemanda)} unidades</td><td style="color:var(--danger)">🚨 +${porcentaje}%</td></tr>
          <tr><td>Stock disponible</td><td>${fmt(stock)} unidades</td><td>—</td></tr>
          <tr><td>Balance final</td><td>${fmt(stockRestante)} unidades</td>
            <td style="color:var(--${estado})">${alcanza ? '✅ Suficiente' : '🚨 Insuficiente'}</td></tr>
          <tr><td>Personas atendidas</td><td>${personas}</td>
            <td style="color:var(--${alcanza ? 'ok' : 'danger'})">${alcanza ? `Todas (${porPersona} u./persona)` : `Solo ${Math.floor(stock)} atendidas`}</td></tr>
        </tbody>
      </table>
    </div>
  `);
}

function agregarProductoF() {
  const cont = document.getElementById('f-productos-container');
  const div  = document.createElement('div');
  div.className = 'producto-row';
  div.innerHTML = `
    <div class="form-grid four-col">
      <div class="form-group">
        <label>Producto</label>
        <input type="text" class="f-nombre" placeholder="Ej: Pan" />
      </div>
      <div class="form-group">
        <label>Precio anterior (Bs)</label>
        <input type="number" class="f-pant" placeholder="Ej: 3" min="0" step="0.01" />
      </div>
      <div class="form-group">
        <label>Precio actual (Bs)</label>
        <input type="number" class="f-pact" placeholder="Ej: 5" min="0" step="0.01" />
      </div>
      <div class="form-group">
        <label>Cantidad mensual</label>
        <input type="number" class="f-cant" placeholder="Ej: 30" min="0" />
      </div>
    </div>`;
  cont.appendChild(div);
}

function calcularF() {
  const ingresoInp   = document.getElementById('f-ingreso');
  const gAnteriorInp = document.getElementById('f-gasto-anterior');
  const gActualInp   = document.getElementById('f-gasto-actual');

  let valido = true;
  if (!esNumeroValido(ingresoInp.value))   valido = marcarError(ingresoInp);
  if (!esNumeroValido(gAnteriorInp.value)) valido = marcarError(gAnteriorInp);
  if (!esNumeroValido(gActualInp.value))   valido = marcarError(gActualInp);
  if (!valido) { alert('⚠️ Completa los campos de ingreso y gastos.'); return; }

  const ingreso        = Number(ingresoInp.value);
  const gastoAnterior  = Number(gAnteriorInp.value);
  const gastoActual    = Number(gActualInp.value);

  const saldoAntes     = ingreso - gastoAnterior;
  const saldoAhora     = ingreso - gastoActual;
  const aumentoGasto   = gastoActual - gastoAnterior;
  const pctPerdida     = gastoAnterior > 0
    ? (((gastoActual - gastoAnterior) / gastoAnterior) * 100).toFixed(1)
    : 0;

  let afectacion;
  if (saldoAhora < 0)                       afectacion = { texto: 'Crítica — Ingreso insuficiente', clase: 'danger' };
  else if (Number(pctPerdida) > 25)          afectacion = { texto: 'Alta — Pérdida severa de poder adquisitivo', clase: 'danger' };
  else if (Number(pctPerdida) > 10)          afectacion = { texto: 'Moderada — Impacto notable', clase: 'warn' };
  else                                       afectacion = { texto: 'Baja — Impacto leve', clase: 'ok' };

  const filasProductos = document.querySelectorAll('#f-productos-container .producto-row');
  let productosHTML = '';
  const productosData = [];

  filasProductos.forEach(fila => {
    const n   = fila.querySelector('.f-nombre');
    const pa  = fila.querySelector('.f-pant');
    const pac = fila.querySelector('.f-pact');
    const c   = fila.querySelector('.f-cant');
    if (n && n.value && esNumeroValido(pa?.value) && esNumeroValido(pac?.value) && esNumeroValido(c?.value)) {
      const gastoA = Number(pa.value) * Number(c.value);
      const gastoC = Number(pac.value) * Number(c.value);
      const pct = pa.value > 0 ? (((Number(pac.value) - Number(pa.value)) / Number(pa.value)) * 100).toFixed(1) : 0;
      productosData.push({ n: n.value, gastoA, gastoC, pct });
    }
  });

  if (productosData.length > 0) {
    const filas = productosData.map(p => `
      <tr>
        <td>${p.n}</td>
        <td>${fmt(p.gastoA)} Bs</td>
        <td>${fmt(p.gastoC)} Bs</td>
        <td style="color:var(--danger)">+${fmt(p.gastoC - p.gastoA)} Bs</td>
        <td style="color:var(--danger)">${p.pct}%</td>
      </tr>`).join('');
    productosHTML = `
      <h4 class="sub-label" style="margin-bottom:12px">Productos de referencia</h4>
      <table class="res-table">
        <thead><tr><th>Producto</th><th>Gasto anterior</th><th>Gasto actual</th><th>Diferencia</th><th>% Aumento</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>`;
  }

  mostrarResultados(`
    <div class="result-block">
      <div class="result-header">💸 Simulador de Pérdida del Poder Adquisitivo</div>
      ${badge(`Afectación: ${afectacion.texto}`, afectacion.clase)}
      <div class="result-cards-row">
        ${tarjeta('Ingreso mensual', `${fmt(ingreso)} Bs`)}
        ${tarjeta('Gasto anterior', `${fmt(gastoAnterior)} Bs`, 'ok')}
        ${tarjeta('Gasto actual', `${fmt(gastoActual)} Bs`, afectacion.clase)}
        ${tarjeta('Aumento del gasto', `+${fmt(aumentoGasto)} Bs`, 'danger')}
        ${tarjeta('% Pérdida poder adquis.', `${pctPerdida}%`, afectacion.clase)}
        ${tarjeta('Saldo libre antes', `${fmt(saldoAntes)} Bs`, saldoAntes > 0 ? 'ok' : 'danger')}
        ${tarjeta('Saldo libre ahora', `${fmt(saldoAhora)} Bs`, saldoAhora > 0 ? (saldoAhora < 200 ? 'warn' : 'ok') : 'danger')}
      </div>
      ${barraProgreso('Gasto anterior', `Gasto actual (+${pctPerdida}%)`, gastoAnterior > 0 ? (gastoActual / gastoAnterior) * 100 : 100, afectacion.clase)}
      <table class="res-table" style="margin-bottom:20px">
        <thead><tr><th>Período</th><th>Ingreso</th><th>Gasto</th><th>Saldo libre</th><th>% del ingreso gastado</th></tr></thead>
        <tbody>
          <tr>
            <td>Antes</td>
            <td>${fmt(ingreso)} Bs</td>
            <td>${fmt(gastoAnterior)} Bs</td>
            <td style="color:var(--ok)">${fmt(saldoAntes)} Bs</td>
            <td>${ingreso > 0 ? ((gastoAnterior/ingreso)*100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Ahora</td>
            <td>${fmt(ingreso)} Bs</td>
            <td style="color:var(--${afectacion.clase})">${fmt(gastoActual)} Bs</td>
            <td style="color:var(--${saldoAhora > 0 ? 'warn' : 'danger'})">${fmt(saldoAhora)} Bs</td>
            <td>${ingreso > 0 ? ((gastoActual/ingreso)*100).toFixed(1) : 0}%</td>
          </tr>
        </tbody>
      </table>
      ${productosHTML}
    </div>
  `);
}

function activarTab(letra) {
  tabBtns.forEach(b => {
    if (b.dataset.tab === letra) b.click();
  });
  document.getElementById('simulador').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function cargarCaso1() {
  activarTab('A');
  setTimeout(() => {
    setVal('a-reserva', 10000);
    setVal('a-consumo', 1200);
    setVal('a-reabastecimiento', 300);
    setVal('a-critico', 2000);
    calcularA();
  }, 350);
}

function cargarCaso2() {
  activarTab('B');
  setTimeout(() => {
    resetForm('B');
    const datos = [
      { n:'Arroz', a:8, ac:11, c:10 },
      { n:'Papa',  a:7, ac:10, c:8 },
      { n:'Aceite',a:12, ac:18, c:4 }
    ];
    const cont = document.getElementById('b-productos-container');
    
    cont.innerHTML = '';
    datos.forEach((d, i) => {
      const div = document.createElement('div');
      div.className = 'producto-row';
      div.innerHTML = `
        <div class="form-grid four-col">
          <div class="form-group"><label>Producto</label><input type="text" class="b-nombre" value="${d.n}" /></div>
          <div class="form-group"><label>Precio anterior (Bs)</label><input type="number" class="b-anterior" value="${d.a}" /></div>
          <div class="form-group"><label>Precio actual (Bs)</label><input type="number" class="b-actual" value="${d.ac}" /></div>
          <div class="form-group"><label>Cantidad mensual</label><input type="number" class="b-cantidad" value="${d.c}" /></div>
        </div>`;
      cont.appendChild(div);
    });
    calcularB();
  }, 350);
}

function cargarCaso3() {
  activarTab('C');
  setTimeout(() => {
    setVal('c-normal', 10);
    setVal('c-desvio', 16);
    setVal('c-costo-km', 2);
    setVal('c-viajes', 5);
    calcularC();
  }, 350);
}

function cargarCaso4() {
  activarTab('D');
  setTimeout(() => {
    resetForm('D');
    setVal('d-presupuesto', 500);
    const cont = document.getElementById('d-items-container');
    cont.innerHTML = '';
    const items = [
      { n:'Arroz', p:11, c:10 },
      { n:'Papa',  p:10, c:8 },
      { n:'Aceite',p:18, c:4 },
      { n:'Azúcar',p:9,  c:6 },
      { n:'Fideos',p:7,  c:4 }
    ];
    items.forEach(it => {
      const div = document.createElement('div');
      div.className = 'producto-row';
      div.innerHTML = `
        <div class="form-grid three-col">
          <div class="form-group"><label>Producto</label><input type="text" class="d-nombre" value="${it.n}" /></div>
          <div class="form-group"><label>Precio (Bs)</label><input type="number" class="d-precio" value="${it.p}" /></div>
          <div class="form-group"><label>Cantidad</label><input type="number" class="d-cantidad" value="${it.c}" /></div>
        </div>`;
      cont.appendChild(div);
    });
    calcularD();
  }, 350);
}

function cargarCaso5() {
  activarTab('E');
  setTimeout(() => {
    setVal('e-demanda', 100);
    setVal('e-porcentaje', 40);
    setVal('e-stock', 120);
    setVal('e-personas', 50);
    calcularE();
  }, 350);
}

function cargarCaso6() {
  activarTab('F');
  setTimeout(() => {
    resetForm('F');
    setVal('f-ingreso', 3000);
    setVal('f-gasto-anterior', 2200);
    setVal('f-gasto-actual', 2800);
    const cont = document.getElementById('f-productos-container');
    const filas = cont.querySelectorAll('.producto-row');
    if (filas.length > 0) {
      const fila = filas[0];
      fila.querySelector('.f-nombre').value = 'Aceite';
      fila.querySelector('.f-pant').value   = 12;
      fila.querySelector('.f-pact').value   = 18;
      fila.querySelector('.f-cant').value   = 4;
    }
    calcularF();
  }, 350);
}
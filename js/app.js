const hoy = new Date().toISOString().slice(0,10);

const selector = document.getElementById('selectorDia');
const contenedor = document.getElementById('rutina');
const titulo = document.getElementById('titulo');
const resetBtn = document.getElementById('resetDia');

/* ===== MODAL ===== */
const modal = document.getElementById('modalNota');
const modalTitulo = document.getElementById('modalTitulo');
const notaPeso = document.getElementById('notaPeso');
const notaTexto = document.getElementById('notaTexto');
const btnGuardarNota = document.getElementById('guardarNota');
const btnCancelarNota = document.getElementById('cancelarNota');
let notaActual = null;

/* ===== KEYS ===== */
const kSerie = (d,b,e,s)=>`gym_${d}_${b}_${e}_${s}`;
const kHist = (d,e)=>`hist_${d}_${e.replace(/\s+/g,'_')}`;

/* ===== INIT ===== */
function iniciarApp() {
  selector.innerHTML = '';

  Object.keys(RUTINAS).forEach(d=>{
    const o=document.createElement('option');
    o.value=d;
    o.textContent=RUTINAS[d].nombre;
    selector.appendChild(o);
  });

  selector.onchange=()=>render(selector.value);
  resetBtn.onclick=resetDia;

  render(Object.keys(RUTINAS)[0]);
}

/* ===== HELPERS ===== */
function ejercicioCompleto(d,b,e){
  const ej=RUTINAS[d].bloques[b].ejercicios[e];
  for(let s=1;s<=ej.series;s++){
    if(localStorage.getItem(kSerie(d,b,e,s))!=='1') return false;
  }
  return true;
}

function serieCompleta(d,b,s){
  return RUTINAS[d].bloques[b].ejercicios.every((ej,e)=>{
    if(s>ej.series) return true;
    return localStorage.getItem(kSerie(d,b,e,s))==='1';
  });
}

function bloqueCompleto(d,b){
  return RUTINAS[d].bloques[b].ejercicios.every((_,e)=>ejercicioCompleto(d,b,e));
}

function toggleEjercicio(d,b,e,on){
  const ej=RUTINAS[d].bloques[b].ejercicios[e];
  for(let s=1;s<=ej.series;s++){
    on?localStorage.setItem(kSerie(d,b,e,s),'1'):localStorage.removeItem(kSerie(d,b,e,s));
  }
}

function toggleSerie(d,b,s,on){
  RUTINAS[d].bloques[b].ejercicios.forEach((ej,e)=>{
    if(s<=ej.series){
      on?localStorage.setItem(kSerie(d,b,e,s),'1'):localStorage.removeItem(kSerie(d,b,e,s));
    }
  });
}

function toggleBloque(d,b,on){
  RUTINAS[d].bloques[b].ejercicios.forEach((ej,e)=>{
    for(let s=1;s<=ej.series;s++){
      on?localStorage.setItem(kSerie(d,b,e,s),'1'):localStorage.removeItem(kSerie(d,b,e,s));
    }
  });
}

/* ===== NOTAS ===== */
function abrirNota(d,e){
  notaActual={d,e};
  modalTitulo.textContent=e;
  const hist=JSON.parse(localStorage.getItem(kHist(d,e))||'{}');
  notaPeso.value=hist[hoy]?.peso||'';
  notaTexto.value=hist[hoy]?.nota||'';
  modal.classList.remove('oculto');
}

btnGuardarNota.onclick=()=>{
  const key=kHist(notaActual.d,notaActual.e);
  const hist=JSON.parse(localStorage.getItem(key)||'{}');
  hist[hoy]={peso:notaPeso.value,nota:notaTexto.value};
  localStorage.setItem(key,JSON.stringify(hist));
  modal.classList.add('oculto');
};

btnCancelarNota.onclick=()=>modal.classList.add('oculto');

/* ===== EXPORT / IMPORT ===== */
function exportarDatos(){
  const data={};
  Object.keys(localStorage).forEach(k=>data[k]=localStorage.getItem(k));
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='rutina_backup.json';
  a.click();
}

function importarDatos(file){
  const r=new FileReader();
  r.onload=e=>{
    const d=JSON.parse(e.target.result);
    Object.keys(d).forEach(k=>localStorage.setItem(k,d[k]));
    render(selector.value);
  };
  r.readAsText(file);
}

/* ===== RENDER ===== */
function render(d){
  contenedor.innerHTML='';
  titulo.textContent=RUTINAS[d].nombre;

  RUTINAS[d].bloques.forEach((bloque,b)=>{
    const bh=document.createElement('div');
    bh.className='bloque-header';

    const h2=document.createElement('h2');
    h2.textContent=bloque.titulo;

    const chk=document.createElement('input');
    chk.type='checkbox';
    chk.checked=bloqueCompleto(d,b);
    chk.onchange=()=>{toggleBloque(d,b,chk.checked);render(d);};

    bh.append(h2,chk);
    contenedor.appendChild(bh);

    const table=document.createElement('table');
    table.innerHTML=`
      <tr>
        <th>Ejercicio</th><th>X</th>
        ${[1,2,3,4].map(s=>`
          <th>${s}°
            <input type="checkbox"
              ${serieCompleta(d,b,s)?'checked':''}
              onchange="toggleSerie('${d}',${b},${s},this.checked);render('${d}')">
          </th>`).join('')}
      </tr>
    `;

    bloque.ejercicios.forEach((ej,e)=>{
      let cols='';
      for(let s=1;s<=4;s++){
        cols+=s<=ej.series
          ? `<td><input type="checkbox"
              ${localStorage.getItem(kSerie(d,b,e,s))==='1'?'checked':''}
              onchange="this.checked
                ?localStorage.setItem('${kSerie(d,b,e,s)}','1')
                :localStorage.removeItem('${kSerie(d,b,e,s)}')"></td>`
          : '<td></td>';
      }

      table.innerHTML+=`
        <tr>
          <td>
            <input type="checkbox"
              ${ejercicioCompleto(d,b,e)?'checked':''}
              onchange="toggleEjercicio('${d}',${b},${e},this.checked);render('${d}')">
            ${ej.nombre}
            <span class="lapiz" onclick="abrirNota('${d}','${ej.nombre}')">✏️</span>
          </td>
          <td>${ej.reps}</td>
          ${cols}
        </tr>`;
    });

    contenedor.appendChild(table);
  });
}

function resetDia(){
  const d=selector.value;
  Object.keys(localStorage)
    .filter(k=>k.startsWith(`gym_${d}_`))
    .forEach(k=>localStorage.removeItem(k));
  render(d);
}

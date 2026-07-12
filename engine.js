/* ==========================================================
   ДВИЖОК. Этот файл НЕ трогаем при добавлении новых инструкций.
   Он читает объект window.INSTRUCTIONS, который собирается
   из файлов в папке /data/ (каждый файл дописывает туда одну инструкцию).
   ========================================================== */

window.INSTRUCTIONS = window.INSTRUCTIONS || {};

let currentKey = null;
let currentNode = null;
let history = [];

// категория -> подпись в меню (если появится новая категория — добавить сюда)
const CATEGORY_LABELS = {
  print: "МФУ и печать",
  workplace: "Рабочее место / ЕБС",
  atm: "Банкоматы"
};

function buildMenu(){
  const menu = document.getElementById('menuScreen');
  const keys = Object.keys(window.INSTRUCTIONS);

  // группируем по категориям в порядке CATEGORY_LABELS, остальные — в конце
  const cats = Object.keys(CATEGORY_LABELS);
  keys.forEach(k=>{
    const c = window.INSTRUCTIONS[k].category;
    if(c && !cats.includes(c)) cats.push(c);
  });

  let num = 1;
  cats.forEach(cat=>{
    const inCat = keys.filter(k=>window.INSTRUCTIONS[k].category===cat);
    if(inCat.length===0) return;

    const label = document.createElement('div');
    label.className='cat-label';
    label.textContent = CATEGORY_LABELS[cat] || cat;
    menu.appendChild(label);

    const grid = document.createElement('div');
    grid.className='card-grid';
    inCat.forEach(key=>{
      const inst = window.INSTRUCTIONS[key];
      const card = document.createElement('button');
      card.className='card';
      card.onclick=()=>openInstruction(key);
      card.innerHTML = `
        <div class="card-num">${String(num).padStart(2,'0')}</div>
        <div class="card-body">
          <div class="card-title">${inst.title}</div>
          <div class="card-meta">${inst.meta || ''}</div>
        </div>
        <div class="card-arrow">→</div>`;
      grid.appendChild(card);
      num++;
    });
    menu.appendChild(grid);
  });
}

function openInstruction(key){
  currentKey = key;
  history = [];
  document.getElementById('menuScreen').style.display='none';
  document.getElementById('topbar').style.display='flex';
  document.getElementById('stageScreen').style.display='block';
  document.getElementById('brandLabel').textContent = window.INSTRUCTIONS[key].title;
  goNode(window.INSTRUCTIONS[key].start);
}

function goMenu(){
  document.getElementById('menuScreen').style.display='block';
  document.getElementById('topbar').style.display='none';
  document.getElementById('stageScreen').style.display='none';
  document.getElementById('progressFill').style.width='0%';
}

function goNode(nodeId, push=true){
  if(push && currentNode) history.push(currentNode._id);
  const inst = window.INSTRUCTIONS[currentKey];
  const node = inst.nodes[nodeId];
  node._id = nodeId;
  currentNode = node;
  render(node);
}

function render(node){
  const stage = document.getElementById('stageScreen');
  stage.innerHTML='';
  const view = document.createElement('div');
  view.className='step-view active';

  if(node.type==='end'){
    const endImgList = node.imgs ? node.imgs : (node.img ? [node.img] : []);
    const endImg = endImgList.length ? `<div class="step-img-row">${endImgList.map(src=>`<div class="step-img"><img src="${src}" alt="" loading="lazy"></div>`).join('')}</div>` : '';
    view.innerHTML = `
      <div class="end-view">
        <div class="end-mark">&#10003;</div>
        <div class="end-title">${node.title}</div>
        <div class="end-sub">${node.text}</div>
        ${endImg}
        <div class="nav-row">
          <button class="btn btn-ghost" onclick="goBack()">← Назад</button>
          <button class="btn btn-primary" onclick="goMenu()">К списку инструкций</button>
        </div>
      </div>`;
    document.getElementById('progressFill').style.width='100%';
    stage.appendChild(view);
    return;
  }

  if(node.type==='choice'){
    let opts = node.options.map(o=>`
      <button class="choice-btn" onclick="goNode('${o.next}')">
        <span>${o.label}</span><span class="arrow">→</span>
      </button>`).join('');
    view.innerHTML = `
      <div class="choice-label">Развилка</div>
      <div class="step-title">${node.question}</div>
      <div class="choice-grid">${opts}</div>
      <div class="nav-row">
        ${history.length? '<button class="btn btn-ghost" onclick="goBack()">← Назад</button>' : ''}
      </div>`;
    stage.appendChild(view);
    document.getElementById('progressFill').style.width = '50%';
    return;
  }

  // обычный шаг
  const pct = node.of ? Math.round((node.n/node.of)*100) : 60;
  document.getElementById('progressFill').style.width = pct+'%';

  const tag = node.branchTag ? `<span style="color:var(--amber);">· ${node.branchTag}</span>` : '';
  const imgList = node.imgs ? node.imgs : (node.img ? [node.img] : []);
  const img = imgList.length ? `<div class="step-img-row">${imgList.map(src=>`<div class="step-img"><img src="${src}" alt="" loading="lazy"></div>`).join('')}</div>` : '';
  const note = node.note ? `<div class="note-box">${node.note}</div>` : '';
  const danger = node.danger ? `<div class="danger-box"><span class="danger-icon">&#9888;</span>${node.danger}</div>` : '';

  view.innerHTML = `
    <div class="ghost-num">${String(node.n).padStart(2,'0')}</div>
    <div class="step-label"><span>Шаг</span><span class="count">${node.n} / ${node.of}</span>${tag}</div>
    <div class="step-title">${node.title}</div>
    <div class="step-text">${node.text}</div>
    ${img}
    ${note}
    ${danger}
    <div class="nav-row">
      ${history.length? '<button class="btn btn-ghost" onclick="goBack()">← Назад</button>' : ''}
      <button class="btn btn-primary" onclick="goNode('${node.next}')">Дальше →</button>
    </div>`;
  stage.appendChild(view);
}

function goBack(){
  if(history.length===0){ goMenu(); return; }
  const prevId = history.pop();
  goNode(prevId, false);
}

document.addEventListener('DOMContentLoaded', buildMenu);

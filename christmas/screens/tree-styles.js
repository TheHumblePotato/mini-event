import {options} from '../data/model.js';
import {scene} from '../scene/art.js';

const fields = {species:'Tree species', setting:'Landscape', weather:'Weather', star:'Topper', visibility:'Tree visibility'};

export function treeStyleFields(form, tree, stage) {
  const controls = form.querySelector('.tree-style-fields');
  for (const [key, title] of Object.entries(fields)) {
    const label = document.createElement('label');
    label.textContent = title;
    const select = document.createElement('select');
    select.name = key;
    for (const value of options[key]) select.add(new Option(value, value));
    select.value = tree[key] ?? options[key][0];
    label.append(select);
    controls.append(label);
  }
  const appearance = ['species','setting','weather','star'];
  let displayed = stage.firstElementChild ? tree : null;
  function preview() {
    const values = Object.fromEntries(new FormData(form));
    if (displayed && appearance.every(key => displayed[key] === values[key])) return;
    stage.innerHTML = scene({...tree, ...values}, true);
    displayed = values;
  }
  controls.addEventListener('change', preview);
  preview();
  return preview;
}

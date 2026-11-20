import {options} from './model.js';
import {scene} from './art.js';

const styles = {
  'Harbor pilot': {species:'Scots pine', setting:'Harbor lights', weather:'Lake mist', star:'Compass rose'},
  'First tracks': {species:'Spruce', setting:'Alpine dusk', weather:'Feather snow', star:'Silver'},
  'Polar night': {species:'Blue cedar', setting:'Northern lights', weather:'Diamond dust', star:'Crescent moon'},
  'Winter express': {species:'Fir', setting:'Snowbound railway', weather:'Flurries', star:'Brass'},
  'Under glass': {species:'Cypress', setting:'Glasshouse garden', weather:'Ice halo', star:'Holly spray'},
  'Market day': {species:'Atlas cedar', setting:'Clocktower market', weather:'Snowfall', star:'Ribbon bow'}
};

const fields = {species:'Evergreen', setting:'Landscape', weather:'Weather', star:'Topper', visibility:'Tree visibility'};

export function treeStyleFields(form, original, stage) {
  const controls = form.querySelector('.tree-style-fields');
  function selectField(title, values, name) {
    const label = document.createElement('label');
    label.textContent = title;
    const select = document.createElement('select');
    if (name) select.name = name;
    for (const value of values) select.add(new Option(value, value));
    label.append(select);
    controls.append(label);
    return select;
  }
  const preset = selectField('Style preset', ['Custom', ...Object.keys(styles)]);
  for (const [key, label] of Object.entries(fields)) {
    const control = selectField(label, options[key], key);
    control.value = original[key] ?? options[key][0];
  }
  function update() {
    const values = Object.fromEntries(new FormData(form));
    preset.value = Object.keys(styles).find(name =>
      Object.entries(styles[name]).every(([key, value]) => values[key] === value)
    ) ?? 'Custom';
    stage.innerHTML = scene({...original, ...values}, true);
  }
  controls.addEventListener('change', event => {
    if (event.target === preset && styles[preset.value]) {
      for (const [key, value] of Object.entries(styles[preset.value])) form.elements[key].value = value;
    }
    update();
  });
  // Custom describes the current combination when it differs from the presets.
  preset.options[0].disabled = true;
  update();
}

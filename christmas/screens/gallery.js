import {scene} from '../scene/art.js';

export async function showGallery(content, loadTrees, treeUrl) {
  content.innerHTML = `<section class="directory">
    <a id="back-tree">← My tree</a><h1>Public trees</h1>
    <div class="gallery-tools">
      <label>Find a friend<input type="search" placeholder="Tree owner’s name"></label>
      <label>Sort trees<select>
        <option value="name">Owner A–Z</option>
        <option value="fewest">Fewest ornaments</option>
        <option value="most">Most ornaments</option>
      </select></label>
    </div><p class="gallery-empty" role="status"></p><div class="tree-grid"></div>
  </section>`;
  content.querySelector('#back-tree').href = treeUrl();
  const tools = content.querySelector('.gallery-tools');
  const search = tools.querySelector('input'), order = tools.querySelector('select');
  const empty = content.querySelector('.gallery-empty'), grid = content.querySelector('.tree-grid');
  tools.hidden = true;
  empty.textContent = 'Loading trees…';
  let trees;
  try { trees = await loadTrees(); }
  catch (error) { empty.textContent = 'The gallery could not be loaded.'; throw error; }
  if (!trees.length) {
    empty.textContent = 'The gallery is quiet. Plant a public tree to join it.';
    return;
  }
  tools.hidden = false;
  const cards = trees.map(tree => {
    const link = document.createElement('a');
    link.href = treeUrl({id:tree.id});
    link.innerHTML = '<div class="thumbnail" inert aria-hidden="true">' + scene({...tree, weather:'Clear'}, true) + '</div><h2></h2><p></p>';
    link.querySelector('h2').textContent = tree.name + '’s tree';
    link.querySelector('p').textContent = tree.count + (tree.count === 1 ? ' ornament' : ' ornaments');
    return {tree, link};
  });
  function sort() {
    cards.sort(({tree:a}, {tree:b}) => {
      const count = order.value === 'most' ? b.count - a.count : order.value === 'fewest' ? a.count - b.count : 0;
      return count || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
    });
    const sorted = document.createDocumentFragment();
    for (const {link} of cards) sorted.append(link);
    grid.replaceChildren(sorted);
  }
  function filter() {
    const query = search.value.trim().toLowerCase();
    let matches = 0;
    for (const {tree, link} of cards) {
      link.hidden = !tree.name.toLowerCase().includes(query);
      if (!link.hidden) matches++;
    }
    empty.textContent = matches ? '' : 'No public trees match that name.';
  }
  order.onchange = sort;
  search.oninput = filter;
  sort();
}

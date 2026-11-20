export const options = {
  species: ['Fir', 'Spruce', 'Blue cedar', 'Scots pine', 'Cypress', 'Western hemlock', 'Atlas cedar', 'Giant sequoia', 'Paper birch', 'Monkey puzzle'], setting: ['Courtyard', 'Woodland', 'Alpine dusk', 'Frozen lake', 'Northern lights', 'Harbor lights', 'Solstice mill', 'Snowbound railway', 'Glasshouse garden', 'Skating pond', 'Clocktower market', 'Tidepool cove', 'Glacier grotto', 'Summit observatory'],
  weather: ['Snowfall', 'Clear', 'Flurries', 'Snowstorm', 'Diamond dust', 'Lake mist', 'Sleet', 'Feather snow', 'Spindrift', 'Ice halo', 'Graupel', 'Light pillars'], star: ['None', 'Brass', 'Silver', 'Rose gold', 'Glass spire', 'Paper angel', 'Ribbon bow', 'Crescent moon', 'Solstice sun', 'Compass rose', 'Holly spray', 'Armillary sphere', 'Swallowtail pennant', 'Stained glass rosette'],
  visibility: ['Public', 'Private'], kind: ['Bell', 'Gift', 'Ribbon', 'Snowflake', 'Lantern', 'Mitten', 'Bauble', 'Heart', 'Crescent', 'Skate', 'Cardinal', 'Pinecone', 'Candle', 'Snowman', 'Apple', 'Candy cane', 'Gingerbread', 'Stocking', 'Jewel', 'Paper star', 'Mushroom', 'Teapot', 'Cabin', 'Fox', 'Wreath', 'Sled', 'Dove', 'Drum', 'Pocket watch', 'Painted pear', 'Tiny violin', 'Snow globe', 'Acorn', 'Wool scarf', 'Toy sailboat', 'Wrapped sweet', 'Brass key', 'Winter boot', 'Book', 'Arctic hare', 'Rocking horse', 'Snowy owl', 'Cocoa mug', 'Music box', 'Koi kite', 'Hourglass'],
  paper: ['Parchment', 'Botanical', 'Polar blue', 'Cranberry border', 'Linen weave', 'Music manuscript', 'Marbled jade'],
  color: ['Cranberry', 'Gold', 'Ice blue', 'Plum', 'Copper', 'Mint', 'Sapphire', 'Evergreen', 'Ivory', 'Mulberry', 'Tangerine', 'Rose quartz', 'Pewter', 'Peacock']
};
export function schoolName(email) {
  const address = String(email).toLowerCase();
  if (address === 'carolynj30@lakesideschool.org') return 'Seek J';
  const title = s => s[0].toUpperCase() + s.slice(1);
  const staff = /^([a-z]+)\.([a-z]+)@lakesideschool\.org$/.exec(address);
  if (staff) return title(staff[1]) + ' ' + title(staff[2]);
  const student = /^([a-z]+)([a-z])\d{2}@lakesideschool\.org$/.exec(address);
  return student ? title(student[1]) + ' ' + title(student[2]) + '.' : null;
}
export function settings(input, keys) {
  for (const key of keys) if (!options[key].includes(input[key])) throw Error('Choose a valid ' + key + '.');
  return Object.fromEntries(keys.map(key => [key,input[key]]));
}
export function treeSettings(input) {
  return settings(input,['species','setting','weather','star','visibility']);
}
export function makeCard(input,name) {
  if (typeof input.message !== 'string' || !input.message.trim())
    throw Error('Write a Christmas note before hanging it.');
  return {...settings({...input,paper:input.paper??'Parchment'},['kind','color','visibility','paper']),message:input.message,name};
}
export function view(tree, entries, uid, now = Date.now()) {
  const owner = tree.owner === uid;
  const released = now >= Date.parse('2026-12-25T08:00:00Z');
  const {owner:unused,...scene} = tree;
  return {...scene,owner,released,mine:entries.find(([author]) => author === uid)?.[1] || null,
    cards:entries.map(([,card]) => ({branch:card.branch??'Anywhere',kind:card.kind,color:card.color,paper:card.paper??'Parchment',name:card.name,
      message: released && (owner || card.visibility === 'Public') ? card.message : null}))};
}








export const ornamentsPerTreePage=12;
export function treePage(total,requested=1){
  const pages=Math.max(1,Math.ceil(total/ornamentsPerTreePage));
  const page=Math.max(1,Math.min(pages,Number.isSafeInteger(requested)?requested:1));
  return {total,pages,page,start:(page-1)*ornamentsPerTreePage};
}



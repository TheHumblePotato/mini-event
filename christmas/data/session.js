export const local=['localhost','127.0.0.1'].includes(location.hostname);
export const demo=local&&new URLSearchParams(location.search).has('demo');

// Authentication can start while the browser is still fetching the illustrations.
// Keep an early import failure for the UI to report once its status region is ready.
const provider=demo?import('../../_dev/christmas/preview.js'):import('./cloud.js');
export const connection=provider.then(backend=>({backend}),error=>({error}));

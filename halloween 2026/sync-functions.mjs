import {copyFile} from 'node:fs/promises';
await copyFile(new URL('./logic.js',import.meta.url),new URL('./functions/shared-logic.js',import.meta.url));
console.log('Shared progression and puzzle validators copied into Functions source.');

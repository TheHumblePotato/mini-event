// The postcard takes its illustration from the visible branches. The letter
// reader and the tree link never enter the image.
function framedScene(live) {
  const art = live.cloneNode(true);
  art.setAttribute('viewBox', '-90 0 580 310');
  art.setAttribute('width', '1392');
  art.setAttribute('height', '744');
  // Standalone SVG images do not inherit the page's day/night palette or
  // animated poses. Freeze the styled artwork at the moment of capture.
  const selector = '[class], .curtain > path, .harbor-gulls > path, .mist-bank > g';
  const originals = live.querySelectorAll(selector);
  art.querySelectorAll(selector).forEach((copy, index) => {
    const node = originals[index];
    const style = getComputedStyle(node);
    for (const property of ['opacity','display','filter']) copy.style.setProperty(property, style.getPropertyValue(property));
    if (node.matches('.sky, .moon, .powder, .ink-shadow')) {
      for (const property of ['fill','stroke','stroke-width']) copy.style.setProperty(property, style.getPropertyValue(property));
    }
    // Center the tree in the print regardless of pointer position. Keep the
    // boats, cable cars, aurora and hanging charms in their current poses.
    copy.style.removeProperty('translate');
    if (node.matches('.horizon, .village, .ground-plane, .near-ground, .crown')) return;
    if (style.transform !== 'none' || node.matches('.gondola')) {
      const parent = node.parentElement.getCTM?.(), current = node.getCTM();
      if (parent && current) {
        const m = parent.inverse().multiply(current);
        copy.setAttribute('transform', `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`);
      }
    }
  });
  return new Blob([new XMLSerializer().serializeToString(art)], {type:'image/svg+xml;charset=utf-8'});
}

function postmark(ctx) {
  ctx.save();
  ctx.translate(1328, 882);
  ctx.rotate(-0.09);
  ctx.fillStyle = '#e4e9d9';
  ctx.strokeStyle = '#436a60';
  ctx.lineWidth = 3;
  ctx.fillRect(-65, -61, 130, 122);
  ctx.setLineDash([5,5]);
  ctx.strokeRect(-62, -58, 124, 116);
  ctx.setLineDash([]);
  ctx.beginPath();
  for (let arm = 0; arm < 6; arm++) {
    ctx.moveTo(0, 0); ctx.lineTo(0, -31);
    ctx.moveTo(-9, -20); ctx.lineTo(0, -12); ctx.lineTo(9, -20);
    ctx.rotate(Math.PI / 3);
  }
  ctx.stroke();
  ctx.fillStyle = '#436a60';
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('WINTER POST', 0, 45);
  ctx.restore();
  ctx.strokeStyle = '#8d5349';
  ctx.lineWidth = 2;
  for (let row = 0; row < 3; row++) {
    const y = 880 + row * 9;
    ctx.beginPath(); ctx.moveTo(1182,y);
    ctx.bezierCurveTo(1207,y-13,1229,y+13,1250,y);
    ctx.quadraticCurveTo(1274,y-10,1296,y);
    ctx.stroke();
  }
}

async function postcardImage(live, tree) {
  const artUrl = URL.createObjectURL(framedScene(live));
  try {
    const image = new Image();
    image.src = artUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1500;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f8f0dd';
    ctx.fillRect(0,0,1500,1000);
    ctx.strokeStyle = '#a79576';
    ctx.strokeRect(28.5,28.5,1443,943);
    ctx.drawImage(image,54,48,1392,744);
    const air = document.querySelector('.winter-air');
    if (air && air.width && air.height) {
      const scale = Math.max(1392 / air.width, 744 / air.height);
      const w = 1392 / scale, h = 744 / scale;
      ctx.drawImage(air,(air.width-w)/2,(air.height-h)/2,w,h,54,48,1392,744);
    }
    ctx.fillStyle = '#795346';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('LAKESIDE   /   CHRISTMAS 2026', 68, 844);
    ctx.fillStyle = '#24493e';
    ctx.font = '56px Georgia, serif';
    ctx.fillText(tree.name + '’s tree', 65, 911, 1050);
    ctx.font = 'italic 24px Georgia, serif';
    ctx.fillText(tree.setting + (tree.pages > 1 ? '  ·  Tree ' + tree.page : ''), 68, 949);
    postmark(ctx);
    return await new Promise((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(Error('Could not create the postcard.')), 'image/png'
    ));
  } finally {
    URL.revokeObjectURL(artUrl);
  }
}

export async function showPostcard(dialog, live, tree) {
  const sheet = dialog.querySelector('#sheet');
  sheet.innerHTML = '<section class="postcard"><h2>Winter postcard</h2><p role="status">Preparing your postcard…</p></section>';
  const panel = sheet.firstChild;
  dialog.setAttribute('aria-label', 'Winter postcard');
  dialog.showModal();
  try {
    const png = await postcardImage(live, tree);
    if (!dialog.open || !panel.isConnected) return;
    const url = URL.createObjectURL(png);
    dialog.addEventListener('close', () => URL.revokeObjectURL(url), {once:true});
    const preview = new Image();
    preview.src = url;
    preview.alt = tree.name + '’s winter postcard from ' + tree.setting;
    const download = document.createElement('a');
    download.href = url;
    download.download = tree.name.toLowerCase().replace(/[^a-z]+/g,'-').replace(/-$/,'') + '-christmas-tree-' + tree.page + '.png';
    download.className = 'button primary';
    download.textContent = 'Save postcard (PNG)';
    panel.querySelector('p').replaceWith(preview, download);
  } catch {
    panel.querySelector('p').textContent = 'The image could not be prepared. Close the postcard and try again.';
  }
}

// DecomyTree JS: auth enforcement, simple tree create/view scaffolding
(function(){
    // helpers
    function $(sel){return document.querySelector(sel)}
    function show(el){el.classList.remove('hidden')}
    function hide(el){el.classList.add('hidden')}

    // Custom notification system
    function notify(message, type = 'info', duration = 3000){
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        if (duration > 0){
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }

    let currentUser = null;
    let currentTreeId = null;
    let selectedDesign = 'classic';
    let selectedColor = 'green';
    // Guard to ensure init() only runs once (prevents double event bindings)
    let _decomyTreeInitialized = false;

    async function enforceDomainAndSetDisplay(user){
        if (!user || !user.email) return false;
        const email = user.email.toLowerCase();
        const domain = '@lakesideschool.org';
        if (!email.endsWith(domain)){
            // not allowed
            try{ await window.firebaseSignOut(window.firebaseAuth); }catch(e){}
            notify('You must sign in with an @lakesideschool.org account.', 'error', 5000);
            return false;
        }

        // derive display name: local-part like firstl## -> First L.
        const local = email.split('@')[0];
        let display = '';
        const m = local.match(/^([a-z]+)([a-z])\d*$/i);
        if (m){
            const first = m[1];
            const lastInit = m[2];
            display = first.charAt(0).toUpperCase() + first.slice(1) + ' ' + lastInit.toUpperCase() + '.';
        } else {
            // fallback: name portion if available
            if (user.displayName){
                display = user.displayName.split(' ').slice(0,2).map(n=>n.charAt(0).toUpperCase()+n.slice(1)).join(' ');
            } else {
                display = local.charAt(0).toUpperCase() + local.slice(1);
            }
        }

        // update profile display locally (not writing to auth profile here)
        $('#username-display').textContent = display;
        return true;
    }

    async function checkUserTree(uid){
        const db = window.firebaseDb;
        const col = window.firebaseCollection(db, 'trees');
        const q = window.firebaseQuery(col, window.firebaseWhere('ownerUid','==', uid), window.firebaseLimit(1));
        const snap = await window.firebaseGetDocs(q);
        if (!snap.empty){
            const doc = snap.docs[0];
            currentTreeId = doc.id;
            return doc.data();
        }
        currentTreeId = null;
        return null;
    }

    function requireSignInUI(){
        show($('#force-signin-modal'));
        hide($('#sign-in-btn'));
        hide($('#user-info'));
    }

    function updateUIForSignedOut(){
        hide($('#user-info'));
        show($('#sign-in-btn'));
    }

    // Apply menu background theme to document
    function applyMenuBackground(theme){
        // Remove all scene classes
        document.body.classList.remove('scene-default', 'scene-colorful', 'scene-snowy', 'scene-aurora', 'scene-sunset', 'scene-midnight', 'scene-forest', 'scene-cosmic');
        // Add the selected theme
        if (theme) document.body.classList.add(theme);
    }

    async function init(){
        if (_decomyTreeInitialized) return;
        _decomyTreeInitialized = true;
        // Apply saved menu background on page load
        const savedBackground = localStorage.getItem('decomytree-menu-background') || 'scene-default';
        applyMenuBackground(savedBackground);
        
        const signInBtn = $('#sign-in-btn');
        const signOutBtn = $('#sign-out-btn');
        const forceSignBtn = $('#force-signin-btn');
        const createBtn = $('#create-tree-btn');
        const viewBtn = $('#view-tree-btn');
        const addOrnBtn = $('#add-ornament-btn');
        const editBtn = $('#edit-tree-btn');
        const createModal = $('#create-tree-modal');
        const publishBtn = $('#publish-tree-btn');
        const cancelCreate = $('#cancel-create-tree');
        const bgSelect = $('#menu-bg-select');

        // Handle menu background selector
        if (bgSelect) {
            bgSelect.value = savedBackground;
            bgSelect.addEventListener('change', (e) => {
                const newBg = e.target.value;
                localStorage.setItem('decomytree-menu-background', newBg);
                applyMenuBackground(newBg);
            });
        }

        function openCreateModal(){ 
            show(createModal);
            // Pre-select saved menu background choice
            const savedBackground = localStorage.getItem('decomytree-menu-background') || 'scene-default';
            const bgRadio = document.querySelector(`input[name="menu-background"][value="${savedBackground}"]`);
            if (bgRadio) bgRadio.checked = true;
        }
        function closeCreateModal(){ hide(createModal); }

        signInBtn && signInBtn.addEventListener('click', async ()=>{
            try{
                await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider);
            }catch(e){console.error(e);notify('Sign-in failed: '+(e.message||e), 'error');}
        });

        forceSignBtn && forceSignBtn.addEventListener('click', async ()=>{
            try{ await window.firebaseSignInWithPopup(window.firebaseAuth, window.googleProvider); }catch(e){console.error(e);notify('Sign-in failed', 'error');}
        });

        signOutBtn && signOutBtn.addEventListener('click', async ()=>{
            try{ await window.firebaseSignOut(window.firebaseAuth);}catch(e){console.error(e);}        
        });

        createBtn && createBtn.addEventListener('click', openCreateModal);
        cancelCreate && cancelCreate.addEventListener('click', closeCreateModal);

        viewBtn && viewBtn.addEventListener('click', ()=>{
            if (currentTreeId){
                // TODO: open tree viewer page
                window.location.href = `decomytree_view.html?id=${currentTreeId}`;
            }
        });

        addOrnBtn && addOrnBtn.addEventListener('click', ()=>{
            window.location.href = 'decomytree_picker.html';
        });

        editBtn && editBtn.addEventListener('click', () => {
            if (currentTreeId){
                window.location.href = `decomytree_edit.html?id=${currentTreeId}`;
            }
        });

        let isPublishing = false;
        publishBtn && publishBtn.addEventListener('click', async ()=>{
            if (isPublishing) return; // Prevent double submission
            isPublishing = true;
            const color = document.querySelector('input[name="color"]:checked').value;
            const star = document.querySelector('input[name="star"]:checked').value || 'star';
            const theme = (document.querySelector('input[name="theme"]:checked') || {}).value || 'scene-default';
            const isPublic = !!$('#tree-public').checked;
            if (!currentUser) return notify('No user', 'error');
            try{
                const db = window.firebaseDb;
                const col = window.firebaseCollection(db, 'trees');
                
                // Check for existing trees by this user
                const q = window.firebaseQuery(col, window.firebaseWhere('ownerUid','==', currentUser.uid));
                const snap = await window.firebaseGetDocs(q);
                
                // If user already has a tree, don't create a new one
                if (!snap.empty) {
                    currentTreeId = snap.docs[0].id;
                    notify('You already have a tree!', 'warning');
                    isPublishing = false;
                    return;
                }
                
                const newRef = window.firebaseDoc(col); // auto-id
                await window.firebaseSetDoc(newRef, {
                    ownerUid: currentUser.uid,
                    ownerEmail: currentUser.email,
                    design: 'classic',
                    color,
                    star,
                    public: !!isPublic,
                    theme: theme,
                    createdAt: window.firebaseServerTimestamp()
                });
                currentTreeId = newRef.id;

                // Safety: If concurrent requests created multiple trees for this user,
                // remove extras and keep the most recent one.
                try {
                    const qAll = window.firebaseQuery(col, window.firebaseWhere('ownerUid','==', currentUser.uid));
                    const snapAll = await window.firebaseGetDocs(qAll);
                    if (!snapAll.empty && snapAll.size > 1) {
                        // Sort docs by createdAt (newest first) and keep the newest
                        const docs = snapAll.docs.slice().sort((a,b)=> {
                            const ad = a.data().createdAt || { seconds: 0 };
                            const bd = b.data().createdAt || { seconds: 0 };
                            return (bd.seconds || 0) - (ad.seconds || 0);
                        });
                        // Keep first (newest), delete the rest
                        for (let i = 1; i < docs.length; i++){
                            try { await window.firebaseDeleteDoc(window.firebaseDoc(window.firebaseDb, 'trees', docs[i].id)); }catch(e){console.warn('failed to delete extra tree', e);}
                        }
                    }
                } catch(e) { console.warn('cleanup check failed', e); }
                // Save menu background preference to localStorage
                localStorage.setItem('decomytree-menu-background', savedBackground);
                applyMenuBackground(savedBackground);
                closeCreateModal();
                show($('#has-tree'));
                hide($('#no-tree'));
                notify('🎄 Tree created! Welcome to your DecomyTree!', 'success');
            }catch(e){console.error(e);notify('Publish failed: '+(e.message||e), 'error');}
            finally { isPublishing = false; }
        });

        // auth state
        if (window.firebaseOnAuthStateChanged){
            window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user)=>{
                if (!user){
                    currentUser = null;
                    updateUIForSignedOut();
                    requireSignInUI();
                    return;
                }

                // enforce domain
                const ok = await enforceDomainAndSetDisplay(user);
                if (!ok) return requireSignInUI();

                currentUser = user;
                hide($('#force-signin-modal'));
                show($('#user-info'));
                hide($('#sign-in-btn'));
                // Run debug maintenance to ensure unique/non-default tree colors when debug flag is present
                try{
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('debug') === 'christmas' || /[?&]debug=christmas/i.test(window.location.href)){
                        // async but don't block UI
                        ensureUniqueTreeColorsForUser(currentUser.uid).catch(err=>console.warn('color maintenance failed',err));
                    }
                }catch(e){ console.warn('color maintenance skipped', e); }

                // Defensive: ensure only a single tree exists for this user (async, non-blocking)
                try{
                    ensureSingleTreeForUser(currentUser.uid).then(r=>{
                        if (r && r.deleted && r.deleted.length) console.log('Single-tree enforcement removed extras:', r);
                    }).catch(err=>console.warn('single-tree enforcement failed', err));
                }catch(e){ console.warn('single-tree enforcement skipped', e); }

                // check if user already has a tree
                const tree = await checkUserTree(user.uid);
                if (tree){
                    show($('#has-tree'));
                    hide($('#no-tree'));
                } else {
                    show($('#no-tree'));
                    hide($('#has-tree'));
                }
            });
        }
    }

    // Initialize when ready
    if (window.firebaseReady){
        init();
    } else {
        // allow the firebase module to call window.initDecomyTree if necessary
        window.initDecomyTree = init;
        // also retry in case firebaseReady becomes true later
        const iv = setInterval(()=>{
            if (window.firebaseReady){ clearInterval(iv); init(); }
        },200);
    }

})();

// ----------------- Debug maintenance helpers -----------------
// Added: ensureUniqueTreeColorsForUser - supports dry-run reporting and optional apply
async function ensureUniqueTreeColorsForUser(uid, options = { dryRun: true }){
    const report = { uid, examined: 0, reassignments: [], deletions: [], warnings: [] };
    if (!uid) { report.warnings.push('no-uid'); return report; }
    if (!window.firebaseReady || !window.firebaseDb) { report.warnings.push('firebase-not-ready'); return report; }
    const dryRun = !!options.dryRun;
    try{
        const db = window.firebaseDb;
        const col = window.firebaseCollection(db, 'trees');
        const q = window.firebaseQuery(col, window.firebaseWhere('ownerUid','==', uid));
        const snap = await window.firebaseGetDocs(q);
        if (snap.empty) return report;

        const palette = ['green','blue','frost','emerald','midnight','forest','gold','silver','purple','ruby','copper','jade','pearl','rose','bronze'];

        const colorBuckets = {};
        snap.forEach(d => { const c = (d.data().color || 'green'); (colorBuckets[c] = colorBuckets[c]||[]).push(d); report.examined++; });

        const used = new Set(Object.keys(colorBuckets));

        for (const color in colorBuckets){
            const arr = colorBuckets[color];
            if (arr.length <= 1) continue;
            // sort newest first
            arr.sort((a,b)=>{ const ad=a.data().createdAt||{}; const bd=b.data().createdAt||{}; return (bd.seconds||0)-(ad.seconds||0); });
            for (let i=1;i<arr.length;i++){
                const doc = arr[i];
                const avail = palette.find(p => !used.has(p));
                if (avail){
                    report.reassignments.push({ treeId: doc.id, from: color, to: avail });
                    if (!dryRun){
                        try{ await window.firebaseUpdateDoc(window.firebaseDoc(db,'trees',doc.id), { color: avail }); used.add(avail); }
                        catch(e){ report.warnings.push('reassign-failed:'+doc.id); }
                    } else {
                        used.add(avail); // reserve it for dry-run accuracy
                    }
                } else {
                    report.deletions.push({ treeId: doc.id, color });
                    if (!dryRun){
                        try{ await window.firebaseDeleteDoc(window.firebaseDoc(db,'trees',doc.id)); }
                        catch(e){ report.warnings.push('delete-failed:'+doc.id); }
                    }
                }
            }
        }

        // If all remaining trees are green, update the newest to a non-green color
        const allDocs = snap.docs.slice().sort((a,b)=>{ const ad=a.data().createdAt||{}; const bd=b.data().createdAt||{}; return (bd.seconds||0)-(ad.seconds||0); });
        const anyNonGreen = allDocs.some(d=> (d.data().color||'green') !== 'green');
        if (!anyNonGreen && allDocs.length > 0){
            const first = allDocs[0];
            const alt = palette.find(p=>p!=='green');
            if (alt){
                report.reassignments.push({ treeId: first.id, from: 'green', to: alt });
                if (!dryRun){
                    try{ await window.firebaseUpdateDoc(window.firebaseDoc(db,'trees',first.id), { color: alt }); }
                    catch(e){ report.warnings.push('update-default-failed:'+first.id); }
                }
            }
        }
        return report;
    }catch(e){ report.warnings.push(String(e)); return report; }
}

// Expose a callable helper for debugging in the browser console
window.runColorMaintenance = async function(dryRun = true){
    try{
        if (!window.firebaseAuth || !window.firebaseOnAuthStateChanged) throw new Error('firebase not initialized');
        const user = window.firebaseAuth.currentUser;
        if (!user) throw new Error('no-signed-in-user');
        const r = await ensureUniqueTreeColorsForUser(user.uid, { dryRun });
        console.log('Color maintenance report:', r);
        return r;
    }catch(e){ console.error('runColorMaintenance failed', e); throw e; }
};

// Defensive: ensure a user has at most one tree. Keeps the newest and deletes extras.
async function ensureSingleTreeForUser(uid, options = { dryRun: false }){
    const report = { uid, examined: 0, deleted: [], kept: null, warnings: [] };
    if (!uid) { report.warnings.push('no-uid'); return report; }
    if (!window.firebaseReady || !window.firebaseDb) { report.warnings.push('firebase-not-ready'); return report; }
    const dryRun = !!options.dryRun;
    try{
        const db = window.firebaseDb;
        const col = window.firebaseCollection(db, 'trees');
        const q = window.firebaseQuery(col, window.firebaseWhere('ownerUid','==', uid));
        const snap = await window.firebaseGetDocs(q);
        if (snap.empty) return report;

        report.examined = snap.size;
        // Sort by createdAt descending (newest first)
        const docs = snap.docs.slice().sort((a,b)=>{
            const ad = a.data().createdAt || { seconds: 0 };
            const bd = b.data().createdAt || { seconds: 0 };
            return (bd.seconds || 0) - (ad.seconds || 0);
        });

        // Keep first (newest), delete rest
        if (docs.length > 0) report.kept = docs[0].id;
        for (let i = 1; i < docs.length; i++){
            const doc = docs[i];
            report.deleted.push({ treeId: doc.id, color: doc.data().color || 'unknown' });
            if (!dryRun){
                try{ await window.firebaseDeleteDoc(window.firebaseDoc(db, 'trees', doc.id)); }
                catch(e){ report.warnings.push('delete-failed:'+doc.id); }
            }
        }
        return report;
    }catch(e){ report.warnings.push(String(e)); return report; }
}

// Expose helper to run from console
window.runEnsureSingleTree = async function(dryRun = false){
    try{
        if (!window.firebaseAuth) throw new Error('firebase not initialized');
        const user = window.firebaseAuth.currentUser;
        if (!user) throw new Error('no-signed-in-user');
        const r = await ensureSingleTreeForUser(user.uid, { dryRun });
        console.log('Single-tree enforcement report:', r);
        return r;
    }catch(e){ console.error('runEnsureSingleTree failed', e); throw e; }
};

// DecomyTree Picker JS: load and display public trees, search, link to add ornament
(function(){
    function $(sel){return document.querySelector(sel)}
    function show(el){if(el)el.classList.remove('hidden')}
    function hide(el){if(el)el.classList.add('hidden')}

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
    let allTrees = [];
    let filteredTrees = [];

    function formatAuthorName(email){
        const local = email.split('@')[0];
        const m = local.match(/^([a-z]+)([a-z])\d*$/i);
        if (m){
            return m[1].charAt(0).toUpperCase() + m[1].slice(1) + ' ' + m[2].toUpperCase() + '.';
        }
        return local;
    }

    function getTreeEmoji(design){
        const emojis = { classic: '🎄', modern: '✨', snowy: '❄️' };
        return emojis[design] || '🎄';
    }

    // Apply menu background theme to document
    function applyMenuBackground(theme){
        // Remove all scene classes
        document.body.classList.remove('scene-default', 'scene-colorful', 'scene-snowy', 'scene-aurora', 'scene-sunset', 'scene-midnight', 'scene-forest', 'scene-cosmic');
        // Add the selected theme
        if (theme) document.body.classList.add(theme);
    }

    async function loadPublicTrees(){
        try{
            const db = window.firebaseDb;
            const col = window.firebaseCollection(db, 'trees');

            // We'll gather three sets: public trees, trees where current user's email is in sharedWith,
            // and trees where the username is in sharedWithUsernames. Combine and dedupe.
            const publicQ = window.firebaseQuery(col, window.firebaseWhere('public','==',true), window.firebaseOrderBy('createdAt','desc'));
            const publicSnap = await window.firebaseGetDocs(publicQ);
            const map = new Map();

            publicSnap.forEach(doc => {
                const data = doc.data();
                if (currentUser && data.ownerUid === currentUser.uid) return; // hide own tree
                map.set(doc.id, {id: doc.id, ...data});
            });

            if (currentUser){
                const email = (currentUser.email || '').toLowerCase();
                const username = formatAuthorName(email);

                // trees with sharedWith email
                try{
                    const q1 = window.firebaseQuery(col, window.firebaseWhere('sharedWith','array-contains', email));
                    const snap1 = await window.firebaseGetDocs(q1);
                    snap1.forEach(doc => { if (doc.data().ownerUid !== currentUser.uid) map.set(doc.id, {id: doc.id, ...doc.data()}); });
                }catch(e){ /* ignore index errors, fallback below */ }

                // trees with sharedWithUsernames
                try{
                    const q2 = window.firebaseQuery(col, window.firebaseWhere('sharedWithUsernames','array-contains', username));
                    const snap2 = await window.firebaseGetDocs(q2);
                    snap2.forEach(doc => { if (doc.data().ownerUid !== currentUser.uid) map.set(doc.id, {id: doc.id, ...doc.data()}); });
                }catch(e){ /* ignore index errors */ }
            }

            // populate arrays
            allTrees = Array.from(map.values()).sort((a,b)=> (b.createdAt && a.createdAt) ? b.createdAt.seconds - a.createdAt.seconds : 0);

            // Determine which trees user already ornamented (if logged in)
            const ornamentedTreeIds = new Set();
            if (currentUser){
                try{
                    const colO = window.firebaseCollection(window.firebaseDb, 'ornaments');
                    const qO = window.firebaseQuery(colO, window.firebaseWhere('createdBy','==', currentUser.uid));
                    const snapO = await window.firebaseGetDocs(qO);
                    snapO.forEach(d => { const ddata = d.data(); if (ddata && ddata.treeId) ornamentedTreeIds.add(ddata.treeId); });
                }catch(e){console.error('orn query failed',e);}
            }

            // attach meta
            allTrees = allTrees.map(t => ({...t, _already: ornamentedTreeIds.has(t.id), _invited: currentUser ? (Array.isArray(t.sharedWith) && t.sharedWith.includes((currentUser.email||'').toLowerCase()) ) || (Array.isArray(t.sharedWithUsernames) && t.sharedWithUsernames.includes(formatAuthorName((currentUser.email||'').toLowerCase()))) : false }));

            // Query ornament counts for all trees
            try {
                const colO = window.firebaseCollection(window.firebaseDb, 'ornaments');
                const ornamentCountMap = new Map();
                
                for (const tree of allTrees) {
                    try {
                        const qCount = window.firebaseQuery(colO, window.firebaseWhere('treeId', '==', tree.id));
                        const snapCount = await window.firebaseGetDocs(qCount);
                        ornamentCountMap.set(tree.id, snapCount.size);
                    } catch (e) {
                        ornamentCountMap.set(tree.id, 0);
                    }
                }
                
                allTrees = allTrees.map(t => ({...t, _ornCount: ornamentCountMap.get(t.id) || 0}));
            } catch (e) {
                console.error('Failed to get ornament counts', e);
                allTrees = allTrees.map(t => ({...t, _ornCount: 0}));
            }

            // Sort by: public trees first, then invited trees, then by createdAt
            allTrees.sort((a, b) => {
                // Public trees first
                if (a.public !== b.public) return b.public ? 1 : -1;
                // Then invited trees
                if (a._invited !== b._invited) return a._invited ? -1 : 1;
                // Then by creation date (newest first)
                return (b.createdAt && a.createdAt) ? b.createdAt.seconds - a.createdAt.seconds : 0;
            });

            filteredTrees = [...allTrees];
            renderTrees();
        }catch(e){
            console.error(e);
            notify('Failed to load trees: ' + (e.message||e), 'error');
        }
    }

    function renderTrees(){
        const grid = $('#trees-grid');
        if (filteredTrees.length === 0){
            grid.innerHTML = '<div class="tree-card no-results"><p>No public trees found. Create one!</p></div>';
            return;
        }

        grid.innerHTML = '';
        filteredTrees.forEach(tree => {
            const card = document.createElement('div');
            card.className = 'tree-card';

            const icon = document.createElement('span');
            icon.className = 'tree-icon';
            icon.textContent = getTreeEmoji(tree.design || 'classic') || '🎄';

            const title = document.createElement('h3');
            title.textContent = (tree.ownerEmail ? formatAuthorName(tree.ownerEmail) + "'s Tree" : (tree.title || 'Untitled Tree'));

            const owner = document.createElement('div');
            owner.className = 'tree-owner';
            owner.textContent = (tree.public ? '🌐 Public' : (tree._invited ? '🔒 Invited' : '🔒 Private')) + ' • ' + (tree.ownerEmail ? formatAuthorName(tree.ownerEmail) : 'Unknown');

            const ornCount = document.createElement('div');
            ornCount.className = 'tree-ornaments';
            const countText = tree._ornCount ? `${tree._ornCount} ornament${tree._ornCount === 1 ? '' : 's'}` : '0 ornaments';
            ornCount.textContent = (tree._already ? '✅ You left a note • ' : '✨ ') + countText;
            if (tree._already) ornCount.classList.add('already');

            if (tree._invited){
                card.classList.add('invited');
            }

            card.appendChild(icon);
            card.appendChild(title);
            card.appendChild(owner);
            card.appendChild(ornCount);

            card.addEventListener('click', () => {
                window.location.href = `decomytree_view.html?id=${tree.id}`;
            });

            grid.appendChild(card);
        });
    }

    function handleSearch(){
        const query = $('#search-input').value.toLowerCase();
        if (!query){
            filteredTrees = [...allTrees];
        } else {
            filteredTrees = allTrees.filter(t => 
                (t.title || '').toLowerCase().includes(query) ||
                (t.ownerEmail || '').toLowerCase().includes(query)
            );
        }
        renderTrees();
    }

    function init(){
        // Apply saved menu background on page load
        const savedBackground = localStorage.getItem('decomytree-menu-background') || 'scene-default';
        applyMenuBackground(savedBackground);
        
        const backBtn = $('#back-btn');
        const signOutBtn = $('#sign-out-btn');
        const searchInput = $('#search-input');
        const bgSelect = $('#menu-bg-select');

        // Handle background selector
        if (bgSelect) {
            bgSelect.value = savedBackground;
            bgSelect.addEventListener('change', (e) => {
                const selected = e.target.value;
                localStorage.setItem('decomytree-menu-background', selected);
                applyMenuBackground(selected);
            });
        }

        if (backBtn) backBtn.addEventListener('click', () => {
            window.location.href = 'decomytree.html';
        });

        if (signOutBtn) signOutBtn.addEventListener('click', async () => {
            try{ await window.firebaseSignOut(window.firebaseAuth);}catch(e){console.error(e);}
        });

        if (searchInput) searchInput.addEventListener('input', handleSearch);

        // Auth state
        if (window.firebaseOnAuthStateChanged){
            window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
                if (!user){
                    currentUser = null;
                    hide($('#user-info'));
                } else {
                    currentUser = user;
                    show($('#user-info'));
                    $('#username-display').textContent = formatAuthorName(user.email);
                }
                // Always load public trees
                await loadPublicTrees();
            });
        }
    }

    if (window.firebaseReady){
        init();
    } else {
        window.initTreePicker = init;
        const iv = setInterval(()=>{
            if (window.firebaseReady){ clearInterval(iv); init(); }
        },200);
    }
})();

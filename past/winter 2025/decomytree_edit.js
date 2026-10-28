// DecomyTree Edit JS: load and update tree customization
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
    let treeId = null;
    let treeData = null;
    let isInitialized = false;

    // Apply menu background theme to document
    function applyMenuBackground(theme){
        // Remove all scene classes
        document.body.classList.remove('scene-default', 'scene-colorful', 'scene-snowy', 'scene-aurora', 'scene-sunset', 'scene-midnight', 'scene-forest', 'scene-cosmic');
        // Add the selected theme
        if (theme) document.body.classList.add(theme);
    }

    function formatAuthorName(email){
        const local = email.split('@')[0];
        const m = local.match(/^([a-z]+)([a-z])\d*$/i);
        if (m){
            return m[1].charAt(0).toUpperCase() + m[1].slice(1) + ' ' + m[2].toUpperCase() + '.';
        }
        return local;
    }

    async function loadTree(){
        const params = new URLSearchParams(window.location.search);
        treeId = params.get('id');
        if (!treeId || !currentUser){
            window.location.href = 'decomytree.html';
            return;
        }

        try{
            const db = window.firebaseDb;
            const treeRef = window.firebaseDoc(db, 'trees', treeId);
            const snap = await window.firebaseGetDoc(treeRef);
            if (!snap.exists()){
                notify('Tree not found', 'error');
                setTimeout(() => window.location.href = 'decomytree.html', 2000);
                return;
            }

            treeData = snap.data();
            if (treeData.ownerUid !== currentUser.uid){
                notify('You can only edit your own tree', 'error');
                setTimeout(() => window.location.href = 'decomytree.html', 2000);
                return;
            }

            // Load current values
            const designRadios = document.querySelectorAll('input[name="design"]');
            designRadios.forEach(r => {
                r.checked = r.value === (treeData.design || 'classic');
            });

            const colorRadios = document.querySelectorAll('input[name="color"]');
            colorRadios.forEach(r => {
                r.checked = r.value === (treeData.color || 'green');
            });

            const starRadios = document.querySelectorAll('input[name="star"]');
            starRadios.forEach(r => {
                r.checked = r.value === (treeData.star || 'star');
            });

            const themeRadios = document.querySelectorAll('input[name="theme"]');
            themeRadios.forEach(r => { r.checked = r.value === (treeData.theme || 'scene-default'); });

            $('#tree-public').checked = treeData.public === true;
        }catch(e){
            console.error(e);
            notify('Failed to load tree: ' + (e.message||e), 'error');
        }
    }

    function init(){
        // Apply saved menu background on page load
        const savedBackground = localStorage.getItem('decomytree-menu-background') || 'scene-default';
        applyMenuBackground(savedBackground);
        
        const backBtn = $('#back-btn');
        const backViewBtn = $('#back-to-view');
        const signOutBtn = $('#sign-out-btn');
        const saveBtn = $('#save-tree-btn');
        const shareBtn = $('#share-tree-btn');
        const shareModal = $('#share-modal');
        const closeShareBtn = $('#close-share-btn');
        const addUserBtn = $('#add-user-btn');
        const shareEmail = $('#share-email');
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

        if (backBtn) backBtn.addEventListener('click', () => {
            window.location.href = 'decomytree.html';
        });

        if (backViewBtn) backViewBtn.addEventListener('click', () => {
            window.location.href = 'decomytree.html';
        });

        if (signOutBtn) signOutBtn.addEventListener('click', async () => {
            try{ await window.firebaseSignOut(window.firebaseAuth);}catch(e){console.error(e);}
        });

        if (shareBtn) shareBtn.addEventListener('click', () => {
            show(shareModal);
            loadInvitedUsers();
        });

        if (closeShareBtn) closeShareBtn.addEventListener('click', () => {
            hide(shareModal);
        });

        // Handle share email input with suggestions
        if (shareEmail) {
            shareEmail.addEventListener('input', async (e) => {
                const input = e.target.value.trim().toLowerCase();
                const suggestionsDiv = $('#share-suggestions');
                
                if (!input || input.length < 1) {
                    suggestionsDiv.style.display = 'none';
                    return;
                }

                // Query all users from Firestore
                try {
                    const db = window.firebaseDb;
                    const usersCol = window.firebaseCollection(db, 'trees');
                    const snap = await window.firebaseGetDocs(usersCol);
                    
                    const usernames = new Set();
                    snap.docs.forEach(doc => {
                        const email = doc.data().ownerEmail;
                        if (email && email !== currentUser.email) {
                            // Convert email to username format (e.g., "johnsmith" -> "John S")
                            const username = formatAuthorName(email);
                            if (username.toLowerCase().includes(input)) {
                                usernames.add(username);
                            }
                        }
                    });

                    suggestionsDiv.innerHTML = '';
                    
                    if (usernames.size === 0) {
                        suggestionsDiv.style.display = 'none';
                        return;
                    }

                    const sorted = Array.from(usernames).sort();
                    sorted.forEach(username => {
                        const item = document.createElement('div');
                        item.style.cssText = 'padding:8px 12px;color:var(--cream);cursor:pointer;border-bottom:1px solid rgba(212,175,55,0.1);font-size:0.9em';
                        item.textContent = username;
                        item.addEventListener('click', () => {
                            shareEmail.value = username;
                            suggestionsDiv.style.display = 'none';
                        });
                        item.addEventListener('mouseenter', () => {
                            item.style.background = 'rgba(212,175,55,0.2)';
                        });
                        item.addEventListener('mouseleave', () => {
                            item.style.background = '';
                        });
                        suggestionsDiv.appendChild(item);
                    });

                    suggestionsDiv.style.display = 'block';
                } catch(e) {
                    console.error(e);
                }
            });
        }

        if (addUserBtn) addUserBtn.addEventListener('click', async () => {
            const raw = shareEmail.value.trim();
            if (!raw) {
                notify('Please enter a username', 'warning');
                return;
            }

            // Validate it's a username (not an email)
            const username = raw;
            if (username === formatAuthorName(currentUser.email)) {
                notify('You cannot share with yourself', 'warning');
                return;
            }

            try {
                const db = window.firebaseDb;
                const treeRef = window.firebaseDoc(db, 'trees', treeId);
                await window.firebaseUpdateDoc(treeRef, {
                    sharedWithUsernames: window.firebaseArrayUnion(username),
                    updatedAt: window.firebaseServerTimestamp()
                });
                shareEmail.value = '';
                $('#share-suggestions').style.display = 'none';
                notify('✅ Username added - tree is now shared!', 'success');
                // refresh treeData
                const snap = await window.firebaseGetDoc(treeRef);
                treeData = snap.data();
                loadInvitedUsers();
            } catch(e) {
                console.error(e);
                notify('Failed to add user: ' + (e.message||e), 'error');
            }
        });

        if (saveBtn) saveBtn.addEventListener('click', async () => {
            if (!treeId) return notify('No tree loaded', 'error');
            const color = document.querySelector('input[name="color"]:checked').value;
            const star = document.querySelector('input[name="star"]:checked').value || 'star';
            const isPublic = $('#tree-public').checked;
            const theme = (document.querySelector('input[name="theme"]:checked') || {}).value || 'scene-default';

            try{
                const db = window.firebaseDb;
                const treeRef = window.firebaseDoc(db, 'trees', treeId);
                await window.firebaseUpdateDoc(treeRef, {
                    design: 'classic',
                    color,
                    star,
                    public: isPublic,
                    theme: theme,
                    updatedAt: window.firebaseServerTimestamp()
                });
                // Save menu background preference to localStorage
                localStorage.setItem('decomytree-menu-background', savedBackground);
                applyMenuBackground(savedBackground);
                notify('🎄 Tree updated!', 'success');
                setTimeout(() => window.location.href = 'decomytree.html', 1500);
            }catch(e){
                console.error(e);
                notify('Failed to update tree: ' + (e.message||e), 'error');
            }
        });

        // Auth state
        if (window.firebaseOnAuthStateChanged){
            window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
                if (!user){
                    currentUser = null;
                    hide($('#user-info'));
                    window.location.href = 'decomytree.html';
                    return;
                }

                currentUser = user;
                show($('#user-info'));
                $('#username-display').textContent = formatAuthorName(user.email);
                if (!isInitialized) {
                    isInitialized = true;
                    await loadTree();
                }
            });
        }
    }

    async function loadInvitedUsers(){
        const list = $('#invited-list');
        list.innerHTML = '';

        const hasUsernames = treeData && Array.isArray(treeData.sharedWithUsernames) && treeData.sharedWithUsernames.length > 0;

        if (!hasUsernames) {
            list.innerHTML = '<p style="color:rgba(245,240,232,0.6)">No users invited yet</p>';
            return;
        }

        // Render invited usernames
        if (hasUsernames) {
            for (const username of treeData.sharedWithUsernames) {
                const userItem = document.createElement('div');
                userItem.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid rgba(212,175,55,0.2);color:var(--cream);font-size:0.9em';
                const nameEl = document.createElement('span');
                nameEl.textContent = username;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '✕';
                removeBtn.style.cssText = 'background:rgba(196,30,58,0.3);border:1px solid rgba(196,30,58,0.5);color:#ff6b6b;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:0.8em';
                removeBtn.addEventListener('click', async () => {
                    try {
                        const db = window.firebaseDb;
                        const treeRef = window.firebaseDoc(db, 'trees', treeId);
                        await window.firebaseUpdateDoc(treeRef, {
                            sharedWithUsernames: window.firebaseArrayRemove(username),
                            updatedAt: window.firebaseServerTimestamp()
                        });
                        const snap = await window.firebaseGetDoc(treeRef);
                        treeData = snap.data();
                        notify('✅ User removed', 'success');
                        loadInvitedUsers();
                    } catch(e) {
                        console.error(e);
                        notify('Failed to remove user', 'error');
                    }
                });
                userItem.appendChild(nameEl);
                userItem.appendChild(removeBtn);
                list.appendChild(userItem);
            }
        }
    }

    if (window.firebaseReady){
        init();
    } else {
        window.initEditTree = init;
        const iv = setInterval(()=>{
            if (window.firebaseReady){ clearInterval(iv); init(); }
        },200);
    }
})();

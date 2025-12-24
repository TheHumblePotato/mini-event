// DecomyTree View JS: render tree, ornaments (redacted until Dec 25 PT), add/edit ornaments
(function(){
    function $(sel){return document.querySelector(sel)}
    function $$(sel){return document.querySelectorAll(sel)}
    function show(el){if(el)el.classList.remove('hidden')}
    function hide(el){if(el)el.classList.add('hidden')}

    // Custom notification system
    function notify(message, type = 'info', duration = 3000){
        const container = $('#notification-container');
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
    let ornaments = [];
    let selectedEmoji = '🎄';
    let selectedType = 'classic';
    let currentPage = 1;
    const ornamesPerPage = 10;
    let isPublishingOrnament = false; // Flag to prevent double-click publishing

    // Check if it's after Dec 25 PT (or debug mode enabled)
    function isReleased(){
        // Check for debug mode in URL: ?debug=christmas (case-insensitive)
        if (/[?&]debug=christmas/i.test(window.location.href)) return true;
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug') === 'christmas') return true;
        
        const now = new Date();
        const releaseDate = new Date(2025, 11, 25);
        releaseDate.setHours(releaseDate.getHours() + 7);
        return now >= releaseDate;
    }

    // Apply menu background theme to document
    function applyMenuBackground(theme){
        // Remove all scene classes
        document.body.classList.remove('scene-default', 'scene-colorful', 'scene-snowy', 'scene-aurora', 'scene-sunset', 'scene-midnight', 'scene-forest', 'scene-cosmic');
        // Add the selected theme
        if (theme) document.body.classList.add(theme);
    }

    // Countdown timer
    function updateCountdown(){
        const countdownEl = $('#countdown-text');
        if (!countdownEl) return;
        
        const now = new Date();
        const releaseDate = new Date(2025, 11, 25);
        releaseDate.setHours(releaseDate.getHours() + 7);
        
        if (now >= releaseDate){
            countdownEl.textContent = '🎉 Christmas is here!';
            return;
        }
        
        const diff = releaseDate - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        countdownEl.textContent = `${days}d ${hours}h ${mins}m ${secs}s until Christmas!`;
    }

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

    // Sanitize ornament text: remove soft hyphen and invisible/format/control characters
    function sanitizeOrnamentText(s){
        if (!s || typeof s !== 'string') return '';
        // Build sanitized output by iterating characters so newlines are preserved
        const zeroWidthSet = new Set([0x00AD,0x200B,0x200C,0x200D,0xFEFF,0x200E,0x200F,0x2060]);
        let out = '';
        for (let i = 0; i < s.length; i++){
            const ch = s[i];
            const c = ch.charCodeAt(0);
            // CR -> LF
            if (c === 0x0D){ out += '\n'; continue; }
            // Unicode line/paragraph separators -> LF
            if (c === 0x2028 || c === 0x2029){ out += '\n'; continue; }
            // Visible arrow '↵' (U+21B5) often appears in pasted text as a newline marker
            if (c === 0x21B5){ out += '\n'; continue; }
            // Non-breaking space -> normal space
            if (c === 0x00A0){ out += ' '; continue; }
            // Skip zero-width / invisible
            if (zeroWidthSet.has(c)) continue;
            // Skip C0 control chars except TAB (0x09) and LF (0x0A)
            if ((c >= 0x00 && c <= 0x1F && c !== 0x09 && c !== 0x0A) || c === 0x7F) continue;
            out += ch;
        }
        // Use 'out' below; keep consistent name 't' for older code
        let t = out;



        // Attempt to remove other format/control characters using Unicode properties (if supported)
        try {
            t = t.replace(/\p{Cf}/gu, '');
            t = t.replace(/\p{Cc}/gu, '');
        } catch (e) {
            // ignore if JS engine doesn't support \p properties
        }
        return t;
    }
    // Expose for quick console testing
    window.sanitizeOrnamentText = sanitizeOrnamentText;

    // Render tree based on design style
    function renderTreeDesign(design, color, star){
        const treeDesignGroup = document.getElementById('tree-design');
        const trunk = document.getElementById('tree-trunk');
        const topDecorationGroup = document.getElementById('tree-top-decoration');
        
        if (!treeDesignGroup) return;
        
        treeDesignGroup.innerHTML = ''; // Clear previous tree
        
        // Remove previous color effect classes from body
        document.body.classList.forEach(cls => {
            if (cls.startsWith('tree-color-')) {
                document.body.classList.remove(cls);
            }
        });
        
        // Add the new color effect class
        document.body.classList.add(`tree-color-${color}`);
        
        const colorMap = {
            green: ['#0d5e3f','#0b4c34','#08372a'],
            blue: ['#1f6fa8','#195b85','#12415d'],
            frost: ['#e6f3f7','#d9eef4','#cce9f0'],
            emerald: ['#0f6b4d','#0c593f','#0a4632'],
            midnight: ['#1a2a40','#122033','#0b1626'],
            forest: ['#1a4d2e','#0d3a1a','#052610'],
            gold: ['#d4a017','#b8860b','#8b6914'],
            silver: ['#c0c0c0','#a8a9ad','#808080'],
            purple: ['#4b0082','#663399','#8a2be2'],
            ruby: ['#8b0000','#c41e3a','#e31937'],
            copper: ['#b87333','#996633','#7a6333'],
            jade: ['#00a86b','#228b22','#0d5d2d']
            ,
            // Additional distinct palette entries (match inputs in create modal)
            pearl: ['#f6f4ef','#e9e7e3','#dcd9d3'],
            rose: ['#f5c6d1','#e89fb1','#d46f88'],
            bronze: ['#b5793a','#8f5f2e','#6f4823']
        };
        const cols = colorMap[color] || colorMap['green'];
        
        // Classic simple triangles (only design)
        const layer1 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        layer1.setAttribute('points', '200,80 80,200 320,200');
        layer1.setAttribute('fill', cols[0]);
        layer1.setAttribute('opacity', '1');
        
        const layer2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        layer2.setAttribute('points', '200,160 60,280 340,280');
        layer2.setAttribute('fill', cols[1]);
        layer2.setAttribute('opacity', '1');
        
        const layer3 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        layer3.setAttribute('points', '200,240 40,360 360,360');
        layer3.setAttribute('fill', cols[2]);
        layer3.setAttribute('opacity', '1');
        
        treeDesignGroup.appendChild(layer1);
        treeDesignGroup.appendChild(layer2);
        treeDesignGroup.appendChild(layer3);
        
        // Update trunk color based on design
        if (trunk) {
            trunk.setAttribute('fill', '#8B4513');
        }
        
        // Update star/top decoration
        if (topDecorationGroup) {
            topDecorationGroup.innerHTML = '';
            
            // Create SVG text element for the star
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '200');
            text.setAttribute('y', '65');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '45');
            text.style.pointerEvents = 'none';
            text.style.userSelect = 'none';
            
            // Map star preferences to emojis
            const starMap = {
                'star': '⭐',
                'gold-star': '🌟',
                'angel': '👼',
                'snowflake': '❄️',
                'sparkle': '✨',
                'bow': '🎀',
                'crown': '👑',
                'ornament': '🔴',
                'flame': '🔥'
            };
            
            text.textContent = starMap[star] || '⭐';
            topDecorationGroup.appendChild(text);
        }
    }

    async function loadTree(){
        const params = new URLSearchParams(window.location.search);
        // Robustly extract `id` param. Some users may paste malformed URLs like
        // `?id=XYZ?debug=christmas` (note extra '?'). Handle that by sanitizing.
        treeId = params.get('id');
        if (treeId && treeId.includes('?')) {
            treeId = treeId.split('?')[0];
        }
        // If still missing, try to extract from the full href (e.g., poorly formed query)
        if (!treeId){
            const m = window.location.href.match(/[?&]id=([^&?#]+)/);
            if (m) treeId = decodeURIComponent(m[1]);
        }
        if (!treeId){
            notify('No tree ID provided', 'error');
            setTimeout(() => window.location.href = 'decomytree_picker.html', 2000);
            return;
        }

        try{
            // show loading state
            const treeContainer = document.querySelector('.tree-container');
            if (treeContainer) treeContainer.classList.add('loading');
            const db = window.firebaseDb;
            const treeRef = window.firebaseDoc(db, 'trees', treeId);
            const snap = await window.firebaseGetDoc(treeRef);
            if (!snap.exists()){
                notify('Tree not found', 'error');
                setTimeout(() => window.location.href = 'decomytree_picker.html', 2000);
                return;
            }

            treeData = snap.data();
            
            // Check permissions: must be owner, tree must be public, or user must be in sharedWithUsernames list
            const isOwnTree = currentUser && treeData.ownerUid === (currentUser && currentUser.uid);
            const isPublic = treeData.public === true;
            const currentUserUsername = currentUser ? formatAuthorName(currentUser.email) : null;
            const isShared = currentUserUsername && treeData.sharedWithUsernames && Array.isArray(treeData.sharedWithUsernames) && treeData.sharedWithUsernames.includes(currentUserUsername);
            
            if (!isOwnTree && !isPublic && !isShared) {
                notify('You do not have permission to view this tree', 'error');
                setTimeout(() => window.location.href = 'decomytree_picker.html', 2000);
                return;
            }
            
            const ownerName = formatAuthorName(treeData.ownerEmail);
            const titleEl = $('#tree-title');
            const nameEl = $('#tree-name');
            const visualEl = $('#tree-visual');
            
            // Title will be set after ornaments load with count
            if (titleEl) titleEl.textContent = ownerName + "'s Tree";
            if (nameEl) nameEl.textContent = ownerName + "'s Tree";

            const treeEmoji = getTreeEmoji(treeData.design || 'classic');
            if (visualEl) visualEl.textContent = treeEmoji;

            // Extract color early so it can be used later
            const color = (treeData.color || 'green');
            const design = (treeData.design || 'classic');
            const star = (treeData.star || 'star');

            // Apply customization to SVG tree layers
            try{
                // Render tree design
                renderTreeDesign(design, color, star);
            }catch(e){/* non-fatal if SVG not present */}
            // Apply scene theme to body for background variations
            try{
                const theme = treeData.theme || 'scene-default';
                document.body.classList.remove('scene-default','scene-colorful','scene-snowy','scene-aurora','scene-sunset','scene-midnight','scene-forest','scene-cosmic');
                if (theme) document.body.classList.add(theme);
            }catch(e){}
            
            // Hide add button if it's user's own tree
            const addBtn = $('#add-ornament-btn');
            if (isOwnTree && addBtn) {
                addBtn.style.display = 'none';
            } else if (addBtn) {
                addBtn.style.display = '';
            }

            // Setup tree interactions with color for leaf particles
            setupTreeInteractions(color);

            // Show share button only to owner
            const shareBtn = $('#share-tree-btn');
            if (shareBtn) {
                shareBtn.style.display = isOwnTree ? '' : 'none';
            }

            await loadOrnaments();
            // remove loading state
            if (treeContainer) treeContainer.classList.remove('loading');
            const loadingEl = $('#tree-loading'); if (loadingEl) loadingEl.style.display = 'none';
            
            // Setup tree interactions
            setupTreeInteractions();
        }catch(e){
            console.error(e);
            notify('Failed to load tree: ' + (e.message||e), 'error');
        }
    }

    async function loadOrnaments(){
        try{
            const db = window.firebaseDb;
            const col = window.firebaseCollection(db, 'ornaments');
            const q = window.firebaseQuery(col, window.firebaseWhere('treeId','==',treeId), window.firebaseOrderBy('createdAt','desc'));
            const snap = await window.firebaseGetDocs(q);
            ornaments = [];
            snap.forEach(doc => {
                ornaments.push({id: doc.id, ...doc.data()});
            });

            // Sanitize ornament text so stored/incoming invisible characters are removed and copies are clean
            ornaments = ornaments.map(o => ({ ...o, text: sanitizeOrnamentText(o.text || '') }));

            currentPage = 1;
            
            // Update ornament count display
            const countDisplay = $('#ornament-count-display');
            if (countDisplay) {
                const count = ornaments.length;
                countDisplay.textContent = `${count} ornament${count === 1 ? '' : 's'}`;
            }
            
            renderOrnaments();
        }catch(e){
            console.error(e);
        }
    }

    // Display ornament in modal with handwriting style
    function displayOrnamentModal(ornament){
        const modal = $('#ornament-display-modal');
        const emojiEl = $('#ornament-emoji-display');
        const textEl = $('#ornament-text-display');
        const authorEl = $('#ornament-author-display');
        const privacyControls = $('#ornament-privacy-controls');
        const togglePrivacyBtn = $('#toggle-privacy-btn');
        
        if (emojiEl) emojiEl.textContent = ornament.emoji || '🎄';
        // Support multi-page long messages: split into pages by rendered height (no scrollbars)
        const raw = ornament.text || '';
        const maxToken = 20; // break extremely long words into chunks
        const pages = [];

        // compute content box size from the actual rendered paper element so hyphenation
        // and pagination remain correct even if CSS (width/aspect-ratio) changes
        const paperEl = modal.querySelector('.ornament-display-letter');
        let paperW = Math.floor(window.innerWidth * 0.75);
        let paperH = Math.floor(window.innerHeight * 0.75);
        if (paperEl) {
            const r = paperEl.getBoundingClientRect();
            if (r && r.width && r.height){ paperW = Math.floor(r.width); paperH = Math.floor(r.height); }
        }
        // paddings used in CSS: vertical ~56px total, horizontal ~52px total
        const verticalPadding = 56; // top+bottom
        const horizontalPadding = 52; // left+right
        // reserve space for emoji/heading and footer controls
        const reserved = 140; // emoji + author + spacing
        const contentW = Math.max(240, paperW - horizontalPadding);
        const contentH = Math.max(120, paperH - verticalPadding - reserved);

        // offscreen measurer
        const meas = document.createElement('div');
        meas.style.position = 'absolute';
        meas.style.left = '-9999px';
        meas.style.top = '0';
        meas.style.width = contentW + 'px';
        // Use the same font metrics as the visible text area so measurements match
        const computed = window.getComputedStyle(textEl || paperEl || document.body);
        meas.style.fontFamily = computed.fontFamily || "'Caveat', 'Segoe UI', sans-serif";
        meas.style.fontSize = computed.fontSize || '28px';
        meas.style.lineHeight = computed.lineHeight || '1.45';
        meas.style.whiteSpace = 'pre-wrap';
        meas.style.wordWrap = 'break-word';
        meas.style.visibility = 'hidden';
        document.body.appendChild(meas);

        // Tokenize preserving whitespace sequences (spaces/newlines)
        const tokens = raw.match(/(\S+\s*)/g) || [''];
        let current = '';
        // helper: insert soft-hyphens at reasonable syllable-like boundaries for long tokens
        function insertSoftHyphensIntoToken(word, maxLen){
            if (!word || word.length <= maxLen) return word;
            const vowels = /[aeiouyAEIOUY]/;
            const L = word.length;
            // find candidate split positions based on V-C-V patterns
            const candidates = [];
            for (let i = 1; i < L - 1; i++){
                if (vowels.test(word[i-1]) && !vowels.test(word[i]) && vowels.test(word[i+1])){
                    candidates.push(i);
                }
            }
            // fallback: allow splits after vowels if none found
            if (candidates.length === 0){
                for (let i = 1; i < L - 1; i++){
                    if (vowels.test(word[i-1]) && vowels.test(word[i]) === false){ candidates.push(i); }
                }
            }

            // build with soft hyphens greedily using candidates near maxLen
            let out = '';
            let idx = 0;
            while (idx < L){
                if (L - idx <= maxLen){ out += word.slice(idx); break; }
                // find rightmost candidate within (idx+maxLen) and at least idx+2
                let limit = Math.min(L-2, idx + maxLen);
                let split = -1;
                for (let k = candidates.length - 1; k >= 0; k--){ if (candidates[k] > idx + 1 && candidates[k] <= limit){ split = candidates[k]; break; } }
                if (split === -1){ // no candidate found: hard split at maxLen
                    split = idx + maxLen;
                }
                out += word.slice(idx, split) + '\u00AD';
                idx = split;
            }
            return out;
        }
        for (let t of tokens){
            // hyphenate extremely long tokens so they can be split if needed
            if (/\S{40,}/.test(t)){
                // insert soft-hyphens using a syllable-aware heuristic
                // preserve trailing whitespace
                const m = t.match(/(\S+)(\s*)/);
                if (m){
                    const word = m[1];
                    const space = m[2] || '';
                    t = insertSoftHyphensIntoToken(word, 12) + space;
                } else {
                    t = insertSoftHyphensIntoToken(t, 12);
                }
            }
            meas.innerText = current + t;
            if (meas.scrollHeight > contentH){
                // push current as a page (trim trailing whitespace)
                pages.push(current.trimEnd());
                // start new page with token (trim leading whitespace)
                current = t.trimStart();
                meas.innerText = current;
                // if single token alone too big, force-split it with hyphenation chunks
                if (meas.scrollHeight > contentH){
                    // split by fixed chunks
                    const chunkSize = 200;
                    let i = 0;
                    while (i < current.length){
                        const chunk = current.slice(i, i + chunkSize);
                        pages.push(chunk);
                        i += chunkSize;
                    }
                    current = '';
                }
            } else {
                current += t;
            }
        }
        if (current.trim().length > 0) pages.push(current.trimEnd());

        // cleanup measurer
        meas.remove();

        // Page state stored on modal element
        modal._ornamentPages = pages;
        modal._ornamentPageIndex = 0;

        function renderPage(idx, withFlip = true){
            const content = pages[idx] || '';
            if (!textEl) return;

            // helper: escape HTML
            function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

            // Prepare HTML: escape, replace soft-hyphens with <wbr> (so copies don't contain U+00AD), then newlines -> <br>
            let html = escapeHtml(content);
            // Replace soft-hyphens (inserted for measurement/hyphenation) with <wbr> elements so copied text is clean
            html = html.replace(/\u00AD/g, '<wbr>');
            html = html.replace(/\r?\n/g, '<br>');

            // Apply flip animation (visual only) while swapping content
            textEl.classList.remove('page-flip-in','page-flip-out');
            if (withFlip) textEl.classList.add('page-flip-out');
            setTimeout(()=>{
                textEl.innerHTML = html;
                textEl.classList.remove('page-flip-out');
                if (withFlip) textEl.classList.add('page-flip-in');

                // show signature only on last page
                if (authorEl){
                    if (idx === modal._ornamentPages.length - 1){
                        const author = formatAuthorName(ornament.createdByEmail || 'Anonymous');
                        authorEl.textContent = '— ' + author;
                        authorEl.style.display = '';
                    } else {
                        authorEl.textContent = '';
                        authorEl.style.display = 'none';
                    }
                }
            }, 120);

            // page indicator
            const pageControls = document.getElementById('ornament-page-indicator');
            if (pageControls) pageControls.textContent = `${idx+1} / ${pages.length}`;
        }

        // expose the current render function on the modal so persistent controls
        // (created once) will always call the latest renderPage implementation
        modal._renderPage = renderPage;

        // Build page controls area if not present
        let controls = document.getElementById('ornament-page-controls');
        if (!controls){
            controls = document.createElement('div');
            controls.id = 'ornament-page-controls';
            controls.className = 'ornament-page-controls';
            const prev = document.createElement('button'); prev.className = 'ornament-page-btn'; prev.textContent = '← Prev';
            const next = document.createElement('button'); next.className = 'ornament-page-btn'; next.textContent = 'Next →';
            const indicator = document.createElement('span'); indicator.id = 'ornament-page-indicator'; indicator.style.marginLeft = '8px'; indicator.style.color = 'var(--cream)';
            prev.addEventListener('click', ()=>{
                const m = document.getElementById('ornament-display-modal');
                if (!m) return;
                if (m._ornamentPageIndex > 0){
                    m._ornamentPageIndex -= 1;
                    if (typeof m._renderPage === 'function') m._renderPage(m._ornamentPageIndex);
                }
            });
            next.addEventListener('click', ()=>{
                const m = document.getElementById('ornament-display-modal');
                if (!m) return;
                if (m._ornamentPageIndex < (m._ornamentPages ? m._ornamentPages.length - 1 : -1)){
                    m._ornamentPageIndex += 1;
                    if (typeof m._renderPage === 'function') m._renderPage(m._ornamentPageIndex);
                }
            });
            controls.appendChild(prev); controls.appendChild(next); controls.appendChild(indicator);
            // Place controls beneath the paper, in the modal content footer
            let footer = document.querySelector('.ornament-display-footer');
            if (!footer){
                footer = document.createElement('div');
                footer.className = 'ornament-display-footer';
                const container = document.querySelector('.ornament-display-content');
                if (container) container.appendChild(footer);
            }
            footer.appendChild(controls);
        }

        // Render initial page (renderPage will show signature only on last page)
        renderPage(0, false);
        
        // Mark as read by tree owner if they're viewing it
        if (currentUser && treeData && treeData.ownerUid === currentUser.uid && ornament.ownerHasRead !== true) {
            markOrnamentAsReadByOwner(ornament);
        }
        
        // Show privacy controls only if user owns the tree
        if (privacyControls && currentUser && treeData && treeData.ownerUid === currentUser.uid) {
            show(privacyControls);
            
            // Update button text based on current privacy state
            if (togglePrivacyBtn) {
                const isPrivate = ornament.private === true;
                togglePrivacyBtn.textContent = isPrivate ? '🔓 Make Public' : '🔒 Make Private';
                
                // Remove previous click handler if any
                const newBtn = togglePrivacyBtn.cloneNode(true);
                togglePrivacyBtn.parentNode.replaceChild(newBtn, togglePrivacyBtn);
                
                // Add new click handler
                newBtn.addEventListener('click', async () => {
                    await toggleOrnamentPrivacy(ornament);
                });
            }
        } else if (privacyControls) {
            hide(privacyControls);
        }
        
        show(modal);
    }

    // Mark ornament as read by tree owner
    async function markOrnamentAsReadByOwner(ornament){
        try {
            const db = window.firebaseDb;
            const ornRef = window.firebaseDoc(db, 'ornaments', ornament.id);
            await window.firebaseUpdateDoc(ornRef, { ownerHasRead: true });
            ornament.ownerHasRead = true;
        } catch (e) {
            console.error('Error marking ornament as read:', e);
        }
    }

    // Toggle ornament privacy status
    async function toggleOrnamentPrivacy(ornament){
        if (!currentUser || !treeData || treeData.ownerUid !== currentUser.uid) {
            notify('Only tree owner can change message privacy', 'error');
            return;
        }
        
        if (ornament.private === true) {
            // Cannot publicize private messages
            notify('Private messages cannot be made public', 'warning');
            return;
        }
        
        try {
            const db = window.firebaseDb;
            const ornRef = window.firebaseDoc(db, 'ornaments', ornament.id);
            await window.firebaseUpdateDoc(ornRef, { private: true });
            
            // Update local ornament data
            ornament.private = true;
            
            // Update button
            const togglePrivacyBtn = $('#toggle-privacy-btn');
            if (togglePrivacyBtn) {
                togglePrivacyBtn.textContent = '🔓 Make Public';
            }
            
            notify('✅ Message marked as private', 'success');
        } catch (e) {
            console.error(e);
            notify('Failed to update message privacy', 'error');
        }
    }

    // Play Santa riding across screen animation
    function playSantaAnimation(){
        // Create Santa element
        const santa = document.createElement('div');
        santa.className = 'christmas-santa';
        santa.textContent = '🎅';
        document.body.appendChild(santa);
        
        // Remove after animation completes
        setTimeout(() => {
            santa.remove();
        }, 8000);
    }

    // --- Lightweight aurora/rain layer for tree view ---
    let viewWeatherCanvas = null;
    let viewWctx = null;
    let viewWidth = 0, viewHeight = 0;
    let viewAuroraPhase = 0;
    let viewRain = [];
    let viewRainEnabled = false;

    function initViewWeather(){
        viewWeatherCanvas = document.createElement('canvas');
        viewWeatherCanvas.id = 'view-weather-canvas';
        viewWeatherCanvas.style.position = 'fixed';
        viewWeatherCanvas.style.left = '0';
        viewWeatherCanvas.style.top = '0';
        viewWeatherCanvas.style.width = '100%';
        viewWeatherCanvas.style.height = '100%';
        viewWeatherCanvas.style.pointerEvents = 'none';
        viewWeatherCanvas.style.zIndex = '0';
        document.body.appendChild(viewWeatherCanvas);
        viewWctx = viewWeatherCanvas.getContext('2d');
        resizeViewWeather();
        requestAnimationFrame(animateViewWeather);
    }

    function resizeViewWeather(){
        if (!viewWeatherCanvas) return;
        viewWeatherCanvas.width = window.innerWidth;
        viewWeatherCanvas.height = window.innerHeight;
        viewWidth = viewWeatherCanvas.width; viewHeight = viewWeatherCanvas.height;
    }

    function drawViewAurora(){
        if (!viewWctx) return;
        viewWctx.clearRect(0,0,viewWidth,viewHeight);
        const bands = 4;
        for (let b=0;b<bands;b++){
            const alpha = 0.05 + b*0.03;
            viewWctx.fillStyle = `rgba(${20 + b*20}, ${140 + b*10}, ${150 + b*10}, ${alpha})`;
            viewWctx.globalCompositeOperation = 'lighter';
            viewWctx.beginPath();
            const baseY = viewHeight * 0.18 + b*40 + Math.sin(viewAuroraPhase * (0.5 + b*0.1)) * (20 + b*10);
            viewWctx.moveTo(0, baseY);
            for (let x=0;x<=viewWidth;x+=30){
                const y = baseY + Math.sin((x/250) + viewAuroraPhase*(0.4 + b*0.02) + b*0.1) * (18 + b*5);
                viewWctx.lineTo(x, y);
            }
            viewWctx.lineTo(viewWidth, baseY + 300);
            viewWctx.lineTo(0, baseY + 300);
            viewWctx.closePath();
            viewWctx.fill();
        }
        viewWctx.globalCompositeOperation = 'source-over';
    }

    function animateViewWeather(){
        viewAuroraPhase += 0.008;
        if (document.body.classList.contains('scene-aurora')){
            drawViewAurora();
        } else {
            if (viewWctx) viewWctx.clearRect(0,0,viewWidth,viewHeight);
        }

        // rain (if enabled)
        if (viewRainEnabled && viewWctx){
            viewWctx.save();
            viewWctx.strokeStyle = 'rgba(200,220,255,0.35)';
            viewWctx.beginPath();
            for (let i=viewRain.length-1;i>=0;i--){
                const d = viewRain[i]; d.x += d.vx; d.y += d.vy; viewWctx.moveTo(d.x, d.y); viewWctx.lineTo(d.x - d.vx*2, d.y - d.vy*2);
                if (d.y > viewHeight + 40) viewRain.splice(i,1);
            }
            viewWctx.stroke();
            viewWctx.restore();
            while (viewRain.length < Math.floor(viewWidth/14)) viewRain.push({ x: Math.random()*viewWidth, y: Math.random()*-200, vx: -1 - Math.random()*1.2, vy: 7+Math.random()*7 });
        }

        requestAnimationFrame(animateViewWeather);
    }

    function enableViewRain(on){ viewRainEnabled = !!on; if (!viewRainEnabled) viewRain = []; }

    function setupTreeInteractions(treeColor = 'green'){
        const treeSvg = document.getElementById('tree-svg');
        if (!treeSvg) return;
        
        treeSvg.addEventListener('click', function(event) {
            // Shake the tree
            treeSvg.classList.add('tree-shake');
            
            // Create falling decorations (leaves or snow based on theme)
            const theme = document.body.className;
            const isSnowy = theme.includes('snowy');
            
            // Trigger ornament sway animations with more swing
            const ornamentGroups = document.querySelectorAll('.ornament-group');
            ornamentGroups.forEach(group => {
                group.classList.add('tree-impact-sway');
                // Add extra swing by applying a CSS custom property
                group.style.setProperty('--swing-amount', Math.random() * 15 + 10 + 'px');
            });
            
            // Drop particles centered on the actual click position (better UX)
            const clickX = (event && typeof event.clientX === 'number') ? event.clientX : (treeSvg.getBoundingClientRect().left + treeSvg.getBoundingClientRect().width/2);
            const clickY = (event && typeof event.clientY === 'number') ? event.clientY : (treeSvg.getBoundingClientRect().top + treeSvg.getBoundingClientRect().height*0.3);
            
            // Color map for tree colors - use as text color filters
            const colorFilterMap = {
                green: 'hue-rotate(120deg) brightness(0.8)',
                blue: 'hue-rotate(220deg)',
                frost: 'brightness(1.2) saturate(0.5)',
                emerald: 'hue-rotate(140deg) brightness(0.9)',
                midnight: 'hue-rotate(200deg) brightness(0.6)',
                forest: 'hue-rotate(100deg) brightness(0.75)',
                gold: 'hue-rotate(40deg) brightness(1.1)',
                silver: 'brightness(1.3) saturate(0)',
                purple: 'hue-rotate(280deg)',
                ruby: 'hue-rotate(0deg) brightness(0.85)',
                copper: 'hue-rotate(20deg) brightness(0.9)',
                jade: 'hue-rotate(150deg) brightness(1)'
                ,
                // Added mappings for additional palettes
                pearl: 'brightness(1.05) saturate(0.6)',
                rose: 'hue-rotate(-10deg) saturate(0.9) brightness(1)',
                bronze: 'hue-rotate(25deg) saturate(0.9) brightness(0.95)'
            };
            
            for (let i = 0; i < 16; i++) {
                const particle = document.createElement('div');
                particle.className = isSnowy ? 'falling-snow' : 'falling-leaf';
                
                // Spawn centered on tree with some spread
                const angle = (Math.random() * Math.PI * 2);
                const distance = Math.random() * 80 + 6;
                const x = clickX + Math.cos(angle) * distance;
                const y = clickY + Math.sin(angle) * distance;
                
                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.fontSize = (Math.random() * 20 + 16) + 'px';
                particle.style.position = 'fixed';
                particle.style.pointerEvents = 'none';
                particle.style.zIndex = '5';
                
                // Apply color filter to leaf emoji based on tree color
                if (!isSnowy) {
                    particle.style.filter = colorFilterMap[treeColor] || colorFilterMap['green'];
                }
                
                particle.textContent = isSnowy ? '❄️' : '🍂';
                
                document.body.appendChild(particle);
                
                // Animate falling
                setTimeout(() => {
                    particle.classList.add('falling');
                }, 10);
                
                // Remove after animation
                setTimeout(() => {
                    particle.remove();
                }, 2500);
            }
            
            // Make the shake stronger and localized by adjusting the --swing-amount on ornaments
            ornamentGroups.forEach(group => {
                const swing = Math.random() * 40 + 30; // stronger swing: 30-70px
                group.classList.add('tree-impact-sway');
                group.style.setProperty('--swing-amount', swing + 'px');
            });

            // Remove shake class after animation
            setTimeout(() => {
                treeSvg.classList.remove('tree-shake');
                ornamentGroups.forEach(group => {
                    group.classList.remove('tree-impact-sway');
                    group.style.removeProperty('--swing-amount');
                });
            }, 700);
        });
    }

    function renderOrnaments(){
        const container = $('#ornaments-container');
        const ornamentPositions = $('#ornament-positions');
        const released = isReleased();
        const totalPages = Math.max(1, Math.ceil(ornaments.length / ornamesPerPage));
        
        const start = (currentPage - 1) * ornamesPerPage;
        const end = start + ornamesPerPage;
        const pageOrnaments = ornaments.slice(start, end);

        $('#current-page').textContent = ornaments.length === 0 ? '0' : currentPage;
        $('#total-pages').textContent = ornaments.length === 0 ? '0' : totalPages;

        // Clear previous ornaments from SVG
        if (ornamentPositions) {
            ornamentPositions.innerHTML = '';
        }

        if (ornaments.length === 0){
            const isOwnTree = currentUser && treeData && treeData.ownerUid === currentUser.uid;
            if (container) {
                if (isOwnTree){
                    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(245,240,232,0.6);padding:40px">Waiting for ornaments from friends... 🎄</div>';
                } else {
                    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:rgba(245,240,232,0.6);padding:40px">No messages yet. Be the first to add an ornament! 🎄</div>';
                }
            }
            if ($('#prev-page')) $('#prev-page').disabled = true;
            if ($('#next-page')) $('#next-page').disabled = true;
            return;
        }

        // Render ornaments on the SVG tree using fixed spots
        const spots = getFixedOrnamentSpots();
        // gather used spot indices from all ornaments to avoid collisions
        const usedIndices = new Set();
        ornaments.forEach(o => { if (o.spotIndex != null) usedIndices.add(o.spotIndex); });

        pageOrnaments.forEach((orn, idx) => {
            const isOwner = currentUser && orn.createdBy === (currentUser && currentUser.uid);
            const isPrivate = orn.private === true;
            const isTreeOwner = currentUser && treeData && treeData.ownerUid === (currentUser && currentUser.uid);
            const isOwnerPublic = orn.ownerHasRead === true && orn.private !== true;
            // On Christmas/debug: tree owner can read ALL (private+public), others read only public messages
            const canRead = released && (isOwner || isOwnerPublic || (isTreeOwner) || (!isPrivate && released));
            // determine spot index: prefer stored spotIndex, else pick first free, else fallback
            let spotIndex = (typeof orn.spotIndex === 'number') ? orn.spotIndex : null;
            if (spotIndex == null){
                // find first free index
                for (let i = 0; i < spots.length; i++){
                    if (!usedIndices.has(i)) { spotIndex = i; break; }
                }
                if (spotIndex == null) spotIndex = idx % spots.length;
                // mark as used (not persisted yet)
                usedIndices.add(spotIndex);
            }
            const pos = spots[spotIndex] || spots[0];

            // Create a group for ornament and text to move together
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.setAttribute('class', 'ornament-group');
            group.style.cursor = 'pointer';
            
            // Create ornament circle in SVG
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', '18');
            circle.setAttribute('fill', pos.color);
            const typeClass = orn.ornamentType ? (' ' + orn.ornamentType) : '';
            // If this ornament type should not move as part of impact animations,
            // add `no-move` so animations only change color/filters, not position.
            const nonMovingTypes = new Set(['heart','star','snowflake','sparkle','bow']);
            const noMoveClass = (orn.ornamentType && nonMovingTypes.has(orn.ornamentType)) ? ' no-move' : '';
            circle.setAttribute('class', 'ornament-circle' + typeClass + noMoveClass + (!released && !canRead ? ' unread' : ''));

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', pos.x);
            text.setAttribute('y', pos.y);
            text.setAttribute('class', 'ornament-text');
            if (orn.ornamentType) text.setAttribute('data-type', orn.ornamentType);
            text.textContent = orn.emoji || '🎄';
            text.style.pointerEvents = 'none';

            // Add click handler to group
            group.addEventListener('click', () => {
                if (released && canRead){
                    displayOrnamentModal(orn);
                } else if (!released){
                    notify('Message will be revealed on Christmas Day! 🎅', 'info', 3000);
                }
            });

            // Append both circle and text to the group
            group.appendChild(circle);
            group.appendChild(text);

            if (ornamentPositions) {
                ornamentPositions.appendChild(group);
            } else if (container) {
                // fallback: create a visual representation in the container
                const wrapper = document.createElement('div');
                wrapper.className = 'ornament-fallback';
                wrapper.style.display = 'inline-block';
                wrapper.style.margin = '6px';
                wrapper.textContent = orn.emoji || '🎄';
                container.appendChild(wrapper);
            }
        });

        // Update pagination buttons
        if ($('#prev-page')) $('#prev-page').disabled = currentPage === 1;
        if ($('#next-page')) $('#next-page').disabled = currentPage === totalPages;
    }

    // Share modal logic
    async function loadViewInvited(){
        const list = $('#view-invited-list');
        list.innerHTML = '';
        if (!treeData) return;
        const emails = Array.isArray(treeData.sharedWith) ? treeData.sharedWith : [];
        const unames = Array.isArray(treeData.sharedWithUsernames) ? treeData.sharedWithUsernames : [];

        if (emails.length === 0 && unames.length === 0){
            list.innerHTML = '<p style="color:rgba(245,240,232,0.6)">No invites yet</p>';
            return;
        }

        for (const e of emails){
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px;border-bottom:1px solid rgba(212,175,55,0.08);color:var(--cream)';
            const s = document.createElement('span'); s.textContent = e + ' (email)';
            const rem = document.createElement('button'); rem.textContent = '✕'; rem.style.cssText = 'background:transparent;color:#ff6b6b;border:none;cursor:pointer';
            rem.addEventListener('click', async () => {
                try{
                    const db = window.firebaseDb;
                    const treeRef = window.firebaseDoc(db, 'trees', treeId);
                    await window.firebaseUpdateDoc(treeRef, { sharedWith: window.firebaseArrayRemove(e), updatedAt: window.firebaseServerTimestamp() });
                    const snap = await window.firebaseGetDoc(treeRef);
                    treeData = snap.data();
                    loadViewInvited();
                    notify('✅ Removed invite', 'success');
                }catch(err){console.error(err);notify('Failed to remove invite','error');}
            });
            row.appendChild(s); row.appendChild(rem); list.appendChild(row);
        }

        for (const u of unames){
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px;border-bottom:1px solid rgba(212,175,55,0.08);color:var(--cream)';
            const s = document.createElement('span'); s.textContent = u + ' (username)';
            const rem = document.createElement('button'); rem.textContent = '✕'; rem.style.cssText = 'background:transparent;color:#ff6b6b;border:none;cursor:pointer';
            rem.addEventListener('click', async () => {
                try{
                    const db = window.firebaseDb;
                    const treeRef = window.firebaseDoc(db, 'trees', treeId);
                    await window.firebaseUpdateDoc(treeRef, { sharedWithUsernames: window.firebaseArrayRemove(u), updatedAt: window.firebaseServerTimestamp() });
                    const snap = await window.firebaseGetDoc(treeRef);
                    treeData = snap.data();
                    loadViewInvited();
                    notify('✅ Removed invite', 'success');
                }catch(err){console.error(err);notify('Failed to remove invite','error');}
            });
            row.appendChild(s); row.appendChild(rem); list.appendChild(row);
        }
    }

    // Fixed 10 ornament spots on the SVG tree (viewBox 0 0 400 500)
    function getFixedOrnamentSpots(){
        // Spots chosen visually across the three tree layers
        return [
            {x:200,y:110,color:'#ffd700'},
            {x:150,y:160,color:'#ff6347'},
            {x:250,y:160,color:'#dc143c'},
            {x:110,y:210,color:'#32cd32'},
            {x:170,y:220,color:'#ffa500'},
            {x:230,y:220,color:'#87ceeb'},
            {x:290,y:210,color:'#ff0000'},
            {x:80,y:270,color:'#cd5c5c'},
            {x:200,y:300,color:'#32cd32'},
            {x:320,y:270,color:'#ffd700'}
        ];
    }

    async function publishOrnament(){
        // Prevent double-click by checking if already publishing
        if (isPublishingOrnament) return;
        isPublishingOrnament = true;
        
        const publishBtn = $('#publish-ornament-btn');
        if (publishBtn) publishBtn.disabled = true;
        
        if (!currentUser) {
            notify('Not logged in', 'error');
            isPublishingOrnament = false;
            if (publishBtn) publishBtn.disabled = false;
            return;
        }
        if (!treeData) {
            notify('No tree loaded', 'error');
            isPublishingOrnament = false;
            if (publishBtn) publishBtn.disabled = false;
            return;
        }

        const text = sanitizeOrnamentText(($('#ornament-text').value || '')).trim();
        if (!text){
            notify('Please enter a message', 'warning');
            isPublishingOrnament = false;
            if (publishBtn) publishBtn.disabled = false;
            return;
        }

        try{
            const db = window.firebaseDb;
            const col = window.firebaseCollection(db, 'ornaments');

            // Determine a spotIndex to keep ornaments on fixed positions
            const q = window.firebaseQuery(col, window.firebaseWhere('treeId','==',treeId));
            const snap = await window.firebaseGetDocs(q);
            const used = new Set();
            snap.forEach(d => { const data = d.data(); if (typeof data.spotIndex === 'number') used.add(data.spotIndex); });
            const spots = getFixedOrnamentSpots();
            let chosenSpot = null;
            for (let i = 0; i < spots.length; i++){
                if (!used.has(i)){ chosenSpot = i; break; }
            }
            if (chosenSpot == null) chosenSpot = Math.floor(Math.random() * spots.length);

            await window.firebaseAddDoc(col, {
                treeId: treeId,
                emoji: selectedEmoji,
                text: text,
                private: !$('#ornament-public').checked,
                ornamentType: selectedType || 'classic',
                createdBy: currentUser.uid,
                createdByEmail: currentUser.email,
                createdAt: window.firebaseServerTimestamp(),
                likes: 0,
                spotIndex: chosenSpot
            });

            $('#ornament-text').value = '';
            $('#ornament-public').checked = true;
            hide($('#add-ornament-modal'));
            await loadOrnaments();
            notify('🎁 Ornament added to the tree!', 'success');
        }catch(e){
            console.error(e);
            notify('Failed to add ornament: ' + (e.message||e), 'error');
        }finally{
            // Always unlock the button when done (success or error)
            isPublishingOrnament = false;
            const publishBtn = $('#publish-ornament-btn');
            if (publishBtn) publishBtn.disabled = false;
        }
    }

    function init(){
        // Apply saved menu background on page load
        const savedBackground = localStorage.getItem('decomytree-menu-background') || 'scene-default';
        applyMenuBackground(savedBackground);
        
        const backBtn = $('#back-btn');
        const addBtn = $('#add-ornament-btn');
        const signOutBtn = $('#sign-out-btn');
        const publishBtn = $('#publish-ornament-btn');
        const cancelBtn = $('#cancel-ornament');
        const modal = $('#add-ornament-modal');
        const emojiPicker = $$('.ornament-picker button');
        const prevBtn = $('#prev-page');
        const nextBtn = $('#next-page');
        const shareBtn = $('#share-tree-btn');

        // Keep user input clean: strip invisible characters as the user types/pastes
        const ornamentTextInput = $('#ornament-text');
        if (ornamentTextInput) {
            ornamentTextInput.addEventListener('input', () => {
                const val = ornamentTextInput.value || '';
                const cleaned = sanitizeOrnamentText(val);
                if (cleaned !== val) ornamentTextInput.value = cleaned;
            });
        }
        const shareModal = $('#share-modal');
        const viewShareInput = $('#view-share-input');
        const viewAddShare = $('#view-add-share');
        const viewCloseShare = $('#view-close-share');
        const ornamentDisplayModal = $('#ornament-display-modal');
        const closeOrnamentBtn = $('#close-ornament-display');
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

        // Setup ornament modal close
        if (closeOrnamentBtn) {
            closeOrnamentBtn.addEventListener('click', () => hide(ornamentDisplayModal));
        }
        if (ornamentDisplayModal) {
            ornamentDisplayModal.addEventListener('click', (e) => {
                if (e.target === ornamentDisplayModal) hide(ornamentDisplayModal);
            });
        }

        // Play Santa animation on Christmas (disabled by request)
        // if (isReleased()) { playSantaAnimation(); }

        // Start countdown timer
        updateCountdown();
        setInterval(updateCountdown, 1000);

        if (backBtn) backBtn.addEventListener('click', () => {
            window.location.href = 'decomytree_picker.html';
        });

        // Initialize view weather canvas for aurora/rain
        initViewWeather();
        window.addEventListener('resize', resizeViewWeather);

        if (addBtn) addBtn.addEventListener('click', () => {
            show(modal);
            selectedEmoji = '🎄';
            updateEmojiPicker();
        });

        if (shareBtn) shareBtn.addEventListener('click', () => {
            show(shareModal);
            loadViewInvited();
        });

        if (viewCloseShare) viewCloseShare.addEventListener('click', () => hide(shareModal));

        if (viewAddShare) viewAddShare.addEventListener('click', async () => {
            const raw = (viewShareInput && viewShareInput.value || '').trim();
            if (!raw) return notify('Enter username or email', 'warning');
            const isEmail = raw.includes('@');
            try{
                const db = window.firebaseDb;
                const treeRef = window.firebaseDoc(db, 'trees', treeId);
                if (isEmail){
                    const email = raw.toLowerCase();
                    await window.firebaseUpdateDoc(treeRef, { sharedWith: window.firebaseArrayUnion(email), updatedAt: window.firebaseServerTimestamp() });
                } else {
                    await window.firebaseUpdateDoc(treeRef, { sharedWithUsernames: window.firebaseArrayUnion(raw), updatedAt: window.firebaseServerTimestamp() });
                }
                const snap = await window.firebaseGetDoc(treeRef);
                treeData = snap.data();
                viewShareInput.value = '';
                loadViewInvited();
                notify('✅ Invite added', 'success');
            }catch(err){console.error(err);notify('Failed to add invite','error');}
        });

        if (signOutBtn) signOutBtn.addEventListener('click', async () => {
            try{ await window.firebaseSignOut(window.firebaseAuth);}catch(e){console.error(e);}
        });

        emojiPicker.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                selectedEmoji = btn.dataset.emoji;
                selectedType = btn.dataset.type || 'classic';
                $('#selected-emoji').value = selectedEmoji;
                updateEmojiPicker();
            });
            // Add hover handlers to avoid sibling selection bleed-through
            btn.addEventListener('mouseenter', (e) => {
                emojiPicker.forEach(b => b.classList.remove('hovering'));
                btn.classList.add('hovering');
            });
            btn.addEventListener('mouseleave', (e) => {
                btn.classList.remove('hovering');
            });
        });

        function updateEmojiPicker(){
            emojiPicker.forEach(btn => {
                if (btn.dataset.emoji === selectedEmoji){
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            });
        }

        if (publishBtn) publishBtn.addEventListener('click', publishOrnament);
        if (cancelBtn) cancelBtn.addEventListener('click', () => hide(modal));

        if (prevBtn) prevBtn.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderOrnaments(); }
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(ornaments.length / ornamesPerPage);
            if (currentPage < totalPages) { currentPage++; renderOrnaments(); }
        });

        // Auth state
        if (window.firebaseOnAuthStateChanged){
            window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
                if (!user){
                    currentUser = null;
                    hide($('#user-info'));
                    await loadTree();
                    return;
                }

                currentUser = user;
                show($('#user-info'));
                $('#username-display').textContent = formatAuthorName(user.email);
                await loadTree();
            });
        }
    }

    if (window.firebaseReady){
        init();
    } else {
        window.initTreeView = init;
        const iv = setInterval(()=>{
            if (window.firebaseReady){ clearInterval(iv); init(); }
        },200);
    }
})();

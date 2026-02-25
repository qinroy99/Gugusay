import { initializeApp } from './modules/appInitSimple.js';
import { openImageModal } from './modules/imageModal.js';
import { showCustomContextMenu, hideCustomContextMenu } from './modules/contextMenu.js';
import { handlePaste } from './modules/mediaHandler.js';
import { initAdvancedSearch } from './modules/advancedSearch.js';
import { initNavigationSidebar, openNavigationSidebar } from './modules/navigationSidebar.js';

function appendBootstrapDebug(message) {
    void message;
}

function getRuntimeInfo() {
    const params = new URLSearchParams(window.location.search);
    return {
        gui: params.get('gui') || 'unknown',
        debug: params.get('debug') || '0',
        ua: navigator.userAgent || ''
    };
}

function appendSelfCheck(name, ok, detail = '') {
    const status = ok ? 'PASS' : 'FAIL';
    appendBootstrapDebug(`[${status}] ${name}${detail ? `: ${detail}` : ''}`);
}

function runDomSelfChecks() {
    const requiredIds = [
        'main-content',
        'tweets-container',
        'search-input',
        'search-btn',
        'toggle-tree',
        'navigation-sidebar'
    ];
    requiredIds.forEach((id) => {
        const exists = !!document.getElementById(id);
        appendSelfCheck(`DOM #${id}`, exists);
    });
}

async function runApiSelfChecks() {
    try {
        const resp = await fetch('/api/total-count?pageSize=6');
        if (!resp.ok) {
            appendSelfCheck('API /api/total-count', false, `http ${resp.status}`);
            return;
        }
        const data = await resp.json();
        appendSelfCheck('API /api/total-count', true, `count=${data.count ?? 'n/a'}`);
    } catch (error) {
        appendSelfCheck('API /api/total-count', false, error.message);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    appendBootstrapDebug('DOMContentLoaded');
    const runtime = getRuntimeInfo();
    appendBootstrapDebug(`runtime gui=${runtime.gui} debug=${runtime.debug}`);
    appendBootstrapDebug(`ua=${runtime.ua}`);
    runDomSelfChecks();

    try {
        initializeApp();
        appendBootstrapDebug('initializeApp ok');
    } catch (error) {
        console.error('initializeApp failed:', error);
        appendBootstrapDebug(`initializeApp failed: ${error.message}`);
    }

    runApiSelfChecks();

    try {
        initAdvancedSearch();
        appendBootstrapDebug('initAdvancedSearch ok');
    } catch (error) {
        console.error('initAdvancedSearch failed:', error);
        appendBootstrapDebug(`initAdvancedSearch failed: ${error.message}`);
    }

    try {
        initNavigationSidebar();
        appendBootstrapDebug('initNavigationSidebar ok');
    } catch (error) {
        console.error('initNavigationSidebar failed:', error);
        appendBootstrapDebug(`initNavigationSidebar failed: ${error.message}`);
    }

    const navToggleBtn = document.getElementById('toggle-tree');
    if (navToggleBtn && navToggleBtn.parentNode) {
        const newNavToggleBtn = navToggleBtn.cloneNode(true);
        navToggleBtn.parentNode.replaceChild(newNavToggleBtn, navToggleBtn);
        newNavToggleBtn.addEventListener('click', function () {
            openNavigationSidebar();
        });
    }

    document.addEventListener('paste', handlePaste);

    const tweetsContainer = document.getElementById('tweets-container');
    if (tweetsContainer) {
        tweetsContainer.addEventListener('click', function (e) {
            if (e.target.classList.contains('tweet-image')) {
                openImageModal(e.target);
            }
        });

        tweetsContainer.addEventListener('contextmenu', function (e) {
            const tweetElement = e.target.closest('.tweet');
            if (tweetElement) {
                showCustomContextMenu(e, tweetElement);
                e.preventDefault();
            }
        });
    }

    document.addEventListener('click', function () {
        hideCustomContextMenu();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            hideCustomContextMenu();
        }
    });

    const imageModal = document.getElementById('image-modal');
    const imageModalClose = document.querySelector('.image-modal-close');
    if (imageModal && imageModalClose) {
        imageModalClose.addEventListener('click', function () {
            imageModal.style.display = 'none';
        });

        imageModal.addEventListener('click', function (e) {
            if (e.target === imageModal) {
                imageModal.style.display = 'none';
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (imageModal) {
                imageModal.style.display = 'none';
            }
            const statsModal = document.getElementById('stats-modal');
            if (statsModal) {
                statsModal.classList.add('hidden');
            }
        }
    });
});

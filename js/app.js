/* =====================================================
   SHOESELECT - APP.JS
===================================================== */
/* =====================================================
   PWA - SERVICE WORKER
===================================================== */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado com sucesso!', reg))
            .catch(err => console.log('Erro ao registrar Service Worker:', err));
    });
}

/* =====================================================
   TEMA CLARO/ESCURO E ESTADOS INICIAIS
===================================================== */
let currentTheme = localStorage.getItem("siteTheme") || "light";
document.documentElement.setAttribute("data-theme", currentTheme);

// Categorias Atualizadas
const categoriesAvailable = ["FLATFORM", "SANDALIA ALTA", "SANDALIA MEDIA", "SANDALIA BAIXA", "SAPATO", "ANABELA", "TENIS", "SANDALIA FLAT", "SAPATILHA", "BOTA SALTO ALTO", "BOTA SALTO MEDIO", "BOTA SALTO BAIXO"];

// Base de usuários simulada
let users = JSON.parse(localStorage.getItem("mockUsers"));
if (!users) {
    users = [
        { email: "cliente@shoeselect.com", password: "123", name: "Cliente", role: "client", profileImage: null },
        { email: "admin@shoeselect.com", password: "123", name: "Administrador", role: "admin", profileImage: null }
    ];
    localStorage.setItem("mockUsers", JSON.stringify(users));
}

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let savedAccounts = JSON.parse(localStorage.getItem("savedAccounts")) || [];
let collections = JSON.parse(localStorage.getItem("collections")) || [];

// Reset Completo ao carregar a página
let currentCollectionId = null;
let currentCategoryName = null;
let currentSelectionIndex = 0;
let currentCategoryFilter = "all";
let currentColFilter = "all"; 
let pendingFiles = [];
let currentFileIndex = 0;
let editingModelId = null;
let isGlobalAdd = false; 
const temporaryModelData = {};

let modelToDeleteId = null;
let modelToDeleteIsGlobal = false;

/* =====================================================
   ELEMENTOS DO DOM
===================================================== */
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
if (themeIcon) themeIcon.textContent = currentTheme === "dark" ? "☀️" : "🌙";

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const togglePassword = document.getElementById("togglePassword");
const accountButton = document.getElementById("accountButton");
const accountMenu = document.getElementById("accountMenu");
const accountInitial = document.getElementById("accountInitial");
const accountName = document.getElementById("accountName");
const accountRole = document.getElementById("accountRole");
const logoutButton = document.getElementById("logoutButton");

// Perfil / Credenciais
const editProfileBtn = document.getElementById("editProfileBtn");
const switchAccountBtn = document.getElementById("switchAccountBtn");
const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profilePhotoPreview = document.getElementById("profilePhotoPreview");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const toggleCredentialsBtn = document.getElementById("toggleCredentialsBtn");
const credentialsSection = document.getElementById("credentialsSection");

// Switch Account
const switchAccountModal = document.getElementById("switchAccountModal");
const closeSwitchAccountModal = document.getElementById("closeSwitchAccountModal");
const addNewAccountBtn = document.getElementById("addNewAccountBtn");
const savedAccountsList = document.getElementById("savedAccountsList");

const pages = document.querySelectorAll(".page");
const homePage = document.getElementById("homePage");
const approvedPage = document.getElementById("approvedPage");
const adminPage = document.getElementById("adminPage");
const collectionPage = document.getElementById("collectionPage");
const categoryPage = document.getElementById("categoryPage");
const selectionPage = document.getElementById("selectionPage");

const clientCollections = document.getElementById("clientCollections");
const adminCollections = document.getElementById("adminCollections");
const collectionPageTitle = document.getElementById("collectionPageTitle");
const collectionSummary = document.getElementById("collectionSummary");
const adminGlobalAddContainer = document.getElementById("adminGlobalAddContainer");
const collectionCategories = document.getElementById("collectionCategories");
const collectionModelsGrid = document.getElementById("collectionModelsGrid");
const collectionModelFilters = document.getElementById("collectionModelFilters");

const categoryCollectionName = document.getElementById("categoryCollectionName");
const categoryPageTitle = document.getElementById("categoryPageTitle");
const categoryClientSummary = document.getElementById("categoryClientSummary");
const categoryPreview = document.getElementById("categoryPreview");
const selectionCollectionName = document.getElementById("selectionCollectionName");
const selectionCategoryName = document.getElementById("selectionCategoryName");
const selectionCounter = document.getElementById("selectionCounter");
const selectionRemaining = document.getElementById("selectionRemaining");
const selectionProgress = document.getElementById("selectionProgress");
const selectionContainer = document.getElementById("selectionContainer");
const approvedCategoryFilters = document.getElementById("approvedCategoryFilters");
const approvedModelsContainer = document.getElementById("approvedModelsContainer");

const collectionModal = document.getElementById("collectionModal");
const openCollectionModal = document.getElementById("openCollectionModal");
const closeCollectionModal = document.getElementById("closeCollectionModal");
const collectionName = document.getElementById("collectionName");
const categoriesContainer = document.getElementById("categoriesContainer");
const selectedCount = document.getElementById("selectedCount");
const createCollectionButton = document.getElementById("createCollectionButton");

const modelModal = document.getElementById("modelModal");
const closeModelModal = document.getElementById("closeModelModal");
const modelModalCategory = document.getElementById("modelModalCategory");
const singleModelForm = document.getElementById("singleModelForm");
const modelStep = document.getElementById("modelStep");
const previousModelButton = document.getElementById("previousModelButton");
const nextModelButton = document.getElementById("nextModelButton");
const saveCurrentModelButton = document.getElementById("saveCurrentModelButton");

const categoryImageInput = document.createElement("input");
categoryImageInput.type = "file";
categoryImageInput.accept = "image/*";
categoryImageInput.multiple = true;
categoryImageInput.hidden = true;
document.body.appendChild(categoryImageInput);

const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");
const deleteModelConfirmModal = document.getElementById("deleteModelConfirmModal");

const backToHome = document.getElementById("backToHome");
const backToCollection = document.getElementById("backToCollection");
const backToCategory = document.getElementById("backToCategory");
const startCategoryButton = document.getElementById("startCategoryButton");
const toast = document.getElementById("toast");

/* =====================================================
   EVENTOS DE TEMA, PERFIL E MÚLTIPLAS CONTAS
===================================================== */
themeToggle.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("siteTheme", currentTheme);
    themeIcon.textContent = currentTheme === "dark" ? "☀️" : "🌙";
});

// ABRIR MODAL PERFIL E CARREGAR DADOS
editProfileBtn.addEventListener("click", () => {
    document.getElementById("profileOldPassword").value = "";
    document.getElementById("profileEmail").value = currentUser.email;
    document.getElementById("profilePassword").value = "";
    
    credentialsSection.style.display = "none";
    
    if (currentUser.profileImage) {
        profilePhotoPreview.innerHTML = `<img src="${currentUser.profileImage}"><div class="profile-photo-overlay">📷</div>`;
    } else {
        profilePhotoPreview.innerHTML = `<span id="profilePhotoInitialLarge">${currentUser.name.charAt(0).toUpperCase()}</span><div class="profile-photo-overlay">📷</div>`;
    }
    profilePhotoPreview.dataset.newImg = "";
    
    profileModal.classList.add("active");
    accountMenu.classList.remove("active");
});

closeProfileModal.addEventListener("click", () => profileModal.classList.remove("active"));

toggleCredentialsBtn.addEventListener("click", () => {
    credentialsSection.style.display = credentialsSection.style.display === "none" ? "block" : "none";
});

profilePhotoPreview.addEventListener("click", () => profilePhotoInput.click());
profilePhotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            profilePhotoPreview.innerHTML = `<img src="${event.target.result}"><div class="profile-photo-overlay">📷</div>`;
            profilePhotoPreview.dataset.newImg = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

saveProfileBtn.addEventListener("click", () => {
    const oldPass = document.getElementById("profileOldPassword").value;
    const newEmail = document.getElementById("profileEmail").value.trim().toLowerCase();
    const newPass = document.getElementById("profilePassword").value;
    const newImg = profilePhotoPreview.dataset.newImg;

    const userInDbIndex = users.findIndex(u => u.email === currentUser.email);
    if (userInDbIndex === -1) return;

    if (credentialsSection.style.display === "block" && (newEmail !== currentUser.email || newPass)) {
        if (!oldPass) {
            showToast("Digite sua senha antiga para confirmar as alterações!");
            return;
        }
        if (oldPass !== users[userInDbIndex].password) {
            showToast("Senha antiga incorreta.");
            return;
        }
        if (newEmail) users[userInDbIndex].email = newEmail;
        if (newPass) users[userInDbIndex].password = newPass;
    }

    if (newImg) users[userInDbIndex].profileImage = newImg;
    
    localStorage.setItem("mockUsers", JSON.stringify(users));
    
    currentUser.email = users[userInDbIndex].email;
    currentUser.profileImage = users[userInDbIndex].profileImage;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    
    const savedIdx = savedAccounts.findIndex(a => a.email === (oldPass ? currentUser.email : a.email));
    if (savedIdx > -1) {
        savedAccounts[savedIdx].email = currentUser.email;
        savedAccounts[savedIdx].profileImage = currentUser.profileImage;
        localStorage.setItem("savedAccounts", JSON.stringify(savedAccounts));
    }

    updateUserInterface();
    showToast("Perfil atualizado com sucesso!");
    profileModal.classList.remove("active");
});

switchAccountBtn.addEventListener("click", () => {
    accountMenu.classList.remove("active");
    renderSavedAccounts();
    switchAccountModal.classList.add("active");
});
closeSwitchAccountModal.addEventListener("click", () => switchAccountModal.classList.remove("active"));
addNewAccountBtn.addEventListener("click", () => {
    switchAccountModal.classList.remove("active");
    logout();
});

function renderSavedAccounts() {
    if (savedAccounts.length === 0) {
        savedAccountsList.innerHTML = `<p style="font-size: 11px; color: var(--muted);">Nenhuma outra conta salva.</p>`;
        return;
    }
    savedAccountsList.innerHTML = savedAccounts.map(acc => {
        const isCurrent = currentUser && currentUser.email === acc.email;
        const imgHtml = acc.profileImage ? `<img src="${acc.profileImage}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">` : `<div style="width:30px;height:30px;border-radius:50%;background:rgba(125,133,144,.2);display:grid;place-items:center;font-weight:bold;font-size:12px;">${acc.name.charAt(0).toUpperCase()}</div>`;
        return `
            <button class="secondary-button" style="display: flex; justify-content: space-between; align-items: center; width: 100%; height: 55px; border-color: ${isCurrent ? 'var(--text)' : 'transparent'}; pointer-events: ${isCurrent ? 'none' : 'auto'};" onclick="loginAs('${acc.email}')">
                <div style="display:flex; align-items:center; gap: 10px;">
                    ${imgHtml}
                    <div style="text-align: left;">
                        <strong style="display:block; font-size: 11px; color: var(--text);">${acc.name} ${isCurrent ? '(Atual)' : ''}</strong>
                        <span style="font-size: 9px; color: var(--muted);">${acc.email}</span>
                    </div>
                </div>
                ${!isCurrent ? '<span>→</span>' : ''}
            </button>
        `;
    }).join('');
}

window.loginAs = function(email) {
    const acc = savedAccounts.find(a => a.email === email);
    if(acc) {
        currentUser = acc;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        switchAccountModal.classList.remove("active");
        
        currentCollectionId = null;
        currentCategoryName = null;
        currentSelectionIndex = 0;
        
        updateUserInterface();
        if (currentUser.role === "admin") {
            renderAdminCollections();
            showPage(adminPage);
            activateNavigation("adminPage");
        } else {
            renderClientHome();
            showPage(homePage);
            activateNavigation("homePage");
        }
        showToast(`Bem-vindo de volta, ${acc.name}!`);
    }
}

/* =====================================================
   UTILITÁRIOS E DADOS
===================================================== */
function saveCollections() { localStorage.setItem("collections", JSON.stringify(collections)); }
function escapeHTML(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
function cleanFileName(name) { return name ? name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") : ""; }
function getCollection(id) { return collections.find(c => String(c.id) === String(id)); }
function getCategory(col, name) { return col.categories.find(c => c.name === name); }
function getAllModels() {
    const models = [];
    collections.forEach(col => col.categories.forEach(cat => cat.shoes.forEach(model => models.push({ model, collection: col, category: cat }))));
    return models;
}

function createDemoData() {
    if (collections.length > 0) return;
    collections = [{
        id: Date.now(),
        name: "Coleção Verão 2026",
        categories: [
            { name: "SANDALIA MEDIA", locked: false, shoes: [
                { id: Date.now()+1, name: "Modelo Verão 01", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900", colorMaterial: "Cacau / Couro", observation: "Ref", status: "analysis" },
                { id: Date.now()+2, name: "Modelo Verão 02", image: "https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=900", colorMaterial: "Caramelo / Couro", observation: "", status: "analysis" }
            ]},
            { name: "TENIS", locked: false, shoes: [
                { id: Date.now()+3, name: "Urban One", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900", colorMaterial: "Branco / Sintético", observation: "", status: "analysis" }
            ]},
            { name: "ANABELA", locked: false, shoes: [] }
        ]
    }];
    saveCollections();
}
if (collections.length === 0) createDemoData();

/* =====================================================
   LOGIN / AUTH
===================================================== */
function showApp() {
    loginScreen.style.display = "none";
    appScreen.classList.add("active");
    updateUserInterface();
    if (currentUser.role === "client") {
        renderClientHome();
        showPage(homePage);
        activateNavigation("homePage");
    } else {
        renderAdminCollections();
        showPage(adminPage);
        activateNavigation("adminPage");
    }
}
function showLogin() { appScreen.classList.remove("active"); loginScreen.style.display = "grid"; }

loginForm.addEventListener("submit", e => {
    e.preventDefault();
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) { loginError.classList.add("active"); return; }
    
    loginError.classList.remove("active");
    currentUser = { name: user.name, email: user.email, role: user.role, profileImage: user.profileImage };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    
    if (!savedAccounts.find(a => a.email === user.email)) {
        savedAccounts.push(currentUser);
        localStorage.setItem("savedAccounts", JSON.stringify(savedAccounts));
    }
    
    showApp();
});
togglePassword.addEventListener("click", () => { loginPassword.type = loginPassword.type === "password" ? "text" : "password"; });

function updateUserInterface() {
    const isAdmin = currentUser.role === "admin";
    document.querySelectorAll("[data-admin-only]").forEach(el => el.style.display = isAdmin ? "" : "none");
    document.querySelectorAll("[data-client-only]").forEach(el => el.style.display = isAdmin ? "none" : "");
    
    const initial = currentUser.name.charAt(0).toUpperCase();
    if (currentUser.profileImage) {
        accountButton.innerHTML = `<img src="${currentUser.profileImage}">`;
    } else {
        accountButton.innerHTML = `<span id="accountInitial">${initial}</span>`;
    }
    
    accountName.textContent = currentUser.name;
    accountRole.textContent = isAdmin ? "Administrador" : "Cliente";
}

accountButton.addEventListener("click", e => { e.stopPropagation(); accountMenu.classList.toggle("active"); });
document.addEventListener("click", e => { if (!accountMenu.contains(e.target) && e.target !== accountButton) accountMenu.classList.remove("active"); });
logoutButton.addEventListener("click", logout);

function logout() {
    localStorage.removeItem("currentUser");
    currentUser = null;
    accountMenu.classList.remove("active");
    loginEmail.value = "";
    loginPassword.value = "";
    loginError.classList.remove("active");
    showLogin();
}

function showPage(page) {
    pages.forEach(p => p.classList.remove("active"));
    page.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function activateNavigation(pageId) {
    document.querySelectorAll(".top-nav-button").forEach(btn => btn.classList.toggle("active", btn.dataset.page === pageId));
}

document.querySelectorAll(".top-nav-button").forEach(btn => {
    btn.addEventListener("click", () => {
        const pageId = btn.dataset.page;
        if (pageId === "homePage") { renderClientHome(); showPage(homePage); activateNavigation("homePage"); }
        if (pageId === "approvedPage") { renderApproved(); showPage(approvedPage); activateNavigation("approvedPage"); }
        if (pageId === "adminPage" && currentUser.role === "admin") { renderAdminCollections(); showPage(adminPage); activateNavigation("adminPage"); }
    });
});

/* =====================================================
   HOME CLIENTE
===================================================== */
function renderClientHome() {
    const continueGrid = document.getElementById("continueApprovalGrid");
    const continueSection = document.getElementById("continueApprovalSection");
    const availableGrid = document.getElementById("clientCollections");
    const previousGrid = document.getElementById("previousCollectionsGrid");
    const previousSection = document.getElementById("previousCollectionsSection");
    const lastApprovedGrid = document.getElementById("lastApprovedGrid");
    const lastApprovedSection = document.getElementById("lastApprovedSection");

    if (collections.length === 0) {
        availableGrid.innerHTML = `<div class="empty glass" style="grid-column:1/-1;"><div class="empty-icon">✦</div><h3>Nenhuma coleção disponível</h3><p>Aguarde uma nova coleção.</p></div>`;
        continueSection.style.display = 'none'; previousSection.style.display = 'none'; lastApprovedSection.style.display = 'none';
        return;
    }

    let inProgress = [], available = [], previous = [], allApprovedModels = [];

    collections.forEach(col => {
        let totalShoes = 0, analysisShoes = 0;
        col.categories.forEach(cat => {
            totalShoes += cat.shoes.length;
            cat.shoes.forEach(shoe => {
                if (shoe.status === 'analysis') analysisShoes++;
                if (shoe.status === 'approved') allApprovedModels.push(shoe);
            });
        });

        if (totalShoes > 0 && analysisShoes > 0 && analysisShoes < totalShoes) inProgress.push(col);
        else if (totalShoes === 0 || analysisShoes === totalShoes) available.push(col);
        else if (analysisShoes === 0 && totalShoes > 0) previous.push(col);
    });

    const createCardHTML = (col) => `
        <article class="collection-card glass" data-client-collection="${col.id}">
            <div class="collection-card-top">
                <div class="collection-symbol">✦</div>
                <span class="collection-card-count">${col.categories.length} categorias</span>
            </div>
            <div>
                <h3>${escapeHTML(col.name)}</h3>
                <p>Acessar coleção →</p>
            </div>
        </article>
    `;

    if (inProgress.length > 0) { continueSection.style.display = 'block'; continueGrid.innerHTML = inProgress.map(createCardHTML).join(''); } else { continueSection.style.display = 'none'; }
    availableGrid.innerHTML = available.length > 0 ? available.map(createCardHTML).join('') : '<p style="color:var(--muted); font-size:11px;">Nenhuma coleção nova no momento.</p>';
    if (previous.length > 0) { previousSection.style.display = 'block'; previousGrid.innerHTML = previous.map(createCardHTML).join(''); } else { previousSection.style.display = 'none'; }
    if (allApprovedModels.length > 0) {
        lastApprovedSection.style.display = 'block';
        const latest = allApprovedModels.reverse().slice(0, 4);
        lastApprovedGrid.innerHTML = latest.map(m => `
            <article class="preview-card">
                <img src="${m.image}" alt="${escapeHTML(m.name)}">
                <div class="preview-card-info">
                    <strong>${escapeHTML(m.name)}</strong>
                    <span>${m.colorMaterial ? escapeHTML(m.colorMaterial) : 'Sem descrição'}</span>
                </div>
            </article>
        `).join('');
    } else { lastApprovedSection.style.display = 'none'; }

    document.querySelectorAll("[data-client-collection]").forEach(card => {
        card.addEventListener("click", () => openCollection(String(card.dataset.clientCollection)));
    });
}

/* =====================================================
   COLEÇÃO E LISTAGEM DE TODOS MODELOS
===================================================== */
function openCollection(id) {
    const collection = getCollection(id);
    if (!collection) return;
    currentCollectionId = id;
    collectionPageTitle.textContent = collection.name;
    renderCollectionSummary(collection);
    renderCollectionCategories(collection);
    
    if (currentUser.role === "admin") {
        adminGlobalAddContainer.innerHTML = `<button class="primary-button" onclick="openGlobalAdminAdd()" style="margin: 15px 0 25px 0;">＋ Adicionar Modelos na Coleção</button>`;
    } else {
        adminGlobalAddContainer.innerHTML = '';
    }
    
    renderCollectionModelsList();
    showPage(collectionPage);
}

function renderCollectionSummary(collection) {
    const total = collection.categories.reduce((s, c) => s + c.shoes.length, 0);
    const approved = collection.categories.reduce((s, c) => s + c.shoes.filter(m => m.status === "approved").length, 0);
    const analysis = collection.categories.reduce((s, c) => s + c.shoes.filter(m => m.status === "analysis").length, 0);
    collectionSummary.innerHTML = `<div class="summary-row"><div class="summary-main"><strong>${total} modelos</strong><span>${analysis} em análise · ${approved} aprovados</span></div></div>`;
}

function renderCollectionCategories(collection) {
    collectionCategories.innerHTML = collection.categories.map(category => {
        const analysis = category.shoes.filter(m => m.status === "analysis").length;
        const iconColor = category.locked ? 'var(--green)' : 'var(--text)';
        return `
            <article class="category-card glass" data-category-card="${encodeURIComponent(category.name)}">
                <div><div class="category-icon" style="color:${iconColor}">${category.locked ? '✓' : '👟'}</div><h3>${escapeHTML(category.name)}</h3></div>
                <div class="category-card-bottom"><span>${analysis > 0 ? analysis + ' em análise' : 'Concluído'}</span><div class="category-arrow">→</div></div>
            </article>
        `;
    }).join("");
    document.querySelectorAll("[data-category-card]").forEach(card => card.addEventListener("click", () => openCategory(decodeURIComponent(card.dataset.categoryCard))));
}

document.querySelectorAll("#collectionModelFilters button").forEach(btn => {
    btn.addEventListener("click", () => {
        currentColFilter = btn.dataset.colFilter;
        renderCollectionModelsList();
    });
});

function renderCollectionModelsList() {
    const col = getCollection(currentCollectionId);
    if (!col) return;
    
    let models = [];
    col.categories.forEach(cat => {
        cat.shoes.forEach(shoe => { models.push({...shoe, categoryName: cat.name}); });
    });
    
    models.sort((a, b) => b.id - a.id); 
    
    if (currentColFilter !== 'all') models = models.filter(m => m.status === currentColFilter);
    
    document.querySelectorAll("#collectionModelFilters button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.colFilter === currentColFilter);
    });

    const isAdmin = currentUser.role === "admin";
    collectionModelsGrid.innerHTML = models.length === 0 
        ? `<div class="empty glass" style="grid-column:1/-1;"><div class="empty-icon">👟</div><h3>Nenhum modelo encontrado</h3></div>`
        : models.map(m => `
            <article class="preview-card">
                <img src="${m.image}" alt="${escapeHTML(m.name)}">
                <div class="preview-card-info" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${escapeHTML(m.name)}</strong>
                        <span>${escapeHTML(m.categoryName)} - ${m.status === 'approved' ? 'Aprovado' : (m.status === 'cancelled' ? 'Cancelado' : 'Em análise')}</span>
                    </div>
                    ${isAdmin ? `
                        <div style="display:flex; gap: 4px;">
                            <button class="admin-small-button" onclick="editModel('${m.id}', true)" style="width: 28px; padding: 4px;" title="Editar">✎</button>
                            <button class="admin-small-button danger" onclick="deleteModel('${m.id}', true)" style="width: 28px; padding: 4px;" title="Excluir">✕</button>
                        </div>
                    ` : ''}
                </div>
            </article>
        `).join('');
}

function openCategory(name) {
    const collection = getCollection(currentCollectionId);
    if (!collection) return;
    const category = getCategory(collection, name);
    if (!category) return;
    currentCategoryName = name;
    categoryCollectionName.textContent = collection.name;
    categoryPageTitle.textContent = category.name;
    renderCategoryClient(category);
    showPage(categoryPage);
}

function renderCategoryClient(category) {
    const total = category.shoes.length;
    const analysis = category.shoes.filter(m => m.status === "analysis").length;
    const approved = category.shoes.filter(m => m.status === "approved").length;
    
    categoryClientSummary.innerHTML = `<div class="summary-row"><div class="summary-main"><strong>${total} modelos</strong><span>${analysis} em análise · ${approved} aprovados</span></div></div>`;
    
    const isAdmin = currentUser.role === "admin";
    
    let adminBtn = document.getElementById("adminAddBtnDynamic");
    if (isAdmin) {
        startCategoryButton.style.display = "none";
        if (!adminBtn) {
            adminBtn = document.createElement("button");
            adminBtn.id = "adminAddBtnDynamic";
            adminBtn.className = "primary-button";
            adminBtn.innerHTML = "＋ Adicionar Modelos";
            adminBtn.style.marginBottom = "20px";
            adminBtn.onclick = () => openAdminCategory(category.name);
            startCategoryButton.parentNode.insertBefore(adminBtn, startCategoryButton.nextSibling);
        }
        adminBtn.style.display = "block";
    } else {
        if (adminBtn) adminBtn.style.display = "none";
        startCategoryButton.style.display = "block";
        startCategoryButton.style.background = ""; 
        startCategoryButton.style.color = "";
        
        if (category.locked) {
            startCategoryButton.textContent = "🔒 Categoria Finalizada";
            startCategoryButton.disabled = true;
            startCategoryButton.style.background = "var(--muted)";
            startCategoryButton.style.color = "var(--bg)";
        } else if (analysis === 0 && total > 0) {
            startCategoryButton.textContent = "✓ Concluir Categoria";
            startCategoryButton.disabled = false;
            startCategoryButton.style.background = "var(--green)";
            startCategoryButton.style.color = "#fff";
        } else if (total === 0) {
            startCategoryButton.textContent = "Categoria Vazia";
            startCategoryButton.disabled = true;
        } else {
            startCategoryButton.textContent = "Começar seleção →";
            startCategoryButton.disabled = false;
        }
    }
    
    categoryPreview.innerHTML = category.shoes.length === 0
        ? `<div class="empty glass" style="grid-column:1/-1;"><div class="empty-icon">👟</div><h3>Nenhum modelo</h3></div>`
        : category.shoes.map(model => `
            <article class="preview-card" style="${category.locked && !isAdmin ? 'opacity: 0.6;' : ''}">
                <img src="${model.image}" alt="${escapeHTML(model.name)}">
                <div class="preview-card-info" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${escapeHTML(model.name)}</strong>
                        <span>${model.status === "approved" ? "Aprovado" : model.status === "cancelled" ? "Cancelado" : "Em análise"}</span>
                    </div>
                    ${isAdmin ? `
                        <div style="display:flex; gap: 4px;">
                            <button class="admin-small-button" onclick="editModel('${model.id}')" style="width: 28px; padding: 4px;" title="Editar">✎</button>
                            <button class="admin-small-button danger" onclick="deleteModel('${model.id}')" style="width: 28px; padding: 4px;" title="Excluir">✕</button>
                        </div>
                    ` : ''}
                </div>
            </article>
        `).join("");
}

startCategoryButton.addEventListener("click", () => {
    if (startCategoryButton.disabled) return;
    
    const collection = getCollection(currentCollectionId);
    const category = getCategory(collection, currentCategoryName);
    
    if (startCategoryButton.textContent === "✓ Concluir Categoria") {
        category.locked = true;
        saveCollections();
        showToast("Categoria concluída e travada!");
        renderCategoryClient(category);
        return;
    }
    
    currentSelectionIndex = 0;
    selectionCollectionName.textContent = collection.name;
    selectionCategoryName.textContent = currentCategoryName;
    showPage(selectionPage);
    renderSelection();
});

/* =====================================================
   SELEÇÃO (SWIPE)
===================================================== */
function renderSelection() {
    const collection = getCollection(currentCollectionId);
    const category = getCategory(collection, currentCategoryName);
    const pending = category.shoes.filter(m => m.status === "analysis");
    const total = category.shoes.length;
    const reviewed = total - pending.length;
    
    selectionCounter.textContent = `${reviewed} de ${total}`;
    selectionRemaining.textContent = `${pending.length} restantes`;
    selectionProgress.style.width = total === 0 ? "0%" : `${(reviewed / total) * 100}%`;
    
    if (pending.length === 0) {
        showToast("Todos os modelos analisados!");
        openCategory(currentCategoryName); 
        return;
    }
    if (currentSelectionIndex >= pending.length) currentSelectionIndex = 0;
    const model = pending[currentSelectionIndex];
    
    selectionContainer.innerHTML = `
        <div id="selectionCard" class="selection-card">
            <img src="${model.image}" alt="${escapeHTML(model.name)}">
            <div class="selection-card-info">
                <h2>${escapeHTML(model.name)}</h2>
                <p>${model.colorMaterial ? escapeHTML(model.colorMaterial) : category.name}</p>
                ${model.observation ? `<p style="margin-top:8px; font-style:italic;">Obs: ${escapeHTML(model.observation)}</p>` : ''}
            </div>
        </div>
        <div class="selection-actions">
            <button id="cancelModel" class="selection-action cancel" type="button">×</button>
            <button id="approveModel" class="selection-action approve" type="button">✓</button>
        </div>
    `;
    document.getElementById("cancelModel").addEventListener("click", () => reviewModel(model, "cancelled"));
    document.getElementById("approveModel").addEventListener("click", () => reviewModel(model, "approved"));
}

function reviewModel(model, status) {
    const card = document.getElementById("selectionCard");
    card.style.opacity = "0";
    card.style.transform = status === "approved" ? "translateX(120%) rotate(8deg)" : "translateX(-120%) rotate(-8deg)";
    model.status = status;
    saveCollections();
    showToast(status === "approved" ? "Modelo aprovado" : "Modelo cancelado");
    setTimeout(() => renderSelection(), 350); 
}

/* =====================================================
   APROVADOS (ACORDEÃO)
===================================================== */
function renderApproved() {
    const approved = getAllModels().filter(item => item.model.status === "approved");
    renderApprovedFilters();
    const filtered = approved.filter(item => currentCategoryFilter === "all" ? true : item.category.name === currentCategoryFilter);
    
    if (filtered.length === 0) {
        approvedModelsContainer.innerHTML = `<div class="empty glass"><div class="empty-icon">✓</div><h3>Nenhum modelo aprovado</h3></div>`;
        return;
    }

    const grouped = {};
    filtered.forEach(item => {
        if (!grouped[item.collection.id]) grouped[item.collection.id] = { collection: item.collection, categories: {}, total: 0 };
        if (!grouped[item.collection.id].categories[item.category.name]) grouped[item.collection.id].categories[item.category.name] = [];
        grouped[item.collection.id].categories[item.category.name].push(item.model);
        grouped[item.collection.id].total++;
    });

    approvedModelsContainer.innerHTML = Object.values(grouped).map(group => `
        <div class="accordion-item glass">
            <div class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
                <div>
                    <h2>${escapeHTML(group.collection.name)}</h2>
                    <span class="count">${group.total} modelos aprovados</span>
                </div>
                <div class="accordion-arrow">▼</div>
            </div>
            <div class="accordion-body">
                <div class="accordion-content-inner">
                    ${Object.entries(group.categories).map(([category, models]) => `
                        <div class="approved-category-title">${escapeHTML(category)}</div>
                        <div class="approved-grid">
                            ${models.map(model => `
                                <article class="approved-card">
                                    <img src="${model.image}" alt="${escapeHTML(model.name)}">
                                    <div class="approved-card-info">
                                        <strong>${escapeHTML(model.name)}</strong>
                                        <span>${model.colorMaterial ? escapeHTML(model.colorMaterial) : "Sem descrição"}</span>
                                    </div>
                                </article>
                            `).join("")}
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `).join("");
}

function renderApprovedFilters() {
    const categories = ["all", ...new Set(getAllModels().filter(i => i.model.status === "approved").map(i => i.category.name))];
    approvedCategoryFilters.innerHTML = categories.map(cat => `
        <button class="category-filter-button ${currentCategoryFilter === cat ? "active" : ""}" data-approved-category="${encodeURIComponent(cat)}" type="button">
            ${cat === "all" ? "Todas" : escapeHTML(cat)}
        </button>
    `).join("");
    document.querySelectorAll("[data-approved-category]").forEach(btn => btn.addEventListener("click", () => {
        currentCategoryFilter = decodeURIComponent(btn.dataset.approvedCategory);
        renderApproved();
    }));
}

/* =====================================================
   ADMIN - COLEÇÕES
===================================================== */
function renderAdminCollections() {
    adminCollections.innerHTML = collections.slice().reverse().map(collection => `
        <article class="admin-collection glass">
            <div class="admin-collection-header">
                <h3>${escapeHTML(collection.name)}</h3>
                <span>${collection.categories.length} categorias</span>
            </div>
            <div class="admin-collection-categories">
                ${collection.categories.map(cat => `<span class="admin-tag">${escapeHTML(cat.name)}</span>`).join("")}
            </div>
            <div class="admin-collection-actions">
                <button class="admin-small-button" data-admin-open="${collection.id}" type="button">Abrir</button>
                <button class="admin-small-button danger" data-admin-delete="${collection.id}" type="button">Excluir</button>
            </div>
        </article>
    `).join("");
    document.querySelectorAll("[data-admin-open]").forEach(btn => btn.addEventListener("click", () => openCollection(String(btn.dataset.adminOpen))));
    document.querySelectorAll("[data-admin-delete]").forEach(btn => btn.addEventListener("click", () => {
        collectionToDelete = String(btn.dataset.adminDelete);
        deleteModal.classList.add("active");
    }));
}

function renderCategoryOptions() {
    categoriesContainer.innerHTML = categoriesAvailable.map((cat, i) => `
        <div class="category-option">
            <input id="cat_${i}" type="checkbox" value="${cat}">
            <label for="cat_${i}">${cat}</label>
        </div>
    `).join("");
    document.querySelectorAll(".category-option input").forEach(inp => inp.addEventListener("change", updateSelectedCount));
}
function updateSelectedCount() { selectedCount.textContent = `${document.querySelectorAll(".category-option input:checked").length} selecionadas`; }

openCollectionModal.addEventListener("click", () => {
    collectionName.value = "";
    document.querySelectorAll(".category-option input").forEach(i => i.checked = false);
    updateSelectedCount();
    collectionModal.classList.add("active");
});
closeCollectionModal.addEventListener("click", () => collectionModal.classList.remove("active"));

createCollectionButton.addEventListener("click", () => {
    const name = collectionName.value.trim();
    const selected = Array.from(document.querySelectorAll(".category-option input:checked")).map(i => i.value);
    if (!name) return showToast("Digite o nome");
    if (selected.length === 0) return showToast("Selecione uma categoria");
    
    const newCollection = { id: String(Date.now()), name: name, categories: selected.map(cat => ({ name: cat, locked: false, shoes: [] })), createdAt: new Date().toISOString() };
    collections.push(newCollection);
    saveCollections(); 
    
    renderAdminCollections(); 
    renderClientHome();
    
    collectionModal.classList.remove("active"); 
    showToast("Coleção criada!");
    openCollection(newCollection.id); 
});

/* =====================================================
   ADMIN - ADD / EDITAR / EXCLUIR MODELOS
===================================================== */
function openAdminCategory(categoryName) {
    isGlobalAdd = false;
    currentCategoryName = categoryName;
    editingModelId = null; 
    categoryImageInput.value = "";
    categoryImageInput.click();
}

window.openGlobalAdminAdd = function() {
    isGlobalAdd = true;
    currentCategoryName = null;
    editingModelId = null;
    categoryImageInput.value = "";
    categoryImageInput.click();
}

categoryImageInput.addEventListener("change", e => {
    pendingFiles = Array.from(e.target.files);
    if (pendingFiles.length === 0) return;
    currentFileIndex = 0; editingModelId = null;
    document.getElementById('modelModalTitle').textContent = "Adicionar modelo";
    
    if (!isGlobalAdd) {
        const category = getCategory(getCollection(currentCollectionId), currentCategoryName);
        modelModalCategory.textContent = category.name;
    } else {
        modelModalCategory.textContent = "INCLUSÃO GLOBAL";
    }
    
    renderSingleModelForm();
    document.getElementById('modelModal').classList.add("active");
});

window.editModel = function(modelId, isFromGlobalList = false) {
    const target = getAllModels().find(m => String(m.model.id) === String(modelId));
    if (!target) return;
    editingModelId = String(modelId);
    currentCollectionId = target.collection.id;
    currentCategoryName = target.category.name;
    isGlobalAdd = isFromGlobalList;
    pendingFiles = []; 
    temporaryModelData[0] = { name: target.model.name, colorMaterial: target.model.colorMaterial, observation: target.model.observation, selectedCategory: target.category.name };
    
    document.getElementById('modelModalTitle').textContent = "Editar modelo";
    modelModalCategory.textContent = "Edição";
    
    renderSingleModelForm(target.model.image);
    document.getElementById('modelModal').classList.add("active");
};

// EXCLUSÃO INDIVIDUAL
window.deleteModel = function(modelId, isFromGlobalList = false) {
    modelToDeleteId = String(modelId);
    modelToDeleteIsGlobal = isFromGlobalList;
    deleteModelConfirmModal.classList.add('active');
};

document.getElementById('cancelDeleteModelBtn').addEventListener('click', () => {
    deleteModelConfirmModal.classList.remove('active');
    modelToDeleteId = null;
});

document.getElementById('confirmDeleteModelBtn').addEventListener('click', () => {
    if (!modelToDeleteId) return;
    const target = getAllModels().find(m => String(m.model.id) === String(modelToDeleteId));
    if(!target) return;
    
    const collection = target.collection;
    const category = target.category;
    category.shoes = category.shoes.filter(m => String(m.id) !== String(modelToDeleteId));
    
    saveCollections();
    showToast("Modelo excluído!");
    
    deleteModelConfirmModal.classList.remove('active');
    
    if (modelToDeleteIsGlobal) { 
        renderCollectionSummary(collection); 
        renderCollectionModelsList(); 
    } else { 
        openCategory(category.name); 
    }
    modelToDeleteId = null;
});

function renderSingleModelForm(existingImage = null) {
    let url = existingImage;
    if (!url) {
        const file = pendingFiles[currentFileIndex];
        if (!file) return;
        url = URL.createObjectURL(file);
    }
    
    modelStep.textContent = `${currentFileIndex + 1} / ${pendingFiles.length || 1}`;
    previousModelButton.disabled = currentFileIndex === 0;
    nextModelButton.disabled = currentFileIndex === (pendingFiles.length - 1 < 0 ? 0 : pendingFiles.length - 1);
    
    if(editingModelId) {
        document.getElementById('singleModelNav').style.display = 'none';
    } else {
        document.getElementById('singleModelNav').style.display = 'flex';
    }

    const collection = getCollection(currentCollectionId);
    
    let categorySelectHTML = `
        <div style="margin-bottom: 5px;">
            <label>Categoria do modelo</label>
            <select id="singleModelCategory" class="styled-input">
                ${collection.categories.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('')}
            </select>
        </div>
    `;

    singleModelForm.innerHTML = `
        <div class="single-model-layout">
            <div class="single-image-container">
                <img class="single-image" src="${url}" style="margin:0; height: 100%; width: 100%;">
            </div>
            <div class="single-model-info" style="justify-content: flex-start;">
                <div><label>Nome do modelo</label><input id="singleModelName" type="text" value="${pendingFiles.length ? escapeHTML(cleanFileName(pendingFiles[currentFileIndex].name)) : ''}"></div>
                ${categorySelectHTML}
                <div><label>Cor / Material</label><input id="singleModelColor" type="text" placeholder="Ex.: Cacau / Couro"></div>
                <div style="flex:1; display:flex; flex-direction:column;"><label>Observação</label><textarea id="singleModelObservation" placeholder="Observações..." style="flex:1;"></textarea></div>
            </div>
        </div>
    `;
    
    const data = temporaryModelData[currentFileIndex] || temporaryModelData[0];
    
    if(document.getElementById("singleModelCategory")) {
        const targetCat = (data && data.selectedCategory) ? data.selectedCategory : currentCategoryName;
        if(targetCat) document.getElementById("singleModelCategory").value = targetCat;
    }

    if (data) {
        document.getElementById("singleModelName").value = data.name || "";
        document.getElementById("singleModelColor").value = data.colorMaterial || "";
        document.getElementById("singleModelObservation").value = data.observation || "";
    }
}

function saveCurrentFormTemporary() {
    const n = document.getElementById("singleModelName");
    const c = document.getElementById("singleModelColor");
    const o = document.getElementById("singleModelObservation");
    const cat = document.getElementById("singleModelCategory");
    if (!n || !c || !o) return;
    
    temporaryModelData[editingModelId ? 0 : currentFileIndex] = { 
        name: n.value, colorMaterial: c.value, observation: o.value, selectedCategory: cat ? cat.value : currentCategoryName
    };
}

previousModelButton.addEventListener("click", () => { saveCurrentFormTemporary(); if (currentFileIndex > 0) { currentFileIndex--; renderSingleModelForm(); } });
nextModelButton.addEventListener("click", () => { saveCurrentFormTemporary(); if (currentFileIndex < pendingFiles.length - 1) { currentFileIndex++; renderSingleModelForm(); } });

saveCurrentModelButton.addEventListener("click", () => {
    saveCurrentFormTemporary();
    const collection = getCollection(currentCollectionId);

    if (editingModelId) {
        const data = temporaryModelData[0];
        const oldCategory = getCategory(collection, currentCategoryName);
        const targetModelIndex = oldCategory.shoes.findIndex(m => String(m.id) === String(editingModelId));
        const targetModel = oldCategory.shoes.splice(targetModelIndex, 1)[0]; 
        
        targetModel.name = data.name;
        targetModel.colorMaterial = data.colorMaterial;
        targetModel.observation = data.observation;
        
        const newCategory = getCategory(collection, data.selectedCategory || currentCategoryName);
        newCategory.shoes.push(targetModel); 
        
        saveCollections();
        showToast("Modelo atualizado");
        document.getElementById('modelModal').classList.remove("active");
        
        // Limpar dados temporários após edição
        Object.keys(temporaryModelData).forEach(k => delete temporaryModelData[k]);
        
        if (isGlobalAdd) { renderCollectionModelsList(); renderCollectionCategories(collection); } 
        else { openCategory(newCategory.name); }
        return;
    }

    const fileData = temporaryModelData[currentFileIndex];
    const targetCategoryName = fileData?.selectedCategory || currentCategoryName;
    
    let category = getCategory(collection, targetCategoryName);
    if (!category && collection.categories.length > 0) { category = collection.categories[0]; }
    if (!category) { showToast("Nenhuma categoria válida."); return; }

    const file = pendingFiles[currentFileIndex];
    const reader = new FileReader();
    
    reader.onload = e => {
        category.shoes.push({
            id: String(Date.now() + Math.random()), // Garantindo ID como String
            name: fileData?.name || cleanFileName(file.name),
            image: e.target.result,
            colorMaterial: fileData?.colorMaterial || "",
            observation: fileData?.observation || "",
            status: "analysis"
        });
        
        category.locked = false;
        saveCollections(); 
        showToast("Modelo salvo em " + category.name);
        
        pendingFiles.splice(currentFileIndex, 1);
        const newTemp = {};
        let newIndex = 0;
        Object.keys(temporaryModelData).forEach(key => {
            if (Number(key) !== currentFileIndex) {
                newTemp[newIndex] = temporaryModelData[key];
                newIndex++;
            }
        });
        Object.keys(temporaryModelData).forEach(k => delete temporaryModelData[k]);
        Object.assign(temporaryModelData, newTemp);
        
        if (pendingFiles.length === 0) {
            document.getElementById('modelModal').classList.remove("active");
            categoryImageInput.value = ""; 
            if (isGlobalAdd) { renderCollectionSummary(collection); renderCollectionCategories(collection); renderCollectionModelsList(); } 
            else { openCategory(category.name); } 
            return;
        }
        if (currentFileIndex >= pendingFiles.length) currentFileIndex = 0;
        renderSingleModelForm();
    };
    reader.readAsDataURL(file);
});

// Limpar memória do input e dados ao fechar modal 
document.getElementById("closeModelModal").addEventListener("click", () => { 
    document.getElementById('modelModal').classList.remove("active"); 
    pendingFiles = []; 
    currentFileIndex = 0; 
    editingModelId = null; 
    categoryImageInput.value = ""; 
    Object.keys(temporaryModelData).forEach(k => delete temporaryModelData[k]);
});

/* EXCLUSÃO (COLEÇÃO) */
cancelDelete.addEventListener("click", () => { deleteModal.classList.remove("active"); collectionToDelete = null; });
confirmDelete.addEventListener("click", () => {
    if (collectionToDelete === null) return;
    collections = collections.filter(c => String(c.id) !== String(collectionToDelete));
    saveCollections();
    collectionToDelete = null; deleteModal.classList.remove("active");
    renderAdminCollections(); renderClientHome();
    showPage(currentUser.role === "admin" ? adminPage : homePage);
    showToast("Coleção excluída");
});

/* NAVEGAÇÃO E INICIALIZAÇÃO */
backToHome.addEventListener("click", () => {
    showPage(currentUser.role === "admin" ? adminPage : homePage);
    if (currentUser.role === "admin") { renderAdminCollections(); activateNavigation("adminPage"); } 
    else { renderClientHome(); activateNavigation("homePage"); }
});
backToCollection.addEventListener("click", () => {
    const col = getCollection(currentCollectionId);
    renderCollectionSummary(col); renderCollectionCategories(col); renderCollectionModelsList(); showPage(collectionPage);
});
backToCategory.addEventListener("click", () => openCategory(currentCategoryName));
function showToast(msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 1700); }

// Boot App na Home Page garantindo que limpa estado
renderCategoryOptions();
if (currentUser) {
    currentCollectionId = null;
    currentCategoryName = null;
    showApp(); 
} else { 
    showLogin(); 
}
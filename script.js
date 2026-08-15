document.addEventListener('DOMContentLoaded', () => {
    // Effacer la localStorage et la réinitialiser
    console.log('Initialisation du script - nettoyage de la localStorage');
    localStorage.clear();
    
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitle = document.getElementById('page-title');
    const pages = document.querySelectorAll('.page-container');
    const appShell = document.getElementById('app-shell');
    const authPage = document.getElementById('auth-page');
    const loginButton = document.getElementById('login-button');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');
    const userProfile = document.getElementById('user-profile');
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const rememberLoginCheckbox = document.getElementById('remember-login');
    const accountCreateForm = document.getElementById('create-staff-account-form');
    const staffAccountManagement = document.getElementById('staff-account-management');
    const ownerOnlyNote = document.getElementById('owner-only-note');
    const staffAccountList = document.getElementById('staff-account-list');

    const STAFF_DB_KEY = 'panelstaff_staff_accounts';
    const CURRENT_USER_KEY = 'panelstaff_current_user';
    const REMEMBERED_EMAIL_KEY = 'panelstaff_remembered_email';

    const defaultStaffAccounts = [
        { id: 1, email: 'chppeur@gmail.com', password: '070108Vb@9972vB@', name: 'ch0ppeur', role: 'Fondateur', isActive: true },
        { id: 2, email: 'mod@panelstaff.fr', password: 'mod123', name: 'Alicia', role: 'Modération - Staff', isActive: true },
        { id: 3, email: 'support@panelstaff.fr', password: 'support123', name: 'Koba', role: 'Support - Helper', isActive: true }
    ];

    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);

    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    };

    const getStaffAccounts = () => {
        try {
            const stored = localStorage.getItem(STAFF_DB_KEY);
            
            // Toujours retourner les comptes par défaut pour debuguer
            if (!stored) {
                console.log('localStorage vide, création des comptes par défaut');
                localStorage.setItem(STAFF_DB_KEY, JSON.stringify(defaultStaffAccounts));
                return [...defaultStaffAccounts];
            }

            const parsed = JSON.parse(stored);
            console.log('Comptes chargés du localStorage:', parsed);
            
            if (!Array.isArray(parsed) || parsed.length === 0) {
                console.log('Données localStorage invalides, réinitialisation');
                localStorage.setItem(STAFF_DB_KEY, JSON.stringify(defaultStaffAccounts));
                return [...defaultStaffAccounts];
            }

            return parsed;
        } catch (error) {
            console.error('Erreur lors de la lecture du localStorage:', error);
            localStorage.setItem(STAFF_DB_KEY, JSON.stringify(defaultStaffAccounts));
            return [...defaultStaffAccounts];
        }
    };

    const saveStaffAccounts = (accounts) => {
        localStorage.setItem(STAFF_DB_KEY, JSON.stringify(accounts));
    };

    const isOwnerUser = (user) => {
        if (!user || !user.role) return false;
        return user.role.toLowerCase().includes('fondateur') || user.role.toLowerCase().includes('owner');
    };

    const setCurrentUser = (user) => {
        if (!user) {
            localStorage.removeItem(CURRENT_USER_KEY);
            return;
        }

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    };

    const getCurrentUser = () => {
        try {
            const current = localStorage.getItem(CURRENT_USER_KEY);
            return current ? JSON.parse(current) : null;
        } catch (error) {
            return null;
        }
    };

    const saveRememberedEmail = (email) => {
        if (!email) {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            return;
        }

        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    };

    const getRememberedEmail = () => {
        try {
            return localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';
        } catch (error) {
            return '';
        }
    };

    const applyUserProfile = (user) => {
        if (!userName || !userRole) return;

        userName.textContent = user?.name || 'Nexoa';
        userRole.textContent = user?.role || 'Fondateur';
    };

    const renderStaffAccounts = () => {
        if (!staffAccountList) return;

        const accounts = getStaffAccounts();
        const currentUser = getCurrentUser();
        const ownerMode = isOwnerUser(currentUser);

        if (!accounts.length) {
            staffAccountList.innerHTML = '<div class="empty-state"><p>Aucun compte staff.</p></div>';
            return;
        }

        staffAccountList.innerHTML = accounts.map((account) => {
            const canEdit = ownerMode && account.email !== currentUser?.email;
            const activeLabel = account.isActive === false ? 'Désactivé' : 'Actif';
            const roleBadge = account.role || 'Staff';

            return `
                <div class="account-row" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 12px;">
                    <div>
                        <strong>${account.name}</strong>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${account.email}</div>
                        <div style="margin-top: 6px; font-size: 11px; color: #a5b4fc;">${roleBadge}</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span class="badge ${account.isActive === false ? 'gray' : 'green'}">${activeLabel}</span>
                        ${canEdit ? `
                            <button class="btn-secondary" type="button" data-account-action="toggle" data-account-email="${account.email}">${account.isActive === false ? 'Activer' : 'Désactiver'}</button>
                            <button class="btn-secondary" type="button" data-account-action="delete" data-account-email="${account.email}" style="color: #fca5a5; border-color: rgba(252,165,165,0.5);">Supprimer</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        staffAccountList.querySelectorAll('[data-account-action]').forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-account-action');
                const email = button.getAttribute('data-account-email');
                const accounts = getStaffAccounts();

                if (action === 'delete') {
                    const filtered = accounts.filter((account) => account.email.toLowerCase() !== email.toLowerCase());
                    if (filtered.length === accounts.length) {
                        showToast('Compte introuvable.');
                        return;
                    }
                    saveStaffAccounts(filtered);
                    renderStaffAccounts();
                    showToast('Compte supprimé.');
                    return;
                }

                if (action === 'toggle') {
                    const updated = accounts.map((account) => {
                        if (account.email.toLowerCase() === email.toLowerCase()) {
                            return { ...account, isActive: !(account.isActive === false) };
                        }
                        return account;
                    });
                    saveStaffAccounts(updated);
                    renderStaffAccounts();
                    showToast('Statut du compte mis à jour.');
                }
            });
        });
    };

    const setLoggedInState = (isLoggedIn) => {
        const stored = isLoggedIn ? 'true' : 'false';
        localStorage.setItem('panelstaff-loggedin', stored);

        if (appShell) appShell.classList.toggle('hidden', !isLoggedIn);
        if (authPage) authPage.classList.toggle('hidden', isLoggedIn);

        if (loginButton) loginButton.classList.toggle('hidden', isLoggedIn);
        if (userProfile) userProfile.classList.toggle('hidden', !isLoggedIn);

        const currentUser = getCurrentUser();
        const canManage = isOwnerUser(currentUser);

        if (staffAccountManagement) {
            staffAccountManagement.classList.toggle('hidden', !isLoggedIn || !canManage);
        }

        if (ownerOnlyNote) {
            ownerOnlyNote.classList.toggle('hidden', !isLoggedIn || canManage);
        }

        renderStaffAccounts();
    };

    const authenticateUser = () => {
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();
        const rememberLogin = rememberLoginCheckbox ? rememberLoginCheckbox.checked : false;

        if (!email || !password) {
            showToast('Veuillez remplir tous les champs.');
            return;
        }

        const accounts = getStaffAccounts();
        console.log('Tentative de connexion avec:', email);
        console.log('Comptes disponibles:', accounts);
        
        const matchedUser = accounts.find((account) => {
            const emailMatch = account.email.toLowerCase() === email;
            const passwordMatch = String(account.password).trim() === password;
            const activeMatch = account.isActive !== false;
            console.log(`Email ${account.email}: match=${emailMatch}, Pass match=${passwordMatch}, Active=${activeMatch}`);
            return emailMatch && passwordMatch && activeMatch;
        });

        if (!matchedUser) {
            showToast('Identifiants invalides.');
            return;
        }

        const safeUser = {
            id: matchedUser.id,
            name: matchedUser.name,
            role: matchedUser.role,
            email: matchedUser.email
        };

        if (rememberLogin) {
            saveRememberedEmail(email);
        } else {
            saveRememberedEmail('');
        }

        setCurrentUser(safeUser);
        applyUserProfile(safeUser);
        setLoggedInState(true);
        showToast('Connexion réussie');
    };

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            authenticateUser();
        });
    }

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            if (authPage) authPage.classList.remove('hidden');
            if (appShell) appShell.classList.add('hidden');
            if (emailInput) emailInput.focus();
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            setCurrentUser(null);
            saveRememberedEmail('');
            setLoggedInState(false);
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (rememberLoginCheckbox) rememberLoginCheckbox.checked = false;
            showToast('Déconnexion réussie');
        });
    }

    if (accountCreateForm) {
        accountCreateForm.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const currentUser = getCurrentUser();
            if (!isOwnerUser(currentUser)) {
                showToast('Seul le Fondateur peut créer un compte staff.');
                return;
            }

            const name = document.getElementById('new-staff-name').value.trim();
            const role = document.getElementById('new-staff-role').value.trim();
            const email = document.getElementById('new-staff-email').value.trim().toLowerCase();
            const password = document.getElementById('new-staff-password').value.trim();

            if (!name || !role || !email || !password) {
                showToast('Veuillez remplir tous les champs.');
                return;
            }

            const accounts = getStaffAccounts();
            const alreadyExists = accounts.some((account) => account.email.toLowerCase() === email);

            if (alreadyExists) {
                showToast('Un compte avec cet e-mail existe déjà.');
                return;
            }

            const newAccount = {
                id: Date.now(),
                email,
                password,
                name,
                role,
                isActive: true
            };

            saveStaffAccounts([...accounts, newAccount]);
            accountCreateForm.reset();
            renderStaffAccounts();
            showToast('Compte staff créé avec succès.');
        });
    }

    const rememberedEmail = getRememberedEmail();
    if (emailInput && rememberedEmail) {
        emailInput.value = rememberedEmail;
        if (rememberLoginCheckbox) rememberLoginCheckbox.checked = true;
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
        applyUserProfile(currentUser);
        setLoggedInState(true);
    } else {
        setLoggedInState(false);
    }

    navItems.forEach((item) => {
        item.addEventListener('click', (event) => {
            event.preventDefault();

            navItems.forEach((nav) => nav.classList.toggle('active', nav === item));

            const title = item.querySelector('span')?.textContent?.trim() || 'Tableau de bord';
            pageTitle.textContent = title.toUpperCase();

            const pageId = item.getAttribute('data-page') || 'vue-ensemble';
            const targetPage = document.getElementById(`page-${pageId}`);

            pages.forEach((page) => {
                const isActive = page === targetPage;
                page.style.display = isActive ? 'flex' : 'none';
                page.classList.toggle('active', isActive);
            });

            if (targetPage) {
                showToast(`${title} ouvert`);
            }
        });
    });

    document.querySelectorAll('.tabs').forEach((tabList) => {
        const buttons = [...tabList.querySelectorAll('.tab-btn')];
        const parent = tabList.parentElement;
        const panes = [...parent.querySelectorAll('.tab-pane')];

        if (!buttons.length || !panes.length) return;

        buttons.forEach((button, index) => {
            button.addEventListener('click', () => {
                buttons.forEach((btn) => btn.classList.toggle('active', btn === button));
                panes.forEach((pane, paneIndex) => {
                    pane.classList.toggle('active', paneIndex === index);
                    pane.style.display = paneIndex === index ? 'block' : 'none';
                });
            });
        });
    });

    document.querySelectorAll('.time-toggle button').forEach((button) => {
        button.addEventListener('click', () => {
            const buttons = button.parentElement.querySelectorAll('button');
            buttons.forEach((btn) => btn.classList.toggle('active', btn === button));
            showToast(`Période : ${button.textContent.trim()}`);
        });
    });

    document.querySelectorAll('.search-input input').forEach((input) => {
        input.addEventListener('input', (event) => {
            const search = event.target.value.toLowerCase();
            const rows = document.querySelectorAll('.formations-table tbody tr:not(.section-row)');

            rows.forEach((row) => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(search) ? '' : 'none';
            });
        });
    });

    document.querySelectorAll('form').forEach((form) => {
        if (form.id === 'login-form' || form.id === 'create-staff-account-form') {
            return;
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const action = form.querySelector('button')?.textContent?.trim() || 'Formulaire';
            showToast(`${action} enregistré`);
        });
    });

    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-assistance').forEach((button) => {
        button.addEventListener('click', () => {
            const label = button.textContent.replace(/\s+/g, ' ').trim();
            if (!button.closest('form')) {
                showToast(label);
            }
        });
    });

    document.querySelectorAll('.switch input').forEach((input) => {
        input.addEventListener('change', () => {
            const label = input.closest('.module-toggle') ? 'Module whitelist' : 'Option mise à jour';
            showToast(`${label} : ${input.checked ? 'activé' : 'désactivé'}`);
        });
    });

    const initializeCharts = () => {
        Chart.defaults.font.family = "'Inter', sans-serif";

        const chartConfigs = {
            candidaturesChart: {
                type: 'line',
                data: {
                    labels: ['15 juil', '17 juil', '19 juil', '21 juil', '23 juil', '25 juil', '27 juil', '29 juil', '31 juil', '02 août', '04 août', '06 août', '08 août', '10 août', '12 août', '13 août'],
                    datasets: [
                        { label: 'Civil', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2.5, 1, 4, 0], borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, tension: 0.4, fill: true },
                        { label: 'LSPD', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0], borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 2, tension: 0.4, fill: true },
                        { label: 'EMS', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 2, tension: 0.4, fill: true }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6, font: { family: "'Inter', sans-serif", size: 11 } } } },
                    scales: {
                        y: { beginAtZero: true, max: 4, ticks: { stepSize: 1, font: { family: "'Inter', sans-serif", size: 10 } }, grid: { color: '#F3F4F6' }, border: { display: false } },
                        x: { ticks: { font: { family: "'Inter', sans-serif", size: 10 } }, grid: { display: false }, border: { display: false } }
                    },
                    interaction: { mode: 'index', intersect: false },
                    elements: { point: { radius: 0, hitRadius: 10, hoverRadius: 4 } }
                }
            },
            serverChart: {
                type: 'line',
                data: {
                    labels: ['00h', '02h', '04h', '06h', '08h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'],
                    datasets: [{
                        label: 'Joueurs connectés',
                        data: [5, 6, 7, 12, 18, 26, 35, 42, 30, 24, 16, 8],
                        borderColor: '#7C3AED',
                        backgroundColor: 'rgba(124, 58, 237, 0.12)',
                        borderWidth: 3,
                        tension: 0.35,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, suggestedMax: 50, grid: { color: '#F3F4F6' }, border: { display: false } },
                        x: { grid: { display: false }, border: { display: false } }
                    }
                }
            },
            sessionChart: {
                type: 'bar',
                data: {
                    labels: ['< 15 min', '15-30', '30-45', '45-60', '> 60 min'],
                    datasets: [{
                        label: 'Sessions',
                        data: [18, 24, 28, 17, 13],
                        backgroundColor: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1'],
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 10 }, grid: { color: '#F3F4F6' }, border: { display: false } },
                        x: { grid: { display: false }, border: { display: false } }
                    }
                }
            },
            statsChart: {
                type: 'line',
                data: {
                    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                    datasets: [{
                        label: 'Candidatures',
                        data: [10, 12, 15, 14, 18, 22, 21],
                        borderColor: '#7C3AED',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#F3F4F6' }, border: { display: false } },
                        x: { grid: { display: false }, border: { display: false } }
                    }
                }
            }
        };

        Object.entries(chartConfigs).forEach(([id, config]) => {
            const canvas = document.getElementById(id);
            if (canvas) {
                new Chart(canvas, config);
            }
        });
    };

    initializeCharts();
});

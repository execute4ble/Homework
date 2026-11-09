/* =========================================================================
   ОБЩАЯ ЛОГИКА ПРИЛОЖЕНИЯ «СИСТЕМА БРОНИРОВАНИЯ»
   Файл подключается на обеих страницах.
   Определяет общий storage (localStorage) и утилиты.
   ========================================================================= */

const STORAGE_KEY = 'booking_applications';

/* -------------------------------------------------------------------------
   Демонстрационные данные — используются при первом запуске,
   если в localStorage ещё ничего нет.
   ------------------------------------------------------------------------- */
const DEMO_APPLICATIONS = [
    {
        id: 1,
        room: 'Конференц-зал «Альфа»',
        date: '15.10.2025',
        payment: 'Очное посещение',
        status: 'Проведена',
        feedback: null
    },
    {
        id: 2,
        room: 'Аудитория 305',
        date: '22.10.2025',
        payment: 'СБП',
        status: 'На рассмотрении',
        feedback: null
    },
    {
        id: 3,
        room: 'Зал «Бета»',
        date: '01.11.2025',
        payment: 'Очное посещение',
        status: 'Отклонена',
        feedback: null
    }
];

/* -------------------------------------------------------------------------
   ХРАНИЛИЩЕ: чтение / запись в localStorage
   ------------------------------------------------------------------------- */
function loadApplications() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        // Первый запуск — сохраняем демо-данные
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_APPLICATIONS));
        return [...DEMO_APPLICATIONS];
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error('Ошибка чтения localStorage:', e);
        return [...DEMO_APPLICATIONS];
    }
}

function saveApplications(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* -------------------------------------------------------------------------
   УТИЛИТЫ
   ------------------------------------------------------------------------- */

function getNextId(list) {
    return list.length ? Math.max(...list.map(a => a.id)) + 1 : 1;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'Проведена':       return 'bg-success';
        case 'Одобрена':        return 'bg-primary';
        case 'На рассмотрении': return 'bg-warning text-dark';
        case 'Отклонена':       return 'bg-danger';
        default:                return 'bg-secondary';
    }
}

function showAlert(elementId, text, type = 'success') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = text;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 4000);
}

/* =========================================================================
   ЛОГИКА СТРАНИЦЫ «ЛИЧНЫЙ КАБИНЕТ» (cabinet.html)
   ========================================================================= */
if (document.getElementById('applicationsTableBody')) {
    initCabinetPage();
}

function initCabinetPage() {
    let applications = loadApplications();
    let currentFilter = 'all';
    let currentSearch = '';

    const tbody = document.getElementById('applicationsTableBody');
    const emptyMessage = document.getElementById('emptyMessage');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('#statusFilter button');

    const feedbackModalEl = document.getElementById('feedbackModal');
    const feedbackModal = new bootstrap.Modal(feedbackModalEl);
    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackAppId = document.getElementById('feedbackAppId');
    const feedbackAppInfo = document.getElementById('feedbackAppInfo');
    const ratingError = document.getElementById('ratingError');

    function renderTable() {
        const filtered = applications.filter(app => {
            const matchStatus = currentFilter === 'all' || app.status === currentFilter;
            const matchSearch = app.room.toLowerCase().includes(currentSearch.toLowerCase());
            return matchStatus && matchSearch;
        });

        tbody.innerHTML = '';

        if (filtered.length === 0) {
            emptyMessage.classList.remove('d-none');
            return;
        }
        emptyMessage.classList.add('d-none');

        filtered.forEach((app, index) => {
            const tr = document.createElement('tr');

            let actionHtml = '<span class="text-muted small">—</span>';
            if (app.status === 'Проведена') {
                if (app.feedback) {
                    actionHtml = `<span class="badge bg-info text-dark">Отзыв: ${app.feedback.rating}⭐</span>`;
                } else {
                    actionHtml = `<button class="btn btn-sm btn-outline-primary"
                                          data-action="feedback"
                                          data-id="${app.id}">
                                      Оставить отзыв
                                  </button>`;
                }
            }

            tr.innerHTML = `
                <td data-label="№">${index + 1}</td>
                <td data-label="Помещение">${app.room}</td>
                <td data-label="Дата">${app.date}</td>
                <td data-label="Оплата">${app.payment}</td>
                <td data-label="Статус">
                    <span class="badge ${getStatusBadgeClass(app.status)}">${app.status}</span>
                </td>
                <td data-label="Действия" class="text-end">${actionHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action="feedback"]');
        if (!btn) return;

        const id = Number(btn.dataset.id);
        const app = applications.find(a => a.id === id);
        if (!app) return;

        feedbackAppId.value = app.id;
        feedbackAppInfo.textContent = `${app.room} (${app.date})`;

        feedbackForm.reset();
        feedbackForm.classList.remove('was-validated');
        ratingError.textContent = '';

        feedbackModal.show();
    });

    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const selectedRating = feedbackForm.querySelector('input[name="rating"]:checked');
        const commentField = document.getElementById('feedbackComment');

        let valid = true;

        if (!selectedRating) {
            ratingError.textContent = 'Пожалуйста, выберите оценку.';
            valid = false;
        } else {
            ratingError.textContent = '';
        }

        if (commentField.value.trim().length < 5) {
            commentField.classList.add('is-invalid');
            valid = false;
        } else {
            commentField.classList.remove('is-invalid');
        }

        if (!valid) {
            feedbackForm.classList.add('was-validated');
            return;
        }

        const id = Number(feedbackAppId.value);
        const app = applications.find(a => a.id === id);
        if (app) {
            app.feedback = {
                rating: Number(selectedRating.value),
                comment: commentField.value.trim(),
                date: new Date().toLocaleDateString('ru-RU')
            };
            saveApplications(applications);
            renderTable();
        }

        feedbackModal.hide();
        showAlert('alertSuccess', '✅ Спасибо! Ваш отзыв сохранён.', 'success');
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            renderTable();
        });
    });

    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderTable();
    });

    // Первый рендер
    renderTable();
}

/* =========================================================================
   ЛОГИКА СТРАНИЦЫ «ФОРМИРОВАНИЕ ЗАЯВКИ» (create-application.html)
   ========================================================================= */
if (document.getElementById('applicationForm')) {
    initCreatePage();
}

function initCreatePage() {
    const form = document.getElementById('applicationForm');
    const roomInput = document.getElementById('room');
    const dateInput = document.getElementById('date');
    const paymentError = document.getElementById('paymentError');

    roomInput.addEventListener('input', () => {
        if (roomInput.value.trim().length >= 3) {
            roomInput.classList.remove('is-invalid');
            roomInput.classList.add('is-valid');
        } else if (roomInput.value.length > 0) {
            roomInput.classList.remove('is-valid');
            roomInput.classList.add('is-invalid');
        } else {
            roomInput.classList.remove('is-valid', 'is-invalid');
        }
    });

    dateInput.addEventListener('input', () => {
        if (dateInput.checkValidity() && dateInput.value) {
            dateInput.classList.remove('is-invalid');
            dateInput.classList.add('is-valid');
        } else if (dateInput.value) {
            dateInput.classList.remove('is-valid');
            dateInput.classList.add('is-invalid');
        } else {
            dateInput.classList.remove('is-valid', 'is-invalid');
        }
    });

    form.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', () => {
            paymentError.textContent = '';
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        let valid = true;

        const selectedPayment = form.querySelector('input[name="payment"]:checked');
        if (!selectedPayment) {
            paymentError.textContent = 'Выберите способ оплаты.';
            valid = false;
        } else {
            paymentError.textContent = '';
        }

        if (!form.checkValidity()) {
            valid = false;
        }

        form.classList.add('was-validated');

        if (!valid) return;

        const applications = loadApplications();
        const newApp = {
            id: getNextId(applications),
            room: roomInput.value.trim(),
            date: dateInput.value,
            payment: selectedPayment.value,
            status: 'На рассмотрении',
            feedback: null
        };
        applications.push(newApp);
        saveApplications(applications);

        showAlert('alertSuccess', '✅ Заявка успешно отправлена администратору!', 'success');

        form.reset();
        form.classList.remove('was-validated');
        form.querySelectorAll('.is-valid, .is-invalid')
            .forEach(el => el.classList.remove('is-valid', 'is-invalid'));

        setTimeout(() => {
            window.location.href = 'cabinet.html';
        }, 1500);
    });
}
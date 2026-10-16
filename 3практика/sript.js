/* =========================================================================
   ПАНЕЛЬ АДМИНИСТРАТОРА — вся логика приложения
   -------------------------------------------------------------------------
   Возможности:
   - загрузка / сохранение заявок в localStorage;
   - рендер таблицы с учётом фильтра, поиска, сортировки, пагинации;
   - смена статуса через <select> в строке + подтверждение через модалку;
   - toast-уведомления об успехе;
   - счётчики по статусам в виде бейджей;
   - экспорт заявок в CSV;
   - подсветка обновлённой строки.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. КОНСТАНТЫ И МОДЕЛЬ ДАННЫХ
   ------------------------------------------------------------------------- */

const STORAGE_KEY = 'admin_applications';
const PAGE_SIZE = 10; // кол-во заявок на странице (пагинация)

// Демонстрационные данные (по ТЗ)
const DEMO_APPLICATIONS = [
    {
        id: 1,
        user: 'Иванов Иван Иванович',
        room: 'Конференц-зал «Альфа»',
        date: '15.10.2025',
        payment: 'Очное посещение',
        status: 'Новая'
    },
    {
        id: 2,
        user: 'Петрова Анна Сергеевна',
        room: 'Аудитория 305',
        date: '22.10.2025',
        payment: 'СБП',
        status: 'Мероприятие назначено'
    },
    {
        id: 3,
        user: 'Сидоров Пётр Алексеевич',
        room: 'Зал «Бета»',
        date: '01.11.2025',
        payment: 'Очное посещение',
        status: 'Завершено'
    }
];

/* -------------------------------------------------------------------------
   2. РАБОТА С ХРАНИЛИЩЕМ
   ------------------------------------------------------------------------- */

function loadApplications() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
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

/* Сброс к демо-данным (для удобства проверки) */
function resetDemoData() {
    if (!confirm('Сбросить все заявки к демонстрационным данным?')) return;
    localStorage.removeItem(STORAGE_KEY);
    applications = loadApplications();
    currentPage = 1;
    renderAll();
    showToast('Данные сброшены к демонстрационным', 'info');
}

/* -------------------------------------------------------------------------
   3. СОСТОЯНИЕ ПРИЛОЖЕНИЯ
   ------------------------------------------------------------------------- */

let applications = loadApplications(); // основной массив
let currentFilter = 'all';             // фильтр по статусу
let currentSearch = '';                // поисковая строка
let sortField = 'id';                  // поле сортировки
let sortDirection = 'asc';             // направление
let currentPage = 1;                   // текущая страница пагинации

/* -------------------------------------------------------------------------
   4. УТИЛИТЫ
   ------------------------------------------------------------------------- */

// Класс бейджа по статусу (согласно ТЗ)
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Новая':                 return 'bg-primary';
        case 'Мероприятие назначено': return 'bg-warning text-dark';
        case 'Завершено':             return 'bg-success';
        default:                      return 'bg-secondary';
    }
}

// Список допустимых статусов
const STATUSES = ['Новая', 'Мероприятие назначено', 'Завершено'];

// Склонение слова "заявка"
function pluralApplications(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'заявка';
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'заявки';
    return 'заявок';
}

/* -------------------------------------------------------------------------
   5. TOAST-УВЕДОМЛЕНИЯ
   ------------------------------------------------------------------------- */

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');

    const bgClass = {
        success: 'text-bg-success',
        warning: 'text-bg-warning',
        danger:  'text-bg-danger',
        info:    'text-bg-primary'
    }[type] || 'text-bg-secondary';

    const icon = {
        success: '✅',
        warning: '⚠️',
        danger:  '❌',
        info:    'ℹ️'
    }[type] || '';

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center ${bgClass} border-0`;
    toastEl.role = 'alert';
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${icon} ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();

    // Удаление после скрытия
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/* -------------------------------------------------------------------------
   6. ФИЛЬТРАЦИЯ, ПОИСК, СОРТИРОВКА
   ------------------------------------------------------------------------- */

function getFilteredApplications() {
    let list = [...applications];

    // Фильтр по статусу
    if (currentFilter !== 'all') {
        list = list.filter(a => a.status === currentFilter);
    }

    // Поиск по user + room
    if (currentSearch.trim()) {
        const q = currentSearch.trim().toLowerCase();
        list = list.filter(a =>
            a.user.toLowerCase().includes(q) ||
            a.room.toLowerCase().includes(q)
        );
    }

    // Сортировка
    list.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        // Для даты в формате ДД.ММ.ГГГГ — преобразуем в Date
        if (sortField === 'date') {
            const parse = (s) => {
                const [d, m, y] = s.split('.');
                return new Date(`${y}-${m}-${d}`);
            };
            valA = parse(valA);
            valB = parse(valB);
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return list;
}

/* -------------------------------------------------------------------------
   7. ПАГИНАЦИЯ
   ------------------------------------------------------------------------- */

function getPaginatedApplications(list) {
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
}

function renderPagination(totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const controls = document.getElementById('paginationControls');
    const info = document.getElementById('paginationInfo');

    controls.innerHTML = '';

    if (totalItems === 0) {
        info.textContent = '';
        return;
    }

    info.textContent = `Стр. ${currentPage} из ${totalPages} · всего ${totalItems} ${pluralApplications(totalItems)}`;

    // Кнопка «Назад»
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">‹</a>`;
    prevLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            renderAll();
        }
    });
    controls.appendChild(prevLi);

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderAll();
        });
        controls.appendChild(li);
    }

    // Кнопка «Вперёд»
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">›</a>`;
    nextLi.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            renderAll();
        }
    });
    controls.appendChild(nextLi);
}

/* -------------------------------------------------------------------------
   8. СЧЁТЧИКИ СТАТУСОВ
   ------------------------------------------------------------------------- */

function renderCounters() {
    const counts = {
        all: applications.length,
        'Новая': 0,
        'Мероприятие назначено': 0,
        'Завершено': 0
    };

    applications.forEach(a => {
        if (counts[a.status] !== undefined) counts[a.status]++;
    });

    document.getElementById('counterAll').textContent      = counts.all;
    document.getElementById('counterNew').textContent      = counts['Новая'];
    document.getElementById('counterAssigned').textContent = counts['Мероприятие назначено'];
    document.getElementById('counterDone').textContent     = counts['Завершено'];
}

/* -------------------------------------------------------------------------
   9. РЕНДЕР ТАБЛИЦЫ
   ------------------------------------------------------------------------- */

function renderTable() {
    const tbody = document.getElementById('applicationsBody');
    const emptyMessage = document.getElementById('emptyMessage');

    // 1. Фильтр + поиск + сортировка
    const filtered = getFilteredApplications();
    const totalItems = filtered.length;

    // 2. Проверка на пустой результат
    if (totalItems === 0) {
        tbody.innerHTML = '';
        emptyMessage.classList.remove('d-none');
        renderPagination(0);
        return;
    }
    emptyMessage.classList.add('d-none');

    // 3. Коррекция текущей страницы (если после смены фильтра она вне диапазона)
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    // 4. Пагинация
    const pageItems = getPaginatedApplications(filtered);

    // 5. Отрисовка строк
    tbody.innerHTML = '';
    pageItems.forEach((app, index) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index + 1;
        const badgeClass = getStatusBadgeClass(app.status);

        // Формируем <option> для select
        const optionsHtml = STATUSES
            .map(s => `<option value="${s}" ${app.status === s ? 'selected' : ''}>${s}</option>`)
            .join('');

        const tr = document.createElement('tr');
        tr.dataset.id = app.id;
        tr.innerHTML = `
            <td>${globalIndex}</td>
            <td>${escapeHtml(app.user)}</td>
            <td>${escapeHtml(app.room)}</td>
            <td>${app.date}</td>
            <td>${escapeHtml(app.payment)}</td>
            <td>
                <span class="badge ${badgeClass}" data-role="status-badge">
                    ${app.status}
                </span>
            </td>
            <td>
                <select class="form-select form-select-sm status-select" data-id="${app.id}">
                    ${optionsHtml}
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // 6. Пагинация
    renderPagination(totalItems);

    // 7. Информация о найденном
    document.getElementById('resultsInfo').textContent =
        totalItems === applications.length
            ? `Всего: ${totalItems}`
            : `Найдено: ${totalItems} из ${applications.length}`;
}

/* Простая защита от XSS при вставке текста */
function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

/* -------------------------------------------------------------------------
   10. ПОЛНЫЙ РЕНДЕР (таблица + счётчики)
   ------------------------------------------------------------------------- */

function renderAll() {
    renderCounters();
    renderTable();
}

/* -------------------------------------------------------------------------
   11. СМЕНА СТАТУСА ЗАЯВКИ (с подтверждением через модалку)
   ------------------------------------------------------------------------- */

// Ссылки на элементы модалки
const confirmModalEl = document.getElementById('confirmModal');
const confirmModal = new bootstrap.Modal(confirmModalEl);
const confirmModalText = document.getElementById('confirmModalText');
const confirmModalBtn = document.getElementById('confirmModalBtn');

// Временное хранилище для действия, ожидающего подтверждения
let pendingAction = null;

/**
 * Открывает модалку подтверждения и выполняет callback при подтверждении.
 */
function askConfirm(text, onConfirm) {
    confirmModalText.textContent = text;
    pendingAction = onConfirm;

    // Убираем предыдущий обработчик, чтобы не было накопления
    const newBtn = confirmModalBtn.cloneNode(true);
    confirmModalBtn.parentNode.replaceChild(newBtn, confirmModalBtn);

    newBtn.addEventListener('click', () => {
        if (typeof pendingAction === 'function') pendingAction();
        pendingAction = null;
        confirmModal.hide();
    });

    confirmModal.show();
}

/**
 * Меняет статус заявки по её id.
 * @param {number} id
 * @param {string} newStatus
 */
function changeStatus(id, newStatus) {
    const app = applications.find(a => a.id === id);
    if (!app || app.status === newStatus) return;

    const oldStatus = app.status;
    app.status = newStatus;
    saveApplications(applications);

    renderAll();
    highlightRow(id);
    showToast(
        `Статус заявки №${id} изменён: «${oldStatus}» → «${newStatus}»`,
        'success'
    );
}

/**
 * Подсвечивает строку таблицы после изменения.
 */
function highlightRow(id) {
    const tr = document.querySelector(`#applicationsBody tr[data-id="${id}"]`);
    if (!tr) return;
    tr.classList.add('row-flash');
    setTimeout(() => tr.classList.remove('row-flash'), 1300);
}

/* -------------------------------------------------------------------------
   12. ЭКСПОРТ В CSV
   ------------------------------------------------------------------------- */

function exportToCsv() {
    // Собираем ВСЕ заявки с учётом текущего фильтра и поиска
    const list = getFilteredApplications();

    if (list.length === 0) {
        showToast('Нет данных для экспорта', 'warning');
        return;
    }

    // Заголовки
    const headers = ['№', 'Пользователь', 'Помещение', 'Дата начала', 'Способ оплаты', 'Статус'];

    // Экранирование ячейки CSV
    const esc = (value) => `"${String(value).replaceAll('"', '""')}"`;

    const rows = list.map((a, i) => [
        i + 1,
        a.user,
        a.room,
        a.date,
        a.payment,
        a.status
    ].map(esc).join(';'));

    const csv = '\uFEFF' + [headers.map(esc).join(';'), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Экспортировано ${list.length} ${pluralApplications(list.length)} в CSV`, 'info');
}

/* -------------------------------------------------------------------------
   13. ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ СОБЫТИЙ
   ------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    renderAll();

    /* -------- Фильтр по статусу (табы-пилюли) -------- */
    document.querySelectorAll('#statusFilter button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#statusFilter .nav-link')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            currentPage = 1; // сброс страницы
            renderTable();
        });
    });

    /* -------- Поиск -------- */
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        renderTable();
    });

    /* -------- Смена статуса через select (делегирование) -------- */
    document.getElementById('applicationsBody').addEventListener('change', (e) => {
        const select = e.target.closest('.status-select');
        if (!select) return;

        const id = Number(select.dataset.id);
        const newStatus = select.value;

        // Возвращаем select к исходному значению — оно обновится после подтверждения
        const app = applications.find(a => a.id === id);
        const oldStatus = app ? app.status : '';

        // Если пользователь выбрал то же значение — ничего не делаем
        if (oldStatus === newStatus) return;

        // Спрашиваем подтверждение через модалку
        askConfirm(
            `Изменить статус заявки №${id} с «${oldStatus}» на «${newStatus}»?`,
            () => {
                changeStatus(id, newStatus);
            }
        );

        // Откатываем select назад — окончательно обновится после рендера
        if (app) select.value = oldStatus;
    });

    /* -------- Сортировка по клику на заголовок -------- */
    document.querySelectorAll('.applications-table thead th[data-sort]').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (sortField === field) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = field;
                sortDirection = 'asc';
            }
            // Визуальный индикатор
            document.querySelectorAll('.applications-table thead th[data-sort]')
                .forEach(el => el.textContent = el.textContent.replace(/ [▲▼]$/, ''));
            th.textContent += sortDirection === 'asc' ? ' ▲' : ' ▼';
            renderTable();
        });
    });

    /* -------- Экспорт в CSV -------- */
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCsv);

    /* -------- Публичный доступ для кнопки в навбаре -------- */
    window.resetDemoData = resetDemoData;
});
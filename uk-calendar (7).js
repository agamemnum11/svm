(function () {
    'use strict';

    if (window.uk_calendar_plugin) return;
    window.uk_calendar_plugin = true;

    const HOLIDAYS = {
        '01-01': 'Новий рік',
        '01-06': 'Богоявлення (Водохреща)',
        '01-22': 'День Соборності України',
        '01-27': 'День пам’яті жертв Голокосту',
        '01-29': 'День пам’яті Героїв Крут',
        '02-02': 'Стрітення Господнє',
        '02-20': 'День Героїв Небесної Сотні',
        '03-08': 'Міжнародний жіночий день',
        '03-21': 'Міжнародний день лісів / боротьби з расизмом',
        '03-25': 'Благовіщення Пресвятої Богородиці',
        '04-26': 'День Чорнобильської трагедії',
        '05-01': 'День праці',
        '05-08': 'День пам’яті та перемоги над нацизмом',
        '05-09': 'День Європи',
        '06-05': 'Всесвітній день охорони довкілля',
        '06-22': 'День скорботи і вшанування пам’яті жертв війни',
        '06-24': 'Різдво Іоанна Хрестителя',
        '06-28': 'День Конституції України',
        '06-29': 'свв. апостолів Петра і Павла',
        '07-15': 'День Української Державності',
        '07-20': 'Пророка Іллі',
        '08-06': 'Преображення Господнє',
        '08-15': 'Успіння Пресвятої Богородиці',
        '08-24': 'День Незалежності України',
        '08-29': 'Усічення голови Іоанна Предтечі',
        '09-08': 'Різдво Пресвятої Богородиці',
        '09-14': 'Воздвиження Хреста Господнього',
        '09-21': 'Міжнародний день миру (ООН)',
        '09-22': 'День партизанської слави',
        '10-01': 'День Покрови і козацтва',
        '10-14': 'День захисників і захисниць України',
        '11-08': 'Собор Архистратига Михаїла',
        '11-20': 'Всесвітній день дитини',
        '11-21': 'Введення в храм Пресвятої Богородиці',
        '11-25': 'День пам’яті жертв голодоморів',
        '12-01': 'Всесвітній день боротьби зі СНІДом',
        '12-06': 'св. Миколая Чудотворця',
        '12-10': 'Міжнародний день прав людини',
        '12-25': 'Різдво',
        '12-26': 'Собор Пресвятої Богородиці',
        '12-31': 'св. Меланії (Щедрий вечір)'
    };

    const MONTHS_UA = [
        '', 'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
        'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
    ];

    function pad(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function getTodayKey() {
        const d = new Date();
        return pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function startOfDay(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    function getNextHoliday() {
        const now = new Date();
        const year = now.getFullYear();
        const today = startOfDay(now);
        const candidates = [];

        for (let key in HOLIDAYS) {
            const [m, d] = key.split('-').map(Number);
            const date = new Date(year, m - 1, d);
            if (date >= today) {
                candidates.push({ key, date, name: HOLIDAYS[key] });
            }
        }

        for (let key in HOLIDAYS) {
            const [m, d] = key.split('-').map(Number);
            const date = new Date(year + 1, m - 1, d);
            candidates.push({ key, date, name: HOLIDAYS[key] });
        }

        candidates.sort((a, b) => a.date - b.date);
        return candidates[0] || null;
    }

    function formatShortDate(key) {
        const [m, d] = key.split('-').map(Number);
        return d + ' ' + MONTHS_UA[m];
    }

    function updateDisplay(el) {
        const todayKey = getTodayKey();
        const todayName = HOLIDAYS[todayKey];

        // Сьогодні свято — тільки назва, золотим
        if (todayName) {
            el.text(todayName);
            el.attr('title', todayName);
            el.css('color', '#ffd700');
            return;
        }

        const next = getNextHoliday();
        if (!next) {
            el.text('');
            el.attr('title', '');
            el.css('color', '');
            return;
        }

        const daysLeft = Math.round((next.date - startOfDay(new Date())) / (1000 * 60 * 60 * 24));

        // Крапки = кількість днів до свята (макс 20, щоб не роздувало шапку)
        const dotsCount = Math.min(Math.max(daysLeft, 0), 20);
        const dots = dotsCount > 0 ? '.'.repeat(dotsCount) : '';
        const text = dots + (dots ? ' ' : '') + formatShortDate(next.key);

        el.text(text);
        el.attr('title', next.name + ' через ' + daysLeft + ' дн.');
        el.css('color', '#ffd700');
    }

    function start() {
        const el = $('<div class="head__action uk-calendar-date"></div>');
        el.css({
            padding: '0 0.8em',
            fontSize: '1.05em',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
        });
        el.text('');

        if (Lampa.Head && typeof Lampa.Head.addElement === 'function') {
            Lampa.Head.addElement(el);
        } else if (Lampa.Head && typeof Lampa.Head.add === 'function') {
            Lampa.Head.add(el[0] || el);
        } else {
            const head = document.querySelector('.head__actions') || document.querySelector('.head');
            if (head) head.appendChild(el[0] || el);
        }

        updateDisplay(el);
        setInterval(function () { updateDisplay(el); }, 30 * 60 * 1000);

        Lampa.Listener.follow('activity', function (e) {
            if (e.type === 'start') updateDisplay(el);
        });
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();


(function () {
    'use strict';

    if (window.uk_calendar_plugin) return;
    window.uk_calendar_plugin = true;

    // ---------------------------------------------------------------------
    // Фіксовані дати (MM-DD, без прив'язки до року).
    // Звірено з чинним переліком державних свят (ст. 73 КЗпП, 2026) та
    // непорушними датами ПЦУ за новим (новоюліанським) календарем.
    // ---------------------------------------------------------------------
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
        // 1 жовтня — об'єднана державна дата (закон більше не виділяє 14 жовтня окремо)
        '10-01': 'День захисників і захисниць України / Покрова Пресвятої Богородиці / День Українського козацтва',
        '11-08': 'Собор Архистратига Михаїла',
        '11-20': 'Всесвітній день дитини',
        '11-21': 'Введення в храм Пресвятої Богородиці',
        '12-01': 'Всесвітній день боротьби зі СНІДом',
        '12-06': 'св. Миколая Чудотворця',
        '12-10': 'Міжнародний день прав людини',
        '12-25': 'Різдво Христове',
        '12-26': 'Собор Пресвятої Богородиці',
        '12-31': 'св. Меланії (Щедрий вечір)'
        // День пам'яті жертв Голодомору та Великдень/Трійця — рухомі,
        // рахуються нижче в getMovableHolidays(), а не тут.
    };

    const MONTHS_UA = [
        '', 'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
        'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
    ];

    function pad(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function dateKey(d) {
        return pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    // -------------------- Рухомі свята --------------------

    // Великдень за Пасхалією ПЦУ (юліанський розрахунок + конвертація в
    // григоріанську дату, коректно для 1900–2099).
    function computeEaster(year) {
        const a = year % 4;
        const b = year % 7;
        const c = year % 19;
        const d = (19 * c + 15) % 30;
        const e = (2 * a + 4 * b - d + 34) % 7;
        const month = Math.floor((d + e + 114) / 31);
        const day = ((d + e + 114) % 31) + 1;
        const julianEaster = new Date(year, month - 1, day);
        const gregorianEaster = new Date(julianEaster);
        gregorianEaster.setDate(gregorianEaster.getDate() + 13);
        return gregorianEaster;
    }

    function computeTrinity(year) {
        const e = computeEaster(year);
        const t = new Date(e);
        t.setDate(t.getDate() + 49);
        return t;
    }

    function nthWeekdayOfMonth(year, month, weekday, n) {
        const first = new Date(year, month, 1);
        const firstWeekday = first.getDay();
        const day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
        return new Date(year, month, day);
    }

    // 4-та субота листопада
    function computeHolodomorDay(year) {
        return nthWeekdayOfMonth(year, 10, 6, 4);
    }

    function getMovableHolidays(year) {
        const map = {};
        map[dateKey(computeEaster(year))] = 'Великдень (Пасха)';
        map[dateKey(computeTrinity(year))] = 'Трійця';
        map[dateKey(computeHolodomorDay(year))] = 'День пам’яті жертв Голодомору';
        return map;
    }

    // -------------------- Основна логіка --------------------

    function startOfDay(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    function holidaysForYear(year) {
        return Object.assign({}, HOLIDAYS, getMovableHolidays(year));
    }

    function getTodayKey() {
        return dateKey(new Date());
    }

    function getTodayName() {
        const year = new Date().getFullYear();
        return holidaysForYear(year)[getTodayKey()] || null;
    }

    function getNextHoliday() {
        const now = new Date();
        const today = startOfDay(now);
        const candidates = [];

        [now.getFullYear(), now.getFullYear() + 1].forEach(function (year) {
            const map = holidaysForYear(year);
            for (let key in map) {
                const parts = key.split('-').map(Number);
                const date = new Date(year, parts[0] - 1, parts[1]);
                if (date >= today) candidates.push({ key: key, date: date, name: map[key] });
            }
        });

        candidates.sort(function (a, b) { return a.date - b.date; });
        return candidates[0] || null;
    }

    function formatShortDate(key) {
        const parts = key.split('-').map(Number);
        return parts[1] + ' ' + MONTHS_UA[parts[0]];
    }

    function updateDisplay(el) {
        const todayName = getTodayName();

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

    // Гарантований запасний варіант: власний фіксований банер зверху екрана.
    // Спрацьовує, якщо в конкретній збірці Lampa немає Lampa.Head або
    // очікуваних класів '.head__actions' / '.head' (структура міняється
    // між версіями застосунку).
    function fallbackBanner() {
        const el = $('<div class="uk-calendar-date uk-calendar-fallback"></div>');
        el.css({
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            zIndex: 999999,
            textAlign: 'center',
            padding: '0.4em 0',
            fontSize: '1.05em',
            background: 'rgba(0,0,0,0.55)',
            pointerEvents: 'none'
        });
        $('body').append(el);
        return el;
    }

    function attachElement() {
        const el = $('<div class="head__action uk-calendar-date"></div>');
        el.css({
            padding: '0 0.8em',
            fontSize: '1.05em',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
        });

        let attached = false;

        try {
            if (window.Lampa && Lampa.Head && typeof Lampa.Head.addElement === 'function') {
                Lampa.Head.addElement(el);
                attached = true;
            } else if (window.Lampa && Lampa.Head && typeof Lampa.Head.add === 'function') {
                Lampa.Head.add(el[0] || el);
                attached = true;
            } else {
                const head = document.querySelector('.head__actions') || document.querySelector('.head');
                if (head) {
                    head.appendChild(el[0] || el);
                    attached = true;
                }
            }
        } catch (e) {
            attached = false;
        }

        // Якщо жоден із варіантів вище не спрацював (елемент реально не в DOM) —
        // використовуємо гарантований fallback-банер.
        if (!attached || !document.body.contains(el[0])) {
            return fallbackBanner();
        }

        return el;
    }

    function start() {
        const el = attachElement();
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

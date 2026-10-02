// import express from "express";
// const app = express();
// const PORT = 3000;

// app.use(express.urlencoded({ extended: true }));

// app.get("/", (req, res) => {
//     res.send(`
//         <h1>Добро пожаловать на Конференции.РФ</h1>
//         <p>Выберите нужный раздел в меню:</p>
//         <ul>
//             <li><a href="/about">О портале</a></li>
//             <li><a href="/contact">Контакты</a></li>
//             <li><a href="/help">Помощь</a></li>
//             <li><a href="/rooms">Список помещений</a></li>
//             <li><a href="/register">Регистрация</a></li>
//         </ul>
//     `);
// });

// app.get('/about', (req, res) => {
//     res.send(`
//         <h1>О портале</h1>
//         <p><b>Конференции.РФ</b> — это современная площадка для организации и проведения научных и бизнес-мероприятий.</p>
//         <a href="/">На главную</a
//     `);
// });

// app.get('/contact', (req, res) => {
//     res.send(`
//         <h1>Контакты</h1>
//         <p>По всем вопросам пишите нам на email: <a href="mailto:support@conf.rf">support@conf.rf</a></p>
//         <p>Телефон горячей линии: <b>+7 (000) 000-00-00</b></p>
//         <a href="/">На главную</a>
//     `);
// });

// app.get('/help', (req, res) => {
//     res.send(`
//         <h1>Помощь и FAQ</h1>
//         <h3>Как зарегистрироваться?</h3>
//         <p>Перейдите в раздел <a href="/register">Регистрация</a> и заполните форму.</p>
//         <a href="/">На главную</a>
//     `);
// });

// app.get('/rooms', (req, res) => {
//     res.send(`
//         <h1>Список помещений</h1>
//         <p>Доступные залы для проведения мероприятий:</p>
//         <ol>
//             <li><b>Большой актовый зал</b> (до 500 человек)</li>
//             <li><b>Конференц-зал "Альфа"</b> (до 100 человек)</li>
//             <li><b>Пресс-центр "Омега"</b> (до 50 человек)</li>
//             <li><b>Круглый стол</b> (до 25 человек)</li>
//         </ol>
//         <a href="/">На главную</a>
//     `);
// });

// app.get('/register', (req, res) => {
//     res.send(`
//         <h2>Регистрация на портале</h2>
//         <form method="POST" action="/register">
//             <p><input name="login" placeholder="Логин" required></p>
//             <p><input name="password" type="password" placeholder="Пароль" required></p>
//             <p><input name="fio" placeholder="ФИО" required></p>
//             <p><input name="phone" type="tel" placeholder="Телефон" required></p>
//             <p><input name="email" type="email" placeholder="Email" required></p>
//             <p><input name="city" type="city" placeholder="Город" required></p>
//             <button type="submit">Создать пользователя</button>
//             <button type="reset">Очистить форму</button>
//         </form>
//     `);
// });

// app.post('/register', (req, res) => {
//     const { login, password, fio, phone, email, city } = req.body;

//     res.send(`
//         <h2>Успешная регистрация!</h2>
//         <p><b>Логин:</b> ${login}</p>
//         <p><b>Пароль:</b> ${password}</p>
//         <p><b>ФИО:</b> ${fio}</p>
//         <p><b>Телефон:</b> ${phone}</p>
//         <p><b>Email:</b> ${email}</p>
//         <p><b>Город:</b>${city}</p>
//         <br>
//         <a href="/register">Назад к форме</a>
//     `);
// });

// app.listen(PORT, () => {
//     console.log(`Сервер запущен: http://localhost:${PORT}`);
// });
import express from "express";
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render('index');
});

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'О портале Конференции.РФ',
        description: 'Это современный образовательный и научный портал для проведения мероприятий.'
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { login, password, fio, phone, email, city } = req.body;
    res.render('register', { user: { login, fio, phone, email, city } });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard', {
        title: 'Мои заявки',
        user: { fio: 'Иванов Иван' },
        requests: [
            { room_name: 'Аудитория №1', status: 'Новая' },
            { room_name: 'Коворкинг', status: 'Завершено' }
        ]
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});


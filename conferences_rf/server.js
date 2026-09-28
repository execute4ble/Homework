import express from "express";
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Конференции.РФ");
});

app.get('/about', (req, res) => {
    res.send('О портале: Информация о нашей конференции.');
});

app.get('/contact', (req, res) => {
    res.send('Контакты: Напишите нам на email@example.com');
});

app.get('/register', (req, res) => {
    res.send(`
        <h2>Регистрация на портале</h2>
        <form method="POST" action="/register">
            <p><input name="login" placeholder="Логин" required></p>
            <p><input name="password" type="password" placeholder="Пароль" required></p>
            <p><input name="fio" placeholder="ФИО" required></p>
            <p><input name="phone" type="tel" placeholder="Телефон" required></p>
            <p><input name="email" type="email" placeholder="Email" required></p>
            <button type="submit">Создать пользователя</button>
        </form>
    `);
});

app.post('/register', (req, res) => {
    const { login, password, fio, phone, email } = req.body;

    res.send(`
        <h2>Успешная регистрация!</h2>
        <p><b>Логин:</b> ${login}</p>
        <p><b>Пароль:</b> ${password}</p>
        <p><b>ФИО:</b> ${fio}</p>
        <p><b>Телефон:</b> ${phone}</p>
        <p><b>Email:</b> ${email}</p>
        <br>
        <a href="/register">Назад к форме</a>
    `);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});

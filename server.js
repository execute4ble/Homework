import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import db, { User, Room, Requests } from "./db.js";


const user = User.count();
const room = Room.count();
const requests = Requests.count();
console.log(user, room, requests);

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

const newUser = User.create({
  login: 'test_user01',
  password: 'test12345',
  fio: 'Тестов Тест',
  phone: '8(999)111-22-33',
  email: 'test@example.com'
});

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));

app.get("/rooms", (req, res) => {
  const rooms = Room.findAll();
  res.render("rooms");
});

// app
//   .route("/create")
//   .get(requireAuth, (req, res) => {
//     const rooms = Room.findAll();
//     res.render("create_request", { rooms, errors: [] });
//   })
//   .post(requireAuth, (req, res) => {
//     const { room_id, date_start, payment } = req.body;
//     if (!room_id || !date_start || payment) {
//       const rooms = Room.findAll();
//       return res.render("create_request", {
//         rooms,
//         errors: ["Все поля обязательны для заполнения"],
//       });
//     }
//     Request.create({
//       userId: req.session.userId,
//       roomId: room_id,
//       dateStart: date_start,
//       payment: payment,
//     });
//     res.redirect("/dashboard");
//   });

app.get('/create', (req, res) => {
  const rooms = Rooms.findAll()
  res.render("create-request", { rooms, errors: []});
});

console.log(newUser);

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "conf.db"));

db.exec(`
    CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fio TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
    );
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS rooms(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
    );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS requests(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  date_start TEXT NOT NULL,
  payment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Новая',
  review TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) on DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) on DELETE CASCADE
  );
`);

const rooms = db.prepare("SELECT COUNT(*) AS c FROM rooms").get().c;

const count = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;

const requests = db.prepare("SELECT COUNT(*) AS c FROM requests").get().c;

if (count === 0) {
  const stat = db.prepare(`
        INSERT INTO users (login, password, fio, phone, email)
        VALUES(?, ?, ?, ?, ?)
        `);
  stat.run(
    "ivan",
    "demo",
    "Иванов Иван",
    "8(999)123-45-67",
    "ivanov@example.com",
  );
  stat.run(
    "dima",
    "demo",
    "Дмитрий Евгенич",
    "8(999)123-45-67",
    "krug@example.com",
  );
  stat.run(
    "miha",
    "demo",
    "Михаил Круг",
    "8(999)123-45-67",
    "evgenich@example.com",
  );
  console.log("Тестовый пользователи добавлены");
}

if (rooms === 0) {
  const stat = db.prepare(`
        INSERT INTO rooms (id, name, type, capacity)
        VALUES(?, ?, ?, ?)
        `);
  stat.run(1, "for_1", "odnuska", "2");
  stat.run(2, "for_2", "dvushka", "3");
  stat.run(3, "for_3", "treshka", "4");
  console.log("Тестовые комнаты добавлены");
}

if (requests === 0) {
  const statRequest = db.prepare(`
      INSERT INTO requests(user_id, room_id, date_start, payment)
      VALUES(?, ?, ?, ?)
    `);
  statRequest.run(1, 1, "2027-03-15", "При очном посещении");
  statRequest.run(1, 2, "2027-03-20", "Перевод по СБП");
  statRequest.run(1, 3, "2027-04-01", "При очном посещении");
  console.log("Тестовые заявки добавлены");
}

class UserModel {
  constructor() {
    this.table = "users";
  }

  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
  }

  findByLogin(login) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE login = ?`).get(login);
  }

  findAll() {
    return db.prepare(`SELECT * FROM ${this.table}`).all();
  }

  count() {
    return db.prepare(`SELECT COUNT(*) AS c FROM ${this.table}`).get().c;
  }

  exists(login) {
    const user = this.findByLogin(login);
    return !!user;
  }

  create({ login, password, fio, phone, email }) {
    const hash = bcrypt.hashSync(password, 10);
    const r = db.prepare(`
      INSERT INTO ${this.table} (login, password, fio, phone, email)
      VALUES(?, ?, ?, ?, ?)
      `).run(login, hash, fio, phone, email);
      return this.findById(r.lastInsertRowid);
  }
}

class RoomModel {
  constructor() {
    this.table = "rooms";
  }
  findAll() {
    return db.prepare(`SELECT * FROM ${this.table}`).all();
  }

  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
  }

  findByType(type) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE type = ?`).all(type);
  }
  count() {
    return db.prepare(`SELECT COUNT(*) AS c FROM ${this.table}`).get().c;
  }
}

class RequestsModel {
  constructor() {
    this.table = "requests";
  }
  findById(id) {
    return db.prepare(`SELECT * FROM ${this.table} WHERE id = ?`).get(id);
  }
  count() {
    return db.prepare(`SELECT COUNT(*) AS c FROM ${this.table}`).get().c;
  }
  findByUser(userId) {
    return db
      .prepare(
        `
    SELECT r.*, re.name AS room_name, rm.type AS room_type
    FROM ${this.table} r
    JOIN rooms rm ON rm.id = r.room_id
    WHERE r.user_id = ?
    OREDR BY r.id DESC
  `,
      )
      .all(userId);
  }
  findAllDetailed() {
    return db
      .prepare(
        `
    SELECT r.*, u.fio, u.login, re.name, AS room_name, re.type AS room_type 
    FROM ${this.table} r
    JOIN users u ON u.id = r.users_id
    JOIN rooms rm ON rm.id = r.room_id
    ORDER BY r.id DESC
  `,
      )
      .all();
  }
  updateStatus(id, status) {
    return db
      .prepare(
        `
      UPDATE ${this.table} SET status = ? WHERE id = ?
      `,
      )
      .run(status, id);
}


create({ userId, roomId, dateStart, payment }) {
  const r = db.prepare(`
    INSERT INTO ${this.table} (user_id, room_id, date_start, payment)
    VALUES (?, ?, ?, ?)
    `).run(userId, roomId, dateStart, payment);
    return this.findById(r.lastInsertRowid);
}
}


export const User = new UserModel();
export const Room = new RoomModel();
export const Requests = new RequestsModel();


export default db;

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('data.db');
const users = [
  'administrador@parqueo.com',
  'parqueaderoreten@parqueo.com'
];
const plain = '@reten12@';

const hash = bcrypt.hashSync(plain, 10);
let pending = users.length;

users.forEach((email) => {
  db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('ERR_SELECT', err);
      process.exit(1);
    }

    const callback = () => {
      console.log(JSON.stringify({ email, status: row ? 'UPDATED' : 'INSERTED' }));
      pending -= 1;
      if (pending === 0) {
        db.close();
      }
    }

    if (row) {
      db.run('UPDATE usuarios SET password_hash = ? WHERE email = ?', [hash, email], function (err2) {
        if (err2) {
          console.error('ERR_UPDATE', err2);
          process.exit(1);
        }
        callback();
      });
    } else {
      db.run('INSERT INTO usuarios (email, password_hash) VALUES (?, ?)', [email, hash], function (err3) {
        if (err3) {
          console.error('ERR_INSERT', err3);
          process.exit(1);
        }
        callback();
      });
    }
  });
});

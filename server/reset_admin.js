const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('data.db');
const email = 'administrador@parqueo.com';
const plain = '@admin20@';

db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, row) => {
  if (err) {
    console.error('ERR_SELECT', err);
    process.exit(1);
  }
  const hash = bcrypt.hashSync(plain, 10);
  if (row) {
    db.run('UPDATE usuarios SET password_hash = ? WHERE email = ?', [hash, email], function (err2) {
      if (err2) {
        console.error('ERR_UPDATE', err2);
        process.exit(1);
      }
      console.log('UPDATED');
      db.get('SELECT id, email, password_hash FROM usuarios WHERE email = ?', [email], (e, r) => {
        console.log(JSON.stringify(r));
        db.close();
      });
    });
  } else {
    db.run('INSERT INTO usuarios (email, password_hash) VALUES (?, ?)', [email, hash], function (err3) {
      if (err3) {
        console.error('ERR_INSERT', err3);
        process.exit(1);
      }
      console.log('INSERTED');
      db.get('SELECT id, email, password_hash FROM usuarios WHERE email = ?', [email], (e, r) => {
        console.log(JSON.stringify(r));
        db.close();
      });
    });
  }
});

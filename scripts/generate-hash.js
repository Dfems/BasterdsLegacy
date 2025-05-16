import bcrypt from 'bcrypt';

bcrypt.hash('secret', 10)
  .then(hash => {
    console.log('Hash per "secret":', hash);
  })
  .catch(err => {
    console.error('Errore durante la generazione dell\'hash:', err);
  });
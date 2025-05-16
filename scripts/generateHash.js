const bcrypt = require('bcrypt');
bcrypt.hash('secret', 10).then(h => console.log(h));

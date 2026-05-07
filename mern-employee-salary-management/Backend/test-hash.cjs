const argon2 = require('argon2');
(async () => {
  const hash = '$argon2id$v=19$m=65536,t=3,p=4$lr7yjbGbEUUVriOfCRonEw$bEHjCI5GeAOBFuQli/GF2zIus0mGZAq3AcD3C2mcwwc';
  const passwords = ['aldi', '123456', 'password', '123', 'admin', '112233'];
  for (let pwd of passwords) {
    if (await argon2.verify(hash, pwd)) {
      console.log('Password is:', pwd);
      return;
    }
  }
  console.log('Not found');
})();

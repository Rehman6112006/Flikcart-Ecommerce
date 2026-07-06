const mongoose = require('mongoose');
const uri = 'mongodb://Flikcart:Rehman%4000@ac-fg1fg2z-shard-00-00.ogzq9vo.mongodb.net:27017,ac-fg1fg2z-shard-00-01.ogzq9vo.mongodb.net:27017,ac-fg1fg2z-shard-00-02.ogzq9vo.mongodb.net:27017/?retryWrites=true&w=majority&ssl=true&authSource=admin&appName=e-commerce';
console.log('Connecting...');
mongoose.connect(uri, {serverSelectionTimeoutMS: 15000})
  .then(() => { console.log('SUCCESS'); process.exit(0); })
  .catch(err => { console.error('FAILED:', err.message, err.code); process.exit(1); });

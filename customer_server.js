const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.CUSTOMER_PORT || 3001;
app.use(cors());
app.use(express.static(path.join(__dirname, 'customer')));
app.use('/media', express.static(path.join(__dirname, 'customer/media')));
app.get('/', (req, res) => {
  res.redirect('/index.html');
});
app.listen(PORT, () => {
  console.log(`Customer server running on http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const recordsController = require('./controllers/records');
const accessController = require('./controllers/access');
const authMiddleware = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(authMiddleware);

// Routes
app.post('/api/records', recordsController.createRecord);
app.get('/api/records/:recordId', recordsController.getRecord);
app.get('/api/patient/records', recordsController.getPatientRecords);
app.post('/api/access/request', accessController.requestAccess);
app.post('/api/access/grant', accessController.grantAccess);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Healthcare API server running on port ${PORT}`);
});
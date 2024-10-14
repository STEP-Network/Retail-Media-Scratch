const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors({
    origin: '*'
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/receive-nexta-content', (req, res) => {
    console.log('Received nextaContent:', JSON.stringify(req.body));
    const { nextaContent } = req.body;
    if (nextaContent) {
        console.log('Received nextaContent:', nextaContent);
        // Further processing...
        res.status(200).send('nextaContent received successfully: ' + nextaContent);
    } else {
        res.status(400).send('nextaContent is missing');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
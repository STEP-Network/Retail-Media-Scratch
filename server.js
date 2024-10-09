const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/receive-nexta-content', (req, res) => {
    console.log('Received nextaContent:', JSON.stringify(req.body));
    const { nextaContent } = req.body;
    if (nextaContent) {
        console.log('Received nextaContent:', nextaContent);
        // Further processing...
        res.status(200).send('nextaContent received successfully');
    } else {
        res.status(400).send('nextaContent is missing');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
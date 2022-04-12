const express = require('express');
const bp = require('body-parser')
nftHandler = require('./nftCreator');

const app = express();
const port = 3000;

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post("/createNft", (req, res) => {
    console.log(req.body);
    nftHandler.createNFT(res)
        .then(() => res.send('NFT created'))
        .catch(error => {
            console.error(error);
            res.send('creation failed with error ' + error);
        })

})

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});


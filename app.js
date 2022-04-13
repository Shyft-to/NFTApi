const express = require('express');
const bp = require('body-parser')
const nftHandler = require('./nftCreator');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ipfsAPI = require('ipfs-api');

const app = express();
const port = 3000;

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
app.use(fileUpload());

const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/ownerOf', (req, res) => {
    console.log(req.body);
    nftHandler.getNftOwner(req)
        .then((owner) => {
            res.send({
                tokenId: req.body.tokenId,
                owner: owner,
            })
        })
        .catch(error => {
            res.send('failed to fetch the owner' + error);
        })

})

app.post("/createNft", (req, res) => {
    console.log(req.body);
    var uploadDetails;
    if (req.files) {
        try {
            uploadDetails = uploadDataToIpfs(req.files, createFileOnIpfs, createMetadataOnIpfs);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    }


    // nftHandler.createNFT(req)
    //     .then((response) => res.send(response))
    //     .catch(error => {
    //         console.error(error);
    //         res.send('creation failed with error ' + error);
    //     })

})

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

function uploadDataToIpfs(fileData, createFileOnIpfs, createMetadataOnIpfs) {
    console.log("file details:");
    console.log(fileData);

    var uploadedFileName = uuidv4();
    var uploadDir = "uploads";

    file = fileData.file;
    fileLocation = uploadDir + "/" + uploadedFileName;
    file.mv(fileLocation, function (err) {
        if (err) {
            console.log(err);
            throw new Error(err);
        }

        createFileOnIpfs(fileLocation, createMetadataOnIpfs)
    })
}

// upload the data on ipfs
function createFileOnIpfs(fileLocation, createMetadataOnIpfs) {
    let diskFile = fs.readFileSync(fileLocation);
    console.log("uploading file to ipfs");
    let ipfsBuffer = new Buffer(diskFile);

    ipfs.files.add(ipfsBuffer, function (err, file) {
        if (err) {
            console.log(err);
            throw new Error(err)
        }
        console.log(file[0]);
        createMetadataOnIpfs(file[0]);
    });
}

function createMetadataOnIpfs(uploadedImageDetails) {

}

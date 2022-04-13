const express = require('express');
const bp = require('body-parser')
const nftHandler = require('./nftCreator');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ipfsAPI = require('ipfs-api');

const app = express();
const port = 3000;
const uploadDir = "uploads";

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


app.post('/tokenURI', (req, res) => {
    console.log(req.body);
    nftHandler.getTokenURI(req)
        .then((uri) => {
            res.send({
                tokenId: req.body.tokenId,
                tokenURI: uri,
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
            uploadDetails = uploadDataToIpfs(req.files, req.body, res, createFileOnIpfs, createMetadataOnIpfs);
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
    }
})

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

function uploadDataToIpfs(fileData, reqParams, response, createFileOnIpfs, createMetadataOnIpfs) {
    console.log("file details:");
    console.log(fileData);

    var uploadedFileName = uuidv4();

    file = fileData.file;
    fileLocation = uploadDir + "/" + uploadedFileName;
    file.mv(fileLocation, function (err) {
        if (err) {
            console.log(err);
            throw new Error(err);
        }

        createFileOnIpfs(fileLocation, reqParams, response, createMetadataOnIpfs)
    })
}

//upload the data on ipfs
function createFileOnIpfs(fileLocation, reqParams, response, createMetadataOnIpfs) {
    let diskFile = fs.readFileSync(fileLocation);
    console.log("uploading file to ipfs");
    let ipfsBuffer = new Buffer(diskFile);

    ipfs.files.add(ipfsBuffer, function (err, file) {
        if (err) {
            console.log(err);
            throw new Error(err)
        }
        console.log(file[0]);
        metadata = createMetadata(reqParams, file[0]);
        metaDataFilePath = createMetadataJsonFile(metadata);
        createMetadataOnIpfs(metadata, reqParams.mintTo, metaDataFilePath, response);
    });
}

function createMetadataJsonFile(metadata) {
    jsonFileName = uploadDir + "/" + uuidv4() + ".json";
    console.log("metadata generated: \n" + metadata);
    jsonFile = fs.writeFileSync(jsonFileName, JSON.stringify(metadata));
    return jsonFileName;
}

function createMetadata(reqParams, file) {
    let metadata = {
        name: reqParams.name,
        description: reqParams.description,
        image: "https://ipfs.io/ipfs/" + file.hash
    }
    return metadata;
}

function createMetadataOnIpfs(metadata, mintTo, metaDataFilePath, response) {
    let metaFile = fs.readFileSync(metaDataFilePath);
    console.log("uploading metadata file to ipfs");
    let ipfsBuffer = new Buffer(metaFile);
    ipfs.files.add(ipfsBuffer, function (err, file) {
        if (err) {
            console.log(err);
            throw new Error(err)
        }
        console.log(file[0]);

        let data = {
            mintTo: mintTo,
            tokenUri: "ipfs://" + file[0].hash
        }

        nftHandler.createNFT(data)
            .then((ret) => {
                ret.name = metadata.name;
                ret.description = metadata.description;
                response.send(ret);
            })
            .catch(error => {
                console.error(error);
                res.status(500).send('creation failed with error ' + error);
            })
    })
}
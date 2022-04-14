const express = require('express');
const bp = require('body-parser')
const nftHandler = require('./nftCreator');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ipfsAPI = require('ipfs-api');
const sgMail = require('@sendgrid/mail');
const secrets = require('./secrets.json');
const redis = require('redis');
let client = require('@sendgrid/client');
const { error } = require('pull-stream/sources');

const app = express();
const port = 3000;
const uploadDir = "uploads";
sgMail.setApiKey(secrets.sendridApiKey);
let dbClient;

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))
app.use(fileUpload());
connectToRedis();

const ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })

// dbClient.on('connect', () => {
//     console.log('redis conneted');
// })

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/signup', (req, res) => {
    if (!isEmailIdValid(req.body.emailId)) {
        res.status(400).send("invalid email address");
        return
    }

    getApiKey(req.body.emailId)
        .then((key) => {
            registerApiKeyInDb(key, req.body.emailId);
            return key;
        })
        .then((key) => {
            html = '<strong>Welcome to Shyft. Begin your NFT journey. Your API Key is : ' + key + '</strong>';
            const msg = {
                to: req.body.emailId,
                from: 'vgvishesh2022@gmail.com',
                subject: 'Shyft API key',
                text: uuidv4().toString(),
                html: html,
            }

            sgMail.send(msg)
                .then(() => {
                    console.log('Email sent to ' + req.body.emailId);
                })
                .catch((error) => {
                    throw error;
                })

            return key;
        })
        .then((key) => {
            res.send("API key has been sent to your emailId");
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send(error)
        });
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

function isEmailIdValid(email) {
    var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
    if (!email)
        return false;

    if (email.length > 254)
        return false;

    var valid = emailRegex.test(email);
    if (!valid)
        return false;

    // Further checking of some things regex can't handle
    var parts = email.split("@");
    if (parts[0].length > 64)
        return false;

    var domainParts = parts[1].split(".");
    if (domainParts.some(function (part) { return part.length > 63; }))
        return false;

    return true;
}

async function getApiKey(emailId) {
    let apiKey = await dbClient.get(emailId);
    if (apiKey == null) {
        apiKey = uuidv4().toString();
    }
    console.log(apiKey);
    return apiKey
}

async function connectToRedis() {
    dbClient = redis.createClient();
    await dbClient.connect();
}

async function registerApiKeyInDb(apiKey, emailId) {
    await dbClient.set(emailId, apiKey);
}
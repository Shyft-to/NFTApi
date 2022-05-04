const hre = require("hardhat");

let localContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
let rinkebyContractAddress = "0x48295f586c5A078876438C16200c1F2600010d32";
let contractAddress = rinkebyContractAddress;

async function createNFT(data) {
    const HelloNft = await hre.ethers.getContractFactory("HelloNft");
    const hello = await HelloNft.attach(contractAddress);

    const txn = await hello.awardItem(data.mintTo, data.tokenUri);
    console.log("token minted");
    console.log("txn: ", JSON.stringify(txn));

    tv = await hello.getLatestTokenCount();
    let response = {
        transaction_hash: txn.hash,
        mint_to_address: txn.to,
        contract_address: contractAddress,
        tokenId: tv.toString(),
    }

    return response
}

async function getNftOwner(request) {
    const HelloNft = await hre.ethers.getContractFactory("HelloNft");
    const hello = await HelloNft.attach(contractAddress);

    const ownerAddress = await hello.ownerOf(request.body.tokenId);
    console.log(ownerAddress.toString());
    return ownerAddress.toString();
}

async function getTokenURI(request) {
    const HelloNft = await hre.ethers.getContractFactory("HelloNft");
    const hello = await HelloNft.attach(contractAddress);

    const uri = await hello.tokenURI(request.body.tokenId);
    return uri;
}

module.exports = {
    createNFT,
    getNftOwner,
    getTokenURI
};
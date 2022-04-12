const hre = require("hardhat");

async function createNFT(request) {
    let localContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    let mintTo = "0xb8FAAB1f7f19E7021A8736777d7D0d75b7bdFcbc";
    const HelloNft = await hre.ethers.getContractFactory("HelloNft");
    const hello = await HelloNft.attach(localContractAddress);

    tokenId = await hello.awardItem(mintTo, request.tokenUri);
    console.log("token minted: ");
    console.log("tokenId: " + tokenId);
    ownerAddress = await hello.ownerOf(tokenId);
    console.log("token owner: " + ownerAddress);
}

module.exports.createNFT = createNFT;
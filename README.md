# NftCreator
This is the repo to create NFTs

# how to run 
1. clone the code in your system.
2. Install all the dependencies by running : `npm install`
3. start a local blockchain by running `npx hardhat node`
4. In another terminal window compile the smart contract, `npx hardhat compile`
5. deploy the smart contract on local blockchain, `npx hardhat run --network localhost scripts/deploy.js`

By now following things are happening in your syste:
1. a local blockchain is running
2. smart contracts under the directory contracts/solidity have been deployed on this blockchain

continuing with running...
6. start your nodeJs server by running `npx hardhat run --network localhost app.js`

Now, you nodeJs server is running at port 3000.

# making REST request to createNFTs to the server
1. Curl to create a NFT token
```
curl --location --request POST 'localhost:3000/createNft' \
--header 'Content-Type: application/json' \
--data-raw '{
    "mintTo": "0xb8FAAB1f7f19E7021A8736777d7D0d75b7bdFcbc",
    "tokenUri" : "vg.com"
}'
```
if you wish then you can update the `mintoTo` and `tokenUri` values.

2. curl to query the owner of a token Id
```
curl --location --request POST 'localhost:3000/ownerOf' \
--header 'Content-Type: application/json' \
--data-raw '{
    "tokenId" : 1
}'
```

paste the request curl in the postman and you will be able to interact with NFT smart contract deployed.


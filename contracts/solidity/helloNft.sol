// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract HelloNft is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(uint256 => address) private _owners;

    constructor() ERC721("HelloNft", "ITM") {}

    function awardItem(address player, string memory tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function getLatestTokenCount() public view returns (uint256) {
        return _tokenIds.current();
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        _owners[tokenId] = to;
    }

    function getTokenList(address player)
        internal
        view
        returns (string[] memory)
    {
        string[] memory ownedURIs;
        for (uint256 j = 0; j <= _tokenIds.current(); j++) {
            if (_owners[j] == player) {
                ownedURIs.push(tokenURI(j));
            }
        }
    }
}

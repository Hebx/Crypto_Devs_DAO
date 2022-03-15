//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface
interface INFTMiniMarket {
	// @dev getPrice() returns the price of an NFT from the NFTMiniMarket
	// @return Returns the price in wei for an NFT
	function getPrice() external view returns (uint256);

	// @dev available() returns whether or not the given _tokenId has already been purchased
	// @return Returns a Boolean value true if available false if not
	function available(uint256 _tokenId) external view returns (bool);

	// @dev purchase() purchases an NfT from the NFTMiniMarket
	// @param _tokenId the NFT tokenID to purchase
	function purchase(uint256 _tokenId) external payable;
}

interface ICryptoDevsNFT {
	// @dev balanceOf returns the numberof NFTs owned by the given address
	// @param owner - address to fetch number of NFTs from
	// @return Returns the number of NFTs owned
	function balanceOf(address owner) external view returns (uint256);

	// @dev tokenOfOwnerByIndex returns a tokenId at a given index of an owner
	// @param owner address to fetch the NFT from
	// @param index - index of NFT in owned tokens array to fetch
	// @return returns the tokenId of the NFT
	function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

struct Proposal {
	// nftTokenId the tokenId of the NFT to purchase from NFTMiniMarket if the proposal passes
	uint256 nftTokenId;
	// deadline, the UNIX timestamp until which the proposal is active, proposal can be executed if the deadline has been exceeded
	uint256 deadline;
	// number of Votes
	uint256 yayVotes;
	uint256 nayVotes;
	// executed- wheter or not this proposal has been executed yet, cnnot be executed before the deadline has been exceeded
	bool executed;
	// voters - a mapping of CryptoDevsNFT tokenIds to booleans indicating whether that NFT has already been used to cast a vote or not
	mapping(uint256 => bool) voters;
}
	// mapping from Proposals IDs to Proposals to hold all created proposals
	// counter to count  the number of proposals that exist
	mapping(uint256 => Proposal) public proposals;
	uint256 public numProposals;


contract CryptoDevsDAO is Ownable {

}

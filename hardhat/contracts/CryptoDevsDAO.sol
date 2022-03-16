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

contract CryptoDevsDAO is Ownable {

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
	// mapping from Proposal IDs to Proposals to hold all created proposals
	// counter to count  the number of proposals that exist
	mapping(uint256 => Proposal) public proposals;
	uint256 public numProposals;

	INFTMiniMarket NFTMiniMarket;
	ICryptoDevsNFT CryptoDevsNFT;

	// create a payable constructor  which initializes the contract
	// instances for NFTMiniMarket and CryptoDevsNFT
	// the payable allows this constructor to accept an ETH deposit when it is being deployed
	constructor(address _NFTMiniMarket, address _CryptoDevsNFT) payable {
		NFTMiniMarket = INFTMiniMarket(_NFTMiniMarket);
		CryptoDevsNFT = ICryptoDevsNFT(_CryptoDevsNFT);
	}

	// create a modifier which only allows a functioon to be called by someone who owns at least 1 CryptoDevsNFT
	modifier nftHolderOnly() {
		require(CryptoDevsNFT.balanceOf(msg.sender) > 0, "NOT_A_DAO_MEMBER");
		_;
	}

	// @dev createProposal allows a CryptoDevsNFT holder to create a new proposal in the DAO
	// @param _nftTokenId the tokenId of the nft to be purchased from NFTMiniMarket if this proposal passes
	// @return returns the proposal index for the newly created proposal
	function createProposal(uint256 _nftTokenId) external nftHolderOnly returns (uint256)
	{
		require(NFTMiniMarket.available(_nftTokenId), "NFT_NOT_FOR_SALE");
		Proposal storage proposal = proposals[numProposals];
		proposal.nftTokenId = _nftTokenId;
		// Set the proposal's voting deadline to be (current time + 5 min)
		proposal.deadline = block.timestamp + 5 minutes;
		numProposals++;
		return numProposals - 1;
	}

	// modifier which only allow a function to be called if the given proposal's deadline has not been exceeded yet
	modifier activeProposalOnly(uint256 proposalIndex) {
		require(
			proposals[proposalIndex].deadline > block.timestamp,
			"DEADLINE_EXCEEDED"
		);
		_;
	}

	enum Vote {
		YAY,
		NAY
	}

	// @dev voteOnProposal allows a CryptoDevsNFT holder to cast their vote on an active proposal
	// @param proposalIndex the index of the proposal to vote on in the proposals array
	// @param vote the type f vote they want to cast
	function voteOnProposal(uint256 proposalIndex, Vote vote) external nftHolderOnly activeProposalOnly(proposalIndex) {
		Proposal storage proposal = proposals[proposalIndex];
		uint256 voterNFTBalance = CryptoDevsNFT.balanceOf(msg.sender);
		uint256 numVotes = 0;

		// calculate how many NFT are owned by the voter that havnt been used for voting proposal
		for (uint256 i = 0; i < voterNFTBalance; i++) {
			uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, i);
			if (proposal.voters[tokenId] == false) {
				numVotes++;
				proposal.voters[tokenId] = true;
			}
		}
		require(numVotes > 0, "ALREADY_VOTED");
		if (vote == Vote.YAY) {
			proposal.yayVotes += numVotes;
		}
		else {
			proposal.nayVotes += numVotes;
		}
	}

	// create a modifier to allow a function to be called if the given proposal deadline  has been exceeded and if the proposal has not yet been executed
	modifier inactiveProposalOnly(uint256 proposalIndex) {
		require(
			proposals[proposalIndex].deadline <= block.timestamp,
			"DEADLINE_NOT_EXCEEDED"
		);
		require(
			proposals[proposalIndex].executed == false,
			"DEADLINE_ALREADY_EXECUTED"
		);
		_;
	}

	// @dev executeProposal allows any CryptoDevsNFT Holder to execute a proposal after it's deadline has been executed
	// @param proposalIndex the index of the proposal to execute in the proposals arrays
	function executeProposal(uint256 proposalIndex) external nftHolderOnly inactiveProposalOnly(proposalIndex) {
		Proposal storage proposal = proposals[proposalIndex];

		// if the proposal has more Yay than Nay votes purchase the nft from the NFTMiniMarket
		if (proposal.yayVotes > proposal.nayVotes) {
			uint256 nftPrice = NFTMiniMarket.getPrice();
			require(address(this).balance >= nftPrice,
			"NOT_ENOUGH_FUNDS");
			NFTMiniMarket.purchase{value: nftPrice}(proposal.nftTokenId);
		}
		proposal.executed = true;
	}

	// @dev withdrawEther allows the contract owner (deployer) to withdraw the ETH from the contract
	function withdrawEther() external onlyOwner {
		payable(owner()).transfer(address(this).balance);
	}

	// allow contract to accept ETH deposits directly from a wallet without calling a function
	receive() external payable {}
	fallback() external payable {}
}

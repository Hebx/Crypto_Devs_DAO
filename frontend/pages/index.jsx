import styles from "../styles/Home.module.css";
import {Contract, providers} from "ethers";
import Web3Modal from "web3modal";
import Head from "next/head";
import { formatEther, id } from "ethers/lib/utils";
import { useEffect, useState, useRef } from "react";
import { CRYPTODEVS_NFT_CONTRACT_ADDRESS,
CRYPTODEVS_DAO_CONTRACT_ADDRESS,
CRYPTODEVS_NFT_ABI,
CRYPTODEVS_DAO_ABI} from "../constants.js";

export default function Home() {
	// ETH balance of the DAO contract
	const [treasuryBalance, setTreasuryBalance] = useState("0");
	// number of proposals created in the DAO
	const [numProposals, setNumProposals] = useState("0");
	// array of all proposal creted in the DAO
	const [proposal, setProposals] = useState([]);
	// user balance of cryptoDevs NFT
	const [nftBalance, setNftBalance] = useState(0);
	// NFT TokenID from NFTMiniMarket to purchase, used when creating a proposal
	const [nftTokenId, setNftTokenId] = useState("");
	// createProposal / viewProposal
	const [selectedTab, setSelectedTab] = useState("");
	const [loading, setLoading] = useState(false);
	const [walletConnected, setWalletConnected] = useState(false);
	const web3ModalRef = useRef();

	const connectWallet = async () => {
		try {
			await getProviderOrSigner();
			setWalletConnected(true);
		} catch (err) {
			console.error(err);
		}
	};

	// Read the ETH Balance of the DAO contract and sets the "treasuryBalance"
	const getDAOTreasuryBalance = async () => {
		try {
			const provider = await getProviderOrSigner();
			const balance = await provider.getBalance(
				CRYPTODEVS_DAO_CONTRACT_ADDRESS
			);
			setTreasuryBalance(balance.toString());
		} catch (err) {
			console.error(err);
		}
	};

	// Read the numbers of proposals in the DAO contract and sets the 'numProposals'
	const getNumProposalsInDAO = async () => {
		try {
			const provider = await getProviderOrSigner();
			const contract = getDaoContractInstance(provider);
			const daoNumProposals = await contract.numProposals();
			setNumProposals(daoNumProposals.toString());
		} catch (err) {
			console.error(err);
		}
	};

	// Read the balance of user's CryptoDevs NFT and set "nftBalance"
	const getUserNftBalance = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const nftContract = getCryptoDevsNFTContractInstance(signer);
			const balance = await  nftContract.balanceOf(signer.getAddress());
			setNftBalance(parseInt(balance.toString()));
		} catch (err) {
			console.error(err);
		}
	};

	// Calls the 'createProposal' in the contract, using the tokenId from NftTokenId
	const createProposal = async () => {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			const txn = await daoContract.createProposal(nftTokenId);
			setLoading(true);
			await txn.wait();
			await getNumProposalsInDAO();
			setLoading(false);
		} catch (err) {
			console.error(err);
			window.alert(error.data.message)
		}
	};

	// fetch and parse one proposal from the DAO contract given the proposal ID and converts the returned data to Javascript object with value we can use
	const fetchProposalById = async (id) => {
		try {
			const provider = await getProviderOrSigner();
			const daoContract = getDaoContractInstance(provider);
			const proposal = await daoContract.proposals(id);
			const parsedProposal = {
				proposalId: id,
				nftTokenId: proposal.nftTokenId.toString(),
				deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
				yayVotes: proposal.yayVotes.toString(),
				nayVotes: proposal.nayVotes.toString(),
				executed: proposal.executed,
			};
			return parsedProposal;
		} catch (err) {
			console.error(err);
		}
	};

	// Loop through "numProposal" to fetch all proposal in the DAO and set 'proposals' state
	const fetchAllProposals = async () => {
		try {
			const proposals = [];
			for (let i = 0; i < numProposals; i++) {
				const proposal = await fetchProposalById(i);
				proposals.push(proposal);
			}
			setProposals(proposals);
			return proposals;
		} catch (error) {
			console.error(error);
		}
	}

	// Calls the "voteOnProposal" function in the contract using the passed proposal ID and Vote
	const voteOnProposal = async (proposalId, _vote) => {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			let vote = _vote === 'YAY' ? 0 : 1;
			const txn = await daoContract.voteOnProposal(proposalId, vote);
			setLoading(true);
			await txn.wait();
			setLoading(false);
			await fetchAllProposals();
		} catch (error) {
			console.error(error);
			window.alert(error.data.message);
		}
	};

	// Calls the 'executeProposal' function in the contract, using the passed proposalId
	const executeProposal = async (proposalId) => {
		try {
			const signer = await getProviderOrSigner(true);
			const daoContract = getDaoContractInstance(signer);
			const txn = await daoContract.executeProposal(proposalId);
			setLoading(true);
			await txn.wait();
			setLoading(false);
			await fetchAllProposals();
		}
		catch (error) {
			console.error(error);
			window.alert(error.data.message);
		}
	};

	// fetch provider/signer instance from metamask
	const getProviderOrSigner = async (needSigner = false) => {
		const provider = await web3ModalRef.current.connect();
		const web3Provider = new providers.Web3Provider(provider);
		const { chainId } = await web3Provider.getNetwork();
		if (chainId !==  4 ) {
			window.alert("Please switch to rinkeby network");
			throw new Error("Please switch to rinkeby network");
		}
		if (needSigner) {
			const signer = web3Provider.getSigner();
			return signer;
		}
		return web3Provider;
	};

	// return a DAO Contract Instance given a provider/signer
	const getDaoContractInstance =  (providerOrSigner) => {
		return new Contract(
			CRYPTODEVS_DAO_CONTRACT_ADDRESS,
			CRYPTODEVS_DAO_ABI,
			providerOrSigner
		)
	};

	// return a CryptoDev NFT Contract Instance given a provider/signer
	const getCryptoDevsNFTContractInstance =  (providerOrSigner) => {
		return new Contract(
			CRYPTODEVS_NFT_CONTRACT_ADDRESS,
			CRYPTODEVS_NFT_ABI,
			providerOrSigner,
		)
	};

	// Prompt everytime on change of 'walletConnected' then calls DAO treasury balance, user Nft balance and number of proposals in the DAO

	useEffect(() => {
		if (!walletConnected) {
			web3ModalRef.current = new Web3Modal({
				network: "rinkeby",
				providerOptions: {},
				disableInjectedProvider: false,
			});

			connectWallet().then(() => {
				getDAOTreasuryBalance();
				getUserNftBalance();
				getNumProposalsInDAO();
			})
		}
	}, [walletConnected])

	// prompt everytime on change of "selectedTab" then re-fetch all proposals in DAO when user switches to the view Proposals tabs
	useEffect(() => {
		if (selectedTab === "View Proposals") {
			fetchAllProposals();
		}
	}, [selectedTab])

	// render the content of the appropriate tab based on "selectedTab"
	function renderTabs() {
		if (selectedTab == "Create Proposal") {
			return renderCreateProposalTab();
		}
		if (selectedTab == "View Proposals") {
			return renderViewProposalTab();
		}
		return null;
	}

	// render the Create Proposal Tab
	function renderCreateProposalTab() {
		if ( loading ) {
			return (
				<div classeName={styles.description}>
					Loading... Waiting for Transaction...
				</div>
			);
		} else if (nftBalance === 0) {
			return (
				<div className={styles.description}>
					You do not own any Crypto Devs Nft <br />
					<b>You cannot create or vote on proposals</b>
				</div>
			);
		} else {
			return (
				<div className={styles.container}>
					<label>NFT Token ID to purchase</label>
					<input
						placeholder = "0"
						type = "number"
						onChange={(e) => setNftTokenId(e.target.value)} />
						<button className={styles.button2} onClick={createProposal}>
							Create
						</button>
				</div>
			);
		}
	}

	// render the View Proposal Tab
	function renderViewProposalTab() {
		if (loading) {
			return (
			<div classeName={styles.description}>
				Loading... Waiting for Transaction...
			</div>
			);
		} else if (proposal.length === 0) {
			return (
				<div className={styles.description}>
					No Proposals have been created
				</div>
			);
		} else {
			return (
				<div>
					{proposal.map((p, index) => (
						<div className={styles.proposalCard}>
							<p>Proposal ID: {p.proposalId}</p>
							<p>NFT to Purchase: {p.nftTokenId}</p>
							<p>Deadline: {p.deadline.toLocaleString()}</p>
							<p>Yay Votes: {p.yayVotes}</p>
							<p>Nay Votes: {p.nayVotes}</p>
							<p>Executed?: {p.executed.toString()}</p>
							{p.deadline.getTime() > Date.now() && !p.executed ? (
								<div className={styles.flex}>
									<button className={styles.button2}
									onClick={() => voteOnProposal(p.proposalId, "YAY")} >
										Vote YAY
									</button>
									<button
									className={styles.button2}
									onClick={() => voteOnProposal(p.proposalId, "NAY")} >
										Vote NAY
									</button>
								</div>
							) : p.deadline.getTime() < Date.now() && !p.executed ? (
								<div className={styles.flex}>
									<button className={styles.button2}
									onClick={() => executeProposal(p.proposalId)} >
										Execute Proposal{""}
										{p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
									</button>
									</div>
							): (
								<div className={styles.description}>Proposal Executed</div>
							)}
						</div>
					))}
				</div>
			);
		}
	}
	return (
		<div>
			<Head>
				<title>CryptoDevs DAO</title>
				<meta name="description" content="CryptoDevs DAO"/>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.main}>
				<div>
					<h1 className={styles.title}>Welcome to Crypto Devs!</h1>
					<div classeName={styles.description}>Welcome to the DAO!</div>
					<div className={styles.description}>
						Your CryptoDevs NFT balance: {nftBalance}
						<br />
						Treasury Balance: {formatEther(treasuryBalance)} ETH
						<br />
						Total Numbers of Proposals: {numProposals}
					</div>
					<div className={styles.flex}>
						<button className={styles.button}
						onClick={() => setSelectedTab("Create Proposal")} >
							Create Proposal
						</button>
						<button className={styles.button} onClick={() => setSelectedTab("View Proposals")} >
							View Proposals
						</button>
					</div>
					{renderTabs()}
				</div>
				<div>
					<img className={styles.image} src="0.svg" />
				</div>
			</div>
			<footer className={styles.footer}>
				Made with &#10084; by Crypto Devs
			</footer>
		</div>
	);
}

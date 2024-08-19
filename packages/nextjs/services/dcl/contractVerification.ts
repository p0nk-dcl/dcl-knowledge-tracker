// services/contractVerification.ts

import axios from 'axios';
import { ethers } from 'ethers';

interface VerificationParams {
    address: string;
    constructorArguments: any[];
}


const etherscanApiKey = "WWTCFZJ1V583QP6E1AQ3PTWNXPBDI3ZPRI";

//source code from deployed and verified smart contract ;)
const sourceCode = `//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MainRegistry.sol";

interface MainRegistry {
    function isWalletVerified(address _wallet) external view returns (bool);
    function walletToUserId(address _wallet) external view returns (uint256);
    function registerUser(string memory _username) external;
    function addAttestation(address _attestation, address[] memory _participants) external;
}

contract Attestation is ReentrancyGuard {
	using SafeMath for uint256;
	MainRegistry public mainRegistry;

	address[] public authors;
	address[] public contributors;
	string public ipfsHash;
	uint256[] public quotedAttestationId;
	string[] public tags;
	uint256 public coPublishThreshold;
	uint256 public verificationThreshold;

	mapping(address => bool) public hasSigned;
	uint256 public signatureCount;
	bool public isActivated;

	mapping(address => bool) public isCoPublisher;
	address[] public coPublishers;

	uint256 public upvoteCount;
	mapping(address => bool) public hasUpvoted;

	uint256 public totalReceivedFunds;
	mapping(address => uint256) public unclaimedFunds;

	event ContributorSigned(address indexed contributor);
	event AttestationActivated();
	event CoPublisherAdded(address indexed coPublisher);
	event Upvoted(address indexed upvoter);
	event FundsReceived(address indexed sender, uint256 amount);
	event FundsClaimed(address indexed claimer, uint256 amount);
	event AffiliationRevoked(address indexed contributor);
	event CoPublishThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

	constructor(
		address _mainRegistryAddress,
		address[] memory _authors,
		address[] memory _contributors,
		string memory _ipfsHash,
		uint256[] memory _quotedAttestationId,
		string[] memory _tags,
		uint256 _coPublishThreshold,
		uint256 _verificationThreshold
	) {
		mainRegistry = MainRegistry(_mainRegistryAddress);
		authors = _authors;
		contributors = _contributors;
		ipfsHash = _ipfsHash;
		quotedAttestationId = _quotedAttestationId;
		tags = _tags;
		coPublishThreshold = _coPublishThreshold;
		verificationThreshold = _verificationThreshold;
		_sign(authors[0]);
	}

	function _sign(address author) internal {
		require(!hasSigned[author], "Author has already signed.");
		hasSigned[author] = true;
		signatureCount++;

		if (signatureCount == contributors.length + authors.length) {
			isActivated = true;
			emit AttestationActivated();
		}

		emit ContributorSigned(author);
	}

	function sign() external {
		require(!isActivated, "Attestation already activated");
		require(isContributor(msg.sender), "Not a contributor");
		_sign(msg.sender);
	}

	function donate(uint256 amount) external payable {
		require(
			msg.value == amount,
			"Sent value does not match specified amount"
		);
		require(amount > 0, "No funds sent");

		distributeFunds(amount);

		emit FundsReceived(msg.sender, amount);

		if (amount >= coPublishThreshold && !isCoPublisher[msg.sender]) {
			isCoPublisher[msg.sender] = true;
			coPublishers.push(msg.sender);
			emit CoPublisherAdded(msg.sender);
		}
	}

	function setCoPublishThreshold(uint256 newThreshold) external {
		require(isAuthor(msg.sender), "Not an Author");
		require(newThreshold > 0, "Threshold must be greater than zero");
		uint256 oldThreshold = coPublishThreshold;
		coPublishThreshold = newThreshold;
		emit CoPublishThresholdUpdated(oldThreshold, newThreshold);
	}

	function upvote() external {
		require(!hasUpvoted[msg.sender], "Already upvoted");
		hasUpvoted[msg.sender] = true;
		upvoteCount++;

		emit Upvoted(msg.sender);
	}

	function claimFunds() external nonReentrant {
		require(isContributor(msg.sender), "Not a contributor or author");
		uint256 amount = unclaimedFunds[msg.sender];
		require(amount > 0, "No funds to claim");

		if (totalReceivedFunds >= verificationThreshold) {
			require(
				isVerifiedAuthor(msg.sender),
				"Author(s) needs to be verified!"
			);
		}

		unclaimedFunds[msg.sender] = 0;
		payable(msg.sender).transfer(amount);

		emit FundsClaimed(msg.sender, amount);
	}

	function distributeFunds(uint256 amount) internal {
		uint256 totalRecipients = contributors.length + authors.length;
		uint256 sharePerRecipient = amount.div(totalRecipients);

		for (uint256 i = 0; i < contributors.length; i++) {
			unclaimedFunds[contributors[i]] = unclaimedFunds[contributors[i]]
				.add(sharePerRecipient);
		}

		for (uint256 i = 0; i < authors.length; i++) {
			unclaimedFunds[authors[i]] = unclaimedFunds[authors[i]].add(
				sharePerRecipient
			);
		}

		totalReceivedFunds = totalReceivedFunds.add(amount);
	}

	function isAuthor(address _address) public view returns (bool) {
		for (uint i = 0; i < authors.length; i++) {
			if (authors[i] == _address) {
				return true;
			}
		}
		return false;
	}

	function isVerifiedAuthor(address _address) internal view returns (bool) {
		return isAuthor(_address) && mainRegistry.isWalletVerified(_address);
	}

	function isContributor(address _address) public view returns (bool) {
		// Check in the contributors array
		for (uint i = 0; i < contributors.length; i++) {
			if (contributors[i] == _address) {
				return true;
			}
		}

		return isAuthor(_address);
	}

	function revokeAffiliation() external {
		require(isContributor(msg.sender), "Not a contributor or author");
		require(!hasSigned[msg.sender], "Cannot revoke after signing");

		bool found = false;

		for (uint i = 0; i < contributors.length; i++) {
			if (contributors[i] == msg.sender) {
				contributors[i] = contributors[contributors.length - 1];
				contributors.pop();
				found = true;
				break;
			}
		}

		if (!found) {
			for (uint i = 0; i < authors.length; i++) {
				if (authors[i] == msg.sender) {
					authors[i] = authors[authors.length - 1];
					authors.pop();
					break;
				}
			}
		}

		unclaimedFunds[msg.sender] = 0;

		emit AffiliationRevoked(msg.sender);
	}

	function getAuthors() external view returns (address[] memory) {
		return authors;
	}

	function getContributors() external view returns (address[] memory) {
		return contributors;
	}

	function getTags() external view returns (string[] memory) {
		return tags;
	}

	function getCoPublishers() external view returns (address[] memory) {
		return coPublishers;
	}

	function getQuotesAttestationIds()
		external
		view
		returns (uint256[] memory)
	{
		return quotedAttestationId;
	}
}`;

//replace with : https://api.etherscan.io/api for mainnet; sepolia: https://api-sepolia.etherscan.io/api
export async function verifyContract(params: VerificationParams): Promise<boolean> {
    try {
        const apiUrl = 'https://api-sepolia.etherscan.io/api';

        console.log('Verifying contract at address:', params.address);

        // ABI encode constructor arguments
        const abiCoder = new ethers.AbiCoder();
        const encodedConstructorArgs = abiCoder.encode(
            ['address', 'address[]', 'address[]', 'string', 'uint256[]', 'string[]', 'uint256', 'uint256'],
            params.constructorArguments
        ).slice(2); // remove '0x' prefix

        console.log('Encoded constructor arguments:', encodedConstructorArgs);

        const verificationData = new FormData();
        verificationData.append('apikey', etherscanApiKey);
        verificationData.append('module', 'contract');
        verificationData.append('action', 'verifysourcecode');
        verificationData.append('contractaddress', params.address);
        verificationData.append('sourceCode', sourceCode);
        verificationData.append('codeformat', 'solidity-single-file');
        verificationData.append('contractname', 'Attestation');
        verificationData.append('compilerversion', 'v0.8.17+commit.8df45f5f'); // Make sure this matches your compiler version
        verificationData.append('optimizationUsed', '1');
        verificationData.append('runs', '200');
        verificationData.append('constructorArguements', encodedConstructorArgs);

        console.log('Sending verification request to Etherscan...');

        const response = await axios.post(apiUrl, verificationData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        console.log('Received response from Etherscan:', response.data);

        if (response.data.status === '1') {
            console.log('Contract verification submitted successfully:', response.data.result);
            return true;
        } else {
            console.error('Contract verification failed:', response.data.result);
            return false;
        }
    } catch (error) {
        console.error('Error verifying contract:', error);
        return false;
    }
}
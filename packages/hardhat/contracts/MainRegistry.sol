//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";

contract MainRegistry {
	using Counters for Counters.Counter;
	Counters.Counter private _attestationIds;
	Counters.Counter private _userIds;

	struct WalletAddress {
		address userAddress;
		uint256[] attestationIds;
		bool isVerified;
	}

	struct UserProfile {
		uint256 userId;
		string userName;
		address[] wallets;
	}

	address public owner;
	mapping(address => bool) public authorizedAddresses;
	mapping(uint256 => UserProfile) public users; // userId -> UserProfile
	mapping(address => uint256) public walletToUserId; // wallet -> userId
	mapping(address => WalletAddress) public wallets; // wallet -> WalletAddress
	mapping(uint256 => address) public attestationAddresses;

	uint256 public constant MAX_ATTESTATIONS_PER_WALLET = 100; // Example limit

	modifier onlyOwner() {
		require(msg.sender == owner, "Only the owner can perform this action");
		_;
	}

	modifier onlyAuthorized() {
		require(authorizedAddresses[msg.sender], "Not authorized");
		_;
	}

	event UserRegistered(uint256 indexed userId, string userName);
	event WalletAdded(uint256 indexed userId, address indexed wallet);
	event AttestationCreated(
		uint256 indexed attestationId,
		address attestationAddress
	);
	event AttestationAddedToWallet(
		address indexed wallet,
		uint256 attestationId
	);
	event UserNameUpdated(uint256 indexed userId, string newUserName);
	event WalletVerified(address indexed wallet);

	constructor(address _owner) {
		owner = _owner;
		authorizedAddresses[owner] = true;

		_userIds.increment();
		uint256 newUserId = _userIds.current();
		users[newUserId] = UserProfile({
			userId: newUserId,
			userName: "p0nk",
			wallets: new address[](0)
		});
		_addWalletToUser(newUserId, _owner);
	}

	function _addWalletToUser(uint256 _userId, address _wallet) private {
		require(
			walletToUserId[_wallet] == 0,
			"Wallet already associated with a user"
		);

		users[_userId].wallets.push(_wallet);
		walletToUserId[_wallet] = _userId;
		wallets[_wallet] = WalletAddress({
			userAddress: _wallet,
			attestationIds: new uint256[](0),
			isVerified: false
		});

		emit WalletAdded(_userId, _wallet);
	}

	function registerUser(string memory _userName) external returns (uint256) {
		require(
			walletToUserId[msg.sender] == 0,
			"Wallet already associated with a user"
		);

		_userIds.increment();
		uint256 newUserId = _userIds.current();
		users[newUserId] = UserProfile({
			userId: newUserId,
			userName: _userName,
			wallets: new address[](0)
		});

		_addWalletToUser(newUserId, msg.sender);

		emit UserRegistered(newUserId, _userName);
		return newUserId;
	}

	function addWalletToUser(address _newWallet) external {
		uint256 userId = walletToUserId[msg.sender];
		require(userId != 0, "User not registered");
		_addWalletToUser(userId, _newWallet);
	}

	function addAuthorizedAddress(address _address) external onlyOwner {
		authorizedAddresses[_address] = true;
	}

	function removeAuthorizedAddress(address _address) external onlyOwner {
		authorizedAddresses[_address] = false;
	}

	function verifyWallet(address _wallet) external onlyAuthorized {
		require(
			walletToUserId[_wallet] != 0,
			"Wallet not associated with any user"
		);
		wallets[_wallet].isVerified = true;
		emit WalletVerified(_wallet);
	}

	function isWalletVerified(address _wallet) public view returns (bool) {
		return wallets[_wallet].isVerified;
	}

	function addAttestation(
		address _attestationAddress,
		address[] memory _participants
	) external onlyAuthorized {
		_attestationIds.increment();
		uint256 _newAttestationId = _attestationIds.current();
		attestationAddresses[_newAttestationId] = _attestationAddress;

		for (uint i = 0; i < _participants.length; i++) {
			address wallet = _participants[i];
			WalletAddress storage walletAddr = wallets[wallet];
			require(
				walletAddr.attestationIds.length < MAX_ATTESTATIONS_PER_WALLET,
				"Max attestations reached for this wallet"
			);
			walletAddr.attestationIds.push(_newAttestationId);
			emit AttestationAddedToWallet(wallet, _newAttestationId);
		}

		emit AttestationCreated(_newAttestationId, _attestationAddress);
	}

	function updateUserName(string memory _newUserName) external {
		require(bytes(_newUserName).length > 0, "Username cannot be empty");
		uint256 userId = walletToUserId[msg.sender];
		require(userId != 0, "User not registered");

		users[userId].userName = _newUserName;
		emit UserNameUpdated(userId, _newUserName);
	}

	function getAttestationCount() external view returns (uint256) {
		return _attestationIds.current();
	}

	function getWalletAttestations(
		address _wallet,
		uint256 _offset,
		uint256 _limit
	) public view returns (uint256[] memory attestationIds) {
		WalletAddress storage walletAddr = wallets[_wallet];
		uint256[] storage allAttestations = walletAddr.attestationIds;
		uint256 total = allAttestations.length;

		require(_offset < total, "Offset out of bounds");

		uint256 end = _offset + _limit > total ? total : _offset + _limit;
		uint256 length = end - _offset;

		attestationIds = new uint256[](length);
		for (uint256 i = 0; i < length; i++) {
			attestationIds[i] = allAttestations[_offset + i];
		}

		return attestationIds;
	}

	function getWalletAttestationCount(
		address _wallet
	) public view returns (uint256) {
		return wallets[_wallet].attestationIds.length;
	}

	function getUserName(
		address _wallet
	) external view returns (string memory) {
		uint256 userId = walletToUserId[_wallet];
		require(userId != 0, "User not registered");
		return users[userId].userName;
	}

	function getUserWallets(
		uint256 _userId
	) public view returns (address[] memory) {
		require(users[_userId].userId != 0, "User does not exist");
		return users[_userId].wallets;
	}
}

//SPDX-License-Identifier: MIT

//--# to be tested (& deployed)
pragma solidity ^0.8.0;

/**
 * @title MainRegistry
 * @dev Decoland Dev Team
 * @notice
 *      This contract manages the registration and profile updates of users.
 *      It ensures that each user has a unique profile identified by their wallet address.
 *      The profile includes a name, wallet address, and a list of attestation IDs associated with the user.
 *      The contract provides functions for users to register (during attestation creation), update their profiles(only the name at any time),
 *      and add attestations to their profiles.
 */

import "@openzeppelin/contracts/utils/Counters.sol";

//Knowledge/Experience Recorder
//
//        _---~~(~~-_.
//      _{        )   )
//    ,   ) -~~- ( ,-' )_
//   (  `-,_..`., )-- '_,)
//  ( ` _)  (  -~( -_ `,  }
//  (_-  _  ~_-~~~~`,  ,' )
//    `~ -^(    __;-,((()))
//          ~~~~ {_ -_(())
//                 `\  }
//                   { }

//temporary:: to add possibility to verify an user by an administrator
contract MainRegistry {
	using Counters for Counters.Counter;
	Counters.Counter private _attestationIds; //counter for generating attestationIds

	struct UserProfile {
		address userAddress;
		string userName;
		uint256[] attestationIds;
		bool isVerified;
	}

	address public owner;
	mapping(address => bool) public authorizedAddresses; //To add attestations
	mapping(address => UserProfile) public users; // wAddr -> UserProfile struct
	mapping(uint256 => address) public attestationAddresses; // attestationId -> SmartContract of Attestation

	modifier onlyOwner() {
		require(msg.sender == owner, "Only the owner can perform this action");
		_;
	}
	modifier onlyAuthorized() {
		require(authorizedAddresses[msg.sender], "Not authorized");
		_;
	}

	event UserRegistered(address indexed userAddress, string userName);
	event AttestationCreated(
		uint256 indexed attestationId,
		address attestationAddress
	);
	event AttestationAddedToUser(
		address indexed userAddress,
		uint256 attestationId
	);
	event UserNameUpdated(address indexed userAddress, string newUserName);

	constructor(address _owner) {
		owner = _owner;
		authorizedAddresses[owner] = true;

		users[_owner] = UserProfile({
			userAddress: _owner,
			userName: "p0nk",
			attestationIds: new uint256[](0),
			isVerified: true
		}); //Only for testing purpose
	}

	function _registerUser(
		address _userAddress,
		string memory _userName
	) private {
		require(
			users[_userAddress].userAddress == address(0),
			"User already registered"
		);

		users[_userAddress] = UserProfile({
			userAddress: _userAddress,
			userName: _userName,
			attestationIds: new uint256[](0),
			isVerified: false
		});

		emit UserRegistered(_userAddress, _userName);
	}

	function addAuthorizedAddress(address _address) external onlyOwner {
		authorizedAddresses[_address] = true;
	}

	function removeAuthorizedAddress(address _address) external onlyOwner {
		authorizedAddresses[_address] = false;
	}

	//only team can "verify" an user
	function verifyUser(address _address) external onlyAuthorized {
		users[_address].isVerified = true;
	}

	//Only attestationFactory can add attestation)
	function addAttestation(
		address _attestationAddress,
		address[] memory _participants
	) external onlyAuthorized {
		_attestationIds.increment();
		uint256 _newAttestationId = _attestationIds.current();
		attestationAddresses[_newAttestationId] = _attestationAddress; //link attestationId <-> SmartContract Addr

		//IS THERE A PBLM HERE ? BECAUSE users[] get updated but we push in user
		for (uint i = 0; i < _participants.length; i++) {
			UserProfile storage user = users[_participants[i]];
			if (user.userAddress == address(0)) {
				_registerUser(_participants[i], ""); // Register with empty name if user doesn't exist yet
			}
			users[_participants[i]].attestationIds.push(_newAttestationId);
			emit AttestationAddedToUser(_participants[i], _newAttestationId);
		}

		emit AttestationCreated(_newAttestationId, _attestationAddress);
	}

	function updateUserName(string memory _newUserName) external {
		require(bytes(_newUserName).length > 0, "Username cannot be empty");
		require(
			users[msg.sender].userAddress != address(0),
			"User not registered"
		);

		// Ensure the user is updating their own profile
		require(
			msg.sender == users[msg.sender].userAddress,
			"Can only update own profile"
		);

		users[msg.sender].userName = _newUserName;
		emit UserNameUpdated(msg.sender, _newUserName);
	}

	//#GETTERS#\\

	//Total attestations created so far
	function getAttestationCount() external view returns (uint256) {
		return _attestationIds.current();
	}

	function getUserAttestations(
		address _user
	) external view returns (uint256[] memory) {
		return users[_user].attestationIds;
	}

	function getUserName(address _user) external view returns (string memory) {
		return users[_user].userName;
	}
}

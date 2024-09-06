pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * 'onlyOwner', which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * 'onlyOwner' functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account ('newOwner').
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account ('newOwner').
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/security/ReentrancyGuard.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (security/ReentrancyGuard.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from 'ReentrancyGuard' will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single 'nonReentrant' guard, functions marked as
 * 'nonReentrant' may not call one another. This can be worked around by making
 * those functions 'private', and then adding 'external' 'nonReentrant' entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a 'nonReentrant' function from another 'nonReentrant'
     * function is not supported. It is possible to prevent this from happening
     * by making the 'nonReentrant' function external, and making it call a
     * 'private' function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be _NOT_ENTERED
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * 'nonReentrant' function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}


// File @openzeppelin/contracts/utils/math/SafeMath.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (utils/math/SafeMath.sol)

pragma solidity ^0.8.0;

// CAUTION
// This version of SafeMath should only be used with Solidity 0.8 or later,
// because it relies on the compiler's built in overflow checks.

/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: 'SafeMath' is generally not needed starting with Solidity 0.8, since the compiler
 * now has built in overflow checking.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's '+' operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's '-' operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's '*' operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's '/' operator.
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's '%' operator. This function uses a 'revert'
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's '-' operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's '/' operator. Note: this function uses a
     * 'revert' opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's '%' operator. This function uses a 'revert'
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}


// File @openzeppelin/contracts/utils/Counters.sol@v4.9.3

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Counters.sol)

pragma solidity ^0.8.0;

/**
 * @title Counters
 * @author Matt Condon (@shrugs)
 * @dev Provides counters that can only be incremented, decremented or reset. This can be used e.g. to track the number
 * of elements in a mapping, issuing ERC721 ids, or counting request ids.
 *
 * Include with 'using Counters for Counters.Counter;'
 */
library Counters {
    struct Counter {
        // This variable should never be directly accessed by users of the library: interactions must be restricted to
        // the library's function. As of Solidity v0.5.2, this cannot be enforced, though there is a proposal to add
        // this feature: see https://github.com/ethereum/solidity/issues/4637
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        unchecked {
            counter._value += 1;
        }
    }

    function decrement(Counter storage counter) internal {
        uint256 value = counter._value;
        require(value > 0, "Counter: decrement overflow");
        unchecked {
            counter._value = value - 1;
        }
    }

    function reset(Counter storage counter) internal {
        counter._value = 0;
    }
}


// File contracts/MainRegistry.sol

// Original license: SPDX_License_Identifier: MIT

pragma solidity ^0.8.0;
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

	function registerUser(
		string memory _userName
	) external onlyAuthorized returns (uint256) {
		if (walletToUserId[msg.sender] != 0) {
			// User already registered, return existing userId
			return walletToUserId[msg.sender];
		}

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

	function addWalletToUser(address _newWallet) external onlyAuthorized {
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

		// Ensure the caller is associated with this user account
		require(
			users[userId].wallets.length > 0,
			"No wallets associated with this user"
		);
		bool isAuthorized = false;
		for (uint i = 0; i < users[userId].wallets.length; i++) {
			if (users[userId].wallets[i] == msg.sender) {
				isAuthorized = true;
				break;
			}
		}
		require(isAuthorized, "Not authorized to update this user's name");

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
		require(
			walletToUserId[_wallet] != 0,
			"Wallet not associated with any user"
		);
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


// File contracts/AttestationFactory.sol

// Original license: SPDX_License_Identifier: MIT
//--# to be tested (& deployed)

/**
 * @title AttestationFactory
 * @dev Decoland Dev Team
 * @notice
 *      The AttestationFactory contract is responsible for creating new attestation contracts.
 *      It interacts with the UserRegistry to ensure that all contributors are registered users.
 *      When a new attestation is created, it registers any new contributors and links the attestation to their profiles.
 *      The contract emits events for the creation of attestations and for adding attestations to user profiles.
 */

pragma solidity ^0.8.0;
// #ATTESTATION CONTRACT
/**
 *      The Attestation contract represents an individual attestation (a "knowledge production").
 *      It holds the details of the attestation, including title, URL, IPFS hash, previous/related/quoted attestation ID (work/knwoledge production), tags, authors, and contributors
 *      Contributors must sign the attestation to activate it.
 *      The contract also handles contributions (donations or co-publishing 'donations'), upvotes, and the distribution (equally) of funds among contributors.
 */
contract Attestation is ReentrancyGuard {
	using SafeMath for uint256;
	MainRegistry public mainRegistry;

	address[] private authors;
	string public authorName;
	address[] private contributors;
	string public ipfsHash;
	string public title;
	address[] private quotedAttestationId; //related/quoted previous work/attestationID to create links
	string[] private tags;
	uint256 public coPublishThreshold;
	uint256 public verificationThreshold;

	mapping(address => bool) public hasSigned;
	uint256 public signatureCount;
	bool public isActivated;

	mapping(address => bool) public isCoPublisher;
	address[] private coPublishers;

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
		string memory _authorName,
		address[] memory _contributors,
		string memory _title,
		string memory _ipfsHash,
		address[] memory _quotedAttestationId,
		string[] memory _tags,
		uint256 _coPublishThreshold,
		uint256 _verificationThreshold
	) {
		mainRegistry = MainRegistry(_mainRegistryAddress);
		authors = _authors;
		authorName = _authorName;
		contributors = _contributors;
		ipfsHash = _ipfsHash;
		title = _title;
		quotedAttestationId = _quotedAttestationId;
		tags = _tags;
		coPublishThreshold = _coPublishThreshold;
		verificationThreshold = _verificationThreshold;
		// Automatically sign the contract for the first author
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

	//missing amount for donation (and if the fund > threshold => co-publisher ?)
	// Creditation as a co-publisher, no rights attached to it !!
	function donate(uint256 amount) external payable {
		require(
			msg.value == amount,
			"Sent value does not match specified amount"
		);
		require(amount > 0, "No funds sent");

		distributeFunds(amount);

		emit FundsReceived(msg.sender, amount);

		// Check if the donation amount meets the co-publishing threshold
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

	//Contributors here are author+co-authors+contributors
	function isContributor(address _address) public view returns (bool) {
		// Check in the contributors array
		for (uint i = 0; i < contributors.length; i++) {
			if (contributors[i] == _address) {
				return true;
			}
		}

		// Check if the address is an author
		return isAuthor(_address);
	}

	//Any contributor can revoke his/her affiliation (only if not signed)
	function revokeAffiliation() external {
		require(isContributor(msg.sender), "Not a contributor or author");
		require(!hasSigned[msg.sender], "Cannot revoke after signing");

		bool found = false;

		// Remove from contributors array
		for (uint i = 0; i < contributors.length; i++) {
			if (contributors[i] == msg.sender) {
				contributors[i] = contributors[contributors.length - 1];
				contributors.pop();
				found = true;
				break;
			}
		}

		// If not found in contributors, check in authors array
		if (!found) {
			for (uint i = 0; i < authors.length; i++) {
				if (authors[i] == msg.sender) {
					authors[i] = authors[authors.length - 1];
					authors.pop();
					break;
				}
			}
		}

		// Clear any unclaimed funds
		unclaimedFunds[msg.sender] = 0;

		emit AffiliationRevoked(msg.sender);
	}

	// Getter functions for arrays
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
		returns (address[] memory)
	{
		return quotedAttestationId;
	}
}

// #ATTESTATION FACTORY CONTRACT
contract AttestationFactory is Ownable {
	MainRegistry public mainRegistry;
	uint256 public _verificationThreshold = 0.05 ether;
	mapping(address => bool) public authorizedAddresses;

	event AttestationCreated(
		address indexed attestationAddress,
		address[] authors,
		address[] contributors,
		string authorName,
		string title
	);
	event VerificationThresholdUpdated(
		uint256 oldThreshold,
		uint256 newThreshold
	);
	event AuthorizedAddressAdded(address indexed newAuthorized);
	event AuthorizedAddressRemoved(address indexed removedAuthorized);

	constructor(address _mainRegistryAddress) {
		mainRegistry = MainRegistry(_mainRegistryAddress);
		authorizedAddresses[msg.sender] = true;
	}

	modifier onlyAuthorized() {
		require(authorizedAddresses[msg.sender], "Not authorized");
		_;
	}

	function setVerificationThreshold(
		uint256 newThreshold
	) external onlyAuthorized {
		uint256 oldThreshold = _verificationThreshold;
		_verificationThreshold = newThreshold;
		emit VerificationThresholdUpdated(oldThreshold, newThreshold);
	}

	function addAuthorizedAddress(address newAuthorized) external onlyOwner {
		require(
			!authorizedAddresses[newAuthorized],
			"Address already authorized"
		);
		authorizedAddresses[newAuthorized] = true;
		emit AuthorizedAddressAdded(newAuthorized);
	}

	function removeAuthorizedAddress(
		address authorizedToRemove
	) external onlyOwner {
		require(
			authorizedAddresses[authorizedToRemove],
			"Address not authorized"
		);
		authorizedAddresses[authorizedToRemove] = false;
		emit AuthorizedAddressRemoved(authorizedToRemove);
	}

	function createAttestation(
		address[] memory _authors,
		string memory _authorName,
		address[] memory _contributors,
		string memory _ipfsHash,
		string memory _title,
		address[] memory _quotedAttestationId,
		string[] memory _tags,
		uint256 _coPublishThreshold
	) external returns (address) {
		Attestation newAttestation = new Attestation(
			address(mainRegistry),
			_authors,
			_authorName,
			_contributors,
			_ipfsHash,
			_title,
			_quotedAttestationId,
			_tags,
			_coPublishThreshold,
			_verificationThreshold
		);

		address attestationAddress = address(newAttestation);

		address[] memory allParticipants = new address[](
			_authors.length + _contributors.length
		);
		for (uint i = 0; i < _authors.length; i++) {
			allParticipants[i] = _authors[i];
		}
		for (uint i = 0; i < _contributors.length; i++) {
			allParticipants[_authors.length + i] = _contributors[i];
		}

		// Ensure all participants are registered in the MainRegistry
		for (uint i = 0; i < allParticipants.length; i++) {
			if (mainRegistry.walletToUserId(allParticipants[i]) == 0) {
				// If the wallet is not associated with any user, create a new user with an empty username
				mainRegistry.registerUser("");
			}
		}

		mainRegistry.addAttestation(attestationAddress, allParticipants);
		emit AttestationCreated(attestationAddress, _authors, _contributors, _authorName, _title);
		return attestationAddress;
	}
}

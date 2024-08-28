// services/contractVerification.ts

import axios from 'axios';
import { ethers } from 'ethers';

interface VerificationParams {
    address: string;
    constructorArguments: any[];
}


const etherscanApiKey = "WWTCFZJ1V583QP6E1AQ3PTWNXPBDI3ZPRI";

//source code from deployed and verified smart contract ;)
const sourceCode = `pragma solidity ^0.8.0;
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

pragma solidity ^0.8.0;

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    constructor() {
        _transferOwnership(_msgSender());
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

pragma solidity ^0.8.0;

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

    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == _ENTERED;
    }
}


pragma solidity ^0.8.0;

// CAUTION
// This version of SafeMath should only be used with Solidity 0.8 or later,
// because it relies on the compiler's built in overflow checks.

library SafeMath {

    function tryAdd(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    function trySub(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    function tryMul(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
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

    function tryDiv(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    function tryMod(
        uint256 a,
        uint256 b
    ) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}

pragma solidity ^0.8.0;

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


// Original license: SPDX_License_Identifier: MIT

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

    address[] public authors;
    address[] public contributors;
    string public ipfsHash;
    uint256[] public quotedAttestationId; //related/quoted previous work/attestationID to create links
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
        returns (uint256[] memory)
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
        address[] contributors
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
        address[] memory _contributors,
        string memory _ipfsHash,
        uint256[] memory _quotedAttestationId,
        string[] memory _tags,
        uint256 _coPublishThreshold
    ) external returns (address) {
        Attestation newAttestation = new Attestation(
            address(mainRegistry),
            _authors,
            _contributors,
            _ipfsHash,
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
        emit AttestationCreated(attestationAddress, _authors, _contributors);
        return attestationAddress;
    }
}
`;

//replace with : https://api.etherscan.io/api for mainnet; sepolia: https://api-sepolia.etherscan.io/api
export async function verifyContract(params: VerificationParams): Promise<string | false> {
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
            return response.data.result; // Return the GUID
        } else {
            console.error('Contract verification submission failed:', response.data.result);
            return false;
        }
    } catch (error) {
        console.error('Error verifying contract:', error);
        return false;
    }
}

export async function checkVerificationStatus(guid: string): Promise<'Pending' | 'Pass' | 'Fail'> {
    const apiUrl = 'https://api-sepolia.etherscan.io/api';

    try {
        const response = await axios.get(apiUrl, {
            params: {
                apikey: etherscanApiKey,
                module: 'contract',
                action: 'checkverifystatus',
                guid: guid
            }
        });

        if (response.data.status === '1') {
            return response.data.result as 'Pending' | 'Pass' | 'Fail';
        } else {
            console.error('Error checking verification status:', response.data.result);
            return 'Pending';
        }
    } catch (error) {
        console.error('Error checking verification status:', error);
        return 'Pending';
    }
}
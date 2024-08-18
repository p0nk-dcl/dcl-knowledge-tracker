import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MainRegistry } from "../typechain-types";
import { getRandomAccounts } from "./helpers/account";

describe("MainRegistry", function () {
    let mainRegistry: MainRegistry;
    let owner: SignerWithAddress;
    let authorizedAddress: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    beforeEach(async function () {
        [owner, authorizedAddress, user1, user2, user3] = await getRandomAccounts(5);
        const MainRegistryFactory = await ethers.getContractFactory("MainRegistry");
        mainRegistry = await MainRegistryFactory.deploy(await owner.getAddress());
        await mainRegistry.waitForDeployment();

        // Authorize an address to register users
        await mainRegistry.connect(owner).addAuthorizedAddress(await authorizedAddress.getAddress());
    });

    describe("Deployment", function () {
        it("should set the correct owner", async function () {
            expect(await mainRegistry.owner()).to.equal(await owner.getAddress());
        });

        it("should register the owner as the first user", async function () {
            const userId = await mainRegistry.walletToUserId(await owner.getAddress());
            expect(userId).to.equal(1);

            const userProfile = await mainRegistry.users(userId);
            expect(userProfile.userName).to.equal("p0nk");
        });
    });

    describe("User Registration", function () {
        it("should register a new user", async function () {
            const tx = await mainRegistry.connect(authorizedAddress).registerUser("User1");
            await tx.wait();

            const userId = await mainRegistry.walletToUserId(await authorizedAddress.getAddress());
            expect(userId).to.be.gt(1); // Greater than 1 because owner is the first user

            const userProfile = await mainRegistry.users(userId);
            expect(userProfile.userName).to.equal("User1");
            const userWallets = await mainRegistry.getUserWallets(userId);
            expect(userWallets).to.deep.equal([await authorizedAddress.getAddress()]);

            await expect(tx)
                .to.emit(mainRegistry, 'UserRegistered')
                .withArgs(userId, "User1");
        });

        it("should not allow unauthorized addresses to register users", async function () {
            await expect(mainRegistry.connect(user1).registerUser("User1"))
                .to.be.revertedWith("Not authorized");
        });

        it("should return existing userId for already registered user", async function () {
            await mainRegistry.connect(authorizedAddress).registerUser("User1");
            const firstUserId = await mainRegistry.walletToUserId(await authorizedAddress.getAddress());

            const tx = await mainRegistry.connect(authorizedAddress).registerUser("User1Again");
            const secondUserId = await mainRegistry.walletToUserId(await authorizedAddress.getAddress());

            expect(firstUserId).to.equal(secondUserId);
        });
    });

    describe("User Management", function () {
        beforeEach(async function () {
            await mainRegistry.connect(authorizedAddress).registerUser("User1");
        });

        it("should update user name", async function () {
            const newName = "Alice";
            const tx = await mainRegistry.connect(authorizedAddress).updateUserName(newName);
            await tx.wait();

            const userId = await mainRegistry.walletToUserId(await authorizedAddress.getAddress());
            const userProfile = await mainRegistry.users(userId);
            expect(userProfile.userName).to.equal(newName);

            await expect(tx)
                .to.emit(mainRegistry, 'UserNameUpdated')
                .withArgs(userId, newName);
        });

        it("should not update user name if not registered", async function () {
            await expect(mainRegistry.connect(user1).updateUserName("Hacker"))
                .to.be.revertedWith("User not registered");
        });

        it("should add a wallet to an existing user", async function () {
            const userId = await mainRegistry.walletToUserId(await authorizedAddress.getAddress());

            const tx = await mainRegistry.connect(authorizedAddress).addWalletToUser(await user1.getAddress());
            await tx.wait();

            const userWallets = await mainRegistry.getUserWallets(userId);
            expect(userWallets).to.deep.equal([await authorizedAddress.getAddress(), await user1.getAddress()]);

            const newWalletUserId = await mainRegistry.walletToUserId(await user1.getAddress());
            expect(newWalletUserId).to.equal(userId);

            await expect(tx)
                .to.emit(mainRegistry, 'WalletAdded')
                .withArgs(userId, await user1.getAddress());
        });

        it("should not add a wallet that's already associated with a user", async function () {
            await mainRegistry.connect(authorizedAddress).addWalletToUser(await user1.getAddress());
            await expect(mainRegistry.connect(authorizedAddress).addWalletToUser(await user1.getAddress()))
                .to.be.revertedWith("Wallet already associated with a user");
        });
    });

    describe("Wallet Verification", function () {
        beforeEach(async function () {
            await mainRegistry.connect(authorizedAddress).registerUser("User1");
        });

        it("should verify a wallet", async function () {
            const tx = await mainRegistry.connect(owner).verifyWallet(await authorizedAddress.getAddress());
            await tx.wait();

            expect(await mainRegistry.isWalletVerified(await authorizedAddress.getAddress())).to.be.true;

            await expect(tx)
                .to.emit(mainRegistry, 'WalletVerified')
                .withArgs(await authorizedAddress.getAddress());
        });

        it("should not allow non-authorized addresses to verify wallets", async function () {
            await expect(mainRegistry.connect(user1).verifyWallet(await authorizedAddress.getAddress()))
                .to.be.revertedWith("Not authorized");
        });

        it("should not verify a wallet that's not associated with any user", async function () {
            await expect(mainRegistry.connect(owner).verifyWallet(await user1.getAddress()))
                .to.be.revertedWith("Wallet not associated with any user");
        });
    });

    describe("Attestation Management", function () {
        beforeEach(async function () {
            // Register users using the authorized address
            await mainRegistry.connect(authorizedAddress).registerUser("User1");
            await mainRegistry.connect(authorizedAddress).addWalletToUser(await user1.getAddress());
            await mainRegistry.connect(authorizedAddress).registerUser("User2");
            await mainRegistry.connect(authorizedAddress).addWalletToUser(await user2.getAddress());
        });

        it("should add an attestation", async function () {
            const attestationAddress = await user3.getAddress();
            const tx = await mainRegistry.connect(authorizedAddress).addAttestation(
                attestationAddress,
                [await user1.getAddress(), await user2.getAddress()]
            );
            await tx.wait();

            const user1AttestationCount = await mainRegistry.getWalletAttestationCount(await user1.getAddress());
            const user2AttestationCount = await mainRegistry.getWalletAttestationCount(await user2.getAddress());

            expect(user1AttestationCount).to.equal(1);
            expect(user2AttestationCount).to.equal(1);

            const user1Attestations = await mainRegistry.getWalletAttestations(await user1.getAddress(), 0, 10);
            const user2Attestations = await mainRegistry.getWalletAttestations(await user2.getAddress(), 0, 10);

            expect(user1Attestations).to.deep.equal([1n]);
            expect(user2Attestations).to.deep.equal([1n]);

            await expect(tx)
                .to.emit(mainRegistry, 'AttestationCreated')
                .withArgs(1, attestationAddress);

            await expect(tx)
                .to.emit(mainRegistry, 'AttestationAddedToWallet')
                .withArgs(await user1.getAddress(), 1);

            await expect(tx)
                .to.emit(mainRegistry, 'AttestationAddedToWallet')
                .withArgs(await user2.getAddress(), 1);
        });

        it("should not allow non-authorized addresses to add attestations", async function () {
            await expect(mainRegistry.connect(user1).addAttestation(await user3.getAddress(), [await user1.getAddress()]))
                .to.be.revertedWith("Not authorized");
        });

        it("should not exceed the maximum attestations per wallet", async function () {
            const attestationAddress = await user3.getAddress();
            const maxAttestations = await mainRegistry.MAX_ATTESTATIONS_PER_WALLET();

            for (let i = 0; i < maxAttestations; i++) {
                await mainRegistry.connect(authorizedAddress).addAttestation(attestationAddress, [await authorizedAddress.getAddress()]);
            }

            await expect(mainRegistry.connect(authorizedAddress).addAttestation(attestationAddress, [await authorizedAddress.getAddress()]))
                .to.be.revertedWith("Max attestations reached for this wallet");
        });
    });

    describe("Authorization Management", function () {
        it("should add an authorized address", async function () {
            const tx = await mainRegistry.connect(owner).addAuthorizedAddress(await user1.getAddress());
            await tx.wait();

            expect(await mainRegistry.authorizedAddresses(await user1.getAddress())).to.be.true;
        });

        it("should remove an authorized address", async function () {
            await mainRegistry.connect(owner).addAuthorizedAddress(await user1.getAddress());
            const tx = await mainRegistry.connect(owner).removeAuthorizedAddress(await user1.getAddress());
            await tx.wait();

            expect(await mainRegistry.authorizedAddresses(await user1.getAddress())).to.be.false;
        });

        it("should not allow non-owners to add authorized addresses", async function () {
            await expect(mainRegistry.connect(user1).addAuthorizedAddress(await user2.getAddress()))
                .to.be.revertedWith("Only the owner can perform this action");
        });

        it("should not allow non-owners to remove authorized addresses", async function () {
            await mainRegistry.connect(owner).addAuthorizedAddress(await user1.getAddress());
            await expect(mainRegistry.connect(user2).removeAuthorizedAddress(await user1.getAddress()))
                .to.be.revertedWith("Only the owner can perform this action");
        });
    });
});
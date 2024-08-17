import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MainRegistry } from "../typechain-types";

describe("MainRegistry", function () {
    let mainRegistry: MainRegistry;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();
        const MainRegistryFactory = await ethers.getContractFactory("MainRegistry");
        mainRegistry = await MainRegistryFactory.deploy(await owner.getAddress());
        await mainRegistry.waitForDeployment();
    });

    it("should register a new user", async function () {
        const tx = await mainRegistry.connect(user1).registerUser("User1");
        await tx.wait();

        const userId = await mainRegistry.walletToUserId(await user1.getAddress());
        expect(userId).to.be.gt(0);

        const userProfile = await mainRegistry.users(userId);
        expect(userProfile.userName).to.equal("User1");
        expect(userProfile[2]).to.deep.equal([await user1.getAddress()]);

        await expect(tx)
            .to.emit(mainRegistry, 'UserRegistered')
            .withArgs(userId, "User1");
    });

    it("should update user name", async function () {
        await mainRegistry.connect(user1).registerUser("User1");
        const newName = "Alice";
        const tx = await mainRegistry.connect(user1).updateUserName(newName);
        await tx.wait();

        const userId = await mainRegistry.walletToUserId(await user1.getAddress());
        const userProfile = await mainRegistry.users(userId);
        expect(userProfile.userName).to.equal(newName);

        await expect(tx)
            .to.emit(mainRegistry, 'UserNameUpdated')
            .withArgs(userId, newName);
    });

    it("should verify a wallet", async function () {
        await mainRegistry.connect(user1).registerUser("User1");
        await mainRegistry.verifyWallet(await user1.getAddress());

        expect(await mainRegistry.isWalletVerified(await user1.getAddress())).to.be.true;
    });

    it("should add an attestation", async function () {
        const attestationAddress = await user3.getAddress();
        await mainRegistry.connect(user1).registerUser("User1");
        await mainRegistry.connect(user2).registerUser("User2");

        const tx = await mainRegistry.addAttestation(attestationAddress, [await user1.getAddress(), await user2.getAddress()]);
        await tx.wait();

        const user1Id = await mainRegistry.walletToUserId(await user1.getAddress());
        const user2Id = await mainRegistry.walletToUserId(await user2.getAddress());

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

    it("should add a wallet to an existing user", async function () {
        await mainRegistry.connect(user1).registerUser("User1");
        const userId = await mainRegistry.walletToUserId(await user1.getAddress());

        const newWallet = user2;
        await mainRegistry.connect(user1).addWalletToUser(await newWallet.getAddress());

        const userWallets = await mainRegistry.getUserWallets(userId);
        expect(userWallets).to.deep.equal([await user1.getAddress(), await newWallet.getAddress()]);

        const newWalletUserId = await mainRegistry.walletToUserId(await newWallet.getAddress());
        expect(newWalletUserId).to.equal(userId);
    });

    it("should handle attestations for multiple wallets of the same user", async function () {
        await mainRegistry.connect(user1).registerUser("User1");
        await mainRegistry.connect(user1).addWalletToUser(await user2.getAddress());

        const attestationAddress1 = await user3.getAddress();
        const attestationAddress2 = await owner.getAddress();

        await mainRegistry.addAttestation(attestationAddress1, [await user1.getAddress()]);
        await mainRegistry.addAttestation(attestationAddress2, [await user2.getAddress()]);

        const userId = await mainRegistry.walletToUserId(await user1.getAddress());

        const wallet1Attestations = await mainRegistry.getWalletAttestations(await user1.getAddress(), 0, 10);
        const wallet2Attestations = await mainRegistry.getWalletAttestations(await user2.getAddress(), 0, 10);

        expect(wallet1Attestations).to.deep.equal([1n]);
        expect(wallet2Attestations).to.deep.equal([2n]);
    });
});
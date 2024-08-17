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
        const tx = await mainRegistry.addAttestation(await user3.getAddress(), [await user1.getAddress()]);
        await tx.wait();

        const userProfile = await mainRegistry.users(await user1.getAddress());
        expect(userProfile.userAddress).to.equal(await user1.getAddress());
        expect(userProfile.userName).to.equal("");
        expect(userProfile.isVerified).to.be.false;

        await expect(tx)
            .to.emit(mainRegistry, 'UserRegistered')
            .withArgs(await user1.getAddress(), "");
    });

    it("should update user name", async function () {
        await mainRegistry.addAttestation(await user3.getAddress(), [await user1.getAddress()]);
        const newName = "Alice";
        const tx = await mainRegistry.connect(user1).updateUserName(newName);
        await tx.wait();

        const userProfile = await mainRegistry.users(await user1.getAddress());
        expect(userProfile.userName).to.equal(newName);

        await expect(tx)
            .to.emit(mainRegistry, 'UserNameUpdated')
            .withArgs(await user1.getAddress(), newName);
    });

    it("should verify a user", async function () {
        await mainRegistry.addAttestation(await user3.getAddress(), [await user1.getAddress()]);
        await mainRegistry.verifyUser(await user1.getAddress());

        const userProfile = await mainRegistry.users(await user1.getAddress());
        expect(userProfile.isVerified).to.be.true;
    });

    it("should add an attestation", async function () {
        const attestationAddress = await user3.getAddress();
        const tx = await mainRegistry.addAttestation(attestationAddress, [await user1.getAddress(), await user2.getAddress()]);
        await tx.wait();

        const user1Profile = await mainRegistry.users(await user1.getAddress());
        const user2Profile = await mainRegistry.users(await user2.getAddress());

        // Log the entire user profile to see what we're getting
        console.log("User1 Profile:", user1Profile);
        console.log("User2 Profile:", user2Profile);

        // Check that user profiles are created correctly
        expect(user1Profile[0]).to.equal(await user1.getAddress());
        expect(user1Profile[1]).to.equal("");
        expect(user1Profile[2]).to.be.false;

        expect(user2Profile[0]).to.equal(await user2.getAddress());
        expect(user2Profile[1]).to.equal("");
        expect(user2Profile[2]).to.be.false;


        // Verify that we can retrieve the attestation IDs for each user
        const user1Attestations = await mainRegistry.getUserAttestations(await user1.getAddress());
        const user2Attestations = await mainRegistry.getUserAttestations(await user2.getAddress());

        console.log("user1Attestations :", user1Attestations);
        console.log("user2Attestations :", user2Attestations);

        expect(user1Attestations).to.deep.equal([1n]);
        expect(user2Attestations).to.deep.equal([1n]);


        await expect(tx)
            .to.emit(mainRegistry, 'AttestationCreated')
            .withArgs(1, attestationAddress);

        await expect(tx)
            .to.emit(mainRegistry, 'AttestationAddedToUser')
            .withArgs(await user1.getAddress(), 1);

        await expect(tx)
            .to.emit(mainRegistry, 'AttestationAddedToUser')
            .withArgs(await user2.getAddress(), 1);
    });
});
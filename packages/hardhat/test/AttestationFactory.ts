import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { MainRegistry, AttestationFactory, Attestation } from "../typechain-types";
import { ContractTransactionResponse, Log } from "ethers";
import { getRandomAccounts } from "./helpers/account";

describe("AttestationFactory", function () {
    let mainRegistry: MainRegistry;
    let attestationFactory: AttestationFactory;
    let owner: SignerWithAddress;
    let author1: SignerWithAddress;
    let author2: SignerWithAddress;
    let contributor1: SignerWithAddress;
    let contributor2: SignerWithAddress;
    let authorizedAddress: SignerWithAddress;

    beforeEach(async function () {
        [owner, author1, author2, contributor1, contributor2, authorizedAddress] = await getRandomAccounts(6);

        const MainRegistryFactory = await ethers.getContractFactory("MainRegistry");
        mainRegistry = await MainRegistryFactory.deploy(await owner.getAddress());
        await mainRegistry.waitForDeployment();

        const AttestationFactoryFactory = await ethers.getContractFactory("AttestationFactory");
        attestationFactory = await AttestationFactoryFactory.deploy(await mainRegistry.getAddress());
        await attestationFactory.waitForDeployment();

        await mainRegistry.connect(owner).addAuthorizedAddress(await attestationFactory.getAddress());
        await attestationFactory.connect(owner).addAuthorizedAddress(await authorizedAddress.getAddress());
    });

    it("should create a new attestation", async function () {
        const ipfsHash = "QmTest";
        const quotedAttestationId = [1n, 2n];
        const tags = ["tag1", "tag2"];
        const coPublishThreshold = ethers.parseEther("0.1");

        const tx: ContractTransactionResponse = await attestationFactory.connect(authorizedAddress).createAttestation(
            [await author1.getAddress(), await author2.getAddress()],
            [await contributor1.getAddress(), await contributor2.getAddress()],
            ipfsHash,
            quotedAttestationId,
            tags,
            coPublishThreshold
        );

        const receipt = await tx.wait();
        if (!receipt) throw new Error("Transaction failed");

        const attestationCreatedEvent = receipt.logs.find((log: Log) =>
            attestationFactory.interface.parseLog(log as any)?.name === "AttestationCreated"
        );
        if (!attestationCreatedEvent) throw new Error("AttestationCreated event not found");

        const parsedEvent = attestationFactory.interface.parseLog(attestationCreatedEvent as any);
        if (!parsedEvent) throw new Error("Failed to parse event");

        const attestationAddress = parsedEvent.args.attestationAddress;

        const AttestationFactory = await ethers.getContractFactory("Attestation");
        const attestation = AttestationFactory.attach(attestationAddress) as Attestation;

        expect(await attestation.ipfsHash()).to.equal(ipfsHash);
        expect(await attestation.coPublishThreshold()).to.equal(coPublishThreshold);

        const authors = await attestation.getAuthors();
        expect(authors).to.deep.equal([await author1.getAddress(), await author2.getAddress()]);

        const contributors = await attestation.getContributors();
        expect(contributors).to.deep.equal([await contributor1.getAddress(), await contributor2.getAddress()]);

        const retrievedTags = await attestation.getTags();
        expect(retrievedTags).to.deep.equal(tags);

        const retrievedQuotedAttestationIds = await attestation.getQuotesAttestationIds();
        expect(retrievedQuotedAttestationIds.map(id => Number(id))).to.deep.equal([1, 2]);
    });

    it("should allow signing and activating an attestation", async function () {
        const tx: ContractTransactionResponse = await attestationFactory.connect(authorizedAddress).createAttestation(
            [await author1.getAddress()],
            [await contributor1.getAddress()],
            "QmTest",
            [],
            [],
            ethers.parseEther("0.1")
        );

        const receipt = await tx.wait();
        if (!receipt) throw new Error("Transaction failed");

        const attestationCreatedEvent = receipt.logs.find((log: Log) =>
            attestationFactory.interface.parseLog(log as any)?.name === "AttestationCreated"
        );
        if (!attestationCreatedEvent) throw new Error("AttestationCreated event not found");

        const parsedEvent = attestationFactory.interface.parseLog(attestationCreatedEvent as any);
        if (!parsedEvent) throw new Error("Failed to parse event");

        const attestationAddress = parsedEvent.args.attestationAddress;

        const AttestationFactory = await ethers.getContractFactory("Attestation");
        const attestation = AttestationFactory.attach(attestationAddress) as Attestation;

        // Author1 is automatically signed
        expect(await attestation.hasSigned(await author1.getAddress())).to.be.true;

        // Contributor1 signs
        await attestation.connect(contributor1).sign();
        expect(await attestation.hasSigned(await contributor1.getAddress())).to.be.true;

        // Check if attestation is activated
        expect(await attestation.isActivated()).to.be.true;
    });

    it("should not allow unauthorized addresses to create attestations", async function () {
        await expect(attestationFactory.connect(contributor1).createAttestation(
            [await author1.getAddress()],
            [await contributor1.getAddress()],
            "QmTest",
            [],
            [],
            ethers.parseEther("0.1")
        )).to.be.revertedWith("Not authorized");
    });

    it("should allow owner to add and remove authorized addresses", async function () {
        await attestationFactory.connect(owner).addAuthorizedAddress(await contributor2.getAddress());
        expect(await attestationFactory.authorizedAddresses(await contributor2.getAddress())).to.be.true;

        await attestationFactory.connect(owner).removeAuthorizedAddress(await contributor2.getAddress());
        expect(await attestationFactory.authorizedAddresses(await contributor2.getAddress())).to.be.false;
    });

    it("should not allow non-owners to add or remove authorized addresses", async function () {
        await expect(attestationFactory.connect(contributor1).addAuthorizedAddress(await contributor2.getAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");

        await expect(attestationFactory.connect(contributor1).removeAuthorizedAddress(await authorizedAddress.getAddress()))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });
});
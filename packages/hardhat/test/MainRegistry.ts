import { expect } from "chai";
import { ethers } from "hardhat";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MainRegistry } from "../typechain-types";

describe("MainRegistry", function () {
    let mainRegistry: MainRegistry;
    let owner: any;
    let addr1: any;
    let addr2: any;

    before(async function () {
        // Get the Signers and Contract Factories
        [owner, addr1, addr2] = await ethers.getSigners();
        console.log('Signer MR1 address: ', owner.address);
        console.log('Signer MR2 address: ', addr1.address);
        console.log('Signer MR3 address: ', addr2.address);

        const MainRegistryFactory = await ethers.getContractFactory("MainRegistry");


        // Deploy the MainRegistry contract
        mainRegistry = (await MainRegistryFactory.deploy(owner.address)) as MainRegistry;
        await mainRegistry.waitForDeployment();
    });


    it("Should update the user name successfully", async function () {
        //console log the name before change and make sure its equal test jojo
        const tx = await mainRegistry.updateUserName("AliceUpdated");
        await expect(tx).to.emit(mainRegistry, "UserNameUpdated").withArgs(owner.address, "AliceUpdated");

        const userProfile = await mainRegistry.users(owner.address);
        expect(userProfile.userName).to.equal("AliceUpdated");
    });

    it("Should create an attestation and link it to a user", async function () {
        const tx = await mainRegistry.addAttestation(addr1.address, [owner.address, addr2.address]);
        const attestationId = await mainRegistry.getUserAttestations(owner.address); // Getting the latest attestation ID
        console.log('attestationId created: ', attestationId);

        await expect(tx).to.emit(mainRegistry, "AttestationCreated").withArgs(attestationId[0], addr1.address);

        // Check that the attestation ID is linked to the correct address
        const attestationAddress = await mainRegistry.attestationAddresses(attestationId[0]);
        expect(attestationAddress).to.equal(addr1.address);

        // Check that the user's profile includes this attestation ID
        const userProfile = await mainRegistry.users(owner.address);
        console.log("user profile name: ", userProfile.userName);
        console.log("user profile: ", userProfile.);
        expect(userProfile.attestationIds.length).to.equal(1); //to understand WHY ITS BUGGY :/ 
        expect(userProfile.attestationIds[0]).to.equal(attestationId);
    });

});

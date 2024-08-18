import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Starting deployment...");

    try {
        // Deploy MainRegistry
        console.log("Deploying MainRegistry...");
        const mainRegistryDeployment = await deploy('MainRegistry', {
            from: deployer,
            args: [deployer],
            log: true,
            waitConfirmations: 2,
        });

        console.log("MainRegistry deployed to:", mainRegistryDeployment.address);

        // Deploy AttestationFactory
        console.log("Deploying AttestationFactory...");
        const attestationFactoryDeployment = await deploy('AttestationFactory', {
            from: deployer,
            args: [mainRegistryDeployment.address],
            log: true,
            waitConfirmations: 2,
        });

        console.log("AttestationFactory deployed to:", attestationFactoryDeployment.address);

        // Add AttestationFactory as an authorized address in MainRegistry
        console.log("Authorizing AttestationFactory in MainRegistry...");
        const MainRegistry = await ethers.getContractAt('MainRegistry', mainRegistryDeployment.address);
        const addAuthorizedTx = await MainRegistry.addAuthorizedAddress(attestationFactoryDeployment.address);
        await addAuthorizedTx.wait(2); // Wait for 2 confirmations
        console.log("AttestationFactory authorized in MainRegistry");

        // Verify the contracts on Etherscan
        if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
            console.log("Verifying contracts on Etherscan...");
            await verifyContract(hre, mainRegistryDeployment.address, [deployer]);
            await verifyContract(hre, attestationFactoryDeployment.address, [mainRegistryDeployment.address]);
        }

        console.log("Deployment and verification completed successfully!");
    } catch (error) {
        console.error("Error during deployment:", error);
        throw error;  // Rethrow the error to make the deployment script fail
    }
};

async function verifyContract(hre: HardhatRuntimeEnvironment, contractAddress: string, constructorArguments: any[]) {
    console.log(`Verifying contract at ${contractAddress}`);
    try {
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArguments,
        });
        console.log("Contract verified successfully");
    } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Contract is already verified!");
        } else {
            console.error("Error verifying contract: ", error);
        }
    }
}

export default func;
func.tags = ['MainRegistry', 'AttestationFactory'];
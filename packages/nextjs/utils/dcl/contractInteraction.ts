import { ethers } from 'ethers';
import AttestationFactoryABI from '../../../hardhat/artifacts/contracts/AttestationFactory.sol/AttestationFactory.json';
import { verifyContract, checkVerificationStatus } from '../../services/dcl/contractVerification';

const attestationFactoryAddress = "0xE847673d2D61CDc2D14711826da2Db35b695CDc2"; //to replace when go mainnet
const mainRegistryAddress = "0x1Bf972E053f4d73e4B21c184cff1aFfB88221e14"; //to replace when go mainnet
const MAX_VERIFICATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
const CHECK_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

export interface WalletClient {
    account: { address: string };
    chain: { id: number; name: string };
    transport: { request: (args: any) => Promise<any> };
    sendTransaction: (args: any) => Promise<`0x${string}`>;
}

export async function walletClientToEthersProvider(walletClient: WalletClient) {
    const network = {
        chainId: walletClient.chain.id,
        name: walletClient.chain.name
    };
    const provider = new ethers.BrowserProvider(walletClient.transport, network);
    return provider;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function createAttestation(
    walletClient: WalletClient,
    authors: string[],
    authorName: string,
    contributors: string[],
    title: string,
    ipfsHash: string,
    quotedAttestationId: string[],
    tags: string[],
    coPublishThreshold: string
): Promise<{ address: string; verificationStatus: 'Pass' | 'Fail' | 'Pending' }> {
    try {
        console.log("Starting createAttestation function");

        if (!walletClient || !walletClient.account) {
            throw new Error("Invalid wallet client provided");
        }

        const provider = await walletClientToEthersProvider(walletClient);
        const signer = await provider.getSigner(walletClient.account.address);

        console.log("Connected address:", walletClient.account.address);

        // Create contract instance
        console.log("Creating contract instance with address:", attestationFactoryAddress);
        const contract = new ethers.Contract(attestationFactoryAddress, AttestationFactoryABI.abi, signer);
        console.log("Contract instance created");

        // Prepare transaction
        console.log("Preparing transaction...");
        const txRequest = await contract.createAttestation.populateTransaction(
            authors,
            authorName,
            contributors,
            ipfsHash,
            title,
            quotedAttestationId,
            tags,
            ethers.parseEther(coPublishThreshold)
        );

        // Send transaction using walletClient
        const txHash = await walletClient.sendTransaction({
            ...txRequest,
            from: walletClient.account.address
        });
        console.log("Transaction sent:", txHash);

        // Wait for transaction to be mined
        const receipt = await provider.waitForTransaction(txHash);
        if (!receipt) {
            throw new Error('Transaction receipt is null');
        }
        console.log("Transaction mined:", receipt.hash);

        // Find the AttestationCreated event in the transaction receipt
        const attestationCreatedEvent = contract.interface.getEvent('AttestationCreated');
        if (!attestationCreatedEvent) {
            throw new Error('AttestationCreated event not found in contract ABI');
        }
        const eventTopic = ethers.id(attestationCreatedEvent.format('sighash'));
        const log = receipt.logs.find(log => log.topics[0] === eventTopic);

        if (!log) {
            throw new Error('AttestationCreated event not found in transaction logs');
        }

        const parsedLog = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data
        });

        if (!parsedLog) {
            throw new Error('Failed to parse AttestationCreated event');
        }

        const newAttestationAddress = parsedLog.args.attestationAddress;

        if (!newAttestationAddress) {
            throw new Error('Failed to retrieve new attestation address');
        }

        console.log('New Attestation Address:', newAttestationAddress);

        // Start the verification process in the background
        verifyAttestation(newAttestationAddress, authors, authorName, contributors, title, ipfsHash, quotedAttestationId, tags, coPublishThreshold);


        // Return the attestation address immediately
        return newAttestationAddress;

    } catch (error: unknown) {
        console.error('Error creating attestation:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to create attestation: ${error.message}`);
        } else {
            throw new Error('An unknown error occurred while creating the attestation');
        }
    }
}

async function verifyAttestation(
    newAttestationAddress: string,
    authors: string[],
    authorName: string,
    contributors: string[],
    title: string,
    ipfsHash: string,
    quotedAttestationId: string[],
    tags: string[],
    coPublishThreshold: string
) {
    try {
        // Add a delay before verification (e.g., 30 seconds)
        console.log('Waiting for 30 seconds before attempting verification...');
        await delay(30000);

        // Prepare constructor arguments for verification
        const constructorArgs = [
            mainRegistryAddress,
            authors,
            authorName,
            contributors,
            ipfsHash,
            title,
            quotedAttestationId.map(id => BigInt(id)),
            tags,
            ethers.parseEther(coPublishThreshold),
            ethers.parseEther("0.05") // _verificationThreshold
        ];

        // Verify the newly created contract
        const isVerified = await verifyContract({
            address: newAttestationAddress,
            constructorArguments: constructorArgs
        });

        let finalStatus: 'Pass' | 'Fail' | 'Pending' = 'Pending';

        if (typeof isVerified === 'string') {
            console.log('Verification submission successful. GUID:', isVerified);
            console.log('Checking verification status...');

            // Check status every 30 seconds for up to 5 minutes
            const startTime = Date.now();
            while (Date.now() - startTime < MAX_VERIFICATION_TIME) {
                const status = await checkVerificationStatus(isVerified);
                console.log('Verification status:', status);
                if (status === 'Pass' || status === 'Fail' || 'Already Verified') {
                    finalStatus = status;
                    break;
                }
                await delay(CHECK_INTERVAL);
            }
        } else {
            console.warn('Contract verification submission failed.');
            finalStatus = 'Fail';
        }
        console.warn('Final verification status:', finalStatus);

    } catch (error: unknown) {
        console.error('Error verifying attestation:', error);
    }
}
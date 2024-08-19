import { ethers } from 'ethers';
import AttestationFactoryABI from '../../../hardhat/artifacts/contracts/AttestationFactory.sol/AttestationFactory.json';

const attestationFactoryAddress = "0xe06D5F27bB990Ce83002F2B97F651BA1899d9eE0";

interface WalletClient {
    account: { address: string };
    chain: { id: number; name: string };
    transport: { request: (args: any) => Promise<any> };
    sendTransaction: (args: any) => Promise<`0x${string}`>;
}

async function walletClientToEthersProvider(walletClient: WalletClient) {
    const network = {
        chainId: walletClient.chain.id,
        name: walletClient.chain.name
    };
    const provider = new ethers.BrowserProvider(walletClient.transport, network);
    return provider;
}

export async function createAttestation(
    walletClient: WalletClient,
    authors: string[],
    contributors: string[],
    ipfsHash: string,
    quotedAttestationId: string[],
    tags: string[],
    coPublishThreshold: string
): Promise<string> {
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
            contributors,
            ipfsHash,
            quotedAttestationId.map(id => BigInt(id)),
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
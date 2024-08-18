import { ethers } from 'ethers';
import AttestationFactoryABI from '../../../hardhat/artifacts/contracts/AttestationFactory.sol/AttestationFactory.json';

const attestationFactoryAddress = "0xe06D5F27bB990Ce83002F2B97F651BA1899d9eE0";

export async function createAttestation(
    provider: ethers.BrowserProvider,
    authors: string[],
    contributors: string[],
    ipfsHash: string,
    quotedAttestationId: string[],
    tags: string[],
    coPublishThreshold: string
): Promise<string> {
    try {
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(attestationFactoryAddress, AttestationFactoryABI.abi, signer);

        const tx = await contract.createAttestation(
            authors,
            contributors,
            ipfsHash,
            quotedAttestationId.map(id => BigInt(id)),
            tags,
            ethers.parseEther(coPublishThreshold)
        );

        const receipt = await tx.wait();

        // Find the AttestationCreated event in the transaction receipt
        const event = receipt.logs.find((log: ethers.Log) => {
            try {
                const parsedLog = contract.interface.parseLog({ ...log, topics: log.topics as string[] });
                return parsedLog?.name === 'AttestationCreated';
            } catch {
                return false;
            }
        });

        if (!event) {
            throw new Error('AttestationCreated event not found');
        }

        const parsedEvent = contract.interface.parseLog({ ...event, topics: event.topics as string[] });
        if (!parsedEvent) {
            throw new Error('Failed to parse AttestationCreated event');
        }

        const newAttestationAddress = parsedEvent.args.attestationAddress;

        if (!newAttestationAddress) {
            throw new Error('Failed to retrieve new attestation address');
        }

        return newAttestationAddress;
    } catch (error: unknown) {
        console.error('Error creating attestation:', error);
        throw error;
    }
}

// You can add more functions here to interact with the AttestationFactory if needed like: addAuthorizedAddress/Remove etc..
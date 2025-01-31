import { ethers } from 'ethers';
import AttestationABI from '../../../hardhat/artifacts/contracts/AttestationFactory.sol/Attestation.json';

export interface AttestationData {
    authors: string[];
    contributors: string[];
    copublishers: string[];
    ipfsHash: string;
    quotedAttestationIds: string[];
    tags: string[];
    coPublishThreshold: bigint;
    isActivated: boolean;
    upvoteCount: bigint;
    totalReceivedFunds: bigint;
    signatureCount: bigint;
    title: string;
    authorName: string;
    currentBalance: bigint;
}

interface WalletClient {
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

export async function getAttestationData(
    address: string,
    provider: ethers.Provider
): Promise<AttestationData> {
    const contract = new ethers.Contract(address, AttestationABI.abi, provider);

    // Fetch individual data fields
    // Fetch all data fields
    const authors = await contract.getAuthors();
    const contributors = await contract.getContributors();
    const copublishers = await contract.getCoPublishers();
    const ipfsHash = await contract.ipfsHash();
    const quotedAttestationIds = await contract.getQuotesAttestationIds();
    const tags = await contract.getTags();
    const coPublishThreshold = await contract.coPublishThreshold();
    const isActivated = await contract.isActivated();
    const upvoteCount = await contract.upvoteCount();
    const totalReceivedFunds = await contract.totalReceivedFunds();
    const signatureCount = await contract.signatureCount();
    const title = await contract.title();
    const authorName = await contract.authorName();
    const currentBalance = await provider.getBalance(address);

    // Construct and return the AttestationData object
    return {
        authors,
        contributors,
        copublishers,
        ipfsHash,
        quotedAttestationIds,
        tags,
        coPublishThreshold,
        isActivated,
        upvoteCount,
        totalReceivedFunds,
        signatureCount,
        title,
        authorName,
        currentBalance
    };
}


export async function changeCoPublishThreshold(
    walletClient: WalletClient,
    attestationAddress: string,
    newThreshold: string[]
): Promise<void> {
    const provider = await walletClientToEthersProvider(walletClient);
    const signer = await provider.getSigner(walletClient.account.address);
    const contract = new ethers.Contract(attestationAddress, AttestationABI.abi, signer);

    const txRequest = await contract.setCoPublishThreshold.populateTransaction(
        ethers.parseEther(newThreshold[0])
    );

    const txHash = await walletClient.sendTransaction({
        ...txRequest,
        from: walletClient.account.address
    });

    await provider.waitForTransaction(txHash);
}

export async function signAttestation(
    walletClient: WalletClient,
    attestationAddress: string
): Promise<void> {
    const provider = await walletClientToEthersProvider(walletClient);
    const signer = await provider.getSigner(walletClient.account.address);
    const contract = new ethers.Contract(attestationAddress, AttestationABI.abi, signer);

    const txRequest = await contract.sign.populateTransaction();

    const txHash = await walletClient.sendTransaction({
        ...txRequest,
        from: walletClient.account.address
    });

    await provider.waitForTransaction(txHash);
}

export async function revokeAffiliation(
    walletClient: WalletClient,
    attestationAddress: string
): Promise<void> {
    const provider = await walletClientToEthersProvider(walletClient);
    const signer = await provider.getSigner(walletClient.account.address);
    const contract = new ethers.Contract(attestationAddress, AttestationABI.abi, signer);

    const txRequest = await contract.revokeAffiliation.populateTransaction();

    const txHash = await walletClient.sendTransaction({
        ...txRequest,
        from: walletClient.account.address
    });

    await provider.waitForTransaction(txHash);
}

export async function likeAttestation(
    walletClient: WalletClient,
    attestationAddress: string
): Promise<void> {
    const provider = await walletClientToEthersProvider(walletClient);
    const signer = await provider.getSigner(walletClient.account.address);
    const contract = new ethers.Contract(attestationAddress, AttestationABI.abi, signer);

    const txRequest = await contract.upvote.populateTransaction();

    const txHash = await walletClient.sendTransaction({
        ...txRequest,
        from: walletClient.account.address
    });

    await provider.waitForTransaction(txHash);
}

export const donateToAttestation = async (
    walletClient: WalletClient,
    attestationAddress: string,
    amount: bigint
) => {
    const provider = await walletClientToEthersProvider(walletClient);
    const signer = await provider.getSigner(walletClient.account.address);
    const contract = new ethers.Contract(attestationAddress, AttestationABI.abi, signer);

    try {
        const txRequest = await contract.donate.populateTransaction(amount, {
            value: amount,
        });

        const txHash = await walletClient.sendTransaction({
            ...txRequest,
            from: walletClient.account.address
        });

        await provider.waitForTransaction(txHash);
        console.log('Donation successful');
    } catch (error) {
        console.error('Error donating:', error);
        throw error;
    }
};

export const claimFunds = async (walletClient: WalletClient, attestationAddress: string) => {
    try {
        const provider = new ethers.BrowserProvider(walletClient.transport);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(attestationAddress, AttestationABI.abi, signer);

        const tx = await contract.claimFunds();
        await tx.wait();

        return { success: true, message: "Funds claimed successfully" };
    } catch (error) {
        console.error("Error claiming funds:", error);
        return { success: false, message: "Failed to claim funds" };
    }
};
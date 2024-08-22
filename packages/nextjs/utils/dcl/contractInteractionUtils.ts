import { ethers } from 'ethers';
import AttestationABI from '../../../hardhat/artifacts/contracts/AttestationFactory.sol/Attestation.json';

export interface AttestationData {
    authors: string[];
    contributors: string[];
    ipfsHash: string;
    quotedAttestationIds: string[];
    tags: string[];
    coPublishThreshold: bigint;
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
    const data = await contract.getAttestationData();
    return data;
}

export async function changeCoPublishThreshold(
    walletClient: WalletClient,
    attestationAddress: string,
    newThreshold: string[]
): Promise<void> {
    const provider = await walletClientToEthersProvider(walletClient);
    const signer = await provider.getSigner(walletClient.account.address);
    const contract = new ethers.Contract(attestationAddress, AttestationABI.abi, signer);

    const txRequest = await contract.changeCoPublishThreshold.populateTransaction(
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

    const txRequest = await contract.like.populateTransaction();

    const txHash = await walletClient.sendTransaction({
        ...txRequest,
        from: walletClient.account.address
    });

    await provider.waitForTransaction(txHash);
}

export async function donateToAttestation(
    walletClient: WalletClient,
    attestationAddress: string,
    amount: string
): Promise<void> {
    const provider = await walletClientToEthersProvider(walletClient);
    const signer = await provider.getSigner(walletClient.account.address);
    const contract = new ethers.Contract(attestationAddress, AttestationABI.abi, signer);

    const txRequest = await contract.donate.populateTransaction({
        value: ethers.parseEther(amount)
    });

    const txHash = await walletClient.sendTransaction({
        ...txRequest,
        from: walletClient.account.address
    });

    await provider.waitForTransaction(txHash);
}

//import AttestationABI from '../../hardhat/artifacts/contracts/AttestationFactory.sol/Attestation.json';
//from '../utils/dcl/contractInteractionUtils';
//--------------------------------------------------------------
// "use client";

"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ethers } from 'ethers';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    AttestationData,
    getAttestationData,
    changeCoPublishThreshold,
    signAttestation,
    revokeAffiliation,
    likeAttestation,
    donateToAttestation
} from '../../utils/dcl/contractInteractionUtils';

// Dynamically import browser-dependent components
const QRCode = dynamic(() => import('qrcode.react'), { ssr: false });
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function AttestationViewer({ params }: { params: { address?: string } }) {
    const { address: connectedAddress } = useAccount();
    const chainId = useChainId();
    const { data: walletClient } = useWalletClient();
    const [attestationAddress, setAttestationAddress] = useState<string>('');
    const [attestationData, setAttestationData] = useState<AttestationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const [isBrowser, setIsBrowser] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsBrowser(true);
        if (params.address) {
            setAttestationAddress(params.address);
            fetchAttestationData(params.address);
        }
    }, [params.address]);

    // Function to get the full URL for the attestation
    const getAttestationUrl = () => {
        if (typeof window !== 'undefined') {
            const baseUrl = window.location.origin; // This will be http://localhost:3000 in development and your actual domain in production
            return `${baseUrl}${pathname}/${attestationAddress}`;
        }
        return '';
    };


    const fetchAttestationData = async (address: string) => {
        if (!walletClient) {
            setError("No wallet connected. Please connect your wallet.");
            return;
        }

        try {
            const provider = await walletClientToEthersProvider(walletClient);
            const data = await getAttestationData(address, provider);
            setAttestationData(data);
            generateGraphData(data, address);
        } catch (err) {
            setError('Error fetching attestation data');
            console.error(err);
        }
    };

    const generateGraphData = (data: AttestationData, address: string) => {
        const nodes = [
            { id: address, group: 1, label: 'Current Attestation' },
            ...data.authors.map((author: string, i: number) => ({ id: author, group: 2, label: `Author ${i + 1}` })),
            ...data.contributors.map((contributor: string, i: number) => ({ id: contributor, group: 3, label: `Contributor ${i + 1}` })),
            ...data.copublishers.map((copublisher: string, i: number) => ({ id: copublisher, group: 3, label: `Copublisher ${i + 1}` })),
            ...data.tags.map((tag: string, i: number) => ({ id: tag, group: 3, label: `tags ${i + 1}` })),
            ...data.quotedAttestationIds.map((id: string, i: number) => ({ id, group: 4, label: `Quoted Attestation ${i + 1}` })),
        ];

        const links = [
            ...data.authors.map((author: string) => ({ source: address, target: author })),
            ...data.contributors.map((contributor: string) => ({ source: address, target: contributor })),
            ...data.copublishers.map((copublisher: string, i: number) => ({ id: copublisher, group: 3, label: `Copublisher ${i + 1}` })),
            ...data.tags.map((tag: string, i: number) => ({ id: tag, group: 3, label: `tags ${i + 1}` })),
            ...data.quotedAttestationIds.map((id: string) => ({ source: address, target: id })),
        ];

        setGraphData({ nodes, links });
    };

    const handleAddressSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (attestationAddress) {
            fetchAttestationData(attestationAddress);
        }
    };

    const handleAuthorAction = async (action: 'changeThreshold' | 'sign' | 'revokeAffiliation') => {
        if (!walletClient || !attestationAddress) return;

        try {
            const provider = await walletClientToEthersProvider(walletClient);
            const signer = await provider.getSigner(walletClient.account.address);

            switch (action) {
                case 'changeThreshold':
                    const newThreshold = prompt('Enter new co-publish threshold (in ETH):');
                    if (newThreshold) await changeCoPublishThreshold(walletClient, attestationAddress, [newThreshold]);
                    break;
                case 'sign':
                    await signAttestation(walletClient, attestationAddress);
                    break;
                case 'revokeAffiliation':
                    await revokeAffiliation(walletClient, attestationAddress);
                    break;
            }
            // Refresh attestation data after action
            fetchAttestationData(attestationAddress);
        } catch (err) {
            console.error(err);
            setError(`Error performing ${action}`);
        }
    };

    const handleUserAction = async (action: 'like' | 'donate') => {
        if (!walletClient || !attestationAddress) return;

        try {
            switch (action) {
                case 'like':
                    await likeAttestation(walletClient, attestationAddress);
                    break;
                case 'donate':
                    const amount = prompt('Enter donation amount (in ETH):');
                    if (amount) await donateToAttestation(walletClient, attestationAddress, amount);
                    break;
            }
            // Refresh attestation data after action
            fetchAttestationData(attestationAddress);
        } catch (err) {
            console.error(err);
            setError(`Error performing ${action}`);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
                ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold mb-6">Attestation Viewer</h1>

            <form onSubmit={handleAddressSubmit} className="mb-8">
                <input
                    type="text"
                    value={attestationAddress}
                    onChange={(e) => setAttestationAddress(e.target.value)}
                    placeholder="Enter attestation address"
                    className="w-full p-2 border rounded"
                />
                <button type="submit" className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
                    View Attestation
                </button>
            </form>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {attestationData && (
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/2">
                        <h2 className="text-2xl font-semibold mb-4">Attestation Details</h2>
                        <div className="bg-gray-100 p-4 rounded">
                            <p><strong>is Activated:</strong> {attestationData.isActivated}</p>
                            <p><strong>Authors:</strong> {attestationData.authors.join(', ')}</p>
                            <p><strong>Contributors:</strong> {attestationData.contributors.join(', ')}</p>
                            <p><strong>Copublishers:</strong> {attestationData.copublishers.join(', ')}</p>
                            <p><strong>IPFS Hash:</strong> {attestationData.ipfsHash}</p>
                            <p><strong>Quoted Attestation IDs:</strong> {attestationData.quotedAttestationIds.join(', ')}</p>
                            <p><strong>Tags:</strong> {attestationData.tags.join(', ')}</p>
                            <p><strong>Co-publish Threshold:</strong> {ethers.formatEther(attestationData.coPublishThreshold)} ETH</p>
                        </div>

                        <h3 className="text-xl font-semibold mt-6 mb-2">Content Preview</h3>
                        <div className="bg-gray-100 p-4 rounded">
                            <a href={`https://ipfs.io/ipfs/${attestationData.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                View on IPFS
                            </a>
                        </div>

                        <h3 className="text-xl font-semibold mt-6 mb-2">QR Code</h3>
                        {isBrowser && <QRCode value={getAttestationUrl()} />}

                        <h3 className="text-xl font-semibold mt-6 mb-2">Actions</h3>
                        <div className="space-y-2">
                            <h4 className="font-semibold">Author/Contributor Actions:</h4>
                            <button onClick={() => handleAuthorAction('changeThreshold')} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
                                Change Co-publish Threshold
                            </button>
                            <button onClick={() => handleAuthorAction('sign')} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
                                Sign
                            </button>
                            <button onClick={() => handleAuthorAction('revokeAffiliation')} className="bg-red-500 text-white px-4 py-2 rounded">
                                Revoke Affiliation
                            </button>
                        </div>
                        <div className="space-y-2 mt-4">
                            <h4 className="font-semibold">User Actions:</h4>
                            <button onClick={() => handleUserAction('like')} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
                                Like/Upvote
                            </button>
                            <button onClick={() => handleUserAction('donate')} className="bg-purple-500 text-white px-4 py-2 rounded">
                                Donate
                            </button>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2">
                        <h2 className="text-2xl font-semibold mb-4">Attestation Map</h2>
                        <div style={{ height: '500px', border: '1px solid #ccc' }}>
                            {isBrowser && (
                                <ForceGraph2D
                                    graphData={graphData}
                                    nodeLabel="label"
                                    nodeAutoColorBy="group"
                                    linkDirectionalParticles={2}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

async function walletClientToEthersProvider(walletClient: any) {
    const network = {
        chainId: walletClient.chain.id,
        name: walletClient.chain.name
    };
    const provider = new ethers.BrowserProvider(walletClient.transport, network);
    return provider;
}
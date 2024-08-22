"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ethers } from 'ethers';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import AttestationQRCode from './AttestationQRCode';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    AttestationData,
    getAttestationData,
    changeCoPublishThreshold,
    signAttestation,
    likeAttestation,
    revokeAffiliation,
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
    const [provider, setProvider] = useState<ethers.Provider | null>(null);
    const pathname = usePathname();
    const [ipfsContent, setIpfsContent] = useState<any>(null);

    useEffect(() => {
        setIsBrowser(true);
        if (params.address) {
            setAttestationAddress(params.address);
        }
    }, [params.address]);

    useEffect(() => {
        async function setupProvider() {
            if (walletClient) {
                try {
                    const newProvider = await walletClientToEthersProvider(walletClient);
                    setProvider(newProvider);
                    if (attestationAddress) {
                        fetchAttestationData(attestationAddress, newProvider);
                    }
                } catch (err) {
                    console.error('Error setting up provider:', err);
                    setError('Error setting up provider');
                }
            }
        }

        setupProvider();
    }, [walletClient, attestationAddress]);

    const fetchAttestationData = async (address: string, currentProvider: ethers.Provider) => {
        try {
            const data = await getAttestationData(address, currentProvider);
            setAttestationData(data);
            generateGraphData(data, address);
        } catch (err) {
            setError('Error fetching attestation data');
            console.error(err);
        }
    };

    useEffect(() => {
        async function fetchIPFSData() {
            if (attestationData && attestationData.ipfsHash) {
                try {
                    const response = await fetch(`https://ipfs.io/ipfs/${attestationData.ipfsHash}`);
                    const data = await response.json();
                    setIpfsContent(data);
                } catch (error) {
                    console.error('Error fetching IPFS content:', error);
                }
            }
        }
        fetchIPFSData();
    }, [attestationData]);

    const generateGraphData = (data: AttestationData, address: string) => {
        const nodeMap = new Map();

        // Function to add a node if it doesn't exist
        const addNode = (id: string, group: number, label: string) => {
            if (!nodeMap.has(id)) {
                nodeMap.set(id, { id, group, label });
            }
        };

        // Add current attestation
        addNode(address, 1, 'Current Attestation');

        // Add other nodes
        data.authors.forEach((author, i) => addNode(author, 2, `Author ${i + 1}`));
        data.contributors.forEach((contributor, i) => addNode(contributor, 3, `Contributor ${i + 1}`));
        data.copublishers.forEach((copublisher, i) => addNode(copublisher, 4, `Copublisher ${i + 1}`));
        data.tags.forEach((tag) => addNode(tag, 5, `Tag: ${tag}`));
        data.quotedAttestationIds.forEach((id, i) => addNode(id, 6, `Quoted Attestation ${i + 1}`));

        // Create links only between existing nodes
        const links = [
            ...data.authors.map((author) => ({ source: address, target: author })),
            ...data.contributors.map((contributor) => ({ source: address, target: contributor })),
            ...data.copublishers.map((copublisher) => ({ source: address, target: copublisher })),
            ...data.tags.map((tag) => ({ source: address, target: tag })),
            ...data.quotedAttestationIds.map((id) => ({ source: address, target: id })),
        ].filter(link => nodeMap.has(link.source) && nodeMap.has(link.target));

        setGraphData({
            nodes: Array.from(nodeMap.values()),
            links
        });
    };

    const handleAddressSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (attestationAddress && provider) {
            fetchAttestationData(attestationAddress, provider);
        }
    };

    const handleAuthorAction = async (action: 'changeThreshold' | 'sign' | 'revokeAffiliation') => {
        if (!walletClient || !attestationAddress) return;

        try {
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
            if (provider) {
                fetchAttestationData(attestationAddress, provider);
            }
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
            if (provider) {
                fetchAttestationData(attestationAddress, provider);
            }
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

            {attestationData && ipfsContent && (
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/2">
                        <h2 className="text-2xl font-semibold mb-4">Attestation Details</h2>
                        <div className="bg-gray-100 p-4 rounded">
                            <p><strong>Is Activated:</strong> {attestationData.isActivated !== undefined ? attestationData.isActivated.toString() : 'Unknown'}</p>
                            <p><strong>Author:</strong> {ipfsContent.authorName} ({ipfsContent.authorWallet})</p>
                            <p><strong>Title:</strong> {ipfsContent.title}</p>
                            <p><strong>Contributors:</strong> {ipfsContent.contributors}</p>
                            <p><strong>Tags:</strong> {ipfsContent.tags}</p>
                            <p><strong>Co-publisher Fees:</strong> {ipfsContent.copublisherFees} ETH</p>
                            <p><strong>URL:</strong> <a href={ipfsContent.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{ipfsContent.url}</a></p>
                            <p><strong>Existing Work ID:</strong> {ipfsContent.existingWorkId}</p>
                            <p><strong>Media Type:</strong> {ipfsContent.mediaType}</p>
                            <p><strong>Media URL:</strong> <a href={ipfsContent.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Media</a></p>
                            <p><strong>Created At:</strong> {new Date(ipfsContent.createdAt).toLocaleString()}</p>
                            <p><strong>IPFS Hash:</strong> {attestationData.ipfsHash}</p>
                            <p><strong>Quoted Attestation IDs:</strong> {attestationData.quotedAttestationIds.join(', ')}</p>
                            <p><strong>Co-publish Threshold:</strong> {ethers.formatEther(attestationData.coPublishThreshold)} ETH</p>
                        </div>

                        <h3 className="text-xl font-semibold mt-6 mb-2">Content Preview</h3>
                        <div className="bg-gray-100 p-4 rounded">
                            <a href={`https://ipfs.io/ipfs/${attestationData.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                View on IPFS
                            </a>
                        </div>

                        <h3 className="text-xl font-semibold mt-6 mb-2">QR Code</h3>
                        {isBrowser && provider && (
                            <AttestationQRCode attestationAddress={attestationAddress} provider={provider} />
                        )}

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
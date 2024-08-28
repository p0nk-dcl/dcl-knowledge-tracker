"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { UserIcon, HandThumbUpIcon, CurrencyDollarIcon, TagIcon, ClockIcon, LinkIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid';

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
    const [hoveredNode, setHoveredNode] = useState<any>(null);
    const graphRef = useRef<HTMLDivElement>(null);

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

    const generateGraphData = (data: AttestationData, address: string) => {
        const nodes = [
            {
                id: address,
                label: 'Current Attestation',
                authors: data.authors,
                contributors: data.contributors,
                copublishers: data.copublishers,
                tags: data.tags,
            },
            ...data.quotedAttestationIds.map((id: string) => ({
                id,
                label: `Quoted Attestation`,
            }))
        ];

        const links = data.quotedAttestationIds.map((id: string) => ({
            source: address,
            target: id,
        }));

        setGraphData({ nodes, links });
    };

    const handleNodeHover = useCallback((node: any) => {
        setHoveredNode(node);
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Attestation Viewer</h1>

            <form onSubmit={handleAddressSubmit} className="mb-8">
                <div className="flex items-center border-b border-b-2 border-blue-500 py-2">
                    <input
                        type="text"
                        value={attestationAddress}
                        onChange={(e) => setAttestationAddress(e.target.value)}
                        placeholder="Enter attestation address"
                        className="appearance-none bg-transparent border-none w-full text-black mr-3 py-1 px-2 leading-tight focus:outline-none"
                    />
                    <button type="submit" className="flex-shrink-0 bg-[#00FF00] hover:bg-green-400 border-[#00FF00] hover:border-green-400 text-black text-sm border-4 py-1 px-2 rounded">
                        View Attestation
                    </button>
                </div>
            </form>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {attestationData && ipfsContent && (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="w-full lg:w-1/3">
                        <h2 className="text-2xl font-semibold mb-4">Attestation Details</h2>
                        <div className="bg-white shadow-md rounded p-6 mb-6">
                            <div className="flex items-center mb-2">
                                <UserIcon className="w-5 h-5 mr-2" />
                                <p><strong>Author:</strong> {ipfsContent.authorName} ({ipfsContent.authorWallet})</p>
                            </div>
                            <div className="flex items-center mb-2">
                                <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
                                <p><strong>Title:</strong> {ipfsContent.title}</p>
                            </div>
                            <div className="flex items-center mb-2">
                                <UserIcon className="w-5 h-5 mr-2" />
                                <p><strong>Contributors:</strong> {ipfsContent.contributors}</p>
                            </div>
                            <div className="flex items-center mb-2">
                                <TagIcon className="w-5 h-5 mr-2" />
                                <p><strong>Tags:</strong> {ipfsContent.tags}</p>
                            </div>
                            <div className="flex items-center mb-2">
                                <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                                <p><strong>Co-publisher Fees:</strong> {ipfsContent.copublisherFees} ETH (Initial) / {ethers.formatEther(attestationData.coPublishThreshold)} ETH (Current)</p>
                            </div>
                            <div className="flex items-center mb-2">
                                <LinkIcon className="w-5 h-5 mr-2" />
                                <p><strong>URL:</strong> <a href={ipfsContent.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{ipfsContent.url}</a></p>
                            </div>
                            <div className="flex items-center mb-2">
                                <ClockIcon className="w-5 h-5 mr-2" />
                                <p><strong>Created At:</strong> {new Date(ipfsContent.createdAt).toLocaleString()}</p>
                            </div>
                            <p><strong>IPFS Hash:</strong> {attestationData.ipfsHash}</p>
                            <p><strong>Quoted Attestation IDs:</strong> {attestationData.quotedAttestationIds.join(', ')}</p>
                            <p><strong>Number of Likes:</strong> {new Number(attestationData.upvoteCount).toLocaleString()}</p>
                        </div>

                        <h3 className="text-xl font-semibold mb-4">Actions</h3>
                        <div className="bg-white shadow-md rounded p-6 mb-6">
                            <div className="mb-4">
                                <h4 className="font-semibold mb-2">Author/Contributor Actions:</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => handleAuthorAction('changeThreshold')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center">
                                        <CurrencyDollarIcon className="w-5 h-5 mr-2" /> Change Threshold
                                    </button>
                                    <button onClick={() => handleAuthorAction('sign')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center">
                                        <UserIcon className="w-5 h-5 mr-2" /> Sign
                                    </button>
                                    <button onClick={() => handleAuthorAction('revokeAffiliation')} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center">
                                        <UserIcon className="w-5 h-5 mr-2" /> Revoke Affiliation
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">User Actions:</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={() => handleUserAction('like')} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center">
                                        <HandThumbUpIcon className="w-5 h-5 mr-2" /> Like/Upvote
                                    </button>
                                    <button onClick={() => handleUserAction('donate')} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center">
                                        <CurrencyDollarIcon className="w-5 h-5 mr-2" /> Donate
                                    </button>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold mt-6 mb-2">QR Code</h3>
                        {isBrowser && provider && (
                            <AttestationQRCode attestationAddress={attestationAddress} provider={provider} />
                        )}
                    </div>

                    <div className="w-full lg:w-2/3">
                        <h2 className="text-2xl font-semibold mb-4">Content Preview</h2>
                        <div className="bg-white shadow-md rounded p-6 mb-6">
                            <p>{ipfsContent.content}</p>
                            <a href={`https://ipfs.io/ipfs/${attestationData.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-4 inline-block">
                                View full content on IPFS
                            </a>
                        </div>

                        <h2 className="text-2xl font-semibold mb-4">Attestation Map</h2>
                        <div
                            ref={graphRef}
                            className="bg-white shadow-md rounded"
                            style={{
                                height: '400px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isBrowser && (
                                <>
                                    <ForceGraph2D
                                        graphData={graphData}
                                        nodeLabel="label"
                                        nodeAutoColorBy="label"
                                        linkDirectionalParticles={2}
                                        onNodeHover={handleNodeHover}
                                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                                            const label = node.label;
                                            const fontSize = 12 / globalScale;
                                            ctx.font = `${fontSize}px Sans-Serif`;
                                            ctx.textAlign = 'center';
                                            ctx.textBaseline = 'middle';
                                            ctx.fillStyle = node.color;
                                            ctx.fillText(label, node.x!, node.y!);
                                        }}
                                        width={graphRef.current ? graphRef.current.clientWidth : undefined}
                                        height={graphRef.current ? graphRef.current.clientHeight : undefined}
                                    />
                                    {hoveredNode && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            left: '10px',
                                            background: 'white',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                                        }}>
                                            <h3>{hoveredNode.label}</h3>
                                            {hoveredNode.authors && <p>Authors: {hoveredNode.authors.join(', ')}</p>}
                                            {hoveredNode.contributors && <p>Contributors: {hoveredNode.contributors.join(', ')}</p>}
                                            {hoveredNode.copublishers && <p>Copublishers: {hoveredNode.copublishers.join(', ')}</p>}
                                            {hoveredNode.tags && <p>Tags: {hoveredNode.tags.join(', ')}</p>}
                                        </div>
                                    )}
                                </>
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
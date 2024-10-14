'use client';  // Add this at the top of the file

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getAttestationData, AttestationData, likeAttestation, donateToAttestation } from '../../utils/dcl/contractInteractionUtils';
import AttestationQRCode from '../../app/attestation-viewer/AttestationQRCode';
import { useWalletClient, useConnect, useAccount } from 'wagmi';
import { walletClientToEthersProvider } from '../../utils/dcl/contractInteraction';
import { UserIcon, HandThumbUpIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';

export default function EmbeddedAttestation({ attestationAddress }: { attestationAddress: string }) {
    const [attestationData, setAttestationData] = useState<AttestationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [donationAmount, setDonationAmount] = useState('');

    const { data: walletClient } = useWalletClient();
    const { connect, connectors } = useConnect();
    const { isConnected } = useAccount();

    useEffect(() => {
        const fetchData = async () => {
            if (!isConnected) {
                setIsLoading(false);
                return;
            }

            if (!walletClient) {
                setIsLoading(true);
                return;
            }

            try {
                setIsLoading(true);
                const provider = await walletClientToEthersProvider(walletClient);
                const data = await getAttestationData(attestationAddress, provider);
                setAttestationData(data);
                setError(null);
            } catch (error) {
                console.error('Error fetching attestation data:', error);
                setError('Failed to fetch attestation data. The contract might not exist or doesn\'t have the expected function.');
                setAttestationData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [attestationAddress, walletClient, isConnected]);

    const handleLike = async () => {
        if (!walletClient || !attestationData) return;
        try {
            await likeAttestation(walletClient, attestationAddress);
            // Refresh attestation data after liking
            const provider = await walletClientToEthersProvider(walletClient);
            const updatedData = await getAttestationData(attestationAddress, provider);
            setAttestationData(updatedData);
        } catch (error) {
            console.error('Error liking attestation:', error);
            setError('Failed to like attestation');
        }
    };

    const handleDonate = async () => {
        if (!walletClient || !attestationData || !donationAmount) return;
        try {
            // Convert donationAmount to wei (assuming it's in ETH)
            const donationAmountWei = ethers.parseEther(donationAmount);

            await donateToAttestation(walletClient, attestationAddress, donationAmountWei);

            // Refresh attestation data after donating
            const provider = await walletClientToEthersProvider(walletClient);
            const updatedData = await getAttestationData(attestationAddress, provider);
            setAttestationData(updatedData);
            setDonationAmount('');
        } catch (error) {
            console.error('Error donating to attestation:', error);
            setError('Failed to donate to attestation');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isConnected) {
        return (
            <div>
                <p>Please connect your wallet to view this attestation.</p>
                {connectors.map((connector) => (
                    <button key={connector.id} onClick={() => connect({ connector })}>
                        Connect {connector.name}
                    </button>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white shadow-md rounded-lg p-4 max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold mb-4 text-red-500">Error</h2>
                <p>{error}</p>
                <p className="mt-2">Contract address: {attestationAddress}</p>
            </div>
        );
    }

    if (!attestationData) {
        return <div>No attestation data available.</div>;
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-4 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">{attestationData.title}</h2>

            <div className="mb-4">
                <div className="flex items-center mb-2">
                    <UserIcon className="w-5 h-5 mr-2" />
                    <p><strong>Author:</strong> {attestationData.authorName} ({attestationData.authors[0]})</p>
                </div>
                {attestationData.contributors && attestationData.contributors.length > 0 && (
                    <div className="flex items-center mb-2">
                        <UserIcon className="w-5 h-5 mr-2" />
                        <p><strong>Contributors:</strong> {attestationData.contributors.join(', ')}</p>
                    </div>
                )}
                {attestationData.copublishers && attestationData.copublishers.length > 0 && (
                    <div className="flex items-center mb-2">
                        <UserIcon className="w-5 h-5 mr-2" />
                        <p><strong>Co-publishers:</strong> {attestationData.copublishers.join(', ')}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between mb-4">
                <div className="flex items-center">
                    <HandThumbUpIcon className="w-5 h-5 mr-2" />
                    <p><strong>Likes:</strong> {attestationData.upvoteCount.toString()}</p>
                </div>
                <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    <p><strong>Donations:</strong> {ethers.formatEther(attestationData.totalReceivedFunds)} ETH</p>
                </div>
            </div>

            <div className="mb-4">
                <p><strong>Smart Contract:</strong> {attestationAddress}</p>
            </div>

            <div className="flex justify-between items-center">
                <div>
                    <button onClick={handleLike} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
                        Like
                    </button>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        className="border rounded px-2 py-1 w-24 mr-2"
                        placeholder="0.05"
                    />
                    <button onClick={handleDonate} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Donate (ETH)
                    </button>
                </div>
                <AttestationQRCode attestationAddress={attestationAddress} provider={new ethers.JsonRpcProvider('YOUR_RPC_URL_HERE')} />
            </div>

            <div className="mt-4 text-center">
                <a href="https://thedecoland.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    Powered by Decoland
                </a>
            </div>
        </div>
    );
};
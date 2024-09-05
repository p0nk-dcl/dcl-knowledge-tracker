'use client'
import { useState } from 'react';
import { ethers } from 'ethers';

interface Attestation {
    id: string;
    address: string;
    ipfsHash: string;
    authors: string[];
    // contributors: string[];
    // coPublishers: string[];
    tags: string[];
    // upvoteCount: string;
    totalReceivedFunds: string;
    title?: string;
    isActivated: boolean;
    // activatedAt: string;
    upvotes: string;
    fundsReceived: string;
    // fundsClaimed: string;
    // quotedAttestationId: string[];
    // signatureCount: string;
}

interface AttestationListProps {
    attestations: Attestation[];
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export default function AttestationList({
    attestations,
    itemsPerPage,
    currentPage,
    onPageChange
}: AttestationListProps) {
    const totalPages = Math.ceil(attestations.length / itemsPerPage);

    return (
        <div>
            {attestations.map((attestation) => (
                <div key={attestation.id} className="mb-4 p-4 border rounded">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-500">ID: {attestation.id}</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${attestation.isActivated
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {attestation.isActivated ? 'Activated' : 'Not Activated'}
                        </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{attestation.title || 'Untitled'}</h3>
                    <p className="mb-1">Author: {attestation.authors?.[0] || 'N/A'}</p>
                    <p className="mb-1">Tags: {attestation.tags?.join(', ') || 'N/A'}</p>
                    <p className="mb-1">Upvotes: {attestation.upvotes?.toString() || '0'}</p>
                    <p>Total Received: {attestation.fundsReceived ? ethers.formatEther(attestation.fundsReceived.toString()) : '0'} ETH</p>
                </div>
            ))}

            <div className="flex justify-center mt-4">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => onPageChange(i + 1)}
                        className={`mx-1 px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'
                            }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
// AttestationQRCode.tsx
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { getAttestationData } from '../../utils/dcl/contractInteractionUtils';
import { ethers } from 'ethers';

async function fetchIPFSContent(ipfsHash: string) {
    const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
    return await response.json();
}

interface AttestationQRCodeProps {
    attestationAddress: string;
    provider: ethers.Provider;
}

export default function AttestationQRCode({ attestationAddress, provider }: AttestationQRCodeProps) {
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const attestationData = await getAttestationData(attestationAddress, provider);
                const ipfsContent = await fetchIPFSContent(attestationData.ipfsHash);
                setQrUrl(ipfsContent.metadata.url || `https://example.com/attestation/${attestationAddress}`);
            } catch (error) {
                console.error('Error fetching attestation data:', error);
                setQrUrl(`https://example.com/attestation/${attestationAddress}`);
            }
        }
        fetchData();
    }, [attestationAddress, provider]);

    return <QRCode value={qrUrl} />;
}
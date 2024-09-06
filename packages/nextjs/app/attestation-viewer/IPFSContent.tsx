import React from 'react';

interface IPFSContentProps {
    hash: string;
}

const IPFSContent: React.FC<IPFSContentProps> = ({ hash }) => {
    const ipfsUrl = `https://ipfs.io/ipfs/${hash}`;

    // Function to determine content type (you may need to implement this based on your data)
    const getContentType = () => {
        // This is a placeholder. You'll need to implement actual content type detection.
        return 'image'; // or 'video', 'pdf', etc.
    };

    const contentType = getContentType();

    switch (contentType) {
        case 'image':
            return <img src={ipfsUrl} alt="IPFS Content" className="max-w-full h-auto" />;
        case 'video':
            return <video src={ipfsUrl} controls className="w-full" />;
        case 'pdf':
            return <embed src={ipfsUrl} type="application/pdf" width="100%" height="600px" />;
        default:
            return <p>Unsupported content type</p>;
    }
};

export default IPFSContent;
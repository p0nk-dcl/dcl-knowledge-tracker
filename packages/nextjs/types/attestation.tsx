export interface Attestation {
    id: string;
    ipfsHash: string;
    tags: string[];
    authors: string[];
    contributors: string[];
    copublishers: string[];
    upvotes: string;
    fundsReceived: string;
    fundsClaimed: string;
    affiliations: string[];
    coPublishThreshold: string;
    quotedAttestationId: string[];
    signatureCount: string;
    totalReceivedFunds: string;
    upvoteCount: string;
    address: string;
    isActivated: boolean;
    activatedAt: string;
    // Add other properties as needed
}



export interface AttestationResponse {
    attestations: Attestation[];
}
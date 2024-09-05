import axios from 'axios';

interface IPFSContent {
    title?: string;
    authorName?: string;
    createdAt?: string;
    // Add other fields as needed
}

export async function fetchBatchFromIPFS(hashes: string[]): Promise<{ [key: string]: IPFSContent }> {
    const results: { [key: string]: IPFSContent } = {};

    for (const hash of hashes) {
        try {
            const response = await axios.get(`https://ipfs.io/ipfs/${hash}`);
            results[hash] = response.data;
        } catch (error) {
            console.error(`Error fetching IPFS content for hash ${hash}:`, error);
            results[hash] = {};
        }
    }

    return results;
}
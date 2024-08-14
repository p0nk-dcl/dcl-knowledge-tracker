"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { generateNFTMetadataImage, NFTMetadata } from '../utils/dcl/generateMetadataImage';

// import { Address } from "~~/components/scaffold-eth";
import { create as ipfsHttpClient } from 'ipfs-http-client';

// const client = ipfsHttpClient({ url: 'https://ipfs.infura.io:5001/api/v0' });

// Configure IPFS client with Infura
const projectId = process.env.INFURA_PROJECT_ID;
const projectSecret = process.env.INFURA_PROJECT_SECRET;
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
const client = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [formData, setFormData] = useState({
    authorName: "",
    authorWallet: "",
    title: "",
    contributors: "",
    tags: "",
    url: "",
    existingWorkId: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [ipfsUrls, setIpfsUrls] = useState({ metadata: '', resource: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const uploadToIPFS = async (content: File | Buffer): Promise<string | null> => {
    try {
      const added = await client.add(content);
      return `https://ipfs.io/ipfs/${added.path}`;
    } catch (error) {
      console.error('Error uploading to IPFS: ', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    // Upload resource file
    const resourceUrl = await uploadToIPFS(file);
    if (!resourceUrl) {
      alert('Failed to upload resource to IPFS');
      return;
    }

    // Prepare metadata
    const nftMetadata: NFTMetadata = {
      authorName: formData.authorName,
      authorWallet: formData.authorWallet || connectedAddress || '',
      title: formData.title,
      contributors: formData.contributors,
      tags: formData.tags,
      url: formData.url,
      existingWorkId: formData.existingWorkId,
      mediaType: file.type,
      mediaUrl: resourceUrl,
      createdAt: new Date().toISOString()
    };

    // Generate metadata image
    const svgImage = generateNFTMetadataImage(nftMetadata);
    const svgBuffer = Buffer.from(svgImage);
    const metadataImageUrl = await uploadToIPFS(svgBuffer);

    if (!metadataImageUrl) {
      alert('Failed to upload metadata image to IPFS');
      return;
    }

    // Prepare final metadata including the image URL
    const finalMetadata = {
      ...nftMetadata,
      image: metadataImageUrl,
      attributes: [
        { trait_type: 'Author', value: nftMetadata.authorName },
        { trait_type: 'Author Wallet', value: nftMetadata.authorWallet },
        { trait_type: 'Contributors', value: nftMetadata.contributors },
        { trait_type: 'Tags', value: nftMetadata.tags },
        { trait_type: 'URL', value: nftMetadata.url },
        { trait_type: 'Existing Work ID', value: nftMetadata.existingWorkId },
        { trait_type: 'Media Type', value: nftMetadata.mediaType },
        { trait_type: 'Media URL', value: nftMetadata.mediaUrl },
      ],
    };

    // Upload final metadata
    const metadataUrl = await uploadToIPFS(Buffer.from(JSON.stringify(finalMetadata)));
    if (!metadataUrl) {
      alert('Failed to upload metadata to IPFS');
      return;
    }

    setIpfsUrls({ metadata: metadataUrl, resource: resourceUrl });
    alert('Successfully uploaded to IPFS!');

  };


  return (
    <>
      {/* <div className="flex items-center flex-col flex-grow pt-10"> */}
      {/* <div className="px-5"> */}
      {/* <h1 className="text-center"> */}
      {/* <span className="block text-2xl mb-2">Bring your work on-chain</span>
      <span className="block text-4xl font-bold">On-Chain</span> */}
      {/* </h1> */}
      {/* <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div> */}
      {/* </div> */}

      <div className="flex items-center flex-col flex-grow w-full mt-16 px-4 py-12 flex justify-center">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-white p-8 rounded-none shadow-md w-full max-w-lg">
          <label className="font-semibold">Author Name:</label>
          <input
            name="authorName"
            placeholder="e.g., John Doe"
            onChange={handleChange}
            className="input input-bordered w-full"
          />

          <label className="font-semibold">Author Wallet Address:</label>
          <input
            name="authorWallet"
            placeholder="e.g., 0x2538137867AEA631a3C880F26C1cC04eb843b8F9"
            onChange={handleChange}
            className="input input-bordered w-full"
          />

          <label className="font-semibold">Title:</label>
          <input
            name="title"
            placeholder="e.g., L2 for Good"
            onChange={handleChange}
            className="input input-bordered w-full"
          />

          <label className="font-semibold">Contributors:</label>
          <input
            name="contributors"
            placeholder="e.g., Jonas Joe: 0xf39Fd6e51aa..., Kilian Kane: 0x709979...."
            onChange={handleChange}
            className="input input-bordered w-full"
          />

          <label className="font-semibold">Tags:</label>
          <input
            name="tags"
            placeholder="e.g., 'l2', 'blockchain for good', 'refi'"
            onChange={handleChange}
            className="input input-bordered w-full"
          />

          <label className="font-semibold">URL:</label>
          <input
            name="url"
            placeholder="e.g., https://example.com"
            onChange={handleChange}
            className="input input-bordered w-full"
          />

          <label className="font-semibold">Existing Work ID (optional):</label>
          <input
            name="existingWorkId"
            placeholder="e.g., 15489947987"
            onChange={handleChange}
            className="input input-bordered w-full"
          />

          <label className="font-semibold">Upload File:</label>
          <input
            type="file"
            onChange={handleFileChange}
            required
            className="file-input file-input-bordered w-full"
          />

          <button type="submit" className="btn btn-primary w-full">Submit</button>
        </form>
        {ipfsUrls.metadata && ipfsUrls.resource && (
          <div className="mt-8 p-4 bg-green-100 rounded-md">
            <h2 className="text-xl font-bold mb-2">IPFS Upload Successful!</h2>
            <p><strong>Metadata URL:</strong> <a href={ipfsUrls.metadata} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{ipfsUrls.metadata}</a></p>
            <p><strong>Resource URL:</strong> <a href={ipfsUrls.resource} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{ipfsUrls.resource}</a></p>
          </div>
        )}
      </div>

      <div className="flex-grow w-full mt-16 px-8 py-12">
        <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
          <div className="flex flex-col px-10 py-10 text-center items-center max-w-xs rounded-3xl">
            <BugAntIcon className="h-8 w-8 fill-secondary" />
            <p>
              Tinker with your smart contract using the{" "}
              <Link href="/debug" passHref className="link">
                Debug Contracts
              </Link>{" "}
              tab.
            </p>
          </div>
          <div className="flex flex-col bg-gray-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
            <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
            <p>
              Explore your local transactions with the{" "}
              <Link href="/blockexplorer" passHref className="link">
                Block Explorer
              </Link>{" "}
              tab.
            </p>
          </div>
        </div>
      </div>
      {/* </div> */}
    </>
  );
};

export default Home;
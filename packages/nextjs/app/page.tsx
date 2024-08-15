"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { generateNFTMetadataImage, NFTMetadata } from '../utils/dcl/generateMetadataImage';
import axios from 'axios';


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
  const [smartContractAddress, setSmartContractAddress] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };


  const uploadToPinata = async (content: File | string): Promise<string | null> => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const formData = new FormData();

    if (content instanceof File) {
      formData.append('file', content);
    } else {
      formData.append('file', new Blob([content], { type: 'application/json' }), 'metadata.json');
    }

    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': `multipart/form-data`,
          'pinata_api_key': 'YOUR_PINATA_API_KEY',
          'pinata_secret_api_key': 'YOUR_PINATA_SECRET_API_KEY',
        },
      });

      return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
    } catch (error) {
      console.error('Error uploading to Pinata: ', error);
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
    const resourceUrl = await uploadToPinata(file);
    if (!resourceUrl) {
      alert('Failed to upload resource to Pinata/IPFS');
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
    const metadataImageUrl = await uploadToPinata(svgImage);

    if (!metadataImageUrl) {
      alert('Failed to upload metadata image to IPFS/Pinata');
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
    const metadataUrl = await uploadToPinata(JSON.stringify(finalMetadata));
    if (!metadataUrl) {
      alert('Failed to upload metadata to IPFS/Pinata');
      return;
    }

    setIpfsUrls({ metadata: metadataUrl, resource: resourceUrl });
    setSmartContractAddress('0x1234567890123456789012345678901234567890'); // Replace with actual contract address
    alert('Successfully uploaded to IPFS/Pinata!');

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

      {/* <div className="flex items-center flex-col flex-grow w-full mt-16 px-4 py-12 flex justify-center">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-white p-8 rounded-none shadow-md w-full max-w-lg"> */}
      <div className="flex flex-col items-center w-full mt-16 px-4 py-12">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4 bg-white p-8 rounded-lg shadow-md w-full max-w-lg mb-8">
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
        {(ipfsUrls.metadata || ipfsUrls.resource || smartContractAddress) && (
          <div className="w-full max-w-lg p-6 bg-blue-50 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Upload Information</h2>
            {ipfsUrls.metadata && (
              <p className="mb-2">
                <strong>Metadata CID:</strong>
                <a href={ipfsUrls.metadata} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                  {ipfsUrls.metadata.split('/').pop()}
                </a>
              </p>
            )}
            {ipfsUrls.resource && (
              <p className="mb-2">
                <strong>Resource CID:</strong>
                <a href={ipfsUrls.resource} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                  {ipfsUrls.resource.split('/').pop()}
                </a>
              </p>
            )}
            {smartContractAddress && (
              <p className="mb-2">
                <strong>Smart Contract Address:</strong>
                <span className="ml-2">{smartContractAddress}</span>
              </p>
            )}
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
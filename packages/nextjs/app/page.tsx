"use client";

import { useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { generateNFTMetadataImage, NFTMetadata } from '../utils/dcl/generateMetadataImage';
import axios from 'axios';
import { ethers } from 'ethers';
import { createAttestation } from '../utils/dcl/contractInteraction';
import LoadingSpinner from '../components/LoadingSpinner';

const mainRegistryAddress = "0xa8f3Ec9865196a96d4C157A7965fAfF7ed46Ee97"; //smartcontract address deployed on Sepolia

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [formData, setFormData] = useState({
    authorName: "",
    authorWallet: "",
    title: "",
    contributors: "",
    tags: "",
    url: "",
    existingWorkId: "",
    coPublishThreshold: "" //can be set to 0.1 (eth) as default
  });
  const [file, setFile] = useState<File | null>(null);
  const [ipfsUrls, setIpfsUrls] = useState({ metadata: '', resource: '' });
  const [smartContractAddress, setSmartContractAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isTestingMode, setIsTestingMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');

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
    const PINATA_API_KEY = '5127f9990bebd3e94bf4'; //to hide in porcess.env!!!
    const PINATA_API_SECRET_KEY = 'e26a52cbb2596abafcb53096b665f5aedf78ba8b72d3a0df5ab5facfb6c1bb1b'; //to hide in porcess.env!!!

    if (content instanceof File) {
      formData.append('file', content);
    } else {
      formData.append('file', new Blob([content], { type: 'application/json' }), 'metadata.json');
    }

    // console.log('api key: ', PINATA_API_KEY);
    // console.log('secret api key: ', PINATA_API_SECRET_KEY);
    console.log('Uploading content to IPFS.......');
    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': `multipart/form-data`,
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_API_SECRET_KEY,
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
    setError(null);
    setIsLoading(true);

    if (!file) {
      alert('Please select a file to upload');
      setIsLoading(false);
      return;
    }

    if (!walletClient) {
      setError("No wallet connected. Please connect your wallet.");
      return;
    }

    if (isTestingMode && chainId !== 11155111) { // Sepolia chain ID
      setError("Testing mode detected, Please connect to the Sepolia network");
      return;
    }

    // Upload resource file
    let resourceUrl = '';
    if (isTestingMode) {
      // Use dummy IPFS hash for testing
      resourceUrl = 'QmTestHash1234567890TestHash1234567890TestHash00';
    } else {
      // Perform actual IPFS upload
      const uploadResult = await uploadToPinata(file);
      if (uploadResult === null) {
        throw new Error('Failed to upload resource to IPFS/Pinata');
      }
      resourceUrl = uploadResult;
    }

    // Prepare metadata
    const nftMetadata: NFTMetadata = {
      authorName: formData.authorName,
      authorWallet: formData.authorWallet || connectedAddress || '',
      title: formData.title,
      contributors: formData.contributors,
      tags: formData.tags,
      copublisherFees: formData.coPublishThreshold,
      url: formData.url,
      existingWorkId: formData.existingWorkId,
      mediaType: file.type,
      mediaUrl: resourceUrl,
      createdAt: new Date().toISOString()
    };

    // Generate metadata image
    const svgImage = generateNFTMetadataImage(nftMetadata);

    let metadataImageUrl = '';

    if (isTestingMode) {
      // Use dummy IPFS hash for testing
      metadataImageUrl = 'QmTestHash1234567890TestHash1234567890TestHash10';
    } else {
      // Perform actual IPFS upload
      const uploadResult = await uploadToPinata(svgImage);
      if (uploadResult === null) {
        throw new Error('Failed to upload metadata image to IPFS/Pinata');
      }
      metadataImageUrl = uploadResult;
    }


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
        { trait_type: 'CoPublisherFees', value: nftMetadata.copublisherFees },
        { trait_type: 'URL', value: nftMetadata.url },
        { trait_type: 'Existing Work ID', value: nftMetadata.existingWorkId },
        { trait_type: 'Media Type', value: nftMetadata.mediaType },
        { trait_type: 'Media URL', value: nftMetadata.mediaUrl },
      ],
    };

    // Upload final metadata
    let metadataUrl = '';

    if (isTestingMode) {
      // Use dummy IPFS hash for testing
      metadataUrl = 'QmTestHash1234567890TestHash1234567890TestHash12';
    } else {
      // Perform actual IPFS upload
      const uploadResult = await uploadToPinata(JSON.stringify(finalMetadata));
      if (uploadResult == null) {
        throw new Error('Failed to upload metadata image to IPFS/Pinata');
      }
      metadataUrl = uploadResult;
    }

    setIpfsUrls({ metadata: metadataUrl, resource: resourceUrl });
    alert('Successfully uploaded to IPFS/Pinata!');

    // Prepare data for smart contract interaction
    console.log('Prepare data for smart contract interaction');
    const authors = formData.authorWallet ? formData.authorWallet.split(',').map(t => t.trim()) : [];//[formData.authorWallet || connectedAddress || ''];
    const contributors = formData.contributors
      ? formData.contributors.split(',').map(c => c.split(':')[1].trim())
      : [];
    const ipfsHash = metadataUrl.split('/').pop() || '';
    const quotedAttestationId = formData.existingWorkId
      ? [formData.existingWorkId]
      : [];
    const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    console.log('Prepararation DONE!');

    setVerificationStatus('Attestation is being deployed on chain. It may take a few minutes to complete...');
    // Create the attestation using AttestationFactory
    const newAttestationAddress = await createAttestation(
      walletClient,
      authors,
      contributors,
      ipfsHash,
      quotedAttestationId,
      tags,
      formData.coPublishThreshold
    );

    setSmartContractAddress(newAttestationAddress);
    setIsLoading(false);
    alert('Attestation contract successfully deployed onchain :)');
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
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="testingMode"
            checked={isTestingMode}
            onChange={(e) => setIsTestingMode(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="testingMode">Enable Testing Mode (bypass IPFS upload)</label>
        </div>
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
          <label className="font-semibold">Co-Publish Amount Fees (in Eth):</label>
          <input
            name="coPublishThreshold"
            type="number"
            step="0.01"
            placeholder="0.1"
            value={formData.coPublishThreshold}
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
        {isLoading && <LoadingSpinner />}
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
            )
            }
          </div>
        )}
      </div>
      {verificationStatus && (
        <div className="mt-4 p-4 bg-blue-100 text-blue-700 rounded">
          {verificationStatus}
        </div>
      )}
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
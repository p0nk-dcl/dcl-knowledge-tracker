"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { BugAntIcon, MagnifyingGlassIcon, GlobeAltIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { generateNFTMetadataImage, NFTMetadata } from '../utils/dcl/generateMetadataImage';
import axios from 'axios';
import { ethers } from 'ethers';
import { createAttestation } from '../utils/dcl/contractInteraction';
import LoadingSpinner from '../components/LoadingSpinner';

const mainRegistryAddress = "0xa8f3Ec9865196a96d4C157A7965fAfF7ed46Ee97"; //smartcontract address deployed on Sepolia

const Home: NextPage = () => {
  const { address: connectedAddress = '' } = useAccount();
  const chainId = useChainId() || 0;
  const { data: walletClient } = useWalletClient();

  // Move state initializations and hooks inside a useEffect
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
  const [smartContractAddress, setSmartContractAddress] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'Pass' | 'Fail' | 'Pending'>('Pending');
  const [error, setError] = useState<string | null>(null);
  const [isTestingMode, setIsTestingMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Use useEffect to initialize client-side only state
  useEffect(() => {
    // Initialize any state that depends on browser APIs here
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // Check for single author address
    if (e.target.name === 'authorWallet') {
      const addresses = e.target.value.split(',').map(addr => addr.trim());
      if (addresses.length > 1) {
        setError('Only one author wallet address is allowed.');
      } else {
        setError(null);
      }
    }
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
    setVerificationStatus('Pending');

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
    const authorName = formData.authorName;
    const contributors = formData.contributors
      ? formData.contributors.split(',').map(c => c.split(':')[1].trim())
      : [];
    const ipfsHash = metadataUrl.split('/').pop() || '';
    const title = formData.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .toLowerCase();
    const quotedAttestationId = formData.existingWorkId
      ? [formData.existingWorkId]
      : [];
    const tags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    console.log('Prepararation DONE!');

    alert('Attestation is being deployed on chain. It may take a few minutes to complete...');
    // Create the attestation using AttestationFactory
    const newAttestationAddress = await createAttestation(
      walletClient,
      authors,
      authorName,
      contributors,
      ipfsHash,
      title,
      quotedAttestationId,
      tags,
      formData.coPublishThreshold
    );

    setSmartContractAddress(newAttestationAddress.address);
    setVerificationStatus(newAttestationAddress.verificationStatus);
    setIsLoading(false);

    if (newAttestationAddress.verificationStatus === 'Pass') {
      alert('Attestation contract successfully deployed and verified onchain :)');
    } else if (newAttestationAddress.verificationStatus === 'Fail') {
      alert('Attestation contract deployed but verification failed. Please check Etherscan for details.');
    } else {
      alert('Attestation contract deployed. Verification is still pending. Please check Etherscan for the final status.');
    }

  };


  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center text-black mb-8">
          Bring Your Work On-Chain
        </h1>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-black">Create Attestation</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="testingMode"
                  checked={isTestingMode}
                  onChange={(e) => setIsTestingMode(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="testingMode" className="text-sm text-gray-600">
                  Enable Testing Mode
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author Name
                    <span className="ml-1 text-gray-500 cursor-help" title="If there are multiple authors, you can use an alias and provide a splitter contract address as the wallet address.">ⓘ</span>
                  </label>
                  <input
                    name="authorName"
                    placeholder="e.g., John Doe"
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author Wallet Address
                  </label>
                  <input
                    name="authorWallet"
                    placeholder="e.g., 0x2538137867AEA631a3C880F26C1cC04eb843b8F9"
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    name="title"
                    placeholder="e.g., L2 for Good"
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contributors
                    <span className="ml-1 text-gray-500 cursor-help" title="List only the contributors whose participation you want to value. Format: Name: Wallet Address">ⓘ</span>
                  </label>
                  <input
                    name="contributors"
                    placeholder="e.g., Jonas Joe: 0xf39Fd6e51aa..., Kilian Kane: 0x709979...."
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    name="tags"
                    placeholder="e.g., 'l2', 'blockchain for good', 'refi'"
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Co-Publish Amount Fees (in Eth)
                  </label>
                  <input
                    name="coPublishThreshold"
                    type="number"
                    step="0.01"
                    placeholder="0.1"
                    value={formData.coPublishThreshold}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    name="url"
                    placeholder="e.g., https://example.com"
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Existing Work ID (optional)
                  </label>
                  <input
                    name="existingWorkId"
                    placeholder="e.g., 15489947987"
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        {isLoading && (
          <div className="mt-8 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {(ipfsUrls.metadata || ipfsUrls.resource || smartContractAddress) && (
          <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-semibold text-black mb-4">Upload Information</h2>
              {ipfsUrls.metadata && (
                <p className="mb-2">
                  <strong>Metadata CID:</strong>
                  <a href={ipfsUrls.metadata} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600 ml-2">
                    {ipfsUrls.metadata.split('/').pop()}
                  </a>
                </p>
              )}
              {ipfsUrls.resource && (
                <p className="mb-2">
                  <strong>Resource CID:</strong>
                  <a href={ipfsUrls.resource} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-600 ml-2">
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
          </div>
        )}

        {/* {verificationStatus && (
          <div className="mt-8 p-4 bg-green-100 text-green-700 rounded-lg">
            Verification Status: {verificationStatus}
          </div>
        )} */}

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <DocumentTextIcon className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">See Your Attestation</h3>
              <p className="text-gray-600 mb-4">
                Examine the work you have attested.
              </p>
              <Link
                href="/blockexplorer"
                className="text-green-500 hover:text-green-600 font-medium"
              >
                Open Attestation Viewer
              </Link>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <GlobeAltIcon className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Browse Attestations</h3>
              <p className="text-gray-600 mb-4">
                Explore existing attestations and their details.
              </p>
              <Link
                href="/attestation-viewer"
                className="text-green-500 hover:text-green-600 font-medium"
              >
                Go to Search Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
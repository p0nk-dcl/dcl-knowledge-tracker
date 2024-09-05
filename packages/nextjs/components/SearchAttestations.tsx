'use client'
import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import AttestationList from './AttestationList'
import Fuse from 'fuse.js'
import Map from './Map'

const url = 'https://api.studio.thegraph.com/query/87721/test-dcl-kp-tracker/version/latest'

const FETCH_ATTESTATIONS = gql`
  query FetchAttestations($first: Int!, $skip: Int!, $orderBy: String, $orderDirection: String) {
    attestations(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      address
      authors
      contributors
      isActivated
      activatedAt
      upvotes
      fundsReceived
      tags
      ipfsHash
      signatureCount
      totalReceivedFunds
      upvoteCount
      coPublishers
    }
  }
`

interface SearchAttestationsProps {
    itemsPerPage: number
}

// Update the QueryResult interface
interface QueryResult {
    attestations: Array<{
        id: string
        address: string
        authors: string[]
        contributors: string[]
        // copublishers: string[]
        isActivated: boolean
        activatedAt: string
        upvotes: string
        fundsReceived: string
        fundsClaimed: string
        tags: string[]
        ipfsHash: string
        quotedAttestationId: string[]
        signatureCount: string
        totalReceivedFunds: string
        upvoteCount: string
        coPublishers: string[]
    }>
}

export default function SearchAttestations({ itemsPerPage }: SearchAttestationsProps) {
    const [currentPage, setCurrentPage] = useState(1)
    const [orderBy, setOrderBy] = useState('activatedAt')
    const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')
    const [showActivatedOnly, setShowActivatedOnly] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [walletFilter, setWalletFilter] = useState('')
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
    const [appliedWalletFilter, setAppliedWalletFilter] = useState('')
    const [appliedOrderBy, setAppliedOrderBy] = useState('activatedAt')
    const [appliedOrderDirection, setAppliedOrderDirection] = useState<'asc' | 'desc'>('desc')
    const [showMap, setShowMap] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery<QueryResult>({
        queryKey: ['attestations', currentPage, appliedOrderBy, appliedOrderDirection],
        queryFn: async () => {
            const skip = (currentPage - 1) * itemsPerPage
            return request<QueryResult>(url, FETCH_ATTESTATIONS, {
                first: itemsPerPage,
                skip,
                orderBy: appliedOrderBy,
                orderDirection: appliedOrderDirection,
            })
        },
        staleTime: 60000, // Cache for 1 minute
        gcTime: 3600000, // Keep in cache for 1 hour
    })

    const filteredAttestations = useMemo(() => {
        if (!data?.attestations) return []
        let filtered = data.attestations

        if (showActivatedOnly) {
            filtered = filtered.filter(attestation => attestation.isActivated)
        }

        if (searchTerm) {
            filtered = filtered.filter(attestation =>
                attestation.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
                attestation.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        }

        if (appliedWalletFilter) {
            filtered = filtered.filter(attestation =>
                attestation.authors.includes(appliedWalletFilter) ||
                attestation.contributors.includes(appliedWalletFilter)
            )
        }

        return filtered
    }, [data?.attestations, showActivatedOnly, searchTerm, appliedWalletFilter])

    const attestationsWithLocation = useMemo(() => {
        return filteredAttestations.filter(attestation =>
            attestation.tags.some(tag => tag.startsWith('@loc:'))
        )
    }, [filteredAttestations])

    const resultCount = filteredAttestations.length

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>An error occurred: {error.message}</div>

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Search Attestations</h1>
                <button
                    onClick={() => setShowMap(!showMap)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    {showMap ? 'Show List' : 'Show Map'}
                </button>
            </div>
            <div className="mb-6 flex space-x-4">
                <input
                    type="text"
                    placeholder="Search attestations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-1/3 p-2 border rounded"
                />
                <input
                    type="text"
                    placeholder="Filter by wallet address"
                    value={walletFilter}
                    onChange={(e) => setWalletFilter(e.target.value)}
                    className="w-1/3 p-2 border rounded"
                />
                <button
                    onClick={() => {
                        setAppliedSearchTerm(searchTerm)
                        setAppliedWalletFilter(walletFilter)
                        setAppliedOrderBy(orderBy)
                        setAppliedOrderDirection(orderDirection)
                    }}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Search
                </button>
                <button
                    onClick={() => {
                        setSearchTerm('')
                        setWalletFilter('')
                        setAppliedSearchTerm('')
                        setAppliedWalletFilter('')
                    }}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Clear
                </button>
            </div>
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <label htmlFor="orderBy" className="mr-2">Order by:</label>
                    <select
                        id="orderBy"
                        value={orderBy}
                        onChange={(e) => setOrderBy(e.target.value)}
                        className="mr-4 p-2 border rounded"
                    >
                        <option value="activatedAt">Date</option>
                        <option value="upvotes">Likes</option>
                        <option value="fundsReceived">Funds Received</option>
                    </select>
                    <label htmlFor="orderDirection" className="mr-2">Direction:</label>
                    <select
                        id="orderDirection"
                        value={orderDirection}
                        onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
                        className="p-2 border rounded"
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <span className="mr-2">Show activated only:</span>
                    <button
                        onClick={() => setShowActivatedOnly(!showActivatedOnly)}
                        className={`w-12 h-6 flex items-center ${showActivatedOnly ? 'bg-blue-600' : 'bg-gray-300'} rounded-full p-1 duration-300 ease-in-out`}
                    >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${showActivatedOnly ? 'translate-x-6' : ''}`}></div>
                    </button>
                </div>
                <div className="text-lg font-semibold">
                    {resultCount} {resultCount === 1 ? 'result' : 'results'} found
                    {showMap && ` (${attestationsWithLocation.length} on map)`}
                </div>
            </div>
            {showMap ? (
                <Map
                    attestations={attestationsWithLocation}
                    onCountryClick={(country) => setSelectedCountry(country)}
                />
            ) : (
                <AttestationList
                    attestations={filteredAttestations}
                    itemsPerPage={itemsPerPage}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    )
}
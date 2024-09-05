'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import AttestationList from './AttestationList'
import Fuse from 'fuse.js'

const url = 'https://api.studio.thegraph.com/query/87721/test-dcl-kp-tracker/version/latest'

const FETCH_ATTESTATIONS = gql`
  query FetchAttestations($first: Int!, $skip: Int!) {
    attestations(first: $first, skip: $skip, orderBy: activatedAt, orderDirection: desc) {
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
    const [searchTerm, setSearchTerm] = useState('')
    const [walletFilter, setWalletFilter] = useState('')
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
    const [appliedWalletFilter, setAppliedWalletFilter] = useState('')

    // Update the useQuery hook to use the correct type
    const { data, isLoading, error } = useQuery<QueryResult>({
        queryKey: ['attestations', currentPage],
        queryFn: async () => {
            const skip = (currentPage - 1) * itemsPerPage
            return request<QueryResult>(url, FETCH_ATTESTATIONS, { first: itemsPerPage, skip })
        },
    })

    const fuse = useMemo(() => {
        if (!data?.attestations) return null
        return new Fuse(data.attestations, {
            keys: ['authors', 'contributors', 'tags', 'address'],
            includeScore: true,
            threshold: 0.4,
        })
    }, [data?.attestations])

    const filteredAttestations = useMemo(() => {
        if (!data?.attestations) return []
        let filtered = data.attestations

        if (appliedWalletFilter) {
            filtered = filtered.filter(attestation =>
                attestation.authors.includes(appliedWalletFilter) ||
                attestation.contributors.includes(appliedWalletFilter)
            )
        }

        if (appliedSearchTerm && fuse) {
            const results = fuse.search(appliedSearchTerm)
            filtered = results.map(result => result.item)
        }

        return filtered
    }, [data?.attestations, appliedSearchTerm, appliedWalletFilter, fuse])

    const handleSearch = () => {
        setAppliedSearchTerm(searchTerm)
        setAppliedWalletFilter(walletFilter)
    }

    const handleClear = () => {
        setSearchTerm('')
        setWalletFilter('')
        setAppliedSearchTerm('')
        setAppliedWalletFilter('')
    }

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>An error occurred: {error.message}</div>

    console.log('Received data:', data); // Add this line for debugging

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Search Attestations</h1>
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
                    onClick={handleSearch}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Search
                </button>
                <button
                    onClick={handleClear}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Clear
                </button>
            </div>
            <AttestationList
                attestations={filteredAttestations}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
            />
        </div>
    )
}
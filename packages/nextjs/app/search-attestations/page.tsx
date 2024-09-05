import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { gql, request } from 'graphql-request'
import SearchAttestations from '../../components/SearchAttestations'

const url = 'https://api.studio.thegraph.com/query/87721/test-dcl-kp-tracker/version/latest'

// We'll use this query to fetch initial data
const INITIAL_ATTESTATIONS = gql`
  query InitialAttestations($first: Int!, $skip: Int!) {
    attestations(first: $first, skip: $skip, orderBy: activatedAt, orderDirection: desc) {
      id
      address
      authors
      contributors
      copublishers
      isActivated
      activatedAt
      upvotes
      fundsReceived
      tags
      ipfsHash
      signatureCount
      totalReceivedFunds
      upvoteCount
    }
  }
`

const ITEMS_PER_PAGE = 30

export default async function SearchAttestationsPage() {
    const queryClient = new QueryClient()

    await queryClient.prefetchQuery({
        queryKey: ['initialAttestations', 0],
        queryFn: async () => {
            return request(url, INITIAL_ATTESTATIONS, { first: ITEMS_PER_PAGE, skip: 0 })
        }
    })

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SearchAttestations itemsPerPage={ITEMS_PER_PAGE} />
        </HydrationBoundary>
    )
}

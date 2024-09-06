import { gql } from 'graphql-request'

export const SEARCH_ATTESTATIONS = gql`
  query SearchAttestations($first: Int!, $skip: Int!, $where: Attestation_filter, $orderBy: Attestation_orderBy, $orderDirection: OrderDirection) {
    attestations(
      first: $first
      skip: $skip
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
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
    }
  }
`
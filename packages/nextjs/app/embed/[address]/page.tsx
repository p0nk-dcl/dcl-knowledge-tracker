import EmbeddedAttestation from '../../../components/attestation/EmbeddedAttestation';

export default function EmbedPage({ params }: { params: { address: string } }) {
    return <EmbeddedAttestation attestationAddress={params.address} />;
}
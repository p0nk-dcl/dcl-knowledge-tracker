import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
    title: "Attestation Viewer",
    description: "Attestation Viewer created with 🏗 Scaffold-ETH 2",
});

const AttestationViewerLayout = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export default AttestationViewerLayout;
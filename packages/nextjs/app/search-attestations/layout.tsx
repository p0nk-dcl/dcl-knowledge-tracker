import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
    title: "Search Attestations",
    description: "Broowse Attestations",
});

const SearchAttestationsLayout = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export default SearchAttestationsLayout;
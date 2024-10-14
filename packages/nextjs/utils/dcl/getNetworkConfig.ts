import hardhatConfig from '../../../hardhat/hardhat.config';

type NetworkConfig = {
    [key: string]: {
        url: string;
        accounts?: string[];
    };
};

const networkConfigs: NetworkConfig = hardhatConfig.networks as NetworkConfig;

export function getRpcUrl(networkName: string = 'sepolia'): string {
    const network = networkConfigs[networkName];
    if (!network || !network.url) {
        throw new Error(`No configuration found for network: ${networkName}`);
    }
    return network.url;
}
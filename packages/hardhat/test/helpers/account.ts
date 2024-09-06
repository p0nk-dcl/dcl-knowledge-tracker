// File: test/helpers/accounts.ts

import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

let allSigners: SignerWithAddress[] = [];

async function initializeSigners() {
    if (allSigners.length === 0) {
        allSigners = await ethers.getSigners();
    }
}

export async function getRandomAccount(): Promise<SignerWithAddress> {
    await initializeSigners();
    const randomIndex = Math.floor(Math.random() * allSigners.length);
    return allSigners[randomIndex];
}

export async function getRandomAccounts(count: number): Promise<SignerWithAddress[]> {
    await initializeSigners();
    const shuffled = [...allSigners].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
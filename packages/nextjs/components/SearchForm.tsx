'use client'
import { useState } from 'react'

interface SearchFormProps {
    onSearch: (searchParams: {
        title: string;
        tags: string[];
        authors: string[];
        walletAddress: string;
        activationStatus: boolean | undefined;
    }) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
    const [title, setTitle] = useState('')
    const [tags, setTags] = useState('')
    const [authors, setAuthors] = useState('')
    const [walletAddress, setWalletAddress] = useState('')
    const [activationStatus, setActivationStatus] = useState('')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        onSearch({
            title,
            tags: tags.split(',').map(tag => tag.trim()),
            authors: authors.split(',').map(author => author.trim()),
            walletAddress,
            activationStatus: activationStatus === 'true',
        })
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
            />
            <input
                type="text"
                placeholder="Authors (comma-separated)"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
            />
            <input
                type="text"
                placeholder="Wallet Address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
            />
            <select
                value={activationStatus}
                onChange={(e) => setActivationStatus(e.target.value)}
            >
                <option value="">Any activation status</option>
                <option value="true">Activated</option>
                <option value="false">Not activated</option>
            </select>
            <button type="submit">Search</button>
        </form>
    )
}
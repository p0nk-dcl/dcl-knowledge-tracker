import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { address: string } }
) {
    const address = params.address;

    if (!address) {
        return NextResponse.json({ error: 'Invalid attestation address' }, { status: 400 });
    }

    // Redirect to the embed page
    return NextResponse.redirect(new URL(`/embed/${address}`, request.url));
}
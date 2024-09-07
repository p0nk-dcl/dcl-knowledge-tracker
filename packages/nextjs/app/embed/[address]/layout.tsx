export const metadata = {
    title: 'Embedded Attestation',
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script src="https://cdn.tailwindcss.com"></script>
                <script dangerouslySetInnerHTML={{
                    __html: `
                        function resizeIframe() {
                            const height = document.body.scrollHeight;
                            window.parent.postMessage({ type: 'resize', height: height }, '*');
                        }
                        window.addEventListener('load', resizeIframe);
                        window.addEventListener('resize', resizeIframe);
                    `
                }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
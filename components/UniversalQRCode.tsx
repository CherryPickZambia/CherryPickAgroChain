"use client";

import { QRCodeSVG } from "qrcode.react";
import { Leaf, Download } from "lucide-react";

interface UniversalQRCodeProps {
    size?: number;
    showDownload?: boolean;
    className?: string;
}

export default function UniversalQRCode({
    size = 200,
    showDownload = true,
    className = ""
}: UniversalQRCodeProps) {
    // The universal lookup URL - all QR codes point here
    const lookupUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/lookup`
        : "https://cherrypick.zm/lookup";

    const handleDownload = () => {
        const svg = document.getElementById("universal-qr-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = size + 40;
            canvas.height = size + 80;

            if (ctx) {
                // White background
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR code
                ctx.drawImage(img, 20, 20, size, size);

                // Add text below
                ctx.fillStyle = "#059669";
                ctx.font = "bold 14px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("SCAN TO VERIFY", canvas.width / 2, size + 45);
                ctx.font = "12px sans-serif";
                ctx.fillStyle = "#6b7280";
                ctx.fillText("cherrypick.zm/lookup", canvas.width / 2, size + 65);
            }

            const link = document.createElement("a");
            link.download = "cherrypick-qr-code.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
                {/* Logo above QR */}
                <div className="flex items-center justify-center mb-3">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Leaf className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-bold text-gray-800">Cherry Pick</span>
                    </div>
                </div>

                {/* QR Code */}
                <QRCodeSVG
                    id="universal-qr-svg"
                    value={lookupUrl}
                    size={size}
                    level="H"
                    includeMargin={false}
                    fgColor="#0d9488"
                    bgColor="transparent"
                />

                {/* Text below QR */}
                <div className="text-center mt-3">
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                        Scan to Verify
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Enter batch code on package
                    </p>
                </div>
            </div>

            {/* Download button */}
            {showDownload && (
                <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                    <Download className="h-4 w-4" />
                    Download for Packaging
                </button>
            )}
        </div>
    );
}

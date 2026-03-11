export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center flex flex-col items-center">
                <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-500 font-medium">Loading AgroChain360...</p>
            </div>
        </div>
    );
}

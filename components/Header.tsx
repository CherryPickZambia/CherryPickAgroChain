"use client";

import { useEvmAddress } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react";
import { truncateAddress } from "@/lib/utils";
import { Sprout } from "lucide-react";

interface HeaderProps {
  userRole?: "farmer" | "buyer" | "officer" | "admin" | null;
  onRoleChange?: (role: null) => void;
}

export default function Header({ userRole, onRoleChange }: HeaderProps) {
  const { evmAddress } = useEvmAddress();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] p-2.5 rounded-xl shadow-md">
              <Sprout className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a1a] tracking-tight">AgroChain360</h1>
              {userRole && (
                <p className="text-xs text-gray-500 font-medium capitalize">{userRole} Dashboard</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {evmAddress && (
              <>
                <div className="hidden sm:block">
                  <div className="bg-[#f0f7f4] px-4 py-2.5 rounded-xl border border-[#2d5f3f]/10">
                    <p className="text-sm font-semibold text-[#2d5f3f]">
                      {truncateAddress(evmAddress)}
                    </p>
                  </div>
                </div>
                {userRole && onRoleChange && (
                  <button
                    onClick={() => onRoleChange(null)}
                    className="text-sm font-medium text-gray-600 hover:text-[#2d5f3f] transition-colors px-4 py-2 rounded-lg hover:bg-[#f0f7f4]"
                  >
                    Change Role
                  </button>
                )}
              </>
            )}
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  );
}

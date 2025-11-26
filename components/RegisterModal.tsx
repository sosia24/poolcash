"use client";

import { useWallet } from "@/services/walletContext";
import { isRegistered, registerUser } from "@/services/Web3Services";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "./LanguageManager";

export default function RegisterModal() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const referralAddressFromUrl = searchParams.get("ref");
  const { address: walletAddress } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const [referralAddress, setReferralAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");

  useEffect(() => {
    if (walletAddress) {
      isRegistered(walletAddress).then((result) => {
        setIsRegisteredUser(result);
        if (!result) setIsOpen(true);
      });
    }
  }, [walletAddress]);

  useEffect(() => {
    if (referralAddressFromUrl) {
      setReferralAddress(referralAddressFromUrl);
    }
  }, [referralAddressFromUrl]);

 const handleRegisterSponsor = async () => {
  if (!referralAddress.trim()) {
    setError(t.networkRegisterModal.errorEmpty);
    return;
  }

  setLoading(true);
  setError("");
  setAlert("");

  try {
    await registerUser(referralAddress);

    // Mensagem de sucesso
    setAlert(t.networkRegisterModal.success);

    // Revalida o status na blockchain
    if(walletAddress){
    const check = await isRegistered(walletAddress);
    

    if (check) {
      setIsRegisteredUser(true);
      setTimeout(() => setIsOpen(false), 600);
    }
    
  }

  } catch (err) {
    console.error(err);
    setError(t.networkRegisterModal.errorFail);
  } finally {
    setLoading(false);
  }
};


  if (!walletAddress || isRegisteredUser) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* MODAL */}
          <motion.div
            className="fixed inset-0 z-[350] flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="relative w-[90%] max-w-md p-6 rounded-2xl 
              bg-gradient-to-b from-black via-neutral-900 to-black 
              border border-green-400/50 shadow-[0_0_25px_#00ff75]">

              {/* TÍTULO */}
              <h2 className="text-3xl font-bold bg-gradient-to-r 
                from-green-400 to-yellow-300 bg-clip-text text-transparent text-center">
                Register
              </h2>

              <p className="text-gray-300 text-center mt-1">
                Enter the referral address to continue.
              </p>

              {/* INPUT */}
              <label className="block text-sm text-gray-300 mt-6 mb-1">
                Referral Address
              </label>

              <input
                type="text"
                className="w-full px-4 py-2 rounded-lg text-shadow-gray-200
                  border border-green-400/50 focus:ring-2 
                  focus:ring-yellow-300 outline-none"
                placeholder="0x..."
                value={referralAddress}
                onChange={(e) => setReferralAddress(e.target.value)}
              />

              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              {alert && (
                <p className="text-green-500 text-sm mt-2">{alert}</p>
              )}

              {/* BOTÃO */}
              <button
                onClick={handleRegisterSponsor}
                disabled={loading}
                className="mt-6 w-full py-3 cursor-pointer font-semibold rounded-xl
                  bg-gradient-to-r from-green-400 to-yellow-300 
                  text-black shadow-[0_0_20px_#00ff75]
                  hover:from-green-500 hover:to-yellow-400 transition-all"
              >
                {loading ? "Registering..." : "Register Referral"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

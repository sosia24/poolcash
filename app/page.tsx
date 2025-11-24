"use client";

import Image from "next/image";
import { useWallet } from "@/services/walletContext";
import { doLogin, isRegistered } from "@/services/Web3Services";
import { useState, useEffect } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import RegisterModal from "@/components/RegisterModal";

export default function Home() {
    const { address, setAddress } = useWallet();
    const [loading, setLoading] = useState(false);

    // Garantir que o usuário está registrado
    const [isRegisteredUser, setIsRegisteredUser] = useState<boolean | null>(null);

    // Quando conectar a wallet → checar registro
    useEffect(() => {
        if (address) {
            isRegistered(address).then((result) => {
                setIsRegisteredUser(result);
            });
        }
    }, [address]);

    const handleLogin = async () => {
        try {
            setLoading(true);
            const newAddress = await doLogin();
            setAddress(newAddress);
            const registered = await isRegistered(newAddress);
            setIsRegisteredUser(registered);
        } catch (err) {
            console.error("Login failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const canAccessGame = address && isRegisteredUser === true;

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">

            {/* FUNDO ANIMADO */}
            <AnimatedBackground />

            {/* RegisterModal só aparece se endereço conectado + usuário NÃO registrado */}
            {address && isRegisteredUser === false && <RegisterModal />}

            {/* Conteúdo principal */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">

                {/* LOGO */}
                <Image
                    src="/Pool-Cash-Logo.svg"
                    width={300}
                    height={300}
                    alt="PoolCash"
                    className="drop-shadow-[0_0_20px_#00ff75]"
                />

                <h1
                    className="mt-6 text-4xl md:text-6xl font-extrabold 
                    bg-gradient-to-r from-green-400 via-yellow-300 to-green-500 
                    bg-clip-text text-transparent drop-shadow-[0_0_20px_#00ff75]"
                >
                    Bem-vindo ao PoolCash
                </h1>

                <p className="mt-4 max-w-[500px] text-gray-300 text-lg md:text-xl">
                    O futuro dos jogos Web3 com recompensas reais.
                </p>

                {/* BOTÃO ÚNICO */}
                {!address ? (
                    <button
                        onClick={handleLogin}
                        className="mt-10 py-3 px-10 text-black font-bold text-xl rounded-full
                                   bg-gradient-to-r from-green-400 to-yellow-300
                                   hover:from-green-500 hover:to-yellow-400
                                   transition-all shadow-[0_0_20px_#00ff75]"
                    >
                        {loading ? "Conectando..." : "Conectar Wallet"}
                    </button>
                ) : canAccessGame ? (
                    <a
                        href="/poolGame"
                        className="mt-10 py-3 px-10 text-black font-bold text-xl rounded-full
                                   bg-gradient-to-r from-green-400 to-yellow-300
                                   hover:from-green-500 hover:to-yellow-400
                                   transition-all shadow-[0_0_20px_#00ff75]"
                    >
                        Entrar no PoolGame
                    </a>
                ) : (
                    <button
                        className="mt-10 py-3 px-10 text-black font-bold text-xl rounded-full
                                   bg-gray-600 opacity-50 cursor-not-allowed"
                    >
                        Complete o Registro
                    </button>
                )}

                {/* Endereço da wallet */}
                {address && (
                    <p className="text-gray-400 text-sm mt-4">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                )}
            </div>
        </div>
    );
}

'use client'

import Image from "next/image"
import { useWallet } from "@/services/walletContext"
import { doLogin, isRegistered } from "@/services/Web3Services"
import { useState, useEffect } from "react"
import AnimatedBackground from "@/components/AnimatedBackground"
import RegisterModal from "@/components/RegisterModal"
import { FaFilePdf } from "react-icons/fa" // Ícone do PDF já importado

export default function Home() {
    const { address, setAddress } = useWallet()
    const [loading, setLoading] = useState(false)

    // Garantir que o usuário está registrado
    const [isRegisteredUser, setIsRegisteredUser] = useState<boolean | null>(null)

    // Quando conectar a wallet → checar registro
    useEffect(() => {
        if (address) {
            isRegistered(address).then((result) => {
                setIsRegisteredUser(result)
            })
        }
    }, [address])

// Seu handleLogin já tem a lógica correta:

const handleLogin = async () => {
    try {
        setLoading(true)
        const newAddress = await doLogin()
        
        // 1. Atualiza o endereço
        setAddress(newAddress) 
        
        // 2. Checa o registro IMEDIATAMENTE usando o newAddress
        const registered = await isRegistered(newAddress)
        
        // 3. Atualiza o estado de registro
        setIsRegisteredUser(registered)
        
    } catch (err) {
        console.error("Login failed:", err)
    } finally {
        setLoading(false)
    }
}



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
                    src="/Pool-Cash-Logo.png"
                    width={350}
                    height={350}
                    alt="PoolCash"
                    className=""
                />

                <h1
                    className="mt-6 text-4xl md:text-6xl font-extrabold 
                    bg-gradient-to-r from-green-400 via-yellow-300 to-green-500 
                    bg-clip-text text-transparent "
                >
                    Welcome to PoolCash
                </h1>

                <p className="mt-4 max-w-[500px] text-gray-300 text-lg md:text-xl">
                    The future of Web3 gaming with real rewards.
                </p>

                {/* SINGLE BUTTON */}
                {!address ? (
                    <button
                        onClick={handleLogin}
                        className="mt-10 py-3 px-10 cursor-pointer text-black font-bold text-xl rounded-full
                                         bg-gradient-to-r from-green-400 to-yellow-300
                                         hover:from-green-500 hover:to-yellow-400
                                         transition-all shadow-[0_0_20px_#00ff75]"
                    >
                        {loading ? "Connecting..." : "Connect Wallet"}
                    </button>
                ) : isRegisteredUser ? (
                    <a
                        href="/poolGame"
                        className="mt-10 py-3 px-10 text-black font-bold text-xl rounded-full
                                         bg-gradient-to-r from-green-400 to-yellow-300
                                         hover:from-green-500 hover:to-yellow-400
                                         transition-all shadow-[0_0_20px_#00ff75]"
                    >
                        Enter PoolGame
                    </a>
                ) : (
                    <button
                        className="mt-10 py-3 px-10 text-black font-bold text-xl rounded-full
                                         bg-gray-600 opacity-50 cursor-not-allowed"
                    >
                        Complete the Registration
                    </button>
                )}

                {/* Endereço da wallet */}
                {address && (
                    <p className="text-gray-400 text-sm mt-4">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                )}

                {/* 🔽 NOVO: SEÇÃO DE DOWNLOADS DOS PDFs MELHORADA 🔽 */}
                <div className="mt-10 flex flex-col items-center space-y-3 w-full max-w-sm">
                    <h3 className="text-xl font-extrabold text-green-400 drop-shadow-[0_0_15px_#00ff75] uppercase tracking-widest">
                        Presentations
                    </h3>
                    <div className="flex flex-col space-y-3 w-full">
                        
                        {/* Cartão 1: Português */}
                        <a
                            href="/Pool Cash Portuguese.pdf"
                            download
                            className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl cursor-pointer
                                       transition-all duration-300 transform border-2 border-gray-700
                                       hover:border-green-400 hover:shadow-[0_0_15px_#00ff75]" // Efeito Neon/Glow
                        >
                            <span className="text-lg font-semibold text-gray-100">
                                Portuguese
                            </span>
                            <FaFilePdf className="text-green-400 text-2xl drop-shadow-[0_0_5px_#00ff75]" />
                        </a>

                        {/* Cartão 2: Spanish */}
                        <a
                            href="/Pool Cash Spanish.pdf"
                            download
                            className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl cursor-pointer
                                       transition-all duration-300 transform border-2 border-gray-700
                                       hover:border-yellow-300 hover:shadow-[0_0_15px_#ffeb3b]" // Efeito Neon/Glow (Amarelo)
                        >
                            <span className="text-lg font-semibold text-gray-100">
                                Spanish
                            </span>
                            <FaFilePdf className="text-yellow-300 text-2xl drop-shadow-[0_0_5px_#ffeb3b]" />
                        </a>

                        {/* Cartão 3: English */}
                        <a
                            href="/Pool Cash English.pdf"
                            download
                            className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl cursor-pointer
                                       transition-all duration-300 transform border-2 border-gray-700
                                       hover:border-blue-400 hover:shadow-[0_0_15px_#00ff75]" // Efeito Neon/Glow
                        >
                            <span className="text-lg font-semibold text-gray-100">
                                English
                            </span>
                            <FaFilePdf className="text-blue-400 text-2xl drop-shadow-[0_0_5px_#00ff75]" />
                        </a>

                    </div>
                </div>
                {/* 🔼 FIM DA SEÇÃO DE DOWNLOADS 🔼 */}

            </div>
        </div>
    )
}
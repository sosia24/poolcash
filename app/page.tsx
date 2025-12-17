'use client'

import Image from "next/image"
import { useWallet } from "@/services/walletContext"
import { doLogin, isRegistered } from "@/services/Web3Services"
import { useState, useEffect, useCallback } from "react"
import AnimatedBackground from "@/components/AnimatedBackground"
import RegisterModal from "@/components/RegisterModal"
import { FaFilePdf } from "react-icons/fa"

export default function Home() {
    const { address, setAddress } = useWallet()
    const [loading, setLoading] = useState(false)
    const [isRegisteredUser, setIsRegisteredUser] = useState<boolean | null>(null)

    // Função para verificar registro isolada para reuso
    const checkRegistration = useCallback(async (walletAddress: string) => {
        try {
            const result = await isRegistered(walletAddress)
            setIsRegisteredUser(result)
        } catch (error) {
            console.error("Error checking registration:", error)
            setIsRegisteredUser(false)
        }
    }, [])

    // Efeito para validar quando o endereço muda (ex: trocar conta no MetaMask)
    useEffect(() => {
        if (address) {
            checkRegistration(address)
        } else {
            setIsRegisteredUser(null)
        }
    }, [address, checkRegistration])

    const handleLogin = async () => {
        if (loading) return
        try {
            setLoading(true)
            const newAddress = await doLogin()
            if (newAddress) {
                setAddress(newAddress)
                // Checa o registro imediatamente após o login
                await checkRegistration(newAddress)
            }
        } catch (err) {
            console.error("Login failed:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
            <AnimatedBackground />

            {/* Modal de Registro: Só aparece se estiver conectado e confirmado que NÃO é registrado */}
            {address && isRegisteredUser === false && (
                <RegisterModal />
            )}

            <div className="relative z-10 flex flex-col items-center text-center px-6 py-10">
                <Image
                    src="/Pool-Cash-Logo.png"
                    width={350}
                    height={350}
                    alt="PoolCash"
                    priority
                    className="drop-shadow-[0_0_20px_rgba(0,255,117,0.3)]"
                />

                <h1 className="mt-6 text-4xl md:text-6xl font-extrabold 
                    bg-gradient-to-r from-green-400 via-yellow-300 to-green-500 
                    bg-clip-text text-transparent">
                    Welcome to PoolCash
                </h1>

                <p className="mt-4 max-w-[500px] text-gray-300 text-lg md:text-xl">
                    The future of Web3 gaming with real rewards.
                </p>

                {/* --- LÓGICA DE BOTÕES DINÂMICOS --- */}
                <div className="mt-10 min-h-[80px]"> 
                    {!address ? (
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="py-3 px-10 cursor-pointer text-black font-bold text-xl rounded-full
                                     bg-gradient-to-r from-green-400 to-yellow-300
                                     hover:from-green-500 hover:to-yellow-400
                                     transition-all shadow-[0_0_20px_#00ff75] active:scale-95 disabled:opacity-70"
                        >
                            {loading ? "Connecting..." : "Connect Wallet"}
                        </button>
                    ) : isRegisteredUser === null ? (
                        <div className="text-green-400 animate-pulse font-bold">Verifying account...</div>
                    ) : isRegisteredUser ? (
                        <a
                            href="/poolGame"
                            className="py-3 px-10 text-black font-bold text-xl rounded-full
                                     bg-gradient-to-r from-green-400 to-yellow-300
                                     hover:from-green-500 hover:to-yellow-400
                                     transition-all shadow-[0_0_20px_#00ff75] inline-block"
                        >
                            Enter PoolGame
                        </a>
                    ) : (
                        <button
                            className="py-3 px-10 text-white font-bold text-xl rounded-full
                                     bg-gray-800 border border-green-500 shadow-[0_0_10px_#00ff75] animate-bounce"
                        >
                            Complete Registration Above 👆
                        </button>
                    )}
                </div>

                {address && (
                    <p className="text-gray-400 text-sm mt-4 font-mono bg-gray-900/50 px-4 py-1 rounded-full border border-gray-800">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </p>
                )}

                {/* --- SEÇÃO DE DOWNLOADS --- */}
                <div className="mt-16 flex flex-col mb-10 items-center space-y-4 w-full max-w-sm">
                    <h3 className="text-xl font-extrabold text-green-400 drop-shadow-[0_0_15px_#00ff75] uppercase tracking-widest">
                        Presentations
                    </h3>
                    
                    <div className="flex flex-col space-y-3 w-full">
                        <PdfLink 
                            href="/Pool Cash Portuguese.pdf" 
                            label="Portuguese" 
                            color="hover:border-green-400 hover:shadow-[0_0_15px_#00ff75]" 
                            iconColor="text-green-400"
                        />
                        <PdfLink 
                            href="/Pool Cash Spanish.pdf" 
                            label="Spanish" 
                            color="hover:border-yellow-300 hover:shadow-[0_0_15px_#ffeb3b]" 
                            iconColor="text-yellow-300"
                        />
                        <PdfLink 
                            href="/Pool Cash English.pdf" 
                            label="English" 
                            color="hover:border-blue-400 hover:shadow-[0_0_15px_#60a5fa]" 
                            iconColor="text-blue-400"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Sub-componente para limpar o código dos links de PDF
function PdfLink({ href, label, color, iconColor }: { href: string, label: string, color: string, iconColor: string }) {
    return (
        <a
            href={href}
            download
            className={`flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl cursor-pointer
                       transition-all duration-300 border-2 border-gray-700 ${color}`}
        >
            <span className="text-lg font-semibold text-gray-100">{label}</span>
            <FaFilePdf className={`${iconColor} text-2xl`} />
        </a>
    )
}
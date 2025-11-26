"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReferralTree from "@/components/networkModal";
import { FiBarChart2 } from 'react-icons/fi';
import {EligibilityTable} from "@/components/EligibilityTable";
import {
    getUserTickIds,
    getTickDatas,
    buyMpoolCash,
    approveUSDTCash,
    getActualPoints,
    claimMPoolCash,
    reinvestMPoolCash,
    hasPositionClaimed,
    fetchSponsor,
    fetchUserTable,
} from "@/services/Web3Services";
import { useWallet } from "@/services/walletContext";
import { TickProgressBar } from "@/components/tickProgessBar";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ExternalLink, Loader2, DollarSign } from "lucide-react"; // Novos ícones
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageManager";
import Decimal from "decimal.js";
import Image from "next/image";
Decimal.set({ precision: 10 });

// === TIPOS (Interfaces) ===
function tickToPrice(tick: number): Decimal {
    const base = new Decimal(1.0001);
    return base.pow(tick);
}

type ModalState = {
    isOpen: boolean;
    step: "approve" | "buy" | "success" | "error";
    status: "idle" | "pending" | "success" | "error";
    message: string;
};

interface TickData {
    currentTick: number;
    upperTick: number;
    startTick: number;
}

interface UserPosition {
    id: number;
    data: TickData | null;
    amountInvested: number;
    unrealizedProfit: number;
    currentValue: number;
}

interface PoolMetrics {
    totalValueLocked: number;
    dailyVolumeUSD: number;
    apy: number;
}

interface Table {
    isEligible: boolean[];
    directsRequirement: number[];
    valueInvestedRequirement: bigint[]; 
}

interface UserTable {
    table: Table;
    directsQuantity: number;
    valueInvested: bigint;
}

// === COMPONENTE VISUAL NOVO: Pool Status Card ===
const PoolStatusCard = ({ metrics, sharesBought }: { metrics: PoolMetrics; sharesBought: number;}) => {
    return (
        <div className="w-full max-w-[360px] lg:max-w-full rounded-2xl border border-green-600/30 bg-gradient-to-b from-black/10 to-black/30 p-4 shadow-[0_10px_30px_rgba(0,255,120,0.06)]">
            <h3 className="text-xl font-bold text-green-300 mb-4 border-b border-gray-700/50 pb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Pool Metrics
            </h3>
            
            <div className="flex justify-between items-center mb-4">
                <div className="text-center flex-1 p-3 bg-black/40 rounded-lg border border-green-700/20">
                    <div className="text-sm text-gray-300">Total Pool Value</div>
                    <div className="text-2xl font-bold text-yellow-400">${metrics.totalValueLocked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                
            </div>



            <div className="mt-6 pt-4 border-t border-gray-700/50 flex justify-between">
                <div className="text-left">
                    <div className="text-sm text-gray-300">Your Shares</div>
                    <div className="text-xl font-bold text-white">{sharesBought}</div>
                </div>
            </div>
        </div>
    );
};
// === COMPONENTE PRINCIPAL ===

export default function App() {
    const shareValue = 10; // Mantendo o valor da share, mas removendo o limite inicial
    const { address, setAddress } = useWallet();
    const { t } = useLanguage();
    const router = useRouter();
        const ARRAY_15_BOOLEAN = Array(15).fill(false);
        const ARRAY_15_NUMBER = Array(15).fill(0);
        const ARRAY_15_BIGINT = Array(15).fill(0n);
    const [sharesBought, setSharesBought] = useState(0);
    const [inputQuantity, setInputQuantity] = useState(1);
    const [inputValue, setInputValue] = useState(String(1));
    const [loading, setLoading] = useState(false);
    const [loadingClaim, setLoadingClaim] = useState(false);
    const [loadingReinvest, setLoadingReinvest] = useState(false);
    const [message, setMessage] = useState("");
      const referralLink = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/?ref=${address}`;
    const [copied, setCopied] = useState(false);

  const [sponsor, setSponsor] = useState<string | null>(null);
const [userTable, setUserTable] = useState<UserTable>({
        // Dados do Usuário (inicia com zero)
        directsQuantity: 0,
        valueInvested: 0n, // Inicializa como BigInt

        // Estrutura Table (inicia com arrays vazios/padrão de 15)
        table: {
            isEligible: ARRAY_15_BOOLEAN,
            directsRequirement: ARRAY_15_NUMBER,
            valueInvestedRequirement: ARRAY_15_BIGINT, 
        }
    });
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        step: "approve",
        status: "idle",
        message: "",
    });

    const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
    const [isPositionsLoading, setIsPositionsLoading] = useState(true);
    const [positionsClaimedMap, setPositionsClaimedMap] = useState<{
        [id: number]: boolean;
    }>({});
    
    // Novo estado para as métricas da Pool
    const [poolMetrics, setPoolMetrics] = useState<PoolMetrics>({
        totalValueLocked: 0,
        dailyVolumeUSD: 0,
        apy: 0,
    });

    // --- Funções de Busca Web3 (useCallback) ---


    async function getUserSponsor(){
        try{
            if(address){
                const result = await fetchSponsor(address);
                setSponsor(result)
                }
        }catch(error){
            console.error("Failed to fetch sponsor:", error);   
        }
    }


useEffect(() => {
        if (!address) return;

        const loadData = async () => {
            try {
                const data = await fetchUserTable(address);
                // 2. Atualiza o estado com os dados recebidos do contrato
                setUserTable({
                    // Assumindo que fetchEligibilityData já retorna no formato { table: { isEligible: [...], ... }, directsQuantity, valueInvested }
                    ...data 
                });
            } catch (error) {
                console.error("Falha ao carregar dados:", error);
            } finally {
                console.log("finis")
            }
        };

        loadData();
    }, [address]);

    const fetchPoolData = useCallback(async () => {
        try {
            // 1. Fetch Shares Bought (sua participação)
            const newShares = (await getActualPoints()); 
            setPoolMetrics(prevMetrics => ({
                ...prevMetrics,
                totalValueLocked : newShares,
            }))
            setSharesBought(newShares/10);
            

        } catch (error) {
            console.error("Failed to fetch pool data:", error);
        }
    }, []);

    const switchAccount = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({
                    method: "wallet_requestPermissions",
                    params: [{ eth_accounts: {} }],
                });

                const accounts = await window.ethereum.request({
                    method: "eth_accounts",
                });
                
                // Melhoria UX: Atualiza o endereço e refaz o fetch, sem recarregar a página
                setAddress(accounts[0]);
                fetchPoolData();
                if (accounts[0]) fetchUserPositions(accounts[0]);

            } catch (error) {
                console.error("Erro ao trocar de conta:", error);
            }
        }
    };

      const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // volta para "Copy" após 2 segundos
  };

    const fetchUserPositions = useCallback(async (address: string) => {
        if (!address) return;
        setIsPositionsLoading(true);
        try {
            const ids = await getUserTickIds(address);

            const positionPromises = ids.map(async (id) => {
                const data = await getTickDatas(id);
                return {
                    id,
                    data,
                } as UserPosition;
            });

            const results = await Promise.allSettled(positionPromises);

            const positions = results
                .filter((result) => result.status === "fulfilled")
                .map((result) => (result as PromiseFulfilledResult<UserPosition>).value)
                .reverse();

            setUserPositions(positions);
        } catch (err) {
            console.error("Failed to load your positions.", err);
        } finally {
            setIsPositionsLoading(false);
        }
    }, []);

    // --- Efeitos (Autoplay, Busca de Dados, Claims) ---

    useEffect(() => {
        fetchPoolData();
        if (address) fetchUserPositions(address);

        const interval = setInterval(() => {
            fetchPoolData();
            if (address) fetchUserPositions(address);
        }, 15000);

        getUserSponsor();

        return () => clearInterval(interval);
    }, [address, fetchPoolData, fetchUserPositions]);
    
    useEffect(() => {
        if (!userPositions || userPositions.length === 0) return;

        const fetchClaims = async () => {
            const newMap: { [id: number]: boolean } = {};
            // ... (lógica de fetchClaims mantida)
            for (const pos of userPositions) {
                try {
                    const claimed = await hasPositionClaimed(pos.id);
                    newMap[pos.id] = claimed;
                } catch (err) {
                    console.error(`Erro ao verificar claim para ID ${pos.id}:`, err);
                    newMap[pos.id] = false;
                }
            }
            setPositionsClaimedMap(newMap);
        };

        fetchClaims();
    }, [userPositions]);

    // --- Funções de Ação (Aprovar/Comprar) ---

    const handleApprove = async () => {
        const valueToApprove = inputQuantity * shareValue;
        setLoading(true);
        // ... (lógica de modal e chamada approveUSDTCash mantida)
        setModal({
            isOpen: true,
            step: "approve",
            status: "pending",
            message: `Waiting for transaction approval for ${valueToApprove} USDT in your wallet...`,
        });

        try {
            const tx = await approveUSDTCash(valueToApprove);
            await tx.wait(); 
            setModal({
                isOpen: true,
                step: "approve",
                status: "success",
                message: `USDT approved successfully (${valueToApprove} USDT). You can proceed with the purchase.`,
            });
        } catch (err) {
            console.error("Error approving USDT:", err);
            setModal({
                isOpen: true,
                step: "approve",
                status: "error",
                message: "Failed to approve USDT. Check console or try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBuy = async () => {
        setLoading(true);
        // ... (lógica de modal e chamada buyMpoolCash mantida)
        setModal((prev) => ({
            ...prev,
            step: "buy",
            status: "pending",
            message: "Processing your purchase...",
        }));
        try {
            const tx = await buyMpoolCash(inputQuantity);
            await tx.wait();

            await fetchPoolData();
            if (address) await fetchUserPositions(address);

            setModal({
                isOpen: true,
                step: "success",
                status: "success",
                message: "Purchase confirmed! Position added successfully.",
            });
        } catch (err) {
            console.error("Error during purchase:", err);
            setModal((prev) => ({
                ...prev,
                status: "error",
                message: "Error during purchase. Please try again.",
            }));
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => setModal({ ...modal, isOpen: false });
    
    // --- Lógica de Renderização do Input (Ajustado sem maxAvailable) ---
    
    // Função para tratar o input, garantindo que seja um número > 0
    const handleInputBlur = () => {
        let parsed = parseInt(inputValue || "0", 10);
        if (isNaN(parsed) || parsed < 1) parsed = 1;
        
        // Não há mais limite de maxAvailable, apenas garantimos que seja > 0
        setInputQuantity(parsed);
        setInputValue(String(parsed));
    };
    const COINGECKO_URL = "https://www.coingecko.com/en/coins/mpool?utm_source=geckoterminal&utm_medium=referral&utm_campaign=badge&asset_platform_api_symbol=polygon-pos";
    const GROUP_URL = "https://chat.whatsapp.com/JD6jXMGrLouDTssmYHyw1a?mode=hqrc";
    return (
        <div className="relative min-h-screen w-full bg-black text-white overflow-x-hidden font-sans">
            {/* Animated background (particles) */}
            <div className="absolute inset-0 z-0">
                <AnimatedBackground />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            </div>

            {/* Top bar */}
          <header className="relative z-20 mb-4 border-b-2 border-gray-900 flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 max-w-[1400px] mx-auto">
    {/* LOGO E TÍTULO */}
    <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-2 bg-black/60 flex items-center justify-center ring-2 ring-green-400/40 shadow-[0_0_15px_#00ff80]">
            {/* Lembre-se de substituir <Image> pelo seu componente de imagem real */}
            <Image src="/Pool-Cash-Logo.png" className="mt-[4px]" alt="logo" width={44} height={44} />

        </div>
        <div>
            <h1 className="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-yellow-300">
                PoolCash
            </h1>
            <p className="text-xs text-gray-300 hidden sm:block">Liquidity Pool · Neon Edition</p>
        </div>
    </div>

    {/* CONEXÃO / HOME (À direita, no topo) */}
    <div className="flex items-center gap-3 order-3 w-full justify-end sm:order-2 sm:w-auto">
        <button onClick={() => router.push("/")} className="text-sm cursor-pointer text-yellow-400 hover:text-yellow-300 transition-colors hidden sm:block">
            Home
        </button>
        {address ? (
            <div className="px-3 py-2 rounded-md bg-black/50 border border-green-700/30 transition-shadow hover:shadow-[0_0_10px_rgba(0,255,120,0.3)] cursor-pointer" onClick={switchAccount}>
                <div className="text-xs text-gray-300 hidden sm:block">{t.changeWallet?.connectedAs || "Connected as"}</div>
                <div className="text-sm text-yellow-400 font-mono">
                    {address.slice(0, 4)}...{address.slice(-4)}
                </div>
            </div>
        ) : (
            <button onClick={() => { /* Lógica de Conexão */ }} className="px-4 py-2 rounded-md bg-green-500 text-black font-semibold hover:bg-green-400 transition-colors">
                Connect
            </button>
        )}
    </div>

    {/* LINKS DE NAVEGAÇÃO (Visíveis em todas as telas, abaixo do Logo/Título no mobile) */}
    <div className="flex items-center justify-start gap-2 mt-4 sm:mt-0 w-full sm:w-auto order-2 sm:order-3">
        
        {/* 📈 LINK PARA COINGECKO (NOVO - Ajustado para ser visível no mobile) */}
        <a
            href={COINGECKO_URL}
            target="_blank"
            rel="noopener noreferrer"
            // Classes ajustadas: usa flex sempre, e px-2 py-1 para ser mais compacto no mobile
            className="flex items-center gap-1.5 px-2 py-1 
                            bg-gray-800 rounded-lg border border-green-700/50 
                            text-green-400 font-semibold text-xs sm:text-sm 
                            hover:bg-green-600 hover:text-black hover:border-green-600 
                            transition-all duration-300 shadow-md hover:shadow-green-500/30"
        >
            <FiBarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">MPool</span> (CoinGecko)
        </a>

        {/* 💬 LINK PARA GRUPO (NOVO - Ajustado para ser visível no mobile) */}
        <a
            href={GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            // Classes ajustadas: usa flex sempre, e px-2 py-1 para ser mais compacto no mobile
            className="flex items-center gap-1.5 px-2 py-1 
                            bg-gray-800 rounded-lg border border-green-700/50 
                            text-green-400 font-semibold text-xs sm:text-sm 
                            hover:bg-green-600 hover:text-black hover:border-green-600 
                            transition-all duration-300 shadow-md hover:shadow-green-500/30"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 2.001c-5.522 0-9.999 4.477-9.999 9.999 0 1.776.46 3.456 1.258 4.939l-1.42 5.485 5.422-1.472a9.946 9.946 0 0 0 4.739 1.148c5.522 0 9.999-4.477 9.999-9.999s-4.477-9.999-9.999-9.999zm4.234 13.978c-.287.798-.891 1.79-1.579 1.944-.559.123-1.042.062-1.67-.186-.689-.267-1.745-.678-3.322-1.859-1.233-.923-2.034-2.197-2.279-2.583-.245-.386-.027-.597.185-.809.186-.186.386-.445.572-.662.186-.186.246-.326.37-.543.123-.207.062-.386-.031-.543-.093-.186-.889-2.127-1.21-2.906-.321-.779-.642-.67-.889-.678-.207-.008-.444-.008-.689-.008-.245 0-.642.092-.972.463-.33.37-.999.992-.999 2.44 0 1.448 1.023 2.83 1.163 3.024.14.194 2.012 3.085 4.881 4.385 2.72 1.257 3.321 1.026 3.931.965.61-.061 1.99-.811 2.261-1.59.271-.779.271-.973.186-1.074-.093-.123-.287-.186-.608-.344z"/></svg>
            <span className="hidden sm:inline">Group</span> (Whatsapp)
        </a>
    </div>

</header>

            {/* Main content */}
            <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column: Pool Status Card + controls */}
                <section className="lg:col-span-1 flex flex-col items-center lg:items-start gap-6 order-2 lg:order-1">
                    
                    {/* NOVO: Pool Status Card */}
                    <PoolStatusCard 
                        metrics={poolMetrics} 
                        sharesBought={sharesBought} 
                    />

                    {/* Compact controls - Coluna de Compra (Ajustada) */}
                    <div className="w-full max-w-[360px] lg:max-w-full p-4 rounded-2xl bg-white/3 border border-green-700/20 order-1 lg:order-2">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Buy Shares</h3>
                        
                        <div className="flex items-end gap-3 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-[120px]">
                                <label htmlFor="quantity" className="text-sm text-gray-300 block mb-1">Quantity</label>
                                <input
                                    id="quantity"
                                    type="number"
                                    inputMode="numeric"
                                    value={inputValue}
                                    onChange={(e) => {
                                        const cleaned = e.target.value.replace(/[^\d]/g, "");
                                        setInputValue(cleaned);
                                    }}
                                    onBlur={handleInputBlur}
                                    min="1"
                                    className="w-full py-2 px-3 rounded-md bg-black/60 border border-green-600/40 text-green-200 text-center text-xl font-mono focus:ring-2 focus:ring-green-400 transition-colors"
                                />
                            </div>

                            <div className="text-right flex-1 min-w-[120px] pt-4">
                                <div className="text-xs text-gray-400">
                                    Total Cost: <span className="text-yellow-300 font-bold">${((parseInt(inputValue || "0", 10) || 0) * shareValue).toFixed(2)}</span>
                                </div>
                                
                                {/* Botão de Ação (Ajustado) */}
                                <button
                                    onClick={handleApprove}
                                    disabled={loading || parseInt(inputValue || "0", 10) < 1 || !address}
                                    className={`mt-2 w-full cursor-pointer py-3 rounded-lg font-bold transition-all duration-200 
                                        ${loading || parseInt(inputValue || "0", 10) < 1 || !address ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-green-600 to-emerald-600 text-black hover:from-green-500 hover:to-emerald-500"}`}
                                >
                                    {address ? (loading ? <Loader2 className="animate-spin w-5 h-5 inline mr-2" /> : "Approve & Order") : "Connect Wallet"}
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 text-xs text-gray-400">
                            Buy as many shares as you like. There is no pool limit!
                        </div>
                    </div>
                </section>

                {/* Middle & Right: positions and details (Mantido) */}
                <section className="lg:col-span-2 flex flex-col gap-6 order-1 lg:order-2">
                    {/* Seção de Posições (Mantida) */}
                    <div className="p-4 sm:p-6 rounded-2xl bg-white/3 border border-green-800/20 shadow-[0_10px_40px_rgba(0,255,120,0.04)]">
                        {/* ... (Conteúdo de Posições mantido) ... */}
                        <div className="flex items-center justify-between mb-4 border-b border-gray-700/50 pb-2">
                            <h2 className="text-xl font-bold text-green-300">Your Active Positions</h2>
                            <a href={`https://revert.finance/#/account/0x9A41CeF567e7aCb6cfFcdB518cE1280e596C48aC`} target="_blank" rel="noreferrer" className="text-sm text-yellow-300 hover:text-yellow-200 transition-colors flex items-center gap-1">
                                View External <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>

                        {isPositionsLoading ? (
                            <div className="text-gray-400 flex items-center gap-2 mt-4">
                                <Loader2 className="animate-spin w-5 h-5" /> Loading your positions...
                            </div>
                        ) : userPositions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {userPositions.map((position) => {
    const isDisabled = positionsClaimedMap[position.id] === true;

    // A CORREÇÃO ESTÁ AQUI: Cálculo como variável simples, não um Hook.
    let progressPercentage = 0;
    if (position.data) {
        const start = position.data.startTick;
        const current = position.data.currentTick;
        const upper = position.data.upperTick;

        if (upper === start) {
            progressPercentage = current >= upper ? 100 : 0;
        } else {
            const raw = ((current - start) / (upper - start)) * 100;
            progressPercentage = Math.max(0, Math.min(100, raw));
        }
    }
    // FIM DA CORREÇÃO
    
    const isReadyForAction = position.data && position.data.currentTick >= position.data.upperTick;

    const startPrice = position.data ? tickToPrice(position.data.startTick).mul(new Decimal(10).pow(12)).toFixed(6) : "N/A";
    const targetPrice = position.data ? tickToPrice(position.data.upperTick).mul(new Decimal(10).pow(12)).toFixed(6) : "N/A";
    
    return (
        <div key={position.id} className="p-4 rounded-xl bg-black/50 border border-green-700/20 transition-all hover:border-green-600/50">
            <div className="flex items-center justify-between mb-3 border-b border-gray-700/30 pb-2">
                {/* ... (restante do código) ... */}
                <div>
                    <div className="text-sm text-gray-400">Position ID</div>
                    <div className="text-xl font-bold text-white">#{position.id}</div>
                </div>
            </div>

            {position.data ? (
                <>
                    <div className="text-xs text-gray-400 my-3">
                        <div className="flex justify-between mb-1">
                            <div>Start Price: <span className="text-green-300 font-semibold">{startPrice}</span></div>
                            <div>Target Price: <span className="text-green-300 font-semibold">{targetPrice}</span></div>
                        </div>
                    </div>

                    <div className="mb-3">
                        <TickProgressBar progressPercentage={progressPercentage} />
                    </div>
                    <a 
    href={`https://app.uniswap.org/positions/v3/polygon/${position.id}`} 
    target="_blank" 
    rel="noreferrer" 
    className="ml-auto text-sm text-yellow-300 hover:text-yellow-200 transition-colors flex items-center gap-1 self-center"
>
    View on Uniswap
</a>
                    
                    {isReadyForAction && (
                        <div className={`mt-4 p-3 rounded-lg ${isDisabled ? "bg-gray-800" : "bg-green-900/40 border border-green-600/30"}`}>
                            <p className={`text-sm font-semibold mb-3 ${isDisabled ? "text-gray-400" : "text-green-300"}`}>
                                {isDisabled ? "Rewards Already Claimed." : "Position Ready: Claim or Reinvest Rewards!"}
                            </p>
                            
                            <div className="flex flex-wrap gap-3">
                                {/* Botão Claim */}
                                <motion.button
                                    whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                                    whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                                    onClick={async () => {
                                        setLoadingClaim(true);
                                        setMessage("");
                                        try {
                                            const tx = await claimMPoolCash(position.id);
                                            setMessage("✅ Reward claimed successfully! Waiting for TX confirmation...");
                                            await tx.wait();
                                            setMessage("✅ Reward claimed successfully!");
                                            if(address) await fetchUserPositions(address);
                                        } catch (error) {
                                            console.error(error);
                                            setMessage("❌ Error claiming reward. See console.");
                                        } finally {
                                            setLoadingClaim(false);
                                        }
                                    }}
                                    disabled={loadingClaim || loadingReinvest || isDisabled}
                                    className={`px-4 py-2 rounded-md font-semibold text-black transition-all ${loadingClaim || loadingReinvest || isDisabled ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-400"}`}
                                >
                                    {loadingClaim ? <Loader2 className="animate-spin w-4 h-4 inline mr-2" /> : "Claim"}
                                </motion.button>

                                {/* Botão Reinvest */}
                                <motion.button
                                    whileHover={{ scale: isDisabled ? 1 : 1.05 }}
                                    whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                                    onClick={async () => {
                                        setLoadingReinvest(true);
                                        setMessage("");
                                        try {
                                            const tx = await reinvestMPoolCash(position.id);
                                            setMessage("🔁 Reinvestment initiated! Waiting for TX confirmation...");
                                            await tx.wait();
                                            setMessage("🔁 Reinvestment completed successfully!");
                                            if(address) await fetchUserPositions(address);
                                        } catch (error) {
                                            console.error(error);
                                            setMessage("❌ Error reinvesting. See console.");
                                        } finally {
                                            setLoadingReinvest(false);
                                        }
                                    }}
                                    disabled={loadingClaim || loadingReinvest || isDisabled}
                                    className={`px-4 py-2 rounded-md font-semibold transition-all ${loadingClaim || loadingReinvest || isDisabled ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
                                >
                                    {loadingReinvest ? <Loader2 className="animate-spin w-4 h-4 inline mr-2" /> : "Reinvest"}
                                </motion.button>
                                
                            </div>
                        </div>
                    )}
                    {message ? <div className="mt-3 text-sm text-green-300 font-mono break-words">{message}</div> : null}
                </>
            ) : (
                <p className="text-sm text-gray-400 mt-2">Tick data not available. Position might be closed.</p>
            )}
        </div>
    );
})}
                            </div>
                        ) : (
                            <p className="text-gray-400 mt-4">You have no active positions. Buy a share above to get started.</p>
                        )}
                    </div>

                    {/* Extra info row (Ajustado) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    
                        <div className="p-4 rounded-lg bg-black/40 border border-green-700/20 text-center">
                            <div className="text-xs text-gray-400">Active Positions</div>
                            <div className="text-lg font-bold text-white">{userPositions.length}</div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modal (Mantido) */}
            <AnimatePresence>
                {modal.isOpen && (
                    <motion.div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="relative bg-gray-900 border border-green-700/30 rounded-xl p-8 w-full max-w-md text-center shadow-2xl" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                            {/* Close button */}
                            <button onClick={closeModal} aria-label="Close modal" className="absolute top-3 right-3 p-1 rounded-full text-gray-300 hover:text-white cursor-pointer transition-colors">
                                ✕
                            </button>
                            <h3 className={`text-2xl font-bold mb-4 ${modal.status === "error" ? "text-red-500" : "text-green-400"}`}>
                                {modal.status === "pending" ? "Processing..." : modal.status === "success" ? "Success!" : "Error"}
                            </h3>
                            <p className="text-gray-300 mb-6 text-sm">{modal.message}</p>

                            {modal.status === "success" && modal.step === "approve" && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleBuy}
                                    disabled={loading || inputQuantity < 1}
                                    className={`w-full py-3 rounded-md font-bold bg-green-400 text-gray-900 hover:bg-green-300 transition-colors cursor-pointer ${loading || inputQuantity < 1 ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                    BUY {inputQuantity} SHARE(S)
                                </motion.button>
                            )}

                            {modal.status === "success" && (modal.step === "success" || modal.step === "buy") && (
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={closeModal} className="w-full py-3 rounded-md font-bold bg-green-500 text-black hover:bg-green-400 transition cursor-pointer">
                                    DONE
                                </motion.button>
                            )}

                            {modal.status === "error" && (
                                <button onClick={closeModal} className="w-full py-3 rounded-md font-bold bg-red-600 text-white hover:bg-red-500 transition cursor-pointer">
                                    CLOSE
                                </button>
                            )}
                        </motion.div>
                    </motion.div>

                )}
        <div className="p-4 relative z-200">
            {/* 3. Renderiza o componente da tabela */}
            <EligibilityTable userData={userTable} />
        </div>
    <div 
    // Fundo escuro com leve transparência e borda verde neon
    className="bg-black/40 relative z-20 border-2 max-w-[700px] mt-[100px] m-auto border-green-700 text-gray-100 rounded-xl p-4 mb-6
               shadow-[0_0_15px_rgba(0,255,117,0.4)] transition-all duration-300 hover:border-green-400"
>
    <h2 className="text-xl font-extrabold mb-4 text-green-400 text-center uppercase tracking-wider drop-shadow-[0_0_5px_#00ff75]">
        🔗 Your Referral Link
    </h2>

    {/* NOVO CAMPO: YOUR SPONSOR */}
    <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-green-300 uppercase tracking-wide">
            👤 Your Sponsor
        </h3>
        <div className="flex items-center bg-gray-900 px-2 py-2 rounded-lg border border-gray-700">
            {/* Campo de input para o Sponsor */}
            <input
                type="text"
                readOnly
                // Substitua 'sponsorInfo' pela sua variável que contém o nome/ID do sponsor
                value={sponsor ? sponsor : "No sponsor assigned"} 
                // Estilo do texto do sponsor: branco, mono, para contraste
                className="bg-transparent text-white text-[12px] font-mono w-full focus:outline-none"
            />
        </div>
    </div>
    {/* FIM DO NOVO CAMPO */}

    <div className="flex flex-col sm:flex-row items-center gap-2 justify-between bg-gray-900 px-2 py-2 rounded-lg border border-gray-700">
        
        {/* Campo de input para o link */}
        <input
            type="text"
            readOnly
            value={referralLink}
            // Cor do texto do link em amarelo neon para destaque
            className="bg-transparent text-yellow-300 text-[10px] sm:text-[12px] font-mono truncate w-full sm:w-[80%] focus:outline-none"
        />

        {/* Botão de Copy com gradiente de marca */}
        <button
            onClick={handleCopy}
            className={`
                ${copied 
                    ? "bg-green-500 hover:bg-green-600 shadow-none" // Copiado: Sólido verde
                    : "bg-gradient-to-r from-green-400 to-yellow-300 hover:from-green-500 hover:to-yellow-400 shadow-[0_0_10px_#00ff75]" // Padrão: Gradiente Neon
                } 
                text-black cursor-pointer font-bold px-2 py-2 rounded-lg transition duration-200 text-sm sm:text-base w-full sm:w-auto
            `}
        >
            {copied
                ? "✅ Copied!"
                : "Copy Link"}
        </button>
    </div>
</div>
                        <div className="w-full m-auto max-w-[1200px] mt-[30px] border mb-[100px] relative z-200 
                            bg-gray-900 border-green-600 rounded-2xl 
                            shadow-2xl shadow-green-900/50 p-4 sm:p-8">
                            
                            <h1 className="text-3xl font-extrabold text-green-400 mb-6 text-center 
                                tracking-wider border-b border-green-700/50 pb-2">
                                Network Status
                            </h1>

                            {address ? <ReferralTree address={address} /> : (
                                <p className="text-center text-gray-500">
                                    {t.networkEarningsPage.connectWalletPrompt}
                                </p>
                            )}
                        </div>
            </AnimatePresence>
        </div>
    );
}

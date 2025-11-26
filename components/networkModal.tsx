import React, { useState, useEffect } from "react";
import { fetchReferralNode } from "@/services/Web3Services";
import { IoMdArrowDropdown, IoMdArrowDropright } from "react-icons/io";
import { useLanguage } from "./LanguageManager";

interface ReferralNodeType {
  address: string | null;
  children?: ReferralNodeType[];
}

/**
 * Ajusta as cores para o estilo Pool Cash (Dark/Azul-Petróleo)
 * A cor de fundo varia com base no nível, ficando ligeiramente mais escura ou mais clara.
 * @param level O nível de profundidade na árvore.
 * @returns String com o valor da cor RGBA.
 */
function getBackgroundColor(level: number): string {
  // Paleta Pool Cash: Base Azul-Escuro/Petróleo.
  // A variação é sutil para manter o tema escuro.
  const baseRed = 20;
  const baseGreen = 50 + level * 5;
  const baseBlue = 70 + level * 5;

  const red = Math.min(baseRed, 255);
  const green = Math.min(baseGreen, 100);
  const blue = Math.min(baseBlue, 120);

  const opacity = 0.95; // Opacidade ligeiramente mais alta para fundos escuros.
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

interface ReferralNodeProps {
  node: ReferralNodeType;
  level?: number;
  onAddAffiliates?: (count: number) => void;
}

interface ReferralTreeProps {
  address: string;
}

const ReferralNode: React.FC<ReferralNodeProps> = ({
  node,
  level = 0,
  onAddAffiliates,
}) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<ReferralNodeType[] | null>(
    node.children || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(!!node.children);

  const toggleExpand = async () => {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);

    if (!hasLoaded && node.address && willExpand) {
      try {
        setIsLoading(true);
        const newNode = await fetchReferralNode(node.address);
        const newChildren = newNode.children || [];
        setChildren(newChildren);
        setHasLoaded(true);
        onAddAffiliates?.(newChildren.length);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const backgroundColor = getBackgroundColor(level);
  const childrenCount = children?.length ?? 0;

  return (
    <div className="w-full flex flex-col mb-2">
      <div
        className="flex items-start group w-full cursor-pointer"
        onClick={toggleExpand}
      >
        {level > 0 && (
          <div className="hidden sm:block w-4 border-l-2 border-green-400 h-full mr-2"></div>
          // Usando verde-água como linha de conexão
        )}

        <div
          className="flex items-center px-3 py-2 rounded shadow-lg hover:shadow-xl w-full transition-shadow duration-300"
          style={{ backgroundColor }}
        >
          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full mr-2 font-semibold">
            {/* Destaque do Nível em Verde Escuro */}
            Level {level}
          </span>
          <span className="truncate text-gray-100 flex-1 min-w-0 text-sm sm:text-base font-mono">
            {/* Texto em Cinza Claro/Branco para o fundo escuro */}
            {node.address
              ? `${node.address.slice(0, 6)}...${node.address.slice(-4)}`
              : t.networkTreePage.noAddress}
          </span>

          <div className="bg-green-400 text-sm text-gray-900 px-3 py-1 rounded-full ml-2 flex items-center font-bold hover:bg-green-300 transition-colors duration-200">
            {/* Contagem de Filhos em Destaque Verde-Água */}
            {isLoading
              ? "..."
              : hasLoaded
              ? childrenCount.toString()
              : "..."}{" "}
            {isExpanded ? <IoMdArrowDropdown /> : <IoMdArrowDropright />}
          </div>
        </div>
      </div>

      {isExpanded && children && (
        <div
          className={`flex flex-col mt-2 ${
            level > 0
              ? "sm:pl-6 sm:ml-2 sm:border-l-2 sm:border-green-500" // Linha de conexão verde-água/ciano
              : ""
          }`}
        >
          {children.map((child, index) => (
            <ReferralNode
              key={index}
              node={child}
              level={level + 1}
              onAddAffiliates={onAddAffiliates}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ReferralTree: React.FC<ReferralTreeProps> = ({ address }) => {
  const [tree, setTree] = useState<ReferralNodeType | null>(null);
  const [quantity, setQuantity] = useState(0);

  const addAffiliates = (count: number) => {
    setQuantity((prev) => prev + count);
  };

  useEffect(() => {
    async function loadInitialTree() {
      if (!address) return;

      try {
        const root = await fetchReferralNode(address);
        setTree(root);

        const directChildren = root.children?.length ?? 0;
        setQuantity(directChildren);
      } catch (error) {
        console.error(error);
      }
    }

    loadInitialTree();
  }, [address]);

  return (
    // Fundo Principal: Dark (cinza-escuro ou azul-petróleo escuro)
    <div className="p-2 sm:p-4 bg-gray-900 rounded-2xl w-full sm:w-[96%] mx-auto overflow-x-auto border border-green-500 shadow-2xl">
      <div className="min-w-[300px]">
        <h1 className="text-3xl sm:text-xl font-bold text-center mb-6">
          <button className="bg-green-500 shadow-lg rounded-3xl w-[180px] h-[45px] font-bold text-[18px] text-gray-900 hover:bg-green-400 transition-colors duration-300">
            {/* Botão de Destaque Verde-Água/Ciano */}
            Team
          </button>
        </h1>
        <h1 className="my-2 text-center sm:text-left text-green-400 font-semibold text-lg">
          {/* Texto de Informação em Cor de Destaque */}
          Number of affiliates: {quantity}
        </h1>
        {tree ? (
          <div className="flex flex-col w-full min-w-0 overflow-x-auto">
            <ReferralNode node={tree} onAddAffiliates={addAffiliates} />
          </div>
        ) : (
          <p className="text-center text-gray-400">
            Loading
          </p>
        )}
      </div>
    </div>
  );
};

export default ReferralTree;
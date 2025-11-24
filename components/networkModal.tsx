import React, { useState, useEffect } from "react";
import { fetchReferralNode } from "@/services/Web3Services";
import { IoMdArrowDropdown, IoMdArrowDropright } from "react-icons/io";
import { useLanguage } from "./LanguageManager";

interface ReferralNodeType {
  address: string | null;
  children?: ReferralNodeType[];
}

function getBackgroundColor(level: number): string {
  const baseRed = 255;
  const baseGreen = 223 - level * 8;
  const baseBlue = 100 + level * 5;
  const red = Math.min(baseRed, 255);
  const green = Math.max(baseGreen, 180);
  const blue = Math.min(baseBlue, 180);
  const opacity = Math.max(1 - level * 0.1, 0.85);
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
  const [hasLoaded, setHasLoaded] = useState(!!node.children); // novo

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
      <div className="flex items-start group w-full cursor-pointer" onClick={toggleExpand}>
        {level > 0 && (
          <div className="hidden sm:block w-4 border-l-2 border-yellow-400 h-full mr-2"></div>
        )}

        <div
          className="flex items-center px-3 py-2 rounded shadow bg-white hover:shadow-md w-full transition-colors"
          style={{ backgroundColor }}
        >
          <span className="bg-yellow-700 text-white text-xs px-2 py-1 rounded mr-2">
            {t.networkTreePage.level} {level}
          </span>
          <span className="truncate text-black flex-1 min-w-0 text-sm sm:text-base">
            {node.address
              ? `${node.address.slice(0, 6)}...${node.address.slice(-4)}`
              : t.networkTreePage.noAddress}
          </span>

          <div className="bg-yellow-500 text-xs text-gray-900 px-2 py-1 rounded ml-2 flex items-center hover:bg-yellow-400">
            {/* 👇 Correção da contagem */}
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
              ? "sm:pl-6 sm:ml-2 sm:border-l-2 sm:border-yellow-300"
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
  const { t } = useLanguage();
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

        // ✅ Soma filhos diretos (nível 1)
        const directChildren = root.children?.length ?? 0;
        setQuantity(directChildren);
      } catch (error) {
        console.error(error);
      }
    }

    loadInitialTree();
  }, [address]);

  return (
    <div className="p-2 sm:p-4 bg-yellow-100 bg-opacity-50 rounded-2xl w-full sm:w-[96%] mx-auto overflow-x-auto">
      <div className="min-w-[300px]">
        <h1 className="text-3xl sm:text-xl font-bold text-center mb-6">
          <button className="bg-yellow-400 shadow-xl rounded-3xl w-[150px] h-[40px] font-semibold text-[18px] hover:bg-yellow-300 transition-colors">
            {t.networkTreePage.teamButton}
          </button>
        </h1>
        <h1 className="my-2 text-center sm:text-left text-gray-700">
          {t.networkTreePage.totalAffiliated}: {quantity}
        </h1>
        {tree ? (
          <div className="flex flex-col w-full min-w-0 overflow-x-auto">
            <ReferralNode node={tree} onAddAffiliates={addAffiliates} />
          </div>
        ) : (
          <p className="text-center text-gray-500">{t.networkTreePage.loading}</p>
        )}
      </div>
    </div>
  );
};

export default ReferralTree;
